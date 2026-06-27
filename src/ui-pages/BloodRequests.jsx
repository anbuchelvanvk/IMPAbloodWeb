"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from '../lib/navigation';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase';
import { MapPin, User, Calendar, Droplet, AlertCircle, Share2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOUTH_INDIAN_STATES } from '../utils/locations';

const BloodRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isExhausted, setIsExhausted] = useState(false);

  // Filters
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  
  // Custom Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [loadingProofId, setLoadingProofId] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [daysLeftToDonate, setDaysLeftToDonate] = useState(0);

  const sortRequests = (data) => {
    const list = [...data];
    list.sort((a, b) => {
      if (a.urgency === 'Emergency' && b.urgency !== 'Emergency') return -1;
      if (a.urgency !== 'Emergency' && b.urgency === 'Emergency') return 1;
      if (user) {
        if (a.bloodGroup === user.bloodGroup && b.bloodGroup !== user.bloodGroup) return -1;
        if (a.bloodGroup !== user.bloodGroup && b.bloodGroup === user.bloodGroup) return 1;
      }
      return 0;
    });
    return list;
  };

  useEffect(() => {
    if (!user?.nextEligibleDate) {
      setDaysLeftToDonate(0);
      return;
    }
    const nextTs = new Date(user.nextEligibleDate).getTime();
    if (!Number.isFinite(nextTs)) {
      setDaysLeftToDonate(0);
      return;
    }
    const diffMs = nextTs - Date.now();
    setDaysLeftToDonate(diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0);
  }, [user]);

  useEffect(() => {
    const fetchRequests = async () => {
      let done = false;
      const failOpenTimer = setTimeout(() => {
        if (!done) {
          setLoading(false);
          setRequests([]);
          setFilteredRequests([]);
          setIsExhausted(true);
        }
      }, 9000);
      try {
        setLoading(true);
        let data = [];
        let cursor = null;
        let exhausted = false;
        const canUseAuthedApis = Boolean(user && auth?.currentUser);
        if (canUseAuthedApis && user?.isAdmin) {
          data = await firebaseService.getAllRequestsAdmin();
          exhausted = true;
        } else {
          const page = await firebaseService.getPublicRequestsPage(null, 80);
          data = page?.items || [];
          cursor = page?.nextCursor || null;
          exhausted = !cursor;
        }

        // Filter only Open requests (which means they are verified)
        const openRequests = data.filter(r => r.status === 'Open');
        const sorted = sortRequests(openRequests);
        
        setRequests(sorted);
        setFilteredRequests(sorted);
        setNextCursor(cursor);
        setIsExhausted(exhausted);
      } catch (err) {
        console.error('Failed to load requests:', err);
        setRequests([]);
        setFilteredRequests([]);
        setNextCursor(null);
        setIsExhausted(true);
      } finally {
        done = true;
        clearTimeout(failOpenTimer);
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const loadMorePublicRequests = async () => {
    if ((user && user.isAdmin) || loadingMore || !nextCursor) return;
    try {
      setLoadingMore(true);
      const page = await firebaseService.getPublicRequestsPage(nextCursor, 80);
      const nextItems = page?.items || [];
      setRequests((prev) => {
        const map = new Map(prev.map((r) => [r.id, r]));
        nextItems.forEach((r) => {
          if (r.status === 'Open') map.set(r.id, r);
        });
        return sortRequests(Array.from(map.values()));
      });
      const cursor = page?.nextCursor || null;
      setNextCursor(cursor);
      if (!cursor) setIsExhausted(true);
    } catch (err) {
      console.error('Failed to load more requests:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const openProofModal = async (request) => {
    if (!request?.hasProofImage || loadingProofId === request.id) return;
    try {
      setLoadingProofId(request.id);
      const full = await firebaseService.getPublicRequestById(request.id);
      setSelectedProof({
        patientName: request.patientName,
        proofImage: full?.proofImage || null
      });
    } catch (err) {
      console.error('Failed to load proof image:', err);
    } finally {
      setLoadingProofId('');
    }
  };

  useEffect(() => {
    let result = requests;
    if (filterBloodGroup) {
      result = result.filter(r => r.bloodGroup === filterBloodGroup);
    }
    if (filterState) {
      result = result.filter(r => r.state === filterState);
    }
    if (filterDistrict) {
      result = result.filter(r => r.district === filterDistrict);
    }
    setFilteredRequests(result);
  }, [filterBloodGroup, filterState, filterDistrict, requests]);

  const openDonateModal = (request) => {
    if (!user) return;
    setSelectedRequest(request);
  };

  const confirmDonation = async () => {
    try {
      // 1. Mark the request as Accepted so it disappears from the main list and moves to active chats
      await firebaseService.updateRequestStatus(selectedRequest.id, 'Accepted', user.id);
      firebaseService.invalidateAfterMutation();
      
      // 2. Open a chat session
      await firebaseService.createChatSession(selectedRequest.id, user.id, selectedRequest.requesterId, selectedRequest.patientName);
      firebaseService.invalidateAfterMutation();
      
      // Remove it from the local list so it instantly disappears
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      
      setSelectedRequest(null);
      
      // Navigate to the chat portal
      navigate('/chat');
      
    } catch (err) {
      console.error(err);
      alert("Failed to confirm donation.");
    }
  };

  const handleShare = async (request) => {
    const text = `Check out this urgent blood request for ${request.bloodGroup} at ${request.hospitalName}, ${request.district} in IMPA! I think you can help them instantly. Save a life today!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Urgent Blood Request - IMPA",
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(text + " " + window.location.href);
      setToastMsg("Request details copied to clipboard!");
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 20px', position: 'relative' }}>
      <div className="flex flex-col gap-6" style={{ marginBottom: '3rem' }}>
        <div className="text-center">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Urgent Blood Requests</h2>
          <p className="text-light">Find people in need of your blood type and save a life today.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto flex-wrap justify-center">
          <select 
            className="form-select" 
            style={{ flex: '1 1 150px', marginBottom: 0, padding: '0.75rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 500 }}
            value={filterState}
            onChange={(e) => { setFilterState(e.target.value); setFilterDistrict(''); }}
          >
            <option value="">All States</option>
            {Object.keys(SOUTH_INDIAN_STATES).map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select 
            className="form-select" 
            style={{ flex: '1 1 150px', marginBottom: 0, padding: '0.75rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 500 }}
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            disabled={!filterState}
          >
            <option value="">All Districts</option>
            {filterState && SOUTH_INDIAN_STATES[filterState].map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          
          <select 
            className="form-select" 
            style={{ flex: '1 1 150px', marginBottom: 0, padding: '0.75rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 500 }}
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
          >
            <option value="">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '16px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ height: '22px', width: '70%' }} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="skeleton" style={{ height: '18px', width: '70px', borderRadius: '12px' }} />
                      <div className="skeleton" style={{ height: '18px', width: '80px', borderRadius: '12px' }} />
                    </div>
                    <div className="skeleton" style={{ height: '16px', width: '50%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                  {[['22px', '60%'], ['22px', '80%'], ['22px', '55%'], ['22px', '45%']].map(([h, w], j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="skeleton" style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0 }} />
                      <div className="skeleton" style={{ height: h, width: w }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="skeleton" style={{ height: '44px', flex: 2, borderRadius: '12px' }} />
                  <div className="skeleton" style={{ height: '44px', flex: 1, borderRadius: '12px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card text-center" style={{ padding: '5rem 2rem', border: '1px dashed var(--border)' }}>
          <Droplet size={64} className="text-light mx-auto mb-4" />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No requests found</h3>
          <p className="text-light">There are currently no blood requests matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredRequests.map(request => (
              <motion.div 
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}
              >
                {request.hasProofImage && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ margin: '1rem 1rem 0', width: 'calc(100% - 2rem)' }}
                    onClick={() => openProofModal(request)}
                    disabled={loadingProofId === request.id}
                  >
                    {loadingProofId === request.id ? 'Loading Proof...' : 'View Medical Proof'}
                  </button>
                )}

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(230, 57, 70, 0.3)' }}>
                        {request.bloodGroup}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--secondary)' }}>{request.patientName}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {request.isVerified && (
                            <span style={{ fontSize: '0.75rem', background: '#e8f5e9', color: 'var(--success)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              Verified ✅
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', background: request.urgency === 'Emergency' ? '#ffebee' : '#e3f2fd', color: request.urgency === 'Emergency' ? 'var(--error)' : '#1976d2', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                            {request.urgency === 'Emergency' ? 'Emergency 🚨' : 'Normal 🔵'}
                          </span>
                        </div>
                        <span className="text-light block mt-1" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{request.gender} • <strong className="text-primary">{request.units} Unit(s)</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem', flex: 1, padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertCircle size={22} className="text-primary" />
                      <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text)' }}>{request.diagnosis}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <MapPin size={22} className="text-light" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '1rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
                        <strong>{request.hospitalName}</strong><br/>
                        {request.district}, {request.state}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <User size={22} className="text-light" />
                      <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>
                        Requested by: <strong style={{ color: 'var(--secondary)' }}>{request.requesterName}</strong>
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Calendar size={22} className="text-light" />
                      <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>
                        Posted: {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {!user ? (
                      <Link
                        to="/login"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          flex: 2,
                          justifyContent: 'center',
                          padding: '0.75rem 1.25rem',
                          borderRadius: '12px',
                          border: '1.5px solid var(--border)',
                          background: 'var(--background)',
                          color: 'var(--text-light)',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          textDecoration: 'none',
                          transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'rgba(230,57,70,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-light)'; e.currentTarget.style.background = 'var(--background)'; }}
                      >
                        <Lock size={14} strokeWidth={2.5} />
                        Sign in to donate
                      </Link>
                    ) : (
                      <button 
                        className={`btn w-full ${daysLeftToDonate > 0 ? 'btn-outline' : 'btn-primary'}`}
                        onClick={() => openDonateModal(request)}
                        disabled={daysLeftToDonate > 0}
                        style={{ gap: '0.5rem', flex: 2, ...(daysLeftToDonate > 0 ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                      >
                        <Droplet size={20} />
                        {daysLeftToDonate > 0 ? `${daysLeftToDonate} days left for next donation` : "Let me donate"}
                      </button>
                    )}
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleShare(request)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Share2 size={20} />
                      Share
                    </button>
                  </div>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {(!user || !user.isAdmin) && !isExhausted && (
            <div className="text-center mt-8">
              <button className="btn btn-outline" onClick={loadMorePublicRequests} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {selectedProof?.proofImage && (
        <div
          onClick={() => setSelectedProof(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1005, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div className="card" style={{ maxWidth: '760px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Medical Proof - {selectedProof.patientName}</h3>
            <img src={selectedProof.proofImage} alt="Medical Proof" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border)' }} />
            <button className="btn btn-primary w-full mt-4" onClick={() => setSelectedProof(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card" 
              style={{ width: '100%', maxWidth: '450px', position: 'relative', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Droplet size={40} />
              </div>
              
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--secondary)' }}>Confirm Donation</h3>
              
              <p style={{ fontSize: '1.05rem', color: 'var(--text-light)', marginBottom: '2rem', lineHeight: 1.6 }}>
                You are about to accept the request for <strong>{selectedRequest.patientName}</strong>. <br/>
                A secure <strong>chat portal</strong> will be opened instantly between you and the requester ({selectedRequest.requesterName}) to coordinate the donation safely.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button className="btn btn-outline w-full" onClick={() => setSelectedRequest(null)} style={{ padding: '1rem' }}>
                  Cancel
                </button>
                <button className="btn btn-primary w-full" onClick={confirmDonation} style={{ padding: '1rem' }}>
                  Yes, I'll Donate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      {toastMsg && (
        <div className="toast">
          <div style={{ width: '8px', height: '100%', background: 'var(--success)', position: 'absolute', left: 0, top: 0, borderRadius: '12px 0 0 12px' }}></div>
          <div>
            <h4 style={{ color: 'var(--success)', marginBottom: '0.25rem' }}>Success!</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{toastMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodRequests;
