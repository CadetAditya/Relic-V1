import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapView({
  center = [28.6139, 77.2090], // default Delhi / India
  zoom = 13,
  recommendations = [],
  accountSummary = null,
  allAtms = [],
  highlightTop1Radius = true,
  className = "w-full h-[450px]"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView(center, zoom);

      // CartoDB Dark Matter tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers and Perimeters
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = [];

    // 1. Draw All City / Global ATMs if provided (gray subtle dots)
    if (allAtms && allAtms.length > 0) {
      allAtms.forEach((atm) => {
        const isRec = recommendations.some((r) => r.candidate_atm_id === atm.atm_id);
        if (!isRec) {
          const fraudColor =
            atm.fraud_intensity_ratio >= 0.10
              ? '#ef4444' // red
              : atm.fraud_intensity_ratio >= 0.05
              ? '#f59e0b' // amber
              : '#c5e48d'; // theme lime

          const icon = L.divIcon({
            className: 'custom-atm-marker',
            html: `
              <div style="background-color: ${fraudColor}; width: 10px; height: 10px; border-radius: 50%; opacity: 0.8; border: 1px solid white;"></div>
            `,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });

          const marker = L.marker([atm.latitude, atm.longitude], { icon });
          marker.bindPopup(`
            <div class="text-xs font-mono p-1">
              <strong style="color: #c5e48d;">${atm.atm_id}</strong> (${atm.bank_id})<br/>
              <span style="color: #95b8a5;">City:</span> ${atm.city}<br/>
              <span style="color: #95b8a5;">Total WDs:</span> ${atm.historical_withdrawals_count}<br/>
              <span style="color: #95b8a5;">Fraud Intensity:</span> ${(atm.fraud_intensity_ratio * 100).toFixed(1)}%
            </div>
          `);
          layerGroup.addLayer(marker);
        }
      });
    }

    // 2. Draw Account Reference Location (Last ATM Visited)
    if (accountSummary && accountSummary.last_atm_id && accountSummary.ref_latitude) {
      const lastLat = accountSummary.ref_latitude;
      const lastLon = accountSummary.ref_longitude;
      bounds.push([lastLat, lastLon]);

      const lastIcon = L.divIcon({
        className: 'custom-last-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: #eab308; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background: #eab308; color: #000; width: 20px; height: 20px; border-radius: 50%; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 0 10px #eab308;">
              L
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const lastMarker = L.marker([lastLat, lastLon], { icon: lastIcon });
      lastMarker.bindPopup(`
        <div class="text-xs font-mono p-1">
          <div class="font-bold text-amber-400 mb-1">LAST VISITED LOCATION</div>
          <div><strong>ATM:</strong> ${accountSummary.last_atm_id}</div>
          <div><strong>City:</strong> ${accountSummary.last_atm_city || accountSummary.registered_city}</div>
          <div><strong>Account:</strong> ${accountSummary.account_id}</div>
        </div>
      `);
      layerGroup.addLayer(lastMarker);
    }

    // 3. Draw Historical Centroid
    if (accountSummary && accountSummary.centroid_latitude && accountSummary.prior_withdrawals_count > 1) {
      const cLat = accountSummary.centroid_latitude;
      const cLon = accountSummary.centroid_longitude;
      bounds.push([cLat, cLon]);

      const centIcon = L.divIcon({
        className: 'custom-cent-marker',
        html: `
          <div style="background: #a855f7; color: #fff; width: 18px; height: 18px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 0 10px #a855f7;">
            <div style="transform: rotate(-45deg); font-size: 9px; font-weight: bold;">C</div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const centMarker = L.marker([cLat, cLon], { icon: centIcon });
      centMarker.bindPopup(`
        <div class="text-xs font-mono p-1">
          <div class="font-bold text-purple-400 mb-1">WITHDRAWAL CENTROID</div>
          <div>Center of ${accountSummary.prior_withdrawals_count} past cash extractions</div>
        </div>
      `);
      layerGroup.addLayer(centMarker);
    }

    // 4. Draw Top-K Predicted Recommendation Pins
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((rec, idx) => {
        const lat = rec.latitude;
        const lon = rec.longitude;
        bounds.push([lat, lon]);

        const isPrimary = rec.rank === 1;
        const color = isPrimary ? '#ef4444' : idx === 1 ? '#f97316' : '#3b82f6';
        const pulse = isPrimary
          ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${color}; opacity: 0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : '';

        const recIcon = L.divIcon({
          className: 'custom-rec-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              ${pulse}
              <div style="background: ${color}; color: #fff; width: 26px; height: 26px; border-radius: 50%; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 0 15px ${color};">
                #${rec.rank}
              </div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const recMarker = L.marker([lat, lon], { icon: recIcon });
        recMarker.bindPopup(`
          <div class="text-xs font-mono p-1">
            <div class="font-bold ${isPrimary ? 'text-red-400' : 'text-[#c5e48d]'} text-sm mb-1">
              ${rec.status_tag} (#${rec.rank})
            </div>
            <div><strong>ATM:</strong> ${rec.candidate_atm_id} (${rec.bank_id})</div>
            <div><strong>City:</strong> ${rec.city}</div>
            <div><strong>Distance:</strong> ${rec.distance_km} km</div>
            <div><strong>Calibrated Score:</strong> ${(rec.cal_score * 100).toFixed(1)}%</div>
            <div><strong>RF Probability:</strong> ${(rec.rf_prob * 100).toFixed(1)}%</div>
            <div class="mt-1 text-slate-300"><em>${rec.habit_tag}</em></div>
          </div>
        `);
        layerGroup.addLayer(recMarker);

        // Draw 3.0 km interception perimeter circle around Primary Intercept
        if (isPrimary && highlightTop1Radius) {
          const circle = L.circle([lat, lon], {
            radius: 3000, // 3 km radius
            color: '#ef4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ef4444',
            fillOpacity: 0.12,
            dashArray: '6, 6',
          });
          circle.bindPopup(`
            <div class="text-xs font-mono p-1">
              <strong class="text-red-400">ACTIVE PATROL PERIMETER</strong><br/>
              3.0 km emergency response radius around primary suspect intercept target.
            </div>
          `);
          layerGroup.addLayer(circle);
        }
      });
    }

    // Fit map bounds smoothly
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (err) {
        // fallback
      }
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, recommendations, accountSummary, allAtms, highlightTop1Radius]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
      <div ref={mapContainerRef} className={className} />
      
      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 shadow-lg pointer-events-auto">
        <div className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          SPATIAL RADAR LEGEND
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white text-[8px] font-bold text-white flex items-center justify-center">1</span>
            Primary Intercept
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white text-[8px] font-bold text-white flex items-center justify-center">2</span>
            Backup Perimeter 2
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 border border-white text-[8px] font-bold text-black flex items-center justify-center">L</span>
            Last Known ATM
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-purple-500 border border-white inline-block"></span>
            Past Centroid
          </div>
        </div>
      </div>
    </div>
  );
}

