const API_PREFIX = '/api/v1';

export function handleRequest(request: Request): Response {
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === `${API_PREFIX}/health`) {
    return Response.json({
      data: {
        service: 'hacktor-web',
        status: 'ok',
        milestone: 'M0',
        api_version: 'v1',
      },
    });
  }

  return Response.json(
    {
      error: {
        code: 'not_found',
        message: 'API route not found',
        retryable: false,
        request_id: crypto.randomUUID(),
      },
    },
    { status: 404 },
  );
}

export default {
  fetch(request: Request): Response {
    return handleRequest(request);
  },
} satisfies ExportedHandler;
