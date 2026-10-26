# EcomImg Downloader

一款 Chrome 浏览器扩展，用于一键收集电商详情页（淘宝、天猫、京东、拼多多、小红书、抖音等）的所有商品图片，并支持批量打包为 ZIP 下载。

## 功能特性

- 🔍 智能扫描 `<img>`、`<picture><source srcset>`、懒加载 `data-*`、`background-image` 等多种来源
- 🖼️ 弹窗内网格预览 + 点击勾选 / 全选
- 📦 选中后一键打包为 ZIP，纯本地处理，不上传服务器
- 🔒 Manifest V3 标准，无任何第三方 API 请求

## 快速安装

1. 下载并解压项目到本地
2. 打开 `chrome://extensions`，右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**，选择 `extension/` 文件夹
4. 工具栏出现 🛒 图标，即可在任意电商详情页使用

## 目录结构

```
EcomImgDownloader/
├── extension/          # Chrome 扩展源码（加载这个目录）
│   ├── manifest.json
│   ├── content.js      # 注入页面，收集图片 URL
│   ├── background.js   # Service Worker，消息中转 + 下载触发
│   ├── popup.html
│   ├── popup.js        # 用户界面逻辑 + ZIP 打包
│   └── jszip.min.js
└── site/               # 官网（可部署到 GitHub Pages）
    └── index.html
```

## 开源协议

MIT
