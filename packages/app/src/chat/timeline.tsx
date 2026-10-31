import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { Icon } from "@opencode/ui/icon"
import { Markdown } from "@opencode/session-ui/markdown"
import { usePlatform } from "@/runtime/platform/platform"
import type { SessionMessageInfo, SessionMessageAssistant, SessionMessageUser } from "@opencode/client/promise"

export type ChatTimelineProps = {
  messages: readonly SessionMessageInfo[]
  isRunning: boolean
  onPromptClick?: (prompt: string) => void
}

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Draft a polite email declining an invitation",
  "Help me outline a blog post about artificial intelligence",
  "Write a Python script to sort a list of dictionaries",
]

export function ChatTimeline(props: ChatTimelineProps) {
  let scrollContainer: HTMLDivElement | undefined

  const visibleMessages = createMemo(() =>
    props.messages.filter((msg) => msg.type === "user" || msg.type === "assistant"),
  )

  createEffect(() => {
    // Track message updates and scroll to bottom
    const count = visibleMessages().length
    const running = props.isRunning
    if (count || running) {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })
    }
  })

  return (
    <div
      ref={scrollContainer}
      class="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      data-slot="chat-timeline"
    >
      <div class="mx-auto flex max-w-3xl flex-col gap-6">
        <Show
          when={visibleMessages().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-v2-background-bg-layer-02 text-v2-icon-icon-base shadow-xs">
                <Icon name="speech-bubble" size="large" />
              </div>
              <h2 class="mb-2 text-xl font-semibold text-v2-text-text-base">
                How can I help you today?
              </h2>
              <p class="mb-8 max-w-md text-sm text-v2-text-text-muted">
                Simple, distraction-free conversational AI. Ask questions, brainstorm ideas, draft content, or learn something new.
              </p>

              <div class="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                <For each={SUGGESTIONS}>
                  {(prompt) => (
                    <button
                      type="button"
                      onClick={() => props.onPromptClick?.(prompt)}
                      class="flex flex-col items-start rounded-xl border border-v2-border-border-subtle bg-v2-background-bg-base p-3 text-start text-xs font-normal text-v2-text-text-base shadow-2xs hover:bg-v2-background-bg-layer-02 hover:border-v2-border-border-base transition-colors"
                    >
                      <span class="line-clamp-2">{prompt}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          }
        >
          <For each={visibleMessages()}>
            {(msg, index) => {
              const isLast = () => index() === visibleMessages().length - 1
              if (msg.type === "user") {
                return <UserMessageItem message={msg as SessionMessageUser} />
              }
              if (msg.type === "assistant") {
                return (
                  <AssistantMessageItem
                    message={msg as SessionMessageAssistant}
                    isStreaming={props.isRunning && isLast()}
                  />
                )
              }
              return null
            }}
          </For>
        </Show>
      </div>
    </div>
  )
}

function UserMessageItem(props: { message: SessionMessageUser }) {
  return (
    <div class="flex justify-end">
      <div class="max-w-[80%] rounded-2xl bg-v2-background-bg-layer-02 px-4 py-3 text-sm text-v2-text-text-base whitespace-pre-wrap leading-relaxed shadow-xs">
        {props.message.text}
      </div>
    </div>
  )
}

function AssistantMessageItem(props: {
  message: SessionMessageAssistant
  isStreaming: boolean
}) {
  const platform = usePlatform()
  const [copied, setCopied] = createSignal(false)

  const reasoning = createMemo(() => {
    const part = props.message.content?.find((c) => c.type === "reasoning")
    return part && "text" in part ? (part.text as string) : undefined
  })

  const text = createMemo(() => {
    const parts = props.message.content?.filter((c) => c.type === "text") ?? []
    return parts.map((p) => ("text" in p ? (p.text as string) : "")).join("")
  })

  const handleCopy = () => {
    const content = text()
    if (!content) return
    const write = platform.writeClipboardText?.(content) ?? navigator.clipboard.writeText(content)
    void Promise.resolve(write).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div class="flex items-start gap-3">
      <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-v2-background-bg-layer-02 text-v2-text-text-base shadow-2xs">
        <Icon name="brain" size="small" />
      </div>

      <div class="min-w-0 flex-1">
        <Show when={reasoning()}>
          {(reasoningText) => (
            <details class="mb-3 rounded-lg border border-v2-border-border-subtle bg-v2-background-bg-layer-01 p-2 text-xs text-v2-text-text-muted">
              <summary class="cursor-pointer font-medium select-none hover:text-v2-text-text-base">
                Thought process
              </summary>
              <div class="mt-2 whitespace-pre-wrap pl-2 border-l-2 border-v2-border-border-subtle text-v2-text-text-muted font-mono text-[11px] leading-relaxed">
                {reasoningText()}
              </div>
            </details>
          )}
        </Show>

        <Show
          when={text()}
          fallback={
            <Show when={props.isStreaming && !reasoning()}>
              <div class="flex items-center gap-1.5 py-2 text-xs text-v2-text-text-muted">
                <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-v2-text-text-muted" />
                <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-v2-text-text-muted [animation-delay:200ms]" />
                <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-v2-text-text-muted [animation-delay:400ms]" />
                <span class="ml-1 text-xs">AI is thinking...</span>
              </div>
            </Show>
          }
        >
          {(textContent) => (
            <div>
              <div class="text-sm leading-relaxed text-v2-text-text-base">
                <Markdown text={textContent()} streaming={props.isStreaming} />
              </div>

              <div class="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-v2-text-text-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base transition-colors"
                >
                  <Icon name={copied() ? "check" : "outline-copy"} size="small" />
                  <span>{copied() ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          )}
        </Show>
      </div>
    </div>
  )
}
