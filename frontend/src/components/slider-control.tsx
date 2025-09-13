import { RiRefreshLine } from '@remixicon/react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSliderWithInput } from '@/hooks/use-slider-with-input'
import { cn } from '@/lib/utils'

type SliderControlProps = {
  className?: string
  minValue: number
  maxValue: number
  initialValue: [number]
  defaultValue: [number]
  step: number
  label: string
  disabled?: boolean
  inputId?: string
  onValueChangeNumber?: (value: number) => void
}

export default function SliderControl({
  className,
  minValue,
  maxValue,
  initialValue,
  defaultValue,
  step,
  label,
  disabled = false,
  inputId,
  onValueChangeNumber
}: SliderControlProps) {
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    resetToDefault,
    showReset
  } = useSliderWithInput({ minValue, maxValue, initialValue, defaultValue, step, disabled })

  React.useEffect(() => {
    onValueChangeNumber?.(sliderValue[0]!)
  }, [sliderValue, onValueChangeNumber])

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="font-normal">{label}</Label>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    'size-7 text-muted-foreground/70 transition-all hover:bg-transparent hover:text-foreground',
                    showReset ? 'opacity-100' : 'pointer-events-none opacity-0'
                  )}
                  aria-label="Reset"
                  onClick={resetToDefault}
                  tabIndex={showReset ? 0 : -1}
                >
                  <RiRefreshLine className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="dark px-2 py-1 text-xs">Reset to default</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className={cn('contents', disabled && 'cursor-not-allowed')}>
            <Input
              id={inputId}
              className="h-6 w-11 [appearance:textfield] border-none bg-transparent px-1 py-0 text-right tabular-nums shadow-none focus:bg-background [&::-webkit-inner-spin-button]:[-webkit-appearance:none]"
              type="number"
              inputMode={step < 1 ? 'decimal' : 'numeric'}
              min={minValue}
              max={maxValue}
              step={step}
              value={inputValues[0]}
              onChange={(e) => handleInputChange(e, 0)}
              onBlur={() => validateAndUpdateValue(inputValues[0] ?? '', 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  validateAndUpdateValue(inputValues[0] ?? '', 0)
                }
              }}
              aria-label="Enter value"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
      <div className={cn('flex items-center gap-4', disabled && 'cursor-not-allowed')}>
        <Slider
          className="grow [&>*:first-child]:bg-black/10"
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={minValue}
          max={maxValue}
          step={step}
          aria-label={label}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
