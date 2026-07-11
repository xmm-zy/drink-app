<template>
  <section class="ddz-table" aria-label="斗地主牌桌">
    <header class="ddz-top">
      <div>
        <strong>{{ phaseLabel }}</strong>
        <span>{{ state.message }}</span>
      </div>
      <div class="ddz-meta">
        <span v-if="state.score.contract">定约 {{ state.score.contract }} 分</span>
        <span v-if="state.score.multiplier > 1">×{{ state.score.multiplier }}</span>
      </div>
    </header>

    <div v-if="state.play?.bottomShown?.length" class="ddz-bottom">
      <em>地主底牌</em>
      <img
        v-for="card in state.play.bottomShown"
        :key="card"
        :src="cardImage(card)"
        :alt="card"
      />
    </div>

    <div class="ddz-seats">
      <article
        v-for="(player, seat) in state.players"
        :key="player.id"
        class="ddz-seat"
        :class="{
          active: isTurn(seat),
          landlord: player.role === 'landlord',
          me: player.id === myId,
        }"
      >
        <header>
          <span class="ddz-avatar">{{ (player.name || "?").slice(0, 1) }}</span>
          <div>
            <strong>{{ player.name }}</strong>
            <em>
              {{ player.isBot ? "机器人" : "玩家" }}
              <template v-if="player.role"> · {{ player.role === "landlord" ? "地主" : "农民" }}</template>
            </em>
          </div>
          <span class="ddz-count">{{ visibleHand(player).length }} 张</span>
        </header>

        <div v-if="lastPlayFor(seat)" class="ddz-last">
          <template v-if="lastPlayFor(seat).pass">不出</template>
          <template v-else>
            <img
              v-for="card in lastPlayFor(seat).cards"
              :key="card + seat"
              :src="cardImage(card)"
              :alt="card"
            />
          </template>
        </div>
      </article>
    </div>

    <div v-if="myPlayer" class="ddz-hand">
      <button
        v-for="card in myPlayer.hand"
        :key="card"
        type="button"
        class="ddz-card"
        :class="{ selected: selected.includes(card) }"
        :disabled="!canControl"
        @click="toggleCard(card)"
      >
        <img :src="cardImage(card)" :alt="card" />
      </button>
    </div>

    <div class="ddz-actions">
      <template v-if="state.phase === 'bidding' && canControl && isMyTurn">
        <button type="button" @click="emitBid(0)">不叫</button>
        <button type="button" :disabled="state.bid.current >= 1" @click="emitBid(1)">1 分</button>
        <button type="button" :disabled="state.bid.current >= 2" @click="emitBid(2)">2 分</button>
        <button type="button" :disabled="state.bid.current >= 3" @click="emitBid(3)">3 分</button>
      </template>

      <template v-else-if="state.phase === 'playing' && canControl && isMyTurn">
        <button type="button" :disabled="!state.play.lastPlay" @click="$emit('pass')">不出</button>
        <button type="button" :disabled="!selected.length" @click="emitPlay">出牌</button>
        <button type="button" @click="selected = []">清空选择</button>
      </template>

      <template v-else-if="state.phase === 'settled'">
        <p class="ddz-result">{{ state.message }}</p>
        <button v-if="isHost" type="button" @click="$emit('again')">再来一局</button>
      </template>

      <p v-else-if="!isMyTurn" class="ddz-wait">等待其他玩家操作…</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { cardImage } from "@/game/cards";

const props = defineProps({
  state: { type: Object, required: true },
  myId: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  canControl: { type: Boolean, default: true },
});

const emit = defineEmits(["bid", "play", "pass", "again"]);

const selected = ref([]);

const mySeat = computed(() => props.state.players.findIndex((p) => p.id === props.myId));
const myPlayer = computed(() => (mySeat.value >= 0 ? props.state.players[mySeat.value] : null));
const isMyTurn = computed(() => {
  if (props.state.phase === "bidding") return props.state.bid.turnSeat === mySeat.value;
  if (props.state.phase === "playing") return props.state.play.turnSeat === mySeat.value;
  return false;
});

const phaseLabel = computed(() => {
  const map = {
    dealing: "发牌",
    bidding: "叫分",
    playing: "出牌",
    settled: "结算",
  };
  return map[props.state.phase] || props.state.phase;
});

watch(
  () => props.state.phase,
  () => {
    selected.value = [];
  },
);

function isTurn(seat) {
  if (props.state.phase === "bidding") return props.state.bid.turnSeat === seat;
  if (props.state.phase === "playing") return props.state.play.turnSeat === seat;
  return false;
}

function visibleHand(player) {
  if (player.id === props.myId || props.state.phase === "settled") return player.hand;
  return Array.from({ length: player.hand?.length || player.handCount || 0 });
}

function lastPlayFor(seat) {
  const log = props.state.play?.trickLog || [];
  for (let i = log.length - 1; i >= 0; i -= 1) {
    if (log[i].seat === seat) return log[i];
  }
  return null;
}

function toggleCard(card) {
  if (!props.canControl || !isMyTurn.value || props.state.phase !== "playing") return;
  if (selected.value.includes(card)) {
    selected.value = selected.value.filter((c) => c !== card);
  } else {
    selected.value = [...selected.value, card];
  }
}

function emitBid(value) {
  emit("bid", value);
}

function emitPlay() {
  emit("play", [...selected.value]);
  selected.value = [];
}
</script>
