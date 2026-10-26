import { useEffect, useState } from 'react';

type ThemePreference = 'dark' | 'light' | 'system';

const stages = [
  'Understand',
  'Map',
  'Diverge',
  'Interrogate',
  'Evolve',
  'Research',
  'Converge',
  'Blueprint',
] as const;

function resolveTheme(preference: ThemePreference): 'dark' | 'light' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readTheme(): ThemePreference {
  const value = localStorage.getItem('hacktor-theme');
  return value === 'light' || value === 'system' ? value : 'dark';
}

export function App() {
  const [theme, setTheme] = useState<ThemePreference>(readTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme);
      document.documentElement.dataset.themePreference = theme;
    };
    apply();
    localStorage.setItem('hacktor-theme', theme);
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Hacktor home">
          hacktor<span>.</span>
        </a>
        <nav aria-label="Primary">
          <a href="#studio">Studio</a>
          <a href="#foundation">Foundation</a>
        </nav>
        <fieldset className="theme-picker">
          <legend>Appearance</legend>
          {(['dark', 'light', 'system'] as const).map((value) => (
            <label key={value}>
              <input
                checked={theme === value}
                name="theme"
                onChange={() => setTheme(value)}
                type="radio"
                value={value}
              />
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </label>
          ))}
        </fieldset>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Deep Ideation Studio</p>
        <h1>
          Find the idea beneath the <span>obvious one.</span>
        </h1>
        <p className="hero-copy">
          Hacktor is being built as a structured workspace for mapping overlooked problems,
          generating diverse mechanisms, challenging assumptions, researching comparables, and
          producing build-ready blueprints.
        </p>
        <div className="actions" aria-label="Planned entry paths">
          <button type="button">Start with a hackathon</button>
          <button className="secondary" type="button">
            Start with an idea
          </button>
        </div>
        <p className="notice" role="status">
          Foundation preview. Ideation, research, and persistence are not implemented in M0.
        </p>
      </section>

      <section className="studio-map" id="studio" aria-labelledby="studio-title">
        <div className="section-heading">
          <p className="eyebrow">The product contract</p>
          <h2 id="studio-title">Eight stages, one traceable line of thought.</h2>
        </div>
        <ol className="stage-list">
          {stages.map((stage, index) => (
            <li key={stage}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{stage}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="foundation" id="foundation" aria-labelledby="foundation-title">
        <p className="eyebrow">Milestone M0</p>
        <h2 id="foundation-title">A real foundation, clearly labeled.</h2>
        <div className="foundation-grid">
          <article>
            <span>01</span>
            <h3>Versioned contracts</h3>
            <p>OpenAPI, Idea Card schema, and D1 migrations are checked for drift.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Durable boundaries</h3>
            <p>Queue messages carry job identifiers only, with bounded retry and a DLQ.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Honest status</h3>
            <p>No live AI, source access, or deployment is implied before it is verified.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
