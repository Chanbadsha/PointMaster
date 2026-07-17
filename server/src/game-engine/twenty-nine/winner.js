export function calculateTwentyNineWinner(scoresData) {
  if (!scoresData || typeof scoresData !== 'object') {
    throw new Error('Scores data must be an object');
  }

  const { cumulativeScores, targetScore = 29 } = scoresData;

  if (!cumulativeScores || !Array.isArray(cumulativeScores) || cumulativeScores.length !== 2) {
    throw new Error('Cumulative scores must be an array of 2 numbers');
  }

  for (let i = 0; i < 2; i++) {
    if (typeof cumulativeScores[i] !== 'number') {
      throw new Error(`Cumulative score for team ${i} must be a number`);
    }
  }

  let winner = null;

  if (cumulativeScores[0] >= targetScore && cumulativeScores[1] >= targetScore) {
    if (cumulativeScores[0] > cumulativeScores[1]) {
      winner = 0;
    } else if (cumulativeScores[1] > cumulativeScores[0]) {
      winner = 1;
    }
  } else if (cumulativeScores[0] >= targetScore) {
    winner = 0;
  } else if (cumulativeScores[1] >= targetScore) {
    winner = 1;
  }

  return {
    winner,
    isComplete: winner !== null,
  };
}
