"use client";

import React, { useState, useEffect } from 'react';
import { SOUTH_INDIAN_STATES } from '../utils/locations';
import { Camera, Utensils, HeartHandshake, MapPin, IndianRupee, QrCode, Phone, User, Users, CheckCircle } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '../lib/navigation';

const FoodDonation = () => {
  const MAX_PROOF_BASE64_LEN = 1_500_000;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('donate'); // donate, request, money
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Lists
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);

  // General Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    state: '',
    district: '',
    foodDetails: '',
    quantity: '',
    fssai: '',
    trustName: '',
    peopleCount: '',
  });

  const loadData = async () => {
    try {
      const [dons, reqs] = await Promise.all([
        firebaseService.getAllFoodDonations(),
        firebaseService.getAllFoodRequests()
      ]);
      setDonations(dons.filter(d => d.status === 'Available'));
      setRequests(reqs.filter(r => r.status === 'Open'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleStateChange = (e) => setFormData({ ...formData, state: e.target.value, district: '' });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > 640) { height = Math.round((height * 640) / width); width = 640; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.5);
          if (compressed.length > MAX_PROOF_BASE64_LEN) {
            alert("Image is still too large after compression. Please choose a smaller file.");
            setPreviewImage(null);
            return;
          }
          setPreviewImage(compressed);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === 'donate') {
        await firebaseService.createFoodDonation({
          name: formData.name,
          contact: formData.contact,
          state: formData.state,
          district: formData.district,
          foodDetails: formData.foodDetails,
          quantity: formData.quantity,
          fssai: formData.fssai,
          donorId: user?.id || 'anonymous'
        });
        firebaseService.invalidateAfterMutation(user?.id || null);
        alert("Food Donation posted successfully!");
      } else if (activeTab === 'request') {
        if (!previewImage) {
          alert("Please upload a picture of the Trust/Home.");
          setLoading(false);
          return;
        }
        await firebaseService.createFoodRequest({
          trustName: formData.trustName,
          contact: formData.contact,
          state: formData.state,
          district: formData.district,
          peopleCount: formData.peopleCount,
          proofImage: previewImage,
          requesterId: user?.id || 'anonymous'
        });
        firebaseService.invalidateAfterMutation(user?.id || null);
        alert("Food Request submitted successfully!");
      }
      
      setFormData({ name: '', contact: '', state: '', district: '', foodDetails: '', quantity: '', fssai: '', trustName: '', peopleCount: '' });
      setPreviewImage(null);
      loadData(); // Refresh the previews
    } catch (err) {
      console.error(err);
      alert("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFood = async (item, type) => {
    if (!user) {
      alert("Please login first to accept.");
      navigate('/login');
      return;
    }
    
    try {
      if (type === 'donate') {
        if (user.id === item.donorId) {
          alert("You cannot accept your own donation.");
          return;
        }
        await firebaseService.createChatSession(item.id, item.donorId, user.id, item.name + " (Food)");
      } else {
        if (user.id === item.requesterId) {
          alert("You cannot fulfill your own request.");
          return;
        }
        await firebaseService.createChatSession(item.id, user.id, item.requesterId, item.trustName + " (Food)");
      }
      navigate('/chat');
    } catch (err) {
      console.error(err);
      alert("Failed to start chat session.");
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="text-center mb-10">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Food Donation Portal</h2>
        <p className="text-light" style={{ marginBottom: '2rem' }}>Share your excess food, request for an orphanage, or provide financial support.</p>
        
        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button 
            className={`btn ${activeTab === 'donate' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('donate')}
          >
            <Utensils size={20} /> Donate Food
          </button>
          <button 
            className={`btn ${activeTab === 'request' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('request')}
          >
            <HeartHandshake size={20} /> Request Food
          </button>
          <button 
            className={`btn ${activeTab === 'money' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('money')}
          >
            <IndianRupee size={20} /> Financial Support
          </button>
        </div>
      </div>

      {/* PREVIEWS SECTION */}
      {activeTab === 'donate' && donations.length > 0 && (
        <div className="mb-10">
          <h3 className="mb-4 text-center">Available Food Donations</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map(d => (
              <div key={d.id} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div style={{ background: 'rgba(42, 157, 143, 0.1)', color: 'var(--success)', padding: '10px', borderRadius: '50%' }}>
                    <Utensils size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--success)' }}>{d.name}</h4>
                    <span className="text-light" style={{ fontSize: '0.85rem' }}>Posted: {new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{d.foodDetails}</p>
                <div className="flex items-center gap-2 text-light" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <Users size={16} /> Feeds approx. <strong>{d.quantity}</strong> people
                </div>
                <div className="flex items-center gap-2 text-light" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <MapPin size={16} /> {d.district}, {d.state}
                </div>
                <div className="flex items-center gap-2 text-light" style={{ fontSize: '0.9rem' }}>
                  <Phone size={16} /> {d.contact}
                </div>
                <button 
                  className="btn btn-outline w-full mt-4" 
                  onClick={() => handleAcceptFood(d, 'donate')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <CheckCircle size={18} /> Accept Donation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'request' && requests.length > 0 && (
        <div className="mb-10">
          <h3 className="mb-4 text-center">Active Food Requests</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(r => (
              <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {r.proofImage && (
                  <div style={{ height: '140px', overflow: 'hidden' }}>
                    <img src={r.proofImage} alt="Trust" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '50%' }}>
                      <HeartHandshake size={20} />
                    </div>
                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>{r.trustName}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-light" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <Users size={16} /> Needs food for <strong>{r.peopleCount}</strong> people
                  </div>
                  <div className="flex items-center gap-2 text-light" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <MapPin size={16} /> {r.district}, {r.state}
                  </div>
                  <div className="flex items-center gap-2 text-light" style={{ fontSize: '0.9rem' }}>
                    <Phone size={16} /> {r.contact}
                  </div>
                  <button 
                    className="btn btn-primary w-full mt-4" 
                    onClick={() => handleAcceptFood(r, 'request')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <CheckCircle size={18} /> Fulfill Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '3rem 0' }} />

      {/* FORM AREA */}
      <div className="card mx-auto" style={{ maxWidth: '700px' }}>
        
        {/* DONATE FOOD TAB */}
        {activeTab === 'donate' && (
          <form onSubmit={handleSubmit}>
            <h3 className="mb-6 text-center">Post a New Food Donation</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Donor / Restaurant Name</label>
                <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input type="tel" name="contact" className="form-input" required value={formData.contact} onChange={handleChange} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">State</label>
                <select name="state" className="form-select" required value={formData.state} onChange={handleStateChange}>
                  <option value="">Select State</option>
                  {Object.keys(SOUTH_INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <select name="district" className="form-select" required value={formData.district} onChange={handleChange} disabled={!formData.state}>
                  <option value="">Select District</option>
                  {formData.state && SOUTH_INDIAN_STATES[formData.state].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Food Details (Items, Veg/Non-Veg, Cooked time)</label>
              <textarea name="foodDetails" className="form-textarea" rows="3" required value={formData.foodDetails} onChange={handleChange}></textarea>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Approx. Quantity (No. of People)</label>
                <input type="number" name="quantity" className="form-input" required value={formData.quantity} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">FSSAI Number (Optional)</label>
                <input type="text" name="fssai" className="form-input" placeholder="If donating from a restaurant" value={formData.fssai} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
              {loading ? 'Posting...' : <><Utensils size={20} /> Post Food Donation</>}
            </button>
          </form>
        )}

        {/* REQUEST FOOD TAB */}
        {activeTab === 'request' && (
          <form onSubmit={handleSubmit}>
            <h3 className="mb-6 text-center">Submit a New Food Request</h3>
            
            <div className="form-group">
              <label className="form-label">Trust / Orphanage Picture (Proof)</label>
              <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: '12px', background: 'var(--background)' }}>
                {previewImage ? (
                  <div>
                    <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '1rem' }} />
                    <br/>
                    <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                      <Camera size={18} /> Change Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    </label>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Camera size={40} className="text-light mb-2" />
                    <span className="text-secondary font-medium">Click to upload Trust/Home picture</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} required />
                  </label>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Trust / Home Name</label>
                <input type="text" name="trustName" className="form-input" required value={formData.trustName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person Number</label>
                <input type="tel" name="contact" className="form-input" required value={formData.contact} onChange={handleChange} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">State</label>
                <select name="state" className="form-select" required value={formData.state} onChange={handleStateChange}>
                  <option value="">Select State</option>
                  {Object.keys(SOUTH_INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <select name="district" className="form-select" required value={formData.district} onChange={handleChange} disabled={!formData.state}>
                  <option value="">Select District</option>
                  {formData.state && SOUTH_INDIAN_STATES[formData.state].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">No. of People to Feed</label>
              <input type="number" name="peopleCount" className="form-input" required value={formData.peopleCount} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
              {loading ? 'Submitting...' : <><HeartHandshake size={20} /> Submit Request</>}
            </button>
          </form>
        )}

        {/* FINANCIAL SUPPORT TAB */}
        {activeTab === 'money' && (
          <div className="text-center">
            <h3 className="mb-4">Sponsor a Meal</h3>
            <p className="text-light mb-8">Your financial contributions help us provide fresh, nutritious meals to registered orphanages and trusts across the state.</p>
            
            <div className="grid md:grid-cols-2 gap-8 items-center" style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px' }}>
              <div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', boxShadow: 'var(--shadow-sm)' }}>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=impabloodweb@okbank&pn=impabloodweb&cu=INR" alt="UPI QR Code" style={{ width: '200px', height: '200px' }} />
                </div>
                <p className="mt-4 font-bold text-secondary flex justify-center items-center gap-2">
                  <QrCode size={20} /> Scan to Pay via UPI
                </p>
                <p className="text-light text-sm">GPay / PhonePe / Paytm</p>
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Direct Bank Transfer</h4>
                <div className="form-group mb-2">
                  <label className="text-light text-sm">Account Name</label>
                  <strong style={{ fontSize: '1.1rem' }}>IMPA</strong>
                </div>
                <div className="form-group mb-2">
                  <label className="text-light text-sm">Account Number</label>
                  <strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>1029 3847 5610 9922</strong>
                </div>
                <div className="form-group mb-2">
                  <label className="text-light text-sm">IFSC Code</label>
                  <strong style={{ fontSize: '1.1rem' }}>SBIN0012345</strong>
                </div>
                <div className="form-group">
                  <label className="text-light text-sm">Bank Branch</label>
                  <strong style={{ fontSize: '1.1rem' }}>State Bank of India, Main Branch</strong>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <p className="text-light text-sm flex items-center justify-center gap-2">
                <IndianRupee size={16} /> All donations are exempt under Section 80G of Income Tax Act.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FoodDonation;
