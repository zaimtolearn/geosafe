// src/components/AdminAnalytics.jsx
import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function AdminAnalytics({ reports }) {

    // --- DATA PROCESSING ENGINE ---
    const { categoryData, trendData, statusData } = useMemo(() => {
        if (!reports.length) return { categoryData: [], trendData: [], statusData: [] };

        // 1. Category Distribution
        const catMap = {};
        // 2. Status Breakdown
        const statMap = { Confirmed: 0, Unconfirmed: 0 };
        // 3. 7-Day Trend
        const trendMap = {};

        // Initialize last 7 days for the trend chart so empty days show as 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            trendMap[dateStr] = 0;
        }

        reports.forEach(report => {
            // Tally Categories
            catMap[report.category] = (catMap[report.category] || 0) + 1;

            // Tally Statuses
            const status = report.status === "Confirmed" ? "Confirmed" : "Unconfirmed";
            statMap[status]++;

            // Tally Dates for Trend
            if (report.timestamp) {
                const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
                const dateStr = rDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (trendMap[dateStr] !== undefined) {
                    trendMap[dateStr]++;
                }
            }
        });

        // Format for Recharts
        const formattedCategories = Object.keys(catMap).map(key => ({ name: key, value: catMap[key] }));
        const formattedTrends = Object.keys(trendMap).map(key => ({ date: key, Reports: trendMap[key] }));
        const formattedStatus = [
            { name: 'Pending (Unconfirmed)', count: statMap.Unconfirmed, fill: '#f59e0b' },
            { name: 'Verified (Confirmed)', count: statMap.Confirmed, fill: '#10b981' }
        ];

        return { categoryData: formattedCategories, trendData: formattedTrends, statusData: formattedStatus };
    }, [reports]);

    if (reports.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Not enough data to generate analytics.</div>;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>

            {/* CHART 1: 7-Day Trend (Line Chart) */}
            <div style={cardStyle}>
                <h3 style={titleStyle}>📈 7-Day Incident Trend</h3>
                <div style={{ height: '250px', width: '100%' }}>
                    <ResponsiveContainer>
                        <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="Reports" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 2: Category Breakdown (Donut Chart) */}
            <div style={cardStyle}>
                <h3 style={titleStyle}>📊 Incidents by Category</h3>
                <div style={{ height: '250px', width: '100%' }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 3: Verification Funnel (Bar Chart) */}
            <div style={cardStyle}>
                <h3 style={titleStyle}>✅ Verification Status</h3>
                <div style={{ height: '250px', width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                            <XAxis type="number" allowDecimals={false} hide />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                            <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}

const cardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const titleStyle = {
    margin: '0 0 20px 0',
    fontSize: '1.1rem',
    color: '#1f2937',
};