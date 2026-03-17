import { Router } from "express";
import {
  followUser,
  getUser,
  listUsers,
  removeUser,
  serveAvatar,
  suggestions,
  unfollowUser,
  updateUser,
} from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.get("/", asyncHandler(listUsers));
router.get("/suggestions", requireAuth, asyncHandler(suggestions));
router.put("/follow", requireAuth, asyncHandler(followUser));
router.put("/unfollow", requireAuth, asyncHandler(unfollowUser));
router.get("/:userId/avatar", asyncHandler(serveAvatar));
router.get("/:userId", asyncHandler(getUser));
router.put("/:userId", requireAuth, uploadAvatar, asyncHandler(updateUser));
router.delete("/:userId", requireAuth, asyncHandler(removeUser));

export default router;
