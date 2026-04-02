'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserRole } from '@prisma/client';

interface UseUserRoleReturn {
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
}

export function useUserRole(): UseUserRoleReturn {
  const { isLoaded, isSignedIn } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUserRole('VISITOR');
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/user/profile');

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();
        setUserRole(userData.role || 'VISITOR');
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserRole('VISITOR');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [isLoaded, isSignedIn]);

  return { userRole, loading, error };
}
