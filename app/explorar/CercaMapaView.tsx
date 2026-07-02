"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
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
    `<div style="${LABEL_STYLE}color:#fff;">Tu ubicación</div>` +
    `</div>`,
  iconAnchor: [9, 9], // centro del punto azul
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
    iconAnchor: [7, 7], // centro del punto dorado
    className: "",
  });
}

export type SucursalMapa = {
  restauranteNombre: string;
  restauranteSlug: string;
  sucursalNombre: string;
  lat: number;
  lng: number;
};

function CentrarEnUsuario({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export default function CercaMapaView({
  userLat,
  userLng,
  sucursales,
}: {
  userLat: number;
  userLng: number;
  sucursales: SucursalMapa[];
}) {
  return (
    <MapContainer
      center={[userLat, userLng]}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CentrarEnUsuario lat={userLat} lng={userLng} />

      {/* Área de 1.2 km */}
      <Circle
        center={[userLat, userLng]}
        radius={1200}
        pathOptions={{
          color: "#F2B84B",
          fillColor: "#F2B84B",
          fillOpacity: 0.06,
          weight: 1.5,
          opacity: 0.45,
        }}
      />

      {/* Marcador del usuario */}
      <Marker position={[userLat, userLng]} icon={userIcon} />

      {/* Marcadores de restaurantes */}
      {sucursales.map((s, i) => (
        <Marker key={i} position={[s.lat, s.lng]} icon={makeRestIcon(s.restauranteNombre)}>
          <Popup>
            <strong style={{ display: "block", marginBottom: 2 }}>{s.restauranteNombre}</strong>
            {s.sucursalNombre !== s.restauranteNombre && (
              <span style={{ display: "block", fontSize: "0.8em", marginBottom: 4 }}>
                {s.sucursalNombre}
              </span>
            )}
            <a
              href={`/explorar/${s.restauranteSlug}`}
              style={{ color: "#c87533", fontWeight: 700, fontSize: "0.85em" }}
            >
              Ver menú →
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
