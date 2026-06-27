import { z } from 'zod';

const isoDate = z.string().datetime().or(z.string().length(0)).optional().nullable();
const phone10 = z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits');
const MAX_PROOF_BASE64_LEN = 1_500_000;
const pagination = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
}).optional();
const donorFilters = z.object({
  bloodGroup: z.string().trim().min(1).max(10).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().min(1).max(100).optional()
}).optional();

export const schemas = {
  register: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email(),
    contact: phone10,
    bloodGroup: z.string().trim().min(1).max(10),
    state: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    faceVerified: z.literal(true),
    shareContact: z.boolean().optional().default(false),
    lastDonationDate: isoDate,
    nextEligibleDate: isoDate
  }),
  checkDuplicateUser: z.object({ email: z.email(), contact: phone10 }),
  updateProfile: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    contact: phone10.optional(),
    bloodGroup: z.string().trim().min(1).max(10).optional(),
    state: z.string().trim().min(1).max(100).optional(),
    district: z.string().trim().min(1).max(100).optional(),
    shareContact: z.boolean().optional(),
    profilePic: z.string().max(4_000_000).optional(),
    lastDonationDate: isoDate,
    nextEligibleDate: isoDate
  }).refine((obj) => Object.keys(obj).length > 0, 'No profile fields provided'),
  createRequest: z.object({
    patientName: z.string().trim().min(1).max(120),
    diagnosis: z.string().trim().min(1).max(240),
    bloodGroup: z.string().trim().min(1).max(10),
    units: z.coerce.number().int().min(1).max(10),
    state: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    address: z.string().trim().max(300).optional().default(''),
    hospitalName: z.string().trim().min(1).max(160),
    contactNumber: phone10,
    gender: z.enum(['Male', 'Female', 'Other']),
    urgency: z.enum(['Normal', 'Emergency']),
    proofImage: z.string().max(MAX_PROOF_BASE64_LEN).nullable().optional(),
    requesterName: z.string().trim().min(1).max(120).optional()
  }),
  updateRequestStatus: z.object({ requestId: z.string().min(1), status: z.enum(['Pending Verification', 'Pending', 'Open', 'Accepted', 'Fulfilled', 'cancelled', 'ended']), donorId: z.string().optional().nullable() }),
  verifyRequest: z.object({ requestId: z.string().min(1) }),
  deleteUser: z.object({ userId: z.string().min(1) }),
  createChatSession: z.object({ requestId: z.string().min(1), donorId: z.string().min(1), requesterId: z.string().min(1), patientName: z.string().trim().min(1).max(140) }),
  listChatMessages: z.object({ chatId: z.string().min(1), pagination }),
  sendMessage: z.object({ chatId: z.string().min(1), text: z.string().trim().min(1).max(2000) }),
  verifyOtpFulfill: z.object({ requestId: z.string().min(1), chatId: z.string().min(1), otp: z.string().trim().regex(/^\d{6}$/) }),
  cancelChat: z.object({ chatId: z.string().min(1) }),
  createFoodDonation: z.object({
    name: z.string().trim().min(1).max(120),
    contact: phone10,
    state: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    foodDetails: z.string().trim().min(1).max(280),
    quantity: z.string().trim().min(1).max(40),
    fssai: z.string().trim().max(100).optional().or(z.literal(''))
  }),
  createFoodRequest: z.object({
    trustName: z.string().trim().min(1).max(140),
    contact: phone10,
    state: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    peopleCount: z.string().trim().min(1).max(40),
    proofImage: z.string().max(MAX_PROOF_BASE64_LEN)
  }),
  pagedList: z.object({ pagination }),
  donorsPagedList: z.object({ pagination, filters: donorFilters }),
  requestById: z.object({ requestId: z.string().min(1) }),
  userScoped: z.object({ userId: z.string().min(1) }),
  deleteDocument: z.object({ collectionName: z.enum(['requests', 'foodDonations', 'foodRequests', 'donationHistory', 'chats']), id: z.string().min(1) })
};
