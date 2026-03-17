import User from "../models/user.model.js";
import { clearAuthCookie, getTokenFromRequest, verifyToken } from "../utils/auth.js";

export async function attachCurrentUser(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    req.currentUser = null;
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    req.currentUser = user || null;

    if (!user) {
      clearAuthCookie(res);
    }
  } catch (error) {
    req.currentUser = null;
    clearAuthCookie(res);
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.currentUser) {
    res.status(401).json({
      error: "You need to sign in to continue.",
    });
    return;
  }

  next();
}
