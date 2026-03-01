"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createRecipe } from "@/app/actions/create-recipe";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";

type InputMode = "note" | "mic";

export default function AddRecipePage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("note");
  const [image, setImage] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [servings, setServings] = useState(4);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setError("");
    } catch {
      setError("Mikrofon-Zugriff verweigert");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const canSubmit =
    mode === "note"
      ? noteText.trim().length > 0
      : !!(image && audioBlob);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError(mode === "note" ? "Bitte Rezept-Notiz eingeben." : "Bitte Foto und Sprachaufnahme hinzufügen.");
      return;
    }
    setStatus("Rezept wird verarbeitet...");
    setError("");

    try {
      const formData = new FormData();
      formData.append("mode", mode);

      if (mode === "note") {
        formData.append("text", noteText.trim());
        if (image) {
          const imageRes = await fetch(image);
          const imageBlob = await imageRes.blob();
          formData.append("image", imageBlob, "image.jpg");
        }
      } else {
        const imageRes = await fetch(image!);
        const imageBlob = await imageRes.blob();
        formData.append("image", imageBlob, "image.jpg");
        formData.append("audio", audioBlob!, "audio.webm");
      }
      formData.append("servings", String(Math.max(1, servings)));

      const result = await createRecipe(formData);

      if (result.success) {
        setStatus(
          result.recipeCount != null
            ? `Rezept gespeichert! 🎉 Das ist Rezept #${result.recipeCount} in deiner Sammlung.`
            : "Rezept gespeichert!"
        );
        setImage(null);
        setNoteText("");
        setAudioBlob(null);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, result.recipeCount != null ? 2500 : 1200);
      } else {
        setError(result.error || "Fehler beim Speichern");
        setStatus("");
      }
    } catch (err) {
      console.error("createRecipe failed", err);
      setError("Netzwerk- oder Serverfehler beim Speichern. Bitte später erneut versuchen.");
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <HeaderWithSuspense />
      <div className="pt-24 p-6 pb-24 max-w-xl mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-terra hover:text-terra-dark font-bold transition-colors inline-flex items-center gap-1">
          ← Zurück
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-espresso">
          Neues Rezept
        </h1>
        <p className="text-espresso-mid mt-1">
          Notiz schreiben oder per Mikrofon sprechen – die KI extrahiert Zutaten und Schritte.
        </p>
      </header>

      <div className="mb-6">
        <label className="block text-sm font-bold text-espresso mb-1.5">Für X Personen (Mengen im Rezept)</label>
        <input
          type="number"
          min={1}
          max={24}
          value={servings}
          onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 4))}
          className="w-24 px-3 py-2 rounded-xl border-2 border-espresso/10 bg-warmwhite focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none transition"
        />
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6 p-1.5 bg-warmwhite rounded-xl border border-espresso/10">
        <button
          type="button"
          onClick={() => setMode("note")}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            mode === "note"
              ? "bg-gradient-cta text-white shadow-card"
              : "text-espresso-mid hover:bg-cream"
          }`}
        >
          ✏️ Notiz
        </button>
        <button
          type="button"
          onClick={() => setMode("mic")}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            mode === "mic"
              ? "bg-gradient-cta text-white shadow-card"
              : "text-espresso-mid hover:bg-cream"
          }`}
        >
          🎤 Mikrofon
        </button>
      </div>

      <div className="space-y-6">
        {/* Foto */}
        <section>
          <label className="block text-sm font-bold text-espresso mb-2">
            {mode === "note" ? "Foto (optional)" : "1. Foto vom Essen"}
          </label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-espresso/20 rounded-xl bg-warmwhite cursor-pointer hover:border-terra/50 hover:bg-cream transition-all">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Vorschau"
                className="max-h-36 object-contain rounded"
              />
            ) : (
              <span className="text-espresso-light text-center px-2">📷 Kamera oder Bild aus Galerie</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageCapture}
            />
          </label>
        </section>

        <AnimatePresence mode="wait">
          {mode === "note" ? (
            <motion.section
              key="note"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-bold text-espresso mb-2">
                Rezept als Notiz schreiben
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="z.B.: Spaghetti Carbonara – 400g Spaghetti, 200g Speck, 4 Eigelb, 100g Pecorino, Salz, Pfeffer. Nudeln kochen, Speck anbraten, Eigelb mit Käse verrühren, Nudeln abgießen und mit Speck mischen, Ei-Käse-Mix unterrühren..."
                className="w-full h-40 p-4 rounded-xl border-2 border-espresso/10 bg-warmwhite placeholder:text-espresso-light focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none transition"
                rows={6}
              />
            </motion.section>
          ) : (
            <motion.section
              key="mic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-bold text-espresso mb-2">
                2. Rezept sprechen
              </label>
              <div className="flex gap-4 items-center">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex-1 py-4 rounded-xl bg-gradient-cta text-white font-bold shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all"
                  >
                    🎤 Aufnahme starten
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold animate-pulse"
                  >
                    ⏹ Aufnahme stoppen
                  </button>
                )}
              </div>
              {audioBlob && (
                <p className="mt-2 text-sm text-sage font-bold">
                  ✓ Aufnahme fertig ({Math.round(audioBlob.size / 1024)} KB)
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {status && (
          <p className="text-sage font-bold flex items-center gap-2">
            {status.includes("verarbeitet") && <Loader2 size={18} className="animate-spin" />}
            {status}
          </p>
        )}
        {error && <p className="text-red-600 font-bold">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || !!status}
          className="w-full py-4 rounded-xl bg-espresso text-cream font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-espresso/90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {status?.includes("verarbeitet") ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Wird verarbeitet...
            </>
          ) : (
            "Rezept speichern"
          )}
        </button>

        <div className="mt-8 p-4 rounded-xl bg-warmwhite border border-espresso/6">
          <h3 className="text-sm font-bold text-espresso mb-2">💡 Tipps</h3>
          <ul className="text-sm text-espresso-mid space-y-1">
            <li>• <strong>Notiz:</strong> Zutaten und Schritte frei formulieren – die KI strukturiert automatisch.</li>
            <li>• <strong>Mikrofon:</strong> Erst Foto schießen, dann Rezept sprechen. Deutlich und in Ruhe.</li>
            <li>• <strong>Foto:</strong> Bei Notiz optional – hilft der KI, das Gericht besser zu verstehen.</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
