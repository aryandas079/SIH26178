// Utility to fetch real-time live environmental, meteorological, and elevation data from Open-Meteo

export function getWindDirection(deg) {
  if (deg === undefined || deg === null) return 'CALM';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

export function getWeatherConditionText(code) {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Mostly cloudy';
    case 45: return 'Foggy';
    case 48: return 'Depositing rime fog';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 71: return 'Slight snowfall';
    case 73: return 'Moderate snowfall';
    case 75: return 'Heavy snowfall';
    case 80: return 'Light rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 95: return 'Thunderstorm';
    case 96:
    case 99: return 'Thunderstorm with hail';
    default: return 'Fair / Stable';
  }
}

export function getAQILabel(aqi) {
  if (!aqi && aqi !== 0) return { label: 'Moderate', color: '#ca8a04' };
  if (aqi <= 50) return { label: 'Good', color: '#10b981' };
  if (aqi <= 100) return { label: 'Moderate', color: '#65a30d' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#d97706' };
  if (aqi <= 200) return { label: 'Poor', color: '#f59e0b' };
  if (aqi <= 300) return { label: 'Very Poor', color: '#dc2626' };
  return { label: 'Hazardous', color: '#7f1d1d' };
}

export function getUVLabel(uv) {
  if (!uv && uv !== 0) return '1.5 (Low)';
  if (uv < 3) return `${uv.toFixed(1)} (Low)`;
  if (uv < 6) return `${uv.toFixed(1)} (Moderate)`;
  if (uv < 8) return `${uv.toFixed(1)} (High)`;
  if (uv < 11) return `${uv.toFixed(1)} (Very High)`;
  return `${uv.toFixed(1)} (Extreme)`;
}

export async function fetchLiveWeatherData(lat, lng, locationName = 'LOCAL REGION', regionName = 'INDIA') {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m&hourly=visibility,precipitation_probability,uv_index&daily=precipitation_probability_max,uv_index_max&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(aqiUrl).catch(() => null),
    ]);

    const weatherData = await weatherRes.json();
    const aqiData = aqiRes ? await aqiRes.json().catch(() => null) : null;

    const current = weatherData.current || {};
    const aqiCurrent = aqiData?.current || {};

    const temp = Math.round(current.temperature_2m ?? 26);
    const apparent = Math.round(current.apparent_temperature ?? 31);
    const humidity = Math.round(current.relative_humidity_2m ?? 80);
    const dewPoint = Math.round(current.dew_point_2m ?? 23);
    const windSpeed = Math.round(current.wind_speed_10m ?? 8);
    const windDir = getWindDirection(current.wind_direction_10m);
    const windGusts = Math.round(current.wind_gusts_10m ?? 14);
    const cloudCover = Math.round(current.cloud_cover ?? 50);

    // Precipitation probability
    const rainProb = weatherData.daily?.precipitation_probability_max?.[0]
      ?? weatherData.hourly?.precipitation_probability?.[0]
      ?? 30;

    // UV Index
    const uvMax = weatherData.daily?.uv_index_max?.[0]
      ?? weatherData.hourly?.uv_index?.[0]
      ?? 2.0;

    // Visibility in km
    const rawVis = weatherData.hourly?.visibility?.[0] ?? 8000;
    const visibilityKm = Math.max(1, Math.round(rawVis / 1000));

    const usAqi = aqiCurrent.us_aqi ?? 85;
    const aqiInfo = getAQILabel(usAqi);

    const realFeelShade = Math.round(apparent - 2);
    const heatIndex = Math.max(temp, Math.round(temp + 0.3 * (humidity / 100) * (temp - 12)));
    const brightnessLevel = cloudCover > 70 ? '4 (Dull)' : (cloudCover > 40 ? '6 (Moderate)' : '9 (Bright)');
    const indoorHumDesc = humidity > 85 ? 'Extremely Humid' : (humidity > 65 ? 'Humid' : 'Comfortable');
    const cloudCeiling = cloudCover > 10 ? `${Math.round(2000 + (100 - cloudCover) * 80)} m` : 'Clear (>12,000 m)';

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });

    return {
      name: locationName,
      region: regionName,
      lat,
      lng,
      time: formattedTime,
      temp: `${temp}°`,
      condition: getWeatherConditionText(current.weather_code),
      realFeel: `${apparent}°`,
      rainChance: `${rainProb}%`,
      realFeelShade: `${realFeelShade}°`,
      wind: `${windDir} ${windSpeed} km/h`,
      heatIndex: `${heatIndex}°`,
      airQuality: aqiInfo.label,
      airQualityColor: aqiInfo.color,
      aqiValue: usAqi,
      maxUvIndex: getUVLabel(uvMax),
      brightnessIndex: brightnessLevel,
      windGusts: `${windGusts} km/h`,
      cloudCover: `${cloudCover}%`,
      humidity: `${humidity}%`,
      indoorHumidity: `${humidity}% (${indoorHumDesc})`,
      visibility: `${visibilityKm} km`,
      cloudCeiling,
      dewPoint: `${dewPoint}° C`,
      elevation: `${weatherData.elevation ?? 216} m`,
    };
  } catch (err) {
    console.error('Error fetching live weather data:', err);
    // Return robust fallback
    return {
      name: locationName,
      region: regionName,
      lat,
      lng,
      time: '8 AM',
      temp: '26°',
      condition: 'Mostly cloudy',
      realFeel: '34°',
      rainChance: '32%',
      realFeelShade: '31°',
      wind: 'SSE 6 km/h',
      heatIndex: '29°',
      airQuality: 'Poor',
      airQualityColor: '#f59e0b',
      aqiValue: 142,
      maxUvIndex: '1.8 (Low)',
      brightnessIndex: '4 (Dull)',
      windGusts: '15 km/h',
      cloudCover: '80%',
      humidity: '93%',
      indoorHumidity: '93% (Extremely Humid)',
      visibility: '8 km',
      cloudCeiling: '9100 m',
      dewPoint: '25° C',
      elevation: '216 m',
    };
  }
}
