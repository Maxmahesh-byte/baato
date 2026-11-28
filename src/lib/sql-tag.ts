/** Tagged-template SQL, structurally the same shape as `Sql` in db.ts. */
export type TaggedSql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
};
