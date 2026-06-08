const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,capital,latlng'

async function parseJsonResponse(response, fallbackMessage) {
  if (!response.ok) {
    throw new Error(fallbackMessage)
  }
  return response.json()
}

export async function fetchCountries({ signal } = {}) {
  const response = await fetch(COUNTRIES_URL, { signal })
  const data = await parseJsonResponse(response, 'Erro ao carregar países')

  return data
    .filter((country) => country.name?.common)
    .sort((a, b) => a.name.common.localeCompare(b.name.common, 'pt', { sensitivity: 'base' }))
}

export async function fetchWeatherForecast({ lat, lon, signal }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m'
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation',
      'precipitation_probability',
      'weather_code',
      'relative_humidity_2m',
      'wind_speed_10m'
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'uv_index_max',
      'wind_speed_10m_max',
      'sunrise',
      'sunset'
    ].join(','),
    timezone: 'auto'
  })

  const response = await fetch(`${FORECAST_URL}?${params.toString()}`, { signal })
  return parseJsonResponse(response, 'Erro ao buscar dados do tempo')
}

export async function searchCities(query, { signal } = {}) {
  const params = new URLSearchParams({
    name: query,
    count: '6',
    language: 'pt',
    format: 'json'
  })

  const response = await fetch(`${GEOCODING_URL}?${params.toString()}`, { signal })
  const data = await parseJsonResponse(response, 'Erro na busca de cidade')
  return data.results || []
}
