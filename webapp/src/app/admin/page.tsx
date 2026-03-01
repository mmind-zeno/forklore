"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { VERSION } from "@/lib/version";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  recipeCount?: number;
  accountAccessUntil?: string | null;
  aiAccessUntil?: string | null;
};

function formatDateOrDash(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"USER" | "ADMIN">("USER");
  const [formAccountAccessUntil, setFormAccountAccessUntil] = useState("");
  const [formAiAccessUntil, setFormAiAccessUntil] = useState("");
  const [tab, setTab] = useState<"users" | "settings">("users");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiConfigured, setOpenaiConfigured] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [imageApiKey, setImageApiKey] = useState("");
  const [imageApiConfigured, setImageApiConfigured] = useState(false);
  const [llmProvider, setLlmProvider] = useState<"openai" | "gemini">("openai");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState("");

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/users");
      setLoggedIn(res.ok);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) {
      setLoggedIn(true);
      setPassword("");
      checkAuth();
    } else {
      setLoginError(data.error || "Login fehlgeschlagen");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setUsers([]);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      setError("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formEmail,
        password: formPassword,
        name: formName || undefined,
        role: formRole,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowAdd(false);
      setFormEmail("");
      setFormName("");
      setFormPassword("");
      setFormRole("USER");
      loadUsers();
    } else {
      setError(data.error || "Fehler");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError("");
    const res = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formEmail,
        name: formName || undefined,
        role: formRole,
        ...(formPassword ? { password: formPassword } : {}),
        accountAccessUntil: formAccountAccessUntil.trim() || null,
        aiAccessUntil: formAiAccessUntil.trim() || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setEditing(null);
      setFormEmail("");
      setFormName("");
      setFormPassword("");
      loadUsers();
    } else {
      setError(data.error || "Fehler");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`User ${user.email} wirklich löschen?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) loadUsers();
    else setError("Löschen fehlgeschlagen");
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setFormEmail(u.email);
    setFormName(u.name || "");
    setFormPassword("");
    setFormRole((u.role as "USER" | "ADMIN") || "USER");
    setFormAccountAccessUntil(isoToDateInput(u.accountAccessUntil));
    setFormAiAccessUntil(isoToDateInput(u.aiAccessUntil));
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setOpenaiConfigured(data.openaiConfigured ?? false);
        setGeminiConfigured(data.geminiConfigured ?? false);
        setImageApiConfigured(data.imageApiConfigured ?? false);
        setLlmProvider(data.llmProvider === "gemini" ? "gemini" : "openai");
        setGeminiModel(data.geminiModel || "gemini-2.5-flash");
      }
    } catch {
      setError("Settings konnten nicht geladen werden");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved("");
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(openaiKey.trim() ? { openaiApiKey: openaiKey.trim() } : {}),
        ...(geminiKey.trim() ? { geminiApiKey: geminiKey.trim() } : {}),
        ...(imageApiKey.trim() ? { imageApiKey: imageApiKey.trim() } : {}),
        llmProvider,
        geminiModel,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSettingsSaved(data.message || "Gespeichert");
      setOpenaiKey("");
      setGeminiKey("");
      setImageApiKey("");
      loadSettings();
    } else {
      setError(data.error || "Fehler");
    }
  };

  useEffect(() => {
    if (loggedIn && tab === "settings") loadSettings();
  }, [loggedIn, tab]);

  if (loading && loggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <p className="text-stone-600">Lade...</p>
      </div>
    );
  }

  if (loggedIn === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-200 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm"
        >
          <h1 className="text-xl font-bold text-stone-800 mb-2">Admin Login</h1>
          <p className="text-sm text-stone-600 mb-6">Forklore v{VERSION}</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              autoFocus
            />
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600"
            >
              Anmelden
            </button>
          </form>
          <Link href="/" className="block mt-6 text-center text-sm text-amber-600 hover:underline">
            ← Zurück zur App
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-800">Admin</h1>
            <p className="text-sm text-stone-600">User & Settings · Forklore v{VERSION}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              App
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {settingsSaved && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-700 text-sm">
            {settingsSaved}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-xl font-medium ${tab === "users" ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-600"}`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`px-4 py-2 rounded-xl font-medium ${tab === "settings" ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-600"}`}
          >
            Settings
          </button>
        </div>

        {tab === "users" && (
        <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-stone-800">User</h2>
          <button
            onClick={() => {
              setShowAdd(true);
              setEditing(null);
              setFormEmail("");
              setFormName("");
              setFormPassword("");
              setFormRole("USER");
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600"
          >
            + User anlegen
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-stone-800">{u.email}</p>
                  <p className="text-sm text-stone-500">
                    {u.name || "—"} · {u.role} · {u.recipeCount ?? 0} Rezepte
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Zugang bis {formatDateOrDash(u.accountAccessUntil)} · KI bis {formatDateOrDash(u.aiAccessUntil)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="px-3 py-1 rounded-lg text-amber-600 hover:bg-amber-50 text-sm"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    className="px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 text-sm"
                  >
                    Löschen
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="font-bold text-stone-800 mb-4">User anlegen</h3>
              <form onSubmit={handleAddUser} className="space-y-3">
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="E-Mail *"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Passwort * (min. 8 Zeichen)"
                  required
                  minLength={8}
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "USER" | "ADMIN")}
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-2 rounded-lg border border-stone-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-amber-500 text-white font-medium"
                  >
                    Anlegen
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="font-bold text-stone-800 mb-4">User bearbeiten</h3>
              <form onSubmit={handleEditUser} className="space-y-3">
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="E-Mail *"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Neues Passwort (leer = unverändert)"
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "USER" | "ADMIN")}
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Zugang bis (leer = unbegrenzt)</label>
                  <input
                    type="date"
                    value={formAccountAccessUntil}
                    onChange={(e) => setFormAccountAccessUntil(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">KI bis (leer = kein KI)</label>
                  <input
                    type="date"
                    value={formAiAccessUntil}
                    onChange={(e) => setFormAiAccessUntil(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 py-2 rounded-lg border border-stone-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-amber-500 text-white font-medium"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        </>
        )}

        {tab === "settings" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 max-w-lg space-y-8">
            {settingsLoading && <p className="text-sm text-stone-500">Lade...</p>}
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <h2 className="font-semibold text-stone-800 mb-2">KI-Provider & Modell</h2>
                <p className="text-sm text-stone-600 mb-3">Welcher Anbieter soll für Rezept-Extraktion und Einkaufsliste genutzt werden? Whisper (Sprache) nutzt weiterhin OpenAI.</p>
                <div className="space-y-2">
                  <label className="block text-xs text-stone-500">Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value as "openai" | "gemini")}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200"
                  >
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                  {llmProvider === "gemini" && (
                    <>
                      <label className="block text-xs text-stone-500 mt-2">Gemini-Modell (drei neueste + Gemini 3)</label>
                      <select
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-stone-200"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-3-pro-preview">Gemini 3 Pro (Preview)</option>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-stone-800 mb-2">OpenAI API Key</h2>
                <p className="text-sm text-stone-600 mb-2">Für Whisper (Sprache) und optional GPT-4o. Leer lassen = unverändert.</p>
                {openaiConfigured && <p className="text-sm text-green-600 mb-2">✓ Konfiguriert</p>}
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-... (leer = beibehalten)"
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
              </div>
              <div>
                <h2 className="font-semibold text-stone-800 mb-2">Gemini API Key</h2>
                <p className="text-sm text-stone-600 mb-2">Für Google Gemini (wenn Provider = Gemini). Leer lassen = unverändert.</p>
                {geminiConfigured && <p className="text-sm text-green-600 mb-2">✓ Konfiguriert</p>}
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza... (leer = beibehalten)"
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
              </div>
              <div>
                <h2 className="font-semibold text-stone-800 mb-2">Bild-API Key (z. B. Replicate / Nanobanana)</h2>
                <p className="text-sm text-stone-600 mb-2">Zum Generieren von Rezeptbildern. Leer lassen = unverändert.</p>
                {imageApiConfigured && <p className="text-sm text-green-600 mb-2">✓ Konfiguriert</p>}
                <input
                  type="password"
                  value={imageApiKey}
                  onChange={(e) => setImageApiKey(e.target.value)}
                  placeholder="r8_... oder anderer Key (leer = beibehalten)"
                  className="w-full px-4 py-2 rounded-lg border border-stone-200"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600"
              >
                Einstellungen speichern
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
