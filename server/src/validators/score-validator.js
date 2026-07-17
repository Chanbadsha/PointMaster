import { z } from 'zod';

const trickPointsSchema = z.object({
  team0: z.number().int().min(0, 'Trick points cannot be negative').max(29, 'Trick points cannot exceed 29'),
  team1: z.number().int().min(0, 'Trick points cannot be negative').max(29, 'Trick points cannot exceed 29'),
}).refine(
  (data) => data.team0 + data.team1 === 29,
  { message: 'Trick points for both teams must sum to 29' }
);

export const updateRoundSchema = z.object({
  trickPoints: trickPointsSchema.optional(),
});

export const createCallBridgeRoundSchema = z.object({
  roundNumber: z.number().int().positive('Round number must be positive'),
  bids: z.array(z.number().int().min(1, 'Bid must be at least 1').max(13, 'Bid cannot exceed 13')).length(4, 'Exactly 4 bids required'),
  tricks: z.array(z.number().int().min(0, 'Tricks cannot be negative').max(13, 'Tricks cannot exceed 13')).length(4, 'Exactly 4 tricks required'),
}).refine(
  (data) => data.tricks.reduce((sum, t) => sum + t, 0) === 13,
  { message: 'Total tricks must sum to 13' }
);

export const updateCallBridgeRoundSchema = z.object({
  tricks: z.array(z.number().int().min(0, 'Tricks cannot be negative').max(13, 'Tricks cannot exceed 13')).length(4, 'Exactly 4 tricks required').optional(),
}).refine(
  (data) => {
    if (data.tricks) {
      return data.tricks.reduce((sum, t) => sum + t, 0) === 13;
    }
    return true;
  },
  { message: 'Total tricks must sum to 13' }
);
