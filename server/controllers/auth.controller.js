import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../utils/auth.js";
import { serializeUser } from "../utils/serialize.js";
import { AppError } from "../utils/errors.js";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function loadUserProfile(userId) {
  return User.findById(userId)
    .populate("followers", "name about avatar")
    .populate("following", "name about avatar");
}

export async function signup(req, res) {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim();
  const password = req.body.password || "";

  if (!name) {
    throw new AppError(400, "Name is required.");
  }

  if (!email) {
    throw new AppError(400, "Email is required.");
  }

  if (password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters long.");
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError(409, "An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
  });

  const populatedUser = await loadUserProfile(user._id);
  const token = signToken(user._id);

  setAuthCookie(res, token);

  res.status(201).json({
    message: "Welcome to MERN Social.",
    user: serializeUser(populatedUser, user._id),
  });
}

export async function signin(req, res) {
  const email = req.body.email?.trim();
  const password = req.body.password || "";

  if (!email || !password) {
    throw new AppError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select("+passwordHash");

  if (!user) {
    throw new AppError(401, "Email or password was incorrect.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Email or password was incorrect.");
  }

  const populatedUser = await loadUserProfile(user._id);
  const token = signToken(user._id);

  setAuthCookie(res, token);

  res.json({
    message: "Signed in successfully.",
    user: serializeUser(populatedUser, user._id),
  });
}

export async function signout(req, res) {
  clearAuthCookie(res);

  res.json({
    message: "Signed out successfully.",
  });
}

export async function me(req, res) {
  if (!req.currentUser) {
    res.json({
      user: null,
    });
    return;
  }

  const populatedUser = await loadUserProfile(req.currentUser._id);

  res.json({
    user: serializeUser(populatedUser, req.currentUser._id),
  });
}
