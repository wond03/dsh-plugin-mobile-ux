# DSH 宿主模型（手机端适配参考）

> 这份文档是给「以后要改这个插件的人」看的，包括未来的我。
> 每一条都来自实测，不是推测。实测环境：`dsh 0.2.1-rc.5`，390×844，iPhone UA。
> **改任何东西之前先读它；如果改了行为，回来更新它。**

---

## 1. 布局骨架

宿主的外壳是一个 CSS Grid：

```
.pI_x6G_frame {
  display: grid;
  grid-template-columns: 56px 1fr;   /* 侧栏列 + 内容列 */
}
```

> `pI_x6G_` 是构建哈希前缀，每次升级都可能变。**选择器必须写成 `[class*='frame']`，不能写死类名。**

### 1.1 侧栏三态

| 状态 | 宽度 | 位置 | 触发 |
|---|---|---|---|
| rail（窄条） | 57px | 常驻左列 | 默认 |
| expanded（完整） | 281px | 占 grid 第一列 | 点「打开侧边栏」 |
| 我的抽屉态 | 281px | `position:fixed` + `translateX` | 被插件接管 |

插件做的事：把 `[class*='sidebarCol']` 从 grid 流里摘出来变成固定抽屉，
同时把 `frame` 的列改成 `1fr`（否则内容会被挤进 56px 那列）。

**注意**：宿主自己维护「折叠/展开」两个状态，宽 <100 就是折叠。插件要把抽屉展开成完整宽度，
必须替用户点一次宿主的 `button[aria-label='打开侧边栏']`——而且**不能只试一次**
（宿主渲染慢时会扑空，表现为"点了只出窄条，要再点一次"）。正确做法是每 100ms 重试，直到宽度 ≥100 或超时。

### 1.2 会话列表

容器是 `[role="tree"]`，每一项是 `[role="treeitem"]`。
点树内任意位置 = 切会话，所以点击处理必须用 `closest('[role="tree"]')` 判断，而不是按 y 坐标猜。

---

## 2. 视觉体系

### 2.1 字号变量（**最重要**）

宿主有一套独立排版变量，定义在 `assets/index-*.css`：

```
--dsw-font-family
--dsw-font-markdown-base          正文字号
--dsw-font-markdown-base-strong
--dsw-font-markdown-code          行内代码
--dsw-font-markdown-code-block    代码块
--dsw-font-markdown-code-font-family
--dsw-font-markdown-h1 / h2 / h3 / h4
--dsw-font-markdown-table / -table-head
--dsw-font-xs-13
```

设置页「字号大小 / 代码字号 / 终端字号」最终作用在这些变量上。

> **红线：插件里任何地方都不许写 `font-size`。**
> 一旦写死（哪怕是 `font-size:15px`），设置项就失效——这是真实踩过的坑：
> 我曾为防 iOS 聚焦缩放写了 `textarea{font-size:16px!important}` 和 `p{font-size:15px}`，
> 结果「字号大小」怎么调都没反应。
>
> 如果确实需要防 iOS 缩放：用 `-webkit-text-size-adjust:100%`，不要动 `font-size`。

### 2.2 弹层材质

宿主弹出菜单 = 外层 `[class*='surface']` + 内层 `[class*='material']`：

| 层 | 背景 | 模糊 |
|---|---|---|
| surface | `rgba(0,0,0,0)`（透明） | none |
| material | `rgba(67,69,74,0.45)` | `blur(40px) saturate(1.5)` |

所以菜单是**毛玻璃**：背后有内容时会透出模糊亮斑。这是宿主设计，不是 bug。
**红线：不许给 `[class*='surface']` 设 `max-width`**——会把菜单压窄、文字变省略号（实测 156px→144px）。

---

## 3. 层级（z-index）

实测各层（从高到低）：

| z-index | 元素 | 说明 |
|---|---|---|
| 1100 | 宿主二级菜单 | 会话右键菜单、更多菜单 |
| 1000 | 宿主弹窗 overlay | 设置、选目录 |
| 960 | `.dshm-burger` | 插件汉堡 |
| 940 | `[class*='sidebarCol']` | 插件抽屉 |
| 920 | `.dshm-scrim` | 插件遮罩 |
| 900 | `.dshm-gotop` | 回底按钮 |
| 20 | `[class*='overlayLayer']` | 宿主基础浮层 |

**红线：插件只用 900–999 区间。** 1000 以上会挡住宿主弹窗，造成"双层遮罩""按钮点不到"。

---

## 4. 只有鼠标能触发的交互（手机端缺口）

宿主有些操作只在 `:hover` 时展开，触屏永远触发不了。已确认的：

| 入口 | 表现 | 影响 |
|---|---|---|
| 会话项右侧操作区 | 未悬停时 `width:0; height:0` | **置顶/重命名/分叉/归档/复制 Session ID 在手机上不可达** |

实测：鼠标悬停 → 按钮展开 → 点开菜单；触摸长按 850ms → 仍 `0×0`；轻点 → 直接切会话。

> 结论：这 5 个功能在手机上目前用不了。用户已明确说"这部分不动"，所以不补。

---

## 5. 数据与状态

### 5.1 浏览器 localStorage（已确认的键）

| 键 | 内容 |
|---|---|
| `dsh.sessions.current` | 当前会话 id |
| `dsh.conversation.<sessionId>` | 草稿、视图状态 |
| `dsh.sidebar-right.v1.<sessionId>` | 右侧栏布局 |
| `dsh.workspace.view.v5` | 工作区视图分组/排序 |

**注意：字号设置不在这里。** 也不在 `/root/.dsh` 的 json 里（已 grep 确认），
推测在服务端 profile 的 UI 设置存储中——**这一点尚未定位到具体文件，标注为待确认**。

### 5.2 服务端

| 路径 | 内容 |
|---|---|
| `/root/.dsh/storages/workspace.json` | 工作区列表、会话归属、置顶/归档 |
| `/root/.dsh/profiles/web/cordis.patch.yml` | 插件装载、模型配置 |

工作区当前只有一个，`path` 指向 `/root/.dsh`（DSH 自己的配置目录）。
侧栏里显示为 `.dsh`——**它不是废弃文件夹**，是配置目录被当成了工作区。

---

## 6. 插件红线（写代码前逐条对照）

1. 不写 `font-size`，一律用 `--dsw-font-*` 或继承
2. 不设 `[class*='surface']` / `[class*='panel']` 的 `max-width`
3. `z-index` 只用 900–999
4. 所有 `!important` 必须写明"覆盖谁、为什么"
5. 选择器只用 `[class*='语义后缀']`，且必须能说清作用范围
6. 不改宿主 DOM 结构，只追加自己的节点
7. 每次改动必须用 `?dshm=off` 做对照测试，确认关闭后回到原版
8. 涉及宿主的点击/展开逻辑，一律用"重试直到达成"而不是"等固定毫秒"

---

## 7. 待确认清单（诚实标注，别装作知道）

- [ ] 字号设置具体写进哪个存储（浏览器 key 或服务端文件）
- [ ] `--dsw-font-markdown-base` 的默认值来源（CSS `:root` 还是运行时注入）
- [ ] `--trusted-host` 与反向代理下 DSH 自带认证的兼容方式
- [ ] 宿主是否有官方配置项可关闭 browserAuth（找不到，倾向没有）
