import { dispatchPendingOutbox, handleApiRequest } from './api';

export function handleRequest(request: Request, env: Env): Promise<Response> {
  return handleApiRequest(request, env);
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(dispatchPendingOutbox(env).then((published) => {
      console.log(JSON.stringify({ message: 'outbox dispatch completed', published }));
    }));
  },
} satisfies ExportedHandler<Env>;
