import { z } from 'zod';

export const createRoundSchema = z.object({
  roundNumber: z.number().int().positive('Round number must be positive'),
  bid: z.number().int().min(1, 'Bid must be at least 1').max(29, 'Bid cannot exceed 29'),
  bidTeamId: z.string().min(1, 'Bid team ID is required'),
  trumpSuit: z.enum(['hearts', 'diamonds', 'clubs', 'spades'], {
    message: 'Trump suit must be hearts, diamonds, clubs, or spades',
  }),
  trickPoints: z.object({
    team0: z.number().int().min(0, 'Trick points cannot be negative').max(29, 'Trick points cannot exceed 29'),
    team1: z.number().int().min(0, 'Trick points cannot be negative').max(29, 'Trick points cannot exceed 29'),
  }).refine(
    (data) => data.team0 + data.team1 === 29,
    { message: 'Trick points for both teams must sum to 29' }
  ),
});
