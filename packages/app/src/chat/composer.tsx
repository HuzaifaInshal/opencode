import { createEffect, Show } from "solid-js"
import { Icon } from "@opencode/ui/icon"
import { Tooltip } from "@opencode/ui/tooltip"

export type ChatComposerProps = {
  value: string
  onInput: (val: string) => void
  onSend: () => void
  onStop: () => void
  isRunning: boolean
  selectedModelName?: string
  onOpenModelPicker?: () => void
}

export function ChatComposer(props: ChatComposerProps) {
  let textareaRef: HTMLTextAreaElement | undefined

  const adjustHeight = () => {
    if (!textareaRef) return
    textareaRef.style.height = "auto"
    textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`
  }

  createEffect(() => {
    // Whenever value changes, adjust height
    props.value
    adjustHeight()
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (props.isRunning) return
      if (props.value.trim()) {
        props.onSend()
      }
    }
  }

  return (
    <div class="mx-auto w-full max-w-3xl px-4 pb-4" data-slot="chat-composer">
      <div class="flex flex-col rounded-2xl border border-v2-border-border-subtle bg-v2-background-bg-base p-2 shadow-xs focus-within:border-v2-border-border-base transition-colors">
        <textarea
          ref={textareaRef}
          value={props.value}
          onInput={(e) => {
            props.onInput(e.currentTarget.value)
            adjustHeight()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message AI..."
          rows={1}
          class="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-2 text-sm text-v2-text-text-base placeholder:text-v2-text-text-muted outline-none"
        />

        <div class="flex items-center justify-between pt-1">
          <Show when={props.selectedModelName}>
            <button
              type="button"
              onClick={props.onOpenModelPicker}
              class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-v2-text-text-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base transition-colors"
            >
              <span>{props.selectedModelName}</span>
              <Icon name="chevron-down" size="small" />
            </button>
          </Show>

          <div class="ml-auto flex items-center gap-1">
            <Show
              when={!props.isRunning}
              fallback={
                <Tooltip value="Stop generation">
                  <button
                    type="button"
                    onClick={props.onStop}
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-v2-background-bg-layer-02 text-v2-text-text-base hover:bg-v2-background-bg-layer-03 transition-colors"
                    aria-label="Stop generation"
                  >
                    <div class="h-3 w-3 rounded-xs bg-current" />
                  </button>
                </Tooltip>
              }
            >
              <Tooltip value="Send message">
                <button
                  type="button"
                  onClick={props.onSend}
                  disabled={!props.value.trim()}
                  class={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    props.value.trim()
                      ? "bg-v2-text-text-base text-v2-background-bg-base hover:opacity-90"
                      : "bg-v2-background-bg-layer-02 text-v2-text-text-muted opacity-40 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  <Icon name="arrow-up" size="small" />
                </button>
              </Tooltip>
            </Show>
          </div>
        </div>
      </div>

      <div class="mt-2 text-center text-[11px] text-v2-text-text-muted">
        AI can make mistakes. Consider checking important information.
      </div>
    </div>
  )
}
