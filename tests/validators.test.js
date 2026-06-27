import { describe, it, expect } from 'vitest';
import { schemas } from '../src/server/validators';

describe('validators', () => {
  it('accepts valid registration payload', () => {
    const parsed = schemas.register.parse({
      name: 'User One',
      email: 'user@example.com',
      contact: '9876543210',
      bloodGroup: 'A+',
      state: 'Tamil Nadu',
      district: 'Chennai',
      shareContact: true,
      lastDonationDate: null,
      nextEligibleDate: null
    });
    expect(parsed.email).toBe('user@example.com');
  });

  it('rejects invalid OTP', () => {
    expect(() => schemas.verifyOtpFulfill.parse({ requestId: 'r1', chatId: 'c1', otp: '12x345' })).toThrow();
  });

  it('accepts createRequest with required fields', () => {
    const parsed = schemas.createRequest.parse({
      patientName: 'P', diagnosis: 'Surgery', bloodGroup: 'O+', units: 2,
      state: 'Tamil Nadu', district: 'Madurai', address: 'Addr', hospitalName: 'Hospital',
      contactNumber: '9999999999', gender: 'Male', urgency: 'Emergency', proofImage: null
    });
    expect(parsed.units).toBe(2);
  });

  it('restricts deleteDocument collection names', () => {
    expect(() => schemas.deleteDocument.parse({ collectionName: 'users', id: '1' })).toThrow();
    const ok = schemas.deleteDocument.parse({ collectionName: 'requests', id: '1' });
    expect(ok.collectionName).toBe('requests');
  });

  it('requires non-empty update profile', () => {
    expect(() => schemas.updateProfile.parse({})).toThrow();
    const ok = schemas.updateProfile.parse({ name: 'Updated' });
    expect(ok.name).toBe('Updated');
  });
});
