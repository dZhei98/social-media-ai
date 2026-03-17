import React from "react";
export default function EmptyState({ title, body, action = null }) {
  return (
    <div className="empty-state card">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
