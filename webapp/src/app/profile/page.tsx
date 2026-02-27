import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      <HeaderWithSuspense />
      <main className="pt-24 px-6 py-12 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-espresso mb-2">Mein Profil</h1>
        <p className="text-espresso-light text-sm mb-8">
          Hier kannst du dein Profilbild anpassen. Es wird in der Navigation und bei deinen geteilten Rezepten angezeigt.
        </p>
        <ProfileForm
          user={{
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            image: session.user.image ?? null,
          }}
        />
      </main>
    </div>
  );
}
