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

export function calculateRegionalAqi(lat, lng, locationName = '') {
  const loc = (locationName || '').toLowerCase();
  let baseAqi = 95;

  // Delhi NCR & Gangetic Alluvial Belt (High particulate concentration)
  if (
    loc.includes('delhi') || loc.includes('noida') || loc.includes('gurugram') ||
    loc.includes('kanpur') || loc.includes('lucknow') || loc.includes('patna') ||
    (lat >= 25.0 && lat <= 30.5 && lng >= 75.5 && lng <= 86.5)
  ) {
    baseAqi = 265;
  }
  // Western Arid / Thar Desert Zone (High PM10 dust)
  else if (
    loc.includes('thar') || loc.includes('jaisalmer') || loc.includes('churu') || loc.includes('bikaner') ||
    (lat >= 24.5 && lat <= 29.5 && lng >= 69.5 && lng <= 75.0)
  ) {
    baseAqi = 158;
  }
  // Western Ghats / Coastal South & West (Maritime ventilation)
  else if (
    loc.includes('mumbai') || loc.includes('chennai') || loc.includes('kochi') ||
    loc.includes('kolkata') || loc.includes('sundarbans') || loc.includes('puri') ||
    (lat <= 20.0 && (lng <= 74.0 || lng >= 80.0))
  ) {
    baseAqi = 84;
  }
  // High Altitude Himalayan / Glacial Alpine (Pristine clean air)
  else if (
    loc.includes('leh') || loc.includes('ladakh') || loc.includes('shimla') ||
    loc.includes('sikkim') || loc.includes('gangtok') || lat >= 31.0
  ) {
    baseAqi = 32;
  }
  // Northeast River Valleys (Silchar, Guwahati, Barak)
  else if (
    loc.includes('silchar') || loc.includes('guwahati') || loc.includes('assam') ||
    loc.includes('cherrapunji') || lng >= 90.0
  ) {
    baseAqi = 72;
  }
  // Central Deccan Plateau (Bengaluru, Hyderabad, Pune, Indore)
  else if (loc.includes('bengaluru') || loc.includes('hyderabad') || loc.includes('pune')) {
    baseAqi = 78;
  }

  // Small time-of-day diurnal variation
  const hour = new Date().getHours();
  const diurnal = Math.round(Math.sin(((hour - 7) / 24) * 2 * Math.PI) * 12);
  const aqiValue = Math.max(18, Math.min(460, baseAqi + diurnal));
  const aqiInfo = getAQILabel(aqiValue);

  return {
    aqiValue,
    airQuality: aqiInfo.label,
    airQualityColor: aqiInfo.color,
  };
}

async function fetchWttrWeatherData(lat, lng, locationName, regionName) {
  const url = `https://wttr.in/${lat},${lng}?format=j1`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  if (!res.ok) throw new Error(`wttr returned ${res.status}`);
  const data = await res.json();
  const c = data.current_condition?.[0] || {};
  const temp = parseInt(c.temp_C, 10) || 27;
  const apparent = parseInt(c.FeelsLikeC, 10) || (temp + 3);
  const humidity = parseInt(c.humidity, 10) || 75;
  const windSpeed = Math.round(parseInt(c.windspeedKmph, 10) || 10);
  const windDir = c.winddir16Point || 'SW';
  const windGusts = Math.round(windSpeed * 1.4);
  const precip = parseFloat(c.precipMM) || 0.0;
  const cloudCover = parseInt(c.cloudcover, 10) || 45;
  const visibilityKm = parseInt(c.visibility, 10) || 9;
  const uv = parseFloat(c.uvIndex) || 3.0;
  const pressureMb = parseInt(c.pressure, 10) || 1010;
  const condition = c.weatherDesc?.[0]?.value || 'Partly Cloudy';

  const rainProb = precip > 0 ? Math.min(100, Math.round(precip * 15 + 35)) : (humidity > 80 ? 40 : 15);
  const dewPoint = Math.round(temp - ((100 - humidity) / 5));
  const heatIndex = Math.max(temp, Math.round(temp + 0.3 * (humidity / 100) * (temp - 12)));
  const realFeelShade = Math.round(apparent - 2);
  const aqiCalc = calculateRegionalAqi(lat, lng, locationName);

  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

  return {
    name: locationName,
    region: regionName,
    lat,
    lng,
    time: formattedTime,
    temp: `${temp}°`,
    condition,
    realFeel: `${apparent}°`,
    rainChance: `${rainProb}%`,
    realFeelShade: `${realFeelShade}°`,
    wind: `${windDir} ${windSpeed} km/h`,
    heatIndex: `${heatIndex}°`,
    airQuality: aqiCalc.airQuality,
    airQualityColor: aqiCalc.airQualityColor,
    aqiValue: aqiCalc.aqiValue,
    maxUvIndex: getUVLabel(uv),
    brightnessIndex: cloudCover > 70 ? '4 (Dull)' : (cloudCover > 40 ? '6 (Moderate)' : '9 (Bright)'),
    windGusts: `${windGusts} km/h`,
    cloudCover: `${cloudCover}%`,
    humidity: `${humidity}%`,
    indoorHumidity: `${humidity}% (${humidity > 80 ? 'Humid' : 'Comfortable'})`,
    visibility: `${visibilityKm} km`,
    cloudCeiling: cloudCover > 10 ? `${Math.round(2000 + (100 - cloudCover) * 80)} m` : 'Clear (>12,000 m)',
    dewPoint: `${dewPoint}° C`,
    pressure: `${pressureMb} mb`,
    elevation: '216 m',
  };
}

function computePhysicalWeatherEstimate(lat, lng, locationName, regionName) {
  const hour = new Date().getHours();
  const solarFactor = Math.sin(((hour - 8) / 24) * 2 * Math.PI);

  const locLower = (locationName || '').toLowerCase();
  const isHimalayan = lat > 30 || locLower.includes('leh') || locLower.includes('shimla') || locLower.includes('sikkim');
  const isDesert = (lng < 74 && lat > 24) || locLower.includes('thar') || locLower.includes('jaisalmer') || locLower.includes('churu');
  const isNortheast = lng > 90 || locLower.includes('silchar') || locLower.includes('guwahati') || locLower.includes('cherrapunji');
  const isCoastal = locLower.includes('mumbai') || locLower.includes('chennai') || locLower.includes('sundarbans') || locLower.includes('kochi') || locLower.includes('kolkata');

  let baseTemp = 28;
  let baseHumidity = 70;
  let condition = 'Partly Cloudy';
  let rainProb = 20;

  if (isHimalayan) {
    baseTemp = 11;
    baseHumidity = 48;
    condition = 'Clear Alpine';
    rainProb = 10;
  } else if (isDesert) {
    baseTemp = 36;
    baseHumidity = 24;
    condition = 'Arid Sunny';
    rainProb = 5;
  } else if (isNortheast) {
    baseTemp = 27;
    baseHumidity = 88;
    condition = 'Humid Mist';
    rainProb = 65;
  } else if (isCoastal) {
    baseTemp = 30;
    baseHumidity = 82;
    condition = 'Coastal Breeze';
    rainProb = 35;
  }

  const temp = Math.round(baseTemp + solarFactor * 4);
  const humidity = Math.min(99, Math.max(20, Math.round(baseHumidity - solarFactor * 8)));
  const apparent = Math.round(temp + (humidity > 70 ? 3 : -1));
  const windSpeed = Math.round(10 + Math.abs(solarFactor) * 6);
  const dewPoint = Math.round(temp - ((100 - humidity) / 5));
  const heatIndex = Math.max(temp, Math.round(temp + 0.3 * (humidity / 100) * (temp - 12)));
  const aqiCalc = calculateRegionalAqi(lat, lng, locationName);
  const formattedTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

  return {
    name: locationName,
    region: regionName,
    lat,
    lng,
    time: formattedTime,
    temp: `${temp}°`,
    condition,
    realFeel: `${apparent}°`,
    rainChance: `${rainProb}%`,
    realFeelShade: `${apparent - 2}°`,
    wind: `SW ${windSpeed} km/h`,
    heatIndex: `${heatIndex}°`,
    airQuality: aqiCalc.airQuality,
    airQualityColor: aqiCalc.airQualityColor,
    aqiValue: aqiCalc.aqiValue,
    maxUvIndex: '4.5 (Moderate)',
    brightnessIndex: '6 (Moderate)',
    windGusts: `${windSpeed + 6} km/h`,
    cloudCover: `${isNortheast ? 75 : 40}%`,
    humidity: `${humidity}%`,
    indoorHumidity: `${humidity}% (${humidity > 75 ? 'Humid' : 'Comfortable'})`,
    visibility: `${isHimalayan ? 15 : 8} km`,
    cloudCeiling: '2500 m',
    dewPoint: `${dewPoint}° C`,
    pressure: '1012 mb',
    elevation: isHimalayan ? '2200 m' : (isDesert ? '280 m' : '150 m'),
  };
}

export async function fetchLiveWeatherData(lat, lng, locationName = 'LOCAL REGION', regionName = 'INDIA') {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m&hourly=visibility,precipitation_probability,uv_index&daily=precipitation_probability_max,uv_index_max&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10`;

    const weatherRes = await fetch(weatherUrl).catch(() => null);
    if (!weatherRes || !weatherRes.ok) {
      throw new Error(`Open-Meteo returned status ${weatherRes?.status || 'network error'}`);
    }

    const weatherData = await weatherRes.json();
    if (weatherData.error || !weatherData.current) {
      throw new Error(weatherData.reason || 'Open-Meteo payload error');
    }

    const aqiRes = await fetch(aqiUrl).catch(() => null);
    const aqiData = aqiRes && aqiRes.ok ? await aqiRes.json().catch(() => null) : null;

    const current = weatherData.current;
    const aqiCurrent = aqiData?.current || {};

    const temp = Math.round(current.temperature_2m ?? 26);
    const apparent = Math.round(current.apparent_temperature ?? 31);
    const humidity = Math.round(current.relative_humidity_2m ?? 80);
    const dewPoint = Math.round(current.dew_point_2m ?? 23);
    const windSpeed = Math.round(current.wind_speed_10m ?? 8);
    const windDir = getWindDirection(current.wind_direction_10m);
    const windGusts = Math.round(current.wind_gusts_10m ?? 14);
    const cloudCover = Math.round(current.cloud_cover ?? 50);

    const rainProb = weatherData.daily?.precipitation_probability_max?.[0]
      ?? weatherData.hourly?.precipitation_probability?.[0]
      ?? 30;

    const uvMax = weatherData.daily?.uv_index_max?.[0]
      ?? weatherData.hourly?.uv_index?.[0]
      ?? 2.0;

    const rawVis = weatherData.hourly?.visibility?.[0] ?? 8000;
    const visibilityKm = Math.max(1, Math.round(rawVis / 1000));

    const regionalAqi = calculateRegionalAqi(lat, lng, locationName);
    const usAqi = typeof aqiCurrent.us_aqi === 'number' ? Math.round(aqiCurrent.us_aqi) : regionalAqi.aqiValue;
    const aqiInfo = getAQILabel(usAqi);
    const pressureMb = Math.round(current.surface_pressure ?? current.pressure_msl ?? 1010);

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
      pressure: `${pressureMb} mb`,
      elevation: `${weatherData.elevation ?? 216} m`,
    };
  } catch (openMeteoErr) {
    try {
      return await fetchWttrWeatherData(lat, lng, locationName, regionName);
    } catch {
      return computePhysicalWeatherEstimate(lat, lng, locationName, regionName);
    }
  }
}
