import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SETTING_SCOPES,
  SHUFFLE_MODES,
  parseSettingScope,
  parseShuffleMode,
  type SettingScope,
  type ShuffleMode,
} from "@/lib/game";

type ShuffleSettingFieldProps = {
  label: string;
  mode: ShuffleMode;
  scope: SettingScope;
  onModeChange: (mode: ShuffleMode) => void;
  onScopeChange: (scope: SettingScope) => void;
};

export function ShuffleSettingField({
  label,
  mode,
  scope,
  onModeChange,
  onScopeChange,
}: ShuffleSettingFieldProps) {
  const modeDescription = SHUFFLE_MODES.find((item) => item.id === mode)
    ?.description;
  const scopeDescription = SETTING_SCOPES.find((item) => item.id === scope)
    ?.description;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          value={mode}
          onValueChange={(value) => onModeChange(parseShuffleMode(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHUFFLE_MODES.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={scope}
          onValueChange={(value) => onScopeChange(parseSettingScope(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SETTING_SCOPES.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        {modeDescription}
        {mode !== "none" ? ` ${scopeDescription}` : null}
      </p>
    </div>
  );
}
