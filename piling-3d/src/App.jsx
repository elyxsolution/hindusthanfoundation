import { useEffect, useMemo, useState } from 'react';
import PilingStage from './three/PilingStage.jsx';

const STEPS = [
  {
    key: 'excavate',
    n: '01',
    title: 'Clear and excavate',
    machines: 'Tata Hitachi EX200 · Kubota U30 · Tipper',
    text: 'The working platform is levelled and spoil is cleared. The excavators dig, swing and load tippers so the rigs have firm, clean ground.',
  },
  {
    key: 'bore',
    n: '02',
    title: 'Rotary boring',
    machines: 'SANY SR140 rotary rigs',
    text: 'A rotary head turns an auger down the pile bore. It is lifted out full of soil, then spun fast to throw the spoil clear, and goes back down.',
  },
  {
    key: 'cage',
    n: '03',
    title: 'Reinforcement cage',
    machines: 'SANY SCC450 crawler crane',
    text: 'The pre-assembled steel cage is lifted from the yard, tipped upright and lowered into the open bore, section by section.',
  },
  {
    key: 'pour',
    n: '04',
    title: 'Tremie concreting',
    machines: 'Ready-mix truck · SANY SCC450 · tremie pipe',
    text: 'Ready-mix concrete runs down the chute and the tremie pipe to the bottom of the bore. The pile fills from below, and the pipe is drawn up as it rises.',
  },
];

export default function App() {
  const api = useMemo(
    () => ({ view: 'overview', xray: false, playing: true, speed: 1, time: 0, loopT: 0, yaw: 0, pitch: 0, dragging: false, ready: false, frames: 0, site: null }),
    []
  );
  const [view, setViewState] = useState('overview');
  const [playing, setPlaying] = useState(true);
  const [xray, setXray] = useState(false);
  const [tour, setTour] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.onReady = () => setReady(true);
    window.__piling = api; // handy for inspection
  }, [api]);

  const setView = (v) => {
    api.view = v;
    api.yaw = 0;
    api.pitch = 0;
    setViewState(v);
  };

  const setXrayOn = (on) => {
    api.xray = on;
    api.site?.setXray(on);
    setXray(on);
  };
  const go = (v) => {
    setTour(false);
    if (xray) setXrayOn(false);
    setView(v);
  };
  const toggleXray = () => {
    setTour(false);
    if (xray) {
      setXrayOn(false);
      setView(api.prevView || 'overview');
    } else {
      api.prevView = view === 'under' ? 'overview' : view;
      setXrayOn(true);
      setView('under');
    }
  };

  useEffect(() => {
    if (!tour) return undefined;
    const order = ['excavate', 'bore', 'cage', 'pour', 'overview'];
    let i = Math.max(0, order.indexOf(view));
    const id = setInterval(() => {
      i = (i + 1) % order.length;
      setView(order[i]);
    }, 9000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour]);

  const step = STEPS.find((s) => s.key === view);
  const underground = view === 'under';

  return (
    <div className="page">
      <PilingStage api={api} />
      <div className={`loader ${ready ? 'is-done' : ''}`} aria-hidden={ready}>
        <span>Setting up the site</span>
        <i />
      </div>

      <header className="top">
        <a className="brand" href="../" aria-label="Hindustan Foundation and Constructions, home">
          <img src="./Logo.jpg" alt="" width="44" height="44" />
          <span>
            <b>Hindustan</b>
            <small>Foundation &amp; Constructions</small>
          </span>
        </a>
        <a className="back" href="../">
          Main site <span aria-hidden="true">→</span>
        </a>
      </header>

      <section className={`intro ${view === 'overview' ? '' : 'is-off'}`}>
        <p className="eyebrow">Piling, step by step</p>
        <h1>
          How a <em>pile</em> is built.
        </h1>
        <p className="lede">Four machines, one cycle. Watch a bored pile go from bare ground to poured concrete, or pick a step to get closer.</p>
      </section>

      {underground && (
        <aside className="card" key="under">
          <p className="card__n">↓</p>
          <h2>Underground</h2>
          <p className="card__m">Boring · cage · concrete</p>
          <p>The ground fades out so you can follow each pile: the auger drilling down, the steel cage dropping in, and concrete rising from the bottom of the bore.</p>
        </aside>
      )}
      {step && (
        <aside className="card" key={step.key}>
          <p className="card__n">{step.n}</p>
          <h2>{step.title}</h2>
          <p className="card__m">{step.machines}</p>
          <p>{step.text}</p>
        </aside>
      )}

      <nav className="dock" aria-label="Piling process">
        <div className="chips" role="group" aria-label="Choose a step">
          <button type="button" className={view === 'overview' ? 'is-on' : ''} onClick={() => go('overview')}>
            <span>Whole site</span>
          </button>
          {STEPS.map((s) => (
            <button key={s.key} type="button" className={view === s.key ? 'is-on' : ''} onClick={() => go(s.key)}>
              <i>{s.n}</i>
              <span>{s.title}</span>
            </button>
          ))}
        </div>
        <div className="tools">
          <button type="button" className={tour ? 'is-on' : ''} onClick={() => { if (!tour && xray) setXrayOn(false); setTour((v) => !v); }} aria-pressed={tour}>
            Tour
          </button>
          <button
            type="button"
            className={xray ? 'is-on' : ''}
            onClick={toggleXray}
            aria-pressed={xray}
          >
            Underground
          </button>
          <button
            type="button"
            onClick={() => {
              api.playing = !playing;
              setPlaying(!playing);
            }}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </nav>
      <p className="hint">Drag to look around</p>
    </div>
  );
}
