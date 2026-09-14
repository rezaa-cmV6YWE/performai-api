import { status } from 'elysia';

import { getChunithmProfile, getChunithmRating } from '@/lib/games/chunithm';
import { loginChunithmIntl } from '@/lib/games/chunithm/auth';
import type { ChunithmServer } from '@/lib/games/chunithm/consts';

export const ChunithmService = {
  async login(server: string, segaId: string, password: string) {
    if (server !== 'intl') {
      return status(501, {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `server '${server}' not yet supported for chunithm`,
        },
      });
    }

    const cookie = await loginChunithmIntl(segaId, password);
    return { data: { cookie } };
  },

  async profile(server: string, cookie: string) {
    if (server !== 'intl') {
      return status(501, {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `server '${server}' not yet supported for chunithm`,
        },
      });
    }

    const profile = await getChunithmProfile(server as ChunithmServer, cookie);
    return { data: profile };
  },

  async rating(server: string, cookie: string) {
    if (server !== 'intl') {
      return status(501, {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `server '${server}' not yet supported for chunithm`,
        },
      });
    }

    const rating = await getChunithmRating(server as ChunithmServer, cookie);
    return { data: rating };
  },
};
