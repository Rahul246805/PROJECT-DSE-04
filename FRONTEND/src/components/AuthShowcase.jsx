import React from 'react';

const AuthShowcase = ({
  kicker,
  title,
  description,
  eyebrow = 'Mate.ai workspace',
  stats = [],
  highlights = [],
}) => {
  return (
    <div className="auth-panel-content">
      <div className="auth-copy-stack">
        <span className="auth-kicker">{kicker}</span>
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="auth-visual-stage" aria-hidden="true">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-orb auth-orb-three" />

        <div className="auth-visual-card auth-visual-card-main">
          <div className="auth-visual-card-top">
            <span className="auth-visual-pill">Live workspace</span>
            <span className="auth-visual-status">Stable sync</span>
          </div>

          <div className="auth-visual-lines">
            <span />
            <span />
            <span />
          </div>

          <div className="auth-visual-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="auth-stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-visual-card auth-visual-card-float">
          <span className="auth-visual-small-label">Built for focus</span>
          <ul className="auth-highlight-list">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthShowcase;
