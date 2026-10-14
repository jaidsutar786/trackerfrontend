import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const roleRedirect = {
  admin: '/admin',
  manager: '/manager',
  employee: '/employee',
  client: '/client',
};

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Clear any existing auth data when login page loads
  useEffect(() => {
    sessionStorage.clear();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Clear any existing auth data before new login
    sessionStorage.clear();
    
    try {
      const res = await login(form.username, form.password);
      sessionStorage.setItem('access_token', res.data.access);
      sessionStorage.setItem('refresh_token', res.data.refresh);
      setUser(res.data.user);
      navigate(roleRedirect[res.data.user.role] || '/');
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Invalid username or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      }}
    >
      <Card sx={{ width: 380, borderRadius: 3, boxShadow: 10 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex', p: 1.5, borderRadius: '50%',
                bgcolor: '#7c3aed', mb: 1.5,
              }}
            >
              <LockOutlinedIcon sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Welcome Back</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Username" margin="normal" required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <TextField
              fullWidth label="Password" type="password" margin="normal" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading}
              sx={{ mt: 2, py: 1.4, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Link to="/forgot-password" style={{ color: '#7c3aed', fontSize: 14 }}>Forgot Password?</Link>
            </Box>
          </Box>


        </CardContent>
      </Card>
    </Box>
  );
}
