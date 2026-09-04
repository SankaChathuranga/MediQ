/**
 * routes/stock.js — Pharmacy Stock module
 * Full implementation with Prisma queries.
 *
 * All routes return the CLAUDE.md §6 response shape:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { message, field? } }
 */

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { validate } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const StockSchema = z.object({
  pharmacyId: z.number({ required_error: 'Pharmacy is required' }).int().positive(),
  medicineId: z.number({ required_error: 'Medicine is required' }).int().positive(),
  quantity:   z.number({ required_error: 'Quantity is required' }).int().min(0, 'Quantity cannot be negative'),
  price:      z.number({ required_error: 'Price is required' }).min(0, 'Price cannot be negative'),
});

// ─── DTO mapper ────────────────────────────────────────────────────────────────

function toDTO(stock) {
  return {
    id:          stock.id,
    pharmacyId:  stock.pharmacy_id,
    medicineId:  stock.medicine_id,
    quantity:    stock.quantity,
    price:       stock.price,
    lastUpdated: stock.last_updated,
    pharmacy:    stock.pharmacy
      ? { id: stock.pharmacy.id, name: stock.pharmacy.name, area: stock.pharmacy.area }
      : undefined,
    medicine:    stock.medicine
      ? { id: stock.medicine.id, name: stock.medicine.name, genericName: stock.medicine.generic_name, category: stock.medicine.category }
      : undefined,
  };
}

// ─── GET /api/stock — list all, optional ?pharmacyId= and ?medicineId= ─────────

router.get('/', async (req, res) => {
  try {
    const { pharmacyId, medicineId } = req.query;
    const where = {};
    if (pharmacyId) where.pharmacy_id = parseInt(pharmacyId, 10);
    if (medicineId) where.medicine_id = parseInt(medicineId, 10);

    const stock = await prisma.stock.findMany({
      where,
      include: {
        pharmacy: true,
        medicine: true,
      },
      orderBy: { last_updated: 'desc' },
    });

    return res.status(200).json({ success: true, data: stock.map(toDTO) });
  } catch (err) {
    console.error('GET /api/stock error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch stock entries' } });
  }
});

// ─── GET /api/stock/:id — single stock entry ───────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid stock ID', field: 'id' } });
    }

    const stock = await prisma.stock.findUnique({
      where: { id },
      include: { pharmacy: true, medicine: true },
    });

    if (!stock) {
      return res.status(404).json({ success: false, error: { message: 'Stock entry not found' } });
    }

    return res.status(200).json({ success: true, data: toDTO(stock) });
  } catch (err) {
    console.error('GET /api/stock/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch stock entry' } });
  }
});

// ─── POST /api/stock — create ─────────────────────────────────────────────────

router.post('/', validate(StockSchema), async (req, res) => {
  try {
    const { pharmacyId, medicineId, quantity, price } = req.body;

    // Verify pharmacy and medicine exist
    const [pharmacy, medicine] = await Promise.all([
      prisma.pharmacy.findUnique({ where: { id: pharmacyId } }),
      prisma.medicine.findUnique({ where: { id: medicineId } }),
    ]);

    if (!pharmacy) {
      return res.status(404).json({ success: false, error: { message: 'Pharmacy not found', field: 'pharmacyId' } });
    }
    if (!medicine) {
      return res.status(404).json({ success: false, error: { message: 'Medicine not found', field: 'medicineId' } });
    }

    const stock = await prisma.stock.create({
      data: {
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        quantity,
        price,
      },
      include: { pharmacy: true, medicine: true },
    });

    return res.status(201).json({ success: true, data: toDTO(stock) });
  } catch (err) {
    console.error('POST /api/stock error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create stock entry' } });
  }
});

// ─── PUT /api/stock/:id — update ──────────────────────────────────────────────

router.put('/:id', validate(StockSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid stock ID', field: 'id' } });
    }

    const existing = await prisma.stock.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Stock entry not found' } });
    }

    const { pharmacyId, medicineId, quantity, price } = req.body;

    const stock = await prisma.stock.update({
      where: { id },
      data: {
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        quantity,
        price,
      },
      include: { pharmacy: true, medicine: true },
    });

    return res.status(200).json({ success: true, data: toDTO(stock) });
  } catch (err) {
    console.error('PUT /api/stock/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to update stock entry' } });
  }
});

// ─── DELETE /api/stock/:id — delete ───────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid stock ID', field: 'id' } });
    }

    const existing = await prisma.stock.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Stock entry not found' } });
    }

    await prisma.stock.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/stock/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to delete stock entry' } });
  }
});

module.exports = router;
