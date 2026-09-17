interface Props {
  source: string;
}

function parseSources(source: string): string[] {
  return source
    .split("+")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSourceDescription(source: string): string {
  const value = source.toLowerCase();

  if (
    value.includes("open-meteo") ||
    value.includes("open meteo")
  ) {
    return "Weather and environmental data";
  }

  if (value.includes("gdacs")) {
    return "Global disaster event data";
  }

  if (
    value.includes("rainfall") ||
    value.includes("weather")
  ) {
    return "Environmental and weather data";
  }

  if (
    value.includes("river") ||
    value.includes("hydro")
  ) {
    return "Hydrological data";
  }

  if (value.includes("earthquake")) {
    return "Earthquake event data";
  }

  if (
    value.includes("risk") ||
    value.includes("model") ||
    value.includes("ai")
  ) {
    return "Risk analysis service";
  }

  return "Data source used by the risk analysis service";
}

export default function DataSources({
  source,
}: Props) {
  const sources = parseSources(source);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              External Data Sources
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sources reported by the risk analysis service
            </p>
          </div>

          {sources.length > 0 && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
              {sources.length} Source
              {sources.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <div className="text-2xl">🔗</div>

          <div className="mt-2 text-sm font-semibold text-slate-700">
            No data sources reported
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            The backend did not provide external data
            source information for this prediction.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/40"
            >
              <div className="flex items-start gap-3">
                {/* Source icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                  🔗
                </div>

                {/* Source information */}
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-sm font-bold text-slate-800"
                    title={item}
                  >
                    {item}
                  </div>

                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {getSourceDescription(item)}
                  </div>
                </div>

                {/* Reported status */}
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  Reported
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source note */}
      {sources.length > 0 && (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
          <p className="text-xs leading-5 text-slate-500">
            These sources are displayed from the prediction
            response returned by the backend. The frontend
            does not create or replace source information.
          </p>
        </div>
      )}
    </section>
  );
}