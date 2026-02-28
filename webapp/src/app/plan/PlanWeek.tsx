"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
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

type Entry = { dayOfWeek: number; recipeId: string; recipe: { id: string; title: string; imagePath: string | null } };

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
  const [shoppingItems, setShoppingItems] = useState<{ name: string; amount: string; unit: string; recipes: string[] }[]>([]);
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

  return (
    <div className="space-y-8">
      {/* Week navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="p-2 rounded-full border border-espresso/10 hover:bg-cream-dark hover:border-terra/30 transition-colors"
          aria-label="Vorherige Woche"
        >
          <ChevronLeft size={20} className="text-espresso" />
        </button>
        <span className="font-display font-bold text-espresso text-lg">{formatWeekRange(weekStart)}</span>
        <button
          type="button"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="p-2 rounded-full border border-espresso/10 hover:bg-cream-dark hover:border-terra/30 transition-colors"
          aria-label="Nächste Woche"
        >
          <ChevronRight size={20} className="text-espresso" />
        </button>
      </div>

      {/* Days */}
      <div className="bg-warmwhite rounded-2xl border border-espresso/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-espresso-light">Lade Wochenplan …</div>
        ) : (
          <ul className="divide-y divide-espresso/5">
            {DAY_NAMES.map((name, dayOfWeek) => {
              const entry = entryByDay(dayOfWeek);
              const isSaving = savingDay === dayOfWeek;
              return (
                <li key={dayOfWeek} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 hover:bg-cream/50 transition-colors">
                  <span className="w-28 shrink-0 font-bold text-espresso text-sm">{name}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <select
                      value={entry?.recipeId ?? ""}
                      onChange={(e) => handleSetDay(dayOfWeek, e.target.value || null)}
                      disabled={isSaving}
                      className="flex-1 max-w-md rounded-lg border border-espresso/15 bg-white px-3 py-2 text-sm text-espresso focus:border-terra focus:ring-1 focus:ring-terra/30 outline-none"
                    >
                      <option value="">— Kein Rezept —</option>
                      {recipes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                    {isSaving && (
                      <span className="text-xs text-espresso-light">Speichern …</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Shopping list */}
      <div>
        <button
          type="button"
          onClick={handleShowShoppingList}
          disabled={loadingList}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 text-white text-sm font-bold tracking-wide shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-200 disabled:opacity-70"
        >
          <ShoppingCart size={18} />
          {loadingList ? "Lade …" : "Einkaufsliste für diese Woche"}
        </button>

        {showShoppingList && (
          <div className="mt-6 bg-warmwhite rounded-2xl border border-espresso/5 shadow-sm overflow-hidden">
            <h2 className="font-display font-bold text-espresso px-5 py-4 border-b border-espresso/5">
              Einkaufsliste
            </h2>
            {loadingList ? (
              <p className="p-5 text-espresso-light text-sm">Lade …</p>
            ) : shoppingItems.length === 0 ? (
              <p className="p-5 text-espresso-light text-sm">
                Keine Rezepte in dieser Woche geplant – oder Zutaten konnten nicht zusammengefasst werden.
              </p>
            ) : (
              <ul className="divide-y divide-espresso/5 p-5">
                {shoppingItems.map((item, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-2 py-1.5 text-sm">
                    <span className="font-bold text-espresso">{item.name}</span>
                    <span className="text-espresso-light">
                      {item.amount !== "—" && `${item.amount} `}
                      {item.unit !== "—" && item.unit}
                    </span>
                    {item.recipes.length > 0 && (
                      <span className="text-espresso-light/70 text-xs">
                        ({item.recipes.join(", ")})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
