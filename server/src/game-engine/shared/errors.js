export class GameError extends Error {
  constructor(message, code = 'GAME_ERROR') {
    super(message);
    this.name = 'GameError';
    this.code = code;
  }
}

export class InvalidMatchError extends GameError {
  constructor(message = 'Invalid match') {
    super(message, 'INVALID_MATCH');
  }
}

export class InvalidRoundError extends GameError {
  constructor(message = 'Invalid round') {
    super(message, 'INVALID_ROUND');
  }
}

export class InvalidScoreError extends GameError {
  constructor(message = 'Invalid score') {
    super(message, 'INVALID_SCORE');
  }
}
