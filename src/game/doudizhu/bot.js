import { parseCardId, doudizhuValue } from "@/game/cards";
import { findLegalMoves, HAND_TYPES } from "@/game/doudizhu/patterns";
import { handStrengthHint } from "@/game/doudizhu/engine";

/** Choose bid 0-3 for current seat. */
export function botChooseBid(state, seat) {
  const player = state.players[seat];
  const strength = handStrengthHint(player.hand);
  const level = player.botLevel || "normal";
  const current = state.bid.current;

  let want = 0;
  if (strength > 220) want = 3;
  else if (strength > 180) want = 2;
  else if (strength > 145) want = 1;

  if (level === "easy") {
    if (want > 0 && Math.random() < 0.35) want = Math.max(0, want - 1);
  }

  if (want <= current) return 0;
  return want;
}

function teammateSeat(state, seat) {
  const me = state.players[seat];
  if (me.role !== "farmer") return null;
  return state.players.findIndex((p, i) => i !== seat && p.role === "farmer");
}

function moveScore(move, state, seat) {
  const { analysis, cards } = move;
  let score = 0;
  const remaining = state.players[seat].hand.length - cards.length;

  // Prefer finishing
  if (remaining === 0) return 10000;

  // Bomb/rocket conservation unless needed
  if (analysis.type === HAND_TYPES.ROCKET) score -= 30;
  if (analysis.type === HAND_TYPES.BOMB) score -= 20;

  // Prefer smaller main values when leading
  score += 40 - analysis.mainValue;

  // Prefer dumping more cards when safe
  score += cards.length * 2;

  // Avoid breaking pairs lightly - rough
  score -= cards.length === 1 && doudizhuValue(cards[0]) >= 12 ? 5 : 0;

  const mate = teammateSeat(state, seat);
  if (mate != null && state.play.lastPlaySeat === mate) {
    // Don't beat teammate unless we must pressure landlord soon
    score -= 50;
  }

  return score;
}

/** Return { action: 'play'|'pass', cards?: string[] } */
export function botChoosePlay(state, seat) {
  const player = state.players[seat];
  const prev = state.play.lastPlay;
  const moves = findLegalMoves(player.hand, prev, 60);
  const level = player.botLevel || "normal";

  if (!prev) {
    // Must lead
    if (!moves.length) {
      // fallback single smallest
      const smallest = [...player.hand].sort((a, b) => doudizhuValue(a) - doudizhuValue(b))[0];
      return { action: "play", cards: [smallest] };
    }
    moves.sort((a, b) => moveScore(b, state, seat) - moveScore(a, state, seat));
    return { action: "play", cards: moves[0].cards };
  }

  if (!moves.length) return { action: "pass" };

  const mate = teammateSeat(state, seat);
  const beatingTeammate = mate != null && state.play.lastPlaySeat === mate;

  if (beatingTeammate && level !== "easy") {
    // Usually pass to help teammate
    if (Math.random() < 0.85) return { action: "pass" };
  }

  moves.sort((a, b) => moveScore(b, state, seat) - moveScore(a, state, seat));

  // Easy bots sometimes pass even with moves
  if (level === "easy" && Math.random() < 0.25) return { action: "pass" };

  // Prefer not using bomb unless hand is small or no other move
  const nonBomb = moves.filter(
    (m) => m.analysis.type !== HAND_TYPES.BOMB && m.analysis.type !== HAND_TYPES.ROCKET,
  );
  const pool = nonBomb.length ? nonBomb : moves;
  return { action: "play", cards: pool[0].cards };
}

export function makeBotPlayer(index, level = "normal") {
  const names = ["机器人·杏", "机器人·梅", "机器人·竹", "机器人·菊"];
  return {
    id: `bot-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name: names[index % names.length],
    avatar: "",
    isBot: true,
    botLevel: level,
  };
}

export function countBombsInHand(hand) {
  const map = new Map();
  for (const c of hand) {
    const { rank } = parseCardId(c);
    map.set(rank, (map.get(rank) || 0) + 1);
  }
  let bombs = 0;
  for (const count of map.values()) if (count === 4) bombs += 1;
  if (hand.includes("joker_black") && hand.includes("joker_red")) bombs += 1;
  return bombs;
}
