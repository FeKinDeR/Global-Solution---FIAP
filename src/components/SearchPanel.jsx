import { countryFlag, formatLocation } from '../utils/formatters'

function SearchPanel({
  countries,
  countryLoading,
  countryError,
  selectedCountryCode,
  selectedCity,
  cityOptions,
  customCity,
  searchResults,
  loading,
  onCountryChange,
  onCityChange,
  onCustomCityChange,
  onUseLocation,
  onSearchCustomCity,
  onSelectSearchResult
}) {
  return (
    <section className="panel search-panel">
      <h2>Menu de seleção</h2>
      {countryError && <div className="status status-error">{countryError}</div>}

      <div className="inputs-row">
        <label>
          País
          <select value={selectedCountryCode} onChange={onCountryChange} disabled={countryLoading}>
            {countries.map((country) => (
              <option key={country.cca2} value={country.cca2}>
                {countryFlag(country.cca2)} {country.name.common}
              </option>
            ))}
          </select>
        </label>

        <label>
          Cidade
          <select value={selectedCity} onChange={onCityChange} disabled={cityOptions.length === 0}>
            {cityOptions.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="button" className="button-primary" onClick={onUseLocation} disabled={loading}>
        Usar minha localização
      </button>

      <form onSubmit={onSearchCustomCity} className="search-form">
        <label>
          Buscar cidade
          <input
            value={customCity}
            onChange={(event) => onCustomCityChange(event.target.value)}
            placeholder="Digite o nome da cidade"
          />
        </label>
        <button type="submit" disabled={loading}>
          Buscar
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Resultados encontrados</h3>
          {searchResults.map((result) => (
            <button key={result.id} type="button" onClick={() => onSelectSearchResult(result)}>
              <span>{formatLocation(result)}</span>
              <small>{countryFlag(result.country_code)} {result.population ? `${result.population.toLocaleString('pt-BR')} hab.` : 'Local disponível'}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default SearchPanel
