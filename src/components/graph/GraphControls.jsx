function GraphControls({
  showNames,
  rolesRevealed,
  onToggleNames,
  onRevealRoles,
  onResetRoles,
  onReheatLayout,
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {!rolesRevealed ? (
        <button
          onClick={onRevealRoles}
          className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
        >
          Reveal roles
        </button>
      ) : (
        <button
          onClick={onResetRoles}
          className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
        >
          Reset colours
        </button>
      )}

      <button
        onClick={onToggleNames}
        className="rounded-xl border border-white/20 px-4 py-2 font-semibold"
      >
        {showNames ? "Hide names" : "Show names"}
      </button>

      <button
        onClick={onReheatLayout}
        className="rounded-xl border border-white/20 px-4 py-2 font-semibold"
      >
        Reheat layout
      </button>
    </div>
  );
}

export default GraphControls;