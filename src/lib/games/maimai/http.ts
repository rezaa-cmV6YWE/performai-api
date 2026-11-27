import { MAIMAI_URLS } from '@/lib/games/maimai/consts';
import { createGameFetch } from '@/lib/shared/http';

export const maimaiFetch = createGameFetch(`${MAIMAI_URLS.intl}/home/`);
