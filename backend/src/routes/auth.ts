import { Router } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
/** @var {string} JWT_SECRET - Secret key for JWT token signing, defaults to dev-secret-change-me */
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
/** @var {boolean} isProd - Flag indicating if running in production environment */
const isProd = process.env.NODE_ENV === "production";

/**
 * @brief Authenticate user with email and password
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user credentials
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's plain text password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with authentication status
 * @returns {boolean} res.ok - True if authentication successful
 * @returns {string} res.error - Error message if authentication fails
 * @throws {400} Bad Request - When email or password is missing
 * @throws {401} Unauthorized - When credentials are invalid
 * 
 * @description
 * Validates user credentials by comparing the provided password with the 
 * hashed password stored in the database. On successful authentication,
 * generates a JWT token and sets it as an HTTP-only cookie.
 * 
 * @example
 * // Request body
 * {
 *   "email": "user@example.com",
 *   "password": "userpassword"
 * }
 * 
 * // Success response
 * {
 *   "ok": true
 * }
 * 
 * // Error response
 * {
 *   "error": "Invalid credentials"
 * }
 */
router.post("/login", async (req, res) => {
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ uid: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
      });
  res.json({ ok: true });
});

/**
 * @brief Logout user by clearing authentication cookie
 * @route POST /api/auth/logout
 * @param {Object} _req - Express request object (unused)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming logout
 * @returns {boolean} res.ok - Always true for successful logout
 * 
 * @description
 * Clears the authentication token cookie from the client's browser,
 * effectively logging out the user. This is a simple operation that
 * doesn't require server-side token invalidation.
 * 
 * @example
 * // Success response
 * {
 *   "ok": true
 * }
 */
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

/**
 * @brief Get current authenticated user information
 * @route GET /api/auth/me
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Request cookies object
 * @param {string} req.cookies.token - JWT authentication token
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user information or error
 * @returns {boolean} res.ok - True if user is authenticated
 * @returns {Object} res.user - User object if authenticated
 * @returns {string} res.user.id - User's unique identifier
 * @returns {string} res.user.email - User's email address
 * @returns {string} res.user.role - User's role (admin/user)
 * @returns {Date} res.user.createdAt - User account creation date
 * @throws {401} Unauthorized - When token is missing or invalid
 * 
 * @description
 * Validates the JWT token from cookies and returns the current user's
 * information if the token is valid. This endpoint is used to check
 * authentication status and get user details on the frontend.
 * 
 * @example
 * // Success response
 * {
 *   "ok": true,
 *   "user": {
 *     "id": "user123",
 *     "email": "user@example.com",
 *     "role": "admin",
 *     "createdAt": "2023-01-01T00:00:00.000Z"
 *   }
 * }
 * 
 * // Error response
 * {
 *   "ok": false
 * }
 */
router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ ok: false });

  try {
    const { uid } = jwt.verify(token, JWT_SECRET) as { uid: string };
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(401).json({ ok: false });
    res.status(200).json({ ok: true, user });
  } catch {
    res.status(401).json({ ok: false });
  }
});

export default router;
