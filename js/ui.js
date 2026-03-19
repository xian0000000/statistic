/* js/ui.js — StatLab UI Utilities */
var SL = window.SL || {};

SL.UI = (function () {

  /* ── Toast ── */
  function toast(msg, type) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show';
    if (type === 'error') el.style.background = '#dc2626';
    else if (type === 'warn') el.style.background = '#d97706';
    else el.style.background = '#1a1a2e';
    setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  /* ── DOM helpers ── */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = String(txt);
    return e;
  }
  function ap(parent, child) { parent.appendChild(child); return child; }
  function qs(sel) { return document.querySelector(sel); }
  function ge(id) { return document.getElementById(id); }

  /* ── Tab switching ── */
  function goTab(name, btn) {
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('on'); });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    else {
      var tabs = document.querySelectorAll('.tab');
      tabs.forEach(function (t) { if (t.dataset.tab === name) t.classList.add('on'); });
    }
    var panel = ge('p-' + name);
    if (panel) panel.classList.add('on');
    if (typeof SL.Panels !== 'undefined' && SL.Panels[name]) SL.Panels[name]();
  }

  /* ── Empty state ── */
  function emptyState(icon, msg) {
    var d = el('div', 'empty');
    var ic = el('div', 'empty-icon', icon);
    ap(d, ic);
    var p = el('p', '', msg);
    ap(d, p);
    return d;
  }

  /* ── Stat card ── */
  function statCard(label, value, cls, note) {
    var sc = el('div', 'sc');
    ap(sc, el('div', 'sc-lbl', label));
    ap(sc, el('div', 'sc-val ' + (cls || ''), value));
    if (note) { var n = el('div', 'sc-note', note); ap(sc, n); }
    return sc;
  }

  /* ── Table builder ── */
  function buildTable(headers, rows, opts) {
    opts = opts || {};
    var wrap = el('div', 'tbl-wrap');
    var tbl = el('table', 'tbl');
    if (opts.fontSize) tbl.style.fontSize = opts.fontSize;
    var thead = el('thead'), tr0 = el('tr');
    headers.forEach(function (h) { ap(tr0, el('th', '', h)); });
    ap(thead, tr0); ap(tbl, thead);
    var tbody = el('tbody');
    rows.forEach(function (row) {
      var tr = el('tr');
      if (row._class) tr.className = row._class;
      row.forEach(function (cell, i) {
        var td;
        if (cell && typeof cell === 'object' && cell.el) {
          td = el('td', cell.cls || '');
          td.appendChild(cell.el);
        } else {
          td = el('td', '', cell);
          if (i > 0 && opts.numRight) td.style.cssText = 'font-family:var(--mono);text-align:right;';
        }
        if (row._tdcls && row._tdcls[i]) td.className = row._tdcls[i];
        ap(tr, td);
      });
      ap(tbody, tr);
    });
    ap(tbl, tbody); ap(wrap, tbl);
    return wrap;
  }

  /* ── Alert box ── */
  function alert(msg, type) {
    var d = el('div', 'alert alert-' + (type || 'green'), msg);
    return d;
  }

  /* ── Column selector chips ── */
  function colChips(cols, container, onSelect, multi) {
    container.innerHTML = '';
    cols.forEach(function (col, i) {
      var chip = el('span', 'badge badge-green', col.name);
      chip.style.cursor = 'pointer';
      chip.dataset.idx = i;
      chip.onclick = function () {
        if (!multi) container.querySelectorAll('.badge').forEach(function (c) { c.className = 'badge badge-green'; c.style.cursor = 'pointer'; });
        chip.className = chip.className.indexOf('badge-blue') !== -1 ? 'badge badge-green' : 'badge badge-blue';
        chip.style.cursor = 'pointer';
        if (onSelect) onSelect(i, chip.className.indexOf('badge-blue') !== -1);
      };
      if (i === 0 && !multi) chip.className = 'badge badge-blue';
      ap(container, chip);
    });
  }

  /* ── Download file ── */
  function download(name, mime, content) {
    try {
      var blob = new Blob([content], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); document.body.removeChild(a); }, 200);
    } catch (e) {
      try {
        var a2 = document.createElement('a');
        a2.href = 'data:' + mime + ';charset=utf-8,' + encodeURIComponent(content);
        a2.download = name;
        document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      } catch (e2) { toast('Gagal ekspor', 'error'); }
    }
  }

  /* ── Number formatter ── */
  function fmtNum(v, isFinance) {
    if (isFinance) return SL.Math.fmtRp(v);
    return SL.Math.fmt(v, 3);
  }

  /* ── Trend icon ── */
  function trendIcon(current, previous) {
    if (current > previous) return { icon: '▲', cls: 'trend-up', pct: SL.Math.roc(previous, current) };
    if (current < previous) return { icon: '▼', cls: 'trend-down', pct: SL.Math.roc(previous, current) };
    return { icon: '●', cls: 'trend-flat', pct: 0 };
  }

  return {
    toast: toast, el: el, ap: ap, qs: qs, ge: ge,
    goTab: goTab, emptyState: emptyState, statCard: statCard,
    buildTable: buildTable, alert: alert, colChips: colChips,
    download: download, fmtNum: fmtNum, trendIcon: trendIcon
  };

}());

window.SL = SL;
