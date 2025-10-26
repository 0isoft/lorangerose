import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * @interface AuthedRequest
 * @extends Request
 * @description Extended Express Request interface that includes authenticated user information
 * @property {Object} [user] - Optional user object containing authentication details
 * @property {string} user.id - Unique identifier for the user
 * @property {string} user.email - User's email address
 * @property {"ADMIN"} user.role - User's role, specifically ADMIN for this interface
 */
export interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: "ADMIN" };
}

/**
 * @function requireAdmin
 * @description Express middleware that validates JWT token and ensures user has ADMIN role
 * @param {AuthedRequest} req - Express request object with potential user authentication
 * @param {Response} res - Express response object for sending HTTP responses
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {Promise<void>} Promise that resolves when middleware processing is complete
 * 
 * @description This middleware performs the following operations:
 * 1. Extracts JWT token from request cookies
 * 2. Verifies the token using the configured JWT secret
 * 3. Queries the database to fetch user details by ID
 * 4. Validates that the user exists and has ADMIN role
 * 5. Attaches user information to the request object for downstream handlers
 * 6. Calls next() to continue processing or returns appropriate error responses
 * 
 * @throws {401} Returns 401 Unauthorized if no token is provided
 * @throws {401} Returns 401 Unauthorized if token is invalid or user not found
 * @throws {403} Returns 403 Forbidden if user exists but doesn't have ADMIN role
 * 
 * @example
 * ```typescript
 * app.get('/admin/users', requireAdmin, (req: AuthedRequest, res) => {
 *   // req.user is guaranteed to contain admin user data
 *   res.json({ users: await getUsers() });
 * });
 * ```
 */
export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const { uid } = jwt.verify(token, JWT_SECRET) as { uid: string };
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, role: true },
    });
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
