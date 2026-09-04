/**
 * routes/requests.js — Patient Requests + Matching module
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

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY_LEVELS = ['low', 'medium', 'high'];
const STATUS_VALUES  = ['open', 'fulfilled'];

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const RequestCreateSchema = z.object({
  patient_contact: z.string().min(1, 'Patient contact is required').max(100),
  medicine_id:     z.number({ required_error: 'Medicine is required' }).int().positive(),
  area:            z.string().min(1, 'Area is required').max(100),
  urgency:         z.enum(URGENCY_LEVELS, {
    errorMap: () => ({ message: `Urgency must be one of: ${URGENCY_LEVELS.join(', ')}` }),
  }),
});

const RequestUpdateSchema = z.object({
  status: z.enum(STATUS_VALUES, {
    errorMap: () => ({ message: `Status must be one of: ${STATUS_VALUES.join(', ')}` }),
  }),
});

// ─── DTO mapper ───────────────────────────────────────────────────────────────

function toDTO(req) {
  return {
    id:             req.id,
    patientContact: req.patient_contact,
    medicineId:     req.medicine_id,
    area:           req.area,
    urgency:        req.urgency,
    status:         req.status,
    createdAt:      req.created_at,
    medicine:       req.medicine
      ? {
          id:          req.medicine.id,
          name:        req.medicine.name,
          genericName: req.medicine.generic_name,
          category:    req.medicine.category,
        }
      : undefined,
    matchedPharmacies: req.matchedPharmacies ?? undefined,
  };
}

// ─── GET /api/requests — list all (with optional ?status= and ?area=) ─────────

router.get('/', async (req, res) => {
  try {
    const { status, area } = req.query;
    const where = {};

    if (status && STATUS_VALUES.includes(status)) where.status = status;
    if (area)   where.area = { contains: area, mode: 'insensitive' };

    const requests = await prisma.request.findMany({
      where,
      include: { medicine: true },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: requests.map(toDTO) });
  } catch (err) {
    console.error('GET /api/requests error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch requests' } });
  }
});

// ─── GET /api/requests/:id — single request with matched stock info ────────────

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid request ID', field: 'id' } });
    }

    const request = await prisma.request.findUnique({
      where: { id },
      include: { medicine: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, error: { message: 'Request not found' } });
    }

    // Find pharmacies that have this medicine in stock within the same area
    const matchedStock = await prisma.stock.findMany({
      where: {
        medicine_id: request.medicine_id,
        quantity:    { gt: 0 },
        pharmacy:    { area: { contains: request.area, mode: 'insensitive' } },
      },
      include: { pharmacy: true },
      orderBy:  { quantity: 'desc' },
    });

    const dto = toDTO(request);
    dto.matchedPharmacies = matchedStock.map((s) => ({
      pharmacyId:   s.pharmacy.id,
      pharmacyName: s.pharmacy.name,
      area:         s.pharmacy.area,
      contact:      s.pharmacy.contact,
      hours:        s.pharmacy.hours,
      quantity:     s.quantity,
      price:        s.price,
    }));

    return res.status(200).json({ success: true, data: dto });
  } catch (err) {
    console.error('GET /api/requests/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch request' } });
  }
});

// ─── POST /api/requests — create a new patient medicine request ────────────────

router.post('/', validate(RequestCreateSchema), async (req, res) => {
  try {
    const { patient_contact, medicine_id, area, urgency } = req.body;

    // Verify medicine exists
    const medicine = await prisma.medicine.findUnique({ where: { id: medicine_id } });
    if (!medicine) {
      return res.status(404).json({ success: false, error: { message: 'Medicine not found', field: 'medicine_id' } });
    }

    const request = await prisma.request.create({
      data: {
        patient_contact,
        medicine_id,
        area,
        urgency,
        status: 'open',
      },
      include: { medicine: true },
    });

    return res.status(201).json({ success: true, data: toDTO(request) });
  } catch (err) {
    console.error('POST /api/requests error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create request' } });
  }
});

// ─── PUT /api/requests/:id — update request status ────────────────────────────

router.put('/:id', validate(RequestUpdateSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid request ID', field: 'id' } });
    }

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Request not found' } });
    }

    const { status } = req.body;

    const request = await prisma.request.update({
      where: { id },
      data:  { status },
      include: { medicine: true },
    });

    return res.status(200).json({ success: true, data: toDTO(request) });
  } catch (err) {
    console.error('PUT /api/requests/:id error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to update request' } });
  }
});

// ─── DELETE /api/requests/:id — delete a request ─────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid request ID', field: 'id' } });
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
