/**
 * routes/requests.js — Patient Requests + Matching module
 * Owner: Member 4 (repo owner)
 *
 * All routes return the CLAUDE.md §6 response shape:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { message, field? } }
 *
 * Matching: GET /:id includes matchedPharmacies — pharmacies that have the
 * requested medicine in stock in the same area as the request.
 */

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { validate } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

/**
 * Schema for creating a new patient request.
 * patient_contact: non-empty, basic phone/email format check.
 * medicine_id: positive integer FK.
 * area: non-empty string.
 * urgency: enum — low | medium | high.
 * status defaults to "open" if omitted.
 */
const RequestCreateSchema = z.object({
  patient_contact: z
    .string()
    .min(1, 'Contact is required')
    .regex(
      /^(\+?[\d\s\-()]{7,20}|[^\s@]+@[^\s@]+\.[^\s@]+)$/,
      'Enter a valid phone number or email address'
    ),
  medicine_id: z
    .number({ invalid_type_error: 'Medicine is required' })
    .int()
    .min(1, 'Medicine is required'),
  area: z.string().min(1, 'Area is required').max(100),
  urgency: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Urgency must be low, medium, or high' }),
  }),
  status: z.enum(['open', 'fulfilled']).optional().default('open'),
});

/**
 * Schema for updating a request — only status is updatable via PUT.
 */
const RequestUpdateSchema = z.object({
  status: z.enum(['open', 'fulfilled'], {
    errorMap: () => ({ message: 'Status must be open or fulfilled' }),
  }),
});

// ─── DTO helpers ──────────────────────────────────────────────────────────────

/** Shape a Request Prisma object into the camelCase DTO the frontend expects. */
function formatRequest(r) {
  return {
    id: r.id,
    patientContact: r.patient_contact,
    medicineId: r.medicine_id,
    medicineName: r.medicine?.name ?? null,
    area: r.area,
    urgency: r.urgency,
    status: r.status,
    createdAt: r.created_at,
  };
}

/** Shape a matched Stock row into a pharmacy summary DTO. */
function formatMatch(stock) {
  return {
    stockId: stock.id,
    pharmacyId: stock.pharmacy.id,
    pharmacyName: stock.pharmacy.name,
    area: stock.pharmacy.area,
    contact: stock.pharmacy.contact,
    hours: stock.pharmacy.hours,
    quantity: stock.quantity,
    price: stock.price,
    lastUpdated: stock.last_updated,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/requests
 * List all patient requests.
 * Optional query params:
 *   ?medicineName=  — case-insensitive contains search on medicine.name
 *   ?area=          — case-insensitive exact match on request.area
 *   ?status=        — filter by status (open | fulfilled)
 */
router.get('/', async (req, res) => {
  try {
    const { medicineName, area, status } = req.query;

    const where = {};

    if (medicineName) {
      where.medicine = {
        name: { contains: medicineName, mode: 'insensitive' },
      };
    }

    if (area) {
      where.area = { contains: area, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const requests = await prisma.request.findMany({
      where,
      include: { medicine: true },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ success: true, data: requests.map(formatRequest) });
  } catch (err) {
    console.error('GET /api/requests error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch requests' } });
  }
});

/**
 * GET /api/requests/:id
 * Return a single request DTO plus matchedPharmacies:
 * pharmacies that have quantity > 0 for this medicine in this area.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid request ID' } });
    }

    const request = await prisma.request.findUnique({
      where: { id },
      include: { medicine: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, error: { message: 'Request not found' } });
    }

    // ── Matching: find pharmacies with this medicine in the same area ──
    const matchedStock = await prisma.stock.findMany({
      where: {
        medicine_id: request.medicine_id,
        quantity: { gt: 0 },
        pharmacy: {
          area: { contains: request.area, mode: 'insensitive' },
        },
      },
      include: { pharmacy: true },
      orderBy: { quantity: 'desc' },
    });

    return res.json({
      success: true,
      data: {
        ...formatRequest(request),
        matchedPharmacies: matchedStock.map(formatMatch),
      },
    });
  } catch (err) {
    console.error('GET /api/requests/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch request' } });
  }
});

/**
 * POST /api/requests
 * Create a new patient medicine request.
 * Validates that the referenced medicine_id exists.
 */
router.post('/', validate(RequestCreateSchema), async (req, res) => {
  try {
    const { patient_contact, medicine_id, area, urgency, status } = req.body;

    // Verify the medicine exists
    const medicine = await prisma.medicine.findUnique({ where: { id: medicine_id } });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: { message: 'Medicine not found', field: 'medicine_id' },
      });
    }

    const request = await prisma.request.create({
      data: { patient_contact, medicine_id, area, urgency, status },
      include: { medicine: true },
    });

    return res.status(201).json({ success: true, data: formatRequest(request) });
  } catch (err) {
    console.error('POST /api/requests error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create request' } });
  }
});

/**
 * PUT /api/requests/:id
 * Update the status of a request (e.g. open → fulfilled).
 */
router.put('/:id', validate(RequestUpdateSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid request ID' } });
    }

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Request not found' } });
    }

    const updated = await prisma.request.update({
      where: { id },
      data: { status: req.body.status },
      include: { medicine: true },
    });

    return res.json({ success: true, data: formatRequest(updated) });
  } catch (err) {
    console.error('PUT /api/requests/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to update request' } });
  }
});

/**
 * DELETE /api/requests/:id
 * Permanently delete a patient request.
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid request ID' } });
    }

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Request not found' } });
    }

    await prisma.request.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/requests/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to delete request' } });
  }
});

module.exports = router;
