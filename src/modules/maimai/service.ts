import { status } from 'elysia';

import { getMaimaiProfile, getMaimaiRating } from '@/lib/games/maimai';
import { loginMaimaiIntl } from '@/lib/games/maimai/auth';
import type { MaimaiServer } from '@/lib/games/maimai/consts';

export const MaimaiService = {
  async login(server: string, segaId: string, password: string) {
    if (server !== 'intl') {
      return status(501, {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `server '${server}' not yet supported for maimai`,
        },
      });
    }

    const cookie = await loginMaimaiIntl(segaId, password);
    return { data: { cookie } };
  },

  async profile(server: string, cookie: string) {
    if (server !== 'intl') {
      return status(501, {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `server '${server}' not yet supported for maimai`,
        },
      });
    }

    const profile = await getMaimaiProfile(server as MaimaiServer, cookie);
    return { data: profile };
  },

  async rating(server: string, cookie: string) {
    if (server !== 'intl') {
      return status(501, {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `server '${server}' not yet supported for maimai`,
        },
      });
    }

    const rating = await getMaimaiRating(server as MaimaiServer, cookie);
    return { data: rating };
  },
};
