'use client';

import React, { useEffect, useRef } from 'react';
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

export interface MapEvent {
  id: number;
  title: string;
  date?: string;
  location: string;
  attendees?: number;
  latitude?: number;
  longitude?: number;
}

interface MapViewProps {
  events: MapEvent[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function MapView({ events }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for events with coordinates
    events.forEach((event) => {
      if (event.latitude == null || event.longitude == null) return;

      const formattedTime = new Date(String(event.date)).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const marker = L.marker([event.latitude, event.longitude]).addTo(map);
      
      // If viewing map through single event page, zoom in on event and do not bind popup
      if (!event.date) {
        map.setView(marker.getLatLng(), 17); //Zoom level 17, ~8 times more zoomed than normal
        return;
      }

      marker.bindPopup(
        `<div style="min-width:180px">
          <strong style="font-size:14px">${escapeHtml(event.title)}</strong><br/>
          <span style="color:#666;font-size:12px">${escapeHtml(formattedTime)}</span><br/>
          <span style="color:#666;font-size:12px">${event.attendees} attending</span><br/>
          <a
            href="/dashboard/discovery/${event.id}"
            style="display:inline-block;margin-top:6px;padding:4px 12px;background:#ea580c;color:white;text-decoration:none;border-radius:6px;font-size:12px"
          >
            View Details
          </a>
        </div>`
      );

    });
  }, [events]);

  return (
    <div
      ref={mapRef}
      data-testid="map-container"
      style={{ width: '100%', height: '500px', borderRadius: '16px', position: 'sticky' }}
    />
  );
}
