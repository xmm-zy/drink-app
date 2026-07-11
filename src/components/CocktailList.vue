<template>
  <div class="cocktail-list" aria-label="酒款列表">
    <RouterLink class="cocktail-card cocktail-card--create" to="/cocktails/new">
      <span>Create Cocktail / 创建酒款</span>
      <strong><b aria-hidden="true">＋</b>新增调酒<em>填写完整酒款资料</em></strong>
      <small>名称 · 故事 · 风味 · 配方 · 图片</small>
    </RouterLink>

    <button
      v-for="cocktail in cocktails"
      :key="cocktail.id || cocktail.name"
      class="cocktail-card"
      :class="{ selected: cocktailKey(cocktail) === selectedKey }"
      type="button"
      @click="$emit('select', cocktail)"
    >
      <span>{{ formatLabel(categoryLabels[cocktail.category]) }}</span>
      <strong>{{ cocktail.name }}<em>{{ cocktail.zhName }}</em></strong>
      <small>{{ formatLabel(baseSpiritLabels[cocktail.base]) }} · {{ cocktail.profile }}</small>
    </button>

    <div v-if="!cocktails.length" class="empty-state">没有找到匹配酒款，请调整关键词或分类。</div>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
import { baseSpiritLabels, categoryLabels, formatLabel } from "@/data/cocktails";
import { cocktailKey } from "@/lib/user-cocktails";

defineProps({
  cocktails: { type: Array, required: true },
  selectedKey: { type: String, default: "" },
});

defineEmits(["select"]);
</script>
