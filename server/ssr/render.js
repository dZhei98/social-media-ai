import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppRoutes, AppShell } from "../../src/App.jsx";
import { serializeUser } from "../utils/serialize.js";

function escapeForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function renderApp(req, res) {
  const initialState = {
    currentUser: req.currentUser ? serializeUser(req.currentUser, req.currentUser._id) : null,
    location: req.originalUrl,
  };

  const markup = renderToString(
    <StaticRouter location={req.originalUrl}>
      <AppShell initialUser={initialState.currentUser}>
        <AppRoutes />
      </AppShell>
    </StaticRouter>
  );

  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="MERN Social is a lightweight social network for sharing updates, discovering people, and following friends." />
    <title>MERN Social</title>
    <link rel="stylesheet" href="/styles/main.css" />
  </head>
  <body>
    <div id="root">${markup}</div>
    <script>window.__INITIAL_STATE__ = ${escapeForHtml(initialState)};</script>
    <script type="module" src="/build/app.js"></script>
  </body>
</html>`);
}
