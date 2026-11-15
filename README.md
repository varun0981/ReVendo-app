# ReVendo

### Give Good Things a Second Life.

ReVendo is a responsive marketplace for buying and selling pre-loved products. It pairs a React storefront with an Express API and MongoDB, including seller listings, moderation, wishlists, orders, and an admin dashboard.

## Features

- Browse, search, filter, and sort active listings.
- Create listings with multiple images; edit, delete, and track listing status.
- Register and sign in with verified email/mobile flows, secure password hashing, and HTTP-only JWT session cookies.
- Manage profiles, wishlists, carts, orders, notifications, and seller reviews.
- Use demo cash on delivery or optional **Razorpay test mode**. Razorpay test credentials are server-only; no live payment keys or real charges are supported.
- Moderate products, users, orders, and reports through the admin dashboard.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Lucide, React Hot Toast |
| Backend | Node.js, Express, Mongoose, MongoDB, JWT, bcrypt |
| Security | Helmet, rate limits, validation, ownership checks, safe image uploads |

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- MongoDB Community Server

## Quick start

1. Install dependencies from the project root:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. Create the local server configuration:

   ```bash
   cp server/.env.example server/.env
   ```

   Set a private `JWT_SECRET` of at least 32 characters and an `ADMIN_PASSWORD` of 12–72 characters. Keep `server/.env` private and untracked.

3. Start MongoDB. For macOS with Homebrew:

   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community
   ```

4. Seed sample products and the administrator account:

   ```bash
   npm run seed
   ```

   Sign in to the admin account with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from your local `server/.env`.

5. Start the frontend and API:

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). The API runs at `http://localhost:5051`; check it with `GET /api/health`.

## Local verification modes

- **Email:** without SMTP settings, verification uses a development link printed by the server. No email is sent.
- **Mobile:** without Twilio settings, development OTP is `123456`. No SMS is sent.
- **Razorpay:** add a test key ID (`rzp_test_...`) and its test secret to `server/.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, then restart the API. Only `rzp_test_` keys are accepted, and the secret is never returned to the frontend. Razorpay checkout requires an internet connection.
- **Cash on delivery:** remains available as a local demo option and does not process a payment.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the frontend and API |
| `npm run dev:client` / `npm run dev:server` | Run one service |
| `npm run build` | Build the frontend |
| `npm run lint` | Lint frontend source |
| `npm test --prefix server` | Run backend tests |
| `npm run seed` | Seed products and the administrator |
| `npm run seed:products` / `npm run seed:admin` | Seed either separately |

## Project layout

```text
client/   React application, pages, components, and browser API client
server/   Express routes, controllers, models, middleware, services, and tests
```

The Vite development server proxies `/api` and `/uploads` to port `5051`. If you change the API port, set `PORT` and `VITE_API_PROXY_TARGET` consistently.

## Security and local data

- Secrets belong in local environment files, never in frontend variables or source control. `server/.env.example` contains placeholders only.
- Uploaded listing images are stored under `server/uploads/` and are excluded from Git.
- The default MongoDB URI is `mongodb://127.0.0.1:27017/revendo`; configure another local URI with `MONGO_URI`.
- Never use live payment credentials with this project.

## Troubleshooting

- **MongoDB connection error:** start MongoDB and check `MONGO_URI` in `server/.env`.
- **API startup error:** confirm `server/.env` exists, `JWT_SECRET` is set, and port `5051` is available.
- **Razorpay checkout unavailable:** configure both Razorpay test variables in `server/.env` and restart the API. Without them, demo cash on delivery remains usable.
- **Missing dependencies:** run the three install commands in Quick start.
