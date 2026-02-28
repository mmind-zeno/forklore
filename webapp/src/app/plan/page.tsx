import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";
import { PlanWeek } from "./PlanWeek";

export const dynamic = "force-dynamic";

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function PlanPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const visibilityWhere = {
    OR: [{ userId: session.user.id }, { visibility: "public" as const }],
  };
  const recipes = await prisma.recipe.findMany({
    where: visibilityWhere,
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const today = new Date();
  const initialMonday = getMonday(today);

  return (
    <div className="min-h-screen bg-cream">
      <HeaderWithSuspense />
      <main className="pt-24 px-6 pb-16 max-w-4xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-espresso mb-2">Wochenplan</h1>
        <p className="text-espresso-light text-sm mb-8">
          Lege Rezepte auf Wochentage und leite daraus deine Einkaufsliste ab.
        </p>
        <PlanWeek
          initialWeekStart={toISO(initialMonday)}
          recipes={recipes}
        />
      </main>
    </div>
  );
}
