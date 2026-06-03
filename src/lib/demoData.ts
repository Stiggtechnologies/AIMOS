// ============================================================
// Central control for placeholder / demo data.
//
// Several dashboards and services still synthesize illustrative metrics where a
// real data source has not been wired yet. Historically this used Math.random()
// inline, which (a) silently presented fabricated numbers as if real and
// (b) re-randomized on every render. This module makes that behaviour explicit,
// deterministic, and switchable:
//
//   - isDemoDataEnabled() gates fabrication. Set VITE_ENABLE_DEMO_DATA=false in
//     production to surface real-data gaps (empty/zeroed state) instead of fake
//     numbers. Defaults to ON to preserve existing behaviour until each surface
//     is backed by a real query.
//   - seededRandom()/hashSeed() produce stable values per entity, so demo
//     dashboards are reproducible and don't flicker between renders.
// ============================================================

export function isDemoDataEnabled(): boolean {
  // import.meta.env is provided by Vite; guard for non-Vite execution contexts.
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const flag = env?.VITE_ENABLE_DEMO_DATA;
  if (flag === undefined || flag === null || flag === '') return true;
  return flag === 'true' || flag === '1' || flag === true;
}

/** Deterministic PRNG in [0, 1). Mulberry32 — fast, stable, seedable. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable string -> 32-bit seed (FNV-1a) so an entity always maps to the same value. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Convenience: a seeded RNG keyed off a stable string identifier. */
export function seededRandomFor(key: string): () => number {
  return seededRandom(hashSeed(key));
}
