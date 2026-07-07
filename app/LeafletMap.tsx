"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const guessIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;background:#f59e0b;border:2px solid #fef3c7;border-radius:50%;box-shadow:0 0 10px rgba(245,158,11,0.7);transform:translate(-50%,-50%)"></div>',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

const correctIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;background:#4ade80;border:2px solid #dcfce7;border-radius:50%;box-shadow:0 0 10px rgba(74,222,128,0.7);transform:translate(-50%,-50%)"></div>',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Slight delay so the parent container has finished its layout pass
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function ClickHandler({ onClick, active }: { onClick: (lat: number, lon: number) => void; active: boolean }) {
  useMapEvents({
    click(e) {
      if (active) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LeafletMapProps {
  phase: "guessing" | "result";
  guess: { lat: number; lon: number } | null;
  correct: { lat: number; lon: number } | null;
  onMapClick: (lat: number, lon: number) => void;
}

export default function LeafletMap({ phase, guess, correct, onMapClick }: LeafletMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      maxZoom={18}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={0.8}
      style={{ width: "100%", height: "100%" }}
      worldCopyJump={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      <MapResizer />
      <ClickHandler onClick={onMapClick} active={phase === "guessing"} />

      {guess && <Marker position={[guess.lat, guess.lon]} icon={guessIcon} />}

      {phase === "result" && correct && (
        <Marker position={[correct.lat, correct.lon]} icon={correctIcon} />
      )}

      {phase === "result" && guess && correct && (
        <Polyline
          positions={[[guess.lat, guess.lon], [correct.lat, correct.lon]]}
          pathOptions={{ color: "#f59e0b", weight: 2, dashArray: "6 6", opacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
}
