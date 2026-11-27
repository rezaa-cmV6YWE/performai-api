import { CHUNITHM_URLS } from '@/lib/games/chunithm/consts';
import { createGameFetch } from '@/lib/shared/http';

export const chunithmFetch = createGameFetch(`${CHUNITHM_URLS.intl}/`);
