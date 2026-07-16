import { ROLE_HIERARCHY, PERMISSIONS } from '../constants/index.js';

function normalizeRole(role) {
  return (role || '').toLowerCase();
}

export function hasMinRole(userRole, minimumRole) {
  const userLevel = ROLE_HIERARCHY[normalizeRole(userRole)] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[normalizeRole(minimumRole)] ?? Infinity;
  return userLevel >= requiredLevel;
}

export function roomHasPermission(roomRole, requiredPermission) {
  const allowedRoles = PERMISSIONS[requiredPermission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(normalizeRole(roomRole));
}
