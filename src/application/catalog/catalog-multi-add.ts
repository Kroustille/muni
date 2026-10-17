export type CatalogMultiAddFailure = {
  key: string;
  title: string;
  message: string;
};

export type CatalogMultiAddResult<T> = {
  succeeded: T[];
  failures: CatalogMultiAddFailure[];
};

export async function runCatalogMultiAdd<T extends { key: string; title: string }>(
  selected: readonly T[],
  addOne: (item: T) => Promise<void>,
): Promise<CatalogMultiAddResult<T>> {
  const succeeded: T[] = [];
  const failures: CatalogMultiAddFailure[] = [];
  for (const item of selected) {
    try {
      await addOne(item);
      succeeded.push(item);
    } catch (error) {
      failures.push({
        key: item.key,
        title: item.title,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { succeeded, failures };
}
