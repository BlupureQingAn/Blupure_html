# 蓝色纯度会客厅 · 动态作品集

> 蓝色纯度为骨，纯粹表达为魂 — 我个人的由 GitHub API 驱动的自动化数字作品展示空间

[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-002FA7?style=flat-square&logo=github)](https://pages.github.com/)

[![Made with](https://img.shields.io/badge/Made%20with-Vanilla%20JS-002FA7?style=flat-square)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)

## ✨ 设计理念

**蓝色纯度会客厅** 是一个回归纯净与聚焦的数字化展示空间。摒弃多余的信息噪声，将视觉权重完全交还给内容本身。网站以蓝色纯度（#002FA7）为核心视觉语言，营造冷静、深邃且富有当代感的浏览体验。

- 🎨 **色彩体系**：蓝色纯度主色调 + 极浅蓝氛围 + 高对比暗色文字
- 🧩 **自动化索引**：无需手动维护作品列表 — 系统自动扫描 `/works` 目录并生成卡片
- 🖼️ **智能元数据提取**：读取每个 HTML 作品的 `<title>`、`<meta name="description">` 及封面图
- 📱 **响应式布局**：从桌面端到移动端，网格与字体自适应
- ⚡ **优雅降级**：网络异常或 API 限流时展示友好提示，支持重试
