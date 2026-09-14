import { status } from 'elysia';

import { loginChunithmIntl } from '@/lib/games/chunithm/auth';

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
};
