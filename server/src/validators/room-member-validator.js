import { z } from 'zod';

export const addMemberSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['Player', 'Moderator', 'Admin'], {
    message: 'Role must be Player, Moderator, or Admin',
  }),
});

export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .length(6, 'Room code must be exactly 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Room code must be alphanumeric'),
});
