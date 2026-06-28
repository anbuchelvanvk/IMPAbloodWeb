"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { useNavigate } from '../lib/navigation';
import { Eye, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const EyePledge = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    contact: user?.contact || '',
    location: user?.district ? `${user.district}, ${user.state}` : '',
    guardianName: '',
    guardianContact: '',
    doctorName: '',
    doctorNumber: '',
    pledgeConsent: false
  });

  if (!user) {
    return (
      <div className="container text-center" style={{ padding: '8rem 0' }}>
        <Eye size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ marginBottom: '1rem' }}>Login Required</h2>
        <p className="text-light" style={{ marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
          Please log in or register to pledge your eyes. We need to associate your pledge with your verified profile to generate your official Eye Donor Card.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Register</button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pledgeConsent) {
      setError("Please check the consent box to proceed.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        name: formData.name,
        age: formData.age,
        contact: formData.contact,
        isEyeDonor: true,
        eyeDonationConsent: true,
        guardianName: formData.guardianName,
        guardianContact: formData.guardianContact,
        doctorName: formData.doctorName,
        doctorNumber: formData.doctorNumber
      };
      
      const updated = await firebaseService.updateUserProfile(user.id, payload);
      if (updated) {
        updateUser(updated);
        toast.success("Your eye donor card has been generated!", { duration: 5000, icon: '👁️' });
        navigate('/profile');
      }
    } catch (err) {
      console.error(err);
      setError("Failed to register your pledge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0', maxWidth: '700px' }}>
      <div className="card text-center mb-8" style={{ borderTop: '6px solid var(--success)' }}>
        <Eye size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2>Eye Donation Pledge Form</h2>
        <p className="text-light">
          "Let your eyes live on and light up someone else's world."
        </p>
      </div>

      {error && (
        <div style={{ background: '#ffebee', color: 'var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {user.isEyeDonor ? (
        <div className="card text-center">
          <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>You are already an Eye Donor!</h3>
          <p className="text-light mb-6">
            You have already pledged your eyes. Your donor card can be downloaded from your profile page.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>Go to Profile</button>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <h4 style={{ color: 'var(--error)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Revoke Donation
            </h4>
            <p className="text-light text-sm mb-4">
              If you wish to withdraw your pledge, please head to your profile page and click the "Revoke" button next to your Eye Donor Card.
            </p>
            <button 
              className="btn btn-outline" 
              style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = 'white'; }} 
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)'; }}
              onClick={() => navigate('/profile')}
            >
              Go to Profile to Revoke
            </button>
          </div>
        </div>
      ) : (
        <form className="card" onSubmit={handleSubmit}>
        <h4 className="mb-6" style={{ color: 'var(--primary-dark)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Personal Information</h4>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Full Name <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Age <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="number" name="age" className="form-input" required min="18" max="100" value={formData.age} onChange={handleChange} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label className="form-label">Contact Number <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="tel" name="contact" className="form-input" required value={formData.contact} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Location (City/District) <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="text" name="location" className="form-input" required value={formData.location} onChange={handleChange} />
          </div>
        </div>

        <h4 className="mb-6 mt-8" style={{ color: 'var(--primary-dark)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Next of Kin / Guardian Information</h4>
        <p className="text-light text-sm mb-4">Since eye donation occurs after death, it is vital to inform your family about this pledge.</p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="form-group">
            <label className="form-label">Guardian's Name <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="text" name="guardianName" className="form-input" required value={formData.guardianName} onChange={handleChange} placeholder="Spouse, Child, Parent, etc." />
          </div>
          <div className="form-group">
            <label className="form-label">Guardian's Contact <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="tel" name="guardianContact" className="form-input" required value={formData.guardianContact} onChange={handleChange} />
          </div>
        </div>

        <h4 className="mb-6" style={{ color: 'var(--primary-dark)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Medical Information</h4>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="form-group">
            <label className="form-label">Doctor's Name <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="text" name="doctorName" className="form-input" required value={formData.doctorName} onChange={handleChange} placeholder="e.g. Dr. Smith" />
          </div>
          <div className="form-group">
            <label className="form-label">Doctor's Number <span style={{color: 'var(--error)'}}>*</span></label>
            <input type="tel" name="doctorNumber" className="form-input" required value={formData.doctorNumber} onChange={handleChange} placeholder="Doctor's contact" />
          </div>
        </div>

        <div className="form-group mb-8" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <label className="flex cursor-pointer" style={{ alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              name="pledgeConsent"
              checked={formData.pledgeConsent}
              onChange={handleChange}
              required
              style={{ marginTop: '0.2rem', marginRight: '1rem', width: '1.5rem', height: '1.5rem', accentColor: 'var(--success)', flexShrink: 0 }}
            />
            <div style={{ lineHeight: '1.5' }}>
              <span style={{ fontWeight: 600, display: 'block', color: 'var(--success)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                I pledge to donate my eyes <span style={{color: 'var(--error)'}}>*</span>
              </span>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-light)', display: 'block' }}>
                I declare that I voluntarily pledge to donate my eyes after my death. I have discussed this decision with my family/guardian, and they will coordinate with the nearest eye bank to fulfill my pledge.
              </span>
            </div>
          </label>
        </div>

        <button 
          type="submit" 
          className="btn w-full" 
          style={{ background: 'var(--success)', color: 'white', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
          disabled={loading}
        >
          {loading ? 'Processing...' : (
            <>
              <CheckCircle size={22} /> Donate My Eyes
            </>
          )}
        </button>
      </form>
      )}
    </div>
  );
};

export default EyePledge;
