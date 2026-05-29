import { useState, useMemo, useRef, useEffect } from "react";

const ALL = "toute";
const SEASON_META = {
  printemps: { label: "Printemps", emoji: "🌿" },
  ete:       { label: "Été",       emoji: "☀️" },
  automne:   { label: "Automne",   emoji: "🍂" },
  hiver:     { label: "Hiver",     emoji: "❄️" },
  [ALL]:     { label: "Toute l'année", emoji: "🗓" },
};

const SLOT_META = {
  lunchbox: { label: "Lunch box", emoji: "🥪" },
  soir:     { label: "Soir",      emoji: "🌙" },
  weekend:  { label: "Week-end",  emoji: "🏡" },
};
const EFFORT_META = {
  pouce:  { label: "Sur le pouce", emoji: "⚡" },
  normal: { label: "Normal",       emoji: "🍳" },
  recoit: { label: "Réception", emoji: "🎉" },
};

// slots: [lunchbox|soir|weekend] (conseillé) · effort: pouce|normal|recoit
const SEED = [
  { id: 1,  name: "Poulet rôti",            seasons: [],    slots: ["weekend"],          effort: "recoit" },
  { id: 2,  name: "Poke bowl",              seasons: [],    slots: ["lunchbox", "soir"], effort: "normal" },
  { id: 3,  name: "Risotto aux asperges",   seasons: ["printemps"],        slots: ["weekend"],          effort: "recoit" },
  { id: 4,  name: "Poisson + purée",        seasons: [],    slots: ["soir"],             effort: "normal" },
  { id: 5,  name: "Pizza maison",           seasons: [],    slots: ["soir", "weekend"],  effort: "normal" },
  { id: 6,  name: "Omelette + salade",      seasons: [],    slots: ["soir"],             effort: "pouce" },
  { id: 7,  name: "Salade haricots verts",  seasons: ["ete"],              slots: ["lunchbox", "soir"], effort: "pouce" },
  { id: 8,  name: "Salade pommes de terre", seasons: [],    slots: ["lunchbox"],         effort: "pouce" },
  { id: 9,  name: "Quiche",                 seasons: [],    slots: ["lunchbox", "soir"], effort: "normal" },
  { id: 10, name: "Tarte aux légumes",      seasons: [],    slots: ["lunchbox", "soir"], effort: "normal" },
  { id: 11, name: "Croque-monsieur",        seasons: [],    slots: ["soir"],             effort: "pouce" },
  { id: 12, name: "Galettes de sarrasin",   seasons: [],    slots: ["lunchbox", "soir"], effort: "normal" },
  { id: 13, name: "Tomates mozza",          seasons: ["ete"],              slots: ["lunchbox", "soir"], effort: "pouce" },
  { id: 14, name: "Tomates feta",           seasons: ["ete"],              slots: ["soir"],             effort: "pouce" },
  { id: 15, name: "Soupe classique",        seasons: ["automne", "hiver"], slots: ["soir"],             effort: "normal" },
  { id: 16, name: "Soupe potiron",          seasons: ["automne"],          slots: ["soir"],             effort: "normal" },
  { id: 17, name: "Steak frites",           seasons: [],    slots: ["soir", "weekend"],  effort: "normal" },
  { id: 18, name: "Saucisse lentilles",     seasons: ["automne", "hiver"], slots: ["soir", "weekend"],  effort: "normal" },
  { id: 19, name: "Aubergines farcies",     seasons: ["ete"], slots: ["soir", "weekend"], effort: "normal" },
  { id: 20, name: "Bœuf bourguignon",       seasons: ["hiver"], slots: ["weekend"], effort: "recoit" },
  { id: 21, name: "Couscous",               seasons: [],    slots: ["weekend"], effort: "recoit" },
  { id: 22, name: "Dahl de lentilles",      seasons: ["automne", "hiver"], slots: ["soir"], effort: "normal" },
  { id: 23, name: "Endives au jambon",      seasons: ["hiver"], slots: ["soir"], effort: "normal" },
  { id: 24, name: "Falafels",               seasons: [],    slots: ["lunchbox", "soir"], effort: "normal" },
  { id: 25, name: "Gratin dauphinois",      seasons: ["automne", "hiver"], slots: ["weekend"], effort: "normal" },
  { id: 26, name: "Hachis parmentier",      seasons: ["automne", "hiver"], slots: ["soir", "weekend"], effort: "normal" },
  { id: 27, name: "Lasagnes",               seasons: [],    slots: ["soir", "weekend"], effort: "normal" },
  { id: 28, name: "Moussaka",               seasons: ["ete"], slots: ["weekend"], effort: "recoit" },
  { id: 29, name: "Nems maison",            seasons: [],    slots: ["weekend"], effort: "recoit" },
  { id: 30, name: "Ratatouille",            seasons: ["ete"], slots: ["soir", "weekend"], effort: "normal" },
  { id: 31, name: "Tajine de poulet",       seasons: [],    slots: ["weekend"], effort: "recoit" },
  { id: 32, name: "Velouté de courgettes",  seasons: ["ete"], slots: ["soir"], effort: "pouce" },
  { id: 33, name: "Wraps poulet crudités",  seasons: [],    slots: ["lunchbox"], effort: "pouce" },
];

const DAYS = [
  { key: "sam", label: "Samedi",   short: "Sam", weekend: true },
  { key: "dim", label: "Dimanche", short: "Dim", weekend: true },
  { key: "lun", label: "Lundi",    short: "Lun", weekend: false },
  { key: "mar", label: "Mardi",    short: "Mar", weekend: false },
  { key: "mer", label: "Mercredi", short: "Mer", weekend: false },
  { key: "jeu", label: "Jeudi",    short: "Jeu", weekend: false },
  { key: "ven", label: "Vendredi", short: "Ven", weekend: false },
];

const ACCENT = "#FF5C4D"; // corail vif
const ACCENT_SOFT = "#FFE9E5";
const SECONDARY = "#FFC529"; // jaune doré (jour courant)

// Détermine le "type" de slot pour la reco : lunchbox | soir | weekend
function slotKind(slotId, dayKey) {
  const weekend = dayKey === "sam" || dayKey === "dim";
  if (weekend) return "weekend";
  if (slotId === "lunchbox") return "lunchbox";
  return "soir"; // dîner de semaine
}

function getSeason(d = new Date()) {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return "printemps";
  if (m >= 6 && m <= 8) return "ete";
  if (m >= 9 && m <= 11) return "automne";
  return "hiver";
}

// Pas de saison (tableau vide) ou [ALL] => toute l'année
const isAllYear = (r) => !r.seasons || r.seasons.length === 0 || r.seasons.includes(ALL);
// Recette pertinente pour la saison courante (de saison OU toute l'année)
const matchesSeason = (r, season) => isAllYear(r) || r.seasons.includes(season);
// Recette spécifiquement de saison courante (exclut toute l'année)
const strictlyInSeason = (r, season) => !isAllYear(r) && r.seasons.includes(season);

function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Samedi de la semaine contenant `date` (la semaine va du samedi au vendredi)
function saturdayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
  return d;
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// Stockage persistant : window.storage (artifact) sinon localStorage (hébergement statique type GitHub Pages)
const store = {
  async get(key) {
    if (typeof window !== "undefined" && window.storage?.get) return window.storage.get(key);
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    return v == null ? null : { key, value: v };
  },
  async set(key, value) {
    if (typeof window !== "undefined" && window.storage?.set) return window.storage.set(key, value);
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    return { key, value };
  },
};

// ---- ICONS (inline SVG, stroke style) ----
const Icon = {
  cal: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>,
  book: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg>,
  chevL: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 6l-6 6 6 6"/></svg>,
  chevR: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 6l6 6-6 6"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>,
  edit: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  pen: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 13l4 4L19 7"/></svg>,
  utensils: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-1.5 0-2.5 2-2.5 4.5S15.5 12 17 12v9"/></svg>,
  heart: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5.5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z"/></svg>,
  menu: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/><path d="M10 11v5M14 11v5"/></svg>,
};

export default function App() {
  const [tab, setTab] = useState("semaine");
  const [menuOpen, setMenuOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [recipes, setRecipes] = useState(SEED);
  const [menu, setMenu] = useState({}); // key: weekKey-day-slot -> { type:'recipe'|'text', value }
  const [loaded, setLoaded] = useState(false); // données chargées depuis le stockage
  const [sheet, setSheet] = useState(null); // { day, slot, label, dayLabel }
  const [query, setQuery] = useState("");
  const [inline, setInline] = useState(null); // { day, slot } -> editing text inline
  const [inlineText, setInlineText] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSeasons, setNewSeasons] = useState([]);
  const [newSlots, setNewSlots] = useState([]);
  const [newEffort, setNewEffort] = useState("normal");
  const [editId, setEditId] = useState(null); // id de la recette en cours d'édition
  const [addOrigin, setAddOrigin] = useState("recettes"); // onglet vers lequel revenir après le formulaire
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMore, setShowMore] = useState(false); // sheet: déplier toutes les recettes
  const [recipeSort, setRecipeSort] = useState("alpha"); // alpha | slot | effort
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const [recipeSearch, setRecipeSearch] = useState("");
  const searchRef = useRef(null);
  const inlineRef = useRef(null);
  const recipesScrollRef = useRef(null);
  const weekScrollRef = useRef(null);
  const swipeRef = useRef(null); // { x, y } point de départ du swipe
  const [swipeDX, setSwipeDX] = useState(0); // décalage live pendant le drag

  // Chargement depuis le stockage persistant au démarrage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await store.get("recipes");
        if (!cancelled && r?.value) setRecipes(JSON.parse(r.value));
      } catch (e) { /* clé absente => on garde SEED */ }
      try {
        const m = await store.get("menu");
        if (!cancelled && m?.value) setMenu(JSON.parse(m.value));
      } catch (e) { /* clé absente => menu vide */ }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Sauvegarde des recettes (après chargement seulement, pour ne pas écraser le stockage avec SEED)
  useEffect(() => {
    if (!loaded) return;
    store.set("recipes", JSON.stringify(recipes)).catch(() => {});
  }, [recipes, loaded]);

  // Sauvegarde du menu planifié
  useEffect(() => {
    if (!loaded) return;
    store.set("menu", JSON.stringify(menu)).catch(() => {});
  }, [menu, loaded]);

  const baseMonday = useMemo(() => {
    const m = saturdayOf(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const weekKey = baseMonday.toISOString().slice(0, 10);
  const season = getSeason(baseMonday);
  const SM = SEASON_META[season];

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + i);
    return d;
  });

  const todayKey = saturdayOf(new Date()).toISOString().slice(0, 10);
  const isCurrentWeek = weekKey === todayKey;

  // Sur la semaine courante, défile jusqu'au 1er jour à venir (≥ aujourd'hui) en consultation
  useEffect(() => {
    if (tab !== "semaine" || showAdd) return;
    if (!isCurrentWeek) {
      weekScrollRef.current?.parentElement?.scrollTo({ top: 0 });
      return;
    }
    const anchor = weekScrollRef.current?.querySelector('[data-anchor="1"]');
    if (anchor) requestAnimationFrame(() => anchor.scrollIntoView({ block: "start", behavior: "auto" }));
  }, [tab, weekOffset, isCurrentWeek, showAdd]);
  const lastDay = weekDates[6];
  const weekLabel = `${weekDates[0].getDate()} – ${lastDay.getDate()} ${MONTHS[lastDay.getMonth()]}`;

  const sk = (day, slot) => `${weekKey}-${day}-${slot}`;
  const getEntry = (day, slot) => menu[sk(day, slot)];

  // Slot vide = barre de saisie. Focus => édition texte ; bouton + => sheet de sélection.
  const startInline = (day, slot, label, dayLabel, initial) => {
    setSheet(null);
    setInline({ day, slot, label, dayLabel });
    setInlineText(initial || "");
  };

  const openSheetFor = (day, slot, label, dayLabel) => {
    setInline(null); setInlineText("");
    setSheet({ day, slot, label, dayLabel });
    setQuery(""); setShowMore(false);
  };

  const saveInline = () => {
    if (!inline) return;
    const v = inlineText.trim();
    setMenu(p => {
      const n = { ...p };
      if (v) {
        const match = recipes.find(r => r.name.toLowerCase() === v.toLowerCase());
        n[sk(inline.day, inline.slot)] = match
          ? { type: "recipe", value: match.name }
          : { type: "text", value: v };
      } else {
        delete n[sk(inline.day, inline.slot)];
      }
      return n;
    });
    setInline(null); setInlineText("");
  };

  // Cœur depuis la saisie inline : enregistre le plat comme recette et ouvre le formulaire pré-rempli
  const saveInlineAsRecipe = () => {
    if (!inline) return;
    const v = inlineText.trim();
    if (!v) return;
    const slotKindForInline = slotKind(inline.slot, inline.day);
    const existing = recipes.find(r => r.name.toLowerCase() === v.toLowerCase());
    // assigne le plat au slot en tant que recette
    setMenu(p => ({ ...p, [sk(inline.day, inline.slot)]: { type: "recipe", value: v } }));
    setInline(null); setInlineText("");
    setAddOrigin("semaine");
    if (existing) {
      openEdit(existing);
    } else {
      // pré-remplit le formulaire de création (slot conseillé = celui en cours)
      setEditId(null);
      setNewName(v);
      setNewSeasons([]);
      setNewSlots([slotKindForInline]);
      setNewEffort("normal");
      setTab("recettes");
      setShowAdd(true);
    }
  };

  const pickRecipe = (r) => {
    setMenu(p => ({ ...p, [sk(sheet.day, sheet.slot)]: { type: "recipe", value: r.name, seasons: r.seasons } }));
    setSheet(null);
  };

  // Appui long → ouvre la fiche recette (édition). Appui court → action normale.
  const lpTimer = useRef(null);
  const lpFired = useRef(false);
  const longPress = (onLong) => ({
    onPointerDown: () => { lpFired.current = false; lpTimer.current = setTimeout(() => { lpFired.current = true; onLong(); }, 500); },
    onPointerUp: () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } },
    onPointerLeave: () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } },
    onContextMenu: (e) => e.preventDefault(),
  });
  const openRecipeByName = (name) => {
    const r = recipes.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!r) return;
    setSheet(null);
    setAddOrigin(tab);
    setTab("recettes");
    openEdit(r);
  };

  // Swipe horizontal pour changer de semaine (ignore les bords pour ne pas gêner le geste retour)
  const EDGE = 28;
  const onWeekTouchStart = (e) => {
    const t = e.touches[0];
    if (t.clientX < EDGE || t.clientX > window.innerWidth - EDGE) { swipeRef.current = null; return; }
    swipeRef.current = { x: t.clientX, y: t.clientY, locked: false, active: false };
  };
  const onWeekTouchMove = (e) => {
    const s = swipeRef.current;
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (!s.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.locked = true;
      s.active = Math.abs(dx) > Math.abs(dy); // verrouille en mode horizontal ou vertical
    }
    if (!s.active) return;
    // résistance: on suit le doigt avec un léger amortissement
    setSwipeDX(dx * 0.6);
  };
  const onWeekTouchEnd = (e) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || !s.active) { setSwipeDX(0); return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    setSwipeDX(0);
    if (Math.abs(dx) < 60) return;
    setWeekOffset(o => o + (dx < 0 ? 1 : -1)); // swipe gauche => semaine suivante
  };
  const useFreeTextFromSheet = (txt) => {
    const v = txt.trim();
    if (!v) return;
    setMenu(p => ({ ...p, [sk(sheet.day, sheet.slot)]: { type: "text", value: v } }));
    setSheet(null);
  };
  const clearEntry = (day, slot) => setMenu(p => { const n = { ...p }; delete n[sk(day, slot)]; return n; });

  // Crée une nouvelle recette (saison courante par défaut) et l'assigne au slot
  const saveAsRecipeFromSheet = (txt) => {
    const v = txt.trim();
    if (!v || !sheet) return;
    const existing = recipes.find(r => r.name.toLowerCase() === v.toLowerCase());
    const rec = existing || { id: Date.now(), name: v, seasons: [], slots: [], effort: "normal" };
    if (!existing) setRecipes(p => [...p, rec]);
    setMenu(p => ({ ...p, [sk(sheet.day, sheet.slot)]: { type: "recipe", value: rec.name, seasons: rec.seasons } }));
    setSheet(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = recipes.filter(r => !q || r.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => {
      const ai = matchesSeason(a, season) ? 0 : 1;
      const bi = matchesSeason(b, season) ? 0 : 1;
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
  }, [recipes, query, season]);

  // Recettes déjà planifiées cette semaine (par nom, type recette uniquement)
  const plannedNames = useMemo(() => {
    const set = new Set();
    Object.entries(menu).forEach(([key, v]) => {
      if (key.startsWith(weekKey + "-") && v?.type === "recipe") set.add(v.value);
    });
    return set;
  }, [menu, weekKey]);

  useEffect(() => {
    if (!inline) return;
    const t1 = setTimeout(() => inlineRef.current?.focus(), 50);
    // remonte le champ dans la zone visible une fois le clavier ouvert
    const t2 = setTimeout(() => inlineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [inline]);

  const resetForm = () => {
    setNewName(""); setNewSeasons([]); setNewSlots([]); setNewEffort("normal");
    setEditId(null); setShowAdd(false);
    setTab(addOrigin);
    setAddOrigin("recettes");
  };
  const saveRecipe = () => {
    if (!newName.trim()) return;
    const data = { name: newName.trim(), seasons: newSeasons, slots: newSlots, effort: newEffort };
    if (editId) {
      setRecipes(p => p.map(r => r.id === editId ? { ...r, ...data } : r));
    } else {
      setRecipes(p => [...p, { id: Date.now(), ...data }]);
    }
    resetForm();
  };
  const openEdit = (r) => {
    setEditId(r.id);
    setNewName(r.name);
    // [ALL] ou vide => aucune saison cochée (= toute l'année)
    setNewSeasons((r.seasons || []).filter(s => s !== ALL));
    setNewSlots(r.slots || []);
    setNewEffort(r.effort || "normal");
    setShowAdd(true);
  };
  const deleteRecipe = () => {
    if (!editId) return;
    setRecipes(p => p.filter(r => r.id !== editId));
    setConfirmDelete(false);
    resetForm();
  };
  const toggleSlot = (s) => setNewSlots(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleSeason = (s) => setNewSeasons(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const slotsFor = (day) => day.weekend
    ? [{ id: "dejeuner", label: "Déjeuner", optional: true }, { id: "diner", label: "Dîner", optional: true }]
    : [{ id: "lunchbox", label: "Lunch box" }, { id: "diner", label: "Dîner", optional: true }];

  return (
    <>
      <style>{CSS}</style>
      <div className="app" style={{ "--accent": ACCENT, "--accent-soft": ACCENT_SOFT, "--secondary": SECONDARY }}>

        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-row">
            {showAdd ? (
              <>
                <button className="burger" onClick={resetForm} aria-label="Retour">
                  <Icon.chevL width={24} height={24} />
                </button>
                <div className="brand brand-center">{editId ? "Modifier recette" : "Nouvelle recette"}</div>
                {editId
                  ? <button className="burger burger-right" onClick={() => setConfirmDelete(true)} aria-label="Supprimer"><Icon.trash width={20} height={20} /></button>
                  : <div className="topbar-spacer" />}
              </>
            ) : (
              <>
                <button className="burger" onClick={() => setMenuOpen(true)} aria-label="Menu">
                  <Icon.menu width={22} height={22} />
                </button>
                <div className="brand brand-center">Menu</div>
                <div className="topbar-spacer" />
              </>
            )}
          </div>
        </header>

        {/* DRAWER MENU */}
        {menuOpen && <>
          <div className="scrim" onClick={() => setMenuOpen(false)} />
          <div className="drawer">
            <div className="drawer-brand">Menu</div>
            <button className={`drawer-item${tab === "semaine" ? " on" : ""}`} onClick={() => { setTab("semaine"); setMenuOpen(false); }}>
              <Icon.cal width={20} height={20} /> Semaine
            </button>
            <button className={`drawer-item${tab === "recettes" ? " on" : ""}`} onClick={() => { setTab("recettes"); setMenuOpen(false); }}>
              <Icon.book width={20} height={20} /> Recettes
            </button>
          </div>
        </>}

        {/* SCROLL CONTENT */}
        <main className="scroll">
          {tab === "semaine" && (
            <div className="week-list" ref={weekScrollRef} onTouchStart={onWeekTouchStart} onTouchMove={onWeekTouchMove} onTouchEnd={onWeekTouchEnd}>
              <div className="week-nav">
                <button className="weeknav-btn" onClick={() => setWeekOffset(o => o - 1)} aria-label="Semaine précédente">
                  <Icon.chevL width={18} height={18} />
                </button>
                <button className="week-center" onClick={() => setWeekOffset(0)}>
                  <span className="week-title">{isCurrentWeek ? "Cette semaine" : weekOffset === -1 ? "Sem. dernière" : weekOffset === 1 ? "Sem. prochaine" : "Semaine"}</span>
                  <span className="week-range">· {weekLabel}</span>
                </button>
                <button className="weeknav-btn" onClick={() => setWeekOffset(o => o + 1)} aria-label="Semaine suivante">
                  <Icon.chevR width={18} height={18} />
                </button>
              </div>
              <div className={`swipe-arrow left${swipeDX > 60 ? " show" : ""}`}><Icon.chevL width={22} height={22} /></div>
              <div className={`swipe-arrow right${swipeDX < -60 ? " show" : ""}`}><Icon.chevR width={22} height={22} /></div>
              <div key={weekKey} className="week-days week-enter" style={{ transform: swipeDX ? `translateX(${swipeDX}px)` : undefined, transition: swipeDX ? "none" : "transform .25s cubic-bezier(.32,.72,0,1)" }}>
              {DAYS.map((day, i) => {
                const date = weekDates[i];
                const today = new Date(); today.setHours(0,0,0,0);
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = date < today;
                const firstUpcoming = weekDates.findIndex(d => { const x = new Date(d); x.setHours(0,0,0,0); return x >= today; });
                return (
                  <section key={day.key} data-anchor={i === firstUpcoming ? "1" : undefined} className={`day${day.weekend ? " weekend" : ""}${isToday ? " is-today" : ""}${isPast ? " is-past" : ""}`}>
                    <div className="day-tab">
                      <span className="day-tab-name">{day.short}</span>
                      <span className="day-tab-num">{date.getDate()}</span>
                    </div>
                    <div className="day-rows">
                      {slotsFor(day).map(slot => {
                        const entry = getEntry(day.key, slot.id);
                        const isInline = inline && inline.day === day.key && inline.slot === slot.id;

                        if (entry && !isInline) {
                          const isRecipe = entry.type === "recipe";
                          const onCellClick = () => {
                            if (lpFired.current) { lpFired.current = false; return; }
                            if (isRecipe) openSheetFor(day.key, slot.id, slot.label, day.label);
                            else startInline(day.key, slot.id, slot.label, day.label, entry.value);
                          };
                          const lp = isRecipe ? longPress(() => openRecipeByName(entry.value)) : {};
                          return (
                            <div key={slot.id} className={`cell filled ${entry.type}${slot.id === "lunchbox" ? " lunchbox" : ""}`} onClick={onCellClick} {...lp}>
                              <span className="cell-icon">{isRecipe ? <Icon.utensils width={14} height={14} /> : <Icon.edit width={13} height={13} />}</span>
                              <span className="cell-value">{entry.value}</span>
                              <button className="cell-remove" onClick={(e) => { e.stopPropagation(); clearEntry(day.key, slot.id); }}>
                                <Icon.x width={12} height={12} />
                              </button>
                            </div>
                          );
                        }

                        // empty => input bar with visible + on the right
                        return (
                          <div key={slot.id} className={`cell inputbar${slot.id === "lunchbox" ? " lunchbox" : ""}`}>
                            <input
                              ref={isInline ? inlineRef : null}
                              className="bar-input"
                              placeholder={`${slot.label}…`}
                              value={isInline ? inlineText : ""}
                              onFocus={() => { if (!isInline) startInline(day.key, slot.id, slot.label, day.label, ""); }}
                              onChange={e => setInlineText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveInline(); if (e.key === "Escape") { setInline(null); setInlineText(""); e.currentTarget.blur(); } }}
                              onBlur={saveInline}
                            />
                            {isInline && inlineText.trim() ? (
                              <>
                                <button className="bar-heart" onMouseDown={e => e.preventDefault()} onClick={saveInlineAsRecipe} aria-label="Enregistrer comme recette">
                                  <Icon.heart width={16} height={16} />
                                </button>
                                <button className="bar-send" onMouseDown={e => e.preventDefault()} onClick={saveInline} aria-label="Valider">
                                  <Icon.check width={16} height={16} />
                                </button>
                              </>
                            ) : (
                              <button className="bar-plus" onMouseDown={e => e.preventDefault()} onClick={() => openSheetFor(day.key, slot.id, slot.label, day.label)} aria-label="Choisir une recette">
                                <Icon.plus width={17} height={17} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              </div>
              <div className="scroll-foot" />
            </div>
          )}

          {tab === "recettes" && (
            <div className="recipes" ref={recipesScrollRef}>
              {showAdd && (
                <div className="add-form">
                  <input className="field" placeholder="Nom du plat" value={newName} onChange={e => setNewName(e.target.value)} />
                  <div className="field-label">Conseillé pour</div>
                  <div className="chips multi">
                    {Object.entries(SLOT_META).map(([k, v]) => (
                      <button key={k} className={`chip${newSlots.includes(k) ? " on" : ""}`} onClick={() => toggleSlot(k)}>{v.emoji} {v.label}</button>
                    ))}
                  </div>
                  <div className="field-label">Effort</div>
                  <div className="chips single">
                    {Object.entries(EFFORT_META).map(([k, v]) => (
                      <button key={k} className={`chip${newEffort === k ? " on" : ""}`} onClick={() => setNewEffort(k)}>{v.emoji} {v.label}</button>
                    ))}
                  </div>
                  <div className="field-label">Saison</div>
                  <div className="chips multi">
                    {Object.entries(SEASON_META).filter(([k]) => k !== ALL).map(([k, v]) => {
                      const on = newSeasons.includes(k);
                      return <button key={k} className={`chip${on ? " on" : ""}`} onClick={() => toggleSeason(k)}>{v.emoji} {v.label}</button>;
                    })}
                  </div>
                  <div className="add-actions stacked">
                    <button className="btn solid block" onClick={saveRecipe}>{editId ? "Modifier" : "Enregistrer"}</button>
                    <button className="btn ghost block" onClick={resetForm}>Annuler</button>
                  </div>
                </div>
              )}
              {!showAdd && (
                <div className="rsearch-row">
                  <div className="rsearch">
                    <Icon.search width={16} height={16} className="rsearch-icon" />
                    <input className="rsearch-input" placeholder="Rechercher une recette…" value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} />
                    {recipeSearch && <button className="rsearch-clear" onClick={() => setRecipeSearch("")}><Icon.x width={14} height={14} /></button>}
                  </div>
                  <button className="add-mini" onClick={() => { setAddOrigin("recettes"); setEditId(null); setShowAdd(true); }} aria-label="Ajouter une recette">
                    <Icon.plus width={17} height={17} />
                  </button>
                </div>
              )}

              {!showAdd && (
                <div className="sortbar">
                  <div className="sortbar-opts">
                    {[{ k: "alpha", t: "A–Z" }, { k: "saison", t: "Saison" }, { k: "slot", t: "Repas" }, { k: "effort", t: "Effort" }].map(o => {
                      const on = recipeSort === o.k;
                      return (
                        <button key={o.k} className={`sortchip${on ? " on" : ""}`}
                          onClick={() => { if (on) setSortDir(d => d === "asc" ? "desc" : "asc"); else setRecipeSort(o.k); }}>
                          {o.t}{on && <span className="sortchip-arrow">{sortDir === "asc" ? "↓" : "↑"}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!showAdd && (() => {
                const dir = sortDir === "asc" ? 1 : -1;
                const alpha = (a, b) => a.name.localeCompare(b.name) * dir;
                const q = recipeSearch.trim().toLowerCase();
                const base = q ? recipes.filter(r => r.name.toLowerCase().includes(q)) : recipes;
                let groups;
                if (recipeSort === "alpha") {
                  groups = [{ k: "all", t: "Toutes les recettes", list: [...base].sort(alpha) }];
                } else if (recipeSort === "saison") {
                  // une catégorie par saison (ordre: saison courante d'abord), puis toute l'année
                  const order = [season, ...["printemps", "ete", "automne", "hiver"].filter(s => s !== season)];
                  groups = [
                    ...order.map(s => ({
                      k: s, t: `${SEASON_META[s].emoji} ${SEASON_META[s].label}`,
                      list: base.filter(r => !isAllYear(r) && r.seasons.includes(s)).sort(alpha),
                    })),
                    { k: "allyear", t: `${SEASON_META[ALL].emoji} ${SEASON_META[ALL].label}`, list: base.filter(r => isAllYear(r)).sort(alpha) },
                  ];
                } else if (recipeSort === "slot") {
                  groups = [
                    ...Object.entries(SLOT_META).map(([k, v]) => ({
                      k, t: `${v.emoji} ${v.label}`,
                      list: base.filter(r => (r.slots || []).includes(k)).sort(alpha),
                    })),
                    { k: "_none", t: "Sans recommandation", list: base.filter(r => !(r.slots || []).length).sort(alpha) },
                  ];
                } else { // effort
                  groups = ["pouce", "normal", "recoit"].map(e => ({
                    k: e, t: `${EFFORT_META[e].emoji} ${EFFORT_META[e].label}`,
                    list: base.filter(r => (r.effort || "normal") === e).sort(alpha),
                  }));
                }
                if (dir === -1) groups = [...groups].reverse();
                if (q && !base.length) {
                  return <div className="empty-results">Aucune recette pour « {recipeSearch.trim()} »</div>;
                }

                // Mode A–Z : sections par lettre + rail alphabétique à droite
                if (recipeSort === "alpha") {
                  const list = groups[0].list;
                  const letterOf = r => {
                    const c = (r.name[0] || "#").toUpperCase();
                    return c >= "A" && c <= "Z" ? c : "#";
                  };
                  const present = new Set(list.map(letterOf));
                  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
                  const letters = present.has("#") ? [...alphabet, "#"] : alphabet;
                  const scrollToLetter = (l) => {
                    if (!present.has(l)) return;
                    const el = recipesScrollRef.current?.querySelector(`[data-letter="${l}"]`);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  };
                  const sections = letters.filter(l => present.has(l));
                  return (
                    <div className="alpha-wrap">
                      <div className="alpha-list">
                        {sections.map(l => (
                          <div key={l} className="letter-section" data-letter={l}>
                            <div className="letter-head">{l}</div>
                            {list.filter(r => letterOf(r) === l).map(r => (
                              <button key={r.id} className="ritem" onClick={() => { setAddOrigin("recettes"); openEdit(r); }}>
                                <span className="ritem-name">{r.name}</span>
                                <span className="ritem-meta">
                                  {(r.slots || []).map(s => <span key={s} className="ritem-chip">{SLOT_META[s].emoji}</span>)}
                                  {r.effort && r.effort !== "normal" && <span className="ritem-chip">{EFFORT_META[r.effort].emoji}</span>}
                                  <span className="ritem-seasons">{isAllYear(r) ? "" : r.seasons.map(s => SEASON_META[s].emoji).join("")}</span>
                                  <Icon.chevR width={15} height={15} className="ritem-chev" />
                                </span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="alpha-rail">
                        {letters.map(l => (
                          <button key={l} className={`alpha-rail-btn${present.has(l) ? "" : " off"}`} onClick={() => scrollToLetter(l)}>{l}</button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return groups.map(g => {
                  if (!g.list.length) return null;
                  return (
                    <div key={g.k} className="rgroup">
                      <div className="rgroup-title">{g.t} <span className="rgroup-count">{g.list.length}</span></div>
                      {g.list.map(r => (
                        <button key={r.id} className="ritem" onClick={() => { setAddOrigin("recettes"); openEdit(r); }}>
                          <span className="ritem-name">{r.name}</span>
                          <span className="ritem-meta">
                            {(r.slots || []).map(s => <span key={s} className="ritem-chip">{SLOT_META[s].emoji}</span>)}
                            {r.effort && r.effort !== "normal" && <span className="ritem-chip">{EFFORT_META[r.effort].emoji}</span>}
                            <span className="ritem-seasons">{isAllYear(r) ? "" : r.seasons.map(s => SEASON_META[s].emoji).join("")}</span>
                            <Icon.chevR width={15} height={15} className="ritem-chev" />
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                });
              })()}
              <div className="scroll-foot" />
            </div>
          )}
        </main>

        {/* SHEET */}
        {sheet && <>
          <div className="scrim" onClick={() => setSheet(null)} />
          <div className="sheet">
            <div className="grabber" />
            <div className="sheet-head">
              <div className="sheet-title-row">
                <span className="sheet-title">{sheet.label}</span>
                <span className="sheet-sub">· {sheet.dayLabel}</span>
              </div>
              <button className="sheet-close" onClick={() => setSheet(null)}><Icon.x width={17} height={17} /></button>
            </div>

            <div className="searchbar">
              <Icon.search width={17} height={17} className="searchbar-icon" />
              <input ref={searchRef} className="searchbar-input" placeholder="Rechercher ou saisir…" value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && query.trim()) useFreeTextFromSheet(query); }} />
              {query && <button className="searchbar-clear" onClick={() => setQuery("")}><Icon.x width={14} height={14} /></button>}
            </div>

            {query.trim() && (() => {
              const q = query.trim().toLowerCase();
              const exactMatch = recipes.some(r => r.name.toLowerCase() === q);
              if (exactMatch) return null;
              return (
                <div className="newentry">
                  <button className="newentry-btn use" onClick={() => useFreeTextFromSheet(query)}>
                    <Icon.pen width={14} height={14} />
                    <span>Utiliser pour ce repas</span>
                  </button>
                  <button className="newentry-btn save" onClick={() => saveAsRecipeFromSheet(query)}>
                    <Icon.plus width={15} height={15} />
                    <span>Enregistrer la recette</span>
                  </button>
                </div>
              );
            })()}

            <div className="results">
              {filtered.length === 0 && !query.trim() && (
                <div className="empty-results">Aucune recette</div>
              )}
              {(() => {
                const kind = slotKind(sheet.slot, sheet.day);
                const kindLabel = kind === "lunchbox" ? "la lunch box" : kind === "soir" ? "le soir" : "le week-end";
                const inSeason = r => matchesSeason(r, season);
                const alpha = (a, b) => a.name.localeCompare(b.name);

                // 1. Recommandé : conseillées pour ce slot, de saison/toute l'année, non planifiées
                const recommended = filtered
                  .filter(r => !plannedNames.has(r.name) && inSeason(r) && (r.slots || []).includes(kind))
                  .sort(alpha)
                  .slice(0, 10);
                const recoSet = new Set(recommended.map(r => r.name));

                // 2. De saison ou toute l'année (hors reco, hors planifié)
                const seasonal = filtered
                  .filter(r => !plannedNames.has(r.name) && !recoSet.has(r.name) && inSeason(r))
                  .sort(alpha);
                const seasonalSet = new Set(seasonal.map(r => r.name));

                // 3. Déjà planifié
                const planned = filtered.filter(r => plannedNames.has(r.name));
                const plannedSet = new Set(planned.map(r => r.name));

                // 4. Voir plus : tout le reste (autres saisons)
                const rest = filtered
                  .filter(r => !recoSet.has(r.name) && !seasonalSet.has(r.name) && !plannedSet.has(r.name))
                  .sort(alpha);

                const Card = (r, cls = "") => (
                  <button key={r.id} className={`rcard${cls}`}
                    onClick={() => { if (lpFired.current) { lpFired.current = false; return; } pickRecipe(r); }}
                    {...longPress(() => openRecipeByName(r.name))}>
                    <span className="rcard-name">{r.name}</span>
                    <span className="rcard-tag">{r.effort === "pouce" ? EFFORT_META.pouce.emoji : ""}{isAllYear(r) ? "" : r.seasons.map(s => SEASON_META[s].emoji).join("")}</span>
                  </button>
                );

                return <>
                  {recommended.length > 0 && (
                    <div className="result-group">
                      <div className="result-group-title reco">✨ Recommandé pour {kindLabel}</div>
                      <div className="result-grid">{recommended.map(r => Card(r, " is-reco"))}</div>
                    </div>
                  )}
                  {seasonal.length > 0 && (
                    <div className="result-group">
                      <div className="result-group-title">{SM.emoji} De saison & toute l'année</div>
                      <div className="result-grid">{seasonal.map(r => Card(r))}</div>
                    </div>
                  )}
                  {planned.length > 0 && (
                    <div className="result-group">
                      <div className="result-group-title planned">✓ Déjà planifié cette semaine</div>
                      <div className="result-grid">{planned.map(r => Card(r, " is-planned"))}</div>
                    </div>
                  )}
                  {rest.length > 0 && (
                    showMore ? (
                      <div className="result-group">
                        <div className="result-group-title">🗓 Autres recettes</div>
                        <div className="result-grid">{rest.map(r => Card(r))}</div>
                      </div>
                    ) : (
                      <button className="seemore" onClick={() => setShowMore(true)}>
                        Voir plus de recettes ({rest.length})
                      </button>
                    )
                  )}
                </>;
              })()}
            </div>
          </div>
        </>}

        {/* CONFIRM DELETE */}
        {confirmDelete && <>
          <div className="scrim" onClick={() => setConfirmDelete(false)} />
          <div className="modal">
            <div className="modal-title">Supprimer la recette ?</div>
            <div className="modal-text">« {newName} » sera retirée de tes recettes. Cette action est définitive.</div>
            <div className="modal-actions">
              <button className="btn ghost block" onClick={() => setConfirmDelete(false)}>Annuler</button>
              <button className="btn solid-danger block" onClick={deleteRecipe}>Supprimer</button>
            </div>
          </div>
        </>}
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Baloo+2:wght@500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { background: #0e0e10; }
.app { --bg:#FFF6F4; --coral:#FF5C4D; --card:#FFFFFF; --ink:#2A2522; --ink2:#9A9490; --line:#F0ECE8; --soft:#FFF1EE;
  font-family:'Quicksand',sans-serif; background:var(--bg); color:var(--ink);
  max-width:430px; margin:0 auto; height:100vh; max-height:932px; display:flex; flex-direction:column;
  position:relative; overflow:hidden; box-shadow:0 0 60px rgba(0,0,0,0.3); }
.app *::-webkit-scrollbar { width:0; }

/* TOPBAR — coral header zone */
.topbar { background:var(--coral); padding:10px 16px 12px; flex-shrink:0; padding-top:max(10px,env(safe-area-inset-top)); }
.topbar-row { display:flex; align-items:center; gap:10px; position:relative; }
.burger { width:38px; height:38px; flex-shrink:0; border:none; background:rgba(255,255,255,0.2); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; border-radius:12px; transition:background .12s; }
.burger:active { background:rgba(255,255,255,0.35); }
.brand { font-family:'Baloo 2',sans-serif; font-size:22px; font-weight:700; letter-spacing:-0.3px; color:#fff; }
.brand-center { position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; }
.topbar-spacer { width:38px; flex-shrink:0; margin-left:auto; }
.season-tag { font-size:18px; margin-left:auto; background:rgba(255,255,255,0.2); width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
.week-nav { position:sticky; top:0; z-index:10; display:flex; align-items:center; gap:4px; margin:0 0 10px; background:var(--card); border-radius:12px; padding:4px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
.weeknav-btn { width:32px; height:32px; flex-shrink:0; border:none; background:var(--soft); color:var(--coral); border-radius:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s, transform .1s; }
.weeknav-btn:active { transform:scale(0.9); background:var(--accent-soft); }
.week-center { flex:1; background:none; border:none; cursor:pointer; text-align:center; padding:2px; display:flex; align-items:baseline; justify-content:center; gap:5px; }
.week-title { font-size:13.5px; font-weight:700; color:var(--ink); }
.week-range { font-size:12px; font-weight:600; color:var(--ink2); }

/* SCROLL */
.scroll { flex:1; overflow-y:auto; padding:12px 16px 0; }
.scroll-foot { height:20px; }

/* DAY — flat on background, separated by divider */
.week-list { display:flex; flex-direction:column; position:relative; }
.week-days { display:flex; flex-direction:column; will-change:transform; }
.week-enter { animation:weekEnter .28s ease; }
@keyframes weekEnter { from{opacity:0.4; transform:translateX(0) scale(0.99)} to{opacity:1; transform:translateX(0) scale(1)} }
.swipe-arrow { position:fixed; top:50%; transform:translateY(-50%); width:38px; height:38px; border-radius:50%; background:var(--coral); color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(255,92,77,0.4); opacity:0; transition:opacity .15s; pointer-events:none; z-index:60; }
.swipe-arrow.left { left:max(10px, calc(50% - 205px)); }
.swipe-arrow.right { right:max(10px, calc(50% - 205px)); }
.swipe-arrow.show { opacity:1; }
.day { display:flex; gap:11px; align-items:stretch; padding:11px 2px; scroll-margin-top:58px; }
.day + .day { border-top:1px solid var(--line); }
.day-tab { flex-shrink:0; width:42px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; border-radius:11px; background:#FFE4DF; }
.day-tab-name { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--coral); }
.day-tab-num { font-family:'Baloo 2',sans-serif; font-size:18px; font-weight:700; color:var(--ink); line-height:1; }
.day.weekend .day-tab { background:var(--card); box-shadow:0 1px 4px rgba(0,0,0,0.07); }
.day.weekend .day-tab-name { color:var(--ink2); }
.day.is-today .day-tab { background:var(--secondary); box-shadow:0 2px 8px rgba(255,197,41,0.4); }
.day.is-today .day-tab-name { color:#8A6A00; }
.day.is-today .day-tab-num { color:#5C4600; }
.day-rows { flex:1; min-width:0; display:flex; flex-direction:column; gap:5px; justify-content:center; }

/* CELL (slot) */
.cell { width:100%; display:flex; align-items:center; gap:8px; border:none; text-align:left;
  border-radius:10px; padding:8px 10px; min-height:38px; position:relative; font-family:inherit; }
.cell.filled { background:var(--card); cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:transform .1s; }
.cell.filled:active { transform:scale(0.99); }
.cell.filled.lunchbox { background:var(--card); box-shadow:0 1px 3px rgba(0,0,0,0.05); }
.cell.filled.lunchbox .cell-value { color:var(--coral); font-weight:600; }
.cell-value { flex:1; min-width:0; font-size:14px; font-weight:500; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cell-icon { flex-shrink:0; display:flex; align-items:center; color:var(--ink2); }
.cell.filled.lunchbox .cell-icon { color:var(--coral); }
.cell-flag { color:var(--ink2); flex-shrink:0; }
/* jours passés atténués */
.day.is-past { opacity:0.45; }
.cell-remove { flex-shrink:0; width:22px; height:22px; border:none; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--ink2); background:var(--line); opacity:.7; cursor:pointer; transition:background .15s, color .15s, opacity .15s; }
.cell-remove:active { background:var(--coral); color:#fff; opacity:1; }

/* empty => input bar */
.cell.inputbar { background:#FBF3EF; gap:6px; padding:5px 8px 5px 10px; transition:box-shadow .15s; box-shadow:inset 0 0 0 1px #E1D2CA; }
.cell.inputbar:focus-within { box-shadow:inset 0 0 0 1.5px var(--coral); }
.cell.inputbar.lunchbox { background:#fff; box-shadow:inset 0 0 0 1px #EBCFC6; }
.cell.inputbar.lunchbox:focus-within { box-shadow:inset 0 0 0 1.5px var(--coral); }
.bar-plus { flex-shrink:0; width:28px; height:28px; border:none; border-radius:8px; background:var(--accent-soft); color:var(--coral); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .1s, background .12s; }
.bar-plus:active { transform:scale(0.88); background:var(--coral); color:#fff; }
.bar-input { flex:1; min-width:0; border:none; background:none; outline:none; font-size:14px; font-weight:500; font-family:inherit; color:var(--ink); padding:0 2px; }
.bar-input::placeholder { color:#A89F9A; font-weight:400; }
.bar-send { flex-shrink:0; width:28px; height:28px; border:none; border-radius:8px; background:var(--coral); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .1s; }
.bar-heart { flex-shrink:0; width:28px; height:28px; margin-right:6px; border:none; border-radius:8px; background:var(--accent-soft); color:var(--coral); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .1s; }
.bar-heart:active { transform:scale(0.88); }
.bar-send:active { transform:scale(0.88); }

/* DRAWER */
.drawer { position:absolute; top:0; left:0; bottom:0; width:74%; max-width:300px; background:var(--card); z-index:50; box-shadow:4px 0 30px rgba(0,0,0,0.2); padding:max(24px,env(safe-area-inset-top)) 14px 24px; animation:slideLeft .26s cubic-bezier(.32,.72,0,1); }
.drawer-brand { font-family:'Baloo 2',sans-serif; font-size:24px; font-weight:700; color:var(--accent); padding:8px 12px 20px; }
.drawer-item { display:flex; align-items:center; gap:13px; width:100%; border:none; background:none; padding:14px 12px; border-radius:14px; font-size:16px; font-weight:600; font-family:inherit; color:var(--ink2); cursor:pointer; transition:background .12s, color .12s; }
.drawer-item.on { background:var(--accent-soft); color:var(--accent); }

/* RECIPES */
.recipes { padding-top:4px; }
.rsearch-row { display:flex; gap:8px; align-items:center; margin-bottom:14px; }
.rsearch { flex:1; display:flex; align-items:center; gap:8px; background:var(--card); border-radius:11px; padding:8px 12px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
.rsearch-icon { color:var(--coral); flex-shrink:0; }
.rsearch-input { flex:1; min-width:0; border:none; background:none; outline:none; font-size:14px; font-weight:500; font-family:inherit; color:var(--ink); }
.rsearch-input::placeholder { color:#A89F9A; }
.rsearch-clear { border:none; background:none; color:var(--ink2); cursor:pointer; display:flex; padding:2px; }
.add-mini { flex-shrink:0; width:38px; height:38px; border:none; border-radius:11px; background:var(--accent-soft); color:var(--coral); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .1s, background .12s; }
.add-mini:active { transform:scale(0.9); background:var(--coral); color:#fff; }
.add-form { padding:0; margin-bottom:14px; }
.add-title { font-family:'Baloo 2',sans-serif; font-size:18px; font-weight:700; margin-bottom:12px; }
.field { width:100%; border:1.5px solid #E4DAD4; background:#fff; border-radius:11px; padding:12px 14px; font-size:15px; font-weight:500; font-family:inherit; color:var(--ink); outline:none; box-shadow:0 1px 3px rgba(0,0,0,0.04); transition:border-color .15s; }
.field:focus { border-color:var(--coral); }
.field::placeholder { color:#A89F9A; }
.field-label { font-size:11px; font-weight:700; letter-spacing:.7px; text-transform:uppercase; color:var(--ink2); margin:14px 0 7px; }
.field-hint { font-weight:600; letter-spacing:0; text-transform:none; color:#C2BCB0; }
.chips { display:flex; gap:5px; }
.chips.multi { flex-wrap:nowrap; }
.chips.single { gap:5px; }
.chips.single .chip { flex:1; }
.chips.single .chip.on { background:var(--coral); border-color:var(--coral); color:#fff; }
.chip { flex:1; min-width:0; text-align:center; border:1.5px solid #E4DAD4; background:#fff; color:var(--ink2); border-radius:10px; padding:9px 3px; font-size:11.5px; font-weight:600; font-family:inherit; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:all .15s; }
.chips.multi .chip.on { background:var(--accent-soft); border-color:var(--coral); border-width:2px; color:var(--coral); }
.add-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
.add-actions.stacked { flex-direction:column; gap:8px; }
.btn { border:none; border-radius:12px; padding:13px 18px; font-size:14.5px; font-weight:700; font-family:inherit; cursor:pointer; transition:transform .1s; }
.btn:active { transform:scale(0.98); }
.btn.ghost { background:var(--soft); color:var(--ink2); }
.btn.solid { background:var(--coral); color:#fff; box-shadow:0 4px 12px rgba(255,92,77,0.28); }
.btn.danger { background:#fff; color:var(--coral); border:1.5px solid var(--accent-soft); }
.btn.solid-danger { background:#E5484D; color:#fff; }
.btn.block { width:100%; }
.burger-right { margin-left:auto; }
.modal { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:84%; max-width:340px; background:var(--card); border-radius:18px; padding:20px; z-index:60; box-shadow:0 20px 50px rgba(0,0,0,0.3); animation:pop .2s ease; }
.modal-title { font-family:'Baloo 2',sans-serif; font-size:18px; font-weight:700; color:var(--ink); margin-bottom:8px; }
.modal-text { font-size:14px; font-weight:500; color:var(--ink2); line-height:1.4; margin-bottom:18px; }
.modal-actions { display:flex; gap:8px; }
.sortbar { display:flex; align-items:center; margin:0 0 12px; }
.sortbar-opts { display:flex; gap:5px; flex:1; }
.sortchip { flex:1; display:flex; align-items:center; justify-content:center; gap:2px; border:1.5px solid var(--line); background:var(--card); color:var(--ink2); border-radius:9px; padding:6px 4px; font-size:11.5px; font-weight:700; font-family:inherit; cursor:pointer; transition:all .12s; }
.sortchip.on { background:var(--coral); border-color:var(--coral); color:#fff; }
.sortchip-arrow { font-size:12px; line-height:1; }
.alpha-wrap { position:relative; display:flex; align-items:flex-start; }
.alpha-list { flex:1; min-width:0; padding-right:20px; }
.letter-section { scroll-margin-top:4px; }
.letter-head { font-family:'Baloo 2',sans-serif; font-size:14px; font-weight:700; color:var(--coral); padding:4px 4px 5px; }
.alpha-rail { position:sticky; top:0; align-self:flex-start; height:calc(100vh - 170px); max-height:560px; display:flex; flex-direction:column; justify-content:space-between; align-items:center; padding:4px 2px; margin-left:-16px; }
.alpha-rail-btn { border:none; background:none; color:var(--coral); font-size:10px; font-weight:800; line-height:1; width:14px; flex:1; display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:inherit; }
.alpha-rail-btn.off { color:#E8C5BF; cursor:default; }
.alpha-rail-btn:not(.off):active { color:var(--ink); }
.rgroup { margin-bottom:14px; }
.rgroup-title { font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:var(--ink2); margin:0 2px 7px; display:flex; align-items:center; gap:7px; }
.rgroup-count { background:var(--soft); color:var(--coral); border-radius:9px; padding:1px 7px; font-size:10px; letter-spacing:0; }
.ritem { width:100%; background:var(--card); border:none; border-radius:12px; padding:12px 14px; margin-bottom:6px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.05); cursor:pointer; font-family:inherit; text-align:left; transition:transform .1s; }
.ritem:active { transform:scale(0.98); }
.ritem-name { font-size:15px; font-weight:600; color:var(--ink); }
.ritem-meta { display:flex; align-items:center; gap:6px; }
.ritem-chev { color:#A89F9A; margin-left:2px; }
.ritem-chip { font-size:13px; }
.ritem-seasons { font-size:14px; }

/* SCRIM + SHEET */
.scrim { position:absolute; inset:0; background:rgba(40,20,15,0.45); z-index:40; animation:fade .2s ease; }
.sheet { position:absolute; left:0; right:0; bottom:0; background:var(--card); border-radius:28px 28px 0 0; z-index:50; height:90%; max-height:90%; display:flex; flex-direction:column; animation:rise .3s cubic-bezier(.32,.72,0,1); padding-bottom:max(14px,env(safe-area-inset-bottom)); }
.grabber { width:40px; height:4px; background:var(--line); border-radius:2px; margin:10px auto 2px; flex-shrink:0; }
.sheet-head { display:flex; align-items:center; justify-content:space-between; padding:10px 20px 12px; flex-shrink:0; }
.sheet-title-row { display:flex; align-items:baseline; gap:6px; min-width:0; }
.sheet-title { font-family:'Baloo 2',sans-serif; font-size:20px; font-weight:700; }
.sheet-sub { font-size:13px; color:var(--ink2); font-weight:600; white-space:nowrap; }
.sheet-close { width:32px; height:32px; flex-shrink:0; border:none; background:var(--soft); border-radius:50%; color:var(--ink2); display:flex; align-items:center; justify-content:center; cursor:pointer; }
.searchbar { display:flex; align-items:center; gap:8px; margin:0 20px 8px; background:var(--soft); border-radius:13px; padding:10px 14px; flex-shrink:0; }
.searchbar-icon { color:var(--accent); flex-shrink:0; }
.searchbar-input { flex:1; border:none; background:none; outline:none; font-size:14.5px; font-weight:500; font-family:inherit; color:var(--ink); }
.searchbar-clear { border:none; background:none; color:var(--ink2); cursor:pointer; display:flex; padding:2px; }
.newentry { display:flex; gap:7px; margin:0 20px 8px; flex-shrink:0; }
.newentry-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:11px 8px; border-radius:13px; font-size:12.5px; font-weight:700; font-family:inherit; cursor:pointer; transition:transform .1s; border:none; }
.newentry-btn:active { transform:scale(0.98); }
.newentry-btn.use { background:var(--soft); color:var(--ink2); }
.newentry-btn.save { background:var(--accent); color:#fff; }
.results { overflow-y:auto; padding:2px 20px 12px; }
.result-group { margin-bottom:16px; }
.result-group-title { font-size:11px; font-weight:800; letter-spacing:.6px; text-transform:uppercase; color:var(--ink2); margin:6px 2px 8px; }
.result-group-title.planned { color:#C8C2BC; }
.result-group-title.reco { color:var(--accent); }
.result-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.rcard.is-reco { background:var(--accent-soft); }
.seemore { width:100%; border:none; background:var(--soft); color:var(--ink2); border-radius:14px; padding:14px; font-size:13.5px; font-weight:700; font-family:inherit; cursor:pointer; margin-top:2px; transition:background .12s; }
.seemore:active { background:var(--accent-soft); }
.rcard { display:flex; align-items:center; justify-content:space-between; gap:6px; background:var(--soft); border:none; border-radius:14px; padding:12px 13px; cursor:pointer; font-family:inherit; text-align:left; min-height:48px; transition:transform .1s, background .12s; }
.rcard:active { transform:scale(0.97); background:var(--accent-soft); }
.rcard.is-planned { opacity:0.5; }
.rcard.is-planned .rcard-name { text-decoration:line-through; text-decoration-color:#C2BCB0; }
.rcard-name { font-size:13.5px; font-weight:600; color:var(--ink); line-height:1.2; }
.rcard-tag { font-size:13px; flex-shrink:0; }
.empty-results { text-align:center; padding:30px 20px; color:var(--ink2); font-size:14px; font-weight:600; }

@keyframes fade { from{opacity:0} to{opacity:1} }
@keyframes rise { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes slideLeft { from{transform:translateX(-100%)} to{transform:translateX(0)} }
@keyframes pop { from{opacity:0;transform:translate(-50%,-50%) scale(0.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
`;
