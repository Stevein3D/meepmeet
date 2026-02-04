'use client';

import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission, ROLE_PERMISSIONS } from '@/lib/roles';

interface RoleGuardProps {
  children: ReactNode;
  permission: keyof typeof ROLE_PERMISSIONS.VISITOR;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  permission, 
  fallback = null,
  loadingFallback = null 
}: RoleGuardProps) {
  const { userRole, loading } = useUserRole();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Helper components for common use cases
export function VisitorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { userRole, loading } = useUserRole();

  if (loading) return <>{fallback}</>;
  
  // Only show to VISITOR role
  if (userRole !== 'VISITOR') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function MemberOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard permission="canRSVP" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function GameMasterOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard permission="canManageUsers" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CanAddGames({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard permission="canAddGames" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CanCreateEvents({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard permission="canCreateEvents" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Helper for showing content to Members + Game Masters (but not Visitors)
export function MemberOrHigher({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { userRole, loading } = useUserRole();

  if (loading) return <>{fallback}</>;
  
  if (userRole === 'VISITOR') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
