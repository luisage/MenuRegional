"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Atitalaquia, Hidalgo — coordenadas de fallback
const ATITALAQUIA: [number, number] = [20.0667, -99.2167];

// Iconos del marcador via CDN (evita problemas con el bundler)
const MARKER_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Centra el mapa al montar: coordenadas guardadas → ubicación del usuario → Atitalaquia
function Inicializador({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.setView([lat, lng], 16);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 16),
      () => {} // sin permiso o error → permanece en Atitalaquia
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// Captura clics en el mapa para colocar el marcador
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

type Props = {
  latitud: number | null;
  longitud: number | null;
  onChange: (lat: number, lng: number) => void;
};

export default function MapaUbicacion({ latitud, longitud, onChange }: Props) {
  const position: [number, number] | null =
    latitud !== null && longitud !== null ? [latitud, longitud] : null;

  return (
    <MapContainer
      center={ATITALAQUIA}
      zoom={14}
      scrollWheelZoom
      style={{ height: "380px", width: "100%", borderRadius: "12px", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Inicializador lat={latitud} lng={longitud} />
      <ClickHandler onPick={onChange} />
      {position && (
        <Marker
          position={position}
          icon={MARKER_ICON}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng();
              onChange(lat, lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
