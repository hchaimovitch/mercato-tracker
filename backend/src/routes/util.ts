import type { Request } from 'express';
import { WINDOWS } from '../data/seed.js';
import type { WindowId } from '../types.js';

export function windowFromQuery(req: Request): WindowId {
  const raw = typeof req.query.window === 'string' ? req.query.window : undefined;
  const found = WINDOWS.find((w) => w.id === raw);
  return (found?.id ?? WINDOWS[0].id) as WindowId;
}
