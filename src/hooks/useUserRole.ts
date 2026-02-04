'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@prisma/client';

interface UseUserRoleReturn {
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
}

export function useUserRole(): UseUserRoleReturn {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // This assumes you have an API endpoint to get current user
        const response = await fetch('/api/user/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await response.json();
        setUserRole(userData.role || 'VISITOR');
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserRole('VISITOR'); // Default to most restrictive role
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { userRole, loading, error };
}
