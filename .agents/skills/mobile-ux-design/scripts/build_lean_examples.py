import pathlib

ASSETS = pathlib.Path(__file__).resolve().parent.parent / "assets"
s = (ASSETS / "mockup-template.html").read_text(encoding="utf-8")
s = s.replace("<title>Đề xuất UX</title>", "<title>Mẫu màn gọn</title>")
s = s.replace("<h1>Tên tính năng: các phương án</h1>", "<h1>Mẫu màn gọn</h1>")
s = s.replace(
    "<p>Một câu: vấn đề cần giải và cách đọc trang. Bấm, vuốt thử trực tiếp trên khung.</p>",
    "<p>Mốc tham chiếu về độ tinh gọn: mỗi màn một việc, ít chữ, ít viền, ≤ 4 cỡ chữ, chrome ≤ 40%. Bấm thử trên khung; bấm \"Kiểm tra\" để xem QA.</p>",
)
start = s.index("  <!-- ===== PHƯƠNG ÁN MẪU")
end_marker = "<!-- ===== HẾT PHƯƠNG ÁN MẪU ===== -->"
end = s.index(end_marker) + len(end_marker)

SB = '<div class="statusbar"><span>9:41</span><span class="cam"></span><span class="sys"></span></div>'

MAIN = """  <section class="option">
    <span class="tag">Mẫu</span>
    <h2>Bốn màn gọn</h2>
    <p>Mỗi màn chỉ giữ thứ phục vụ hành động chính. Ghi chú bên dưới nói cái gì đã được bỏ.</p>
    <div class="phones">
      <figure class="phone">
        <div class="device"><div class="screen">
          SB
          <div class="content">
            <div class="appbar"><button class="icon-btn" aria-label="Quay lại"><span class="ms">chevron_left</span></button><div class="grow px"><div class="progress thin"><i style="width:75%"></i></div></div><span style="width:calc(44 * var(--pt))"></span></div>
            <div class="title-block"><div class="t-title">Chọn giờ khám</div><div class="sub">BS. Nguyễn Văn An · Tim mạch</div></div>
            <div class="scroll">
              <div class="chips days" id="ex-days" role="radiogroup" aria-label="Ngày khám">
                <button class="day" role="radio" aria-checked="true"><span>T2</span><b>16</b></button>
                <button class="day" role="radio" aria-checked="false"><span>T3</span><b>17</b></button>
                <button class="day" role="radio" aria-checked="false" disabled><span>T4</span><b>18</b></button>
                <button class="day" role="radio" aria-checked="false"><span>T5</span><b>19</b></button>
                <button class="day" role="radio" aria-checked="false"><span>T6</span><b>20</b></button>
              </div>
              <div class="label">Sáng</div>
              <div class="slots" role="radiogroup" aria-label="Giờ khám buổi sáng">
                <button class="slot" role="radio" aria-checked="false">7:30</button><button class="slot" role="radio" aria-checked="false">8:00</button><button class="slot" role="radio" aria-checked="false">8:30</button>
                <button class="slot" role="radio" aria-checked="false">9:00</button><button class="slot" role="radio" aria-checked="false" disabled>9:30</button><button class="slot" role="radio" aria-checked="false">10:00</button>
              </div>
              <div class="label">Chiều</div>
              <div class="slots" role="radiogroup" aria-label="Giờ khám buổi chiều">
                <button class="slot" role="radio" aria-checked="false">13:30</button><button class="slot" role="radio" aria-checked="false">14:00</button><button class="slot" role="radio" aria-checked="false">15:00</button>
              </div>
              <div style="height:calc(16 * var(--pt))"></div>
            </div>
            <div class="bottom"><button class="btn primary block" id="ex-next" disabled>Tiếp tục</button></div>
          </div>
          <div class="homebar"></div>
        </div></div>
        <figcaption>Chọn giờ khám</figcaption>
      </figure>

      <figure class="phone">
        <div class="device"><div class="screen">
          SB
          <div class="content">
            <div class="appbar"><button class="icon-btn" aria-label="Đóng"><span class="ms">close</span></button><div class="title">Khoản chi</div><span style="width:calc(44 * var(--pt))"></span></div>
            <div class="scroll" style="display:flex;flex-direction:column">
              <div class="grow" style="display:grid;place-items:center;min-height:calc(110 * var(--pt))"><div style="text-align:center"><div class="amount hero" id="ex-amount">0&nbsp;đ</div><div class="sub" style="margin-top:calc(4 * var(--pt))">Hôm nay · Tiền mặt</div></div></div>
              <div class="chips" id="ex-cats" style="padding-bottom:calc(12 * var(--pt))">
                <button class="chip" aria-pressed="true"><span class="ms sm">restaurant</span>Ăn uống</button>
                <button class="chip" aria-pressed="false"><span class="ms sm">local_cafe</span>Cà phê</button>
                <button class="chip" aria-pressed="false"><span class="ms sm">two_wheeler</span>Đi lại</button>
                <button class="chip" aria-pressed="false"><span class="ms sm">shopping_bag</span>Mua sắm</button>
              </div>
              <div class="px"><div class="field">Ghi chú</div></div>
              <div class="keypad" id="ex-keys">
                <button>1</button><button>2</button><button>3</button><button>4</button><button>5</button><button>6</button>
                <button>7</button><button>8</button><button>9</button><button>000</button><button>0</button><button aria-label="Xóa"><span class="ms">backspace</span></button>
              </div>
            </div>
            <div class="bottom"><button class="btn primary block" id="ex-save" disabled>Lưu</button></div>
          </div>
          <div class="homebar"></div>
        </div></div>
        <figcaption>Thêm khoản chi</figcaption>
      </figure>

      <figure class="phone">
        <div class="device"><div class="screen">
          SB
          <div class="content">
            <div class="appbar"><button class="icon-btn" aria-label="Thoát bài"><span class="ms">close</span></button><div class="grow" style="padding-right:calc(16 * var(--pt))"><div class="progress"><i style="width:66%"></i></div></div></div>
            <div class="scroll">
              <div class="title-block"><div class="t-title">Hạt táo nằm ở đâu trong quả?</div></div>
              <div class="px stack" id="ex-opts" role="radiogroup" aria-label="Đáp án" style="gap:calc(8 * var(--pt))">
                <button class="opt" role="radio" aria-checked="false">Ở lớp vỏ ngoài</button>
                <button class="opt" role="radio" aria-checked="false" data-ok="1">Trong lõi giữa quả</button>
                <button class="opt" role="radio" aria-checked="false">Ở cuống táo</button>
              </div>
            </div>
            <div class="feedback" id="ex-fb" hidden>
              <div class="hstack"><span class="ms fill" id="ex-fb-icon">check_circle</span><b id="ex-fb-title">Chính xác!</b></div>
              <div id="ex-fb-text">Hạt nằm trong 5 ngăn nhỏ ở lõi quả.</div>
            </div>
            <div class="bottom"><button class="btn primary block" id="ex-check" disabled>Kiểm tra</button></div>
          </div>
          <div class="homebar"></div>
        </div></div>
        <figcaption>Phản hồi quiz</figcaption>
      </figure>

      <figure class="phone">
        <div class="device"><div class="screen">
          SB
          <div class="content">
            <div class="large-title">Chi tiêu</div>
            <div class="scroll">
              <div class="px"><div class="sub">Tháng 11</div><div class="amount t-title">4.250.000&nbsp;đ</div></div>
              <div class="section-h"><span>Hôm nay</span><span class="amount">−94.000&nbsp;đ</span></div>
              <div class="list" id="ex-list">
                <div class="row" role="button" tabindex="0"><span class="lead"><span class="ms">restaurant</span></span><div class="main"><div class="t">Cơm tấm sườn</div><div class="s">12:10</div></div><span class="trail amount">−45.000&nbsp;đ</span></div>
                <div class="row" role="button" tabindex="0"><span class="lead"><span class="ms">local_cafe</span></span><div class="main"><div class="t">Cà phê sữa đá</div><div class="s">08:45</div></div><span class="trail amount">−29.000&nbsp;đ</span></div>
                <div class="row" role="button" tabindex="0"><span class="lead"><span class="ms">two_wheeler</span></span><div class="main"><div class="t">Grab đi làm</div><div class="s">08:05</div></div><span class="trail amount">−20.000&nbsp;đ</span></div>
              </div>
              <div class="section-h"><span>Hôm qua</span><span class="amount">−312.000&nbsp;đ</span></div>
              <div class="list">
                <div class="row" role="button" tabindex="0"><span class="lead"><span class="ms">shopping_cart</span></span><div class="main"><div class="t">Siêu thị gần nhà</div><div class="s">19:20</div></div><span class="trail amount">−312.000&nbsp;đ</span></div>
              </div>
              <div style="height:calc(88 * var(--pt))"></div>
            </div>
            <button class="fab" aria-label="Thêm khoản chi"><span class="ms">add</span></button>
          </div>
          <div class="homebar"></div>
        </div></div>
        <figcaption>Danh sách</figcaption>
      </figure>
    </div>
    <ul class="points">
      <li><span class="note">1</span><span>Chọn giờ: bỏ "Bước 3/4", nhãn 4 chặng, nút Thoát, dòng người khám, icon buổi, viền ô, thanh "Đã chọn". Ngữ cảnh gói vào 1 dòng phụ; tóm tắt để ở màn xác nhận.</span></li>
      <li><span class="note">2</span><span>Khoản chi: số tiền là trung tâm; danh mục là chip phẳng, chọn sẵn theo thói quen; ngày và ví thu gọn thành 1 dòng phụ.</span></li>
      <li><span class="note">3</span><span>Quiz: đáp án phẳng; phản hồi là 1 khối màu trạng thái có icon + chữ; nút Tiếp tục nằm đúng chỗ nút Kiểm tra.</span></li>
      <li><span class="note">4</span><span>Danh sách: tổng tháng là thông tin chính; mỗi hàng 1 tên + 1 giờ + 1 số; vuốt trái để xóa (có hoàn tác), chạm hàng để sửa.</span></li>
    </ul>
  </section>""".replace("SB", SB)

s = s[:start] + MAIN + s[end:]

CSS = """  .progress.thin { height: calc(4 * var(--pt)); }
  .title-block { padding: calc(8 * var(--pt)) calc(16 * var(--pt)) calc(16 * var(--pt)); }
  .label { padding: calc(20 * var(--pt)) calc(16 * var(--pt)) calc(8 * var(--pt)); font-size: calc(var(--fs-sub) * var(--u)); font-weight: 600; color: var(--app-muted); }
  .days { gap: calc(8 * var(--pt)); }
  .day { flex: 0 0 auto; width: calc(56 * var(--pt)); height: calc(64 * var(--pt)); border: 0; border-radius: var(--r-md); background: var(--app-surface); color: var(--app-text); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: calc(2 * var(--pt)); font-family: inherit; cursor: pointer; }
  .day span { font-size: calc(var(--fs-cap) * var(--u)); color: var(--app-muted); }
  .day b { font-size: calc(var(--fs-body) * var(--u)); font-weight: 600; }
  .day[aria-checked="true"] { background: var(--app-primary); color: var(--app-on-primary); }
  .day[aria-checked="true"] span { color: inherit; opacity: .8; }
  .day[disabled], .slot[disabled] { opacity: .35; cursor: default; }
  .slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(8 * var(--pt)); padding: 0 calc(16 * var(--pt)); }
  .slot { min-height: calc(48 * var(--pt)); border: 0; border-radius: var(--r-md); background: var(--app-surface); color: var(--app-text); font-family: inherit; font-size: calc(var(--fs-body) * var(--u)); font-weight: 600; cursor: pointer; font-variant-numeric: tabular-nums; }
  .slot[aria-checked="true"] { background: var(--app-primary); color: var(--app-on-primary); }
  .keypad { display: grid; grid-template-columns: repeat(3, 1fr); padding: calc(8 * var(--pt)) calc(12 * var(--pt)) 0; }
  .keypad button { min-height: calc(52 * var(--pt)); border: 0; background: transparent; color: var(--app-text); font-family: inherit; font-size: calc(var(--fs-title) * var(--u)); font-weight: 500; border-radius: var(--r-md); cursor: pointer; }
  .keypad button:active { background: var(--app-surface); }
  .opt { text-align: left; min-height: calc(56 * var(--pt)); padding: calc(12 * var(--pt)) calc(16 * var(--pt)); border: 0; border-radius: var(--r-md); background: var(--app-surface); color: var(--app-text); font-family: inherit; font-size: calc(var(--fs-body) * var(--u)); font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: calc(8 * var(--pt)); }
  .opt[aria-checked="true"] { background: var(--app-primary-soft); color: var(--app-primary); box-shadow: inset 0 0 0 2px var(--app-primary); }
  .opt.ok { background: var(--app-success-soft); color: var(--app-success); box-shadow: none; }
  .opt.no { background: var(--app-error-soft); color: var(--app-error); box-shadow: none; }
  .feedback { padding: calc(16 * var(--pt)) calc(16 * var(--pt)) 0; background: var(--app-success-soft); color: var(--app-success); font-size: calc(var(--fs-sub) * var(--u)); display: flex; flex-direction: column; gap: calc(4 * var(--pt)); }
  .feedback b { font-size: calc(var(--fs-body) * var(--u)); }
  .feedback.no { background: var(--app-error-soft); color: var(--app-error); }
  .feedback:not([hidden]) + .bottom { background: var(--app-success-soft); }
  .feedback.no:not([hidden]) + .bottom { background: var(--app-error-soft); }
"""
s = s.replace("  body.reduced *, body.reduced *::before", CSS + "  body.reduced *, body.reduced *::before", 1)

js_start = s.index("/* ===== Tương tác của phương án mẫu")
js_end = s.index("</script>", js_start)
JS = r"""/* ===== Tương tác của mẫu ===== */
(() => {
  // 1. Chọn giờ: một lựa chọn ngày, một lựa chọn giờ (trên cả hai buổi); nút Tiếp tục mở khi đã chọn giờ
  const days = document.getElementById('ex-days');
  days.querySelectorAll('.day').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    days.querySelectorAll('.day').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  }));
  const slots = days.closest('.scroll').querySelectorAll('.slot');
  slots.forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    slots.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.getElementById('ex-next').disabled = false;
    Mock.haptic(b, 'selection');
  }));
  // 2. Khoản chi: bàn phím số tự định dạng hàng nghìn
  let raw = '';
  const amt = document.getElementById('ex-amount'), save = document.getElementById('ex-save');
  const fmt = (v) => (v ? Number(v).toLocaleString('vi-VN') : '0') + '\u00a0đ';
  document.querySelectorAll('#ex-keys button').forEach((k) => k.addEventListener('click', () => {
    const del = k.getAttribute('aria-label') === 'Xóa';
    raw = del ? raw.slice(0, -1) : (raw + k.textContent.trim()).replace(/^0+/, '').slice(0, 10);
    amt.textContent = fmt(raw); save.disabled = !raw;
  }));
  document.querySelectorAll('#ex-cats .chip').forEach((c) => c.addEventListener('click', () => {
    document.querySelectorAll('#ex-cats .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
  }));
  save.addEventListener('click', () => {
    Mock.haptic(save, 'success');
    Mock.toast(save.closest('.screen'), 'Đã lưu ' + amt.textContent, { action: 'Hoàn tác' });
    raw = ''; amt.textContent = fmt(''); save.disabled = true;
  });
  // 3. Quiz: chọn → Kiểm tra → khối phản hồi icon + chữ, nút giữ nguyên chỗ
  const opts = document.getElementById('ex-opts'), check = document.getElementById('ex-check'), fb = document.getElementById('ex-fb');
  let picked = null, done = false;
  opts.querySelectorAll('.opt').forEach((o) => o.addEventListener('click', () => {
    if (done) return;
    picked = o;
    opts.querySelectorAll('.opt').forEach((x) => x.setAttribute('aria-checked', String(x === o)));
    check.disabled = false;
  }));
  check.addEventListener('click', () => {
    if (!done) {
      done = true;
      const ok = picked.dataset.ok === '1';
      picked.classList.add(ok ? 'ok' : 'no');
      picked.insertAdjacentHTML('afterbegin', '<span class="ms sm fill">' + (ok ? 'check_circle' : 'cancel') + '</span>');
      if (!ok) opts.querySelector('[data-ok]').classList.add('ok');
      fb.hidden = false; fb.classList.toggle('no', !ok);
      document.getElementById('ex-fb-icon').textContent = ok ? 'check_circle' : 'cancel';
      document.getElementById('ex-fb-title').textContent = ok ? 'Chính xác!' : 'Chưa đúng';
      document.getElementById('ex-fb-text').textContent = ok ? 'Hạt nằm trong 5 ngăn nhỏ ở lõi quả.' : 'Đáp án đúng: trong lõi giữa quả.';
      check.textContent = 'Tiếp tục';
      check.style.background = ok ? 'var(--app-success)' : 'var(--app-error)';
      Mock.haptic(check, ok ? 'success' : 'error');
    } else {
      done = false; picked = null; fb.hidden = true;
      check.textContent = 'Kiểm tra'; check.style.background = ''; check.disabled = true;
      opts.querySelectorAll('.opt').forEach((x) => { x.classList.remove('ok', 'no'); x.setAttribute('aria-checked', 'false'); const i = x.querySelector('.ms'); if (i) i.remove(); });
    }
  });
  // 4. Danh sách: vuốt trái để xóa, có hoàn tác
  document.querySelectorAll('#ex-list .row').forEach((row) => {
    const sw = Mock.swipe(row, { threshold: 0.4, onCommit(dir) {
      if (dir !== 'left') return sw.reset();
      Mock.haptic(row, 'medium');
      Mock.toast(row.closest('.screen'), 'Đã xóa khoản chi', { action: 'Hoàn tác', onAction: () => sw.reset() });
    } });
  });
})();
"""
s = s[:js_start] + JS + s[js_end:]
(ASSETS / "lean-examples.html").write_text(s, encoding="utf-8")
print("written", len(s))
