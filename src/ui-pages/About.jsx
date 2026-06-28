import React from 'react';
import { 
  Heart, 
  Utensils, 
  Eye, 
  Users,
  ArrowRight
} from 'lucide-react';
import { Link } from '../lib/navigation';

const About = () => {
  return (
    <div className="w-full" style={{ paddingBottom: '4rem', background: 'var(--background)' }}>
      {/* Hero Section */}
      <section className="hero text-center" style={{ padding: '5rem 24px', background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', color: 'white', borderRadius: '0 0 40px 40px', marginBottom: '4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', blur: '20px' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', blur: '30px' }}></div>
        
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: '1.5rem', display: 'inline-block', backdropFilter: 'blur(4px)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>About IMPA</span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'white', marginBottom: '1.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>International Mudaliar Pillaimar Association</h1>
          <p style={{ fontSize: '1.15rem', opacity: '0.95', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8', textShadow: '0 1px 5px rgba(0,0,0,0.1)' }}>
            Empowering communities through unity, compassion, and dedicated service. We are committed to uplifting lives and fostering brotherhood across all districts.
          </p>
        </div>
      </section>

      <div className="container flex-col gap-8" style={{ display: 'flex' }}>
        
        {/* Core Services / Trusts */}
        <div className="text-center mb-8">
          <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)', marginBottom: '1rem' }}>Our Social Initiatives</h2>
          <p style={{ color: 'var(--text-light)', maxWidth: '650px', margin: '0 auto 3.5rem', fontSize: '1.1rem' }}>
            Through our dedicated trusts, we operate various charitable activities aimed at providing essential support to those in need.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '2rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderTop: '4px solid var(--error)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--error)' }}>
                <Heart size={36} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)', fontWeight: '700' }}>Blood Donation</h3>
              <p style={{ color: 'var(--text-light)', lineHeight: '1.7' }}>
                Connecting voluntary blood donors with patients in emergencies. Our extensive network ensures timely help and saves countless lives across the region.
              </p>
            </div>
            
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--warning)' }}>
                <Utensils size={36} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)', fontWeight: '700' }}>Food Donation</h3>
              <p style={{ color: 'var(--text-light)', lineHeight: '1.7' }}>
                Eradicating hunger by organizing regular food drives and distributing nutritious meals to the underprivileged and vulnerable communities.
              </p>
            </div>
            
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderTop: '4px solid var(--success)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--success)' }}>
                <Eye size={36} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)', fontWeight: '700' }}>Eye Donation</h3>
              <p style={{ color: 'var(--text-light)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                Creating awareness and facilitating eye donations to give the gift of sight. We guide families through the process with care and compassion.
              </p>
              <Link to="/eye-donation" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: '600', textDecoration: 'none', marginTop: 'auto' }}>
                Learn More <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Leadership Section */}
        <div style={{ background: 'var(--surface)', padding: '5rem 2rem', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', marginTop: '2rem', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="text-center mb-10">
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)', marginBottom: '1rem' }}>Our Leadership</h2>
            <div style={{ width: '80px', height: '5px', background: 'var(--secondary)', margin: '0 auto', borderRadius: '10px' }}></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '4rem', maxWidth: '850px', margin: '0 auto' }}>
            
            {/* Founder President */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }}>
              <div style={{ width: '220px', height: '220px', borderRadius: '50%', overflow: 'hidden', border: '6px solid white', boxShadow: '0 15px 30px rgba(30, 64, 175, 0.15)', marginBottom: '1.75rem', background: '#f3f4f6', position: 'relative' }}>
                <img 
                  src="/assets/team/founder.jpeg" 
                  alt="Dr. R. Arunachalam" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-dark)', fontWeight: '700', marginBottom: '0.5rem' }}>
                Dr. R. Arunachalam
              </h3>
              <span className="badge badge-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '1rem' }}>Founder President - IMPA</span>
            </div>

            {/* President */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }}>
              <div style={{ width: '220px', height: '220px', borderRadius: '50%', overflow: 'hidden', border: '6px solid white', boxShadow: '0 15px 30px rgba(217, 119, 6, 0.15)', marginBottom: '1.75rem', background: '#f3f4f6', position: 'relative' }}>
                <img 
                  src="/assets/team/president.jpeg" 
                  alt="Dr. G. V. Selvam" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-dark)', fontWeight: '700', marginBottom: '0.5rem' }}>
                Dr. G. V. Selvam
              </h3>
              <span className="badge badge-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '1rem' }}>President - IMPA</span>
            </div>
            
          </div>
        </div>

        {/* Tiruvannamalai Coordinators */}
        <div style={{ marginTop: '5rem', marginBottom: '3rem' }}>
          <div className="text-center mb-10">
            <h2 style={{ fontSize: '2.25rem', color: 'var(--text)', marginBottom: '1rem', fontWeight: '700' }}>Tiruvannamalai IMPA Coordinators</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Dedicated members coordinating activities in Tiruvannamalai district.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(30, 64, 175, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text)', fontWeight: '700', marginBottom: '0.2rem' }}>Mr. S. SRINIVASAN</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '500' }}>Coordinator</p>
              </div>
            </div>
            
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem', borderLeft: '4px solid var(--secondary)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text)', fontWeight: '700', marginBottom: '0.2rem' }}>Mr. S. PANDIAN</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '500' }}>Coordinator</p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem', borderLeft: '4px solid var(--success)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text)', fontWeight: '700', marginBottom: '0.2rem' }}>Mr. G. POORNACHANDRAN</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: '500' }}>Coordinator</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
