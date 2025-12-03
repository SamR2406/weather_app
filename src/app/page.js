"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RainLayer } from "@/components/RainLayer";
import { Droplets, MapPin, Search, Sun, Thermometer, Wind } from "lucide-react";

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getCurrentDate() {
  const d = new Date();
  const day = d.toLocaleString("en-US", { weekday: "long" });
  const month = d.toLocaleString("en-US", { month: "long" });
  const date = getOrdinal(d.getDate());

  return `${day} ${date} ${month}`;
}

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const formatTemp = (value) =>
  value === undefined || value === null ? "--" : Math.round(value);

const rainyCodes = [
  51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82, 95, 96, 99,
];

const rainFromCode = (code, windSpeed) => {
  if (code === undefined || code === null) return { enabled: false };
  const drizzle = [51, 53, 55, 56, 57];
  const rain = [61, 63, 65, 80, 81, 82];
  const storm = [95, 96, 99];
  if (drizzle.includes(code)) {
    return { enabled: true, intensity: 0.6, wind: (windSpeed || 0) * 0.03 };
  }
  if (rain.includes(code)) {
    return { enabled: true, intensity: 1.1, wind: (windSpeed || 0) * 0.04 };
  }
  if (storm.includes(code)) {
    return { enabled: true, intensity: 1.5, wind: (windSpeed || 0) * 0.06 };
  }
  return { enabled: false };
};

const conditionFromCode = (code) => {
  if (code === undefined || code === null) return "";
  if (code === 0) return "Sunny";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Raining";
  if (code === 66 || code === 67) return "Freezing rain";
  if ([71, 73, 75].includes(code)) return "Snowing";
  if (code === 77) return "Snow grains";
  if ([80, 81, 82].includes(code)) return "Showers";
  if (code === 85 || code === 86) return "Snow showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "";
};

const backgroundFromWeather = (code, isDay) => {
  const day = isDay === 1;
  const rainy = code !== undefined && code !== null && rainyCodes.includes(code);

  if (rainy) {
    return day
      ? "bg-gradient-to-b from-slate-200 via-sky-400 to-slate-600"
      : "bg-gradient-to-b from-indigo-800 via-slate-900 to-black";
  }

  return day
    ? "bg-gradient-to-b from-sky-300 via-cyan-400 to-blue-600"
    : "bg-gradient-to-b from-indigo-900 to-slate-900";
};

const getSummary = (data, isDaily = false) => {
  let t;
  let wind = 0;
  let humidity = 50;

  if (isDaily) {
    if (data?.max === undefined || data?.min === undefined) return "";
    t = (data.max + data.min) / 2;
    if (data.wind !== undefined) wind = data.wind;
    if (data.humidity !== undefined) humidity = data.humidity;
  } else if (data?.current) {
    t = data.current.temperature_2m;
    wind = data.current.wind_speed_10m;
    humidity = data.current.relative_humidity_2m;
  } else {
    return "";
  }

  const parts = [];

  if (t <= 0) parts.push("Freezing conditions, bundle up! ");
  else if (t <= 5) parts.push("Chilly weather outside, possible frost in places. ");
  else if (t <= 10) parts.push("Cool out today. ");
  else if (t <= 20) parts.push("Mild out, light jacket rcommended. ");
  else if (t <= 25) parts.push("Warm and pleasant. ");
  else if (t <= 30) parts.push("Warm to hot weather today. ");
  else if (t <= 35) parts.push("It's set to be hot today.");
  else if (t <= 40) parts.push("Hot temperatures today, stay inside during peak sunlight hours. ");
  else parts.push("Very hot outdoors, stay hydrated, avoid strenuous activity and keep pets inside. ");

  if (wind <= 1) parts.push("Calm and still. ");
  else if (wind <= 6) parts.push("Gentle breeze. ");
  else if (wind <= 20) parts.push("Moderate breeze. ");
  else if (wind <= 30) parts.push("Fresh breeze. ");
  else if (wind <= 40) parts.push("Strong breeze today, hang on to your hat! ");
  else if (wind <= 50) parts.push("Very strong winds, take care. ");
  else if (wind <= 60) parts.push("Gale force winds. Hard to walk outside. ");
  else if (wind <= 75) parts.push("Strong gales - watch out for debris. ");
  else if (wind <= 89) parts.push("Stormy conditions, stay indoors! ");
  else if (wind <= 100) parts.push("Extreme wind damage likely - do not go outside, stay away from windows. ");
  else parts.push("Hurricane force winds - seek shelter immediately! ");

  if (humidity <= 20) parts.push("Very dry air. ");
  else if (humidity <= 40) parts.push("Comfortable humidity levels. ");
  else if (humidity <= 60) parts.push("A bit humid today. ");
  else if (humidity <= 80) parts.push("High humidity. ");
  else parts.push("Extremely humid. ");

  return parts.join("");
};

export default function Home() {
  const [query, setQuery] = useState("Sheffield");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hourlyPreview = useMemo(() => {
    if (!weather?.hourly?.time?.length) return [];

    const currentTimeMs = weather.current?.time
      ? new Date(weather.current.time).getTime()
      : null;

    const startIndex =
      currentTimeMs === null
        ? 0
        : weather.hourly.time.findIndex(
            (t) => new Date(t).getTime() >= currentTimeMs
          );

    const from = startIndex >= 0 ? startIndex : 0;

    const formatter =
      weather?.timezone &&
      new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: weather.timezone,
      });

    return weather.hourly.time.slice(from, from + 6).map((time, idx) => ({
      time: formatter
        ? formatter.format(new Date(time))
        : new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: formatTemp(weather.hourly.temperature_2m?.[from + idx]),
      feelsLike: formatTemp(weather.hourly.apparent_temperature?.[from + idx]),
    }));
  }, [weather]);

  const dailyPreview = useMemo(() => {
    if (!weather?.daily?.time?.length) return [];
    return weather.daily.time.slice(0, 7).map((time, idx) => {
      const maxRaw = weather.daily.temperature_2m_max?.[idx];
      const minRaw = weather.daily.temperature_2m_min?.[idx];
      const avgRaw =
        maxRaw !== undefined && minRaw !== undefined
          ? (maxRaw + minRaw) / 2
          : undefined;
      const max = formatTemp(maxRaw);
      const min = formatTemp(minRaw);
      const avg = formatTemp(avgRaw);

      return {
        date: time,
        max,
        min,
        avg,
        summary: getSummary({ max: maxRaw, min: minRaw }, true),
      };
    });
  }, [weather]);

  
  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const geoRes = await fetch(
        `${GEO_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      );
      if (!geoRes.ok) throw new Error("Could not look up that city");
      const geoData = await geoRes.json();
      const location = geoData?.results?.[0];
      if (!location) throw new Error("City not found");

      const { latitude, longitude, name, country } = location;

      const forecastRes = await fetch(
        `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&hourly=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      if (!forecastRes.ok) throw new Error("Could not load forecast");
      const forecast = await forecastRes.json();

      const todayHigh = forecast?.daily?.temperature_2m_max?.[0];
      const todayLow = forecast?.daily?.temperature_2m_min?.[0];

      setWeather({
        location: `${name}${country ? `, ${country}` : ""}`,
        current: forecast.current,
        hourly: forecast.hourly,
        daily: forecast.daily,
        summary: getSummary(forecast),
        todayHigh,
        todayLow,
      });

    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const rain = useMemo(
    () => rainFromCode(weather?.current?.weather_code, weather?.current?.wind_speed_10m),
    [weather]
  );

  const background = useMemo(
    () => backgroundFromWeather(weather?.current?.weather_code, weather?.current?.is_day),
    [weather]
  );

  const conditionLabel = useMemo(
    () => conditionFromCode(weather?.current?.weather_code),
    [weather]
  );

  return (
    <div className={`relative min-h-screen overflow-hidden text-white ${background}`}>
      {rain.enabled && (
        <RainLayer
          intensity={rain.intensity}
          wind={rain.wind}
          color="rgba(255,255,255,0.45)"
          trailAlpha={0.08}
        />
      )}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">
            Open-Meteo Weather
          </p>
          <h1 className="text-3xl font-semibold">Check the forecast by city</h1>
          <p className="text-white/80">
            Uses the free Open-Meteo API with live geocoding and forecast data.
          </p>
        </header>

        <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
          <CardHeader className="gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Choose a city
            </CardTitle>
            <CardDescription className="text-white/70">
              We’ll fetch the current conditions and a quick outlook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try Sheffield, London, Tokyo..."
                className="bg-white/80 text-foreground"
              />
              <Button
                type="submit"
                disabled={loading}
                className="md:w-auto"
              >
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </form>
            {error && (
              <p className="mt-3 text-sm text-red-100">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {weather && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
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

            <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Next hours</CardTitle>
                <CardDescription className="text-white/70">
                  Temperature and feels-like snapshot
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                {hourlyPreview.map((hour) => (
                  <div
                    key={hour.time}
                    className="rounded-lg border border-white/15 bg-white/5 p-3 text-center"
                  >
                    <div className="text-xs text-white/70">{hour.time}</div>
                    <div className="mt-1 text-lg font-semibold">{hour.temperature}°</div>
                    <div className="text-white/70">Feels {hour.feelsLike}°</div>
                  </div>
                ))}
                {!hourlyPreview.length && (
                  <p className="col-span-3 text-white/70">No hourly data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {weather && (
          <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
            <CardHeader className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              <CardTitle>7-day outlook</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              {dailyPreview.map((day) => (
                <div
                  key={day.date}
                  className="rounded-lg border border-white/15 bg-white/5 p-4 space-y-2"
                >
                  <div className="text-sm text-white/80">
            {new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'short', 
              month: 'short',   
              day: 'numeric'    
            })}
          </div>
                  <div className="text-sm text-white/80">{day.date}</div>
                  <div className="text-2xl font-semibold">{day.avg}°</div>
                  <div className="text-white/70 text-sm">High {day.max}° · Low {day.min}°</div>
                  <div className="text-sm text-white/70">{day.summary}</div>
                  
                </div>
              ))}
              {!dailyPreview.length && (
                <p className="text-white/70">No daily outlook available.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
