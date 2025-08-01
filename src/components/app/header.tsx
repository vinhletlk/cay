'use client';

import { Leaf, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Header() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="bg-card/80 backdrop-blur-lg border-b shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-2 md:gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 shadow-inner">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                Bác sĩ Cây trồng
              </h1>
              <div className="text-sm text-muted-foreground font-medium mt-0.5">
                Chẩn đoán & tư vấn điều trị bệnh cây bằng AI
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Chuyển theme sáng/tối"
            onClick={toggleTheme}
            className="ml-2"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
