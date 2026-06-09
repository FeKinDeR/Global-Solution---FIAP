import { useEffect, useMemo, useState } from 'react'
import { calculateWeatherRisk } from '../utils/weatherRisk'

const SETTINGS_STORAGE_KEY = 'weather-site:notifications'
const LOCATIONS_STORAGE_KEY = 'weather-site:monitored-locations'

const defaultSettings = {
  phone: '',
  channel: 'whatsapp',
  enabled: false,
  severeRain: true,
  strongWind: true,
  highUv: true,
  temperatureDrop: false,
  period: 'morning'
}

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) }
  } catch {
    return defaultSettings
  }
}

function loadLocations() {
  try {
    return JSON.parse(localStorage.getItem(LOCATIONS_STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function cleanPhone(value) {
  return value.replace(/\D/g, '').slice(0, 13)
}

function formatPhone(value) {
  const digits = cleanPhone(value)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
}

function getAlertPreview(weather, settings, risk) {
  const channelLabel = {
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    both: 'WhatsApp e SMS'
  }[settings.channel]

  if (!weather?.current || !weather?.daily) {
    return `Cadastre o telefone para receber alertas por ${channelLabel}.`
  }

  const alerts = risk.reasons.filter((reason) => {
    if (reason.includes('chuva')) return settings.severeRain
    if (reason.includes('vento')) return settings.strongWind
    if (reason.includes('UV')) return settings.highUv
    return true
  })

  if (settings.temperatureDrop) {
    const todayMax = weather.daily.temperature_2m_max[0]
    const tomorrowMax = weather.daily.temperature_2m_max[1]
    if (tomorrowMax && todayMax - tomorrowMax >= 6) {
      alerts.push(`queda de temperatura de ${(todayMax - tomorrowMax).toFixed(1)}C`)
    }
  }

  if (alerts.length === 0 || risk.level === 'safe') {
    return `Nenhum alerta critico agora para ${weather.city}. O canal escolhido e ${channelLabel}.`
  }

  return `Envio por ${channelLabel}: alerta ${risk.label.toLowerCase()} para ${weather.city}: ${alerts.join(', ')}.`
}

function NotificationPanel({ weather, onSelectLocation }) {
  const [settings, setSettings] = useState(loadSettings)
  const [locations, setLocations] = useState(loadLocations)
  const [savedMessage, setSavedMessage] = useState('')

  const phoneIsValid = cleanPhone(settings.phone).length >= 10
  const risk = useMemo(() => calculateWeatherRisk(weather), [weather])
  const alertPreview = useMemo(() => getAlertPreview(weather, settings, risk), [weather, settings, risk])
  const channelLabel = {
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    both: 'WhatsApp e SMS'
  }[settings.channel]

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations))
  }, [locations])

  function updateSetting(key, value) {
    setSavedMessage('')
    setSettings((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!phoneIsValid) {
      setSavedMessage('Informe um celular valido com DDD.')
      return
    }
    setSettings((current) => ({ ...current, enabled: true, phone: formatPhone(current.phone) }))
    setSavedMessage(`Cadastro salvo. Alertas simulados serao enviados por ${channelLabel}.`)
  }

  function handleSaveCurrentLocation() {
    if (!weather) {
      setSavedMessage('Selecione uma cidade antes de adicionar aos locais monitorados.')
      return
    }

    const location = {
      id: `${weather.city}-${weather.latitude.toFixed(3)}-${weather.longitude.toFixed(3)}`,
      city: weather.city,
      countryCode: weather.countryCode,
      lat: weather.latitude,
      lon: weather.longitude,
      riskLabel: risk.label,
      riskLevel: risk.level
    }

    setLocations((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== location.id)
      return [location, ...withoutDuplicate].slice(0, 6)
    })
    setSavedMessage(`${weather.city} foi adicionada aos locais monitorados.`)
  }

  function handleRemoveLocation(id) {
    setLocations((current) => current.filter((location) => location.id !== id))
  }

  return (
    <section className="panel notification-panel">
      <div className="panel-heading">
        <div>
          <h2>Cadastro de alertas</h2>
          <p>Receba avisos simulados por WhatsApp ou SMS.</p>
        </div>
        <span className={`risk-badge risk-${risk.level}`}>{risk.label}</span>
      </div>

      <form className="notification-form" onSubmit={handleSubmit}>
        <label>
          Telefone para contato
          <input
            type="tel"
            inputMode="tel"
            value={settings.phone}
            onChange={(event) => updateSetting('phone', formatPhone(event.target.value))}
            placeholder="(11) 99999-9999"
          />
        </label>

        <label>
          Canal de envio
          <select value={settings.channel} onChange={(event) => updateSetting('channel', event.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="both">WhatsApp e SMS</option>
          </select>
        </label>

        <label>
          Frequencia dos avisos
          <select value={settings.period} onChange={(event) => updateSetting('period', event.target.value)}>
            <option value="morning">Resumo pela manha</option>
            <option value="instant">Aviso imediato</option>
            <option value="twice">Manha e fim da tarde</option>
          </select>
        </label>

        <div className="toggle-list">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.severeRain}
              onChange={(event) => updateSetting('severeRain', event.target.checked)}
            />
            Chuva forte
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.strongWind}
              onChange={(event) => updateSetting('strongWind', event.target.checked)}
            />
            Vento forte
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.highUv}
              onChange={(event) => updateSetting('highUv', event.target.checked)}
            />
            Indice UV alto
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.temperatureDrop}
              onChange={(event) => updateSetting('temperatureDrop', event.target.checked)}
            />
            Queda brusca de temperatura
          </label>
        </div>

        <div className={`alert-preview risk-card risk-${risk.level}`}>
          <span>Previa do alerta</span>
          <strong>{alertPreview}</strong>
        </div>

        <div className="notification-actions">
          <button type="submit">Cadastrar telefone</button>
          <button type="button" className="button-secondary" onClick={() => updateSetting('enabled', false)}>
            Pausar
          </button>
          <button type="button" className="button-secondary" onClick={handleSaveCurrentLocation}>
            Monitorar local
          </button>
        </div>
      </form>

      {savedMessage && <div className="status">{savedMessage}</div>}
      {settings.enabled && phoneIsValid && (
        <div className="status status-success">Alertas ativos por {channelLabel} para {settings.phone}.</div>
      )}

      <div className="monitored-section">
        <h3>Locais monitorados</h3>
        {locations.length === 0 ? (
          <div className="status status-muted">Nenhum local salvo ainda.</div>
        ) : (
          <div className="monitored-list">
            {locations.map((location) => (
              <div key={location.id} className="monitored-item">
                <button type="button" onClick={() => onSelectLocation(location)}>
                  <strong>{location.city}</strong>
                  <span className={`risk-dot risk-${location.riskLevel}`}>{location.riskLabel}</span>
                </button>
                <button type="button" className="icon-button" onClick={() => handleRemoveLocation(location.id)}>
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default NotificationPanel
