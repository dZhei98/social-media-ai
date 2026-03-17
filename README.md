# MERN Social

MERN Social is a classic full-stack social media application built from the design brief in `APPLICATION_DESIGN_DOCUMENT.md`. It uses Express and MongoDB on the server, React with server-rendered initial HTML plus hydration on the client, and stores profile/post images directly in MongoDB.

## Features

- user signup, signin, signout, and session-based JWT auth
- public landing page for signed-out visitors
- signed-in feed with follow suggestions
- editable user profiles with avatar uploads and bio/about text
- follow and unfollow flows
- text posts with optional images
- likes, comments, and owner-only delete actions
- general people directory and profile pages

## Requirements

- Node.js 18+
- npm 9+
- MongoDB connection string provided through `MONGODB_URI`

## Environment

Only one variable is required:

```env
MONGODB_URI=mongodb+srv://admin:<db_password>@social-media-ai.b54s9gy.mongodb.net/?appName=social-media-ai
```

Optional:

```env
PORT=3000
JWT_SECRET=change-me-in-production
```

## Install

```bash
npm install
```

## Run In Development

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default. The dev script watches the client bundle and restarts the server when source files change.

## Production Build

```bash
npm run build
npm start
```

The production build outputs bundled server and client assets into `dist/`.

## Project Structure

```text
server/   Express app, MongoDB models, auth, API routes, SSR
src/      Shared React client application and hydration entry
public/   Static styles and illustration assets
scripts/  esbuild development and production build scripts
```

## Notes

- profile and post images are stored in MongoDB document buffers, so no extra storage service is required
- authentication uses a JWT stored in an HTTP-only cookie for browser-session persistence
- if a user has no uploaded avatar, the server returns a generated SVG fallback

## Current Verification Status

This repository started empty, and the current environment used to produce this code does not have `node` or `npm` installed. Because of that, the dependency install, build, and runtime verification steps could not be executed here. Once Node.js is available locally, run `npm install`, `npm run dev`, and `npm run build` to verify the application end to end.
