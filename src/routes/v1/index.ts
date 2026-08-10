import loginRoute from '@/routes/v1/[server]/[game]/login';
import profileRoute from '@/routes/v1/[server]/[game]/profile';
import { Hono } from 'hono';

export const v1 = new Hono();

v1.route('/:server/:game/login', loginRoute);
v1.route('/:server/:game/profile', profileRoute);
