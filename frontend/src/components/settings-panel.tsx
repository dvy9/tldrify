import { RiSettingsLine } from '@remixicon/react'
import * as React from 'react'
import SliderControl from '@/components/slider-control'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

export type Settings = {
  model: 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gpt-5-nano'
  writingStyle: 'concise' | 'formal' | 'technical' | 'creative' | 'scientific'
  maxWords: number
}

type SettingsPanelContext = {
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  togglePanel: () => void
}

const SettingsPanelContext = React.createContext<SettingsPanelContext | null>(null)

function useSettingsPanel() {
  const context = React.use(SettingsPanelContext)
  if (!context) {
    throw new Error('useSettingsPanel must be used within a SettingsPanelProvider.')
  }
  return context
}

function SettingsPanelProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile(1024)
  const [openMobile, setOpenMobile] = React.useState(false)

  const togglePanel = React.useCallback(() => {
    return isMobile && setOpenMobile((open) => !open)
  }, [isMobile, setOpenMobile])

  const contextValue = React.useMemo<SettingsPanelContext>(
    () => ({
      isMobile,
      openMobile,
      setOpenMobile,
      togglePanel
    }),
    [isMobile, openMobile, setOpenMobile, togglePanel]
  )

  return <SettingsPanelContext value={contextValue}>{children}</SettingsPanelContext>
}

type SettingsPanelContentProps = {
  disabled: boolean
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
}

function SettingsPanelContent({ disabled, settings, setSettings }: SettingsPanelContentProps) {
  return (
    <>
      {/* Sidebar header */}
      <div className="py-5">
        <div className="flex items-center gap-2">
          <RiSettingsLine className="size-5 text-muted-foreground/70" aria-hidden />
          <h2 className="text-sm font-medium">Settings</h2>
        </div>
      </div>

      {/* Sidebar content */}
      <div className="-mt-px">
        {/* Content group */}
        <div className="relative py-5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
          <h3 className="mb-4 text-xs font-medium text-muted-foreground/80 uppercase">Presets</h3>
          <div className="space-y-3">
            {/* Model */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="model-select" className="font-normal">
                Model
              </Label>
              <Select
                value={settings.model}
                onValueChange={(value) =>
                  setSettings((s) => ({ ...s, model: value as Settings['model'] }))
                }
                disabled={disabled}
              >
                <SelectTrigger
                  id="model-select"
                  className="h-7 w-auto max-w-full gap-1 border-none bg-background px-2 py-1 [&_svg]:-me-1"
                >
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent
                  className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2"
                  align="end"
                >
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gpt-5-nano" disabled>
                    GPT 5 (coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Writing style */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="writing-style-select" className="font-normal">
                Writing style
              </Label>
              <Select
                value={settings.writingStyle}
                onValueChange={(value) =>
                  setSettings((s) => ({ ...s, writingStyle: value as Settings['writingStyle'] }))
                }
                disabled={disabled}
              >
                <SelectTrigger
                  id="writing-style-select"
                  className="h-7 w-auto max-w-full gap-1 border-none bg-background px-2 py-1 [&_svg]:-me-1"
                >
                  <SelectValue placeholder="Select writing style" />
                </SelectTrigger>
                <SelectContent
                  className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2"
                  align="end"
                >
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="scientific">Scientific</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content group */}
        <div className="relative py-5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
          <h3 className="mb-4 text-xs font-medium text-muted-foreground/80 uppercase">
            Configurations
          </h3>
          <div className="space-y-3">
            {/* Maximum words */}
            <SliderControl
              className="[&_input]:w-14"
              minValue={100}
              maxValue={500}
              initialValue={[settings.maxWords]}
              defaultValue={[200]}
              step={100}
              label="Maximum words"
              disabled={disabled}
              inputId="max-words-input"
              onValueChangeNumber={(value) => setSettings((s) => ({ ...s, maxWords: value }))}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function SettingsPanel(props: SettingsPanelContentProps) {
  const { isMobile, openMobile, setOpenMobile } = useSettingsPanel()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent className="w-72 bg-[hsl(240_5%_92.16%)] px-4 py-0 md:px-6 [&>button]:hidden">
          <SheetTitle className="hidden">Settings</SheetTitle>
          <div className="flex h-full w-full flex-col">
            <SettingsPanelContent {...props} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <ScrollArea>
      <div className="w-[300px] px-4 md:px-6">
        <SettingsPanelContent {...props} />
      </div>
    </ScrollArea>
  )
}

function SettingsPanelTrigger({
  onClick
}: {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const { isMobile, togglePanel } = useSettingsPanel()
  if (!isMobile) return null

  return (
    <Button
      variant="ghost"
      className="px-2"
      onClick={(event) => {
        onClick?.(event)
        togglePanel()
      }}
    >
      <RiSettingsLine
        className="size-5 text-muted-foreground sm:text-muted-foreground/70"
        aria-hidden
      />
      <span className="max-sm:sr-only">Settings</span>
    </Button>
  )
}

export { SettingsPanel, SettingsPanelProvider, SettingsPanelTrigger, useSettingsPanel }
