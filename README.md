# 🌟 星空日记 (Star Diary)

> 每篇日记化作一颗星星，挂在夜空中。写下回忆，点亮属于你的星空。

---

## 📱 在线版

**👉 [点击打开](https://wilsonss-huang.github.io/star-diary/)** — 手机/电脑浏览器都能用

## 💻 Windows 桌面版（下载）

**👉 [下载最新版](https://github.com/wilsonss-huang/star-diary/releases/latest)** — 下载 `星空日记 Setup 1.0.x.exe`

> 双击安装，后续版本自动更新，无需手动下载！

## 🤖 Android 手机版

**👉 [下载 Android 安装包（APK）](https://github.com/wilsonss-huang/star-diary/releases/download/v1.0.5/star-diary-v1.0.5-android.apk)** — `star-diary-v1.0.5-android.apk`

> 请用手机浏览器直接下载，完成后点开安装；不建议通过微信转发 APK，以免扩展名被改成 `.apk.1`。

Android 工程已接入 Capacitor，桌面图标与 Windows 版保持一致。

开发者构建：`npm run android:apk`。生成文件位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

> APK 不能像 Windows 程序一样静默自动更新：Android 会要求用户确认安装新版 APK。后续上架应用商店后，可由商店负责自动更新；若只更新网页资源，也可以另行接入安全的热更新服务。

---

## ✨ 功能

- 📱 **手机验证码登录** — 输入手机号 + 验证码，首次自动注册
- 🧠 **登录记忆** — 登录后自动记住，下次打开一键登录
- ☁️ **云端同步** — 日记自动保存到云端，换设备登录自动恢复
- ✏️ **编辑日记** — 支持修改已发布的日记
- 🔄 **更新机制** — Windows 版自动更新；Android APK 更新会由应用提示并经用户确认安装
- 📝 写日记 → 一颗星星出现在夜空中
- 😊 6 种情绪颜色（开心/难过/兴奋/平静/心动/沉思）
- 🔍 搜索 + 日期筛选，匹配的星星高亮连线
- ⭐ 收藏星星，侧边栏快速查看
- 🎥 点击星星，摄像机平滑推近
- 🌌 3D 星空，鼠标拖拽旋转缩放
- 📸 上传照片，有照片的星星上方显示金色光点

---

## 📋 更新日志

### v1.0.5
- 修复登录 token 过期后日记显示为空的问题

### v1.0.4
- 登录后主页过渡动画优化，消除卡顿
- 星空背景星星数量增加，视野更广阔
- 暗黑风格视觉统一

### v1.0.3
- 摄像机初始视角优化
- 设置面板版本号动态读取
- 设置面板增加更新日志

### v1.0.2
- 侧边栏重设计，鼠标悬停展开
- 新增账号菜单，切换/退出登录
- 暗黑风格全局统一
- 点击星星摄像机平滑推近
- 支持日记编辑
- 多处 bug 修复

### v1.0.1
- 星星渲染升级，三层叠加效果
- 照片上传功能完善
- 登录卡片液态玻璃风格重构

### v1.0.0
- 首个正式版发布

---

## 🛠 技术栈

React 19 · Three.js · TypeScript · Tailwind CSS · Framer Motion · Electron · CloudBase · Capacitor · Lucide React

## 🔒 隐私

日记数据存储在腾讯云 CloudBase，每位用户只能访问自己的日记。
