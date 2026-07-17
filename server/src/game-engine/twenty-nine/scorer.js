import { InvalidScoreError } from '../shared/errors.js';
import { validateTwentyNineRound } from './validator.js';

export function calculateTwentyNineScore(roundData) {
  validateTwentyNineRound(roundData);

  const { bid, bidTeamIndex, trickPoints } = roundData;
  const otherTeamIndex = bidTeamIndex === 0 ? 1 : 0;

  const bidTeamActual = trickPoints[bidTeamIndex];
  const otherTeamActual = trickPoints[otherTeamIndex];

  let bidTeamScore;
  if (bidTeamActual >= bid) {
    bidTeamScore = bidTeamActual;
  } else {
    bidTeamScore = -bid;
  }

  const roundScores = [
    { teamIndex: 0, score: 0 },
    { teamIndex: 1, score: 0 },
  ];

  roundScores[bidTeamIndex].score = bidTeamScore;
  roundScores[otherTeamIndex].score = otherTeamActual;

  let roundWinner = null;
  if (roundScores[0].score > roundScores[1].score) {
    roundWinner = 0;
  } else if (roundScores[1].score > roundScores[0].score) {
    roundWinner = 1;
  }

  return { roundScores, roundWinner };
}
