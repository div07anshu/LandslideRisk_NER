function SectionHeader({ title, subtitle }) {
  return (
    <header className="mb-5">
      <h2
        className="
          text-base
          font-bold
          tracking-wide
          text-slate-900
        "
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="
            text-sm
            text-slate-500
            mt-0.5
          "
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}

export default SectionHeader;
