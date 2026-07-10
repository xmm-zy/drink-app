<template>
  <div class="home-page">
    <img
      class="hands-overlay"
      :src="handsOverlay"
      alt=""
      aria-hidden="true"
      decoding="async"
      fetchpriority="low"
    />
    <main class="home-shell">
      <header class="home-nav">
        <div class="brand-mark">LUCERIA &amp; CO.</div>
        <RouterLink to="/menu">ENTER MAIN MENU</RouterLink>
      </header>

      <section class="home-hero" aria-label="调酒软件主页面">
        <div class="home-copy">
          <p class="eyebrow">Cocktail Knowledge System</p>
          <h1 class="home-title">COCKTAIL<br />PARTY</h1>
          <p class="home-intro">
            复古酒单美学与鸡尾酒知识库结合。点击进入后可检索酒名、基酒分类、历史故事与调酒配方。
          </p>
          <RouterLink class="home-button" to="/cocktails">进入调酒菜单</RouterLink>
        </div>

        <div class="hero-stage" aria-hidden="true">
          <div class="headline-shadow">MIXOLOGY</div>
          <div class="hero-image-frame">
            <img class="hero-cocktail-photo" :src="cocktailCenter" alt="" decoding="async" fetchpriority="high" />
          </div>
        </div>

        <aside class="home-note">
          <strong>enjoy your life</strong>
          <RouterLink class="account-fab" to="/account" aria-label="进入账号登录界面">
            账号登录 / Account Login
          </RouterLink>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
import handsOverlay from "@/assets/hands-overlay.webp";
import cocktailCenter from "@/assets/cocktail-surreal-center.webp";
</script>
