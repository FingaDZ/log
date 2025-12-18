import { useEffect, useState } from 'react';

export function Header() {
  const [mikrotikOnline, setMikrotikOnline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const hostname = window.location.hostname;
        const response = await fetch(`http://${hostname}:3000/api/status`);
        const data = await response.json();
        setMikrotikOnline(data.mikrotik_online);
      } catch (error) {
        setMikrotikOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/mini square logo.jpg" alt="Logo" className="w-8 h-8 rounded" />
              <div>
                <h1 className="text-xl font-bold text-foreground">AIRBAND Customers Log Management</h1>
                <p className="text-xs text-muted-foreground">Connection Log Manager</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <span className="text-xs text-muted-foreground">Mikrotik</span>
              <div className={`w-2 h-2 rounded-full ${mikrotikOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <span className="text-xs text-muted-foreground">RADIUS</span>
              <div className="w-2 h-2 rounded-full bg-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
