import { calculateCallBridgeScore } from './scorer.js';
import { calculateCallBridgeWinner } from './winner.js';
import { validateCallBridgeMatch } from './validator.js';

export function runCallBridgeEngine(matchData) {
  if (!validateCallBridgeMatch(matchData)) {
    throw new Error('Invalid Call Bridge match data');
  }

  const scores = calculateCallBridgeScore(matchData);
  const winner = calculateCallBridgeWinner(scores);

  return { scores, winner };
}
