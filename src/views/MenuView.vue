<template>
  <div class="menu-page">
    <main class="menu-shell">
      <header class="menu-header">
        <RouterLink to="/">LUCERIA &amp; CO.</RouterLink>
        <span>Cocktail Experience</span>
      </header>

      <section class="menu-hero">
        <p class="eyebrow">Main Menu</p>
        <h1>Choose Your Pour<span>选择你的调酒体验</span></h1>
        <p>这里是功能入口页。你可以进入调酒菜单、账号登录、喝酒故事、小游戏和调酒器具介绍。</p>
      </section>

      <nav class="menu-grid" aria-label="功能导航">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          class="menu-tile"
          :class="{ primary: item.primary }"
          :to="item.to"
        >
          <span>{{ item.no }}</span>
          <strong>{{ item.title }}</strong>
          <em>{{ item.en }}</em>
          <p>{{ item.desc }}</p>
        </RouterLink>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";

const menuItems = [
  {
    no: "01",
    title: "调酒菜单",
    en: "Cocktail Menu",
    desc: "检索酒款、基酒分类、历史故事、调酒配方，以及账号绑定的评论与点赞。",
    to: "/cocktails",
    primary: true,
  },
  {
    no: "02",
    title: "账号登录",
    en: "Account Login",
    desc: "邮箱魔法链接或验证码登录，评论和点赞会绑定到当前账号。",
    to: "/account",
  },
  {
    no: "03",
    title: "喝酒故事",
    en: "Drinking Stories",
    desc: "收录酒款背后的历史、人物、城市与酒吧文化故事。",
    to: "/stories",
  },
  {
    no: "04",
    title: "小游戏",
    en: "Mini Games",
    desc: "后续可加入调酒记忆卡、配方匹配、酒款猜谜等互动玩法。",
    to: "/games",
  },
  {
    no: "05",
    title: "调酒器具介绍",
    en: "Bar Tools Guide",
    desc: "介绍摇壶、量酒器、吧勺、滤冰器、捣棒、杯具与基础使用方法。",
    to: "/tools",
  },
];
</script>
