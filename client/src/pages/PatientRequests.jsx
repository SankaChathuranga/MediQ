// src/pages/PatientRequests.jsx — Patient Requests + Matching module (Member 4)
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
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
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
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';

// Shared components
import ConfirmDialog from '../components/shared/ConfirmDialog';
import FormField from '../components/shared/FormField';
import StatusChip from '../components/shared/StatusChip';

// API
import {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  getMedicines,
} from '../api/requests';

// ─── Constants ─────────────────────────────────────────────────────────────────

const URGENCY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: 'info' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high',   label: 'High',   color: 'error' },
];

const STATUS_OPTIONS = [
  { value: '',          label: 'All statuses' },
  { value: 'open',      label: 'Open' },
  { value: 'fulfilled', label: 'Fulfilled' },
];

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  patientContact: z.string().min(1, 'Contact is required').max(100),
  medicineId:     z.string().min(1, 'Medicine is required'),
  area:           z.string().min(1, 'Area is required').max(100),
  urgency:        z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Select a valid urgency level' }),
  }),
});

// ─── Request Form Dialog ──────────────────────────────────────────────────────

function RequestFormDialog({ open, medicines, onClose, onSaved }) {
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(RequestSchema),
    defaultValues: { patientContact: '', medicineId: '', area: '', urgency: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ patientContact: '', medicineId: '', area: '', urgency: '' });
      setServerError('');
    }
  }, [open, reset]);

  async function onSubmit(data) {
    setServerError('');
    try {
      const saved = await createRequest(data);
      onSaved(saved.data);
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
      aria-labelledby="request-form-title"
    >
      <DialogTitle
        id="request-form-title"
        sx={{ fontWeight: 700, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        New Medicine Request
        <IconButton id="request-form-close-btn" onClick={onClose} size="small" aria-label="Close form">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

        <Box
          component="form"
          id="request-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormField
            name="patientContact"
            label="Patient Contact (phone / email)"
            register={register('patientContact')}
            error={errors.patientContact}
            helperText="e.g. 077-123-4567 or patient@email.com"
          />

          <Controller
            name="medicineId"
            control={control}
            render={({ field }) => (
              <FormField
                name="medicineId"
                label="Medicine Needed"
                select
                register={field}
                error={errors.medicineId}
              >
                {medicines.map((m) => (
                  <MenuItem key={m.id} value={String(m.id)}>
                    {m.name} — {m.genericName}
                  </MenuItem>
                ))}
              </FormField>
            )}
          />

          <FormField
            name="area"
            label="Patient Area / City"
            register={register('area')}
            error={errors.area}
            helperText="e.g. Colombo, Kandy, Galle"
          />

          <Controller
            name="urgency"
            control={control}
            render={({ field }) => (
              <FormField
                name="urgency"
                label="Urgency Level"
                select
                register={field}
                error={errors.urgency}
              >
                {URGENCY_OPTIONS.map((u) => (
                  <MenuItem key={u.value} value={u.value}>
                    {u.label}
                  </MenuItem>
                ))}
              </FormField>
            )}
          />

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
            <Button
              id="request-form-cancel-btn"
              variant="outlined"
              color="inherit"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              id="request-form-submit-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Expandable Row with Matched Pharmacies ────────────────────────────────────

function RequestRow({ request, onMarkFulfilled, onDelete }) {
  const [open, setOpen] = useState(false);
  const [matchedPharmacies, setMatchedPharmacies] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  async function loadMatches() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoadingMatches(true);
    try {
      const res = await getRequestById(request.id);
      setMatchedPharmacies(res.data?.matchedPharmacies ?? []);
    } catch {
      setMatchedPharmacies([]);
    } finally {
      setLoadingMatches(false);
    }
  }

  const urgencyOpt  = URGENCY_OPTIONS.find((u) => u.value === request.urgency);
  const isFulfilled = request.status === 'fulfilled';

  return (
    <>
      <TableRow hover sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}>
        <TableCell>
          <IconButton
            id={`expand-request-${request.id}`}
            size="small"
            onClick={loadMatches}
            aria-label={open ? 'Collapse' : 'Expand matches'}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            #{request.id}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {request.medicine?.name ?? `Medicine #${request.medicineId}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {request.medicine?.genericName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{request.patientContact}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{request.area}</Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={urgencyOpt?.label ?? request.urgency}
            color={urgencyOpt?.color ?? 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </TableCell>
        <TableCell>
          <StatusChip
            status={isFulfilled ? 'Fulfilled' : 'Open'}
            variant={isFulfilled ? 'success' : 'info'}
          />
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {new Date(request.createdAt).toLocaleDateString('en-LK', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Typography>
        </TableCell>
        <TableCell align="right">
          {!isFulfilled && (
            <Tooltip title="Mark as Fulfilled">
              <IconButton
                id={`fulfill-request-${request.id}`}
                size="small"
                color="success"
                onClick={() => onMarkFulfilled(request)}
                aria-label={`Fulfill request ${request.id}`}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton
              id={`delete-request-${request.id}`}
              size="small"
              color="error"
              onClick={() => onDelete(request)}
              aria-label={`Delete request ${request.id}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      {/* Expandable matched pharmacies panel */}
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, bgcolor: 'action.hover' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalPharmacyIcon fontSize="small" color="primary" />
                Pharmacies with this medicine in stock near {request.area}
              </Typography>
              {loadingMatches ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[1, 2].map((i) => <Skeleton key={i} variant="rounded" width={220} height={80} />)}
                </Box>
              ) : matchedPharmacies.length === 0 ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No pharmacies currently have this medicine in stock in the {request.area} area.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                  {matchedPharmacies.map((ph) => (
                    <Card
                      key={ph.pharmacyId}
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'success.light',
                        borderRadius: 2,
                        minWidth: 220,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" fontWeight={700}>{ph.pharmacyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{ph.area}</Typography>
                        <Divider sx={{ my: 0.75 }} />
                        <Typography variant="caption" display="block">📞 {ph.contact}</Typography>
                        <Typography variant="caption" display="block">🕒 {ph.hours}</Typography>
                        <Typography variant="caption" display="block">
                          📦 {ph.quantity} units · Rs. {Number(ph.price).toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return Array.from({ length: 4 }).map((_, i) => (
    <TableRow key={i}>
      {[20, 30, 55, 55, 40, 35, 40, 45, 50].map((w, j) => (
        <TableCell key={j}><Skeleton variant="text" width={`${w}%`} /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }) {
  return (
    <TableRow>
      <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
        <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          {hasFilter
            ? 'No requests match your filter — try adjusting the status or area.'
            : 'No patient requests yet. Submit the first one!'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── About Panel ──────────────────────────────────────────────────────────────

function AboutPanel() {
  return (
    <Card
      id="requests-about-panel"
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
        <AssignmentIcon sx={{ color: 'primary.main', fontSize: 36, mt: 0.5, flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.dark" gutterBottom>
            Patient Medicine Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When a patient cannot find a medicine at their local pharmacy, they can submit a request here.
            Each request is automatically matched against current stock across pharmacies in the same area,
            so patients know exactly where to go.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Click the <strong>arrow ▶</strong> on any row to see a list of pharmacies that currently
            carry the requested medicine near the patient's area. Mark a request as{' '}
            <strong>Fulfilled</strong> once the patient has been directed to a pharmacy.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function PatientRequests() {
  const [requests,     setRequests]     = useState([]);
  const [medicines,    setMedicines]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [areaFilter,   setAreaFilter]   = useState('');

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);

  // Delete confirm
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fulfill confirm
  const [fulfillTarget,  setFulfillTarget]  = useState(null);
  const [fulfillLoading, setFulfillLoading] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // ── Load medicines for form dropdown ─────────────────────────────────────────

  useEffect(() => {
    getMedicines()
      .then((res) => setMedicines(res.data ?? []))
      .catch(() => {/* non-blocking */});
  }, []);

  // ── Fetch requests ────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (areaFilter)   params.area   = areaFilter;
      const res = await getRequests(params);
      setRequests(res.data ?? []);
    } catch (err) {
      setFetchError(err.message || 'Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, areaFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleSaved(newRequest) {
    fetchRequests();
    showSnack('Request submitted successfully.', 'success');
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteRequest(deleteTarget.id);
      setRequests((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showSnack('Request deleted.', 'success');
    } catch (err) {
      showSnack(err.message || 'Failed to delete request.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleFulfillConfirm() {
    if (!fulfillTarget) return;
    setFulfillLoading(true);
    try {
      await updateRequest(fulfillTarget.id, 'fulfilled');
      setRequests((prev) =>
        prev.map((r) => (r.id === fulfillTarget.id ? { ...r, status: 'fulfilled' } : r))
      );
      showSnack('Request marked as fulfilled.', 'success');
    } catch (err) {
      showSnack(err.message || 'Failed to update request.', 'error');
    } finally {
      setFulfillLoading(false);
      setFulfillTarget(null);
    }
  }

  function showSnack(message, severity = 'success') {
    setSnack({ open: true, message, severity });
  }

  const hasFilter = Boolean(statusFilter || areaFilter);

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <Box id="patient-requests-page">
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
            Patient Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading…' : `${requests.length} request${requests.length !== 1 ? 's' : ''} found`}
          </Typography>
        </Box>

        <Button
          id="add-request-btn"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{ whiteSpace: 'nowrap' }}
        >
          New Request
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
          id="requests-status-filter"
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
          ))}
        </TextField>

        <TextField
          id="requests-area-filter"
          size="small"
          label="Area"
          placeholder="e.g. Colombo"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        />

        {hasFilter && (
          <Button
            id="requests-clear-filter-btn"
            variant="text"
            color="inherit"
            onClick={() => { setStatusFilter(''); setAreaFilter(''); }}
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
          action={<Button size="small" color="inherit" onClick={fetchRequests}>Retry</Button>}
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
        <Table id="requests-table" aria-label="Patient requests">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.paper' }}>
              <TableCell sx={{ width: 48 }} />
              <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Medicine</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Urgency</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : requests.length === 0 ? (
              <EmptyState hasFilter={hasFilter} />
            ) : (
              requests.map((r) => (
                <RequestRow
                  key={r.id}
                  request={r}
                  onMarkFulfilled={setFulfillTarget}
                  onDelete={setDeleteTarget}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New request form */}
      <RequestFormDialog
        open={formOpen}
        medicines={medicines}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this request?"
        message={`This will permanently delete the request for "${deleteTarget?.medicine?.name ?? 'this medicine'}" from ${deleteTarget?.patientContact}.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Fulfill confirm */}
      <ConfirmDialog
        open={Boolean(fulfillTarget)}
        title="Mark as Fulfilled?"
        message={`Confirm that the request for "${fulfillTarget?.medicine?.name ?? 'this medicine'}" has been fulfilled and the patient was directed to a pharmacy.`}
        onConfirm={handleFulfillConfirm}
        onCancel={() => setFulfillTarget(null)}
        loading={fulfillLoading}
      />

      {/* Snackbar */}
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
