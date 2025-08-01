import { Leaf } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Plant Doctor
          </h1>
        </div>
      </div>
    </header>
  );
}
