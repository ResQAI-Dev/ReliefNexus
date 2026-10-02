import type { FormEvent } from "react";
import type { RiskPredictionRequest } from "../types/riskPrediction.types";

interface Props {
  value: RiskPredictionRequest;
  loading: boolean;
  onChange: <K extends keyof RiskPredictionRequest>(
    field: K,
    value: RiskPredictionRequest[K]
  ) => void;
  onPredict: (event: FormEvent<HTMLFormElement>) => void;
}

interface NumericField {
  key: keyof Omit<
    RiskPredictionRequest,
    "location" | "latitude" | "longitude"
  >;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
}

const fields: NumericField[] = [
  {
    key: "rainfall1h",
    label: "Rainfall (1h)",
    unit: "mm",
    min: 0,
  },
  {
    key: "rainfall3h",
    label: "Rainfall (3h)",
    unit: "mm",
    min: 0,
  },
  {
    key: "rainfall24h",
    label: "Rainfall (24h)",
    unit: "mm",
    min: 0,
  },
  {
    key: "riverLevel",
    label: "River Level",
    unit: "m",
    min: 0,
  },
  {
    key: "riverFlow",
    label: "River Flow",
    unit: "mÂ³/s",
    min: 0,
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "Â°C",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    min: 0,
    max: 100,
  },
  {
    key: "windSpeed",
    label: "Wind Speed",
    unit: "km/h",
    min: 0,
  },

  // Open-Meteo soil moisture is a volumetric value (mÂ³/mÂ³),
  // normally represented between 0 and 1.
  {
    key: "soilMoisture",
    label: "Soil Moisture",
    unit: "mÂ³/mÂ³",
    min: 0,
    max: 1,
  },

  {
    key: "elevation",
    label: "Elevation",
    unit: "m",
    min: 0,
  },
  {
    key: "populationDensity",
    label: "Population Density",
    unit: "people/kmÂ²",
    min: 0,
  },
  {
    key: "historicalFloodCount",
    label: "Historical Flood Count",
    unit: "events",
    min: 0,
  },
  {
    key: "historicalSeverity",
    label: "Historical Severity",
    unit: "/100",
    min: 0,
    max: 100,
  },
  {
    key: "drainageCapacity",
    label: "Drainage Network Indicator",
    unit: "/100",
    min: 0,
    max: 100,
  },
  {
    key: "forecastRainfall",
    label: "Forecast Rainfall",
    unit: "mm",
    min: 0,
  },
];

function isValidCoordinate(
  latitude: number,
  longitude: number
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export default function RiskPredictionForm({
  value,
  loading,
  onChange,
  onPredict,
}: Props) {
  const coordinatesValid = isValidCoordinate(
    value.latitude,
    value.longitude
  );

  const locationValid = value.location.trim().length > 0;

  const formReady =
    locationValid && coordinatesValid;

  return (
    <form
      onSubmit={onPredict}
      className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Predict Disaster Risk
            </h2>

            <p className="text-sm text-slate-500">
              Select a location and provide environmental data
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[calc(100vh-180px)] space-y-4 overflow-y-auto p-5">
        {/* Location */}
        <div>
          <label
            htmlFor="risk-location"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Location
          </label>

          <input
            id="risk-location"
            type="text"
            value={value.location}
            onChange={(event) =>
              onChange(
                "location",
                event.target.value
              )
            }
            placeholder="Select or enter a location"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {!locationValid && (
            <p className="mt-1.5 text-xs text-rose-600">
              Location is required.
            </p>
          )}
        </div>

        {/* Coordinates */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Coordinates
            </label>

            <span className="text-[11px] text-slate-400">
              Map selectable
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Latitude */}
            <div>
              <label
                htmlFor="risk-latitude"
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                Latitude
              </label>

              <input
                id="risk-latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={
                  Number.isFinite(value.latitude)
                    ? value.latitude
                    : ""
                }
                onChange={(event) =>
                  onChange(
                    "latitude",
                    event.target.value === ""
                      ? 0
                      : Number(event.target.value)
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            {/* Longitude */}
            <div>
              <label
                htmlFor="risk-longitude"
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                Longitude
              </label>

              <input
                id="risk-longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={
                  Number.isFinite(value.longitude)
                    ? value.longitude
                    : ""
                }
                onChange={(event) =>
                  onChange(
                    "longitude",
                    event.target.value === ""
                      ? 0
                      : Number(event.target.value)
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          {!coordinatesValid && (
            <p className="mt-1.5 text-xs text-rose-600">
              Enter valid latitude and longitude coordinates.
            </p>
          )}
        </div>

        {/* Environmental Data */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Environmental Data
              </h3>

              <p className="text-xs text-slate-400">
                Values supplied to the risk prediction engine
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fields.map((field) => {
              const fieldValue =
                value[field.key];

              return (
                <div key={String(field.key)}>
                  <label
                    htmlFor={`risk-${String(
                      field.key
                    )}`}
                    className="mb-1.5 block text-xs font-semibold text-slate-600"
                  >
                    {field.label}

                    {field.unit && (
                      <span className="ml-1 font-normal text-slate-400">
                        ({field.unit})
                      </span>
                    )}
                  </label>

                  <input
                    id={`risk-${String(
                      field.key
                    )}`}
                    type="number"
                    step="any"
                    min={field.min}
                    max={field.max}
                    value={
                      Number.isFinite(fieldValue)
                        ? fieldValue
                        : ""
                    }
                    onChange={(event) => {
                      const rawValue =
                        event.target.value;

                      onChange(
                        field.key,
                        (rawValue === ""
                          ? 0
                          : Number(
                              rawValue
                            )) as RiskPredictionRequest[typeof field.key]
                      );
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            loading || !formReady
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

              Generating Prediction...
            </>
          ) : (
            <>
              <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  className="h-4 w-4"
  aria-hidden="true"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M5 12h14"
  />
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M13 6l6 6-6 6"
  />
</svg>
<span>Predict Risk</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] leading-4 text-slate-400">
          The prediction is generated from the
          data submitted to the backend risk
          analysis service.
        </p>
      </div>
    </form>
  );
}


