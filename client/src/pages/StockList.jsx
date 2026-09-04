// src/pages/StockList.jsx — Pharmacy Stock module (Member 2)
// Full implementation — replaces the placeholder stub.

import React, { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// MUI core
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// MUI icons
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';

// Shared components
import ConfirmDialog from '../components/shared/ConfirmDialog';
import FormField from '../components/shared/FormField';
import StatusChip from '../components/shared/StatusChip';

// API helpers
import { getStock, createStock, updateStock, deleteStock, getMedicines, getPharmacies } from '../api/stock';

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const StockSchema = z.object({
  pharmacyId: z.string().min(1, 'Pharmacy is required'),
  medicineId: z.string().min(1, 'Medicine is required'),
  quantity:   z.string().min(1, 'Quantity is required').refine((v) => Number(v) >= 0, 'Cannot be negative'),
  price:      z.string().min(1, 'Price is required').refine((v) => Number(v) >= 0, 'Cannot be negative'),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stockStatus(quantity) {
  if (quantity === 0)   return { label: 'Out of Stock', variant: 'error' };
  if (quantity < 10)    return { label: 'Low Stock',    variant: 'warning' };
  return                       { label: 'In Stock',     variant: 'success' };
}

// ─── Stock Form Dialog ────────────────────────────────────────────────────────

function StockFormDialog({ open, entry, medicines, pharmacies, onClose, onSaved }) {
  const isEdit = Boolean(entry);
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(StockSchema),
    defaultValues: { pharmacyId: '', medicineId: '', quantity: '', price: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        entry
          ? {
              pharmacyId: String(entry.pharmacyId),
              medicineId: String(entry.medicineId),
              quantity:   String(entry.quantity),
              price:      String(entry.price),
            }
          : { pharmacyId: '', medicineId: '', quantity: '', price: '' }
      );
      setServerError('');
    }
  }, [open, entry, reset]);

  async function onSubmit(data) {
    setServerError('');
    try {
      const payload = {
        pharmacyId: Number(data.pharmacyId),
        medicineId: Number(data.medicineId),
        quantity:   Number(data.quantity),
        price:      Number(data.price),
      };
      const saved = isEdit
        ? await updateStock(entry.id, payload)
        : await createStock(payload);
      onSaved(saved, isEdit);
      onClose();
    } catch (err) {
      setServerError(err.message || 'An error occurred. Please try again.');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
      aria-labelledby="stock-form-title"
    >
      <DialogTitle
        id="stock-form-title"
        sx={{ fontWeight: 700, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {isEdit ? 'Edit Stock Entry' : 'Add Stock Entry'}
        <IconButton id="stock-form-close-btn" onClick={onClose} size="small" aria-label="Close form">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

        <Box
          component="form"
          id="stock-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          {/* Pharmacy select */}
          <Controller
            name="pharmacyId"
            control={control}
            render={({ field }) => (
              <FormField
                name="pharmacyId"
                label="Pharmacy"
                select
                register={field}
                error={errors.pharmacyId}
              >
                {pharmacies.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name} — {p.area}
                  </MenuItem>
                ))}
              </FormField>
            )}
          />

          {/* Medicine select */}
          <Controller
            name="medicineId"
            control={control}
            render={({ field }) => (
              <FormField
                name="medicineId"
                label="Medicine"
                select
                register={field}
                error={errors.medicineId}
              >
                {medicines.map((m) => (
                  <MenuItem key={m.id} value={String(m.id)}>
                    {m.name} ({m.genericName})
                  </MenuItem>
                ))}
              </FormField>
            )}
          />

          <FormField
            name="quantity"
            label="Quantity (units)"
            type="number"
            register={register('quantity')}
            error={errors.quantity}
            helperText="Number of units currently in stock"
          />

          <FormField
            name="price"
            label="Price (LKR)"
            type="number"
            register={register('price')}
            error={errors.price}
            helperText="Price per unit in Sri Lankan Rupees"
          />

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
            <Button
              id="stock-form-cancel-btn"
              variant="outlined"
              color="inherit"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              id="stock-form-submit-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Stock'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {[60, 55, 40, 30, 30, 50].map((w, j) => (
        <TableCell key={j}><Skeleton variant="text" width={`${w}%`} /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }) {
  return (
    <TableRow>
      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
        <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          {hasFilter
            ? 'No stock entries match your filter — try a different pharmacy or medicine.'
            : 'No stock entries yet. Add the first one!'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── About Panel ──────────────────────────────────────────────────────────────

function AboutPanel() {
  return (
    <Card
      id="stock-about-panel"
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'primary.light',
        borderRadius: 3,
        bgcolor: 'background.paper',
        mb: 3,
      }}
    >
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <InventoryIcon sx={{ color: 'primary.main', fontSize: 36, mt: 0.5, flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.dark" gutterBottom>
            Pharmacy Stock Levels
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This module tracks real-time medicine inventory across all participating pharmacies in Sri Lanka.
            Stock entries show how many units of each medicine are available and at what price, helping
            patients and healthcare workers quickly find where a medicine can be obtained.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Filter by pharmacy or medicine to narrow your search. Stock status is colour-coded:
            <strong> In Stock (green)</strong>, <strong>Low Stock (orange, &lt;10 units)</strong>, and{' '}
            <strong>Out of Stock (red)</strong>.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function StockList() {
  const [stockEntries, setStockEntries] = useState([]);
  const [medicines,    setMedicines]    = useState([]);
  const [pharmacies,   setPharmacies]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');

  // Filters
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [medicineFilter, setMedicineFilter] = useState('');

  // Form dialog
  const [formOpen,   setFormOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Delete confirm
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // ── Load dropdown data ─────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([getMedicines(), getPharmacies()])
      .then(([meds, pharms]) => {
        setMedicines(meds);
        setPharmacies(pharms);
      })
      .catch(() => {/* non-blocking */});
  }, []);

  // ── Fetch stock entries ────────────────────────────────────────────────────

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const filters = {};
      if (pharmacyFilter) filters.pharmacyId = pharmacyFilter;
      if (medicineFilter) filters.medicineId = medicineFilter;
      const data = await getStock(filters);
      setStockEntries(data);
    } catch (err) {
      setFetchError(err.message || 'Failed to load stock entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pharmacyFilter, medicineFilter]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openAdd()   { setEditTarget(null); setFormOpen(true); }
  function openEdit(s) { setEditTarget(s);    setFormOpen(true); }

  function handleSaved(saved, isEdit) {
    if (isEdit) {
      setStockEntries((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      showSnack('Stock entry updated successfully.', 'success');
    } else {
      fetchStock();
      showSnack('Stock entry added successfully.', 'success');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteStock(deleteTarget.id);
      setStockEntries((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      showSnack('Stock entry removed.', 'success');
    } catch (err) {
      showSnack(err.message || 'Failed to delete stock entry.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  function showSnack(message, severity = 'success') {
    setSnack({ open: true, message, severity });
  }

  const hasFilter = Boolean(pharmacyFilter || medicineFilter);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box id="stock-list-page">
      <AboutPanel />

      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Pharmacy Stock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading…' : `${stockEntries.length} stock entr${stockEntries.length !== 1 ? 'ies' : 'y'} found`}
          </Typography>
        </Box>

        <Button
          id="add-stock-btn"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Add Stock
        </Button>
      </Box>

      {/* Filter bar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          id="stock-pharmacy-filter"
          select
          size="small"
          label="Pharmacy"
          value={pharmacyFilter}
          onChange={(e) => setPharmacyFilter(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="">All pharmacies</MenuItem>
          {pharmacies.map((p) => (
            <MenuItem key={p.id} value={String(p.id)}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          id="stock-medicine-filter"
          select
          size="small"
          label="Medicine"
          value={medicineFilter}
          onChange={(e) => setMedicineFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All medicines</MenuItem>
          {medicines.map((m) => (
            <MenuItem key={m.id} value={String(m.id)}>
              {m.name}
            </MenuItem>
          ))}
        </TextField>

        {hasFilter && (
          <Button
            id="stock-clear-filter-btn"
            variant="text"
            color="inherit"
            onClick={() => { setPharmacyFilter(''); setMedicineFilter(''); }}
            size="small"
          >
            Clear
          </Button>
        )}
      </Paper>

      {/* Error state */}
      {fetchError && (
        <Alert
          severity="error"
          action={<Button size="small" color="inherit" onClick={fetchStock}>Retry</Button>}
          sx={{ mb: 2 }}
        >
          {fetchError}
        </Alert>
      )}

      {/* Main table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Table id="stock-table" aria-label="Pharmacy stock list">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.paper' }}>
              <TableCell sx={{ fontWeight: 700 }}>Pharmacy</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Medicine</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price (LKR)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : stockEntries.length === 0 ? (
              <EmptyState hasFilter={hasFilter} />
            ) : (
              stockEntries.map((s) => {
                const { label, variant } = stockStatus(s.quantity);
                return (
                  <TableRow key={s.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {s.pharmacy?.name ?? `Pharmacy #${s.pharmacyId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.pharmacy?.area}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {s.medicine?.name ?? `Medicine #${s.medicineId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.medicine?.genericName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {s.medicine?.category ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {s.quantity.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Rs. {Number(s.price).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={label} variant={variant} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          id={`edit-stock-${s.id}`}
                          size="small"
                          color="primary"
                          onClick={() => openEdit(s)}
                          aria-label={`Edit stock entry ${s.id}`}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          id={`delete-stock-${s.id}`}
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(s)}
                          aria-label={`Delete stock entry ${s.id}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit form */}
      <StockFormDialog
        open={formOpen}
        entry={editTarget}
        medicines={medicines}
        pharmacies={pharmacies}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete this stock entry?`}
        message={`This will permanently remove the stock record for "${deleteTarget?.medicine?.name ?? 'this medicine'}" at "${deleteTarget?.pharmacy?.name ?? 'this pharmacy'}".`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Snackbar feedback */}
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
