'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths broken by bundlers (webpack/Next.js)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Bath campus center coordinates
const BATH_CENTER: [number, number] = [51.3758, -2.3599];
const DEFAULT_ZOOM = 14;

var selectMarker = L.marker(BATH_CENTER);

export default function MapSelect() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(BATH_CENTER, DEFAULT_ZOOM);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Create marker on click and pass back chosen coordinates
    map.on('click', function(e){
        if (selectMarker != undefined) map.removeLayer(selectMarker);
        selectMarker.setLatLng(e.latlng).addTo(map);
        setChanged(prev => !prev);
    });
  }, []);

  return (
    <div
      ref={mapRef}
      data-testid="map-container"
      style={{ width: '100%', height: '500px', borderRadius: '16px', position: 'sticky' }}
    >
        {mapInstanceRef.current?.hasLayer(selectMarker) ? <input type="hidden" name="lat" id="lat" value={selectMarker.getLatLng().lat} /> : ''}
        {mapInstanceRef.current?.hasLayer(selectMarker) ? <input type="hidden" name="lng" id="lng" value={selectMarker.getLatLng().lng} /> : ''}
    </div>
  );
}
