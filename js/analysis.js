/* js/analysis.js — StatLab Analysis Panels */
var SL = window.SL || {};

SL.Panels = (function () {

  var UI = SL.UI, M = SL.Math, D = SL.Data, C = SL.Charts;

  function ge(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { return UI.el(tag, cls, txt); }
  function ap(p, c) { return UI.ap(p, c); }
  function noData(id) { var e = ge(id); e.innerHTML = ''; ap(e, UI.emptyState('🔬', 'Belum ada data. Masukkan data di tab Input dulu.')); }

  /* ══════════════════════════════════════════
     INPUT PANEL
  ══════════════════════════════════════════ */
  function input() { /* handled inline in index.html */ }

  /* ══════════════════════════════════════════
     OVERVIEW / DASHBOARD
  ══════════════════════════════════════════ */
  function overview() {
    var cont = ge('overviewContent');
    if (!D.hasData()) return noData('overviewContent');
    cont.innerHTML = '';
    var cols = D.getCols(), labels = D.getLabels(), isF = D.getMode() === 'finance';

    if (isF) {
      /* Finance dashboard */
      var expCols = cols.filter(function (c) { return c.name.toLowerCase() !== 'tabungan' && c.name.toLowerCase() !== 'pendapatan' && c.name.toLowerCase() !== 'gaji'; });
      var savCol  = cols.find(function (c) { return c.name.toLowerCase() === 'tabungan'; });
      var n = cols[0].values.length;

      /* Compute totals per row */
      var totalExp = [];
      for (var i = 0; i < n; i++) {
        var t = 0; expCols.forEach(function (c) { t += c.values[i] || 0; }); totalExp.push(t);
      }
      var grandTotal = M.sum(totalExp);
      var avgMonthly = M.mean(totalExp);
      var maxMonth   = Math.max.apply(null, totalExp);
      var maxLabel   = labels[totalExp.indexOf(maxMonth)];
      var totalSav   = savCol ? M.sum(savCol.values) : 0;

      /* Summary strip */
      var strip = el('div', 'summary-strip');
      var stripData = [
        { lbl: 'Total Pengeluaran', val: M.fmtRp(grandTotal), cls: '' },
        { lbl: 'Rata-rata/Bulan',   val: M.fmtRp(avgMonthly), cls: '' },
        { lbl: 'Bulan Terboros',    val: maxLabel + ' (' + M.fmtRp(maxMonth) + ')', cls: 'red' },
        { lbl: 'Total Tabungan',    val: M.fmtRp(totalSav), cls: 'green' }
      ];
      stripData.forEach(function (s) {
        var item = el('div', 'strip-item');
        ap(item, el('div', 'strip-lbl', s.lbl));
        var v = el('div', 'strip-val ' + s.cls, s.val);
        ap(item, v);
        ap(strip, item);
      });
      ap(cont, strip);

      /* Charts row */
      var g2 = el('div', 'g2');
      var c1 = el('div', 'card'); ap(c1, el('div', 'slbl', 'Total Pengeluaran per Periode'));
      var wr1 = el('div', 'chart-wrap h260'); var cv1 = el('canvas'); cv1.id = 'ov_totalLine'; ap(wr1, cv1); ap(c1, wr1);
      var c2 = el('div', 'card'); ap(c2, el('div', 'slbl', 'Komposisi Pengeluaran (Total)'));
      var wr2 = el('div', 'chart-wrap h260'); var cv2 = el('canvas'); cv2.id = 'ov_pie'; ap(wr2, cv2); ap(c2, wr2);
      ap(g2, c1); ap(g2, c2); ap(cont, g2);

      /* Budget breakdown */
      var c3 = el('div', 'card'); ap(c3, el('div', 'slbl', 'Proporsi Pengeluaran per Kategori'));
      expCols.forEach(function (col) {
        var tot = M.sum(col.values), pct = grandTotal > 0 ? tot / grandTotal * 100 : 0;
        var row = el('div', 'budget-row');
        ap(row, el('div', 'budget-label', col.name));
        var barBg = el('div', 'bar-bg'); var barFill = el('div', 'bar-fill bar-green'); barFill.style.width = pct.toFixed(1) + '%'; ap(barBg, barFill); ap(row, barBg);
        ap(row, el('div', 'budget-pct', M.fmtRp(tot)));
        ap(row, el('div', 'badge badge-green', M.fmtPct(pct, 1)));
        ap(c3, row);
      });
      ap(cont, c3);

      /* Trend table with totals */
      var c4 = el('div', 'card'); ap(c4, el('div', 'slbl', 'Tabel Lengkap + Total'));
      var hdrs = ['Periode'].concat(cols.map(function (c) { return c.name; })).concat(['Total Pengeluaran']);
      var trows = [];
      for (var i = 0; i < n; i++) {
        var row2 = [labels[i]].concat(cols.map(function (c) { return M.fmtRp(c.values[i]); }));
        row2.push(M.fmtRp(totalExp[i]));
        row2._tdcls = [''].concat(cols.map(function (_, j) { return j === cols.length - 1 && savCol ? 'num green' : 'num'; })).concat(['total-row']);
        trows.push(row2);
      }
      /* Totals row */
      var sumRow = ['TOTAL'].concat(cols.map(function (c) { return M.fmtRp(M.sum(c.values)); })).concat([M.fmtRp(grandTotal)]);
      sumRow._class = 'tbl-sum';
      sumRow._tdcls = Array(sumRow.length).fill('total-row');
      trows.push(sumRow);
      ap(c4, UI.buildTable(hdrs, trows));
      ap(cont, c4);

      setTimeout(function () {
        C.line('ov_totalLine', labels, [{ label: 'Total', data: totalExp }]);
        C.doughnut('ov_pie', expCols.map(function (c) { return c.name; }), expCols.map(function (c) { return M.sum(c.values); }));
      }, 60);

    } else {
      /* General overview */
      var c1 = el('div', 'card'); ap(c1, el('div', 'slbl', 'Ringkasan Variabel'));
      var hdrs = ['Variabel', 'N', 'Min', 'Maks', 'Mean', 'Std Dev', 'CV%'];
      var rows = cols.map(function (col) {
        var mn = Math.min.apply(null, col.values), mx = Math.max.apply(null, col.values);
        return [col.name, col.values.length, M.fmt(mn, 3), M.fmt(mx, 3), M.fmt(M.mean(col.values), 4), M.fmt(M.sd(col.values), 4), M.fmt(M.cv(col.values), 2) + '%'];
      });
      ap(c1, UI.buildTable(hdrs, rows)); ap(cont, c1);

      /* Mini histograms */
      var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;';
      cols.forEach(function (col, ci) {
        var card = el('div', 'card'); card.style.padding = '14px';
        ap(card, el('div', 'slbl', col.name));
        var wr = el('div', 'chart-wrap h200'); var cv = el('canvas'); cv.id = 'ov_h_' + ci; ap(wr, cv); ap(card, wr);
        ap(grid, card);
      });
      ap(cont, grid);
      setTimeout(function () { cols.forEach(function (col, ci) { C.histogram('ov_h_' + ci, col.values, col.name); }); }, 60);
    }
  }

  /* ══════════════════════════════════════════
     DESCRIPTIVE
  ══════════════════════════════════════════ */
  function desc() {
    var cont = ge('descContent');
    if (!D.hasData()) return noData('descContent');
    cont.innerHTML = '';
    var cols = D.getCols(), isF = D.getMode() === 'finance';
    var fmt = isF ? M.fmtRp : function (v) { return M.fmt(v, 4); };

    var hdrs = ['Variabel', 'N', 'Min', 'Maks', 'Mean', 'Median', 'Std Dev', 'Varians', 'Skew', 'Kurt', 'CV%'];
    var rows = cols.map(function (col) {
      return [col.name, col.values.length,
        fmt(Math.min.apply(null, col.values)), fmt(Math.max.apply(null, col.values)),
        fmt(M.mean(col.values)), fmt(M.median(col.values)),
        fmt(M.sd(col.values)), fmt(M.variance(col.values)),
        M.fmt(M.skewness(col.values), 4), M.fmt(M.kurtosis(col.values), 4),
        M.fmtPct(M.cv(col.values), 2)];
    });
    var c1 = el('div', 'card'); ap(c1, el('div', 'slbl', 'Statistik Deskriptif Lengkap'));
    ap(c1, UI.buildTable(hdrs, rows)); ap(cont, c1);

    /* Per-variable detail */
    var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;';
    cols.forEach(function (col, ci) {
      var card = el('div', 'card'); card.style.padding = '14px';
      ap(card, el('div', 'slbl', col.name));
      var wr = el('div', 'chart-wrap h180'); var cv = el('canvas'); cv.id = 'desc_h_' + ci; ap(wr, cv); ap(card, wr);
      /* Quartile badges */
      var brow = el('div'); brow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;';
      [['Q1', M.pct(col.values, 25)], ['Q2', M.median(col.values)], ['Q3', M.pct(col.values, 75)]].forEach(function (qv) {
        var b = el('span', 'badge badge-green', qv[0] + ': ' + fmt(qv[1]));
        ap(brow, b);
      });
      ap(card, brow); ap(grid, card);
    });
    ap(cont, grid);
    setTimeout(function () { cols.forEach(function (col, ci) { C.histogram('desc_h_' + ci, col.values, col.name); }); }, 60);
  }

  /* ══════════════════════════════════════════
     TREND (Finance-focused)
  ══════════════════════════════════════════ */
  function trend() {
    var cont = ge('trendContent');
    if (!D.hasData()) return noData('trendContent');
    cont.innerHTML = '';
    var cols = D.getCols(), labels = D.getLabels(), isF = D.getMode() === 'finance';

    /* Moving average control */
    var ctrl = el('div', 'card');
    ap(ctrl, el('div', 'slbl', 'Analisis Tren & Moving Average'));
    var row = el('div'); row.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px;';
    var lb = el('label', '', 'Window Moving Average:'); lb.style.display = 'inline'; ap(row, lb);
    var sel = el('select'); sel.id = 'maWindow'; sel.style.cssText = 'width:80px;display:inline;';
    [2, 3, 4, 6].forEach(function (v) { var opt = el('option', '', v + ' periode'); opt.value = v; if (v === 3) opt.selected = true; ap(sel, opt); });
    ap(row, sel); ap(ctrl, row);

    var g2 = el('div', 'g2');
    cols.forEach(function (col, ci) {
      if (ci >= 4) return;
      var card = el('div', 'card'); card.style.padding = '14px';
      ap(card, el('div', 'slbl', col.name + ' — Tren'));
      var wr = el('div', 'chart-wrap h220'); var cv = el('canvas'); cv.id = 'tr_' + ci; ap(wr, cv); ap(card, wr);

      /* Trend stats */
      var tr2 = M.linearTrend(col.values);
      var dir = tr2 && tr2.b1 > 0 ? '▲ Naik' : '▼ Turun';
      var dirCls = tr2 && tr2.b1 > 0 ? 'badge-green' : 'badge-red';
      var brow = el('div'); brow.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;';
      if (tr2) {
        ap(brow, el('span', 'badge ' + dirCls, dir));
        ap(brow, el('span', 'badge badge-blue', 'Slope: ' + M.fmt(tr2.b1, 3)));
        ap(brow, el('span', 'badge badge-blue', 'R²: ' + M.fmt(tr2.r2, 3)));
      }
      ap(card, brow); ap(g2, card);
    });
    ap(ctrl, g2); ap(cont, ctrl);

    /* Render growth table */
    if (labels.length > 1) {
      var c2 = el('div', 'card'); ap(c2, el('div', 'slbl', 'Perubahan Periode ke Periode (%)'));
      var hdrs = ['Variabel'].concat(labels.slice(1));
      var rows = cols.map(function (col) {
        var row2 = [col.name];
        for (var i = 1; i < col.values.length; i++) {
          var roc = M.roc(col.values[i - 1], col.values[i]);
          row2.push((roc >= 0 ? '+' : '') + M.fmt(roc, 1) + '%');
        }
        return row2;
      });
      ap(c2, UI.buildTable(hdrs, rows)); ap(cont, c2);
    }

    function drawTrends(w) {
      cols.forEach(function (col, ci) {
        if (ci >= 4) return;
        C.kill('tr_' + ci);
        var ma = M.movingAvg(col.values, w).map(function (v) { return v; });
        var tr2 = M.linearTrend(col.values);
        var trendLine = col.values.map(function (_, i) { return tr2 ? tr2.b0 + tr2.b1 * i : null; });
        C.line('tr_' + ci, labels, [
          { label: col.name, data: col.values, borderWidth: 2, pointRadius: 3 },
          { label: 'MA(' + w + ')', data: ma, borderDash: [4, 3], borderWidth: 1.5, pointRadius: 0 },
          { label: 'Tren', data: trendLine, borderDash: [2, 4], borderWidth: 1, pointRadius: 0, borderColor: '#dc2626' }
        ]);
      });
    }

    sel.onchange = function () { drawTrends(parseInt(sel.value)); };
    setTimeout(function () { drawTrends(3); }, 80);
  }

  /* ══════════════════════════════════════════
     NORMALITY
  ══════════════════════════════════════════ */
  function norm() {
    var cont = ge('normContent');
    if (!D.hasData()) return noData('normContent');
    cont.innerHTML = '';
    var cols = D.getCols();

    var c1 = el('div', 'card'); ap(c1, el('div', 'slbl', 'Uji Normalitas Shapiro-Wilk'));
    var hdrs = ['Variabel', 'N', 'W Statistik', 'p-value', 'Sig.', 'Kesimpulan'];
    var rows = cols.map(function (col) {
      var sw = M.shapiroWilk(col.values), ok = sw.p > 0.05;
      var row = [col.name, col.values.length, M.fmt(sw.W, 4), M.fmtP(sw.p), M.sigStars(sw.p), ok ? 'Normal ✓' : 'Tidak Normal ✗'];
      row._tdcls = ['', '', 'num', 'num', ok ? 'num green' : 'num neg', ok ? 'num green' : 'num neg'];
      return row;
    });
    ap(c1, UI.buildTable(hdrs, rows));
    ap(c1, UI.alert('H0: data berdistribusi normal.   p > 0.05 = tidak tolak H0 = distribusi normal.   *** p<0.001  ** p<0.01  * p<0.05  ns = tidak signifikan', 'blue'));
    ap(cont, c1);

    var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;';
    cols.forEach(function (col, ci) {
      var card = el('div', 'card'); card.style.padding = '14px';
      ap(card, el('div', 'slbl', 'QQ Plot — ' + col.name));
      var wr = el('div', 'chart-wrap h200'); var cv = el('canvas'); cv.id = 'qq_' + ci; ap(wr, cv); ap(card, wr);
      ap(grid, card);
    });
    ap(cont, grid);
    setTimeout(function () { cols.forEach(function (col, ci) { C.qqplot('qq_' + ci, col.values); }); }, 60);
  }

  /* ══════════════════════════════════════════
     CORRELATION
  ══════════════════════════════════════════ */
  function corr() {
    var cont = ge('corrContent');
    if (!D.hasData()) return noData('corrContent');
    cont.innerHTML = '';
    var cols = D.getCols();
    var type = (ge('corrType') || { value: 'pearson' }).value;
    var n2 = cols.length;
    var matrix = [];
    for (var i = 0; i < n2; i++) {
      matrix.push([]);
      for (var j = 0; j < n2; j++) {
        matrix[i].push(i === j ? { r: 1, p: 0 } : (type === 'spearman' ? M.spearman(cols[i].values, cols[j].values) : M.pearson(cols[i].values, cols[j].values)));
      }
    }

    var c1 = el('div', 'card'); ap(c1, el('div', 'slbl', 'Heatmap Korelasi (' + (type === 'pearson' ? 'Pearson' : 'Spearman') + ')'));
    var sz = Math.max(300, n2 * 75);
    var hmDiv = el('div'); hmDiv.style.overflowX = 'auto';
    var hmC = el('canvas'); hmC.id = 'corrHM'; hmC.width = sz; hmC.height = sz; hmC.style.cssText = 'max-width:100%;display:block;margin:0 auto;';
    ap(hmDiv, hmC); ap(c1, hmDiv); ap(cont, c1);

    var c2 = el('div', 'card'); ap(c2, el('div', 'slbl', 'Tabel Korelasi'));
    var hdrs = ['Variabel'].concat(cols.map(function (c) { return c.name; }));
    var rows = cols.map(function (ci2, i) {
      var row = [ci2.name];
      cols.forEach(function (cj, j) {
        if (i === j) { row.push('1.000'); }
        else {
          var r = matrix[i][j].r, p = matrix[i][j].p;
          row.push(M.fmt(r, 3) + ' (' + M.fmtP(p) + ' ' + M.sigStars(p) + ')');
        }
      });
      return row;
    });
    ap(c2, UI.buildTable(hdrs, rows)); ap(cont, c2);
    setTimeout(function () { C.heatmap('corrHM', matrix, cols.map(function (c) { return c.name; })); }, 60);
  }

  /* ══════════════════════════════════════════
     REGRESSION
  ══════════════════════════════════════════ */
  function reg() {
    var cont = ge('regContent');
    if (!D.hasData()) return noData('regContent');
    cont.innerHTML = '';
    var cols = D.getCols();

    var ctrl = el('div', 'card'); ap(ctrl, el('div', 'slbl', 'Konfigurasi Regresi Linear'));
    var g2 = el('div', 'g2');
    ['Y (Dependen)', 'X (Independen) — Ctrl+klik untuk multi'].forEach(function (lbl2, idx) {
      var div = el('div');
      ap(div, el('label', '', lbl2));
      var sel = el('select'); sel.id = idx === 0 ? 'regY' : 'regX';
      if (idx === 1) { sel.multiple = true; sel.size = Math.min(4, cols.length); }
      sel.style.cssText = 'width:100%;';
      cols.forEach(function (c, i) {
        var opt = el('option', '', c.name); opt.value = i;
        if (idx === 0 && i === cols.length - 1) opt.selected = true;
        if (idx === 1 && i < cols.length - 1) opt.selected = true;
        ap(sel, opt);
      });
      ap(div, sel); ap(g2, div);
    });
    ap(ctrl, g2);
    var btn = el('button', 'btn btn-t', 'Jalankan Regresi'); btn.style.marginTop = '14px'; btn.onclick = execReg; ap(ctrl, btn);
    ap(cont, ctrl);
    var resDiv = el('div'); resDiv.id = 'regRes'; ap(cont, resDiv);
    execReg();
  }

  function execReg() {
    var cols = D.getCols(), isF = D.getMode() === 'finance';
    var yIdx = parseInt(ge('regY').value);
    var xIdxs = Array.from(ge('regX').selectedOptions).map(function (o) { return parseInt(o.value); });
    if (!xIdxs.length) { UI.toast('Pilih variabel X!', 'warn'); return; }
    var y = cols[yIdx].values, xCols = xIdxs.map(function (i) { return cols[i].values; });
    var resDiv = ge('regRes'); resDiv.innerHTML = '';
    var result = xCols.length === 1 ? M.simpleReg(xCols[0], y) : M.multiReg(xCols, y);
    if (!result) { ap(resDiv, UI.alert('Gagal: matriks singular atau data tidak cukup.', 'red')); return; }

    var c1 = el('div', 'card'); ap(c1, el('div', 'slbl', 'Ringkasan Model — Y: ' + cols[yIdx].name));
    var sg = el('div', 'g4'); sg.style.marginBottom = '16px';
    [{ lbl: 'R²', val: M.fmt(result.r2, 4), cls: 'green' }, { lbl: 'R² Adjusted', val: M.fmt(result.r2adj, 4), cls: 'blue' },
     { lbl: 'F Statistik', val: M.fmt(result.F, 3), cls: '' }, { lbl: 'p-value (F)', val: M.fmtP(result.pF) + ' ' + M.sigStars(result.pF), cls: result.pF < 0.05 ? 'red' : '' }
    ].forEach(function (s) { ap(sg, UI.statCard(s.lbl, s.val, s.cls)); });
    ap(c1, sg);

    var names  = ['(Intercept)'].concat(xIdxs.map(function (i) { return cols[i].name; }));
    var betas  = result.b0 !== undefined ? [result.b0, result.b1] : result.beta;
    var ses    = result.se0 !== undefined ? [result.se0, result.se1] : result.se;
    var ts     = result.t0 !== undefined ? [result.t0, result.t1] : result.tv;
    var ps     = result.p0 !== undefined ? [result.p0, result.p1] : result.pv;
    var hdrs   = ['Koefisien', 'Estimasi', 'Std Error', 't-value', 'p-value', 'Sig.'];
    var rows   = names.map(function (nm, i) {
      var row = [nm, M.fmt(betas[i], 4), M.fmt(ses[i], 4), M.fmt(ts[i], 3), M.fmtP(ps[i]), M.sigStars(ps[i])];
      row._tdcls = ['', 'num', 'num', 'num', 'num', ps[i] < 0.05 ? 'num neg' : 'sig-ns'];
      return row;
    });
    ap(c1, UI.buildTable(hdrs, rows)); ap(resDiv, c1);

    if (xCols.length === 1) {
      var c2 = el('div', 'card'); ap(c2, el('div', 'slbl', 'Plot Regresi & Residual'));
      var g2 = el('div', 'g2');
      ['regScatter', 'regResid'].forEach(function (cid) {
        var wr = el('div', 'chart-wrap h240'); var cv = el('canvas'); cv.id = cid; ap(wr, cv); ap(g2, wr);
      });
      ap(c2, g2); ap(resDiv, c2);
      setTimeout(function () {
        C.kill('regScatter'); C.kill('regResid');
        var x = xCols[0], xMn = Math.min.apply(null, x), xMx = Math.max.apply(null, x);
        C.scatter('regScatter', [
          { label: 'Data', data: x.map(function (v, i) { return { x: v, y: y[i] }; }), backgroundColor: 'rgba(5,150,105,0.5)', pointRadius: 5 },
          { label: 'Regresi', data: [{ x: xMn, y: result.b0 + result.b1 * xMn }, { x: xMx, y: result.b0 + result.b1 * xMx }], type: 'line', borderColor: '#dc2626', borderWidth: 2, pointRadius: 0 }
        ], cols[xIdxs[0]].name, cols[yIdx].name);
        var fMn = Math.min.apply(null, result.yhat), fMx = Math.max.apply(null, result.yhat);
        C.scatter('regResid', [
          { label: 'Residual', data: result.yhat.map(function (v, i) { return { x: v, y: result.resid[i] }; }), backgroundColor: 'rgba(29,78,216,0.5)', pointRadius: 4 },
          { label: 'y=0', data: [{ x: fMn, y: 0 }, { x: fMx, y: 0 }], type: 'line', borderColor: '#dc2626', borderWidth: 1, borderDash: [4, 3], pointRadius: 0 }
        ], 'Fitted Values', 'Residuals');
      }, 60);
    }
  }

  /* ══════════════════════════════════════════
     ANOVA
  ══════════════════════════════════════════ */
  function anova() {
    var cont = ge('anovaContent');
    if (!D.hasData()) return noData('anovaContent');
    cont.innerHTML = '';
    var cols = D.getCols();
    var ctrl = el('div', 'card'); ap(ctrl, el('div', 'slbl', 'Konfigurasi ANOVA Satu Arah'));
    var g2 = el('div', 'g2');
    [['Variabel Response', 'anovaVal', false], ['Jumlah Kelompok (k)', 'anovaK', true]].forEach(function (spec) {
      var d = el('div'); ap(d, el('label', '', spec[0]));
      var inp = spec[2] ? document.createElement('input') : el('select');
      inp.id = spec[1]; inp.style.cssText = 'width:100%;';
      if (spec[2]) { inp.type = 'number'; inp.value = '3'; inp.min = '2'; inp.max = '10'; }
      else { cols.forEach(function (c, i) { var opt = el('option', '', c.name); opt.value = i; if (i === cols.length - 1) opt.selected = true; ap(inp, opt); }); }
      ap(d, inp); ap(g2, d);
    });
    ap(ctrl, g2);
    var btn = el('button', 'btn btn-t', 'Jalankan ANOVA'); btn.style.marginTop = '14px'; btn.onclick = execAnova; ap(ctrl, btn);
    ap(cont, ctrl);
    var resDiv = el('div'); resDiv.id = 'anovaRes'; ap(cont, resDiv);
    execAnova();
  }

  function execAnova() {
    var cols = D.getCols(), valIdx = parseInt(ge('anovaVal').value), k = parseInt(ge('anovaK').value);
    var vals = cols[valIdx].values, n2 = vals.length;
    if (n2 < k * 2) { UI.toast('Data terlalu sedikit untuk ' + k + ' kelompok', 'warn'); return; }
    var cs = Math.floor(n2 / k), groups = [];
    for (var i = 0; i < k; i++) { var st = i * cs, en = i === k - 1 ? n2 : st + cs; groups.push({ name: 'Grup ' + (i + 1), v: vals.slice(st, en) }); }
    var res = M.anova1way(groups);
    var resDiv = ge('anovaRes'); resDiv.innerHTML = '';

    var c1 = el('div', 'card'); ap(c1, el('div', 'slbl', 'Hasil ANOVA — ' + cols[valIdx].name));
    var sg = el('div', 'g4'); sg.style.marginBottom = '16px';
    [{ lbl: 'F Statistik', val: M.fmt(res.F, 4) }, { lbl: 'p-value', val: M.fmtP(res.p) + ' ' + M.sigStars(res.p) },
     { lbl: 'df Antar', val: res.dfB }, { lbl: 'df Dalam', val: res.dfW }
    ].forEach(function (s) { ap(sg, UI.statCard(s.lbl, String(s.val), res.p < 0.05 && s.lbl === 'p-value' ? 'red' : '')); });
    ap(c1, sg);
    ap(c1, UI.buildTable(['Sumber', 'SS', 'df', 'MS', 'F', 'p-value'],
      [['Antar Grup', M.fmt(res.SSB, 4), res.dfB, M.fmt(res.MSB, 4), M.fmt(res.F, 4), M.fmtP(res.p)],
       ['Dalam Grup', M.fmt(res.SSW, 4), res.dfW, M.fmt(res.MSW, 4), '-', '-'],
       ['Total', M.fmt(res.SSB + res.SSW, 4), res.dfB + res.dfW, '-', '-', '-']]));
    ap(c1, UI.alert((res.p < 0.05 ? 'Terdapat perbedaan signifikan antar kelompok (p = ' : 'Tidak ada perbedaan signifikan (p = ') + M.fmtP(res.p) + ')', res.p < 0.05 ? 'red' : 'green'));
    ap(resDiv, c1);
    ap(resDiv, function () {
      var c2 = el('div', 'card'); ap(c2, el('div', 'slbl', 'Statistik Per Kelompok'));
      ap(c2, UI.buildTable(['Kelompok', 'N', 'Mean', 'Median', 'Std Dev', 'Min', 'Maks'],
        groups.map(function (g) { return [g.name, g.v.length, M.fmt(M.mean(g.v), 3), M.fmt(M.median(g.v), 3), M.fmt(M.sd(g.v), 3), M.fmt(Math.min.apply(null, g.v), 3), M.fmt(Math.max.apply(null, g.v), 3)]; })));
      return c2;
    }());
    var c3 = el('div', 'card'); ap(c3, el('div', 'slbl', 'Distribusi Per Kelompok'));
    var wr = el('div', 'chart-wrap h280'); var cv = el('canvas'); cv.id = 'anovaPlot'; ap(wr, cv); ap(c3, wr); ap(resDiv, c3);
    setTimeout(function () {
      C.kill('anovaPlot');
      var datasets = groups.map(function (g, i) {
        return { label: g.name, data: g.v.map(function (v) { return { x: i + 1 + (Math.random() - 0.5) * 0.3, y: v }; }), pointRadius: 5 };
      });
      datasets.push({ label: 'Median', data: groups.map(function (g, i) { return { x: i + 1, y: M.median(g.v) }; }), backgroundColor: '#1a1a2e', pointRadius: 10, pointStyle: 'crossRot', borderColor: '#1a1a2e', borderWidth: 2 });
      C.scatter('anovaPlot', datasets, 'Kelompok', cols[valIdx].name);
    }, 60);
  }

  /* ══════════════════════════════════════════
     SCATTER MATRIX
  ══════════════════════════════════════════ */
  function plotMatrix() {
    var cont = ge('plotContent');
    if (!D.hasData()) return noData('plotContent');
    cont.innerHTML = '';
    var cols = D.getCols().slice(0, 5), n2 = cols.length;
    if (n2 < 2) { ap(cont, UI.emptyState('📊', 'Butuh minimal 2 variabel.')); return; }
    var card = el('div', 'card');
    ap(card, el('div', 'slbl', 'Scatter Plot Matrix' + (D.getCols().length > 5 ? ' (5 variabel pertama)' : '')));
    var grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + n2 + ',1fr);gap:3px;';
    for (var i = 0; i < n2; i++) {
      for (var j = 0; j < n2; j++) {
        var cell = el('div'); cell.style.cssText = 'position:relative;';
        var inner = el('div'); inner.style.cssText = 'padding-bottom:100%;position:relative;';
        var cv = el('canvas'); cv.id = 'sm_' + i + '_' + j; cv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        ap(inner, cv); ap(cell, inner); ap(grid, cell);
      }
    }
    ap(card, grid); ap(cont, card);
    setTimeout(function () {
      for (var i = 0; i < n2; i++) {
        for (var j = 0; j < n2; j++) {
          C.kill('sm_' + i + '_' + j);
          if (i === j) { C.histogram('sm_' + i + '_' + j, cols[i].values, cols[i].name); }
          else {
            C.kill('sm_' + i + '_' + j);
            var xi = cols[j].values, yi = cols[i].values;
            SL.Charts.registry['sm_' + i + '_' + j] = new Chart(ge('sm_' + i + '_' + j), {
              type: 'scatter',
              data: { datasets: [{ data: xi.map(function (v, k) { return { x: v, y: yi[k] }; }), backgroundColor: 'rgba(29,78,216,0.3)', pointRadius: 2 }] },
              options: { responsive: false, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } }, animation: false }
            });
          }
        }
      }
    }, 100);
  }

  /* ══════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════ */
  function exportPanel() {
    if (!D.hasData()) { ge('expPre').textContent = 'Belum ada data.'; return; }
    var cols = D.getCols(), labels = D.getLabels();
    var lines = [
      '=== LAPORAN STATISTIK — STATLAB v2.0 ===',
      'Dibuat    : ' + new Date().toLocaleString('id-ID'),
      'Mode      : ' + (D.getMode() === 'finance' ? 'Keuangan' : 'Umum/Lab'),
      'Variabel  : ' + cols.length,
      'Observasi : ' + cols[0].values.length,
      ''
    ];
    cols.forEach(function (c) {
      var sw = M.shapiroWilk(c.values);
      lines.push('--- ' + c.name + ' ---');
      lines.push('  N=' + c.values.length + '  Mean=' + M.fmt(M.mean(c.values), 4) + '  SD=' + M.fmt(M.sd(c.values), 4));
      lines.push('  Min=' + M.fmt(Math.min.apply(null, c.values), 3) + '  Maks=' + M.fmt(Math.max.apply(null, c.values), 3) + '  Median=' + M.fmt(M.median(c.values), 4));
      lines.push('  Skew=' + M.fmt(M.skewness(c.values), 4) + '  Kurt=' + M.fmt(M.kurtosis(c.values), 4));
      lines.push('  Shapiro-Wilk W=' + M.fmt(sw.W, 4) + '  p=' + M.fmtP(sw.p) + '  ' + M.sigStars(sw.p));
      lines.push('');
    });
    if (cols.length > 1) {
      lines.push('--- MATRIKS KORELASI PEARSON ---');
      var hdr = '        ' + cols.map(function (c) { return c.name.substr(0, 8).padEnd(10); }).join('');
      lines.push(hdr);
      cols.forEach(function (ci2) {
        var row = ci2.name.substr(0, 7).padEnd(8) + cols.map(function (cj) { return M.fmt(M.pearson(ci2.values, cj.values).r, 4).padEnd(10); }).join('');
        lines.push(row);
      });
    }
    ge('expPre').textContent = lines.join('\n');
  }

  return {
    input: input, overview: overview, desc: desc, trend: trend,
    norm: norm, corr: corr, reg: reg, anova: anova,
    plotMatrix: plotMatrix, exportPanel: exportPanel,
    execReg: execReg, execAnova: execAnova
  };

}());

window.SL = SL;
