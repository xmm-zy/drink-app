<template>
  <RouterView />
  <UserIdentityBadge />
</template>

<script setup>
import { RouterView } from "vue-router";
import UserIdentityBadge from "@/components/UserIdentityBadge.vue";
</script>
