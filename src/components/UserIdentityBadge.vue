<template>
  <RouterLink class="global-user-badge" to="/account" aria-label="打开账号页">
    <img v-if="auth.isLoggedIn && auth.profile.avatarUrl" :src="auth.profile.avatarUrl" alt="当前用户头像" />
    <span v-else>{{ initial }}</span>
    <div>
      <strong>{{ auth.isLoggedIn ? auth.profile.name : "未登录" }}</strong>
      <em>{{ auth.isLoggedIn ? "账号中心" : "点击登录账号" }}</em>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const initial = computed(() =>
  String(auth.profile.name || "G")
    .slice(0, 1)
    .toUpperCase(),
);
</script>
