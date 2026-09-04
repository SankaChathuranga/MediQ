/**
 * routes/medicines.js — Medicine Catalog module
 * Owner: Member 1
 *
 * All routes return the CLAUDE.md §6 response shape:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { message, field? } }
 *
 * Categories (lowercase/kebab-case enum):
 *   antibiotic | painkiller | chronic-care | antihistamine | other
 */

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { validate } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const CATEGORIES = ['antibiotic', 'painkiller', 'chronic-care', 'antihistamine', 'other'];

const MedicineSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  genericName: z.string().min(1, 'Generic name is required').max(100),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(', ')}` }),
  }),
  description: z.string().max(500).optional().nullable(),
});

// ─── DTO mapper — Prisma snake_case → camelCase JSON ──────────────────────────

function toDTO(medicine) {
  return {
    id:          medicine.id,
    name:        medicine.name,
    genericName: medicine.generic_name,
    category:    medicine.category,
    description: medicine.description ?? null,
  };
}

// ─── GET /api/medicines — list all, optional ?search= and ?category= ──────────

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name:         { contains: search, mode: 'insensitive' } },
        { generic_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && CATEGORIES.includes(category)) {
      where.category = category;
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, data: medicines.map(toDTO) });
  } catch (err) {
    console.error('GET /api/medicines error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch medicines' } });
  }
});

// ─── GET /api/medicines/:id — single medicine ─────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid medicine ID', field: 'id' } });
    }

    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) {
      return res.status(404).json({ success: false, error: { message: 'Medicine not found' } });
    }

    return res.status(200).json({ success: true, data: toDTO(medicine) });
  } catch (err) {
    console.error('GET /api/medicines/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch medicine' } });
  }
});

// ─── POST /api/medicines — create ─────────────────────────────────────────────

router.post('/', validate(MedicineSchema), async (req, res) => {
  try {
    const { name, genericName, category, description } = req.body;

    const medicine = await prisma.medicine.create({
      data: {
        name,
        generic_name: genericName,
        category,
        description: description ?? null,
      },
    });

    return res.status(201).json({ success: true, data: toDTO(medicine) });
  } catch (err) {
    console.error('POST /api/medicines error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create medicine' } });
  }
});

// ─── PUT /api/medicines/:id — update ──────────────────────────────────────────

router.put('/:id', validate(MedicineSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid medicine ID', field: 'id' } });
    }

    const { name, genericName, category, description } = req.body;

    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Medicine not found' } });
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        name,
        generic_name: genericName,
        category,
        description: description ?? null,
      },
    });

    return res.status(200).json({ success: true, data: toDTO(medicine) });
  } catch (err) {
    console.error('PUT /api/medicines/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to update medicine' } });
  }
});

// ─── DELETE /api/medicines/:id — delete ───────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid medicine ID', field: 'id' } });
    }

    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Medicine not found' } });
    }

    await prisma.medicine.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/medicines/:id error:', err);
    // FK constraint — stock/requests reference this medicine
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete this medicine — it is referenced by existing stock or patient requests.' },
      });
    }
    return res.status(500).json({ success: false, error: { message: 'Failed to delete medicine' } });
  }
});

module.exports = router;
