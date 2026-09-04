/**
 * routes/pharmacies.js — Pharmacy Directory module
 * Owner: Member 3
 *
 * All routes return the CLAUDE.md §6 response shape:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { message, field? } }
 *
 * Stub routes — replace the 501 stubs with real Prisma queries.
 * Import the validate middleware for POST/PUT:
 *   const { validate } = require('../middleware/validate');
 */

const express = require('express');
const router = express.Router();
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// GET /api/pharmacies — list all pharmacies (with optional filter by area)
router.get('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 3 to implement' } });
});

// GET /api/pharmacies/:id — get a single pharmacy with its stock
router.get('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 3 to implement' } });
});

// POST /api/pharmacies — register a new pharmacy
router.post('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 3 to implement' } });
});

// PUT /api/pharmacies/:id — update pharmacy details
router.put('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 3 to implement' } });
});

// DELETE /api/pharmacies/:id — remove a pharmacy
router.delete('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 3 to implement' } });
});

module.exports = router;
