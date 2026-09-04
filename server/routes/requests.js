/**
 * routes/requests.js — Patient Requests + Matching module
 * Owner: Member 4 (repo owner)
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

// GET /api/requests — list all patient requests (with optional filter by status/area)
router.get('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 4 to implement' } });
});

// GET /api/requests/:id — get a single request with matched stock info
router.get('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 4 to implement' } });
});

// POST /api/requests — create a new patient medicine request
router.post('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 4 to implement' } });
});

// PUT /api/requests/:id — update request status (e.g. open → fulfilled)
router.put('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 4 to implement' } });
});

// DELETE /api/requests/:id — delete a request
router.delete('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 4 to implement' } });
});

module.exports = router;
