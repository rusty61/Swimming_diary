import React from "react";

export function HeroIceBlue() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* top divider */}
      <div className="flex items-center gap-3 mb-6 text-[var(--accent)]">
        <span className="h-px w-12 bg-[var(--accent)]" />
        <span className="w-2 h-2 rounded-full bg-[var(--accent-soft)] shadow-[0_0_8px_rgba(123,215,255,0.8)]" />
        <span className="h-px w-12 bg-[var(--accent)]" />
      </div>

      <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl font-semibold mb-4">
        <span className="text-[var(--text-main)]">Calm </span>
        <span className="text-[var(--accent)] relative">
          Precision
          <span className="absolute left-0 right-0 -bottom-1 h-[3px] bg-gradient-to-r from-[var(--accent-soft)] via-[var(--accent)] to-transparent opacity-90" />
        </span>
      </h1>

      <p className="italic text-lg sm:text-xl text-[var(--text-muted)] mb-6">
        Cool-toned focus in a dark, cinematic interface.
      </p>

      <p className="max-w-2xl text-sm sm:text-base text-[var(--text-muted)] mb-10 leading-relaxed">
        Track training, mood, and recovery in a refined dark mode UI, accented by
        ice-blue highlights designed for clarity and low-light environments.
      </p>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <button className="px-8 py-3 text-sm font-semibold tracking-[0.14em] uppercase bg-[var(--accent)] text-black border border-[var(--accent-strong)] shadow-[0_14px_35px_rgba(0,0,0,0.7)] hover:bg-[var(--accent-strong)] transition">
          Open diary
        </button>
        <button className="px-8 py-3 text-sm font-semibold tracking-[0.14em] uppercase bg-transparent text-[var(--text-main)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition">
          View stats
        </button>
      </div>

      {/* bottom divider */}
      <div className="flex items-center gap-3 text-[var(--accent)]">
        <span className="h-px w-12 bg-[var(--accent)]" />
        <span className="w-2 h-2 rounded-full bg-[var(--accent-soft)] shadow-[0_0_8px_rgba(123,215,255,0.8)]" />
        <span className="h-px w-12 bg-[var(--accent)]" />
      </div>
    </section>
  );
}