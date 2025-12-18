import { SearchFilters as SearchFiltersType } from '@/types/connection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw, Wifi } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function SearchFilters({ filters, onFiltersChange, onSearch, onReset }: SearchFiltersProps) {
  const updateFilter = (key: keyof SearchFiltersType, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20 glow-primary">
          <Wifi className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Connection Reports</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-muted-foreground text-sm">Username</Label>
          <Input
            id="username"
            placeholder="e.g. client001"
            value={filters.username}
            onChange={(e) => updateFilter('username', e.target.value)}
            className="bg-input border-border font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourceIp" className="text-muted-foreground text-sm">Source IP</Label>
          <Input
            id="sourceIp"
            placeholder="e.g. 192.168.1.100"
            value={filters.sourceIp}
            onChange={(e) => updateFilter('sourceIp', e.target.value)}
            className="bg-input border-border font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourcePort" className="text-muted-foreground text-sm">Source Port</Label>
          <Input
            id="sourcePort"
            placeholder="e.g. 54321"
            value={filters.sourcePort}
            onChange={(e) => updateFilter('sourcePort', e.target.value)}
            className="bg-input border-border font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationIp" className="text-muted-foreground text-sm">Destination IP</Label>
          <Input
            id="destinationIp"
            placeholder="e.g. 8.8.8.8"
            value={filters.destinationIp}
            onChange={(e) => updateFilter('destinationIp', e.target.value)}
            className="bg-input border-border font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationPort" className="text-muted-foreground text-sm">Destination Port</Label>
          <Input
            id="destinationPort"
            placeholder="e.g. 443"
            value={filters.destinationPort}
            onChange={(e) => updateFilter('destinationPort', e.target.value)}
            className="bg-input border-border font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="protocol" className="text-muted-foreground text-sm">Protocol</Label>
          <Select value={filters.protocol} onValueChange={(value) => updateFilter('protocol', value)}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any">Any</SelectItem>
              <SelectItem value="TCP">TCP</SelectItem>
              <SelectItem value="UDP">UDP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-muted-foreground text-sm">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="bg-input border-border text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-muted-foreground text-sm">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="bg-input border-border text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromTime" className="text-muted-foreground text-sm">From Time</Label>
          <Input
            id="fromTime"
            type="time"
            value={filters.fromTime}
            onChange={(e) => updateFilter('fromTime', e.target.value)}
            className="bg-input border-border text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toTime" className="text-muted-foreground text-sm">To Time</Label>
          <Input
            id="toTime"
            type="time"
            value={filters.toTime}
            onChange={(e) => updateFilter('toTime', e.target.value)}
            className="bg-input border-border text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onSearch} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        <Button onClick={onReset} variant="outline" className="border-border hover:bg-secondary">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
