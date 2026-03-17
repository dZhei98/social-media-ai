import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";

export default function NavBar() {
  const navigate = useNavigate();
  const { user, signout } = useAuth();
  const { showNotice } = useNotice();

  async function handleSignout() {
    try {
      await signout();
      showNotice("Signed out successfully.", "success");
      navigate("/");
    } catch (error) {
      showNotice(error.message, "error");
    }
  }

  return (
    <header className="site-header">
      <div className="site-shell nav-shell">
        <Link to="/" className="brand-mark">
          <span className="brand-mark__eyebrow">Classic MERN Social</span>
          <span className="brand-mark__title">MERN Social</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/users">People</NavLink>
          {user ? (
            <>
              <NavLink to={`/users/${user._id}`}>My Profile</NavLink>
              <button type="button" className="button button--ghost button--small" onClick={handleSignout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/signin">Sign In</NavLink>
              <NavLink to="/signup" className="button button--primary button--small">
                Create Account
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
