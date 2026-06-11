import { useMemo } from 'react';

interface DataPoint {
  label: string;
  value: number;
  value2?: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
  color?: string;
  color2?: string;
  maxValue?: number;
  labelFormatter?: (v: number) => string;
  showArea?: boolean;
  showArea2?: boolean;
  yAxisTicks?: number;
  legend?: { label: string; color: string }[];
}

export function LineChart({
  data,
  height = 260,
  color = '#22d3ee',
  color2 = '#f472b6',
  maxValue,
  labelFormatter = v => v.toString(),
  showArea = true,
  showArea2 = false,
  yAxisTicks = 5,
  legend,
}: Props) {
  const { pathD, areaD, pathD2, areaD2, points, points2, yMax, yMin } = useMemo(() => {
    const width = 800;
    const padding = { top: 20, right: 30, bottom: 36, left: 48 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const allValues = data.flatMap(d => [d.value, d.value2 ?? 0]).filter(Boolean);
    const rawMax = maxValue ?? Math.max(1, ...allValues);
    const niceMax = Math.ceil(rawMax * 1.1 / (yAxisTicks)) * yAxisTicks || yAxisTicks;

    const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

    const calcPoints = (vals: (number | undefined)[]) =>
      data.map((d, i) => {
        const v = vals[i] ?? 0;
        const x = padding.left + stepX * i;
        const y = padding.top + chartH - (v / niceMax) * chartH;
        return { x, y, v };
      });

    const p1 = calcPoints(data.map(d => d.value));
    const p2 = calcPoints(data.map(d => d.value2));

    const buildPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const cur = pts[i];
        const cpx1 = prev.x + stepX / 3;
        const cpx2 = cur.x - stepX / 3;
        d += ` C ${cpx1} ${prev.y}, ${cpx2} ${cur.y}, ${cur.x} ${cur.y}`;
      }
      return d;
    };

    const buildArea = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      const bottomY = padding.top + chartH;
      const linePath = buildPath(pts);
      return `${linePath} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`;
    };

    return {
      pathD: buildPath(p1),
      areaD: buildArea(p1),
      pathD2: buildPath(p2),
      areaD2: buildArea(p2),
      points: p1,
      points2: p2,
      yMax: niceMax,
      yMin: 0,
    };
  }, [data, height, maxValue, yAxisTicks]);

  const width = 800;
  const padding = { top: 20, right: 30, bottom: 36, left: 48 };
  const chartH = height - padding.top - padding.bottom;

  const tickValues = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= yAxisTicks; i++) {
      arr.push((yMax / yAxisTicks) * i);
    }
    return arr;
  }, [yMax, yAxisTicks]);

  const xLabelStep = Math.ceil(data.length / 10) || 1;

  return (
    <div className="w-full">
      {legend && legend.length > 0 && (
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          {legend.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
              <span
                className="inline-block w-4 h-1 rounded-full"
                style={{ background: l.color, boxShadow: `0 0 8px ${l.color}` }}
              />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGrad1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaGrad2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color2} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color2} stopOpacity="0" />
          </linearGradient>
        </defs>

        {tickValues.map((tv, i) => {
          const y = padding.top + chartH - (tv / yMax) * chartH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(148, 163, 184, 0.1)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontFamily="JetBrains Mono, monospace"
              >
                {labelFormatter(tv)}
              </text>
            </g>
          );
        })}

        {showArea && areaD && (
          <path d={areaD} fill="url(#areaGrad1)" />
        )}
        {showArea2 && areaD2 && color2 && (
          <path d={areaD2} fill="url(#areaGrad2)" />
        )}

        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
        {pathD2 && color2 && (
          <path
            d={pathD2}
            fill="none"
            stroke={color2}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color2})` }}
          />
        )}

        {points.map((p, i) => {
          if (data[i].value === undefined || data[i].value === 0) return null;
          return (
            <g key={`p1-${i}`}>
              <circle cx={p.x} cy={p.y} r="5" fill={color} opacity="0.2" />
              <circle cx={p.x} cy={p.y} r="3" fill={color} />
            </g>
          );
        })}
        {points2.map((p, i) => {
          if (data[i].value2 === undefined || data[i].value2 === 0) return null;
          return (
            <g key={`p2-${i}`}>
              <circle cx={p.x} cy={p.y} r="5" fill={color2} opacity="0.2" />
              <circle cx={p.x} cy={p.y} r="3" fill={color2} />
            </g>
          );
        })}

        {data.map((d, i) => {
          if (i % xLabelStep !== 0 && i !== data.length - 1) return null;
          const stepX = data.length > 1 ? (width - padding.left - padding.right) / (data.length - 1) : 0;
          const x = padding.left + stepX * i;
          return (
            <text
              key={`x-${i}`}
              x={x}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#94a3b8"
              fontFamily="JetBrains Mono, monospace"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
