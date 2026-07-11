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
          <p v-if="loadNotice" class="cocktail-load-notice">{{ loadNotice }}</p>
        </div>
        <button class="ghost-button" type="button" @click="resetFilters">重置筛选</button>
      </header>

      <section class="layout-grid">
        <CocktailList
          :cocktails="filteredCocktails"
          :selected-key="cocktailKey(activeCocktail)"
          @select="activeCocktail = $event"
        />
        <CocktailDetail :cocktail="activeCocktail" @need-login="openLoginModal" />
      </section>
    </section>

    <LoginModal :open="loginModalOpen" :message="loginModalMessage" @close="loginModalOpen = false" />
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CocktailSidebar from "@/components/CocktailSidebar.vue";
import CocktailList from "@/components/CocktailList.vue";
import CocktailDetail from "@/components/CocktailDetail.vue";
import LoginModal from "@/components/LoginModal.vue";
import { baseSpiritLabels, categoryLabels, cocktails as staticCocktails } from "@/data/cocktails";
import { supabase } from "@/lib/supabase";

const route = useRoute();
const searchQuery = ref("");
const categoryFilter = ref("all");
const baseFilter = ref("all");
const allCocktails = ref([...staticCocktails]);
const activeCocktail = ref(staticCocktails[0]);
const loadNotice = ref("");
const loginModalOpen = ref(false);
const loginModalMessage = ref("请先登录账号，再发布评论或点赞。");

const filteredCocktails = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return allCocktails.value.filter((cocktail) => {
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
  if (!list.some((item) => cocktailKey(item) === cocktailKey(activeCocktail.value))) {
    activeCocktail.value = list[0];
  }
});

onMounted(loadUserCocktails);

function cocktailKey(cocktail) {
  if (!cocktail) return "";
  return cocktail.id ? `user:${cocktail.id}` : `static:${cocktail.name}`;
}

async function loadUserCocktails() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from("user_cocktails")
    .select("id,name,zh_name,category,base,image,naming,story,profile,method,ingredients,user_id,user_name,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    loadNotice.value = "自定义酒款暂时无法加载。";
    return;
  }

  const customCocktails = (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    zhName: item.zh_name,
    category: item.category,
    base: item.base,
    image: item.image || "",
    naming: item.naming,
    story: item.story,
    profile: item.profile,
    method: item.method,
    ingredients: item.ingredients || [],
    userId: item.user_id,
    userName: item.user_name,
    createdAt: item.created_at,
  }));
  allCocktails.value = [...customCocktails, ...staticCocktails];
  loadNotice.value = "";

  const createdId = String(route.query.created || "");
  activeCocktail.value =
    customCocktails.find((item) => item.id === createdId) ||
    allCocktails.value.find((item) => cocktailKey(item) === cocktailKey(activeCocktail.value)) ||
    allCocktails.value[0];
}

function resetFilters() {
  searchQuery.value = "";
  categoryFilter.value = "all";
  baseFilter.value = "all";
  activeCocktail.value = allCocktails.value[0] || null;
}

function openLoginModal(message) {
  loginModalMessage.value = message || "请先登录账号，再发布评论或点赞。";
  loginModalOpen.value = true;
}
</script>
