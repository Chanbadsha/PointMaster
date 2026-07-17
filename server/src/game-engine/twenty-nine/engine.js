import { calculateTwentyNineScore } from './scorer.js';
import { calculateTwentyNineWinner } from './winner.js';
import { validateTwentyNineMatch, validateTwentyNineRound } from './validator.js';

export function runTwentyNineEngine(config) {
  const { matchData, roundData, cumulativeScores } = config;

  validateTwentyNineMatch(matchData);
  validateTwentyNineRound(roundData);

  const roundResult = calculateTwentyNineScore(roundData);

  const newCumulativeScores = [...cumulativeScores];
  newCumulativeScores[0] += roundResult.roundScores[0].score;
  newCumulativeScores[1] += roundResult.roundScores[1].score;

  const winnerResult = calculateTwentyNineWinner({ cumulativeScores: newCumulativeScores });

  return {
    roundResult,
    winnerResult,
    cumulativeScores: newCumulativeScores,
  };
}
