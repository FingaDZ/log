import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, Wifi, Database, Settings, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

export function Header() {
  const [mikrotikOnline, setMikrotikOnline] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const hostname = window.location.hostname;
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://${hostname}:3000/api/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setMikrotikOnline(data.mikrotik_online);
      } catch (error) {
        setMikrotikOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const hostname = window.location.hostname;
      const token = localStorage.getItem('auth_token');
      await fetch(`http://${hostname}:3000/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      // Ignore error, logout anyway
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {!logoError ? (
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-8 h-8 rounded object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                  <Wifi className="w-4 h-4 text-primary" />
                </div>
              )}
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
            <Link to="/monitoring">
              <Button
                variant={location.pathname === '/monitoring' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
              >
                <Database className="w-3 h-3 mr-1" />
                Monitoring
              </Button>
            </Link>
            {role === 'admin' && (
              <Link to="/settings">
                <Button
                  variant={location.pathname === '/settings' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Settings
                </Button>
              </Link>
            )}
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
