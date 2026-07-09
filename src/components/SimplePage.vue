<template>
  <div class="simple-page">
    <main class="simple-shell">
      <RouterLink class="back-link" to="/menu">返回功能菜单 / Back to Menu</RouterLink>
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <nav class="simple-actions">
        <RouterLink to="/cocktails">查看调酒菜单</RouterLink>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});
</script>
