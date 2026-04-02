// src/components/PublicStatsWidget.jsx
import { useState, useMemo } from 'react';

function PublicStatsWidget({ reports }) {
    const [isMinimized, setIsMinimized] = useState(false);

    // --- ANALYTICS ENGINE ---
    // We use useMemo so it only recalculates when 'reports' change
    const stats = useMemo(() => {
        if (!reports || reports.length === 0) {
            return { today: 0, topCategory: "None", verified: 0 };
        }

        const now = new Date();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        let todayCount = 0;
        let verifiedCount = 0;
        const categoryCounts = {};

        reports.forEach(report => {
            // 1. Calculate Reports from the last 24 hours
            const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
            if ((now - rDate) <= ONE_DAY) {
                todayCount++;
            }

            // 2. Count Verified Reports
            if (report.status === "Confirmed") {
                verifiedCount++;
            }

            // 3. Tally Categories to find the most common
            categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1;
        });

        // Find the category with the highest count
        let max = 0;
        let topCat = "None";
        for (const [cat, count] of Object.entries(categoryCounts)) {
            if (count > max) {
                max = count;
                topCat = cat;
            }
        }

        return { today: todayCount, topCategory: topCat, verified: verifiedCount };
    }, [reports]);

    // --- UI RENDER ---
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                style={{ ...styles.floatingContainer, padding: '10px 15px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                📊 Show Live Stats
            </button>
        );
    }

    return (
        <div style={styles.floatingContainer}>
            <div style={styles.header}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Area Safety Overview
                </h3>
                <button onClick={() => setIsMinimized(true)} style={styles.closeBtn}>—</button>
            </div>

            <div style={styles.statsGrid}>
                {/* Stat Box 1 */}
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>🚨</div>
                    <div style={styles.statData}>
                        <span style={styles.statValue}>{stats.today}</span>
                        <span style={styles.statLabel}>Active Today</span>
                    </div>
                </div>

                {/* Stat Box 2 */}
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>📌</div>
                    <div style={styles.statData}>
                        <span style={styles.statValue}>{stats.topCategory}</span>
                        <span style={styles.statLabel}>Top Issue</span>
                    </div>
                </div>

                {/* Stat Box 3 */}
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>✅</div>
                    <div style={styles.statData}>
                        <span style={styles.statValue}>{stats.verified}</span>
                        <span style={styles.statLabel}>Verified Fixes</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
                Stay alert and follow local authority guidelines.
            </div>
        </div>
    );
}

// --- PROFESSIONAL STYLING ---
const styles = {
    floatingContainer: {
        position: 'absolute',
        bottom: '30px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slight transparency
        backdropFilter: 'blur(10px)', // Glassmorphism effect
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        width: '280px',
        border: '1px solid rgba(255,255,255,0.4)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer',
        color: '#888'
    },
    statsGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    statBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '8px',
        gap: '12px'
    },
    statIcon: {
        fontSize: '1.5rem',
        backgroundColor: 'white',
        padding: '8px',
        borderRadius: '50%',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    statData: {
        display: 'flex',
        flexDirection: 'column'
    },
    statValue: {
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: '#333'
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    }
};

export default PublicStatsWidget;