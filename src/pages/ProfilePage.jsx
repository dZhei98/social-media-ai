import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PostComposer from "../components/PostComposer.jsx";
import PostsList from "../components/PostsList.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";
import { apiRequest } from "../lib/api.js";
import { formatDate } from "../lib/format.js";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, setUser } = useAuth();
  const { showNotice } = useNotice();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);

        const [profileResponse, postsResponse] = await Promise.all([
          apiRequest(`/api/users/${userId}`),
          apiRequest(`/api/posts/by/${userId}`),
        ]);

        if (!active) {
          return;
        }

        setProfile(profileResponse.user);
        setPosts(postsResponse.posts);
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

    loadProfile();

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return <LoadingState label="Loading profile..." />;
  }

  if (!profile) {
    return <EmptyState title="Profile unavailable" body="We could not load that user." />;
  }

  const isSelf = user?._id === profile._id;

  async function handleFollowToggle() {
    try {
      const action = profile.isFollowing ? "unfollow" : "follow";
      const response = await apiRequest(`/api/users/${action}`, {
        method: "PUT",
        body: { targetUserId: profile._id },
      });

      setUser(response.currentUser);
      setProfile(response.targetUser);
      showNotice(response.message, "success");
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm("Delete your account? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiRequest(`/api/users/${profile._id}`, {
        method: "DELETE",
      });

      setUser(null);
      showNotice(response.message, "success");
      navigate("/");
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  function handlePostCreated(post) {
    setPosts((current) => [post, ...current]);
  }

  function handlePostUpdated(updatedPost) {
    setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  }

  function handlePostDeleted(postId) {
    setPosts((current) => current.filter((post) => post._id !== postId));
    showNotice("Post deleted successfully.", "success");
  }

  return (
    <section className="stack">
      <article className="card profile-card">
        <div className="profile-card__hero">
          <Avatar user={profile} size="large" />
          <div className="profile-card__content">
            <span className="eyebrow">Profile</span>
            <h1>{profile.name}</h1>
            <a className="profile-email" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <p>{profile.about || "No bio yet."}</p>
            <div className="profile-stats">
              <span>{profile.followerCount} followers</span>
              <span>{profile.followingCount} following</span>
              <span>Joined {formatDate(profile.joinedAt)}</span>
            </div>
          </div>
          <div className="profile-card__actions">
            {isSelf ? (
              <>
                <Link to={`/users/${profile._id}/edit`} className="button button--secondary button--small">
                  Edit Profile
                </Link>
                <button type="button" className="button button--ghost button--small" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </>
            ) : user ? (
              <button type="button" className="button button--primary button--small" onClick={handleFollowToggle}>
                {profile.isFollowing ? "Unfollow" : "Follow"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="profile-lists">
          <div>
            <h2>Followers</h2>
            <div className="profile-chip-list">
              {profile.followers.length ? (
                profile.followers.map((entry) => (
                  <Link key={entry._id} to={`/users/${entry._id}`} className="profile-chip">
                    {entry.name}
                  </Link>
                ))
              ) : (
                <span className="profile-chip profile-chip--muted">No followers yet</span>
              )}
            </div>
          </div>

          <div>
            <h2>Following</h2>
            <div className="profile-chip-list">
              {profile.following.length ? (
                profile.following.map((entry) => (
                  <Link key={entry._id} to={`/users/${entry._id}`} className="profile-chip">
                    {entry.name}
                  </Link>
                ))
              ) : (
                <span className="profile-chip profile-chip--muted">Not following anyone yet</span>
              )}
            </div>
          </div>
        </div>
      </article>

      {isSelf ? <PostComposer onCreated={handlePostCreated} /> : null}

      <div className="page-intro">
        <h2>{isSelf ? "Your posts" : `${profile.name}'s posts`}</h2>
        <p>Newest posts appear first.</p>
      </div>

      <PostsList
        posts={posts}
        onUpdated={handlePostUpdated}
        onDeleted={handlePostDeleted}
        emptyTitle="No posts yet."
        emptyBody={isSelf ? "Write the first post from your profile." : "This user has not shared anything yet."}
      />
    </section>
  );
}
