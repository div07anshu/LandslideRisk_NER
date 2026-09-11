function SectionHeader({ title, subtitle, className = "" }) {
  return (
    <header className={`mb-5 ${className}`}>
      <div className="border-l-4 border-blue-600 pl-3.5 py-0.5">
        <h1
          className="
            text-xl
            sm:text-2xl
            font-bold
            tracking-tight
            text-slate-900
            leading-tight
          "
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="
              text-xs
              sm:text-sm
              text-slate-500
              mt-1
              font-normal
            "
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}

export default SectionHeader;
