# CLAUDE.md

This file extends `~/.claude/CLAUDE.md` (global user profile). Project-specific instructions below.

## Project

Simons Work Suites — personal tools suite hosted on GitHub Pages. Pure static HTML/CSS/JS files, no build step, no server.

## Structure

- `index.html` — tools suite landing page
- `counterparty-tool/index.html` — 交易对手方打标工具 (Ant Design + React via CDN)
- `ai-api-demo/` — AI API 调用演示
- `ui-comment-tool/` — UI 原型图评审协作工具
- `ui-design-samples/` — UI 设计风格组件预览
- `knowledge-base/` — 知识库，日常学习与知识总结
  - `index.html` — 文档列表页
- `baby-paradise/` — 宝宝乐园，给女儿玩的互动页面
  - `index.html` — 乐园入口，三个游戏卡片
  - `字母学习乐园.html` — 键盘字母/数字答题（看字母按对应键）
  - `魔法敲击乐园.html` — 自由敲击，字母蹦跳+音效+动画（保留 `event.repeat`，女儿喜欢长按听声音）
  - `趣味画板.html` — 三种绘画模式

### 趣味画板模式

| 模式 | 状态 | 说明 |
|------|------|------|
| 自由涂鸦 | ✅ | `i` 切换：悬浮笔（按下出墨）↔ 连续画（滑动即画，按压断笔换色，抬指 300ms 自动断笔换色） |
| 英文数字书写 | ✅ | 仅悬浮笔模式，底层显示淡灰大字，描满字符形状 80% 自动庆祝+换随机字符 |
| 你画我猜 | 🔜 | 占位 |

键盘快捷键：`i` 切换绘画模式，`e` 退出，`-`/`=`/`←`/`→` 调粗细，`C` 清空，`U` 撤销，`0`-`9` 换色，空格书写模式换字。

## Development

- All pages are browser-runnable — open any `.html` file directly
- No dependencies to install, no build commands
- `git push` deploys to GitHub Pages (SSH remote: `git@github.com:simonswang66/simonswang66.github.io.git`)
- Mac 触控板在浏览器中只暴露鼠标事件（光标坐标），不暴露手指绝对/相对位置
- 触控板两段按压：轻按 `mousedown`，Force Touch 重按 `webkitmouseforcewillbegin`→`webkitmouseforcedown`（Safari 可能拦截为查询弹窗）
- 中文输入法下 `[` `]` 键被拦截，用 `-`/`=`/`←`/`→` 替代
