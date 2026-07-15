export function validateMatch(matchData) {
  return matchData !== null && typeof matchData === 'object';
}

export function validateRound(roundData) {
  return roundData !== null && typeof roundData === 'object';
}
