import { createZhajinhuaDeck, parseCardId, shuffle, cardImage } from "@/game/cards";

const RANK_VALUE = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const ZJH_HAND_TYPES = {
  SINGLE: "single",
  PAIR: "pair",
  STRAIGHT: "straight",
  FLUSH: "flush",
  STRAIGHT_FLUSH: "straight_flush",
  TRIPLE: "triple",
};

const HAND_WEIGHT = {
  [ZJH_HAND_TYPES.SINGLE]: 1,
  [ZJH_HAND_TYPES.PAIR]: 2,
  [ZJH_HAND_TYPES.STRAIGHT]: 3,
  [ZJH_HAND_TYPES.FLUSH]: 4,
  [ZJH_HAND_TYPES.STRAIGHT_FLUSH]: 5,
  [ZJH_HAND_TYPES.TRIPLE]: 6,
};

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function rankValue(id) {
  const { rank } = parseCardId(id);
  return RANK_VALUE[rank] || 0;
}

function sortedRankValues(cards) {
  return cards.map(rankValue).sort((a, b) => a - b);
}

function isA23Straight(values) {
  return values[0] === 2 && values[1] === 3 && values[2] === 14;
}

function straightTopValue(values) {
  if (isA23Straight(values)) return 3;
  if (values[0] + 1 === values[1] && values[1] + 1 === values[2]) return values[2];
  return 0;
}

function compareLexicographic(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

export function analyzeZhajinhuaHand(cards) {
  if (!Array.isArray(cards) || cards.length !== 3) return null;
  const values = sortedRankValues(cards);
  const suits = cards.map((c) => parseCardId(c).suit);
  const flush = suits[0] === suits[1] && suits[1] === suits[2];
  const topStraight = straightTopValue(values);

  const byValue = new Map();
  for (const v of values) byValue.set(v, (byValue.get(v) || 0) + 1);
  const groups = [...byValue.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let type = ZJH_HAND_TYPES.SINGLE;
  let score = [...values].sort((a, b) => b - a);

  if (groups[0][1] === 3) {
    type = ZJH_HAND_TYPES.TRIPLE;
    score = [groups[0][0]];
  } else if (topStraight && flush) {
    type = ZJH_HAND_TYPES.STRAIGHT_FLUSH;
    score = [topStraight];
  } else if (flush) {
    type = ZJH_HAND_TYPES.FLUSH;
    score = [...values].sort((a, b) => b - a);
  } else if (topStraight) {
    type = ZJH_HAND_TYPES.STRAIGHT;
    score = [topStraight];
  } else if (groups[0][1] === 2) {
    type = ZJH_HAND_TYPES.PAIR;
    const pair = groups[0][0];
    const kicker = groups[1][0];
    score = [pair, kicker];
  }

  return {
    cards: [...cards],
    type,
    weight: HAND_WEIGHT[type],
    score,
  };
}

export function compareZhajinhuaHand(a, b) {
  if (!a || !b) return 0;
  if (a.weight !== b.weight) return a.weight > b.weight ? 1 : -1;
  return compareLexicographic(a.score, b.score);
}

export function createZhajinhuaPlayer({ id, name, avatar = "", isBot = false, botLevel = "normal" }) {
  return {
    id,
    name,
    avatar,
    isBot,
    botLevel,
    seat: -1,
    hand: [],
    looked: false,
    active: true,
    folded: false,
    totalBet: 0,
  };
}

function nextActiveSeat(state, fromSeat) {
  const n = state.players.length;
  for (let i = 1; i <= n; i += 1) {
    const seat = (fromSeat + i) % n;
    if (state.players[seat]?.active && !state.players[seat].folded) return seat;
  }
  return fromSeat;
}

function activeSeats(state) {
  return state.players
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => p.active && !p.folded)
    .map(({ idx }) => idx);
}

function settleByComparison(state) {
  const next = structuredClone(state);
  const alive = activeSeats(next);
  if (!alive.length) {
    next.phase = "settled";
    next.message = "本局结束（全部弃牌）。";
    next.result = null;
    return next;
  }

  let winnerSeat = alive[0];
  let winnerHand = analyzeZhajinhuaHand(next.players[winnerSeat].hand);
  for (let i = 1; i < alive.length; i += 1) {
    const seat = alive[i];
    const hand = analyzeZhajinhuaHand(next.players[seat].hand);
    if (compareZhajinhuaHand(hand, winnerHand) > 0) {
      winnerSeat = seat;
      winnerHand = hand;
    }
  }

  next.phase = "settled";
  next.result = {
    winnerSeat,
    winnerHand,
    pot: next.pot,
  };
  next.message = `座位 ${winnerSeat + 1} 获胜，赢得 ${next.pot} 注。`;
  return next;
}

function settleIfNeeded(state) {
  const alive = activeSeats(state);
  if (alive.length <= 1) {
    const next = structuredClone(state);
    const winnerSeat = alive[0] ?? 0;
    next.phase = "settled";
    next.result = {
      winnerSeat,
      winnerHand: alive.length ? analyzeZhajinhuaHand(next.players[winnerSeat].hand) : null,
      pot: next.pot,
    };
    next.message = alive.length
      ? `其余玩家弃牌，座位 ${winnerSeat + 1} 获胜，赢得 ${next.pot} 注。`
      : "本局结束。";
    return next;
  }
  if (state.pendingSeats.length === 0) {
    return settleByComparison(state);
  }
  return state;
}

function amountToCall(state, seat) {
  const player = state.players[seat];
  return player.looked ? state.currentBet * 2 : state.currentBet;
}

function rebuildPendingAfterRaise(state, raiserSeat) {
  return activeSeats(state).filter((seat) => seat !== raiserSeat);
}

export function createInitialZhajinhuaState(players, options = {}) {
  if (!Array.isArray(players) || players.length < 2) {
    throw new Error("扎金花至少需要 2 名玩家");
  }
  if (players.length > 4) {
    throw new Error("扎金花当前版本最多支持 4 名玩家");
  }

  const baseBet = Number(options.baseBet || 1);
  const list = players.map((p, i) => ({
    ...createZhajinhuaPlayer(p),
    seat: i,
  }));

  return {
    version: 1,
    game: "zhajinhua",
    phase: "dealing", // dealing | playing | settled
    baseBet,
    currentBet: baseBet,
    pot: 0,
    players: list,
    turnSeat: 0,
    pendingSeats: [],
    actionLog: [],
    result: null,
    message: "发牌中…",
  };
}

export function dealZhajinhua(state) {
  const next = structuredClone(state);
  const deck = shuffle(createZhajinhuaDeck());
  let cursor = 0;
  next.players.forEach((p) => {
    p.hand = deck.slice(cursor, cursor + 3);
    cursor += 3;
    p.looked = false;
    p.active = true;
    p.folded = false;
    p.totalBet = next.baseBet;
  });
  next.pot = next.players.length * next.baseBet;
  next.phase = "playing";
  next.currentBet = next.baseBet;
  next.turnSeat = 0;
  next.pendingSeats = activeSeats(next).filter((seat) => seat !== next.turnSeat);
  next.actionLog = [];
  next.result = null;
  next.message = "扎金花开局，轮到座位 1 操作。";
  return next;
}

export function zjhLookCards(state, seat) {
  if (state.phase !== "playing") return { ok: false, error: "当前不在对局中", state };
  if (state.turnSeat !== seat) return { ok: false, error: "还没轮到你", state };
  if (!state.players[seat]?.active || state.players[seat].folded) return { ok: false, error: "该玩家已弃牌", state };

  const next = structuredClone(state);
  next.players[seat].looked = true;
  next.actionLog.push({ seat, action: "look" });
  next.pendingSeats = next.pendingSeats.filter((s) => s !== seat);
  next.turnSeat = nextActiveSeat(next, seat);
  next.message = `座位 ${seat + 1} 看了牌。`;

  const settled = settleIfNeeded(next);
  return { ok: true, state: settled };
}

export function zjhFold(state, seat) {
  if (state.phase !== "playing") return { ok: false, error: "当前不在对局中", state };
  if (state.turnSeat !== seat) return { ok: false, error: "还没轮到你", state };
  if (!state.players[seat]?.active || state.players[seat].folded) return { ok: false, error: "你已弃牌", state };

  const next = structuredClone(state);
  next.players[seat].folded = true;
  next.players[seat].active = false;
  next.actionLog.push({ seat, action: "fold" });
  next.pendingSeats = next.pendingSeats.filter((s) => s !== seat);
  next.turnSeat = nextActiveSeat(next, seat);
  next.message = `座位 ${seat + 1} 弃牌。`;

  const settled = settleIfNeeded(next);
  return { ok: true, state: settled };
}

export function zjhCall(state, seat) {
  if (state.phase !== "playing") return { ok: false, error: "当前不在对局中", state };
  if (state.turnSeat !== seat) return { ok: false, error: "还没轮到你", state };
  if (!state.players[seat]?.active || state.players[seat].folded) return { ok: false, error: "你已弃牌", state };

  const next = structuredClone(state);
  const amount = amountToCall(next, seat);
  next.players[seat].totalBet += amount;
  next.pot += amount;
  next.actionLog.push({ seat, action: "call", amount });
  next.pendingSeats = next.pendingSeats.filter((s) => s !== seat);
  next.turnSeat = nextActiveSeat(next, seat);
  next.message = `座位 ${seat + 1} 跟注 ${amount}。`;

  const settled = settleIfNeeded(next);
  return { ok: true, state: settled };
}

export function zjhRaise(state, seat) {
  if (state.phase !== "playing") return { ok: false, error: "当前不在对局中", state };
  if (state.turnSeat !== seat) return { ok: false, error: "还没轮到你", state };
  if (!state.players[seat]?.active || state.players[seat].folded) return { ok: false, error: "你已弃牌", state };

  const next = structuredClone(state);
  next.currentBet += next.baseBet;
  const amount = amountToCall(next, seat);
  next.players[seat].totalBet += amount;
  next.pot += amount;
  next.pendingSeats = rebuildPendingAfterRaise(next, seat);
  next.actionLog.push({ seat, action: "raise", amount, currentBet: next.currentBet });
  next.turnSeat = nextActiveSeat(next, seat);
  next.message = `座位 ${seat + 1} 加注，当前底注 ${next.currentBet}。`;

  const settled = settleIfNeeded(next);
  return { ok: true, state: settled };
}

export function restartZhajinhuaRound(state) {
  const next = structuredClone(state);
  next.phase = "dealing";
  next.message = "重新发牌中…";
  return dealZhajinhua(next);
}

export function zhajinhuaStrength(hand) {
  const result = analyzeZhajinhuaHand(hand);
  if (!result) return 0;
  return result.weight * 100 + result.score.reduce((sum, n, i) => sum + n / (i + 1), 0);
}

export function publicZhajinhuaView(state, viewerId) {
  const view = structuredClone(state);
  view.players = view.players.map((p) => {
    const canSeeCards = p.id === viewerId || p.looked || view.phase === "settled";
    if (canSeeCards) return p;
    return {
      ...p,
      hand: p.hand.map(() => "back"),
    };
  });
  return view;
}

export function handTypeLabel(type) {
  const map = {
    [ZJH_HAND_TYPES.TRIPLE]: "豹子",
    [ZJH_HAND_TYPES.STRAIGHT_FLUSH]: "顺金",
    [ZJH_HAND_TYPES.FLUSH]: "金花",
    [ZJH_HAND_TYPES.STRAIGHT]: "顺子",
    [ZJH_HAND_TYPES.PAIR]: "对子",
    [ZJH_HAND_TYPES.SINGLE]: "单张",
  };
  return map[type] || type;
}

export function cardImageSafe(id) {
  if (id === "back") return "";
  return cardImage(id);
}
