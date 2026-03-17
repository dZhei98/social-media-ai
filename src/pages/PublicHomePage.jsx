import React from "react";
import { Link } from "react-router-dom";

export default function PublicHomePage() {
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <span className="eyebrow">Simple, social, and classic</span>
        <h1>Share updates, follow people, and keep your social graph lightweight.</h1>
        <p>
          MERN Social is a focused social app with profiles, follows, posts, likes, comments, and a clean
          feed-first experience.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="button button--primary">
            Create Account
          </Link>
          <Link to="/signin" className="button button--secondary">
            Sign In
          </Link>
        </div>
      </div>

      <div className="hero-visual card">
        <img src="/images/hero-social.svg" alt="Illustration of a social media dashboard" />
      </div>
    </section>
  );
}
