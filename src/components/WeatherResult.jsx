import { getWeatherInfo } from '../data/weatherCodes'
import { formatDate, formatHour } from '../utils/formatters'
import { buildDailySummary, calculateWeatherRisk } from '../utils/weatherRisk'

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function WeatherResult({ weather, loading, error }) {
  const current = weather?.current
  const info = current ? getWeatherInfo(current.weather_code) : null
  const risk = calculateWeatherRisk(weather)
  const dailySummary = buildDailySummary(weather, info || { label: '' }, risk)
  const mapEmbedUrl = weather
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${weather.longitude - 0.5}%2C${weather.latitude - 0.25}%2C${weather.longitude + 0.5}%2C${weather.latitude + 0.25}&layer=mapnik&marker=${weather.latitude}%2C${weather.longitude}`
    : ''

  return (
    <section className="panel weather-panel">
      <div className="panel-heading">
        <div>
          <h2>Resultado</h2>
          <p>Resumo e previsão para o local escolhido.</p>
        </div>
        <span className={`risk-badge risk-${risk.level}`}>{risk.label}</span>
      </div>

      {loading && <div className="status">Carregando dados do tempo...</div>}
      {error && <div className="status status-error">{error}</div>}

      {weather && !loading && (
        <div>
          <div className={`daily-summary risk-card risk-${risk.level}`}>
            <span>Resumo do dia</span>
            <strong>{dailySummary}</strong>
          </div>

          <div className="weather-summary">
            <div className="weather-title">
              <span className="weather-icon" aria-hidden="true">{info.icon}</span>
              <div>
                <h3>{weather.city}</h3>
                <p>{info.label}</p>
                <p>
                  Lat: {weather.latitude.toFixed(3)}, Lon: {weather.longitude.toFixed(3)}
                </p>
              </div>
            </div>
            <div className="temperature">
              <span>{current.temperature_2m.toFixed(1)}°C</span>
              <p>Sensação: {current.apparent_temperature.toFixed(1)}°C</p>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard label="Umidade" value={`${current.relative_humidity_2m}%`} />
            <StatCard label="Vento" value={`${current.wind_speed_10m} km/h`} />
            <StatCard label="Chuva agora" value={`${current.precipitation.toFixed(1)} mm`} />
            <StatCard label="UV máx. hoje" value={weather.daily.uv_index_max[0].toFixed(1)} />
            <StatCard label="Nascer do sol" value={formatHour(weather.daily.sunrise[0])} />
            <StatCard label="Pôr do sol" value={formatHour(weather.daily.sunset[0])} />
          </div>

          <div className="weather-map">
            <iframe title={`Mapa de ${weather.city}`} src={mapEmbedUrl} loading="lazy" allowFullScreen />
          </div>

          {weather.hourly && (
            <div className="hourly-section">
              <h3>Previsão do dia</h3>
              <div className="hourly-slider-wrapper">
                <div className="hourly-slider">
                  {weather.hourly.time.slice(0, 24).map((hour, index) => {
                    const hourlyInfo = getWeatherInfo(weather.hourly.weather_code[index])
                    return (
                      <div key={hour} className="hourly-card">
                        <span aria-hidden="true">{hourlyInfo.icon}</span>
                        <strong>{formatHour(hour)}</strong>
                        <p>{weather.hourly.temperature_2m[index].toFixed(1)}°C</p>
                        <p>{weather.hourly.precipitation_probability[index]}% chuva</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="forecast-section">
            <h3>Próximos dias</h3>
            <div className="forecast-grid">
              {weather.daily.time.slice(1, 5).map((date, index) => {
                const offset = index + 1
                const dayCode = weather.hourly?.weather_code?.[offset * 24] || current.weather_code
                const dayInfo = getWeatherInfo(dayCode)
                return (
                  <div key={date} className="forecast-card visual-card">
                    <span aria-hidden="true">{dayInfo.icon}</span>
                    <strong>{formatDate(date)}</strong>
                    <p>{dayInfo.label}</p>
                    <div>
                      <b>{weather.daily.temperature_2m_max[offset].toFixed(1)}°C</b>
                      <small>máx.</small>
                    </div>
                    <p>Mín: {weather.daily.temperature_2m_min[offset].toFixed(1)}°C</p>
                    <p>Precip: {weather.daily.precipitation_sum[offset].toFixed(1)} mm</p>
                    <p>Vento: {weather.daily.wind_speed_10m_max[offset].toFixed(0)} km/h</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {!weather && !loading && !error && (
        <div className="status">Selecione uma cidade ou use sua localização para começar.</div>
      )}
    </section>
  )
}

export default WeatherResult
