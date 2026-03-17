import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";
import { apiRequest } from "../lib/api.js";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import UserCard from "../components/UserCard.jsx";

export default function UsersPage() {
  const { user, setUser } = useAuth();
  const { showNotice } = useNotice();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        setLoading(true);
        const response = await apiRequest("/api/users");

        if (active) {
          setUsers(response.users);
        }
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

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  async function handleFollowToggle(person) {
    try {
      const action = person.isFollowing ? "unfollow" : "follow";
      const response = await apiRequest(`/api/users/${action}`, {
        method: "PUT",
        body: { targetUserId: person._id },
      });

      setUser(response.currentUser);
      setUsers((current) =>
        current.map((entry) => (entry._id === person._id ? response.targetUser : entry))
      );
      showNotice(response.message, "success");
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  return (
    <section className="stack">
      <div className="page-intro">
        <span className="eyebrow">Community directory</span>
        <h1>Browse people on MERN Social</h1>
        <p>Discover profiles, read bios, and follow people who make your feed interesting.</p>
      </div>

      {loading ? (
        <LoadingState label="Loading people..." />
      ) : users.length ? (
        <div className="people-grid">
          {users.map((person) => (
            <div className="card" key={person._id}>
              <UserCard
                user={person}
                action={
                  user && user._id !== person._id ? (
                    <button
                      type="button"
                      className="button button--secondary button--small"
                      onClick={() => handleFollowToggle(person)}
                    >
                      {person.isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  ) : null
                }
                meta={`${person.followerCount} followers · ${person.followingCount} following`}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No users yet." body="Once people create accounts, they’ll show up here." />
      )}
    </section>
  );
}
