import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type DisasterReport = {
  id?: string;
  disasterType?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  severity?: string;
  status?: string;
};

type DisasterRiskMapProps = {
  reports: DisasterReport[];
};

const severityConfig = (severity?: string) => {
  const value = (severity || "").toLowerCase();

  if (value.includes("critical")) {
    return {
      color: "#dc2626",
      fillColor: "#ef4444",
      zoneColor: "#ef4444",
      zoneOpacity: 0.24,
      radius: 32000,
    };
  }

  if (value.includes("high")) {
    return {
      color: "#ea580c",
      fillColor: "#f97316",
      zoneColor: "#f97316",
      zoneOpacity: 0.22,
      radius: 27000,
    };
  }

  if (value.includes("medium")) {
    return {
      color: "#ca8a04",
      fillColor: "#facc15",
      zoneColor: "#facc15",
      zoneOpacity: 0.22,
      radius: 22000,
    };
  }

  if (value.includes("low")) {
    return {
      color: "#16a34a",
      fillColor: "#22c55e",
      zoneColor: "#22c55e",
      zoneOpacity: 0.20,
      radius: 17000,
    };
  }

  return {
    color: "#2563eb",
    fillColor: "#3b82f6",
    zoneColor: "#3b82f6",
    zoneOpacity: 0.18,
    radius: 14000,
  };
};

export const DisasterRiskMap = ({
  reports,
}: DisasterRiskMapProps) => {
  const mappedReports = reports.filter(
    (report) =>
      typeof report.latitude === "number" &&
      typeof report.longitude === "number" &&
      Number.isFinite(report.latitude) &&
      Number.isFinite(report.longitude)
  );

  const center: LatLngExpression = [7.8731, 80.7718];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 shadow-sm">
      <div className="relative h-[320px] w-full">

        <MapContainer
          center={center}
          zoom={7}
          minZoom={6}
          maxZoom={16}
          scrollWheelZoom={false}
          zoomControl
          className="!h-full !w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mappedReports.map((report, index) => {
            const severity = severityConfig(report.severity);

            const position: LatLngExpression = [
              report.latitude as number,
              report.longitude as number,
            ];

            return (
              <div key={report.id ?? `${report.latitude}-${report.longitude}-${index}`}>
                <Circle
                  center={position}
                  radius={severity.radius}
                  pathOptions={{
                    color: severity.zoneColor,
                    weight: 2,
                    fillColor: severity.zoneColor,
                    fillOpacity: severity.zoneOpacity,
                  }}
                />

                <CircleMarker
                  center={position}
                  radius={11}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 3,
                    fillColor: severity.fillColor,
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: severity.fillColor,
                          }}
                        />

                        <p className="font-bold text-slate-900">
                          {report.disasterType || "Disaster Report"}
                        </p>
                      </div>

                      {report.location && (
                        <p className="text-sm text-slate-600">
                          📍 {report.location}
                        </p>
                      )}

                      {report.severity && (
                        <p className="mt-1 text-sm text-slate-700">
                          Severity:{" "}
                          <strong>{report.severity}</strong>
                        </p>
                      )}

                      {report.status && (
                        <p className="mt-1 text-sm text-slate-600">
                          Status: {report.status}
                        </p>
                      )}

                      {report.description && (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              </div>
            );
          })}
        </MapContainer>

        {/* Colorful top gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-16 bg-gradient-to-b from-blue-900/20 to-transparent" />

        {/* Map title badge */}
        <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-xl border border-white/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <span className="text-xs">●</span>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Live Monitoring
            </p>

            <p className="text-xs font-bold text-slate-900">
              Disaster Risk Map
            </p>
          </div>
        </div>

        {/* Report count */}
        <div className="absolute right-3 top-3 z-[1000] rounded-xl border border-white/40 bg-slate-950/80 px-3 py-2 shadow-lg backdrop-blur">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
            Mapped Reports
          </p>

          <p className="text-lg font-extrabold leading-5 text-white">
            {mappedReports.length}
          </p>
        </div>

        {/* Colorful risk legend */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur">
          <p className="mb-2 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
            Risk Level
          </p>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
              <span className="h-3 w-3 rounded-full bg-red-500 shadow-sm ring-2 ring-red-100" />
              Critical
            </span>

            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
              <span className="h-3 w-3 rounded-full bg-orange-500 shadow-sm ring-2 ring-orange-100" />
              High
            </span>

            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
              <span className="h-3 w-3 rounded-full bg-yellow-400 shadow-sm ring-2 ring-yellow-100" />
              Medium
            </span>

            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
              <span className="h-3 w-3 rounded-full bg-green-500 shadow-sm ring-2 ring-green-100" />
              Low
            </span>
          </div>
        </div>

        {/* Empty real-data state */}
        {mappedReports.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
            <div className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 text-center shadow-xl backdrop-blur">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <span className="text-sm">●</span>
              </div>

              <p className="text-sm font-bold text-slate-800">
                No mapped disaster reports
              </p>

              <p className="mt-1 max-w-[220px] text-[10px] leading-4 text-slate-500">
                Real reports with latitude and longitude will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

