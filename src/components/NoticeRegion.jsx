import React from "react";
import { useNotice } from "../context/NoticeContext.jsx";

export default function NoticeRegion() {
  const { notice, clearNotice } = useNotice();

  if (!notice) {
    return null;
  }

  return (
    <div className={`notice notice--${notice.tone}`}>
      <span>{notice.message}</span>
      <button type="button" className="icon-button" onClick={clearNotice} aria-label="Dismiss notice">
        ×
      </button>
    </div>
  );
}
