import { useEffect } from "react";
import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "../../../lib/api/apiClient";

interface ReportForm {
  disasterType: string;
  severity: string;
  location: string;
  description: string;
  latitude: string;
  longitude: string;
}

const initialForm: ReportForm = {
  disasterType: "",
  severity: "Medium",
  location: "",
  description: "",
  latitude: "",
  longitude: "",
};

/* ============================================================
   MAP MARKER
   ============================================================ */

const reportMarkerIcon = L.divIcon({
  className: "reliefnexus-disaster-marker",
  html: `
    <div style="
      width:42px;
      height:42px;
      border-radius:50% 50% 50% 0;
      background:#2563eb;
      transform:rotate(-45deg);
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 8px 20px rgba(15,23,42,.28);
      border:4px solid white;
    ">
      <div style="
        width:12px;
        height:12px;
        border-radius:50%;
        background:white;
      "></div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
});

/* ============================================================
   MAP CLICK HANDLER
   ============================================================ */

const MapClickHandler = ({
  onLocationSelect,
}: {
  onLocationSelect: (latitude: number, longitude: number) => void;
}) => {
  useMapEvents({
    click(event) {
      onLocationSelect(
        Number(event.latlng.lat.toFixed(6)),
        Number(event.latlng.lng.toFixed(6))
      );
    },
  });

  return null;
};

/* ============================================================
   ICONS
   ============================================================ */

const AlertIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M10.3 3.9 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const MapIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
    <path d="M9 3v15" />
    <path d="M15 6v15" />
  </svg>
);

const PinIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const CrosshairIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const ShieldIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const SendIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const CheckIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const InfoIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const DisasterReportForm = () => {
  const [form, setForm] = useState<ReportForm>(initialForm);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ----------------------------------------------------------
     UPDATE FORM
     ---------------------------------------------------------- */

  const updateField = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  /* ----------------------------------------------------------
     MAP LOCATION
     ---------------------------------------------------------- */

  const selectMapLocation = (
    latitude: number,
    longitude: number
  ) => {
    setForm((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));

    setMessage(
      "Map location selected. The coordinates will be attached to your report."
    );

    setError("");
  };

  /* ----------------------------------------------------------
     CURRENT LOCATION
     ---------------------------------------------------------- */


  // Automatically synchronize typed location with coordinates
  useEffect(() => {
    const location = form.location.trim();

    if (location.length < 3) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=lk&q=${encodeURIComponent(location)}`
        );

        if (!response.ok) return;

        const results = await response.json();

        if (!Array.isArray(results) || results.length === 0) {
          return;
        }

        const result = results[0];

        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return;
        }

        setForm((current) => ({
          ...current,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
      } catch (error) {
        console.error("Location geocoding failed:", error);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [form.location]);
  const useCurrentLocation = () => {
    setMessage("");
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude.toFixed(6);

        const longitude =
          position.coords.longitude.toFixed(6);

        setForm((current) => ({
          ...current,
          latitude,
          longitude,
        }));

        setMessage(
          "Current location captured successfully."
        );
      },
      () => {
        setError(
          "Unable to access your current location. Please select a point on the map or enter coordinates manually."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /* ----------------------------------------------------------
     SUBMIT
     ---------------------------------------------------------- */

  const submitReport = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) return;

    setMessage("");
    setError("");

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!form.disasterType.trim()) {
      setError("Please select a disaster type.");
      return;
    }

    if (!form.location.trim()) {
      setError("Please enter the disaster location.");
      return;
    }

    if (!form.description.trim()) {
      setError(
        "Please describe what is happening."
      );
      return;
    }

    if (form.description.trim().length < 10) {
      setError(
        "Please provide a little more detail about the situation."
      );
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setError(
        "Please provide a valid latitude between -90 and 90."
      );
      return;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError(
        "Please provide a valid longitude between -180 and 180."
      );
      return;
    }

    setSaving(true);

    try {
      await api.post("/disaster-reports", {
        disasterType: form.disasterType.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        latitude,
        longitude,
        severity: form.severity,
      });

      setMessage(
        "Disaster report submitted successfully. The ReliefNexus response team can now review the report."
      );

      setForm(initialForm);
    } catch (err: any) {
      console.error(
        "Disaster report submission failed:",
        err
      );

      const status = err?.response?.status;

      if (status === 401) {
        setError(
          "Your session has expired. Please sign in again."
        );
      } else if (status === 403) {
        setError(
          "Your account does not currently have permission to submit disaster reports."
        );
      } else {
        setError(
          "The disaster report could not be submitted. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const hasCoordinates =
    form.latitude.trim() !== "" &&
    form.longitude.trim() !== "";

  const mapLatitude = hasCoordinates
    ? Number(form.latitude)
    : 9.6615;

  const mapLongitude = hasCoordinates
    ? Number(form.longitude)
    : 80.0255;

  const descriptionLength =
    form.description.length;

  return (
    <form
      onSubmit={submitReport}
      className="space-y-6"
    >
      {/* ======================================================
          HERO
          ====================================================== */}

      <section
        className="relative overflow-hidden rounded-[24px] border border-white/60 shadow-[0_18px_50px_rgba(15,35,71,0.12)]"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(239,246,255,.98) 0%,rgba(239,246,255,.92) 42%,rgba(239,246,255,.25) 100%),url('/images/disaster-hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 px-6 py-7 sm:px-8 lg:px-9">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Disaster Reporting
            </div>

            <h2 className="text-3xl font-black tracking-tight text-[#10254a] sm:text-4xl">
              Report a{" "}
              <span className="text-blue-600">
                Disaster
              </span>
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Your report can help response teams understand
              affected areas, coordinate assistance, and
              respond faster.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroFeature
                icon={<ShieldIcon />}
                title="Report Incidents"
                description="Share what you see"
                tone="red"
              />

              <HeroFeature
                icon={<PinIcon />}
                title="Provide Location"
                description="Pin the affected area"
                tone="blue"
              />

              <HeroFeature
                icon={<CheckIcon />}
                title="Faster Response"
                description="Support response teams"
                tone="green"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          STATUS
          ====================================================== */}

      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
          <div className="mt-0.5 text-emerald-600">
            <CheckIcon />
          </div>

          <div>
            <p className="font-bold">
              Report update
            </p>

            <p className="mt-0.5 leading-5">
              {message}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 shadow-sm">
          <div className="mt-0.5 text-red-600">
            <AlertIcon />
          </div>

          <div>
            <p className="font-bold">
              Please check your report
            </p>

            <p className="mt-0.5 leading-5">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN GRID
          ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">

        {/* ====================================================
            LEFT: DETAILS
            ==================================================== */}

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.07)]">

          <SectionHeader
            icon={<AlertIcon />}
            title="Disaster Report Details"
            description="Provide accurate information about the situation"
          />

          <div className="space-y-5 p-5 sm:p-7">

            {/* Disaster Type + Severity */}

            <div className="grid gap-5 sm:grid-cols-2">

              <FormField
                label="Disaster Type"
                required
              >
                <div className="relative">
                  <select
                    name="disasterType"
                    value={form.disasterType}
                    onChange={updateField}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Select disaster type
                    </option>
                    <option value="Flood">
                      Flood
                    </option>
                    <option value="Landslide">
                      Landslide
                    </option>
                    <option value="Fire">
                      Fire
                    </option>
                    <option value="Storm">
                      Storm
                    </option>
                    <option value="Drought">
                      Drought
                    </option>
                    <option value="Earthquake">
                      Earthquake
                    </option>
                    <option value="Tsunami">
                      Tsunami
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    
                  </span>
                </div>
              </FormField>

              <FormField
                label="Severity"
                required
              >
                <div className="relative">
                  <select
                    name="severity"
                    value={form.severity}
                    onChange={updateField}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="Critical">
                      Critical
                    </option>
                    <option value="High">
                      High
                    </option>
                    <option value="Medium">
                      Medium
                    </option>
                    <option value="Low">
                      Low
                    </option>
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    
                  </span>
                </div>
              </FormField>

            </div>

            {/* Severity pills */}

            <div className="flex flex-wrap gap-2">
              <SeverityPill
                active={form.severity === "Critical"}
                label="Critical"
                dot="bg-red-500"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    severity: "Critical",
                  }))
                }
              />

              <SeverityPill
                active={form.severity === "High"}
                label="High"
                dot="bg-orange-500"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    severity: "High",
                  }))
                }
              />

              <SeverityPill
                active={form.severity === "Medium"}
                label="Medium"
                dot="bg-yellow-400"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    severity: "Medium",
                  }))
                }
              />

              <SeverityPill
                active={form.severity === "Low"}
                label="Low"
                dot="bg-emerald-500"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    severity: "Low",
                  }))
                }
              />
            </div>

            {/* Location */}

            <FormField
              label="Disaster Location"
              required
              helper="Enter a nearby town, city, village, or landmark."
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                  <PinIcon />
                </span>

                <input
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  placeholder="e.g. Jaffna, Sri Lanka"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </FormField>

            {/* Description */}

            <FormField
              label="Situation Description"
              required
              helper="Describe what is happening, the affected area, and immediate concerns."
            >
              <div className="relative">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={7}
                  maxLength={1000}
                  placeholder="Describe what is happening, the affected area, and any immediate concerns..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <div className="absolute bottom-3 right-4 text-[11px] font-semibold text-slate-400">
                  {descriptionLength}/1000
                </div>
              </div>
            </FormField>

          </div>
        </section>

        {/* ====================================================
            RIGHT: MAP
            ==================================================== */}

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.07)]">

          <SectionHeader
            icon={<MapIcon />}
            title="Select Location on Map"
            description="Click the map to set the exact disaster location"
          />

          <div className="p-4 sm:p-5">

            <div className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">

              <MapContainer
                center={[
                  mapLatitude,
                  mapLongitude,
                ]}
                zoom={8}
                scrollWheelZoom
                className="h-[390px] w-full sm:h-[470px]"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler
                  onLocationSelect={
                    selectMapLocation
                  }
                />

                {hasCoordinates && (
                  <Marker
                    position={[
                      mapLatitude,
                      mapLongitude,
                    ]}
                    icon={reportMarkerIcon}
                  />
                )}
              </MapContainer>

              {/* Center button */}

              <button
                type="button"
                onClick={useCurrentLocation}
                className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3.5 py-2.5 text-xs font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                <CrosshairIcon size={16} />
                Use My Location
              </button>

              {/* Map instruction */}

              <div className="absolute left-3 top-3 z-[1000] rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Live Map
                </p>

                <p className="mt-0.5 text-xs font-bold text-slate-800">
                  Click to place report
                </p>
              </div>

              {/* Location card */}

              {hasCoordinates && (
                <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur sm:left-auto sm:w-[300px]">
                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <PinIcon />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {form.location ||
                          "Selected disaster location"}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Lat: {form.latitude}
                      </p>

                      <p className="text-xs font-medium text-slate-500">
                        Lng: {form.longitude}
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Coordinate fields */}

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <PinIcon size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-900">
                    Disaster Coordinates
                  </p>

                  <p className="text-[11px] font-medium text-slate-500">
                    Required for accurate map placement
                  </p>
                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <CoordinateField
                  label="Latitude"
                  value={form.latitude}
                  onChange={updateField}
                />

                <CoordinateField
                  label="Longitude"
                  value={form.longitude}
                  onChange={updateField}
                />

              </div>

              <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-blue-700">
                <InfoIcon size={15} />

                <span>
                  Coordinates are used to display this
                  disaster report on the ReliefNexus
                  disaster risk map.
                </span>
              </div>

            </div>

          </div>
        </section>

      </div>

      {/* ======================================================
          SUBMIT
          ====================================================== */}

      <section className="overflow-hidden rounded-[22px] bg-[#0d1f42] shadow-[0_18px_45px_rgba(15,35,71,0.18)]">

        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/30">
              <ShieldIcon />
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                Ready to Submit?
              </h3>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-300">
                Review your information before submitting.
                Your report will be securely sent to the
                ReliefNexus response team.
              </p>
            </div>

          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting...
              </>
            ) : (
              <>
                <SendIcon />
                Submit Disaster Report
                <span className="text-lg">
                  
                </span>
              </>
            )}
          </button>

        </div>

      </section>

    </form>
  );
};

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

const HeroFeature = ({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "red" | "blue" | "green";
}) => {
  const styles = {
    red: {
      box: "bg-red-50 text-red-500",
    },
    blue: {
      box: "bg-blue-50 text-blue-600",
    },
    green: {
      box: "bg-emerald-50 text-emerald-600",
    },
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-3 py-3 shadow-sm backdrop-blur">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles[tone].box}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] font-medium text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
};

const SectionHeader = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">

    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      {icon}
    </div>

    <div>
      <h3 className="text-base font-black text-slate-900">
        {title}
      </h3>

      <p className="mt-0.5 text-xs font-medium text-slate-500">
        {description}
      </p>
    </div>

  </div>
);

const FormField = ({
  label,
  required,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
      {label}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>

    {children}

    {helper && (
      <p className="mt-2 text-[10px] font-medium leading-4 text-slate-400">
        {helper}
      </p>
    )}
  </div>
);

const CoordinateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
}) => (
  <div>
    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
      {label}
      <span className="ml-1 text-red-500">
        *
      </span>
    </label>

    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600">
        <PinIcon size={17} />
      </div>

      <input
        name={label.toLowerCase()}
        value={value}
        onChange={onChange}
        inputMode="decimal"
        placeholder={
          label === "Latitude"
            ? "e.g. 9.6615"
            : "e.g. 80.0255"
        }
        className="h-11 w-full rounded-xl border border-blue-100 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  </div>
);

const SeverityPill = ({
  label,
  dot,
  active,
  onClick,
}: {
  label: string;
  dot: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black transition ${
      active
        ? "border border-slate-300 bg-white text-slate-800 shadow-sm"
        : "border border-transparent bg-slate-50 text-slate-500 hover:bg-white hover:shadow-sm"
    }`}
  >
    <span
      className={`h-2.5 w-2.5 rounded-full ${dot}`}
    />

    {label}
  </button>
);

export default DisasterReportForm;



