import { Leaf } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Bác sĩ Cây trồng
          </h1>
        </div>
      </div>
    </header>
  );
}
