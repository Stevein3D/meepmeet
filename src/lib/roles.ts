import { UserRole } from '@prisma/client';

export type { UserRole } from '@prisma/client';

export const ROLE_PERMISSIONS = {
  VISITOR: {
    canViewGames: true,
    canViewEvents: true,
    canAddGames: false,
    canEditGames: false,
    canDeleteGames: false,
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canRSVP: false,
    canManageUsers: false,
  },
  MEEP: {
    canViewGames: true,
    canViewEvents: true,
    canAddGames: true,
    canEditGames: false,
    canDeleteGames: false,
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canRSVP: true,
    canManageUsers: false,
  },
  SAGE: {
    canViewGames: true,
    canViewEvents: true,
    canAddGames: true,
    canEditGames: true,
    canDeleteGames: false,
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: false,
    canRSVP: true,
    canManageUsers: false,
  },
  GAME_MASTER: {
    canViewGames: true,
    canViewEvents: true,
    canAddGames: true,
    canEditGames: true,
    canDeleteGames: true,
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canRSVP: true,
    canManageUsers: true,
  },
} as const;

export function hasPermission(
  userRole: UserRole | null | undefined,
  permission: keyof typeof ROLE_PERMISSIONS.VISITOR
): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole][permission];
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'VISITOR':
      return 'Visitor';
    case 'MEEP':
      return 'Meep';
    case 'SAGE':
      return 'Sage';
    case 'GAME_MASTER':
      return 'Game Master';
    default:
      return 'Unknown';
  }
}
