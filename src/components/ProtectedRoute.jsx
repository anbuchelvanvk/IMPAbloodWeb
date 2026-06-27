'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = Boolean(user && user.isAdmin === true);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    if (adminOnly && user && !isAdmin) router.replace('/');
  }, [loading, user, adminOnly, router, isAdmin]);

  if (loading || !user || (adminOnly && !isAdmin)) {
    return (
      <div className="container text-center" style={{ padding: '4rem 0' }}>
        <div className="card" style={{ maxWidth: '420px', margin: '0 auto' }}>
          <p className="text-light" style={{ margin: 0 }}>
            {loading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }
  return children;
}
