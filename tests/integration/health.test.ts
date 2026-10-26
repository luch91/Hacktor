import { describe, expect, it } from 'vitest';
import { handleRequest } from '../../apps/web/src/worker';

describe('same-origin API Worker', () => {
  it('returns a structured v1 health response', async () => {
    const response = handleRequest(new Request('https://hacktor.test/api/v1/health'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        service: 'hacktor-web',
        status: 'ok',
        milestone: 'M0',
        api_version: 'v1',
      },
    });
  });

  it('returns the canonical error envelope for unknown API routes', async () => {
    const response = handleRequest(new Request('https://hacktor.test/api/v1/missing'));
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: { code: string; retryable: boolean } };
    expect(body.error).toMatchObject({ code: 'not_found', retryable: false });
  });
});
