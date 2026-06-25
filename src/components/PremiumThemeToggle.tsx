'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function PremiumThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Determine initial theme
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Add transitioning class for smooth color morphing
    document.documentElement.classList.add('theme-transitioning');
    
    // Toggle class
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    
    // Save to localStorage
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);

    // Clean up transition class
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 450);
  };

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl bg-slate-900/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative group p-2.5 rounded-xl bg-slate-900/60 dark:bg-slate-950/60 hover:bg-slate-850 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm hover:shadow-indigo-500/10 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center"
      aria-label="Toggle Theme"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

      {/* Icons */}
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun className="w-4.5 h-4.5 text-amber-400 rotate-0 scale-100 transition-all duration-500 ease-out" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 -rotate-90 scale-100 transition-all duration-500 ease-out" />
        )}
      </div>
    </button>
  );
}
