"use client";

import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MARKER_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

type Props = {
  latitud: number;
  longitud: number;
  rangoKm: number;
};

export default function MapaRangoEnvio({ latitud, longitud, rangoKm }: Props) {
  const center: [number, number] = [latitud, longitud];
  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ height: "340px", width: "100%", borderRadius: "12px", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={center} icon={MARKER_ICON} />
      <Circle
        center={center}
        radius={rangoKm * 1000}
        pathOptions={{
          color: "#F2B84B",
          fillColor: "#F2B84B",
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.7,
        }}
      />
    </MapContainer>
  );
}
