function CardHeader({ title, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <h3 className="text-[16px] font-bold">{title}</h3>
      {actionLabel && (
        <button
          onClick={onAction}
          className="text-xs font-medium hover:text-white hover:bg-blue-600 border hover:border-blue-600 rounded-xl px-2.5 py-1 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default CardHeader;
