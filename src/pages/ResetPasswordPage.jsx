import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { resetPassword } from '../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ new_password: '', confirm_password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.new_password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, form.new_password);
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
        <Card sx={{ width: 380, borderRadius: 3, boxShadow: 10 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error">Invalid reset link.</Alert>
            <Button fullWidth sx={{ mt: 2, color: '#7c3aed' }} onClick={() => navigate('/login')}>Back to Login</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <Card sx={{ width: 380, borderRadius: 3, boxShadow: 10 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', bgcolor: '#7c3aed', mb: 1.5 }}>
              <LockOutlinedIcon sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Set New Password</Typography>
            <Typography variant="body2" color="text.secondary">Enter your new password below</Typography>
          </Box>

          {message && <Alert severity="success" sx={{ mb: 2 }}>{message} Redirecting to login...</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!message && (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth label="New Password" type="password" margin="normal" required
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              />
              <TextField
                fullWidth label="Confirm Password" type="password" margin="normal" required
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading}
                sx={{ mt: 2, py: 1.4, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
              </Button>
            </Box>
          )}

          <Button fullWidth sx={{ mt: 2, color: '#7c3aed' }} onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
