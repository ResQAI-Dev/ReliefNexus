import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type RiskEvent = Record<string, any>;

type RiskMapProps = {
  latitude: number;
  longitude: number;
  locationLabel?: string;
  events?: RiskEvent[];
  onLocationChange: (latitude: number, longitude: number) => void;
};

const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];

const tileLayers = {
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
  },
  map: {
    name: "Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  terrain: {
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors, SRTM | Map style © OpenTopoMap",
  },
} as const;

type LayerName = keyof typeof tileLayers;

function validLat(value: unknown): value is number {
  const n = Number(value);
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function validLng(value: unknown): value is number {
  const n = Number(value);
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

function eventCoords(event: RiskEvent): [number, number] | null {
  const lat =
    event.latitude ??
    event.lat ??
    event.coordinates?.latitude ??
    event.coordinates?.lat ??
    event.location?.latitude ??
    event.location?.lat;

  const lng =
    event.longitude ??
    event.lng ??
    event.lon ??
    event.coordinates?.longitude ??
    event.coordinates?.lng ??
    event.coordinates?.lon ??
    event.location?.longitude ??
    event.location?.lng;

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!validLat(latitude) || !validLng(longitude)) return null;
  return [latitude, longitude];
}

function eventLabel(event: RiskEvent) {
  return (
    event.title ||
    event.name ||
    event.event ||
    event.disasterType ||
    event.type ||
    "External Risk Event"
  );
}

function eventLevel(event: RiskEvent) {
  return String(
    event.riskLevel ||
      event.severity ||
      event.level ||
      event.alertLevel ||
      "Moderate"
  );
}

function eventColor(level: string) {
  const value = level.toLowerCase();
  if (value.includes("critical") || value.includes("red")) return "#ef4444";
  if (value.includes("high") || value.includes("orange")) return "#f97316";
  if (value.includes("moderate") || value.includes("yellow")) return "#f59e0b";
  return "#10b981";
}

function SelectedPinIcon() {
  return L.divIcon({
    className: "reliefnexus-selected-pin",
    html: `
      <div style="
        position:relative;
        width:44px;
        height:44px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <div style="
          position:absolute;
          width:44px;
          height:44px;
          border-radius:999px;
          background:rgba(37,99,235,.18);
          box-shadow:0 0 0 1px rgba(255,255,255,.45),0 0 26px rgba(37,99,235,.55);
        "></div>
        <div style="
          width:24px;
          height:24px;
          border-radius:999px;
          background:#2563eb;
          border:4px solid white;
          box-shadow:0 6px 18px rgba(15,23,42,.32);
          position:relative;
          z-index:2;
        "></div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function EventIcon({ color }: { color: string }) {
  return L.divIcon({
    className: "reliefnexus-event-pin",
    html: `
      <div style="
        width:26px;
        height:26px;
        border-radius:999px;
        background:${color};
        border:3px solid rgba(255,255,255,.96);
        box-shadow:0 5px 18px rgba(15,23,42,.26),0 0 0 5px ${color}22;
      "></div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function MapClickCapture({
  onSelect,
}: {
  onSelect: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapViewportController({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();
  const lastPosition = useRef<[number, number] | null>(null);

  // Leaflet can initialize before the dashboard grid has its final size.
  // Keep the map tiles aligned with the real container dimensions.
  useEffect(() => {
    const invalidate = () => {
      map.invalidateSize({
        animate: false,
        pan: false,
      });
    };

    invalidate();

    const frame = window.requestAnimationFrame(invalidate);
    const timeout = window.setTimeout(invalidate, 150);

    const observer = new ResizeObserver(invalidate);
    observer.observe(map.getContainer());

    window.addEventListener("resize", invalidate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  // When the user searches a location or clicks the map, move the viewport
  // to the new coordinates and zoom into the selected place.
  useEffect(() => {
    const hasCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      !(latitude === 0 && longitude === 0);

    if (!hasCoordinates) return;

    const next: [number, number] = [latitude, longitude];
    const previous = lastPosition.current;

    const samePosition =
      previous &&
      Math.abs(previous[0] - next[0]) < 0.000001 &&
      Math.abs(previous[1] - next[1]) < 0.000001;

    if (samePosition) {
      map.invalidateSize({ animate: false, pan: false });
      return;
    }

    lastPosition.current = next;

    // setView is deliberately used instead of flyTo so location search feels
    // immediate and the final selected point is guaranteed to be visible.
    map.setView(next, 12, {
      animate: true,
    });

    window.requestAnimationFrame(() => {
      map.invalidateSize({
        animate: false,
        pan: false,
      });
    });
  }, [latitude, longitude, map]);

  return null;
}


export default function RiskMap({
  latitude,
  longitude,
  locationLabel,
  events = [],
  onLocationChange,
}: RiskMapProps) {
  const [layer] = useState<LayerName>("map");

  const center = useMemo<[number, number]>(() => {
    const usable =
      validLat(latitude) &&
      validLng(longitude) &&
      !(latitude === 0 && longitude === 0);

    return usable
      ? [latitude, longitude]
      : SRI_LANKA_CENTER;
  }, [latitude, longitude]);

  const safeEvents = useMemo(
    () =>
      (Array.isArray(events) ? events : [])
        .map((event, index) => ({
          event,
          index,
          coords: eventCoords(event),
        }))
        .filter((item) => item.coords !== null) as Array<{
        event: RiskEvent;
        index: number;
        coords: [number, number];
      }>,
    [events]
  );

  return (
    <div className="reliefnexus-map-shell relative z-0 isolate h-full min-h-[680px] w-full overflow-hidden rounded-[22px] bg-[#0b2135]">


      <MapContainer
        center={center}
        zoom={9}
        minZoom={5}
        maxZoom={18}
        scrollWheelZoom
        zoomControl
        className="!h-full !w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={layer}
          url={tileLayers[layer].url}
          attribution={tileLayers[layer].attribution}
          maxNativeZoom={18}
          maxZoom={19}
        />

        <MapClickCapture onSelect={onLocationChange} />
        <MapViewportController latitude={latitude} longitude={longitude} />

        {validLat(latitude) && validLng(longitude) && !(latitude === 0 && longitude === 0) && (
          <>
            <Circle
              center={[latitude, longitude]}
              radius={1800}
              pathOptions={{
                color: "#60a5fa",
                weight: 1.5,
                opacity: 0.75,
                fillColor: "#2563eb",
                fillOpacity: 0.08,
              }}
            />
            <Circle
              center={[latitude, longitude]}
              radius={650}
              pathOptions={{
                color: "#bfdbfe",
                weight: 1,
                opacity: 0.85,
                fillColor: "#60a5fa",
                fillOpacity: 0.08,
              }}
            />
            <Marker position={[latitude, longitude]} icon={SelectedPinIcon()}>

              <Popup>
                <div style={{ minWidth: 180, fontFamily: "Inter, sans-serif" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 5 }}>
                    {locationLabel || "Selected Prediction Location"}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {safeEvents.map(({ event, index, coords }) => {
          const level = eventLevel(event);
          const color = eventColor(level);

          return (
            <Marker key={`${event.id ?? event.eventId ?? "event"}-${index}`} position={coords} icon={EventIcon({ color })}>
              <Popup>
                <div style={{ minWidth: 190, fontFamily: "Inter, sans-serif" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a" }}>
                    {eventLabel(event)}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 9, color: color, fontWeight: 800 }}>
                    {level}
                  </div>
                  {event.description && (
                    <div style={{ marginTop: 6, fontSize: 9, lineHeight: 1.45, color: "#64748b" }}>
                      {String(event.description)}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>


    </div>
  );
}


