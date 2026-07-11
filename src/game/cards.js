/** Shared card helpers for Dou Dizhu / Zha Jin Hua. */

export const SUITS = ["S", "H", "C", "D"];
export const RANKS = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];

/** Dou Dizhu order: 3 < ... < 2 < BJ < RJ */
export const DOUDIZHU_ORDER = {
  "3": 1,
  "4": 2,
  "5": 3,
  "6": 4,
  "7": 5,
  "8": 6,
  "9": 7,
  "10": 8,
  J: 9,
  Q: 10,
  K: 11,
  A: 12,
  "2": 13,
  BJ: 14,
  RJ: 15,
};

export function cardId(rank, suit) {
  if (rank === "BJ") return "joker_black";
  if (rank === "RJ") return "joker_red";
  return `${rank}${suit}`;
}

export function parseCardId(id) {
  if (id === "joker_black") return { id, rank: "BJ", suit: null };
  if (id === "joker_red") return { id, rank: "RJ", suit: null };
  const suit = id.slice(-1);
  const rank = id.slice(0, -1);
  return { id, rank, suit };
}

export function cardImage(id) {
  return `/assets/cards/${id}.png`;
}

export function doudizhuValue(cardOrId) {
  if (typeof cardOrId === "string") {
    if (DOUDIZHU_ORDER[cardOrId]) return DOUDIZHU_ORDER[cardOrId];
    return DOUDIZHU_ORDER[parseCardId(cardOrId).rank] || 0;
  }
  return DOUDIZHU_ORDER[cardOrId?.rank] || 0;
}

export function createDoudizhuDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(cardId(rank, suit));
    }
  }
  deck.push("joker_black", "joker_red");
  return deck;
}

export function shuffle(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sortHand(cards) {
  return [...cards].sort((a, b) => {
    const va = doudizhuValue(a);
    const vb = doudizhuValue(b);
    if (va !== vb) return va - vb;
    return String(a).localeCompare(String(b));
  });
}

export function createZhajinhuaDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(cardId(rank, suit));
    }
  }
  return deck;
}
