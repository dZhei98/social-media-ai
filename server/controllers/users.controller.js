import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { createAvatarSvg } from "../utils/avatar.js";
import { AppError } from "../utils/errors.js";
import { buildImagePayload } from "../utils/media.js";
import { clearAuthCookie } from "../utils/auth.js";
import { serializeUser } from "../utils/serialize.js";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function loadUserProfile(userId) {
  const user = await User.findById(userId)
    .populate("followers", "name about avatar")
    .populate("following", "name about avatar");

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user;
}

export async function listUsers(req, res) {
  const users = await User.find()
    .sort({ name: 1 })
    .select("name about avatar followers following createdAt updatedAt");

  res.json({
    users: users.map((user) => serializeUser(user, req.currentUser?._id)),
  });
}

export async function suggestions(req, res) {
  const excludedIds = [req.currentUser._id, ...(req.currentUser.following || [])];

  const users = await User.find({
    _id: {
      $nin: excludedIds,
    },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name about avatar followers following createdAt updatedAt");

  res.json({
    users: users.map((user) => serializeUser(user, req.currentUser._id)),
  });
}

export async function getUser(req, res) {
  const user = await loadUserProfile(req.params.userId);

  res.json({
    user: serializeUser(user, req.currentUser?._id),
  });
}

export async function updateUser(req, res) {
  if (req.currentUser._id.toString() !== req.params.userId) {
    throw new AppError(403, "You can only edit your own profile.");
  }

  const user = await User.findById(req.params.userId).select("+passwordHash");

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  if (req.body.name !== undefined) {
    const nextName = req.body.name.trim();

    if (!nextName) {
      throw new AppError(400, "Name is required.");
    }

    user.name = nextName;
  }

  if (req.body.email !== undefined) {
    const nextEmail = normalizeEmail(req.body.email);
    const duplicate = await User.findOne({
      email: nextEmail,
      _id: { $ne: user._id },
    });

    if (duplicate) {
      throw new AppError(409, "That email address is already in use.");
    }

    user.email = nextEmail;
  }

  if (req.body.about !== undefined) {
    user.about = req.body.about.trim();
  }

  if (req.body.password) {
    if (req.body.password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters long.");
    }

    user.passwordHash = await bcrypt.hash(req.body.password, 12);
  }

  if (req.body.removeAvatar === "true") {
    user.avatar = undefined;
  }

  if (req.file) {
    user.avatar = buildImagePayload(req.file);
  }

  await user.save();

  const populatedUser = await loadUserProfile(user._id);

  res.json({
    message: "Profile updated successfully.",
    user: serializeUser(populatedUser, user._id),
  });
}

export async function removeUser(req, res) {
  if (req.currentUser._id.toString() !== req.params.userId) {
    throw new AppError(403, "You can only delete your own account.");
  }

  const userId = req.currentUser._id;

  await Promise.all([
    User.updateMany({ followers: userId }, { $pull: { followers: userId } }),
    User.updateMany({ following: userId }, { $pull: { following: userId } }),
    Post.deleteMany({ postedBy: userId }),
    Post.updateMany(
      {},
      {
        $pull: {
          likes: userId,
          comments: { postedBy: userId },
        },
      }
    ),
    User.findByIdAndDelete(userId),
  ]);

  clearAuthCookie(res);

  res.json({
    message: "Your account has been deleted.",
  });
}

export async function followUser(req, res) {
  const targetUserId = req.body.targetUserId;

  if (!targetUserId) {
    throw new AppError(400, "A user to follow is required.");
  }

  if (targetUserId === req.currentUser._id.toString()) {
    throw new AppError(400, "You cannot follow yourself.");
  }

  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    throw new AppError(404, "User not found.");
  }

  await Promise.all([
    User.findByIdAndUpdate(req.currentUser._id, { $addToSet: { following: targetUserId } }),
    User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: req.currentUser._id } }),
  ]);

  const [currentUser, updatedTargetUser] = await Promise.all([
    loadUserProfile(req.currentUser._id),
    loadUserProfile(targetUserId),
  ]);

  res.json({
    message: `You are now following ${updatedTargetUser.name}.`,
    currentUser: serializeUser(currentUser, currentUser._id),
    targetUser: serializeUser(updatedTargetUser, currentUser._id),
  });
}

export async function unfollowUser(req, res) {
  const targetUserId = req.body.targetUserId;

  if (!targetUserId) {
    throw new AppError(400, "A user to unfollow is required.");
  }

  await Promise.all([
    User.findByIdAndUpdate(req.currentUser._id, { $pull: { following: targetUserId } }),
    User.findByIdAndUpdate(targetUserId, { $pull: { followers: req.currentUser._id } }),
  ]);

  const [currentUser, updatedTargetUser] = await Promise.all([
    loadUserProfile(req.currentUser._id),
    loadUserProfile(targetUserId),
  ]);

  res.json({
    message: `You unfollowed ${updatedTargetUser.name}.`,
    currentUser: serializeUser(currentUser, currentUser._id),
    targetUser: serializeUser(updatedTargetUser, currentUser._id),
  });
}

export async function serveAvatar(req, res) {
  const user = await User.findById(req.params.userId).select("name avatar");

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  if (user.avatar?.data?.length) {
    res.set("Content-Type", user.avatar.contentType || "image/jpeg");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(user.avatar.data);
    return;
  }

  res.set("Content-Type", "image/svg+xml");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(createAvatarSvg(user.name));
}
