// PROTOTYPE - the tile tree. A Surface is one tree; leaves are tiles or open space. Nothing overlaps by construction.

export type Kind =
  | "weather" | "today" | "shopping" | "recipe" | "timer" | "email" | "week"
  | "schedule" | "settings" | "ideas" | "history";

export type Leaf = { t: "leaf"; id: string; kind: Kind | "open"; keptAt?: string; compact?: boolean };
export type Split = { t: "split"; id: string; dir: "row" | "col"; kids: Node[]; sizes: number[] };
export type Node = Leaf | Split;
export type Side = "left" | "right" | "top" | "bottom";
export type Zone = Side | "center";

let n = 0;
export const uid = () => `t${(++n).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const open = (): Leaf => ({ t: "leaf", id: uid(), kind: "open" });
export const leaf = (kind: Kind, keptAt?: string): Leaf => ({ t: "leaf", id: uid(), kind, keptAt });
const clone = <T,>(x: T): T => structuredClone(x);

export function leaves(root: Node): Leaf[] {
  return root.t === "leaf" ? [root] : root.kids.flatMap(leaves);
}

export function findKind(root: Node, kind: Kind): Leaf | undefined {
  return leaves(root).find((l) => l.kind === kind);
}

type Loc = { node: Node; parent: Split | null; index: number };
function locate(root: Node, id: string, parent: Split | null = null, index = 0): Loc | null {
  if (root.id === id) return { node: root, parent, index };
  if (root.t === "split") {
    for (let i = 0; i < root.kids.length; i++) {
      const r = locate(root.kids[i], id, root, i);
      if (r) return r;
    }
  }
  return null;
}

/** Collapse single-child splits, flatten same-direction nesting, merge neighbouring open space. */
export function normalize(node: Node): Node {
  if (node.t === "leaf") return node;
  const kids: Node[] = [];
  const sizes: number[] = [];
  node.kids.forEach((k, i) => {
    const c = normalize(k);
    if (c.t === "split" && c.dir === node.dir) {
      c.kids.forEach((g, j) => { kids.push(g); sizes.push(node.sizes[i] * c.sizes[j]); });
    } else {
      const prev = kids[kids.length - 1];
      if (c.t === "leaf" && c.kind === "open" && prev && prev.t === "leaf" && prev.kind === "open") {
        sizes[sizes.length - 1] += node.sizes[i];
      } else { kids.push(c); sizes.push(node.sizes[i]); }
    }
  });
  if (kids.length === 0) return open();
  if (kids.length === 1) return kids[0];
  const sum = sizes.reduce((a, b) => a + b, 0) || 1;
  return { ...node, kids, sizes: sizes.map((s) => s / sum) };
}

/** Remove a tile; its neighbours grow back into the space. */
export function remove(root: Node, id: string): Node {
  const r = clone(root);
  const loc = locate(r, id);
  if (!loc) return root;
  if (!loc.parent) return open();
  const p = loc.parent;
  const freed = p.sizes[loc.index];
  p.kids.splice(loc.index, 1);
  p.sizes.splice(loc.index, 1);
  const nb = [loc.index - 1, loc.index].filter((i) => i >= 0 && i < p.kids.length);
  nb.forEach((i) => (p.sizes[i] += freed / nb.length));
  return normalize(r);
}

/** Split a tile: the new one takes `share` of it on the given side. */
export function insertBeside(root: Node, targetId: string, add: Leaf, side: Side, share = 0.5): Node {
  const r = clone(root);
  const loc = locate(r, targetId);
  if (!loc) return insertAtEdge(root, add, side, share);
  const dir = side === "left" || side === "right" ? "row" : "col";
  const before = side === "left" || side === "top";
  const p = loc.parent;
  if (p && p.dir === dir) {
    const s = p.sizes[loc.index];
    p.sizes[loc.index] = s * (1 - share);
    const at = before ? loc.index : loc.index + 1;
    p.kids.splice(at, 0, add);
    p.sizes.splice(at, 0, s * share);
    return normalize(r);
  }
  const split: Split = {
    t: "split", id: uid(), dir,
    kids: before ? [add, loc.node] : [loc.node, add],
    sizes: before ? [share, 1 - share] : [1 - share, share],
  };
  if (!p) return normalize(split);
  p.kids[loc.index] = split;
  return normalize(r);
}

/** Place along an edge of the whole Surface. Open space gives way first, then everyone shrinks a little. */
export function insertAtEdge(root: Node, add: Leaf, side: Side, share: number): Node {
  const dir = side === "left" || side === "right" ? "row" : "col";
  const before = side === "left" || side === "top";
  let r = clone(root);
  if (r.t === "leaf" && r.kind === "open") {
    r = { t: "split", id: uid(), dir, kids: [r], sizes: [1] };
  }
  if (r.t === "split" && r.dir === dir) {
    let need = share;
    r.kids.forEach((k, i) => {
      if (k.t === "leaf" && k.kind === "open" && need > 0) {
        const take = Math.min(need, r.t === "split" ? r.sizes[i] : 0);
        (r as Split).sizes[i] -= take;
        need -= take;
      }
    });
    if (need > 0) {
      const rest = r.sizes.reduce((a, b) => a + b, 0);
      r.sizes = r.sizes.map((s) => s * (1 - need / rest));
    }
    if (before) { r.kids.unshift(add); r.sizes.unshift(share); } else { r.kids.push(add); r.sizes.push(share); }
    r.kids = r.kids.filter((_, i) => (r as Split).sizes[i] > 0.02);
    r.sizes = r.sizes.filter((s) => s > 0.02);
    return normalize(r);
  }
  return normalize({
    t: "split", id: uid(), dir,
    kids: before ? [add, r] : [r, add],
    sizes: before ? [share, 1 - share] : [1 - share, share],
  });
}

export type Frame = { id: string; w: number; h: number };
export function frames(root: Node, w = 1, h = 1, out: Frame[] = []): Frame[] {
  if (root.t === "leaf") { out.push({ id: root.id, w, h }); return out; }
  root.kids.forEach((k, i) =>
    frames(k, root.dir === "row" ? w * root.sizes[i] : w, root.dir === "col" ? h * root.sizes[i] : h, out));
  return out;
}

/** Put a tile where it fits: the largest open space, or else split the largest tile along its long side. */
export function placeInOpen(root: Node, add: Leaf, grow = false): Node {
  const fr = frames(root);
  const byId = new Map(leaves(root).map((l) => [l.id, l]));
  const opens = fr.filter((f) => byId.get(f.id)?.kind === "open").sort((a, b) => b.w * b.h - a.w * a.h);
  if (opens.length) {
    const r = clone(root);
    const loc = locate(r, opens[0].id)!;
    add.id = add.id || uid();
    if (!loc.parent) return add;
    loc.parent.kids[loc.index] = add;
    if (grow) {
      const s = loc.parent.sizes[loc.index];
      const target = Math.max(s, 0.5);
      const others = 1 - s;
      loc.parent.sizes = loc.parent.sizes.map((x, i) => (i === loc.index ? target : (x * (1 - target)) / others));
    }
    return normalize(r);
  }
  const big = fr.sort((a, b) => b.w * b.h - a.w * a.h)[0];
  // Surfaces are wider than tall; weigh width accordingly.
  return insertBeside(root, big.id, add, big.w * 1.6 >= big.h ? "right" : "bottom", 0.5);
}

/** Grow or shrink a tile's share in its row or column. */
export function scale(root: Node, id: string, factor: number): Node {
  const r = clone(root);
  const loc = locate(r, id);
  if (!loc?.parent) return root;
  const p = loc.parent;
  const s = p.sizes[loc.index];
  const next = Math.min(0.85, Math.max(0.1, s * factor));
  const rest = 1 - s;
  p.sizes = p.sizes.map((x, i) => (i === loc.index ? next : (x * (1 - next)) / rest));
  return r;
}

export function setSizes(root: Node, splitId: string, sizes: number[]): Node {
  const r = clone(root);
  const loc = locate(r, splitId);
  if (loc?.node.t === "split") loc.node.sizes = sizes;
  return r;
}

export function patchLeaf(root: Node, id: string, patch: Partial<Leaf>): Node {
  const r = clone(root);
  const loc = locate(r, id);
  if (loc?.node.t === "leaf") Object.assign(loc.node, patch);
  return r;
}

export function swap(root: Node, a: string, b: string): Node {
  const r = clone(root);
  const la = locate(r, a)?.node, lb = locate(r, b)?.node;
  if (la?.t !== "leaf" || lb?.t !== "leaf") return root;
  const { kind, keptAt, compact } = la;
  Object.assign(la, { kind: lb.kind, keptAt: lb.keptAt, compact: lb.compact });
  Object.assign(lb, { kind, keptAt, compact });
  return r;
}

/** Drag-and-drop: drop a tile on another tile's edge (split) or centre (swap, or fill open space). */
export function move(root: Node, src: string, target: string, zone: Zone): Node {
  if (src === target) return root;
  const s = locate(root, src)?.node;
  const t = locate(root, target)?.node;
  if (s?.t !== "leaf" || t?.t !== "leaf") return root;
  if (zone === "center") {
    if (t.kind === "open") return normalize(swap(root, src, target));
    return swap(root, src, target);
  }
  const after = remove(root, src);
  if (!locate(after, target)) return insertAtEdge(after, { ...s }, zone, 0.34);
  return insertBeside(after, target, { ...s }, zone, 0.5);
}

/** Keep only some kinds; they gather on the side they were on and the rest becomes open space. */
export function keepOnly(root: Node, kinds: Kind[]): Node {
  const fr = frames(root);
  const all = leaves(root);
  const kept = all.filter((l) => l.kind !== "open" && kinds.includes(l.kind as Kind));
  if (!kept.length) return open();
  // Which side were they on? Approximate by the x-centre of each frame along the DFS order.
  let x = 0;
  const xs = new Map<string, number>();
  (function walk(n: Node, x0: number, w: number) {
    if (n.t === "leaf") { xs.set(n.id, x0 + w / 2); return; }
    let acc = x0;
    n.kids.forEach((k, i) => {
      const kw = n.dir === "row" ? w * n.sizes[i] : w;
      walk(k, acc, kw);
      if (n.dir === "row") acc += kw;
    });
  })(root, 0, 1);
  x = kept.reduce((a, l) => a + (xs.get(l.id) ?? 0.5), 0) / kept.length;
  void fr;
  const col: Node = kept.length === 1
    ? kept[0]
    : { t: "split", id: uid(), dir: "col", kids: kept, sizes: kept.map(() => 1 / kept.length) };
  const right = x >= 0.5;
  return normalize({
    t: "split", id: uid(), dir: "row",
    kids: right ? [open(), col] : [col, open()],
    sizes: right ? [0.66, 0.34] : [0.34, 0.66],
  });
}
