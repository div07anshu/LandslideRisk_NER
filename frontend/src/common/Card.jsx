function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-white
        rounded-3xl
        border
        border-gray-300
        shadow-sm
        transition-shadow
        duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
