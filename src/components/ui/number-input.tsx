import * as React from "react";
import { Info, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface NumberInputProps
    extends Omit<React.ComponentProps<"input">, "type" | "step" | "onChange"> {
    value: string | number;
    onChange: (value: string) => void;
    step?: number;
    ctrlStep?: number;
    shiftStep?: number;
    ctrlShiftStep?: number;
    min?: number;
    max?: number;
    disabled?: boolean;
    inputClassName?: string;
}

function getStepDelta(
    event: React.MouseEvent,
    step: number,
    ctrlStep: number,
    shiftStep: number,
    ctrlShiftStep: number,
) {
    if (event.ctrlKey && event.shiftKey) return ctrlShiftStep;
    if (event.ctrlKey) return ctrlStep;
    if (event.shiftKey) return shiftStep;
    return step;
}

export function NumberInput({
    value,
    onChange,
    step = 1,
    ctrlStep = step * 5,
    shiftStep = step * 10,
    ctrlShiftStep = step * 25,
    min,
    max,
    disabled,
    className,
    inputClassName,
    ...props
}: NumberInputProps) {
    const numericValue = Number(value);
    const isValidNumber = !Number.isNaN(numericValue);

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;

        const increment = getStepDelta(e, step, ctrlStep, shiftStep, ctrlShiftStep);
        const newValue = isValidNumber ? numericValue + increment : step;
        const finalValue = max !== undefined ? Math.min(newValue, max) : newValue;
        onChange(String(finalValue));
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;

        const decrement = getStepDelta(e, step, ctrlStep, shiftStep, ctrlShiftStep);
        const newValue = isValidNumber ? numericValue - decrement : step;
        const finalValue = min !== undefined ? Math.max(newValue, min) : newValue;
        onChange(String(finalValue));
    };

    const tooltipContent = (
        <div className="space-y-1">
            <div className="font-medium">Hotkeys:</div>
            <div className="text-xs space-y-0.5">
                <div>Click: ±{step}</div>
                <div>Shift + Click: ±{shiftStep}</div>
                <div>Ctrl + Click: ±{ctrlStep}</div>
                <div>Ctrl + Shift + Click: ±{ctrlShiftStep}</div>
            </div>
        </div>
    );

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                tabIndex={-1}
                onClick={handleDecrement}
                disabled={disabled || (min !== undefined && isValidNumber && numericValue <= min)}
                className="shrink-0"
            >
                <Minus className="size-4" />
                <span className="sr-only">Decrease</span>
            </Button>
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                min={min}
                max={max}
                disabled={disabled}
                className={cn("text-center w-14 min-w-[56px]", inputClassName)}
                {...props}
            />
            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                tabIndex={-1}
                onClick={handleIncrement}
                disabled={disabled || (max !== undefined && isValidNumber && numericValue >= max)}
                className="shrink-0"
            >
                <Plus className="size-4" />
                <span className="sr-only">Increase</span>
            </Button>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        tabIndex={-1}
                        disabled={disabled}
                        className="shrink-0 h-6 w-6"
                    >
                        <Info className="size-3.5" />
                        <span className="sr-only">Show hotkeys</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
