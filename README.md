# Luceria Cocktail Atelier (Vue 3)

Vue 3 + Vite 重构版调酒知识网站。

## 技术栈

- Vue 3
- Vue Router
- Pinia
- Supabase Auth / Database
- Vite

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物在 `dist/`，可部署到 Cloudflare Pages：

```txt
Build command: npm run build
Build output directory: dist
```

## Vue 特性体现

- 组件化：CocktailList / CocktailDetail / ReviewPanel / LoginModal
- `v-for` / `v-model` / `computed` 筛选酒款
- Vue Router 多页面路由
- Pinia 管理登录状态
- props / emit 组件通信

旧版静态 HTML 备份在 `legacy/`。
