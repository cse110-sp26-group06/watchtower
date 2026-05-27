// BE-5: Checks that Worker can recieve request
import { SELF } from 'cloudflare:test';
import { describe, expect, test } from 'vitest';

describe('backend Worker smoke test', () => {
  test('responds to CORS preflight requests', async () => {
    const response = await SELF.fetch('http://example.com/api/errors', {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
