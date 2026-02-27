"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function RecipeSearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [main, setMain] = useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setMain(searchParams.get("main") ?? "");
  }, [searchParams]);

  const updateUrl = (nextQuery: string, nextMain: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");

    if (nextMain.trim()) params.set("main", nextMain.trim().toLowerCase());
    else params.delete("main");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(query, main);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col lg:flex-row gap-3 mb-6">
      <div className="flex-1 flex items-center gap-2 rounded-full bg-warmwhite border border-espresso/10 px-4 py-2 shadow-sm">
        <Search size={16} className="text-espresso-light" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nach Titel, Zutaten oder Tags suchen..."
          className="flex-1 bg-transparent outline-none text-sm text-espresso"
        />
      </div>
      <div className="flex items-center gap-2 rounded-full bg-warmwhite border border-espresso/10 px-4 py-2 shadow-sm">
        <span className="text-xs font-bold text-espresso-light uppercase tracking-wide">Hauptzutat</span>
        <input
          type="text"
          value={main}
          onChange={(e) => setMain(e.target.value)}
          placeholder="z.B. lachs"
          className="flex-1 bg-transparent outline-none text-sm text-espresso"
        />
        <button
          type="submit"
          className="text-xs font-bold text-terra hover:text-terra-dark transition-colors"
        >
          Anwenden
        </button>
      </div>
    </form>
  );
}

