/*
 * Flywheel explorer: draws the diagram from data.js, switches the outer loops
 * in and out around the fixed commons flywheel, and fills the side panel.
 */
(function () {
  "use strict";

  var DATA = window.FLYWHEELS;
  var G = window.FlywheelGeometry;
  var NS = "http://www.w3.org/2000/svg";

  var nodes = {};      // id -> node with position, size and owning loop
  var edges = [];      // drawn connections
  var loops = {};      // id -> loop definition (commons included)
  var views = ["commons"].concat(DATA.loops.map(function (l) { return l.id; }), ["all"]);
  var state = { view: "commons", selected: null };

  /* ---------- layout ---------- */

  function place(def, loopId, cx, cy) {
    var n = {
      id: def.id, loop: loopId, title: def.title, sub: def.sub || [],
      pills: def.pills || null, about: def.about || [], links: def.links || [],
      cx: cx, cy: cy, w: def.w || 150, h: def.h || 54
    };
    nodes[n.id] = n;
    return n;
  }

  function layout() {
    var C = DATA.commons.center, R = DATA.commons.radius;
    loops.commons = DATA.commons;

    var core = DATA.commons.nodes;
    core.forEach(function (def) {
      var p = G.polar(C, R, def.angle);
      place(def, "commons", p[0], p[1]);
    });
    core.forEach(function (def, i) {
      var next = core[(i + 1) % core.length];
      var a2 = next.angle < def.angle ? next.angle + 360 : next.angle;
      var seg = G.arc(C, R, nodes[def.id], def.angle, nodes[next.id], a2, 1);
      edges.push({ loop: "commons", kind: "core", from: def.id, to: next.id, d: seg.d, head: seg.head });
    });

    DATA.loops.forEach(function (loop) {
      loops[loop.id] = loop;
      var a = nodes[loop.attach.from], b = nodes[loop.attach.to];
      var L = G.lens(C, a, b, loop.bulge);
      var chain = [{ n: a, ang: L.aA }];
      loop.nodes.forEach(function (def) {
        var ang = L.aA + L.dir * def.frac * L.span;
        var p = G.polar(L.K, L.r, ang);
        chain.push({ n: place(def, loop.id, p[0], p[1]), ang: ang });
      });
      chain.push({ n: b, ang: L.aA + L.dir * L.span });
      for (var i = 0; i < chain.length - 1; i++) {
        var seg = G.arc(L.K, L.r, chain[i].n, chain[i].ang, chain[i + 1].n, chain[i + 1].ang, L.dir);
        edges.push({ loop: loop.id, kind: "loop", from: chain[i].n.id, to: chain[i + 1].n.id, d: seg.d, head: seg.head });
      }
      if (loop.close) {
        var back = G.arc(L.K, L.r, b, L.aA + L.dir * L.span, a, L.aA + L.dir * 360, L.dir);
        edges.push({ loop: loop.id, kind: "loop", from: b.id, to: a.id, d: back.d, head: back.head });
      }
      (loop.extras || []).forEach(function (x) {
        var s = x.kind === "curve"
          ? G.curve(nodes[x.from], nodes[x.to], x.bend || 0, x.off1, x.off2)
          : G.straight(nodes[x.from], nodes[x.to], x.off1, x.off2);
        edges.push({
          loop: loop.id, kind: x.kind === "dotted" ? "dotted" : "loop",
          from: x.from, to: x.to, d: s.d, head: s.head, about: x.about, legend: x.legend
        });
      });
    });
  }

  /* ---------- drawing ---------- */

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function text(parent, cls, x, y, str) {
    var t = el("text", { "class": cls, x: x.toFixed(1), y: y.toFixed(1) }, parent);
    t.textContent = str;
    return t;
  }

  function drawNode(n, parent, index) {
    var tone = n.loop === "commons" ? "coral" : "teal";
    var g = el("g", {
      "class": "node node--" + tone, "data-node": n.id, "data-loop": n.loop,
      role: "button", tabindex: "0",
      "aria-label": n.title + ": " + n.sub.join(" ") + (n.pills ? " " + n.pills.join(", ") : ""),
      style: "--i:" + index
    }, parent);
    var x = n.cx - n.w / 2, y = n.cy - n.h / 2;
    el("rect", { "class": "node-box", x: x.toFixed(1), y: y.toFixed(1), width: n.w, height: n.h, rx: 8 }, g);
    if (n.pills) {
      text(g, "node-title", n.cx, y + 18, n.title);
      text(g, "node-sub", n.cx, y + 36, n.sub.join(" "));
      n.pills.forEach(function (p, i) {
        var py = y + 54 + i * 30;
        el("rect", { "class": "node-pill", x: (x + 12).toFixed(1), y: py.toFixed(1), width: n.w - 24, height: 24, rx: 12 }, g);
        text(g, "node-sub", n.cx, py + 12, p);
      });
    } else {
      var top = n.cy - 9 - 9.5 * (n.sub.length - 1);
      text(g, "node-title", n.cx, top, n.title);
      n.sub.forEach(function (s, i) { text(g, "node-sub", n.cx, top + 19 + 18 * i, s); });
    }
    return g;
  }

  function drawEdge(e, parent) {
    var g = el("g", {
      "class": "edge edge--" + e.kind + (e.loop === "commons" ? " edge--commons" : " edge--outer"),
      "data-from": e.from, "data-to": e.to, "data-loop": e.loop
    }, parent);
    var animated = e.loop !== "commons" && e.kind !== "dotted";
    el("path", { "class": "edge-line" + (animated ? " draws" : ""), d: e.d, pathLength: animated ? 1 : undefined }, g);
    el("polygon", { "class": "edge-head", points: e.head }, g);
  }

  function drawLabel(loop, parent) {
    var t = el("text", { "class": "loop-label", x: loop.label.at[0], y: loop.label.at[1] }, parent);
    loop.label.lines.forEach(function (line, i) {
      var s = el("tspan", { x: loop.label.at[0], dy: i === 0 ? 0 : 19 }, t);
      s.textContent = line;
    });
  }

  function draw() {
    var svg = document.getElementById("diagram");
    svg.setAttribute("viewBox", "0 0 " + DATA.canvas.w + " " + DATA.canvas.h);
    var outerEdges = el("g", { "class": "layer" }, svg);
    var coreEdges = el("g", { "class": "layer" }, svg);
    var hubLayer = el("g", { "class": "layer" }, svg);
    var coreNodes = el("g", { "class": "layer" }, svg);
    var outerNodes = el("g", { "class": "layer" }, svg);

    DATA.loops.forEach(function (loop) {
      var eg = el("g", { "class": "loop-part", "data-part": loop.id }, outerEdges);
      edges.filter(function (e) { return e.loop === loop.id; }).forEach(function (e) { drawEdge(e, eg); });
      var ng = el("g", { "class": "loop-part", "data-part": loop.id }, outerNodes);
      drawLabel(loop, ng);
      loop.nodes.forEach(function (def, i) { drawNode(nodes[def.id], ng, i + 1); });
    });

    edges.filter(function (e) { return e.loop === "commons"; }).forEach(function (e) { drawEdge(e, coreEdges); });

    var C = DATA.commons.center, hub = DATA.commons.hub;
    var hg = el("g", { "class": "hub" }, hubLayer);
    el("rect", { "class": "hub-card", x: C[0] - 84, y: C[1] - 27, width: 168, height: 54, rx: 27 }, hg);
    text(hg, "hub-title", C[0], C[1] - 8, hub.title);
    text(hg, "hub-sub", C[0], C[1] + 11, hub.sub);

    DATA.commons.nodes.forEach(function (def, i) { drawNode(nodes[def.id], coreNodes, i); });

    // Crop to everything drawn, every loop included, so the commons flywheel
    // stays in the same place whichever loop is showing.
    var box = svg.getBBox(), pad = 14;
    svg.setAttribute("viewBox", [box.x - pad, box.y - pad, box.width + 2 * pad, box.height + 2 * pad]
      .map(function (v) { return v.toFixed(1); }).join(" "));
  }

  /* ---------- side panel ---------- */

  function h(tag, cls, str) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (str !== undefined) e.textContent = str;
    return e;
  }

  function linkTo(hash, label, tone) {
    var a = h("a", "jump" + (tone ? " jump--" + tone : ""), label);
    a.href = "#" + hash;
    return a;
  }

  function toneOf(loopId) { return loopId === "commons" ? "coral" : "teal"; }

  function stepList(ids) {
    var ol = h("ol", "steps");
    ids.forEach(function (id) {
      var n = nodes[id], li = h("li");
      li.appendChild(linkTo(state.view + "/" + id, n.title, toneOf(n.loop)));
      li.appendChild(h("span", "steps-sub", n.sub.join(" ")));
      ol.appendChild(li);
    });
    return ol;
  }

  function loopSteps(loop) {
    return [loop.attach.from].concat(loop.nodes.map(function (n) { return n.id; }), [loop.attach.to]);
  }

  function paragraphs(panel, list) {
    list.forEach(function (p) { panel.appendChild(h("p", null, p)); });
  }

  function loopCards(panel) {
    var ul = h("ul", "cards");
    DATA.loops.forEach(function (loop) {
      var li = h("li");
      var a = linkTo(loop.id, loop.title, "teal");
      li.appendChild(a);
      li.appendChild(h("span", "cards-sub", loop.tagline));
      ul.appendChild(li);
    });
    panel.appendChild(ul);
  }

  function renderViewPanel(panel) {
    var v = state.view;
    if (v === "all") {
      panel.appendChild(h("p", "eyebrow", "All loops"));
      panel.appendChild(h("h2", null, "Every loop feeds the commons"));
      panel.appendChild(h("p", null, "The commons flywheel sits in the middle. Funders bring capital, Alpha brings users, and compute donors bring capacity. Each outer loop leaves the commons at one step and returns at another."));
      loopCards(panel);
      return;
    }
    var loop = loops[v];
    panel.appendChild(h("p", "eyebrow", v === "commons" ? "Core loop" : "Outer loop"));
    panel.appendChild(h("h2", null, loop.title));
    panel.appendChild(h("p", "tagline", loop.tagline));
    paragraphs(panel, loop.about);
    panel.appendChild(h("h3", null, "How it turns"));
    panel.appendChild(stepList(v === "commons"
      ? DATA.commons.nodes.map(function (n) { return n.id; })
      : loopSteps(loop)));
    if (v === "commons") {
      panel.appendChild(h("h3", null, "Principles"));
      var ul = h("ul", "plain");
      loop.principles.forEach(function (p) { ul.appendChild(h("li", null, p)); });
      panel.appendChild(ul);
      panel.appendChild(h("h3", null, "Outer loops"));
      loopCards(panel);
    } else {
      var shortcuts = (loop.extras || []).filter(function (x) { return x.about; });
      if (shortcuts.length) {
        panel.appendChild(h("h3", null, "Shortcuts"));
        var sl = h("ul", "plain");
        shortcuts.forEach(function (x) {
          var li = h("li");
          li.appendChild(h("strong", null, nodes[x.from].title + " to " + nodes[x.to].title + ". "));
          li.appendChild(document.createTextNode(x.about));
          sl.appendChild(li);
        });
        panel.appendChild(sl);
      }
    }
  }

  function connectionList(title, list, panel) {
    if (!list.length) return;
    panel.appendChild(h("h3", null, title));
    var ul = h("ul", "links");
    list.forEach(function (c) {
      var n = nodes[c.id], li = h("li");
      var view = visibleIn(n.loop, state.view) ? state.view : n.loop;
      li.appendChild(linkTo(view + "/" + n.id, n.title, toneOf(n.loop)));
      li.appendChild(h("span", "links-sub", c.via === "commons" ? "Commons flywheel" : loops[c.via].title));
      if (c.about) li.appendChild(h("span", "links-note", c.about));
      ul.appendChild(li);
    });
    panel.appendChild(ul);
  }

  function renderNodePanel(panel, id) {
    var n = nodes[id];
    var back = linkTo(state.view, "← " + (state.view === "all" ? "All loops" : loops[state.view].title), null);
    back.className = "back";
    panel.appendChild(back);
    panel.appendChild(h("p", "eyebrow", "Step in the " + loops[n.loop].title));
    panel.appendChild(h("h2", null, n.title));
    panel.appendChild(h("p", "tagline", n.sub.join(" ")));
    if (n.pills) {
      var pills = h("p", "pills");
      n.pills.forEach(function (p) { pills.appendChild(h("span", "pill", p)); });
      panel.appendChild(pills);
    }
    paragraphs(panel, n.about);
    n.links.forEach(function (l) {
      var a = h("a", "external", l.text + " ↗");
      a.href = l.href; a.target = "_blank"; a.rel = "noopener";
      panel.appendChild(a);
    });
    var ins = [], outs = [];
    edges.forEach(function (e) {
      if (e.to === id) ins.push({ id: e.from, via: e.loop, about: e.about });
      if (e.from === id) outs.push({ id: e.to, via: e.loop, about: e.about });
    });
    connectionList("Comes from", ins, panel);
    connectionList("Leads to", outs, panel);
  }

  function renderPanel() {
    var panel = document.getElementById("panel-body");
    panel.textContent = "";
    if (state.selected) renderNodePanel(panel, state.selected);
    else renderViewPanel(panel);
    panel.scrollTop = 0;
  }

  /* ---------- state ---------- */

  function visibleIn(loopId, view) {
    return loopId === "commons" || view === "all" || view === loopId;
  }

  function renderLegend() {
    var box = document.getElementById("legend");
    box.textContent = "";
    function item(cls, label) {
      var li = h("li", "legend-item");
      li.appendChild(h("span", "swatch " + cls));
      li.appendChild(document.createTextNode(label));
      box.appendChild(li);
    }
    item("swatch--commons", DATA.commons.legend);
    if (state.view === "all") {
      item("swatch--outer", "Outer loops");
      item("swatch--dotted", "Shortcuts");
    } else if (state.view !== "commons") {
      var loop = loops[state.view];
      item("swatch--outer", loop.legend);
      (loop.extras || []).forEach(function (x) { if (x.legend) item("swatch--dotted", x.legend); });
    }
  }

  function applyView(animate) {
    var svg = document.getElementById("diagram");
    document.querySelectorAll(".loop-part").forEach(function (g) {
      var on = visibleIn(g.getAttribute("data-part"), state.view);
      var was = g.classList.contains("is-visible");
      if (on && !was && animate) {
        g.classList.remove("is-visible");
        void g.getBoundingClientRect();
      }
      g.classList.toggle("is-visible", on);
      g.classList.toggle("no-anim", on && !animate);
      g.setAttribute("aria-hidden", on ? "false" : "true");
      g.querySelectorAll(".node").forEach(function (n) { n.setAttribute("tabindex", on ? "0" : "-1"); });
    });
    document.querySelectorAll("[role=tab]").forEach(function (t) {
      var on = t.getAttribute("data-view") === state.view;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.setAttribute("tabindex", on ? "0" : "-1");
    });
    svg.setAttribute("data-view", state.view);
    renderLegend();
    scrollToView(animate);
  }

  // On narrow screens the diagram scrolls sideways; bring the active loop into view.
  function scrollToView(smooth) {
    var canvas = document.querySelector(".canvas");
    if (!canvas || canvas.scrollWidth <= canvas.clientWidth + 1) return;
    var shown = Object.keys(nodes).filter(function (id) { return visibleIn(nodes[id].loop, state.view); });
    var xs = shown.map(function (id) { return nodes[id].cx; });
    var mid = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    var svg = document.getElementById("diagram");
    var vb = svg.viewBox.baseVal;
    var px = ((mid - vb.x) / vb.width) * svg.getBoundingClientRect().width;
    canvas.scrollTo({ left: Math.max(0, px - canvas.clientWidth / 2), behavior: smooth ? "smooth" : "auto" });
  }

  function applySelection() {
    var svg = document.getElementById("diagram");
    var sel = state.selected;
    svg.classList.toggle("has-selection", !!sel);
    var related = {};
    document.querySelectorAll(".edge").forEach(function (e) {
      var f = e.getAttribute("data-from"), t = e.getAttribute("data-to");
      var on = !!sel && (f === sel || t === sel);
      e.classList.toggle("is-related", on);
      if (on) { related[f] = true; related[t] = true; }
    });
    document.querySelectorAll(".node").forEach(function (n) {
      var id = n.getAttribute("data-node");
      n.classList.toggle("is-selected", id === sel);
      n.classList.toggle("is-related", !!related[id] && id !== sel);
      n.setAttribute("aria-pressed", id === sel ? "true" : "false");
    });
  }

  function readHash() {
    var parts = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
    var view = views.indexOf(parts[0]) >= 0 ? parts[0] : "commons";
    var sel = parts[1] && nodes[parts[1]] ? parts[1] : null;
    if (sel && !visibleIn(nodes[sel].loop, view)) view = nodes[sel].loop;
    return { view: view, selected: sel };
  }

  function go(view, sel) {
    var hash = "#" + view + (sel ? "/" + sel : "");
    if (location.hash !== hash) location.hash = hash;
    else sync(true);
  }

  function sync(animate) {
    var next = readHash();
    var viewChanged = next.view !== state.view;
    state.view = next.view;
    state.selected = next.selected;
    if (viewChanged || !animate) applyView(animate && viewChanged);
    applySelection();
    renderPanel();
  }

  /* ---------- events ---------- */

  function bind() {
    var svg = document.getElementById("diagram");

    svg.addEventListener("click", function (ev) {
      var node = ev.target.closest(".node");
      if (node) {
        var id = node.getAttribute("data-node");
        go(state.view, state.selected === id ? null : id);
      } else if (state.selected) {
        go(state.view, null);
      }
    });

    svg.addEventListener("keydown", function (ev) {
      var node = ev.target.closest && ev.target.closest(".node");
      if (node && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        go(state.view, node.getAttribute("data-node"));
      }
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && state.selected) go(state.view, null);
    });

    var tabs = Array.prototype.slice.call(document.querySelectorAll("[role=tab]"));
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { go(t.getAttribute("data-view"), null); });
      t.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        ev.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus();
        go(next.getAttribute("data-view"), null);
      });
    });

    window.addEventListener("hashchange", function () { sync(true); });
  }

  function buildTabs() {
    var bar = document.getElementById("tabs");
    views.forEach(function (v) {
      var b = h("button", "tab", v === "all" ? "All loops" : loops[v].tab);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("data-view", v);
      b.setAttribute("aria-controls", "diagram");
      bar.appendChild(b);
    });
  }

  layout();
  draw();
  buildTabs();
  bind();
  var first = readHash();
  state.view = first.view;
  state.selected = first.selected;
  applyView(false);
  applySelection();
  renderPanel();
})();
