/**
 * routes/stock.js — Pharmacy Stock module
 * Owner: Member 2
 *
 * All routes return the CLAUDE.md §6 response shape:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { message, field? } }
 *
 * Naming: DB/Prisma fields are snake_case; API JSON payloads are camelCase (§5).
 */

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { validate } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Zod Schema ───────────────────────────────────────────────────────────────
// camelCase keys because the frontend sends camelCase JSON (CLAUDE.md §5)
const StockSchema = z.object({
  pharmacyId: z
    .number({ required_error: 'Pharmacy is required', invalid_type_error: 'pharmacyId must be a number' })
    .int()
    .positive('Pharmacy ID must be a positive integer'),
  medicineId: z
    .number({ required_error: 'Medicine is required', invalid_type_error: 'medicineId must be a number' })
    .int()
    .positive('Medicine ID must be a positive integer'),
  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .int()
    .min(0, 'Quantity must be 0 or greater'),
  price: z
    .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
});

// ─── DTO mapper (DB row → camelCase API shape) ────────────────────────────────
function toDto(s) {
  return {
    id:           s.id,
    pharmacyId:   s.pharmacy_id,
    medicineId:   s.medicine_id,
    pharmacyName: s.pharmacy?.name ?? null,
    medicineName: s.medicine?.name ?? null,
    quantity:     s.quantity,
    price:        s.price,
    lastUpdated:  s.last_updated,
  };
}

// ─── FK existence helpers ─────────────────────────────────────────────────────
async function checkPharmacyExists(pharmacyId, res) {
  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
  if (!pharmacy) {
    res.status(404).json({
      success: false,
      error: { message: `Pharmacy with id ${pharmacyId} not found`, field: 'pharmacyId' },
    });
    return false;
  }
  return true;
}

async function checkMedicineExists(medicineId, res) {
  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) {
    res.status(404).json({
      success: false,
      error: { message: `Medicine with id ${medicineId} not found`, field: 'medicineId' },
    });
    return false;
  }
  return true;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/stock
 * List all stock entries with pharmacy + medicine names joined.
 * Optional query params: ?pharmacyId=<int>  ?medicineId=<int>
 */
router.get('/', async (req, res) => {
  try {
    const where = {};
    if (req.query.pharmacyId) {
      const id = parseInt(req.query.pharmacyId, 10);
      if (!isNaN(id)) where.pharmacy_id = id;
    }
    if (req.query.medicineId) {
      const id = parseInt(req.query.medicineId, 10);
      if (!isNaN(id)) where.medicine_id = id;
    }

    const entries = await prisma.stock.findMany({
      where,
      include: { pharmacy: true, medicine: true },
      orderBy: { last_updated: 'desc' },
    });

    res.json({ success: true, data: entries.map(toDto) });
  } catch (err) {
    console.error('[GET /api/stock]', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stock entries' } });
  }
});

/**
 * GET /api/stock/:id
 * Get a single stock entry by id, with pharmacy + medicine names joined.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid id', field: 'id' } });
    }

    const entry = await prisma.stock.findUnique({
      where: { id },
      include: { pharmacy: true, medicine: true },
    });

    if (!entry) {
      return res.status(404).json({ success: false, error: { message: `Stock entry ${id} not found` } });
    }

    res.json({ success: true, data: toDto(entry) });
  } catch (err) {
    console.error('[GET /api/stock/:id]', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stock entry' } });
  }
});

/**
 * POST /api/stock
 * Create a new stock entry.
 * Body: { pharmacyId, medicineId, quantity, price }  (all camelCase)
 */
router.post('/', validate(StockSchema), async (req, res) => {
  try {
    const { pharmacyId, medicineId, quantity, price } = req.body;

    // FK existence checks
    if (!(await checkPharmacyExists(pharmacyId, res))) return;
    if (!(await checkMedicineExists(medicineId, res))) return;

    const entry = await prisma.stock.create({
      data: {
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        quantity,
        price,
      },
      include: { pharmacy: true, medicine: true },
    });

    res.status(201).json({ success: true, data: toDto(entry) });
  } catch (err) {
    console.error('[POST /api/stock]', err);
    res.status(500).json({ success: false, error: { message: 'Failed to create stock entry' } });
  }
});

/**
 * PUT /api/stock/:id
 * Update an existing stock entry (quantity, price, pharmacy, medicine).
 * Body: { pharmacyId, medicineId, quantity, price }
 */
router.put('/:id', validate(StockSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid id', field: 'id' } });
    }

    // Check entry exists
    const existing = await prisma.stock.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: `Stock entry ${id} not found` } });
    }

    const { pharmacyId, medicineId, quantity, price } = req.body;

    // FK existence checks
    if (!(await checkPharmacyExists(pharmacyId, res))) return;
    if (!(await checkMedicineExists(medicineId, res))) return;

    const updated = await prisma.stock.update({
      where: { id },
      data: {
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        quantity,
        price,
      },
      include: { pharmacy: true, medicine: true },
    });

    res.json({ success: true, data: toDto(updated) });
  } catch (err) {
    console.error('[PUT /api/stock/:id]', err);
    res.status(500).json({ success: false, error: { message: 'Failed to update stock entry' } });
  }
});

/**
 * DELETE /api/stock/:id
 * Delete a stock entry. Returns 204 No Content on success.
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid id', field: 'id' } });
    }

    const existing = await prisma.stock.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: `Stock entry ${id} not found` } });
    }

    await prisma.stock.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/stock/:id]', err);
    res.status(500).json({ success: false, error: { message: 'Failed to delete stock entry' } });
  }
});

module.exports = router;
