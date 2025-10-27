import { Router } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user session management
 */

/** @var {string} JWT_SECRET - Secret key for JWT token signing */
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
/** @var {boolean} isProd - Flag indicating production mode */
const isProd = process.env.NODE_ENV === "production";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates user credentials and issues a JWT token as an HTTP-only cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *     examples:
 *       application/json:
 *         request:
 *           {
 *             "email": "user@example.com",
 *             "password": "mypassword"
 *           }
 *         success:
 *           {
 *             "ok": true
 *           }
 *         error:
 *           {
 *             "error": "Invalid credentials"
 *           }
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
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out current user
 *     description: Clears the authentication cookie, effectively logging out the user.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Returns information about the currently authenticated user based on the JWT cookie.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       401:
 *         description: Invalid or missing token
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

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: mypassword
 *     LoginResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: true
 *         error:
 *           type: string
 *           example: Invalid credentials
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: true
 *     MeResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: true
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "user123"
 *             email:
 *               type: string
 *               example: "user@example.com"
 *             role:
 *               type: string
 *               example: "admin"
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2025-01-01T00:00:00.000Z"
 */

