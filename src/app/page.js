"use client";

import { useEffect, useMemo, useState } from "react";
import { RainLayer } from "@/components/RainLayer";
import { StarLayer } from "@/components/StarLayer";
import { SunLayer } from "@/components/SunLayer";
import { CloudLayer } from "@/components/CloudLayer";
import { SnowLayer } from "@/components/SnowLayer";
import { WindLayer } from "@/components/WindLayer";
import { WeatherSearch } from "@/components/WeatherSearch";
import { CurrentWeatherCard } from "@/components/CurrentWeatherCard";
import { HourlyCard } from "@/components/HourlyCard";
import { DailyOutlook } from "@/components/DailyOutlook";
import { DetailCard } from "@/components/DetailCard";
import { NeoFlybyCard } from "@/components/NeoFlybyCard";
import {
  FORECAST_URL,
  GEO_URL,
  backgroundFromWeather,
  buildFakeWeather,
  cloudsFromCode,
  conditionFromCode,
  demoScenarios,
  formatTemp,
  getCurrentDate,
  getSummary,
  rainFromCode,
  snowFromCode,
  sunshineFromCode,
  windEffectFromSpeed,
} from "@/lib/weatherUtils";

export default function Home() {
  const [query, setQuery] = useState("Sheffield");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState({ type: "current" });
  const [neoFlybys, setNeoFlybys] = useState({ items: [], loading: false, error: "" });
  const [expandedFlybys, setExpandedFlybys] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

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
      const sunrise = weather.daily.sunrise?.[idx];
      const sunset = weather.daily.sunset?.[idx];
      const gustMax = weather.daily.wind_gusts_10m_max?.[idx];
      const precipTotal = weather.daily.precipitation_sum?.[idx];
      const precipProb = weather.daily.precipitation_probability_max?.[idx];
      const uvMax = weather.daily.uv_index_max?.[idx];
      const code = weather.daily.weather_code?.[idx];
      const condition = conditionFromCode(code);
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
        sunrise,
        sunset,
        gustMax,
        precipTotal,
        precipProb,
        uvMax,
        summary: getSummary({ max: maxRaw, min: minRaw }, true),
        condition,
        code,
      };
    });
  }, [weather]);

  const handleDemo = (scenario) => {
    const fake = buildFakeWeather(scenario);
    setWeather(fake);
    setSelectedDay({ type: "current" });
    setError("");
  };

  const loadWeather = async (location) => {
    const { latitude, longitude, name, country } = location;
    const forecastRes = await fetch(
      `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code,is_day,pressure_msl,cloud_cover,visibility&hourly=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_gusts_10m_max,precipitation_sum,precipitation_probability_max,uv_index_max,weather_code&timezone=auto`
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
    setSelectedDay({ type: "current" });
  };

  const handleSearch = async (event, locationOverride) => {
    if (event) event.preventDefault();
    const term = locationOverride?.name || query.trim();
    if (!term) return;

    const demo = demoScenarios.find(
      (s) => s.label.toLowerCase() === term.toLowerCase()
    );
    if (demo) {
      handleDemo(demo);
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      let location = locationOverride;

      if (!location) {
        const geoRes = await fetch(
          `${GEO_URL}?name=${encodeURIComponent(term)}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) throw new Error("Could not look up that city");
        const geoData = await geoRes.json();
        const found = geoData?.results?.[0];
        if (!found) throw new Error("City not found");
        location = found;
      }

      await loadWeather(location);
      setSuggestions([]);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sunshine = useMemo(() => {
    const sun = sunshineFromCode(weather?.current?.weather_code);
    return {
      ...sun,
      enabled: sun.enabled && weather?.current?.is_day === 1,
    };
  }, [weather]);

  const clouds = useMemo(() => {
    const cloud = cloudsFromCode(weather?.current?.weather_code);
    const rainEnabled = rainFromCode(weather?.current?.weather_code).enabled;
    return {
      ...cloud,
      sunFactor: rainEnabled ? 0 : 1 - cloud.intensity,
    };
  }, [weather]);

  const rain = useMemo(
    () => rainFromCode(weather?.current?.weather_code, weather?.current?.wind_speed_10m),
    [weather]
  );

  const snow = useMemo(
    () => snowFromCode(weather?.current?.weather_code, weather?.current?.wind_speed_10m),
    [weather]
  );

  const stars = useMemo(() => {
    const isNight = weather?.current?.is_day === 0;
    const cloudiness = clouds.intensity || 0;
    return {
      enabled: isNight && !rain.enabled && !snow.enabled,
      density: Math.max(0.6, 1 - cloudiness * 0.6),
      twinkleSpeed: 0.05 + cloudiness * 0.02,
    };
  }, [clouds.intensity, rain.enabled, snow.enabled, weather]);

  const windVisual = useMemo(
    () => windEffectFromSpeed(weather?.current?.wind_speed_10m, weather?.current?.wind_gusts_10m),
    [weather]
  );

  const background = useMemo(
    () =>
      backgroundFromWeather(
        weather?.current?.weather_code,
        weather?.current?.is_day,
        weather?.current?.wind_speed_10m,
        weather?.current?.wind_gusts_10m
      ),
    [weather]
  );

  const conditionLabel = useMemo(
    () => conditionFromCode(weather?.current?.weather_code),
    [weather]
  );

  useEffect(() => {
    if (weather) setSelectedDay({ type: "current" });
  }, [weather]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setSuggestionLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const res = await fetch(
          `${GEO_URL}?name=${encodeURIComponent(term)}&count=6&language=en&format=json`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to fetch suggestions");
        const data = await res.json();
        const seen = new Set();
        const list =
          data?.results
            ?.map((item) => {
              const key = `${item.name}-${item.admin1 || ""}-${item.country || ""}`;
              if (seen.has(key)) return null;
              seen.add(key);
              return {
                name: item.name,
                country: item.country,
                admin1: item.admin1,
                latitude: item.latitude,
                longitude: item.longitude,
                label: `${item.name}${item.admin1 ? `, ${item.admin1}` : ""}${
                  item.country ? `, ${item.country}` : ""
                }`,
              };
            })
            .filter(Boolean) || [];
        setSuggestions(list.slice(0, 5));
      } catch (err) {
        if (err?.name !== "AbortError") setSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const handleSuggestionSelect = (suggestion) => {
    setQuery(suggestion.label);
    setSuggestions([]);
    handleSearch(null, suggestion);
  };

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_NASA_KEY;
    if (!apiKey) {
      setNeoFlybys((prev) => ({
        ...prev,
        error: "Set NEXT_PUBLIC_NASA_KEY in .env.local to load NASA flybys following advise :).",
      }));
      return;
    }

    const fetchFlybys = async () => {
      const today = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 2);
      const fmt = (d) => d.toISOString().slice(0, 10);

      setNeoFlybys((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const res = await fetch(
          `https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmt(today)}&end_date=${fmt(end)}&api_key=${apiKey}`
        );
        if (!res.ok) throw new Error("Could not load NASA flybys whoopsie");
        const data = await res.json();

        const items = Object.values(data?.near_earth_objects || {})
          .flat()
          .map((neo) => {
            const ca = neo.close_approach_data?.[0];
            if (!ca) return null;
            return {
              id: neo.id,
              name: neo.name,
              hazardous: !!neo.is_potentially_hazardous_asteroid,
              date: ca.close_approach_date_full || ca.close_approach_date,
              missKm: ca.miss_distance?.kilometers
                ? Number(ca.miss_distance.kilometers)
                : null,
              speedKph: ca.relative_velocity?.kilometers_per_hour
                ? Number(ca.relative_velocity.kilometers_per_hour)
                : null,
              orbitingBody: ca.orbiting_body || "",
              jplUrl: neo.nasa_jpl_url || "",
              magnitudeH: neo.absolute_magnitude_h,
              diameterMinKm: neo.estimated_diameter?.kilometers?.estimated_diameter_min || null,
              diameterMaxKm: neo.estimated_diameter?.kilometers?.estimated_diameter_max || null,
            };
          })
          .filter(Boolean)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);

        setNeoFlybys({ items, loading: false, error: "" });
      } catch (err) {
        setNeoFlybys({ items: [], loading: false, error: err?.message || "NASA feed error" });
      }
    };

    fetchFlybys();
  }, []);

  const selectedDetail = useMemo(() => {
    if (!weather || !selectedDay) return null;
    if (selectedDay.type === "current") {
      return {
        title: "Current conditions",
        dateLabel: getCurrentDate(),
        summary: weather.summary,
        temp: formatTemp(weather.current?.temperature_2m),
        feelsLike: formatTemp(weather.current?.apparent_temperature),
        high: formatTemp(weather.todayHigh),
        low: formatTemp(weather.todayLow),
        wind: weather.current?.wind_speed_10m,
        humidity: weather.current?.relative_humidity_2m,
        gust: weather.current?.wind_gusts_10m,
        pressure: weather.current?.pressure_msl,
        cloudCover: weather.current?.cloud_cover,
        visibilityKm:
          weather.current?.visibility !== undefined && weather.current?.visibility !== null
            ? weather.current.visibility / 1000
            : undefined,
      };
    }

    if (selectedDay.type === "daily") {
      const day = dailyPreview[selectedDay.index];
      if (!day) return null;

      const dateLabel = new Date(day.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      return {
        title: "Day outlook",
        dateLabel,
        summary: day.summary,
        temp: day.avg,
        high: day.max,
        low: day.min,
        sunrise: day.sunrise,
        sunset: day.sunset,
        gustMax: day.gustMax,
        precipTotal: day.precipTotal,
        precipProb: day.precipProb,
        uvMax: day.uvMax,
        condition: day.condition,
        wind: undefined,
        humidity: undefined,
      };
    }

    return null;
  }, [dailyPreview, selectedDay, weather]);

  const handleFlybyToggle = (id) => {
    setExpandedFlybys((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={`relative min-h-screen overflow-hidden text-white ${background}`}>
      <div className="absolute inset-0 -z-10"></div>
      {stars.enabled && (
        <StarLayer density={stars.density} twinkleSpeed={stars.twinkleSpeed} />
      )}

      {sunshine.enabled && (
        <div className="absolute inset-0 pointer-events-none">
          <SunLayer intensity={sunshine.intensity * clouds.sunFactor} />
        </div>
      )}

      {clouds.enabled && (
        <CloudLayer
          intensity={clouds.intensity}
          wind={clouds.wind}
          color="rgba(255,255,255,0.3)"
          trailAlpha={0.03}
        />
      )}

      {windVisual.enabled && (
        <WindLayer
          intensity={windVisual.intensity}
          speed={windVisual.speed}
          color="rgba(255,255,255,0.35)"
          trailAlpha={0.06}
        />
      )}

      {rain.enabled && (
        <RainLayer
          intensity={rain.intensity}
          wind={rain.wind}
          color="rgba(255,255,255,0.45)"
          trailAlpha={0.08}
        />
      )}

      {snow.enabled && (
        <SnowLayer
          intensity={snow.intensity}
          wind={snow.wind}
          color="rgba(255,255,255,0.9)"
          trailAlpha={0.05}
        />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2">
          <p className="text-m uppercase tracking-[0.2em] text-white/80">
            Skywatch Weather
          </p>
          <h1 className="text-3xl font-semibold">Check the forecast by city</h1>
          <p className="text-white/80">
            What&apos;s happening in the world? Use the search bar to discover current weather, get a 7-day summary or scroll down to check NASA reports on real-time near-earth objects.
          </p>
        </header>

        <WeatherSearch
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearch}
          suggestions={suggestions}
          suggestionLoading={suggestionLoading}
          onSuggestionSelect={handleSuggestionSelect}
          loading={loading}
          error={error}
        />

        {weather && (
          <div className="grid gap-4 md:grid-cols-2">
            <CurrentWeatherCard
              weather={weather}
              selected={selectedDay?.type === "current"}
              onSelect={() => setSelectedDay({ type: "current" })}
              conditionLabel={conditionLabel}
            />
            <HourlyCard hourlyPreview={hourlyPreview} />
          </div>
        )}

        {weather && (
          <DailyOutlook
            dailyPreview={dailyPreview}
            selectedDay={selectedDay}
            onSelectDay={(idx) => setSelectedDay({ type: "daily", index: idx })}
          />
        )}

        <DetailCard selectedDetail={selectedDetail} />

        <NeoFlybyCard
          neoFlybys={neoFlybys}
          expandedFlybys={expandedFlybys}
          onToggle={handleFlybyToggle}
        />
      </div>
    </div>
  );
}
