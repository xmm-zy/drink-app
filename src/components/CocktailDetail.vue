<template>
  <article
    v-if="cocktail"
    class="detail-card has-inline-photo"
    aria-live="polite"
  >
    <div class="detail-copy">
      <p class="eyebrow">
        {{ formatLabel(categoryLabels[cocktail.category]) }} ·
        {{ formatLabel(baseSpiritLabels[cocktail.base]) }}
      </p>

      <div class="detail-main with-photo">
        <div class="detail-text">
          <h3>{{ cocktail.name }}<span>{{ cocktail.zhName }}</span></h3>
          <p class="story">{{ cocktail.story }}</p>

          <div class="info-columns">
            <section>
              <h4>命名</h4>
              <p>{{ cocktail.naming }}</p>
            </section>
            <section>
              <h4>基酒与风味</h4>
              <p>{{ cocktail.profile }}</p>
            </section>
          </div>
        </div>

        <figure class="detail-inline-photo">
          <img
            v-if="cocktail.image"
            class="cocktail-photo"
            :src="cocktail.image"
            :alt="`${cocktail.name} / ${cocktail.zhName}`"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="cocktail-photo-placeholder" aria-hidden="true">
            <span class="placeholder-mark">◇</span>
            <p>IMAGE</p>
            <span>{{ cocktail.zhName }}</span>
          </div>
        </figure>
      </div>

      <section class="recipe-box">
        <div class="section-title">
          <h4>调酒配方</h4>
          <span>{{ cocktail.method }}</span>
        </div>
        <ul>
          <li v-for="item in cocktail.ingredients" :key="item">{{ item }}</li>
        </ul>
      </section>

      <ReviewPanel :cocktail="cocktail" @need-login="$emit('need-login', $event)" />
    </div>
  </article>

  <article v-else class="detail-card">
    <div class="detail-copy">
      <p class="eyebrow">No Result</p>
      <h3>No Cocktail<span>暂无酒款</span></h3>
      <p class="story">没有找到匹配的酒款。可以尝试搜索 Whiskey、Gin、柠檬、热带或切换分类。</p>
    </div>
  </article>
</template>

<script setup>
import { baseSpiritLabels, categoryLabels, formatLabel } from "@/data/cocktails";
import ReviewPanel from "@/components/ReviewPanel.vue";

defineProps({
  cocktail: { type: Object, default: null },
});

defineEmits(["need-login"]);
</script>
