import { z } from 'zod';
import { GAME_TYPES } from '../constants/index.js';

export const createMatchSchema = z.object({
  game: z
    .string()
    .refine((val) => Object.values(GAME_TYPES).includes(val), {
      message: 'Invalid game type. Must be twenty-nine or call-bridge.',
    }),
});

export const updateMatchSchema = z.object({
  game: z
    .string()
    .refine((val) => Object.values(GAME_TYPES).includes(val), {
      message: 'Invalid game type. Must be twenty-nine or call-bridge.',
    })
    .optional(),
});
