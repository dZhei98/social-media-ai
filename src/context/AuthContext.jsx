import { createContext, useContext, useState } from "react";
import { apiRequest } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);

  const value = {
    user,
    setUser,
    async signup(payload) {
      const response = await apiRequest("/api/auth/signup", {
        method: "POST",
        body: payload,
      });
      setUser(response.user);
      return response;
    },
    async signin(payload) {
      const response = await apiRequest("/api/auth/signin", {
        method: "POST",
        body: payload,
      });
      setUser(response.user);
      return response;
    },
    async signout() {
      const response = await apiRequest("/api/auth/signout", {
        method: "POST",
      });
      setUser(null);
      return response;
    },
    async refreshUser() {
      const response = await apiRequest("/api/auth/me");
      setUser(response.user);
      return response.user;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
