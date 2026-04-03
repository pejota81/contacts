'use strict';

require('dotenv').config();

const express        = require('express');
const https          = require('https');
const session        = require('express-session');
const passport       = require('passport');
const flash          = require('connect-flash');
const path           = require('path');

const LinkedInStrategy  = require('passport-linkedin-oauth2').Strategy;
const FacebookStrategy  = require('passport-facebook').Strategy;
const OAuth2Strategy    = require('passport-oauth2');

const authRoutes     = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');

const app = express();

// ─── View engine ─────────────────────────────────────────────────────────────

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ─── Static assets ───────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Body parser ─────────────────────────────────────────────────────────────

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ─── Session ─────────────────────────────────────────────────────────────────

app.use(session({
  secret:            process.env.SESSION_SECRET || 'contacts-dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}));

// ─── Flash messages ──────────────────────────────────────────────────────────

app.use(flash());

// ─── Passport initialisation ─────────────────────────────────────────────────

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ─── LinkedIn Strategy ───────────────────────────────────────────────────────

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy(
    {
      clientID:          process.env.LINKEDIN_CLIENT_ID,
      clientSecret:      process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL:       process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/auth/linkedin/callback',
      scope:             ['openid', 'profile', 'email'],
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  ));
}

// ─── Facebook Strategy ───────────────────────────────────────────────────────

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy(
    {
      clientID:          process.env.FACEBOOK_APP_ID,
      clientSecret:      process.env.FACEBOOK_APP_SECRET,
      callbackURL:       process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback',
      profileFields:     ['id', 'displayName', 'email', 'photos'],
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  ));
}

// ─── Instagram Strategy (Basic Display API) ──────────────────────────────────
//
// Instagram's Basic Display API uses standard OAuth 2.0.  The passport-oauth2
// strategy lets us configure it manually without a dedicated package.

if (process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET) {
  passport.use('instagram', new OAuth2Strategy(
    {
      authorizationURL: 'https://api.instagram.com/oauth/authorize',
      tokenURL:         'https://api.instagram.com/oauth/access_token',
      clientID:         process.env.INSTAGRAM_CLIENT_ID,
      clientSecret:     process.env.INSTAGRAM_CLIENT_SECRET,
      callbackURL:      process.env.INSTAGRAM_CALLBACK_URL || 'http://localhost:3000/auth/instagram/callback',
      scope:            ['user_profile', 'user_media'],
    },
    async (accessToken, refreshToken, profile, done) => {
      // Instagram's Basic Display API returns user info via a separate call.
      // The profile object from passport-oauth2 may be empty; we fetch it here.
      try {
        const userInfoUrl = `https://graph.instagram.com/me?fields=id,username,name&access_token=${accessToken}`;
        const data = await new Promise((resolve, reject) => {
          https.get(userInfoUrl, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
          }).on('error', reject);
        });
        const normalised = {
          id:          data.id,
          username:    data.username,
          displayName: data.name || data.username,
          photos:      [],
          _json:       data,
        };
        done(null, normalised);
      } catch (err) {
        done(err);
      }
    }
  ));
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  const messages = {
    success: req.flash('success'),
    error:   req.flash('error'),
  };
  res.render('index', {
    linkedinEnabled:  !!process.env.LINKEDIN_CLIENT_ID,
    facebookEnabled:  !!process.env.FACEBOOK_APP_ID,
    instagramEnabled: !!process.env.INSTAGRAM_CLIENT_ID,
    messages,
  });
});

app.use('/auth',     authRoutes);
app.use('/contacts', contactsRoutes);

// ─── Error handler ───────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: err.message });
});

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

/* istanbul ignore next */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Contacts app listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
