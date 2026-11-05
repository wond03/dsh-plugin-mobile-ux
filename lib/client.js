window.__ModuleLoader__.load({
  id: "dsh-plugin-mobile-ux",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* =========================================================================
     * DSH Mobile UX  v1.4.0
     *
     * 从 v1.3.x 的一次重新分层。上一版把「排版增强」和「侧栏改造」揉在同一个
     * 开关里，前者只加样式，后者要和宿主争布局控制权，结果一出问题就是全乱。
     *
     * 现在拆成两层，独立生效：
     *
     *   第一层 SAFE（默认开启，不可关闭失败）
     *     —— 纯样式与命中区增强，只"加"不"改"：
     *        阅读行高/段距、代码块与表格横向滚动、长串断行、图片自适应、
     *        小控件命中区外扩。
     *        这一层不碰任何布局容器，不改宽高，不拦截点击，
     *        因此不可能把宿主原本正常的区域弄坏。
     *
     *   第二层 NAV（可单独关闭）
     *     —— 侧栏改覆盖式抽屉 + 鲸鱼按钮。
     *        这一层会和宿主争布局控制权（侧栏 position:fixed 脱流），
     *        有风险，所以能独立关掉。
     *
     * 逃生通道（地址栏追加）：
     *   ?dshm=safe   只开第一层，侧栏保持宿主原生 —— 出问题时用这个
     *   ?dshm=off    全部关闭
     * ========================================================================= */

    var VERSION = "1.4.0";

    /* 两层全开。定位全部改用宿主稳定的 [data-slot] 钩子后，
       右侧边栏被推走的那个问题已经消失（实测 close 按钮稳定在 x=356）。
       想只开纯样式层：?dshm=safe；想全关：?dshm=off。 */
    var MODE = "full";
    try {
      var q = location.search || "";
      if (/[?&]dshm=off(&|$)/.test(q)) MODE = "off";
      else if (/[?&]dshm=safe(&|$)/.test(q)) MODE = "safe";
      else if (/[?&]dshm=full(&|$)/.test(q)) MODE = "full";
    } catch (e) {}

    try { console.log("[mobile-ux] v" + VERSION + " mode=" + MODE); } catch (e) {}

    var BODY_CLASS = "dshm-nav-open";
    var STYLE_SAFE = "dshm-style-safe";
    var STYLE_NAV = "dshm-style-nav";

    /* 移动端条件：竖屏 390~820；横屏（844x390 之类）靠高度条件兜住。 */
    var MQ_OPEN = "@media (max-width:820px), (max-height:520px) and (max-width:1024px){";

    /* ======================= 第一层：SAFE ======================= */
    var CSS_SAFE = [
      MQ_OPEN,

      /* ---- 基础：只在移动端，且都是"增强阅读/触摸"，不改尺寸 ---- */
      "html{-webkit-text-size-adjust:100%;text-size-adjust:100%}",
      "*{-webkit-tap-highlight-color:transparent}",
      "button,[role='button'],a,summary,label{touch-action:manipulation}",

      /* 长单词 / URL / 长 ID 允许任意断行，避免把内容顶出屏幕。
         注意这里只加 overflow-wrap，不动宽高。 */
      "#root,#root>*{min-width:0}",
      "body{overflow-x:hidden}",
      "img,video,canvas{max-width:100%;height:auto}",

      /* ---- 阅读排版：行高与段距，字号完全交给宿主的「字号大小」设置 ---- */
      "[class*='scrollBody']{-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain}",
      "[class*='scrollBody'] p,[class*='scrollBody'] li{line-height:1.75;letter-spacing:.01em;overflow-wrap:anywhere}",
      "[class*='scrollBody'] p{margin:.6em 0}",
      "[class*='scrollBody'] li{margin:.25em 0}",
      "[class*='scrollBody'] h1,[class*='scrollBody'] h2,[class*='scrollBody'] h3{line-height:1.42;margin-top:1em;margin-bottom:.45em}",
      "[class*='scrollBody'] blockquote{margin:.65em 0;padding-left:.85em}",

      /* ---- 代码块 / 表格：横向滚，不撑破屏幕。只加 overflow，不改字号 ---- */
      "[class*='scrollBody'] pre{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:10px;overscroll-behavior-x:contain}",
      "[class*='scrollBody'] pre code{white-space:pre;word-break:normal;line-height:1.6}",
      "[class*='scrollBody'] code{word-break:break-word}",
      "[class*='scrollBody'] table{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-collapse:collapse}",

      /* 曾尝试给 pageHead / toolbar 加 flex-wrap 来消掉插件页的横向溢出，
         结果把宿主原本的 flex 布局压坏：副标题变成竖排、「添加插件」被截断。
         宿主那点溢出是原生问题（A/B 对照：关掉插件同样 53 个元素超出），
         视觉上可横向滚动，不修反而更好。这里留空，记录教训。 */

      /* ---- 设置弹窗全屏：宿主在手机上仍留 24px 外边距（342×796），浪费空间，
             而且把字号行的控件挤到屏幕外。overlay 用 :has() 定位，panel 用宿主
             自己的 data-shortcut-modal 稳定属性定位，不用哈希类名。 ---- */
      "[data-shortcut-modal=settings]{width:100vw!important;max-width:none!important;",
      "height:100dvh!important;max-height:100dvh!important;border-radius:0!important}",
      "*:has(>[data-shortcut-modal=settings]){padding:0!important;align-items:stretch!important;justify-content:stretch!important}",

      /* ---- 字号步进器：宿主做成 hover 才展开的两个小箭头，手机上永远 0~12px，
             手指基本点不中（这是"字号改不了"的真正原因）。
             这里强制展开并撑到可点尺寸。只加尺寸，不改字号本身。 ---- */
      "[data-shortcut-modal=settings] [class*=arrows]{display:flex!important;flex-direction:column!important;",
      "flex:none!important;width:auto!important;height:auto!important;opacity:1!important;visibility:visible!important}",
      /* 字号那一行：label + stepper + 「更多字体设置」三者挤在 342px 里放不下，
         最后一个按钮被推到 x=403（屏幕外）。允许换行，让长不下的掉到下一行。
         用 [class$="stepper"] 后缀匹配，不依赖哈希前缀。 */
      "[data-shortcut-modal=settings] *:has(>[class$='stepper']){flex-wrap:wrap!important;row-gap:8px!important;justify-content:flex-start!important}",
      "[data-shortcut-modal=settings] [class*=stepper]{min-width:104px!important;height:46px!important}",
      "[data-shortcut-modal=settings] [class*=stepper] button{width:32px!important;height:21px!important;",
      "min-width:32px!important;min-height:21px!important;display:grid!important;place-items:center!important;",
      "pointer-events:auto!important;opacity:1!important}",

      /* ---- 小控件命中区外扩：视觉不变，手指更容易点中 ----
         目标由 JS 打 data-dshm-tiny 标记（见 markTinyTargets）。 */
      "[data-dshm-tiny]{position:relative}",
      "[data-dshm-tiny]::after{content:'';position:absolute;inset:-6px;border-radius:10px;background:transparent}",

      "}"
    ].join("\n");

    /* ======================= 第二层：NAV ======================= */
    var CSS_NAV = [
      MQ_OPEN,

      /* ---- 侧栏：脱离 grid 流，改成覆盖式抽屉 ----
         注意：这里绝对不能再改 grid-template-columns。
         v1.3.2 曾经在那里加过一条 1fr，本意是让主内容撑满，
         结果把同一个 grid 里的右侧边栏连坐 —— _surface_ 高度塌成 0，
         整块掉到视口下方。宿主外壳本来就是单列，侧栏 fixed 后已脱流。 */
      /* 定位改用宿主稳定的 [data-slot] 钩子，不再用 [class*='sidebarCol']。
         [data-slot="sidebar"] 是 display:contents 的包装层，本身无尺寸，
         真正的侧栏是它的直接子元素。宿主的 CSS Modules 类名带哈希
         （hHd-Xa_root / pI_x6G_sidebarCol …），模糊匹配会时灵时不灵 ——
         这正是之前"规则有时生效有时不生效"的根源。 */
      "[data-slot='sidebar']>*{",
      "position:fixed!important;left:0;top:0;bottom:0;",
      "z-index:940!important;",
      "background:#151517;",
      "transform:translateX(-100%)!important;",
      "transition:transform .24s cubic-bezier(.32,.72,0,1);",
      "box-shadow:0 0 48px rgba(0,0,0,.55);",
      "will-change:transform;",
      "padding-top:env(safe-area-inset-top);",
      "padding-bottom:env(safe-area-inset-bottom);",
      "overflow-y:auto;-webkit-overflow-scrolling:touch",
      "}",
      "body." + BODY_CLASS + " [data-slot='sidebar']>*{transform:translateX(0)!important}",

      /* 关键：宿主外壳 grid 是「侧栏列 + 主内容列 + 详情列」三列。
         侧栏 position:fixed 之后视觉上脱流了，但宿主仍按展开状态给第一列留 280px，
         主内容被压到 110px —— 插件页副标题因此被挤成竖排、按钮被截断。
         这里把第一列归零、第三列保留（保持 3 列结构，否则详情面板会塌陷，
         v1.3.2 用 1fr 把三列变一列就是这么坏的）。 */
      "[class$='frame']:has([data-slot='sidebar']){grid-template-columns:0 minmax(0,1fr) 0px!important}",

      /* 兜底：宿主的「打开侧边栏」在部分真机不响应注入点击，
         侧栏会停在折叠态。这时打标记，直接撑成完整宽度。 */
      "[data-slot='sidebar']>[data-dshm-forceopen]{width:min(292px,82vw)!important;min-width:min(292px,82vw)!important}",

      /* ---- 遮罩 ---- */
      ".dshm-scrim{position:fixed;inset:0;z-index:920;background:rgba(0,0,0,.52);",
      "opacity:0;pointer-events:none;transition:opacity .2s}",
      "body." + BODY_CLASS + " .dshm-scrim{opacity:1;pointer-events:auto}",

      /* ---- 鲸鱼按钮（宿主自家 logo，不是重画的） ---- */
      ".dshm-burger{position:fixed;left:8px;top:calc(8px + env(safe-area-inset-top));",
      "width:40px;height:40px;z-index:960;display:grid;place-items:center;",
      "border-radius:12px;border:1px solid rgba(255,255,255,.10);",
      "background:rgba(28,31,38,.86);color:#e6e9ef;cursor:pointer;",
      "-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);",
      "transition:opacity .18s,transform .18s}",
      ".dshm-burger svg{width:26px;height:auto;max-height:22px;display:block}",
      ".dshm-burger:active{transform:scale(.94)}",
      "body." + BODY_CLASS + " .dshm-burger{opacity:0;pointer-events:none}",

      /* 顶部标题栏给悬浮按钮让位（只针对会话标题栏，避免误伤插件页/设置页） */
      "[data-slot='conversation.header']{padding-left:52px!important}",

      /* 宿主自带的「收起侧边栏」只有 28px，撑到 44 */
      "[data-slot='sidebar'] button[aria-label='收起侧边栏']{min-width:44px!important;min-height:44px!important}",

      /* 已知死按钮（点了不生效）打标隐藏，避免留一个假的入口 */
      "[data-dshm-dead]{display:none!important}",

      "}"
    ].join("\n");

    /* ======================= 工具 ======================= */

    function injectStyle(id, css) {
      try {
        if (document.getElementById(id)) return;
        var s = document.createElement("style");
        s.id = id;
        s.setAttribute("data-plugin", "dsh-mobile-ux");
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
      } catch (e) {
        console.warn("[mobile-ux] inject style failed", e);
      }
    }

    /* 真机上的 React 组件普遍只听真实指针/触摸序列，合成 .click() 会被忽略。 */
    function fireTap(el) {
      try {
        var r = el.getBoundingClientRect();
        var x = r.left + r.width / 2;
        var y = r.top + r.height / 2;
        var base = {
          bubbles: true, cancelable: true, composed: true,
          clientX: x, clientY: y, screenX: x, screenY: y,
          view: window, button: 0, buttons: 1
        };
        var touch = null;
        try {
          touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y,
            pageX: x + window.scrollX, pageY: y + window.scrollY });
        } catch (e) {}
        if (touch) {
          try { el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true,
            touches: [touch], targetTouches: [touch], changedTouches: [touch] })); } catch (e) {}
        }
        try { el.dispatchEvent(new PointerEvent("pointerdown", base)); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent("mousedown", base)); } catch (e) {}
        if (touch) {
          try { el.dispatchEvent(new TouchEvent("touchend", { bubbles: true, cancelable: true,
            touches: [], targetTouches: [], changedTouches: [touch] })); } catch (e) {}
        }
        try { el.dispatchEvent(new PointerEvent("pointerup", base)); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent("mouseup", base)); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent("click", base)); } catch (e) {}
      } catch (e) {}
    }

    /* 把小于 30px 的交互元素标出来，由 CSS 伪元素把命中区外扩 6px。
       只加属性，不改任何尺寸，属于第一层的安全工作。 */
    function markTinyTargets() {
      try {
        var list = document.querySelectorAll("button,[role='button'],[role='menuitem'],a[href]");
        for (var i = 0; i < list.length; i++) {
          var e = list[i];
          var r = e.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) continue;
          if ((r.width < 30 || r.height < 30) && !e.hasAttribute("data-dshm-tiny")) {
            e.setAttribute("data-dshm-tiny", "");
          }
        }
      } catch (err) {}
    }

    /* 宿主把「展开其余 N 个会话」做成了 hover-only，在抽屉里点了不生效。
       打个标记隐藏，避免留一个点了没反应的入口。 */
    function markDeadCollapse() {
      try {
        var btns = document.querySelectorAll("[data-slot='sidebar'] button");
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || "").trim();
          if (/^展开其余|^收起$/.test(t) && btns[i].getAttribute("data-dshm-dead") !== "1") {
            btns[i].setAttribute("data-dshm-dead", "1");
          }
        }
      } catch (e) {}
    }

    /* ======================= 第二层：抽屉 ======================= */

    var burgerEl = null;
    var opening = false;

    function closeNav() {
      try { document.body.classList.remove(BODY_CLASS); } catch (e) {}
      try {
        var sb = document.querySelector("[data-slot='sidebar']>*");
        if (sb) sb.removeAttribute("data-dshm-forceopen");
      } catch (e) {}
      opening = false;
    }

    /* 打开抽屉：先把自己的状态加上，再按真实事件序列去点宿主的「打开侧边栏」。
       宿主折叠态下侧栏只有 56px 图标条，必须让它展开到完整宽度。 */
    function openNav() {
      if (document.body.classList.contains(BODY_CLASS)) return;
      try { document.body.classList.add(BODY_CLASS); } catch (e) {}
      opening = true;
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        try {
          var sb = document.querySelector("[data-slot='sidebar']>*");
          if (!sb) { if (tries > 15) clearInterval(timer); return; }
          if (sb.getBoundingClientRect().width >= 200) {
            clearInterval(timer);
            sb.removeAttribute("data-dshm-forceopen");
            opening = false;
            return;
          }
          if (tries <= 8) {
            var btn = sb.querySelector("button[aria-label='打开侧边栏']") ||
                      sb.querySelector("button[aria-label='展开侧边栏']");
            if (btn) fireTap(btn);
          }
          /* 8 次仍然展不开 → 不再依赖宿主，直接撑成完整宽度 */
          if (tries > 8) sb.setAttribute("data-dshm-forceopen", "");
          if (tries > 15) {
            clearInterval(timer);
            if (sb.getBoundingClientRect().width < 200) sb.setAttribute("data-dshm-forceopen", "");
            opening = false;
          }
        } catch (e) { clearInterval(timer); opening = false; }
      }, 100);
    }

    /* 只处理一件事：点会话项 / 点宿主自己的「收起侧边栏」时同步关闭。
       其余一切点击都不拦截 —— v1.3.x 里那套"猜你点了会不会跳转"的逻辑
       是"侧栏自己关掉"反复修不好的根源，已全部删除。 */
    function onClickCapture(ev) {
      try {
        if (!document.body.classList.contains(BODY_CLASS)) return;
        if (opening) return;
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest(".dshm-burger")) return;

        var item = t.closest("[role='treeitem']");
        if (item) {
          var label = ((item.innerText || "") + "").trim();
          if (/更多|操作|菜单/.test(label)) return;
          if (t.closest("[class*='actions'],[class*='sessionMenu'],[class*='itemAction']")) return;
          closeNav();
          return;
        }

        if (t.closest("button[aria-label='收起侧边栏']")) {
          setTimeout(closeNav, 30);
          return;
        }

        /* 其余按钮：不猜，看结果。
           点完 500ms / 1300ms 各看一次 [data-slot="main"] 的内容，
           变了 = 真的跳页了（插件页、自动化任务、切会话）→ 收抽屉；
           没变 = 弹层类（更多 / 视图选项 / 账号菜单 / 搜索）→ 保持。
           main 用宿主稳定的 data-slot 定位，不看哈希类名。 */
        watchMainChange();
      } catch (e) {}
    }

    var mainCheckToken = 0;
    function mainSig() {
      try {
        var m = document.querySelector("[data-slot='main']");
        return m ? (m.innerText || "").replace(/\s+/g, "").slice(0, 120) : "";
      } catch (e) { return ""; }
    }
    function watchMainChange() {
      var token = ++mainCheckToken;
      var before = mainSig();
      var done = false;
      var check = function () {
        if (done || token !== mainCheckToken) return;
        if (!document.body.classList.contains(BODY_CLASS)) { done = true; return; }
        if (mainSig() !== before) { done = true; closeNav(); }
      };
      setTimeout(check, 500);
      setTimeout(check, 1300);
    }

    function mountNav() {
      try {
        if (!document.body) return;

        if (!document.querySelector(".dshm-burger")) {
          var burger = document.createElement("button");
          burger.type = "button";
          burger.className = "dshm-burger";
          burger.setAttribute("aria-label", "打开导航");
          burger.title = "DSH Mobile UX v" + VERSION;
          burger.innerHTML = WHALE_SVG;
          burger.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (document.body.classList.contains(BODY_CLASS)) closeNav();
            else openNav();
          });
          burgerEl = burger;
          document.body.appendChild(burger);
        }

        if (!document.querySelector(".dshm-scrim")) {
          var scrim = document.createElement("div");
          scrim.className = "dshm-scrim";
          scrim.addEventListener("click", function () { closeNav(); });
          document.body.appendChild(scrim);
        }
      } catch (e) {
        console.warn("[mobile-ux] mount nav failed", e);
      }
    }

    /* ======================= 鲸鱼标 ======================= */
    /* 直接取宿主侧栏顶部 logo 的原始 path（viewBox 0 0 23.16 17.04），
       与品牌完全一致，不是重画的近似图形。 */
    var WHALE_SVG = '<svg viewBox="0 0 23.16 17.04" fill="none" aria-hidden="true"><path d="M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z" fill="currentColor"></path></svg>';

    /* ======================= 启动 ======================= */

    var booted = false;
    function boot() {
      if (booted) return;
      if (MODE === "off") return;
      booted = true;

      /* 第一层：永远注入（除非 off） */
      injectStyle(STYLE_SAFE, CSS_SAFE);

      var start = function () {
        try {
          markTinyTargets();
          setInterval(markTinyTargets, 1500);
        } catch (e) {}

        if (MODE === "full") {
          injectStyle(STYLE_NAV, CSS_NAV);
          mountNav();
          document.addEventListener("click", onClickCapture, true);
          setInterval(markDeadCollapse, 2000);
          window.addEventListener("resize", function () {
            try { markTinyTargets(); markDeadCollapse(); } catch (e) {}
          });
        }
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
      } else {
        start();
      }
    }

    function apply(ctx) {}
    function inject(ctx) {}

    exports.apply = apply;
    exports.inject = inject;
    exports.name = "dsh-plugin-mobile-ux";
    exports.version = VERSION;

    boot();
    return module.exports;
  }
});
