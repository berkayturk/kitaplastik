import type { Locale } from "@/i18n/routing";
import { getPresetLabel, type SpecPresetId } from "@/lib/admin/spec-presets";

interface Spec {
  preset_id: string;
  value: string;
}

interface Props {
  specs: Spec[];
  locale: Locale;
}

export function ProductSpecTable({ specs, locale }: Props) {
  if (specs.length === 0) return null;
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {specs.map((s, i) => (
          <tr key={i} className="border-b border-[var(--color-border-hairline)]">
            <th className="w-1/3 py-2 pr-3 text-left font-medium text-text-secondary">
              {getPresetLabel(s.preset_id as SpecPresetId, locale)}
            </th>
            <td className="py-2 text-text-primary">{s.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
