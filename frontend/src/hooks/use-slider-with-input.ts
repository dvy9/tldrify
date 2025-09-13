import * as React from 'react'

type UseSliderWithInputProps = {
  minValue?: number
  maxValue?: number
  initialValue?: number[]
  defaultValue?: number[]
  step?: number
  disabled?: boolean
}

export function useSliderWithInput({
  minValue = 0,
  maxValue = 100,
  initialValue = [minValue],
  defaultValue = [minValue],
  step = 1,
  disabled = false
}: UseSliderWithInputProps) {
  const [sliderValue, setSliderValue] = React.useState(initialValue)
  const [inputValues, setInputValues] = React.useState(initialValue.map((v) => v.toString()))

  React.useEffect(() => {
    setSliderValue(initialValue)
    setInputValues(initialValue.map((v) => v.toString()))
  }, [initialValue])

  const showReset =
    !disabled &&
    sliderValue.length === defaultValue.length &&
    !sliderValue.every((value, index) => value === defaultValue[index])

  const validateAndUpdateValue = React.useCallback(
    (rawValue: string, index: number) => {
      if (rawValue === '' || rawValue === '-') {
        const newInputValues = [...inputValues]
        newInputValues[index] = minValue.toString()
        setInputValues(newInputValues)

        const newSliderValues = [...sliderValue]
        newSliderValues[index] = minValue
        setSliderValue(newSliderValues)
        return
      }

      const numValue = parseFloat(rawValue)

      if (isNaN(numValue)) {
        const newInputValues = [...inputValues]
        newInputValues[index] = sliderValue[index]!.toString()
        setInputValues(newInputValues)
        return
      }

      let clampedValue = Math.min(maxValue, Math.max(minValue, numValue))

      if (sliderValue.length > 1) {
        if (index === 0) {
          clampedValue = Math.min(clampedValue, sliderValue[1]!)
        } else {
          clampedValue = Math.max(clampedValue, sliderValue[0]!)
        }
      }

      clampedValue = Math.round(clampedValue / step) * step

      const newSliderValues = [...sliderValue]
      newSliderValues[index] = clampedValue
      setSliderValue(newSliderValues)

      const newInputValues = [...inputValues]
      newInputValues[index] = clampedValue.toString()
      setInputValues(newInputValues)
    },
    [sliderValue, inputValues, minValue, maxValue, step]
  )

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const newValue = e.target.value
      if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
        const newInputValues = [...inputValues]
        newInputValues[index] = newValue
        setInputValues(newInputValues)
      }
    },
    [inputValues]
  )

  const handleSliderChange = React.useCallback((newValue: number[]) => {
    setSliderValue(newValue)
    setInputValues(newValue.map((v) => v.toString()))
  }, [])

  const resetToDefault = React.useCallback(() => {
    setSliderValue(defaultValue)
    setInputValues(defaultValue.map((v) => v.toString()))
  }, [defaultValue])

  return {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    resetToDefault,
    showReset
  }
}
