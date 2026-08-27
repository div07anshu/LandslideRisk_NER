export default function ContourMotif({ className = "" }) {

  return (
    <svg
      viewBox="0 0 200 120"
      className={className}
      aria-hidden="true"
      fill="none"
    >

      {[18, 34, 50, 66, 82, 98].map((y, i) => (

        <path
          key={y}
          d={`M0 ${y} C 30 ${y - 14}, 60 ${y + 14}, 100 ${y} S 170 ${y - 14}, 200 ${y}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.25 - i * 0.03}
        />

      ))}

    </svg>
  );
}