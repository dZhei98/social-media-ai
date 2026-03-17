import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";
import { apiRequest } from "../lib/api.js";
import LoadingState from "../components/LoadingState.jsx";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, setUser } = useAuth();
  const { showNotice } = useNotice();
  const [form, setForm] = useState({
    name: "",
    email: "",
    about: "",
    password: "",
  });
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await apiRequest(`/api/users/${userId}`);

        if (!active) {
          return;
        }

        setForm({
          name: response.user.name,
          email: response.user.email,
          about: response.user.about || "",
          password: "",
        });
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
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

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (user._id !== userId) {
    return <Navigate to={`/users/${user._id}`} replace />;
  }

  if (loading) {
    return <LoadingState label="Loading profile editor..." />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("about", form.about);

      if (form.password) {
        formData.append("password", form.password);
      }

      if (avatar) {
        formData.append("avatar", avatar);
      }

      if (removeAvatar) {
        formData.append("removeAvatar", "true");
      }

      const response = await apiRequest(`/api/users/${userId}`, {
        method: "PUT",
        body: formData,
      });

      setUser(response.user);
      showNotice(response.message, "success");
      navigate(`/users/${userId}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <form className="card auth-card auth-card--wide" onSubmit={handleSubmit}>
        <div className="card-header">
          <span className="eyebrow">Profile settings</span>
          <h1>Edit your profile</h1>
          <p>Update the details that people see when they visit your profile.</p>
        </div>

        <label className="field">
          <span className="field__label">Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">About</span>
          <textarea
            rows={4}
            maxLength={280}
            value={form.about}
            onChange={(event) => setForm((current) => ({ ...current, about: event.target.value }))}
          />
        </label>

        <label className="field">
          <span className="field__label">New password</span>
          <input
            type="password"
            value={form.password}
            minLength={8}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Leave blank to keep current password"
          />
        </label>

        <label className="field">
          <span className="field__label">Profile image</span>
          <input type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
        </label>

        <label className="checkbox-field">
          <input type="checkbox" checked={removeAvatar} onChange={(event) => setRemoveAvatar(event.target.checked)} />
          <span>Remove current avatar</span>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
