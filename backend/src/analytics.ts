// src/analytics.ts

//this needs to be fixed
import type { Request, Response } from "express";
import { UAParser } from "ua-parser-js";

import crypto from "crypto";
import geoip from "geoip-lite"; // low-friction; for higher accuracy use maxmind + GeoLite2

import prisma from "./lib/prisma";
const SALT = process.env.IP_HASH_SALT ?? "change-me";

function getClientIp(req: Request) {
  // if behind nginx/Cloudflare in prod, set app.set('trust proxy', true)
  const xf = (req.headers["x-forwarded-for"] as string) || "";
  const ip = xf.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  // normalize IPv6 localhost
  return ip === "::1" ? "127.0.0.1" : ip;
}

function hashIp(ip: string) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(SALT + ip).digest("hex").slice(0, 16);
}

function isLikelyBot(ua: string | undefined) {
  if (!ua) return false;
  const s = ua.toLowerCase();
  return /(bot|crawler|spider|bingpreview|semrush|ahrefs|facebookexternalhit|slurp)/.test(s);
}

export async function trackHit(req: Request, res: Response) {
  try {
    const path = req.body?.path || req.path; // allow client to send SPA route
    const referrer = (req.get("referer") ?? req.body?.referrer) || null;

    const url = new URL((referrer || "http://dummy.local"));
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");

    const ua = req.get("user-agent") || "";
    const uaParsed = new UAParser(ua);
    const browser = uaParsed.getBrowser().name || null;
    const os = uaParsed.getOS().name || null;

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    // geo
    let city: string | null = null;
    let country: string | null = null;
    const geo = geoip.lookup(ip);
    if (geo) {
      city = geo.city || null;
      country = geo.country || null;
    }

    const isBot = isLikelyBot(ua);

    const sessionId = req.cookies?.sid || req.body?.sessionId || null;

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
    // fail-soft
    res.status(204).end();
  }
}
