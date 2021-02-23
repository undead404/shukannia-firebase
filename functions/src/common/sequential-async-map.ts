import reduce from 'lodash/reduce';

export default function sequentialAsyncMap<T1, T2>(
  collection: T1[],
  f: (item: T1) => Promise<T2>,
): Promise<T2[]> {
  return reduce(
    collection,
    async (accumulator, item) => [...(await accumulator), await f(item)],
    Promise.resolve([] as T2[]),
  );
}
