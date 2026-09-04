// src/api/stock.js — Stock module API call wrappers
// Uses the shared apiClient (axios instance) from src/api/client.js.
// All functions return the `data` field from the success response shape.

import apiClient from './client';

/**
 * Fetch all stock entries, with optional filters.
 * @param {{ pharmacyId?: number, medicineId?: number }} [filters]
 */
export async function getStock(filters = {}) {
  const params = {};
  if (filters.pharmacyId) params.pharmacyId = filters.pharmacyId;
  if (filters.medicineId) params.medicineId = filters.medicineId;
  const res = await apiClient.get('/api/stock', { params });
  return res.data.data; // array of stock DTOs
}

/**
 * Fetch a single stock entry by id.
 * @param {number} id
 */
export async function getStockById(id) {
  const res = await apiClient.get(`/api/stock/${id}`);
  return res.data.data;
}

/**
 * Create a new stock entry.
 * @param {{ pharmacyId: number, medicineId: number, quantity: number, price: number }} payload
 */
export async function createStock(payload) {
  const res = await apiClient.post('/api/stock', payload);
  return res.data.data;
}

/**
 * Update an existing stock entry.
 * @param {number} id
 * @param {{ pharmacyId: number, medicineId: number, quantity: number, price: number }} payload
 */
export async function updateStock(id, payload) {
  const res = await apiClient.put(`/api/stock/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a stock entry. Returns void (204 No Content).
 * @param {number} id
 */
export async function deleteStock(id) {
  await apiClient.delete(`/api/stock/${id}`);
}

/**
 * Fetch all medicines (for dropdowns).
 */
export async function getMedicines() {
  const res = await apiClient.get('/api/medicines');
  return res.data.data;
}

/**
 * Fetch all pharmacies (for dropdowns).
 */
export async function getPharmacies() {
  const res = await apiClient.get('/api/pharmacies');
  return res.data.data;
}
