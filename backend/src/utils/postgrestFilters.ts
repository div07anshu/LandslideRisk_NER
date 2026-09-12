/**
 * Escapes a value for use inside a PostgREST `.or()` filter string, per
 * https://postgrest.org/en/stable/references/api/tables_views.html#operators —
 * values containing commas/parentheses must be double-quoted. This is a
 * syntax requirement of the filter grammar, not a SQL string, but we still
 * escape embedded quotes/backslashes defensively.
 */
export function escapeForOrFilter(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
