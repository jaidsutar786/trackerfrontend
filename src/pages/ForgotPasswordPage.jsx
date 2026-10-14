import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.data.message);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <Card sx={{ width: 380, borderRadius: 3, boxShadow: 10 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', bgcolor: '#7c3aed', mb: 1.5 }}>
              <LockOutlinedIcon sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Forgot Password</Typography>
            <Typography variant="body2" color="text.secondary">Enter your email to receive a reset link</Typography>
          </Box>

          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!message && (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email" type="email" margin="normal" required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading}
                sx={{ mt: 2, py: 1.4, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
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
