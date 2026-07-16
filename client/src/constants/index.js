export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'PointMaster';

export const ROLES = Object.freeze({
  GUEST: 'guest',
  PLAYER: 'player',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
});

export const MATCH_STATUS = Object.freeze({
  PENDING: 'pending',
  PREPARING: 'preparing',
  LIVE: 'live',
  PAUSED: 'paused',
  FINISHED: 'finished',
  ARCHIVED: 'archived',
});

export const ROOM_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
});

export const GAME_TYPES = Object.freeze({
  TWENTY_NINE: 'twenty-nine',
  CALL_BRIDGE: 'call-bridge',
});
