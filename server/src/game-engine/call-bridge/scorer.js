import { validateCallBridgeRound } from './validator.js';

export function calculateCallBridgeScore(roundData) {
  validateCallBridgeRound(roundData);

  const { bids, tricks } = roundData;
  const roundScores = [];

  for (let i = 0; i < 4; i++) {
    let score;
    if (tricks[i] >= bids[i]) {
      score = 10 + tricks[i];
    } else {
      score = -(bids[i] * 10);
    }
    roundScores.push({ playerIndex: i, score });
  }

  let roundWinner = null;
  let maxScore = -Infinity;
  for (const rs of roundScores) {
    if (rs.score > maxScore) {
      maxScore = rs.score;
      roundWinner = rs.playerIndex;
    }
  }

  return { roundScores, roundWinner };
}
