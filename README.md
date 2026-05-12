# 植语 · Plant Tracker

记录养花草绿植的个人 PWA：浇水/施肥打卡、物种养护知识、物品开支、经验笔记。

## 技术栈

| 层 | 选择 |
| --- | --- |
| 框架 | Next.js 15 (App Router) + React 19 + Server Actions |
| 样式 | Tailwind CSS v4 + 手写 shadcn 风格组件 |
| ORM | Drizzle ORM |
| 数据库 | libsql / SQLite（本地文件 → Turso 云端无缝切换） |
| 校验 | Zod |
| PWA | Serwist |
| 部署 | Vercel |

## 快速开始

```bash
# 1. 装依赖
npm install

# 2. 复制环境变量
cp .env.example .env

# 3. 把 schema 推到本地 SQLite（首次跑会创建 local.db）
npm run db:push

# 4. （可选）灌入示例物种
npm run db:seed

# 5. 起 dev
npm run dev
```

打开 http://localhost:3000，手机端建议在浏览器里"添加到主屏幕"。

## 上线（Turso + Vercel）

1. 在 [turso.tech](https://turso.tech) 创建一个数据库，拿到 URL 和 token。
2. 本地 `.env`：
   ```
   DATABASE_URL=libsql://your-db.turso.io
   DATABASE_AUTH_TOKEN=...
   ```
3. `npm run db:push` 把 schema 同步上去。
4. 把仓库连到 Vercel，并在 Vercel 项目里配置同样两个环境变量。
5. Push 即部署。

## 目录结构

```
app/
  layout.tsx            根布局 + PWA meta
  page.tsx              首页 / 今日仪表盘
  sw.ts                 Serwist service worker
  plants/               植物个体（列表 / 新增 / 详情 / 编辑）
  quick-log/            手机端一键打卡（PWA 首要入口）
  species/              物种库（养护建议）
  supplies/             物品 / 公共支出
  notes/                经验笔记
  actions/              Server Actions（plants/events/species/supplies/notes）
components/
  ui/                   Button / Card / Input / Badge 等基础组件
  bottom-nav.tsx        移动端底部导航 + 顶部栏
  quick-actions.tsx     植物快速打卡按钮组（client）
  delete-button.tsx     删除确认按钮（client）
lib/
  db/
    schema.ts           Drizzle schema + relations
    index.ts            libsql 客户端
    seed.ts             示例物种
  validations.ts        Zod schemas
  utils.ts              cn / 时间格式化 / 金额格式化
  constants.ts          事件类型、物品类型的元数据（emoji + 中文名）
public/
  manifest.json         PWA manifest
  icon.svg              占位 logo（建议替换成真实 png 图标）
drizzle.config.ts       Drizzle CLI 配置
next.config.mjs         Next + Serwist 包装
postcss.config.mjs      Tailwind v4 PostCSS plugin
```

## 数据模型

```
species         物种知识库（俗名/学名/科/分类/光水温湿/养护提示）
plants          植物个体（昵称、所属物种、位置、盆型、购入信息、状态）
care_events     养护事件（浇水/施肥/换盆/修剪/用药/观察/转盆/搬位）
supplies        公共支出（土/盆/工具/肥/药/种子/其他，含价格 + 剩余）
notes           经验笔记（带 tags，可关联到植物或物种）
photos          照片（关联植物或事件，schema 已建，上传 UI 待加）
```

## 已知 TODO

- 照片上传 UI（接 Vercel Blob 或 Cloudflare R2）
- 物品消耗与植物的关联（如：本次换盆用了 X 袋土）
- 离线写入队列（PWA 当前只缓存读，写还需要在线）
- 真实的 192/512 PNG 图标（目前 manifest 指了占位 svg）

## 开发命令速查

```bash
npm run dev          # 启动 dev (Turbopack)
npm run build        # 生产构建
npm run start        # 生产模式启动
npm run db:push      # 把 schema 直接同步到数据库（dev 用，不需要 migration 文件）
npm run db:studio    # 启动 Drizzle Studio (web UI 查看数据)
npm run db:seed      # 灌入示例物种
```
