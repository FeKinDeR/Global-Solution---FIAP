export function calculateWeatherRisk(weather) {
  if (!weather?.current || !weather?.daily) {
    return {
      level: 'neutral',
      label: 'Sem dados',
      score: 0,
      reasons: ['Escolha uma cidade para calcular o risco climático.']
    }
  }

  const reasons = []
  let score = 0
  const rain = weather.daily.precipitation_sum[0] || 0
  const wind = weather.daily.wind_speed_10m_max[0] || weather.current.wind_speed_10m || 0
  const uv = weather.daily.uv_index_max[0] || 0
  const currentCode = weather.current.weather_code

  if (rain >= 25) {
    score += 3
    reasons.push(`chuva intensa (${rain.toFixed(1)} mm)`)
  } else if (rain >= 10) {
    score += 2
    reasons.push(`chuva moderada (${rain.toFixed(1)} mm)`)
  } else if (rain >= 3) {
    score += 1
    reasons.push(`possibilidade de chuva (${rain.toFixed(1)} mm)`)
  }

  if (wind >= 55) {
    score += 3
    reasons.push(`vento muito forte (${wind.toFixed(0)} km/h)`)
  } else if (wind >= 35) {
    score += 2
    reasons.push(`vento forte (${wind.toFixed(0)} km/h)`)
  }

  if (uv >= 11) {
    score += 3
    reasons.push(`UV extremo (${uv.toFixed(1)})`)
  } else if (uv >= 8) {
    score += 2
    reasons.push(`UV alto (${uv.toFixed(1)})`)
  } else if (uv >= 6) {
    score += 1
    reasons.push(`UV moderado (${uv.toFixed(1)})`)
  }

  if ([95, 96, 99].includes(currentCode)) {
    score += 3
    reasons.push('risco de trovoadas')
  }

  if (score >= 5) {
    return { level: 'danger', label: 'Alerta', score, reasons }
  }
  if (score >= 2) {
    return { level: 'warning', label: 'Atenção', score, reasons }
  }
  return {
    level: 'safe',
    label: 'Normal',
    score,
    reasons: reasons.length ? reasons : ['sem risco climático relevante no momento']
  }
}

export function buildDailySummary(weather, info, risk) {
  if (!weather?.current || !weather?.daily) return 'Selecione uma cidade para ver o resumo.'

  const max = weather.daily.temperature_2m_max[0].toFixed(1)
  const min = weather.daily.temperature_2m_min[0].toFixed(1)
  const rain = weather.daily.precipitation_sum[0].toFixed(1)

  return `Hoje em ${weather.city}: ${weather.current.temperature_2m.toFixed(1)}°C agora, ${info.label.toLowerCase()}, máxima de ${max}°C, mínima de ${min}°C e ${rain} mm de chuva. Status: ${risk.label.toLowerCase()}.`
}
