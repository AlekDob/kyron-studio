// Source: global-games/studio src/components/shell/StudioMark.tsx
// Sfera del brand con la scia di dischi che scendono, in loop. Versione mini:
// a 28px onde e parallasse sarebbero fango, restano solo i dischi.
export const SPHERE_GRADIENT =
  "radial-gradient(circle at 38% 32%, hsl(235 100% 63%), hsl(235 100% 55%) 60%, hsl(235 100% 49%))";

const TRAIL = [1, 2, 3, 4, 5];

export function StudioMark() {
  return (
    <span aria-hidden className="relative block h-7 w-7 shrink-0">
      {/* La scia sta sotto la sfera e sborda dal box: pointer-events off */}
      <span className="pointer-events-none absolute inset-0">
        {TRAIL.map((index) => {
          const lightness = 55 + (index / TRAIL.length) * 27;
          return (
            <span
              key={index}
              className="studio-mark-disc absolute inset-x-0 aspect-square rounded-full"
              style={{
                top: index * 3,
                zIndex: -index,
                background: `radial-gradient(circle at 38% 32%, hsl(235 100% ${lightness + 8}%), hsl(235 100% ${lightness}%) 60%, hsl(235 100% ${lightness - 6}%))`,
                animationDelay: `${(index - 1) * 0.18}s`,
              }}
            />
          );
        })}
      </span>
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: SPHERE_GRADIENT }}
      />
    </span>
  );
}
