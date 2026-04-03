'use strict';

const express = require('express');
const passport = require('passport');
const db = require('../db');

const router = express.Router();

// ─── LinkedIn ────────────────────────────────────────────────────────────────

router.get('/linkedin', passport.authenticate('linkedin', { scope: ['openid', 'profile', 'email'] }));

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/', failureFlash: true }),
  async (req, res) => {
    try {
      const profile = req.user;
      db.upsertContact({
        source:      'linkedin',
        external_id: profile.id,
        name:        profile.displayName || [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' '),
        email:       profile.emails?.[0]?.value || null,
        profile_url: profile.profileUrl || null,
        photo_url:   profile.photos?.[0]?.value || null,
        raw_data:    JSON.stringify(profile._json || profile),
      });
      req.flash('success', `LinkedIn contact imported: ${profile.displayName}`);
    } catch (err) {
      req.flash('error', `Failed to import LinkedIn contact: ${err.message}`);
    }
    res.redirect('/contacts');
  }
);

// ─── Facebook ────────────────────────────────────────────────────────────────

router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/', failureFlash: true }),
  async (req, res) => {
    try {
      const profile = req.user;
      db.upsertContact({
        source:      'facebook',
        external_id: profile.id,
        name:        profile.displayName || '',
        email:       profile.emails?.[0]?.value || null,
        profile_url: `https://www.facebook.com/${profile.id}`,
        photo_url:   profile.photos?.[0]?.value || null,
        raw_data:    JSON.stringify(profile._json || profile),
      });
      req.flash('success', `Facebook contact imported: ${profile.displayName}`);
    } catch (err) {
      req.flash('error', `Failed to import Facebook contact: ${err.message}`);
    }
    res.redirect('/contacts');
  }
);

// ─── Instagram ───────────────────────────────────────────────────────────────

router.get('/instagram', passport.authenticate('instagram'));

router.get(
  '/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/', failureFlash: true }),
  async (req, res) => {
    try {
      const profile = req.user;
      db.upsertContact({
        source:      'instagram',
        external_id: profile.id,
        name:        profile.displayName || profile.username || profile.id,
        email:       null,
        profile_url: `https://www.instagram.com/${profile.username || ''}`,
        photo_url:   profile.photos?.[0]?.value || null,
        raw_data:    JSON.stringify(profile._json || profile),
      });
      req.flash('success', `Instagram contact imported: ${profile.displayName || profile.username}`);
    } catch (err) {
      req.flash('error', `Failed to import Instagram contact: ${err.message}`);
    }
    res.redirect('/contacts');
  }
);

module.exports = router;
