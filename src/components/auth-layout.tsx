import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white font-[var(--font-inter)] lg:grid-cols-[43.3%_minmax(0,1fr)]">
      <section className="relative z-10 flex min-h-screen border-r border-black/[0.09] bg-white px-6 py-12 sm:px-12 lg:px-16 lg:py-16">
        <div className="w-full max-w-[703px]">{children}</div>
      </section>
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#fcf9f4] lg:block" aria-hidden="true">
        <div className="absolute -left-24 top-[-18%] size-[620px] rounded-full bg-[#f2a130]/45 blur-[180px]" />
        <div className="absolute bottom-[-16%] right-[-8%] size-[680px] rounded-full bg-[#efc333]/35 blur-[190px]" />
        <div className="absolute right-[3%] top-[31%] h-[1420px] w-[760px] origin-top-left -skew-x-[14deg] overflow-hidden rounded-[16px] opacity-45 shadow-2xl">
          <div className="h-full w-full bg-[url('/dashboard-site-preview.png')] bg-[length:760px_auto] bg-top bg-no-repeat" />
        </div>
        <div className="absolute left-[15%] top-[11%] h-[1540px] w-[772px] origin-top-left -skew-x-[14deg] overflow-hidden rounded-[16px] shadow-[-7px_31px_69px_rgba(0,0,0,.10)]">
          <div className="h-full w-full bg-[url('/dashboard-site-preview.png')] bg-[length:772px_auto] bg-top bg-no-repeat" />
        </div>
      </aside>
    </main>
  );
}
