import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("@/views/HomeView.vue") },
    { path: "/menu", name: "menu", component: () => import("@/views/MenuView.vue") },
    { path: "/cocktails", name: "cocktails", component: () => import("@/views/CocktailsView.vue") },
    { path: "/account", name: "account", component: () => import("@/views/AccountView.vue") },
    { path: "/stories", name: "stories", component: () => import("@/views/StoriesView.vue") },
    { path: "/games", name: "games", component: () => import("@/views/GamesView.vue") },
    { path: "/tools", name: "tools", component: () => import("@/views/ToolsView.vue") },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
