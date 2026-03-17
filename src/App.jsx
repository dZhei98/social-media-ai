import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { NoticeProvider } from "./context/NoticeContext.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

function RequireAuth({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<ProfilePage />} />
        <Route
          path="/users/:userId/edit"
          element={
            <RequireAuth>
              <EditProfilePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export function AppShell({ initialUser = null, children }) {
  return (
    <AuthProvider initialUser={initialUser}>
      <NoticeProvider>
        {children}
      </NoticeProvider>
    </AuthProvider>
  );
}

export { AppRoutes };
