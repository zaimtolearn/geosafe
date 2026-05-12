// src/components/AdminAnalytics.jsx
import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#64748b'];

export default function AdminAnalytics({ reports }) {

    // --- DATA PROCESSING ENGINE ---
    const { kpis, categoryData, trendData, statusData } = useMemo(() => {
        if (!reports.length) return { kpis: null, categoryData: [], trendData: [], statusData: [] };

        const catMap = {};
        const statMap = { "Unconfirmed": 0, "Verified by Community": 0, "Verified by Admin": 0 };
        const trendMap = {};
        let totalUpvotes = 0;
        let totalDownvotes = 0;

        // Initialize last 7 days for the trend chart
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            trendMap[dateStr] = 0;
        }

        reports.forEach(report => {
            // Normalize Status
            let status = report.status || "Unconfirmed";
            if (status === "Confirmed") status = "Verified by Admin"; // Handle legacy

            // Tally
            catMap[report.category] = (catMap[report.category] || 0) + 1;
            if (statMap[status] !== undefined) statMap[status]++;

            totalUpvotes += (report.confirmVotes || 0);
            totalDownvotes += (report.denyVotes || 0);

            // Trend
            if (report.timestamp) {
                const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
                const dateStr = rDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (trendMap[dateStr] !== undefined) trendMap[dateStr]++;
            }
        });

        // Calculate KPIs
        const totalVerified = statMap["Verified by Community"] + statMap["Verified by Admin"];
        const verificationRate = Math.round((totalVerified / reports.length) * 100) || 0;

        let topCategory = "None";
        let maxCatCount = 0;
        Object.entries(catMap).forEach(([cat, count]) => {
            if (count > maxCatCount) { maxCatCount = count; topCategory = cat; }
        });

        const trustScore = totalUpvotes + totalDownvotes === 0 ? 100 : Math.round((totalUpvotes / (totalUpvotes + totalDownvotes)) * 100);

        const kpis = {
            totalReports: reports.length,
            verificationRate: verificationRate,
            topCategory: topCategory,
            trustScore: trustScore
        };

        // Format for Recharts
        const formattedCategories = Object.keys(catMap).map(key => ({ name: key, value: catMap[key] })).sort((a, b) => b.value - a.value);
        const formattedTrends = Object.keys(trendMap).map(key => ({ date: key, Reports: trendMap[key] }));
        const formattedStatus = [
            { name: 'Pending', count: statMap["Unconfirmed"], fill: '#f87171' },
            { name: 'User Verified', count: statMap["Verified by Community"], fill: '#fbbf24' },
            { name: 'Admin Verified', count: statMap["Verified by Admin"], fill: '#34d399' }
        ];

        return { kpis, categoryData: formattedCategories, trendData: formattedTrends, statusData: formattedStatus };
    }, [reports]);

    if (!kpis) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Not enough data to generate analytics.</div>;
    }

    return (
        <div style={{ paddingBottom: '20px' }}>

            {/* --- TOP ROW: KPI CARDS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={kpiCardStyle}>
                    <div style={kpiLabelStyle}>Total Incidents</div>
                    <div style={kpiValueStyle}>{kpis.totalReports}</div>
                    <div style={kpiSubStyle}>System lifetime</div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={kpiLabelStyle}>Verification Rate</div>
                    <div style={kpiValueStyle}>{kpis.verificationRate}%</div>
                    <div style={kpiSubStyle}>Community + Admin</div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={kpiLabelStyle}>Primary Threat</div>
                    <div style={kpiValueStyle}>{kpis.topCategory}</div>
                    <div style={kpiSubStyle}>Highest volume category</div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={kpiLabelStyle}>Community Trust</div>
                    <div style={kpiValueStyle}>{kpis.trustScore}%</div>
                    <div style={kpiSubStyle}>Upvotes vs Downvotes</div>
                </div>
            </div>

            {/* --- CHARTS GRID --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

                {/* CHART 1: 7-Day Trend */}
                <div style={chartCardStyle}>
                    <h3 style={titleStyle}>📈 7-Day Threat Velocity</h3>
                    <div style={{ height: '280px', width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="Reports" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CHART 2: Verification Funnel */}
                <div style={chartCardStyle}>
                    <h3 style={titleStyle}>🛡️ Resolution Pipeline</h3>
                    <div style={{ height: '280px', width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" allowDecimals={false} hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} width={100} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={35}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CHART 3: Category Breakdown */}
                <div style={chartCardStyle}>
                    <h3 style={titleStyle}>🎯 Threat Distribution</h3>
                    <div style={{ height: '280px', width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value">
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- STYLING ---
const kpiCardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
};

const kpiLabelStyle = {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px'
};

const kpiValueStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: '1',
    marginBottom: '8px'
};

const kpiSubStyle = {
    fontSize: '0.8rem',
    color: '#94a3b8'
};

const chartCardStyle = {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const titleStyle = {
    margin: '0 0 20px 0',
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#1e293b',
};