import { calculateCallBridgeScore } from './scorer.js';
import { calculateCallBridgeWinner } from './winner.js';
import { validateCallBridgeMatch, validateCallBridgeRound } from './validator.js';

export function runCallBridgeEngine(config) {
  const { matchData, roundData, cumulativeScores } = config;

  validateCallBridgeMatch(matchData);
  validateCallBridgeRound(roundData);

  const roundResult = calculateCallBridgeScore(roundData);

  const newCumulativeScores = [...cumulativeScores];
  for (let i = 0; i < roundResult.roundScores.length; i++) {
    newCumulativeScores[i] += roundResult.roundScores[i].score;
  }

  const winnerResult = calculateCallBridgeWinner({ cumulativeScores: newCumulativeScores });

  return {
    roundResult,
    winnerResult,
    cumulativeScores: newCumulativeScores,
  };
}
