<template>
  <RouterView />
  <UserIdentityBadge :class="{ 'global-user-badge--home': route.path === '/' }" />
</template>

<script setup>
import { RouterView, useRoute } from "vue-router";
import UserIdentityBadge from "@/components/UserIdentityBadge.vue";

const route = useRoute();
</script>
