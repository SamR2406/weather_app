import { Droplets, MapPin, Sun, Thermometer, Wind } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatTime } from "@/lib/weatherUtils";

export function DetailCard({ selectedDetail }) {
  if (!selectedDetail) return null;

  return (
    <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>{selectedDetail.title}</CardTitle>
        <CardDescription className="text-white/70">
          {selectedDetail.dateLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-white/80">{selectedDetail.summary}</div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
          <div className="text-3xl font-semibold">{selectedDetail.temp}°</div>
          <div className="text-white/70">
            High {selectedDetail.high ?? "--"}° · Low {selectedDetail.low ?? "--"}°
          </div>
          {selectedDetail.feelsLike !== undefined && (
            <div className="text-white/70">Feels like {selectedDetail.feelsLike}°</div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
          {selectedDetail.wind !== undefined && (
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              <span>Wind {selectedDetail.wind ?? "--"} km/h</span>
            </div>
          )}
          {selectedDetail.humidity !== undefined && (
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span>Humidity {selectedDetail.humidity ?? "--"}%</span>
            </div>
          )}
          {selectedDetail.gust !== undefined && (
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              <span>Gusts {selectedDetail.gust ?? "--"} km/h</span>
            </div>
          )}
          {selectedDetail.pressure !== undefined && (
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <span>Pressure {formatNumber(selectedDetail.pressure, 0)} hPa</span>
            </div>
          )}
          {selectedDetail.cloudCover !== undefined && (
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Cloud cover {selectedDetail.cloudCover ?? "--"}%</span>
            </div>
          )}
          {selectedDetail.visibilityKm !== undefined && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Visibility {formatNumber(selectedDetail.visibilityKm, 1)} km</span>
            </div>
          )}
          {selectedDetail.precipProb !== undefined && (
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span>Rain chance {selectedDetail.precipProb ?? "--"}%</span>
            </div>
          )}
          {selectedDetail.precipTotal !== undefined && (
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span>Rain total {formatNumber(selectedDetail.precipTotal, 1)} mm</span>
            </div>
          )}
          {selectedDetail.gustMax !== undefined && (
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              <span>Max gust {selectedDetail.gustMax ?? "--"} km/h</span>
            </div>
          )}
          {selectedDetail.uvMax !== undefined && (
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>UV index {formatNumber(selectedDetail.uvMax, 1)}</span>
            </div>
          )}
          {selectedDetail.condition && (
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Conditions {selectedDetail.condition}</span>
            </div>
          )}
        </div>
        {(selectedDetail.sunrise || selectedDetail.sunset) && (
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            {selectedDetail.sunrise && (
              <div>Sunrise {formatTime(selectedDetail.sunrise)}</div>
            )}
            {selectedDetail.sunset && (
              <div>Sunset {formatTime(selectedDetail.sunset)}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
