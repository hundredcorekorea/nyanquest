/**
 * CORS headers for API routes.
 * Required for Toss mini-app SPA calling from a different origin.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

/** Handle CORS preflight requests. Export this as OPTIONS handler in API routes. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Wrap Response.json with CORS headers */
export function corsJson(data: unknown, init?: ResponseInit): Response {
  const headers = { ...corsHeaders, ...(init?.headers as Record<string, string>) };
  return Response.json(data, { ...init, headers });
}

/** Merge CORS headers into existing headers object */
export function withCors(headers: Record<string, string>): Record<string, string> {
  return { ...corsHeaders, ...headers };
}
