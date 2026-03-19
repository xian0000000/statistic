/* js/math.js — StatLab Statistical Engine */
var SL = window.SL || {};

SL.Math = (function () {

  function sum(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
  function mean(a) { return sum(a) / a.length; }
  function variance(a, sample) {
    var m = mean(a), n = a.length;
    var ss = a.reduce(function (s, v) { return s + Math.pow(v - m, 2); }, 0);
    return ss / (sample === false ? n : n - 1);
  }
  function sd(a, sample) { return Math.sqrt(variance(a, sample)); }
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length;
    return n % 2 === 0 ? (s[n / 2 - 1] + s[n / 2]) / 2 : s[Math.floor(n / 2)];
  }
  function pct(a, p) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var idx = p / 100 * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? s[lo] : s[lo] + (idx - lo) * (s[hi] - s[lo]);
  }
  function skewness(a) {
    var m = mean(a), s = sd(a, false), n = a.length;
    if (s === 0) return 0;
    return a.reduce(function (acc, v) { return acc + Math.pow((v - m) / s, 3); }, 0) / n;
  }
  function kurtosis(a) {
    var m = mean(a), s = sd(a, false), n = a.length;
    if (s === 0) return 0;
    return a.reduce(function (acc, v) { return acc + Math.pow((v - m) / s, 4); }, 0) / n - 3;
  }
  function mode(a) {
    var map = {};
    a.forEach(function (v) { var k = +v.toFixed(4); map[k] = (map[k] || 0) + 1; });
    var mx = Math.max.apply(null, Object.values(map));
    return Object.keys(map).filter(function (k) { return map[k] === mx; }).map(Number);
  }
  function cv(a) { var m = mean(a); return Math.abs(m) > 1e-10 ? sd(a) / m * 100 : 0; }
  function roc(prev, curr) { return prev !== 0 ? (curr - prev) / Math.abs(prev) * 100 : 0; }
  function movingAvg(a, w) {
    return a.map(function (_, i) {
      if (i < w - 1) return null;
      return mean(a.slice(i - w + 1, i + 1));
    });
  }

  /* ── Probability helpers ── */
  function erf(x) {
    var sg = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sg * y;
  }
  function normCDF(x) { return 0.5 * (1 + erf(x / Math.sqrt(2))); }
  function normQ(p) {
    var c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863, 0.0038405729373609, 0.0003951896511349, 0.0000321767881768, 0.0000002888167364, 0.0000003960315187];
    var a = [0, 2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
    var b = [0, -8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
    var x;
    if (p < 0.08) { var r = Math.sqrt(-2 * Math.log(p)); x = -(((c[3] * r + c[2]) * r + c[1]) * r + c[0]) / ((c[7] * r + c[6]) * r * r + c[5] * r + c[4] + 1); }
    else if (p > 0.92) { var r = Math.sqrt(-2 * Math.log(1 - p)); x = (((c[3] * r + c[2]) * r + c[1]) * r + c[0]) / ((c[7] * r + c[6]) * r * r + c[5] * r + c[4] + 1); }
    else { var y2 = p - 0.5, r = y2 * y2; x = y2 * (((a[4] * r + a[3]) * r + a[2]) * r + a[1]) / ((((b[4] * r + b[3]) * r + b[2]) * r + b[1]) * r + 1); }
    return x;
  }
  function lgamma(z) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var x = z, y = z, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); var ser = 1.000000000190015;
    for (var j = 0; j < 6; j++) { y++; ser += c[j] / y; }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betaCF(x, a, b) {
    var MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function betaInc(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    if (x > (a + 1) / (a + b + 2)) return 1 - betaInc(1 - x, b, a);
    var lbab = lgamma(a) + lgamma(b) - lgamma(a + b);
    return Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbab) * betaCF(x, a, b) / a;
  }
  function tCDF(t, df) { var x = df / (df + t * t); var p = 0.5 * betaInc(x, df / 2, 0.5); return t >= 0 ? 1 - p : p; }
  function tPval(t, df) { return 2 * (1 - tCDF(Math.abs(t), df)); }
  function fPval(F, d1, d2) { if (F <= 0) return 1; return 1 - betaInc(d1 * F / (d1 * F + d2), d1 / 2, d2 / 2); }

  /* ── Correlation ── */
  function rankArr(a) {
    var idx = a.map(function (v, i) { return { v: v, i: i }; });
    idx.sort(function (a, b) { return a.v - b.v; });
    var ranks = new Array(a.length), i = 0;
    while (i < idx.length) {
      var j = i;
      while (j < idx.length - 1 && idx[j + 1].v === idx[j].v) j++;
      var r = (i + j) / 2 + 1;
      for (var k = i; k <= j; k++) ranks[idx[k].i] = r;
      i = j + 1;
    }
    return ranks;
  }
  function pearson(x, y) {
    var n = Math.min(x.length, y.length), mx = mean(x), my = mean(y), num = 0, dx = 0, dy = 0;
    for (var i = 0; i < n; i++) { num += (x[i] - mx) * (y[i] - my); dx += Math.pow(x[i] - mx, 2); dy += Math.pow(y[i] - my, 2); }
    if (dx === 0 || dy === 0) return { r: 0, t: 0, p: 1, n: n };
    var r = num / Math.sqrt(dx * dy), t = r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
    return { r: r, t: t, p: tPval(t, n - 2), n: n };
  }
  function spearman(x, y) { return pearson(rankArr(x), rankArr(y)); }

  /* ── Shapiro-Wilk ── */
  function shapiroWilk(x) {
    var n = x.length; if (n < 3) return { W: NaN, p: NaN };
    var sorted = x.slice().sort(function (a, b) { return a - b; });
    var m = []; for (var i = 0; i < n; i++) m.push(normQ((i + 1 - 0.375) / (n + 0.25)));
    var mMean = mean(m), xMean = mean(sorted), num = 0, dm = 0, dx = 0;
    for (var i = 0; i < n; i++) { num += (sorted[i] - xMean) * (m[i] - mMean); dm += Math.pow(m[i] - mMean, 2); dx += Math.pow(sorted[i] - xMean, 2); }
    var W = Math.pow(num, 2) / (dm * dx);
    var lnW = Math.log(1 - W), lnN = Math.log(n), mu, sigma;
    if (n <= 11) { mu = -0.0006714 * Math.pow(n, 3) + 0.025054 * Math.pow(n, 2) - 0.6714 * n + 0.7570; sigma = Math.exp(-0.0020322 * Math.pow(n, 3) + 0.062767 * Math.pow(n, 2) - 0.77857 * n + 1.3096); }
    else { mu = 0.0038915 * Math.pow(lnN, 3) - 0.083751 * Math.pow(lnN, 2) - 0.31082 * lnN - 1.5861; sigma = Math.exp(0.021590 * Math.pow(lnN, 3) - 0.1674 * Math.pow(lnN, 2) + 0.6118 * lnN - 1.1930); }
    var z = (lnW - mu) / sigma, p = 1 - normCDF(z);
    return { W: W, p: Math.max(0.0001, Math.min(p, 0.9999)) };
  }

  /* ── Regression ── */
  function simpleReg(x, y) {
    var n = Math.min(x.length, y.length), mx = mean(x), my = mean(y), sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += Math.pow(x[i] - mx, 2); }
    if (sxx === 0) return null;
    var b1 = sxy / sxx, b0 = my - b1 * mx;
    var yhat = x.map(function (v) { return b0 + b1 * v; });
    var sst = y.reduce(function (s, v) { return s + Math.pow(v - my, 2); }, 0);
    var sse = y.reduce(function (s, v, i) { return s + Math.pow(v - yhat[i], 2); }, 0);
    var r2 = 1 - sse / sst, mse = sse / (n - 2), seb1 = Math.sqrt(mse / sxx), seb0 = Math.sqrt(mse * (1 / n + mx * mx / sxx));
    var t0 = b0 / seb0, t1 = b1 / seb1, F = (r2 / 1) / ((1 - r2) / (n - 2));
    return { b0: b0, b1: b1, se0: seb0, se1: seb1, t0: t0, t1: t1, p0: tPval(t0, n - 2), p1: tPval(t1, n - 2), r2: r2, r2adj: 1 - (1 - r2) * (n - 1) / (n - 2), F: F, pF: fPval(F, 1, n - 2), n: n, yhat: yhat, resid: y.map(function (v, i) { return v - yhat[i]; }) };
  }
  function multiReg(Xcols, y) {
    var n = y.length, k = Xcols.length;
    var X = []; for (var i = 0; i < n; i++) { var row = [1]; for (var j = 0; j < k; j++) row.push(Xcols[j][i]); X.push(row); }
    function matMul(A, B) { var ra = A.length, ca = A[0].length, cb = B[0].length, C = []; for (var i = 0; i < ra; i++) { C.push(new Array(cb).fill(0)); for (var kk = 0; kk < ca; kk++) for (var j = 0; j < cb; j++) C[i][j] += A[i][kk] * B[kk][j]; } return C; }
    function matT(A) { return A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); }); }
    function matInv(M) {
      var n2 = M.length, aug = M.map(function (r, i) { var a = r.slice(); for (var j = 0; j < n2; j++) a.push(i === j ? 1 : 0); return a; });
      for (var i = 0; i < n2; i++) {
        var mx2 = Math.abs(aug[i][i]), mxR = i;
        for (var k = i + 1; k < n2; k++) if (Math.abs(aug[k][i]) > mx2) { mx2 = Math.abs(aug[k][i]); mxR = k; }
        var tmp = aug[i]; aug[i] = aug[mxR]; aug[mxR] = tmp;
        var piv = aug[i][i]; if (Math.abs(piv) < 1e-12) throw new Error('singular');
        for (var j = 0; j < 2 * n2; j++) aug[i][j] /= piv;
        for (var kk = 0; kk < n2; kk++) { if (kk !== i) { var fc = aug[kk][i]; for (var j = 0; j < 2 * n2; j++) aug[kk][j] -= fc * aug[i][j]; } }
      }
      return aug.map(function (r) { return r.slice(n2); });
    }
    var Xt = matT(X), XtX = matMul(Xt, X), Xty = matMul(Xt, y.map(function (v) { return [v]; }));
    var XtXinv; try { XtXinv = matInv(XtX); } catch (e) { return null; }
    var beta = matMul(XtXinv, Xty).map(function (r) { return r[0]; });
    var yhat = X.map(function (row) { return row.reduce(function (s, v, j) { return s + v * beta[j]; }, 0); });
    var my = mean(y), sst = y.reduce(function (s, v) { return s + Math.pow(v - my, 2); }, 0), sse = y.reduce(function (s, v, i) { return s + Math.pow(v - yhat[i], 2); }, 0);
    var r2 = 1 - sse / sst, mse = sse / (n - k - 1), F = (r2 / k) / ((1 - r2) / (n - k - 1));
    var se = XtXinv.map(function (row, i) { return Math.sqrt(Math.abs(row[i] * mse)); });
    var tv = beta.map(function (b, i) { return b / se[i]; });
    var pv = tv.map(function (t) { return tPval(t, n - k - 1); });
    return { beta: beta, se: se, tv: tv, pv: pv, r2: r2, r2adj: 1 - (1 - r2) * (n - 1) / (n - k - 1), F: F, pF: fPval(F, k, n - k - 1), n: n, k: k, yhat: yhat, resid: y.map(function (v, i) { return v - yhat[i]; }) };
  }

  /* ── ANOVA ── */
  function anova1way(groups) {
    var allV = [], k = groups.length; groups.forEach(function (g) { allV = allV.concat(g.v); });
    var N = allV.length, gm = mean(allV), SSB = 0, SSW = 0;
    groups.forEach(function (g) { var gmu = mean(g.v); SSB += g.v.length * Math.pow(gmu - gm, 2); g.v.forEach(function (v) { SSW += Math.pow(v - gmu, 2); }); });
    var dfB = k - 1, dfW = N - k, MSB = SSB / dfB, MSW = SSW / dfW, F = MSB / MSW;
    return { F: F, p: fPval(F, dfB, dfW), dfB: dfB, dfW: dfW, SSB: SSB, SSW: SSW, MSB: MSB, MSW: MSW, N: N };
  }

  /* ── Financial helpers ── */
  function cumSum(a) {
    var s = 0;
    return a.map(function (v) { s += v; return s; });
  }
  function rollingMean(a, w) { return movingAvg(a, w); }
  function linearTrend(a) {
    var n = a.length, xs = a.map(function (_, i) { return i; });
    return simpleReg(xs, a);
  }
  function outliers(a, q1, q3, iqr) {
    return a.filter(function (v) { return v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr; });
  }

  /* ── Formatting ── */
  function fmt(v, d) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    d = d === undefined ? 4 : d;
    return (+v.toFixed(d)).toString();
  }
  function fmtRp(v) {
    if (isNaN(v)) return '-';
    return 'Rp ' + Math.round(v).toLocaleString('id-ID');
  }
  function fmtPct(v, d) { return fmt(v, d === undefined ? 1 : d) + '%'; }
  function fmtP(p) {
    if (isNaN(p)) return '-';
    if (p < 0.0001) return '< 0.0001';
    return fmt(p, 4);
  }
  function sigStars(p) { return isNaN(p) ? '' : p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'ns'; }

  return {
    sum: sum, mean: mean, variance: variance, sd: sd, median: median, pct: pct,
    skewness: skewness, kurtosis: kurtosis, mode: mode, cv: cv, roc: roc,
    movingAvg: movingAvg, cumSum: cumSum, rollingMean: rollingMean, linearTrend: linearTrend,
    normQ: normQ, normCDF: normCDF,
    pearson: pearson, spearman: spearman, rankArr: rankArr,
    shapiroWilk: shapiroWilk,
    simpleReg: simpleReg, multiReg: multiReg,
    anova1way: anova1way,
    outliers: outliers,
    fmt: fmt, fmtRp: fmtRp, fmtPct: fmtPct, fmtP: fmtP, sigStars: sigStars,
    tPval: tPval, fPval: fPval
  };

}());

window.SL = SL;
