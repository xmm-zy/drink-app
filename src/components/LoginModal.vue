<template>
  <div v-if="open" class="login-modal" @click.self="$emit('close')">
    <div class="login-modal-card" role="dialog" aria-modal="true" aria-labelledby="loginModalTitle">
      <h3 id="loginModalTitle">需要登录后才能评论</h3>
      <p>{{ message }}</p>
      <div class="login-modal-actions">
        <button type="button" @click="$emit('close')">稍后再说</button>
        <RouterLink to="/account">前往登录 / Account</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  open: { type: Boolean, default: false },
  message: { type: String, default: "请先登录账号，再发布评论或点赞。" },
});

defineEmits(["close"]);
</script>
