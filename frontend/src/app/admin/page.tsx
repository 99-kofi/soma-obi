'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Activity,
    MessageSquare,
    TrendingUp,
    ArrowUpRight,
    BarChart3,
    LayoutDashboard,
    ShieldAlert
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { getAnalyticsSummary } from '@/lib/api';

const MOCK_DAILY_DATA = [
    { name: 'Mon', users: 400, interactions: 2400 },
    { name: 'Tue', users: 300, interactions: 1398 },
    { name: 'Wed', users: 200, interactions: 9800 },
    { name: 'Thu', users: 278, interactions: 3908 },
    { name: 'Fri', users: 189, interactions: 4800 },
    { name: 'Sat', users: 239, interactions: 3800 },
    { name: 'Sun', users: 349, interactions: 4300 },
];

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState({
        total_users: 0,
        active_users_today: 0,
        live_users: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const data = await getAnalyticsSummary();
                setMetrics(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Update ogni 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 glass-dark p-6 flex flex-col gap-8">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                        <ShieldAlert size={18} />
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">Admin<span className="text-red-500">Node</span></h2>
                </div>

                <nav className="flex flex-col gap-2">
                    <div className="px-4 py-2 bg-white/5 rounded-lg text-white flex items-center gap-3">
                        <LayoutDashboard size={18} className="text-red-500" />
                        <span>Overview</span>
                    </div>
                    <div className="px-4 py-2 hover:bg-white/5 rounded-lg text-white/50 flex items-center gap-3 transition-colors cursor-pointer">
                        <Users size={18} />
                        <span>Users</span>
                    </div>
                    <div className="px-4 py-2 hover:bg-white/5 rounded-lg text-white/50 flex items-center gap-3 transition-colors cursor-pointer">
                        <Activity size={18} />
                        <span>Activity</span>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold">Workspace Overview</h1>
                        <p className="text-white/40 mt-1">Real-time metrics for Blacko AI platform</p>
                    </div>
                    <div className="px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-red-500 uppercase tracking-widest">Live Monitoring</span>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard
                        title="Total Users"
                        value={metrics.total_users}
                        icon={<Users size={20} />}
                        trend="+12%"
                    />
                    <StatCard
                        title="DAU (Active Today)"
                        value={metrics.active_users_today}
                        icon={<Activity size={20} />}
                        trend="+5.4%"
                    />
                    <StatCard
                        title="Total Interactions"
                        value="14.2k"
                        icon={<MessageSquare size={20} />}
                        trend="+28%"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-dark rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp size={18} className="text-red-500" />
                                User Growth (7 Days)
                            </h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MOCK_DAILY_DATA}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="users" stroke="#ef4444" fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-dark rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <BarChart3 size={18} className="text-red-500" />
                                Interactions Volume
                            </h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={MOCK_DAILY_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="interactions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass-dark rounded-2xl p-6 border border-white/10 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {icon}
            </div>
            <p className="text-white/40 text-sm font-medium">{title}</p>
            <div className="flex items-end gap-3 mt-2">
                <h4 className="text-3xl font-bold">{value}</h4>
                <span className="text-xs text-red-500 flex items-center gap-1 mb-1.5 font-bold">
                    <ArrowUpRight size={14} />
                    {trend}
                </span>
            </div>
            <div className="h-1 w-full bg-white/5 mt-6 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 w-2/3" />
            </div>
        </motion.div>
    );
}
