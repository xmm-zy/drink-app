import { zjhCall, zjhFold, zjhLookCards, zjhRaise, zhajinhuaStrength } from "@/game/zhajinhua/engine";

export function makeZhajinhuaBot(index, level = "normal") {
  return {
    id: `zjh-bot-${index + 1}`,
    name: `金花机器人 ${index + 1}`,
    avatar: "",
    isBot: true,
    botLevel: level,
  };
}

function decideAction(state, seat) {
  const player = state.players[seat];
  const strength = zhajinhuaStrength(player.hand);
  const level = player.botLevel || "normal";
  const aggressiveBoost = level === "hard" ? 18 : 0;

  if (!player.looked && Math.random() < 0.45) return "look";
  if (strength + aggressiveBoost > 520 && Math.random() < 0.35) return "raise";
  if (strength + aggressiveBoost < 260 && player.looked && Math.random() < 0.45) return "fold";
  if (strength + aggressiveBoost < 200 && Math.random() < 0.25) return "fold";
  if (strength + aggressiveBoost > 400 && Math.random() < 0.25) return "raise";
  return "call";
}

export function runZhajinhuaBotTurn(state, seat) {
  const action = decideAction(state, seat);
  if (action === "look") return zjhLookCards(state, seat);
  if (action === "fold") return zjhFold(state, seat);
  if (action === "raise") return zjhRaise(state, seat);
  return zjhCall(state, seat);
}
