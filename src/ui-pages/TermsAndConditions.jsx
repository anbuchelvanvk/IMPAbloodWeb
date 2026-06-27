import React from 'react';

const TermsAndConditions = () => {
  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <h2 style={{ marginBottom: '2rem' }}>Terms and Conditions</h2>
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Voluntary Non-Remunerated Donations</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          Prevent Paid Donation: Under the Drugs and Cosmetics Act, 1940, paid/remunerated blood donation is strictly prohibited. Our platform strictly facilitates voluntary, non-remunerated donations.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Strict Eligibility Criteria</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          Only individuals aged 18 to 65, weighing over 45 kg, with a hemoglobin count of at least 12.5 g/dL, are eligible to donate blood. Please ensure you meet these criteria before volunteering.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Request Verification Process</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          We establish a strict workflow to verify the authenticity of all blood requests to prevent hoaxes and ensure genuine needs are prioritized.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Medical Disclaimer</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          All donors must undergo a mandatory health screening (e.g., blood pressure, pulse, medical history review) at the licensed blood bank prior to donation.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>No Medical Advice Liability</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          Our platform does not provide medical screenings or advice. The final medical eligibility clearance must remain strictly with the licensed blood bank at the time of donation. We connect donors and patients, but are not responsible for the medical procedure.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Platform Licensing Exemption</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)' }}>
          No license is currently required to operate a website that solely connects voluntary blood donors with patients in India, provided our platform does not physically collect, store, or test blood. While our website does not need a license, all physical entities and blood banks we route users to must be legally licensed under the Drugs and Cosmetics Act, 1940.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions;
