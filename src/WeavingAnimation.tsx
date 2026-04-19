import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import gsap from "gsap";

// ─── "MPE" Bitmap ────────────────────────────────────
const M = [
  [1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
];
const P = [
  [1, 1, 1, 0],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 1, 1, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
];
const E = [
  [1, 1, 1, 1],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 1, 1, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 1, 1, 1],
];
const BMP = M.map((m, i) => [...m, 0, 0, ...P[i], 0, 0, ...E[i]]);

// ─── Dense Grid ──────────────────────────────────────
const COLS = 80;
const ROWS = 44;
const SZ = 10;
const TW = 2;
const SC = 3;
const TGW = 17 * SC;
const TGH = 7 * SC;
const TX = Math.floor((COLS - TGW) / 2);
const TY = Math.floor((ROWS - TGH) / 2);

const isTxt = (r: number, c: number): boolean => {
  const lr = r - TY;
  const lc = c - TX;
  if (lr < 0 || lr >= TGH || lc < 0 || lc >= TGW) return false;
  return BMP[Math.floor(lr / SC)][Math.floor(lc / SC)] === 1;
};

// ─── Cyber palette ───────────────────────────────────
const C = {
  bg: "#030812",
  warp: "#081822",
  warpDim: "#050e16",
  weftTxt: "#00e5ff",
  weftTxtDim: "#005570",
  weftBg: "#0a2535",
  weftBgDim: "#061018",
  accent: "#ff0055",
  accentDim: "#660022",
  scan: "rgba(0,229,255,0.035)",
  border: "#00e5ff",
};

export const WeavingAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const ease = gsap.parseEase("power3.out");
  const easeInOut = gsap.parseEase("power1.inOut");

  const gw = COLS * SZ;
  const gh = ROWS * SZ;
  const totalF = durationInFrames;

  // ─── 3D Camera ─────────────────────────────────────
  const rotY = interpolate(frame, [0, totalF], [25, 385], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const tz = interpolate(frame, [0, totalF], [-350, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: gsap.parseEase("power2.out"),
  });
  const rotX = interpolate(frame, [0, totalF * 0.5], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  // ─── Weaving timing ────────────────────────────────
  const warpEnd = 2 * fps;
  const weftDur = 7 * fps;
  const rowDly = weftDur / (ROWS + 3);
  const rowAnimDur = 22;

  // ─── Warp threads (vertical) ───────────────────────
  const warpEls: React.ReactNode[] = [];
  for (let c = 0; c < COLS; c++) {
    const stg = c * 0.8;
    const p = interpolate(frame, [stg, stg + fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });
    if (p < 0.01) continue;
    const x = c * SZ + SZ / 2;
    const shade = c % 3 === 0 ? C.warp : C.warpDim;
    warpEls.push(
      <line key={`w${c}`} x1={x} y1={0} x2={x} y2={p * gh} stroke={shade} strokeWidth={TW} />,
    );
  }

  // ─── Weft + overlay ────────────────────────────────
  const weftEls: React.ReactNode[] = [];
  const overEls: React.ReactNode[] = [];

  for (let r = 0; r < ROWS; r++) {
    const rowStart = warpEnd + r * rowDly;
    const glitch = frame % 67 === r * 2 ? Math.sin(frame * 7 + r) * 2 : 0;

    for (let c = 0; c < COLS; c++) {
      const cellStart = rowStart + (c / COLS) * rowAnimDur;
      const p = interpolate(frame, [cellStart, cellStart + 3], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: ease,
      });
      if (p <= 0) continue;

      const y = r * SZ + SZ / 2;
      const x1 = c * SZ + glitch;
      const txt = isTxt(r, c);

      weftEls.push(
        <line
          key={`f${r}_${c}`}
          x1={x1} y1={y} x2={x1 + SZ * p} y2={y}
          stroke={txt ? C.weftTxt : C.weftBg}
          strokeWidth={TW}
        />,
      );

      if ((r + c) % 2 === 1 && p > 0.9) {
        const wp = interpolate(frame, [c * 0.8, c * 0.8 + fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (wp * gh >= r * SZ) {
          overEls.push(
            <line
              key={`o${r}_${c}`}
              x1={c * SZ + SZ / 2} y1={r * SZ + 0.5}
              x2={c * SZ + SZ / 2} y2={r * SZ + SZ - 0.5}
              stroke={txt ? C.weftTxtDim : C.weftBgDim}
              strokeWidth={TW}
            />,
          );
        }
      }
    }
  }

  // ─── Scan lines ────────────────────────────────────
  const scanEls: React.ReactNode[] = [];
  for (let y = 0; y < gh; y += 3) {
    scanEls.push(
      <line key={`s${y}`} x1={0} y1={y} x2={gw} y2={y} stroke={C.scan} strokeWidth={1} />,
    );
  }

  // ─── Data particles ────────────────────────────────
  const particles: React.ReactNode[] = [];
  const pct = interpolate(frame, [warpEnd, warpEnd + weftDur], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  for (let i = 0; i < 20; i++) {
    const spd = 0.4 + (i % 6) * 0.25;
    const px = (frame * spd * 2.1 + i * 137) % gw;
    const py = (frame * spd * 1.4 + i * 89) % gh;
    const isAccent = i % 4 === 0;
    particles.push(
      <circle key={`p${i}`} cx={px} cy={py} r={1.2}
        fill={isAccent ? C.accent : C.weftTxt} opacity={pct} />,
    );
  }

  // ─── Holographic border ────────────────────────────
  const borderOp = interpolate(
    frame,
    [warpEnd + weftDur - 40, warpEnd + weftDur],
    [0.15, 0.55],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const borderPulse = 1 + Math.sin(frame * 0.15) * 0.1;

  // ─── Shuttle ───────────────────────────────────────
  const showShuttle = frame >= warpEnd && frame < warpEnd + weftDur;
  const sProg = interpolate(frame, [warpEnd, warpEnd + weftDur], [0, ROWS], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sRow = Math.floor(sProg);
  const sFrac = sProg - sRow;

  return (
    <div
      style={{
        width,
        height,
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1200px",
        perspectiveOrigin: "50% 50%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: gw * 0.8,
          height: gh * 0.8,
          background:
            "radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* 3D Label */}
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${tz}px)`,
          width: gw,
          height: gh,
          position: "relative",
        }}
      >
        {/* ── Front face ── */}
        <svg
          width={gw}
          height={gh}
          viewBox={`0 0 ${gw} ${gh}`}
          style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}
        >
          <defs>
            <filter id="neon" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="bigGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="shGlow">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#ff0055" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={gw} height={gh} fill={C.bg} rx={3} />

          {warpEls}

          <g filter="url(#neon)">{weftEls}</g>

          {overEls}
          {scanEls}
          {particles}

          {/* Border */}
          <rect
            x={1} y={1} width={gw - 2} height={gh - 2}
            fill="none" stroke={C.border} strokeWidth={0.8}
            opacity={borderOp * borderPulse} rx={3}
          />
          <rect
            x={3} y={3} width={gw - 6} height={gh - 6}
            fill="none" stroke={C.accent} strokeWidth={0.4}
            opacity={borderOp * 0.3} rx={2}
          />

          {/* Shuttle */}
          {showShuttle && (
            <g filter="url(#bigGlow)">
              <circle
                cx={sFrac * gw} cy={sRow * SZ + SZ / 2}
                r={SZ * 3} fill="url(#shGlow)"
              />
            </g>
          )}
        </svg>

        {/* ── Back face ── */}
        <svg
          width={gw}
          height={gh}
          viewBox={`0 0 ${gw} ${gh}`}
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <rect width={gw} height={gh} fill="#040c14" rx={3} />
          <rect x={2} y={2} width={gw - 4} height={gh - 4}
            fill="none" stroke="#0a2535" strokeWidth={0.5} rx={2} />
          {/* Coarse back weave */}
          {Array.from({ length: Math.floor(ROWS / 2) }, (_, r) =>
            Array.from({ length: Math.floor(COLS / 2) }, (_, c) => (
              <rect
                key={`b${r}_${c}`}
                x={c * SZ * 2 + 1} y={r * SZ * 2 + 1}
                width={SZ * 2 - 2} height={SZ * 2 - 2}
                fill={(r + c) % 2 === 0 ? "#0a1a25" : "#060f18"}
                rx={0.5}
              />
            ))
          )}
        </svg>

        {/* ── Edges ── */}
        <div style={{ position: "absolute", top: 0, left: 0, width: gw, height: 6, transformOrigin: "top", transform: "rotateX(90deg)", background: "#081218" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: gw, height: 6, transformOrigin: "bottom", transform: "rotateX(-90deg)", background: "#081218" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: gh, transformOrigin: "left", transform: "rotateY(-90deg)", background: "#081218" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 6, height: gh, transformOrigin: "right", transform: "rotateY(90deg)", background: "#081218" }} />
      </div>

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(3,8,18,0.9))",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
