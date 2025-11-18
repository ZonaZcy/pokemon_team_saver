# 宝可梦队伍管理器 🎮

> 纯静态的宝可梦对战队伍管理工具，可部署到 GitHub Pages

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ 特性

- ✅ **队伍管理** - 创建、查看、编辑、删除、复制、搜索队伍
- ✅ **Showdown 兼容** - 完美支持 Pokemon Showdown 格式导入/导出
- ✅ **详细信息** - 鼠标悬停显示招式/特性/道具描述
- ✅ **属性标签** - 18种宝可梦属性类型颜色标签
- ✅ **本地存储** - 所有数据保存在浏览器本地（localStorage）
- ✅ **隐私安全** - 零服务器请求，数据完全私密
- ✅ **响应式设计** - 支持桌面和移动设备
- ✅ **离线可用** - 除精灵图外，完全离线工作

## 🚀 快速开始

### 在线访问

访问 GitHub Pages 部署版本（将仓库部署后填写链接）

### 本地运行

#### 方法 1: Python（推荐）

```bash
cd static-site
python -m http.server 8000
# 访问 http://localhost:8000
```

#### 方法 2: Node.js

```bash
npm install -g http-server
cd static-site
http-server -p 8000
# 访问 http://localhost:8000
```

### 部署到 GitHub Pages

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

**快速部署：**

```bash
cd static-site
git init
git add .
git commit -m "Initial commit: Pokemon Team Manager"
git remote add origin https://github.com/YOUR-USERNAME/pokemon-team-manager.git
git branch -M main
git push -u origin main
```

然后在仓库设置中启用 Pages：Settings → Pages → Source: main branch

## 📖 使用说明

### 1. 导入队伍

点击"导入队伍"按钮，粘贴 Pokemon Showdown 格式的队伍：

```
Rillaboom @ Assault Vest
Ability: Grassy Surge
Level: 50
Tera Type: Fire
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- U-turn

Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
Tera Type: Ghost
EVs: 252 HP / 92 Atk / 4 Def / 156 SpD / 4 Spe
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot
```

### 2. 查看队伍详情

- 点击"查看"按钮打开详情视图
- 鼠标悬停在招式/特性/道具上查看详细描述
- 招式会显示彩色的属性类型标签

### 3. 管理队伍

- **复制队伍**: 快速创建队伍副本
- **导出队伍**: 复制到剪贴板，可粘贴到 Pokemon Showdown
- **删除队伍**: 永久删除（无法恢复，请谨慎操作）
- **搜索**: 按队伍名称、宝可梦名称搜索
- **筛选**: 按对战格式筛选队伍

### 4. 备份与恢复

- **备份所有队伍**: 下载 JSON 文件保存所有队伍
- **恢复队伍**: 暂不支持，建议定期备份重要队伍

## 🔒 数据隐私与安全

### 数据存储位置

**所有队伍数据仅存储在您的浏览器本地（localStorage），不会上传到任何服务器。**

- ✅ 完全本地存储，无服务器交互
- ✅ 其他人无法访问您的队伍数据
- ✅ 可按 F12 打开开发者工具验证无网络请求（仅精灵图从 Pokemon Showdown CDN 加载）
- ⚠️ 清除浏览器数据会删除所有队伍
- 💡 建议定期使用"备份所有队伍"功能导出备份

### 如何备份数据

1. 点击"备份所有队伍"按钮
2. 保存下载的 JSON 文件到安全位置
3. 定期重复此操作（建议每周备份一次）

## 📁 项目结构

```
static-site/
├── index.html                 # 主页面
├── DEPLOYMENT.md              # 部署指南
├── README.md                  # 项目说明
├── .gitignore                 # Git 忽略文件
├── css/
│   └── main.css              # 主样式文件
├── js/
│   ├── app.js                # 应用主逻辑
│   ├── teamManager.js        # 队伍管理器（localStorage）
│   └── showdownParser.js     # Showdown 格式解析器
├── data/
│   ├── abilities.json        # 特性数据（中英文）
│   ├── items.json            # 道具数据（中英文）
│   ├── moves.json            # 招式数据（中英文）
│   ├── pokedex.json          # 宝可梦图鉴
│   ├── forms_index.json      # 精灵图索引
│   ├── meta_names.json       # 格式名称映射
│   └── translate.json        # 翻译数据
└── images/
    ├── pokemonicons-sheet.png  # 宝可梦图标精灵图
    └── itemicons-sheet.png     # 道具图标精灵图
```

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript ES6+
- **存储**: localStorage API
- **构建**: 无需构建工具，纯静态文件
- **部署**: GitHub Pages / 任何静态托管服务

## 💡 常见问题

### Q: 为什么我的队伍数据消失了？

A: 队伍数据保存在浏览器的 localStorage 中。如果清除了浏览器数据或使用无痕模式，数据会丢失。建议：
- 定期使用"备份所有队伍"功能
- 不要在无痕/隐私模式下使用
- 重装浏览器前先备份数据

### Q: 可以在手机上使用吗？

A: 可以！网站采用响应式设计，完全支持移动设备。

### Q: 队伍数据会上传到服务器吗？

A: 不会！所有数据仅保存在您的浏览器本地，完全私密安全。您可以按 F12 打开开发者工具的网络面板验证。

### Q: 支持哪些对战格式？

A: 支持所有 Pokemon Showdown 的格式，包括：
- VGC 2025 (Regulation J, I, etc.)
- VGC 2024 (Regulation G, F, etc.)
- Doubles OU
- 以及其他所有格式

### Q: 如何备份我的队伍？

A: 点击"备份所有队伍"按钮会下载一个 JSON 文件，包含您所有的队伍数据。将此文件保存到安全位置即可。

### Q: 宝可梦精灵图无法显示？

A: 精灵图来自 Pokemon Showdown 的 CDN (`play.pokemonshowdown.com`)，需要网络连接。如果无法加载，请检查：
- 网络连接是否正常
- 是否被防火墙/广告拦截器阻止

### Q: 可以编辑已有队伍吗？

A: 当前版本暂不支持直接编辑。您可以：
1. 导出队伍到剪贴板
2. 修改文本
3. 删除原队伍
4. 重新导入修改后的队伍

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 可自由使用、修改和分发

## 🙏 致谢

- 数据来源: [Pokemon Showdown](https://play.pokemonshowdown.com/)
- 精灵图: Pokemon Showdown CDN
- 对战数据: [Smogon University](https://www.smogon.com/)

---

**享受管理您的宝可梦队伍！**

如有问题或建议，请访问 GitHub Issues 提交反馈。
