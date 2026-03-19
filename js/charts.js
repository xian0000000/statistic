/* js/charts.js — StatLab Chart Rendering */
var SL = window.SL || {};

SL.Charts = (function () {

  var registry = {};

  function kill(id) {
    if (registry[id]) { try { registry[id].destroy(); } catch (e) { } delete registry[id]; }
  }
  function killAll() { Object.keys(registry).forEach(kill); }

  function make(id, config) {
    kill(id);
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var chart = new Chart(canvas, config);
    registry[id] = chart;
    return chart;
  }

  var COLORS = {
    green:  'rgba(5,150,105,0.7)',
    greenS: '#059669',
    blue:   'rgba(29,78,216,0.6)',
    blueS:  '#1d4ed8',
    red:    'rgba(220,38,38,0.65)',
    redS:   '#dc2626',
    amber:  'rgba(217,119,6,0.65)',
    amberS: '#d97706',
    purple: 'rgba(124,58,237,0.6)',
    purpleS:'#7c3aed',
    teal:   'rgba(20,184,166,0.6)',
    tealS:  '#14b8a6',
    palette: ['#059669','#1d4ed8','#dc2626','#d97706','#7c3aed','#14b8a6','#db2777','#ea580c']
  };

  var BASE_OPTS = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    animation: { duration: 300 }
  };

  /* ── Histogram ── */
  function histogram(id, values, label, bins) {
    bins = bins || Math.min(12, Math.ceil(Math.sqrt(values.length)));
    var mn = Math.min.apply(null, values), mx = Math.max.apply(null, values);
    var bw = (mx - mn) / bins || 1;
    var labels = [], counts = [];
    for (var i = 0; i < bins; i++) {
      var lo = mn + i * bw, hi = lo + bw;
      labels.push(SL.Math.fmt(lo, 1));
      counts.push(values.filter(function (v) { return v >= lo && (i === bins - 1 ? v <= hi : v < hi); }).length);
    }
    return make(id, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: label || 'Frekuensi', data: counts, backgroundColor: COLORS.green, borderColor: '#047857', borderWidth: 1, borderRadius: 3 }] },
      options: Object.assign({}, BASE_OPTS, { scales: { x: { ticks: { font: { size: 10 }, maxTicksLimit: 8 } }, y: { ticks: { stepSize: 1 } } } })
    });
  }

  /* ── Line chart ── */
  function line(id, labels, datasets) {
    return make(id, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets.map(function (ds, i) {
          return Object.assign({
            borderColor: COLORS.palette[i % COLORS.palette.length],
            borderWidth: 2, pointRadius: 3, fill: false, tension: 0.35
          }, ds);
        })
      },
      options: Object.assign({}, BASE_OPTS, {
        plugins: { legend: { display: datasets.length > 1, labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } }
      })
    });
  }

  /* ── Bar chart ── */
  function bar(id, labels, datasets, opts) {
    opts = opts || {};
    return make(id, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets.map(function (ds, i) {
          return Object.assign({ backgroundColor: COLORS.palette[i % COLORS.palette.length], borderRadius: 4, borderWidth: 0 }, ds);
        })
      },
      options: Object.assign({}, BASE_OPTS, {
        plugins: { legend: { display: datasets.length > 1, labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          x: { ticks: { font: { size: 10 } }, stacked: opts.stacked },
          y: { ticks: { font: { size: 10 }, callback: opts.rpFormat ? function (v) { return 'Rp ' + (v / 1000) + 'K'; } : undefined }, stacked: opts.stacked }
        }
      })
    });
  }

  /* ── Scatter ── */
  function scatter(id, datasets, xLabel, yLabel) {
    return make(id, {
      type: 'scatter',
      data: {
        datasets: datasets.map(function (ds, i) {
          return Object.assign({ backgroundColor: COLORS.palette[i % COLORS.palette.length], pointRadius: 5 }, ds);
        })
      },
      options: Object.assign({}, BASE_OPTS, {
        plugins: { legend: { display: datasets.length > 1, labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          x: { title: { display: !!xLabel, text: xLabel, font: { size: 11 } } },
          y: { title: { display: !!yLabel, text: yLabel, font: { size: 11 } } }
        }
      })
    });
  }

  /* ── KDE curve ── */
  function kde(id, values, label) {
    var M = SL.Math;
    var s = M.sd(values), bw = 1.06 * s * Math.pow(values.length, -0.2);
    if (bw === 0) bw = 0.1;
    var mn = M.mean(values), xMin = Math.min.apply(null, values) - 2 * s, xMax = Math.max.apply(null, values) + 2 * s;
    var xs = [], ys = [], yn = [];
    for (var i = 0; i < 60; i++) {
      var x = xMin + i * (xMax - xMin) / 59;
      xs.push(SL.Math.fmt(x, 1));
      ys.push(values.reduce(function (a, xi) { return a + Math.exp(-0.5 * Math.pow((x - xi) / bw, 2)); }, 0) / (values.length * bw * Math.sqrt(2 * Math.PI)));
      yn.push(s > 0 ? Math.exp(-0.5 * Math.pow((x - mn) / s, 2)) / (s * Math.sqrt(2 * Math.PI)) : 0);
    }
    return make(id, {
      type: 'line',
      data: {
        labels: xs,
        datasets: [
          { label: 'KDE ' + (label || ''), data: ys, borderColor: '#059669', borderWidth: 2, fill: true, backgroundColor: 'rgba(5,150,105,0.1)', tension: 0.4, pointRadius: 0 },
          { label: 'Normal', data: yn, borderColor: '#dc2626', borderWidth: 1.5, fill: false, borderDash: [5, 3], tension: 0.4, pointRadius: 0 }
        ]
      },
      options: Object.assign({}, BASE_OPTS, {
        plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: { x: { ticks: { maxTicksLimit: 7, font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } }
      })
    });
  }

  /* ── QQ Plot ── */
  function qqplot(id, values) {
    var M = SL.Math;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var n = sorted.length;
    var pts = sorted.map(function (v, i) { return { x: M.normQ((i + 1 - 0.375) / (n + 0.25)), y: v }; });
    var q25 = M.pct(sorted, 25), q75 = M.pct(sorted, 75);
    var nq25 = M.normQ(0.25), nq75 = M.normQ(0.75);
    var slope = (q75 - q25) / (nq75 - nq25), intercept = q25 - slope * nq25;
    var x0 = pts[0].x, x1 = pts[n - 1].x;
    return make(id, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Sampel', data: pts, backgroundColor: 'rgba(5,150,105,0.5)', pointRadius: 3 },
          { label: 'Normal', data: [{ x: x0, y: intercept + slope * x0 }, { x: x1, y: intercept + slope * x1 }], type: 'line', borderColor: '#dc2626', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, fill: false }
        ]
      },
      options: Object.assign({}, BASE_OPTS, {
        plugins: { legend: { display: false } },
        scales: { x: { title: { display: true, text: 'Kuantil Teoritis', font: { size: 10 } } }, y: { title: { display: true, text: 'Kuantil Sampel', font: { size: 10 } } } }
      })
    });
  }

  /* ── Correlation heatmap (Canvas 2D, not Chart.js) ── */
  function heatmap(canvasId, matrix, labels) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var n = labels.length, sz = canvas.width, mg = 90, cs = (sz - mg) / n;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, sz, sz);
    function corrColor(r) {
      var t = (r + 1) / 2, rr, g, b;
      if (t < 0.5) { t *= 2; rr = Math.round(220 + (245 - 220) * t); g = Math.round(38 + (130 - 38) * t); b = Math.round(38 + (70 - 38) * t); }
      else { t = (t - 0.5) * 2; rr = Math.round(245 + (29 - 245) * t); g = Math.round(130 + (100 - 130) * t); b = Math.round(70 + (165 - 70) * t); }
      return 'rgb(' + rr + ',' + g + ',' + b + ')';
    }
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var x = mg + j * cs, y = mg + i * cs, r = matrix[i][j].r;
        ctx.fillStyle = i === j ? '#f0fdf4' : corrColor(r);
        ctx.fillRect(x, y, cs - 1, cs - 1);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1a1a2e'; ctx.font = (cs > 65 ? '12' : '10') + 'px system-ui';
        if (i === j) { ctx.fillText('1.00', x + cs / 2, y + cs / 2); }
        else {
          ctx.fillText(SL.Math.fmt(r, 2), x + cs / 2, y + cs / 2 - 5);
          ctx.font = '9px system-ui'; ctx.fillStyle = '#666';
          ctx.fillText(SL.Math.fmtP(matrix[i][j].p), x + cs / 2, y + cs / 2 + 7);
        }
      }
    }
    for (var i = 0; i < n; i++) {
      var lbl = labels[i].length > 12 ? labels[i].substr(0, 12) + '..' : labels[i];
      ctx.fillStyle = '#1a1a2e'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = '11px system-ui';
      ctx.fillText(lbl, mg - 4, mg + i * cs + cs / 2);
      ctx.save(); ctx.translate(mg + i * cs + cs / 2, mg - 5); ctx.rotate(-Math.PI / 4); ctx.textAlign = 'left'; ctx.fillText(lbl, 0, 0); ctx.restore();
    }
  }

  /* ── Stacked area (finance) ── */
  function stackedArea(id, labels, datasets) {
    return make(id, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets.map(function (ds, i) {
          return Object.assign({
            borderColor: COLORS.palette[i % COLORS.palette.length],
            backgroundColor: COLORS.palette[i % COLORS.palette.length].replace(')', ',0.15)').replace('rgb', 'rgba'),
            borderWidth: 2, pointRadius: 2, fill: true, tension: 0.35
          }, ds);
        })
      },
      options: Object.assign({}, BASE_OPTS, {
        plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 10 }, callback: function (v) { return 'Rp ' + (v / 1000) + 'K'; } }, stacked: false }
        }
      })
    });
  }

  /* ── Doughnut ── */
  function doughnut(id, labels, values) {
    return make(id, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: COLORS.palette.slice(0, values.length), borderWidth: 2, borderColor: '#fff' }]
      },
      options: Object.assign({}, BASE_OPTS, {
        plugins: { legend: { display: true, position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } } }
      })
    });
  }

  return {
    kill: kill, killAll: killAll,
    histogram: histogram, line: line, bar: bar, scatter: scatter,
    kde: kde, qqplot: qqplot, heatmap: heatmap,
    stackedArea: stackedArea, doughnut: doughnut,
    COLORS: COLORS
  };

}());

window.SL = SL;
