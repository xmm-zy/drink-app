<template>
  <main class="app-shell">
    <CocktailSidebar
      v-model:search-query="searchQuery"
      v-model:category-filter="categoryFilter"
      v-model:base-filter="baseFilter"
    />

    <section class="content-area">
      <header class="topbar">
        <div>
          <p class="eyebrow">Desktop Preview</p>
          <h2>Classic Cocktail Collection</h2>
        </div>
        <button class="ghost-button" type="button" @click="resetFilters">重置筛选</button>
      </header>

      <section class="layout-grid">
        <CocktailList
          :cocktails="filteredCocktails"
          :selected-name="activeCocktail?.name || ''"
          @select="activeCocktail = $event"
        />
        <CocktailDetail :cocktail="activeCocktail" @need-login="openLoginModal" />
      </section>
    </section>

    <LoginModal :open="loginModalOpen" :message="loginModalMessage" @close="loginModalOpen = false" />
  </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import CocktailSidebar from "@/components/CocktailSidebar.vue";
import CocktailList from "@/components/CocktailList.vue";
import CocktailDetail from "@/components/CocktailDetail.vue";
import LoginModal from "@/components/LoginModal.vue";
import { baseSpiritLabels, categoryLabels, cocktails } from "@/data/cocktails";

const searchQuery = ref("");
const categoryFilter = ref("all");
const baseFilter = ref("all");
const activeCocktail = ref(cocktails[0]);
const loginModalOpen = ref(false);
const loginModalMessage = ref("请先登录账号，再发布评论或点赞。");

const filteredCocktails = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return cocktails.filter((cocktail) => {
    const matchesCategory = categoryFilter.value === "all" || cocktail.category === categoryFilter.value;
    const matchesBase = baseFilter.value === "all" || cocktail.base === baseFilter.value;
    const categoryLabel = categoryLabels[cocktail.category];
    const baseLabel = baseSpiritLabels[cocktail.base];
    const searchable = [
      cocktail.name,
      cocktail.zhName,
      categoryLabel.en,
      categoryLabel.zh,
      baseLabel.en,
      baseLabel.zh,
      cocktail.naming,
      cocktail.story,
      cocktail.profile,
      cocktail.method,
      ...cocktail.ingredients,
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && matchesBase && searchable.includes(query);
  });
});

watch(filteredCocktails, (list) => {
  if (!list.length) {
    activeCocktail.value = null;
    return;
  }
  if (!list.some((item) => item.name === activeCocktail.value?.name)) {
    activeCocktail.value = list[0];
  }
});

function resetFilters() {
  searchQuery.value = "";
  categoryFilter.value = "all";
  baseFilter.value = "all";
  activeCocktail.value = cocktails[0];
}

function openLoginModal(message) {
  loginModalMessage.value = message || "请先登录账号，再发布评论或点赞。";
  loginModalOpen.value = true;
}
</script>
