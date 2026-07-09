<template>
  <div class="menu-page">
    <main class="menu-shell">
      <header class="menu-header">
        <RouterLink to="/">LUCERIA &amp; CO.</RouterLink>
      </header>

      <section class="menu-hero">
        <p class="eyebrow">Main Menu</p>
        <h1>Choose Your Pour<span>选择你的调酒体验</span></h1>
        <p>点击酒杯，进入对应页面。</p>
      </section>

      <nav class="menu-glass-nav" aria-label="功能导航">
        <RouterLink
          class="menu-glass-link menu-glass-link--right"
          to="/cocktails"
          aria-label="调酒菜单 Cocktail Menu"
        >
          <img
            class="menu-glass-right"
            src="/assets/menu-glass-right.png"
            alt=""
          />
          <span class="menu-glass-label">
            <strong>调酒菜单</strong>
            <em>Cocktail Menu</em>
          </span>
        </RouterLink>

        <RouterLink
          class="menu-glass-link menu-glass-link--center"
          to="/account"
          aria-label="账号登录 Account Login"
        >
          <img
            class="menu-glass-center"
            src="/assets/menu-glass-center.png"
            alt=""
          />
          <span class="menu-glass-label">
            <strong>账号登录</strong>
            <em>Account Login</em>
          </span>
        </RouterLink>

        <RouterLink
          class="menu-glass-link menu-glass-link--bottom"
          to="/stories"
          aria-label="喝酒故事 Drinking Stories"
        >
          <img
            class="menu-glass-bottom"
            src="/assets/menu-glass-bottom.png"
            alt=""
          />
          <span class="menu-glass-label">
            <strong>喝酒故事</strong>
            <em>Drinking Stories</em>
          </span>
        </RouterLink>

        <div class="menu-glass-extras">
          <RouterLink class="menu-glass-chip" to="/games">
            <strong>小游戏</strong>
            <em>Mini Games</em>
          </RouterLink>
          <RouterLink class="menu-glass-chip" to="/tools">
            <strong>调酒器具</strong>
            <em>Bar Tools</em>
          </RouterLink>
        </div>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>
