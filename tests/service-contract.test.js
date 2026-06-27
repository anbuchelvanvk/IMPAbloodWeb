import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('firebaseService contract completeness', () => {
  const text = fs.readFileSync('src/services/firebaseService.js', 'utf8');

  const requiredMethods = [
    'checkDuplicateUser',
    'getUserRequests',
    'getUserDonations',
    'getAllDonationHistory',
    'cleanupOldDonationHistory',
    'createFoodDonation',
    'createFoodRequest',
    'getAllFoodDonations',
    'getAllFoodRequests',
    'deleteDocument',
    'verifyOTPAndFulfill',
    'cancelChat',
    'endChatSession'
  ];

  for (const method of requiredMethods) {
    it(`implements ${method} via callApi`, () => {
      expect(text.includes(`${method}: async`)).toBe(true);
      expect(text.includes(`callApi(`)).toBe(true);
    });
  }
});
