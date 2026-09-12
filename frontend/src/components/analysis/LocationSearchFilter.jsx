import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const selectClass = `
  bg-white
  border
  border-gray-300
  rounded-xl
  px-4
  py-2
  text-sm
  text-slate-700
  shadow-sm
`;

const labelClass = "text-[10px] font-medium uppercase tracking-wide text-slate-400 px-1";

export default function LocationSearchFilter({ areas, selectedId, onSelect }) {
  const { t } = useTranslation();

  const selected = useMemo(
    () => areas.find((a) => a.id === selectedId) ?? areas[0],
    [areas, selectedId],
  );

  const states = useMemo(
    () => Array.from(new Set(areas.map((a) => a.state))).sort(),
    [areas],
  );

  const districts = useMemo(
    () =>
      Array.from(
        new Set(
          areas
            .filter((a) => a.state === selected.state)
            .map((a) => a.district),
        ),
      ).sort(),
    [areas, selected.state],
  );

  const locations = useMemo(
    () =>
      areas.filter(
        (a) => a.state === selected.state && a.district === selected.district,
      ),
    [areas, selected.state, selected.district],
  );

  function handleStateChange(nextState) {
    const firstInState = areas.find((a) => a.state === nextState);
    if (firstInState) onSelect(firstInState.id);
  }

  function handleDistrictChange(nextDistrict) {
    const firstInDistrict = areas.find(
      (a) => a.state === selected.state && a.district === nextDistrict,
    );
    if (firstInDistrict) onSelect(firstInDistrict.id);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <span className={labelClass}>{t("analysis.selectState")}</span>
        <select
          value={selected.state}
          onChange={(e) => handleStateChange(e.target.value)}
          className={selectClass}
        >
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>{t("analysis.selectDistrict")}</span>
        <select
          value={selected.district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className={selectClass}
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>{t("analysis.selectLocation")}</span>
        <select
          value={selected.id}
          onChange={(e) => onSelect(e.target.value)}
          className={selectClass}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
