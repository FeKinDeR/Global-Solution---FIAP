import { useEffect, useMemo, useState } from 'react'
import './App.css'

const curatedCities = {
  BR: [
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
    { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
    { name: 'Curitiba', lat: -25.4284, lon: -49.2733 }
  ],
  US: [
    { name: 'Nova York', lat: 40.7128, lon: -74.006 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 }
  ],
  PT: [
    { name: 'Lisboa', lat: 38.7223, lon: -9.1393 },
    { name: 'Porto', lat: 41.1579, lon: -8.6291 },
    { name: 'Faro', lat: 37.0194, lon: -7.9304 }
  ],
  JP: [
    { name: 'Tóquio', lat: 35.6895, lon: 139.6917 },
    { name: 'Osaka', lat: 34.6937, lon: 135.5023 },
    { name: 'Quioto', lat: 35.0116, lon: 135.7681 }
  ],
  FR: [
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Marselha', lat: 43.2965, lon: 5.3698 },
    { name: 'Lyon', lat: 45.7640, lon: 4.8357 }
  ],
  IN: [
    { name: 'Nova Déli', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 }
  ],
  CN: [
    { name: 'Pequim', lat: 39.9042, lon: 116.4074 },
    { name: 'Xangai', lat: 31.2304, lon: 121.4737 },
    { name: 'Guangzhou', lat: 23.1291, lon: 113.2644 }
  ]
}

const weatherCodes = {
  0: 'Céu limpo',
  1: 'Parcialmente nublado',
  2: 'Nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina congelante',
  51: 'Chuvisco leve',
  53: 'Chuvisco moderado',
  55: 'Chuvisco forte',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  80: 'Chuva de verão',
  81: 'Chuva forte',
  82: 'Chuva intensa'
}

function countryFlag(code) {
  if (!code) return ''
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('')
}

function App() {
  const [countries, setCountries] = useState([])
  const [countryLoading, setCountryLoading] = useState(true)
  const [countryError, setCountryError] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('BR')
  const [selectedCity, setSelectedCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [coords, setCoords] = useState(null)
  const [locationLabel, setLocationLabel] = useState('')

  useEffect(() => {
    async function loadCountries() {
      setCountryLoading(true)
      setCountryError('')
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,capital,latlng')
        if (!response.ok) {
          throw new Error('Erro ao carregar países')
        }
        const data = await response.json()
        const sorted = data
          .filter((country) => country.name?.common)
          .sort((a, b) => a.name.common.localeCompare(b.name.common, 'pt', { sensitivity: 'base' }))
        setCountries(sorted)
        const defaultCode = sorted.find((country) => country.cca2 === 'BR') ? 'BR' : sorted[0]?.cca2
        setSelectedCountryCode(defaultCode)
      } catch (err) {
        setCountryError(err.message || 'Não foi possível carregar países')
      } finally {
        setCountryLoading(false)
      }
    }

    loadCountries()
  }, [])

  const selectedCountry = useMemo(
    () => countries.find((country) => country.cca2 === selectedCountryCode),
    [countries, selectedCountryCode]
  )

  const cityOptions = useMemo(() => {
    if (!selectedCountry) return []
    if (curatedCities[selectedCountry.cca2]) {
      return curatedCities[selectedCountry.cca2]
    }
    if (selectedCountry.capital?.length > 0) {
      return selectedCountry.capital.map((capital) => ({
        name: capital,
        lat: selectedCountry.latlng?.[0] || 0,
        lon: selectedCountry.latlng?.[1] || 0
      }))
    }
    return [
      {
        name: selectedCountry.name.common,
        lat: selectedCountry.latlng?.[0] || 0,
        lon: selectedCountry.latlng?.[1] || 0
      }
    ]
  }, [selectedCountry])

  const selectedLocation = useMemo(
    () => cityOptions.find((city) => city.name === selectedCity) || cityOptions[0],
    [cityOptions, selectedCity]
  )

  useEffect(() => {
    if (cityOptions.length > 0 && !cityOptions.some((city) => city.name === selectedCity)) {
      setSelectedCity(cityOptions[0].name)
    }
  }, [cityOptions, selectedCity])

  useEffect(() => {
    if (coords) {
      fetchWeather(coords.lat, coords.lon, locationLabel)
    } else if (selectedLocation) {
      fetchWeather(selectedLocation.lat, selectedLocation.lon)
    }
  }, [selectedLocation, coords, locationLabel])

  async function fetchWeather(lat, lon, label) {
    setLoading(true)
    setError('')
    setWeather(null)

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do tempo')
      }
      const data = await response.json()
      setWeather({
        city: label || selectedLocation?.name || 'Localização atual',
        latitude: lat,
        longitude: lon,
        current: data.current_weather,
        daily: data.daily,
        hourly: data.hourly
      })
    } catch (err) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  function handleCountryChange(event) {
    setSelectedCountryCode(event.target.value)
    setCoords(null)
    setLocationLabel('')
  }

  function handleCityChange(event) {
    setSelectedCity(event.target.value)
    setCoords(null)
    setLocationLabel('')
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador.')
      return
    }
    setLoading(true)
    setError('')
    setLocationLabel('Minha localização')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lon: position.coords.longitude })
      },
      () => {
        setLoading(false)
        setError('Não foi possível obter sua localização.')
      }
    )
  }

  async function handleSearchCustomCity(event) {
    event.preventDefault()
    if (!customCity.trim()) {
      setError('Digite o nome da cidade para buscar.')
      return
    }
    setLoading(true)
    setError('')
    setCoords(null)

    try {
      const query = encodeURIComponent(customCity.trim())
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=pt&format=json`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro na busca de cidade')
      }
      const data = await response.json()
      if (!data.results || data.results.length === 0) {
        throw new Error('Cidade não encontrada')
      }
      const first = data.results[0]
      setWeather(null)
      setLocationLabel(`${first.name}, ${first.country || ''}`)
      setCoords({ lat: first.latitude, lon: first.longitude })
      if (first.country_code) {
        setSelectedCountryCode(first.country_code)
      }
      setSelectedCity(first.name)
    } catch (err) {
      setError(err.message || 'Erro na busca da cidade')
      setLoading(false)
    }
  }

  const description = weather ? weatherCodes[weather.current.weathercode] || 'Informação não disponível' : ''
  const mapEmbedUrl = weather
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${weather.longitude - 0.5}%2C${weather.latitude - 0.25}%2C${weather.longitude + 0.5}%2C${weather.latitude + 0.25}&layer=mapnik&marker=${weather.latitude}%2C${weather.longitude}`
    : ''

  function formatDate(dateString) {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  function formatHour(dateString) {
    const date = new Date(dateString)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>Previsão do Tempo</h1>
          <p>Escolha país, cidade ou use sua localização para ver a previsão.</p>
        </div>
      </header>

      <main className="content">
        <section className="panel">
          <h2>Menu de seleção</h2>
          {countryError && <div className="status status-error">{countryError}</div>}
          <div className="inputs-row">
            <label>
              País
              <select value={selectedCountryCode} onChange={handleCountryChange} disabled={countryLoading}>
                {countries.map((country) => (
                  <option key={country.cca2} value={country.cca2}>
                    {countryFlag(country.cca2)} {country.name.common}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Cidade
              <select value={selectedCity} onChange={handleCityChange}>
                {cityOptions.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="button" className="button-primary" onClick={handleUseLocation}>
            Usar minha localização
          </button>

          <form onSubmit={handleSearchCustomCity} className="search-form">
            <label>
              Buscar cidade
              <input
                value={customCity}
                onChange={(event) => setCustomCity(event.target.value)}
                placeholder="Digite o nome da cidade"
              />
            </label>
            <button type="submit">Buscar</button>
          </form>
        </section>

        <section className="panel weather-panel">
          <h2>Resultado</h2>
          {loading && <div className="status">Carregando dados do tempo...</div>}
          {error && <div className="status status-error">{error}</div>}

          {weather && !loading && (
            <div>
              <div className="weather-summary">
                <div>
                  <h3>{weather.city}</h3>
                  <p>{description}</p>
                  <p>
                    Lat: {weather.latitude.toFixed(3)}, Lon: {weather.longitude.toFixed(3)}
                  </p>
                </div>
                <div className="temperature">
                  <span>{weather.current.temperature.toFixed(1)}°C</span>
                  <p>Velocidade do vento: {weather.current.windspeed} km/h</p>
                </div>
              </div>

              <div className="weather-map">
                <iframe
                  title={`Mapa de ${weather.city}`}
                  src={mapEmbedUrl}
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              {weather.hourly && (
                <div className="hourly-section">
                  <h3>Previsão do dia</h3>
                  <div className="hourly-slider-wrapper">
                    <div className="hourly-slider">
                      {weather.hourly.time.slice(0, 24).map((hour, index) => (
                        <div key={hour} className="hourly-card">
                          <strong>{formatHour(hour)}</strong>
                          <p>{weather.hourly.temperature_2m[index].toFixed(1)}°C</p>
                          <p>{weather.hourly.precipitation[index].toFixed(1)} mm</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="forecast-grid">
                {weather.daily.time.slice(1, 4).map((date, index) => {
                  const offset = index + 1
                  return (
                    <div key={date} className="forecast-card">
                      <strong>{formatDate(date)}</strong>
                      <p>Máx: {weather.daily.temperature_2m_max[offset].toFixed(1)}°C</p>
                      <p>Mín: {weather.daily.temperature_2m_min[offset].toFixed(1)}°C</p>
                      <p>Precip: {weather.daily.precipitation_sum[offset].toFixed(1)} mm</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!weather && !loading && !error && (
            <div className="status">Selecione uma cidade ou use sua localização para começar.</div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
