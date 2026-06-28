"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { Trash2, Eye, Download, Users, Utensils, HeartHandshake, Droplet, Search } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [foodDonations, setFoodDonations] = useState([]);
  const [foodRequests, setFoodRequests] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  
  const [activeTab, setActiveTab] = useState('bloodRequests'); // bloodRequests, users, foodDonations, foodRequests, donationHistory
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRequestView, setSelectedRequestView] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [adminCounts, setAdminCounts] = useState({ users: 0 });
  
  const [userRequests, setUserRequests] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const fetchAttemptRef = useRef(0);
  const loadedTabsRef = useRef(new Set());
  const isPendingRequest = (r) => r?.status === 'Pending' || r?.status === 'Pending Verification';

  const loadTabData = (tab, force = false) => {
    if (!force && loadedTabsRef.current.has(tab)) return () => {};
    const attempt = ++fetchAttemptRef.current;
    let cancelled = false;
    setLoadError('');
    setLoading(true);
    (async () => {
      try {
        if (tab === 'bloodRequests') {
          const data = await firebaseService.getAllRequestsAdmin();
          if (cancelled || attempt !== fetchAttemptRef.current) return;
          setBloodRequests(data || []);
        } else if (tab === 'users') {
          const data = await firebaseService.getAllUsers();
          if (cancelled || attempt !== fetchAttemptRef.current) return;
          setUsers(data || []);
        } else if (tab === 'foodDonations') {
          const data = await firebaseService.getAllFoodDonations();
          if (cancelled || attempt !== fetchAttemptRef.current) return;
          setFoodDonations(data || []);
        } else if (tab === 'foodRequests') {
          const data = await firebaseService.getAllFoodRequests();
          if (cancelled || attempt !== fetchAttemptRef.current) return;
          setFoodRequests(data || []);
        } else if (tab === 'donationHistory') {
          const data = await firebaseService.getAllDonationHistory();
          if (cancelled || attempt !== fetchAttemptRef.current) return;
          setDonationHistory(data || []);
        }
        if (cancelled || attempt !== fetchAttemptRef.current) return;
        loadedTabsRef.current.add(tab);
      } catch (err) {
        if (cancelled || attempt !== fetchAttemptRef.current) return;
        console.error("Error fetching admin data:", err);
        setLoadError(`Failed to load ${tab}. Please retry.`);
      } finally {
        if (cancelled || attempt !== fetchAttemptRef.current) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    const cleanup = loadTabData(activeTab);
    return cleanup;
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const counts = await firebaseService.getAdminCounts();
        if (cancelled) return;
        setAdminCounts({
          users: Number(counts?.users || 0)
        });
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await firebaseService.deleteUser(id);
        firebaseService.invalidateAfterMutation();
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        console.error("Failed to delete user", err);
        alert("Failed to delete user. Check console for details.");
      }
    }
  };

  const handleSelectUser = async (u) => {
    setSelectedUser(u);
    setLoadingDetails(true);
    try {
      const reqs = await firebaseService.getUserRequests(u.id);
      const dons = await firebaseService.getUserDonations(u.id);
      setUserRequests(reqs);
      setUserDonations(dons);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleVerifyRequest = async (requestId) => {
    try {
      await firebaseService.verifyRequest(requestId);
      firebaseService.invalidateAfterMutation();
      // Update local state
      setBloodRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Open', isVerified: true } : r));
    } catch (err) {
      console.error(err);
      alert("Failed to verify request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to reject and permanently delete this request?")) {
      try {
        await firebaseService.deleteDocument('requests', requestId);
        firebaseService.invalidateAfterMutation();
        setBloodRequests(prev => prev.filter(r => r.id !== requestId));
        setSelectedRequestView(null);
      } catch (err) {
        console.error("Failed to reject request", err);
        alert("Failed to reject request.");
      }
    }
  };

  const toCsv = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const esc = (v) => `"${String(v ?? '').replaceAll('\"', '\\"')}"`;
    return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  };

  const triggerDownload = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {

    // 1. Users Sheet
    const usersData = users.map(u => ({
      Name: u.name,
      Contact: u.contact,
      Email: u.email || 'N/A',
      BloodGroup: u.bloodGroup,
      Role: u.isAdmin ? 'Admin' : 'User',
      JoinedAt: new Date(u.createdAt).toLocaleDateString()
    }));

    // 2. Blood Requests Sheet
    const bloodRequestsData = bloodRequests.map(r => ({
      PatientName: r.patientName,
      BloodGroup: r.bloodGroup,
      UnitsNeeded: r.units,
      Hospital: r.hospitalName,
      Diagnosis: r.diagnosis,
      Location: `${r.district}, ${r.state}`,
      Urgency: r.urgency,
      Status: r.status,
      RequesterName: r.requesterName,
      RequestedAt: new Date(r.createdAt).toLocaleDateString()
    }));

    // 3. Donation History Sheet
    const donationHistoryData = donationHistory.map(h => {
      const donor = users.find(u => u.id === h.donorId);
      return {
        PatientName: h.patientName,
        BloodGroup: h.bloodGroup,
        Hospital: h.hospitalName,
        Location: `${h.district}, ${h.state}`,
        RequesterName: h.requesterName,
        ContributedBy: donor ? donor.name : 'Unknown Donor',
        CompletedAt: new Date(h.updatedAt || h.createdAt).toLocaleString()
      };
    });

    // 4. Food Donations Sheet
    const foodDonationsData = foodDonations.map(d => ({
      DonorName: d.name,
      Contact: d.contact,
      FoodDetails: d.foodDetails,
      QuantityPax: d.quantity,
      Location: `${d.district}, ${d.state}`,
      Status: d.status,
      DonatedAt: new Date(d.createdAt).toLocaleDateString()
    }));

    // 5. Food Requests Sheet
    const foodRequestsData = foodRequests.map(r => ({
      TrustName: r.trustName,
      Contact: r.contact,
      PeopleCount: r.peopleCount,
      Location: `${r.district}, ${r.state}`,
      Status: r.status,
      RequestedAt: new Date(r.createdAt).toLocaleDateString()
    }));



    triggerDownload('users.csv', toCsv(usersData));
    triggerDownload('blood_requests.csv', toCsv(bloodRequestsData));
    triggerDownload('donation_history.csv', toCsv(donationHistoryData));
    triggerDownload('food_donations.csv', toCsv(foodDonationsData));
    triggerDownload('food_requests.csv', toCsv(foodRequestsData));
  };

  const handleBulkDeleteHackers = async () => {
    const fakes = users.filter(u => 
      (u.name && (u.name.includes("ALL DATA LEAKED") || u.name.includes("ZERO SECURITY"))) || 
      (u.bloodGroup && u.bloodGroup.includes("ZERO SECURITY")) ||
      (u.email && u.email.includes(".17799")) // matching the timestamp pattern seen in screenshots
    );
    
    if (fakes.length === 0) {
      alert("No fake hacker accounts found in the database.");
      return;
    }

    if (window.confirm(`Found ${fakes.length} fake accounts. Do you want to delete all of them permanently?`)) {
      try {
        // We delete them one by one to respect firestore rules
        for (const fake of fakes) {
          await firebaseService.deleteUser(fake.id);
          firebaseService.invalidateAfterMutation();
        }
        setUsers(users.filter(u => !fakes.some(f => f.id === u.id)));
        alert(`Successfully deleted ${fakes.length} fake accounts!`);
      } catch (err) {
        console.error("Error bulk deleting:", err);
        alert("Some accounts could not be deleted. Please check console.");
      }
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="flex justify-between items-center mb-8">
        <div className="skeleton" style={{ height: '36px', width: '220px' }} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '44px', width: '180px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '44px', width: '130px', borderRadius: '12px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[140, 160, 110, 140, 130].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: '44px', width: `${w}px`, borderRadius: '12px' }} />
        ))}
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="grid md:grid-cols-2 gap-8">
          {['Emergency 🚨', 'Normal 🔵'].map((col, ci) => (
            <div key={ci}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border)' }}>
                <div className="skeleton" style={{ height: '26px', width: '130px' }} />
                <div className="skeleton" style={{ height: '24px', width: '32px', borderRadius: '12px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div className="skeleton" style={{ height: '20px', width: '60%' }} />
                      <div className="skeleton" style={{ height: '20px', width: '70px', borderRadius: '12px' }} />
                    </div>
                    <div className="skeleton" style={{ height: '16px', width: '80%' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (loadError) {
    return (
      <div className="container text-center" style={{ padding: '4rem 0' }}>
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <p className="text-light" style={{ marginBottom: '1rem' }}>{loadError}</p>
          <button className="btn btn-primary" onClick={() => loadTabData(activeTab, true)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="flex justify-between items-center mb-8">
        <h2>Admin Dashboard</h2>
        <div className="flex gap-4">
          <button className="btn" style={{ background: 'var(--error)', color: 'white' }} onClick={handleBulkDeleteHackers}>
            <Trash2 size={18} /> Clean Up Fake Accounts
          </button>
          <button className="btn btn-outline" onClick={downloadExcel}>
            <Download size={18} /> Export Data
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <button className={`btn ${activeTab === 'bloodRequests' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('bloodRequests')}>
          <Droplet size={18} /> Blood Requests
        </button>
        <button className={`btn ${activeTab === 'donationHistory' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('donationHistory')}>
          <HeartHandshake size={18} /> Donation History
        </button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')}>
          <Users size={18} /> Users ({adminCounts.users > 0 ? adminCounts.users : users.length})
        </button>
        <button className={`btn ${activeTab === 'foodDonations' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('foodDonations')}>
          <Utensils size={18} /> Food Donations
        </button>
        <button className={`btn ${activeTab === 'foodRequests' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('foodRequests')}>
          <HeartHandshake size={18} /> Food Requests
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {activeTab === 'bloodRequests' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Emergency Column */}
            <div>
              <div className="flex justify-between items-center mb-4 pb-2" style={{ borderBottom: '2px solid var(--border)' }}>
                <h3 style={{ color: 'var(--error)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Emergency 🚨
                </h3>
                <span style={{ background: 'var(--error)', color: 'white', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {bloodRequests.filter(r => r.urgency === 'Emergency' && r.status !== 'Fulfilled').length}
                </span>
              </div>
              <div className="flex-col gap-4">
                {bloodRequests.filter(r => r.urgency === 'Emergency' && r.status !== 'Fulfilled').map(r => (
                  <div key={r.id} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${isPendingRequest(r) ? 'var(--warning)' : 'var(--success)'}`, marginBottom: '1rem', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setSelectedRequestView(r)} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    <div className="flex justify-between items-start mb-2">
                      <strong style={{ fontSize: '1.1rem' }}>{r.patientName} <span className="text-primary">({r.bloodGroup})</span></strong>
                      {isPendingRequest(r) ? (
                        <span className="badge" style={{ background: '#fff3cd', color: '#856404' }}>Pending</span>
                      ) : (
                        <span className="badge" style={{ background: '#d4edda', color: '#155724' }}>Verified</span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>{r.diagnosis} • {r.hospitalName}</p>
                    {isPendingRequest(r) && (
                      <button className="btn btn-primary w-full" style={{ padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); handleVerifyRequest(r.id); }}>
                        Verify & Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Normal Column */}
            <div>
              <div className="flex justify-between items-center mb-4 pb-2" style={{ borderBottom: '2px solid var(--border)' }}>
                <h3 style={{ color: '#1976d2', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Normal 🔵
                </h3>
                <span style={{ background: '#1976d2', color: 'white', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {bloodRequests.filter(r => r.urgency !== 'Emergency' && r.status !== 'Fulfilled').length}
                </span>
              </div>
              <div className="flex-col gap-4">
                {bloodRequests.filter(r => r.urgency !== 'Emergency' && r.status !== 'Fulfilled').map(r => (
                  <div key={r.id} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${isPendingRequest(r) ? 'var(--warning)' : 'var(--success)'}`, marginBottom: '1rem', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setSelectedRequestView(r)} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    <div className="flex justify-between items-start mb-2">
                      <strong style={{ fontSize: '1.1rem' }}>{r.patientName} <span className="text-primary">({r.bloodGroup})</span></strong>
                      {isPendingRequest(r) ? (
                        <span className="badge" style={{ background: '#fff3cd', color: '#856404' }}>Pending</span>
                      ) : (
                        <span className="badge" style={{ background: '#d4edda', color: '#155724' }}>Verified</span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>{r.diagnosis} • {r.hospitalName}</p>
                    {isPendingRequest(r) && (
                      <button className="btn btn-primary w-full" style={{ padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); handleVerifyRequest(r.id); }}>
                        Verify & Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donationHistory' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Patient / Need</th>
                <th style={{ padding: '1rem' }}>Hospital & Area</th>
                <th style={{ padding: '1rem' }}>Requester</th>
                <th style={{ padding: '1rem' }}>Contributed By</th>
                <th style={{ padding: '1rem' }}>Completion Date</th>
              </tr>
            </thead>
            <tbody>
              {donationHistory.map(h => {
                const donor = users.find(u => u.id === h.donorId);
                return (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {h.patientName} <span className="badge badge-primary ml-1">{h.bloodGroup}</span><br/>
                    <small className="text-light">{h.diagnosis}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {h.hospitalName}<br/>
                    <small className="text-light">{h.district}, {h.state}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {h.requesterName}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>
                    {donor ? donor.name : 'Unknown Donor'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {new Date(h.updatedAt || h.createdAt).toLocaleString()}
                  </td>
                </tr>
                );
              })}
              {donationHistory.length === 0 && (
                <tr><td colSpan="5" className="text-center p-4">No donation history found (cleaned up after 7 days).</td></tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'users' && (
          <div>
            <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
              <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} size={18} />
              <input 
                type="text" 
                placeholder="Search users by name, email, contact, blood group..." 
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 15px 12px 45px', 
                  borderRadius: '30px', 
                  border: '1px solid var(--border)', 
                  background: 'var(--background)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 2px 12px rgba(229, 57, 53, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                }}
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Photo</th>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Contact</th>
                <th style={{ padding: '1rem' }}>Blood Group</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => {
                const term = userSearchTerm.toLowerCase();
                return (
                  (u.name && u.name.toLowerCase().includes(term)) ||
                  (u.contact && u.contact.toLowerCase().includes(term)) ||
                  (u.bloodGroup && u.bloodGroup.toLowerCase().includes(term)) ||
                  (u.email && u.email.toLowerCase().includes(term))
                );
              }).map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    {u.profilePic ? (
                      <img 
                        src={u.profilePic} 
                        alt="Profile" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`; }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{u.name} {u.isAdmin && <span className="badge badge-primary ml-2">Admin</span>}</td>
                  <td style={{ padding: '1rem' }}>{u.contact}</td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex gap-2 flex-wrap">
                      {u.isBloodDonor !== false && <span className="badge badge-secondary">{u.bloodGroup || 'Blood'}</span>}
                      {u.isFoodDonor && <span className="badge" style={{background: 'var(--warning)', color: 'white'}}>Food</span>}
                      {u.isEyeDonor && <span className="badge" style={{background: 'var(--success)', color: 'white'}}>Eye</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.5rem', border: 'none', color: 'var(--success)' }}
                        onClick={() => handleSelectUser(u)}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {u.id !== user?.id && (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.5rem', border: 'none', color: 'var(--error)' }}
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '2rem' }}>No users found.</td>
                </tr>
              )}
              {users.length > 0 && users.filter(u => {
                const term = userSearchTerm.toLowerCase();
                return (
                  (u.name && u.name.toLowerCase().includes(term)) ||
                  (u.contact && u.contact.toLowerCase().includes(term)) ||
                  (u.bloodGroup && u.bloodGroup.toLowerCase().includes(term)) ||
                  (u.email && u.email.toLowerCase().includes(term))
                );
              }).length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '2rem' }}>No matching users found.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        {activeTab === 'foodDonations' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Donor</th>
                <th style={{ padding: '1rem' }}>Food Details</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Quantity</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foodDonations.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{d.name}<br/><small className="text-light">{d.contact}</small></td>
                  <td style={{ padding: '1rem' }}>{d.foodDetails}</td>
                  <td style={{ padding: '1rem' }}>{d.district}, {d.state}</td>
                  <td style={{ padding: '1rem' }}><span className="badge badge-secondary">{d.quantity} pax</span></td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none', color: 'var(--error)' }} onClick={() => handleDeleteFoodItem('foodDonations', d.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {foodDonations.length === 0 && <tr><td colSpan="5" className="text-center p-4">No food donations found.</td></tr>}
            </tbody>
          </table>
        )}

        {activeTab === 'foodRequests' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Trust / Home</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Needs For</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foodRequests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    <div className="flex items-center gap-3">
                      {r.proofImage && <img src={r.proofImage} alt="Proof" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                      <div>{r.trustName}<br/><small className="text-light">{r.contact}</small></div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>{r.district}, {r.state}</td>
                  <td style={{ padding: '1rem' }}><span className="badge badge-primary">{r.peopleCount} people</span></td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none', color: 'var(--error)' }} onClick={() => handleDeleteFoodItem('foodRequests', r.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {foodRequests.length === 0 && <tr><td colSpan="4" className="text-center p-4">No food requests found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              onClick={() => setSelectedUser(null)}
            >
              &times;
            </button>
            <h3 className="mb-4">User Activity Details</h3>
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex-col items-center" style={{ width: '150px', flexShrink: 0 }}>
                {selectedUser.profilePic ? (
                  <img 
                    src={selectedUser.profilePic} 
                    alt="Profile" 
                    style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', marginBottom: '1rem' }} 
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=random`; }}
                  />
                ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '3rem', marginBottom: '1rem' }}>
                    {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <h4 style={{ margin: 0, textAlign: 'center' }}>{selectedUser.name}</h4>
                <div className="flex flex-col gap-1 items-center mt-2">
                  {selectedUser.isBloodDonor !== false && <span className="badge badge-secondary text-xs">{selectedUser.bloodGroup} Donor</span>}
                  {selectedUser.isFoodDonor && <span className="badge text-xs" style={{background: 'var(--warning)', color: 'white'}}>Food Donor</span>}
                  {selectedUser.isEyeDonor && <span className="badge text-xs" style={{background: 'var(--success)', color: 'white'}}>Eye Donor</span>}
                </div>
              </div>
              
              <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '8px', flex: 1 }}>
                <div className="grid grid-cols-2 gap-4">
                  <p style={{ margin: 0 }}><strong>Contact:</strong> {selectedUser.contact}</p>
                  <p style={{ margin: 0 }}><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                  <p style={{ margin: 0 }}><strong>Age:</strong> {selectedUser.age || 'N/A'}</p>
                  <p style={{ margin: 0 }}><strong>State:</strong> {selectedUser.state || 'N/A'}</p>
                  <p style={{ margin: 0 }}><strong>District:</strong> {selectedUser.district || 'N/A'}</p>
                  <p style={{ margin: 0 }}><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  {selectedUser.isEyeDonor && (
                    <>
                      <p style={{ margin: 0 }}><strong>Guardian:</strong> {selectedUser.guardianName || 'N/A'}</p>
                      <p style={{ margin: 0 }}><strong>Guardian Contact:</strong> {selectedUser.guardianContact || 'N/A'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

            {loadingDetails ? (
              <div className="text-center p-4">Loading activity...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Requests Created ({userRequests.length})</h4>
                  {userRequests.length === 0 ? <p className="text-light text-sm">No requests made.</p> : (
                    <div className="flex-col gap-3">
                      {userRequests.map(r => (
                        <div key={r.id} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${r.status === 'Open' ? 'var(--warning)' : 'var(--success)'}` }}>
                          <div className="flex justify-between items-start">
                            <strong>{r.patientName}</strong>
                            <span style={{ fontSize: '0.8rem', color: r.status === 'Open' ? 'var(--warning)' : 'var(--success)', fontWeight: 'bold' }}>{r.status}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>{r.diagnosis} • {r.units} Unit(s) {r.bloodGroup}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Donations Fulfilled ({userDonations.length})</h4>
                  {userDonations.length === 0 ? <p className="text-light text-sm">No donations yet.</p> : (
                    <div className="flex-col gap-3">
                      {userDonations.map(d => (
                        <div key={d.id} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
                          <div className="flex justify-between items-start">
                            <strong>For: {d.patientName}</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>{d.hospitalName}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>Donated on: {new Date(d.updatedAt || d.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Selected Request Modal */}
      {selectedRequestView && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem' }}>
            <button 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              onClick={() => setSelectedRequestView(null)}
            >
              &times;
            </button>
            <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Request Details
              <span className="badge" style={{ background: selectedRequestView.urgency === 'Emergency' ? 'var(--error)' : '#1976d2', color: 'white' }}>
                {selectedRequestView.urgency}
              </span>
            </h3>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-light)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Patient Info</h4>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Patient:</strong> {selectedRequestView.patientName} ({selectedRequestView.gender})</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Blood Needed:</strong> <span className="text-primary font-bold">{selectedRequestView.bloodGroup}</span> - {selectedRequestView.units} Unit(s)</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Diagnosis:</strong> {selectedRequestView.diagnosis}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Hospital:</strong> {selectedRequestView.hospitalName}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Location:</strong> {selectedRequestView.district}, {selectedRequestView.state}</p>
              </div>
              
              <div>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-light)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Requester Info</h4>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Name:</strong> {selectedRequestView.requesterName}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Contact:</strong> {selectedRequestView.contactNumber || 'N/A'}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Posted On:</strong> {new Date(selectedRequestView.createdAt).toLocaleString()}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Status:</strong> {selectedRequestView.status}</p>
              </div>
            </div>

            {selectedRequestView.proofImage ? (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Medical Proof Document:</h4>
                <img src={selectedRequestView.proofImage} alt="Medical Proof Full" style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
            ) : (
              <div style={{ marginTop: '1rem', padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <p className="text-light" style={{ margin: 0 }}>No medical proof document is stored for this request.</p>
              </div>
            )}

            {isPendingRequest(selectedRequestView) && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn" style={{ background: 'var(--error)', color: 'white' }} onClick={() => handleRejectRequest(selectedRequestView.id)}>Reject & Delete</button>
                <button className="btn btn-outline" onClick={() => setSelectedRequestView(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => {
                  handleVerifyRequest(selectedRequestView.id);
                  setSelectedRequestView(null);
                }}>
                  Verify & Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
