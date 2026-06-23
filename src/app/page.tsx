import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0A0A0F]/80 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm">✨</div>
          <span className="font-bold text-lg">VibeScribe</span>
        </div>
        <Link href="/auth/signin" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-colors">
          Начать бесплатно
        </Link>
      </nav>

      <section className="pt-32 pb-24 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-medium mb-8">
          ✨ Powered by Claude AI + ElevenLabs
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Создавай истории.{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Слушай их вживую.
          </span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          VibeScribe генерирует кинематографические истории с ИИ и озвучивает их разными голосами в реальном времени.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/signin" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg hover:from-violet-500 hover:to-indigo-500 transition-all shadow-2xl shadow-violet-900/40">
            Попробовать бесплатно →
          </Link>
          <a href="#features" className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all">
            Узнать больше
          </a>
        </div>
        <p className="mt-4 text-zinc-600 text-sm">50 бесплатных Sparks · Без карты</p>
      </section>

      <section id="features" className="px-6 max-w-5xl mx-auto mb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Всё для идеальной истории</h2>
        <p className="text-zinc-400 text-center mb-16">От идеи до cinematic аудио — за секунды</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { e: "🤖", t: "Claude AI", d: "Мощная языковая модель создаёт захватывающие сюжеты с живыми персонажами" },
            { e: "🎙️", t: "Мульти-голос", d: "ElevenLabs озвучивает каждого персонажа уникальным голосом" },
            { e: "🎵", t: "Ambient звук", d: "Фоновая музыка автоматически подбирается под жанр истории" },
            { e: "📖", t: "Lorebook", d: "Создавай мир истории. ИИ будет соблюдать твои правила и персонажей" },
            { e: "⚡", t: "Стриминг", d: "Текст появляется токен за токеном. Нулевое ожидание" },
            { e: "🌙", t: "Karaoke-режим", d: "Слова подсвечиваются в такт. Тапни на слово — аудио перемотается" },
          ].map((f) => (
            <div key={f.t} className="p-6 rounded-2xl bg-zinc-900/60 border border-white/6 hover:border-violet-500/30 transition-all">
              <div className="text-3xl mb-3">{f.e}</div>
              <h3 className="font-bold text-lg mb-2">{f.t}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 max-w-4xl mx-auto mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Простые цены</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/8">
            <p className="text-3xl font-bold mb-1">Бесплатно</p>
            <p className="text-zinc-500 text-sm mb-6">50 Sparks при регистрации</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>✓ 5 000 слов текста</li>
              <li>✓ 5 мин аудио</li>
              <li>✓ Все жанры</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl border border-violet-500/40 bg-violet-900/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs font-bold">POPULAR</div>
            <p className="text-3xl font-bold mb-1">$9.99<span className="text-lg text-zinc-400">/мес</span></p>
            <p className="text-zinc-500 text-sm mb-6">Vibe-Pass</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>✓ Безлимит текста</li>
              <li>✓ 60 мин аудио/мес</li>
              <li>✓ Все функции</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-900/20">
            <p className="text-3xl font-bold mb-1">$19.99<span className="text-lg text-zinc-400">/мес</span></p>
            <p className="text-zinc-500 text-sm mb-6">Vibe-Pass Ultra</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>✓ Безлимит текста</li>
              <li>✓ 3 часа аудио/мес</li>
              <li>✓ Uncensored модели</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 max-w-2xl mx-auto mb-24 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border border-violet-500/20">
          <h2 className="text-3xl font-bold mb-4">Готов написать свою историю?</h2>
          <p className="text-zinc-400 mb-8">50 бесплатных Sparks. Без карты.</p>
          <Link href="/auth/signin" className="inline-block px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg hover:from-violet-500 hover:to-indigo-500 transition-all">
            Начать прямо сейчас ✨
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-zinc-600 text-sm">
        <p className="font-bold text-white mb-2">✨ VibeScribe</p>
        <p>© 2026 VibeScribe. Создано с ❤️ и Claude AI.</p>
      </footer>
    </div>
  );
}
