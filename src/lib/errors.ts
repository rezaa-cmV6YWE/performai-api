export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class AuthError extends GameError {
  constructor(message = 'authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}
