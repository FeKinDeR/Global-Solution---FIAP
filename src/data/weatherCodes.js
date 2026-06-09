export const weatherCodes = {
  0: { label: 'Ceu limpo', icon: '\u2600\ufe0f' },
  1: { label: 'Parcialmente nublado', icon: '\ud83c\udf24\ufe0f' },
  2: { label: 'Nublado', icon: '\u26c5' },
  3: { label: 'Muito nublado', icon: '\u2601\ufe0f' },
  45: { label: 'Neblina', icon: '\ud83c\udf2b\ufe0f' },
  48: { label: 'Neblina congelante', icon: '\ud83c\udf2b\ufe0f' },
  51: { label: 'Chuvisco leve', icon: '\ud83c\udf26\ufe0f' },
  53: { label: 'Chuvisco moderado', icon: '\ud83c\udf26\ufe0f' },
  55: { label: 'Chuvisco forte', icon: '\ud83c\udf27\ufe0f' },
  61: { label: 'Chuva leve', icon: '\ud83c\udf26\ufe0f' },
  63: { label: 'Chuva moderada', icon: '\ud83c\udf27\ufe0f' },
  65: { label: 'Chuva forte', icon: '\ud83c\udf27\ufe0f' },
  71: { label: 'Neve leve', icon: '\ud83c\udf28\ufe0f' },
  73: { label: 'Neve moderada', icon: '\ud83c\udf28\ufe0f' },
  75: { label: 'Neve forte', icon: '\u2744\ufe0f' },
  80: { label: 'Chuva de verao', icon: '\ud83c\udf26\ufe0f' },
  81: { label: 'Chuva forte', icon: '\ud83c\udf27\ufe0f' },
  82: { label: 'Chuva intensa', icon: '\u26c8\ufe0f' },
  95: { label: 'Trovoadas', icon: '\u26c8\ufe0f' },
  96: { label: 'Trovoadas com granizo', icon: '\u26c8\ufe0f' },
  99: { label: 'Trovoadas fortes com granizo', icon: '\u26c8\ufe0f' }
}

export function getWeatherInfo(code) {
  return weatherCodes[code] || { label: 'Informacao nao disponivel', icon: '\ud83c\udf21\ufe0f' }
}
