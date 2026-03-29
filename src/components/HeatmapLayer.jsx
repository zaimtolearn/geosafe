// src/components/HeatmapLayer.jsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat'; // This attaches the heat plugin to Leaflet

export default function HeatmapLayer({ points }) {
    const map = useMap(); // Get direct access to the Leaflet map instance

    useEffect(() => {
        if (!points || points.length === 0) return;

        // 1. Convert our reports into the format the heatmap wants: [lat, lng, intensity]
        const heatData = points.map(report => [
            report.location.lat,
            report.location.lng,
            1 // Intensity weight (1 per report)
        ]);

        // 2. Create the Heatmap Layer
        const heatLayer = L.heatLayer(heatData, {
            radius: 25,     // How big each "blob" is
            blur: 15,       // How blurry the edges are
            maxZoom: 15,    // Zoom level where points stop blending
            gradient: {
                0.4: 'blue',
                0.6: 'lime',
                0.8: 'yellow',
                1.0: 'red' // Red = Highest density
            }
        }).addTo(map);

        // 3. Cleanup function (Removes the old heatmap when data changes so they don't stack)
        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null; // This component doesn't render HTML, it just draws on the map canvas
}