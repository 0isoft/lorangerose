// src/analytics.ts

import type { Request, Response } from "express";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import geoip from "geoip-lite"; // low-friction; for higher accuracy use maxmind + GeoLite2

import prisma from "./lib/prisma";
const SALT = process.env.IP_HASH_SALT ?? "change-me";

/**
 * @brief Retrieves the client's IP address from the request object.
 * @details Checks the X-Forwarded-For header first (for use behind proxies), then falls back to the socket's remoteAddress.
 *          Normalizes IPv6 localhost to IPv4.
 * @param req Express request object
 * @returns {string} Client IP address as a string, or an empty string if not found.
 */
function getClientIp(req: Request): string {
  // if behind nginx/Cloudflare in prod, set app.set('trust proxy', true)
  const xf = (req.headers["x-forwarded-for"] as string) || "";
  const ip = xf.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  // normalize IPv6 localhost
  return ip === "::1" ? "127.0.0.1" : ip;
}

/**
 * @brief Hashes a given IP address using SHA-256 with a salt and returns a summary hash.
 * @param ip IP address string
 * @returns {string|null} A 16-char hashed value of the salted IP, or null if input is empty.
 */
function hashIp(ip: string): string | null {
  if (!ip) return null;
  return crypto.createHash("sha256").update(SALT + ip).digest("hex").slice(0, 16);
}

/**
 * @brief Detects if the given User-Agent string is likely to be a bot or crawler.
 * @param ua User-Agent string (or undefined)
 * @returns {boolean} True if a known bot/crawler is detected, otherwise false.
 */
function isLikelyBot(ua: string | undefined): boolean {
  if (!ua) return false;
  const s = ua.toLowerCase();
  return /(bot|crawler|spider|bingpreview|semrush|ahrefs|facebookexternalhit|slurp)/.test(s);
}

/**
 * @brief Tracks a "hit" or pageview for analytics purposes.
 * @details
 *   - Gathers information about the request: path, referrer, UTM parameters, User-Agent, browser/os, IP location, session, and bot detection.
 *   - Stores this information in the database with privacy (hashed IP) and bot-exclusion controls.
 *   - Always responds with HTTP 204 (no content), even on error (fail-soft).
 * @param req Express Request object, expected to have path/body/cookie headers.
 * @param res Express Response object.
 * @returns {Promise<void>} Resolves when tracking is complete and response sent.
 */
export async function trackHit(req: Request, res: Response): Promise<void> {
  try {
    const path = req.body?.path || req.path; // allow client to send SPA route
    const referrer = (req.get("referer") ?? req.body?.referrer) || null;

    // Parse UTM parameters from referrer, if present
    const url = new URL((referrer || "http://dummy.local"));
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");

    // Parse browser information
    const ua = req.get("user-agent") || "";
    const uaParsed = new UAParser(ua);
    const browser = uaParsed.getBrowser().name || null;
    const os = uaParsed.getOS().name || null;

    // Get client IP and compute a hash
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    // Geo-location lookup
    let city: string | null = null;
    let country: string | null = null;
    const geo = geoip.lookup(ip);
    if (geo) {
      city = geo.city || null;
      country = geo.country || null;
    }

    // Bot detection
    const isBot = isLikelyBot(ua);

    // Retrieve session identifier if present
    const sessionId = req.cookies?.sid || req.body?.sessionId || null;

    // Persist hit in the database
    await prisma.hit.create({
      data: {
        path,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        userAgent: ua || null,
        browser,
        os,
        ipHash,
        city,
        country,
        sessionId,
        isBot,
      },
    });

    res.status(204).end();
  } catch (e) {
    // fail-soft: always produce a valid 204 response, do not disclose analytics processing errors
    res.status(204).end();
  }
}
