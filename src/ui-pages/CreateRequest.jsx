"use client";

import React, { useState } from 'react';
import { useNavigate } from '../lib/navigation';
import { FileUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { SOUTH_INDIAN_STATES } from '../utils/locations';
import toast from 'react-hot-toast';

const CreateRequest = () => {
  const MAX_PROOF_BASE64_LEN = 1_500_000;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientName: '',
    diagnosis: '',
    bloodGroup: '',
    units: 1,
    state: '',
    district: '',
    address: '',
    hospitalName: '',
    contactNumber: user ? user.contact : '',
    gender: 'Male',
    urgency: 'Normal'
  });

  const [proofPreview, setProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDonorsPopup, setShowDonorsPopup] = useState(false);
  const [matchingDonors, setMatchingDonors] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStateChange = (e) => {
    setFormData({ ...formData, state: e.target.value, district: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must not exceed 5MB');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max width 640px to keep base64 payload small on Spark/Firestore-only setup
          if (width > 640) {
            height = Math.round((height * 640) / width);
            width = 640;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          if (compressedBase64.length > MAX_PROOF_BASE64_LEN) {
            toast.error('Proof image is still too large after compression. Try a smaller image.');
            setProofPreview(null);
            return;
          }
          setProofPreview(compressedBase64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await firebaseService.createRequest({
        ...formData,
        address: formData.address?.trim() || formData.hospitalName?.trim() || 'N/A',
        requesterId: user.id,
        requesterName: user.name,
        proofImage: proofPreview,
        status: 'Pending Verification'
      });
      firebaseService.invalidateAfterMutation(user.id);
      toast.success('All the details have been sent to admin for further verification.', {
        duration: 5000,
      });

      // Find eligible matching donors
      const donorPage = await firebaseService.getPublicDonorsPage(
        { bloodGroup: formData.bloodGroup, district: formData.district, state: formData.state },
        null,
        60
      );
      const matched = (donorPage?.items || []).filter((d) => d.id !== user.id);

      if (matched.length > 0) {
        setMatchingDonors(matched);
        setShowDonorsPopup(true);
      } else {
        navigate('/requests');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowDonorsPopup(false);
    navigate('/requests');
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      {showDonorsPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              type="button"
              onClick={handleClosePopup}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text)' }}
            >
              &times;
            </button>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', marginTop: '0.5rem' }}>Immediate Donors Available!</h3>
            <p className="text-light mb-6">We found {matchingDonors.length} eligible public donor(s) matching your requested blood group in {formData.district}. You can contact them directly while waiting for admin verification.</p>
            
            <div className="flex flex-col gap-3">
              {matchingDonors.map(donor => (
                <div key={donor.id} style={{ padding: '1rem', background: 'rgba(29, 53, 87, 0.05)', borderRadius: '8px', border: '1px solid rgba(29, 53, 87, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{donor.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {donor.district}, {donor.state}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-primary" style={{ marginBottom: '0.25rem', display: 'inline-block' }}>{donor.bloodGroup}</span>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{donor.contact || 'Protected'}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button type="button" className="btn btn-primary w-full mt-6" onClick={handleClosePopup}>
              Close & View My Requests
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 className="text-center mb-8">Create Blood Request</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Patient Name</label>
              <input type="text" name="patientName" className="form-input" required value={formData.patientName} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-select" required value={formData.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Diagnosis / Reason</label>
              <input type="text" name="diagnosis" className="form-input" required value={formData.diagnosis} onChange={handleChange} placeholder="e.g. Dengue, Surgery, Accident" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Urgency</label>
              <select name="urgency" className="form-select" required value={formData.urgency} onChange={handleChange}>
                <option value="Normal">Normal</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Blood Group Required</label>
              <select name="bloodGroup" className="form-select" required value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A1+">A1+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Units Required</label>
              <input type="number" name="units" className="form-input" required min="1" max="10" value={formData.units} onChange={handleChange} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">State</label>
              <select name="state" className="form-select" required value={formData.state} onChange={handleStateChange}>
                <option value="">Select State</option>
                {Object.keys(SOUTH_INDIAN_STATES).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">District</label>
              <select name="district" className="form-select" required value={formData.district} onChange={handleChange} disabled={!formData.state}>
                <option value="">Select District</option>
                {formData.state && SOUTH_INDIAN_STATES[formData.state].map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Hospital Name & Address</label>
              <textarea name="hospitalName" className="form-textarea" required rows="3" value={formData.hospitalName} onChange={handleChange}></textarea>
            </div>
            
            <div className="form-group">
              <label className="form-label">Contact Number (For Donor)</label>
              <input type="tel" name="contactNumber" className="form-input" required value={formData.contactNumber} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Medical Proof (Doctor Receipt / Report) (Optional)</label>
            <div style={{ border: '2px dashed var(--border)', padding: '2rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => document.getElementById('proofInput').click()}>
              {proofPreview ? (
                <img src={proofPreview} alt="Proof preview" style={{ maxHeight: '150px', margin: '0 auto' }} />
              ) : (
                <div className="flex-col items-center gap-2">
                  <FileUp size={40} className="text-light" />
                  <span className="text-light block mb-1">Click to upload image</span>
                  <span className="text-light block" style={{ fontSize: '0.8rem', opacity: 0.7 }}>(Max 5MB)</span>
                </div>
              )}
              <input type="file" id="proofInput" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            </div>
            {!proofPreview && (
              <p className="text-light" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Upload is optional but helps with faster admin verification.
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full mt-8" disabled={loading}>
            {loading ? 'Submitting...' : 'Post Blood Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
