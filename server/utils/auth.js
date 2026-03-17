import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authCookieName = "mern_social_token";

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.jwtSecret, {
    expiresIn: "7d",
  });
}

export function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(authCookieName, {
    path: "/",
  });
}

export function getTokenFromRequest(req) {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return req.cookies?.[authCookieName] || null;
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
