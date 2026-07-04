"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapBoundsFitterProps {
  coordinates: [number, number][];
}

export default function MapBoundsFitter({ coordinates }: MapBoundsFitterProps) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      try {
        map.fitBounds(coordinates, { padding: [40, 40] });
      } catch (err) {
        console.warn("Leaflet fitBounds failed:", err);
      }
    }
  }, [map, coordinates]);

  return null;
}
