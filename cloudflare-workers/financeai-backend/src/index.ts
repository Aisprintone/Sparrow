/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// Durable Object classes
export class SimulationState {
	constructor(private state: DurableObjectState, private env: Env) {}
	
	async fetch(request: Request): Promise<Response> {
		return new Response('SimulationState Durable Object');
	}
}

export class ChatContext {
	constructor(private state: DurableObjectState, private env: Env) {}
	
	async fetch(request: Request): Promise<Response> {
		return new Response('ChatContext Durable Object');
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		switch (url.pathname) {
			case '/message':
				return new Response('Hello, World!');
			case '/random':
				return new Response(crypto.randomUUID());
			case '/health':
				return new Response('OK', { status: 200 });
			default:
				return new Response('Not Found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
