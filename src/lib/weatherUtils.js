export const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const rainyCodes = [51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82, 95, 96, 99];
const snowyCodes = [71, 73, 75, 77, 85, 86];

export function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getCurrentDate() {
  const d = new Date();
  const day = d.toLocaleString("en-US", { weekday: "long" });
  const month = d.toLocaleString("en-US", { month: "long" });
  const date = getOrdinal(d.getDate());

  return `${day} ${date} ${month}`;
}

export const formatTemp = (value) =>
  value === undefined || value === null ? "--" : Math.round(value);

export const formatNumber = (value, digits = 1) =>
  value === undefined || value === null ? "--" : Number(value).toFixed(digits);

export const formatTime = (value, options = {}) => {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", ...options });
};

export const buildFakeWeather = ({ name, code, isDay = 1, temp = 6, wind = 8 }) => {
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

export const rainFromCode = (code, windSpeed) => {
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

export const snowFromCode = (code, windSpeed) => {
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

export const windEffectFromSpeed = (windSpeed, gust) => {
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

export const sunshineFromCode = (code) => {
  if (code === 0) return { enabled: true, intensity: 1.2 }; // Sunny
  if (code === 1) return { enabled: true, intensity: 0.8 }; // Mostly clear
  if (code === 2) return { enabled: true, intensity: 0.5 }; // Partly cloudy
  if (code === 3) return { enabled: true, intensity: 0.4 }; // Mostly cloudy
  return { enabled: false };
};

export const cloudsFromCode = (code) => {
  if (code === 0 || code === 1) {
    return { enabled: false, intensity: 0, wind: 0 };
  }
  if (code === 2) {
    return { enabled: true, intensity: 0.65, wind: 0.05 };
  }
  if (code === 3 || code === 45 || code === 48) {
    return { enabled: true, intensity: 0.8, wind: 0.1 };
  }
  if (rainyCodes.includes(code)) {
    return { enabled: true, intensity: 1, wind: 0.15 };
  }
  return { enabled: false, intensity: 0, wind: 0 };
};

export const conditionFromCode = (code) => {
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

export const backgroundFromWeather = (code, isDay, windSpeed = 0, gust = 0) => {
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

export const getSummary = (data, isDaily = false) => {
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

  if (t <= 0) parts.push("Freezing conditions, wrap up warm! ");
  else if (t <= 4) parts.push("Chilly weather outside, possible frost in places. ");
  else if (t <= 10) parts.push("Cool out today. ");
  else if (t <= 20) parts.push("Mild out, light layers recommended. ");
  else if (t <= 25) parts.push("Warm and pleasant. ");
  else if (t <= 30) parts.push("Warm to hot weather today. ");
  else if (t <= 35) parts.push("It's set to be hot today. ");
  else if (t <= 40) parts.push("Hot temperatures today, stay inside during peak sunlight hours. ");
  else parts.push("Very hot outdoors, stay hydrated, avoid strenuous activity and keep pets inside. ");

  if (wind <= 1) parts.push("Calm and still. ");
  else if (wind <= 6) parts.push("Gentle breezes. ");
  else if (wind <= 20) parts.push("Moderate breezes. ");
  else if (wind <= 30) parts.push("Fresh breezes. ");
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

export const demoScenarios = [
  { label: "Sunny day", code: 0, temp: 24, wind: 6, isDay: 1 },
  { label: "Cloudy", code: 3, temp: 12, wind: 10, isDay: 1 },
  { label: "Cloudy Sunny", code: 3, temp: 18, wind: 8, isDay: 1 },
  { label: "Rain", code: 65, temp: 9, wind: 18, isDay: 1 },
  { label: "Snow", code: 75, temp: -2, wind: 12, isDay: 1 },
  { label: "Windy", code: 3, temp: 14, wind: 32, isDay: 1 },
  { label: "Storm", code: 96, temp: 14, wind: 28, isDay: 1 },
  { label: "Clear night", code: 0, temp: 8, wind: 4, isDay: 0 },
];
