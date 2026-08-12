import { Hono } from 'hono';

import maimaiLogin from '@/routes/v1/[server]/maimai/login';
import maimaiProfile from '@/routes/v1/[server]/maimai/profile';

export const v1 = new Hono();

v1.route('/:server/maimai/login', maimaiLogin);
v1.route('/:server/maimai/profile', maimaiProfile);
