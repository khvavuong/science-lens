// QA MOCKUP: layout + dấu hiệu "AI slop" (mobile-ux-design skill)
// Chạy trong trang mockup: công cụ evaluate của trình duyệt, hoặc dán vào DevTools console.
// Mockup làm từ template đã nhúng sẵn hàm này: gọi Mock.qa() hoặc bấm nút "Kiểm tra" trên trang.
// Quét mọi khung .screen đang hiển thị, trả về { screens, counts, issues: [{frame, type, el, detail}] }.
//
// Loại lỗi (đều nên về 0, trừ khi có lý do và ghi rõ trong đề xuất):
//   text-clipped    chữ bị cắt trong hộp overflow:hidden (không phải ellipsis có chủ đích)
//   wrapped-label   nhãn ngắn (≤ 3 từ: nút, chip, số tiền, tab) bị xuống dòng
//   cut-by-screen   chữ/nút bị mép khung cắt mất một phần (ngoài vùng cuộn)
//   covered         chữ/nút bị phần tử khác che MỘT PHẦN (va chạm). Lớp bị che hoàn toàn có chủ đích thì bỏ qua
//   small-target    phần tử bấm được nhỏ hơn 40×40pt (vùng chạm thật nên ≥ 44pt; người lớn tuổi/trẻ em ≥ 48–56)
//   emoji           emoji dùng trong UI (thường là emoji làm icon). Dùng bộ icon thống nhất
//   default-font    font của khung là font mặc định trình duyệt (system-ui, Segoe UI, Arial…)
//   heavy-shadow    bóng đổ blur > 24px, bóng có màu, hoặc text-shadow (glow)
//   gradient        nền gradient trang trí chiếm diện tích lớn
//   frame-clipped   (trang, ≥ 1000px) khung điện thoại bị cột phương án cắt mất một phần
//   text-dense      khung có quá nhiều chữ (mặc định > 70 từ đang hiển thị)
// Cảnh báo độ rối (tinh gọn). Vượt ngưỡng thì bớt, hoặc ghi rõ vì sao cần:
//   boxy            quá nhiều phần tử có viền (mặc định > 8): dùng khoảng trắng và nền tonal thay viền
//   type-noise      quá nhiều cỡ chữ khác nhau (mặc định > 5; nên ≤ 4)
//   color-noise     quá nhiều màu nhấn khác nhau (mặc định > 3 nhóm sắc độ)
//   card-soup       ≥ 5 thẻ rộng (nền riêng + bo góc) xếp chồng: dùng danh sách nhóm thay vì mỗi mục một thẻ
//   chrome-heavy    phần cố định trên + dưới (ngoài status bar/home) chiếm > 40% chiều cao nội dung
(function () {
  function mockQA(opts) {
    opts = opts || {};
    var minTargetPt = opts.minTarget || 40, deviceWidth = opts.deviceWidth || 390, maxWords = opts.maxWords || 70, maxBoxes = opts.maxBoxes || 8, maxSizes = opts.maxSizes || 5, maxHues = opts.maxHues || 3, maxChrome = opts.maxChrome || 0.4;
    var issues = [];
    var screens = Array.prototype.slice.call(document.querySelectorAll(opts.selector || '.screen'));
    var EMOJI = /\p{Extended_Pictographic}/u;
    var DEFAULT_FONTS = /^(system-ui|-apple-system|blinkmacsystemfont|segoe ui|arial|helvetica|sans-serif|serif|times new roman|tahoma|verdana)$/i;

    function visible(el) {
      var s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05 && r.width > 0 && r.height > 0;
    }
    function ancestorsVisible(el, stop) {
      for (var p = el; p && p !== stop; p = p.parentElement) if (parseFloat(getComputedStyle(p).opacity) < 0.05) return false;
      return true;
    }
    function label(el) {
      var t = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      var c = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + c + (t ? ' "' + t + '"' : '');
    }
    function ownText(el) {
      var t = '';
      for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3) t += n.textContent; }
      return t.trim();
    }
    function isIcon(el) { return el.closest('.ms, .material-symbols-rounded, .material-symbols-outlined, .material-icons, [data-icon], svg'); }
    function isInteractive(el) {
      return el.matches('button, a[href], input, select, textarea, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [onclick]');
    }
    function scrollerOrMoved(el, stop) {
      for (var p = el.parentElement; p && p !== stop; p = p.parentElement) {
        var s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) return 'scroll';
        if (s.transform && s.transform !== 'none') return 'moved';
      }
      return '';
    }
    function related(a, b) { return a === b || a.contains(b) || b.contains(a); }
    function rgba(str) { var m = (str || '').match(/rgba?\(([^)]*)\)/); if (!m) return null; var c = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return { r: c[0], g: c[1], b: c[2], a: c.length > 3 ? c[3] : 1 }; }
    function hueBucket(c) {
      if (!c || c.a < 0.35) return null;
      var r = c.r / 255, g = c.g / 255, b = c.b / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
      var sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      if (sat < 0.3 || l > 0.93 || l < 0.12) return null; // trung tính, gần trắng, gần đen
      var h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return Math.round(((h * 60 + 360) % 360) / 30); // nhóm 30°
    }
    // Phần tử nằm trong vùng cuộn được, bị thanh cố định (ngoài vùng cuộn) che: người dùng cuộn ra được, không phải lỗi
    function scrollsUnder(el, top) {
      for (var p = el.parentElement; p; p = p.parentElement) {
        var cs = getComputedStyle(p);
        if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 4) return !p.contains(top);
        if (p.classList && p.classList.contains('screen')) return false;
      }
      return false;
    }
    // Flex cột / grid: icon xếp trên chữ là chủ đích, chỉ đếm dòng của từng text node.
    // Flex hàng: các phần tử con rơi xuống hàng mới là lỗi ("0" và "đ" tách hai dòng).
    // Block/inline: đếm cả cụm.
    function lineCount(el) {
      var cs = getComputedStyle(el);
      if (/(flex|grid)/.test(cs.display)) {
        var max = 1, walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (var n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim()) max = Math.max(max, linesOf(n));
        if (/flex/.test(cs.display) && /^row/.test(cs.flexDirection)) {
          var tops = [];
          Array.prototype.forEach.call(el.children, function (c) {
            var r = c.getBoundingClientRect(); if (!r.width || !r.height) return;
            if (!tops.some(function (t) { return r.top >= t.top + t.h * 0.6 || r.top + r.height * 0.6 <= t.top ? false : true; })) tops.push({ top: r.top, h: r.height });
          });
          max = Math.max(max, tops.length);
        }
        return max;
      }
      return linesOf(el);
    }
    function linesOf(node) {
      var range = document.createRange(); range.selectNodeContents(node);
      var rects = Array.prototype.slice.call(range.getClientRects()).filter(function (r) { return r.width > 1; });
      var tops = [];
      rects.forEach(function (r) { if (!tops.some(function (t) { return Math.abs(t - r.top) < r.height * 0.5; })) tops.push(r.top); });
      return tops.length;
    }
    function shadowProblem(s) {
      if (s.textShadow && s.textShadow !== 'none') return 'text-shadow ' + s.textShadow;
      if (!s.boxShadow || s.boxShadow === 'none') return '';
      var parts = s.boxShadow.split(/,(?![^(]*\))/);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (/inset/.test(p)) continue;
        var nums = (p.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
        var blur = nums[2] || 0, spread = nums[3] || 0;
        var m = p.match(/rgba?\(([^)]*)\)/), col = m ? m[1].split(',').map(parseFloat) : [0, 0, 0, 1];
        var a = col.length > 3 ? col[3] : 1;
        var colored = Math.max(col[0], col[1], col[2]) - Math.min(col[0], col[1], col[2]) > 40 && a > 0.12;
        if (blur > 24 || spread > 8 || colored) return 'box-shadow ' + p.trim();
      }
      return '';
    }

    // Cấp trang (màn hình máy tính): khung điện thoại bị cột phương án cắt mất, người xem thấy nửa khung
    if (innerWidth >= 1000) screens.forEach(function (screen) {
      var dev = screen.closest('.device') || screen, sc = dev.parentElement && dev.closest('.phones');
      if (!sc || !visible(screen)) return;
      var d = dev.getBoundingClientRect(), c = sc.getBoundingClientRect();
      if (d.right > c.right + 1 || d.left < c.left - 1) {
        var cap = screen.closest('figure') && screen.closest('figure').querySelector('figcaption');
        issues.push({ frame: cap ? cap.innerText.trim() : '', type: 'frame-clipped', el: '', detail: 'khung bị cắt trên trang ở độ rộng ' + innerWidth + 'px: cho mỗi phương án một hàng hoặc thu nhỏ khung' });
      }
    });
    screens.forEach(function (screen, si) {
      if (!visible(screen)) return;
      var fig = screen.closest('figure'), cap = fig && fig.querySelector('figcaption');
      var opt = screen.closest('section'), head = opt && opt.querySelector('h2');
      var frame = (head ? head.innerText.trim() + ' / ' : '') + (cap ? cap.innerText.trim() : 'khung ' + (si + 1));
      screen.scrollIntoView({ block: 'center', inline: 'center' });
      var sr = screen.getBoundingClientRect();
      var minTarget = minTargetPt * sr.width / deviceWidth;
      var push = function (type, el, detail) { issues.push({ frame: frame, type: type, el: el ? label(el) : '', detail: detail || '' }); };

      var fam = (getComputedStyle(screen).fontFamily.split(',')[0] || '').replace(/["']/g, '').trim();
      if (DEFAULT_FONTS.test(fam)) push('default-font', null, 'font đầu tiên: ' + fam);
      else if (document.fonts && document.fonts.check && !document.fonts.check('16px "' + fam + '"')) push('default-font', null, 'font "' + fam + '" chưa tải được, đang hiển thị font dự phòng');

      var words = 0, boxes = 0, sizes = {}, hues = {};
      var els = Array.prototype.slice.call(screen.querySelectorAll('*')).filter(function (el) {
        if (!visible(el) || !ancestorsVisible(el, screen) || el.closest('.statusbar, .haptic-tag')) return false;
        var r = el.getBoundingClientRect();
        return r.right > sr.left && r.left < sr.right && r.bottom > sr.top && r.top < sr.bottom;
      });
      els.forEach(function (el) {
        var r = el.getBoundingClientRect(), s = getComputedStyle(el);
        var own = ownText(el), inter = isInteractive(el), icon = isIcon(el), ctx = scrollerOrMoved(el, screen);
        if (own && !icon) words += own.split(/\s+/).filter(Boolean).length;
        var bw = ['Top', 'Right', 'Bottom', 'Left'].filter(function (sd) { var c = rgba(s['border' + sd + 'Color']); return parseFloat(s['border' + sd + 'Width']) >= 1 && c && c.a > 0.15 && s['border' + sd + 'Style'] !== 'none'; }).length;
        if (bw >= 3 && r.width > 24 && r.height > 20) boxes++;
        if (own && !icon) sizes[Math.round(parseFloat(s.fontSize))] = 1;
        var hb = own && !icon ? hueBucket(rgba(s.color)) : null; if (hb !== null) hues[hb] = 1;
        var bb = r.width * r.height > 400 ? hueBucket(rgba(s.backgroundColor)) : null; if (bb !== null) hues[bb] = 1;

        if (own && !icon && EMOJI.test(own)) push('emoji', el, own.match(EMOJI)[0]);
        var sh = shadowProblem(s); if (sh) push('heavy-shadow', el, sh);
        if (/gradient/.test(s.backgroundImage) && r.width * r.height > sr.width * sr.height * 0.1) push('gradient', el, s.backgroundImage.slice(0, 60));

        if (own && !icon && /(hidden|clip)/.test(s.overflow + s.overflowX + s.overflowY) && s.textOverflow !== 'ellipsis' &&
            (s.webkitLineClamp === 'none' || !s.webkitLineClamp) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2)) {
          push('text-clipped', el, el.scrollWidth + 'x' + el.scrollHeight + ' trong hộp ' + el.clientWidth + 'x' + el.clientHeight);
        }
        var full = (el.innerText || '').trim();
        var inlineInText = s.display === 'inline' && el.parentElement && ownText(el.parentElement).length > 0;
        if (full && !icon && !inlineInText && full.split(/\s+/).length <= 3 && full.length <= 24 && !el.querySelector('div, p, li, section, br') &&
            (own || inter) && lineCount(el) > 1) {
          push('wrapped-label', el, lineCount(el) + ' dòng');
        }
        if ((own || inter) && !ctx && (r.left < sr.left - 1 || r.right > sr.right + 1 || r.bottom > sr.bottom + 1 || r.top < sr.top - 1)) {
          push('cut-by-screen', el, 'vượt mép khung');
        }
        // Che một phần = va chạm thật. Che toàn bộ (lớp nằm dưới có chủ đích, vd. nút sau hàng vuốt) thì bỏ qua.
        if ((own || inter) && ctx !== 'moved') {
          var pts = [[0.5, 0.5], [0.15, 0.2], [0.85, 0.2], [0.15, 0.8], [0.85, 0.8]], hit = 0, by = null, checked = 0;
          pts.forEach(function (f) {
            var x = r.left + r.width * f[0], y = r.top + r.height * f[1];
            if (x < sr.left || x > sr.right || y < sr.top || y > sr.bottom || x < 0 || y < 0 || x > innerWidth || y > innerHeight) return;
            checked++;
            var top = document.elementFromPoint(x, y);
            if (top && !related(top, el) && screen.contains(top) && !scrollsUnder(el, top)) { hit++; by = by || top; }
          });
          if (hit > 0 && hit < checked) push('covered', el, 'bị che một phần (' + hit + '/' + checked + ' điểm) bởi ' + label(by));
        }
        if (inter && !ctx && (r.width < minTarget - 0.5 || r.height < minTarget - 0.5)) {
          push('small-target', el, '≈' + Math.round(r.width * deviceWidth / sr.width) + 'x' + Math.round(r.height * deviceWidth / sr.width) + 'pt');
        }
      });
      if (words > maxWords) push('text-dense', null, words + ' từ đang hiển thị (ngưỡng ' + maxWords + ')');
      if (boxes > maxBoxes) push('boxy', null, boxes + ' phần tử có viền (ngưỡng ' + maxBoxes + ')');
      var nSizes = Object.keys(sizes).length; if (nSizes > maxSizes) push('type-noise', null, nSizes + ' cỡ chữ: ' + Object.keys(sizes).sort(function (a, b) { return a - b; }).join('/') + 'px');
      var nHues = Object.keys(hues).length; if (nHues > maxHues) push('color-noise', null, nHues + ' nhóm màu nhấn');
      // Chồng thẻ: trong một khối, ≥ 5 con rộng (≥ 75% khung) có nền khác nền app và bo góc, xếp dọc
      Array.prototype.forEach.call(screen.querySelectorAll('*'), function (box) {
        if (box.children.length < 5 || !visible(box)) return;
        var cards = Array.prototype.filter.call(box.children, function (c) {
          if (!visible(c)) return false;
          var cs = getComputedStyle(c), rc = c.getBoundingClientRect(), bg = rgba(cs.backgroundColor);
          return rc.width >= sr.width * 0.75 && bg && bg.a > 0.2 && cs.backgroundColor !== getComputedStyle(screen).backgroundColor && parseFloat(cs.borderTopLeftRadius) >= 6;
        });
        if (cards.length >= 5) push('card-soup', box, cards.length + ' thẻ rộng xếp chồng');
      });
      var content = screen.querySelector('.content'), sc = content && content.querySelector('.scroll');
      if (content && sc) {
        var ch = content.getBoundingClientRect().height, scr = sc.getBoundingClientRect(), fixed = 0;
        Array.prototype.forEach.call(content.children, function (c) {
          var cs = getComputedStyle(c); if (c === sc || cs.position === 'absolute' || cs.position === 'fixed' || !visible(c)) return;
          fixed += c.getBoundingClientRect().height;
        });
        if (ch > 0 && fixed / ch > maxChrome) push('chrome-heavy', null, Math.round(fixed / ch * 100) + '% chiều cao là phần cố định (ngưỡng ' + Math.round(maxChrome * 100) + '%)');
      }
    });
    var counts = {};
    issues.forEach(function (i) { counts[i.type] = (counts[i.type] || 0) + 1; });
    return { screens: screens.length, counts: counts, issues: issues.slice(0, opts.limit || 120) };
  }
  if (typeof window !== 'undefined') window.mockQA = mockQA;
  return typeof module === 'undefined' && typeof window !== 'undefined' && !window.__mockQANoAutoRun ? mockQA() : undefined;
})();
