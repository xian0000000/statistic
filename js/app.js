/* js/app.js — StatLab Application Controller */
var SL = window.SL || {};

SL.App = (function () {

  var UI = SL.UI, D = SL.Data, P = SL.Panels;

  /* ── Panel routing ── */
  SL.Panels.overview   = SL.Panels.overview;
  SL.Panels.desc       = SL.Panels.desc;
  SL.Panels.trend      = SL.Panels.trend;
  SL.Panels.norm       = SL.Panels.norm;
  SL.Panels.corr       = SL.Panels.corr;
  SL.Panels.reg        = SL.Panels.reg;
  SL.Panels.anova      = SL.Panels.anova;
  SL.Panels.plot       = SL.Panels.plotMatrix;
  SL.Panels.export     = SL.Panels.exportPanel;

  /* ── Drag & drop ── */
  var dz = document.getElementById('dropzone');
  dz.addEventListener('dragover',  function (e) { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', function ()  { dz.classList.remove('drag'); });
  dz.addEventListener('drop', function (e) {
    e.preventDefault(); dz.classList.remove('drag');
    var f = e.dataTransfer.files[0];
    if (!f) return;
    var inp = document.getElementById('csvFile');
    try { var dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; } catch (err) {}
    loadCSV(inp);
  });

  /* ── Load CSV ── */
  function loadCSV(inp) {
    var file = inp.files[0]; if (!file) return;
    var fr = new FileReader();
    fr.onload = function (e) {
      try {
        D.parseCSV(e.target.result);
        showPreview(file.name);
        UI.toast('CSV dimuat: ' + D.getCols().length + ' variabel, ' + D.getCols()[0].values.length + ' observasi');
      } catch (err) { UI.toast(err.message, 'error'); }
    };
    fr.readAsText(file);
  }

  /* ── Load samples ── */
  function loadSampleFinance() {
    D.loadSampleFinance();
    showPreview('Data Contoh Keuangan');
    UI.toast('Data keuangan dimuat: 12 bulan, 6 variabel');
  }
  function loadSampleLab() {
    D.loadSampleLab();
    showPreview('Data Contoh Lab');
    UI.toast('Data lab dimuat: 30 run, 4 variabel');
  }

  /* ── Show preview table ── */
  function showPreview(src) {
    var cols = D.getCols(), labels = D.getLabels(), isF = D.getMode() === 'finance';
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('previewSrc').textContent = 'Sumber: ' + src + ' — Mode: ' + (isF ? 'Keuangan' : 'Umum/Lab');
    document.getElementById('previewBadge').textContent = cols[0].values.length + ' obs, ' + cols.length + ' var';

    /* Show/hide total buttons for finance */
    document.getElementById('addTotalBtn').style.display = isF ? 'inline-flex' : 'none';
    document.getElementById('removeTotalBtn').style.display = 'none';

    renderPreviewTable();
  }

  function renderPreviewTable() {
    var cols = D.getCols(), labels = D.getLabels(), isF = D.getMode() === 'finance';
    var cont = document.getElementById('dataPreview');
    cont.innerHTML = '';
    var rows = Math.min(8, cols[0].values.length);
    var hdrs = ['#'].concat(cols.map(function (c) { return c.name; }));
    var trows = [];
    for (var i = 0; i < rows; i++) {
      var row = [labels[i]].concat(cols.map(function (c) {
        return isF ? SL.Math.fmtRp(c.values[i]) : SL.Math.fmt(c.values[i], 4);
      }));
      var cls = cols.map(function (c) { return c.isComputed ? 'total-row' : 'num'; });
      row._tdcls = [''].concat(cls);
      trows.push(row);
    }
    if (cols[0].values.length > 8) {
      var moreRow = ['...'].concat(cols.map(function () { return '...'; }));
      moreRow._class = 'tbl-more';
      trows.push(moreRow);
    }
    cont.appendChild(UI.buildTable(hdrs, trows, { fontSize: '12px' }));
  }

  /* ── Total column ── */
  function addTotal() {
    var cols = D.getCols();
    var expCols = cols.filter(function (c) { return !c.isComputed && c.name.toLowerCase() !== 'tabungan' && c.name.toLowerCase() !== 'pendapatan' && c.name.toLowerCase() !== 'gaji'; });
    var idxs = expCols.map(function (c) { return cols.indexOf(c); });
    D.addTotalColumn(idxs, 'Total Pengeluaran');
    renderPreviewTable();
    document.getElementById('removeTotalBtn').style.display = 'inline-flex';
    document.getElementById('addTotalBtn').style.display = 'none';
    UI.toast('Kolom Total Pengeluaran ditambahkan');
  }
  function removeTotal() {
    D.removeComputed();
    renderPreviewTable();
    document.getElementById('addTotalBtn').style.display = 'inline-flex';
    document.getElementById('removeTotalBtn').style.display = 'none';
    UI.toast('Kolom total dihapus');
  }

  /* ── Quick analyze ── */
  function quickAnalyze() {
    if (!D.hasData()) { UI.toast('Masukkan data terlebih dahulu!', 'warn'); return; }
    UI.goTab('overview', document.querySelector('.tab[data-tab=overview]'));
  }

  /* ── Reset ── */
  function resetAll() {
    D.clear();
    SL.Charts.killAll();
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('csvFile').value = '';
    ['overviewContent','descContent','trendContent','normContent','corrContent','regContent','anovaContent','plotContent'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.innerHTML = '';
    });
    UI.toast('Data direset');
  }

  /* ── Export ── */
  function expCSV() {
    if (!D.hasData()) { UI.toast('Tidak ada data!', 'warn'); return; }
    UI.download('statlab_data.csv', 'text/csv', D.toCSV());
    UI.toast('CSV diekspor!');
  }
  function expJSON() {
    if (!D.hasData()) { UI.toast('Tidak ada data!', 'warn'); return; }
    UI.download('statlab_results.json', 'application/json', D.toJSON());
    UI.toast('JSON diekspor!');
  }
  function expHTML() {
    if (!D.hasData()) { UI.toast('Tidak ada data!', 'warn'); return; }
    var cols = D.getCols(), M = SL.Math;
    var ts = new Date().toLocaleString('id-ID');

    var rows = cols.map(function (c) {
      var sw = M.shapiroWilk(c.values);
      return [c.name, c.values.length,
        M.fmt(M.mean(c.values), 4), M.fmt(M.median(c.values), 4), M.fmt(M.sd(c.values), 4),
        M.fmt(Math.min.apply(null, c.values), 3), M.fmt(Math.max.apply(null, c.values), 3),
        M.fmt(M.skewness(c.values), 4), M.fmt(M.kurtosis(c.values), 4),
        M.fmt(sw.W, 4), M.fmtP(sw.p), M.sigStars(sw.p)
      ];
    });

    var trows = rows.map(function (r) {
      return '<tr>' + r.map(function (v, i) { return '<td' + (i > 0 ? ' style="font-family:monospace;text-align:right"' : '') + '>' + v + '</td>'; }).join('') + '</tr>';
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan StatLab</title>' +
      '<style>body{font-family:Georgia,serif;max-width:1000px;margin:40px auto;padding:24px;color:#1a1a2e}' +
      'h1{border-bottom:3px solid #059669;padding-bottom:8px}h2{color:#047857;margin-top:24px;font-size:15px}' +
      'table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}' +
      'th{background:#ecfdf5;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}' +
      'td{padding:8px 12px;border-bottom:1px solid #eee}' +
      '.meta{font-size:13px;color:#888;margin-bottom:16px}</style>' +
      '</head><body>' +
      '<h1>Laporan Analisis Statistik &mdash; StatLab v2.0</h1>' +
      '<p class="meta">Dibuat: ' + ts + ' | Variabel: ' + cols.length + ' | Observasi: ' + cols[0].values.length + '</p>' +
      '<h2>Statistik Deskriptif</h2>' +
      '<table><thead><tr><th>Variabel</th><th>N</th><th>Mean</th><th>Median</th><th>SD</th><th>Min</th><th>Maks</th><th>Skew</th><th>Kurt</th><th>SW-W</th><th>SW-p</th><th>Sig</th></tr></thead>' +
      '<tbody>' + trows + '</tbody></table>' +
      '<h2>Data Mentah</h2>' +
      '<pre style="background:#f5f5f3;padding:14px;border-radius:6px;font-size:11px;overflow-x:auto">' + D.toCSV() + '</pre>' +
      '</body></html>';

    UI.download('laporan_statlab.html', 'text/html', html);
    UI.toast('Laporan HTML diekspor!');
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    /* Wire up export panel auto-render */
    var expTab = document.querySelector('.tab[data-tab=export]');
    if (expTab) {
      var orig = expTab.getAttribute('onclick');
      expTab.addEventListener('click', function () { setTimeout(SL.Panels.exportPanel, 100); });
    }
  });

  return {
    loadCSV: loadCSV, loadSampleFinance: loadSampleFinance, loadSampleLab: loadSampleLab,
    showPreview: showPreview, addTotal: addTotal, removeTotal: removeTotal,
    quickAnalyze: quickAnalyze, resetAll: resetAll,
    expCSV: expCSV, expJSON: expJSON, expHTML: expHTML
  };

}());

window.SL = SL;
