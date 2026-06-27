"use client";

import React, { useState } from 'react';
import { Link } from '../lib/navigation';
import { firebaseService } from '../services/firebaseService';

const ResetPassword = () => {
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetEmail) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await firebaseService.resetPasswordEmail(resetEmail);
      setSuccess('Password reset link sent to your email! (If not found, check the spam folder too)');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 className="text-center mb-8">Reset Password</h2>
        
        {error && (
          <div style={{ background: '#ffebee', color: 'var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ background: '#e8f5e9', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleResetSubmit}>
          <div className="form-group">
            <label className="form-label">Enter Email Address</label>
            <input 
              type="email" 
              name="resetEmail" 
              className="form-input" 
              required 
              value={resetEmail} 
              onChange={(e) => setResetEmail(e.target.value)} 
            />
            <p className="text-light mt-2" style={{ fontSize: '0.85rem' }}>We will send a password reset link to this email.</p>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center mt-6">
          <Link to="/login" className="text-primary" style={{ fontWeight: 500 }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
