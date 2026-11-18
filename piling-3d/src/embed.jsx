import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import StoryStage from './three/StoryStage.jsx';
import StoryHud from './StoryHud.jsx';
import css from './embed.css?inline';

// Entry used by the main website: mount(el) puts the scroll-driven 3D story inside `el`.
//   const stage = mount(el, { onReady, onFail });
//   stage.setProgress(p)  // 0..1 hero, 1..2 rotary boring, 2..3 cage + concrete, 3..4 load testing
//   stage.setVisible(false) to pause rendering when the story is off screen

function HudHost({ api }) {
  const [hud, setHud] = useState(null);
  useEffect(() => {
    api.onHud = (h) => {
      setHud({ ...h });
      api.onState?.(h);
    };
    return () => {
      api.onHud = null;
    };
  }, [api]);
  return (
    <>
      <StoryHud hud={hud} />
      <div className="hfc-cut" style={{ opacity: hud && hud.cut ? hud.cut : 0 }} aria-hidden="true" />
    </>
  );
}

function StoryApp({ api, quality, onFail }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    api.setVisible = setVisible;
  }, [api]);
  return (
    <div className="hfc-stage">
      <StoryStage api={api} visible={visible} quality={quality} onFail={onFail} />
      <HudHost api={api} />
    </div>
  );
}

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

export function mount(el, { onReady, onFail, onState } = {}) {
  if (!webglOk()) {
    onFail?.(new Error('WebGL is not available'));
    return null;
  }
  if (!document.getElementById('hfc-story-css')) {
    const st = document.createElement('style');
    st.id = 'hfc-story-css';
    st.textContent = css;
    document.head.appendChild(st);
  }
  const small = window.innerWidth < 800 || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  const api = { p: 0, time: 0, ready: false, frames: 0, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches, onReady, onState, site: null };
  const root = createRoot(el);
  root.render(<StoryApp api={api} quality={small ? 'low' : 'high'} onFail={onFail} />);
  return {
    setProgress(p) {
      api.p = Math.max(0, Math.min(4, p));
    },
    setVisible(v) {
      api.setVisible?.(!!v);
    },
    api,
    destroy() {
      root.unmount();
    },
  };
}

if (typeof window !== 'undefined') window.HFCPiling = { mount };
