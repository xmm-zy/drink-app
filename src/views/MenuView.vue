<template>
  <div class="menu-page" :class="{ 'menu-page--lite': useLiteMotion }">
    <main class="menu-shell">
      <header class="menu-header">
        <RouterLink to="/">LUCERIA &amp; CO.</RouterLink>
      </header>

      <section class="menu-hero">
        <p class="eyebrow">Main Menu</p>
        <h1>Choose Your Pour<span>选择你的调酒体验</span></h1>
        <p>点击酒杯进入功能页面，左侧唱片机可播放占位音频或你上传的 MP3 / OGG。</p>
      </section>

      <section class="menu-scene" aria-label="主菜单酒杯与唱片机布局">
        <aside class="menu-turntable-panel">
          <img
            class="menu-turntable-image"
            src="/assets/menu-turntable-cutout.webp"
            alt="复古唱片机"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          />
          <div class="menu-player">
            <p class="eyebrow">Vinyl Player</p>
            <audio
              ref="playerRef"
              class="menu-player-audio-hidden"
              :src="audioSrc"
              :loop="isLooping"
              @timeupdate="handleTimeUpdate"
              @loadedmetadata="handleLoadedMetadata"
              @ended="isPlaying = false"
            ></audio>
            <div class="menu-player-visualizer" aria-hidden="true">
              <span
                v-for="(height, index) in waveformBars"
                :key="index"
                :style="{ height: `${height}px` }"
                :class="{ active: isPlaying }"
              ></span>
            </div>
            <div class="menu-player-progress">
              <span>{{ formatTime(currentTimeSec) }}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                :value="progressPercent"
                @input="handleSeek"
              />
              <span>{{ formatTime(durationSec) }}</span>
            </div>
            <div class="menu-player-controls">
              <button type="button" aria-label="静音或取消静音" @click="toggleMute">
                {{ isMuted ? "UNMUTE" : "MUTE" }}
              </button>
              <button type="button" aria-label="回退 5 秒" @click="seekBy(-5)">◀◀</button>
              <button type="button" class="menu-player-play" aria-label="播放或暂停" @click="togglePlay">
                {{ isPlaying ? "❚❚" : "▶" }}
              </button>
              <button type="button" aria-label="快进 5 秒" @click="seekBy(5)">▶▶</button>
              <button type="button" aria-label="循环播放" :class="{ active: isLooping }" @click="toggleLoop">
                LOOP
              </button>
            </div>
            <div class="menu-player-actions">
              <button type="button" @click="triggerUpload">上传 MP3 / OGG</button>
              <button v-if="isCustomAudio" type="button" @click="usePlaceholder">恢复占位音频</button>
            </div>
            <input
              ref="fileInputRef"
              class="menu-player-input"
              type="file"
              accept=".mp3,.ogg,audio/mpeg,audio/ogg"
              @change="handleAudioUpload"
            />
            <p class="menu-player-track">当前音频：{{ trackLabel }}</p>
            <p v-if="uploadError" class="menu-player-error">{{ uploadError }}</p>
            <p class="menu-player-tip">你后续可替换为你提供给用户的十首 MP3，用户也可自行上传可播放文件。</p>
          </div>
        </aside>

        <nav class="menu-glass-nav" aria-label="功能导航">
          <RouterLink
            class="menu-glass-link menu-glass-link--right"
            to="/cocktails"
            aria-label="调酒菜单 Cocktail Menu"
          >
            <img
              class="menu-glass-right"
              src="/assets/menu-glass-right.webp"
              alt="调酒菜单酒杯"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
            <span class="menu-glass-label">
              <strong>调酒菜单</strong>
              <em>Cocktail Menu</em>
            </span>
          </RouterLink>

          <RouterLink
            class="menu-glass-link menu-glass-link--center"
            to="/account"
            aria-label="账号登录 Account Login"
          >
            <img
              class="menu-glass-center"
              src="/assets/menu-glass-center.webp"
              alt="账号登录酒杯"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
            <span class="menu-glass-label">
              <strong>账号登录</strong>
              <em>Account Login</em>
            </span>
          </RouterLink>

          <RouterLink
            class="menu-glass-link menu-glass-link--bottom"
            to="/stories"
            aria-label="喝酒故事 Drinking Stories"
          >
            <img
              class="menu-glass-bottom"
              src="/assets/menu-glass-bottom.webp"
              alt="喝酒故事酒杯"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
            <span class="menu-glass-label">
              <strong>喝酒故事</strong>
              <em>Drinking Stories</em>
            </span>
          </RouterLink>

          <RouterLink class="menu-glass-chip menu-glass-chip--orange" to="/games">
            <img
              class="menu-glass-line"
              src="/assets/menu-glass-line-orange.webp"
              alt="橙色线条酒杯"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
            <span class="menu-glass-label menu-glass-label--chip">
              <strong>小游戏</strong>
              <em>Mini Games</em>
            </span>
          </RouterLink>
          <RouterLink class="menu-glass-chip menu-glass-chip--blue" to="/tools">
            <img
              class="menu-glass-line"
              src="/assets/menu-glass-line-blue.webp"
              alt="天蓝色线条酒杯"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
            <span class="menu-glass-label menu-glass-label--chip">
              <strong>调酒器具</strong>
              <em>Bar Tools</em>
            </span>
          </RouterLink>
        </nav>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

const placeholderAudio = "/audio/placeholder-loop.wav";
const supportedMimeTypes = new Set(["audio/mpeg", "audio/mp3", "audio/ogg", "application/ogg"]);

const fileInputRef = ref(null);
const playerRef = ref(null);
const audioSrc = ref(placeholderAudio);
const trackLabel = ref("占位音频 placeholder-loop.wav");
const uploadError = ref("");
const isCustomAudio = ref(false);
const customAudioUrl = ref("");
const isPlaying = ref(false);
const isMuted = ref(false);
const isLooping = ref(false);
const currentTimeSec = ref(0);
const durationSec = ref(0);
const progressPercent = ref(0);
const waveformBars = [14, 20, 30, 22, 28, 34, 24, 38, 18, 32, 36, 22, 28, 34, 24, 30, 20, 28];
const useLiteMotion = ref(false);

function triggerUpload() {
  fileInputRef.value?.click();
}

function resetFileInput(target) {
  if (target) target.value = "";
}

function revokeCustomAudioUrl() {
  if (!customAudioUrl.value) return;
  URL.revokeObjectURL(customAudioUrl.value);
  customAudioUrl.value = "";
}

function resetPlaybackUi() {
  isPlaying.value = false;
  currentTimeSec.value = 0;
  durationSec.value = 0;
  progressPercent.value = 0;
}

function getPlayer() {
  return playerRef.value;
}

function usePlaceholder() {
  const player = getPlayer();
  if (player) {
    player.pause();
    player.currentTime = 0;
  }
  revokeCustomAudioUrl();
  audioSrc.value = placeholderAudio;
  trackLabel.value = "占位音频 placeholder-loop.wav";
  uploadError.value = "";
  isCustomAudio.value = false;
  resetPlaybackUi();
}

function isSupportedAudio(file) {
  const extensionOk = /\.(mp3|ogg)$/i.test(file.name);
  return extensionOk || supportedMimeTypes.has(file.type);
}

function handleAudioUpload(event) {
  const target = event.target;
  const file = target?.files?.[0];
  if (!file) return;

  if (!isSupportedAudio(file)) {
    uploadError.value = "仅支持 MP3 或 OGG 音频文件，请重新选择。";
    resetFileInput(target);
    return;
  }

  revokeCustomAudioUrl();
  const objectUrl = URL.createObjectURL(file);
  const player = getPlayer();
  if (player) player.pause();
  customAudioUrl.value = objectUrl;
  audioSrc.value = objectUrl;
  trackLabel.value = file.name;
  uploadError.value = "";
  isCustomAudio.value = true;
  resetPlaybackUi();
  resetFileInput(target);
}

function handleLoadedMetadata() {
  const player = getPlayer();
  if (!player) return;
  durationSec.value = Number.isFinite(player.duration) ? player.duration : 0;
}

function handleTimeUpdate() {
  const player = getPlayer();
  if (!player) return;
  currentTimeSec.value = Number.isFinite(player.currentTime) ? player.currentTime : 0;
  if (durationSec.value > 0) {
    progressPercent.value = (currentTimeSec.value / durationSec.value) * 100;
  } else {
    progressPercent.value = 0;
  }
}

async function togglePlay() {
  const player = getPlayer();
  if (!player) return;
  if (player.paused) {
    try {
      await player.play();
      isPlaying.value = true;
      uploadError.value = "";
    } catch {
      uploadError.value = "浏览器阻止自动播放，请手动点击播放按钮。";
    }
    return;
  }
  player.pause();
  isPlaying.value = false;
}

function handleSeek(event) {
  const player = getPlayer();
  if (!player || durationSec.value <= 0) return;
  const nextPercent = Number(event.target?.value || 0);
  progressPercent.value = nextPercent;
  player.currentTime = (nextPercent / 100) * durationSec.value;
}

function seekBy(deltaSec) {
  const player = getPlayer();
  if (!player) return;
  const maxDuration = durationSec.value || player.duration || 0;
  const next = Math.min(Math.max(player.currentTime + deltaSec, 0), maxDuration);
  player.currentTime = next;
}

function toggleMute() {
  const player = getPlayer();
  if (!player) return;
  player.muted = !player.muted;
  isMuted.value = player.muted;
}

function toggleLoop() {
  const player = getPlayer();
  isLooping.value = !isLooping.value;
  if (player) player.loop = isLooping.value;
}

function formatTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

onMounted(() => {
  const nav = window.navigator;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const slowNetwork = /2g/.test(connection?.effectiveType || "");
  const lowMemory = Number(nav.deviceMemory || 8) <= 4;
  const lowCores = Number(nav.hardwareConcurrency || 8) <= 4;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  useLiteMotion.value = prefersReduced || saveData || slowNetwork || (coarsePointer && (lowMemory || lowCores));
});

onBeforeUnmount(() => {
  const player = getPlayer();
  if (player) player.pause();
  revokeCustomAudioUrl();
});
</script>
