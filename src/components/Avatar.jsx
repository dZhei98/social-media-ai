import { avatarUrl } from "../lib/routes.js";

export default function Avatar({ user, size = "medium" }) {
  const className = `avatar avatar--${size}`;

  return <img className={className} src={avatarUrl(user)} alt={user?.name || "User avatar"} />;
}
