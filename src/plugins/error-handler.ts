import { Elysia } from 'elysia';

import { GameError } from '@/lib/errors';
import { errorBody } from '@/modules/common/model';

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ code, error, status }) => {
    if (error instanceof GameError) {
      return status(error.statusCode, errorBody(error.code, error.message));
    }

    switch (code) {
      case 'VALIDATION':
        return status(422, errorBody('VALIDATION_ERROR', error.message));
      case 'NOT_FOUND':
        return status(404, errorBody('NOT_FOUND', 'route not found'));
      case 'PARSE':
        return status(400, errorBody('BAD_REQUEST', 'malformed request body'));
      default:
        console.error(error);
        return status(500, errorBody('INTERNAL_ERROR', 'internal error'));
    }
  }
);
