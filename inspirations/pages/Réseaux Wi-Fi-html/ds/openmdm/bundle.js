/* @ds-bundle: {"format":4,"namespace":"OpenMDM","components":[{"name":"Icon"},{"name":"Button"},{"name":"Badge"},{"name":"Card"},{"name":"Input"},{"name":"InputGroup"},{"name":"Field"},{"name":"Select"},{"name":"Checkbox"},{"name":"Switch"},{"name":"Tabs"},{"name":"Table"},{"name":"Sidebar"},{"name":"Breadcrumb"},{"name":"Pagination"},{"name":"Item"},{"name":"Avatar"},{"name":"Progress"},{"name":"Separator"},{"name":"Tooltip"},{"name":"Alert"},{"name":"DropdownMenu"},{"name":"AlertDialog"},{"name":"ChartPieDonutText"},{"name":"ChartAreaFlow"},{"name":"ChartPieGauge"}]} */
/* Open MDM: aperçus des composants shadcn/ui thémés Flame & Sand.
   Mêmes noms, mêmes props, mêmes data-slot que shadcn ; dans apps/web on installe les vrais composants
   (npx shadcn@latest add …) et on applique les ajustements décrits dans chaque README. */
(function () {
  "use strict";
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState;
  var useContext = React.useContext;
  var createContext = React.createContext;

  function cn() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(" ");
  }
  function omit(p, keys) {
    var o = {};
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k) && keys.indexOf(k) === -1) o[k] = p[k];
    return o;
  }
  function part(slot, tag, cls, defaults) {
    var C = function (p) {
      return h(p.as || tag, Object.assign({}, defaults || {}, omit(p, ["className", "as"]), { "data-slot": slot, className: cn(cls, p.className) }));
    };
    C.displayName = slot;
    return C;
  }
  function uid(prefix) {
    var id = React.useId ? React.useId() : String(Math.random());
    return prefix + id.replace(/[^A-Za-z0-9_-]/g, "");
  }
  function r2(n) { return Math.round(n * 100) / 100; }

  /* ---------- Icon (lucide) ---------- */
  var ICONS = {"layout-dashboard":[["rect",{"width":"7","height":"9","x":"3","y":"3","rx":"1"}],["rect",{"width":"7","height":"5","x":"14","y":"3","rx":"1"}],["rect",{"width":"7","height":"9","x":"14","y":"12","rx":"1"}],["rect",{"width":"7","height":"5","x":"3","y":"16","rx":"1"}]],"smartphone":[["rect",{"width":"14","height":"20","x":"5","y":"2","rx":"2","ry":"2"}],["path",{"d":"M12 18h.01"}]],"shield-check":[["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}],["path",{"d":"m9 12 2 2 4-4"}]],"qr-code":[["rect",{"width":"5","height":"5","x":"3","y":"3","rx":"1"}],["rect",{"width":"5","height":"5","x":"16","y":"3","rx":"1"}],["rect",{"width":"5","height":"5","x":"3","y":"16","rx":"1"}],["path",{"d":"M21 16h-3a2 2 0 0 0-2 2v3"}],["path",{"d":"M21 21v.01"}],["path",{"d":"M12 7v3a2 2 0 0 1-2 2H7"}],["path",{"d":"M3 12h.01"}],["path",{"d":"M12 3h.01"}],["path",{"d":"M12 16v.01"}],["path",{"d":"M16 12h1"}],["path",{"d":"M21 12v.01"}],["path",{"d":"M12 21v-1"}]],"users":[["path",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["path",{"d":"M16 3.128a4 4 0 0 1 0 7.744"}],["path",{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}],["circle",{"cx":"9","cy":"7","r":"4"}]],"terminal":[["path",{"d":"M12 19h8"}],["path",{"d":"m4 17 6-6-6-6"}]],"bell":[["path",{"d":"M10.268 21a2 2 0 0 0 3.464 0"}],["path",{"d":"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"}]],"settings":[["path",{"d":"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"}],["circle",{"cx":"12","cy":"12","r":"3"}]],"log-out":[["path",{"d":"m16 17 5-5-5-5"}],["path",{"d":"M21 12H9"}],["path",{"d":"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}]],"circle-question-mark":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"}],["path",{"d":"M12 17h.01"}]],"search":[["path",{"d":"m21 21-4.34-4.34"}],["circle",{"cx":"11","cy":"11","r":"8"}]],"chevron-down":[["path",{"d":"m6 9 6 6 6-6"}]],"chevron-right":[["path",{"d":"m9 18 6-6-6-6"}]],"chevron-left":[["path",{"d":"m15 18-6-6 6-6"}]],"chevrons-up-down":[["path",{"d":"m7 15 5 5 5-5"}],["path",{"d":"m7 9 5-5 5 5"}]],"ellipsis":[["circle",{"cx":"12","cy":"12","r":"1"}],["circle",{"cx":"19","cy":"12","r":"1"}],["circle",{"cx":"5","cy":"12","r":"1"}]],"list-filter":[["path",{"d":"M2 5h20"}],["path",{"d":"M6 12h12"}],["path",{"d":"M9 19h6"}]],"download":[["path",{"d":"M12 15V3"}],["path",{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}],["path",{"d":"m7 10 5 5 5-5"}]],"plus":[["path",{"d":"M5 12h14"}],["path",{"d":"M12 5v14"}]],"lock":[["rect",{"width":"18","height":"11","x":"3","y":"11","rx":"2","ry":"2"}],["path",{"d":"M7 11V7a5 5 0 0 1 10 0v4"}]],"rotate-ccw":[["path",{"d":"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}],["path",{"d":"M3 3v5h5"}]],"trash-2":[["path",{"d":"M10 11v6"}],["path",{"d":"M14 11v6"}],["path",{"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"}],["path",{"d":"M3 6h18"}],["path",{"d":"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}]],"map-pin":[["path",{"d":"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"}],["circle",{"cx":"12","cy":"10","r":"3"}]],"battery-medium":[["path",{"d":"M10 14v-4"}],["path",{"d":"M22 14v-4"}],["path",{"d":"M6 14v-4"}],["rect",{"x":"2","y":"6","width":"16","height":"12","rx":"2"}]],"hard-drive":[["path",{"d":"M10 16h.01"}],["path",{"d":"M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"}],["path",{"d":"M21.946 12.013H2.054"}],["path",{"d":"M6 16h.01"}]],"wifi":[["path",{"d":"M12 20h.01"}],["path",{"d":"M2 8.82a15 15 0 0 1 20 0"}],["path",{"d":"M5 12.859a10 10 0 0 1 14 0"}],["path",{"d":"M8.5 16.429a5 5 0 0 1 7 0"}]],"cpu":[["path",{"d":"M12 20v2"}],["path",{"d":"M12 2v2"}],["path",{"d":"M17 20v2"}],["path",{"d":"M17 2v2"}],["path",{"d":"M2 12h2"}],["path",{"d":"M2 17h2"}],["path",{"d":"M2 7h2"}],["path",{"d":"M20 12h2"}],["path",{"d":"M20 17h2"}],["path",{"d":"M20 7h2"}],["path",{"d":"M7 20v2"}],["path",{"d":"M7 2v2"}],["rect",{"x":"4","y":"4","width":"16","height":"16","rx":"2"}],["rect",{"x":"8","y":"8","width":"8","height":"8","rx":"1"}]],"circle-check":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m9 12 2 2 4-4"}]],"hourglass":[["path",{"d":"M5 22h14"}],["path",{"d":"M5 2h14"}],["path",{"d":"M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"}],["path",{"d":"M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"}]],"circle-alert":[["circle",{"cx":"12","cy":"12","r":"10"}],["line",{"x1":"12","x2":"12","y1":"8","y2":"12"}],["line",{"x1":"12","x2":"12.01","y1":"16","y2":"16"}]],"info":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 16v-4"}],["path",{"d":"M12 8h.01"}]],"arrow-up":[["path",{"d":"m5 12 7-7 7 7"}],["path",{"d":"M12 19V5"}]],"arrow-down":[["path",{"d":"M12 5v14"}],["path",{"d":"m19 12-7 7-7-7"}]],"arrow-up-right":[["path",{"d":"M7 7h10v10"}],["path",{"d":"M7 17 17 7"}]],"share-2":[["circle",{"cx":"18","cy":"5","r":"3"}],["circle",{"cx":"6","cy":"12","r":"3"}],["circle",{"cx":"18","cy":"19","r":"3"}],["line",{"x1":"8.59","x2":"15.42","y1":"13.51","y2":"17.49"}],["line",{"x1":"15.41","x2":"8.59","y1":"6.51","y2":"10.49"}]],"x":[["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]],"check":[["path",{"d":"M20 6 9 17l-5-5"}]],"copy":[["rect",{"width":"14","height":"14","x":"8","y":"8","rx":"2","ry":"2"}],["path",{"d":"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"}]],"refresh-cw":[["path",{"d":"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}],["path",{"d":"M21 3v5h-5"}],["path",{"d":"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}],["path",{"d":"M8 16H3v5"}]],"clock":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 6v6l4 2"}]],"camera-off":[["path",{"d":"M14.564 14.558a3 3 0 1 1-4.122-4.121"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M20 20H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 .819-.175"}],["path",{"d":"M9.695 4.024A2 2 0 0 1 10.004 4h3.993a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v7.344"}]],"usb":[["circle",{"cx":"10","cy":"7","r":"1"}],["circle",{"cx":"4","cy":"20","r":"1"}],["path",{"d":"M4.7 19.3 19 5"}],["path",{"d":"m21 3-3 1 2 2Z"}],["path",{"d":"M9.26 7.68 5 12l2 5"}],["path",{"d":"m10 14 5 2 3.5-3.5"}],["path",{"d":"m18 12 1-1 1 1-1 1Z"}]],"app-window":[["rect",{"x":"2","y":"4","width":"20","height":"16","rx":"2"}],["path",{"d":"M10 4v4"}],["path",{"d":"M2 8h20"}],["path",{"d":"M6 4v4"}]],"key-round":[["path",{"d":"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"}],["circle",{"cx":"16.5","cy":"7.5","r":".5","fill":"currentColor"}]],"layers":[["path",{"d":"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"}],["path",{"d":"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"}],["path",{"d":"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"}]],"send":[["path",{"d":"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}],["path",{"d":"m21.854 2.147-10.94 10.939"}]],"memory-stick":[["path",{"d":"M12 12v-2"}],["path",{"d":"M12 18v-2"}],["path",{"d":"M16 12v-2"}],["path",{"d":"M16 18v-2"}],["path",{"d":"M2 11h1.5"}],["path",{"d":"M20 18v-2"}],["path",{"d":"M20.5 11H22"}],["path",{"d":"M4 18v-2"}],["path",{"d":"M8 12v-2"}],["path",{"d":"M8 18v-2"}],["rect",{"x":"2","y":"6","width":"20","height":"10","rx":"2"}]],"signal":[["path",{"d":"M2 20h.01"}],["path",{"d":"M7 20v-4"}],["path",{"d":"M12 20v-8"}],["path",{"d":"M17 20V8"}],["path",{"d":"M22 4v16"}]],"user-round":[["circle",{"cx":"12","cy":"8","r":"5"}],["path",{"d":"M20 21a8 8 0 0 0-16 0"}]],"minus":[["path",{"d":"M5 12h14"}]],"circle-dashed":[["path",{"d":"M10.1 2.182a10 10 0 0 1 3.8 0"}],["path",{"d":"M13.9 21.818a10 10 0 0 1-3.8 0"}],["path",{"d":"M17.609 3.721a10 10 0 0 1 2.69 2.7"}],["path",{"d":"M2.182 13.9a10 10 0 0 1 0-3.8"}],["path",{"d":"M20.279 17.609a10 10 0 0 1-2.7 2.69"}],["path",{"d":"M21.818 10.1a10 10 0 0 1 0 3.8"}],["path",{"d":"M3.721 6.391a10 10 0 0 1 2.7-2.69"}],["path",{"d":"M6.391 20.279a10 10 0 0 1-2.69-2.7"}]],"arrow-left":[["path",{"d":"m12 19-7-7 7-7"}],["path",{"d":"M19 12H5"}]],"package":[["path",{"d":"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"}],["path",{"d":"M12 22V12"}],["polyline",{"points":"3.29 7 12 12 20.71 7"}],["path",{"d":"m7.5 4.27 9 5.15"}]],"scroll-text":[["path",{"d":"M15 12h-5"}],["path",{"d":"M15 8h-5"}],["path",{"d":"M19 17V5a2 2 0 0 0-2-2H4"}],["path",{"d":"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"}]],"globe":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"}],["path",{"d":"M2 12h20"}]],"power":[["path",{"d":"M12 2v10"}],["path",{"d":"M18.4 6.6a9 9 0 1 1-12.77.04"}]],"battery-low":[["path",{"d":"M22 14v-4"}],["path",{"d":"M6 14v-4"}],["rect",{"x":"2","y":"6","width":"16","height":"12","rx":"2"}]],"printer":[["path",{"d":"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"}],["path",{"d":"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"}],["rect",{"x":"6","y":"14","width":"12","height":"8","rx":"1"}]],"trending-up":[["path",{"d":"M16 7h6v6"}],["path",{"d":"m22 7-8.5 8.5-5-5L2 17"}]],"trending-down":[["path",{"d":"M16 17h6v-6"}],["path",{"d":"m22 17-8.5-8.5-5 5L2 7"}]],"calendar-clock":[["path",{"d":"M16 14v2.2l1.6 1"}],["path",{"d":"M16 2v4"}],["path",{"d":"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"}],["path",{"d":"M3 10h5"}],["path",{"d":"M8 2v4"}],["circle",{"cx":"16","cy":"16","r":"6"}]],"circle-x":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m15 9-6 6"}],["path",{"d":"m9 9 6 6"}]],"building-2":[["path",{"d":"M10 12h4"}],["path",{"d":"M10 8h4"}],["path",{"d":"M14 21v-3a2 2 0 0 0-4 0v3"}],["path",{"d":"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}],["path",{"d":"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"}]],"wifi-off":[["path",{"d":"M12 20h.01"}],["path",{"d":"M8.5 16.429a5 5 0 0 1 7 0"}],["path",{"d":"M5 12.859a10 10 0 0 1 5.17-2.69"}],["path",{"d":"M19 12.859a10 10 0 0 0-2.007-1.523"}],["path",{"d":"M2 8.82a15 15 0 0 1 4.177-2.643"}],["path",{"d":"M22 8.82a15 15 0 0 0-11.288-3.764"}],["path",{"d":"m2 2 20 20"}]],"eye":[["path",{"d":"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"}],["circle",{"cx":"12","cy":"12","r":"3"}]]};
  function Icon(p) {
    var node = ICONS[p.name] || [];
    var size = p.size || 16;
    var rest = omit(p, ["name", "size", "strokeWidth", "className", "label"]);
    return h("svg", Object.assign({
      xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      stroke: "currentColor", strokeWidth: p.strokeWidth || 2, strokeLinecap: "round", strokeLinejoin: "round",
      className: cn("om-icon", "lucide", "lucide-" + p.name, p.className),
      "aria-hidden": p.label ? undefined : "true", role: p.label ? "img" : undefined, "aria-label": p.label
    }, rest), node.map(function (n, i) { return h(n[0], Object.assign({ key: i }, n[1])); }));
  }
  Icon.names = Object.keys(ICONS);

  /* ---------- Button ---------- */
  function Button(p) {
    var variant = p.variant || "default", size = p.size || "default";
    var rest = omit(p, ["variant", "size", "className", "asChild"]);
    var tag = p.href ? "a" : "button";
    if (tag === "button" && rest.type == null) rest.type = "button";
    return h(tag, Object.assign(rest, {
      "data-slot": "button", "data-variant": variant, "data-size": size,
      className: cn("om-btn", "om-btn--" + variant, "om-btn--size-" + size, p.className)
    }));
  }

  /* ---------- Badge ---------- */
  function Badge(p) {
    var v = p.variant || "default";
    return h(p.href ? "a" : "span", Object.assign(omit(p, ["variant", "className", "asChild"]), {
      "data-slot": "badge", "data-variant": v, className: cn("om-badge", "om-badge--" + v, p.className)
    }));
  }

  /* ---------- Card ---------- */
  var Card = part("card", "div", "om-card");
  var CardHeader = part("card-header", "div", "om-card__header");
  var CardTitle = part("card-title", "div", "om-card__title");
  var CardDescription = part("card-description", "div", "om-card__description");
  var CardAction = part("card-action", "div", "om-card__action");
  var CardContent = part("card-content", "div", "om-card__content");
  var CardFooter = part("card-footer", "div", "om-card__footer");

  /* ---------- Input / InputGroup / Label / Field ---------- */
  function Input(p) {
    return h("input", Object.assign({ type: "text" }, omit(p, ["className"]), { "data-slot": "input", className: cn("om-input", p.className) }));
  }
  var InputGroup = part("input-group", "div", "om-input-group", { role: "group" });
  function InputGroupInput(p) {
    return h("input", Object.assign({ type: "text" }, omit(p, ["className"]), { "data-slot": "input-group-control", className: cn("om-input-group__input", p.className) }));
  }
  function InputGroupAddon(p) {
    return h("div", Object.assign(omit(p, ["className", "align"]), { "data-slot": "input-group-addon", "data-align": p.align || "inline-start", className: cn("om-input-group__addon", p.className) }));
  }
  var Label = part("label", "label", "om-label");
  function Field(p) {
    return h("div", Object.assign(omit(p, ["className", "orientation"]), {
      role: "group", "data-slot": "field", "data-orientation": p.orientation || "vertical",
      className: cn("om-field", p.orientation === "horizontal" && "om-field--horizontal", p.className)
    }));
  }
  var FieldGroup = part("field-group", "div", "om-field-group");
  var FieldContent = part("field-content", "div", "om-field__content");
  var FieldLabel = part("field-label", "label", "om-label om-field__label");
  var FieldDescription = part("field-description", "p", "om-field__description");
  function FieldError(p) {
    if (!p.children) return null;
    return h("div", Object.assign(omit(p, ["className"]), { role: "alert", "data-slot": "field-error", className: cn("om-field__error", p.className) }),
      h(Icon, { name: "circle-alert" }), p.children);
  }

  /* ---------- Select ---------- */
  var SelectCtx = createContext(null);
  function collectItems(children, map) {
    React.Children.forEach(children, function (ch) {
      if (!ch || typeof ch !== "object" || !ch.props) return;
      if (ch.type === SelectItem) map[ch.props.value] = ch.props.children;
      else if (ch.props.children) collectItems(ch.props.children, map);
    });
    return map;
  }
  function Select(p) {
    var s = useState(p.defaultValue), o = useState(!!p.defaultOpen);
    var value = p.value !== undefined ? p.value : s[0];
    var ctx = {
      value: value, open: o[0], setOpen: o[1], labels: collectItems(p.children, {}),
      pick: function (v) { s[1](v); o[1](false); if (p.onValueChange) p.onValueChange(v); }
    };
    return h(SelectCtx.Provider, { value: ctx }, h("div", { "data-slot": "select", className: cn("om-select", p.className) }, p.children));
  }
  function SelectTrigger(p) {
    var ctx = useContext(SelectCtx);
    return h("button", Object.assign(omit(p, ["className", "size", "children"]), {
      type: "button", role: "combobox", "aria-expanded": ctx.open, "data-slot": "select-trigger", "data-size": p.size || "default",
      className: cn("om-select__trigger", p.className), onClick: function () { ctx.setOpen(!ctx.open); }
    }), p.children, h(Icon, { name: "chevron-down", className: "om-select__chevron" }));
  }
  function SelectValue(p) {
    var ctx = useContext(SelectCtx);
    var has = ctx.value != null && ctx.value !== "";
    return h("span", { "data-slot": "select-value", className: cn("om-select__value", !has && "is-placeholder") }, has ? ctx.labels[ctx.value] : p.placeholder);
  }
  function SelectContent(p) {
    var ctx = useContext(SelectCtx);
    if (!ctx.open) return null;
    return h("div", { role: "listbox", "data-slot": "select-content", className: cn("om-popover om-select__content", p.className) }, p.children);
  }
  function SelectItem(p) {
    var ctx = useContext(SelectCtx);
    var sel = ctx.value === p.value;
    return h("div", {
      role: "option", "aria-selected": sel, tabIndex: 0, "data-slot": "select-item",
      className: cn("om-menu-item", sel && "is-selected", p.className), onClick: function () { ctx.pick(p.value); }
    }, h("span", { className: "om-menu-item__text" }, p.children), sel && h(Icon, { name: "check", className: "om-menu-item__check" }));
  }
  var SelectGroup = part("select-group", "div", "om-menu__group", { role: "group" });
  var SelectLabel = part("select-label", "div", "om-menu__label");
  var SelectSeparator = part("select-separator", "div", "om-menu__separator", { role: "separator" });

  /* ---------- Checkbox / Switch ---------- */
  function Checkbox(p) {
    var s = useState(p.defaultChecked || false);
    var checked = p.checked !== undefined ? p.checked : s[0];
    var state = checked === "indeterminate" ? "indeterminate" : checked ? "checked" : "unchecked";
    return h("button", Object.assign(omit(p, ["className", "checked", "defaultChecked", "onCheckedChange"]), {
      type: "button", role: "checkbox", "aria-checked": state === "indeterminate" ? "mixed" : state === "checked",
      "data-state": state, "data-slot": "checkbox", className: cn("om-checkbox", p.className),
      onClick: function (e) { var n = checked !== true; s[1](n); if (p.onCheckedChange) p.onCheckedChange(n); if (p.onClick) p.onClick(e); }
    }), state !== "unchecked" && h("span", { "data-slot": "checkbox-indicator", className: "om-checkbox__indicator" },
      h(Icon, { name: state === "indeterminate" ? "minus" : "check", strokeWidth: 3 })));
  }
  function Switch(p) {
    var s = useState(!!p.defaultChecked);
    var checked = p.checked !== undefined ? !!p.checked : s[0];
    var st = checked ? "checked" : "unchecked";
    return h("button", Object.assign(omit(p, ["className", "checked", "defaultChecked", "onCheckedChange"]), {
      type: "button", role: "switch", "aria-checked": checked, "data-state": st, "data-slot": "switch", className: cn("om-switch", p.className),
      onClick: function (e) { s[1](!checked); if (p.onCheckedChange) p.onCheckedChange(!checked); if (p.onClick) p.onClick(e); }
    }), h("span", { "data-slot": "switch-thumb", "data-state": st, className: "om-switch__thumb" }));
  }

  /* ---------- Tabs ---------- */
  var TabsCtx = createContext(null);
  function Tabs(p) {
    var s = useState(p.defaultValue);
    var v = p.value !== undefined ? p.value : s[0];
    return h(TabsCtx.Provider, { value: { value: v, set: function (x) { s[1](x); if (p.onValueChange) p.onValueChange(x); } } },
      h("div", Object.assign(omit(p, ["className", "defaultValue", "value", "onValueChange"]), { "data-slot": "tabs", className: cn("om-tabs", p.className) })));
  }
  var TabsList = part("tabs-list", "div", "om-tabs__list", { role: "tablist" });
  function TabsTrigger(p) {
    var ctx = useContext(TabsCtx);
    var active = ctx.value === p.value;
    return h("button", Object.assign(omit(p, ["className", "value"]), {
      type: "button", role: "tab", "aria-selected": active, "data-state": active ? "active" : "inactive", "data-slot": "tabs-trigger",
      className: cn("om-tabs__trigger", p.className), onClick: function () { ctx.set(p.value); }
    }));
  }
  function TabsContent(p) {
    var ctx = useContext(TabsCtx);
    if (ctx.value !== p.value) return null;
    return h("div", Object.assign(omit(p, ["className", "value"]), { role: "tabpanel", "data-slot": "tabs-content", className: cn("om-tabs__content", p.className) }));
  }

  /* ---------- Table ---------- */
  function Table(p) {
    return h("div", { "data-slot": "table-container", className: "om-table-container" },
      h("table", Object.assign(omit(p, ["className"]), { "data-slot": "table", className: cn("om-table", p.className) })));
  }
  var TableHeader = part("table-header", "thead", "om-table__header");
  var TableBody = part("table-body", "tbody", "om-table__body");
  var TableFooter = part("table-footer", "tfoot", "om-table__footer");
  var TableRow = part("table-row", "tr", "om-table__row");
  var TableHead = part("table-head", "th", "om-table__head");
  var TableCell = part("table-cell", "td", "om-table__cell");
  var TableCaption = part("table-caption", "caption", "om-table__caption");

  /* ---------- Sidebar (variant floating) ---------- */
  var SidebarProvider = part("sidebar-wrapper", "div", "om-sidebar-wrapper");
  function Sidebar(p) {
    var variant = p.variant || "floating";
    return h("div", { "data-slot": "sidebar", "data-variant": variant, "data-side": p.side || "left", className: cn("om-sidebar", p.className) },
      h("div", { "data-slot": "sidebar-inner", "data-sidebar": "sidebar", className: "om-sidebar__inner" }, p.children));
  }
  var SidebarHeader = part("sidebar-header", "div", "om-sidebar__header");
  var SidebarContent = part("sidebar-content", "div", "om-sidebar__content");
  var SidebarFooter = part("sidebar-footer", "div", "om-sidebar__footer");
  var SidebarGroup = part("sidebar-group", "div", "om-sidebar__group");
  var SidebarGroupLabel = part("sidebar-group-label", "div", "om-sidebar__group-label");
  var SidebarGroupContent = part("sidebar-group-content", "div", "om-sidebar__group-content");
  var SidebarMenu = part("sidebar-menu", "ul", "om-sidebar__menu");
  var SidebarMenuItem = part("sidebar-menu-item", "li", "om-sidebar__item");
  function SidebarMenuButton(p) {
    var tag = p.href ? "a" : "button";
    var rest = omit(p, ["className", "isActive", "size", "tooltip", "asChild"]);
    if (tag === "button" && rest.type == null) rest.type = "button";
    return h(tag, Object.assign(rest, {
      "data-slot": "sidebar-menu-button", "data-sidebar": "menu-button", "data-size": p.size || "default",
      "data-active": p.isActive ? "true" : "false", "aria-current": p.isActive ? "page" : undefined,
      className: cn("om-sidebar__button", p.className)
    }));
  }
  var SidebarMenuBadge = part("sidebar-menu-badge", "div", "om-sidebar__badge");
  var SidebarSeparator = part("sidebar-separator", "div", "om-separator om-sidebar__separator", { role: "separator", "data-orientation": "horizontal" });
  var SidebarInset = part("sidebar-inset", "main", "om-sidebar-inset");

  /* ---------- Breadcrumb ---------- */
  var Breadcrumb = part("breadcrumb", "nav", "om-breadcrumb", { "aria-label": "Fil d’Ariane" });
  var BreadcrumbList = part("breadcrumb-list", "ol", "om-breadcrumb__list");
  var BreadcrumbItem = part("breadcrumb-item", "li", "om-breadcrumb__item");
  var BreadcrumbLink = part("breadcrumb-link", "a", "om-breadcrumb__link");
  var BreadcrumbPage = part("breadcrumb-page", "span", "om-breadcrumb__page", { role: "link", "aria-disabled": "true", "aria-current": "page" });
  function BreadcrumbSeparator(p) {
    return h("li", { role: "presentation", "aria-hidden": "true", "data-slot": "breadcrumb-separator", className: cn("om-breadcrumb__separator", p.className) },
      p.children || h(Icon, { name: "chevron-right" }));
  }

  /* ---------- Pagination ---------- */
  var Pagination = part("pagination", "nav", "om-pagination", { role: "navigation", "aria-label": "pagination" });
  var PaginationContent = part("pagination-content", "ul", "om-pagination__content");
  var PaginationItem = part("pagination-item", "li", "om-pagination__item");
  function PaginationLink(p) {
    return h(Button, Object.assign(omit(p, ["isActive", "size"]), {
      href: p.href || "#", "aria-current": p.isActive ? "page" : undefined, "data-slot": "pagination-link", "data-active": p.isActive ? "true" : undefined,
      variant: p.isActive ? "outline" : "ghost", size: p.size || "icon-sm"
    }));
  }
  function PaginationPrevious(p) {
    return h(PaginationLink, Object.assign({ "aria-label": "Page précédente", size: "sm" }, p), h(Icon, { name: "chevron-left" }), h("span", null, p.children || "Précédent"));
  }
  function PaginationNext(p) {
    return h(PaginationLink, Object.assign({ "aria-label": "Page suivante", size: "sm" }, p), h("span", null, p.children || "Suivant"), h(Icon, { name: "chevron-right" }));
  }
  function PaginationEllipsis() {
    return h("span", { "aria-hidden": "true", "data-slot": "pagination-ellipsis", className: "om-pagination__ellipsis" }, h(Icon, { name: "ellipsis" }));
  }

  /* ---------- Item ---------- */
  function Item(p) {
    var v = p.variant || "default", s = p.size || "default";
    return h(p.href ? "a" : "div", Object.assign(omit(p, ["className", "variant", "size", "asChild"]), {
      "data-slot": "item", "data-variant": v, "data-size": s, className: cn("om-item", "om-item--" + v, "om-item--size-" + s, p.className)
    }));
  }
  function ItemMedia(p) {
    var v = p.variant || "default";
    return h("div", Object.assign(omit(p, ["className", "variant"]), { "data-slot": "item-media", "data-variant": v, className: cn("om-item__media", "om-item__media--" + v, p.className) }));
  }
  var ItemContent = part("item-content", "div", "om-item__content");
  var ItemTitle = part("item-title", "div", "om-item__title");
  var ItemDescription = part("item-description", "p", "om-item__description");
  var ItemActions = part("item-actions", "div", "om-item__actions");
  var ItemGroup = part("item-group", "div", "om-item-group", { role: "list" });
  var ItemSeparator = part("item-separator", "div", "om-separator", { role: "separator", "data-orientation": "horizontal" });

  /* ---------- Avatar / Progress / Separator ---------- */
  var Avatar = part("avatar", "span", "om-avatar");
  var AvatarFallback = part("avatar-fallback", "span", "om-avatar__fallback");
  function AvatarImage(p) { return h("img", Object.assign(omit(p, ["className"]), { "data-slot": "avatar-image", className: cn("om-avatar__image", p.className) })); }
  function Progress(p) {
    var v = Math.max(0, Math.min(100, p.value || 0));
    return h("div", Object.assign(omit(p, ["className", "value"]), {
      role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": v, "data-slot": "progress", className: cn("om-progress", p.className)
    }), h("div", { "data-slot": "progress-indicator", className: "om-progress__indicator", style: { width: v + "%" } }));
  }
  function Separator(p) {
    var o = p.orientation || "horizontal";
    return h("div", Object.assign(omit(p, ["className", "orientation", "decorative"]), {
      role: p.decorative === false ? "separator" : "none", "data-slot": "separator", "data-orientation": o, className: cn("om-separator", p.className)
    }));
  }

  /* ---------- Tooltip ---------- */
  var TooltipCtx = createContext(null);
  function Tooltip(p) {
    var s = useState(!!p.defaultOpen);
    var open = p.open !== undefined ? p.open : s[0];
    return h(TooltipCtx.Provider, { value: { open: open, set: s[1], sticky: !!p.defaultOpen } },
      h("span", { "data-slot": "tooltip", className: "om-tooltip" }, p.children));
  }
  function TooltipTrigger(p) {
    var ctx = useContext(TooltipCtx);
    function on() { ctx.set(true); }
    function off() { if (!ctx.sticky) ctx.set(false); }
    return h("span", { "data-slot": "tooltip-trigger", className: "om-tooltip__trigger", onMouseEnter: on, onMouseLeave: off, onFocus: on, onBlur: off }, p.children);
  }
  function TooltipContent(p) {
    var ctx = useContext(TooltipCtx);
    if (!ctx.open) return null;
    return h("span", { role: "tooltip", "data-slot": "tooltip-content", "data-side": p.side || "top", className: cn("om-tooltip__content", p.className) }, p.children);
  }

  /* ---------- Alert ---------- */
  var ALERT_ICON = { "default": "info", destructive: "circle-alert", success: "circle-check", warning: "hourglass", info: "info" };
  function Alert(p) {
    var v = p.variant || "default";
    return h("div", Object.assign(omit(p, ["className", "variant"]), {
      role: "alert", "data-slot": "alert", "data-variant": v, className: cn("om-alert", "om-alert--" + v, p.className)
    }));
  }
  Alert.icons = ALERT_ICON;
  var AlertTitle = part("alert-title", "div", "om-alert__title");
  var AlertDescription = part("alert-description", "div", "om-alert__description");

  /* ---------- DropdownMenu ---------- */
  var MenuCtx = createContext(null);
  function DropdownMenu(p) {
    var s = useState(!!p.defaultOpen);
    var open = p.open !== undefined ? p.open : s[0];
    return h(MenuCtx.Provider, { value: { open: open, set: function (v) { s[1](v); if (p.onOpenChange) p.onOpenChange(v); } } },
      h("div", { "data-slot": "dropdown-menu", className: "om-dropdown" }, p.children));
  }
  function DropdownMenuTrigger(p) {
    var ctx = useContext(MenuCtx);
    return h("span", { "data-slot": "dropdown-menu-trigger", "data-state": ctx.open ? "open" : "closed", className: "om-dropdown__trigger", onClick: function () { ctx.set(!ctx.open); } }, p.children);
  }
  function DropdownMenuContent(p) {
    var ctx = useContext(MenuCtx);
    if (!ctx.open) return null;
    return h("div", { role: "menu", "data-slot": "dropdown-menu-content", "data-align": p.align || "end", className: cn("om-popover om-menu", p.className) }, p.children);
  }
  var DropdownMenuLabel = part("dropdown-menu-label", "div", "om-menu__label");
  var DropdownMenuGroup = part("dropdown-menu-group", "div", "om-menu__group", { role: "group" });
  var DropdownMenuSeparator = part("dropdown-menu-separator", "div", "om-menu__separator", { role: "separator" });
  var DropdownMenuShortcut = part("dropdown-menu-shortcut", "span", "om-menu__shortcut");
  function DropdownMenuItem(p) {
    var ctx = useContext(MenuCtx);
    var v = p.variant || "default";
    return h("div", Object.assign(omit(p, ["className", "variant", "onSelect"]), {
      role: "menuitem", tabIndex: -1, "data-slot": "dropdown-menu-item", "data-variant": v,
      className: cn("om-menu-item", v === "destructive" && "om-menu-item--destructive", p.className),
      onClick: function () { if (p.onSelect) p.onSelect(); if (ctx) ctx.set(false); }
    }));
  }

  /* ---------- AlertDialog ---------- */
  var DialogCtx = createContext(null);
  function AlertDialog(p) {
    var s = useState(!!p.defaultOpen);
    var open = p.open !== undefined ? p.open : s[0];
    return h(DialogCtx.Provider, { value: { open: open, set: function (v) { s[1](v); if (p.onOpenChange) p.onOpenChange(v); } } }, p.children);
  }
  function AlertDialogTrigger(p) {
    var ctx = useContext(DialogCtx);
    return h("span", { "data-slot": "alert-dialog-trigger", className: "om-dialog__trigger", onClick: function () { ctx.set(true); } }, p.children);
  }
  function AlertDialogContent(p) {
    var ctx = useContext(DialogCtx);
    if (!ctx.open) return null;
    return h(React.Fragment, null,
      h("div", { "data-slot": "alert-dialog-overlay", className: "om-dialog-overlay" }),
      h("div", { role: "alertdialog", "aria-modal": "true", "data-slot": "alert-dialog-content", className: cn("om-dialog", p.className) }, p.children));
  }
  var AlertDialogHeader = part("alert-dialog-header", "div", "om-dialog__header");
  var AlertDialogFooter = part("alert-dialog-footer", "div", "om-dialog__footer");
  var AlertDialogTitle = part("alert-dialog-title", "h2", "om-dialog__title");
  var AlertDialogDescription = part("alert-dialog-description", "p", "om-dialog__description");
  function AlertDialogAction(p) {
    var ctx = useContext(DialogCtx);
    return h(Button, Object.assign({ variant: "default" }, p, { onClick: function (e) { if (p.onClick) p.onClick(e); ctx.set(false); } }));
  }
  function AlertDialogCancel(p) {
    var ctx = useContext(DialogCtx);
    return h(Button, Object.assign({ variant: "outline" }, p, { onClick: function (e) { if (p.onClick) p.onClick(e); ctx.set(false); } }));
  }

  /* ---------- Charts : aperçus SVG de compositions shadcn Chart (Recharts) ---------- */
  var SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
  function fmtPct(x) { return Math.round(x * 100) + " %"; }

  function seriesOf(data) {
    var rows = (data || []).slice();
    var main = [], rest = null;
    rows.forEach(function (d) {
      if (d.other || main.length >= 4) { rest = rest || { label: "Autres", value: 0, other: true }; rest.value += d.value; }
      else main.push(d);
    });
    if (rest) main.push(rest);
    return main.map(function (d, i) { return Object.assign({}, d, { color: d.other ? "var(--chart-5)" : SERIES[i] }); });
  }
  function polar(c, r, deg) { var a = (deg - 90) * Math.PI / 180; return [r2(c + r * Math.cos(a)), r2(c + r * Math.sin(a))]; }
  function ring(c, R, r, s, e) {
    var large = e - s > 180 ? 1 : 0;
    var a = polar(c, R, s), b = polar(c, R, e), d = polar(c, r, e), f = polar(c, r, s);
    return "M" + a + " A" + R + " " + R + " 0 " + large + " 1 " + b + " L" + d + " A" + r + " " + r + " 0 " + large + " 0 " + f + " Z";
  }
  function ChartPieDonutText(p) {
    var size = p.size || 190, c = size / 2, R = c, r = c * 0.7, gap = p.gap != null ? p.gap : 1.5;
    var segs = seriesOf(p.data);
    var total = segs.reduce(function (t, d) { return t + d.value; }, 0) || 1;
    var at = 0;
    var arcs = segs.map(function (d, i) {
      var sweep = d.value / total * 360, s = at + gap / 2, e = at + sweep - gap / 2;
      at += sweep;
      return h("path", { key: i, d: ring(c, R, r, s, Math.max(s + 0.1, e)), style: { fill: d.color } });
    });
    var summary = segs.map(function (d) { return d.label + " " + fmtPct(d.value / total); }).join(", ");
    return h("div", { "data-slot": "chart", className: cn("om-chart-donut", p.className) },
      h("div", { className: "om-chart-donut__plot", style: { width: size, height: size } },
        h("svg", { width: size, height: size, viewBox: "0 0 " + size + " " + size, role: "img", "aria-label": (p.label ? p.label + " : " : "") + summary }, arcs),
        h("div", { className: "om-chart-donut__center", "aria-hidden": "true" },
          h("span", { className: "om-chart-donut__value" }, p.value),
          p.caption && h("span", { className: "om-chart-donut__caption" }, p.caption))),
      p.legend !== false && h("ul", { className: "om-chart-legend", "aria-hidden": "true" }, segs.map(function (d, i) {
        return h("li", { key: i, className: "om-chart-legend__item" },
          h("span", { className: "om-chart-legend__swatch", style: { background: d.color } }),
          h("span", { className: "om-chart-legend__label" }, d.label),
          h("span", { className: "om-chart-legend__value" }, fmtPct(d.value / total)));
      })));
  }

  function smooth(pts) {
    var d = "M" + pts[0][0] + " " + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1 = [r2(p1[0] + (p2[0] - p0[0]) / 6), r2(p1[1] + (p2[1] - p0[1]) / 6)];
      var c2 = [r2(p2[0] - (p3[0] - p1[0]) / 6), r2(p2[1] - (p3[1] - p1[1]) / 6)];
      d += " C" + c1 + " " + c2 + " " + p2[0] + " " + p2[1];
    }
    return d;
  }
  function ChartAreaFlow(p) {
    var data = p.data || [], n = data.length, H = p.height || 200, W = 1000, mid = H / 2;
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    var gid = uid("flow");
    var xs = data.map(function (_, i) { return (i + 0.5) * W / n; });
    function band(k) {
      var half = data.map(function (d) { return d.value / max * (mid - 6) * k; });
      var top = [[0, mid - half[0]]].concat(xs.map(function (x, i) { return [r2(x), r2(mid - half[i])]; }), [[W, mid - half[n - 1]]]);
      var bot = [[W, mid + half[n - 1]]].concat(xs.slice().reverse().map(function (x, j) { var i = n - 1 - j; return [r2(x), r2(mid + half[i])]; }), [[0, mid + half[0]]]);
      return smooth(top) + " L" + bot[0][0] + " " + bot[0][1] + smooth(bot).slice(smooth(bot).indexOf(" C")) + " Z";
    }
    var hl = p.highlight;
    var hx = hl ? (hl.index + 0.5) / n * 100 : null;
    return h("div", { "data-slot": "chart", className: cn("om-chart-flow", p.className) },
      h("div", { className: "om-chart-flow__plot", style: { height: H + 72 } },
        h("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", role: "img", "aria-label": p.label || "Graphe de flux", style: { top: 36, height: H, position: "absolute", left: 0 } },
          h("defs", null, h("linearGradient", { id: gid, x1: "0", x2: "1", y1: "0", y2: "0" },
            h("stop", { offset: "0", style: { stopColor: "var(--flow-orange)" } }),
            h("stop", { offset: "0.5", style: { stopColor: "var(--flow-sage)" } }),
            h("stop", { offset: "1", style: { stopColor: "var(--flow-sky)" } }))),
          h("path", { d: band(1), fill: "url(#" + gid + ")", fillOpacity: 0.2 }),
          h("path", { d: band(0.66), fill: "url(#" + gid + ")", fillOpacity: 0.45 }),
          h("path", { d: band(0.32), fill: "url(#" + gid + ")" })),
        hl && h("span", { className: "om-chart-flow__marker", style: { left: hx + "%" } }),
        hl && hl.top && h("span", { className: "om-chart-flow__pill om-chart-flow__pill--top", style: { left: hx + "%" } }, hl.top),
        hl && hl.bottom && h("span", { className: "om-chart-flow__pill om-chart-flow__pill--bottom", style: { left: hx + "%" } }, hl.bottom)),
      h("div", { className: "om-chart-flow__axis", "aria-hidden": "true" }, data.map(function (d, i) {
        return h("span", { key: i, className: hl && hl.index === i ? "is-active" : undefined }, d.label);
      })));
  }

  function ChartPieGauge(p) {
    var W = p.size || 280, n = p.segments || 18, max = p.max || 100, v = Math.max(0, Math.min(max, p.value || 0));
    var c = W / 2, R = c - 2, r = R * 0.68, pad = p.padAngle || 3, k = 4;
    var span = (180 - pad * (n - 1)) / n, active = Math.round(v / max * n);
    var gid = uid("flame");
    function pt(rad, deg) { var a = deg * Math.PI / 180; return [r2(c + rad * Math.cos(a)), r2(c - rad * Math.sin(a))]; }
    var segs = [];
    for (var i = 0; i < n; i++) {
      var s = 180 - i * (span + pad), e = s - span;
      var ro = R - k, ri = r + k, dm = k / ((R + r) / 2) * 180 / Math.PI;
      var a = pt(ro, s - dm), b = pt(ro, e + dm), d = pt(ri, e + dm), f = pt(ri, s - dm);
      var paint = i < active ? "url(#" + gid + ")" : "var(--chart-track)";
      segs.push(h("path", { key: i, d: "M" + a + " A" + ro + " " + ro + " 0 0 1 " + b + " L" + d + " A" + ri + " " + ri + " 0 0 0 " + f + " Z", style: { fill: paint, stroke: paint }, strokeWidth: k * 2, strokeLinejoin: "round" }));
    }
    return h("div", { "data-slot": "chart", className: cn("om-chart-gauge", p.className), style: { width: W } },
      h("svg", { width: W, height: c + 2, viewBox: "0 0 " + W + " " + (c + 2), role: "img", "aria-label": (p.label || "Jauge") + " : " + (p.valueLabel || v) },
        h("defs", null, h("linearGradient", { id: gid, gradientUnits: "userSpaceOnUse", x1: 0, x2: W, y1: 0, y2: 0 },
          h("stop", { offset: "0", style: { stopColor: "var(--flame-500)" } }),
          h("stop", { offset: "0.55", style: { stopColor: "var(--flame-400)" } }),
          h("stop", { offset: "1", style: { stopColor: "var(--flame-200)" } }))),
        segs),
      h("div", { className: "om-chart-gauge__center", "aria-hidden": "true", style: { top: (c + 2 - 42) + "px" } },
        h("span", { className: "om-chart-gauge__value" }, p.valueLabel != null ? p.valueLabel : v)),
      p.scale !== false && h("div", { className: "om-chart-gauge__scale", "aria-hidden": "true" }, h("span", null, "0"), h("span", null, String(max))),
      p.caption && h("span", { className: "om-chart-gauge__caption" }, p.caption));
  }

  window.OpenMDM = Object.assign(window.OpenMDM || {}, {
    Icon: Icon,
    Button: Button,
    Badge: Badge,
    Card: Card, CardHeader: CardHeader, CardTitle: CardTitle, CardDescription: CardDescription, CardAction: CardAction, CardContent: CardContent, CardFooter: CardFooter,
    Input: Input, InputGroup: InputGroup, InputGroupInput: InputGroupInput, InputGroupAddon: InputGroupAddon,
    Label: Label, Field: Field, FieldGroup: FieldGroup, FieldContent: FieldContent, FieldLabel: FieldLabel, FieldDescription: FieldDescription, FieldError: FieldError,
    Select: Select, SelectTrigger: SelectTrigger, SelectValue: SelectValue, SelectContent: SelectContent, SelectItem: SelectItem, SelectGroup: SelectGroup, SelectLabel: SelectLabel, SelectSeparator: SelectSeparator,
    Checkbox: Checkbox, Switch: Switch,
    Tabs: Tabs, TabsList: TabsList, TabsTrigger: TabsTrigger, TabsContent: TabsContent,
    Table: Table, TableHeader: TableHeader, TableBody: TableBody, TableFooter: TableFooter, TableRow: TableRow, TableHead: TableHead, TableCell: TableCell, TableCaption: TableCaption,
    SidebarProvider: SidebarProvider, Sidebar: Sidebar, SidebarHeader: SidebarHeader, SidebarContent: SidebarContent, SidebarFooter: SidebarFooter,
    SidebarGroup: SidebarGroup, SidebarGroupLabel: SidebarGroupLabel, SidebarGroupContent: SidebarGroupContent,
    SidebarMenu: SidebarMenu, SidebarMenuItem: SidebarMenuItem, SidebarMenuButton: SidebarMenuButton, SidebarMenuBadge: SidebarMenuBadge,
    SidebarSeparator: SidebarSeparator, SidebarInset: SidebarInset,
    Breadcrumb: Breadcrumb, BreadcrumbList: BreadcrumbList, BreadcrumbItem: BreadcrumbItem, BreadcrumbLink: BreadcrumbLink, BreadcrumbPage: BreadcrumbPage, BreadcrumbSeparator: BreadcrumbSeparator,
    Pagination: Pagination, PaginationContent: PaginationContent, PaginationItem: PaginationItem, PaginationLink: PaginationLink, PaginationPrevious: PaginationPrevious, PaginationNext: PaginationNext, PaginationEllipsis: PaginationEllipsis,
    Item: Item, ItemMedia: ItemMedia, ItemContent: ItemContent, ItemTitle: ItemTitle, ItemDescription: ItemDescription, ItemActions: ItemActions, ItemGroup: ItemGroup, ItemSeparator: ItemSeparator,
    Avatar: Avatar, AvatarFallback: AvatarFallback, AvatarImage: AvatarImage,
    Progress: Progress, Separator: Separator,
    Tooltip: Tooltip, TooltipTrigger: TooltipTrigger, TooltipContent: TooltipContent,
    Alert: Alert, AlertTitle: AlertTitle, AlertDescription: AlertDescription,
    DropdownMenu: DropdownMenu, DropdownMenuTrigger: DropdownMenuTrigger, DropdownMenuContent: DropdownMenuContent, DropdownMenuLabel: DropdownMenuLabel,
    DropdownMenuGroup: DropdownMenuGroup, DropdownMenuItem: DropdownMenuItem, DropdownMenuSeparator: DropdownMenuSeparator, DropdownMenuShortcut: DropdownMenuShortcut,
    AlertDialog: AlertDialog, AlertDialogTrigger: AlertDialogTrigger, AlertDialogContent: AlertDialogContent, AlertDialogHeader: AlertDialogHeader, AlertDialogFooter: AlertDialogFooter,
    AlertDialogTitle: AlertDialogTitle, AlertDialogDescription: AlertDialogDescription, AlertDialogAction: AlertDialogAction, AlertDialogCancel: AlertDialogCancel,
    ChartPieDonutText: ChartPieDonutText, ChartAreaFlow: ChartAreaFlow, ChartPieGauge: ChartPieGauge
  });
})();
