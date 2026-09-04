// src/pages/StockList.jsx — Pharmacy Stock module
// Owner: Member 2
//
// Uses ONLY shared components (StatusChip, ConfirmDialog, FormField) and
// MUI primitives from the shared theme. No new UI primitives introduced.

import React, { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import InventoryIcon from '@mui/icons-material/Inventory';
import UpdateIcon from '@mui/icons-material/Update';

import StatusChip from '../components/shared/StatusChip';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import FormField from '../components/shared/FormField';

import {
  getStock,
  createStock,
  updateStock,
  deleteStock,
  getMedicines,
  getPharmacies,
} from '../api/stock';

// ─── Zod schema (mirrors server-side; camelCase) ─────────────────────────────
const StockFormSchema = z.object({
  pharmacyId: z
    .number({ invalid_type_error: 'Pharmacy is required' })
    .int()
    .positive('Pharmacy is required'),
  medicineId: z
    .number({ invalid_type_error: 'Medicine is required' })
    .int()
    .positive('Medicine is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity must be 0 or greater'),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
});

// ─── Status helpers (CLAUDE.md §10) ─────────────────────────────────────────
function stockStatus(quantity) {
  if (quantity === 0) return { status: 'Out of Stock', variant: 'error' };
  if (quantity < 10)  return { status: 'Low Stock',   variant: 'warning' };
  return                     { status: 'In Stock',    variant: 'success' };
}

// ─── Relative time (no extra library) ────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = (new Date(dateStr) - Date.now()) / 1000; // negative = past
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60)     return rtf.format(Math.round(diff), 'second');
  if (abs < 3600)   return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400)  return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diff / 86400), 'day');
  return rtf.format(Math.round(diff / 604800), 'week');
}

// ─── Loading skeleton rows ────────────────────────────────────────────────────
function StockSkeleton() {
  return (
    <Stack spacing={2}>
      {[1, 2, 3, 4].map((n) => (
        <Skeleton key={n} variant="rounded" height={88} sx={{ borderRadius: 3 }} />
      ))}
    </Stack>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filtered }) {
  return (
    <Box
      id="stock-empty-state"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={10}
      gap={2}
      color="text.secondary"
    >
      <InventoryIcon sx={{ fontSize: 64, color: 'primary.light' }} />
      <Typography variant="h6" color="text.primary" fontWeight={600}>
        No stock entries found
      </Typography>
      <Typography variant="body2">
        {filtered
          ? 'Try clearing the filters to see all stock entries.'
          : 'Add your first stock entry using the button above.'}
      </Typography>
    </Box>
  );
}

// ─── Stock card row ───────────────────────────────────────────────────────────
function StockCard({ entry, onEdit, onDelete }) {
  const { status, variant } = stockStatus(entry.quantity);
  return (
    <Card
      id={`stock-card-${entry.id}`}
      variant="outlined"
      sx={{
        borderRadius: 3,
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ py: 2, px: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          {/* Medicine + Pharmacy */}
          <Grid item xs={12} sm={5}>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary" noWrap>
              {entry.medicineName ?? `Medicine #${entry.medicineId}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {entry.pharmacyName ?? `Pharmacy #${entry.pharmacyId}`}
            </Typography>
          </Grid>

          {/* Quantity + Price */}
          <Grid item xs={6} sm={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quantity
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {entry.quantity}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Price (LKR)
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {entry.price.toFixed(2)}
            </Typography>
          </Grid>

          {/* Status chip + last updated */}
          <Grid item xs={12} sm={2}>
            <Stack spacing={0.75} alignItems={{ xs: 'flex-start', sm: 'flex-start' }}>
              <StatusChip status={status} variant={variant} />
              <Tooltip title={new Date(entry.lastUpdated).toLocaleString()} placement="top">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <UpdateIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {relativeTime(entry.lastUpdated)}
                  </Typography>
                </Stack>
              </Tooltip>
            </Stack>
          </Grid>

          {/* Actions */}
          <Grid item xs={12} sm={1}>
            <Stack direction="row" justifyContent={{ xs: 'flex-end', sm: 'flex-end' }} spacing={0.5}>
              <Tooltip title="Edit">
                <IconButton
                  id={`stock-edit-btn-${entry.id}`}
                  size="small"
                  color="primary"
                  onClick={() => onEdit(entry)}
                  aria-label={`Edit stock entry for ${entry.medicineName}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  id={`stock-delete-btn-${entry.id}`}
                  size="small"
                  color="error"
                  onClick={() => onDelete(entry)}
                  aria-label={`Delete stock entry for ${entry.medicineName}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────
function StockFormDialog({ open, editEntry, medicines, pharmacies, onClose, onSaved }) {
  const isEdit = Boolean(editEntry);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(StockFormSchema),
    defaultValues: {
      pharmacyId: '',
      medicineId: '',
      quantity:   '',
      price:      '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (open) {
      setServerError(null);
      if (editEntry) {
        reset({
          pharmacyId: editEntry.pharmacyId,
          medicineId: editEntry.medicineId,
          quantity:   editEntry.quantity,
          price:      editEntry.price,
        });
      } else {
        reset({ pharmacyId: '', medicineId: '', quantity: '', price: '' });
      }
    }
  }, [open, editEntry, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    setServerError(null);
    try {
      const payload = {
        pharmacyId: values.pharmacyId,
        medicineId: values.medicineId,
        quantity:   values.quantity,
        price:      values.price,
      };
      const saved = isEdit
        ? await updateStock(editEntry.id, payload)
        : await createStock(payload);
      onSaved(saved, isEdit);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
      aria-labelledby="stock-form-dialog-title"
    >
      <DialogTitle id="stock-form-dialog-title" sx={{ fontWeight: 600 }}>
        {isEdit ? 'Update Stock Entry' : 'Add Stock Entry'}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {serverError && (
            <Alert id="stock-form-server-error" severity="error" sx={{ borderRadius: 2 }}>
              {serverError}
            </Alert>
          )}

          {/* Pharmacy dropdown */}
          <Controller
            name="pharmacyId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.pharmacyId}>
                <InputLabel id="pharmacy-select-label">Pharmacy</InputLabel>
                <Select
                  {...field}
                  id="stock-field-pharmacyId"
                  labelId="pharmacy-select-label"
                  label="Pharmacy"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  {pharmacies.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.pharmacyId?.message || ' '}</FormHelperText>
              </FormControl>
            )}
          />

          {/* Medicine dropdown */}
          <Controller
            name="medicineId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.medicineId}>
                <InputLabel id="medicine-select-label">Medicine</InputLabel>
                <Select
                  {...field}
                  id="stock-field-medicineId"
                  labelId="medicine-select-label"
                  label="Medicine"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  {medicines.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                      {m.genericName ? ` (${m.genericName})` : ''}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.medicineId?.message || ' '}</FormHelperText>
              </FormControl>
            )}
          />

          {/* Quantity */}
          <FormField
            name="quantity"
            label="Quantity"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            register={register('quantity', { valueAsNumber: true })}
            error={errors.quantity}
            helperText="Number of units currently in stock"
          />

          {/* Price */}
          <FormField
            name="price"
            label="Price (LKR)"
            type="number"
            inputProps={{ min: 0.01, step: 0.01 }}
            register={register('price', { valueAsNumber: true })}
            error={errors.price}
            helperText="Retail price per unit in Sri Lankan Rupees"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            id="stock-form-cancel-btn"
            variant="outlined"
            color="inherit"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            id="stock-form-save-btn"
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Stock'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function StockList() {
  // Data state
  const [entries, setEntries]       = useState([]);
  const [medicines, setMedicines]   = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Filters
  const [filterPharmacy, setFilterPharmacy] = useState('');
  const [filterMedicine, setFilterMedicine] = useState('');

  // Dialog state
  const [formOpen, setFormOpen]     = useState(false);
  const [editEntry, setEditEntry]   = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // ── Load dropdowns once ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getMedicines(), getPharmacies()])
      .then(([meds, pharms]) => {
        setMedicines(meds ?? []);
        setPharmacies(pharms ?? []);
      })
      .catch(() => {
        // Non-critical — form dropdowns will just be empty; main list still loads
        console.warn('Failed to load dropdowns');
      });
  }, []);

  // ── Fetch stock list (re-runs when filters change) ───────────────────────
  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterPharmacy) filters.pharmacyId = filterPharmacy;
      if (filterMedicine) filters.medicineId = filterMedicine;
      const data = await getStock(filters);
      setEntries(data ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load stock entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filterPharmacy, filterMedicine]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleOpenAdd() {
    setEditEntry(null);
    setFormOpen(true);
  }

  function handleOpenEdit(entry) {
    setEditEntry(entry);
    setFormOpen(true);
  }

  function handleFormSaved(saved, wasEdit) {
    if (wasEdit) {
      setEntries((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
    } else {
      // Prepend new entry and re-sort by lastUpdated desc (server already sends sorted)
      setEntries((prev) => [saved, ...prev]);
    }
    setSnack({
      open: true,
      message: wasEdit ? 'Stock entry updated.' : 'Stock entry added.',
      severity: 'success',
    });
  }

  function handleDeleteClick(entry) {
    setDeleteTarget(entry);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStock(deleteTarget.id);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setSnack({ open: true, message: 'Stock entry deleted.', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Delete failed.', severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleClearFilters() {
    setFilterPharmacy('');
    setFilterMedicine('');
  }

  const isFiltered = Boolean(filterPharmacy || filterMedicine);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box id="stock-list-page">
      {/* ── Page header ── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Pharmacy Stock
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Track medicine availability across all pharmacies
          </Typography>
        </Box>
        <Button
          id="stock-add-btn"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Add Stock Entry
        </Button>
      </Stack>

      {/* ── Filter bar ── */}
      <Card
        id="stock-filter-bar"
        variant="outlined"
        sx={{ borderRadius: 3, mb: 3, bgcolor: 'background.paper' }}
      >
        <CardContent sx={{ py: 2, px: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Filter Stock
            </Typography>
          </Stack>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-pharmacy-label">Pharmacy</InputLabel>
                <Select
                  id="stock-filter-pharmacy"
                  labelId="filter-pharmacy-label"
                  label="Pharmacy"
                  value={filterPharmacy}
                  onChange={(e) => setFilterPharmacy(e.target.value)}
                >
                  <MenuItem value="">All Pharmacies</MenuItem>
                  {pharmacies.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-medicine-label">Medicine</InputLabel>
                <Select
                  id="stock-filter-medicine"
                  labelId="filter-medicine-label"
                  label="Medicine"
                  value={filterMedicine}
                  onChange={(e) => setFilterMedicine(e.target.value)}
                >
                  <MenuItem value="">All Medicines</MenuItem>
                  {medicines.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                id="stock-filter-clear-btn"
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={!isFiltered}
                fullWidth
                size="medium"
                sx={{ height: 40 }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Results summary ── */}
      {!loading && !error && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {entries.length === 0
            ? 'No results'
            : `${entries.length} stock entr${entries.length === 1 ? 'y' : 'ies'} found`}
          {isFiltered && ' (filtered)'}
        </Typography>
      )}

      {/* ── Content area ── */}
      {loading ? (
        <StockSkeleton />
      ) : error ? (
        <Alert
          id="stock-error-alert"
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchStock}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : entries.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : (
        <Stack spacing={2}>
          {entries.map((entry) => (
            <StockCard
              key={entry.id}
              entry={entry}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </Stack>
      )}

      {/* ── Add / Edit dialog ── */}
      <StockFormDialog
        open={formOpen}
        editEntry={editEntry}
        medicines={medicines}
        pharmacies={pharmacies}
        onClose={() => setFormOpen(false)}
        onSaved={handleFormSaved}
      />

      {/* ── Delete confirmation dialog ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Stock Entry?"
        message={
          deleteTarget
            ? `This will permanently remove the stock record for "${deleteTarget.medicineName ?? 'this medicine'}" at "${deleteTarget.pharmacyName ?? 'this pharmacy'}". This action cannot be undone.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* ── Snackbar feedback ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          id="stock-snackbar-alert"
          severity={snack.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
