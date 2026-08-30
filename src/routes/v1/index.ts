import { Hono } from 'hono';

import maimaiLogin from '@/routes/v1/[server]/maimai/login';
import maimaiProfile from '@/routes/v1/[server]/maimai/profile';
import maimaiRating from '@/routes/v1/[server]/maimai/rating';

export const v1 = new Hono();

v1.route('/:server/maimai/login', maimaiLogin);
v1.route('/:server/maimai/profile', maimaiProfile);
v1.route('/:server/maimai/rating', maimaiRating);
