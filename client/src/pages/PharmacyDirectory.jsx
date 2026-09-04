// src/pages/PharmacyDirectory.jsx — Pharmacy Directory module
// Owner: Member 3
//
// Features:
//   • Filterable list by area/district
//   • Add pharmacy form (React Hook Form + Zod, using shared FormField)
//   • Inline edit form per card
//   • Delete via shared ConfirmDialog
//   • Loading skeleton, error state, empty state
//   • All styling via MUI theme tokens — no hardcoded colors (CLAUDE.md §4)

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';

import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

import FormField from '../components/shared/FormField';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import apiClient from '../api/client';

// ─── Zod Validation Schema (mirrors backend) ──────────────────────────────────
const SRI_LANKA_PHONE_RE = /^(\+94|0)[\d\s\-]{8,13}$/;

const pharmacySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  address: z.string().min(5, 'Address is required').max(250),
  area: z.string().min(2, 'Area is required').max(100),
  contact: z
    .string()
    .regex(SRI_LANKA_PHONE_RE, 'Enter a valid Sri Lankan number (e.g. +94 11 234 5678)'),
  hours: z.string().min(2, 'Opening hours are required').max(200),
});

// ─── Sri Lankan areas for the filter dropdown ─────────────────────────────────
const KNOWN_AREAS = [
  'Colombo', 'Galle', 'Jaffna', 'Kandy', 'Matara', 'Negombo',
  'Kurunegala', 'Anuradhapura', 'Badulla', 'Ratnapura',
];

// ─── PharmacyForm — shared add/edit form ─────────────────────────────────────
function PharmacyForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Save', isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(pharmacySchema),
    defaultValues: defaultValues || { name: '', address: '', area: '', contact: '', hours: '' },
  });

  // Reset when switching between add/edit targets
  useEffect(() => {
    reset(defaultValues || { name: '', address: '', area: '', contact: '', hours: '' });
  }, [defaultValues, reset]);

  return (
    <Box
      component="form"
      id="pharmacy-form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormField
            name="name"
            label="Pharmacy Name"
            register={register('name')}
            error={errors.name}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField
            name="contact"
            label="Contact Number"
            placeholder="+94 11 234 5678"
            register={register('contact')}
            error={errors.contact}
            helperText="Sri Lankan format"
          />
        </Grid>
        <Grid item xs={12}>
          <FormField
            name="address"
            label="Address"
            register={register('address')}
            error={errors.address}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField
            name="area"
            label="Area"
            select
            register={register('area')}
            error={errors.area}
            helperText="Used by Patient Requests to match availability"
          >
            {KNOWN_AREAS.map((a) => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </FormField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField
            name="hours"
            label="Opening Hours"
            placeholder="Mon–Sun 8am–9pm"
            register={register('hours')}
            error={errors.hours}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
        {onCancel && (
          <Button
            id="pharmacy-form-cancel-btn"
            variant="outlined"
            color="inherit"
            onClick={onCancel}
            disabled={isSubmitting}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
        )}
        <Button
          id="pharmacy-form-submit-btn"
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={<SaveIcon />}
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}

// ─── PharmacyCard ─────────────────────────────────────────────────────────────
function PharmacyCard({ pharmacy, onEdit, onDelete }) {
  return (
    <Card
      id={`pharmacy-card-${pharmacy.id}`}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Name + Area chip */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
          <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.3 }}>
            {pharmacy.name}
          </Typography>
          <Chip
            label={pharmacy.area}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {/* Address */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <PlaceIcon fontSize="small" sx={{ color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary">
            {pharmacy.address}
          </Typography>
        </Box>

        {/* Contact */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
          <Typography
            variant="body2"
            component="a"
            href={`tel:${pharmacy.contact}`}
            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {pharmacy.contact}
          </Typography>
        </Box>

        {/* Hours */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary">
            {pharmacy.hours}
          </Typography>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1, justifyContent: 'flex-end', gap: 0.5 }}>
        <IconButton
          id={`edit-pharmacy-${pharmacy.id}-btn`}
          size="small"
          color="primary"
          aria-label={`Edit ${pharmacy.name}`}
          onClick={() => onEdit(pharmacy)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          id={`delete-pharmacy-${pharmacy.id}-btn`}
          size="small"
          color="error"
          aria-label={`Delete ${pharmacy.name}`}
          onClick={() => onDelete(pharmacy)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Skeleton variant="text" width="70%" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="50%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ─── PharmacyDirectory Page ───────────────────────────────────────────────────
export default function PharmacyDirectory() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [areaFilter, setAreaFilter] = useState('');

  // Add form panel
  const [showAddForm, setShowAddForm] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit
  const [editTarget, setEditTarget] = useState(null); // pharmacy object being edited
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null); // pharmacy object to delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPharmacies = useCallback(async (area = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = area ? { area } : {};
      const res = await apiClient.get('/api/pharmacies', { params });
      setPharmacies(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPharmacies(areaFilter);
  }, [fetchPharmacies, areaFilter]);

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async (data) => {
    setAddSubmitting(true);
    try {
      await apiClient.post('/api/pharmacies', data);
      showSnack(`"${data.name}" added successfully`);
      setShowAddForm(false);
      fetchPharmacies(areaFilter);
    } catch (err) {
      showSnack(err.message, 'error');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async (data) => {
    setEditSubmitting(true);
    try {
      await apiClient.put(`/api/pharmacies/${editTarget.id}`, data);
      showSnack(`"${data.name}" updated successfully`);
      setEditTarget(null);
      fetchPharmacies(areaFilter);
    } catch (err) {
      showSnack(err.message, 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/api/pharmacies/${deleteTarget.id}`);
      showSnack(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchPharmacies(areaFilter);
    } catch (err) {
      showSnack(err.message, 'error');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  // Client-side search filter on top of area filter (name/address text search)
  const [searchText, setSearchText] = useState('');
  const visible = pharmacies.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box id="pharmacy-directory-page">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalPharmacyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={600} color="text.primary">
              Pharmacy Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? '…' : `${visible.length} ${visible.length === 1 ? 'pharmacy' : 'pharmacies'} found`}
            </Typography>
          </Box>
        </Box>
        <Button
          id="add-pharmacy-btn"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => { setShowAddForm((v) => !v); setEditTarget(null); }}
        >
          Add Pharmacy
        </Button>
      </Box>

      {/* ── Add Form Panel ────────────────────────────────────────────────── */}
      <Collapse in={showAddForm}>
        <Paper
          id="add-pharmacy-panel"
          elevation={0}
          sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'primary.light', borderRadius: 3, bgcolor: 'background.paper' }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Add New Pharmacy
          </Typography>
          <PharmacyForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            submitLabel="Add Pharmacy"
            isSubmitting={addSubmitting}
          />
        </Paper>
      </Collapse>

      {/* ── Edit Form Panel ───────────────────────────────────────────────── */}
      <Collapse in={!!editTarget}>
        {editTarget && (
          <Paper
            id="edit-pharmacy-panel"
            elevation={0}
            sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'secondary.main', borderRadius: 3, bgcolor: 'background.paper' }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Edit: {editTarget.name}
            </Typography>
            <PharmacyForm
              defaultValues={editTarget}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
              submitLabel="Save Changes"
              isSubmitting={editSubmitting}
            />
          </Paper>
        )}
      </Collapse>

      {/* ── Filters Row ───────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* Text search */}
        <TextField
          id="pharmacy-search-input"
          placeholder="Search by name or address…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="small"
          sx={{ minWidth: 260, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Area filter */}
        <TextField
          id="pharmacy-area-filter"
          select
          label="Filter by Area"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Areas</MenuItem>
          {KNOWN_AREAS.map((a) => (
            <MenuItem key={a} value={a}>{a}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        /* Error State */
        <Box
          id="pharmacy-error-state"
          sx={{ textAlign: 'center', py: 8 }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Failed to load pharmacies
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button variant="outlined" onClick={() => fetchPharmacies(areaFilter)}>
            Retry
          </Button>
        </Box>
      ) : visible.length === 0 ? (
        /* Empty State */
        <Box
          id="pharmacy-empty-state"
          sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}
        >
          <LocalPharmacyIcon sx={{ fontSize: 64, color: 'primary.light', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No pharmacies found
          </Typography>
          <Typography variant="body2">
            {areaFilter || searchText
              ? 'Try a different area or search term.'
              : 'Add the first pharmacy using the button above.'}
          </Typography>
        </Box>
      ) : (
        /* Pharmacy Grid */
        <Grid container spacing={3} id="pharmacy-list">
          {visible.map((pharmacy) => (
            <Grid item xs={12} sm={6} md={4} key={pharmacy.id}>
              <PharmacyCard
                pharmacy={pharmacy}
                onEdit={(p) => { setEditTarget(p); setShowAddForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onDelete={setDeleteTarget}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message={`This will permanently remove ${deleteTarget?.name} from the directory. This cannot be undone. Note: pharmacies with existing stock entries cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
