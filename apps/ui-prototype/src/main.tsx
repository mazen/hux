// PROTOTYPE - generative-canvas UI concepts for hux, switchable via ?variant=01..04 and the floating bar (or ← →).
import { StrictMode, Suspense, lazy, useEffect, useState, type ComponentType, type LazyExoticComponent } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

type VariantModule = { default: ComponentType; name: string };

const variants: { key: string; load: () => Promise<VariantModule> }[] = [
  { key: "01", load: () => import("./variants/v01") },
  { key: "02", load: () => import("./variants/v02") },
  { key: "03", load: () => import("./variants/v03") },
  { key: "04", load: () => import("./variants/v04") },
];

const names: Record<string, string> = {};
const nameListeners = new Set<() => void>();
const lazies: Record<string, LazyExoticComponent<ComponentType>> = {};
for (const v of variants) {
  lazies[v.key] = lazy(async () => {
    const m = await v.load();
    names[v.key] = m.name;
    nameListeners.forEach((f) => f());
    return { default: m.default };
  });
}

function currentKey() {
  const k = new URLSearchParams(location.search).get("variant") ?? "01";
  return variants.some((v) => v.key === k) ? k : "01";
}

function PrototypeSwitcher({ current, onChange }: { current: string; onChange: (k: string) => void }) {
  const [hidden, setHidden] = useState(false);
  const [, rerender] = useState(0);
  useEffect(() => {
    const f = () => rerender((n) => n + 1);
    nameListeners.add(f);
    return () => {
      nameListeners.delete(f);
    };
  }, []);
  const idx = variants.findIndex((v) => v.key === current);
  const go = (d: number) => onChange(variants[(idx + d + variants.length) % variants.length].key);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const bar: React.CSSProperties = {
    position: "fixed", left: "50%", bottom: 12, transform: "translateX(-50%)", zIndex: 2147483647,
    display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 999,
    background: "#111", color: "#fff", font: "600 12px/1 system-ui, sans-serif",
    boxShadow: "0 6px 24px rgba(0,0,0,.35)", outline: "2px solid #ff3d7f", opacity: hidden ? 0.35 : 1,
  };
  const btn: React.CSSProperties = { all: "unset", cursor: "pointer", padding: "4px 8px", borderRadius: 999, background: "#333" };
  if (hidden) return <button style={{ ...bar, cursor: "pointer", border: 0 }} onClick={() => setHidden(false)}>Prototype {current}</button>;
  return (
    <div style={bar}>
      <button style={btn} onClick={() => go(-1)} aria-label="Previous concept">←</button>
      <span>{current} · {names[current] ?? "…"}</span>
      <button style={btn} onClick={() => go(1)} aria-label="Next concept">→</button>
      <button style={{ ...btn, background: "transparent" }} onClick={() => setHidden(true)} aria-label="Minimise">–</button>
    </div>
  );
}

function App() {
  const [key, setKey] = useState(currentKey);
  const change = (k: string) => {
    const url = new URL(location.href);
    url.searchParams.set("variant", k);
    history.replaceState(null, "", url);
    setKey(k);
  };
  const Variant = lazies[key];
  return (
    <>
      <Suspense fallback={null}>
        <Variant key={key} />
      </Suspense>
      <PrototypeSwitcher current={key} onChange={change} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
