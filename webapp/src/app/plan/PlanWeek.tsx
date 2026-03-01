"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart, Loader2, Calendar } from "lucide-react";
import { getMealPlan } from "@/app/actions/get-meal-plan";
import { setMealPlanEntry } from "@/app/actions/set-meal-plan-entry";
import { getShoppingList } from "@/app/actions/get-shopping-list";

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
    const res = await getShoppingList(weekStart);
    if (res.success && res.items) setShoppingItems(res.items);
    else setShoppingItems([]);
    setLoadingList(false);
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

      {/* Einkaufsliste – immer sichtbarer Block, Inhalt nach Klick */}
      <section aria-label="Einkaufsliste">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-espresso-light">
            Aus den geplanten Rezepten wird eine zusammengefasste Einkaufsliste erzeugt (Mengen summiert, nach Kategorien sortiert).
          </p>
          <button
            type="button"
            onClick={handleShowShoppingList}
            disabled={loadingList || plannedCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-cta px-5 py-3 text-white text-sm font-bold tracking-wide shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 shrink-0"
          >
            {loadingList ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ShoppingCart size={18} />
            )}
            {loadingList ? "Wird erstellt …" : "Einkaufsliste anzeigen"}
          </button>
        </div>

        {showShoppingList && (
          <div className="mt-4 bg-warmwhite rounded-2xl border border-espresso/5 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-espresso/5 flex flex-wrap items-baseline gap-2">
              <h2 className="font-display font-bold text-espresso text-lg">Einkaufsliste</h2>
              {shoppingItems.length > 0 && (
                <span className="text-sm text-espresso-light">
                  {shoppingItems.length} Position{shoppingItems.length !== 1 ? "en" : ""} aus {plannedCount} Rezept{plannedCount !== 1 ? "en" : ""}
                </span>
              )}
            </div>
            {loadingList ? (
              <div className="p-8 flex items-center justify-center gap-2 text-espresso-light">
                <Loader2 size={20} className="animate-spin" />
                <span>Einkaufsliste wird erstellt …</span>
              </div>
            ) : shoppingItems.length === 0 ? (
              <div className="p-8 text-center">
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
              <div className="p-5 sm:p-6">
                {Object.entries(groupedByCategory).map(([category, items]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-terra mb-2.5 pb-1 border-b border-terra/20">
                      {category}
                    </h3>
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li
                          key={`${item.name}-${item.unit}-${i}`}
                          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                        >
                          <span className="font-semibold text-espresso">{item.name}</span>
                          <span className="text-espresso-light">
                            {item.amount !== "—" && `${item.amount} `}
                            {item.unit !== "—" && item.unit}
                          </span>
                          {item.recipes.length > 0 && (
                            <span className="text-espresso-light/60 text-xs w-full sm:w-auto">
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
