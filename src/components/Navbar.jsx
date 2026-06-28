"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from '../lib/navigation';
import { useAuth } from '../context/AuthContext';
import { Droplet, HeartHandshake, Menu, X, MessageCircle } from 'lucide-react';
import { generateAvatar } from '../utils/avatarGenerator';
import toast from 'react-hot-toast';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase';

const Navbar = () => {
  const { user, pendingUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = Boolean(user && user.isAdmin === true);

  const [isOpen, setIsOpen] = useState(false);
  const [activeChatsCount, setActiveChatsCount] = useState(0);
  
  const isInitialLoad = useRef(true);
  const pollInFlight = useRef(false);
  const lastCountRef = useRef(0);

  useEffect(() => {
    const canUseAuthedApis = Boolean(user && auth?.currentUser);
    const isIncomplete = Boolean(user?.needsRegistration);
    if (!canUseAuthedApis || isIncomplete || location.pathname === '/chat') {
      setActiveChatsCount(0);
      return;
    }
    let active = true;
    let pollTimer = null;
    const canPoll = () =>
      active &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      typeof window !== 'undefined' &&
      window.navigator.onLine &&
      document.hasFocus();
    const poll = async () => {
      if (pollInFlight.current || !canPoll()) {
        if (active) pollTimer = setTimeout(poll, 120_000);
        return;
      }
      pollInFlight.current = true;
      try {
        const count = await firebaseService.getActiveChatsCount();
        if (!active) return;
        const prev = lastCountRef.current;
        setActiveChatsCount(count);
        lastCountRef.current = count;
        if (!isInitialLoad.current && count > prev) {
          toast.success("You have new active chats. Open Chats to continue.", { duration: 6000, icon: '🎉', style: { border: '2px solid #00c853' } });
        }
      } catch {}
      finally {
        pollInFlight.current = false;
        if (active) pollTimer = setTimeout(poll, 120_000);
      }
    };
    poll();
    const initTimer = setTimeout(() => { isInitialLoad.current = false; }, 2000);
    const resumeOnFocus = () => {
      if (!active) return;
      clearTimeout(pollTimer);
      poll();
    };
    window.addEventListener('focus', resumeOnFocus);
    document.addEventListener('visibilitychange', resumeOnFocus);
    return () => {
      active = false;
      clearTimeout(pollTimer);
      clearTimeout(initTimer);
      window.removeEventListener('focus', resumeOnFocus);
      document.removeEventListener('visibilitychange', resumeOnFocus);
    };
  }, [user, user?.needsRegistration, location.pathname]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="container flex items-center justify-between" style={{ position: 'relative' }}>
        <Link to="/" className="nav-brand" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px', mixBlendMode: 'multiply' }} />
          IMPA
        </Link>
        
        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          <Link to="/about" className="nav-link" onClick={closeMenu}>About Us</Link>
          <Link to="/requests" className="nav-link" onClick={closeMenu}>Blood Requests</Link>
          <Link to="/food-donation" className="nav-link" onClick={closeMenu}>Food Donation</Link>
          <Link to="/eye-donation" className="nav-link" onClick={closeMenu}>Eye Donation</Link>
          <Link to="/contact" className="nav-link" onClick={closeMenu}>Contact</Link>
          {isAdmin && (
            <Link to="/admin" className="nav-link text-warning" style={{ fontWeight: 'bold' }} onClick={closeMenu}>Admin Portal</Link>
          )}
          
          {user ? (
            <>
              <Link to="/chat" className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }} onClick={closeMenu}>
                <MessageCircle size={18} /> Chats
                {activeChatsCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-8px', right: '-8px', background: 'var(--error)', color: 'white', 
                    borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', border: '2px solid white'
                  }}>
                    {activeChatsCount}
                  </span>
                )}
              </Link>
              <Link to="/create-request" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={closeMenu}>
                Request Blood
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }} onClick={closeMenu}>
                  <img 
                    src={user.profilePic || generateAvatar(user.name)} 
                    alt="Profile" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <span className="text-secondary" style={{ fontWeight: 600 }}>{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                  Logout
                </button>
              </div>
            </>
          ) : pendingUser ? (
            <div className="flex gap-4">
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Cancel Registration</button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={closeMenu}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={closeMenu}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
