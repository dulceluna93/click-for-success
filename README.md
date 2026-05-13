# Click for Success ✨

一个简洁而强大的任务完成计数器应用，让每一次完成都闪闪发光！

## 🎯 功能特性

### ✅ 核心功能
- **任务管理**: 输入任务名称和分步数量
- **进度追踪**: 实时进度条和百分比显示
- **计时功能**:
  - 正向计时：记录已花费时间
  - 倒计时：自定义分钟/秒，时间到自动提醒
- **完成按钮**: 点击完成一个任务，计数 +1
- **庆祝动画**: 3 种可选效果
  - 🎆 烟火
  - 🎈 气球
  - 🎉 彩带
- **本地存储**: 自动保存所有完成的任务到浏览器存储
- **历史记录**: 查看完成过的任务、耗时、完成时间等

## 🚀 快速开始

### 方式 1：直接打开（最简单）

```bash
# 克隆仓库
git clone https://github.com/dulceluna93/click-for-success.git
cd click-for-success

# 双击 index.html 在浏览器中打开
```

### 方式 2：使用本地服务器

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# 然后访问: http://localhost:8000
```

### 方式 3：使用 Live Server（VS Code）

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html` → "Open with Live Server"

## 📁 项目结构

```
click-for-success/
├── index.html      # 主页面结构
├── styles.css      # 样式表
├── script.js       # 核心逻辑
└── README.md       # 本文档
```

## 💻 使用说明

### 1. 创建任务
- 输入任务名称（如 "做题 10 题"）
- 输入分步数量（如 10）
- 点击 "开始任务"

### 2. 选择计时模式
- **正向计时**: 记录你已花费的时间
  - 点击 "开始" 开始计时
  - 点击 "暂停" 暂停计时
  - 点击 "重置" 重置计时器
  
- **倒计时**: 设定目标时间
  - 输入分钟和秒数
  - 点击 "开始" 开始倒计时
  - 时间到时会自动提醒和庆祝

### 3. 完成任务
- 每次完成一个任务，点击 "✓ 完成一个" 按钮
- 系统会自动：
  - 计数 +1
  - 更新进度条
  - 触发你选择的庆祝动画
  - 播放完成音效（可选）

### 4. 查看历史
- 点击 "查看历史" 查看所有完成过的任务
- 显示信息：任务名称、完成步数、耗时、计时、完成时间
- 点击 "清空历史" 删除所有记录

### 5. 选择庆祝效果
- 在 "选择庆祝效果" 部分选择你喜欢的动画
- 每次完成任务都会使用该效果

## 🎨 自定义指南

### 修改颜色
编辑 `styles.css`，找到 CSS 变量和颜色值：
```css
/* 主色调 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 按钮颜色 */
.btn-primary { background: #667eea; }
.btn-success { background: #48bb78; }
```

### 修改字体
编辑 `styles.css` 中的 `font-family`：
```css
font-family: 'Your Font Name', sans-serif;
```

### 修改动画
编辑 `script.js` 中的 `createFireworks()`、`createBalloons()`、`createConfetti()` 函数

## 📱 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- IE: ❌ 不支持

## 💾 数据存储

所有任务历史都存储在浏览器的 **LocalStorage** 中，不会上传到服务器。
- 清除浏览器缓存会删除历史记录
- 可以导出和备份数据（后续功能）

## 🔧 开发

### 技术栈
- HTML5
- CSS3
- Vanilla JavaScript (无框架，无依赖)

### 需要改进？
欢迎提 Issue 或 Pull Request！

## 📝 TODO 列表

- [ ] 外观升级成复古打字机风格
- [ ] 添加声音效果
- [ ] 支持任务分类
- [ ] 统计数据和图表
- [ ] 导出历史记录为 CSV/JSON
- [ ] 深色模式
- [ ] 移动端优化
- [ ] PWA 离线支持

## 📄 许可证

MIT License - 可自由使用和修改

## 🙌 鸣谢

感谢你使用 Click for Success！祝你完成所有的任务！✨

---

**提示**: 记得定期备份你的历史记录哦！🎯