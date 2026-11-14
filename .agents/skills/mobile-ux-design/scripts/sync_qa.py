"""Chèn assets/qa-check.js vào assets/mockup-template.html (giữa hai marker QA_CHECK).
Chạy lại mỗi khi sửa qa-check.js:  python scripts/sync_qa.py"""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
qa = (root / "assets" / "qa-check.js").read_text(encoding="utf-8").strip()
tpl_path = root / "assets" / "mockup-template.html"
tpl = tpl_path.read_text(encoding="utf-8")
new, n = re.subn(r"/\*QA_CHECK_START\*/.*?/\*QA_CHECK_END\*/",
                 lambda _: "/*QA_CHECK_START*/\n" + qa + "\n/*QA_CHECK_END*/", tpl, flags=re.S)
if n != 1:
    raise SystemExit("Không tìm thấy marker QA_CHECK trong template")
tpl_path.write_text(new, encoding="utf-8")
print("Đã đồng bộ qa-check.js vào mockup-template.html")
