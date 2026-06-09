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

const routeOptions = [
  { name: 'Abrigo municipal', distance: '2,4 km', status: 'Recebendo familias' },
  { name: 'Posto de saude', distance: '1,1 km', status: 'Equipe de apoio disponivel' },
  { name: 'Ponto alto seguro', distance: '850 m', status: 'Rota indicada para alagamento' }
]

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
  const [activePage, setActivePage] = useState('home')
  const [theme, setTheme] = useState(getStoredTheme)
  const [helpForm, setHelpForm] = useState({
    name: '',
    people: '1',
    route: routeOptions[0].name,
    priority: 'normal',
    message: ''
  })
  const [helpRequest, setHelpRequest] = useState(null)
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
          setCountryError(err.message || 'Nao foi possivel carregar paises')
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
        const city = locationLabel || selectedLocation?.name || 'Localizacao atual'

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
      setError('Geolocalizacao nao suportada neste navegador.')
      return
    }

    setLoading(true)
    setError('')
    setSearchResults([])
    setLocationLabel('Minha localizacao')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lon: position.coords.longitude })
      },
      () => {
        setLoading(false)
        setError('Nao foi possivel obter sua localizacao.')
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
        throw new Error('Cidade nao encontrada')
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
    setActivePage('forecast')
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  function handleHelpChange(event) {
    const { name, value } = event.target
    setHelpForm((current) => ({ ...current, [name]: value }))
  }

  function handleHelpSubmit(event) {
    event.preventDefault()
    const protocol = `GS-${Date.now().toString().slice(-6)}`
    const etaByRoute = {
      'Abrigo municipal': '18 min',
      'Posto de saude': '12 min',
      'Ponto alto seguro': '9 min'
    }

    setHelpRequest({
      ...helpForm,
      protocol,
      eta: etaByRoute[helpForm.route],
      status: helpForm.priority === 'urgente' ? 'Prioridade alta enviada' : 'Solicitacao registrada'
    })
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">Global Solution FIAP</span>
          <h1>AlertaClima</h1>
          <p>Monitoramento climatico, rotas seguras e pedido de ajuda em um prototipo front-end responsivo.</p>
        </div>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </header>

      <nav className="tabs" aria-label="Area principal">
        <button type="button" className={activePage === 'home' ? 'tab-active' : ''} onClick={() => setActivePage('home')}>
          Inicio
        </button>
        <button type="button" className={activePage === 'forecast' ? 'tab-active' : ''} onClick={() => setActivePage('forecast')}>
          Previsao
        </button>
        <button type="button" className={activePage === 'help' ? 'tab-active' : ''} onClick={() => setActivePage('help')}>
          Ajuda
        </button>
      </nav>

      {activePage === 'home' && (
        <main className="home-layout">
          <section className="panel intro-panel">
            <span className="eyebrow">Problema</span>
            <h2>Eventos climaticos extremos chegam rapido e deixam a populacao sem orientacao simples.</h2>
            <p>
              Chuvas intensas, ventos fortes e calor extremo podem bloquear vias, atrasar atendimento e dificultar
              decisoes importantes. A proposta do AlertaClima e reunir previsao, nivel de risco, rotas seguras e
              comunicacao simulada em uma interface unica.
            </p>
            <div className="intro-actions">
              <button type="button" onClick={() => setActivePage('forecast')}>Ver painel climatico</button>
              <button type="button" className="button-secondary" onClick={() => setActivePage('help')}>Simular ajuda</button>
            </div>
          </section>

          <section className="solution-grid" aria-label="Solucao proposta">
            <article className="panel solution-item">
              <span>01</span>
              <h3>Monitoramento</h3>
              <p>Consulta por pais, cidade, localizacao atual ou busca manual usando dados meteorologicos.</p>
            </article>
            <article className="panel solution-item">
              <span>02</span>
              <h3>Alerta visual</h3>
              <p>Classificacao automatica de risco com chuva, vento, indice UV e condicao atual.</p>
            </article>
            <article className="panel solution-item">
              <span>03</span>
              <h3>Acao rapida</h3>
              <p>Simulacao de envio de alerta, selecao de rota segura e registro de pedido de ajuda.</p>
            </article>
          </section>
        </main>
      )}

      {activePage === 'forecast' && (
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
          <WeatherResult weather={weather} loading={loading} error={error} />
        </main>
      )}

      {activePage === 'help' && (
        <main className="content">
          <section className="panel route-panel">
            <div className="panel-heading">
              <div>
                <h2>Rotas seguras</h2>
                <p>Selecione o destino mais adequado para a simulacao.</p>
              </div>
            </div>

            <div className="route-map" aria-label="Mapa visual de rotas">
              <span className="map-node map-origin">Voce</span>
              <span className="map-line line-one" />
              <span className="map-line line-two" />
              <span className="map-line line-three" />
              <span className="map-node shelter">Abrigo</span>
              <span className="map-node clinic">Saude</span>
              <span className="map-node highground">Ponto alto</span>
            </div>

            <form className="help-form" onSubmit={handleHelpSubmit}>
              <label>
                Nome
                <input name="name" value={helpForm.name} onChange={handleHelpChange} placeholder="Nome da pessoa" required />
              </label>
              <label>
                Pessoas afetadas
                <input name="people" type="number" min="1" max="20" value={helpForm.people} onChange={handleHelpChange} />
              </label>
              <label>
                Rota segura
                <select name="route" value={helpForm.route} onChange={handleHelpChange}>
                  {routeOptions.map((route) => (
                    <option key={route.name} value={route.name}>{route.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Prioridade
                <select name="priority" value={helpForm.priority} onChange={handleHelpChange}>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </label>
              <label className="full-field">
                Mensagem
                <input name="message" value={helpForm.message} onChange={handleHelpChange} placeholder="Ex.: rua alagada, energia instavel" />
              </label>
              <button type="submit">Enviar pedido simulado</button>
            </form>

            {helpRequest && (
              <div className="status status-success">
                Protocolo {helpRequest.protocol}: {helpRequest.status}. Rota: {helpRequest.route}. Tempo estimado: {helpRequest.eta}.
              </div>
            )}

            <div className="route-list">
              {routeOptions.map((route) => (
                <button
                  key={route.name}
                  type="button"
                  className={helpForm.route === route.name ? 'route-active' : ''}
                  onClick={() => setHelpForm((current) => ({ ...current, route: route.name }))}
                >
                  <strong>{route.name}</strong>
                  <span>{route.distance} - {route.status}</span>
                </button>
              ))}
            </div>
          </section>

          <NotificationPanel weather={weather} onSelectLocation={handleSelectMonitoredLocation} />
        </main>
      )}
    </div>
  )
}

export default App
