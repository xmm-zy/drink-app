# Luceria Cocktail Atelier (Vue 3)

标准 Vue 3 + Vite 工程结构的调酒知识网站。

## 核心功能

- 鸡尾酒搜索、筛选和详情
- 用户酒款完整 CRUD，支持图片上传、替换和清理
- 评论、点赞、喝酒故事论坛和管理员内容管理
- 邮箱 OTP / Magic Link 登录与头像资料
- 摇骰子、转盘和调酒器具查询
- 320px 起的移动端、横屏和安全区适配

## 项目文档

- [项目说明](PROJECT_DOCUMENTATION.md)
- [技术文档](TECHNICAL_DOCUMENTATION.md)
- [API 设计](API_DESIGN.md)

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
│  ├─ lib/                 # Supabase、酒款 CRUD 工具与测试
│  ├─ data/                # 静态数据
│  ├─ styles/              # 全局样式
│  ├─ App.vue
│  └─ main.js
├─ supabase/               # SQL 建表脚本
├─ legacy/                 # 旧版静态站备份
├─ .env.example            # 环境变量模板
├─ API_DESIGN.md           # Supabase API、RLS 与 CRUD 设计
├─ PROJECT_DOCUMENTATION.md
├─ TECHNICAL_DOCUMENTATION.md
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
npm test           # Vitest 单元测试
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
