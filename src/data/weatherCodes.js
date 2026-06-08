export const weatherCodes = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Parcialmente nublado', icon: '🌤️' },
  2: { label: 'Nublado', icon: '⛅' },
  3: { label: 'Muito nublado', icon: '☁️' },
  45: { label: 'Neblina', icon: '🌫️' },
  48: { label: 'Neblina congelante', icon: '🌫️' },
  51: { label: 'Chuvisco leve', icon: '🌦️' },
  53: { label: 'Chuvisco moderado', icon: '🌦️' },
  55: { label: 'Chuvisco forte', icon: '🌧️' },
  61: { label: 'Chuva leve', icon: '🌦️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  71: { label: 'Neve leve', icon: '🌨️' },
  73: { label: 'Neve moderada', icon: '🌨️' },
  75: { label: 'Neve forte', icon: '❄️' },
  80: { label: 'Chuva de verão', icon: '🌦️' },
  81: { label: 'Chuva forte', icon: '🌧️' },
  82: { label: 'Chuva intensa', icon: '⛈️' },
  95: { label: 'Trovoadas', icon: '⛈️' },
  96: { label: 'Trovoadas com granizo', icon: '⛈️' },
  99: { label: 'Trovoadas fortes com granizo', icon: '⛈️' }
}

export function getWeatherInfo(code) {
  return weatherCodes[code] || { label: 'Informação não disponível', icon: '🌡️' }
}
