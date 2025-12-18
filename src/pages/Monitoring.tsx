import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Database, HardDrive, AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Monitoring() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['monitoring'],
        queryFn: async () => {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3000/api/monitoring`);
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3000/api/delete-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                    confirm_token: 'DELETE_CONFIRMED'
                })
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring'] });
            setShowDeleteConfirm(false);
            setStartDate('');
            setEndDate('');
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading monitoring data...</div>
                </main>
            </div>
        );
    }

    const summary = data?.summary || {};
    const alerts = data?.alerts || {};
    const diskSpace = data?.disk_space;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 space-y-6">
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                            <Database className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Database Monitoring</h1>
                    </div>

                    {/* Alerts */}
                    {(alerts.db_size_critical || alerts.db_size_warning || alerts.disk_space_warning) && (
                        <div className="mb-6 space-y-2">
                            {alerts.db_size_critical && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Critical: Database size exceeds 5GB ({summary.total_size_mb}MB). Consider archiving old logs.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {alerts.db_size_warning && !alerts.db_size_critical && (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Warning: Database size exceeds 1GB ({summary.total_size_mb}MB).
                                    </AlertDescription>
                                </Alert>
                            )}
                            {alerts.disk_space_warning && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Disk space critical: {diskSpace?.use_percent} used.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                            <div className="flex items-center gap-3">
                                <Database className="w-8 h-8 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Tables</p>
                                    <p className="text-2xl font-bold text-foreground">{summary.total_tables || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                            <div className="flex items-center gap-3">
                                <HardDrive className="w-8 h-8 text-accent" />
                                <div>
                                    <p className="text-sm text-muted-foreground">DB Size</p>
                                    <p className="text-2xl font-bold text-foreground">{summary.total_size_mb || 0} MB</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                            <div className="flex items-center gap-3">
                                <Database className="w-8 h-8 text-success" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Rows</p>
                                    <p className="text-2xl font-bold text-foreground">{summary.total_rows?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </div>
                        {diskSpace && (
                            <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                                <div className="flex items-center gap-3">
                                    <HardDrive className="w-8 h-8 text-warning" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Disk Usage</p>
                                        <p className="text-2xl font-bold text-foreground">{diskSpace.use_percent}</p>
                                        <p className="text-xs text-muted-foreground">{diskSpace.used} / {diskSpace.total}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Batch Deletion */}
                    <div className="bg-card/50 rounded-lg p-6 border border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-destructive" />
                            Batch Delete Logs
                        </h3>

                        <Alert className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Warning: This action is irreversible. Make sure logs are archived before deletion.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-input border-border"
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-input border-border"
                                />
                            </div>
                        </div>

                        {!showDeleteConfirm ? (
                            <Button
                                onClick={() => setShowDeleteConfirm(true)}
                                variant="outline"
                                disabled={!startDate || !endDate}
                                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Logs
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Are you sure you want to delete logs from {startDate} to {endDate}?
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => deleteMutation.mutate()}
                                        variant="destructive"
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                                    </Button>
                                    <Button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tables List */}
                    <div className="bg-card/50 rounded-lg p-6 border border-border mt-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Log Tables</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 text-muted-foreground">Table Name</th>
                                        <th className="text-right py-2 text-muted-foreground">Size (MB)</th>
                                        <th className="text-right py-2 text-muted-foreground">Rows</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.tables?.map((table: any) => (
                                        <tr key={table.TABLE_NAME} className="border-b border-border/30">
                                            <td className="py-2 font-mono text-xs">{table.TABLE_NAME}</td>
                                            <td className="text-right py-2">{table.size_mb}</td>
                                            <td className="text-right py-2">{table.row_count?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
