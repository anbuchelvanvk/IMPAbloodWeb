import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <h2 style={{ marginBottom: '2rem' }}>Privacy Policy</h2>
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Digital Personal Data Protection (DPDP) Act, 2023</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          Blood groups and donor contact details constitute Sensitive Personal Data or Information (SPDI). We implement unambiguous consent forms, allow users to delete their profiles, and store data securely in strict compliance with the DPDP Act.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Explicit Consent for Sensitive Data</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          Users (both donors and those requesting blood) must formally opt-in and provide explicit consent to having their names, blood types, and contact details shared. Your personal data is treated with the utmost confidentiality and only processed for the purpose of facilitating blood donations.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Data Handling & Deletion</h3>
        <ul style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Donors:</strong> Your profile data (name, blood group, contact details, location) is securely stored to connect you with critical requests. You have complete control over your profile and can request full account deletion at any time. Upon deletion, all your personal identifying information is permanently removed from our active databases.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Requesters:</strong> The information provided during a blood request (patient details, hospital location, contact info) is used strictly to fulfill the medical emergency. Any sensitive medical proof images uploaded during the request process are automatically deleted from our servers as soon as they are verified by an administrator. While you can close or delete your request once fulfilled, basic non-identifying transaction logs may be securely retained for legal compliance and auditing purposes.
          </li>
        </ul>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Data Breach Notification & Compliance (Sections 8(6) & 33)</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          In accordance with <strong>Section 8(6) of the DPDP Act 2023</strong>, in the unlikely event of a security lapse or personal data breach, we are legally committed to immediately notifying the Data Protection Board of India and all affected users. We acknowledge and fully comply with the regulatory frameworks and potential penalties outlined under <strong>Section 33</strong> to ensure maximum accountability for your data.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Data Protection Officer (DPO) & Grievances</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          To ensure transparency and address any concerns regarding your data privacy, we have appointed a Data Protection Officer. If you have any complaints, data grievances, or require profile deletion assistance, you can reach our DPO directly at <strong>impabloodweb@gmail.com</strong> or contact our official support number.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Information Technology (IT) Act, 2000</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)', marginBottom: '1.5rem' }}>
          Under Section 43A and Section 79, our website is legally classified as an "intermediary." We maintain secure servers and obtain verifiable user consent. We also publish clear Privacy Policies and Terms of Service to protect our platform and users from liability regarding user-generated content.
        </p>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Data Masking & Geolocation</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)' }}>
          To protect users from spam or fraudulent calls, we mask contact numbers or utilize in-app/platform messaging over direct disclosure of personal phone numbers where possible. We also include features that map requests to verified, licensed local blood banks, reducing physical transport time while ensuring privacy.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
