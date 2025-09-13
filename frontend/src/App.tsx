import { RiDeleteBinLine, RiPencilLine, RiShareLine } from '@remixicon/react'
import FileSaver from 'file-saver'
import * as React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import Chat, { type ChatActions, type ChatState } from '@/components/chat'
import NotFound from '@/components/not-found'
import { type Settings, SettingsPanel, SettingsPanelProvider } from '@/components/settings-panel'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { type FileMetadata, useFileUpload } from '@/hooks/use-file-upload'
import { deleteSummary, getSummary, listSummaries, putSummary, type SummaryRecord } from '@/lib/db'
import { navigate, parseHash, type Route } from '@/lib/router'

const getDefaultSettings = (): Settings => ({
  model: 'gemini-2.5-flash',
  writingStyle: 'concise',
  maxWords: 200
})

type SummarizeReq = {
  message: string
  settings: Settings
  file?: File
  turnstileToken: string
}

type SummarizeRes = {
  title: string
  answer: string
}

const summarize = async (req: SummarizeReq): Promise<SummarizeRes> => {
  const form = new FormData()
  form.append('message', req.message)
  form.append('settings', JSON.stringify(req.settings))
  form.append('turnstileToken', req.turnstileToken)
  if (req.file) form.append('file', req.file)

  const res = await fetch(import.meta.env.VITE_API_URL + '/summarize', {
    method: 'POST',
    body: form
  })

  const data = (await res.json().catch(() => ({}))) as {
    title: string
    answer: string
    detail?: string
  }

  if (!res.ok) {
    const msg = data?.detail || `Request failed with ${res.status}`
    throw new Error(msg)
  }

  return data
}

export default function App() {
  const [chatState, setChatState] = React.useState<ChatState>({ message: '', isLoading: false })
  const [settings, setSettings] = React.useState<Settings>(getDefaultSettings)
  const [initialFiles, setInitialFiles] = React.useState<FileMetadata[]>([])

  const [fileState, fileActions] = useFileUpload({
    maxSize: 5 * 1024 * 1024,
    accept: 'image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.pdf,.epub,.txt,.md,.html,.xml,.json',
    initialFiles
  })

  const [route, setRoute] = React.useState<Route>(() => parseHash(window.location.hash))
  const [activeSummaryId, setActiveSummaryId] = React.useState<string | null>(
    route.name === 'summary' ? route.id : null
  )
  const [summaries, setSummaries] = React.useState<Pick<SummaryRecord, 'id' | 'title'>[]>([])

  const refreshSummaries = React.useCallback(async () => {
    const all = await listSummaries()
    setSummaries(all.map(({ id, title }) => ({ id, title })))
  }, [])

  React.useEffect(() => {
    function onHashChange() {
      const r = parseHash(window.location.hash)
      setRoute(r)
    }

    if (!window.location.hash) navigate({ name: 'new' })
    else onHashChange()

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      setActiveSummaryId(route.name === 'summary' ? route.id : null)
      if (route.name === 'summary') {
        const rec = await getSummary(route.id)
        if (rec) {
          setChatState({ message: rec.message, answer: rec.answer, isLoading: false })
          setInitialFiles(rec.files)
          setSettings(rec.settings)
        } else {
          navigate({ name: 'not_found' })
        }
      } else if (route.name === 'new') {
        setChatState({ message: '', isLoading: false, answer: undefined })
        setInitialFiles([])
        setSettings(getDefaultSettings)
      }
    })()
  }, [route])

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshSummaries()
  }, [refreshSummaries])

  const chatActions = React.useMemo<ChatActions>(() => {
    return {
      toolbar: [
        {
          label: 'Export',
          icon: RiShareLine,
          action: () => {
            if (chatState.isLoading || chatState.answer == null) return
            const blob = new Blob([chatState.answer], { type: 'text/markdown;charset=utf-8' })
            const now = new Date().toISOString().slice(0, 16).replace('T', ' ').replace(':', '-')
            FileSaver.saveAs(blob, `summary (${now}).md`)
          }
        },
        {
          label: 'Rename',
          icon: RiPencilLine,
          action: async () => {
            if (chatState.answer == null || !activeSummaryId) return
            const rec = await getSummary(activeSummaryId)
            if (!rec) return
            const next = window.prompt('Rename summary', rec.title)
            if (!next) return
            const updated: SummaryRecord = { ...rec, title: next, updatedAt: Date.now() }
            await putSummary(updated)
            await refreshSummaries()
          }
        },
        {
          label: 'Delete',
          icon: RiDeleteBinLine,
          action: async () => {
            if (chatState.answer == null || !activeSummaryId) return
            const confirmDelete = window.confirm('Delete this summary?')
            if (!confirmDelete) return
            await deleteSummary(activeSummaryId)
            await refreshSummaries()
            navigate({ name: 'new' })
          },
          variant: 'destructive'
        }
      ],
      setMessage: (message) => setChatState((s) => ({ ...s, message: message })),
      handleSubmit: async (turnstileToken) => {
        if (chatState.isLoading || fileState.errors.length > 0 || !turnstileToken) return
        setChatState((s) => ({ ...s, isLoading: true, answer: undefined }))

        const id = crypto.randomUUID()
        const now = Date.now()
        const filesMeta = fileState.files.map((f) =>
          f.file instanceof File
            ? { name: f.file.name, size: f.file.size, type: f.file.type, url: '', id: f.id }
            : f.file
        )
        const rec: SummaryRecord = {
          id,
          title: 'Untitled',
          message: chatState.message,
          answer: '',
          files: filesMeta,
          settings,
          createdAt: now,
          updatedAt: now
        }

        try {
          await putSummary(rec)
          await refreshSummaries()

          setChatState((s) => ({ ...s, answer: '' }))
          setActiveSummaryId(id)

          const { title, answer } = await summarize({
            message: chatState.message,
            settings,
            file: fileState.files[0]?.file instanceof File ? fileState.files[0].file : undefined,
            turnstileToken
          })

          rec.title = title
          rec.answer = answer

          const chunks = answer.split(' ')
          for (let i = 0; i < chunks.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 30))
            setChatState((s) => ({
              ...s,
              answer: s.answer ? s.answer + ' ' + chunks[i] : chunks[i]
            }))
          }

          //
        } catch (e) {
          console.error(e)
          rec.answer = 'Something went wrong. Please try again later.'
          setChatState((s) => ({ ...s, answer: rec.answer }))

          //
        } finally {
          await putSummary({ ...rec, updatedAt: Date.now() })
          await refreshSummaries()
          navigate({ name: 'summary', id })
          setChatState((s) => ({ ...s, isLoading: false }))
        }
      }
    }
  }, [chatState, settings, fileState, activeSummaryId, refreshSummaries])

  return (
    <SidebarProvider>
      <AppSidebar
        disabled={chatState.isLoading}
        summaries={summaries}
        activeSummaryId={activeSummaryId}
        onSelectNew={() => navigate({ name: 'new' })}
        onSelectSummary={(id) => navigate({ name: 'summary', id })}
      />
      <SidebarInset className="group/sidebar-inset bg-sidebar">
        <SettingsPanelProvider>
          <div className="flex h-svh bg-[hsl(240_5%_92.16%)] transition-all duration-300 ease-in-out md:rounded-s-3xl md:group-peer-data-[state=collapsed]/sidebar-inset:rounded-s-none">
            {route.name === 'not_found' ? (
              <NotFound />
            ) : (
              <>
                <Chat
                  chatState={chatState}
                  chatActions={chatActions}
                  fileState={fileState}
                  fileActions={fileActions}
                />
                <SettingsPanel
                  disabled={chatState.answer != null || !!chatState.isLoading}
                  settings={settings}
                  setSettings={setSettings}
                />
              </>
            )}
          </div>
        </SettingsPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
