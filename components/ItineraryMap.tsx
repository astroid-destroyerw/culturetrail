"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DayItinerary } from "@/types";
import MapBoundsFitter from "./MapBoundsFitter";

// Accessibility Comment:
// Note: This Leaflet map component is inherently visual. Screen reader users can rely on the 
// semantic, fully accessible day-by-day vertical timeline list of itinerary cards rendered directly 
// below the map as the descriptive text alternative.

interface ItineraryMapProps {
  days: DayItinerary[];
  activeDayIdx: number;
}

const getPOIColorGroup = (type: string) => {
  const t = type.toLowerCase();
  if (t === "attraction" || t === "viewpoint") {
    return "attraction";
  } else if (t === "historic" || t === "museum") {
    return "hiddenGem";
  } else {
    return "cultural";
  }
};

const createCustomIcon = (activityName: string, group: "attraction" | "hiddenGem" | "cultural", isDimmed: boolean) => {
  let color = "#D96C3F"; // Terracotta
  if (group === "hiddenGem") color = "#0D9488"; // Teal
  if (group === "cultural") color = "#D97706"; // Gold

  const opacity = isDimmed ? 0.35 : 1.0;
  const escapedName = activityName.replace(/"/g, "&quot;");

  return L.divIcon({
    html: `<div role="img" aria-label="${escapedName} marker" style="background-color: ${color}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5); opacity: ${opacity}; transition: opacity 0.3s ease;"></div>`,
    className: "custom-marker-icon",
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
    popupAnchor: [0, -7.5],
  });
};

export default function ItineraryMap({ days, activeDayIdx }: ItineraryMapProps) {
  // Collect coordinates for initial boundary fitting
  const allCoordinates: [number, number][] = [];
  days.forEach((dayData) => {
    ["morning", "afternoon", "evening"].forEach((time) => {
      const activity = dayData[time as "morning" | "afternoon" | "evening"];
      if (activity && activity.lat !== 0 && activity.lng !== 0) {
        allCoordinates.push([activity.lat, activity.lng]);
      }
    });
  });

  const center: [number, number] =
    allCoordinates.length > 0
      ? [
          allCoordinates.reduce((sum, coords) => sum + coords[0], 0) / allCoordinates.length,
          allCoordinates.reduce((sum, coords) => sum + coords[1], 0) / allCoordinates.length,
        ]
      : [0, 0];

  // Retrieve coordinates for selected day route polyline
  const polylineCoords: [number, number][] = [];
  if (activeDayIdx !== -1 && days[activeDayIdx]) {
    const selectedDay = days[activeDayIdx];
    ["morning", "afternoon", "evening"].forEach((time) => {
      const activity = selectedDay[time as "morning" | "afternoon" | "evening"];
      if (activity && activity.lat !== 0 && activity.lng !== 0) {
        polylineCoords.push([activity.lat, activity.lng]);
      }
    });
  }

  return (
    <div 
      className="w-full space-y-3 print:hidden" 
      aria-label="Interactive travel itinerary map"
      role="region"
    >
      <div className="w-full h-[400px] md:h-[450px] rounded-2xl overflow-hidden border border-foreground/10 relative z-10 shadow-xl bg-foreground/[0.01]">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Boundaries fitting helper */}
          <MapBoundsFitter 
            coordinates={activeDayIdx === -1 ? allCoordinates : polylineCoords} 
          />

          {/* Render markers across all days */}
          {days.map((dayData, dIdx) => {
            const isDayDimmed = activeDayIdx !== -1 && activeDayIdx !== dIdx;

            return ["morning", "afternoon", "evening"].map((time) => {
              const activity = dayData[time as "morning" | "afternoon" | "evening"];
              if (!activity || activity.lat === 0 || activity.lng === 0) return null;

              const group = getPOIColorGroup(activity.type);
              const customIcon = createCustomIcon(activity.activity, group, isDayDimmed);

              return (
                <Marker
                  key={`${dayData.day}-${time}-${activity.activity}`}
                  position={[activity.lat, activity.lng]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="text-left space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2 border-b pb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wide text-[#D96C3F]">
                          Day {dayData.day} &bull; {time}
                        </span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          {activity.type}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900 m-0 leading-tight">
                        {activity.activity}
                      </h4>
                      <p className="text-xs text-gray-600 m-0 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            });
          })}

          {/* Draw polyline route overlay */}
          {activeDayIdx !== -1 && polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              color="#D96C3F"
              weight={4}
              opacity={0.85}
              dashArray="6, 12"
            />
          )}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap gap-4 items-center justify-center text-xs text-foreground/75 bg-foreground/[0.02] border border-foreground/10 py-2.5 px-4 rounded-xl">
        <span className="font-semibold text-foreground/50 select-none">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border border-white bg-[#D96C3F] inline-block"></span>
          <span>Attractions & Viewpoints</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border border-white bg-[#0D9488] inline-block"></span>
          <span>Museums & Historical Sites</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border border-white bg-[#D97706] inline-block"></span>
          <span>Markets & Cultural Gems</span>
        </div>
      </div>
    </div>
  );
}
