import React from 'react';
import { Mail, ExternalLink, Phone, MapPin } from 'lucide-react';

const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const Contact = () => {
  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Contact Us</h2>
        <p className="text-light">Have questions or want to partner with us? We'd love to hear from you.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12" style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '2rem', fontSize: '1.8rem', textAlign: 'center' }}>Get In Touch</h3>

          <div className="flex flex-col gap-8 mx-auto md:ml-0" style={{ maxWidth: '300px' }}>
            <div className="flex items-center gap-6 text-left">
              <div style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--primary)', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                <Mail size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Email Us</h4>
                <p className="text-light" style={{ margin: 0, fontWeight: 500 }}>dummy@impa.com</p>
                <p className="text-light" style={{ margin: 0, fontSize: '0.85rem' }}>We usually reply within 24 hours.</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-left">
              <div style={{ background: 'rgba(40, 167, 69, 0.1)', color: '#28a745', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                <Phone size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Phone Number</h4>
                <a href="tel:9655535557" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  <p className="text-light" style={{ margin: 0, fontWeight: 500 }}>9655535557</p>
                </a>
                <p className="text-light" style={{ margin: 0, fontSize: '0.85rem' }}>Give us a call.</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-left">
              <div style={{ background: 'rgba(108, 117, 125, 0.1)', color: '#6c757d', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                <MapPin size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Location</h4>
                <p className="text-light" style={{ margin: 0, fontWeight: 500 }}>Tiruvannamalai</p>
                <p className="text-light" style={{ margin: 0, fontSize: '0.85rem' }}>Reach out to us.</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)' }}>
                Follow Us
              </p>

              <a href="http://x.com/impabloodweb" target="_blank" rel="noreferrer" className="flex items-center gap-6 text-left" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'rgba(0,0,0,0.06)', color: '#000', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                  <XIcon size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>X (Twitter)</h4>
                  <p className="text-light" style={{ margin: 0, fontWeight: 500 }}>@impabloodweb</p>
                </div>
              </a>

              <a href="http://instagram.com/impabloodweb" target="_blank" rel="noreferrer" className="flex items-center gap-6 text-left" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'rgba(225,48,108,0.08)', color: '#E1306C', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                  <InstagramIcon size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Instagram</h4>
                  <p className="text-light" style={{ margin: 0, fontWeight: 500 }}>@impabloodweb</p>
                </div>
              </a>

              <a href="http://facebook.com/impabloodweb" target="_blank" rel="noreferrer" className="flex items-center gap-6 text-left" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'rgba(24,119,242,0.08)', color: '#1877F2', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                  <FacebookIcon size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Facebook</h4>
                  <p className="text-light" style={{ margin: 0, fontWeight: 500 }}>impabloodweb</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-center items-center text-center" style={{ padding: '3rem 2rem', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--primary)', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginBottom: '1.5rem', flexShrink: 0 }}>
            <ExternalLink size={36} />
          </div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Send a Message</h3>
          <p className="text-light" style={{ marginBottom: '2rem', lineHeight: 1.6, maxWidth: '300px' }}>
            We've moved our contact form to Google Forms to better organize and track your requests!
          </p>
          <a
            href="https://forms.gle/eyAZHiU8pzoCHs5r7"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary w-full"
            style={{ padding: '1rem', fontSize: '1.1rem' }}
          >
            Open Contact Form
          </a>
        </div>

      </div>
    </div>
  );
};

export default Contact;
