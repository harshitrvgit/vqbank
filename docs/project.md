# vqBank — Project Documentation

> A comprehensive guide for contributors and maintainers of the **vqBank** project — a platform for collecting and sharing VIT Vellore examination papers.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Application Entry Point (`app.ts`)](#application-entry-point-appts)
- [API Versioning](#api-versioning)
  - [v1 — Server-Rendered (EJS)](#v1--server-rendered-ejs)
  - [v2 — JSON REST API](#v2--json-rest-api)
- [Data Models](#data-models)
  - [User Model](#user-model)
  - [Paper Model](#paper-model)
  - [Transaction Model (Planned)](#transaction-model-planned)
- [Authentication & Authorization](#authentication--authorization)
  - [v1 Authentication (Cookie-Based)](#v1-authentication-cookie-based)
  - [v2 Authentication (Bearer Token)](#v2-authentication-bearer-token)
  - [Role-Based Access Control](#role-based-access-control)
- [Middleware Deep Dive](#middleware-deep-dive)
- [Utilities](#utilities)
- [Views & Templating](#views--templating)
- [Static Assets](#static-assets)
- [Type Declarations](#type-declarations)
- [Configuration](#configuration)
  - [TypeScript Configuration](#typescript-configuration)
  - [Session Configuration](#session-configuration)
  - [Environment Variables](#environment-variables)
- [Scripts & Commands](#scripts--commands)
- [Linting & Formatting](#linting--formatting)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Conventions & Best Practices](#conventions--best-practices)
- [Contributing](#contributing)

---

## Overview

**vqBank** is a full-stack web application built with **Express 5** and **TypeScript** that serves as a repository for VIT University (Vellore) examination papers. Users can register, log in, browse, search, filter, and view papers. Admins can upload, edit, and delete papers. The project exposes two API versions:

| Version | Prefix    | Style                       | Auth Method    |
| ------- | --------- | --------------------------- | -------------- |
| **v1**  | `/api/v1` | Server-rendered (EJS views) | Signed cookies |
| **v2**  | `/api/v2` | JSON REST API               | Bearer tokens  |

---

## Tech Stack

| Layer            | Technology                                                      |
| ---------------- | --------------------------------------------------------------- |
| **Runtime**      | Node.js ≥ 22 (`.nvmrc: 22`), also compatible with Bun           |
| **Language**     | TypeScript 5.x (ES2022 target, NodeNext modules)                |
| **Framework**    | Express 5.x                                                     |
| **Database**     | MongoDB via Mongoose 9.x                                        |
| **Templating**   | EJS + ejs-mate (layouts)                                        |
| **Auth**         | JWT (jsonwebtoken), bcrypt for password/OTP hashing             |
| **File Uploads** | Multer (in-memory storage)                                      |
| **Sessions**     | express-session with connect-mongo store                        |
| **Styling**      | Bootstrap 5.2.3 (CDN) + custom CSS                              |
| **Payments**     | Stripe (dependency present, integration in progress)            |
| **Validation**   | express-validator, validator.js                                 |
| **Linting**      | ESLint 9 + typescript-eslint + Prettier                         |
| **Testing**      | Bun test runner (`bun:test`)                                    |
| **Build**        | `tsc` → `tsc-alias` → `copyfiles` (copies `public/` & `views/`) |
| **Dev Server**   | `tsx watch` with env-cmd                                        |

---

## Prerequisites

- **Node.js** v22+ (use `nvm use` to auto-select from `.nvmrc`)
- **MongoDB** v7+ running locally or accessible via URI
- **npm** (or Bun as an alternative runtime)

---

## Project Structure

```
vqbank/
├── app.ts                         # Application entry point
├── package.json
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── .nvmrc                         # Node.js version pinned to 22
│
├── configs/
│   └── sessionConfig.ts           # Express-session + MongoStore config
│
├── controllers/
│   ├── v1/
│   │   ├── admin/
│   │   │   └── admin.controller.ts      # Admin dashboard & user listing
│   │   ├── paper/
│   │   │   └── paper.controller.ts      # CRUD for papers (EJS-rendered)
│   │   └── user/
│   │       ├── user.auth.controller.ts  # Register / Login / Logout (v1)
│   │       └── user.controller.ts       # Render vqbank dashboard
│   └── v2/
│       ├── admin/
│       │   └── admin.v2.controller.ts   # Admin stats, user listing (JSON API)
│       ├── paper/
│       │   └── paper.v2.controller.ts   # Full CRUD for papers (JSON API)
│       └── user/
│           └── user.v2.auth.controller.ts # Register / Login / Logout (v2)
│
├── middlewares/
│   ├── v1/
│   │   ├── auth/
│   │   │   ├── protect.ts               # Cookie-based JWT guard
│   │   │   └── role.ts                  # Role-based access (ROLE_ADMIN, ROLE_USER)
│   │   └── paper/
│   │       └── genDownloadFile.ts       # Generate paper download (v1)
│   └── v2/
│       ├── auth/
│       │   ├── v2Protect.ts             # Bearer-token JWT guard
│       │   └── v2Role.ts               # Role-based access (v2)
│       └── paper/
│           └── v2genDownloadFile.ts     # Generate paper download (v2)
│
├── models/
│   ├── user.model.ts               # User schema, bcrypt hooks, instance methods
│   ├── paper.model.ts              # Paper schema (binary buffer storage)
│   └── transaction.model.ts        # Placeholder for future transactions
│
├── router/
│   ├── v1/
│   │   ├── admin/
│   │   │   └── admin.router.ts          # Admin routes
│   │   ├── paper/
│   │   │   └── paper.router.ts          # Paper CRUD routes
│   │   └── user/
│   │       ├── user.auth.router.ts      # Auth routes (register, login, logout)
│   │       └── user.router.ts           # User management routes
│   └── v2/
│       ├── admin/
│       │   └── admin.v2.router.ts       # Admin & user management routes (JSON)
│       ├── paper/
│       │   └── paper.v2.router.ts       # Full paper CRUD routes (JSON)
│       └── user/
│           └── user.v2.auth.router.ts   # Auth routes (JSON)
│
├── services/
│   └── v2/
│       └── paper/
│           └── paper.v2.service.ts      # Paper service layer (validation & business logic)
│
├── types/
│   ├── express.d.ts                # Augments Express Request with `user` & `token`
│   └── ejs-mate.d.ts              # Ambient module declaration for ejs-mate
│
├── utils/
│   ├── connectDB.ts                # MongoDB connection helper
│   ├── getLoggedInUser.ts          # Resolves logged-in user from signed cookie
│   ├── jwt.ts                      # newToken() and verifyToken() helpers
│   ├── multer.ts                   # Multer config (5 MB limit, file type filter)
│   └── server-error-handling/
│       ├── AppError.ts             # Custom error class with statusCode
│       └── catchAsyncError.ts      # Async middleware wrapper (catches rejections)
│
├── views/
│   ├── layouts/
│   │   └── boilerplate.ejs         # Base HTML layout (Bootstrap 5 CDN)
│   ├── partials/
│   │   ├── navbar.ejs              # Navigation bar partial
│   │   ├── footer.ejs              # Footer partial
│   │   └── flash.ejs               # Flash message partial
│   ├── auth/user/
│   │   ├── login.ejs               # Login page
│   │   └── register.ejs            # Registration page
│   ├── admin/
│   │   ├── index.ejs               # Admin dashboard
│   │   └── users.ejs               # Users list (admin)
│   ├── vqbank/
│   │   ├── index.ejs               # Papers listing / main dashboard
│   │   ├── upload.ejs              # Upload / edit paper form
│   │   └── view.ejs                # Paper viewer
│   ├── landing.ejs                 # Landing page
│   └── error.ejs                   # Error page
│
├── public/
│   ├── assets/
│   │   ├── favicons/               # Favicon files & web manifest
│   │   └── svg/                    # SVG assets (e.g., Google logo)
│   ├── css/
│   │   ├── global.css              # Global styles
│   │   └── landing.css             # Landing page styles
│   └── js/
│       ├── landing.js              # Landing page scripts
│       ├── suggestions.js          # Autocomplete / search suggestions
│       └── toggleShowPassword.js   # Password visibility toggle
│
├── tests/
│   ├── fixtures/
│   │   └── paper.ts                # Test data factories
│   ├── helpers/
│   │   ├── expressInject.ts        # Express test injection helpers
│   │   └── mockExpress.ts          # Mock Express req/res objects
│   ├── integration/
│   │   └── v2PaperRoutes.test.ts   # Integration tests for v2 paper routes
│   └── unit/
│       ├── paperV2Controller.test.ts  # Unit tests for v2 paper controller
│       └── paperV2Service.test.ts     # Unit tests for v2 paper service
│
├── docs/
│   ├── project.md                  # ← You are here
│   ├── code-of-conduct.md          # Code of conduct
│   ├── contributing/
│   │   ├── contributing.md         # Contribution guidelines
│   │   └── types-of-contribution.md # Types of accepted contributions
│   └── postman/                    # Postman collection (if available)
│
├── exp/                            # Experimental / scratch files
│   ├── exp.dynamic.prop.js
│   └── test.user.js
│
├── env/                            # Environment files (gitignored)
│   └── dev.env                     # Development environment variables
│
└── dist/                           # Compiled output (gitignored)
```

---

## Architecture Overview

The application follows a **layered MVC-ish architecture** where:

```
Request → Router → Middleware(s) → Controller → Model → Response/View
```

1. **Routers** (`router/`) map HTTP methods & paths to middleware chains and controller handlers.
2. **Middlewares** (`middlewares/`) handle cross-cutting concerns like authentication (`protect`), authorization (`role`), and file processing.
3. **Controllers** (`controllers/`) contain the business logic for handling requests, interacting with models, and returning responses.
4. **Models** (`models/`) define Mongoose schemas and encapsulate database interactions.
5. **Services** (`services/`) are being introduced in v2 to decouple business logic from controllers, making the code more testable.
6. **Utils** (`utils/`) provide shared helpers (JWT, DB connection, error handling, file uploads).

### Key Design Decisions

- **Papers stored as binary buffers** in MongoDB (`paper.buffer`) rather than on disk— this simplifies deployment but increases DB size.
- **Dual API versions**: v1 serves HTML via EJS templates (traditional web app), v2 provides a clean JSON API (for clients/mobile apps).
- **Path aliases**: `@/*` maps to the project root via `tsconfig.json` paths + `tsc-alias` at build time, keeping imports clean.

---

## Application Entry Point (`app.ts`)

The `app.ts` file bootstraps the entire application:

1. **View engine setup** — EJS with `ejs-mate` for layouts.
2. **Middleware stack** (in order):
   - `express-session` with MongoDB store
   - `connect-flash` for flash messages
   - `morgan` for HTTP request logging
   - Static file serving (`public/` and Bootstrap from `node_modules`)
   - Body parsers (`urlencoded`, `json`)
   - `method-override` for PUT/DELETE from HTML forms
   - `cookie-parser` with signed cookies
   - **Global user resolution** — every request resolves the logged-in user into `res.locals.user` and flash messages into `res.locals.success` / `res.locals.error`
3. **Route mounting**:
   - `/api/v1` → admin, user, auth, paper routers
   - `/api/v2` → v2 auth, v2 paper routers
4. **Landing page** (`/`) — redirects authenticated users to papers, others see the landing page.
5. **Health check** (`/status`) — returns `{ message: "Server is running" }`.
6. **Catch-all** — any unmatched route throws a 404 `AppError`.
7. **Global error handler** — renders an error page, with special handling for 415, MulterError, and AggregateError.
8. **Server boot** — connects to MongoDB, then starts listening.

---

## API Versioning

### v1 — Server-Rendered (EJS)

All v1 routes are under `/api/v1` and render EJS views. Authentication is via **signed cookies**.

| Method     | Route                  | Auth       | Role  | Description                         |
| ---------- | ---------------------- | ---------- | ----- | ----------------------------------- |
| `GET`      | `/register`            | —          | —     | Render registration page            |
| `POST`     | `/register`            | —          | —     | Register a new user                 |
| `GET`      | `/login`               | —          | —     | Render login page                   |
| `POST`     | `/login`               | —          | —     | Authenticate user                   |
| `GET`      | `/logout`              | ✅ protect | —     | Log out, clear cookie               |
| `GET`      | `/vqbank`              | ✅ protect | —     | Render vqbank dashboard             |
| `GET`      | `/papers`              | ✅ protect | —     | List all papers                     |
| `GET`      | `/upload`              | ✅ protect | —     | Render upload form                  |
| `POST`     | `/upload`              | ✅ protect | Admin | Upload a paper (multipart)          |
| `GET`      | `/paper/view/:paperId` | ✅ protect | —     | View/download a paper (inline)      |
| `GET`      | `/paper/suggestions`   | ✅ protect | —     | Search suggestions (JSON response)  |
| `GET/POST` | `/paper/sort`          | ✅ protect | —     | Filter papers by programme/semester |
| `GET`      | `/paper/edit/:id`      | ✅ protect | Admin | Render edit form                    |
| `PUT`      | `/paper/edit/:id`      | ✅ protect | Admin | Update paper                        |
| `DELETE`   | `/paper/delete/:id`    | ✅ protect | Admin | Delete paper                        |
| `GET`      | `/users`               | ✅ protect | Admin | List all users                      |
| `GET`      | `/admin`               | ✅ protect | Admin | Admin dashboard                     |

### v2 — JSON REST API

All v2 routes are under `/api/v2` and return JSON. Authentication is via **Bearer tokens** in the `Authorization` header.

#### Auth Routes

| Method | Route        | Auth         | Role | Description                          |
| ------ | ------------ | ------------ | ---- | ------------------------------------ |
| `GET`  | `/register`  | —            | —    | Returns a placeholder message        |
| `POST` | `/register`  | —            | —    | Register user, returns token in JSON |
| `POST` | `/login`     | —            | —    | Login, returns token in JSON         |
| `GET`  | `/logout`    | ✅ v2Protect | —    | Logout current session               |
| `GET`  | `/logoutAll` | ✅ v2Protect | —    | Logout all sessions                  |

#### Paper Routes

| Method   | Route                  | Auth         | Role  | Description                                        |
| -------- | ---------------------- | ------------ | ----- | -------------------------------------------------- |
| `POST`   | `/upload`              | ✅ v2Protect | Admin | Upload paper (multipart, with validation)          |
| `GET`    | `/papers`              | —            | —     | List all papers (paginated, filterable via query)  |
| `GET`    | `/paper/suggestions`   | ✅ v2Protect | —     | Search suggestions by course title                 |
| `POST`   | `/paper/sort`          | ✅ v2Protect | —     | Filter papers by programme/semester/assessmentType |
| `GET`    | `/paper/view/:paperId` | ✅ v2Protect | —     | View/stream paper inline (increments view count)   |
| `GET`    | `/paper/download`      | ✅ v2Protect | —     | Download paper by `paperId` query param            |
| `GET`    | `/paper/:paperId`      | ✅ v2Protect | —     | Get a single paper's metadata by ID                |
| `PUT`    | `/paper/edit/:id`      | ✅ v2Protect | Admin | Update paper metadata and/or file                  |
| `DELETE` | `/paper/delete/:id`    | ✅ v2Protect | Admin | Delete a paper                                     |

#### Admin & User Routes

| Method | Route           | Auth         | Role  | Description                                  |
| ------ | --------------- | ------------ | ----- | -------------------------------------------- |
| `GET`  | `/me`           | ✅ v2Protect | —     | Get current authenticated user's profile     |
| `GET`  | `/admin`        | ✅ v2Protect | Admin | Admin dashboard stats (users, papers, views) |
| `GET`  | `/users`        | ✅ v2Protect | Admin | List all users (paginated)                   |
| `GET`  | `/user/:userId` | ✅ v2Protect | Admin | Get a single user's profile by ID            |

---

## Data Models

### User Model

**File:** `models/user.model.ts`

| Field             | Type                  | Details                                          |
| ----------------- | --------------------- | ------------------------------------------------ |
| `email`           | `String`              | Required, unique, trimmed, lowercase             |
| `verified`        | `Boolean`             | Default: `false`                                 |
| `password`        | `String`              | Bcrypt-hashed on save (cost factor 8)            |
| `role`            | `String` (enum)       | `ROLE_USER` (default) or `ROLE_ADMIN`            |
| `otp`             | `String`              | Bcrypt-hashed on save                            |
| `purchasedPapers` | `[ObjectId]` → Paper  | References to purchased papers                   |
| `tokens`          | `[{ token: String }]` | Stored JWT tokens (for v2 multi-session support) |
| `createdAt`       | `Date`                | Auto (timestamps)                                |
| `updatedAt`       | `Date`                | Auto (timestamps)                                |

**Instance methods:**

- `checkPassword(password)` — compares plaintext against bcrypt hash
- `checkOTP(otp)` — compares OTP against bcrypt hash

**Virtual:** `papers` — populates papers authored by the user.

### Paper Model

**File:** `models/paper.model.ts`

| Field            | Type              | Details                                                                     |
| ---------------- | ----------------- | --------------------------------------------------------------------------- |
| `fieldname`      | `String`          | Multer field name                                                           |
| `originalname`   | `String`          | Required — original filename                                                |
| `encoding`       | `String`          | File encoding                                                               |
| `mimetype`       | `String`          | MIME type of the file                                                       |
| `buffer`         | `Buffer`          | Required — raw file binary data                                             |
| `size`           | `Number`          | Required — file size in bytes                                               |
| `user`           | `ObjectId` → User | Required — uploader reference                                               |
| `views`          | `Number`          | Default: `0` — view counter                                                 |
| `semester`       | `String`          | Required — `fall-sem`, `winter-sem`, `summer-sem`, `other`                  |
| `assessmentType` | `String`          | Required — `cat-1`, `cat-2`, `mid-term`, `fat`, `re-fat`, `re-cat`, `other` |
| `courseTitle`    | `String`          | Required — max 75 chars enforced in controller                              |
| `programmeName`  | `String`          | Required — `mca`, `btech`, `mtech`, `msc`, `other`                          |
| `visibility`     | `Boolean`         | Default: `true`                                                             |
| `createdAt`      | `Date`            | Auto (timestamps)                                                           |
| `updatedAt`      | `Date`            | Auto (timestamps)                                                           |

### Transaction Model (Planned)

**File:** `models/transaction.model.ts`

Currently a placeholder (`// Todo`). Likely intended for Stripe payment tracking.

---

## Authentication & Authorization

### v1 Authentication (Cookie-Based)

**Flow:**

```
Register/Login → Server creates JWT (newToken) → Sets signed cookie `token`
    ↓
Subsequent requests → protect middleware reads signed cookie →
    verifyToken → User.findById → Attaches req.user & req.token →
    Next middleware/controller
    ↓
Logout → clearCookie('token')
```

- Tokens are signed cookies (using `SIGN_COOKIE` env var as the secret).
- The `protect` middleware reads `req.signedCookies.token`.
- On expired or invalid tokens, users are redirected to the login page with flash messages.

### v2 Authentication (Bearer Token)

**Flow:**

```
Register/Login → Server creates JWT → Pushes token to user.tokens array →
    Returns token in JSON response
    ↓
Subsequent requests → v2Protect reads Authorization: Bearer <token> →
    verifyToken → User.findOne({ _id, 'tokens.token': token }) →
    Attaches req.user & req.token → Next
    ↓
Logout → Removes token from user.tokens array
LogoutAll → Clears entire user.tokens array
```

- Tokens are sent in the `Authorization: Bearer <token>` header.
- Multi-session support: each login pushes a new token, and individual sessions can be revoked.
- Expired tokens are automatically cleaned from the user's token array.

### Role-Based Access Control

Two roles exist: `ROLE_USER` and `ROLE_ADMIN`.

The `checkRole(...roles)` middleware (both v1 and v2 variants) checks `req.user.role` against a list of allowed roles. Admin-only operations include paper upload, edit, delete, and user management.

---

## Middleware Deep Dive

| Middleware             | Version | Purpose                                                               |
| ---------------------- | ------- | --------------------------------------------------------------------- |
| `protect`              | v1      | Validates signed cookie JWT, attaches `req.user`                      |
| `role.checkRole()`     | v1      | Checks `req.user.role` against allowed roles (redirects on failure)   |
| `genDownloadFile`      | v1      | Streams paper buffer to disk and sends as download (via `req.params`) |
| `v2Protect`            | v2      | Validates Bearer token JWT, matches against stored tokens             |
| `v2Role.v2CheckRole()` | v2      | Checks role (returns 401 JSON on failure)                             |
| `v2GenDownloadFile`    | v2      | Same as v1 download but reads `paperId` from `req.query`              |

---

## Utilities

| Utility                    | File                                             | Description                                                                                          |
| -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `connectDB`                | `utils/connectDB.ts`                             | Connects to MongoDB using `MONGODB_URI` env var                                                      |
| `newToken` / `verifyToken` | `utils/jwt.ts`                                   | Creates and verifies JWTs using `JWT_SECRET` & `JWT_EXP`                                             |
| `getLoggedInUser`          | `utils/getLoggedInUser.ts`                       | Resolves the current user from a signed cookie (used globally in `app.ts` for `res.locals.user`)     |
| `multer config`            | `utils/multer.ts`                                | Memory storage, 5 MB limit, allows: `pdf`, `doc`, `docx`, `txt`, `zip`, `pptx`, `jpg`, `jpeg`, `png` |
| `AppError`                 | `utils/server-error-handling/AppError.ts`        | Custom Error subclass with a `statusCode` property                                                   |
| `catchAsync`               | `utils/server-error-handling/catchAsyncError.ts` | HOF that wraps async route handlers and forwards errors to `next()`                                  |

---

## Views & Templating

The app uses **EJS** with **ejs-mate** for layout support.

- **Layout:** `views/layouts/boilerplate.ejs` — base HTML skeleton with Bootstrap 5 CDN, global CSS, navbar, flash messages, and footer.
- **Partials:** `views/partials/` — reusable components (`navbar`, `footer`, `flash`).
- Individual pages use `<% layout('layouts/boilerplate') %>` to inherit the base layout.

### Key Pages

| View                     | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `landing.ejs`            | Public landing page                      |
| `auth/user/login.ejs`    | User login form                          |
| `auth/user/register.ejs` | User registration form                   |
| `vqbank/index.ejs`       | Main papers listing dashboard            |
| `vqbank/upload.ejs`      | Paper upload/edit form (reused for both) |
| `vqbank/view.ejs`        | Paper viewer                             |
| `admin/index.ejs`        | Admin dashboard                          |
| `admin/users.ejs`        | User management table                    |
| `error.ejs`              | Generic error page                       |

---

## Static Assets

Served from `public/` at the root URL path:

- `/css/global.css` — Global styles
- `/css/landing.css` — Landing page specific styles
- `/js/suggestions.js` — Client-side search/autocomplete for papers
- `/js/toggleShowPassword.js` — Password visibility toggle
- `/js/landing.js` — Landing page interactions
- `/assets/favicons/` — All favicon variants + `site.webmanifest`
- `/assets/svg/` — SVG assets (Google logo, etc.)

Bootstrap's JS/CSS is also served statically from `node_modules/bootstrap/dist`.

---

## Type Declarations

### `types/express.d.ts`

Augments the Express `Request` interface globally:

```typescript
interface Request {
	user?: IUser | null;
	token?: string;
}
```

This allows `req.user` and `req.token` to be used throughout the app after the `protect` middleware attaches them.

### `types/ejs-mate.d.ts`

Ambient module declaration (`declare module 'ejs-mate'`) since `ejs-mate` doesn't ship its own types.

---

## Configuration

### TypeScript Configuration

**File:** `tsconfig.json`

- **Target:** ES2022
- **Module system:** NodeNext (ESM)
- **Path alias:** `@/*` → `./*` (resolved at build time by `tsc-alias`)
- **Strict mode:** enabled
- **Output:** `./dist`

### Session Configuration

**File:** `configs/sessionConfig.ts`

- Secret: `SIGN_COOKIE` env var
- Store: MongoDB via `connect-mongo`
- Cookie: `httpOnly`, 7-day expiry
- Touch interval: 24 hours (reduces session store writes)

### Environment Variables

Create `env/dev.env` (gitignored) with:

```sh
PORT=3000
JWT_SECRET=<your-secret>
JWT_EXP=1d
MONGODB_URI=mongodb://localhost:27017/vqbank
SIGN_COOKIE=<your-cookie-secret>
```

For production, create `env/prod.env` with the same keys pointing to production values.

---

## Scripts & Commands

| Command          | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| `npm run dev`    | Starts dev server with `tsx watch` + dev env variables                          |
| `npm run build`  | Compiles TS → JS, resolves path aliases, copies `public/` & `views/` to `dist/` |
| `npm start`      | Runs the compiled app from `dist/app.js`                                        |
| `npm run prod`   | Runs compiled app with production env variables                                 |
| `npm run lint`   | Runs ESLint with auto-fix                                                       |
| `npm run format` | Runs Prettier to format all files                                               |

---

## Linting & Formatting

### ESLint (`eslint.config.js`)

- Flat config format (ESLint 9)
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `prettier` (runs Prettier as an ESLint rule)
- Key rules:
  - `@typescript-eslint/no-explicit-any`: **error** — no `any` allowed
  - `@typescript-eslint/no-non-null-assertion`: **error** — no `!` assertions
  - `@typescript-eslint/no-unused-vars`: **warn** — except variables starting with `_`
- Ignored directories: `dist/`, `node_modules/`, `exp/`, `public/`

### Prettier (`.prettierrc`)

```json
{
	"semi": true,
	"singleQuote": true,
	"tabWidth": 2,
	"useTabs": true,
	"printWidth": 80,
	"trailingComma": "es5"
}
```

---

## Testing

Tests use the **Bun test runner** (`bun:test` module) and are located in `tests/`:

```
tests/
├── fixtures/        # Reusable test data factories (paper, user fixtures)
├── helpers/         # Test utilities (mock Express req/res, injection helpers)
├── integration/     # Integration tests (e.g., v2PaperRoutes.test.ts)
└── unit/            # Unit tests (e.g., paperV2Controller.test.ts, paperV2Service.test.ts)
```

### Running Tests

```sh
bun test
```

### Writing Tests

- Use factories from `tests/fixtures/` to create test data.
- Use `makeRes()` from `tests/helpers/mockExpress.ts` to mock Express response objects.
- Controllers and services should be testable in isolation by injecting mock dependencies.

---

## Error Handling

The app uses a two-tier error handling approach:

### 1. `catchAsync` Wrapper

All async route handlers are wrapped with `catchAsync()`, which catches rejected promises and forwards them to Express's `next(err)`.

```typescript
export const myHandler = catchAsync(async (req, res) => {
	// If this throws, the error is forwarded to Express error handler
});
```

### 2. `AppError` Class

Throw `AppError` for known/expected errors with a specific HTTP status code:

```typescript
throw new AppError('Resource not found', 404);
```

### 3. Global Error Handler (`app.ts`)

The centralized error handler at the bottom of `app.ts`:

- Handles `AppError` (extracts `statusCode` and `message`)
- Handles generic `Error` instances
- Handles objects with a `statusCode` property (for third-party errors)
- Special cases: redirects for `415`, `MulterError`, and `AggregateError`
- Default: renders the `error.ejs` view

---

## Conventions & Best Practices

1. **Versioned code** — All routers, controllers, and middlewares are namespaced under `v1/` or `v2/` directories.
2. **Path aliases** — Use `@/` instead of relative paths (e.g., `import User from '@/models/user.model.js'`).
3. **ESM imports** — Always use `.js` extension in imports (required by NodeNext module resolution, even for `.ts` files).
4. **No `any`** — The ESLint config enforces `no-explicit-any` as an error. Use proper types.
5. **Async error handling** — Always wrap async handlers with `catchAsync`.
6. **Flash messages** — Use `req.flash('success', ...)` or `req.flash('error', ...)` for v1 user feedback.
7. **Validation** — Use `validator.js` for input validation in controllers (email format, password length, etc.).
8. **File naming** — Use dot-separated names: `user.auth.controller.ts`, `paper.v2.router.ts`.
9. **Separation of concerns** — v2 is moving towards a service layer pattern (`services/`) to improve testability.

---

## Contributing

Before contributing:

1. Read the [Code of Conduct](./code-of-conduct.md)
2. Review the [Contributing Guidelines](./contributing/contributing.md) and [types of contributions](./contributing/types-of-contribution.md)
3. Discuss changes via a GitHub issue before starting work
4. Follow the linting and formatting rules (`npm run lint` && `npm run format`)
5. Write tests for new functionality, especially in the v2 API layer
6. Ensure the build passes: `npm run build`
