"use client";

import React from 'react';
import { Link } from '../lib/navigation';
import { Droplet, Mail, MapPin, Heart, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ background: 'var(--primary-dark)', color: '#f8f9fa', padding: '4rem 0 2rem', marginTop: 'auto' }}>
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8" style={{ marginBottom: '3rem' }}>
          
          {/* Brand & About */}
          <div>
            <Link to="/" onClick={() => window.scrollTo(0, 0)} className="nav-brand" style={{ color: 'white', marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '36px', width: '36px', objectFit: 'cover' }} />
              </div>
              IMPA
            </Link>
            <p style={{ color: '#adb5bd', fontSize: '0.95rem', lineHeight: 1.7, marginTop: '1rem' }}>
              A centralized platform bridging the gap between life-saving donors and those in urgent need of blood and food. Every drop counts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <li><Link to="/requests" onClick={() => window.scrollTo(0, 0)} style={{ color: '#adb5bd', transition: 'color 0.3s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = '#adb5bd'}>Blood Requests</Link></li>
                <li><Link to="/about" onClick={() => window.scrollTo(0, 0)} style={{ color: '#adb5bd', transition: 'color 0.3s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = '#adb5bd'}>About Us</Link></li>
                <li><Link to="/team" onClick={() => window.scrollTo(0, 0)} style={{ color: '#adb5bd', transition: 'color 0.3s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = '#adb5bd'}>Our Team</Link></li>
                <li><Link to="/acknowledgement" onClick={() => window.scrollTo(0, 0)} style={{ color: '#adb5bd', transition: 'color 0.3s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = '#adb5bd'}>Acknowledgement</Link></li>
              </ul>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <li><Link to="/contact" onClick={() => window.scrollTo(0, 0)} style={{ color: '#adb5bd', transition: 'color 0.3s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = '#adb5bd'}>Contact Us</Link></li>
                <li><Link to="/privacy" onClick={() => window.scrollTo(0, 0)} style={{ color: '#adb5bd', transition: 'color 0.3s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = '#adb5bd'}>Privacy Policy</Link></li>
                <li><Link to="/terms" onClick={() => window.scrollTo(0, 0)} style={{ color: '#adb5bd', transition: 'color 0.3s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = '#adb5bd'}>Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Get in Touch</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex items-center gap-3 text-light" style={{ color: '#adb5bd' }}>
                <Phone size={18} />
                <a href="tel:9655535557" style={{ color: 'inherit' }}>9655535557</a>
              </div>
              <div className="flex items-center gap-3 text-light" style={{ color: '#adb5bd' }}>
                <Mail size={18} />
                <a href="mailto:impa.tvm@gmail.com" style={{ color: 'inherit' }}>impa.tvm@gmail.com</a>
              </div>

              <div className="flex items-center gap-3 text-light" style={{ color: '#adb5bd' }}>
                <MapPin size={18} />
                <span>Tiruvannamalai</span>
              </div>
            </div>
          </div>

        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

        <div className="text-center" style={{ color: '#adb5bd', fontSize: '0.9rem' }}>
          <p className="flex items-center justify-center gap-2" style={{ marginBottom: '0.5rem' }}>
            Built with <Heart size={14} className="text-primary" style={{ fill: 'var(--primary)' }} /> by:
          </p>
          <p style={{ fontWeight: '500', color: 'white', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            <span className="tooltip-wrapper">
              <a href="https://linkedin.com/in/anbuchelvanvk" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Anbuchelvan</a>
              <span className="tooltip-content">Website Developer</span>
            </span>
          </p>
          <p style={{ marginTop: '0.5rem' }}>&copy; {new Date().getFullYear()} IMPA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
