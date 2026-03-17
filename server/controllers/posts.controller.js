import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/errors.js";
import { buildImagePayload } from "../utils/media.js";
import { serializePost } from "../utils/serialize.js";

async function loadPost(postId) {
  const post = await Post.findById(postId)
    .populate("postedBy", "name about avatar")
    .populate("comments.postedBy", "name about avatar");

  if (!post) {
    throw new AppError(404, "Post not found.");
  }

  return post;
}

export async function createPost(req, res) {
  const text = req.body.text?.trim();

  if (!text) {
    throw new AppError(400, "Post text is required.");
  }

  const post = await Post.create({
    text,
    postedBy: req.currentUser._id,
    image: buildImagePayload(req.file),
  });

  const populatedPost = await loadPost(post._id);

  res.status(201).json({
    message: "Post created successfully.",
    post: serializePost(populatedPost, req.currentUser._id),
  });
}

export async function userPosts(req, res) {
  const posts = await Post.find({ postedBy: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("postedBy", "name about avatar")
    .populate("comments.postedBy", "name about avatar");

  res.json({
    posts: posts.map((post) => serializePost(post, req.currentUser?._id)),
  });
}

export async function feed(req, res) {
  const currentUser = await User.findById(req.currentUser._id).select("following");

  const authorIds = [req.currentUser._id, ...(currentUser?.following || [])];

  const posts = await Post.find({
    postedBy: {
      $in: authorIds,
    },
  })
    .sort({ createdAt: -1 })
    .populate("postedBy", "name about avatar")
    .populate("comments.postedBy", "name about avatar");

  res.json({
    posts: posts.map((post) => serializePost(post, req.currentUser._id)),
  });
}

export async function removePost(req, res) {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw new AppError(404, "Post not found.");
  }

  if (post.postedBy.toString() !== req.currentUser._id.toString()) {
    throw new AppError(403, "You can only delete your own posts.");
  }

  await post.deleteOne();

  res.json({
    message: "Post deleted successfully.",
  });
}

export async function likePost(req, res) {
  await Post.findByIdAndUpdate(req.params.postId, {
    $addToSet: { likes: req.currentUser._id },
  });

  const post = await loadPost(req.params.postId);

  res.json({
    post: serializePost(post, req.currentUser._id),
  });
}

export async function unlikePost(req, res) {
  await Post.findByIdAndUpdate(req.params.postId, {
    $pull: { likes: req.currentUser._id },
  });

  const post = await loadPost(req.params.postId);

  res.json({
    post: serializePost(post, req.currentUser._id),
  });
}

export async function addComment(req, res) {
  const text = req.body.text?.trim();

  if (!text) {
    throw new AppError(400, "Comment text is required.");
  }

  await Post.findByIdAndUpdate(req.params.postId, {
    $push: {
      comments: {
        text,
        postedBy: req.currentUser._id,
      },
    },
  });

  const post = await loadPost(req.params.postId);

  res.status(201).json({
    message: "Comment added.",
    post: serializePost(post, req.currentUser._id),
  });
}

export async function removeComment(req, res) {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw new AppError(404, "Post not found.");
  }

  const comment = post.comments.id(req.params.commentId);

  if (!comment) {
    throw new AppError(404, "Comment not found.");
  }

  if (comment.postedBy.toString() !== req.currentUser._id.toString()) {
    throw new AppError(403, "You can only remove your own comments.");
  }

  post.comments.pull({ _id: req.params.commentId });
  await post.save();

  const populatedPost = await loadPost(req.params.postId);

  res.json({
    message: "Comment removed.",
    post: serializePost(populatedPost, req.currentUser._id),
  });
}

export async function servePostImage(req, res) {
  const post = await Post.findById(req.params.postId).select("image");

  if (!post || !post.image?.data?.length) {
    throw new AppError(404, "Post image not found.");
  }

  res.set("Content-Type", post.image.contentType || "image/jpeg");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(post.image.data);
}
