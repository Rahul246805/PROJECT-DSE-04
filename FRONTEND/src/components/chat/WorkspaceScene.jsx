import React, { useState } from 'react';

const INITIAL_TILT = { x: -10, y: 14 };

const WorkspaceScene = ({ variant = 'ambient', active = false }) => {
  const [tilt, setTilt] = useState(INITIAL_TILT);
  const isHero = variant === 'hero';

  const handlePointerMove = (event) => {
    if (typeof window !== 'undefined' && window.innerWidth < 960) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: -12 - normalizedY * 14,
      y: 14 + normalizedX * 20,
    });
  };

  return (
    <div
      className={`workspace-scene workspace-scene-${variant} ${active ? 'is-active' : ''}`}
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt(INITIAL_TILT)}
      style={{
        '--scene-rotate-x': `${tilt.x}deg`,
        '--scene-rotate-y': `${tilt.y}deg`,
      }}
    >
      <div className="workspace-scene-halo workspace-scene-halo-one" />
      <div className="workspace-scene-halo workspace-scene-halo-two" />

      <div className="workspace-scene-stage">
        <div className="workspace-scene-ring workspace-scene-ring-outer" />
        <div className="workspace-scene-ring workspace-scene-ring-inner" />

        <div className="workspace-scene-core">
          <span className="workspace-scene-core-dot" />
          <span className="workspace-scene-core-dot workspace-scene-core-dot-two" />
        </div>

        <div className="workspace-scene-card workspace-scene-card-main">
          <span className="workspace-scene-card-pill">{isHero ? 'Mate.ai core' : 'Mate.ai live'}</span>
          {isHero ? (
            <div className="workspace-scene-line-stack">
              <span className="workspace-scene-line workspace-scene-line-wide" />
              <span className="workspace-scene-line" />
              <span className="workspace-scene-line workspace-scene-line-short" />
            </div>
          ) : (
            <>
              <strong>Realtime conversation flow</strong>
              <span>Streaming motion, structured prompts, and a calmer reading surface.</span>
            </>
          )}
        </div>

        <div className="workspace-scene-card workspace-scene-card-side">
          <span className="workspace-scene-mini-line" />
          <span className="workspace-scene-mini-line workspace-scene-mini-line-wide" />
          <span className="workspace-scene-mini-line" />
        </div>

        <div className="workspace-scene-orbit workspace-scene-orbit-a">voice</div>
        <div className="workspace-scene-orbit workspace-scene-orbit-b">code</div>
        <div className="workspace-scene-orbit workspace-scene-orbit-c">search</div>
      </div>
    </div>
  );
};

export default WorkspaceScene;
