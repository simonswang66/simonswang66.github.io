# UI Comment Tool — 需求文档

## 概述

搭建一套双端工具，用于 UI 原型图的评论协作：
- **Builder 端（配置工具）**：创建项目，上传原型图，导出分发包
- **Reviewer 端（评审工具）**：查看原型图，添加/拖拽/回复评论，导出/导入评论数据

纯 HTML/JS 单文件实现，无需服务器，浏览器直接打开即用。

开发工作流：`sample/review_sample.html`（迭代）→ `python3 sync_review.py`（同步到 root `review.html` 和 builder 模板）

---

## 一、Builder 端（builder.html）

### 1.1 上传图片
- 支持拖拽上传、点击上传、**剪贴板粘贴**（Ctrl+V / Cmd+V）多张 UI 原型图
- 按上传顺序排列，可拖拽调整顺序

### 1.2 页面配置
- 每张图片的**标题默认取文件名**（去掉扩展名），支持手动修改
- 图片原始尺寸自动读取
- 点击缩略图可**全屏放大查看**原图

### 1.3 项目配置
- 页面顶部居中显示**项目名称**输入框，字号较大（20px 加粗），默认为 "Untitled Project"
- 项目名称用于生成 zip 文件名和 Reviewer 页面标题
- Clear All 时同步清空项目名称

### 1.4 导出
- 点击导出按钮，生成 `{项目名称}.zip` 压缩包
- zip 包内包含：
  - `review.html` — 评审端页面（内嵌 page_data 配置和项目名称）
  - `page_data.json` — 页面结构数据
  - `badge_positions.json` — badge 坐标数据（空）
  - `images/` — 原始图片文件

### 1.5 主题切换
- 左侧按钮切换 Dark / Light 主题（偏好自动保存）
- 页面顶部固定（sticky），滚动时不随内容移动

---

## 二、Reviewer 端（review.html）

### 2.1 页面布局
- 顶部 Header 栏（sticky）：左侧主题切换按钮、中间项目名称（18px 加粗）、右侧 [Clear] 按钮 + [用户图标 + 昵称胶囊]
- 点击昵称胶囊可重置昵称
- Clear 按钮清空当前项目的所有本地评论数据
- Header / 左侧图片区 / 右侧评论列表 / 卡片 使用不同底色区分层次

### 2.2 昵称
- 首次打开弹出居中 Modal 输入昵称，存入 localStorage
- 后续打开自动读取，不再询问（除非手动重置）

### 2.3 页面浏览
- 左侧展示原型图，右侧展示当前页的评论卡片列表
- 底部导航按钮或键盘 ← → 切换页面

### 2.4 添加评论

- 点击底部 "+ Add" 按钮 → 弹出居中 Modal 表单：

| 字段 | 说明 |
|------|------|
| **分类** | Wording / UI/UX / Methodology / Question（下拉框选中后显示对应底色） |
| **标题** | 必填，简短标题文字。为空时输入框红色高亮提示，不弹窗 |
| **详情** | 详细描述文字 |
| **Reference**（可选）| 引用来源，如 SRS 章节号 |

- 提交后自动记录**提出人**（当前昵称）和**提出时间**
- Badge 出现在图片中央偏上默认位置，始终可拖拽调整
- 新建评论默认为 **saved** 状态

### 2.5 ID 生成规则
- 序号对应右侧卡片列表从上到下的顺序（不是 badge 位置）
- 新建评论永远排在该页列表最下方（最大序号）
- 拖拽卡片排序后全局重新编号
- 新增/删除后全局重新编号

### 2.6 评论状态

| 状态 | 说明 |
|------|------|
| **saved** | 默认状态。只能查看和回复，不可编辑字段 |
| **editing** | 点击 Edit 按钮进入。可编辑表单字段和 badge 位置 |

- 展开卡片 → 右上角出现编辑（笔形图标）和删除（垃圾桶图标）按钮
- 点击笔形图标 → 弹窗编辑 → Submit 后回到 saved 状态
- 关闭弹窗（Cancel）自动回到 saved 状态
- 展开/折叠卡片不影响状态

### 2.7 Badge 标记
- 原型图上显示彩色圆形标记，标注序号
- 颜色：蓝 `#2563EB` = Wording，橙 `#EA580C` = UI/UX，绿 `#16A34A` = Methodology，紫 `#7C3AED` = Question
- 未选中：浅色底 + 分类色边框 + 分类色数字
- 选中：实心底 + 白字 + 放大发光
- 坐标按原始图片尺寸像素存储，渲染时按比例换算
- **始终可拖拽**（不受 saved 状态限制），支持鼠标和触屏

### 2.8 拖拽卡片排序
- 卡片始终可拖拽排序
- 拖拽结束后序号重算

### 2.9 回复评论
- 展开卡片后底部显示回复区域
- 输入回复文本 → 提交，记录回复者昵称和时间
- 回复可删除（垃圾桶图标，确认后删除）

### 2.10 删除
- 卡片右上角垃圾桶图标 → 确认后删除（卡片 + badge 均移除）
- 回复垃圾桶图标 → 确认后删除该条回复

### 2.11 导出评论
- 点击 Export 按钮 → 下载 `comments_{时间戳}.json`
- JSON 包含所有页面的 badge 坐标、评论、回复

### 2.12 导入评论
- 点击 Import 按钮 → 选择 `.json` 文件
- 弹出覆盖警告 → 确认后覆盖当前数据

### 2.13 弹窗提示
- 所有 alert/confirm/prompt 替换为自定义居中 Modal（毛玻璃背景 + 入场动画）
- 中英文分行显示

### 2.14 localStorage 隔离
- 评论数据 key 包含项目名称（`review-{项目名}-comments`），不同项目数据互不干扰
- 昵称和主题偏好为全局共享

---

## 三、数据结构

### 3.1 page_data.json（Builder 生成）
```json
[
  {
    "num": "01",
    "module": "Step 1: KDC Delivery Confirmation",
    "img": "01 KDC delivery confirmation.png",
    "orig_size": [1880, 1126]
  }
]
```

### 3.2 comments.json（Reviewer 导出/导入）
```json
{
  "version": 1,
  "exportedAt": "2026-05-13T10:30:00",
  "exportedBy": "张三",
  "comments": [
    {
      "uuid": "a1b2c3d4",
      "pageNum": "01",
      "classification": "UIUX",
      "title": "Split scaling & info test",
      "detail": "...",
      "reference": "SRS 6.3 p28-32",
      "status": "saved",
      "author": "张三",
      "createdAt": "2026-05-13T09:15:00",
      "badge": {"x": 740, "y": 401},
      "replies": [
        {
          "author": "李四",
          "createdAt": "2026-05-13T11:00:00",
          "text": "已确认"
        }
      ]
    }
  ]
}
```

---

## 四、技术约束

- 纯 HTML/CSS/JS，零依赖（仅 JSZip CDN 用于 Builder 打包）
- localStorage 持久化，项目名称隔离 key
- UUID 稳定标识，全局序号展示用（可变化）
- 图片以原始文件保存于 `images/`，review.html 相对路径引用
- Badge 坐标像素值存储，渲染时比例换算
