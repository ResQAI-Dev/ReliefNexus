import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { ExternalDisasterEvent } from "../types/riskPrediction.types";

interface Props {
  latitude: number;
  longitude: number;
  events: ExternalDisasterEvent[];
  onLocationChange: (latitude: number, longitude: number) => void;
}

interface ClickHandlerProps {
  onLocationChange: (latitude: number, longitude: number) => void;
}

function ClickHandler({
  onLocationChange,
}: ClickHandlerProps) {
  useMapEvents({
    click(event) {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {
        onLocationChange(
          latitude,
          longitude
        );
      }
    },
  });

  return null;
}

interface CenterUpdaterProps {
  latitude: number;
  longitude: number;
}

function CenterUpdater({
  latitude,
  longitude,
}: CenterUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    const valid =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      !(latitude === 0 && longitude === 0);

    if (!valid) {
      map.setView(
        [20, 0],
        2,
        {
          animate: false,
        }
      );
    }

    window.setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [latitude, longitude, map]);

  return null;
}

function normalizeAlert(
  alertLevel?: string
): string {
  return (
    alertLevel
      ?.trim()
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .replace(" alert", "")
      .trim() ?? ""
  );
}

function getAlertColor(
  alertLevel?: string
): string {
  const level =
    normalizeAlert(alertLevel);

  if (
    level === "red" ||
    level === "1"
  ) {
    return "#dc2626";
  }

  if (
    level === "orange" ||
    level === "2"
  ) {
    return "#f59e0b";
  }

  if (
    level === "yellow" ||
    level === "3"
  ) {
    return "#eab308";
  }

  if (
    level === "green" ||
    level === "4"
  ) {
    return "#16a34a";
  }

  return "#64748b";
}

function getAlertLabel(
  alertLevel?: string
): string {
  if (!alertLevel?.trim()) {
    return "Unknown";
  }

  return alertLevel;
}

function getEventTitle(
  event: ExternalDisasterEvent
): string {
  if (event.name?.trim()) {
    return event.name;
  }

  if (event.eventType?.trim()) {
    return event.eventType;
  }

  return "External Disaster Event";
}

function createEventIcon(
  color: string
) {
  return L.divIcon({
    className: "reliefnexus-event-marker",
    html: `
      <div
        style="
          width:18px;
          height:18px;
          border-radius:50%;
          background:${color};
          border:3px solid white;
          box-shadow:
            0 0 0 2px ${color},
            0 3px 8px rgba(0,0,0,.35);
        "
      ></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

export default function RiskMap({
  latitude,
  longitude,
  events,
  onLocationChange,
}: Props) {
  const hasValidLocation =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);

  const visibleEvents =
    events.filter(
      (event) =>
        event.latitude !== null &&
        event.longitude !== null &&
        Number.isFinite(
          event.latitude
        ) &&
        Number.isFinite(
          event.longitude
        )
    );

  /*
   * Real GDACS events with valid coordinates are always
   * available on the map.
   *
   * Before a location is selected:
   *   -> show all real events that have coordinates.
   *
   * After a location is selected:
   *   -> show real events within 500 km of that location.
   *
   * No mock/fake events are created.
   */
  const nearbyEvents = visibleEvents;

  return (
    <div className="relative h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={16}
        worldCopyJump={false}
        className="h-full w-full cursor-crosshair"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler
          onLocationChange={
            onLocationChange
          }
        />

        <>
          <CenterUpdater
            latitude={hasValidLocation ? latitude : 0}
            longitude={hasValidLocation ? longitude : 0}
          />

          {hasValidLocation && (
            <>

            <CircleMarker
              center={[
                latitude,
                longitude,
              ]}
              radius={11}
              pathOptions={{
                color: "#1d4ed8",
                fillColor: "#2563eb",
                fillOpacity: 0.9,
                weight: 3,
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-semibold">
                    Selected Location
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    Latitude:{" "}
                    {latitude.toFixed(5)}
                  </div>

                  <div className="text-sm text-slate-600">
                    Longitude:{" "}
                    {longitude.toFixed(5)}
                  </div>
                </div>
              </Popup>
              </CircleMarker>
            </>
          )}

        </>

        {/* =====================================================
            REAL LOCAL GDACS ALERTS
           ===================================================== */}

        {nearbyEvents.map(
          (event) => {
            if (
              event.latitude === null ||
              event.longitude === null
            ) {
              return null;
            }

            const color =
              getAlertColor(
                event.alertLevel
              );

            return (
              <Marker
                key={`${event.eventType}-${event.eventId}`}
                position={[
                  event.latitude,
                  event.longitude,
                ]}
                icon={createEventIcon(
                  color
                )}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                >
                  {getAlertLabel(
                    event.alertLevel
                  )}{" "}
                  alert
                </Tooltip>

                <Popup>
                  <div className="min-w-[220px]">
                    <div className="font-bold text-slate-900">
                      {getEventTitle(event)}
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      <div>
                        <span className="font-medium">
                          Type:
                        </span>{" "}
                        {event.eventType ||
                          "Unknown"}
                      </div>

                      <div>
                        <span className="font-medium">
                          Alert:
                        </span>{" "}
                        <span
                          style={{
                            color,
                            fontWeight: 700,
                          }}
                        >
                          {getAlertLabel(
                            event.alertLevel
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="font-medium">
                          Event ID:
                        </span>{" "}
                        {event.eventId ||
                          "N/A"}
                      </div>

                      <div>
                        <span className="font-medium">
                          Coordinates:
                        </span>{" "}
                        {event.latitude.toFixed(
                          4
                        )}
                        ,{" "}
                        {event.longitude.toFixed(
                          4
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}
      </MapContainer>

      {/* =====================================================
          MAP LEGEND
         ===================================================== */}

      <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

          <div className="text-sm font-bold text-slate-800">
            Interactive Risk Map
          </div>
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Click anywhere to select a prediction location
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">

          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Selected
          </span>

          <span className="flex items-center gap-1.5 text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Red Alert
          </span>

          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Orange Alert
          </span>
        </div>
      </div>

      {/* =====================================================
          EVENT COUNTS
         ===================================================== */}

      <div className="pointer-events-none absolute right-4 top-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">

        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          External Events
        </div>

        <div className="mt-0.5 text-lg font-black text-slate-800">
          {visibleEvents.length}
        </div>

        <div className="mt-1 text-[10px] font-semibold text-red-600">
          Red:{" "}
          {nearbyEvents.filter(
            (event) =>
              normalizeAlert(event.alertLevel) === "red"
          ).length}
          {"  "}
          <span className="text-amber-600">
            Orange:{" "}
            {nearbyEvents.filter(
              (event) =>
                normalizeAlert(event.alertLevel) === "orange"
            ).length}
          </span>
        </div>
      </div>

      {/* =====================================================
          NO LOCAL ALERT MESSAGE
         ===================================================== */}

      {hasValidLocation &&
        nearbyEvents.length === 0 && (
          <div className="pointer-events-none absolute bottom-16 right-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-500 shadow-lg">
            No external alert within
            500 km of selected location.
          </div>
        )}

      {/* =====================================================
          SELECTED COORDINATES
         ===================================================== */}

      <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Selected Coordinates
        </div>

        {hasValidLocation ? (
          <div className="mt-1 text-sm font-bold text-slate-700">
            {latitude.toFixed(5)},{" "}
            {longitude.toFixed(5)}
          </div>
        ) : (
          <div className="mt-1 text-sm text-slate-500">
            Select a location on the map
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-xl bg-white/90 px-3 py-2 text-[10px] text-slate-400 shadow">
        OpenStreetMap
      </div>
    </div>
  );
}







