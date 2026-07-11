import { createDoudizhuDeck, shuffle, sortHand, doudizhuValue, parseCardId } from "@/game/cards";
import { analyzeHand, canBeat, HAND_TYPES } from "@/game/doudizhu/patterns";

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPlayer({ id, name, avatar = "", isBot = false, botLevel = "normal" }) {
  return {
    id,
    name,
    avatar,
    isBot,
    botLevel,
    hand: [],
    role: null, // landlord | farmer
  };
}

export function createInitialState(players) {
  if (players.length !== 3) {
    throw new Error("三人斗地主需要恰好 3 名玩家（可含机器人）");
  }
  return {
    version: 1,
    phase: "dealing", // dealing | bidding | playing | settled
    players: players.map((p, index) => ({ ...createPlayer(p), seat: index, hand: [] })),
    bottom: [],
    revealedFlip: null,
    bid: {
      current: 0,
      landlordSeat: null,
      turnSeat: 0,
      passes: 0,
      history: [],
    },
    play: {
      turnSeat: 0,
      leadSeat: null,
      lastPlay: null,
      lastPlaySeat: null,
      passStreak: 0,
      bombs: 0,
      rockets: 0,
      trickLog: [],
    },
    score: {
      contract: 0,
      multiplier: 1,
      result: null,
    },
    message: "发牌中…",
  };
}

export function deal(state) {
  const deck = shuffle(createDoudizhuDeck());
  const flipIndex = Math.floor(Math.random() * 51); // among first 51 dealt to players
  const next = structuredClone(state);
  next.players.forEach((p) => {
    p.hand = [];
    p.role = null;
  });

  let cursor = 0;
  for (let i = 0; i < 51; i += 1) {
    const seat = i % 3;
    const card = deck[cursor];
    cursor += 1;
    next.players[seat].hand.push(card);
    if (i === flipIndex) next.revealedFlip = { seat, card };
  }
  next.bottom = deck.slice(cursor);
  next.players.forEach((p) => {
    p.hand = sortHand(p.hand);
  });

  next.phase = "bidding";
  next.bid = {
    current: 0,
    landlordSeat: null,
    turnSeat: next.revealedFlip?.seat ?? 0,
    passes: 0,
    history: [],
  };
  next.message = `叫分阶段：座位 ${next.bid.turnSeat + 1} 先叫`;
  return next;
}

/** bidValue: 0 = pass, 1/2/3 = bid */
export function placeBid(state, seat, bidValue) {
  if (state.phase !== "bidding") return { ok: false, error: "当前不是叫分阶段", state };
  if (state.bid.turnSeat !== seat) return { ok: false, error: "还没轮到你叫分", state };
  if (![0, 1, 2, 3].includes(bidValue)) return { ok: false, error: "叫分无效", state };
  if (bidValue > 0 && bidValue <= state.bid.current) {
    return { ok: false, error: "必须叫比当前更高的分", state };
  }

  const next = structuredClone(state);
  next.bid.history.push({ seat, bid: bidValue });

  if (bidValue === 0) {
    next.bid.passes += 1;
  } else {
    next.bid.current = bidValue;
    next.bid.landlordSeat = seat;
    next.bid.passes = 0;
  }

  // Bid 3 ends immediately
  if (bidValue === 3) {
    return { ok: true, state: finishBidding(next) };
  }

  // After a bid exists, two consecutive passes end bidding
  if (next.bid.landlordSeat != null && next.bid.passes >= 2) {
    return { ok: true, state: finishBidding(next) };
  }

  // All three passed with no bid -> redeal
  if (next.bid.landlordSeat == null && next.bid.history.length >= 3 && next.bid.passes >= 3) {
    next.message = "三人都不叫，重新发牌";
    return { ok: true, state: deal(next), redeal: true };
  }

  next.bid.turnSeat = (seat + 1) % 3;
  next.message =
    bidValue === 0
      ? `座位 ${seat + 1} 不叫`
      : `座位 ${seat + 1} 叫 ${bidValue} 分`;
  return { ok: true, state: next };
}

function finishBidding(state) {
  const next = structuredClone(state);
  const landlord = next.bid.landlordSeat;
  if (landlord == null) {
    next.message = "叫分失败，重新发牌";
    return deal(next);
  }
  next.players[landlord].hand = sortHand([...next.players[landlord].hand, ...next.bottom]);
  next.players.forEach((p, i) => {
    p.role = i === landlord ? "landlord" : "farmer";
  });
  next.score.contract = next.bid.current;
  next.score.multiplier = 1;
  next.phase = "playing";
  next.play = {
    turnSeat: landlord,
    leadSeat: landlord,
    lastPlay: null,
    lastPlaySeat: null,
    passStreak: 0,
    bombs: 0,
    rockets: 0,
    trickLog: [],
    bottomShown: [...next.bottom],
  };
  next.message = `座位 ${landlord + 1} 成为地主（${next.bid.current} 分），底牌已公开`;
  return next;
}

export function playCards(state, seat, cards) {
  if (state.phase !== "playing") return { ok: false, error: "当前不是出牌阶段", state };
  if (state.play.turnSeat !== seat) return { ok: false, error: "还没轮到你出牌", state };

  const player = state.players[seat];
  if (!cards.every((c) => player.hand.includes(c))) {
    return { ok: false, error: "手牌中没有这些牌", state };
  }
  // unique check
  if (new Set(cards).size !== cards.length) {
    return { ok: false, error: "出牌重复", state };
  }

  const analysis = analyzeHand(cards);
  if (!analysis) return { ok: false, error: "不合法的牌型", state };
  if (!canBeat(state.play.lastPlay, analysis)) {
    return { ok: false, error: "压不过上家", state };
  }

  const next = structuredClone(state);
  const hand = [...next.players[seat].hand];
  for (const c of cards) {
    const idx = hand.indexOf(c);
    hand.splice(idx, 1);
  }
  next.players[seat].hand = sortHand(hand);
  next.play.lastPlay = analysis;
  next.play.lastPlaySeat = seat;
  next.play.leadSeat = seat;
  next.play.passStreak = 0;
  next.play.trickLog.push({ seat, cards, analysis, pass: false });

  if (analysis.type === HAND_TYPES.BOMB) {
    next.play.bombs += 1;
    next.score.multiplier *= 2;
  }
  if (analysis.type === HAND_TYPES.ROCKET) {
    next.play.rockets += 1;
    next.score.multiplier *= 2;
  }

  if (next.players[seat].hand.length === 0) {
    return { ok: true, state: settle(next, seat) };
  }

  next.play.turnSeat = (seat + 1) % 3;
  next.message = `座位 ${seat + 1} 出了牌`;
  return { ok: true, state: next };
}

export function passPlay(state, seat) {
  if (state.phase !== "playing") return { ok: false, error: "当前不是出牌阶段", state };
  if (state.play.turnSeat !== seat) return { ok: false, error: "还没轮到你", state };
  if (!state.play.lastPlay) return { ok: false, error: "首家必须出牌，不能过", state };

  const next = structuredClone(state);
  next.play.passStreak += 1;
  next.play.trickLog.push({ seat, cards: [], analysis: null, pass: true });
  next.message = `座位 ${seat + 1} 不出`;

  if (next.play.passStreak >= 2) {
    // new trick, last player who played leads
    next.play.lastPlay = null;
    next.play.passStreak = 0;
    next.play.turnSeat = next.play.lastPlaySeat;
    next.play.leadSeat = next.play.lastPlaySeat;
    next.message = `新一轮，座位 ${next.play.turnSeat + 1} 领出`;
    return { ok: true, state: next };
  }

  next.play.turnSeat = (seat + 1) % 3;
  return { ok: true, state: next };
}

function settle(state, winnerSeat) {
  const next = structuredClone(state);
  next.phase = "settled";
  const landlordSeat = next.players.findIndex((p) => p.role === "landlord");
  const landlordWins = winnerSeat === landlordSeat;
  const base = next.score.contract * next.score.multiplier;
  next.score.result = {
    winnerSeat,
    landlordWins,
    landlordSeat,
    perFarmer: base,
    landlordDelta: landlordWins ? base * 2 : -base * 2,
    farmerDelta: landlordWins ? -base : base,
  };
  next.message = landlordWins
    ? `地主胜利！每位农民支付 ${base} 分（含炸弹翻倍）`
    : `农民胜利！地主向每位农民支付 ${base} 分`;
  return next;
}

export function publicView(state, viewerId) {
  const view = structuredClone(state);
  view.players = view.players.map((p) => {
    if (p.id === viewerId || state.phase === "settled") return p;
    return {
      ...p,
      handCount: p.hand.length,
      hand: p.hand.map(() => "back"),
    };
  });
  if (state.phase === "bidding" || state.phase === "dealing") {
    view.bottom = view.bottom.map(() => "back");
  }
  return view;
}

export function handStrengthHint(hand) {
  let score = 0;
  const byRank = new Map();
  for (const c of hand) {
    const { rank } = parseCardId(c);
    byRank.set(rank, (byRank.get(rank) || 0) + 1);
    score += doudizhuValue(c);
  }
  for (const count of byRank.values()) {
    if (count === 4) score += 40;
    if (count === 3) score += 12;
    if (count === 2) score += 4;
  }
  if (hand.includes("joker_black")) score += 18;
  if (hand.includes("joker_red")) score += 22;
  return score;
}
