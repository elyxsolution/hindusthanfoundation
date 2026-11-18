import { STRATA } from './three/core.js';
import { loadCurve, DESIGN_MT, TEST_MT } from './three/testStation.js';
import { BORE_D } from './three/world.js';

const layerAt = (d) => (STRATA.find((s) => d <= s.to) || STRATA[STRATA.length - 1]).name;

function BoreHud({ h }) {
  const u = h.u;
  const phase = u < 0.06 ? 'Rig in position' : u < 0.5 ? 'Boring down' : u < 0.72 ? 'Lifting the tool and spoil' : u < 0.88 ? 'Spinning the spoil off' : 'Ready for the next run';
  const d = Math.min(h.depth, BORE_D);
  return (
    <div className="hfc-card">
      <span className="hfc-k">Boring depth</span>
      <b className="hfc-big">
        {d.toFixed(1)}
        <small> m</small>
      </b>
      <div className="hfc-meter" aria-hidden="true">
        <i style={{ width: `${(d / BORE_D) * 100}%` }} />
      </div>
      <span className="hfc-row">
        <em>Ground</em>
        {layerAt(d)}
      </span>
      <span className="hfc-row">
        <em>Now</em>
        {phase}
      </span>
    </div>
  );
}

function CageHud({ h }) {
  const phase = h.phase2 === 'cage' ? 'Lowering the cage' : h.phase2 === 'tremie' ? 'Placing the tremie pipe' : 'Concreting from the bottom';
  const cageIn = (12 * h.cage).toFixed(1);
  const lvl = h.concrete;
  return (
    <div className="hfc-card">
      <span className="hfc-k">{phase}</span>
      <span className="hfc-row">
        <em>Steel cage</em>
        {cageIn} of 12 m lowered
      </span>
      <div className="hfc-meter" aria-hidden="true">
        <i style={{ width: `${h.cage * 100}%` }} />
      </div>
      <span className="hfc-row">
        <em>Concrete</em>
        {lvl.toFixed(1)} of {BORE_D} m poured
      </span>
      <div className="hfc-meter hfc-meter--c" aria-hidden="true">
        <i style={{ width: `${(lvl / BORE_D) * 100}%` }} />
      </div>
    </div>
  );
}

const W = 300;
const H = 170;
const PAD = { l: 38, r: 10, t: 10, b: 30 };
const X = (mt) => PAD.l + (mt / TEST_MT) * (W - PAD.l - PAD.r);
const Y = (mm) => PAD.t + (mm / 14) * (H - PAD.t - PAD.b);

function LoadHud({ h }) {
  const loading = h.stacking >= 1;
  if (!loading) {
    return (
      <div className="hfc-card">
        <span className="hfc-k">Building the kentledge</span>
        <b className="hfc-big">
          {h.placed}
          <small> of {h.blocks} blocks</small>
        </b>
        <div className="hfc-meter" aria-hidden="true">
          <i style={{ width: `${(h.placed / h.blocks) * 100}%` }} />
        </div>
        <span className="hfc-row">
          <em>Why</em>
          The weights give the jack something to push against.
        </span>
      </div>
    );
  }
  const pts = [];
  const full = [];
  for (let i = 0; i <= 80; i++) {
    const c = loadCurve(i / 80);
    const p = `${X(c.frac * DESIGN_MT).toFixed(1)},${Y(c.settle).toFixed(1)}`;
    full.push(p);
    if (i / 80 <= h.v) pts.push(p);
  }
  const step = Math.min(6, Math.max(1, Math.ceil(h.v * 6 - 0.0001)));
  return (
    <div className="hfc-card hfc-card--chart">
      <span className="hfc-k">Load test · illustrative</span>
      <div className="hfc-nums">
        <span>
          <em>Load</em>
          <b>{Math.round(h.load)}</b> MT
        </span>
        <span>
          <em>Settlement</em>
          <b>{h.settle.toFixed(1)}</b> mm
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Load against settlement curve">
        {[0, 5, 10].map((mm) => (
          <g key={mm}>
            <line x1={PAD.l} x2={W - PAD.r} y1={Y(mm)} y2={Y(mm)} className="g" />
            <text x={PAD.l - 6} y={Y(mm) + 4} textAnchor="end">
              {mm}
            </text>
          </g>
        ))}
        {[0, 250, 500, 750].map((mt) => (
          <text key={mt} x={X(mt)} y={H - 10} textAnchor="middle">
            {mt}
          </text>
        ))}
        <line x1={X(DESIGN_MT)} x2={X(DESIGN_MT)} y1={PAD.t} y2={H - PAD.b} className="d" />
        <text x={X(DESIGN_MT) + 4} y={PAD.t + 10} className="lab">
          design
        </text>
        <polyline points={full.join(' ')} className="faint" />
        <polyline points={pts.join(' ')} className="line" />
        <circle cx={X(h.load)} cy={Y(h.settle)} r="4.5" className="dot" />
        <text x={PAD.l - 30} y={PAD.t + 4} className="ax">
          mm
        </text>
        <text x={W - PAD.r} y={H - 1} textAnchor="end" className="ax">
          load, MT
        </text>
      </svg>
      <span className="hfc-row">
        <em>Step</em>
        {step} of 6 · {Math.round((h.load / DESIGN_MT) * 100)}% of design load
      </span>
    </div>
  );
}

export default function StoryHud({ hud }) {
  const c = hud ? hud.chapter : 0;
  return (
    <div className={`hfc-hud ${c > 0 ? 'is-on' : ''}`} aria-hidden="true">
      {c === 1 && <BoreHud h={hud} />}
      {c === 2 && <CageHud h={hud} />}
      {c === 3 && <LoadHud h={hud} />}
    </div>
  );
}
