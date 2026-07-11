# Luceria Cocktail Atelier 项目文档

## 1. 项目简介

Luceria Cocktail Atelier 是一个以复古酒单和纸张质感为视觉主题的调酒知识网站。项目提供鸡尾酒资料浏览、用户酒款投稿、评论互动、喝酒故事论坛、账号资料、调酒工具，以及摇骰子和转盘等轻量功能。

- 项目名称：`drink-app`
- 当前版本：`1.0.0`
- 前端框架：Vue 3 + Vite
- 云端服务：Supabase
- 推荐部署：Cloudflare Pages 或 Cloudflare Workers Assets

## 2. 主要功能

### 2.1 首页

路由：`/`

- 展示品牌视觉和项目入口。
- 可进入调酒菜单、主功能菜单和账号页面。
- 根据设备性能、节省流量设置及减少动态效果偏好自动降低动画强度。

### 2.2 主功能菜单

路由：`/menu`

- 以酒杯和唱片机作为功能导航。
- 提供调酒菜单、账号、喝酒故事、摇骰子与转盘、调酒器具入口。
- 唱片机支持 MP3/OGG 本地试听；用户上传的音频仅在当前页面会话中有效。

### 2.3 调酒菜单

路由：`/cocktails`

- 按中英文名称、基酒、风味、故事和配方搜索。
- 按酒单分类和基酒类型筛选。
- 展示酒款故事、命名来源、风味、图片、调制方式和配方。
- 内置酒款与用户投稿酒款合并展示。
- 用户投稿会标记作者和创建日期。
- 投稿作者可编辑或删除自己的酒款，管理员可删除违规投稿。
- 登录用户可发表评论、点赞及删除自己的评论。
- 管理员可删除违规评论。

### 2.4 新增与编辑调酒

路由：

- 新增：`/cocktails/new`
- 编辑：`/cocktails/:id/edit`

- 从调酒菜单结果栏顶部的“＋ 新增调酒”卡片进入。
- 需要登录。
- 填写英文名、中文名、分类、基酒、故事、命名、风味、调制方式和配方。
- 支持 JPG、JPEG、PNG 本地图片上传，最大 5MB。
- 右侧实时预览与现有酒款详情页保持一致。
- 发布后自动返回调酒菜单并选中新酒款。
- 作者可从酒款详情进入编辑页面；表单自动载入现有资料。
- 编辑时可保留原图或上传新图。更新成功后旧图会从 Storage 清理，失败时回滚新图。
- 英文名称作为评论关联标识，发布后保持只读。

### 2.5 账号

路由：`/account`

- Supabase 邮箱魔法链接或邮箱 OTP 验证码登录。
- 支持昵称和头像资料。
- 头像支持 PNG、JPG、WEBP、GIF，最大 3MB。
- 资料每 7 天可修改一次。
- 管理员账号会显示管理员标识。

### 2.6 喝酒故事论坛

路由：`/stories`

- 浏览、发布和筛选酒吧见闻、配方灵感、城市夜生活与个人记忆。
- 支持回复、楼中楼、点赞、收藏及热度排序。
- 作者可删除自己的帖子和回复，管理员可删除任意帖子和回复。
- 未配置 Supabase 时可降级为浏览器本地模式，但数据不会跨设备同步。

### 2.7 摇骰子与转盘

路由：`/games`

- 设置 1–20 颗骰子并统计各点数出现次数。
- 自定义转盘选项并随机选择结果。
- 最近一次骰子结果、转盘选项和转盘历史保存在浏览器 `localStorage`。

### 2.8 调酒器具

路由：`/tools`

- 调酒器具说明。
- 按酒款反查所需器具和冰型。
- 提供球冰、薄冰等制作指南。

## 3. 页面路由

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | `HomeView.vue` | 首页 |
| `/menu` | `MenuView.vue` | 主功能菜单 |
| `/cocktails` | `CocktailsView.vue` | 调酒菜单 |
| `/cocktails/new` | `AddCocktailView.vue` | 新增调酒 |
| `/cocktails/:id/edit` | `AddCocktailView.vue` | 编辑作者自己的投稿酒款 |
| `/account` | `AccountView.vue` | 登录与资料 |
| `/stories` | `StoriesView.vue` | 喝酒故事论坛 |
| `/games` | `DiceWheelView.vue` | 摇骰子与转盘 |
| `/tools` | `ToolsView.vue` | 调酒器具 |

项目中还保留了 `GamesView.vue` 及斗地主、炸金花引擎，但当前没有注册到公开路由。

## 4. 本地开发

### 4.1 环境要求

- Node.js LTS
- npm
- 可选：Python 3 和 Pillow，用于重新生成部分图片资源

### 4.2 安装

```powershell
cd C:\Users\qinye\Desktop\drink
Copy-Item .env.example .env
npm install
```

编辑 `.env`：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

不要在前端环境变量中放置 Supabase `service_role` 或其他私密密钥。

### 4.3 启动

```powershell
npm run dev
```

Vite 默认地址通常为：

```text
http://localhost:5173
```

### 4.4 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生成生产构建并清理冲突重定向文件 |
| `npm run preview` | 本地预览生产构建 |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run lint` | 执行 ESLint |
| `npm run lint:fix` | 自动修复可修复的 ESLint 问题 |

## 5. Supabase 初始化

在 Supabase SQL Editor 中按功能执行以下脚本：

1. `supabase/supabase-setup.sql`
2. `supabase/stories-forum-setup.sql`
3. `supabase/user-cocktails-setup.sql`
4. `supabase/avatar-storage-setup.sql`
5. `supabase/cocktail-images-storage-setup.sql`
6. `supabase/cocktail-crud-setup.sql`（已有项目升级时执行，新增更新时间与 CRUD/Storage 加固）
7. `supabase/games-realtime-setup.sql`（仅在启用联机牌局时需要）
8. `supabase/admin-moderation-setup.sql`

`supabase/supabase-schema.sql` 是早期/备用定义，不建议与最新 setup 脚本无差别重复执行。

### 5.1 Auth 控制台

在 Supabase Dashboard 中检查：

- Authentication → URL Configuration：
  - Site URL 设置为生产域名。
  - Redirect URLs 包含生产域名的 `/account`。
  - 本地开发时加入 `http://localhost:5173/account`。
- Authentication → Email Templates：
  - 魔法链接模式使用确认链接。
  - OTP 模式在模板中直接显示 `{{ .Token }}`。
- Authentication → SMTP Settings：
  - 生产环境使用自定义 SMTP。

### 5.2 Resend

项目不直接依赖 Resend SDK。Resend 通过 Supabase Auth 的 SMTP 集成提供邮件发送：

1. 在 Resend 验证发件域名。
2. 使用 Resend 的 Supabase Integration 自动连接项目，或在 Supabase 中填写 SMTP。
3. 使用真实发件地址，例如 `login@your-domain.com`。
4. 在 Resend Logs 中检查 `Delivered`、`Bounced` 和投诉记录。

建议在提高邮件发送额度前配置 CAPTCHA，防止机器人消耗邮件额度或损害发件域名信誉。

## 6. 常见使用流程

### 发布用户酒款

1. 登录账号。
2. 进入 `/cocktails`。
3. 点击列表顶部“＋ 新增调酒”。
4. 填写全部资料并选择 JPG/PNG 图片。
5. 发布后返回调酒菜单。

图片先上传到 Supabase Storage 的 `cocktail-images` bucket，再写入 `user_cocktails`。如果资料保存失败，前端会尝试清理已经上传的图片。

### 编辑和删除用户酒款

1. 登录酒款作者账号并打开自己投稿的酒款。
2. 点击“编辑酒款”进入 `/cocktails/:id/edit`。
3. 修改介绍、分类、配方或选择新图片并保存。
4. 返回调酒菜单后，页面会自动选中更新后的酒款。
5. 作者可点击“删除酒款”；管理员也可删除其他用户的违规酒款。

静态内置酒款没有编辑或删除入口。管理员只能删除他人酒款，不能代替作者修改内容。删除记录后前端会清理对应图片；如果 Storage 清理失败，界面会提示管理员检查孤立文件。

### 发布评论

1. 选择酒款。
2. 在详情底部填写 0–10 分评分和评论。
3. 登录用户可点赞或删除自己的评论。

评论目前通过酒款英文名 `cocktail_name` 关联，因此酒款英文名必须唯一且保持稳定。

### 管理内容

管理员权限存储在 Supabase `app_metadata.role`，不是用户可自行修改的 `user_metadata`。管理员可删除评论、论坛帖子、回复及用户酒款数据。

管理员角色改变后，需要刷新 Access Token 或重新登录，前端才能读取最新权限。

## 7. 构建与部署

### 7.1 生产构建

```powershell
npm run build
```

产物目录：

```text
dist/
```

### 7.2 Cloudflare Pages

```text
Build command: npm run build
Build output directory: dist
```

在 Cloudflare 构建环境中配置：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### 7.3 Wrangler

项目的 `wrangler.jsonc` 已将 `dist` 配置为 SPA 静态资源目录：

```powershell
npm run build
npx wrangler deploy
```

`scripts/clean-dist.mjs` 会在构建后删除可能导致 Cloudflare 重定向循环的 `dist/_redirects`。

## 8. 目录结构

```text
drink/
├─ public/                  # 直接复制到构建产物的资源
├─ src/
│  ├─ assets/               # Vite 打包资源
│  ├─ components/           # 可复用 Vue 组件
│  ├─ data/                 # 静态酒款数据
│  ├─ game/                 # 牌局引擎和机器人
│  ├─ lib/                  # Supabase 客户端、酒款 CRUD 工具及单元测试
│  ├─ router/               # Vue Router
│  ├─ stores/               # Pinia Store
│  ├─ styles/               # 全局样式
│  └─ views/                # 路由页面
├─ supabase/                # 数据库、RLS、Storage、Realtime SQL
├─ scripts/                 # 构建与资源生成脚本
├─ legacy/                  # 旧站备份，不参与当前构建
├─ PROJECT_DOCUMENTATION.md
├─ TECHNICAL_DOCUMENTATION.md
├─ API_DESIGN.md
├─ package.json
└─ vite.config.js
```

## 9. 资源维护

- `public/assets/`：菜单、背景、扑克牌等静态资源。
- `src/assets/`：需要由 Vite 处理的资源。
- `scripts/generate_poker_deck.py`：生成扑克牌资源。
- `scripts/build_menu_art_assets.py`：生成菜单美术资源。
- `scripts/extract_menu_line_glasses.py`：提取线条酒杯。
- `scripts/remake_menu_cutouts.py`：重制菜单透明切图。

部分 Python 脚本可能包含开发机器的资源绝对路径，换机器运行前应检查输入路径配置。

## 10. 已知限制

- 当前有用户酒款工具层 Vitest 单元测试，但尚未加入 Vue 组件测试和端到端测试。
- `GamesView.vue` 的联机牌局功能尚未接入公开路由。
- 评论按酒款英文名而不是 UUID 关联。
- 为避免历史评论失联，用户酒款英文名称在编辑模式下保持只读。
- 摇骰子、转盘和用户上传音频的数据只保存在当前浏览器。
- 管理员账号配置写在 SQL 初始化脚本中，部署其他环境前应修改。
- 论坛本地降级数据不会同步到 Supabase。
- 自定义酒款图片为公开资源，获得 URL 的用户可以访问。

## 11. 发布前检查

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Supabase URL 和 publishable/anon key 已配置
- [ ] Site URL 和 Redirect URLs 正确
- [ ] 自定义 SMTP 正常，真实邮箱测试为 Delivered
- [ ] 所有公开 schema 表已启用 RLS
- [ ] Storage 上传格式和大小限制正常
- [ ] 用户酒款新增、读取、编辑、删除流程正常
- [ ] 非作者无法编辑/删除，管理员可删除违规投稿
- [ ] 更新图片会清理旧图，失败会回滚新图
- [ ] 管理员 JWT 已刷新
- [ ] Cloudflare SPA 子路由可以直接访问
