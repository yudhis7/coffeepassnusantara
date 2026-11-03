import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import type { Outlet } from '../data/outlets';
import { DEFAULT_CENTER } from '../data/outlets';

// Pin kedai: divIcon berbentuk tetes dengan ikon cangkir (tanpa file gambar eksternal)
const pinIcon = (active: boolean, open: boolean) =>
  L.divIcon({
    className: '',
    html: `<div class="pin ${active ? 'pin-active' : ''} ${open ? '' : 'pin-closed'}">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/></svg>
    </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    tooltipAnchor: [0, -38],
  });

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const zoom = Math.max(map.getZoom(), 15);
    // Di ponsel, panel detail menutup bagian bawah peta: geser pusat agar pin tampil di sepertiga atas
    const mobile = window.innerWidth < 900;
    const center = mobile
      ? map.unproject(map.project(target, zoom).add([0, map.getSize().y * 0.28]), zoom)
      : L.latLng(target);
    map.flyTo(center, zoom, { duration: 0.6 });
  }, [target, map]);
  return null;
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

interface Props {
  outlets: (Outlet & { openNow: boolean })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userPos: [number, number] | null;
  flyTarget: [number, number] | null;
}

export default function MapView({ outlets, selectedId, onSelect, userPos, flyTarget }: Props) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={14} className="map" zoomControl={false} data-testid="map">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <InvalidateOnResize />
      <FlyTo target={flyTarget} />
      {userPos && (
        <CircleMarker center={userPos} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2f6fdf', fillOpacity: 1 }}>
          <Tooltip>Lokasi kamu</Tooltip>
        </CircleMarker>
      )}
      {outlets.map((o) => (
        <Marker
          key={o.id}
          position={[o.lat, o.lng]}
          icon={pinIcon(o.id === selectedId, o.openNow)}
          eventHandlers={{ click: () => onSelect(o.id) }}
          zIndexOffset={o.id === selectedId ? 1000 : 0}
        >
          <Tooltip direction="top">{o.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
