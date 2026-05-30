import React from 'react';

export default function PlaceholderPanel({ title, subtitle, fase }) {
  return (
    <div className="panel active">
      <div className="panel-title">{title}</div>
      <div className="panel-sub">{subtitle}</div>
      <div className="card empty-state">
        <p>
          Este módulo está definido en el SQL del SOA (<code>aspropa-database-v1.0.sql</code>)
          y en el piloto HTML, pero aún no tiene API en el backend.
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>Próximo paso:</strong> {fase}
        </p>
      </div>
    </div>
  );
}
