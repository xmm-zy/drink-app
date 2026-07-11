<template>
  <section class="zjh-table" aria-label="炸金花牌桌">
    <header class="zjh-top">
      <div>
        <strong>炸金花</strong>
        <span>{{ state.message }}</span>
      </div>
      <div class="zjh-meta">
        <span>底注 {{ state.baseBet }}</span>
        <span>当前注 {{ state.currentBet }}</span>
        <span>彩池 {{ state.pot }}</span>
      </div>
    </header>

    <div class="zjh-seats">
      <article
        v-for="(player, seat) in state.players"
        :key="player.id"
        class="zjh-seat"
        :class="{ active: isTurn(seat), folded: player.folded, me: player.id === myId }"
      >
        <header>
          <span class="zjh-avatar">{{ (player.name || "?").slice(0, 1) }}</span>
          <div>
            <strong>{{ player.name }}</strong>
            <em>
              {{ player.isBot ? "机器人" : "玩家" }}
              <template v-if="player.looked"> · 已看牌</template>
              <template v-if="player.folded"> · 已弃牌</template>
            </em>
          </div>
          <span class="zjh-bet">下注 {{ player.totalBet }}</span>
        </header>

        <div class="zjh-cards">
          <template v-for="(card, idx) in visibleCards(player)" :key="`${player.id}-${idx}-${card}`">
            <img v-if="card !== 'back'" :src="cardImage(card)" :alt="card" />
            <span v-else class="zjh-card-back">牌背</span>
          </template>
        </div>
      </article>
    </div>

    <div class="zjh-actions">
      <template v-if="state.phase === 'playing' && canControl && isMyTurn">
        <button type="button" :disabled="myPlayer?.looked" @click="$emit('look')">看牌</button>
        <button type="button" @click="$emit('call')">跟注</button>
        <button type="button" @click="$emit('raise')">加注</button>
        <button type="button" @click="$emit('fold')">弃牌</button>
      </template>
      <template v-else-if="state.phase === 'settled'">
        <p class="zjh-result">{{ resultLabel }}</p>
        <button v-if="isHost" type="button" @click="$emit('again')">再来一局</button>
      </template>
      <p v-else class="zjh-wait">等待其他玩家操作…</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { cardImage } from "@/game/cards";
import { analyzeZhajinhuaHand, handTypeLabel } from "@/game/zhajinhua/engine";

const props = defineProps({
  state: { type: Object, required: true },
  myId: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  canControl: { type: Boolean, default: true },
});

defineEmits(["look", "call", "raise", "fold", "again"]);

const mySeat = computed(() => props.state.players.findIndex((p) => p.id === props.myId));
const myPlayer = computed(() => (mySeat.value >= 0 ? props.state.players[mySeat.value] : null));
const isMyTurn = computed(() => props.state.phase === "playing" && props.state.turnSeat === mySeat.value);
const resultLabel = computed(() => {
  if (!props.state.result) return props.state.message;
  const winner = props.state.players[props.state.result.winnerSeat];
  const winnerCards = winner?.hand || [];
  const hand = analyzeZhajinhuaHand(winnerCards);
  return `${winner?.name || `座位 ${props.state.result.winnerSeat + 1}`} 获胜（${handTypeLabel(hand?.type)}）`;
});

function isTurn(seat) {
  return props.state.phase === "playing" && props.state.turnSeat === seat;
}

function visibleCards(player) {
  if (props.state.phase === "settled") return player.hand;
  if (player.id === props.myId || player.looked) return player.hand;
  return player.hand.map(() => "back");
}
</script>
