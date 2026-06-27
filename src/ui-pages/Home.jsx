"use client";

import React, { useState, useEffect } from 'react';
import { Link } from '../lib/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplet, Heart, Activity, Search, Lock, Users, Shield, 
  Clock, ArrowRight, ChevronDown, ChevronUp, Star, Building, 
  CheckCircle, Bell, Info, MessageSquare 
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { SOUTH_INDIAN_STATES } from '../utils/locations';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [publicDonors, setPublicDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [allStates, setAllStates] = useState(Object.keys(SOUTH_INDIAN_STATES));
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const canViewContact = Boolean(user);
  
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    let active = true;
    const fetchDonors = async () => {
      try {
        setLoading(true);
        const filters = {
          ...(filterBloodGroup ? { bloodGroup: filterBloodGroup } : {}),
          ...(filterState ? { state: filterState } : {}),
          ...(filterDistrict ? { district: filterDistrict } : {})
        };
        const page = await firebaseService.getPublicDonorsPage(filters, null, 120);
        if (!active) return;
        setPublicDonors(page?.items || []);
        // Populate initial districts (all)
        const allDistricts = [];
        Object.values(SOUTH_INDIAN_STATES).forEach(stateDistricts => {
          allDistricts.push(...stateDistricts);
        });
        setAvailableDistricts([...new Set(allDistricts)].sort());
      } catch (error) {
        if (!active) return;
        console.error("Error fetching public donors:", error);
        setPublicDonors([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDonors();
    return () => { active = false; };
  }, [filterBloodGroup, filterState, filterDistrict]);

  // Update districts when state changes
  useEffect(() => {
    if (filterState) {
      setAvailableDistricts(SOUTH_INDIAN_STATES[filterState] || []);
      setFilterDistrict(''); // Reset district when state changes
    } else {
      const allDistricts = [];
      Object.values(SOUTH_INDIAN_STATES).forEach(stateDistricts => {
        allDistricts.push(...stateDistricts);
      });
      setAvailableDistricts([...new Set(allDistricts)].sort());
    }
  }, [filterState]);

  return (
    <div>
      {/* Emergency Banner */}
      <section style={{ background: 'var(--primary)', color: 'white', padding: '1rem 0', position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div className="flex items-center gap-3" style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <Bell size={24} style={{ marginRight: '0.5rem', flexShrink: 0, animation: 'pulse 2s infinite' }} />
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Emergency Blood Requirement?</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>We instantly notify verified donors in your nearby area.</p>
            </div>
          </div>
          <Link to="/create-request" style={{ background: 'white', color: 'var(--primary)', fontWeight: 'bold', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }}>
            Broadcast Urgent Request
          </Link>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="container grid md:grid-cols-2 items-center gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Donate Blood, <br/>
              <span className="text-primary">Save Lives.</span>
            </h1>
            <p className="text-light" style={{ fontSize: '1.25rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Your blood can give a precious smile to someone's face. 
              Join our community of lifesavers today. Every drop counts.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-primary">
                Become a Donor
              </Link>
              <Link to="/requests" className="btn btn-outline">
                View Requests
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center"
          >
            <img 
              src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=800&auto=format&fit=crop" 
              alt="Blood Donation" 
              style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(230, 57, 70, 0.2)' }}
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '4rem 0', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3rem', textAlign: 'center' }}>
          {[
            { icon: Users, count: "70+", label: "Registered Donors", color: "var(--secondary)" },
            { icon: Heart, count: "50+", label: "Lives Helped", color: "var(--primary)" },
            { icon: Activity, count: "60+", label: "Requests Completed", color: "var(--success)" }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ flex: '1 1 250px', maxWidth: '300px' }}>
              <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: `${stat.color}15`, color: stat.color, marginBottom: '1rem' }}>
                <stat.icon size={36} />
              </div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>{stat.count}</h3>
              <p style={{ margin: 0, color: 'var(--text-light)', fontWeight: 500, fontSize: '1.1rem' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section / How It Works */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How It Works</h2>
            <p className="text-light text-lg">Simple steps to make a huge difference in someone's life.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <motion.div whileHover={{ y: -10 }} className="card text-center" style={{ background: 'white', border: '1px solid var(--border)' }}>
              <div style={{ background: 'rgba(230,57,70,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', position: 'relative' }}>
                <Activity size={40} className="text-primary" />
                <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Register</h3>
              <p className="text-light">Sign up with your details and become a verified part of our life-saving community.</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -10 }} className="card text-center" style={{ background: 'white', border: '1px solid var(--border)' }}>
              <div style={{ background: 'rgba(29,53,87,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', position: 'relative' }}>
                <Search size={40} className="text-secondary" />
                <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--secondary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Find & Get Notified</h3>
              <p className="text-light">Check for blood requests or receive instant notifications when nearby patients need your blood group.</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -10 }} className="card text-center" style={{ background: 'white', border: '1px solid var(--border)' }}>
              <div style={{ background: 'rgba(42,157,143,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', position: 'relative' }}>
                <Droplet size={40} style={{ color: 'var(--success)' }} />
                <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--success)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Donate</h3>
              <p className="text-light">Connect directly with patients and save lives with your generous donation.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-color)' }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Your Privacy & Safety is Our Priority</h2>
              <p className="text-light mb-6" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                We maintain strict confidentiality of donor information. Only verified users and legitimate medical requests get access to contact details.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <li className="flex items-start gap-4">
                  <div style={{ background: 'rgba(42, 157, 143, 0.1)', width: '48px', height: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <CheckCircle className="text-success" size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: 'var(--secondary)' }}>100% Verified Donors</h4>
                    <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: 1.5 }}>All donor profiles are strictly verified to ensure a reliable community.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div style={{ background: 'rgba(230, 57, 70, 0.1)', width: '48px', height: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <Lock className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: 'var(--secondary)' }}>Data Encryption</h4>
                    <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: 1.5 }}>Your personal details are securely encrypted and hidden from unauthorized access.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div style={{ background: 'rgba(29, 53, 87, 0.1)', width: '48px', height: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <Shield className="text-secondary" size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: 'var(--secondary)' }}>Medical Proof Verification</h4>
                    <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: 1.5 }}>Emergency requests require valid hospital documentation for approval to avoid spam.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'white', borderRadius: '24px', padding: '4rem 2rem', position: 'relative', zIndex: 1, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center', overflow: 'hidden' }}>
                 <Shield size={200} style={{ color: 'var(--primary)', opacity: 0.05, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: -1 }} />
                 <Lock size={56} className="text-primary mb-4" style={{ margin: '0 auto' }} />
                 <h3 style={{ fontSize: '1.8rem', color: 'var(--secondary)', marginBottom: '1rem' }}>Secure Platform</h3>
                 <p className="text-light mb-0">We comply with industry standards to protect our donors and patients.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Donors Section */}
      <section style={{ padding: '5rem 0', background: 'white' }}>
        <div className="container">
          <div className="text-center mb-8">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Available Donors Directory</h2>
            <p className="text-light">Contact our voluntary donors directly for urgent blood requirements.</p>
          </div>
          
          <div className="mb-8" style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-6">
              <Search size={22} className="text-primary" />
              <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--secondary)' }}>Advanced Donor Search</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="form-group mb-0">
                <label className="form-label text-sm mb-2" style={{ fontWeight: 600, color: 'var(--text-light)' }}>Blood Group</label>
                <select 
                  className="form-select" 
                  value={filterBloodGroup} 
                  onChange={(e) => setFilterBloodGroup(e.target.value)}
                  style={{ background: 'white', border: '1px solid var(--border)', transition: 'all 0.3s ease', padding: '0.8rem' }}
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="A1+">A1+</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label text-sm mb-2" style={{ fontWeight: 600, color: 'var(--text-light)' }}>State</label>
                <select 
                  className="form-select" 
                  value={filterState} 
                  onChange={(e) => setFilterState(e.target.value)}
                  style={{ background: 'white', border: '1px solid var(--border)', transition: 'all 0.3s ease', padding: '0.8rem' }}
                >
                  <option value="">All States</option>
                  {allStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label text-sm mb-2" style={{ fontWeight: 600, color: 'var(--text-light)' }}>District</label>
                <select 
                  className="form-select" 
                  value={filterDistrict} 
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  style={{ background: 'white', border: '1px solid var(--border)', transition: 'all 0.3s ease', padding: '0.8rem' }}
                  disabled={availableDistricts.length === 0}
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead style={{ background: 'rgba(29, 53, 87, 0.03)' }}>
                  <tr>
                    {['Name', 'Blood Group', 'Location', 'Contact'].map((col) => (
                      <th key={col} style={{ padding: '1.25rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--secondary)', fontWeight: 600 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: 'white' }}>
                      <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '18px', width: '120px' }} /></td>
                      <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '28px', width: '60px', borderRadius: '20px' }} /></td>
                      <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '18px', width: '140px' }} /></td>
                      <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '32px', width: '110px', borderRadius: '999px' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : publicDonors.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead style={{ background: 'rgba(29, 53, 87, 0.03)' }}>
                  <tr>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--secondary)', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--secondary)', fontWeight: 600 }}>Blood Group</th>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--secondary)', fontWeight: 600 }}>Location</th>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--secondary)', fontWeight: 600 }}>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {publicDonors.map((donor, index) => (
                    <tr key={donor.id} style={{ borderBottom: '1px solid var(--border)', background: index % 2 === 0 ? 'white' : 'rgba(29, 53, 87, 0.01)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-color)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {donor.name.charAt(0).toUpperCase()}
                          </div>
                          <strong style={{ color: 'var(--secondary)' }}>{donor.name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          background: 'rgba(230, 57, 70, 0.1)', 
                          color: 'var(--primary)', 
                          padding: '0.4rem 0.8rem', 
                          borderRadius: '20px', 
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          display: 'inline-block'
                        }}>
                          {donor.bloodGroup}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-light)' }}>
                        {donor.district}{donor.state ? `, ${donor.state}` : ''}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {canViewContact && donor.contact ? (
                          <a href={`tel:${donor.contact}`} style={{ color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(42, 157, 143, 0.1)', padding: '0.4rem 1rem', borderRadius: '999px', textDecoration: 'none' }}>
                            View Contact
                          </a>
                        ) : (
                          <Link
                            to="/login"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.4rem 1rem',
                              borderRadius: '999px',
                              border: '1px solid var(--border)',
                              background: 'white',
                              color: 'var(--text-light)',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              textDecoration: 'none',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-light)'; }}
                          >
                            <Lock size={12} strokeWidth={2.5} />
                            Sign in to view
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card text-center p-8" style={{ border: '1px dashed var(--border)', background: 'white' }}>
              <Search size={48} className="mx-auto text-light mb-4" style={{ opacity: 0.5 }} />
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Donors Found</h4>
              <p className="text-light">We couldn't find public donors matching your criteria.</p>
              <button 
                className="btn btn-outline mt-4" 
                onClick={() => { setFilterBloodGroup(''); setFilterDistrict(''); setFilterState(''); }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Organization */}
      <section style={{ padding: '6rem 0', background: 'white' }}>
        <div className="container text-center">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>The Mission Behind The Platform</h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-light)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              We are a dedicated initiative aiming to bridge the critical gap between blood donors and patients in urgent need. Our mission is to ensure that no life is lost due to a shortage of blood. By leveraging modern technology, we have built a transparent, real-time platform that securely connects willing lifesavers with critical patients in their immediate vicinity.
            </p>
            <Link to="/about" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}>
              <Info size={18} /> Learn More About Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-color)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="text-center mb-10">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Frequently Asked Questions</h2>
            <p className="text-light">Everything you need to know about our platform and donation process.</p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { q: "How do I request blood in an emergency?", a: "Click on the 'Broadcast Urgent Request' button, fill in the patient details, upload a valid medical proof (like doctor's prescription), and submit. Registered donors in the patient's area will be notified instantly." },
              { q: "Is it safe to donate blood?", a: "Yes, donating blood is completely safe. A sterile, new needle is used for each donation, and the process is conducted by medical professionals in registered hospitals or blood banks." },
              { q: "Who can donate blood?", a: "Most healthy adults between 18 and 65 years who weigh at least 50 kg can donate blood. You must not have any blood-borne diseases or recent major surgeries. You can donate once every 3 months." },
              { q: "How is my personal data protected?", a: "Your privacy is our top priority. Contact information is hidden from the public and only visible to verified users. We never share your data with third parties and use strict encryption for medical documents." },
              { q: "How do the nearby donor notifications work?", a: "When an emergency request is approved, our system automatically matches the required blood group with our database and sends instant alerts to verified donors located in the requested city or district." }
            ].map((faq, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <button 
                  onClick={() => toggleFaq(i)}
                  style={{ width: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary)' }}
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="text-primary" /> : <ChevronDown className="text-light" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 1.5rem 1.5rem', color: 'var(--text-light)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
