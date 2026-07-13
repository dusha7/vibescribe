'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, Edit3, Loader2, ArrowLeft, X, Save, User,
} from 'lucide-react';
import { Header } from '@/components/header';
import type { CharacterData } from '@/lib/types';

const EMPTY_CHAR = {
  name: '',
  age: '',
  appearance: '',
  race: '',
  profession: '',
  traits: '',
  backstory: '',
};

export function CharactersClient() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CHAR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const fetchCharacters = useCallback(async () => {
    try {
      const res = await fetch('/api/characters');
      if (res?.ok) {
        const data = await res.json();
        setCharacters(data ?? []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCharacters();
    }
  }, [status, fetchCharacters]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { ...form, id: editId } : form;
      const res = await fetch('/api/characters', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res?.ok) {
        setShowForm(false);
        setEditId(null);
        setForm(EMPTY_CHAR);
        fetchCharacters();
      }
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  }, [form, editId, fetchCharacters]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/characters?id=${id}`, { method: 'DELETE' });
      if (res?.ok) {
        setCharacters((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  }, []);

  const startEdit = useCallback((char: CharacterData) => {
    setEditId(char.id);
    setForm({
      name: char.name ?? '',
      age: char.age ?? '',
      appearance: char.appearance ?? '',
      race: char.race ?? '',
      profession: char.profession ?? '',
      traits: char.traits ?? '',
      backstory: char.backstory ?? '',
    });
    setShowForm(true);
  }, []);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="mx-auto max-w-[900px] px-4 pb-16 pt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => router.push('/')}
            className="mb-4 flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-pink-400" />
              <h1 className="font-display text-2xl font-bold text-white">Characters</h1>
              <span className="text-sm text-white/30">({characters?.length ?? 0})</span>
            </div>
            <button
              onClick={() => {
                setEditId(null);
                setForm(EMPTY_CHAR);
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New Character
            </button>
          </div>

          {/* Character list */}
          {(characters?.length ?? 0) === 0 && !showForm ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <Users className="mx-auto h-10 w-10 text-white/20 mb-3" />
              <p className="text-white/40 text-sm mb-4">No characters yet. Create your first one!</p>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500 transition-colors"
              >
                Create Character
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(characters ?? []).map((char, i) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-white/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                        <User className="h-4 w-4 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white text-sm">{char.name}</h3>
                        {char.profession && (
                          <p className="text-[11px] text-white/40">{char.profession}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(char)}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(char.id)}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-white/50">
                    {char.age && <p><span className="text-white/30">Age:</span> {char.age}</p>}
                    {char.race && <p><span className="text-white/30">Race:</span> {char.race}</p>}
                    {char.traits && <p className="line-clamp-2"><span className="text-white/30">Traits:</span> {char.traits}</p>}
                    {char.backstory && <p className="line-clamp-2"><span className="text-white/30">Backstory:</span> {char.backstory}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={() => setShowForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111118] p-6 overflow-y-auto max-h-[85vh]"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display font-bold text-white text-lg">
                      {editId ? 'Edit Character' : 'New Character'}
                    </h2>
                    <button
                      onClick={() => setShowForm(false)}
                      className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Character name"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Age</label>
                        <input
                          type="text"
                          value={form.age}
                          onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                          placeholder="e.g. 25"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Race / Species</label>
                        <input
                          type="text"
                          value={form.race}
                          onChange={(e) => setForm((p) => ({ ...p, race: e.target.value }))}
                          placeholder="e.g. Human, Elf"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Profession</label>
                      <input
                        type="text"
                        value={form.profession}
                        onChange={(e) => setForm((p) => ({ ...p, profession: e.target.value }))}
                        placeholder="e.g. Wizard, Mechanic"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Appearance</label>
                      <textarea
                        value={form.appearance}
                        onChange={(e) => setForm((p) => ({ ...p, appearance: e.target.value }))}
                        placeholder="Physical description..."
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Personality Traits</label>
                      <textarea
                        value={form.traits}
                        onChange={(e) => setForm((p) => ({ ...p, traits: e.target.value }))}
                        placeholder="Key character traits..."
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Backstory</label>
                      <textarea
                        value={form.backstory}
                        onChange={(e) => setForm((p) => ({ ...p, backstory: e.target.value }))}
                        placeholder="Character background and history..."
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim()}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editId ? 'Update Character' : 'Create Character'}
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
