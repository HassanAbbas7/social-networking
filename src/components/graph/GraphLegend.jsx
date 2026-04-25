import { roleColors, sectorColors } from "../../lib/graphHelpers";

function GraphLegend({ rolesRevealed }) {
  const items = rolesRevealed ? roleColors : sectorColors;

  return (
    <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
      {Object.entries(items).map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default GraphLegend;