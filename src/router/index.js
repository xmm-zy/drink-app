import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import MenuView from "@/views/MenuView.vue";
import CocktailsView from "@/views/CocktailsView.vue";
import AccountView from "@/views/AccountView.vue";
import StoriesView from "@/views/StoriesView.vue";
import GamesView from "@/views/GamesView.vue";
import ToolsView from "@/views/ToolsView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/menu", name: "menu", component: MenuView },
    { path: "/cocktails", name: "cocktails", component: CocktailsView },
    { path: "/account", name: "account", component: AccountView },
    { path: "/stories", name: "stories", component: StoriesView },
    { path: "/games", name: "games", component: GamesView },
    { path: "/tools", name: "tools", component: ToolsView },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
