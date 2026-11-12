import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Leaflet tile providers using OpenStreetMap data
const TILE_PROVIDERS = {
  osm: {
    name: '🗺️ OpenStreetMap',
    // CartoDB Voyager uses official OpenStreetMap data, globally distributed via Cloudflare CDN (No 403 blocks on localhost)
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  osmHot: {
    name: '🧭 OSM Street',
    // OpenStreetMap France / Humanitarian OSM layer with Indian road names
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  dark: {
    name: '🌙 Dark Grid',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
  },
};

export default function MapView({
  center = [31.3260, 75.5762], // default Jalandhar, Punjab, India
  zoom = 13,
  recommendations = [],
  accountSummary = null,
  allAtms = [],
  highlightTop1Radius = true,
  className = "w-full h-[520px]",
  defaultTileMode = 'osm', // default to OpenStreetMap Street view
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [activeTileMode, setActiveTileMode] = useState(defaultTileMode);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(center, zoom);

      // Create primary tile layer with automatic fallback to prevent blank maps
      const provider = TILE_PROVIDERS[activeTileMode] || TILE_PROVIDERS.osm;
      const tileLayer = L.tileLayer(provider.url, {
        maxZoom: provider.maxZoom,
        attribution: provider.attribution,
        subdomains: provider.subdomains || 'abcd',
      });

      // Automated error recovery: fallback if a tile server is rate-limited or blocked
      tileLayer.on('tileerror', (error) => {
        const tile = error.tile;
        if (!tile.dataset.retried) {
          tile.dataset.retried = 'true';
          const coords = error.coords;
          const sub = ['a', 'b', 'c', 'd'][Math.abs(coords.x + coords.y) % 4];
          tile.src = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${coords.z}/${coords.x}/${coords.y}.png`;
        }
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size on mount and delays to ensure tiles fill the container completely
      map.invalidateSize();
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 500);

      // Resize observer to handle dynamic layout adjustments
      let resizeObserver = null;
      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (resizeObserver) resizeObserver.disconnect();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Handle Tile Provider Switch (OpenStreetMap vs Dark Mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const provider = TILE_PROVIDERS[activeTileMode] || TILE_PROVIDERS.osm;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
      subdomains: provider.subdomains || 'abcd',
    });

    newTileLayer.on('tileerror', (error) => {
      const tile = error.tile;
      if (!tile.dataset.retried) {
        tile.dataset.retried = 'true';
        const coords = error.coords;
        const sub = ['a', 'b', 'c', 'd'][Math.abs(coords.x + coords.y) % 4];
        tile.src = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${coords.z}/${coords.x}/${coords.y}.png`;
      }
    });

    newTileLayer.addTo(map);
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [activeTileMode]);

  // Update Markers, Regional ATMs, and Perimeters
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = [];

    // 1. Draw All Regional ATMs on OpenStreetMap
    if (allAtms && allAtms.length > 0) {
      allAtms.forEach((atm) => {
        const isRec = recommendations.some((r) => r.candidate_atm_id === atm.atm_id);
        if (!isRec && atm.latitude && atm.longitude) {
          bounds.push([atm.latitude, atm.longitude]);

          const ratio = atm.fraud_intensity_ratio || 0;
          const fraudColor =
            ratio >= 0.20
              ? '#dc2626' // Red: Critical Hotspot (>20%)
              : ratio >= 0.10
              ? '#ea580c' // Orange: Elevated (10-20%)
              : ratio >= 0.05
              ? '#ca8a04' // Yellow: Moderate (5-10%)
              : '#16a34a'; // Green: Standard Monitored (<5%)

          const icon = L.divIcon({
            className: 'custom-atm-marker',
            html: `
              <div style="
                background-color: ${fraudColor};
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2.5px solid #ffffff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                cursor: pointer;
              "></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const marker = L.marker([atm.latitude, atm.longitude], { icon });
          marker.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; padding: 6px; color: #ffffff; min-width: 190px;">
              <div style="font-weight: 800; font-size: 12px; color: #c5e48d; margin-bottom: 3px;">
                ${atm.atm_id} <span style="font-size: 10px; color: #95b8a5;">(${atm.bank_id})</span>
              </div>
              <div style="color: #cbd5e1; font-size: 10px; margin-bottom: 5px;">
                📍 ${atm.city}, Punjab, India
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #ffffff;">
                <span style="color: #cbd5e1;">Total Withdrawals:</span>
                <strong style="color: #ffffff;">${atm.historical_withdrawals_count || atm.total_withdrawals || 0}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #ffffff;">
                <span style="color: #cbd5e1;">Fraud Intensity:</span>
                <strong style="color: ${fraudColor}; font-weight: 800;">${(ratio * 100).toFixed(1)}%</strong>
              </div>
              <div style="text-align: center; margin-top: 4px; padding: 4px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; background: ${fraudColor}25; color: #ffffff; border: 1px solid ${fraudColor};">
                ${ratio >= 0.20 ? 'CRITICAL RED HOTSPOT' : ratio >= 0.10 ? 'ELEVATED ORANGE HOTSPOT' : ratio >= 0.05 ? 'MODERATE YELLOW HOTSPOT' : 'STANDARD MONITORED'}
              </div>
            </div>
          `);
          layerGroup.addLayer(marker);
        }
      });
    }

    // 2. Draw Account Reference Location (Last ATM Visited by Suspect)
    if (accountSummary && accountSummary.last_atm_id && accountSummary.ref_latitude) {
      const lastLat = accountSummary.ref_latitude;
      const lastLon = accountSummary.ref_longitude;
      bounds.push([lastLat, lastLon]);

      const lastIcon = L.divIcon({
        className: 'custom-last-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: #eab308; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background: #eab308; color: #183a2e; width: 22px; height: 22px; border-radius: 50%; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
              L
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const lastMarker = L.marker([lastLat, lastLon], { icon: lastIcon, zIndexOffset: 800 });
      lastMarker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; padding: 6px; color: #ffffff; min-width: 190px;">
          <div style="font-weight: 800; color: #facc15; margin-bottom: 4px; font-size: 12px;">SUSPECT'S LAST VISITED ATM</div>
          <div style="color: #ffffff; margin-bottom: 2px;"><strong style="color: #ffffff;">ATM:</strong> <span style="color: #ffffff;">${accountSummary.last_atm_id}</span></div>
          <div style="color: #ffffff; margin-bottom: 2px;"><strong style="color: #ffffff;">Region:</strong> <span style="color: #ffffff;">${accountSummary.last_atm_city || accountSummary.registered_city}, India</span></div>
          <div style="color: #ffffff;"><strong style="color: #ffffff;">Account:</strong> <span style="color: #ffffff;">${accountSummary.account_id}</span></div>
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
          <div style="background: #9333ea; color: #fff; width: 18px; height: 18px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
            <div style="transform: rotate(-45deg); font-size: 9px; font-weight: bold;">C</div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const centMarker = L.marker([cLat, cLon], { icon: centIcon, zIndexOffset: 700 });
      centMarker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; padding: 6px; color: #ffffff; min-width: 190px;">
          <div style="font-weight: 800; color: #c084fc; margin-bottom: 4px; font-size: 12px;">HISTORICAL WITHDRAWAL CENTROID</div>
          <div style="color: #ffffff;">Centroid of ${accountSummary.prior_withdrawals_count} past cash extractions in this region.</div>
        </div>
      `);
      layerGroup.addLayer(centMarker);
    }

    // 4. Draw Top-3 Predicted Interception ATM Pins
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((rec) => {
        const lat = rec.latitude;
        const lon = rec.longitude;
        bounds.push([lat, lon]);

        // Anti-collision offset for ATMs within 60 meters of each other so all 3 badges (#1, #2, #3) are distinct
        let displayLat = lat;
        let displayLon = lon;
        const isClustered = recommendations.some(
          (other) => other.rank < rec.rank && Math.hypot(other.latitude - lat, other.longitude - lon) < 0.0008
        );

        const isPrimary = rec.rank === 1;
        const color = isPrimary ? '#dc2626' : rec.rank === 2 ? '#ea580c' : '#2563eb';

        if (isClustered) {
          // Offset position slightly by ~40-60 meters so badges don't cover each other
          const angle = rec.rank === 2 ? (-Math.PI * 0.35) : (Math.PI * 0.7);
          const offsetDist = 0.0006;
          displayLat = lat + Math.sin(angle) * offsetDist;
          displayLon = lon + Math.cos(angle) * offsetDist;

          // Connecting leader line to ground position
          const leaderLine = L.polyline(
            [[lat, lon], [displayLat, displayLon]],
            { color: color, weight: 2, dashArray: '4, 4', opacity: 0.85 }
          );
          layerGroup.addLayer(leaderLine);

          // Ground target anchor dot
          const groundDot = L.circleMarker([lat, lon], {
            radius: 5,
            color: '#ffffff',
            fillColor: color,
            fillOpacity: 1,
            weight: 2,
          });
          layerGroup.addLayer(groundDot);
        }

        const pulse = isPrimary
          ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${color}; opacity: 0.45; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : '';

        const recIcon = L.divIcon({
          className: 'custom-rec-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              ${pulse}
              <div style="background: ${color}; color: #ffffff; width: 32px; height: 32px; border-radius: 50%; font-size: 13px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
                #${rec.rank}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const recMarker = L.marker([displayLat, displayLon], { icon: recIcon, zIndexOffset: 1200 - rec.rank });
        recMarker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 6px; color: #ffffff; min-width: 230px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 5px; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">
              <span style="font-weight: 900; font-size: 12px; color: ${color};">
                #${rec.rank} ${rec.status_tag}
              </span>
              <span style="background: ${color}33; color: #ffffff; border: 1px solid ${color}; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: bold;">
                ${(rec.cal_score * 100).toFixed(1)}% SCORE
              </span>
            </div>
            <div style="margin-bottom: 3px; color: #ffffff;">
              <strong style="color: #ffffff;">ATM:</strong> <span style="color: #ffffff;">${rec.candidate_atm_id} (${rec.bank_id})</span>
            </div>
            <div style="margin-bottom: 3px; color: #ffffff;">
              <strong style="color: #ffffff;">City:</strong> <span style="color: #ffffff;">${rec.city}, Punjab, India</span>
            </div>
            <div style="margin-bottom: 3px; color: #ffffff;">
              <strong style="color: #ffffff;">Distance:</strong> <span style="color: #ffffff;">${rec.distance_km} km from last known position</span>
            </div>
            <div style="margin-bottom: 3px; color: #ffffff;">
              <strong style="color: #ffffff;">Habit:</strong> <span style="color: #ffffff;">${rec.habit_tag}</span>
            </div>
            <div style="margin-bottom: 3px; color: #ffffff;">
              <strong style="color: #ffffff;">RF Model Prob:</strong> <span style="color: #ffffff;">${(rec.rf_prob * 100).toFixed(1)}%</span>
            </div>
            <div style="margin-top: 8px; padding: 5px 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 6px; font-size: 10px; color: #ffffff; font-weight: 500;">
              Coordinates: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E
            </div>
          </div>
        `);
        layerGroup.addLayer(recMarker);

        // Draw 3.0 km Emergency Interception Perimeter Circle around Top 1 Target
        if (isPrimary && highlightTop1Radius) {
          const circle = L.circle([lat, lon], {
            radius: 3000, // 3 km radius
            color: '#dc2626',
            weight: 2.5,
            opacity: 0.9,
            fillColor: '#dc2626',
            fillOpacity: 0.12,
            dashArray: '6, 6',
          });
          circle.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; padding: 6px; color: #ffffff;">
              <strong style="color: #f87171; font-size: 12px;">3.0 KM EMERGENCY PATROL PERIMETER</strong><br/>
              <span style="color: #ffffff;">High-priority interception zone centered at ${rec.candidate_atm_id} (${rec.city}, India).</span>
            </div>
          `);
          layerGroup.addLayer(circle);
        }
      });
    }

    // Fit map bounds smoothly
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch (err) {
        if (center) map.setView(center, zoom);
      }
    } else if (center) {
      map.setView(center, zoom);
    }

    setTimeout(() => map.invalidateSize(), 150);
  }, [center, zoom, recommendations, accountSummary, allAtms, highlightTop1Radius]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#2e6250] bg-slate-100 shadow-xl">
      <div ref={mapContainerRef} className={className} />

      {/* Top Right: OpenStreetMap Layer Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        <div className="bg-[#183a2e]/95 backdrop-blur-md border border-[#2e6250] rounded-xl p-1 shadow-lg flex items-center gap-1 font-mono text-[10px]">
          <button
            onClick={() => setActiveTileMode('osm')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              activeTileMode === 'osm'
                ? 'bg-[#c5e48d] text-[#183a2e] shadow'
                : 'text-[#95b8a5] hover:text-white'
            }`}
          >
            🗺️ OpenStreetMap
          </button>
          <button
            onClick={() => setActiveTileMode('osmHot')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              activeTileMode === 'osmHot'
                ? 'bg-[#c5e48d] text-[#183a2e] shadow'
                : 'text-[#95b8a5] hover:text-white'
            }`}
          >
            🧭 OSM Street
          </button>
          <button
            onClick={() => setActiveTileMode('dark')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              activeTileMode === 'dark'
                ? 'bg-[#c5e48d] text-[#183a2e] shadow'
                : 'text-[#95b8a5] hover:text-white'
            }`}
          >
            🌙 Dark
          </button>
        </div>
      </div>

      {/* Bottom Left: Spatial Radar Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#183a2e]/95 backdrop-blur-md border border-[#2e6250] rounded-xl p-3 text-[11px] font-mono text-[#cfe0d5] shadow-2xl pointer-events-auto max-w-xs">
        <div className="font-bold text-white mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#c5e48d] animate-pulse"></span>
            OPENSTREETMAP RADAR
          </span>
          <span className="text-[9px] text-[#95b8a5] font-normal">PUNJAB, INDIA</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white text-[8px] font-bold text-white flex items-center justify-center shrink-0">
              1
            </span>
            <span>Primary Target (#1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-600 border border-white text-[8px] font-bold text-white flex items-center justify-center shrink-0">
              2
            </span>
            <span>Secondary Target (#2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white shrink-0"></span>
            <span>Red Hotspot (&gt;20%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-white shrink-0"></span>
            <span>Orange (10-20%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 border border-white shrink-0"></span>
            <span>Yellow (5-10%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-green-600 border border-white shrink-0"></span>
            <span>Monitored ATM (&lt;5%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
