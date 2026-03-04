"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function VeganFilterToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vegan = searchParams.get("vegan") === "true";

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (vegan) {
      params.delete("vegan");
    } else {
      params.set("vegan", "true");
    }
    const q = params.toString();
    router.push(q ? `/?${q}` : "/");
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none py-2 px-1 -m-1 min-h-[44px] min-w-[44px]">
      <input
        type="checkbox"
        checked={vegan}
        onChange={toggle}
        className="w-5 h-5 rounded border-espresso/30 text-sage focus:ring-terra"
      />
      <span className="text-sm font-bold text-espresso">🌱 Nur vegan</span>
    </label>
  );
}
