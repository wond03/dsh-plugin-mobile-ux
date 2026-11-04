#!/bin/bash
# 一键停用 dsh-plugin-mobile-ux（不改文件、不卸载依赖，随时可恢复）
set -e
P=/root/.dsh/profiles/web/cordis.patch.yml
cp -a "$P" "$P.bak.$(date +%Y%m%d-%H%M%S)"
python3 - "$P" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
if "disabled: true   # mobile-ux 停用开关" in s:
    print("已经是停用状态")
elif 'name: "dsh-plugin-mobile-ux"' in s:
    s = s.replace('name: "dsh-plugin-mobile-ux"',
                  'name: "dsh-plugin-mobile-ux"\n      disabled: true   # mobile-ux 停用开关')
    open(p, "w", encoding="utf-8").write(s)
    print("已在配置中停用")
else:
    print("未找到 mobile-ux 条目，可能已移除")
PY
pm2 restart dsh-harness >/dev/null 2>&1
echo "已重启，插件已停止注入"
