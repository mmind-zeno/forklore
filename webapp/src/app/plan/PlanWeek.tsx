"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart, Loader2, Calendar, Sparkles } from "lucide-react";
import { getMealPlan } from "@/app/actions/get-meal-plan";
import { setMealPlanEntry } from "@/app/actions/set-meal-plan-entry";
import { getShoppingList } from "@/app/actions/get-shopping-list";
import { getShoppingListWithAI } from "@/app/actions/get-shopping-list-ai";

const DAY_NAMES = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function formatWeekRange(weekStart: string): string {
  const mon = new Date(weekStart);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const d = (d: Date) => d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  return `${d(mon)} – ${d(sun)} ${mon.getFullYear()}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isCurrentWeek(weekStart: string): boolean {
  const mon = new Date(weekStart);
  const today = new Date();
  const todayMon = new Date(today);
  todayMon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  return mon.toDateString() === todayMon.toDateString();
}

type Entry = { dayOfWeek: number; recipeId: string; recipe: { id: string; title: string; imagePath: string | null } };
type ShoppingItem = { name: string; amount: string; unit: string; recipes: string[]; category: string };
type ListSource = "standard" | "ai";

export function PlanWeek({
  initialWeekStart,
  recipes,
}: {
  initialWeekStart: string;
  recipes: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [listSource, setListSource] = useState<ListSource>("standard");
  const [loadingAI, setLoadingAI] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadPlan = useCallback(async (ws: string) => {
    setLoading(true);
    const res = await getMealPlan(ws);
    if (res.success && res.entries) setEntries(res.entries);
    else setEntries([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlan(weekStart);
  }, [weekStart, loadPlan]);

  const handleSetDay = async (dayOfWeek: number, recipeId: string | null) => {
    setSavingDay(dayOfWeek);
    const res = await setMealPlanEntry(weekStart, dayOfWeek, recipeId);
    setSavingDay(null);
    if (res.success) {
      router.refresh();
      await loadPlan(weekStart);
      if (showShoppingList) {
        setLoadingList(true);
        const listRes = await getShoppingList(weekStart);
        if (listRes.success && listRes.items) setShoppingItems(listRes.items);
        setLoadingList(false);
      }
    }
  };

  const handleShowShoppingList = async () => {
    setShowShoppingList(true);
    setLoadingList(true);
    setListError(null);
    const res = await getShoppingList(weekStart);
    if (res.success && res.items) {
      setShoppingItems(res.items);
      setListSource("standard");
    } else setShoppingItems([]);
    setLoadingList(false);
  };

  const handleOptimizeWithAI = async () => {
    setLoadingAI(true);
    setListError(null);
    const res = await getShoppingListWithAI(weekStart);
    setLoadingAI(false);
    if (res.success && res.items !== undefined) {
      setShoppingItems(res.items);
      setListSource("ai");
    } else {
      setListError(res.error ?? "KI-Optimierung fehlgeschlagen.");
    }
  };

  const entryByDay = (day: number) => entries.find((e) => e.dayOfWeek === day);
  const plannedCount = entries.length;
  const groupedByCategory = showShoppingList
    ? shoppingItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-8">
      {/* Week navigation – klar hervorgehoben */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-warmwhite rounded-2xl border border-espresso/5 shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-3 order-2 sm:order-1">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2.5 rounded-xl border border-espresso/10 hover:bg-cream hover:border-terra/30 transition-colors"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft size={22} className="text-espresso" />
          </button>
          <div className="text-center sm:text-left min-w-[180px]">
            <span className="font-display font-bold text-espresso text-lg block">{formatWeekRange(weekStart)}</span>
            {isCurrentWeek(weekStart) && (
              <span className="text-xs text-terra font-bold uppercase tracking-wide flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <Calendar size={12} /> Diese Woche
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2.5 rounded-xl border border-espresso/10 hover:bg-cream hover:border-terra/30 transition-colors"
            aria-label="Nächste Woche"
          >
            <ChevronRight size={22} className="text-espresso" />
          </button>
        </div>
        <p className="text-sm text-espresso-light order-1 sm:order-2">
          {plannedCount === 0
            ? "Wähle unten pro Tag ein Rezept."
            : `${plannedCount} Tag${plannedCount !== 1 ? "e" : ""} geplant`}
        </p>
      </div>

      {/* Days – übersichtliche Karten-Optik */}
      <section aria-label="Rezepte pro Wochentag">
        <h2 className="sr-only">Rezepte pro Wochentag</h2>
        <div className="bg-warmwhite rounded-2xl border border-espresso/5 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-espresso-light">
              <Loader2 size={20} className="animate-spin" />
              <span>Lade Wochenplan …</span>
            </div>
          ) : (
            <ul className="divide-y divide-espresso/5">
              {DAY_NAMES.map((name, dayOfWeek) => {
                const entry = entryByDay(dayOfWeek);
                const isSaving = savingDay === dayOfWeek;
                return (
                  <li
                    key={dayOfWeek}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-cream/40 transition-colors"
                  >
                    <label htmlFor={`day-${dayOfWeek}`} className="w-28 shrink-0 font-bold text-espresso text-sm pt-1 sm:pt-0">
                      {name}
                    </label>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <select
                        id={`day-${dayOfWeek}`}
                        value={entry?.recipeId ?? ""}
                        onChange={(e) => handleSetDay(dayOfWeek, e.target.value || null)}
                        disabled={isSaving}
                        className="flex-1 max-w-md rounded-xl border border-espresso/15 bg-white px-4 py-2.5 text-sm text-espresso focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none disabled:opacity-60"
                      >
                        <option value="">— Kein Rezept —</option>
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                      {isSaving && (
                        <Loader2 size={18} className="shrink-0 animate-spin text-terra" aria-hidden />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Einkaufsliste */}
      <section aria-label="Einkaufsliste" className="space-y-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-espresso-light">
            Erzeuge eine Einkaufsliste aus den geplanten Rezepten – optional von der KI zusammenfassen und bereinigen lassen.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShowShoppingList}
              disabled={loadingList || plannedCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-cta px-5 py-3 text-white text-sm font-bold tracking-wide shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loadingList ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingCart size={18} />
              )}
              {loadingList ? "Wird erstellt …" : "Einkaufsliste anzeigen"}
            </button>
            {showShoppingList && shoppingItems.length > 0 && (
              <button
                type="button"
                onClick={handleOptimizeWithAI}
                disabled={loadingAI || loadingList}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-terra/40 bg-terra/5 px-5 py-3 text-terra text-sm font-bold tracking-wide hover:bg-terra/15 transition-all duration-200 disabled:opacity-50"
              >
                {loadingAI ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {loadingAI ? "KI optimiert …" : "Mit KI optimieren"}
              </button>
            )}
          </div>
        </div>

        {showShoppingList && (
          <div className="bg-warmwhite rounded-2xl border border-espresso/5 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-espresso/5 flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="font-display font-bold text-espresso text-lg">Einkaufsliste</h2>
              {listSource === "ai" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-terra bg-terra/10 px-2.5 py-1 rounded-full">
                  <Sparkles size={12} /> Von KI zusammengefasst
                </span>
              )}
              {shoppingItems.length > 0 && (
                <span className="text-sm text-espresso-light bg-cream/80 px-2.5 py-1 rounded-full">
                  {shoppingItems.length} Position{shoppingItems.length !== 1 ? "en" : ""} · {plannedCount} Rezept{plannedCount !== 1 ? "e" : ""}
                </span>
              )}
            </div>
            {listError && (
              <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {listError}
              </div>
            )}
            {loadingList ? (
              <div className="p-10 flex items-center justify-center gap-2 text-espresso-light">
                <Loader2 size={22} className="animate-spin text-terra" />
                <span>Einkaufsliste wird erstellt …</span>
              </div>
            ) : loadingAI ? (
              <div className="p-10 flex items-center justify-center gap-2 text-espresso-light">
                <Loader2 size={22} className="animate-spin text-terra" />
                <span>KI fasst die Liste zusammen …</span>
              </div>
            ) : shoppingItems.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-espresso-light mb-2">
                  {plannedCount === 0
                    ? "Lege zuerst oben Rezepte für die Woche fest."
                    : "Keine Zutaten gefunden. Prüfe, ob die Rezepte Zutaten enthalten."}
                </p>
                {plannedCount === 0 && (
                  <p className="text-sm text-espresso-light/80">
                    Pro Tag kannst du ein Rezept aus deiner Sammlung wählen.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                {Object.entries(groupedByCategory).map(([category, items]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-terra mb-3 px-2 py-1.5 rounded-lg bg-terra/5 border-l-2 border-terra/30">
                      {category}
                    </h3>
                    <ul className="space-y-0 divide-y divide-espresso/5 rounded-lg overflow-hidden bg-cream/30">
                      {items.map((item, i) => (
                        <li
                          key={`${item.name}-${item.unit}-${i}`}
                          className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 px-3 py-2.5 sm:py-2 hover:bg-cream/50 transition-colors"
                        >
                          <div className="flex items-baseline gap-2 min-w-0 flex-1">
                            <span className="font-semibold text-espresso truncate">{item.name}</span>
                            <span className="shrink-0 text-espresso-light text-sm tabular-nums">
                              {item.amount !== "—" && item.amount !== "" && `${item.amount} `}
                              {item.unit !== "—" && item.unit !== "" && item.unit}
                            </span>
                          </div>
                          {item.recipes.length > 0 && (
                            <span className="text-espresso-light/70 text-xs truncate sm:max-w-md" title={item.recipes.join(", ")}>
                              für {item.recipes.join(", ")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
