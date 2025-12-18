import { Wifi, Router, Server } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <Wifi className="w-6 h-6 text-primary" />
              </div> */}
              <div className="rounded-lg overflow-hidden w-12 h-12">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AIRBAND Customers Log Management</h1>
                <p className="text-xs text-muted-foreground">CLM</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Router className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Mikrotik</span>
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Server className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">RADIUS</span>
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
