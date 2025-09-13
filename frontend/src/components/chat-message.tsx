import * as React from 'react'
import { Streamdown } from 'streamdown'
import { cn } from '@/lib/utils'

type ChatMessageProps = {
  isUser?: boolean
  children: string | null | undefined
}

const ChatMessage = React.memo(
  ({ isUser, children }: ChatMessageProps) => {
    return (
      <article
        className={cn(
          'flex items-start gap-4 text-[15px] leading-relaxed [&_:where(h1,h2,h3,h4,h5,h6)]:text-balance [&_:where(p)]:text-pretty',
          isUser && 'justify-end'
        )}
      >
        <div
          className={cn([
            'has-[:first-child:empty]:hidden',
            isUser && 'rounded-xl bg-muted px-4 py-3'
          ])}
        >
          <Streamdown className="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {children}
          </Streamdown>
        </div>
      </article>
    )
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
)
ChatMessage.displayName = 'ChatMessage'

export { ChatMessage }
