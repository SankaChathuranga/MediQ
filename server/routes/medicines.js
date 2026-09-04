/**
 * routes/medicines.js — Medicine Catalog module
 * Owner: Member 1
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

// GET /api/medicines — list all medicines (with optional search/filter)
router.get('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 1 to implement' } });
});

// GET /api/medicines/:id — get a single medicine
router.get('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 1 to implement' } });
});

// POST /api/medicines — create a new medicine
router.post('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 1 to implement' } });
});

// PUT /api/medicines/:id — update an existing medicine
router.put('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 1 to implement' } });
});

// DELETE /api/medicines/:id — delete a medicine
router.delete('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 1 to implement' } });
});

module.exports = router;
