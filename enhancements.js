/* Clinqoo Editor Enhancements
 * Snippets · Problems · Keyboard cheat-sheet · AI inline actions
 * Dimuat terpisah agar index.html inti tetap stabil.
 * Hanya update sumber GitHub — deploy ke editor.clincoo.buzz manual.
 */
(function () {
  'use strict';

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- Snippets ---------- */
  var SNIPPETS = [
    { id: 'html-hero', cat: 'HTML', title: 'Hero section', body: '<section class="hero">\n  <h1>Judul utama</h1>\n  <p>Deskripsi singkat produk atau jasa.</p>\n  <a class="btn" href="#cta">Mulai</a>\n</section>\n' },
    { id: 'html-form', cat: 'HTML', title: 'Form kontak', body: '<form action="#" method="post" class="contact-form">\n  <label>Nama<input name="name" required></label>\n  <label>Email<input type="email" name="email" required></label>\n  <label>Pesan<textarea name="message" rows="4" required></textarea></label>\n  <button type="submit">Kirim</button>\n</form>\n' },
    { id: 'html-footer', cat: 'HTML', title: 'Footer sederhana', body: '<footer class="site-footer">\n  <p>&copy; <span id="year"></span> Nama Usaha. Semua hak dilindungi.</p>\n</footer>\n<script>document.getElementById("year").textContent=new Date().getFullYear()<\/script>\n' },
    { id: 'css-card', cat: 'CSS', title: 'Kartu / card', body: '.card {\n  background: #fff;\n  border-radius: 12px;\n  padding: 1.25rem;\n  box-shadow: 0 8px 24px rgba(0,0,0,.08);\n}\n' },
    { id: 'css-btn', cat: 'CSS', title: 'Tombol primer', body: '.btn {\n  display: inline-flex;\n  align-items: center;\n  gap: .5rem;\n  padding: .65rem 1.2rem;\n  border-radius: 8px;\n  background: #111;\n  color: #fff;\n  text-decoration: none;\n  font-weight: 600;\n  border: none;\n  cursor: pointer;\n}\n.btn:hover { filter: brightness(1.08); }\n' },
    { id: 'css-mq', cat: 'CSS', title: 'Media query mobile', body: '@media (max-width: 640px) {\n  .container { padding: 1rem; }\n  .hero h1 { font-size: 1.6rem; }\n}\n' },
    { id: 'js-toggle', cat: 'JS', title: 'Toggle class menu', body: 'const btn = document.querySelector("[data-menu]");\nconst nav = document.querySelector("nav");\nif (btn && nav) {\n  btn.addEventListener("click", () => nav.classList.toggle("open"));\n}\n' },
    { id: 'js-fetch', cat: 'JS', title: 'Fetch JSON', body: 'async function loadData(url) {\n  const res = await fetch(url);\n  if (!res.ok) throw new Error("Gagal memuat: " + res.status);\n  return res.json();\n}\n' }
  ];

  function insertSnippet(body) {
    if (typeof editor !== 'undefined' && editor) {
      var sel = editor.getSelection();
      editor.executeEdits('snippet', [{
        range: sel,
        text: body,
        forceMoveMarkers: true
      }]);
      editor.focus();
      if (typeof toast === 'function') toast('Snippet dimasukkan');
    } else if (typeof toast === 'function') {
      toast('Buka berkas di editor dulu');
    }
  }

  function renderSnippets() {
    var el = $('#snip-list');
    if (!el) return;
    var cats = {};
    SNIPPETS.forEach(function (s) {
      if (!cats[s.cat]) cats[s.cat] = [];
      cats[s.cat].push(s);
    });
    var html = '';
    Object.keys(cats).forEach(function (cat) {
      html += '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);padding:10px 8px 4px">' + esc(cat) + '</div>';
      cats[cat].forEach(function (s) {
        html += '<button class="tree-item" style="width:100%;text-align:left" data-snip="' + esc(s.id) + '">' +
          '<span class="nm">' + esc(s.title) + '</span></button>';
      });
    });
    el.innerHTML = html;
    el.querySelectorAll('[data-snip]').forEach(function (btn) {
      btn.onclick = function () {
        var sn = SNIPPETS.find(function (x) { return x.id === btn.getAttribute('data-snip'); });
        if (sn) insertSnippet(sn.body);
      };
    });
  }

  /* ---------- Problems (diagnostics ringan) ---------- */
  function scanProblems() {
    var issues = [];
    if (typeof project === 'undefined' || !project) return issues;
    Object.keys(project).forEach(function (path) {
      var content = project[path];
      if (typeof content !== 'string') return;
      var lines = content.split('\n');
      if (/\.html$/i.test(path)) {
        if (!/<!DOCTYPE\s+html/i.test(content) && content.length > 40) {
          issues.push({ path: path, line: 1, sev: 'warn', msg: 'Tidak ada <!DOCTYPE html>' });
        }
        if (!/<html[\s>]/i.test(content) && content.length > 40) {
          issues.push({ path: path, line: 1, sev: 'warn', msg: 'Tag <html> tidak ditemukan' });
        }
        var imgRe = /<img\b([^>]*)>/gi, m;
        while ((m = imgRe.exec(content))) {
          if (!/\balt\s*=/i.test(m[1])) {
            var line = content.slice(0, m.index).split('\n').length;
            issues.push({ path: path, line: line, sev: 'warn', msg: '<img> tanpa atribut alt' });
          }
        }
        if (/href\s*=\s*["']\s*#\s*["']/i.test(content) && !/href\s*=\s*["']#[a-zA-Z]/i.test(content)) {
          /* skip pure # anchors with id */
        }
        lines.forEach(function (ln, i) {
          if (/TODO|FIXME|XXX/.test(ln)) {
            issues.push({ path: path, line: i + 1, sev: 'info', msg: 'Catatan: ' + ln.trim().slice(0, 80) });
          }
        });
      }
      if (/\.js$/i.test(path)) {
        lines.forEach(function (ln, i) {
          if (/console\.log\s*\(/.test(ln)) {
            issues.push({ path: path, line: i + 1, sev: 'info', msg: 'console.log tersisa' });
          }
          if (/\beval\s*\(/.test(ln)) {
            issues.push({ path: path, line: i + 1, sev: 'err', msg: 'Penggunaan eval() tidak disarankan' });
          }
        });
      }
      if (/\.css$/i.test(path)) {
        lines.forEach(function (ln, i) {
          if (/!important/.test(ln)) {
            issues.push({ path: path, line: i + 1, sev: 'info', msg: '!important dipakai' });
          }
        });
      }
    });
    return issues;
  }

  function renderProblems() {
    var el = $('#prob-list');
    if (!el) return;
    var issues = scanProblems();
    var badge = $('#prob-badge');
    if (badge) {
      if (issues.length) {
        badge.style.display = 'grid';
        badge.textContent = String(issues.length > 99 ? '99+' : issues.length);
      } else {
        badge.style.display = 'none';
      }
    }
    if (!issues.length) {
      el.className = 'empty-note';
      el.textContent = 'Tidak ada masalah terdeteksi. Scan ulang setelah mengubah berkas.';
      return;
    }
    el.className = '';
    el.innerHTML = issues.map(function (it) {
      var color = it.sev === 'err' ? 'var(--err)' : it.sev === 'warn' ? '#c9a227' : 'var(--text3)';
      return '<button class="tree-item" style="width:100%;text-align:left;align-items:flex-start;flex-direction:column;gap:2px" data-prob-path="' + esc(it.path) + '" data-prob-line="' + it.line + '">' +
        '<span style="font-size:11px;color:' + color + '">' + esc(it.sev.toUpperCase()) + ' · ' + esc(it.path) + ':' + it.line + '</span>' +
        '<span class="nm" style="white-space:normal;line-height:1.35">' + esc(it.msg) + '</span></button>';
    }).join('');
    el.querySelectorAll('[data-prob-path]').forEach(function (btn) {
      btn.onclick = function () {
        var p = btn.getAttribute('data-prob-path');
        var line = parseInt(btn.getAttribute('data-prob-line'), 10) || 1;
        if (typeof openFile === 'function') openFile(p);
        setTimeout(function () {
          if (typeof editor !== 'undefined' && editor) {
            editor.revealLineInCenter(line);
            editor.setPosition({ lineNumber: line, column: 1 });
            editor.focus();
          }
        }, 120);
      };
    });
  }

  /* ---------- Keyboard cheat-sheet ---------- */
  var SHORTCUTS = [
    ['Ctrl+S', 'Simpan berkas aktif'],
    ['Ctrl+Shift+S / Ctrl+K S', 'Simpan semua'],
    ['Ctrl+N', 'Berkas baru'],
    ['Ctrl+P', 'Buka cepat berkas'],
    ['Ctrl+Shift+P', 'Palette perintah'],
    ['Ctrl+B', 'Toggle sidebar'],
    ['Ctrl+`', 'Toggle terminal'],
    ['Ctrl+G', 'Pergi ke baris'],
    ['Ctrl+Shift+E', 'Panel Explorer'],
    ['F5', 'Jalankan pratinjau'],
    ['Shift+Alt+F', 'Format dokumen'],
    ['Ctrl+/', 'Tampilkan daftar shortcut ini'],
    ['?', 'Tampilkan daftar shortcut (tanpa fokus input)']
  ];

  function openCheatSheet() {
    var existing = $('#cheat-modal');
    if (existing) { existing.remove(); return; }
    var modal = document.createElement('div');
    modal.id = 'cheat-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg3);border:1px solid var(--line2);border-radius:12px;max-width:420px;width:100%;max-height:80vh;overflow:auto;box-shadow:var(--shadow);padding:16px 18px';
    box.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
      '<b style="font-size:14px">Shortcut keyboard</b>' +
      '<button type="button" id="cheat-close" style="color:var(--text2);font-size:18px;line-height:1">×</button></div>' +
      SHORTCUTS.map(function (row) {
        return '<div style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px">' +
          '<span style="color:var(--text2)">' + esc(row[1]) + '</span>' +
          '<kbd style="font-family:Fira Code,monospace;font-size:11px;background:var(--bg4);border:1px solid var(--line2);border-radius:5px;padding:2px 7px;white-space:nowrap">' + esc(row[0]) + '</kbd></div>';
      }).join('');
    modal.appendChild(box);
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    var closeBtn = $('#cheat-close');
    if (closeBtn) closeBtn.onclick = function () { modal.remove(); };
  }

  /* ---------- AI inline (selection → prompt ke panel AI) ---------- */
  function getSelectionText() {
    if (typeof editor === 'undefined' || !editor) return '';
    var model = editor.getModel();
    if (!model) return '';
    var sel = editor.getSelection();
    return model.getValueInRange(sel) || '';
  }

  function aiInlineAction(kind) {
    var text = getSelectionText().trim();
    if (!text) {
      if (typeof toast === 'function') toast('Pilih teks di editor dulu');
      return;
    }
    var prompts = {
      fix: 'Perbaiki kode berikut agar benar dan lebih bersih:\n\n```\n' + text + '\n```',
      explain: 'Jelaskan kode berikut dengan bahasa sederhana:\n\n```\n' + text + '\n```',
      refactor: 'Refactor kode berikut agar lebih rapi tanpa mengubah perilaku:\n\n```\n' + text + '\n```'
    };
    var prompt = prompts[kind] || prompts.explain;
    if (typeof showPanel === 'function') showPanel('ai');
    setTimeout(function () {
      var input = $('#ai-input') || document.querySelector('#p-ai textarea') || document.querySelector('.ai-composer textarea');
      if (input) {
        input.value = prompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        if (typeof toast === 'function') toast('Prompt AI siap — tekan kirim');
      } else if (typeof toast === 'function') {
        toast('Panel AI dibuka — tempel prompt manual');
        try { navigator.clipboard.writeText(prompt); } catch (e) {}
      }
    }, 200);
  }

  function injectAIInlineBar() {
    if ($('#ai-inline-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'ai-inline-bar';
    bar.style.cssText = 'display:none;position:fixed;z-index:800;gap:6px;padding:6px 8px;background:var(--bg3);border:1px solid var(--line2);border-radius:10px;box-shadow:var(--shadow);align-items:center';
    bar.innerHTML =
      '<button type="button" data-ai-act="fix" style="font-size:11.5px;padding:4px 10px;border-radius:7px;background:var(--btn-bg);color:#fff;font-weight:600">Perbaiki</button>' +
      '<button type="button" data-ai-act="explain" style="font-size:11.5px;padding:4px 10px;border-radius:7px;background:var(--bg4);color:var(--text)">Jelaskan</button>' +
      '<button type="button" data-ai-act="refactor" style="font-size:11.5px;padding:4px 10px;border-radius:7px;background:var(--bg4);color:var(--text)">Refactor</button>';
    document.body.appendChild(bar);
    bar.querySelectorAll('[data-ai-act]').forEach(function (btn) {
      btn.onclick = function () {
        aiInlineAction(btn.getAttribute('data-ai-act'));
        bar.style.display = 'none';
      };
    });

    function positionBar() {
      if (typeof editor === 'undefined' || !editor) { bar.style.display = 'none'; return; }
      var text = getSelectionText();
      if (!text || text.length < 2) { bar.style.display = 'none'; return; }
      try {
        var sel = editor.getSelection();
        var pos = editor.getScrolledVisiblePosition(sel.getStartPosition());
        var dom = editor.getDomNode();
        if (!pos || !dom) { bar.style.display = 'none'; return; }
        var rect = dom.getBoundingClientRect();
        bar.style.display = 'flex';
        bar.style.left = Math.min(window.innerWidth - 280, rect.left + pos.left) + 'px';
        bar.style.top = Math.max(8, rect.top + pos.top - 40) + 'px';
      } catch (e) {
        bar.style.display = 'none';
      }
    }

    document.addEventListener('mouseup', function () { setTimeout(positionBar, 30); });
    document.addEventListener('keyup', function (e) {
      if (e.key === 'Escape') bar.style.display = 'none';
    });
  }

  /* ---------- UI inject ---------- */
  function injectUI() {
    var activity = $('#activitybar');
    var sidebar = $('#sidebar');
    if (!activity || !sidebar) return;

    // Tombol Snippets
    if (!$('#btn-snippets')) {
      var btnSnip = document.createElement('button');
      btnSnip.className = 'act-btn';
      btnSnip.id = 'btn-snippets';
      btnSnip.dataset.panel = 'snippets';
      btnSnip.title = 'Snippet cepat';
      btnSnip.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>';
      var explorerBtn = activity.querySelector('[data-panel="explorer"]');
      if (explorerBtn && explorerBtn.nextSibling) activity.insertBefore(btnSnip, explorerBtn.nextSibling);
      else activity.insertBefore(btnSnip, activity.querySelector('.spacer') || null);
    }

    // Tombol Problems
    if (!$('#btn-problems')) {
      var btnProb = document.createElement('button');
      btnProb.className = 'act-btn';
      btnProb.id = 'btn-problems';
      btnProb.dataset.panel = 'problems';
      btnProb.title = 'Problems';
      btnProb.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg><span class="badge" id="prob-badge" style="display:none">0</span>';
      var spacer = activity.querySelector('.spacer');
      if (spacer) activity.insertBefore(btnProb, spacer);
      else activity.appendChild(btnProb);
    }

    // Panel Snippets
    if (!$('#p-snippets')) {
      var pSnip = document.createElement('div');
      pSnip.className = 'panel';
      pSnip.id = 'p-snippets';
      pSnip.innerHTML = '<div class="empty-note" style="padding:6px 8px 2px;text-align:left">Klik snippet untuk sisipkan di kursor.</div><div id="snip-list"></div>';
      var clinqoo = sidebar.querySelector('.sb-clinqoo');
      if (clinqoo) sidebar.insertBefore(pSnip, clinqoo);
      else sidebar.appendChild(pSnip);
    }

    // Panel Problems
    if (!$('#p-problems')) {
      var pProb = document.createElement('div');
      pProb.className = 'panel';
      pProb.id = 'p-problems';
      pProb.innerHTML = '<div style="display:flex;gap:6px;padding:4px 8px 8px">' +
        '<button type="button" id="prob-rescan" style="height:28px;padding:0 10px;border-radius:7px;background:var(--btn-bg);color:#fff;font-size:12px;font-weight:600">Scan ulang</button></div>' +
        '<div id="prob-list" class="empty-note">Belum di-scan.</div>';
      var clinqoo2 = sidebar.querySelector('.sb-clinqoo');
      if (clinqoo2) sidebar.insertBefore(pProb, clinqoo2);
      else sidebar.appendChild(pProb);
      var rescan = $('#prob-rescan');
      if (rescan) rescan.onclick = function () { renderProblems(); if (typeof toast === 'function') toast('Scan selesai'); };
    }

    // Hook showPanel titles + actions
    if (typeof showPanel === 'function' && !showPanel.__enhHooked) {
      var orig = showPanel;
      window.showPanel = function (name) {
        orig(name);
        var titles = { explorer: 'Explorer', git: 'Kontrol Sumber', ai: 'AI Koding', snippets: 'Snippet', problems: 'Problems', db: 'Database', api: 'API Tester' };
        var tEl = $('#sb-title');
        if (tEl && titles[name]) tEl.textContent = titles[name];
        if (name === 'snippets') renderSnippets();
        if (name === 'problems') renderProblems();
      };
      window.showPanel.__enhHooked = true;

      $$('.act-btn[data-panel]').forEach(function (b) {
        b.onclick = function () {
          if (b.classList.contains('active') && typeof sbOpen !== 'undefined' && sbOpen) {
            var sb = $('#sidebar');
            if (sb) { sb.classList.add('hidden'); window.sbOpen = false; }
          } else {
            window.showPanel(b.dataset.panel);
          }
        };
      });
    }

    renderSnippets();
    renderProblems();
    injectAIInlineBar();

    // Keyboard: Ctrl+/ dan ?
    window.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === '/') {
        e.preventDefault();
        openCheatSheet();
      }
    }, true);
    window.addEventListener('keydown', function (e) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
        e.preventDefault();
        openCheatSheet();
      }
    });
  }

  window.__clinqooEnh = {
    renderSnippets: renderSnippets,
    renderProblems: renderProblems,
    openCheatSheet: openCheatSheet,
    aiInlineAction: aiInlineAction
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(injectUI, 500); });
  } else {
    setTimeout(injectUI, 500);
  }
})();
