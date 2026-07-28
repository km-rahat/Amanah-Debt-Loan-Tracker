export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#09090b] py-5 px-6 transition-colors duration-200" id="app-footer">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium">
          © {year} Amanah Financial Systems. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Status: Nominal
          </span>
          <span className="text-slate-300 dark:text-slate-800">|</span>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-slate-300 dark:text-slate-800">|</span>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
