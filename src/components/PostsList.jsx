import React from "react";
import EmptyState from "./EmptyState.jsx";
import PostCard from "./PostCard.jsx";

export default function PostsList({ posts, onUpdated, onDeleted, emptyTitle, emptyBody }) {
  if (!posts.length) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="stack">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onUpdated={onUpdated} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
