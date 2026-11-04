#!/bin/bash
# 恢复启用
set -e
P=/root/.dsh/profiles/web/cordis.patch.yml
cp -a "$P" "$P.bak.$(date +%Y%m%d-%H%M%S)"
python3 - "$P" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
s2 = s.replace('\n      disabled: true   # mobile-ux 停用开关', '')
if s2 != s:
    open(p, "w", encoding="utf-8").write(s2)
    print("已恢复启用")
else:
    print("当前不是停用状态")
PY
pm2 restart dsh-harness >/dev/null 2>&1
echo "已重启"
