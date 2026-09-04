/**
 * routes/pharmacies.js — Pharmacy Directory module
 * Owner: Member 3
 *
 * All routes return the CLAUDE.md §6 response shape:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { message, field? } }
 *
 * API:
 *   GET    /api/pharmacies           — list all (filter: ?area=Colombo&district=Western)
 *   GET    /api/pharmacies/:id       — single pharmacy
 *   POST   /api/pharmacies           — create
 *   PUT    /api/pharmacies/:id       — update
 *   DELETE /api/pharmacies/:id       — delete
 */

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { validate } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Zod Schema ──────────────────────────────────────────────────────────────
// Contact: Sri Lankan format — +94 XX XXX XXXX or 0XX-XXX-XXXX / 07X XXXXXXX
const SRI_LANKA_PHONE_RE = /^(\+94|0)[\d\s\-]{8,13}$/;

const PharmacySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  address: z.string().min(5, 'Address must be at least 5 characters').max(250),
  area: z.string().min(2, 'Area is required').max(100),
  contact: z
    .string()
    .regex(SRI_LANKA_PHONE_RE, 'Contact must be a valid Sri Lankan phone number (e.g. +94 11 234 5678)'),
  hours: z.string().min(2, 'Opening hours are required').max(200),
});

// Partial schema for PUT — all fields optional, but if provided they must still validate
const PharmacyUpdateSchema = PharmacySchema.partial();

// ─── DTO Mapper ──────────────────────────────────────────────────────────────
// CLAUDE.md §6: never return raw Prisma objects; shape the response explicitly.
// Also converts snake_case DB fields → camelCase JSON per §5.
function toPharmacyDTO(pharmacy) {
  return {
    id: pharmacy.id,
    name: pharmacy.name,
    address: pharmacy.address,
    area: pharmacy.area,
    contact: pharmacy.contact,
    hours: pharmacy.hours,
  };
}

// ─── GET /api/pharmacies ─────────────────────────────────────────────────────
// Optional query params:
//   ?area=Colombo          — case-insensitive exact area match
//   ?district=Western      — future-proof alias, treated same as area
router.get('/', async (req, res) => {
  try {
    const { area, district } = req.query;
    const areaFilter = area || district;

    const where = areaFilter
      ? { area: { equals: areaFilter, mode: 'insensitive' } }
      : {};

    const pharmacies = await prisma.pharmacy.findMany({
      where,
      orderBy: [{ area: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: pharmacies.map(toPharmacyDTO) });
  } catch (err) {
    console.error('GET /api/pharmacies error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch pharmacies' } });
  }
});

// ─── GET /api/pharmacies/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid pharmacy ID', field: 'id' } });
    }

    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) {
      return res.status(404).json({ success: false, error: { message: 'Pharmacy not found' } });
    }

    res.json({ success: true, data: toPharmacyDTO(pharmacy) });
  } catch (err) {
    console.error('GET /api/pharmacies/:id error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch pharmacy' } });
  }
});

// ─── POST /api/pharmacies ────────────────────────────────────────────────────
router.post('/', validate(PharmacySchema), async (req, res) => {
  try {
    const { name, address, area, contact, hours } = req.body;

    const pharmacy = await prisma.pharmacy.create({
      data: { name, address, area, contact, hours },
    });

    res.status(201).json({ success: true, data: toPharmacyDTO(pharmacy) });
  } catch (err) {
    console.error('POST /api/pharmacies error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to create pharmacy' } });
  }
});

// ─── PUT /api/pharmacies/:id ─────────────────────────────────────────────────
router.put('/:id', validate(PharmacyUpdateSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid pharmacy ID', field: 'id' } });
    }

    const existing = await prisma.pharmacy.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Pharmacy not found' } });
    }

    const pharmacy = await prisma.pharmacy.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: toPharmacyDTO(pharmacy) });
  } catch (err) {
    console.error('PUT /api/pharmacies/:id error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to update pharmacy' } });
  }
});

// ─── DELETE /api/pharmacies/:id ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid pharmacy ID', field: 'id' } });
    }

    const existing = await prisma.pharmacy.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Pharmacy not found' } });
    }

    await prisma.pharmacy.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/pharmacies/:id error:', err);
    // Foreign key constraint — pharmacy still has stock entries
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete pharmacy — it still has stock entries. Remove stock first.' },
      });
    }
    res.status(500).json({ success: false, error: { message: 'Failed to delete pharmacy' } });
  }
});

module.exports = router;
