"use client";

import React from 'react';
import { useNavigate } from '../lib/navigation';
import { Eye, Clock, CheckCircle, Phone, Info } from 'lucide-react';

const EyeDonation = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full" style={{ paddingBottom: '4rem', background: 'var(--background)' }}>
      {/* Hero Section */}
      <section className="text-center" style={{ padding: '5rem 24px', background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)', color: 'white', borderRadius: '0 0 40px 40px', marginBottom: '4rem', position: 'relative' }}>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Eye size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'white', marginBottom: '1.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Give the Gift of Sight</h1>
          <p style={{ fontSize: '1.15rem', opacity: '0.95', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
            Eye donation is an act of donating one's eyes after death. It is a noble act that can restore vision for two blind individuals. Learn how the process works and how you can pledge your eyes today.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Procedure Section */}
        <div className="card mb-10">
          <h2 className="text-center mb-8" style={{ color: 'var(--success)' }}>Procedure for Eye Donation After Death</h2>
          
          <div className="flex flex-col gap-6">
            <div className="flex gap-4" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ color: 'var(--success)', marginTop: '4px' }}>
                <Clock size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text)' }}>1. Time is Crucial</h4>
                <p style={{ color: 'var(--text-light)', margin: 0, lineHeight: '1.6' }}>
                  Eyes must be retrieved within <strong>6 hours</strong> of death. It is vital that relatives inform the nearest eye bank immediately after the passing of the individual.
                </p>
              </div>
            </div>

            <div className="flex gap-4" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ color: 'var(--success)', marginTop: '4px' }}>
                <Phone size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text)' }}>2. Contact the Eye Bank</h4>
                <p style={{ color: 'var(--text-light)', margin: 0, lineHeight: '1.6' }}>
                  Call the toll-free number <strong>1919</strong> (in India) or your local eye bank. Keep the death certificate (if available) ready and provide clear location details.
                </p>
              </div>
            </div>

            <div className="flex gap-4" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ color: 'var(--success)', marginTop: '4px' }}>
                <Info size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text)' }}>3. Care Before the Team Arrives</h4>
                <ul style={{ color: 'var(--text-light)', margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                  <li>Switch off fans, but keep the air conditioner on if available.</li>
                  <li>Close the eyelids of the deceased gently.</li>
                  <li>Keep a wet cotton swab over the closed eyelids to prevent drying.</li>
                  <li>Raise the head of the deceased with a pillow to reduce bleeding during the procedure.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ color: 'var(--success)', marginTop: '4px' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text)' }}>4. The Retrieval Process</h4>
                <p style={{ color: 'var(--text-light)', margin: 0, lineHeight: '1.6' }}>
                  A trained professional team will visit the home or hospital. The entire eye removal process takes only <strong>10 to 15 minutes</strong>. It leaves no scar or disfigurement of the face.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="text-center" style={{ padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '1rem' }}>Ready to make a difference?</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            By pledging your eyes, you promise to give the gift of vision after your lifetime. Your family will execute this pledge when the time comes.
          </p>
          
          <button 
            className="btn" 
            style={{ background: 'var(--success)', color: 'white', padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            onClick={() => navigate('/eye-pledge')}
          >
            <Eye size={20} /> If you wish to continue, click here
          </button>
        </div>

      </div>
    </div>
  );
};

export default EyeDonation;
