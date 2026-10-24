import { describe, it, expect } from 'vitest';
import { advancedCountries, FRANCE_REFERENCE } from '../src/data/advancedCountries.js';

describe('Données avancées des pays (advancedCountries.js)', () => {
  it('devrait contenir exactement 195 pays enrichis', () => {
    expect(advancedCountries).toHaveLength(195);
  });

  it('chaque pays doit posséder tous les attributs requis pour le mode avancé', () => {
    advancedCountries.forEach((c) => {
      expect(c).toHaveProperty('code');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('capital');
      expect(c).toHaveProperty('population');
      expect(c).toHaveProperty('area');
      expect(c).toHaveProperty('gdp');
      expect(c).toHaveProperty('gdpPerCapita');
      expect(c).toHaveProperty('currency');
      expect(c).toHaveProperty('tier');
      expect(c).toHaveProperty('continent');
      expect(c).toHaveProperty('borders');
      expect(c).toHaveProperty('isIsland');
      expect(c).toHaveProperty('lifeExpectancy');
      expect(c).toHaveProperty('hdi');
      expect(c).toHaveProperty('medianAge');
      expect(c).toHaveProperty('schoolingYears');

      expect(c.code).toMatch(/^[a-z]{2}$/);
      expect(typeof c.name).toBe('string');
      expect(typeof c.capital).toBe('string');
      expect(c.population).toBeGreaterThan(0);
      expect(c.area).toBeGreaterThan(0);
      expect(c.gdp).toBeGreaterThan(0);
      expect(c.gdpPerCapita).toBeGreaterThan(0);
      expect(typeof c.currency).toBe('string');
      expect(typeof c.continent).toBe('string');
      expect(['Europe', 'Amériques', 'Asie', 'Afrique', 'Océanie']).toContain(c.continent);
      expect(c.tier).toBeGreaterThanOrEqual(1);
      expect(c.tier).toBeLessThanOrEqual(5);
      expect(Array.isArray(c.borders)).toBe(true);
      expect(typeof c.isIsland).toBe('boolean');

      expect(c.lifeExpectancy).toBeGreaterThan(45);
      expect(c.lifeExpectancy).toBeLessThan(95);
      expect(c.hdi).toBeGreaterThan(0.3);
      expect(c.hdi).toBeLessThanOrEqual(1.0);
      expect(c.medianAge).toBeGreaterThan(10);
      expect(c.medianAge).toBeLessThan(65);
      expect(c.schoolingYears).toBeGreaterThan(1);
      expect(c.schoolingYears).toBeLessThan(20);
    });
  });

  it('les pays continentaux doivent avoir des frontières terrestres et les îles doivent en être exclues', () => {
    const france = advancedCountries.find((c) => c.code === 'fr');
    expect(france.isIsland).toBe(false);
    expect(france.borders).toContain('es');
    expect(france.borders).toContain('de');
    expect(france.borders).toContain('it');

    const madagascar = advancedCountries.find((c) => c.code === 'mg');
    expect(madagascar.isIsland).toBe(true);
    expect(madagascar.borders).toHaveLength(0);

    const japon = advancedCountries.find((c) => c.code === 'jp');
    expect(japon.isIsland).toBe(true);
  });

  it('les pays de plus de 10 millions d\'habitants doivent avoir un tableau de villes alternatives', () => {
    const bigCountries = advancedCountries.filter((c) => c.population > 10000000);
    expect(bigCountries.length).toBeGreaterThan(50);
    const france = advancedCountries.find((c) => c.code === 'fr');
    expect(france.cities).toContain('Lyon');
    expect(france.cities).toContain('Marseille');

    const usa = advancedCountries.find((c) => c.code === 'us');
    expect(usa.cities).toContain('New York');
    expect(usa.cities).toContain('Los Angeles');
  });

  it('la référence France doit être valide et complète (y compris PIB par habitant)', () => {
    expect(FRANCE_REFERENCE).toHaveProperty('area');
    expect(FRANCE_REFERENCE).toHaveProperty('gdp');
    expect(FRANCE_REFERENCE).toHaveProperty('gdpPerCapita');
    expect(FRANCE_REFERENCE).toHaveProperty('population');
    expect(FRANCE_REFERENCE.area).toBe(551695);
    expect(FRANCE_REFERENCE.gdp).toBe(3000);
    expect(FRANCE_REFERENCE.gdpPerCapita).toBe(44100);
  });
});
