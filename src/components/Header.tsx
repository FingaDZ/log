import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export function Header() {
  const [mikrotikOnline, setMikrotikOnline] = useState(false);
  const location = useLocation();

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
              <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded" />
              <div>
                <h1 className="text-xl font-bold text-foreground">AIRBAND Customers Log Management</h1>
                <p className="text-xs text-muted-foreground">Connection Log Manager</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button
                variant={location.pathname === '/' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
              >
                Logs
              </Button>
            </Link>
            <Link to="/stats">
              <Button
                variant={location.pathname === '/stats' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Statistics
              </Button>
            </Link>
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
