window.__ModuleLoader__.load({
  id: "dsh-plugin-mobile-ux",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* ============================================================
     * DSH Mobile UX —— 手机端流畅操作 + 舒适阅读
     * 纯前端注入：一份 CSS + 少量 DOM 增强，不改宿主逻辑
     * 所有规则都包在 (max-width:820px) 里，桌面端零影响
     * ============================================================ */

    /* 逃生通道：地址后面加 ?dshm=off 即可让本插件完全不动作，
       用来和原版做 A/B 对照。注意：不能直接 return（宿主 loader 需要 factory 正常返回），
       只能在 boot 时跳过全部副作用。 */
    var DISABLED = false;
    try { DISABLED = /[?&]dshm=off(&|$)/.test(location.search); } catch (e) {}

    var STYLE_ID = "dsh-mobile-ux-style";
    var BODY_CLASS = "dshm-nav-open";

    var CSS = [
      /* ---------- 基础：触摸与文字缩放 ---------- */
      "@media (max-width: 820px) {",
      "html{-webkit-text-size-adjust:100%;text-size-adjust:100%}",
      "*{-webkit-tap-highlight-color:transparent}",
      "button,[role='button'],a,summary,label{touch-action:manipulation}",
      /* 防横向晃动（迁移自宿主补丁）：任何子元素都不许把根撑出视口 */
      "#root,#root>*{min-width:0}",
      "body{overflow-x:hidden}",

      /* iOS 聚焦输入框时不再自动放大页面 */
      /* 字号必须交给宿主的「字号大小」设置，这里只抑制 iOS 聚焦放大 */
      "textarea,input,[contenteditable='true']{-webkit-text-size-adjust:100%}",

      /* ---------- 侧栏：改为覆盖式抽屉，把宽度还给内容 ---------- */
      "[class*='sidebarCol']{",
      "position:fixed!important;left:0;top:0;bottom:0;",
      "z-index:940!important;",
      "background:#151517;",
      "transform:translateX(-100%)!important;",
      "transition:transform .24s cubic-bezier(.32,.72,0,1);",
      "box-shadow:0 0 48px rgba(0,0,0,.55);",
      "will-change:transform;",
      "padding-top:env(safe-area-inset-top);",
      "padding-bottom:env(safe-area-inset-bottom);",
      "overflow-y:auto;-webkit-overflow-scrolling:touch;",
      "}",
      "body." + BODY_CLASS + " [class*='sidebarCol']{transform:translateX(0)!important}",

      /* 关键：宿主外壳是 CSS Grid（列宽 56px + 内容），侧栏脱流后必须重排列宽，
         否则主内容会被挤进 56px 那一列。:has() 定位"含侧栏的 grid 容器"。 */
      "[class*='frame']:has([class*='sidebarCol']){grid-template-columns:1fr!important}",

      /* 遮罩 */
      ".dshm-scrim{position:fixed;inset:0;z-index:920;background:rgba(0,0,0,.52);",
      "opacity:0;pointer-events:none;transition:opacity .2s}",
      "body." + BODY_CLASS + " .dshm-scrim{opacity:1;pointer-events:auto}",

      /* 汉堡按钮 */
      ".dshm-burger{position:fixed;left:8px;top:calc(8px + env(safe-area-inset-top));",
      "width:40px;height:40px;z-index:960;display:grid;place-items:center;",
      "border-radius:12px;border:1px solid rgba(255,255,255,.10);",
      "background:rgba(28,31,38,.86);color:#e6e9ef;cursor:pointer;",
      "-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);",
      "transition:opacity .18s,transform .18s}",
      ".dshm-burger:active{transform:scale(.94)}",
      /* 抽屉打开时汉堡彻底让位：左上角还给宿主的 logo / 新会话，
         关闭交给右上角的「收起侧边栏」+ 点遮罩 + 点会话自动收起，不再多一个按钮。 */
      "body." + BODY_CLASS + " .dshm-burger{opacity:0;pointer-events:none}",
      /* 宿主自带的「收起侧边栏」只有 28px 宽，手机上不好点，撑到 44 */
      "[class*='sidebarCol'] button[aria-label='收起侧边栏']{min-width:44px!important;min-height:44px!important}",
      ".dshm-burger svg{width:20px;height:20px;display:block}",

      /* ---------- 顶部标题栏给悬浮汉堡让位，避免遮住标题首字 ---------- */
      /* 只给"会话标题栏"让位；插件页/设置页的 pageHead 不能被推右 */
      "header:has([class*='titleRow']){padding-left:52px!important}",
      /* 标题过长时给足空间，不要一上来就省略号 */
      "[class*='titleRow']{min-width:0}",

      /* ---------- 阅读排版 ---------- */
      "[class*='scrollBody']{-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;scroll-behavior:smooth}",
      "[class*='scrollBody'] p,[class*='scrollBody'] li{line-height:1.78;letter-spacing:.01em}",
      /* 长串（URL、ISO 时间戳、长 ID）允许在任意位置断行，避免整屏被顶开 */
      "[class*='scrollBody']{overflow-wrap:anywhere}",
      "[class*='scrollBody'] pre,[class*='scrollBody'] pre *{overflow-wrap:normal}",
      "[class*='scrollBody'] p{margin:.62em 0}",
      "[class*='scrollBody'] li{margin:.28em 0}",
      "[class*='scrollBody'] h1,[class*='scrollBody'] h2,[class*='scrollBody'] h3{line-height:1.42;margin-top:1.05em;margin-bottom:.5em}",
      "[class*='scrollBody'] blockquote{margin:.7em 0;padding-left:.85em}",

      /* 代码块：横向滚动，不撑破屏幕 */
      "pre{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;",
      "border-radius:10px;overscroll-behavior-x:contain}",
      "pre code{white-space:pre;word-break:normal;line-height:1.62}",
      "code{word-break:break-word}",

      /* 表格：可横向滑动 */
      "table{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-collapse:collapse}",

      /* 媒体不溢出 */
      /* 注意：不要给 svg 设 height:auto，会把图标高度算成小数、图标轻微变形 */
      "img,video,canvas{max-width:100%;height:auto}",

      /* ---------- 输入区：贴底 + 安全区 + 大触摸目标 ---------- */
      "[class*='composerStack']{padding-bottom:max(10px,env(safe-area-inset-bottom))!important}",
      "[class*='composerStack'] textarea,[class*='composerStack'] [contenteditable='true']{max-height:42vh!important;line-height:1.55}",
      "[class*='composerStack'] button{min-width:40px;min-height:40px}",
      /* 侧栏图标别太小，至少 40px 触摸高度（原 36px） */
      "[class*='sidebarCol'] button{min-height:40px}",

      /* ---------- 面板/设置页：防横向溢出 ---------- */
      "[class*='panelBody'],[class*='tabLayout']{max-width:100%!important;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}",
      "[class*='panelBody'] [class*='surface']{max-width:100%!important}",
      /* 插件/设置列表容器比父级宽 8px，导致可左右晃动。
         关键：绝不能写 [class*='surface'] —— 宿主的弹出菜单（下载/反馈、插件菜单、
         会话右键菜单）都带 surface，一旦限死 max-width:100%，菜单会被压窄、
         文字变省略号（实测 156px→144px，"下载 Session 日志"被截成"下载 Sess..."）。
         同理所有规则都收进 panelBody 作用域，不碰浮层。 */
      "[class*='panelBody'] [class*='installedPanel'],[class*='panelBody'] [class*='cards'],[class*='panelBody'] [class*='group']{max-width:100%!important;box-sizing:border-box}",
      /* 卡片自身带了 margin:0 -8px（为了让 hover 底色延伸出父容器内边距），
         窄屏下右侧多出 8px，整页可以左右拖动 —— 只收掉右侧那一半。 */
      "[class*='cards']>*{margin-right:0!important}",

      /* 列表里的说明文字单行省略太狠，手机上放两行 */
      "[class*='cards'] [class*='desc'],[class*='group'] [class*='desc']{-webkit-line-clamp:2!important;white-space:normal!important;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical}",

      /* ---------- 回到底部 ---------- */
      ".dshm-gotop{position:fixed;right:12px;bottom:calc(176px + env(safe-area-inset-bottom));",
      "width:38px;height:38px;border-radius:50%;z-index:900;display:grid;place-items:center;",
      "border:1px solid rgba(255,255,255,.12);background:rgba(28,31,38,.9);color:#e6e9ef;",
      "box-shadow:0 6px 20px rgba(0,0,0,.4);cursor:pointer;",
      "opacity:0;transform:translateY(8px);pointer-events:none;",
      "transition:opacity .2s,transform .2s}",
      ".dshm-gotop.show{opacity:1;transform:translateY(0);pointer-events:auto}",
      ".dshm-gotop:active{transform:scale(.92)}",
      ".dshm-gotop svg{width:18px;height:18px}",

      /* ---------- 宿主缺陷修复：去掉冗余入口 ---------- */
      /* 会话页中间那个 ⋯ 名叫「更多会话视图」，点开只有「浏览更多插件 / 创建你的插件」，
         和侧栏的「插件」入口完全重复；手机上还和「对话/轨迹」标签挤在一起。直接隐藏。 */
      "button[aria-label='更多会话视图']{display:none!important}",
      /* 注：右侧栏入口（打开右侧边栏）保留 —— 它承载文件预览/多标签，手机上仍有用，不能一刀切 */

      /* ---------- 设置面板：手机上全屏（迁移自宿主补丁，见 CHANGELOG） ---------- */
      /* .VOzbGW_* 是宿主构建产物类名；宿主升级后若类名变化，本段自动失效，不影响其它功能 */
      "@media (max-width:768px), (max-height:520px) and (max-width:1024px){ .VOzbGW_overlay{inset:0!important;padding:0!important;align-items:stretch!important;justify-content:stretch!important} .VOzbGW_mask{display:none!important} .VOzbGW_panel{width:100%!important;max-width:none!important;height:100vh!important;height:100dvh!important;border-radius:0!important;box-shadow:none!important;flex-direction:column!important} .VOzbGW_nav{width:100%!important;flex:none!important;flex-direction:column!important;gap:6px!important;padding:calc(env(safe-area-inset-top,0px) + 8px) 12px 0;border-bottom:1px solid var(--dsw-alias-border-l2)} .VOzbGW_navTitle{padding:0 2px;font-size:15px;line-height:22px} .VOzbGW_navList{flex-direction:row!important;flex-wrap:wrap!important;gap:6px!important;overflow:visible!important;padding:0 2px 10px} .VOzbGW_navCell{flex:1 1 calc(50% - 3px)!important;justify-content:center;height:34px;padding:0 12px;border-radius:999px;gap:6px;font-size:13px;line-height:20px;background:0 0;color:var(--dsw-alias-label-secondary)} .VOzbGW_navCell.VOzbGW_active{background:var(--dsw-specific-sidebar-nav-item-active);color:var(--dsw-alias-label-primary);font-weight:500} .VOzbGW_navLabel{flex:0 1 auto;min-width:0;text-overflow:ellipsis} .VOzbGW_navIcon{width:14px;height:14px} .VOzbGW_content{flex:1!important;min-height:0!important} .VOzbGW_header{height:auto;padding:2px 10px 2px 12px;align-items:center} .VOzbGW_close{width:36px!important;height:36px!important} .VOzbGW_options{padding:0 16px calc(env(safe-area-inset-bottom,0px) + 20px);overscroll-behavior:contain} [data-shortcut-modal=settings] .Pt1bsG_row{flex-direction:column;align-items:stretch;gap:10px} [data-shortcut-modal=settings] button:not([class*=switch]):not([class*=arrow]){min-height:34px} [data-shortcut-modal=settings] input:not([type=checkbox]):not([type=radio]):not([type=range]),[data-shortcut-modal=settings] select,[data-shortcut-modal=settings] textarea{min-height:36px;font-size:16px} [data-shortcut-modal=settings] [class*=arrows]{display:none} [data-shortcut-modal=settings] input[class*=input]{padding-right:12px} [data-shortcut-modal=settings] button[class*=iconButton],[data-shortcut-modal=settings] button[class*=expander]{min-width:34px} [data-shortcut-modal=settings] button[class*=switch]{position:relative} [data-shortcut-modal=settings] button[class*=switch]::after{content:'';position:absolute;inset:-7px} [data-shortcut-modal=settings] .qSYn7G_groupTitleRow{flex-wrap:wrap;row-gap:6px} [data-shortcut-modal=settings] .qSYn7G_switcherLabel{max-width:160px} [data-shortcut-modal=settings] .rtSEdW_cards{grid-template-columns:minmax(0,1fr)} [data-shortcut-modal=settings] .rtSEdW_cardHead{flex-wrap:wrap} [data-shortcut-modal=settings] .rtSEdW_cardIdentity{flex-wrap:wrap;row-gap:4px} [data-shortcut-modal=settings] .rtSEdW_cardFoot{overflow:hidden} } @media (min-width:600px){ .VOzbGW_navCell{flex:0 1 auto} } @media (max-width:360px){ .VOzbGW_navIcon{display:none} }",

      /* 减少动画偏好：省电、更跟手 */
      "@media (prefers-reduced-motion: reduce){",
      "[class*='sidebarCol'],.dshm-scrim,.dshm-gotop,.dshm-burger{transition:none!important}",
      "[class*='scrollBody']{scroll-behavior:auto}",
      "}",
      "}",
    ].join("\n");

    function injectStyle() {
      try {
        if (document.getElementById(STYLE_ID)) return;
        var s = document.createElement("style");
        s.id = STYLE_ID;
        s.setAttribute("data-plugin", "dsh-mobile-ux");
        s.textContent = CSS;
        (document.head || document.documentElement).appendChild(s);
      } catch (e) {
        console.warn("[mobile-ux] inject style failed", e);
      }
    }

    var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    var ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';

    function makeButton(cls, html, label) {
      var b = document.createElement("button");
      b.className = cls;
      b.type = "button";
      b.setAttribute("aria-label", label);
      b.innerHTML = html;
      return b;
    }

    var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var burgerEl = null;

    /* 开关抽屉的唯一出口：保证图标和 body class 永远同步，
       否则会出现"点了看不到反馈、要再点一次"的错觉。 */
    function closeNav() {
      try { document.body.classList.remove(BODY_CLASS); } catch (e) {}
      try { if (burgerEl) burgerEl.innerHTML = ICON_MENU; } catch (e) {}
    }

    function mountUI() {
      try {
        if (!document.body) return;
        if (!document.querySelector(".dshm-burger")) {
          var burger = makeButton("dshm-burger", ICON_MENU, "打开导航");
          burgerEl = burger;
          burger.addEventListener("click", function () {
            /* 再点一次 = 关闭（用户直觉） */
            if (document.body.classList.contains(BODY_CLASS)) { closeNav(); return; }
            document.body.classList.add(BODY_CLASS);
            burger.innerHTML = ICON_CLOSE;
            /* 一次点击就要看到完整侧栏（会话列表）。宿主有时渲染慢，
               单次 60ms 容易扑空 → 改成每 100ms 重试，直到宽度够或超时。 */
            var tries = 0;
            var timer = setInterval(function () {
              tries++;
              try {
                var sb = document.querySelector("[class*='sidebarCol']");
                if (!sb || tries > 15 || sb.getBoundingClientRect().width >= 100) {
                  clearInterval(timer); return;
                }
                var openBtn = sb.querySelector("button[aria-label='打开侧边栏']");
                if (openBtn) openBtn.click();
              } catch (e) { clearInterval(timer); }
            }, 100);
          });
          document.body.appendChild(burger);
        }
        if (!document.querySelector(".dshm-scrim")) {
          var scrim = document.createElement("div");
          scrim.className = "dshm-scrim";
          scrim.addEventListener("click", function () {
            closeNav();
          });
          document.body.appendChild(scrim);
        }
        if (!document.querySelector(".dshm-gotop")) {
          var top = makeButton("dshm-gotop", ICON_DOWN, "回到最新");
          top.addEventListener("click", function () {
            var el = findScroller();
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          });
          document.body.appendChild(top);
        }
      } catch (e) {
        console.warn("[mobile-ux] mount ui failed", e);
      }
    }

    function findScroller() {
      var list = document.querySelectorAll("[class*='scrollBody']");
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.clientHeight > 200 && el.scrollHeight > el.clientHeight) return el;
      }
      var best = null;
      var max = 0;
      var all = document.querySelectorAll("div");
      for (var j = 0; j < all.length; j++) {
        var d = all[j];
        var cs = getComputedStyle(d);
        if (/auto|scroll/.test(cs.overflowY) && d.scrollHeight > d.clientHeight && d.clientHeight > max) {
          max = d.clientHeight;
          best = d;
        }
      }
      return best;
    }

    var boundScroller = null;
    function bindScroll() {
      try {
        var el = findScroller();
        if (!el || el === boundScroller) return;   // 已经绑过同一个容器，跳过
        boundScroller = el;
        var ticking = false;
        var update = function () {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(function () {
            ticking = false;
            var btn = document.querySelector(".dshm-gotop");
            if (!btn) return;
            var away = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (away > 320) btn.classList.add("show");
            else btn.classList.remove("show");
          });
        };
        el.addEventListener("scroll", update, { passive: true });
        update();   // 绑定后立刻按当前位置判定一次
      } catch (e) {
        console.warn("[mobile-ux] bind scroll failed", e);
      }
    }

    /* 输入框会随行数变高（多行输入时能顶到屏幕中部），
       回底按钮必须跟着输入框顶部走，否则会被输入框压住。 */
    function syncGotopPos() {
      try {
        var c = document.querySelector("[class*='composerStack']");
        var g = document.querySelector(".dshm-gotop");
        if (!c || !g) return;
        var top = c.getBoundingClientRect().top;
        var gap = window.innerHeight - top + 16;   // 距视口底部 = 输入框高度 + 10
        g.style.bottom = Math.max(64, Math.round(gap)) + "px";
      } catch (e) {}
    }

    var composerObserver = null;
    function watchComposer() {
      try {
        if (composerObserver) return;
        var c = document.querySelector("[class*='composerStack']");
        if (!c) return;
        composerObserver = new ResizeObserver(function () { syncGotopPos(); });
        composerObserver.observe(c);
        syncGotopPos();
      } catch (e) {}
    }

    /* 宿主的滑入面板（设置 / 插件 / 内置插件）在手机上写死 max-width:370px，
       又贴左定位，于是右边留出 20px 一条背景，看着像"页面没铺满"。
       只处理同时满足「fixed + 贴左 + 宽 240~视口 + 高 >300」的面板，
       避免误伤卡片、popover、侧栏（侧栏 left 是负值，天然排除）。 */
    function fixWidePanels() {
      try {
        var vw = window.innerWidth;
        if (vw > 820) {
          var wide = document.querySelectorAll("[data-dshm-wide]");
          for (var k = 0; k < wide.length; k++) {
            wide[k].style.removeProperty("max-width");
            wide[k].style.removeProperty("width");
            wide[k].style.removeProperty("flex");
            wide[k].style.removeProperty("box-sizing");
            wide[k].removeAttribute("data-dshm-wide");
          }
          return;
        }
        var list = document.querySelectorAll("[class*='panel']");
        for (var i = 0; i < list.length; i++) {
          var el = list[i];
          if (el.getAttribute("data-dshm-wide") === "1") continue;
          var cs = window.getComputedStyle(el);
          var r = el.getBoundingClientRect();
          if (r.width < 240 || r.width >= vw - 1) continue;
          if (r.height < 300) continue;
          if (Math.abs(r.left) > 2) continue;
          /* 只处理"确实被 max-width 卡住"的：宽度和上限几乎相等，才动手 */
          var mw = parseFloat(cs.maxWidth);
          if (!mw || !isFinite(mw)) continue;
          if (Math.abs(r.width - mw) > 2) continue;
          if (mw >= vw) continue;
          el.setAttribute("data-dshm-wide", "1");
          el.style.setProperty("max-width", "none", "important");
          el.style.setProperty("width", vw + "px", "important");
          el.style.setProperty("flex", "0 0 auto", "important");
          el.style.setProperty("box-sizing", "border-box", "important");
        }
      } catch (e) {}
    }

    /* 会话切换会换掉滚动容器，所以要持续盯着 */
    function watchScroller() {
      bindScroll();
      watchComposer();
      syncGotopPos();
      fixWidePanels();
      setInterval(function () {
        bindScroll();
        watchComposer();
        syncGotopPos();
        fixWidePanels();
        syncPanelGuard();
      }, 1200);
    }

    /* 宽侧栏打开时，点任何导航项/会话项就收起。
       用"点击位置落在侧栏宽度内 + 目标是按钮/链接"判断，而不用 DOM 祖先判断——
       宿主的部分列表是 Portal 渲染的，closest() 找不到 sidebarCol。 */
    /* 点侧栏条目后，只在"确实发生了页面导航"时才收起抽屉。
       判断依据（280ms 后）：
         · 弹出了菜单/对话框/浮层  → 宿主的原地操作，保持抽屉不动；
         · 侧栏内新出现了输入框     → 例如"搜索会话"，同样保持；
         · 以上都没有              → 认定为导航（新建会话/切会话/进插件页），收起抽屉。 */
    /* 宿主自己打开弹窗（选目录、设置、确认框）时，会把一个全屏 fixed 层挂到 body 上，
       z-index 通常 ≥1000。此时必须把我们的抽屉状态清掉，否则会出现"我的遮罩 + 它的弹窗"双层，
       看起来就是背景被压暗两次、侧栏边缘还露在外面。 */
    function hostModalOpen() {
      var kids = document.body.children;
      for (var i = 0; i < kids.length; i++) {
        var e = kids[i];
        if (!e || e.nodeType !== 1) continue;
        if (e.classList && (e.classList.contains("dshm-scrim") || e.classList.contains("dshm-burger") || e.classList.contains("dshm-gotop"))) continue;
        var cs = getComputedStyle(e);
        if (cs.position !== "fixed") continue;
        var r = e.getBoundingClientRect();
        if (r.width < window.innerWidth * 0.8 || r.height < window.innerHeight * 0.8) continue;
        if (parseInt(cs.zIndex || "0", 10) >= 1000) return true;
      }
      return false;
    }

    var modalObserver = null;
    /* ---------------------------------------------------------------
     * 返回键守卫
     *
     * 宿主的面板切换（插件页 / 设置页）不写浏览器历史：URL 不变、
     * history.length 不变。手机按返回键时浏览器无处可退，直接退出应用
     * 回到浏览器主页。用户预期是"回到上一屏"。
     *
     * 做法：面板可见时补一条历史 → 返回键先消耗这条 → popstate 里
     *       把"退出"翻译成"回会话"。
     * 只做这一件事，不碰 DOM、不加按钮、不改 z-index。
     * ------------------------------------------------------------- */
    var panelGuard = false;

    function isPanelOpen() {
      var els = document.querySelectorAll("[class*='pageHead'],[class*='VOzbGW_panel']");
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        var cs = getComputedStyle(els[i]);
        /* pageHead 只是标题栏（高约 60px），不能按"整个面板"的高度判断；
           VOzbGW_panel 才是整块设置面板。所以只要求有像样的宽度和高度。 */
        if (r.width > 100 && r.height > 40 && cs.display !== "none" && cs.visibility !== "hidden") return true;
      }
      return false;
    }

    function backToChat() {
      try {
        if (!document.body.classList.contains(BODY_CLASS)) document.body.classList.add(BODY_CLASS);
        setTimeout(function () {
          try {
            var sid = null;
            try { sid = (JSON.parse(localStorage.getItem("dsh.sessions.current") || "{}") || {}).sessionId; } catch (e) {}
            var items = document.querySelectorAll("[role='treeitem']");
            var t = null;
            for (var i = 0; i < items.length; i++) {
              if (sid && ((items[i].innerHTML || "").indexOf(sid) >= 0)) { t = items[i]; break; }
            }
            if (!t && items.length) t = items[0];
            if (t) {
              var hitEl = t.querySelector("button,[role='button']") || t;
              var rr = hitEl.getBoundingClientRect();
              var cx = rr.left + Math.min(rr.width / 2, 80), cy = rr.top + rr.height / 2;
              /* React 只认真实事件序列，element.click() 不够 */
              ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(function (ty) {
                try {
                  var C = (ty.indexOf("pointer") === 0) ? PointerEvent : MouseEvent;
                  hitEl.dispatchEvent(new C(ty, {
                    bubbles: true, cancelable: true, view: window,
                    clientX: cx, clientY: cy, pointerId: 1, isPrimary: true, button: 0
                  }));
                } catch (e) {}
              });
            }
            setTimeout(closeNav, 200);
          } catch (e) { closeNav(); }
        }, 400);
      } catch (e) {}
    }

    function syncPanelGuard() {
      try {
        var open = isPanelOpen();
        if (open && !panelGuard) {
          panelGuard = true;
          try { history.pushState({ dshmPanel: 1 }, ""); } catch (e) {}
        } else if (!open && panelGuard) {
          panelGuard = false;
        }
      } catch (e) {}
    }

    window.addEventListener("popstate", function () {
      if (!panelGuard) return;
      panelGuard = false;
      try { history.pushState({ dshmPanel: 1 }, ""); } catch (e) {}
      /* 直接开抽屉让用户选会话 —— 这是目前唯一稳定有效的退法：
         宿主没有暴露"关闭面板"的 API，程序化点击 treeitem 无法触发它的
         React 处理（只有真实触摸才行）。开抽屉至少保证"返回不退应用"，
         而且用户一眼能看到该点哪里。 */
      try {
        if (!document.body.classList.contains(BODY_CLASS)) document.body.classList.add(BODY_CLASS);
      } catch (e) {}
    });

    function watchModal() {
      if (modalObserver) return;
      var timer = null;
      modalObserver = new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          try {
            if (document.body.classList.contains(BODY_CLASS) && hostModalOpen()) {
              closeNav();
            }
          } catch (e) {}
        }, 120);
      });
      modalObserver.observe(document.body, { childList: true, subtree: false });
    }

    function overlayCount() {
      var n = 0;
      var list = document.querySelectorAll('[role="menu"],[role="dialog"],dialog,[class*="menu"],[class*="popover"],[class*="dropdown"]');
      for (var i = 0; i < list.length; i++) {
        var r = list[i].getBoundingClientRect();
        var cs = getComputedStyle(list[i]);
        if (r.width > 20 && r.height > 10 && cs.visibility !== "hidden" && cs.opacity !== "0") n++;
      }
      return n;
    }

    /* 长按 / 右键 会弹出宿主自己的会话操作菜单（置顶、重命名、分叉、归档、复制 ID）。
       如果这时把抽屉收起来，菜单连着锚点一起消失 —— 用户感知就是"长按了一下，抽屉闪没了"。
       用 contextmenu 时间戳 + pointerdown 长按时长两个信号挡掉这类 click。 */
    var _ctxAt = 0, _downAt = 0;
    function watchLongPress() {
      document.addEventListener("contextmenu", function () { _ctxAt = Date.now(); }, true);
      document.addEventListener("pointerdown", function () { _downAt = Date.now(); }, true);
    }

    function onClickCapture(ev) {
      try {
        if (!document.body.classList.contains(BODY_CLASS)) return;
        if (Date.now() - _ctxAt < 1200) return;                     // 刚弹过右键/长按菜单
        if (_downAt && Date.now() - _downAt > 550) return;           // 长按后松手产生的 click
        var sb = document.querySelector("[class*='sidebarCol']");
        if (!sb) return;
        if (sb.getBoundingClientRect().width < 100) return;
        var t = ev.target;
        if (!t || !t.closest) return;
        var btn = t.closest("button,a,[role='button'],[role='menuitem'],[class*='title']");
        if (!btn) return;
        if (btn.classList && btn.classList.contains("dshm-burger")) return;
        var label = (btn.getAttribute && btn.getAttribute("aria-label")) || "";
        if (label === "打开侧边栏") return;   /* 宿主自己展开，不干预 */
        /* 宿主自带的「收起侧边栏」：让它折叠，同时同步我们的抽屉状态。
           之前这里是直接 return，导致宿主折叠了、我们的 class 还在，
           视觉上抽屉纹丝不动 —— 用户感知就是"点了没反应，得再点一次"。 */
        if (label === "收起侧边栏") {
          setTimeout(function () { closeNav(); }, 30);
          return;
        }
        /* 这些按钮是在侧栏内原地展开东西（搜索框/视图选项/加工作区），绝不能关抽屉 */
        if (/搜索|视图选项|添加工作区|筛选|账号菜单|更多/.test(label)) {
          /* 这类按钮可能只是原地展开，也可能弹宿主弹窗（如"添加工作区"选目录）。
             给宿主 400ms，弹窗起来了就把抽屉关掉。 */
          setTimeout(function () {
            try {
              if (hostModalOpen()) closeNav();
            } catch (e) {}
          }, 400);
          return;
        }

        var beforeOverlay = overlayCount();
        var beforeInputs = sb.querySelectorAll("input,textarea").length;
        var r = btn.getBoundingClientRect();

        /* 最强信号：会话列表是 role="tree"，点它内部任何节点必然是切会话。
           之前只按 y>270 判断，遇到不同列表位置就漏关，侧栏会挡住输入框。 */
        if (t.closest('[role="tree"]')) {
          /* 例外：会话项右侧的"⋯"（会话操作菜单）点它是要弹菜单，不是切会话 */
          if (/更多|操作|菜单|menu/i.test(label)) { return; }
          if (t.closest("[class*='actions'],[class*='sessionMenu'],[class*='itemAction']")) { return; }
          closeNav();
          return;
        }

        /* 会话列表区（y > 270）兜底：同步收起，不等异步判断 */
        if (r.top > 270 && !/账号菜单|更多/.test(label)) {
          closeNav();
          return;
        }

        setTimeout(function () {
          try {
            if (!document.body.classList.contains(BODY_CLASS)) return;      // 已经关了，别重复
            if (hostModalOpen()) { closeNav(); return; }  // 宿主弹窗 → 让位
            if (overlayCount() > beforeOverlay) return;                      // 弹层 → 宿主在干活
            if (sb.querySelectorAll("input,textarea").length > beforeInputs) return;  // 搜索框 → 保持
            closeNav();
          } catch (e) {}
        }, 300);
      } catch (e) {}
    }

    var booted = false;
    function boot() {
      if (booted) return;
      if (DISABLED) return;
      booted = true;
      injectStyle();
      var start = function () {
        mountUI();
        watchScroller();
        document.addEventListener("click", onClickCapture, true);
        watchLongPress();
        window.addEventListener("resize", onViewportChange);
        watchModal();
        window.addEventListener("orientationchange", onViewportChange);
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
      } else {
        start();
      }
    }

    /* 横屏/宽屏（>820px）插件样式不生效，必须把抽屉状态清掉，
       否则会出现"没有遮罩、侧栏却盖在内容上"的怪状态，转回竖屏还会自己弹开。 */
    function onViewportChange() {
      try {
        if (window.innerWidth > 820) {
          closeNav();
        }
      } catch (e) {}
    }

    function apply(ctx) {
      boot();
      return function dispose() {
        try {
          var s = document.getElementById(STYLE_ID);
          if (s) s.remove();
          [".dshm-burger", ".dshm-scrim", ".dshm-gotop"].forEach(function (q) {
            var n = document.querySelector(q);
            if (n) n.remove();
          });
          closeNav();
          document.removeEventListener("click", onClickCapture, true);
        } catch (e) {}
      };
    }

    /* 模块一加载就注入样式：避免首屏闪一下未适配的样子 */
    try { if (!DISABLED) injectStyle(); } catch (e) {}

    exports.apply = apply;
    exports.inject = [];
    exports.name = "dsh-plugin-mobile-ux";
    return module.exports;
  },
});
