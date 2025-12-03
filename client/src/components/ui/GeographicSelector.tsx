import { useState, useEffect, useRef } from 'react';

interface GeographicSelectorProps {
  value: GeographicLocation | null;
  onChange: (location: GeographicLocation | null) => void;
  label?: string;
  required?: boolean;
}

export interface GeographicLocation {
  region?: string; // Région du monde (ex: Europe, Amérique du Nord, etc.)
  country?: string; // Code pays ISO (ex: FR, US, etc.)
  countryName?: string; // Nom du pays
  city?: string; // Ville
  department?: string; // Département/État/Province
  postalCode?: string; // Code postal (optionnel)
}

const WORLD_REGIONS = [
  { value: 'europe', label: 'Europe' },
  { value: 'north_america', label: 'Amérique du Nord' },
  { value: 'south_america', label: 'Amérique du Sud' },
  { value: 'asia', label: 'Asie' },
  { value: 'africa', label: 'Afrique' },
  { value: 'oceania', label: 'Océanie' },
  { value: 'middle_east', label: 'Moyen-Orient' },
];

export function GeographicSelector({ value, onChange, label = 'Zone géographique', required = false }: GeographicSelectorProps) {
  const [region, setRegion] = useState<string>(value?.region || '');
  const [country, setCountry] = useState<string>(value?.country || '');
  const [countryName, setCountryName] = useState<string>(value?.countryName || '');
  const [city, setCity] = useState<string>(value?.city || '');
  const [department, setDepartment] = useState<string>(value?.department || '');
  
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [cities, setCities] = useState<Array<{ name: string; region?: string; department?: string; departmentCode?: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ code: string; name: string }>>([]);
  
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const countryInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const departmentInputRef = useRef<HTMLInputElement>(null);

  // Load countries when region changes
  useEffect(() => {
    if (region) {
      loadCountriesByRegion(region);
    } else {
      setCountries([]);
      setCountry('');
      setCountryName('');
    }
  }, [region]);

  // Load cities when country changes
  useEffect(() => {
    if (country && country.length === 2) {
      loadCitiesByCountry(country);
      if (country === 'FR') {
        loadFrenchDepartments();
      } else {
        setDepartments([]);
      }
    } else {
      setCities([]);
      setDepartments([]);
      setCity('');
      setDepartment('');
    }
  }, [country]);

  const loadCountriesByRegion = async (regionValue: string) => {
    setLoadingCountries(true);
    try {
      // Use RestCountries API (free, no key required)
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion');
      const data = await response.json();
      
      // Map region values to API regions
      const regionMap: Record<string, string[]> = {
        'europe': ['Europe'],
        'north_america': ['Americas'], // Will filter by subregion
        'south_america': ['Americas'],
        'asia': ['Asia'],
        'africa': ['Africa'],
        'oceania': ['Oceania'],
        'middle_east': ['Asia'], // Middle East countries
      };
      
      let filteredCountries = data;
      if (regionValue === 'north_america') {
        filteredCountries = data.filter((c: any) => 
          c.region === 'Americas' && 
          (c.subregion === 'Northern America' || c.subregion === 'Central America' || c.subregion === 'Caribbean')
        );
      } else if (regionValue === 'south_america') {
        filteredCountries = data.filter((c: any) => 
          c.region === 'Americas' && c.subregion === 'South America'
        );
      } else if (regionValue === 'middle_east') {
        filteredCountries = data.filter((c: any) => {
          const middleEastCountries = ['SA', 'AE', 'IQ', 'IR', 'IL', 'JO', 'KW', 'LB', 'OM', 'QA', 'SY', 'YE', 'TR', 'CY'];
          return middleEastCountries.includes(c.cca2);
        });
      } else {
        filteredCountries = data.filter((c: any) => 
          regionMap[regionValue]?.includes(c.region)
        );
      }
      
      const countryList = filteredCountries
        .map((c: any) => ({
          code: c.cca2,
          name: c.name.common || c.name,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      
      setCountries(countryList);
    } catch (err) {
      console.error('Error loading countries:', err);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadCitiesByCountry = async (countryCode: string) => {
    setLoadingCities(true);
    try {
      // Use GeoDB Cities API (free tier: 1000 requests/day)
      // Fallback to a simple list for common countries
      if (countryCode === 'FR') {
        // French cities - use a predefined list for major cities with department mapping
        const frenchCities = [
          { name: 'Paris', region: 'Île-de-France', department: 'Paris', departmentCode: '75' },
          { name: 'Lyon', region: 'Auvergne-Rhône-Alpes', department: 'Rhône', departmentCode: '69' },
          { name: 'Marseille', region: "Provence-Alpes-Côte d'Azur", department: 'Bouches-du-Rhône', departmentCode: '13' },
          { name: 'Toulouse', region: 'Occitanie', department: 'Haute-Garonne', departmentCode: '31' },
          { name: 'Nice', region: "Provence-Alpes-Côte d'Azur", department: 'Alpes-Maritimes', departmentCode: '06' },
          { name: 'Nantes', region: 'Pays de la Loire', department: 'Loire-Atlantique', departmentCode: '44' },
          { name: 'Strasbourg', region: 'Grand Est', department: 'Bas-Rhin', departmentCode: '67' },
          { name: 'Montpellier', region: 'Occitanie', department: 'Hérault', departmentCode: '34' },
          { name: 'Bordeaux', region: 'Nouvelle-Aquitaine', department: 'Gironde', departmentCode: '33' },
          { name: 'Lille', region: 'Hauts-de-France', department: 'Nord', departmentCode: '59' },
          { name: 'Rennes', region: 'Bretagne', department: 'Ille-et-Vilaine', departmentCode: '35' },
          { name: 'Reims', region: 'Grand Est', department: 'Marne', departmentCode: '51' },
          { name: 'Le Havre', region: 'Normandie', department: 'Seine-Maritime', departmentCode: '76' },
          { name: 'Saint-Étienne', region: 'Auvergne-Rhône-Alpes', department: 'Loire', departmentCode: '42' },
          { name: 'Toulon', region: "Provence-Alpes-Côte d'Azur", department: 'Var', departmentCode: '83' },
        ];
        setCities(frenchCities);
        return;
      }
      
      // Try GeoDB Cities API (requires free API key, but has a generous free tier)
      // For now, use a simple approach - we can enhance later with API key
      // Using a fallback list of major cities by country
      const majorCities: Record<string, Array<{ name: string; region?: string }>> = {
        'US': [
          { name: 'New York', region: 'New York' },
          { name: 'Los Angeles', region: 'California' },
          { name: 'Chicago', region: 'Illinois' },
          { name: 'Houston', region: 'Texas' },
        ],
        'GB': [
          { name: 'London', region: 'England' },
          { name: 'Manchester', region: 'England' },
          { name: 'Birmingham', region: 'England' },
        ],
        'DE': [
          { name: 'Berlin', region: 'Berlin' },
          { name: 'Munich', region: 'Bavaria' },
          { name: 'Hamburg', region: 'Hamburg' },
        ],
        'ES': [
          { name: 'Madrid', region: 'Madrid' },
          { name: 'Barcelona', region: 'Catalonia' },
          { name: 'Valencia', region: 'Valencia' },
        ],
        'IT': [
          { name: 'Rome', region: 'Lazio' },
          { name: 'Milan', region: 'Lombardy' },
          { name: 'Naples', region: 'Campania' },
        ],
        'BE': [
          { name: 'Brussels', region: 'Brussels' },
          { name: 'Antwerp', region: 'Antwerp' },
          { name: 'Ghent', region: 'East Flanders' },
        ],
        'CH': [
          { name: 'Zurich', region: 'Zurich' },
          { name: 'Geneva', region: 'Geneva' },
          { name: 'Bern', region: 'Bern' },
        ],
      };
      
      if (majorCities[countryCode]) {
        setCities(majorCities[countryCode]);
      } else {
        // For other countries, allow manual entry
        setCities([]);
      }
    } catch (err) {
      console.error('Error loading cities:', err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadFrenchDepartments = () => {
    // French departments list
    const frenchDepartments = [
      { code: '01', name: 'Ain' }, { code: '02', name: 'Aisne' }, { code: '03', name: 'Allier' },
      { code: '04', name: 'Alpes-de-Haute-Provence' }, { code: '05', name: 'Hautes-Alpes' },
      { code: '06', name: 'Alpes-Maritimes' }, { code: '07', name: 'Ardèche' }, { code: '08', name: 'Ardennes' },
      { code: '09', name: 'Ariège' }, { code: '10', name: 'Aube' }, { code: '11', name: 'Aude' },
      { code: '12', name: 'Aveyron' }, { code: '13', name: 'Bouches-du-Rhône' }, { code: '14', name: 'Calvados' },
      { code: '15', name: 'Cantal' }, { code: '16', name: 'Charente' }, { code: '17', name: 'Charente-Maritime' },
      { code: '18', name: 'Cher' }, { code: '19', name: 'Corrèze' }, { code: '2A', name: 'Corse-du-Sud' },
      { code: '2B', name: 'Haute-Corse' }, { code: '21', name: "Côte-d'Or" }, { code: '22', name: "Côtes-d'Armor" },
      { code: '23', name: 'Creuse' }, { code: '24', name: 'Dordogne' }, { code: '25', name: 'Doubs' },
      { code: '26', name: 'Drôme' }, { code: '27', name: 'Eure' }, { code: '28', name: 'Eure-et-Loir' },
      { code: '29', name: 'Finistère' }, { code: '30', name: 'Gard' }, { code: '31', name: 'Haute-Garonne' },
      { code: '32', name: 'Gers' }, { code: '33', name: 'Gironde' }, { code: '34', name: 'Hérault' },
      { code: '35', name: 'Ille-et-Vilaine' }, { code: '36', name: 'Indre' }, { code: '37', name: 'Indre-et-Loire' },
      { code: '38', name: 'Isère' }, { code: '39', name: 'Jura' }, { code: '40', name: 'Landes' },
      { code: '41', name: 'Loir-et-Cher' }, { code: '42', name: 'Loire' }, { code: '43', name: 'Haute-Loire' },
      { code: '44', name: 'Loire-Atlantique' }, { code: '45', name: 'Loiret' }, { code: '46', name: 'Lot' },
      { code: '47', name: 'Lot-et-Garonne' }, { code: '48', name: 'Lozère' }, { code: '49', name: 'Maine-et-Loire' },
      { code: '50', name: 'Manche' }, { code: '51', name: 'Marne' }, { code: '52', name: 'Haute-Marne' },
      { code: '53', name: 'Mayenne' }, { code: '54', name: 'Meurthe-et-Moselle' }, { code: '55', name: 'Meuse' },
      { code: '56', name: 'Morbihan' }, { code: '57', name: 'Moselle' }, { code: '58', name: 'Nièvre' },
      { code: '59', name: 'Nord' }, { code: '60', name: 'Oise' }, { code: '61', name: 'Orne' },
      { code: '62', name: 'Pas-de-Calais' }, { code: '63', name: 'Puy-de-Dôme' }, { code: '64', name: 'Pyrénées-Atlantiques' },
      { code: '65', name: 'Hautes-Pyrénées' }, { code: '66', name: 'Pyrénées-Orientales' }, { code: '67', name: 'Bas-Rhin' },
      { code: '68', name: 'Haut-Rhin' }, { code: '69', name: 'Rhône' }, { code: '70', name: 'Haute-Saône' },
      { code: '71', name: 'Saône-et-Loire' }, { code: '72', name: 'Sarthe' }, { code: '73', name: 'Savoie' },
      { code: '74', name: 'Haute-Savoie' }, { code: '75', name: 'Paris' }, { code: '76', name: 'Seine-Maritime' },
      { code: '77', name: 'Seine-et-Marne' }, { code: '78', name: 'Yvelines' }, { code: '79', name: 'Deux-Sèvres' },
      { code: '80', name: 'Somme' }, { code: '81', name: 'Tarn' }, { code: '82', name: 'Tarn-et-Garonne' },
      { code: '83', name: 'Var' }, { code: '84', name: 'Vaucluse' }, { code: '85', name: 'Vendée' },
      { code: '86', name: 'Vienne' }, { code: '87', name: 'Haute-Vienne' }, { code: '88', name: 'Vosges' },
      { code: '89', name: 'Yonne' }, { code: '90', name: 'Territoire de Belfort' }, { code: '91', name: 'Essonne' },
      { code: '92', name: 'Hauts-de-Seine' }, { code: '93', name: 'Seine-Saint-Denis' }, { code: '94', name: 'Val-de-Marne' },
      { code: '95', name: "Val-d'Oise" },
      { code: '971', name: 'Guadeloupe' }, { code: '972', name: 'Martinique' }, { code: '973', name: 'Guyane' },
      { code: '974', name: 'La Réunion' }, { code: '976', name: 'Mayotte' },
    ];
    setDepartments(frenchDepartments);
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(departmentSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setCountry('');
    setCountryName('');
    setCity('');
    setDepartment('');
    onChange(null);
  };

  const handleCountrySelect = (countryCode: string, countryNameValue: string) => {
    setCountry(countryCode);
    setCountryName(countryNameValue);
    setCountrySearch(countryNameValue);
    setShowCountryDropdown(false);
    setCity('');
    setDepartment('');
    updateLocation({ region, country: countryCode, countryName: countryNameValue });
  };

  const handleCitySelect = (cityName: string, cityRegion?: string, cityDepartment?: string) => {
    setCity(cityName);
    setCitySearch(cityName);
    setShowCityDropdown(false);
    
    // Si un département est associé à la ville, l'utiliser automatiquement
    const selectedDepartment = cityDepartment || department;
    if (cityDepartment) {
      setDepartment(cityDepartment);
      setDepartmentSearch(cityDepartment);
    }
    
    updateLocation({ 
      region, 
      country, 
      countryName, 
      city: cityName, 
      department: selectedDepartment 
    });
  };

  const handleDepartmentSelect = (deptCode: string, deptName: string) => {
    setDepartment(deptName);
    setDepartmentSearch(deptName);
    setShowDepartmentDropdown(false);
    updateLocation({ region, country, countryName, city, department: deptName });
  };

  const updateLocation = (loc: Partial<GeographicLocation>) => {
    onChange({
      region: loc.region || region,
      country: loc.country || country,
      countryName: loc.countryName || countryName,
      city: loc.city || city,
      department: loc.department || department,
    } as GeographicLocation);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Région du monde */}
      <div>
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Région du monde</label>
        <select
          value={region}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required={required}
        >
          <option value="">Sélectionnez une région</option>
          {WORLD_REGIONS.map(reg => (
            <option key={reg.value} value={reg.value}>{reg.label}</option>
          ))}
        </select>
      </div>

      {/* Pays */}
      {region && (
        <div className="relative">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Pays</label>
          <input
            ref={countryInputRef}
            type="text"
            value={countrySearch || countryName}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              setShowCountryDropdown(true);
            }}
            onFocus={() => setShowCountryDropdown(true)}
            placeholder={loadingCountries ? 'Chargement...' : 'Rechercher un pays'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {showCountryDropdown && filteredCountries.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto">
              {filteredCountries.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c.code, c.name)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ville */}
      {country && (
        <div className="relative">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ville</label>
          <input
            ref={cityInputRef}
            type="text"
            value={citySearch || city}
            onChange={(e) => {
              setCity(e.target.value);
              setCitySearch(e.target.value);
              updateLocation({ region, country, countryName, city: e.target.value, department });
            }}
            onFocus={() => setShowCityDropdown(cities.length > 0)}
            placeholder={loadingCities ? 'Chargement...' : cities.length > 0 ? 'Sélectionnez ou tapez une ville' : 'Tapez le nom de votre ville'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {showCityDropdown && filteredCities.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto">
              {filteredCities.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCitySelect(c.name, c.region, c.department)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {c.name} {c.department && <span className="text-xs text-gray-500">({c.department})</span>}
                  {!c.department && c.region && <span className="text-xs text-gray-500">({c.region})</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Département (pour la France) */}
      {country === 'FR' && (
        <div className="relative">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Département (optionnel)</label>
          <input
            ref={departmentInputRef}
            type="text"
            value={departmentSearch || department}
            onChange={(e) => {
              setDepartmentSearch(e.target.value);
              setShowDepartmentDropdown(true);
            }}
            onFocus={() => setShowDepartmentDropdown(true)}
            placeholder="Rechercher un département"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {showDepartmentDropdown && filteredDepartments.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto">
              {filteredDepartments.map(d => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => handleDepartmentSelect(d.code, d.name)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {d.code} - {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Afficher la sélection actuelle */}
      {value && (value.region || value.country) && (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-sm text-blue-900 dark:text-blue-200">
          <strong>Sélection actuelle :</strong> {value.region && WORLD_REGIONS.find(r => r.value === value.region)?.label}
          {value.countryName && ` → ${value.countryName}`}
          {value.city && ` → ${value.city}`}
          {value.department && ` (${value.department})`}
        </div>
      )}
    </div>
  );
}

