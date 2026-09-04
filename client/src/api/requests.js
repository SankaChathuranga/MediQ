// src/api/requests.js — Patient Requests API layer
// All functions use the shared apiClient so base URL is env-configured.
// Returns response.data (the full { success, data } envelope) —
// components destructure .data from the result.

import apiClient from './client';

/**
 * List all patient requests.
 * @param {{ medicineName?: string, area?: string, status?: string }} params
 */
export async function getRequests(params = {}) {
  const response = await apiClient.get('/api/requests', { params });
  return response.data;
}

/**
 * Fetch a single request by ID, including matchedPharmacies.
 * @param {number} id
 */
export async function getRequestById(id) {
  const response = await apiClient.get(`/api/requests/${id}`);
  return response.data;
}

/**
 * Create a new patient medicine request.
 * @param {{ patientContact: string, medicineId: number, area: string, urgency: string }} data
 */
export async function createRequest(data) {
  // Convert camelCase → snake_case for the backend
  const payload = {
    patient_contact: data.patientContact,
    medicine_id: Number(data.medicineId),
    area: data.area,
    urgency: data.urgency,
  };
  const response = await apiClient.post('/api/requests', payload);
  return response.data;
}

/**
 * Update a request's status.
 * @param {number} id
 * @param {'open' | 'fulfilled'} status
 */
export async function updateRequest(id, status) {
  const response = await apiClient.put(`/api/requests/${id}`, { status });
  return response.data;
}

/**
 * Delete a patient request permanently.
 * @param {number} id
 */
export async function deleteRequest(id) {
  await apiClient.delete(`/api/requests/${id}`);
}

/**
 * Fetch the full medicines list — used to populate the medicine dropdown in the form.
 */
export async function getMedicines() {
  const response = await apiClient.get('/api/medicines');
  return response.data;
}
