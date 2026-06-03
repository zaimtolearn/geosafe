// src/components/AdvancedExportModal.jsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

export default function AdvancedExportModal({ isOpen, onClose, reports }) {
    const [dateRange, setDateRange] = useState('all');
    const [statusFilter, setStatusFilter] = useState('All');
    const [format, setFormat] = useState('CSV');

    if (!isOpen) return null;

    const handleDownload = () => {
        let filtered = [...(reports || [])];

        // Filter by Date
        if (dateRange !== 'all') {
            const days = parseInt(dateRange);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            filtered = filtered.filter(r => {
                if (!r.timestamp) return false;
                const rDate = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
                if (isNaN(rDate)) return false;
                return rDate >= cutoff;
            });
        }

        // Filter by Status
        if (statusFilter !== 'All') {
            if (statusFilter === 'Verified') {
                filtered = filtered.filter(r => r.status === 'Verified by Admin' || r.status === 'Verified by Community');
            } else {
                filtered = filtered.filter(r => r.status === statusFilter);
            }
        }

        if (filtered.length === 0) {
            alert("No reports match these filters. Please adjust your criteria.");
            return;
        }

        const dateString = new Date().toISOString().split('T')[0];

        // --- 1. CSV EXPORT ---
        if (format === 'CSV') {
            const headers = ["Report ID", "Date", "Time", "Category", "Title", "Status", "Address", "Latitude", "Longitude", "Reporter", "Upvotes", "Resolve Votes"];
            const csvRows = [headers.join(",")];

            filtered.forEach(report => {
                const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
                const isDateValid = !isNaN(rDate);

                const row = [
                    report.id,
                    isDateValid ? rDate.toLocaleDateString() : "N/A",
                    isDateValid ? rDate.toLocaleTimeString() : "N/A",
                    report.category,
                    `"${(report.title || "").replace(/"/g, '""')}"`,
                    report.status || "Unconfirmed",
                    `"${(report.address || "No Address Provided").replace(/"/g, '""')}"`,
                    report.location?.lat,
                    report.location?.lng,
                    `"${(report.userName || "Anonymous").replace(/"/g, '""')}"`,
                    report.confirmVotes || 0,
                    report.resolveVotes || 0
                ];
                csvRows.push(row.join(","));
            });

            const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
            triggerDownload(blob, `GeoSafe_Export_${dateString}.csv`);
        }

        // --- 2. JSON EXPORT ---
        else if (format === 'JSON') {
            const jsonReadyData = filtered.map(report => {
                let formattedDate = null;
                if (report.timestamp) {
                    const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
                    if (!isNaN(rDate)) formattedDate = rDate.toISOString();
                }
                return { ...report, timestamp: formattedDate };
            });

            const jsonData = JSON.stringify(jsonReadyData, null, 2);
            const blob = new Blob([jsonData], { type: "application/json" });
            triggerDownload(blob, `GeoSafe_Export_${dateString}.json`);
        }

        // --- 3. PDF EXPORT ---
        else if (format === 'PDF') {
            // Create a landscape document so wide tables fit better
            const doc = new jsPDF('landscape');

            // Add Title
            doc.setFontSize(18);
            doc.text("GeoSafe Analytics Report", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()} | Filter: ${statusFilter}`, 14, 30);

            // Define Table Columns
            const tableColumn = ["Date", "Category", "Title", "Status", "Reporter", "Votes (Y/N/R)"];
            const tableRows = [];

            // Add Data Rows
            filtered.forEach(report => {
                const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
                const isDateValid = !isNaN(rDate);

                const reportData = [
                    isDateValid ? rDate.toLocaleDateString() : "N/A",
                    report.category,
                    report.title || "N/A",
                    report.status || "Unconfirmed",
                    report.userName || "Anonymous",
                    `${report.confirmVotes || 0} / ${report.denyVotes || 0} / ${report.resolveVotes || 0}`
                ];
                tableRows.push(reportData);
            });

            // Generate Table (jspdf-autotable v5: pass doc as first argument)
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }, // Tailwind blue-500
                styles: { fontSize: 9 },
            });

            // Save PDF
            doc.save(`GeoSafe_Export_${dateString}.pdf`);
        }

        onClose();
    };

    const triggerDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📊 Export Data
                    </h2>
                    <button type="button" onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>
                    <div>
                        <label style={styles.label}>Timeframe</label>
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={styles.select}>
                            <option value="all">All Time</option>
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                    </div>

                    <div>
                        <label style={styles.label}>Report Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
                            <option value="All">All Statuses</option>
                            <option value="Verified">Verified Only (Admin + Community)</option>
                            <option value="Unconfirmed">Unconfirmed Only</option>
                            <option value="Resolved">Resolved Only</option>
                        </select>
                    </div>

                    <div>
                        <label style={styles.label}>File Format</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setFormat('CSV')}
                                style={format === 'CSV' ? styles.formatBtnActive : styles.formatBtn}
                            >
                                📄 CSV (Excel)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormat('JSON')}
                                style={format === 'JSON' ? styles.formatBtnActive : styles.formatBtn}
                            >
                                💻 JSON (Code)
                            </button>
                            {/* NEW PDF BUTTON */}
                            <button
                                type="button"
                                onClick={() => setFormat('PDF')}
                                style={format === 'PDF' ? { ...styles.formatBtnActive, borderColor: '#ef4444', backgroundColor: '#fef2f2', color: '#b91c1c' } : styles.formatBtn}
                            >
                                📕 PDF (Doc)
                            </button>
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                    <button type="button" onClick={handleDownload} style={styles.downloadBtn}>
                        ⬇️ Download File
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 },
    label: { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#f8fafc', color: '#1e293b', outline: 'none', cursor: 'pointer' },
    formatBtn: { flex: 1, padding: '10px 4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
    formatBtnActive: { flex: 1, padding: '10px 4px', borderRadius: '8px', border: '2px solid #3b82f6', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
    footer: { display: 'flex', gap: '10px', marginTop: '20px' },
    cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
    downloadBtn: { flex: 2, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }
};