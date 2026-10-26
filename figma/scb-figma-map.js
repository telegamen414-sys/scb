// Карта приложения СЦБ: дерево всех экранов на одной странице
const scr = figma.root.children.find((p) => p.name === "Экраны");
await scr.loadAsync();
const get = (pre) => scr.children.find((n) => n.name.startsWith(pre));
for (const f of [{ family: "Onest", style: "SemiBold" }, { family: "Onest", style: "Regular" }, { family: "Unbounded", style: "SemiBold" }, { family: "JetBrains Mono", style: "Regular" }]) await figma.loadFontAsync(f);
let page = figma.root.children.find((p) => p.name === "Карта приложения");
if (page) page.remove();
page = figma.createPage(); page.name = "Карта приложения";
figma.root.insertChild(0, page);
await figma.setCurrentPageAsync(page);
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const S = 0.4, TW = 390 * S, TH = 844 * S, COL = TW + 150, ROW = TH + 110, X0 = 80, Y0 = 220;
const board = figma.createFrame(); board.name = "Карта приложения"; board.fills = [{ type: "SOLID", color: hex("#06060E") }]; board.cornerRadius = 32; page.appendChild(board);
async function T(s, size, color, style, fam) { const t = figma.createText(); t.fontName = { family: fam || "Onest", style: style || "Regular" }; t.fontSize = size; t.characters = s; t.fills = [{ type: "SOLID", color: hex(color) }]; board.appendChild(t); return t; }
// узлы дерева: [префикс экрана, колонка, строка]
const NODES = { login: ["00", 0, 1.5], home: ["01", 1, 1.5], doc: ["06", 2, 0], book: ["02", 2, 1], search: ["08", 2, 2], fav: ["09", 2, 3], files: ["10", 2, 4], docsearch: ["07", 3, 0], sec: ["03", 3, 1], item: ["04", 4, 1], reader: ["05", 5, 1] };
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
  BOX[k] = { x, y, cy: y + TH / 2 };
}
async function edge(a, b, label, dashed) {
  const A = BOX[a], B = BOX[b]; if (!A || !B) return;
  const sx = A.x + TW, sy = A.cy, tx = B.x, ty = B.cy, mx = tx - 50;
  const v = figma.createVector(); board.appendChild(v);
  v.vectorPaths = [{ windingRule: "NONE", data: sy === ty ? `M ${sx} ${sy} L ${tx - 6} ${ty}` : `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx - 6} ${ty}` }];
  v.strokes = [{ type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { ...hex("#8B5CF6"), a: 1 } }, { position: 1, color: { ...hex("#22D3EE"), a: 1 } }] }];
  v.strokeWeight = 2.5; v.strokeJoin = "ROUND"; v.strokeCap = "ARROW_LINES"; if (dashed) v.dashPattern = [8, 6]; v.name = "→ " + label;
  const t = await T(label, 12, dashed ? "#9A9AB8" : "#C9C9E3", "Regular");
  t.x = sy === ty ? sx + 12 : mx - t.width / 2; t.y = (sy === ty ? sy : ty) - 22;
  if (sy !== ty) { t.x = mx + 8; t.y = ty - 20; }
}
await edge("login", "home", "Открыть");
await edge("home", "doc", "документ");
await edge("home", "book", "книга");
await edge("home", "search", "вкладка", true);
await edge("home", "fav", "вкладка", true);
await edge("home", "files", "вкладка", true);
await edge("doc", "docsearch", "поиск по тексту");
await edge("book", "sec", "раздел");
await edge("sec", "item", "пункт");
await edge("item", "reader", "Страницы книги");
// Поиск → Пункт (через свободный коридор)
{ const A = BOX.search, B = BOX.item; const sx = A.x + TW, sy = A.cy, tx = B.x, ty = B.y + TH - 40, mx = tx - 30;
  const v = figma.createVector(); board.appendChild(v); v.vectorPaths = [{ windingRule: "NONE", data: `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx - 6} ${ty}` }];
  v.strokes = [{ type: "SOLID", color: hex("#22D3EE"), opacity: 0.8 }]; v.strokeWeight = 2.5; v.strokeJoin = "ROUND"; v.strokeCap = "ARROW_LINES"; v.name = "→ результат поиска";
  const t = await T("результат поиска", 12, "#C9C9E3"); t.x = sx + 16; t.y = sy - 22; }
const h = await T("Справочник СЦБ — карта приложения", 34, "#F4F4FF", "SemiBold", "Unbounded"); h.x = X0; h.y = 70;
const sub = await T("11 экранов · сплошные стрелки — нажатие, пунктир — нижние вкладки · «назад» возвращает по стрелке обратно", 15, "#9A9AB8"); sub.x = X0; sub.y = 130;
board.resize(X0 * 2 + 5 * COL + TW, Y0 + 4 * ROW + TH + 100);
figma.viewport.scrollAndZoomIntoView([board]);
figma.notify("Карта приложения готова");
print("ok " + Object.keys(BOX).length);
