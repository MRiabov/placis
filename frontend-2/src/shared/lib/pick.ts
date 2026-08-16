/** App-sanctioned accessor for flexible JSON records (satisfies both the
 *  naming audit and TS4111 on index-signature types). */
export function pick(source: Record<string, unknown>, key: string): unknown {
  return source[key];
}
