import type { FileMetadata, FileUploadActions, FileUploadState } from '@/hooks/use-file-upload'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import {
  RiAttachment2,
  RiCloseLine,
  RiErrorWarningLine,
  RiFileCodeLine,
  RiFileExcelLine,
  RiFileImageLine,
  RiFileLine,
  RiFilePdfLine,
  RiFilePptLine,
  RiFileTextLine,
  RiFileWordLine,
  RiLoader4Line,
  RiSparklingLine
} from '@remixicon/react'
import * as React from 'react'
import { ChatMessage } from '@/components/chat-message'
import { SettingsPanelTrigger } from '@/components/settings-panel'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

function getFileIcon(file: File | FileMetadata) {
  const mime = file.type.toLowerCase()
  if (/image/.test(mime)) return RiFileImageLine
  if (/pdf|epub/.test(mime)) return RiFilePdfLine
  if (/excel|spreadsheet|csv/.test(mime)) return RiFileExcelLine
  if (/powerpoint|presentation/.test(mime)) return RiFilePptLine
  if (/word|document/.test(mime)) return RiFileWordLine
  if (/html|xml|json/.test(mime)) return RiFileCodeLine
  if (/text/.test(mime)) return RiFileTextLine
  return RiFileLine
}

export type ChatState = {
  message: string
  answer?: string
  isLoading: boolean
}

export type ChatActions = {
  toolbar: {
    label: string
    icon: React.ElementType
    action: () => unknown
    variant?: 'destructive'
  }[]
  setMessage: (text: ChatState['message']) => void
  handleSubmit: (turnstileToken?: string) => unknown
}

type ChatProps = {
  chatState: ChatState
  chatActions: ChatActions
  fileState: FileUploadState
  fileActions: FileUploadActions
}

export default function Chat({ chatState, chatActions, fileState, fileActions }: ChatProps) {
  const turnstileRef = React.useRef<TurnstileInstance | null>(null)

  function submitOnCtrlEnter(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (chatState.isLoading) return
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      chatActions.handleSubmit(turnstileRef.current?.getResponse())
    }
  }

  return (
    <ScrollArea className="w-full flex-1 overflow-clip bg-background shadow-md min-[1024px]:rounded-e-3xl md:rounded-s-[inherit] [&>div>div]:h-full">
      <div className="flex h-full flex-col px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background py-5 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
          <div className="flex items-center justify-between gap-2">
            <SidebarTrigger className="-my-2 -ms-3" />
            <div className="-my-2 -me-2 flex items-center gap-1 has-[:disabled]:cursor-not-allowed">
              {chatActions.toolbar.map(({ label, icon: Icon, action, variant }) => (
                <Button
                  key={label}
                  variant="ghost"
                  onClick={action}
                  className={cn(
                    'px-2',
                    variant === 'destructive' &&
                      'text-destructive-foreground hover:bg-destructive/10 hover:text-destructive-foreground'
                  )}
                  disabled={chatState.isLoading || chatState.answer == null}
                >
                  <Icon
                    className={cn(
                      'size-5',
                      variant === 'destructive'
                        ? 'text-destructive-foreground sm:text-destructive-foreground/70'
                        : 'text-muted-foreground sm:text-muted-foreground/70'
                    )}
                  />
                  <span className="max-sm:sr-only">{label}</span>
                </Button>
              ))}
              <SettingsPanelTrigger />
            </div>
          </div>
        </div>
        {chatState.answer &&
        (chatState.answer.length > 0 || (chatState.answer.length === 0 && !chatState.isLoading)) ? (
          /* Chat */
          <div className="relative grow">
            <div className="mx-auto my-12 max-w-3xl space-y-6">
              {/* Uploaded files */}
              {fileState.files.length > 0 && (
                <div className="mb-2 flex flex-wrap justify-end gap-2">
                  {fileState.files.map((file) => (
                    <div
                      className="flex items-center gap-3 rounded-xl border px-4 py-2"
                      key={file.id}
                    >
                      {React.createElement(getFileIcon(file.file), {
                        className: 'size-5 opacity-60',
                        'aria-hidden': true
                      })}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{file.file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Chat messages */}
              <ChatMessage isUser>{chatState.message}</ChatMessage>
              <ChatMessage>{chatState.answer}</ChatMessage>
            </div>
          </div>
        ) : (
          /* Footer */
          <>
            <div className="mx-auto mt-[calc(50vh-10rem)] max-w-3xl">
              <h2 className="-mb-2 text-2xl font-semibold">Ready to summarize?</h2>
            </div>
            <div className="sticky bottom-0 z-50 pt-4 md:pt-8">
              <div className="mx-auto max-w-3xl rounded-[20px] bg-background pb-4 md:pb-8">
                <div
                  onDragEnter={fileActions.handleDragEnter}
                  onDragLeave={fileActions.handleDragLeave}
                  onDragOver={fileActions.handleDragOver}
                  onDrop={fileActions.handleDrop}
                  className="relative rounded-[20px] border border-transparent bg-muted transition-colors focus-within:border-input focus-within:bg-muted/50"
                >
                  <textarea
                    value={chatState.message}
                    onChange={(e) => chatActions.setMessage(e.target.value)}
                    onKeyDown={submitOnCtrlEnter}
                    className="flex w-full [resize:none] bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none sm:min-h-[84px]"
                    placeholder="Just drag a file, paste content, or share a link."
                    aria-label="Enter your text"
                    disabled={chatState.isLoading}
                  />
                  <input
                    {...fileActions.getInputProps()}
                    className="sr-only"
                    aria-label="Upload file"
                    disabled={chatState.isLoading || fileState.files.length > 0}
                  />
                  {/* Textarea buttons */}
                  <div className="flex items-center justify-between gap-2 p-3">
                    {/* Left buttons */}
                    <div className="flex items-center gap-2 has-[:disabled]:cursor-not-allowed">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-full border-none transition-[box-shadow] hover:bg-background hover:shadow-md"
                        onClick={fileActions.openFileDialog}
                        disabled={chatState.isLoading || fileState.files.length > 0}
                      >
                        <RiAttachment2 className="size-5 text-muted-foreground/70" aria-hidden />
                      </Button>
                    </div>
                    {/* Right buttons */}
                    <div className="flex items-center gap-2 has-[:disabled]:cursor-not-allowed">
                      <Button
                        className="h-8 rounded-full"
                        onClick={() =>
                          chatActions.handleSubmit(turnstileRef.current?.getResponse())
                        }
                        disabled={
                          chatState.isLoading ||
                          (fileState.files.length === 0 && chatState.message.trim().length === 0)
                        }
                      >
                        {chatState.isLoading ? (
                          <>
                            <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                            Summarizing…
                          </>
                        ) : (
                          <>
                            Summarize
                            <RiSparklingLine className="size-4" aria-hidden />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                {fileState.errors.length > 0 && (
                  <div
                    className="mt-2 flex items-center gap-1 text-sm text-destructive"
                    role="alert"
                  >
                    <RiErrorWarningLine className="size-3" aria-hidden />
                    <span>{fileState.errors[0]}</span>
                  </div>
                )}
                {/* File list */}
                {fileState.files.map((file) => (
                  <div className="mt-4 space-y-2" key={file.id}>
                    <div className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {React.createElement(getFileIcon(file.file), {
                          className: 'size-5 opacity-60',
                          'aria-hidden': true
                        })}
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{file.file.name}</p>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                        onClick={() => fileActions.removeFile(file.id)}
                        aria-label="Remove file"
                      >
                        <RiCloseLine className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              options={{ theme: 'light' }}
              style={{ margin: '0 auto 1rem', display: 'block' }}
              className="[&>div]:flex [&>div]:[clip-path:inset(1px_round_0.5rem)]"
            />
          </>
        )}
      </div>
    </ScrollArea>
  )
}
