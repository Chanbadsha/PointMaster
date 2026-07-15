import { z } from 'zod';

export const createPlayerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  isGuest: z.boolean().optional().default(false),
});

export const updatePlayerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
  isGuest: z.boolean().optional(),
});

export const searchPlayerSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(50),
});
