// Карта приложения СЦБ: дерево всех экранов на одной странице
const scr = figma.root.children.find((p) => p.name === "Экраны");
await scr.loadAsync();
const get = (pre) => scr.children.find((n) => n.name.startsWith(pre));
for (const f of [{ family: "Onest", style: "SemiBold" }, { family: "Onest", style: "Regular" }, { family: "Unbounded", style: "SemiBold" }, { family: "JetBrains Mono", style: "Regular" }]) await figma.loadFontAsync(f);
let page = figma.root.children.find((p) => p.name === "Карта приложения");
if (page) { await page.loadAsync(); for (const n of page.children.slice()) n.remove(); }
else { page = figma.createPage(); page.name = "Карта приложения"; figma.root.insertChild(0, page); }
await figma.setCurrentPageAsync(page);
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const S = 0.4, TW = 390 * S, TH = 844 * S, COL = TW + 150, ROW = TH + 150, X0 = 80, Y0 = 220;
const board = figma.createFrame(); board.name = "Карта приложения"; board.fills = [{ type: "SOLID", color: hex("#06060E") }]; board.cornerRadius = 32; page.appendChild(board);
async function T(s, size, color, style, fam) { const t = figma.createText(); t.fontName = { family: fam || "Onest", style: style || "Regular" }; t.fontSize = size; t.characters = s; t.fills = [{ type: "SOLID", color: hex(color) }]; board.appendChild(t); return t; }
// узлы дерева: [префикс экрана, колонка, строка] — основной путь сверху, ветки ниже
const NODES = { login: ["00", 0, 0], home: ["01", 1, 0], book: ["02", 2, 0], sec: ["03", 3, 0], item: ["04", 4, 0], reader: ["05", 5, 0], doc: ["06", 2, 1], docsearch: ["07", 3, 1], fav: ["09", 2, 2], files: ["10", 3, 2], search: ["08", 4, 2] };
const BOX = {};
for (const [k, [pre, c, r]] of Object.entries(NODES)) {
  const src = get(pre + " ·"); if (!src) continue;
  const x = X0 + c * COL, y = Y0 + r * ROW;
  const cl = src.clone(); board.appendChild(cl);
  for (const n of [cl, ...cl.findAll(() => true)]) { if ("reactions" in n && n.reactions.length) { try { await n.setReactionsAsync([]); } catch (e) {} } }
  cl.rescale(S); cl.x = x; cl.y = y; cl.cornerRadius = 18; cl.effects = [{ type: "DROP_SHADOW", color: { r: 0.49, g: 0.23, b: 0.93, a: 0.45 }, offset: { x: 0, y: 10 }, radius: 30, spread: 0, visible: true, blendMode: "NORMAL" }];
  cl.strokes = [{ type: "SOLID", color: hex("#FFFFFF"), opacity: 0.15 }]; cl.strokeWeight = 1;
  const lab = await T(src.name.replace(/^\d\d · /, ""), 15, "#F4F4FF", "SemiBold"); lab.x = x; lab.y = y - 28;
  const num = await T(pre, 11, "#A78BFA", "Regular", "JetBrains Mono"); num.x = x + TW - num.width; num.y = y - 25;
  BOX[k] = { x, y, cx: x + TW / 2, cy: y + TH / 2, r: x + TW, b: y + TH };
}
const GR = [{ type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { ...hex("#8B5CF6"), a: 1 } }, { position: 1, color: { ...hex("#22D3EE"), a: 1 } }] }];
async function line(pts, label, lx, ly, dashed) {
  const v = figma.createVector(); board.appendChild(v);
  v.vectorPaths = [{ windingRule: "NONE", data: pts.map((p, i) => (i ? "L " : "M ") + p[0] + " " + p[1]).join(" ") }];
  v.strokes = dashed ? [{ type: "SOLID", color: hex("#9A9AB8") }] : GR; v.strokeWeight = 2.5; v.strokeJoin = "ROUND"; v.strokeCap = "ARROW_LINES";
  if (dashed) v.dashPattern = [8, 6]; v.name = "→ " + label;
  if (lx != null) { const t = await T(label, 12, dashed ? "#9A9AB8" : "#C9C9E3"); t.x = lx; t.y = ly; }
}
const B = BOX;
// основной путь: горизонтальные стрелки
for (const [a, b, l] of [["login", "home", "Открыть"], ["home", "book", "книга"], ["book", "sec", "раздел"], ["sec", "item", "пункт"], ["item", "reader", "Страницы книги"], ["doc", "docsearch", "поиск по тексту"]])
  await line([[B[a].r + 6, B[a].cy], [B[b].x - 8, B[b].cy]], l, B[a].r + 12, B[a].cy - 22);
// Главная → Документ
await line([[B.home.cx + 30, B.home.b + 6], [B.home.cx + 30, B.doc.cy], [B.doc.x - 8, B.doc.cy]], "документ", B.home.cx + 38, B.doc.cy - 22);
// Главная → вкладки (пунктир)
const busY = B.fav.y - 60;
for (const k of ["fav", "files", "search"]) await line([[B.home.cx - 30, B.home.b + 6], [B.home.cx - 30, busY], [B[k].cx, busY], [B[k].cx, B[k].y - 34]], "вкладка", k === "fav" ? B.home.cx - 22 : null, busY - 20, true);
// Поиск → Пункт
await line([[B.search.cx + 30, B.search.y - 34], [B.search.cx + 30, B.item.b + 8]], "результат поиска", B.search.cx + 38, (B.search.y + B.item.b) / 2 - 8);
const h = await T("Справочник СЦБ — карта приложения", 34, "#F4F4FF", "SemiBold", "Unbounded"); h.x = X0; h.y = 70;
const sub = await T("11 экранов · верхний ряд — основной путь · сплошные стрелки — нажатие · пунктир — нижние вкладки · «назад» возвращает по стрелке обратно", 15, "#9A9AB8"); sub.x = X0; sub.y = 130;
board.resize(X0 * 2 + 5 * COL + TW, Y0 + 2 * ROW + TH + 90);
figma.viewport.scrollAndZoomIntoView([board]);
figma.notify("Карта приложения готова");
print("ok " + Object.keys(BOX).length);
