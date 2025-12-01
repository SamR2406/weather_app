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
import { Droplets, MapPin, Search, Sun, Thermometer, Wind } from "lucide-react";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const formatTemp = (value) =>
  value === undefined || value === null ? "--" : Math.round(value);

export default function Home() {
  const [query, setQuery] = useState("Berlin");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hourlyPreview = useMemo(() => {
    if (!weather?.hourly?.time?.length) return [];
    return weather.hourly.time.slice(0, 6).map((time, idx) => ({
      time: new Date(time).toLocaleTimeString([], { hour: "numeric" }),
      temperature: formatTemp(weather.hourly.temperature_2m?.[idx]),
      feelsLike: formatTemp(weather.hourly.apparent_temperature?.[idx]),
    }));
  }, [weather]);

  const dailyPreview = useMemo(() => {
    if (!weather?.daily?.time?.length) return [];
    return weather.daily.time.slice(0, 3).map((time, idx) => ({
      date: new Date(time).toLocaleDateString([], { weekday: "short" }),
      max: formatTemp(weather.daily.temperature_2m_max?.[idx]),
      min: formatTemp(weather.daily.temperature_2m_min?.[idx]),
    }));
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
        `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      if (!forecastRes.ok) throw new Error("Could not load forecast");
      const forecast = await forecastRes.json();

      setWeather({
        location: `${name}${country ? `, ${country}` : ""}`,
        current: forecast.current,
        hourly: forecast.hourly,
        daily: forecast.daily,
      });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-700 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
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
                <CardDescription className="text-white/70">
                  Current conditions
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
              <CardTitle>3-day outlook</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {dailyPreview.map((day) => (
                <div
                  key={day.date}
                  className="rounded-lg border border-white/15 bg-white/5 p-4 space-y-2"
                >
                  <div className="text-sm text-white/80">{day.date}</div>
                  <div className="text-2xl font-semibold">{day.max}°</div>
                  <div className="text-white/70">Low {day.min}°</div>
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
