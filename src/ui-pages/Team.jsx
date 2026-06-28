
import React from 'react';

import { generateAvatar } from '../utils/avatarGenerator';

const Team = () => {
  const teamMembers = [
    {
      name: 'Dr. R. Arunachalam',
      role: 'Founder President',
      image: '/assets/team/founder.jpeg'
    },
    {
      name: 'Dr. G. V. Selvam',
      role: 'President',
      image: '/assets/team/president.jpeg'
    },
    {
      name: 'Mr. S. SRINIVASAN',
      role: 'Tiruvannamalai Coordinator'
    },
    {
      name: 'Mr. S. PANDIAN',
      role: 'Tiruvannamalai Coordinator'
    },
    {
      name: 'Mr. G. POORNACHANDRAN',
      role: 'Tiruvannamalai Coordinator'
    }
  ];

  return (
    <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="text-center mb-10">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Meet Our Incredible Team</h2>
        <div className="text-light" style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.8' }}>
          <p style={{ textAlign: 'justify', marginBottom: '1.5rem' }}>
            Behind IMPA is a group of <strong>profoundly dedicated</strong>, passionate, and visionary individuals who work tirelessly day and night. Their unified mission is simple yet monumental: to <strong>bridge the gap</strong> between life-saving donors and those in urgent need of blood and food. Every coordinated effort and strategic decision is driven by their <strong>unwavering empathy</strong> and commitment to saving lives. They are not just a team; they are a lifeline to our community.
          </p>
          <p style={{ textAlign: 'center' }}>
            <strong><em>"Never doubt that a small group of thoughtful, committed citizens can change the world; indeed, it's the only thing that ever has."</em></strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {teamMembers.map((member, index) => (
          <div key={index} className="card text-center" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {member.image && (
              <div style={{
                width: '150px',
                height: '150px',
                flexShrink: 0,
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1.5rem',
                border: '4px solid var(--primary-light)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <img 
                  src={member.image} 
                  alt={member.name} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    minHeight: '150px',
                    objectFit: 'cover', 
                    objectPosition: 'top',
                    display: 'block'
                  }} 
                />
              </div>
            )}
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{member.name}</h3>
            <p className="text-primary" style={{ fontWeight: '600', margin: 0 }}>{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
