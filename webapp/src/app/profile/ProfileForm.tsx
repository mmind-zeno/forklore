"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { updateUserAvatar } from "@/app/actions/update-user-avatar";
import { User, Camera } from "lucide-react";

type Props = {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

export function ProfileForm({ user }: Props) {
  const { update: updateSession } = useSession();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setMessage(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (!formData.get("avatar")) {
      setMessage({ type: "error", text: "Bitte ein Bild auswählen." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const result = await updateUserAvatar(formData);
    setLoading(false);
    if (result.success) {
      setMessage({ type: "ok", text: "Profilbild gespeichert." });
      setPreview(null);
      form.reset();
      await updateSession();
    } else {
      setMessage({ type: "error", text: result.error ?? "Fehler beim Speichern." });
    }
  };

  const avatarUrl = preview || user.image;

  return (
    <div className="bg-warmwhite rounded-2xl border border-espresso/6 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-cream-dark border-2 border-espresso/10 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt="Profilbild"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={40} className="text-espresso-light/50" />
            )}
          </div>
          <p className="text-xs text-espresso-light font-bold uppercase tracking-widest">Profilbild</p>
        </div>

        <div className="flex-1 w-full min-w-0">
          <p className="text-sm text-espresso-mid mb-4">{user.email}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="sr-only">Neues Profilbild wählen</span>
              <input
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                className="block w-full text-sm text-espresso file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-terra/10 file:text-terra file:font-bold file:cursor-pointer hover:file:bg-terra/20"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 text-white text-sm font-bold shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all disabled:opacity-60 disabled:pointer-events-none"
            >
              <Camera size={16} />
              {loading ? "Wird gespeichert…" : "Profilbild speichern"}
            </button>
          </form>
          {message && (
            <p
              className={`mt-4 text-sm font-bold ${
                message.type === "ok" ? "text-sage" : "text-terra"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
