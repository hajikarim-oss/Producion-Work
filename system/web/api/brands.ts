import type { IncomingMessage, ServerResponse } from 'http';
import { INITIAL_BRANDS } from '../src/lib/tbm/seedData';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      success: true,
      count: INITIAL_BRANDS.length,
      data: INITIAL_BRANDS,
    })
  );
}
