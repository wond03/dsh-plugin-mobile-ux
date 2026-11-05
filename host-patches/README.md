# 宿主播丁（Host Patches）

本目录记录本插件对 DSH **宿主安装包**做过的全部改动，以及每一处的还原状态。

原则：**能不改宿主就不改**。必须改的，只允许一处一处留档，并给出回滚方法。

---

## 一、改动清单与状态（2026-11-05）

| # | 文件 | 改动内容 | 状态 |
|---|---|---|---|
| 1 | `dsh-host-frontend-static/lib/index.js` | `renderIndex` 里注入 `<style id="dsh-mobile-fit">`（约 500 字符的全局移动端覆盖） | ✅ 已还原（与官方包逐字节一致） |
| 2 | `dsh-web-frontend/dist/index.html` | 直接写死同一段 `<style id="dsh-mobile-fit">` | ✅ 已还原（与官方包逐字节一致） |
| 3 | `dsh-client-ui-settings-general/lib/client.js` | 注入 `/*dsh-mobile-start*/…/*dsh-mobile-end*/` 设置页移动端 CSS | ✅ 已还原，规则迁入插件 |
| 4 | `dsh-client-connection/lib/index.js` | 移除浏览器 token 认证（`browserAuth` 相关 4 行） | ⚠️ **保留**，见第二节 |

被还原的三处，都用 `npm pack @deepseek-ai/<pkg>@0.2.1-rc.5` 的官方产物覆盖，并 `diff` 校验为 0 字节差异。

被还原的规则中，真正有价值的两条已迁入插件：

- `#root, #root>*{min-width:0}`、`body{overflow-x:hidden}` —— 防横向晃动
- 设置页全屏布局（`.VOzbGW_*`）—— 已在插件 CSS 中实现，并加 `!important` 以覆盖宿主后加载的样式

被丢弃的规则（判定为粗暴覆盖，会持续制造副作用）：

- `[class*="_input_"] … {min-height:44px!important}` —— 全局撑高所有输入/按钮
- `[class*="_label_"] … {font-size:14px!important}` —— 全局改字号
- `[class*="_surface_"]{max-width:calc(100vw - 20px)!important}` —— **这就是弹出菜单被压窄、设置面板只有 370px 的元凶**
- `[class*="_panel_"]{padding:14px!important}`、`flex-wrap:wrap!important` 等

---

## 二、为什么保留第 4 处（connection）

DSH 自带一层浏览器 token 认证：启动时随机生成 token，访问 `/?token=…` 换取 30 天有效期的签名 cookie。

本机架构是：

```
公网 → nginx 网关(0.0.0.0:3080, HTTPS + 令牌认证) → DSH(127.0.0.1:3090)
```

保留移除的原因：

1. 网关已有独立且更强的认证：32 位随机令牌、30 天 HttpOnly cookie、Bearer、登录失败限流 6 次/分、强制 HTTPS。
2. DSH 的认证 cookie 名由 authority（`127.0.0.1:3090`）派生，经代理转发后 Host 变化，认证会失配；要让它在代理后工作，还得额外配 `--trusted-host`。
3. token 每次进程重启都会重新随机生成，需要把新 token 实时注入网关，链路脆弱、易断。

**风险边界（必须记住）**：移除这一层后，任何能访问 `127.0.0.1:3090` 的进程都等同于已认证。当前 3090 只监听回环地址，外部不可达。**若将来把 3090 暴露到公网，必须先恢复本补丁。**

恢复方法：

```bash
cp host-patches/connection.official.js \
   /usr/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js
node --check <上面那个路径>
pm2 restart dsh-harness
```

---

## 三、DSH 升级后怎么办

升级会覆盖宿主安装包：

- 移动端适配**不需要重放**——全部已在插件里，升级后自动继续生效
- 第 4 处会被覆盖回官方版，此时 DSH 会要求 token 登录，页面显示
  「dsh web authentication required; reopen the URL printed by dsh web」

如果升级后想继续免登录，可从 `pm2 logs dsh-harness` 里取最新 `?token=` 链接访问一次换取 cookie；
也可以重新应用补丁（`connection.patched.js` 对应 0.2.1-rc.5，跨版本需重新核对行号）。

---

## 四、文件说明

| 文件 | 说明 |
|---|---|
| `connection.official.js` | `dsh-client-connection@0.2.1-rc.5` 官方原版 |
| `connection.patched.js` | 当前线上使用的版本（移除认证） |
| `legacy-2026-11/` | 上一轮宿主改动的原始材料归档（`client.js.orig`、`settings-mobile.css`、`patch-settings-mobile.py`、`rollback.sh`、旧截图），仅作追溯，可随时删除 |
