"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from '../lib/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      const userData = await login(formData.email, formData.password);
      if (userData?.needsRegistration) {
        sessionStorage.removeItem('pendingGoogleUser');
        sessionStorage.setItem('pendingProfileUser', JSON.stringify(userData));
        toast('Please complete your profile details to continue', { icon: 'ℹ️', duration: 5000 });
        navigate('/register');
      } else {
        navigate('/requests');
      }
    } catch (err) {
      if (err.message.includes('auth/invalid-credential')) {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const userData = await loginWithGoogle();
      if (userData?.needsRegistration) {
        sessionStorage.setItem('pendingGoogleUser', JSON.stringify(userData));
        sessionStorage.setItem('pendingProfileUser', JSON.stringify(userData));
        toast('Please complete your profile details to finish registration', { icon: 'ℹ️', duration: 5000 });
        navigate('/register');
      } else {
        toast.success(`Welcome back, ${userData.name}!`);
        navigate('/requests');
      }
    } catch (err) {
      const code = err?.code || '';
      const msg = err?.message || 'Google login failed';
      console.error('Google login error', err);
      if (code === 'auth/unauthorized-domain') {
        setError('Google login blocked: localhost domain is not authorized in Firebase Auth settings.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google login popup was closed before completion.');
      } else if (code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups and try again.');
      } else {
        setError(code ? `${code}: ${msg}` : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 className="text-center mb-8">Welcome Back</h2>
        
        {error && (
          <div style={{ background: '#ffebee', color: 'var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
                type="email" 
                name="email" 
                className="form-input" 
                required 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/reset-password" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>
                  Forget Password?
                </Link>
              </div>
              <input 
                type="password" 
                name="password" 
                className="form-input" 
                required 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-light)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--border)', zIndex: 1 }}></div>
              <span style={{ background: 'white', padding: '0 10px', position: 'relative', zIndex: 2, fontSize: '0.9rem' }}>OR</span>
            </div>

            <div className="grid grid-cols-1 mt-6">
              <button type="button" className="btn btn-outline" disabled={loading} onClick={handleGoogleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px' }} />
                Google
              </button>
            </div>
          </form>

        <div className="text-center" style={{ marginTop: '2.5rem' }}>
          <p className="text-light">
            Don't have an account? <Link to="/register" className="text-primary" style={{ fontWeight: 600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
