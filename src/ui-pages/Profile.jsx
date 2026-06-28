"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { Camera, Edit2, Save, X, User, Download, Share2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { SOUTH_INDIAN_STATES } from '../utils/locations';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { generateAvatar } from '../utils/avatarGenerator';

const Profile = () => {
  const { user, updateUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [certificates, setCertificates] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  
  useEffect(() => {
    if (user && user.id) {
      setDataLoading(true);
      Promise.all([
        firebaseService.getUserDonations(user.id),
        firebaseService.getUserRequests(user.id)
      ])
        .then(([donations, requests]) => {
          const fetchedCerts = donations.map((donation, index) => {
            const d = new Date(donation.updatedAt || donation.createdAt);
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            return {
              id: donation.id || index,
              date: dateStr,
              place: donation.district || 'Hospital'
            };
          });
          setCertificates(fetchedCerts);
          const active = requests.filter(r => r.status !== 'Fulfilled' && r.status !== 'ended' && r.status !== 'cancelled');
          setActiveRequests(active);
        })
        .catch(err => console.error("Error loading profile history:", err))
        .finally(() => setDataLoading(false));
    } else if (user === null) {
      setDataLoading(false);
    }
  }, [user]);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contact: user?.contact || '',
    bloodGroup: user?.bloodGroup || '',
    state: user?.state || '',
    district: user?.district || '',
    lastDonationDate: user?.lastDonationDate ? new Date(user.lastDonationDate).toISOString().split('T')[0] : ''
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);

  if (dataLoading) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ height: '32px', width: '140px' }} />
            <div className="skeleton" style={{ height: '40px', width: '120px', borderRadius: '12px' }} />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="skeleton mx-auto" style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '1rem' }} />
            <div className="skeleton mx-auto" style={{ height: '26px', width: '160px', marginBottom: '0.5rem' }} />
            <div className="skeleton mx-auto" style={{ height: '18px', width: '120px' }} />
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            {[['100%', '120px'], ['100%', '80px'], ['100%', '100px'], ['100%', '110px']].map(([w, hw], i) => (
              <div key={i}>
                <div className="skeleton" style={{ height: '14px', width: '90px', marginBottom: '0.4rem' }} />
                <div className="skeleton" style={{ height: '20px', width: hw }} />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <div className="skeleton" style={{ height: '14px', width: '120px', marginBottom: '0.4rem' }} />
              <div className="skeleton" style={{ height: '20px', width: '150px' }} />
            </div>
          </div>
          <div style={{ marginTop: '2.5rem' }}>
            <div className="skeleton" style={{ height: '24px', width: '200px', marginBottom: '1rem' }} />
            <div style={{ background: 'var(--background)', borderRadius: '8px', padding: '1rem' }}>
              <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ height: '16px', width: '60%' }} />
            </div>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <div className="skeleton" style={{ height: '24px', width: '140px', marginBottom: '1rem' }} />
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="skeleton" style={{ height: '20px', width: '140px', marginBottom: '0.4rem' }} />
                <div className="skeleton" style={{ height: '16px', width: '200px' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="skeleton" style={{ height: '40px', width: '80px', borderRadius: '12px' }} />
                <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '12px' }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div className="skeleton" style={{ height: '22px', width: '160px', marginBottom: '1rem' }} />
            {[1, 2].map((_, i) => (
              <div key={i} style={{ background: 'var(--background)', borderRadius: '8px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div className="skeleton" style={{ height: '18px', width: '160px', marginBottom: '0.4rem' }} />
                  <div className="skeleton" style={{ height: '14px', width: '100px' }} />
                </div>
                <div className="skeleton" style={{ height: '36px', width: '110px', borderRadius: '12px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container text-center" style={{ padding: '5rem 0' }}>
        <h2>Login Required</h2>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setFormData({ ...formData, state: value, district: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setFormData({ ...formData, profilePic: imageSrc });
    setIsCameraOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      
      // Scrub profilePic entirely from the payload to save database space
      let payload = { ...formData };
      if ('profilePic' in payload) {
        delete payload.profilePic;
      }
      
      if (payload.lastDonationDate) {
        payload.lastDonationDate = new Date(payload.lastDonationDate).toISOString();
        const eligible = new Date(payload.lastDonationDate);
        eligible.setDate(eligible.getDate() + 90);
        payload.nextEligibleDate = eligible.toISOString();
      } else {
        payload.lastDonationDate = null;
        payload.nextEligibleDate = null;
      }
      
      const updatedUser = await firebaseService.updateUserProfile(user.id, payload);
      if (updatedUser) {
        updateUser(updatedUser);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const revokeDonation = async (type) => {
    if (!window.confirm(`Are you sure you want to revoke your ${type} donor status? This will permanently remove your donor card for this service.`)) return;
    
    try {
      setLoading(true);
      const updates = {};
      if (type === 'blood') {
        updates.isBloodDonor = false;
        updates.bloodDonorId = null;
        updates.bloodGroup = null;
        updates.lastDonationDate = null;
        updates.nextEligibleDate = null;
      }
      if (type === 'food') {
        updates.isFoodDonor = false;
        updates.foodDonorId = null;
        updates.foodType = null;
        updates.foodFrequency = null;
        updates.trustName = null;
        updates.fssaiNumber = null;
      }
      if (type === 'eye') {
        updates.isEyeDonor = false;
        updates.eyeDonorId = null;
        updates.eyeDonationConsent = false;
        updates.guardianName = null;
        updates.guardianContact = null;
        updates.doctorName = null;
        updates.doctorNumber = null;
      }
      
      const updated = await firebaseService.updateUserProfile(user.id, updates);
      if (updated) {
        updateUser(updated);
        toast.success(`Your ${type} donation pledge has been revoked.`);
      }
    } catch (err) {
      toast.error("Failed to revoke donation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = (type) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Draw text
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'right';
      ctx.fillText(user.name, canvas.width - 50, canvas.height - 110); 
      
      let donorId = '';
      if (type === 'blood') donorId = user.bloodDonorId;
      if (type === 'food') donorId = user.foodDonorId;
      if (type === 'eye') donorId = user.eyeDonorId;
      
      if (donorId) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = type === 'eye' ? '#10b981' : type === 'food' ? '#f59e0b' : '#e63946';
        ctx.fillText(`ID: ${donorId}`, canvas.width - 50, canvas.height - 70); 
      }
      
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, img.width, img.height);
      pdf.save(`${type.charAt(0).toUpperCase() + type.slice(1)}_Donor_Card.pdf`);
    };
    img.src = `/${type} donarcard.png`;
  };

  const shareCard = (type) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'right';
      ctx.fillText(user.name, canvas.width - 50, canvas.height - 110); 
      
      let donorId = '';
      if (type === 'blood') donorId = user.bloodDonorId;
      if (type === 'food') donorId = user.foodDonorId;
      if (type === 'eye') donorId = user.eyeDonorId;
      
      if (donorId) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = type === 'eye' ? '#10b981' : type === 'food' ? '#f59e0b' : '#e63946';
        ctx.fillText(`ID: ${donorId}`, canvas.width - 50, canvas.height - 70); 
      }
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${type.charAt(0).toUpperCase() + type.slice(1)}_Donor_Card.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `My ${type.charAt(0).toUpperCase() + type.slice(1)} Donor Card`,
              text: `Got my ${type} donor card with IMPA, get yours now!`,
              files: [file]
            });
            toast.success("Shared successfully!");
          } catch (err) {
            console.error('Error sharing:', err);
          }
        } else {
          toast('Your browser does not support native file sharing. Download the card to share it!', {
            icon: 'ℹ️'
          });
        }
      }, 'image/png');
    };
    img.src = `/${type} donarcard.png`;
  };

  const downloadCertificate = (cert) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      ctx.font = 'bold 50px Arial';
      ctx.fillStyle = '#c1121f'; 
      ctx.textAlign = 'center';
      ctx.fillText(user.name.toUpperCase(), canvas.width / 2, canvas.height * 0.515); 
      
      ctx.font = '26px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(cert.date, canvas.width * 0.27, canvas.height * 0.74); 
      ctx.fillText(cert.place, canvas.width * 0.27, canvas.height * 0.82);
      
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, img.width, img.height);
      pdf.save(`Certificate_${cert.date.replace(/\//g, '-')}.pdf`);
    };
    img.src = '/certificate_template.png';
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ margin: 0 }}>My Profile</h2>
          {!isEditing && (
            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>

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

        <div className="text-center mb-8">
          <img 
            src={user.profilePic || generateAvatar(user.name)} 
            alt="Profile" 
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--background)' }} 
          />
          <h3 className="mt-4">{user.name}</h3>
          <p className="text-light">{user.contact}</p>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="contact" className="form-input" required value={formData.contact} onChange={handleChange} pattern="[0-9]{10}" title="10 digit mobile number" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select name="bloodGroup" className="form-select" required value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">State</label>
                <select name="state" className="form-select" required value={formData.state} onChange={handleChange}>
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

            <div className="form-group mt-4">
              <label className="form-label">Last Blood Donation Date (Optional)</label>
              <input type="date" name="lastDonationDate" className="form-input" max={new Date().toISOString().split('T')[0]} value={formData.lastDonationDate} onChange={handleChange} />
              <p className="text-light mt-1" style={{ fontSize: '0.85rem' }}>Update this if you have donated in the last 3 months.</p>
            </div>

            <div className="flex gap-4 mt-8">
              <button type="submit" className="btn btn-primary flex-1" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-outline flex-1" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => { setIsEditing(false); setIsCameraOpen(false); }}>
                <X size={18} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 mt-8">
            <div>
              <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Email Address</p>
              <p style={{ fontWeight: 500 }}>{user.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Blood Group</p>
              <p style={{ fontWeight: 500 }}>{user.bloodGroup}</p>
            </div>
            <div>
              <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>State</p>
              <p style={{ fontWeight: 500 }}>{user.state}</p>
            </div>
            <div>
              <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>District</p>
              <p style={{ fontWeight: 500 }}>{user.district}</p>
            </div>
            <div className="col-span-2">
              <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Account Created</p>
              <p style={{ fontWeight: 500 }}>{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            {(user.lastDonationDate || certificates.length > 0) && (
              <div className="col-span-2" style={{ background: 'rgba(230, 57, 70, 0.05)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(230, 57, 70, 0.1)' }}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Last Blood Donation</p>
                    <p style={{ fontWeight: 600, color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>
                      {user.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : certificates[0].date}
                    </p>
                  </div>
                  <div>
                    <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Next Eligible Date</p>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '1.1rem', color: 'var(--secondary)' }}>
                      {(() => {
                        let nextDate;
                        if (user.nextEligibleDate) {
                          nextDate = new Date(user.nextEligibleDate);
                        } else {
                          const parts = certificates[0].date.split('/');
                          const lastDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                          nextDate = new Date(lastDate);
                          nextDate.setDate(nextDate.getDate() + 90);
                        }
                        const today = new Date();
                        if (today >= nextDate) return "Eligible Now";
                        return nextDate.toLocaleDateString();
                      })()}
                    </p>
                  </div>
                </div>
                <p className="text-light mt-3" style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                  <strong style={{color: 'var(--text)'}}>Reminder:</strong> A minimum gap of 3 months (90 days) is required between blood donations for your safety and health.
                </p>
              </div>
            )}
          </div>
        )}

        {!isEditing && (
          <div className="mt-8">
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Active Blood Requests</h3>
              {activeRequests.length === 0 ? (
                <p className="text-light" style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', textAlign: 'center' }}>
                  You have no active blood requests with a generated PIN.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--background)', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead style={{ background: 'rgba(230, 57, 70, 0.1)' }}>
                      <tr>
                        <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '1rem', fontWeight: 600 }}>Location</th>
                        <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '1rem', fontWeight: 600 }}>Donation PIN (OTP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRequests.map(req => (
                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem' }}>{req.hospitalName}, {req.district}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              background: req.status === 'Accepted' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 193, 7, 0.1)', 
                              color: req.status === 'Accepted' ? '#00c853' : '#ff9800', 
                              padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 
                            }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ background: '#2b2d42', color: 'white', padding: '6px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', letterSpacing: '2px' }}>
                              {req.otp || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-light mt-2" style={{ fontSize: '0.85rem' }}>* Share this PIN with the donor only when they have successfully donated blood.</p>
                </div>
              )}
            </div>

            <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Downloads</h3>
            
            {user.isBloodDonor && (
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--primary-dark)' }}>Blood Donor Card</h4>
                    <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>Official IMPA Blood Donor ID {user.bloodDonorId && `(${user.bloodDonorId})`}</p>
                  </div>
                  <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => revokeDonation('blood')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--error)', color: 'var(--error)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = 'white'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)'; }}>
                      Revoke
                    </button>
                    <button className="btn btn-outline" onClick={() => shareCard('blood')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Share2 size={18} /> Share
                    </button>
                    <button className="btn btn-primary" onClick={() => downloadCard('blood')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Download size={18} /> Download
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {user.isFoodDonor && (
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--warning-dark, #b45309)' }}>Food Donor Card</h4>
                    <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>Official IMPA Food Donor ID {user.foodDonorId && `(${user.foodDonorId})`}</p>
                  </div>
                  <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => revokeDonation('food')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--error)', color: 'var(--error)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = 'white'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)'; }}>
                      Revoke
                    </button>
                    <button className="btn btn-outline" onClick={() => shareCard('food')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Share2 size={18} /> Share
                    </button>
                    <button className="btn btn-primary" style={{ background: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => downloadCard('food')}>
                      <div className="flex items-center gap-2"><Download size={18} /> Download</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {user.isEyeDonor && (
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--success)' }}>Eye Donor Pledge Card</h4>
                    <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>Official IMPA Eye Donor Pledge {user.eyeDonorId && `(${user.eyeDonorId})`}</p>
                  </div>
                  <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => revokeDonation('eye')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--error)', color: 'var(--error)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = 'white'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)'; }}>
                      Revoke
                    </button>
                    <button className="btn btn-outline" onClick={() => shareCard('eye')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Share2 size={18} /> Share
                    </button>
                    <button className="btn" style={{ background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => downloadCard('eye')}>
                      <Download size={18} /> Download Card
                    </button>
                  </div>
                </div>
              </div>
            )}

            <h4 style={{ marginBottom: '1rem' }}>My Certificates</h4>
            <div className="grid gap-4">
              {certificates.length === 0 ? (
                <p className="text-light" style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', textAlign: 'center' }}>
                  You have no certificates yet. Complete a donation to earn one!
                </p>
              ) : (
                certificates.map(cert => (
                  <div key={cert.id} style={{ background: 'var(--background)', padding: '1rem 1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', margin: 0 }}>Donated on {cert.date}</p>
                      <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>Location: {cert.place}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => downloadCertificate(cert)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                      <Download size={16} /> Certificate
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
