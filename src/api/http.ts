import { API_CFG } from "../config/api";

type CacheEntry = { t: number; data: any };
const mem = new Map<string, CacheEntry>();

// very light per-host throttle (1 rps for nominatim)
const hostQueues: Record<string, Promise<any>> = {};

function enqueue(url: string, run: () => Promise<any>) {
  const host = new URL(url).host;
  const prev = hostQueues[host] ?? Promise.resolve();
  const delay = host.includes("nominatim.openstreetmap.org") ? 1100 : 0; // ~1 req/sec
  const next = prev.then(
    () => new Promise<void>(res => setTimeout(res, delay))
  ).then(run, run);
  hostQueues[host] = next.catch(() => {}); // don't block queue on error
  return next;
}

export async function getJson(url: string, headers: Record<string,string> = {}) {
  const now = Date.now();
  const hit = mem.get(url);
  if (hit && (now - hit.t) < API_CFG.cacheTTLms) return hit.data;

  const exec = async () => {
    const res = await fetch(url, { headers: { ...headers } as any });
    if (!res.ok) throw new Error(`GET ${url} ${res.status}`);
    const data = await res.json();
    mem.set(url, { t: Date.now(), data });
    return data;
  };

  return enqueue(url, exec);
}
