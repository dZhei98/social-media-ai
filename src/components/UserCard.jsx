import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";

export default function UserCard({
  user,
  action = null,
  meta = null,
}) {
  return (
    <article className="user-card">
      <div className="identity-row">
        <Avatar user={user} size="medium" />
        <div>
          <Link to={`/users/${user._id}`} className="identity-row__name">
            {user.name}
          </Link>
          <p className="identity-row__meta">{meta || `${user.followerCount} followers`}</p>
        </div>
      </div>
      <p className="user-card__about">{user.about || "No bio yet."}</p>
      {action ? <div className="user-card__action">{action}</div> : null}
    </article>
  );
}
