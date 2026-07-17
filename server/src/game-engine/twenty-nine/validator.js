import { InvalidMatchError, InvalidRoundError } from '../shared/errors.js';

export function validateTwentyNineMatch(matchData) {
  if (!matchData || typeof matchData !== 'object') {
    throw new InvalidMatchError('Match data must be an object');
  }

  const { teams, gameType } = matchData;

  if (!teams || !Array.isArray(teams)) {
    throw new InvalidMatchError('Match must have a teams array');
  }

  if (gameType !== 'twenty-nine') {
    throw new InvalidMatchError('Game type must be twenty-nine');
  }

  if (teams.length !== 2) {
    throw new InvalidMatchError('Twenty-Nine requires exactly 2 teams');
  }

  for (const team of teams) {
    if (!team.playerIds || !Array.isArray(team.playerIds)) {
      throw new InvalidMatchError(`Team "${team.name}" is missing playerIds`);
    }
    if (team.playerIds.length !== 2) {
      throw new InvalidMatchError(`Team "${team.name}" must have exactly 2 players for Twenty-Nine`);
    }
  }

  const allPlayerIds = teams.flatMap((t) =>
    t.playerIds.map((p) => (typeof p === 'object' ? p.toString() : p))
  );
  const uniquePlayerIds = new Set(allPlayerIds);

  if (allPlayerIds.length !== uniquePlayerIds.size) {
    throw new InvalidMatchError('A player cannot be assigned to multiple teams');
  }

  return true;
}

export function validateTwentyNineRound(roundData) {
  if (!roundData || typeof roundData !== 'object') {
    throw new InvalidRoundError('Round data must be an object');
  }

  const { bid, bidTeamIndex, trickPoints } = roundData;

  if (typeof bid !== 'number' || !Number.isInteger(bid) || bid < 1 || bid > 29) {
    throw new InvalidRoundError('Bid must be an integer between 1 and 29');
  }

  if (bidTeamIndex !== 0 && bidTeamIndex !== 1) {
    throw new InvalidRoundError('Bid team index must be 0 or 1');
  }

  if (!trickPoints || !Array.isArray(trickPoints) || trickPoints.length !== 2) {
    throw new InvalidRoundError('Trick points must be an array of 2 numbers');
  }

  for (let i = 0; i < 2; i++) {
    if (typeof trickPoints[i] !== 'number' || !Number.isInteger(trickPoints[i]) || trickPoints[i] < 0 || trickPoints[i] > 29) {
      throw new InvalidRoundError(`Trick points for team ${i} must be an integer between 0 and 29`);
    }
  }

  if (trickPoints[0] + trickPoints[1] !== 29) {
    throw new InvalidRoundError('Total trick points must equal 29');
  }

  return true;
}
