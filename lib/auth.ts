// lib/auth.ts
// JWT helper utilities for signing and verifying tokens.

import jwt from "jsonwebtoken";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = "24h"; // Token valid for 24 hours

// ─── SIGN TOKEN ──────────────────────────────────────────────────────────────
/**
 * Creates a signed JWT token containing user identity claims.
 * @param payload - The data to encode inside the token
 * @returns A signed JWT string
 */
export function signToken(payload: JWTPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─── VERIFY TOKEN ────────────────────────────────────────────────────────────
/**
 * Verifies and decodes a JWT token.
 * @param token - The JWT string to verify
 * @returns Decoded payload or null if invalid/expired
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token is expired, malformed, or invalid signature
    console.error("JWT verification failed:", error);
    return null;
  }
}
