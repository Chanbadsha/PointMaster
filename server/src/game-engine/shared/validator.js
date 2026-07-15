export function validateGameType(gameType) {
  const validTypes = ['twenty-nine', 'call-bridge'];
  return validTypes.includes(gameType);
}
