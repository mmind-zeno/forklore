"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  recipeCount?: number;
};

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
  const [tab, setTab] = useState<"users" | "settings">("users");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiConfigured, setOpenaiConfigured] = useState(false);
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
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setOpenaiConfigured(data.openaiConfigured ?? false);
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
      body: JSON.stringify({ openaiApiKey: openaiKey || "" }),
    });
    const data = await res.json();
    if (res.ok) {
      setSettingsSaved(data.message || "Gespeichert");
      setOpenaiKey("");
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
          <p className="text-sm text-stone-600 mb-6">Forklore v0.5.0</p>
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
            <p className="text-sm text-stone-600">User & Settings · Forklore v0.5.0</p>
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 max-w-lg">
            <h2 className="font-semibold text-stone-800 mb-4">OpenAI API Key</h2>
            {settingsLoading && <p className="text-sm text-stone-500 mb-2">Lade...</p>}
            <p className="text-sm text-stone-600 mb-4">
              API Key für Whisper und GPT-4o. Wird in der Datenbank gespeichert. Fallback: OPENAI_API_KEY aus .env
            </p>
            {openaiConfigured && (
              <p className="text-sm text-green-600 mb-2">✓ API Key ist konfiguriert</p>
            )}
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-... (leer = Key entfernen)"
                className="w-full px-4 py-2 rounded-lg border border-stone-200"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600"
              >
                Speichern
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
