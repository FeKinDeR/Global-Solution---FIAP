import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import NotificationPanel from './components/NotificationPanel'
import SearchPanel from './components/SearchPanel'
import WeatherResult from './components/WeatherResult'
import { curatedCities } from './data/curatedCities'
import { fetchCountries, fetchWeatherForecast, searchCities } from './services/weatherApi'
import { formatLocation } from './utils/formatters'

const LOCATION_STORAGE_KEY = 'weather-site:last-location'
const THEME_STORAGE_KEY = 'weather-site:theme'

function getStoredLocation() {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY))
  } catch {
    return null
  }
}

function saveStoredLocation(location) {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
}

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'dark'
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
  const [searchResults, setSearchResults] = useState([])
  const [activeTab, setActiveTab] = useState('forecast')
  const [theme, setTheme] = useState(getStoredTheme)
  const weatherAbortRef = useRef(null)

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const controller = new AbortController()

    async function loadCountries() {
      setCountryLoading(true)
      setCountryError('')
      try {
        const sorted = await fetchCountries({ signal: controller.signal })
        const storedLocation = getStoredLocation()
        const defaultCode = storedLocation?.countryCode || (sorted.find((country) => country.cca2 === 'BR') ? 'BR' : sorted[0]?.cca2)

        setCountries(sorted)
        setSelectedCountryCode(defaultCode)
        if (storedLocation?.city) {
          setSelectedCity(storedLocation.city)
        }
        if (storedLocation?.coords) {
          setCoords(storedLocation.coords)
          setLocationLabel(storedLocation.label || storedLocation.city)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setCountryError(err.message || 'Não foi possível carregar países')
        }
      } finally {
        setCountryLoading(false)
      }
    }

    loadCountries()
    return () => controller.abort()
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
    if (!coords && cityOptions.length > 0 && !cityOptions.some((city) => city.name === selectedCity)) {
      setSelectedCity(cityOptions[0].name)
    }
  }, [cityOptions, coords, selectedCity])

  useEffect(() => {
    const location = coords || selectedLocation
    if (!location) return undefined

    const controller = new AbortController()
    weatherAbortRef.current?.abort()
    weatherAbortRef.current = controller

    async function loadWeather() {
      setLoading(true)
      setError('')
      setWeather(null)

      try {
        const data = await fetchWeatherForecast({
          lat: location.lat,
          lon: location.lon,
          signal: controller.signal
        })
        const city = locationLabel || selectedLocation?.name || 'Localização atual'

        setWeather({
          city,
          countryCode: selectedCountryCode,
          latitude: location.lat,
          longitude: location.lon,
          current: data.current,
          daily: data.daily,
          hourly: data.hourly
        })

        saveStoredLocation({
          countryCode: selectedCountryCode,
          city,
          label: city,
          coords: { lat: location.lat, lon: location.lon }
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Erro inesperado')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadWeather()
    return () => controller.abort()
  }, [coords, locationLabel, selectedCountryCode, selectedLocation])

  function clearCustomLocation() {
    setCoords(null)
    setLocationLabel('')
    setSearchResults([])
  }

  function handleCountryChange(event) {
    setSelectedCountryCode(event.target.value)
    clearCustomLocation()
  }

  function handleCityChange(event) {
    setSelectedCity(event.target.value)
    clearCustomLocation()
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador.')
      return
    }

    setLoading(true)
    setError('')
    setSearchResults([])
    setLocationLabel('Minha localização')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lon: position.coords.longitude })
      },
      () => {
        setLoading(false)
        setError('Não foi possível obter sua localização.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSearchCustomCity(event) {
    event.preventDefault()
    const query = customCity.trim()

    if (query.length < 2) {
      setError('Digite pelo menos 2 letras para buscar uma cidade.')
      return
    }

    const controller = new AbortController()
    weatherAbortRef.current?.abort()
    setLoading(true)
    setError('')
    setSearchResults([])

    try {
      const results = await searchCities(query, { signal: controller.signal })
      if (results.length === 0) {
        throw new Error('Cidade não encontrada')
      }

      setSearchResults(results)
      if (results.length === 1) {
        handleSelectSearchResult(results[0])
      } else {
        setWeather(null)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Erro na busca da cidade')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSelectSearchResult(result) {
    const label = formatLocation(result)
    setLocationLabel(label)
    setCoords({ lat: result.latitude, lon: result.longitude })
    setSearchResults([])
    setCustomCity(result.name)
    if (result.country_code) {
      setSelectedCountryCode(result.country_code)
    }
    setSelectedCity(result.name)
  }

  function handleSelectMonitoredLocation(location) {
    setSelectedCountryCode(location.countryCode || selectedCountryCode)
    setSelectedCity(location.city)
    setLocationLabel(location.city)
    setCoords({ lat: location.lat, lon: location.lon })
    setActiveTab('forecast')
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>Previsão do Tempo</h1>
          <p>Escolha país, cidade ou use sua localização para ver a previsão.</p>
        </div>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </header>

      <nav className="tabs" aria-label="Área principal">
        <button
          type="button"
          className={activeTab === 'forecast' ? 'tab-active' : ''}
          onClick={() => setActiveTab('forecast')}
        >
          Previsão
        </button>
        <button
          type="button"
          className={activeTab === 'notifications' ? 'tab-active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          Notificações
        </button>
      </nav>

      <main className="content">
        <SearchPanel
          countries={countries}
          countryLoading={countryLoading}
          countryError={countryError}
          selectedCountryCode={selectedCountryCode}
          selectedCity={selectedCity}
          cityOptions={cityOptions}
          customCity={customCity}
          searchResults={searchResults}
          loading={loading}
          onCountryChange={handleCountryChange}
          onCityChange={handleCityChange}
          onCustomCityChange={setCustomCity}
          onUseLocation={handleUseLocation}
          onSearchCustomCity={handleSearchCustomCity}
          onSelectSearchResult={handleSelectSearchResult}
        />

        {activeTab === 'forecast' ? (
          <WeatherResult weather={weather} loading={loading} error={error} />
        ) : (
          <NotificationPanel weather={weather} onSelectLocation={handleSelectMonitoredLocation} />
        )}
      </main>
    </div>
  )
}

export default App
