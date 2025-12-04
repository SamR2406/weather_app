"use client";

import { useEffect, useMemo, useState } from "react";
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
import { StarLayer } from "@/components/StarLayer";
import { Droplets, MapPin, Search, Sun, Thermometer, Wind, AlertTriangle, ChevronDown } from "lucide-react";
import { SunLayer } from "@/components/SunLayer";
import { CloudLayer } from "@/components/CloudLayer";
import { SnowLayer } from "@/components/SnowLayer";
import { WindLayer } from "@/components/WindLayer";

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

const formatNumber = (value, digits = 1) =>
  value === undefined || value === null ? "--" : Number(value).toFixed(digits);

const formatTime = (value, options = {}) => {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", ...options });
};

const buildFakeWeather = ({ name, code, isDay = 1, temp = 6, wind = 8 }) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return {
    location: `${name} (Demo)`,
    current: {
      time: now.toISOString(),
      temperature_2m: temp,
      apparent_temperature: temp - 1,
      relative_humidity_2m: 70,
      wind_speed_10m: wind,
      wind_gusts_10m: wind * 1.4,
      weather_code: code,
      is_day: isDay,
      pressure_msl: 1012,
      cloud_cover: 60,
      visibility: 9000,
    },
    hourly: {
      time: Array.from({ length: 24 }, (_, i) => {
        const d = new Date(now);
        d.setHours(d.getHours() + i);
        return d.toISOString();
      }),
      temperature_2m: Array.from({ length: 24 }, () => temp + (Math.random() * 4 - 2)),
      apparent_temperature: Array.from({ length: 24 }, () => temp + (Math.random() * 4 - 2)),
    },
    daily: {
      time: days,
      temperature_2m_max: days.map(() => temp + 3),
      temperature_2m_min: days.map(() => temp - 2),
      sunrise: days.map((d) => `${d}T07:30`),
      sunset: days.map((d) => `${d}T16:30`),
      wind_gusts_10m_max: days.map(() => wind * 1.5),
      precipitation_sum: days.map(() => 5),
      precipitation_probability_max: days.map(() => 50),
      uv_index_max: days.map(() => 2),
    },
    summary: `Demo weather for ${name}`,
    todayHigh: temp + 3,
    todayLow: temp - 2,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

const rainyCodes = [
  51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82, 95, 96, 99,
];

const snowyCodes = [71, 73, 75, 77, 85, 86];

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

const snowFromCode = (code, windSpeed) => {
  if (code === undefined || code === null) return { enabled: false };
  if (!snowyCodes.includes(code)) return { enabled: false };

  if (code === 85 || code === 86) {
    return { enabled: true, intensity: 1.2, wind: (windSpeed || 0) * 0.03 };
  }

  if (code === 77) {
    return { enabled: true, intensity: 0.7, wind: (windSpeed || 0) * 0.02 };
  }

  return { enabled: true, intensity: 1, wind: (windSpeed || 0) * 0.025 };
};

const windEffectFromSpeed = (windSpeed, gust) => {
  const speed = windSpeed || 0;
  const gustVal = gust || 0;
  const level = Math.max(speed, gustVal * 0.8);
  if (level < 18) return { enabled: false };
  const norm = Math.min(1.8, level / 18);
  return {
    enabled: true,
    intensity: norm,
    speed: 0.8 + level / 25,
  };
};

const sunshineFromCode = (code) => {
  if (code === 0) return { enabled: true, intensity: 1.2 }; // Sunny
  if (code === 1) return { enabled: true, intensity: 0.8 }; // Mostly clear
  if (code === 2) return { enabled: true, intensity: 0.5 }; // Partly cloudy
  return { enabled: false };
};

const cloudsFromCode = (code) => {
  // Basic mapping for sunny/cloudy/overcast
  if (code === 0 || code === 1) {
    // Sunny / mostly clear
    return { enabled: false, intensity: 0, wind: 0 };
  }
  if (code === 2) {
    // Partly cloudy
    return { enabled: true, intensity: 0.65, wind: 0.05 };
  }
  if (code === 3 || code === 45 || code === 48) {
    // Mostly cloudy / overcast / foggy
    return { enabled: true, intensity: 0.8, wind: 0.1 };
  }
  // If raining, clouds always appear
  if (rainyCodes.includes(code)) {
    return { enabled: true, intensity: 1, wind: 0.15 };
  }
  return { enabled: false, intensity: 0, wind: 0 };
};

const conditionFromCode = (code) => {
  if (code === undefined || code === null) return "";
  if (code === 0) return "Clear skies";
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

const backgroundFromWeather = (code, isDay, windSpeed = 0, gust = 0) => {
  const day = isDay === 1;
  const rainy = code !== undefined && code !== null && rainyCodes.includes(code);
  const snowy = code !== undefined && code !== null && snowyCodes.includes(code);
  const windy = Math.max(windSpeed || 0, (gust || 0) * 0.8) >= 18;

  if (snowy) {
    return day
      ? "bg-gradient-to-b from-slate-100 via-sky-200 to-slate-300"
      : "bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-950";
  }

  if (rainy) {
    return day
      ? "bg-gradient-to-b from-slate-200 via-sky-400 to-slate-600"
      : "bg-gradient-to-b from-indigo-800 via-slate-900 to-black";
  }

  if (windy) {
    return day
      ? "bg-gradient-to-b from-slate-200 via-cyan-200 to-slate-400"
      : "bg-gradient-to-b from-slate-900 via-cyan-950 to-slate-950";
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
  else if (t <= 20) parts.push("Mild out, light jacket recommended. ");
  else if (t <= 25) parts.push("Warm and pleasant. ");
  else if (t <= 30) parts.push("Warm to hot weather today. ");
  else if (t <= 35) parts.push("It's set to be hot today. ");
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
  else if (humidity <= 60) parts.push("A bit humid. ");
  else if (humidity <= 80) parts.push("High humidity. ");
  else parts.push("Extremely humid. ");

  return parts.join("");
};

const demoScenarios = [
  { label: "Sunny day", code: 0, temp: 24, wind: 6, isDay: 1 },
  { label: "Cloudy", code: 3, temp: 12, wind: 10, isDay: 1 },
  { label: "Rain", code: 65, temp: 9, wind: 18, isDay: 1 },
  { label: "Snow", code: 75, temp: -2, wind: 12, isDay: 1 },
  { label: "Windy", code: 3, temp: 14, wind: 32, isDay: 1 },
  { label: "Storm", code: 96, temp: 14, wind: 28, isDay: 1 },
  { label: "Clear night", code: 0, temp: 8, wind: 4, isDay: 0 },
];

export default function Home() {
  const [query, setQuery] = useState("Sheffield");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState({ type: "current" });
  const [neoFlybys, setNeoFlybys] = useState({ items: [], loading: false, error: "" });
  const [expandedFlybys, setExpandedFlybys] = useState([]);

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

  const handleSearch = async (event) => {
    event.preventDefault();
    const term = query.trim();
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
      const geoRes = await fetch(
        `${GEO_URL}?name=${encodeURIComponent(term)}&count=1&language=en&format=json`
      );
      if (!geoRes.ok) throw new Error("Could not look up that city");
      const geoData = await geoRes.json();
      const location = geoData?.results?.[0];
      if (!location) throw new Error("City not found");

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
    enabled:sun.enabled && weather?.current?.is_day === 1
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
  }, [clouds.intensity, rain.enabled, snow.enabled, weather?.current?.is_day]);

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
    const apiKey = process.env.NEXT_PUBLIC_NASA_KEY;
    if (!apiKey) {
      setNeoFlybys((prev) => ({
        ...prev,
        error: "Set NEXT_PUBLIC_NASA_KEY in .env.local to load NASA flybys.",
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
        if (!res.ok) throw new Error("Could not load NASA flybys");
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
            <Card
              className={`backdrop-blur bg-white/10 text-white border-white/20 shadow-lg cursor-pointer ${
                selectedDay?.type === "current" ? "border-white/50" : ""
              }`}
              onClick={() => setSelectedDay({ type: "current" })}
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
              {dailyPreview.map((day, idx) => {
                const isSelected =
                  selectedDay?.type === "daily" && selectedDay.index === idx;
                return (
                  <div
                    key={day.date}
                    className={`rounded-lg border bg-white/5 p-4 space-y-2 cursor-pointer ${
                      isSelected ? "border-white/50" : "border-white/15"
                    }`}
                    onClick={() => setSelectedDay({ type: "daily", index: idx })}
                  >
                    <div className="text-sm text-white/80">
            {new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'short', // e.g., Tue
              month: 'short',   // e.g., Dec
              day: 'numeric'    // e.g., 2
            })}
          </div>
                    <div className="text-sm text-white/80">{day.date}</div>
                    <div className="text-2xl font-semibold">{day.avg}°</div>
                    <div className="text-white/70 text-sm">High {day.max}° · Low {day.min}°</div>
                    {day.condition && (
                      <div className="text-sm text-white/80">Conditions: {day.condition}</div>
                    )}
                    <div className="text-sm text-white/70">{day.summary}</div>
                    
                  </div>
                );
              })}
              {!dailyPreview.length && (
                <p className="text-white/70">No daily outlook available.</p>
              )}
            </CardContent>
          </Card>
        )}

        {selectedDetail && (
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
        )}
      </div>

      {(neoFlybys.loading || neoFlybys.items.length || neoFlybys.error) && (
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
                      onClick={() =>
                        setExpandedFlybys((prev) =>
                          prev.includes(flyby.id)
                            ? prev.filter((id) => id !== flyby.id)
                            : [...prev, flyby.id]
                        )
                      }
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
      )}
    </div>
  );
}
