/**
 * Builds a unique Inngest step id for a node executor.
 *
 * Inngest memoizes step results by id within a single function run, so a node
 * that runs multiple times — either because the workflow contains two nodes of
 * the same type, or because the node sits inside a LOOP body and runs once per
 * item — must produce a distinct id each time. We namespace every step id by the
 * node id and (when present) the loop `iterationKey`.
 *
 * @example
 * makeStepId("http-request", "node_abc")          // "http-request:node_abc"
 * makeStepId("http-request", "node_abc", "2")      // "http-request:node_abc:2"
 */
export function makeStepId(
  base: string,
  nodeId: string,
  iterationKey?: string,
): string {
  const scoped = `${base}:${nodeId}`;
  return iterationKey ? `${scoped}:${iterationKey}` : scoped;
}
