import jwt from "jsonwebtoken";

/**
 * @fileoverview Authentication utilities for JWT token management
 * @author 0isoft
 * @version 1.0.0
 */

/**
 * JWT secret key used for signing and verifying tokens
 * @private
 * @constant {string}
 */
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * JWT payload structure containing user identification
 * @typedef {Object} JWTPayload
 * @property {string} uid - Unique user identifier
 */
export type JWTPayload = { uid: string };

/**
 * Creates a signed JWT token for the given user ID
 * 
 * @param {string} uid - The unique user identifier to include in the token
 * @returns {string} A signed JWT token that expires in 7 days
 * 
 * @example
 * ```typescript
 * const token = signToken("user123");
 * console.log(token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * ```
 * 
 * @throws {Error} Throws an error if JWT signing fails
 */
export function signToken(uid: string): string {
  return jwt.sign({ uid }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies and decodes a JWT token
 * 
 * @param {string} token - The JWT token to verify and decode
 * @returns {JWTPayload | null} The decoded payload if token is valid, null otherwise
 * 
 * @example
 * ```typescript
 * const payload = verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
 * if (payload) {
 *   console.log("User ID:", payload.uid);
 * } else {
 *   console.log("Invalid token");
 * }
 * ```
 * 
 * @note This function catches all errors and returns null for invalid tokens
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
