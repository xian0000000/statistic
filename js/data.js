/* js/data.js — StatLab Data Management */
var SL = window.SL || {};

SL.Data = (function () {

  var state = {
    cols: [],       // [{name, values}]
    labels: [],     // row labels (e.g. month names)
    mode: 'general' // 'general' | 'finance'
  };

  function getCols()   { return state.cols; }
  function getLabels() { return state.labels; }
  function getMode()   { return state.mode; }
  function setMode(m)  { state.mode = m; }
  function clear() { state.cols = []; state.labels = []; }
  function hasData()   { return state.cols.length > 0; }

  /* ── Parse CSV text ── */
  function parseCSV(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV butuh minimal 2 baris (header + data)');
    var headers = lines[0].split(',').map(function (h) { return h.trim().replace(/"/g, ''); });
    var cols = headers.map(function (h) { return { name: h, values: [], raw: [] }; });
    var labels = [];
    for (var i = 1; i < lines.length; i++) {
      var vals = lines[i].split(',');
      var rowLabel = null;
      headers.forEach(function (h, j) {
        var raw = (vals[j] || '').trim().replace(/"/g, '');
        var n = parseFloat(raw.replace(/[Rp\s\.]/g, '').replace(',', '.'));
        if (!isNaN(n)) { cols[j].values.push(n); cols[j].raw.push(raw); }
        else if (j === 0) rowLabel = raw;
      });
      if (rowLabel) labels.push(rowLabel);
    }
    var numCols = cols.filter(function (c) { return c.values.length > 1; });
    if (!numCols.length) throw new Error('Tidak ada kolom numerik ditemukan');
    state.cols = numCols;
    state.labels = labels.length === numCols[0].values.length ? labels : numCols[0].values.map(function (_, i) { return String(i + 1); });
    autoDetectMode();
    return state;
  }

  /* ── Auto-detect finance data ── */
  function autoDetectMode() {
    var financeKeywords = ['makan', 'transport', 'belanja', 'tagihan', 'tabungan', 'hiburan', 'gaji', 'pendapatan', 'pengeluaran', 'biaya', 'income', 'expense', 'saving', 'bulan', 'minggu'];
    var names = state.cols.map(function (c) { return c.name.toLowerCase(); });
    var matches = names.filter(function (n) { return financeKeywords.some(function (k) { return n.indexOf(k) !== -1; }); });
    state.mode = matches.length >= 2 ? 'finance' : 'general';
  }

  /* ── Add computed total column ── */
  function addTotalColumn(colIndices, label) {
    label = label || 'Total';
    var n = state.cols[colIndices[0]].values.length;
    var totals = [];
    for (var i = 0; i < n; i++) {
      var t = 0;
      colIndices.forEach(function (ci) { t += state.cols[ci].values[i] || 0; });
      totals.push(t);
    }
    // Remove existing total col if any
    state.cols = state.cols.filter(function (c) { return c.name !== label; });
    state.cols.push({ name: label, values: totals, isComputed: true });
    return totals;
  }

  /* ── Remove computed columns ── */
  function removeComputed() {
    state.cols = state.cols.filter(function (c) { return !c.isComputed; });
  }

  /* ── Sample datasets ── */
  function loadSampleLab() {
    var n = 30, cols = [
      { name: 'Suhu (C)',       values: [] },
      { name: 'Tekanan (bar)',  values: [] },
      { name: 'Waktu (min)',    values: [] },
      { name: 'Yield (%)',      values: [] }
    ];
    for (var i = 0; i < n; i++) {
      var temp     = +(59 + i * 2 + (Math.random() - 0.5) * 3).toFixed(2);
      var pressure = +(2.1 + temp * 0.01 + (Math.random() - 0.5) * 0.15).toFixed(3);
      var time2    = +(20 + (Math.random() - 0.5) * 4).toFixed(1);
      var yld      = +(50 + 0.25 * temp - 1.5 * pressure + (Math.random() - 0.5) * 3).toFixed(2);
      cols[0].values.push(temp);
      cols[1].values.push(pressure);
      cols[2].values.push(time2);
      cols[3].values.push(yld);
    }
    state.cols = cols;
    state.labels = cols[0].values.map(function (_, i) { return 'Run ' + (i + 1); });
    state.mode = 'general';
    return state;
  }

  function loadSampleFinance() {
    state.cols = [
      { name: 'Makan',     values: [850,780,900,820,760,950,870,800,920,750,1050,1200].map(function(v){return v*1000;}) },
      { name: 'Transport', values: [220,195,230,210,185,240,225,200,235,180,260,280].map(function(v){return v*1000;}) },
      { name: 'Hiburan',   values: [350,420,280,500,320,600,380,290,450,310,700,800].map(function(v){return v*1000;}) },
      { name: 'Belanja',   values: [180,250,120,300,160,400,220,140,280,170,500,600].map(function(v){return v*1000;}) },
      { name: 'Tagihan',   values: [450,450,450,450,450,450,450,450,450,450,450,450].map(function(v){return v*1000;}) },
      { name: 'Tabungan',  values: [500,420,550,350,480,200,430,510,380,490,100,50].map(function(v){return v*1000;}) }
    ];
    state.labels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    state.mode = 'finance';
    return state;
  }

  /* ── Export to CSV ── */
  function toCSV() {
    if (!state.cols.length) return '';
    var n = state.cols[0].values.length;
    var header = 'Label,' + state.cols.map(function (c) { return c.name; }).join(',');
    var rows = [header];
    for (var i = 0; i < n; i++) {
      rows.push(state.labels[i] + ',' + state.cols.map(function (c) { return c.values[i]; }).join(','));
    }
    return rows.join('\n');
  }

  /* ── Export stats to JSON ── */
  function toJSON() {
    var M = SL.Math;
    return JSON.stringify({
      generated: new Date().toISOString(),
      mode: state.mode,
      n: state.cols[0] ? state.cols[0].values.length : 0,
      variables: state.cols.map(function (c) {
        var sw = M.shapiroWilk(c.values);
        return {
          name: c.name,
          n: c.values.length,
          mean: +M.fmt(M.mean(c.values), 4),
          median: +M.fmt(M.median(c.values), 4),
          sd: +M.fmt(M.sd(c.values), 4),
          min: Math.min.apply(null, c.values),
          max: Math.max.apply(null, c.values),
          skewness: +M.fmt(M.skewness(c.values), 4),
          kurtosis: +M.fmt(M.kurtosis(c.values), 4),
          shapiro_W: +M.fmt(sw.W, 4),
          shapiro_p: +M.fmt(sw.p, 4),
          data: c.values
        };
      })
    }, null, 2);
  }

  return {
    getCols: getCols, getLabels: getLabels, getMode: getMode, setMode: setMode,
    clear: clear, hasData: hasData,
    parseCSV: parseCSV,
    addTotalColumn: addTotalColumn, removeComputed: removeComputed,
    loadSampleLab: loadSampleLab, loadSampleFinance: loadSampleFinance,
    toCSV: toCSV, toJSON: toJSON
  };

}());

window.SL = SL;
