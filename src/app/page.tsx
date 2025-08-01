import { Header } from "@/components/app/header";
import { PlantDoctor } from "@/components/app/plant-doctor";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      <Header />
      <main className="flex-grow w-full max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        <PlantDoctor />
      </main>
      <footer className="text-center p-6 md:p-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
        Được hỗ trợ bởi AI. Luôn tham khảo ý kiến chuyên gia cho các trường hợp quan trọng.
        <div className="flex gap-3 justify-center mt-1">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-primary transition-colors">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.406.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
