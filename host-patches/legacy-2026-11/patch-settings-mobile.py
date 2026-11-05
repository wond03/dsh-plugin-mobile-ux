"""Inline the mobile stylesheet for the settings dialog into the installed
client bundle (idempotent: the block is delimited by markers and re-replaced)."""
import re, shutil, pathlib

BUNDLE = "/usr/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-ui-settings-general/lib/client.js"
CSSFILE = "/root/.dsh/mobile/settings-mobile.css"
BACKUP = "/root/.dsh/mobile/client.js.orig"

bundle, backup = pathlib.Path(BUNDLE), pathlib.Path(BACKUP)
live = bundle.read_text()
if not backup.exists():
    shutil.copy2(bundle, backup)

BLOCK = re.compile(r"/\*dsh-mobile-start\*/.*?/\*dsh-mobile-end\*/", re.S)
base = BLOCK.sub("", live)          # works whether or not the block is present
css = pathlib.Path(CSSFILE).read_text()
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
css = " ".join(css.split())
assert '"' not in css and "\\" not in css, "CSS must not contain quotes or backslashes"

anchor = ".VOzbGW_hiddenLabel{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}"
idx = base.find(anchor)
assert idx != -1, "settings dialog css anchor not found (dsh version changed?)"
end = idx + len(anchor)
assert base[end] == '"', repr(base[end:end + 5])

bundle.write_text(base[:end] + "/*dsh-mobile-start*/" + css + "/*dsh-mobile-end*/" + base[end:])
print(f"patched: css {len(css)} chars, bundle {bundle.stat().st_size} bytes")
