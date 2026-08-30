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

  let offset = 0;
  let cumulativeDelay = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const currentOffset = offset;
          offset += dash;

          const duration = Math.max(
            MIN_SEGMENT_DURATION,
            fraction * TOTAL_DURATION
          );
          const delay = cumulativeDelay;
          cumulativeDelay += duration;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              className="donut-segment"
              style={{
                strokeDasharray: mounted
                  ? `${dash} ${gap}`
                  : `0 ${circumference}`,
                strokeDashoffset: -currentOffset,
                "--seg-duration": `${duration}ms`,
                "--seg-delay": `${delay}ms`,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}

export default DonutChart;