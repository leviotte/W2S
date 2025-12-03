// lib/proxy.ts
export async function proxy<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Automatisch headers zetten
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store", // belangrijk voor server actions in Next.js 13–16
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}
