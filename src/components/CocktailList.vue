<template>
  <div class="cocktail-list" aria-label="酒款列表">
    <button
      v-for="cocktail in cocktails"
      :key="cocktail.name"
      class="cocktail-card"
      :class="{ selected: cocktail.name === selectedName }"
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
import { baseSpiritLabels, categoryLabels, formatLabel } from "@/data/cocktails";

defineProps({
  cocktails: { type: Array, required: true },
  selectedName: { type: String, default: "" },
});

defineEmits(["select"]);
</script>
