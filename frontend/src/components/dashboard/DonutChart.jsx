import { useEffect, useState } from "react";

function DonutChart({ data, size = 128, thickness = 20 }) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const TOTAL_DURATION = 1200;
  const MIN_SEGMENT_DURATION = 250;

  // Pre-calculate segments to avoid mutating variables during render
  const segments = data.reduce((acc, d) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const currentOffset = acc.currentOffset;

    const duration = Math.max(
      MIN_SEGMENT_DURATION,
      fraction * TOTAL_DURATION
    );

    const segment = {
      ...d,
      dash,
      gap,
      currentOffset,
      duration,
      delay: acc.cumulativeDelay
    };

    acc.currentOffset += dash;
    acc.cumulativeDelay += duration;
    acc.items.push(segment);

    return acc;
  }, { currentOffset: 0, cumulativeDelay: 0, items: [] }).items;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            className="donut-segment"
            style={{
              strokeDasharray: mounted
                ? `${seg.dash} ${seg.gap}`
                : `0 ${circumference}`,
              strokeDashoffset: -seg.currentOffset,
              '--seg-duration': `${seg.duration}ms`,
              '--seg-delay': `${seg.delay}ms`,
            }}
          />
        ))}
      </g>
    </svg>
  );
}

export default DonutChart;