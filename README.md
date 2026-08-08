# 创作工作台 (creator-workbench)

单文件（HTML + CSS + JS）个人创作工作台：灵感收集、学习笔记、每日精选、跨设备云同步，并可安装为手机 App（PWA）。

## 在线地址（唯一对外地址）

- ✅ **当前正确地址**：`https://f369057a700a4141b6758d28187fab51.bj10.agentos-app.net`
- ❌ **旧地址（已弃用，代码过时，请勿使用）**：`https://3a7e1d6e1aba49e48fc76e5fe48fe461.bj7.agentos-app.net`

> CloudStudio 每次重新部署会生成新的沙箱与新 URL，旧地址随即作废。任何带 `bj7` 的链接都已失效，请统一使用上方 `bj10` 地址（建议收藏 / 设为手机主屏）。

## 代码仓库

- GitHub：`https://github.com/Ljh554-hub/creator-workbench`（**public**，默认分支 `main`）
- 本地路径：`C:\Users\29115\WorkBuddy\workbuddy-1\creator-workbench`

## 每日精选自动化（GitHub Actions）

- 工作流文件：`.github/workflows/daily-feed.yml`
- 触发时间：每天 **09:00（北京时间，cron `0 1 * * *` UTC）**，亦支持手动 `workflow_dispatch` 立即触发
- 产物：自动重新生成并提交 `autofeed/podcast.json` / `autofeed/express.json` / `autofeed/books.json`
- 生成脚本：`scripts/generate-feed.js`
- 数据源：工作台默认从 `https://raw.githubusercontent.com/Ljh554-hub/creator-workbench/main/autofeed/` 拉取；若检测到旧的 Gist 数据源地址，会在首次加载时自动迁移到该仓库 raw 地址。

## 跨设备同步

- **内容同步**：设置面板「GitHub 同步」→ 使用 GitHub Gist（token 仅需 `gist` 作用域），生成可直接在手机打开的同步链接（`#/sync/github/<gistId>`）。
- **每日精选**：所有设备从同一个公开仓库的 raw 地址拉取，天然一致，无服务器依赖。

## 本地维护

- 修改代码后重新部署：本地 `git push origin main`，再到 CloudStudio 重新部署（或临时注册 SSH deploy key 推送）。注意重新部署会更换 URL，请同步更新本 README 的「在线地址」一节。
- 仓库**必须保持 public**，否则 `raw.githubusercontent.com` 对私有仓库返回 404，部署站点将无法拉取精选数据。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `index.html` | 工作台主程序（含 PWA 注册逻辑） |
| `sw.js` | Service Worker（离线缓存应用壳） |
| `manifest.webmanifest` | PWA 安装清单 |
| `autofeed/` | 每日精选 JSON 数据（由 Actions 自动生成，勿手动改） |
| `scripts/generate-feed.js` | 每日精选生成脚本 |
| `.github/workflows/daily-feed.yml` | 每日自动化工作流 |
