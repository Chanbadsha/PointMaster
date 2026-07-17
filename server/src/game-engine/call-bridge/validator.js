import { InvalidMatchError, InvalidRoundError } from '../shared/errors.js';

export function validateCallBridgeMatch(matchData) {
  if (!matchData || typeof matchData !== 'object') {
    throw new InvalidMatchError('Match data must be an object');
  }

  const { gameType, players } = matchData;

  if (gameType !== 'call-bridge') {
    throw new InvalidMatchError('Game type must be call-bridge');
  }

  if (!players || !Array.isArray(players)) {
    throw new InvalidMatchError('Match must have a players array');
  }

  if (players.length !== 4) {
    throw new InvalidMatchError('Call Bridge requires exactly 4 players');
  }

  const uniquePlayers = new Set(players.map((p) => (typeof p === 'object' ? p.toString() : p)));
  if (uniquePlayers.size !== players.length) {
    throw new InvalidMatchError('All players must be unique');
  }

  return true;
}

export function validateCallBridgeRound(roundData) {
  if (!roundData || typeof roundData !== 'object') {
    throw new InvalidRoundError('Round data must be an object');
  }

  const { bids, tricks } = roundData;

  if (!bids || !Array.isArray(bids) || bids.length !== 4) {
    throw new InvalidRoundError('Bids must be an array of 4 numbers');
  }

  if (!tricks || !Array.isArray(tricks) || tricks.length !== 4) {
    throw new InvalidRoundError('Tricks must be an array of 4 numbers');
  }

  for (let i = 0; i < 4; i++) {
    if (typeof bids[i] !== 'number' || !Number.isInteger(bids[i]) || bids[i] < 1 || bids[i] > 13) {
      throw new InvalidRoundError(`Bid for player ${i} must be an integer between 1 and 13`);
    }
  }

  for (let i = 0; i < 4; i++) {
    if (typeof tricks[i] !== 'number' || !Number.isInteger(tricks[i]) || tricks[i] < 0 || tricks[i] > 13) {
      throw new InvalidRoundError(`Tricks for player ${i} must be an integer between 0 and 13`);
    }
  }

  const totalTricks = tricks.reduce((sum, t) => sum + t, 0);
  if (totalTricks !== 13) {
    throw new InvalidRoundError('Total tricks must equal 13');
  }

  return true;
}
