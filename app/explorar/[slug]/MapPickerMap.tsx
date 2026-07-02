"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const goldIcon = new L.DivIcon({
  html: `<span style="display:block;width:20px;height:20px;background:#F2B84B;border:3px solid #14100D;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.5)"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: "",
});

function ClickHandler({ onSelect, disabled }: { onSelect: (lat: number, lng: number) => void; disabled: boolean }) {
  useMapEvents({
    click(e) {
      if (!disabled) onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    map.flyTo(center, map.getZoom(), { duration: 0.8 });
  }, [center, map]);
  return null;
}

type Props = {
  lat: number | null;
  lng: number | null;
  defaultCenter: [number, number];
  onSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
};

export default function MapPickerMap({ lat, lng, defaultCenter, onSelect, disabled = false }: Props) {
  return (
    <MapContainer
      center={defaultCenter}
      zoom={15}
      style={{ height: "100%", width: "100%", cursor: disabled ? "default" : "crosshair" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={onSelect} disabled={disabled} />
      <FlyTo center={defaultCenter} />
      {lat !== null && lng !== null && (
        <Marker position={[lat, lng]} icon={goldIcon} />
      )}
    </MapContainer>
  );
}
