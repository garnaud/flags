import { describe, it, expect } from 'vitest';
import { countries } from '../src/data/countries.js';
import { getRandomQuestions, QuizEngine } from '../src/quiz.js';

describe('Données des pays (countries.js)', () => {
  it('devrait contenir exactement les 195 pays reconnus (membres et observateurs ONU)', () => {
    expect(countries.length).toBe(195);
  });

  it('chaque pays devrait avoir un code ISO alpha-2 en minuscules et un nom non-vide', () => {
    countries.forEach((country) => {
      expect(country).toHaveProperty('code');
      expect(country).toHaveProperty('name');
      expect(country.code).toMatch(/^[a-z]{2}$/);
      expect(typeof country.name).toBe('string');
      expect(country.name.trim().length).toBeGreaterThan(0);
    });
  });

  it('ne devrait pas contenir de doublons de codes ou de noms', () => {
    const codes = new Set(countries.map((c) => c.code));
    const names = new Set(countries.map((c) => c.name));
    expect(codes.size).toBe(195);
    expect(names.size).toBe(195);
  });

  it('devrait fonctionner parfaitement pour générer le mode "tout" avec 195 questions', () => {
    const questions = getRandomQuestions(countries, 'tout');
    expect(questions).toHaveLength(195);

    const engine = new QuizEngine(questions);
    expect(engine.totalQuestions).toBe(195);
    expect(engine.isGameOver).toBe(false);
  });
});
