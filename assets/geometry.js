/*
 * Geometry for the flywheel diagrams.
 *
 * The commons flywheel is a circle of nodes. Each outer loop is an arc of a
 * second circle that passes through the two commons nodes it attaches to and
 * bulges away from the centre, so every loop reads as a clean circle.
 */
(function () {
  "use strict";

  var GAP = 7;        // clear space between a line and the box it meets
  var HEAD = 9;       // arrowhead length
  var HEAD_W = 4.5;   // arrowhead half-width

  function rad(a) { return (a * Math.PI) / 180; }
  function deg(r) { return (r * 180) / Math.PI; }
  function mod360(a) { return ((a % 360) + 360) % 360; }

  function polar(c, r, a) {
    return [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
  }

  function angleOf(c, p) {
    return mod360(deg(Math.atan2(p[1] - c[1], p[0] - c[0])));
  }

  function rectOf(n) {
    return [n.cx - n.w / 2, n.cy - n.h / 2, n.cx + n.w / 2, n.cy + n.h / 2];
  }

  function distToRect(p, rc) {
    var dx = Math.max(rc[0] - p[0], 0, p[0] - rc[2]);
    var dy = Math.max(rc[1] - p[1], 0, p[1] - rc[3]);
    return Math.hypot(dx, dy);
  }

  function fmt(n) { return n.toFixed(1); }

  function arrowHead(tip, dir) {
    var L = Math.hypot(dir[0], dir[1]);
    var ux = dir[0] / L, uy = dir[1] / L;
    var bx = tip[0] - ux * HEAD, by = tip[1] - uy * HEAD;
    var px = -uy * HEAD_W, py = ux * HEAD_W;
    return [tip, [bx + px, by + py], [bx - px, by - py]]
      .map(function (p) { return fmt(p[0]) + "," + fmt(p[1]); })
      .join(" ");
  }

  /*
   * An arc of circle (c, r) from node n1 (at angle a1) to node n2 (at a2),
   * travelling in direction dir (+1 clockwise on screen, -1 anticlockwise).
   * The arc starts and stops GAP units clear of each box.
   */
  function arc(c, r, n1, a1, n2, a2, dir) {
    var r1 = rectOf(n1), r2 = rectOf(n2);
    var a = a1;
    while (distToRect(polar(c, r, a), r1) < GAP) a += dir * 0.1;
    var b = a2;
    while (distToRect(polar(c, r, b), r2) < GAP) b -= dir * 0.1;
    var tip = polar(c, r, b);
    var bb = b - dir * deg((HEAD - 1) / r);
    var p0 = polar(c, r, a), p1 = polar(c, r, bb);
    var large = Math.abs(bb - a) > 180 ? 1 : 0;
    var sweep = dir > 0 ? 1 : 0;
    var t = rad(b);
    return {
      d: "M" + fmt(p0[0]) + " " + fmt(p0[1]) +
         " A" + fmt(r) + " " + fmt(r) + " 0 " + large + " " + sweep + " " +
         fmt(p1[0]) + " " + fmt(p1[1]),
      head: arrowHead(tip, [-Math.sin(t) * dir, Math.cos(t) * dir])
    };
  }

  /* A straight line between two boxes, from an optional offset point in each. */
  function straight(n1, n2, off1, off2) {
    off1 = off1 || [0, 0]; off2 = off2 || [0, 0];
    var p = [n1.cx + off1[0], n1.cy + off1[1]];
    var q = [n2.cx + off2[0], n2.cy + off2[1]];
    var L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    var ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L;
    var r1 = rectOf(n1), r2 = rectOf(n2);
    var t0 = 0, t1 = L;
    while (distToRect([p[0] + ux * t0, p[1] + uy * t0], r1) < GAP) t0 += 0.5;
    while (distToRect([p[0] + ux * t1, p[1] + uy * t1], r2) < GAP) t1 -= 0.5;
    var a = [p[0] + ux * t0, p[1] + uy * t0];
    var tip = [p[0] + ux * t1, p[1] + uy * t1];
    var e = [tip[0] - ux * (HEAD - 1), tip[1] - uy * (HEAD - 1)];
    return {
      d: "M" + fmt(a[0]) + " " + fmt(a[1]) + " L" + fmt(e[0]) + " " + fmt(e[1]),
      head: arrowHead(tip, [ux, uy])
    };
  }

  /* A gently bowed curve between two boxes. bend is in units, sign sets side. */
  function curve(n1, n2, bend, off1, off2) {
    off1 = off1 || [0, 0]; off2 = off2 || [0, 0];
    var p = [n1.cx + off1[0], n1.cy + off1[1]];
    var q = [n2.cx + off2[0], n2.cy + off2[1]];
    var m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    var L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    var nrm = [-(q[1] - p[1]) / L, (q[0] - p[0]) / L];
    var c = [m[0] + nrm[0] * bend, m[1] + nrm[1] * bend];
    function B(t) {
      var u = 1 - t;
      return [u * u * p[0] + 2 * u * t * c[0] + t * t * q[0],
              u * u * p[1] + 2 * u * t * c[1] + t * t * q[1]];
    }
    var r1 = rectOf(n1), r2 = rectOf(n2);
    var t0 = 0, t1 = 1;
    while (distToRect(B(t0), r1) < GAP) t0 += 0.002;
    while (distToRect(B(t1), r2) < GAP) t1 -= 0.002;
    var pts = [];
    for (var i = 0; i <= 40; i++) pts.push(B(t0 + ((t1 - t0) * i) / 40));
    var tip = pts[pts.length - 1], prev = pts[pts.length - 3];
    var dir = [tip[0] - prev[0], tip[1] - prev[1]];
    while (Math.hypot(pts[pts.length - 1][0] - tip[0], pts[pts.length - 1][1] - tip[1]) < HEAD - 1) pts.pop();
    return {
      d: "M" + pts.map(function (pt) { return fmt(pt[0]) + " " + fmt(pt[1]); }).join(" L"),
      head: arrowHead(tip, dir)
    };
  }

  /*
   * The circle of an outer loop: through the centres of nodes a and b, bulging
   * `bulge` units away from the commons centre C. Returns its centre K, radius,
   * the angle of a on it, the travel direction and the span of the outer arc.
   */
  function lens(C, a, b, bulge) {
    var S = [a.cx, a.cy], I = [b.cx, b.cy];
    var M = [(S[0] + I[0]) / 2, (S[1] + I[1]) / 2];
    var v = [I[0] - S[0], I[1] - S[1]];
    var L = Math.hypot(v[0], v[1]), h = L / 2;
    var n = [-v[1] / L, v[0] / L];
    if ((C[0] - M[0]) * n[0] + (C[1] - M[1]) * n[1] > 0) n = [-n[0], -n[1]];
    var r = (h * h + bulge * bulge) / (2 * bulge);
    var t = bulge - r;
    var K = [M[0] + t * n[0], M[1] + t * n[1]];
    var apex = [M[0] + bulge * n[0], M[1] + bulge * n[1]];
    var aA = angleOf(K, S), aB = angleOf(K, I), aP = angleOf(K, apex);
    var inc = mod360(aP - aA) < mod360(aB - aA);
    var dir = inc ? 1 : -1;
    var span = inc ? mod360(aB - aA) : mod360(aA - aB);
    return { K: K, r: r, aA: aA, dir: dir, span: span };
  }

  window.FlywheelGeometry = {
    polar: polar,
    rectOf: rectOf,
    arc: arc,
    straight: straight,
    curve: curve,
    lens: lens
  };
})();
