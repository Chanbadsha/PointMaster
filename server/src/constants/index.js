export const ROLES = Object.freeze({
  GUEST: 'guest',
  PLAYER: 'player',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
});

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
