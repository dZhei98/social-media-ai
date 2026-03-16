# Application Design Document: `social-media`

## Purpose

Create a new social media application from scratch using a classic JavaScript full-stack approach. This document defines the product, user experience, and technical direction, while intentionally avoiding a rigid prescription for file layout, controller structure, or API architecture.

The goal is to produce a complete, working application that feels like a small, polished social platform rather than to mirror a specific internal implementation.

## Required Input

The application must be able to run with only this required environment variable:

```env
MONGODB_URI=mongodb+srv://admin:<db_password>@social-media-ai.b54s9gy.mongodb.net/?appName=social-media-ai
```

Optional environment variables may be supported, but the app should still work with sensible defaults if they are absent. The local development port should default to `3000`.

## Product Summary

This application is a lightweight social network where people can:

- create an account
- sign in and sign out
- manage a personal profile
- follow and unfollow other users
- publish text posts with optional images
- view a personalized feed
- like and comment on posts
- discover other users to follow

The experience should be simple, fast, and easy to understand for a first-time user.

## Design Principles

- Favor clarity over feature sprawl.
- Keep the interface light, familiar, and social-first.
- Make the signed-out and signed-in experiences meaningfully different.
- Use straightforward interaction patterns with minimal ceremony.
- Prefer practical, well-understood implementation choices over architectural novelty.

## User Experience Direction

The product should feel like a classic MERN social app:

- a light visual theme
- Material-inspired UI components
- a simple top navigation bar
- a recognizable app title: `MERN Social`
- teal as the primary color direction
- orange as the accent color direction

Signed-out users should see a welcoming public home screen with a hero image and a short introductory message.

Signed-in users should land in a more functional home experience centered on:

- a news feed
- lightweight user discovery or "who to follow" suggestions

## Core Functional Scope

### Account And Authentication

The application should support:

- user registration with name, email, and password
- user sign-in with email and password
- user sign-out
- browser-side persistence of authenticated state for the current session
- protection for actions that require an authenticated user

Authentication should be secure enough for a typical tutorial-scale social application and should support authorization checks for user-owned actions.

### Profiles

Each user should have a profile that includes:

- name
- email
- optional profile/about text
- profile image or avatar
- joined date
- following list
- followers list

Users should be able to:

- view their own profile
- edit their own profile
- upload or replace a profile image
- delete their own account
- view other users' profiles
- follow or unfollow other users

The UI should clearly distinguish between viewing your own profile and viewing someone else's.

### User Discovery

The application should include a way to browse people and discover accounts worth following.

This should include:

- a general users listing
- a smaller recommendation or "find people" surface for signed-in users

Suggestions should avoid showing the current user and should ideally avoid showing accounts the user already follows.

### Posts

Signed-in users should be able to create posts that contain:

- required text
- an optional image

Posts should appear:

- on the author's profile
- in a signed-in home feed

Each post should show:

- author identity
- created date
- text content
- optional image
- like count
- comment count

Users should be able to delete their own posts, but not posts created by other users.

### Feed

The signed-in home feed should feel personalized. It should primarily reflect content from people the user follows, and it is also reasonable to include the user's own posts if that makes the product more coherent.

Feed ordering should favor newest content first.

### Likes And Comments

Users should be able to:

- like a post
- unlike a post
- add comments to a post
- remove comments they authored

These interactions should update the interface quickly and clearly.

## Data Concepts

The application should revolve around two main entities:

### User

A user should have enough data to support:

- identity
- login credentials
- biography/about text
- profile image
- follower/following relationships
- creation and update timestamps

### Post

A post should have enough data to support:

- ownership by a user
- text content
- an optional image
- likes from users
- comments from users
- creation timestamp

### Comment

A comment should record:

- author
- text
- creation time

## Technical Direction

This should be built as a classic MERN-style application:

- Node.js on the server
- Express for HTTP handling
- MongoDB for persistence
- Mongoose or an equivalent MongoDB modeling layer
- React on the client
- plain JavaScript throughout

Technical preferences:

- use server-rendered initial HTML with client hydration rather than a pure client-only SPA
- use JWT-based authentication for protected interactions
- use `fetch` for client-server communication
- support image upload for users and posts
- keep the local development flow simple
- keep the production build straightforward

Avoid unnecessary modernization. This should not turn into a TypeScript rewrite, a framework migration, or an over-engineered architecture exercise.

## Persistence And Media Expectations

The application should store its main data in MongoDB using the provided `MONGODB_URI`.

Profile and post images should be persisted in a way that works without requiring separate cloud storage configuration. A MongoDB-backed approach is appropriate here.

The application should also provide sensible fallbacks when an image has not been uploaded, especially for user avatars.

## Validation And Security Expectations

At a minimum:

- email addresses should be unique
- email format should be validated
- passwords should have a minimum length
- authenticated users should only be able to modify or delete their own resources where appropriate
- unauthorized access should fail cleanly

This is not intended to be enterprise-grade security work, but it should be competently implemented.

## Visual And Interaction Expectations

The UI should include:

- a top navigation bar
- a public home view
- authentication views
- a users list
- a profile view
- a profile edit view
- a signed-in feed view
- a user discovery surface

The application should provide clear feedback for important actions such as:

- successful signup
- failed signin
- follow and unfollow actions
- post creation
- validation errors

## Build And Run Expectations

The project should:

- run locally after dependency installation
- start on port `3000` by default
- support a development workflow
- support a production build
- work with only `MONGODB_URI` supplied

If additional environment variables are introduced, they should remain optional wherever practical.

## Deliverable Expectations

The finished project should include:

- complete runnable source code
- a standard install and run workflow
- a production build path
- enough documentation for another engineer to start the project locally

The internal code organization is up to the implementer as long as the delivered application satisfies the product and technical expectations in this document.

## Success Criteria

The application is successful when all of the following are true:

1. A new developer can install dependencies, provide only `MONGODB_URI`, and start the app locally.
2. A visitor can create an account and sign in without additional manual setup.
3. Signed-out users see a public landing experience rather than an empty shell.
4. Signed-in users get a feed-oriented home experience and user discovery surface.
5. Users can manage profiles, including avatar updates and optional bio/about text.
6. Users can follow and unfollow other users.
7. Users can create posts with text and optional images.
8. Users can like, unlike, comment on, and manage their own content.
9. The application behaves coherently across the main social flows without requiring knowledge of the internal architecture.
10. The implementation stays aligned with the classic MERN direction described here and does not drift into unnecessary complexity.

## Guidance To The Building Agent

If you are building from this document alone:

1. Treat this as a product and design brief, not as a rigid file-by-file implementation checklist.
2. Choose a reasonable project structure and API shape consistent with a classic MERN application.
3. Prioritize end-user behavior, completeness, and clarity over internal cleverness.
4. Preserve the overall experience described here even if you make different low-level implementation choices.
5. Keep the setup lightweight and avoid dependencies on infrastructure beyond the provided MongoDB URI.
