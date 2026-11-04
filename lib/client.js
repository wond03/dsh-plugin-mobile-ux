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

    var STYLE_ID = "dsh-mobile-ux-style";
    var BODY_CLASS = "dshm-nav-open";

    var CSS = [
      /* ---------- 基础：触摸与文字缩放 ---------- */
      "@media (max-width: 820px) {",
      "html{-webkit-text-size-adjust:100%;text-size-adjust:100%}",
      "*{-webkit-tap-highlight-color:transparent}",
      "button,[role='button'],a,summary,label{touch-action:manipulation}",

      /* iOS 聚焦输入框时不再自动放大页面 */
      "textarea,input,[contenteditable='true']{font-size:16px!important}",

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
      "body." + BODY_CLASS + " .dshm-burger{opacity:0;pointer-events:none}",
      ".dshm-burger svg{width:20px;height:20px;display:block}",

      /* ---------- 顶部标题栏给悬浮汉堡让位，避免遮住标题首字 ---------- */
      "header{padding-left:52px!important}",
      /* 标题过长时给足空间，不要一上来就省略号 */
      "[class*='titleRow']{min-width:0}",

      /* ---------- 阅读排版 ---------- */
      "[class*='scrollBody']{-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;scroll-behavior:smooth}",
      "[class*='scrollBody'] p,[class*='scrollBody'] li{line-height:1.78;letter-spacing:.01em;font-size:15px}",
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
      "pre code{white-space:pre;word-break:normal;font-size:13px;line-height:1.62}",
      "code{word-break:break-word}",

      /* 表格：可横向滑动 */
      "table{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-collapse:collapse}",

      /* 媒体不溢出 */
      "img,video,canvas,svg{max-width:100%;height:auto}",

      /* ---------- 输入区：贴底 + 安全区 + 大触摸目标 ---------- */
      "[class*='composerStack']{padding-bottom:max(10px,env(safe-area-inset-bottom))!important}",
      "[class*='composerStack'] textarea,[class*='composerStack'] [contenteditable='true']{max-height:42vh!important;line-height:1.55}",
      "[class*='composerStack'] button{min-width:40px;min-height:40px}",
      /* 侧栏图标别太小，至少 40px 触摸高度（原 36px） */
      "[class*='sidebarCol'] button{min-height:40px}",

      /* ---------- 面板/设置页：防横向溢出 ---------- */
      "[class*='panelBody'],[class*='tabLayout']{max-width:100%!important;overflow-x:auto;-webkit-overflow-scrolling:touch}",
      "[class*='panelBody'] [class*='surface']{max-width:100%!important}",
      /* 插件/设置列表容器比父级宽 8px，导致可左右晃动 */
      "[class*='installedPanel'],[class*='cards'],[class*='group'],[class*='surface']{max-width:100%!important}",
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

    function mountUI() {
      try {
        if (!document.body) return;
        if (!document.querySelector(".dshm-burger")) {
          var burger = makeButton("dshm-burger", ICON_MENU, "打开导航");
          burger.addEventListener("click", function () {
            document.body.classList.add(BODY_CLASS);
            /* 一次点击就要看到完整侧栏（会话列表），不能只滑出图标条再让用户点第二次。
               做法：如果宿主当前是折叠态（宽 < 100），替用户触发它自己的「打开侧边栏」。 */
            setTimeout(function () {
              try {
                var sb = document.querySelector("[class*='sidebarCol']");
                if (!sb) return;
                if (sb.getBoundingClientRect().width < 100) {
                  var openBtn = sb.querySelector("button[aria-label='打开侧边栏']");
                  if (openBtn) openBtn.click();
                }
              } catch (e) {}
            }, 60);
          });
          document.body.appendChild(burger);
        }
        if (!document.querySelector(".dshm-scrim")) {
          var scrim = document.createElement("div");
          scrim.className = "dshm-scrim";
          scrim.addEventListener("click", function () {
            document.body.classList.remove(BODY_CLASS);
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

    /* 会话切换会换掉滚动容器，所以要持续盯着 */
    function watchScroller() {
      bindScroll();
      setInterval(bindScroll, 1200);
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
    function watchModal() {
      if (modalObserver) return;
      var timer = null;
      modalObserver = new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          try {
            if (document.body.classList.contains(BODY_CLASS) && hostModalOpen()) {
              document.body.classList.remove(BODY_CLASS);
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

    function onClickCapture(ev) {
      try {
        if (!document.body.classList.contains(BODY_CLASS)) return;
        var sb = document.querySelector("[class*='sidebarCol']");
        if (!sb) return;
        if (sb.getBoundingClientRect().width < 100) return;
        var t = ev.target;
        if (!t || !t.closest) return;
        var btn = t.closest("button,a,[role='button'],[role='menuitem'],[class*='title']");
        if (!btn) return;
        if (btn.classList && btn.classList.contains("dshm-burger")) return;
        var label = (btn.getAttribute && btn.getAttribute("aria-label")) || "";
        if (label === "打开侧边栏" || label === "收起侧边栏") return;
        /* 这些按钮是在侧栏内原地展开东西（搜索框/视图选项/加工作区），绝不能关抽屉 */
        if (/搜索|视图选项|添加工作区|筛选|账号菜单|更多/.test(label)) {
          /* 这类按钮可能只是原地展开，也可能弹宿主弹窗（如"添加工作区"选目录）。
             给宿主 400ms，弹窗起来了就把抽屉关掉。 */
          setTimeout(function () {
            try {
              if (hostModalOpen()) document.body.classList.remove(BODY_CLASS);
            } catch (e) {}
          }, 400);
          return;
        }

        var beforeOverlay = overlayCount();
        var beforeInputs = sb.querySelectorAll("input,textarea").length;
        var r = btn.getBoundingClientRect();

        /* 会话列表区（y > 270）点下去必然是切会话：同步收起，不等异步判断，避免时灵时不灵 */
        if (r.top > 270 && !/账号菜单|更多/.test(label)) {
          document.body.classList.remove(BODY_CLASS);
          return;
        }

        setTimeout(function () {
          try {
            if (!document.body.classList.contains(BODY_CLASS)) return;      // 已经关了，别重复
            if (hostModalOpen()) { document.body.classList.remove(BODY_CLASS); return; }  // 宿主弹窗 → 让位
            if (overlayCount() > beforeOverlay) return;                      // 弹层 → 宿主在干活
            if (sb.querySelectorAll("input,textarea").length > beforeInputs) return;  // 搜索框 → 保持
            document.body.classList.remove(BODY_CLASS);
          } catch (e) {}
        }, 300);
      } catch (e) {}
    }

    var booted = false;
    function boot() {
      if (booted) return;
      booted = true;
      injectStyle();
      var start = function () {
        mountUI();
        watchScroller();
        document.addEventListener("click", onClickCapture, true);
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
          document.body.classList.remove(BODY_CLASS);
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
          document.body.classList.remove(BODY_CLASS);
          document.removeEventListener("click", onClickCapture, true);
        } catch (e) {}
      };
    }

    /* 模块一加载就注入样式：避免首屏闪一下未适配的样子 */
    try { injectStyle(); } catch (e) {}

    exports.apply = apply;
    exports.inject = [];
    exports.name = "dsh-plugin-mobile-ux";
    return module.exports;
  },
});
