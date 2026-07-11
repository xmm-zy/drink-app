<template>
  <div class="games-page">
    <main class="games-shell">
      <header class="games-header">
        <RouterLink to="/menu">返回功能菜单</RouterLink>
        <RouterLink to="/account">账号中心</RouterLink>
      </header>

      <section class="games-hero">
        <p class="eyebrow">Realtime Card Lounge</p>
        <h1>牌局联机大厅<span>斗地主 · 扎金花</span></h1>
        <p>
          支持实时房间、房间号加入、人机对战。斗地主已接入完整三人叫分/出牌/计分逻辑；扎金花已接入首版规则与比牌结算。
        </p>
      </section>

      <section class="games-catalog" aria-label="游戏类型介绍">
        <article v-for="item in gameCatalog" :key="item.type">
          <h3>{{ item.name }}</h3>
          <p>{{ item.intro }}</p>
          <ul>
            <li v-for="point in item.points" :key="point">{{ point }}</li>
          </ul>
        </article>
      </section>

      <section class="games-lobby" aria-label="联机大厅">
        <aside class="games-create">
          <h3>创建房间</h3>
          <label>
            选择游戏
            <select v-model="createGameType">
              <option v-for="item in gameCatalog" :key="item.type" :value="item.type">{{ item.name }}</option>
            </select>
          </label>
          <label>
            最大人数
            <select v-model.number="createMaxPlayers">
              <option v-for="count in createPlayerOptions" :key="count" :value="count">{{ count }} 人</option>
            </select>
          </label>
          <button type="button" :disabled="isWorking" @click="createRoom">{{ isWorking ? "处理中..." : "创建房间" }}</button>
          <div class="games-join-by-code">
            <label>
              房间号加入
              <input v-model.trim="joinRoomCode" type="text" maxlength="12" placeholder="输入房间号，例如 A1B2C3" />
            </label>
            <button type="button" :disabled="isWorking || !joinRoomCode" @click="joinRoomByCode">通过房间号加入</button>
          </div>
          <p class="games-notice" :data-type="noticeType">{{ notice }}</p>
        </aside>

        <section class="games-room-list">
          <div class="games-room-list-head">
            <h3>可加入房间</h3>
            <button type="button" :disabled="isWorking" @click="loadRooms">刷新</button>
          </div>
          <article v-for="room in visibleRooms" :key="room.id" class="games-room-card">
            <header>
              <strong>{{ gameName(room.game_type) }}</strong>
              <div class="games-room-card-actions">
                <span>#{{ room.room_code }}</span>
                <button
                  v-if="room.host_user_id === currentUserId"
                  type="button"
                  class="games-room-delete"
                  :disabled="isWorking"
                  @click="deleteRoom(room.id)"
                >
                  删除
                </button>
              </div>
            </header>
            <p>房主：{{ room.host_name || "Member" }}</p>
            <p>状态：{{ room.status === "playing" ? "进行中" : room.status === "closed" ? "已结束" : "等待中" }}</p>
            <p>人数：{{ room.member_count }}/{{ room.max_players }}</p>
            <button
              type="button"
              :disabled="isWorking || room.member_count >= room.max_players || room.status !== 'waiting'"
              @click="joinRoom(room.id)"
            >
              {{ room.member_count >= room.max_players ? "已满员" : "加入房间" }}
            </button>
          </article>
          <button
            v-if="rooms.length > 3"
            type="button"
            class="games-room-toggle"
            :disabled="isWorking"
            @click="showAllRooms = !showAllRooms"
          >
            {{ showAllRooms ? "收起房间列表" : `展开更多（+${rooms.length - 3}）` }}
          </button>
          <p v-if="!rooms.length" class="games-empty">暂无可加入房间，你可以创建第一局。</p>
        </section>
      </section>

      <section v-if="currentRoom" class="games-room-panel" aria-label="当前房间">
        <header>
          <div>
            <h3>当前房间：{{ gameName(currentRoom.game_type) }} #{{ currentRoom.room_code }}</h3>
            <p>房主：{{ currentRoom.host_name || "Member" }} · 状态：{{ currentRoom.status === "playing" ? "进行中" : "等待中" }}</p>
          </div>
          <div class="games-room-actions">
            <button
              v-if="isCurrentUserHost && currentRoom.status === 'waiting' && canAddLobbyBot"
              type="button"
              :disabled="isWorking || totalSeatCount >= roomSeatTarget"
              @click="addLobbyBot"
            >
              添加机器人
            </button>
            <button
              v-if="isCurrentUserHost && lobbyBots.length && currentRoom.status === 'waiting'"
              type="button"
              :disabled="isWorking"
              @click="removeLobbyBot"
            >
              移除机器人
            </button>
            <button type="button" :disabled="isWorking" @click="toggleReady">
              {{ isCurrentUserReady ? "取消准备" : "准备" }}
            </button>
            <button
              v-if="isCurrentUserHost"
              type="button"
              :disabled="isWorking || !canHostStart"
              @click="startRoomGame"
            >
              开始对局
            </button>
            <button type="button" :disabled="isWorking" @click="leaveRoom">离开房间</button>
          </div>
        </header>

        <div class="games-room-layout">
          <section class="games-members">
            <h4>在线玩家</h4>
            <ul>
              <li v-for="member in roomMembers" :key="member.id">
                <span class="games-user-chip">
                  <img v-if="member.user_avatar" :src="member.user_avatar" alt="玩家头像" />
                  <span v-else>{{ identityInitial(member.user_name) }}</span>
                  <em>{{ member.user_name || "Member" }}</em>
                </span>
                <strong :data-ready="member.is_ready">{{ member.is_ready ? "已准备" : "未准备" }}</strong>
              </li>
              <li v-for="bot in lobbyBots" :key="bot.id">
                <span class="games-user-chip">
                  <span>机</span>
                  <em>{{ bot.name }}</em>
                </span>
                <strong data-ready="true">机器人</strong>
              </li>
            </ul>
            <p v-if="currentRoom.game_type === 'doudizhu'" class="games-room-tip">
              斗地主需凑满 3 人开局（可加人机）。当前座位：{{ totalSeatCount }}/{{ roomSeatTarget }}。
            </p>
            <p v-else class="games-room-tip">
              炸金花当前支持 2-4 人（可加人机）；跟注 / 加注 / 看牌 / 弃牌，最终自动比牌。当前座位：{{ totalSeatCount }}/{{ roomSeatTarget }}。
            </p>
          </section>

          <section class="games-chat">
            <h4>房间聊天</h4>
            <div class="games-chat-list">
              <article v-for="msg in roomMessages" :key="msg.id">
                <header>
                  <span>{{ msg.user_name || "Member" }}</span>
                  <time>{{ formatDate(msg.created_at) }}</time>
                </header>
                <p>{{ msg.content }}</p>
              </article>
              <p v-if="!roomMessages.length" class="games-empty">发送第一条消息，开始联机沟通。</p>
            </div>
            <form class="games-chat-form" @submit.prevent="sendMessage">
              <input v-model.trim="chatInput" type="text" maxlength="300" placeholder="输入消息（最多 300 字）" required />
              <button type="submit" :disabled="isWorking">发送</button>
            </form>
          </section>
        </div>
      </section>

      <DouDizhuTable
        v-if="currentRoom?.game_type === 'doudizhu' && gameState && currentRoom.status === 'playing'"
        :state="gameState"
        :my-id="currentUserId"
        :is-host="isCurrentUserHost"
        @bid="onDdzBid"
        @play="onDdzPlay"
        @pass="onDdzPass"
        @again="restartDdzRound"
      />

      <ZhaJinHuaTable
        v-if="currentRoom?.game_type === 'zhajinhua' && gameState && currentRoom.status === 'playing'"
        :state="gameState"
        :my-id="currentUserId"
        :is-host="isCurrentUserHost"
        @look="onZjhLook"
        @call="onZjhCall"
        @raise="onZjhRaise"
        @fold="onZjhFold"
        @again="restartZjhRound"
      />
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from "vue";
import { RouterLink } from "vue-router";
import DouDizhuTable from "@/components/DouDizhuTable.vue";
import ZhaJinHuaTable from "@/components/ZhaJinHuaTable.vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { createInitialState, deal, placeBid, playCards, passPlay } from "@/game/doudizhu/engine";
import { botChooseBid, botChoosePlay, makeBotPlayer } from "@/game/doudizhu/bot";
import { createInitialZhajinhuaState, dealZhajinhua, restartZhajinhuaRound, zjhLookCards, zjhCall, zjhRaise, zjhFold } from "@/game/zhajinhua/engine";
import { makeZhajinhuaBot, runZhajinhuaBotTurn } from "@/game/zhajinhua/bot";

const auth = useAuthStore();

const gameCatalog = [
  {
    type: "doudizhu",
    name: "斗地主",
    intro: "三人争先玩法，可加人机凑桌；支持叫分、出牌校验与炸弹翻倍计分。",
    points: ["最多 4 人房间，开局需 3 人", "可添加机器人", "实时房间同步"],
  },
  {
    type: "zhajinhua",
    name: "扎金花",
    intro: "三张牌比牌玩法，支持看牌、跟注、加注、弃牌与自动比牌结算。",
    points: ["2-4 人房间", "可添加机器人", "实时准备、聊天与对局同步"],
  },
];

const createGameType = ref("doudizhu");
const createMaxPlayers = ref(3);
const rooms = ref([]);
const showAllRooms = ref(false);
const currentRoom = ref(null);
const roomMembers = ref([]);
const roomMessages = ref([]);
const chatInput = ref("");
const joinRoomCode = ref("");
const lobbyBots = ref([]);
const gameState = ref(null);
const isWorking = ref(false);
const notice = ref("登录后可创建或加入联机房间。");
const noticeType = ref("info");

let lobbyChannel = null;
let roomChannel = null;
let botTimer = null;
let botHeartbeat = null;
let botActing = false;
let applyingRemote = false;

const currentUserId = computed(() => auth.user?.id || "");
const currentUserName = computed(() => auth.profile.name || auth.user?.email || "Member");
const currentUserAvatar = computed(() => auth.profile.avatarUrl || "");
const isCurrentUserHost = computed(() => currentRoom.value?.host_user_id && currentRoom.value.host_user_id === currentUserId.value);
const currentMember = computed(() => roomMembers.value.find((item) => item.user_id === currentUserId.value) || null);
const isCurrentUserReady = computed(() => Boolean(currentMember.value?.is_ready));
const totalSeatCount = computed(() => roomMembers.value.length + lobbyBots.value.length);
const roomSeatTarget = computed(() => (currentRoom.value?.game_type === "zhajinhua" ? 4 : 3));
const canAddLobbyBot = computed(() => ["doudizhu", "zhajinhua"].includes(currentRoom.value?.game_type || ""));
const createPlayerOptions = computed(() => {
  const cap = maxPlayersForGame(createGameType.value);
  const list = [];
  for (let count = 2; count <= cap; count += 1) list.push(count);
  return list;
});
const visibleRooms = computed(() => (showAllRooms.value ? rooms.value : rooms.value.slice(0, 3)));
const canHostStart = computed(() => {
  if (!isCurrentUserHost.value || !currentRoom.value) return false;
  if (currentRoom.value.game_type === "doudizhu") {
    if (totalSeatCount.value < 3) return false;
    return roomMembers.value.every((item) => item.is_ready);
  }
  if (currentRoom.value.game_type === "zhajinhua") {
    if (totalSeatCount.value < 2) return false;
    return roomMembers.value.every((item) => item.is_ready);
  }
  if (roomMembers.value.length < minStartPlayersForGame(currentRoom.value.game_type)) return false;
  return roomMembers.value.every((item) => item.is_ready);
});

function setNotice(message, type = "info") {
  notice.value = message;
  noticeType.value = type;
}

function gameName(type) {
  return gameCatalog.find((item) => item.type === type)?.name || type;
}

function maxPlayersForGame(gameType) {
  return gameType === "zhajinhua" ? 4 : 4;
}

function minStartPlayersForGame(gameType) {
  if (gameType === "doudizhu") return 3;
  return 2;
}

function identityInitial(name) {
  return String(name || "G")
    .trim()
    .slice(0, 1)
    .toUpperCase();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function ensureAuth(actionText) {
  await auth.refreshSession();
  if (auth.user) return true;
  setNotice(`请先登录后再${actionText}。`, "error");
  return false;
}

async function loadRooms() {
  if (!supabase) {
    setNotice("Supabase 未配置，联机功能不可用。", "error");
    return;
  }
  const { data, error } = await supabase
    .from("games_rooms")
    .select("id,room_code,game_type,status,max_players,host_user_id,host_name,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    setNotice(`房间加载失败：${error.message}`, "error");
    return;
  }

  const roomIds = data.map((item) => item.id);
  const { data: members } = roomIds.length
    ? await supabase.from("games_room_members").select("room_id").in("room_id", roomIds)
    : { data: [] };

  rooms.value = data
    .map((room) => ({
      ...room,
      member_count: (members || []).filter((member) => member.room_id === room.id).length,
    }))
    .filter((room) => room.status !== "closed");
  if (rooms.value.length <= 3) showAllRooms.value = false;
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function createRoom() {
  if (!(await ensureAuth("创建房间"))) return;
  isWorking.value = true;
  const cap = maxPlayersForGame(createGameType.value);
  const normalizedMaxPlayers = Math.min(Math.max(Number(createMaxPlayers.value || 2), 2), cap);

  const roomCode = randomRoomCode();
  const { data: roomRow, error: roomError } = await supabase
    .from("games_rooms")
    .insert({
      room_code: roomCode,
      game_type: createGameType.value,
      host_user_id: currentUserId.value,
      host_name: currentUserName.value,
      status: "waiting",
      max_players: normalizedMaxPlayers,
    })
    .select("id,room_code,game_type,status,max_players,host_user_id,host_name,created_at")
    .single();

  if (roomError) {
    isWorking.value = false;
    setNotice(`创建失败：${roomError.message}`, "error");
    return;
  }

  const { error: joinError } = await supabase.from("games_room_members").insert({
    room_id: roomRow.id,
    user_id: currentUserId.value,
    user_name: currentUserName.value,
    user_avatar: currentUserAvatar.value,
    is_ready: true,
  });

  if (joinError) {
    isWorking.value = false;
    setNotice(`加入新房间失败：${joinError.message}`, "error");
    return;
  }

  await loadRooms();
  await enterRoom(roomRow.id);
  joinRoomCode.value = roomCode;
  isWorking.value = false;
  setNotice(`房间 #${roomCode} 创建成功。`, "success");
}

async function joinRoom(roomId) {
  if (!(await ensureAuth("加入房间"))) return;
  isWorking.value = true;

  const target = rooms.value.find((item) => item.id === roomId);
  if (!target) {
    isWorking.value = false;
    setNotice("房间不存在或已关闭。", "error");
    return;
  }
  if (target.member_count >= target.max_players) {
    isWorking.value = false;
    setNotice("该房间已满员。", "error");
    return;
  }

  const { error } = await supabase.from("games_room_members").upsert(
    {
      room_id: roomId,
      user_id: currentUserId.value,
      user_name: currentUserName.value,
      user_avatar: currentUserAvatar.value,
      is_ready: false,
    },
    { onConflict: "room_id,user_id" },
  );

  if (error) {
    isWorking.value = false;
    setNotice(`加入失败：${error.message}`, "error");
    return;
  }

  await enterRoom(roomId);
  await loadRooms();
  isWorking.value = false;
  joinRoomCode.value = "";
  setNotice("已进入房间。", "success");
}

async function joinRoomByCode() {
  if (!(await ensureAuth("通过房间号加入房间"))) return;
  if (!joinRoomCode.value) return;
  isWorking.value = true;
  const code = joinRoomCode.value.trim().toUpperCase();

  const { data: room, error } = await supabase
    .from("games_rooms")
    .select("id,room_code,game_type,status,max_players,host_user_id,host_name,created_at")
    .eq("room_code", code)
    .single();

  if (error || !room) {
    isWorking.value = false;
    setNotice("未找到该房间号，请检查后重试。", "error");
    return;
  }

  await joinRoom(room.id);
}

async function deleteRoom(roomId) {
  if (!(await ensureAuth("删除房间"))) return;
  const target = rooms.value.find((item) => item.id === roomId);
  if (!target) return;
  if (target.host_user_id !== currentUserId.value) {
    setNotice("仅房主可删除房间。", "error");
    return;
  }
  isWorking.value = true;

  const { error } = await supabase.from("games_rooms").delete().eq("id", roomId).eq("host_user_id", currentUserId.value);
  if (error) {
    isWorking.value = false;
    setNotice(`删除房间失败：${error.message}`, "error");
    return;
  }

  if (currentRoom.value?.id === roomId) {
  currentRoom.value = null;
  roomMembers.value = [];
  roomMessages.value = [];
  lobbyBots.value = [];
  gameState.value = null;
  clearBotTimer();
  await teardownRoomChannel();
  }
  await loadRooms();
  isWorking.value = false;
  setNotice("房间已删除。", "success");
}

async function leaveRoom() {
  if (!currentRoom.value || !(await ensureAuth("离开房间"))) return;
  isWorking.value = true;

  const roomId = currentRoom.value.id;
  await supabase.from("games_room_members").delete().eq("room_id", roomId).eq("user_id", currentUserId.value);

  const { data: remaining } = await supabase.from("games_room_members").select("id,user_id").eq("room_id", roomId);
  if (!remaining?.length) {
    await supabase.from("games_rooms").update({ status: "closed" }).eq("id", roomId);
  } else if (isCurrentUserHost.value) {
    const nextHost = remaining[0];
    await supabase.from("games_rooms").update({ host_user_id: nextHost.user_id }).eq("id", roomId);
  }

  currentRoom.value = null;
  roomMembers.value = [];
  roomMessages.value = [];
  lobbyBots.value = [];
  gameState.value = null;
  clearBotTimer();
  await teardownRoomChannel();
  await loadRooms();
  isWorking.value = false;
  setNotice("已离开房间。", "success");
}

async function loadCurrentRoom(roomId) {
  const [{ data: roomRow }, { data: members }, { data: messages }] = await Promise.all([
    supabase
      .from("games_rooms")
      .select("id,room_code,game_type,status,max_players,host_user_id,host_name,created_at,game_state")
      .eq("id", roomId)
      .single(),
    supabase
      .from("games_room_members")
      .select("id,room_id,user_id,user_name,user_avatar,is_ready,joined_at")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("games_room_messages")
      .select("id,room_id,user_id,user_name,content,created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  currentRoom.value = roomRow || null;
  roomMembers.value = members || [];
  roomMessages.value = messages || [];

  applyingRemote = true;
  const gs = roomRow?.game_state || null;
  lobbyBots.value = Array.isArray(gs?.lobbyBots) ? gs.lobbyBots : [];
  if (roomRow?.game_type === "doudizhu") gameState.value = gs?.ddz || null;
  else if (roomRow?.game_type === "zhajinhua") gameState.value = gs?.zjh || null;
  else if (roomRow?.status !== "playing") gameState.value = null;
  applyingRemote = false;
  await nextTick();
  maybeRunBotTurn();
}

async function enterRoom(roomId) {
  await teardownRoomChannel();
  await loadCurrentRoom(roomId);

  roomChannel = supabase
    .channel(`games-room-${roomId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games_room_members", filter: `room_id=eq.${roomId}` },
      async () => {
        await loadCurrentRoom(roomId);
        await loadRooms();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games_room_messages", filter: `room_id=eq.${roomId}` },
      async () => {
        await loadCurrentRoom(roomId);
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games_rooms", filter: `id=eq.${roomId}` },
      async () => {
        await loadCurrentRoom(roomId);
        await loadRooms();
      },
    )
    .subscribe();
}

async function teardownRoomChannel() {
  if (!roomChannel || !supabase) return;
  await supabase.removeChannel(roomChannel);
  roomChannel = null;
}

async function toggleReady() {
  if (!currentRoom.value || !(await ensureAuth("切换准备状态"))) return;
  const next = !isCurrentUserReady.value;
  const { error } = await supabase
    .from("games_room_members")
    .update({ is_ready: next, user_name: currentUserName.value, user_avatar: currentUserAvatar.value })
    .eq("room_id", currentRoom.value.id)
    .eq("user_id", currentUserId.value);

  if (error) {
    setNotice(`准备状态更新失败：${error.message}`, "error");
    return;
  }
  setNotice(next ? "你已准备。等待其他玩家。" : "已取消准备。", "success");
}

async function persistLobbyMeta() {
  if (!currentRoom.value || !isCurrentUserHost.value) return;
  const payload = { lobbyBots: lobbyBots.value };
  if (currentRoom.value.game_type === "doudizhu") payload.ddz = gameState.value;
  if (currentRoom.value.game_type === "zhajinhua") payload.zjh = gameState.value;
  await supabase.from("games_rooms").update({ game_state: payload }).eq("id", currentRoom.value.id);
}

async function persistGameState(nextState) {
  gameState.value = nextState;
  if (!currentRoom.value) return;
  const payload = { lobbyBots: lobbyBots.value };
  if (currentRoom.value.game_type === "doudizhu") payload.ddz = nextState;
  if (currentRoom.value.game_type === "zhajinhua") payload.zjh = nextState;
  const { error } = await supabase.from("games_rooms").update({ game_state: payload }).eq("id", currentRoom.value.id);
  if (error) setNotice(`同步对局失败：${error.message}`, "error");
  await nextTick();
  maybeRunBotTurn();
}

function addLobbyBot() {
  if (!isCurrentUserHost.value || !currentRoom.value || totalSeatCount.value >= roomSeatTarget.value) return;
  const bot =
    currentRoom.value.game_type === "zhajinhua"
      ? makeZhajinhuaBot(lobbyBots.value.length, "normal")
      : makeBotPlayer(lobbyBots.value.length, "normal");
  lobbyBots.value = [...lobbyBots.value, bot];
  persistLobbyMeta();
  setNotice("已添加机器人。", "success");
}

function removeLobbyBot() {
  if (!isCurrentUserHost.value || !lobbyBots.value.length) return;
  lobbyBots.value = lobbyBots.value.slice(0, -1);
  persistLobbyMeta();
  setNotice("已移除一名机器人。", "success");
}

function buildDdzPlayers() {
  const humans = roomMembers.value.map((m) => ({
    id: m.user_id,
    name: m.user_name || "Member",
    avatar: m.user_avatar || "",
    isBot: false,
  }));
  const bots = lobbyBots.value.map((b) => ({ ...b }));
  const mixed = [...humans, ...bots].slice(0, 3);
  while (mixed.length < 3) {
    mixed.push(makeBotPlayer(mixed.length, "normal"));
  }
  return mixed;
}

function buildZjhPlayers() {
  const humans = roomMembers.value.map((m) => ({
    id: m.user_id,
    name: m.user_name || "Member",
    avatar: m.user_avatar || "",
    isBot: false,
  }));
  const bots = lobbyBots.value.map((b) => ({ ...b }));
  const mixed = [...humans, ...bots].slice(0, 4);
  while (mixed.length < 2) {
    mixed.push(makeZhajinhuaBot(mixed.length, "normal"));
  }
  return mixed;
}

async function startRoomGame() {
  if (!currentRoom.value || !(await ensureAuth("开始对局"))) return;
  if (!canHostStart.value) {
    setNotice("人数不足或未全员准备，无法开始。", "error");
    return;
  }

  if (currentRoom.value.game_type === "doudizhu") {
    if (totalSeatCount.value < 3) {
      setNotice("斗地主需要 3 人开局，可添加机器人凑齐。", "error");
      return;
    }
    let state = createInitialState(buildDdzPlayers());
    state = deal(state);
    // auto-redeal if somehow empty
    gameState.value = state;
    const { error } = await supabase
      .from("games_rooms")
      .update({
        status: "playing",
        game_state: { lobbyBots: lobbyBots.value, ddz: state },
      })
      .eq("id", currentRoom.value.id)
      .eq("host_user_id", currentUserId.value);
    if (error) {
      setNotice(`开始失败：${error.message}`, "error");
      return;
    }
    currentRoom.value = { ...currentRoom.value, status: "playing" };
    setNotice("斗地主开局！", "success");
    await nextTick();
    maybeRunBotTurn();
    return;
  }

  if (currentRoom.value.game_type === "zhajinhua") {
    if (totalSeatCount.value < 2) {
      setNotice("扎金花至少需要 2 人开局。", "error");
      return;
    }
    let state = createInitialZhajinhuaState(buildZjhPlayers(), { baseBet: 1 });
    state = dealZhajinhua(state);
    gameState.value = state;
    const { error } = await supabase
      .from("games_rooms")
      .update({
        status: "playing",
        game_state: { lobbyBots: lobbyBots.value, zjh: state },
      })
      .eq("id", currentRoom.value.id)
      .eq("host_user_id", currentUserId.value);
    if (error) {
      setNotice(`开始失败：${error.message}`, "error");
      return;
    }
    currentRoom.value = { ...currentRoom.value, status: "playing" };
    setNotice("炸金花开局！", "success");
    await nextTick();
    maybeRunBotTurn();
    return;
  }
}

function myDdzSeat() {
  if (!gameState.value) return -1;
  return gameState.value.players.findIndex((p) => p.id === currentUserId.value);
}

async function onDdzBid(value) {
  const seat = myDdzSeat();
  if (!gameState.value) return;
  if (seat < 0) {
    setNotice("你不在当前这局斗地主座位中，请重进房间后重试。", "error");
    return;
  }
  const result = placeBid(gameState.value, seat, value);
  if (!result.ok) {
    setNotice(result.error, "error");
    return;
  }
  await persistGameState(result.state);
}

async function onDdzPlay(cards) {
  const seat = myDdzSeat();
  if (seat < 0 || !gameState.value) return;
  const result = playCards(gameState.value, seat, cards);
  if (!result.ok) {
    setNotice(result.error, "error");
    return;
  }
  await persistGameState(result.state);
}

async function onDdzPass() {
  const seat = myDdzSeat();
  if (seat < 0 || !gameState.value) return;
  const result = passPlay(gameState.value, seat);
  if (!result.ok) {
    setNotice(result.error, "error");
    return;
  }
  await persistGameState(result.state);
}

async function restartDdzRound() {
  if (!isCurrentUserHost.value || !currentRoom.value) return;
  let state = createInitialState(buildDdzPlayers());
  state = deal(state);
  await supabase
    .from("games_rooms")
    .update({ status: "playing", game_state: { lobbyBots: lobbyBots.value, ddz: state } })
    .eq("id", currentRoom.value.id);
  gameState.value = state;
  await nextTick();
  maybeRunBotTurn();
}

function myZjhSeat() {
  if (!gameState.value) return -1;
  return gameState.value.players.findIndex((p) => p.id === currentUserId.value);
}

async function onZjhLook() {
  const seat = myZjhSeat();
  if (seat < 0 || !gameState.value) return;
  const result = zjhLookCards(gameState.value, seat);
  if (!result.ok) {
    setNotice(result.error, "error");
    return;
  }
  await persistGameState(result.state);
}

async function onZjhCall() {
  const seat = myZjhSeat();
  if (seat < 0 || !gameState.value) return;
  const result = zjhCall(gameState.value, seat);
  if (!result.ok) {
    setNotice(result.error, "error");
    return;
  }
  await persistGameState(result.state);
}

async function onZjhRaise() {
  const seat = myZjhSeat();
  if (seat < 0 || !gameState.value) return;
  const result = zjhRaise(gameState.value, seat);
  if (!result.ok) {
    setNotice(result.error, "error");
    return;
  }
  await persistGameState(result.state);
}

async function onZjhFold() {
  const seat = myZjhSeat();
  if (seat < 0 || !gameState.value) return;
  const result = zjhFold(gameState.value, seat);
  if (!result.ok) {
    setNotice(result.error, "error");
    return;
  }
  await persistGameState(result.state);
}

async function restartZjhRound() {
  if (!isCurrentUserHost.value || !currentRoom.value || !gameState.value) return;
  const state = restartZhajinhuaRound(gameState.value);
  await supabase
    .from("games_rooms")
    .update({ status: "playing", game_state: { lobbyBots: lobbyBots.value, zjh: state } })
    .eq("id", currentRoom.value.id);
  gameState.value = state;
  await nextTick();
  maybeRunBotTurn();
}

function clearBotTimer() {
  if (botTimer) {
    clearTimeout(botTimer);
    botTimer = null;
  }
}

function clearBotHeartbeat() {
  if (botHeartbeat) {
    clearInterval(botHeartbeat);
    botHeartbeat = null;
  }
}

function botTurnSnapshot() {
  if (!gameState.value || !currentRoom.value) return null;
  const state = gameState.value;
  const gameType = currentRoom.value.game_type;
  const ddzActive = gameType === "doudizhu" && (state.phase === "bidding" || state.phase === "playing");
  const zjhActive = gameType === "zhajinhua" && state.phase === "playing";
  if (!ddzActive && !zjhActive) return null;
  const seat = gameType === "doudizhu" ? (state.phase === "bidding" ? state.bid.turnSeat : state.play.turnSeat) : state.turnSeat;
  const player = state.players?.[seat];
  if (!player?.isBot) return null;
  return { state, gameType, seat, player };
}

function maybeRunBotTurn() {
  clearBotTimer();
  if (!currentMember.value || botActing) return;
  const snap = botTurnSnapshot();
  if (!snap) return;

  botTimer = setTimeout(async () => {
    if (botActing) return;
    botActing = true;
    try {
      const latestSnap = botTurnSnapshot();
      if (!latestSnap) return;
      const { state: latest, gameType: latestGame, seat: latestSeat } = latestSnap;

      let result;
      if (latestGame === "doudizhu" && latest.phase === "bidding") {
        const bid = botChooseBid(latest, latestSeat);
        result = placeBid(latest, latestSeat, bid);
      } else if (latestGame === "doudizhu") {
        const choice = botChoosePlay(latest, latestSeat);
        result = choice.action === "pass" ? passPlay(latest, latestSeat) : playCards(latest, latestSeat, choice.cards);
      } else {
        result = runZhajinhuaBotTurn(latest, latestSeat);
      }
      if (result?.ok) {
        await persistGameState(result.state);
      } else {
        setNotice(`机器人行动失败：${result?.error || "未知错误"}`, "error");
        maybeRunBotTurn();
      }
    } catch (error) {
      setNotice(`机器人异常：${error?.message || String(error)}`, "error");
      maybeRunBotTurn();
    } finally {
      botActing = false;
    }
  }, 700 + Math.random() * 500);
}

function startBotHeartbeat() {
  clearBotHeartbeat();
  botHeartbeat = setInterval(() => {
    if (botActing || botTimer) return;
    if (!currentRoom.value || currentRoom.value.status !== "playing") return;
    const snap = botTurnSnapshot();
    if (!snap) return;
    maybeRunBotTurn();
  }, 1500);
}

async function sendMessage() {
  if (!currentRoom.value || !(await ensureAuth("发送消息"))) return;
  if (!chatInput.value) return;

  const { error } = await supabase.from("games_room_messages").insert({
    room_id: currentRoom.value.id,
    user_id: currentUserId.value,
    user_name: currentUserName.value,
    content: chatInput.value,
  });

  if (error) {
    setNotice(`消息发送失败：${error.message}`, "error");
    return;
  }
  chatInput.value = "";
}

async function setupLobbyRealtime() {
  await teardownLobbyChannel();
  lobbyChannel = supabase
    .channel("games-lobby")
    .on("postgres_changes", { event: "*", schema: "public", table: "games_rooms" }, async () => {
      await loadRooms();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "games_room_members" }, async () => {
      await loadRooms();
    })
    .subscribe();
}

async function teardownLobbyChannel() {
  if (!lobbyChannel || !supabase) return;
  await supabase.removeChannel(lobbyChannel);
  lobbyChannel = null;
}

watch(
  () => gameState.value?.phase && `${gameState.value.phase}-${gameState.value.bid?.turnSeat}-${gameState.value.play?.turnSeat}`,
  () => {
    if (!applyingRemote) maybeRunBotTurn();
  },
);

onMounted(async () => {
  await auth.refreshSession();
  if (!supabase) {
    setNotice("Supabase 未配置，联机游戏不可用。", "error");
    return;
  }
  await loadRooms();
  await setupLobbyRealtime();
  startBotHeartbeat();
});

onMounted(() => {
  createMaxPlayers.value = Math.min(createMaxPlayers.value, maxPlayersForGame(createGameType.value));
});

watchEffect(() => {
  const cap = maxPlayersForGame(createGameType.value);
  if (createMaxPlayers.value > cap) {
    createMaxPlayers.value = cap;
  }
  if (createGameType.value === "doudizhu" && createMaxPlayers.value < 3) {
    createMaxPlayers.value = 3;
  }
});

onBeforeUnmount(async () => {
  clearBotTimer();
  clearBotHeartbeat();
  await teardownRoomChannel();
  await teardownLobbyChannel();
});
</script>
