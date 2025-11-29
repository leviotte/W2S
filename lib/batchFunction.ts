export async function fetchInBatches<T>(
  fetchFunction: (params: any) => Promise<T[]>,
  params: any,
  batchSize = 10,
  maxRetries = 3
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let retries = 0;

  while (true) {
    const batchParams = { ...params, page, batchSize };

    try {
      const data = await fetchFunction(batchParams);
      if (data.length === 0) break;

      results.push(...data);
      page += 1;
      retries = 0;
    } catch (error) {
      console.error(`Error fetching batch ${page}:`, error);
      retries += 1;
      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} retries, aborting.`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}
