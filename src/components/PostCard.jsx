import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";
import { apiRequest } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";
import { postImageUrl } from "../lib/routes.js";
import Avatar from "./Avatar.jsx";

export default function PostCard({
  post,
  onUpdated,
  onDeleted,
}) {
  const { user } = useAuth();
  const { showNotice } = useNotice();
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const isOwner = user?._id === post.postedBy?._id;

  async function handleToggleLike() {
    if (!user) {
      return;
    }

    try {
      const endpoint = post.likedByViewer ? "unlike" : "like";
      const response = await apiRequest(`/api/posts/${post._id}/${endpoint}`, {
        method: "PUT",
      });
      onUpdated(response.post);
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    setBusy(true);

    try {
      const response = await apiRequest(`/api/posts/${post._id}/comments`, {
        method: "POST",
        body: {
          text: commentText.trim(),
        },
      });

      setCommentText("");
      onUpdated(response.post);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveComment(commentId) {
    try {
      const response = await apiRequest(`/api/posts/${post._id}/comments/${commentId}`, {
        method: "DELETE",
      });
      onUpdated(response.post);
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  async function handleDeletePost() {
    const confirmed = window.confirm("Delete this post?");

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/api/posts/${post._id}`, {
        method: "DELETE",
      });

      onDeleted(post._id);
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  return (
    <article className="card post-card">
      <div className="post-card__header">
        <div className="identity-row">
          <Avatar user={post.postedBy} size="small" />
          <div>
            <Link to={`/users/${post.postedBy._id}`} className="identity-row__name">
              {post.postedBy.name}
            </Link>
            <p className="identity-row__meta">{formatDateTime(post.createdAt)}</p>
          </div>
        </div>

        {isOwner ? (
          <button type="button" className="button button--ghost button--small" onClick={handleDeletePost}>
            Delete
          </button>
        ) : null}
      </div>

      <p className="post-card__text">{post.text}</p>

      {post.hasImage ? <img className="post-card__image" src={postImageUrl(post)} alt="Post attachment" /> : null}

      <div className="post-card__actions">
        <button
          type="button"
          className={`reaction-button ${post.likedByViewer ? "reaction-button--active" : ""}`}
          onClick={handleToggleLike}
          disabled={!user}
        >
          {post.likedByViewer ? "Liked" : "Like"} · {post.likeCount}
        </button>
        <span className="reaction-count">{post.commentCount} comments</span>
      </div>

      <div className="comment-list">
        {post.comments.map((comment) => (
          <div key={comment._id} className="comment-item">
            <div>
              <Link to={`/users/${comment.postedBy._id}`} className="comment-item__author">
                {comment.postedBy.name}
              </Link>
              <p className="comment-item__text">{comment.text}</p>
            </div>
            {user?._id === comment.postedBy._id ? (
              <button
                type="button"
                className="icon-button"
                onClick={() => handleRemoveComment(comment._id)}
                aria-label="Delete comment"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {user ? (
        <form className="comment-form" onSubmit={handleAddComment}>
          <input
            type="text"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Write a comment"
            maxLength={280}
          />
          <button type="submit" className="button button--secondary button--small" disabled={busy}>
            Reply
          </button>
        </form>
      ) : null}
    </article>
  );
}
