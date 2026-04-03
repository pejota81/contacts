'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

// ─── List contacts ───────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const source = req.query.source || '';
  const contacts = source ? db.listContactsBySource(source) : db.listContacts();
  const messages = {
    success: req.flash('success'),
    error:   req.flash('error'),
  };
  res.render('contacts', { contacts, source, messages });
});

// ─── Delete a contact ────────────────────────────────────────────────────────

router.post('/:id/delete', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    req.flash('error', 'Invalid contact id.');
    return res.redirect('/contacts');
  }
  db.deleteContact(id);
  req.flash('success', 'Contact deleted.');
  res.redirect('/contacts');
});

module.exports = router;
