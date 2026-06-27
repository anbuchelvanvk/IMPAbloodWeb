import React from 'react';

const Acknowledgement = () => {
  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <h2 style={{ marginBottom: '2rem' }}>Acknowledgement & Integrations</h2>
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>National Portal Integration</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          Instead of acting as a standalone repository, our platform aligns with e-Raktkosh, the Government of India's centralized blood bank management system, to streamline the process.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Verified Licensed Blood Banks</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          We cross-check all associated medical centers against the official e-RaktKosh portal, which hosts the central directory of Drug Controller General of India (DCGI) approved blood centers.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Authoritative Partnerships</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          We aim to connect and partner with established organizations like the Indian Red Cross Society and the National Blood Transfusion Council to ensure authenticity and proper reach.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Institutional Credibility</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          As a non-profit initiative, our platform operates with the intent of boosting institutional credibility. We strive to maintain transparent operations to facilitate voluntary support.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Tax-Exempt Contributions</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)' }}>
          To keep the platform running securely and efficiently, we work in alignment with standards required for 12A and 80G Certificates, allowing acceptance of public funding and corporate support.
        </p>
      </div>
    </div>
  );
};

export default Acknowledgement;
