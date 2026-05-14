// src/components/PublicStatsWidget.jsx
import { useState, useMemo } from 'react';

export default function PublicStatsWidget({ reports }) {
    const [isOpen, setIsOpen] = useState(false);

    // --- DATA PROCESSING ENGINE ---
    const stats = useMemo(() => {
        // 1. Filter out Unconfirmed (Public only sees Verified/Resolved)
        const verifiedStatuses = ["Verified by Admin", "Verified by Community", "Resolved", "Confirmed"];
        const publicReports = reports.filter(r => verifiedStatuses.includes(r.status));

        const activeReports = publicReports.filter(r => r.status !== "Resolved");
        const resolvedReports = publicReports.filter(r => r.status === "Resolved");

        // 2. Find the most common active danger
        const catCounts = {};
        activeReports.forEach(r => {
            catCounts[r.category] = (catCounts[r.category] || 0) + 1;
        });

        let topCategory = "None";
        let maxCount = 0;
        Object.entries(catCounts).forEach(([cat, count]) => {
            if (count > maxCount) { maxCount = count; topCategory = cat; }
        });

        // 3. Get Top 5 Most Recent
        const recent = [...publicReports].sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
            return timeB - timeA;
        }).slice(0, 5);

        return { totalActive: activeReports.length, totalResolved: resolvedReports.length, topCategory, recent };
    }, [reports]);

    // --- DYNAMIC SAFETY TIPS ---
    // The tip changes based on whatever the most common danger is right now!
    const safetyTips = {
        "Traffic": "🚗 High traffic incidents reported. Keep a safe following distance and use alternative routes if possible.",
        "Natural Hazard": "🌧️ Weather hazards active. Avoid low-lying areas and do not drive through flooded roads.",
        "Infrastructure": "🚧 Infrastructure issues detected. Watch your step around broken pavement and drive carefully over potholes.",
        "Security": "🛡️ Security alerts in the area. Stay in well-lit areas at night and travel in groups when possible.",
        "Environment": "🌳 Help keep the community safe. Do not burn open trash and report illegal dumping immediately.",
        "Other": "👀 Stay vigilant, be aware of your surroundings, and always prioritize your personal safety."
    };

    const currentTip = safetyTips[stats.topCategory] || safetyTips["Other"];
    // --- RESPONSIVE CSS HACKS ---
    // We use a quick trick to detect if we are on a narrow mobile screen
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

    // --- COLLAPSED VIEW (Floating Button) ---
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    // Move it higher on mobile so it doesn't overlap the Map Filters!
                    bottom: isMobile ? '80px' : '30px',
                    left: '20px',
                    zIndex: 1000,
                    backgroundColor: 'white', border: '1px solid #cbd5e1',
                    padding: '12px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    fontWeight: 'bold', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'transform 0.2s, bottom 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                📊 Public Transparency
            </button>
        );
    }

    // --- EXPANDED VIEW (Dashboard Panel) ---
    return (
        <div style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '30px',
            left: '20px',
            zIndex: 1000,
            backgroundColor: '#f8fafc', borderRadius: '16px',
            // Responsive Width: Use 340px on desktop, but shrink to fit the screen minus margins on mobile
            width: isMobile ? 'calc(100vw - 40px)' : '340px',
            maxWidth: '340px', // Never get bigger than this
            maxHeight: '75vh',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #cbd5e1',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>

            {/* HEADER */}
            <div style={{ padding: '15px 20px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Transparency Panel</h3>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ overflowY: 'auto', padding: '20px' }}>

                {/* 1. BASIC ANALYTICS */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '15px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ef4444', lineHeight: 1 }}>{stats.totalActive}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Hazards</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '15px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981', lineHeight: 1 }}>{stats.totalResolved}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>Resolved Issues</div>
                    </div>
                </div>

                {/* 2. DYNAMIC COMMUNITY SAFETY TIP */}
                <div style={{ backgroundColor: '#e0f2fe', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#0369a1', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💡 Safety Tip of the Day</h4>
                    <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.85rem', lineHeight: 1.4 }}>
                        {currentTip}
                    </p>
                </div>

                {/* 3. RECENT VERIFIED INCIDENTS */}
                <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.9rem' }}>Recent Activity</h4>
                    {stats.recent.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No recent activity to display.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats.recent.map(report => {
                                const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
                                const isResolved = report.status === "Resolved";

                                return (
                                    <div key={report.id} style={{ backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <strong style={{ fontSize: '0.85rem', color: isResolved ? '#94a3b8' : '#1e293b', textDecoration: isResolved ? 'line-through' : 'none', paddingRight: '8px', lineHeight: 1.2 }}>
                                                {report.title}
                                            </strong>
                                            <span style={{ fontSize: '0.65rem', padding: '3px 6px', borderRadius: '10px', backgroundColor: isResolved ? '#f1f5f9' : '#dcfce3', color: isResolved ? '#166534' : '#166534', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                {isResolved ? 'Resolved' : 'Verified'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{report.category}</span>
                                            <span>{rDate.toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}