# 网关加速配置（可选）

对应 `nginx.conf`（同端口 3080 HTTP/HTTPS 分流 + 令牌认证 + HTTP/2 + 静态长缓存）。

## 里面有什么

| 项 | 说明 |
|---|---|
| `stream {}` 分流 | 同端口读 ClientHello 首字节，明文 → 13080，TLS → 13443 |
| 令牌认证 | `/__auth?k=<token>` 下发 30 天 Cookie；`/__auth` 路径不记 access_log |
| HTTP/2 | `listen 127.0.0.1:13443 ssl proxy_protocol http2` |
| `/assets/` 长缓存 | `public, max-age=31536000, immutable`，同时保留 HSTS 等安全头与 401 校验 |
| 流式直通 | `proxy_buffering off` + 1h 超时，避免 SSE 被攒住 |

## 占位符

文件里已把真实令牌和 IP 替换成：

- `__GATEWAY_TOKEN__` — 你的访问令牌
- `__BIND_ADDR__` — 内网地址（如 `10.0.138.28`）
- `__PUBLIC_HOST__` — 公网 IP 或域名

部署前自行替换，**不要把真实令牌提交回仓库**。

## 部署步骤

```bash
mkdir -p /etc/dsh-gateway/{conf,certs,logs,run}
cp nginx.conf app_proxy.conf /etc/dsh-gateway/conf/
sed -i "s/__GATEWAY_TOKEN__/你的令牌/g; s/__BIND_ADDR__/10.0.138.28/g; s/__PUBLIC_HOST__/你的公网IP/g" /etc/dsh-gateway/conf/nginx.conf

# 自签证书（有效期 825 天）
openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
  -keyout /etc/dsh-gateway/certs/privkey.pem \
  -out /etc/dsh-gateway/certs/fullchain.pem \
  -subj "/CN=你的公网IP"

nginx -t -c /etc/dsh-gateway/conf/nginx.conf
systemctl reload dsh-gateway   # 或首次 systemctl enable --now dsh-gateway
```

> 前提：应用本身监听 `127.0.0.1:3090`（`dsh web --host 127.0.0.1 --port 3090`），并由 pm2/systemd 托管。

## 验证

```bash
curl -sk --http2 -o /dev/null -w "%{http_version} %{http_code}\n" \
  -H "Host: 你的公网IP:3080" -b "dsh_sso=你的令牌" https://127.0.0.1:13443/
# 期望：2 200

curl -sk -o /dev/null -w "%{http_code}\n" -H "Host: 你的公网IP:3080" \
  https://127.0.0.1:13443/assets/index.js
# 期望：401（没令牌必须拦住）
```
