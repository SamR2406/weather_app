import { AlertTriangle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NeoFlybyCard({ neoFlybys, expandedFlybys, onToggle }) {
  if (!(neoFlybys.loading || neoFlybys.items.length || neoFlybys.error)) return null;

  return (
    <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg mt-6">
      <CardHeader className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <CardTitle>Near-Earth flybys</CardTitle>
        <CardDescription className="text-white/70">
          NASA NEO feed · next few close approaches
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-white/80">
        {neoFlybys.loading && <p>Loading NASA data…</p>}
        {neoFlybys.error && !neoFlybys.loading && (
          <p className="text-red-100">{neoFlybys.error}</p>
        )}
        {!neoFlybys.loading && !neoFlybys.error && !neoFlybys.items.length && (
          <p>No flybys found in the next couple of days.</p>
        )}
        {neoFlybys.items.map((flyby) => {
          const badgeClass = flyby.hazardous
            ? "bg-red-500/80 text-white"
            : "bg-emerald-500/80 text-white";
          const dateLabel = flyby.date
            ? new Date(flyby.date).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Date unknown";
          const isOpen = expandedFlybys.includes(flyby.id);
          return (
            <div
              key={flyby.id}
              className="rounded-lg border border-white/15 bg-white/5 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{flyby.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${badgeClass}`}>
                  {flyby.hazardous ? "Hazardous" : "Low risk"}
                </span>
                <button
                  type="button"
                  onClick={() => onToggle(flyby.id)}
                  className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/10"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                  {isOpen ? "Hide" : "Details"}
                </button>
              </div>
              <div className="text-white/70">{dateLabel}</div>
              <div className="mt-2 flex flex-wrap gap-4 text-white/80">
                <div>Miss distance: {flyby.missKm ? `${Math.round(flyby.missKm).toLocaleString()} km` : "--"}</div>
                <div>Speed: {flyby.speedKph ? `${Math.round(flyby.speedKph).toLocaleString()} km/h` : "--"}</div>
              </div>
              {isOpen && (
                <div className="mt-2 space-y-1 text-white/80">
                  <div>
                    Diameter:{" "}
                    {flyby.diameterMinKm && flyby.diameterMaxKm
                      ? `${flyby.diameterMinKm.toFixed(2)} – ${flyby.diameterMaxKm.toFixed(2)} km`
                      : "--"}
                  </div>
                  <div>Absolute magnitude (H): {flyby.magnitudeH ?? "--"}</div>
                  <div>Orbiting body: {flyby.orbitingBody || "--"}</div>
                  {flyby.jplUrl && (
                    <a
                      href={flyby.jplUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-200 underline"
                    >
                      View NASA JPL details
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
