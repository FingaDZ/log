import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Globe, Activity } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D', '#C084FC', '#34D399'];

export default function Stats() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading } = useQuery({
        queryKey: ['stats', selectedDate],
        queryFn: async () => {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3000/api/stats?date=${selectedDate}`);
            return response.json();
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading statistics...</div>
                </main>
            </div>
        );
    }

    const topUsers = data?.top_users || [];
    const protocols = data?.protocols || [];
    const topDestinations = data?.top_destinations || [];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 space-y-6">
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">Statistics Dashboard</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <Label htmlFor="statsDate" className="text-sm text-muted-foreground">Date:</Label>
                            <Input
                                id="statsDate"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-40 bg-input border-border"
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Users</p>
                                    <p className="text-2xl font-bold text-foreground">{topUsers.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                            <div className="flex items-center gap-3">
                                <Globe className="w-8 h-8 text-accent" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Unique Destinations</p>
                                    <p className="text-2xl font-bold text-foreground">{topDestinations.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                            <div className="flex items-center gap-3">
                                <Activity className="w-8 h-8 text-success" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Protocols</p>
                                    <p className="text-2xl font-bold text-foreground">{protocols.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Users Chart */}
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Top 10 Users</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topUsers}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="user" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Bar dataKey="count" fill="#0EA5E9" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Protocol Distribution */}
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Protocol Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={protocols}
                                        dataKey="count"
                                        nameKey="protocol"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {protocols.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Destinations */}
                        <div className="bg-card/50 rounded-lg p-4 border border-border lg:col-span-2">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Top 10 Destination IPs</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topDestinations} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis dataKey="dest_ip" type="category" stroke="#9CA3AF" fontSize={12} width={120} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Bar dataKey="count" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
