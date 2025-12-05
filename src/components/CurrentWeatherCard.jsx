import { Droplets, Sun, Wind } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTemp, getCurrentDate } from "@/lib/weatherUtils";

export function CurrentWeatherCard({ weather, selected, onSelect, conditionLabel }) {
  if (!weather) return null;

  return (
    <Card
      className={`backdrop-blur bg-white/10 text-white border-white/20 shadow-lg cursor-pointer ${
        selected ? "border-white/50" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle>{weather.location}</CardTitle>
          <div className="text-xs text-white/70">{getCurrentDate()}</div>
          <CardDescription className="text-white/70">
            Current conditions -
          </CardDescription>
        </div>
        <Sun className="h-6 w-6" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-semibold">
            {formatTemp(weather.current?.temperature_2m)}°
          </span>
          <span className="text-white/70">
            feels like {formatTemp(weather.current?.apparent_temperature)}°
          </span>
        </div>
        <div className="text-sm text-white/70">
          High {formatTemp(weather.todayHigh)}° · Low {formatTemp(weather.todayLow)}°
        </div>
        <div className="text-white/80 text-sm">
          {weather.summary}
        </div>
        {conditionLabel && (
          <div className="text-sm text-white/80">Conditions: {conditionLabel}</div>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            <span>Wind {weather.current?.wind_speed_10m ?? "--"} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            <span>Humidity {weather.current?.relative_humidity_2m ?? "--"}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
