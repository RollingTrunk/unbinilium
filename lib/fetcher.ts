/**
 * SWR-compatible fetcher that throws on non-OK responses.
 */
export const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  });
