import React from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes, AppShell } from "./App.jsx";

const initialState = window.__INITIAL_STATE__ || {};

hydrateRoot(
  document.getElementById("root"),
  <BrowserRouter>
    <AppShell initialUser={initialState.currentUser || null}>
      <AppRoutes />
    </AppShell>
  </BrowserRouter>
);
