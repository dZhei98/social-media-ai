import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="empty-state card">
      <h1>Page not found</h1>
      <p>The page you were looking for does not exist or may have moved.</p>
      <Link to="/" className="button button--primary button--small">
        Go Home
      </Link>
    </section>
  );
}
