export function calculateCallBridgeWinner(scoresData) {
  if (!scoresData || typeof scoresData !== 'object') {
    throw new Error('Scores data must be an object');
  }

  const { cumulativeScores, targetScore = 100 } = scoresData;

  if (!cumulativeScores || !Array.isArray(cumulativeScores) || cumulativeScores.length !== 4) {
    throw new Error('Cumulative scores must be an array of 4 numbers');
  }

  for (let i = 0; i < 4; i++) {
    if (typeof cumulativeScores[i] !== 'number') {
      throw new Error(`Cumulative score for player ${i} must be a number`);
    }
  }

  let winner = null;

  for (let i = 0; i < cumulativeScores.length; i++) {
    if (cumulativeScores[i] >= targetScore) {
      if (winner === null || cumulativeScores[i] > cumulativeScores[winner]) {
        winner = i;
      }
    }
  }

  return {
    winner,
    isComplete: winner !== null,
  };
}
