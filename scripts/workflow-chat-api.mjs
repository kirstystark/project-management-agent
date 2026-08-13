// The research tool workflows talk to the local chat app over HTTP. Committed
// exports carry the repository default origin so they are valid on their own and
// stay reviewable, and the import step rewrites them to whatever CHAT_PORT is
// actually set to. Both the validator and the local runner read these values, so
// the reviewed origin can never drift between the two.

export const COMMITTED_CHAT_API_ORIGIN = "http://127.0.0.1:3000";

/**
 * Point a committed workflow export at the chat app origin in use locally.
 * A no-op when CHAT_PORT is the repository default.
 */
export function rewriteChatApiOrigin(workflowJson, origin) {
  if (origin === COMMITTED_CHAT_API_ORIGIN) {
    return workflowJson;
  }
  return workflowJson.split(COMMITTED_CHAT_API_ORIGIN).join(origin);
}
