import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
    displayUnitToMeters,
    formatDistanceInUnit,
    getMetersPerCorrectGoalPercent,
    metersToDisplayUnit,
    type DistanceUnit,
} from "@/lib/game";
import { cn } from "@/lib/utils";

type MetersPerCorrectFieldProps = {
    id?: string;
    value: string;
    onChange: (metersValue: string) => void;
    goalMeters: number;
    minMeters: number;
    maxMeters: number;
    inputClassName?: string;
};

function formatDisplayValue(meters: number, unit: DistanceUnit): string {
    const display = metersToDisplayUnit(meters, unit);
    if (unit === "km") {
        if (display >= 100) {
            return String(Math.round(display));
        }
        return String(Number(display.toFixed(3)));
    }
    return String(Math.round(display));
}

function metersStringToDisplay(value: string, unit: DistanceUnit): string {
    if (value.trim() === "") return value;
    const meters = Number(value);
    if (!Number.isFinite(meters)) return value;
    return formatDisplayValue(meters, unit);
}

export function MetersPerCorrectField({
    id = "meters-per-correct",
    value,
    onChange,
    goalMeters,
    minMeters,
    maxMeters,
    inputClassName,
}: MetersPerCorrectFieldProps) {
    const [unit, setUnit] = useState<DistanceUnit>("m");

    const displayValue = metersStringToDisplay(value, unit);
    const displayMin = metersToDisplayUnit(minMeters, unit);
    const displayMax = metersToDisplayUnit(maxMeters, unit);
    const displayStep = unit === "km" ? 0.001 : 1;

    const percent = getMetersPerCorrectGoalPercent(value, goalMeters);
    const unitLabel = unit === "km" ? "kilometers" : "meters";

    const handleDisplayChange = (displayRaw: string) => {
        if (displayRaw.trim() === "") {
            onChange(displayRaw);
            return;
        }

        const displayNumber = Number(displayRaw);
        if (!Number.isFinite(displayNumber)) {
            onChange(displayRaw);
            return;
        }

        const meters = displayUnitToMeters(displayNumber, unit);
        const clamped = Math.min(Math.max(meters, minMeters), maxMeters);
        onChange(String(clamped));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor={id}>
                    Distance per correct answer ({unitLabel})
                </Label>
                <div className="flex items-center rounded-md border border-border p-0.5">
                    {(["m", "km"] as const).map((option) => (
                        <Button
                            key={option}
                            type="button"
                            variant={unit === option ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                                "h-7 px-2.5 text-xs",
                                unit !== option && "text-muted-foreground",
                            )}
                            onClick={() => setUnit(option)}
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <NumberInput
                    id={id}
                    value={displayValue}
                    onChange={handleDisplayChange}
                    min={displayMin}
                    max={displayMax}
                    step={displayStep}
                    inputClassName={inputClassName}
                />
                <span className="text-sm tabular-nums text-muted-foreground">
                    / {formatDistanceInUnit(goalMeters, unit)} {unit} (
                    {percent !== null ? `${percent.toFixed(2)}%` : "--%"})
                </span>
            </div>
        </div>
    );
}
