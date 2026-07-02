"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LABEL_STYLE =
  "background:rgba(20,16,13,0.88);padding:2px 7px;border-radius:4px;" +
  "white-space:nowrap;font-family:system-ui,sans-serif;font-size:10px;" +
  "font-weight:700;letter-spacing:0.02em;max-width:130px;overflow:hidden;" +
  "text-overflow:ellipsis;border:1px solid rgba(255,255,255,0.12);pointer-events:none;";

const userIcon = new L.DivIcon({
  html:
    `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">` +
    `<div style="width:18px;height:18px;flex-shrink:0;background:#3B82F6;border:3px solid #fff;` +
    `border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.55)"></div>` +
    `<div style="${LABEL_STYLE}color:#fff;">Tu domicilio</div>` +
    `</div>`,
  iconAnchor: [9, 9],
  className: "",
});

function makeRestIcon(nombre: string) {
  return new L.DivIcon({
    html:
      `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">` +
      `<div style="width:14px;height:14px;flex-shrink:0;background:#F2B84B;border:2px solid #14100D;` +
      `border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></div>` +
      `<div style="${LABEL_STYLE}color:#F2B84B;border-color:rgba(242,184,75,0.3);">${escapeHtml(nombre)}</div>` +
      `</div>`,
    iconAnchor: [7, 7],
    className: "",
  });
}

function FitBounds({
  sucursalLat, sucursalLng, userLat, userLng,
}: {
  sucursalLat: number; sucursalLng: number; userLat: number; userLng: number;
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(
      [sucursalLat, sucursalLng],
      [userLat, userLng],
    );
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, sucursalLat, sucursalLng, userLat, userLng]);
  return null;
}

type Props = {
  sucursalNombre: string;
  sucursalLat: number;
  sucursalLng: number;
  rangoKm: number;
  userLat: number;
  userLng: number;
};

export default function RangoEnvioMapView({
  sucursalNombre, sucursalLat, sucursalLng, rangoKm, userLat, userLng,
}: Props) {
  const restIcon = makeRestIcon(sucursalNombre);

  return (
    <MapContainer
      center={[sucursalLat, sucursalLng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds
        sucursalLat={sucursalLat}
        sucursalLng={sucursalLng}
        userLat={userLat}
        userLng={userLng}
      />
      <Circle
        center={[sucursalLat, sucursalLng]}
        radius={rangoKm * 1000}
        pathOptions={{
          color: "#F2B84B",
          fillColor: "#F2B84B",
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.7,
        }}
      />
      <Marker position={[sucursalLat, sucursalLng]} icon={restIcon} />
      <Marker position={[userLat, userLng]} icon={userIcon} />
    </MapContainer>
  );
}
