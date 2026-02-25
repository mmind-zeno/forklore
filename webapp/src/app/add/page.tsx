"use client";

import { useState, useRef } from "react";
import { createRecipe } from "@/app/actions/create-recipe";
import Link from "next/link";

export default function AddRecipePage() {
  const [image, setImage] = useState<string | null>(null);
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
    reader.onload = () => {
      setImage(reader.result as string);
    };
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

  const handleSubmit = async () => {
    if (!image || !audioBlob) {
      setError("Bitte Foto und Sprachaufnahme hinzufügen.");
      return;
    }
    setStatus("Rezept wird verarbeitet...");
    setError("");

    const formData = new FormData();
    const imageRes = await fetch(image);
    const imageBlob = await imageRes.blob();
    formData.append("image", imageBlob, "image.jpg");
    formData.append("audio", audioBlob, "audio.webm");

    const result = await createRecipe(formData);

    if (result.success) {
      setStatus("Rezept gespeichert!");
      setImage(null);
      setAudioBlob(null);
      setTimeout(() => (window.location.href = "/"), 1500);
    } else {
      setError(result.error || "Fehler beim Speichern");
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 pb-24">
      <header className="mb-6">
        <Link href="/" className="text-amber-700 hover:underline">
          ← Zurück
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-800">
          Neues Rezept
        </h1>
        <p className="text-stone-600">
          Foto machen und Rezept sprechen
        </p>
      </header>

      <div className="space-y-6">
        {/* Foto */}
        <section>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            1. Foto vom Essen
          </label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/50 cursor-pointer hover:bg-amber-50">
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

        {/* Voice */}
        <section>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            2. Rezept sprechen
          </label>
          <div className="flex gap-4 items-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex-1 py-4 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600"
              >
                🎤 Aufnahme starten
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 py-4 rounded-xl bg-red-500 text-white font-semibold animate-pulse"
              >
                ⏹ Aufnahme stoppen
              </button>
            )}
          </div>
          {audioBlob && (
            <p className="mt-2 text-sm text-green-600">✓ Aufnahme fertig ({Math.round(audioBlob.size / 1024)} KB)</p>
          )}
        </section>

        {status && <p className="text-amber-700 font-medium">{status}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!image || !audioBlob || !!status}
          className="w-full py-4 rounded-xl bg-stone-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Rezept speichern
        </button>
      </div>
    </div>
  );
}
