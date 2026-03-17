import React, { useState } from "react";
import { apiRequest } from "../lib/api.js";
import { useNotice } from "../context/NoticeContext.jsx";

export default function PostComposer({ onCreated }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { showNotice } = useNotice();

  async function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim()) {
      setError("Post text is required.");
      return;
    }

    const formData = new FormData();
    formData.append("text", text.trim());

    if (file) {
      formData.append("image", file);
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await apiRequest("/api/posts", {
        method: "POST",
        body: formData,
      });

      setText("");
      setFile(null);
      onCreated(response.post);
      showNotice(response.message, "success");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card composer-card" onSubmit={handleSubmit}>
      <div className="card-header">
        <h2>Share an update</h2>
        <p>Write something short, useful, or social.</p>
      </div>

      <label className="field">
        <span className="field__label">Post</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          maxLength={500}
          placeholder="What’s happening in your world?"
        />
      </label>

      <label className="field">
        <span className="field__label">Optional image</span>
        <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </label>

      {file ? <p className="helper-text">Selected image: {file.name}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? "Posting..." : "Publish Post"}
        </button>
      </div>
    </form>
  );
}
