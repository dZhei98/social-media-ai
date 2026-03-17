import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";
import { apiRequest } from "../lib/api.js";
import LoadingState from "../components/LoadingState.jsx";
import PostComposer from "../components/PostComposer.jsx";
import PostsList from "../components/PostsList.jsx";
import PublicHomePage from "./PublicHomePage.jsx";
import UserCard from "../components/UserCard.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function HomePage() {
  const { user, setUser } = useAuth();
  const { showNotice } = useNotice();
  const [feed, setFeed] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let active = true;

    async function loadHomeData() {
      try {
        setLoading(true);
        const [feedResponse, suggestionsResponse] = await Promise.all([
          apiRequest("/api/posts/feed"),
          apiRequest("/api/users/suggestions"),
        ]);

        if (!active) {
          return;
        }

        setFeed(feedResponse.posts);
        setSuggestions(suggestionsResponse.users);
      } catch (error) {
        if (active) {
          showNotice(error.message, "error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHomeData();

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return <PublicHomePage />;
  }

  async function handleFollow(targetUserId, action) {
    try {
      const response = await apiRequest(`/api/users/${action}`, {
        method: "PUT",
        body: { targetUserId },
      });

      setUser(response.currentUser);
      setSuggestions((current) => current.filter((person) => person._id !== targetUserId));
      showNotice(response.message, "success");
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  function handlePostCreated(post) {
    setFeed((current) => [post, ...current]);
  }

  function handlePostUpdated(updatedPost) {
    setFeed((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  }

  function handlePostDeleted(postId) {
    setFeed((current) => current.filter((post) => post._id !== postId));
    showNotice("Post deleted successfully.", "success");
  }

  return (
    <section className="home-grid">
      <div className="stack">
        <div className="page-intro">
          <span className="eyebrow">Your social home</span>
          <h1>Latest updates from people you follow</h1>
          <p>Fresh posts land here first, with your own updates included at the top.</p>
        </div>

        <PostComposer onCreated={handlePostCreated} />

        {loading ? (
          <LoadingState label="Loading your feed..." />
        ) : (
          <PostsList
            posts={feed}
            onUpdated={handlePostUpdated}
            onDeleted={handlePostDeleted}
            emptyTitle="Your feed is quiet right now."
            emptyBody="Follow a few people or publish the first update yourself."
          />
        )}
      </div>

      <aside className="sidebar-stack">
        <section className="card sidebar-card">
          <div className="card-header">
            <h2>Find people</h2>
            <p>Shortlist of people worth following next.</p>
          </div>

          {suggestions.length ? (
            <div className="stack stack--compact">
              {suggestions.map((person) => (
                <UserCard
                  key={person._id}
                  user={person}
                  action={
                    <button
                      type="button"
                      className="button button--secondary button--small"
                      onClick={() => handleFollow(person._id, "follow")}
                    >
                      Follow
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="You’re caught up."
              body="No new suggestions right now. Explore the full people directory instead."
              action={
                <Link to="/users" className="button button--secondary button--small">
                  Browse People
                </Link>
              }
            />
          )}
        </section>
      </aside>
    </section>
  );
}
