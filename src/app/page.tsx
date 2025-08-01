import { Header } from "@/components/app/header";
import { PlantDoctor } from "@/components/app/plant-doctor";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      <Header />
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 md:p-8">
        <PlantDoctor />
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        Powered by AI. Always consult a professional for critical cases.
      </footer>
    </div>
  );
}
