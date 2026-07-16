export const ROLES = Object.freeze({
  GUEST: 'guest',
  PLAYER: 'player',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
});

export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.GUEST]: 0,
  [ROLES.PLAYER]: 1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]: 3,
});

export const PERMISSIONS = Object.freeze({
  'player:create': [ROLES.PLAYER, ROLES.MODERATOR, ROLES.ADMIN],
  'player:read': [ROLES.PLAYER, ROLES.MODERATOR, ROLES.ADMIN],
  'player:update': [ROLES.PLAYER, ROLES.MODERATOR, ROLES.ADMIN],
  'player:delete': [ROLES.MODERATOR, ROLES.ADMIN],
  'room:create': [ROLES.PLAYER, ROLES.MODERATOR, ROLES.ADMIN],
  'room:read': [ROLES.PLAYER, ROLES.MODERATOR, ROLES.ADMIN],
  'room:update': [ROLES.PLAYER, ROLES.MODERATOR, ROLES.ADMIN],
  'room:delete': [ROLES.MODERATOR, ROLES.ADMIN],
  'room:member:manage': [ROLES.MODERATOR, ROLES.ADMIN],
  'user:read': [ROLES.PLAYER, ROLES.MODERATOR, ROLES.ADMIN],
  'user:manage': [ROLES.MODERATOR, ROLES.ADMIN],
  'rbac:manage': [ROLES.ADMIN],
});

export const PERMISSION_ACTIONS = Object.freeze(Object.keys(PERMISSIONS));

export const MATCH_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const ROOM_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
});

export const GAME_TYPES = Object.freeze({
  TWENTY_NINE: 'twenty-nine',
  CALL_BRIDGE: 'call-bridge',
});
