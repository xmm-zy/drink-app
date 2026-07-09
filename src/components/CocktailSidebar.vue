<template>
  <aside class="sidebar">
    <div class="brand-mark">LUCERIA &amp; CO.</div>
    <h1>COCKTAIL<br /><span>Atelier</span></h1>
    <p class="intro">
      以 IBA 经典鸡尾酒为灵感，整理命名、故事、配方与作品图占位，适合先作为电脑端菜单与资料管理界面。
    </p>

    <div class="search-panel">
      <label for="searchInput">查找酒款</label>
      <input
        id="searchInput"
        :value="searchQuery"
        type="search"
        placeholder="输入中英文名称、基酒或风味"
        @input="$emit('update:searchQuery', $event.target.value)"
      />
    </div>

    <div class="filter-section">
      <div class="filter-group">
        <p>酒单分类</p>
        <nav class="category-tabs" aria-label="鸡尾酒分类">
          <button
            v-for="item in categoryOptions"
            :key="item.value"
            class="tab"
            :class="{ active: categoryFilter === item.value }"
            type="button"
            @click="$emit('update:categoryFilter', item.value)"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>

      <div class="filter-group">
        <p>基酒分类</p>
        <nav class="category-tabs" aria-label="基酒分类">
          <button
            v-for="item in baseOptions"
            :key="item.value"
            class="tab"
            :class="{ active: baseFilter === item.value }"
            type="button"
            @click="$emit('update:baseFilter', item.value)"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="页面跳转">
      <RouterLink class="home-button sidebar-nav-orange" to="/">Menu</RouterLink>
      <RouterLink class="home-button sidebar-nav-green" to="/menu">Main Menu</RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  searchQuery: { type: String, required: true },
  categoryFilter: { type: String, required: true },
  baseFilter: { type: String, required: true },
});

defineEmits(["update:searchQuery", "update:categoryFilter", "update:baseFilter"]);

const categoryOptions = [
  { value: "all", label: "All / 全部" },
  { value: "classic", label: "Classic / 经典" },
  { value: "signature", label: "Signature / 特调" },
  { value: "nonalcoholic", label: "No Alcohol / 无酒精" },
];

const baseOptions = [
  { value: "all", label: "All / 全部" },
  { value: "whiskey", label: "Whiskey / 威士忌" },
  { value: "gin", label: "Gin / 金酒" },
  { value: "rum", label: "Rum / 朗姆" },
  { value: "tequila", label: "Tequila / 龙舌兰" },
  { value: "vodka", label: "Vodka / 伏特加" },
  { value: "none", label: "No Base / 无基酒" },
];
</script>
