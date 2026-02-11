/**
 * Authentication Handler (Placeholder)
 * TODO: Implement with better-auth or similar library
 */

export const auth = {
  handler: async (request?: Request) => {
    return new Response(
      JSON.stringify({ error: 'Auth not configured' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  },
};
