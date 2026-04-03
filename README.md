# Contacts App

A Node.js web application that connects to **LinkedIn**, **Facebook**, and **Instagram** via OAuth 2.0 and imports profile data as contacts into a local **SQLite** database.

---

## Features

| Feature | Details |
|---|---|
| **LinkedIn import** | Authenticate with LinkedIn and import name, email, and profile photo |
| **Facebook import** | Authenticate with Facebook and import name, email, and profile photo |
| **Instagram import** | Authenticate with Instagram (Basic Display API) and import username and account details |
| **Contact list** | View, filter by platform, and delete stored contacts |
| **Persistent storage** | All contacts are stored in a SQLite database |

---

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: [Express](https://expressjs.com/)
- **Authentication**: [Passport.js](https://www.passportjs.org/) with `passport-linkedin-oauth2`, `passport-facebook`, and `passport-oauth2`
- **Database**: [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Views**: [EJS](https://ejs.co/) templates

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone https://github.com/<your-username>/contacts.git
cd contacts
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your OAuth credentials (see the [Platform Setup](#platform-setup) section below).

### 3. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Platform Setup

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps) and create a new app.
2. Under **Auth**, add the redirect URL: `http://localhost:3000/auth/linkedin/callback`
3. Request the **openid**, **profile**, and **email** OAuth 2.0 scopes.
4. Copy the **Client ID** and **Client Secret** into your `.env` file.

### Facebook

1. Go to [Facebook for Developers](https://developers.facebook.com/apps/) and create a new app.
2. Add the **Facebook Login** product and configure the valid OAuth redirect URI: `http://localhost:3000/auth/facebook/callback`
3. Ensure the **email** and **public_profile** permissions are enabled.
4. Copy the **App ID** and **App Secret** into your `.env` file.

### Instagram

1. Go to [Facebook for Developers](https://developers.facebook.com/apps/) and add the **Instagram Basic Display** product to your app.
2. Add a valid OAuth redirect URI: `http://localhost:3000/auth/instagram/callback`
3. Add Instagram test users under **Roles → Instagram Testers** (required in development).
4. Copy the **Instagram App ID** and **Instagram App Secret** into your `.env` file.

---

## Project Structure

```
contacts/
├── src/
│   ├── app.js               # Express application entry point
│   ├── db.js                # SQLite database layer
│   └── routes/
│       ├── auth.js          # OAuth callback routes (LinkedIn, Facebook, Instagram)
│       └── contacts.js      # Contact list and delete routes
├── views/
│   ├── index.ejs            # Landing / import page
│   ├── contacts.ejs         # Contacts list page
│   └── error.ejs            # Error page
├── public/
│   └── style.css            # Stylesheet
├── test/
│   └── db.test.js           # Database unit tests
├── .env.example             # Environment variable template
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `SESSION_SECRET` | Yes (prod) | Secret used to sign the session cookie |
| `DB_PATH` | No | Absolute path to the SQLite file (default: `contacts.db`) |
| `LINKEDIN_CLIENT_ID` | For LinkedIn | OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | For LinkedIn | OAuth client secret |
| `LINKEDIN_CALLBACK_URL` | No | Callback URL (default: `http://localhost:3000/auth/linkedin/callback`) |
| `FACEBOOK_APP_ID` | For Facebook | OAuth App ID |
| `FACEBOOK_APP_SECRET` | For Facebook | OAuth App Secret |
| `FACEBOOK_CALLBACK_URL` | No | Callback URL (default: `http://localhost:3000/auth/facebook/callback`) |
| `INSTAGRAM_CLIENT_ID` | For Instagram | OAuth client ID |
| `INSTAGRAM_CLIENT_SECRET` | For Instagram | OAuth client secret |
| `INSTAGRAM_CALLBACK_URL` | No | Callback URL (default: `http://localhost:3000/auth/instagram/callback`) |

---

## Running Tests

```bash
npm test
```

---

## API Notes

All three platforms use **OAuth 2.0**. The app imports the **authenticated user's own profile** as a contact. Full contact-list access requires additional partner-level API permissions from each platform:

- **LinkedIn**: Member network data requires [LinkedIn Marketing Solutions](https://business.linkedin.com/marketing-solutions/linkedin-api) partnership.
- **Facebook**: Friend data requires `user_friends` permission (review required).
- **Instagram**: Only the authenticated user's own data is accessible via the Basic Display API.

---

## License

MIT
