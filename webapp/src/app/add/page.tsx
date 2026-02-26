"use client";

import { useState, useRef } from "react";
import { createRecipe } from "@/app/actions/create-recipe";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type InputMode = "note" | "mic";

export default function AddRecipePage() {
  const [mode, setMode] = useState<InputMode>("note");
  const [image, setImage] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
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

    const result = await createRecipe(formData);

    if (result.success) {
      setStatus("Rezept gespeichert!");
      setImage(null);
      setNoteText("");
      setAudioBlob(null);
      setTimeout(() => (window.location.href = "/"), 1500);
    } else {
      setError(result.error || "Fehler beim Speichern");
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/90 via-teal-50/40 to-rose-50/60 p-4 pb-24">
      <header className="mb-6 max-w-xl">
        <Link href="/" className="text-coral-600 hover:text-coral-500 font-medium transition-colors inline-flex items-center gap-1">
          ← Zurück
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-800">
          Neues Rezept
        </h1>
        <p className="text-stone-600 mt-1">Notiz schreiben oder per Mikrofon sprechen – die KI extrahiert Zutaten und Schritte.</p>
      </header>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6 p-1.5 bg-white/80 rounded-xl shadow-inner border border-stone-100">
        <button
          type="button"
          onClick={() => setMode("note")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            mode === "note"
              ? "bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-lg shadow-coral-500/25"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          ✏️ Notiz
        </button>
        <button
          type="button"
          onClick={() => setMode("mic")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            mode === "mic"
              ? "bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-lg shadow-coral-500/25"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          🎤 Mikrofon
        </button>
      </div>

      <div className="space-y-6">
        {/* Foto (optional bei Notiz, Pflicht bei Mic) */}
        <section>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            {mode === "note" ? "Foto (optional)" : "1. Foto vom Essen"}
          </label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-coral-400/50 rounded-xl bg-white/70 cursor-pointer hover:bg-coral-50/50 transition-all hover:border-coral-500/60">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Vorschau"
                className="max-h-36 object-contain rounded"
              />
            ) : (
              <span className="text-amber-700">📷 Foto aufnehmen oder auswählen</span>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
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
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Rezept als Notiz schreiben
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="z.B.: Spaghetti Carbonara – 400g Spaghetti, 200g Speck, 4 Eigelb, 100g Pecorino, Salz, Pfeffer. Nudeln kochen, Speck anbraten, Eigelb mit Käse verrühren, Nudeln abgießen und mit Speck mischen, Ei-Käse-Mix unterrühren..."
                className="w-full h-40 p-4 rounded-xl border-2 border-coral-200 bg-white/80 placeholder:text-stone-400 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 outline-none transition"
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
              <label className="block text-sm font-medium text-stone-700 mb-2">
                2. Rezept sprechen
              </label>
              <div className="flex gap-4 items-center">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-coral-500 to-coral-600 text-white font-semibold hover:shadow-lg hover:shadow-coral-500/30 transition-all hover:scale-[1.02]"
                  >
                    🎤 Aufnahme starten
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 py-4 rounded-xl bg-red-500 text-white font-semibold animate-pulse"
                  >
                    ⏹ Aufnahme stoppen
                  </button>
                )}
              </div>
              {audioBlob && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Aufnahme fertig ({Math.round(audioBlob.size / 1024)} KB)
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {status && <p className="text-amber-700 font-medium">{status}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || !!status}
          className="w-full py-4 rounded-xl bg-stone-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          Rezept speichern
        </button>

        <div className="mt-8 p-4 rounded-xl bg-white/60 border border-stone-200/80">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">💡 Tipps</h3>
          <ul className="text-sm text-stone-600 space-y-1">
            <li>• <strong>Notiz:</strong> Zutaten und Schritte frei formulieren – die KI strukturiert automatisch.</li>
            <li>• <strong>Mikrofon:</strong> Erst Foto schießen, dann Rezept sprechen. Deutlich und in Ruhe.</li>
            <li>• <strong>Foto:</strong> Bei Notiz optional – hilft der KI, das Gericht besser zu verstehen.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
