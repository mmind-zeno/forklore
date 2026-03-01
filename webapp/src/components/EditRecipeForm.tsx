"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateRecipe } from "@/app/actions/update-recipe";
import { deleteRecipe } from "@/app/actions/delete-recipe";
import { generateRecipeImage } from "@/app/actions/generate-recipe-image";
import { Pencil, Trash2, Plus, X, Loader2, Sparkles } from "lucide-react";

type Ingredient = { amount?: string; unit?: string; name: string };

type Props = {
  recipeId: string;
  initialTitle: string;
  initialIngredients: Ingredient[];
  initialSteps: string[];
  initialCategory: string | null;
  initialTags: string[];
  initialImagePath: string | null;
  initialVisibility: string | null;
  initialMainIngredients?: string;
  initialServings?: number;
};

export function EditRecipeForm({
  recipeId,
  initialTitle,
  initialIngredients,
  initialSteps,
  initialCategory,
  initialTags,
  initialImagePath,
  initialVisibility,
  initialMainIngredients,
  initialServings = 4,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [steps, setSteps] = useState(initialSteps);
  const [category, setCategory] = useState(initialCategory || "");
  const [servings, setServings] = useState(initialServings);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"private" | "public">(
    initialVisibility === "public" ? "public" : "private"
  );
  const [mainIngredientsText, setMainIngredientsText] = useState(initialMainIngredients ?? "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addIngredient = () => {
    setIngredients([...ingredients, { amount: "", unit: "", name: "" }]);
  };

  const removeIngredient = (i: number) => {
    setIngredients(ingredients.filter((_, idx) => idx !== i));
  };

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const next = [...ingredients];
    next[i] = { ...next[i], [field]: value };
    setIngredients(next);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (i: number) => {
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  const updateStep = (i: number, value: string) => {
    const next = [...steps];
    next[i] = value;
    setSteps(next);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async () => {
    setError("");
    setIsGeneratingImage(true);
    const result = await generateRecipeImage({
      recipeId,
      title: title.trim(),
      mainIngredients: mainIngredientsText.trim() || undefined,
    });
    setIsGeneratingImage(false);
    if (result.success && result.imagePath) {
      setImage(`/api/uploads/${result.imagePath}`);
      setStatus("Bild generiert. Speichern nicht vergessen.");
      router.refresh();
    } else {
      setError(result.error || "Bildgenerierung fehlgeschlagen.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    setStatus("Speichern...");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("steps", JSON.stringify(steps));
    formData.append("category", category || "");
    formData.append("servings", String(Math.max(1, servings)));
    formData.append("visibility", visibility);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    formData.append("tags", JSON.stringify(tagList));
    const mainList = mainIngredientsText
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    formData.append("mainIngredients", JSON.stringify(mainList));
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const result = await updateRecipe(recipeId, formData);

    if (result.success) {
      setStatus("Gespeichert!");
      router.push(`/recipe/${recipeId}`);
      router.refresh();
    } else {
      setError(result.error || "Fehler beim Speichern");
      setStatus("");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);
    const result = await deleteRecipe(recipeId);
    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.error || "Fehler beim Löschen");
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-espresso mb-2">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 rounded-xl border-2 border-espresso/10 bg-warmwhite focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-espresso mb-2">Kategorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-4 rounded-xl border-2 border-espresso/10 bg-warmwhite focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none transition"
        >
          <option value="">— Keine —</option>
          <option value="backen">Backen</option>
          <option value="kochen">Kochen</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-espresso mb-2">Für X Personen</label>
        <input
          type="number"
          min={1}
          max={24}
          value={servings}
          onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 4))}
          className="w-full p-4 rounded-xl border-2 border-espresso/10 bg-warmwhite focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-espresso mb-2">Tags (kommagetrennt)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="vegan, schnell, vegetarisch"
          className="w-full p-4 rounded-xl border-2 border-espresso/10 bg-warmwhite focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-espresso mb-2">Hauptzutaten (kommagetrennt)</label>
        <input
          type="text"
          value={mainIngredientsText}
          onChange={(e) => setMainIngredientsText(e.target.value)}
          placeholder="lachs, brokkoli, avocado"
          className="w-full p-4 rounded-xl border-2 border-espresso/10 bg-warmwhite focus:border-terra focus:ring-2 focus:ring-terra/20 outline-none transition"
        />
        <p className="mt-1 text-xs text-espresso-light">
          Nutze wenige, charakteristische Zutaten – sie können später zum Filtern verwendet werden.
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-espresso mb-2">Sichtbarkeit</label>
        <div className="flex gap-2 p-1.5 bg-warmwhite rounded-xl border border-espresso/10">
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
              visibility === "private"
                ? "bg-espresso text-cream shadow-card"
                : "text-espresso-mid hover:bg-cream"
            }`}
          >
            🔒 Nur ich
          </button>
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
              visibility === "public"
                ? "bg-gradient-cta text-white shadow-card"
                : "text-espresso-mid hover:bg-cream"
            }`}
          >
            🌍 Für alle sichtbar
          </button>
        </div>
        <p className="mt-1 text-xs text-espresso-light">
          Öffentliche Rezepte sind für alle angemeldeten Benutzer:innen sichtbar.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-espresso">Zutaten</label>
          <button
            type="button"
            onClick={addIngredient}
            className="text-terra text-sm font-bold flex items-center gap-1 hover:underline"
          >
            <Plus size={14} /> Hinzufügen
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Menge"
                value={ing.amount || ""}
                onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                className="w-20 p-2 rounded-lg border border-espresso/10 bg-warmwhite text-sm"
              />
              <input
                type="text"
                placeholder="Einheit"
                value={ing.unit || ""}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                className="w-16 p-2 rounded-lg border border-espresso/10 bg-warmwhite text-sm"
              />
              <input
                type="text"
                placeholder="Zutat"
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                className="flex-1 p-2 rounded-lg border border-espresso/10 bg-warmwhite text-sm"
                required
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Zutat entfernen"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-espresso">Zubereitung</label>
          <button
            type="button"
            onClick={addStep}
            className="text-terra text-sm font-bold flex items-center gap-1 hover:underline"
          >
            <Plus size={14} /> Schritt hinzufügen
          </button>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-6 h-8 rounded-full bg-terra text-white text-xs font-bold flex items-center justify-center mt-2">
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                className="flex-1 p-3 rounded-lg border border-espresso/10 bg-warmwhite text-sm min-h-[60px]"
                required
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                aria-label="Schritt entfernen"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-espresso mb-2">Bild (optional – neues Bild ersetzen)</label>
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-espresso/20 rounded-xl bg-warmwhite cursor-pointer hover:border-terra/50 hover:bg-cream transition-all">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="Vorschau" className="max-h-28 object-contain rounded" />
              ) : initialImagePath ? (
                <div className="flex flex-col items-center gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/uploads/${initialImagePath}`}
                    alt="Aktuelles Bild"
                    className="max-h-24 object-contain rounded"
                  />
                  <span className="text-xs text-espresso-light">Aktuelles Bild – klicken zum Ersetzen</span>
                </div>
              ) : (
                <span className="text-espresso-light text-sm">📷 Neues Bild wählen</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !title.trim()}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-terra/40 bg-terra/5 px-4 py-3 text-terra text-sm font-bold hover:bg-terra/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGeneratingImage ? "Generiere …" : "Bild mit KI generieren"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 font-bold">{error}</p>}
      {status && <p className="text-sage font-bold flex items-center gap-2">{status}</p>}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-4 rounded-xl bg-espresso text-cream font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-espresso/90 transition-all"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Pencil size={18} />}
          Änderungen speichern
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="py-4 px-6 rounded-xl border-2 border-red-500 text-red-500 font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-all"
        >
          <Trash2 size={18} />
          Löschen
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-display text-xl font-bold text-espresso mb-2">Rezept löschen?</h3>
            <p className="text-espresso-mid mb-6">
              Das Rezept „{title}“ wird unwiderruflich gelöscht.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-espresso/20 text-espresso font-bold hover:bg-cream-dark transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Ja, löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
