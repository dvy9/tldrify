import { RiAddFill, RiQuillPenAiLine } from '@remixicon/react'
import * as React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

function SidebarAppMenuButton({
  children,
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  return (
    <SidebarMenuButton
      className="group/menu-button h-9 gap-3 rounded-md font-medium data-[active=true]:bg-gradient-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/70 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] data-[active=true]:hover:bg-transparent"
      {...props}
    >
      {children}
    </SidebarMenuButton>
  )
}

export type SidebarSummary = {
  id: string
  title: string
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  summaries: SidebarSummary[]
  activeSummaryId?: string | null
  disabled?: boolean
  onSelectNew: () => void
  onSelectSummary: (id: string) => void
}

export function AppSidebar({
  summaries,
  activeSummaryId,
  disabled = false,
  onSelectNew,
  onSelectSummary,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar {...props} className="dark !border-none">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-3 hover:bg-sidebar hover:text-sidebar-foreground"
            >
              <div className="relative flex aspect-square size-9 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)]">
                <RiQuillPenAiLine className="size-5" aria-hidden />
              </div>
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-medium">TL;DR-ify</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* New Summary */}
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarAppMenuButton
                  disabled={disabled}
                  isActive={!activeSummaryId}
                  onClick={onSelectNew}
                >
                  <RiAddFill
                    className="size-5.5 text-sidebar-foreground/50 group-data-[active=true]/menu-button:text-primary"
                    aria-hidden
                  />
                  <span>New Summary</span>
                </SidebarAppMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Summaries */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase">
            Summaries
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {summaries.map((s) => (
                <SidebarMenuItem key={s.id}>
                  <SidebarAppMenuButton
                    disabled={disabled}
                    isActive={activeSummaryId === s.id}
                    onClick={() => onSelectSummary(s.id)}
                  >
                    <span className="truncate">{s.title}</span>
                  </SidebarAppMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
