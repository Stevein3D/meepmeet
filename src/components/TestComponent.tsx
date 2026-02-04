'use client';

import { useUserRole } from '@/hooks/useUserRole';

export function TestComponent() {
  const { userRole, loading } = useUserRole();
  
  if (loading) return <div>Loading role...</div>;
  
  return (
    <div style={{ background: 'black', padding: '10px', margin: '10px' }}>
      Your role is: {userRole}
    </div>
  );
}