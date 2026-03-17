import NavBar from "./NavBar.jsx";
import NoticeRegion from "./NoticeRegion.jsx";

export default function Layout({ children }) {
  return (
    <>
      <NavBar />
      <NoticeRegion />
      <main className="site-shell page-shell">{children}</main>
    </>
  );
}
