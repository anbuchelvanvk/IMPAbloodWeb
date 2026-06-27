'use client';

import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </AuthProvider>
  );
}
