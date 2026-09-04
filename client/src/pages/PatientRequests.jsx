import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Divider from '@mui/material/Divider';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Chip from '@mui/material/Chip';

import {
  getRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  getMedicines,
  getRequestById
} from '../api/requests';

import FormField from '../components/shared/FormField';
import StatusChip from '../components/shared/StatusChip';
import ConfirmDialog from '../components/shared/ConfirmDialog';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function PatientRequests() {
  const [requests, setRequests] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filterMedicineName, setFilterMedicineName] = useState('');
  const [filterArea, setFilterArea] = useState('');
  
  const debouncedMedicineName = useDebounce(filterMedicineName, 500);
  const debouncedArea = useDebounce(filterArea, 500);

  // Form
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { urgency: 'medium' }
  });
  const [formLoading, setFormLoading] = useState(false);

  // Expanded Matches (for single request view)
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [expandedData, setExpandedData] = useState(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  
  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRequests({ medicineName: debouncedMedicineName, area: debouncedArea });
      if (res.success) setRequests(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [debouncedMedicineName, debouncedArea]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await getMedicines();
        if (res.success) setMedicines(res.data);
      } catch (err) {
        console.error('Failed to load medicines list', err);
      }
    };
    fetchMedicines();
  }, []);

  const handleCreate = async (data) => {
    try {
      setFormLoading(true);
      const res = await createRequest(data);
      if (res.success) {
        setSnackbar({ open: true, message: 'Request posted successfully!', severity: 'success' });
        reset({ patientContact: '', medicineId: '', area: '', urgency: 'medium' });
        fetchRequests();
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to create request', severity: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await updateRequest(id, newStatus);
      if (res.success) {
        setSnackbar({ open: true, message: `Status updated to ${newStatus}`, severity: 'success' });
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (expandedRequestId === id) {
           setExpandedData(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to update status', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      setDeleteLoading(true);
      await deleteRequest(deleteDialog.id);
      setSnackbar({ open: true, message: 'Request deleted', severity: 'success' });
      setDeleteDialog({ open: false, id: null });
      fetchRequests();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete request', severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleExpand = async (id) => {
    if (expandedRequestId === id) {
      setExpandedRequestId(null);
      setExpandedData(null);
      return;
    }
    setExpandedRequestId(id);
    try {
      setExpandedLoading(true);
      const res = await getRequestById(id);
      if (res.success) {
        setExpandedData(res.data);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch matches', severity: 'error' });
    } finally {
      setExpandedLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  return (
    <Box>
      {/* Header Banner */}
      <Box
        sx={{
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          p: 4,
          borderRadius: 3,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: 1
        }}
      >
        <AssignmentIcon sx={{ fontSize: 48 }} />
        <Box>
          <Typography variant="h4" fontWeight={600}>Find & Request Medicine</Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Search for what you need or post a request if it's out of stock in your area.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Panel: Filter & Form */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 3, p: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Filter Requests</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormField
                name="filterMedicine"
                label="Filter by Medicine"
                value={filterMedicineName}
                onChange={(e) => setFilterMedicineName(e.target.value)}
              />
              <FormField
                name="filterArea"
                label="Filter by Area"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
              />
            </Box>
          </Card>

          <Card sx={{ borderRadius: 3, p: 2, boxShadow: 2, borderTop: '4px solid', borderColor: 'primary.main' }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Post a Request</Typography>
            <form onSubmit={handleSubmit(handleCreate)}>
              <Box display="flex" flexDirection="column" gap={2.5}>
                <FormField
                  name="medicineId"
                  label="Medicine"
                  select
                  register={register('medicineId', { required: 'Medicine is required' })}
                  error={errors.medicineId}
                  defaultValue=""
                >
                  <MenuItem value="" disabled>Select Medicine</MenuItem>
                  {medicines.map((m) => (
                    <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                  ))}
                </FormField>

                <FormField
                  name="area"
                  label="Area (City/Town)"
                  register={register('area', { required: 'Area is required' })}
                  error={errors.area}
                />

                <FormField
                  name="patientContact"
                  label="Contact Info (Phone/Email)"
                  register={register('patientContact', {
                    required: 'Contact is required',
                    pattern: {
                      value: /^(\+?[\d\s\-()]{7,20}|[^\s@]+@[^\s@]+\.[^\s@]+)$/,
                      message: 'Enter a valid phone number or email'
                    }
                  })}
                  error={errors.patientContact}
                />

                <FormField
                  name="urgency"
                  label="Urgency"
                  select
                  register={register('urgency', { required: 'Urgency is required' })}
                  error={errors.urgency}
                  defaultValue="medium"
                >
                  <MenuItem value="low">Low - Routine</MenuItem>
                  <MenuItem value="medium">Medium - Soon</MenuItem>
                  <MenuItem value="high">High - Urgent</MenuItem>
                </FormField>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={formLoading}
                  startIcon={formLoading && <CircularProgress size={20} color="inherit" />}
                >
                  {formLoading ? 'Posting...' : 'Post Request'}
                </Button>
              </Box>
            </form>
          </Card>
        </Grid>

        {/* Right Panel: List */}
        <Grid item xs={12} md={8}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600}>Recent Requests</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} sx={{ mb: 2, borderRadius: 3, p: 2 }}>
                <Skeleton variant="text" width="40%" height={32} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="30%" />
              </Card>
            ))
          ) : requests.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                p: 6,
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No requests found</Typography>
              <Typography color="text.secondary">Try a different search or post a new request.</Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {requests.map(request => {
                const isFulfilled = request.status === 'fulfilled';
                const isExpanded = expandedRequestId === request.id;
                
                return (
                  <Card
                    key={request.id}
                    sx={{
                      borderRadius: 3,
                      transition: 'background-color 0.5s ease',
                      bgcolor: isFulfilled ? '#e8f5e9' : 'background.paper', // Transition on status flip
                      boxShadow: isExpanded ? 3 : 1
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                            {request.medicineName || `Medicine #${request.medicineId}`}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" color="text.secondary" gap={0.5} mb={0.5}>
                            <LocationOnIcon fontSize="small" />
                            <Typography variant="body2">{request.area}</Typography>
                          </Box>
                          
                          <Box display="flex" alignItems="center" gap={1} mt={1.5}>
                            <StatusChip status={request.status} variant={isFulfilled ? 'success' : 'info'} />
                            <Chip 
                               size="small" 
                               label={`Urgency: ${request.urgency}`} 
                               color={request.urgency === 'high' ? 'error' : request.urgency === 'medium' ? 'warning' : 'default'}
                               variant="outlined"
                            />
                            <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>

                        <Box>
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: request.id })}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {/* Matching Section */}
                      {isExpanded && (
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ mb: 2 }} />
                          {expandedLoading ? (
                             <Box display="flex" alignItems="center" gap={2} p={2}>
                                <CircularProgress size={20} />
                                <Typography color="text.secondary">Finding matches...</Typography>
                             </Box>
                          ) : (
                             <Box>
                                <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                                  Matched Pharmacies in {request.area}
                                </Typography>
                                {expandedData?.matchedPharmacies?.length > 0 ? (
                                  <Box display="flex" flexDirection="column" gap={1} mt={1}>
                                    {expandedData.matchedPharmacies.map(match => (
                                      <Box key={match.stockId} sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <LocalPharmacyIcon color="primary" fontSize="small" />
                                            <Typography variant="body2" fontWeight={600}>{match.pharmacyName}</Typography>
                                          </Box>
                                          <Typography variant="caption" color="text.secondary">Contact: {match.contact}</Typography>
                                        </Box>
                                        <Box textAlign="right">
                                          <Typography variant="body2" fontWeight={600} color="success.main">{match.quantity} in stock</Typography>
                                          <Typography variant="caption" color="text.secondary">Rs. {match.price}</Typography>
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" p={1}>
                                    No pharmacies in {request.area} currently have {request.medicineName} in stock.
                                  </Typography>
                                )}
                             </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                      <Button 
                        size="small" 
                        variant="text" 
                        onClick={() => toggleExpand(request.id)}
                      >
                        {isExpanded ? 'Hide Details' : 'Check Matches'}
                      </Button>
                      
                      {!isFulfilled && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => handleUpdateStatus(request.id, 'fulfilled')}
                        >
                          Mark Fulfilled
                        </Button>
                      )}
                      {isFulfilled && (
                         <Button 
                          size="small" 
                          variant="outlined" 
                          color="inherit"
                          onClick={() => handleUpdateStatus(request.id, 'open')}
                        >
                          Reopen Request
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Request"
        message="Are you sure you want to delete this patient request? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        loading={deleteLoading}
      />

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
