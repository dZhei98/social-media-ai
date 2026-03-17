import { Router } from "express";
import {
  addComment,
  createPost,
  feed,
  likePost,
  removeComment,
  removePost,
  servePostImage,
  unlikePost,
  userPosts,
} from "../controllers/posts.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadPostImage } from "../middleware/upload.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.get("/feed", requireAuth, asyncHandler(feed));
router.get("/by/:userId", asyncHandler(userPosts));
router.post("/", requireAuth, uploadPostImage, asyncHandler(createPost));
router.delete("/:postId", requireAuth, asyncHandler(removePost));
router.put("/:postId/like", requireAuth, asyncHandler(likePost));
router.put("/:postId/unlike", requireAuth, asyncHandler(unlikePost));
router.post("/:postId/comments", requireAuth, asyncHandler(addComment));
router.delete("/:postId/comments/:commentId", requireAuth, asyncHandler(removeComment));
router.get("/:postId/image", asyncHandler(servePostImage));

export default router;
