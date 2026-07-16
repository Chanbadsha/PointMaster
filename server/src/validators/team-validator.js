import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(50, 'Team name too long'),
  playerIds: z.array(z.string().min(1)).min(1, 'At least one player is required'),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  playerIds: z.array(z.string().min(1)).min(1).optional(),
});
