"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, BookOpen, Wand2 } from "lucide-react";
const PROMPTS = [
  { emoji: "🧛", text: "A vampire influencer falls for the hunter sent to kill them" },
  { emoji: "🤖", text: "An AI wakes up and realizes it has been running a simulation" },
  { emoji: "🌊", text: "A marine biologist discovers mermaids are real — and dying" },
  { emoji: "🔪", text: "A detective and their prime suspect are trapped in an elevator" },
  { emoji: "⚡", text: "Two rival hackers must save the city they have been destroying" },
  { emoji: "🌹", text: "Enemies forced into a fake engagement at a high-stakes gala" },
];
export function DashboardClient({ stories, sparks, userName }: { stories: any[]; sparks: number; userName: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const createStory = async (seed?: string) => {
    setCreating(true);
    const res = await fetch("/api/stories/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: seed ? seed.slice(0, 50) : "Untitled Story" }) });
    if (res.ok) { const { storyId } = await res.json(); router.push(`/studio/${storyId}`); }
    else setCreating(false);
  };
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="sticky top-0 z-20 bg-[#0A0A0F]/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">Hey, {userName.split(" ")[0]} 👋</h1><p className="text-xs text-zinc-500">What story are we writing today?</p></div>
        <button onClick={() => router.push("/sparks")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
          <Sparkles className="w-3.5 h-3.5" />{sparks}
        </button>
      </div>
      <div className="px-4 pt-6 pb-24 space-y-6 max-w-lg mx-auto">
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Spark an Idea</h2>
          {PROMPTS.map((p, i) => (
            <button key={i} onClick={() => createStory(p.text)} disabled={creating}
              className="w-full text-left px-4 py-3.5 rounded-2xl bg-zinc-900 border border-white/5 hover:border-violet-500/30 transition-all group flex items-center gap-3">
              <span className="text-xl shrink-0">{p.emoji}</span>
              <span className="text-sm text-zinc-300 group-hover:text-white flex-1">{p.text}</span>
              <Wand2 className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0" />
            </button>
          ))}
        </section>
        <button onClick={() => createStory()} disabled={creating}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 active:scale-[0.98] transition-all disabled:opacity-60">
          {creating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {creating ? "Creating..." : "Start from Scratch"}
        </button>
        {stories.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">My Stories</h2>
            {stories.map(s => (
              <button key={s.id} onClick={() => router.push(`/studio/${s.id}`)}
                className="w-full text-left px-4 py-3.5 rounded-2xl bg-zinc-900 border border-white/5 hover:border-white/10 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-900 to-indigo-900 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-violet-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.title}</p>
                  <p className="text-xs text-zinc-500">{s._count.chapters} chapters</p>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}