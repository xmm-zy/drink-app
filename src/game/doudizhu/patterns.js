import { doudizhuValue, parseCardId } from "@/game/cards";

export const HAND_TYPES = {
  SINGLE: "single",
  PAIR: "pair",
  TRIPLE: "triple",
  TRIPLE_ONE: "triple_one",
  TRIPLE_PAIR: "triple_pair",
  STRAIGHT: "straight",
  PAIR_STRAIGHT: "pair_straight",
  TRIPLE_STRAIGHT: "triple_straight",
  PLANE_ONE: "plane_one",
  PLANE_PAIR: "plane_pair",
  BOMB: "bomb",
  ROCKET: "rocket",
  FOUR_TWO: "four_two",
  FOUR_TWO_PAIR: "four_two_pair",
};

function countsByRank(cards) {
  const map = new Map();
  for (const id of cards) {
    const { rank } = parseCardId(id);
    map.set(rank, (map.get(rank) || 0) + 1);
  }
  return map;
}

function sortedUniqueValues(cards) {
  return [...new Set(cards.map(doudizhuValue))].sort((a, b) => a - b);
}

function isConsecutive(values) {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] !== values[i - 1] + 1) return false;
  }
  return true;
}

function noTwoOrJoker(values) {
  return values.every((v) => v <= 12); // A=12, 2=13, BJ=14, RJ=15
}

/**
 * Analyze a play. Returns { type, mainValue, length, cards } or null if illegal.
 */
export function analyzeHand(cards) {
  if (!cards?.length) return null;
  const sorted = [...cards].sort((a, b) => doudizhuValue(a) - doudizhuValue(b));
  const n = sorted.length;
  const counts = countsByRank(sorted);
  const entries = [...counts.entries()].map(([rank, count]) => ({
    rank,
    count,
    value: doudizhuValue(rank === "BJ" || rank === "RJ" ? rank : `${rank}S`),
  }));
  // Fix value for rank-only: use DOUDIZHU_ORDER via a helper
  for (const e of entries) {
    e.value = doudizhuValue(e.rank === "BJ" || e.rank === "RJ" ? (e.rank === "BJ" ? "joker_black" : "joker_red") : `${e.rank}S`);
  }
  entries.sort((a, b) => a.value - b.value);

  const fours = entries.filter((e) => e.count === 4);
  const triples = entries.filter((e) => e.count === 3);
  const pairs = entries.filter((e) => e.count === 2);
  const singles = entries.filter((e) => e.count === 1);

  // Rocket
  if (n === 2 && sorted.includes("joker_black") && sorted.includes("joker_red")) {
    return { type: HAND_TYPES.ROCKET, mainValue: 15, length: 1, cards: sorted };
  }

  // Bomb
  if (n === 4 && fours.length === 1) {
    return { type: HAND_TYPES.BOMB, mainValue: fours[0].value, length: 1, cards: sorted };
  }

  // Single
  if (n === 1) {
    return { type: HAND_TYPES.SINGLE, mainValue: doudizhuValue(sorted[0]), length: 1, cards: sorted };
  }

  // Pair (two jokers of same color already handled; BJ+RJ is rocket)
  if (n === 2 && pairs.length === 1) {
    return { type: HAND_TYPES.PAIR, mainValue: pairs[0].value, length: 1, cards: sorted };
  }

  // Triple
  if (n === 3 && triples.length === 1) {
    return { type: HAND_TYPES.TRIPLE, mainValue: triples[0].value, length: 1, cards: sorted };
  }

  // Triple + one
  if (n === 4 && triples.length === 1 && singles.length === 1) {
    return { type: HAND_TYPES.TRIPLE_ONE, mainValue: triples[0].value, length: 1, cards: sorted };
  }

  // Triple + pair
  if (n === 5 && triples.length === 1 && pairs.length === 1) {
    return { type: HAND_TYPES.TRIPLE_PAIR, mainValue: triples[0].value, length: 1, cards: sorted };
  }

  // Four + two singles
  if (n === 6 && fours.length === 1 && singles.length === 2) {
    return { type: HAND_TYPES.FOUR_TWO, mainValue: fours[0].value, length: 1, cards: sorted };
  }
  // Four + one pair treated as four+two singles? Rules say 四带二单张 OR 四带两对
  if (n === 6 && fours.length === 1 && pairs.length === 1) {
    return { type: HAND_TYPES.FOUR_TWO, mainValue: fours[0].value, length: 1, cards: sorted };
  }

  // Four + two pairs
  if (n === 8 && fours.length === 1 && pairs.length === 2) {
    return { type: HAND_TYPES.FOUR_TWO_PAIR, mainValue: fours[0].value, length: 1, cards: sorted };
  }

  // Straight: >=5 consecutive singles, no 2/joker
  if (n >= 5 && singles.length === n && pairs.length === 0 && triples.length === 0 && fours.length === 0) {
    const values = sortedUniqueValues(sorted);
    if (values.length === n && noTwoOrJoker(values) && isConsecutive(values)) {
      return { type: HAND_TYPES.STRAIGHT, mainValue: values[values.length - 1], length: n, cards: sorted };
    }
  }

  // Pair straight: >=3 consecutive pairs
  if (n >= 6 && n % 2 === 0 && pairs.length === n / 2 && triples.length === 0 && fours.length === 0) {
    const values = pairs.map((p) => p.value).sort((a, b) => a - b);
    if (noTwoOrJoker(values) && isConsecutive(values)) {
      return { type: HAND_TYPES.PAIR_STRAIGHT, mainValue: values[values.length - 1], length: values.length, cards: sorted };
    }
  }

  // Triple straight (airplane body only)
  if (n >= 6 && n % 3 === 0 && triples.length === n / 3 && pairs.length === 0 && singles.length === 0 && fours.length === 0) {
    const values = triples.map((t) => t.value).sort((a, b) => a - b);
    if (noTwoOrJoker(values) && isConsecutive(values)) {
      return { type: HAND_TYPES.TRIPLE_STRAIGHT, mainValue: values[values.length - 1], length: values.length, cards: sorted };
    }
  }

  // Plane + singles: each triple takes one single (or bomb split as singles)
  if (triples.length >= 2) {
    const tValues = triples.map((t) => t.value).sort((a, b) => a - b);
    // may include fours as two pairs of "wings" or as singles - for plane+one, wings are singles
    // Use longest consecutive triple run
    for (let len = triples.length; len >= 2; len -= 1) {
      for (let start = 0; start <= triples.length - len; start += 1) {
        const run = tValues.slice(start, start + len);
        if (!noTwoOrJoker(run) || !isConsecutive(run)) continue;
        const bodyCount = len * 3;
        const wingCount = n - bodyCount;
        if (wingCount === len) {
          // plane + singles
          return { type: HAND_TYPES.PLANE_ONE, mainValue: run[run.length - 1], length: len, cards: sorted };
        }
        if (wingCount === len * 2) {
          // plane + pairs: remaining must form exactly `len` pairs (no mixed)
          const remaining = entries.filter((e) => !run.includes(e.value) || e.count !== 3);
          // Better: cards not in the triple run ranks
          const runSet = new Set(run);
          const wingEntries = entries.filter((e) => !runSet.has(e.value) || (runSet.has(e.value) && e.count !== 3));
          // Actually triples in run consume 3 each; if a rank has 4, leftover 1 could be wing
          const wingCardsNeeded = len;
          // For plane+pair: wingCount === len*2 and all wings are pairs
          const pairWings = entries.filter((e) => e.count === 2 || (e.count === 4 && !runSet.has(e.value)));
          // Simplified: if remaining card count is 2*len and can group into len pairs
          if (wingCount === len * 2) {
            const wingOnly = [];
            for (const e of entries) {
              if (runSet.has(e.value) && e.count === 3) continue;
              if (runSet.has(e.value) && e.count === 4) {
                // one leftover as single - breaks pure pair wings
                wingOnly.push({ value: e.value, count: 1 });
                continue;
              }
              wingOnly.push(e);
            }
            const asPairs = wingOnly.every((e) => e.count === 2) && wingOnly.length === len;
            if (asPairs) {
              return { type: HAND_TYPES.PLANE_PAIR, mainValue: run[run.length - 1], length: len, cards: sorted };
            }
            // fours outside as two pairs
            const pairCount =
              wingOnly.reduce((sum, e) => {
                if (e.count === 2) return sum + 1;
                if (e.count === 4) return sum + 2;
                return sum;
              }, 0);
            if (pairCount === len && wingOnly.every((e) => e.count === 2 || e.count === 4)) {
              return { type: HAND_TYPES.PLANE_PAIR, mainValue: run[run.length - 1], length: len, cards: sorted };
            }
          }
          void wingCardsNeeded;
        }
      }
    }
  }

  // Also handle plane when fours present as body? Usually not - fours are bombs.
  // Triple straight with attached: when we have triples + extras matching

  // Retry plane detection with count map more carefully
  const tripleValues = triples.map((t) => t.value).sort((a, b) => a - b);
  if (tripleValues.length >= 2) {
    let best = null;
    for (let len = tripleValues.length; len >= 2; len -= 1) {
      for (let i = 0; i <= tripleValues.length - len; i += 1) {
        const run = tripleValues.slice(i, i + len);
        if (!noTwoOrJoker(run) || !isConsecutive(run)) continue;
        const body = len * 3;
        const wings = n - body;
        if (wings === len) {
          best = { type: HAND_TYPES.PLANE_ONE, mainValue: run[run.length - 1], length: len, cards: sorted };
        } else if (wings === len * 2) {
          // check wings are all pairs (not mixed singles)
          const runSet = new Set(run);
          let pairSlots = 0;
          let ok = true;
          for (const e of entries) {
            if (runSet.has(e.value) && e.count === 3) continue;
            if (e.count === 2) pairSlots += 1;
            else if (e.count === 4 && !runSet.has(e.value)) pairSlots += 2;
            else if (e.count === 1) {
              ok = false;
              break;
            } else if (runSet.has(e.value) && e.count === 4) {
              ok = false;
              break;
            } else {
              ok = false;
              break;
            }
          }
          if (ok && pairSlots === len) {
            best = { type: HAND_TYPES.PLANE_PAIR, mainValue: run[run.length - 1], length: len, cards: sorted };
          }
        }
      }
      if (best) return best;
    }
  }

  return null;
}

/** Can `next` beat `prev`? If prev is null, any legal hand can lead. */
export function canBeat(prev, next) {
  if (!next) return false;
  if (!prev) return true;

  if (next.type === HAND_TYPES.ROCKET) return true;
  if (prev.type === HAND_TYPES.ROCKET) return false;

  if (next.type === HAND_TYPES.BOMB) {
    if (prev.type !== HAND_TYPES.BOMB) return true;
    return next.mainValue > prev.mainValue;
  }
  if (prev.type === HAND_TYPES.BOMB) return false;

  if (next.type !== prev.type) return false;
  if (next.length !== prev.length) return false;
  return next.mainValue > prev.mainValue;
}

export function isLegalPlay(cards, prevAnalysis) {
  const analysis = analyzeHand(cards);
  if (!analysis) return { ok: false, analysis: null };
  if (!canBeat(prevAnalysis, analysis)) return { ok: false, analysis };
  return { ok: true, analysis };
}

/** Enumerate some legal moves from hand against prev (null = free lead). */
export function findLegalMoves(hand, prevAnalysis, limit = 80) {
  const moves = [];
  const cards = [...hand];
  const n = cards.length;
  if (n === 0) return moves;

  // Always allow pass if not leading
  // Caller handles pass separately

  // Generate combinations up to reasonable size
  const maxLen = prevAnalysis
    ? prevAnalysis.type === HAND_TYPES.BOMB || prevAnalysis.type === HAND_TYPES.ROCKET
      ? n
      : Math.max(prevAnalysis.cards.length, 4)
    : Math.min(n, 20);

  function dfs(start, chosen) {
    if (moves.length >= limit) return;
    if (chosen.length > 0) {
      const { ok, analysis } = isLegalPlay(chosen, prevAnalysis);
      if (ok) moves.push({ cards: [...chosen], analysis });
    }
    if (chosen.length >= maxLen) return;
    for (let i = start; i < n; i += 1) {
      chosen.push(cards[i]);
      dfs(i + 1, chosen);
      chosen.pop();
      if (moves.length >= limit) return;
    }
  }

  // For free lead or matching length, prefer smarter generation
  if (!prevAnalysis) {
    // singles, pairs, triples, bombs, rocket first
    for (const c of cards) {
      const { ok, analysis } = isLegalPlay([c], null);
      if (ok) moves.push({ cards: [c], analysis });
    }
    const byRank = new Map();
    for (const c of cards) {
      const { rank } = parseCardId(c);
      if (!byRank.has(rank)) byRank.set(rank, []);
      byRank.get(rank).push(c);
    }
    for (const group of byRank.values()) {
      if (group.length >= 2) {
        const pick = group.slice(0, 2);
        const { ok, analysis } = isLegalPlay(pick, null);
        if (ok) moves.push({ cards: pick, analysis });
      }
      if (group.length >= 3) {
        const pick = group.slice(0, 3);
        const { ok, analysis } = isLegalPlay(pick, null);
        if (ok) moves.push({ cards: pick, analysis });
      }
      if (group.length === 4) {
        const { ok, analysis } = isLegalPlay(group, null);
        if (ok) moves.push({ cards: group, analysis });
      }
    }
    if (cards.includes("joker_black") && cards.includes("joker_red")) {
      const { ok, analysis } = isLegalPlay(["joker_black", "joker_red"], null);
      if (ok) moves.push({ cards: ["joker_black", "joker_red"], analysis });
    }
    // light dfs for straights etc.
    dfs(0, []);
    return uniqueMoves(moves).slice(0, limit);
  }

  // Must beat prev: same length mostly, or bomb/rocket
  const needLen = prevAnalysis.cards.length;
  const byRank = new Map();
  for (const c of cards) {
    const { rank } = parseCardId(c);
    if (!byRank.has(rank)) byRank.set(rank, []);
    byRank.get(rank).push(c);
  }
  for (const group of byRank.values()) {
    if (group.length === 4) {
      const { ok, analysis } = isLegalPlay(group, prevAnalysis);
      if (ok) moves.push({ cards: group, analysis });
    }
  }
  if (cards.includes("joker_black") && cards.includes("joker_red")) {
    const { ok, analysis } = isLegalPlay(["joker_black", "joker_red"], prevAnalysis);
    if (ok) moves.push({ cards: ["joker_black", "joker_red"], analysis });
  }

  // combinations of exact length
  function comb(start, chosen) {
    if (moves.length >= limit) return;
    if (chosen.length === needLen) {
      const { ok, analysis } = isLegalPlay(chosen, prevAnalysis);
      if (ok) moves.push({ cards: [...chosen], analysis });
      return;
    }
    for (let i = start; i < n; i += 1) {
      chosen.push(cards[i]);
      comb(i + 1, chosen);
      chosen.pop();
      if (moves.length >= limit) return;
    }
  }
  if (needLen <= n && needLen <= 12) comb(0, []);

  return uniqueMoves(moves).slice(0, limit);
}

function uniqueMoves(moves) {
  const seen = new Set();
  const out = [];
  for (const m of moves) {
    const key = [...m.cards].sort().join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}
