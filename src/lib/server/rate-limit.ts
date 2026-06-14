// src/lib/server/rate-limit.ts
// Fixed-window, in-memory. Стан per-instance: скидається при рестарті й НЕ шариться
// між нодами. Для multi-instance prod — підкласти Redis/Upstash за цим самим інтерфейсом.
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function rateLimit(
	key: string,
	limit: number,
	windowMs: number
): { ok: boolean; retryAfter: number } {
	const now = Date.now();
	const entry = buckets.get(key);

	if (!entry || now >= entry.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true, retryAfter: 0 };
	}
	if (entry.count >= limit) {
		return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
	}
	entry.count += 1;
	return { ok: true, retryAfter: 0 };
}