const GRID_STEP = 20;
const GRID_PADDING = 10;
const GRID_COUNT = 12;

function gridDots(): { cx: number; cy: number }[] {
  const dots: { cx: number; cy: number }[] = [];
  for (let row = 0; row < GRID_COUNT; row++) {
    for (let col = 0; col < GRID_COUNT; col++) {
      dots.push({
        cx: GRID_PADDING + col * GRID_STEP,
        cy: GRID_PADDING + row * GRID_STEP,
      });
    }
  }
  return dots;
}

export function BlueprintIllustration() {
  return (
    <svg
      viewBox="0 0 240 240"
      width="240"
      height="240"
      aria-hidden="true"
      role="presentation"
      className="w-full max-w-[240px]"
    >
      <g data-layer="grid" opacity="0.6">
        {gridDots().map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r="1" fill="#e7e5e0" />
        ))}
      </g>
      <path
        data-shape="arc"
        d="M 60 120 A 60 60 0 0 1 180 120"
        stroke="#1E4DD8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        data-shape="segment"
        d="M 120 60 L 120 180"
        stroke="#1E4DD8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle data-shape="accent" cx="180" cy="120" r="5" fill="#0FA37F" />
    </svg>
  );
}
