# Luceria Cocktail Atelier (Vue 3)

标准 Vue 3 + Vite 工程结构的调酒知识网站。

## 工程目录

```txt
drink-app/
├─ public/                 # 静态资源（原样输出）
│  └─ assets/
├─ src/
│  ├─ assets/              # 打包资源
│  ├─ components/          # 可复用组件
│  ├─ views/               # 页面
│  ├─ router/              # 路由
│  ├─ stores/              # Pinia 状态
│  ├─ lib/                 # Supabase 等封装
│  ├─ data/                # 静态数据
│  ├─ styles/              # 全局样式
│  ├─ App.vue
│  └─ main.js
├─ supabase/               # SQL 建表脚本
├─ legacy/                 # 旧版静态站备份
├─ .env.example            # 环境变量模板
├─ eslint.config.js        # ESLint 规范
├─ index.html
├─ package.json
└─ vite.config.js
```

## 本地运行

1. 复制环境变量：

```bash
copy .env.example .env
```

2. 填写 `.env` 中的 Supabase 配置

3. 安装并启动：

```bash
npm install
npm run dev
```

## 常用命令

```bash
npm run dev        # 开发
npm run build      # 构建
npm run preview    # 预览构建结果
npm run lint       # 代码检查
npm run lint:fix  # 自动修复
```

## Cloudflare Pages

```txt
Build command: npm run build
Build output directory: dist
```

并在 Cloudflare 环境变量中配置：

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Vue 特性

- 组件化拆分页面
- `v-for` / `v-model` / `computed`
- Vue Router 路由
- Pinia 登录状态
- props / emit 组件通信
