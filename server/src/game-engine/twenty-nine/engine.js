import { calculateTwentyNineScore } from './scorer.js';
import { calculateTwentyNineWinner } from './winner.js';
import { validateTwentyNineMatch } from './validator.js';

export function runTwentyNineEngine(matchData) {
  if (!validateTwentyNineMatch(matchData)) {
    throw new Error('Invalid Twenty-Nine match data');
  }

  const scores = calculateTwentyNineScore(matchData);
  const winner = calculateTwentyNineWinner(scores);

  return { scores, winner };
}
