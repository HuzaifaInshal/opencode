import { createSignal, For, Show } from "solid-js"
import { Icon } from "@opencode/ui/icon"
import { IconButton } from "@opencode/ui/icon-button"
import { Tooltip } from "@opencode/ui/tooltip"
import type { SessionInfo } from "@opencode/client/promise"
import { groupSessionsByDate } from "./types"

export type ChatSidebarProps = {
  activeId: string | undefined
  sessions: readonly SessionInfo[]
  onSelect: (id: string) => void
  onNewChat: () => void
  onDelete: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onNavigateHome: () => void
}

export function ChatSidebar(props: ChatSidebarProps) {
  const [editingId, setEditingId] = createSignal<string | undefined>(undefined)
  const [editTitle, setEditTitle] = createSignal("")

  const groups = () => groupSessionsByDate(props.sessions)

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const handleSaveRename = (id: string) => {
    const trimmed = editTitle().trim()
    if (trimmed) {
      props.onRename(id, trimmed)
    }
    setEditingId(undefined)
  }

  return (
    <aside
      class="flex h-full w-[260px] shrink-0 flex-col border-r border-v2-border-border-subtle bg-v2-background-bg-layer-01 p-3"
      aria-label="Chat navigation"
    >
      <div class="mb-3 flex items-center rounded-lg bg-v2-background-bg-layer-02 p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={props.onNavigateHome}
          class="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 px-2 font-medium text-v2-text-text-muted hover:text-v2-text-text-base transition-colors"
        >
          <Icon name="code" size="small" />
          <span>Projects</span>
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-v2-background-bg-base py-1 px-2 font-medium text-v2-text-text-base shadow-sm transition-colors"
        >
          <Icon name="speech-bubble" size="small" />
          <span>Chats</span>
        </button>
      </div>

      <button
        type="button"
        onClick={props.onNewChat}
        class="mb-3 flex h-9 w-full items-center justify-between rounded-lg border border-v2-border-border-subtle bg-v2-background-bg-base px-3 text-sm font-medium text-v2-text-text-base shadow-xs hover:bg-v2-background-bg-layer-02 transition-colors"
      >
        <span class="flex items-center gap-2">
          <Icon name="plus" size="small" />
          <span>New chat</span>
        </span>
      </button>

      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <Show
          when={props.sessions.length > 0}
          fallback={
            <div class="px-2 py-8 text-center text-xs text-v2-text-text-muted">
              No previous chats yet
            </div>
          }
        >
          <For each={groups()}>
            {(group) => (
              <div class="mb-3">
                <div class="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-v2-text-text-muted">
                  {group.title}
                </div>
                <div class="flex flex-col gap-0.5">
                  <For each={group.sessions}>
                    {(item) => {
                      const isActive = () => item.id === props.activeId
                      const isEditing = () => editingId() === item.id

                      return (
                        <div
                          class={`group relative flex h-8 items-center rounded-md px-2 text-xs transition-colors ${
                            isActive()
                              ? "bg-v2-background-bg-layer-02 font-medium text-v2-text-text-base"
                              : "text-v2-text-text-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base"
                          }`}
                        >
                          <Show
                            when={!isEditing()}
                            fallback={
                              <div class="flex flex-1 items-center gap-1">
                                <input
                                  type="text"
                                  value={editTitle()}
                                  onInput={(e) => setEditTitle(e.currentTarget.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveRename(item.id)
                                    if (e.key === "Escape") setEditingId(undefined)
                                  }}
                                  class="min-w-0 flex-1 rounded border border-v2-border-border-base bg-v2-background-bg-base px-1.5 py-0.5 text-xs text-v2-text-text-base outline-none"
                                  autofocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRename(item.id)}
                                  class="text-v2-text-text-base hover:text-v2-text-text-highlight"
                                >
                                  <Icon name="check" size="small" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(undefined)}
                                  class="text-v2-text-text-muted hover:text-v2-text-text-base"
                                >
                                  <Icon name="close" size="small" />
                                </button>
                              </div>
                            }
                          >
                            <button
                              type="button"
                              onClick={() => props.onSelect(item.id)}
                              class="flex min-w-0 flex-1 items-center gap-2 text-start"
                            >
                              <Icon name="speech-bubble" size="small" class="shrink-0 text-v2-icon-icon-muted" />
                              <span class="truncate">{item.title}</span>
                            </button>

                            <div class="hidden items-center gap-0.5 pl-1 group-hover:flex">
                              <Tooltip value="Rename">
                                <IconButton
                                  icon={<Icon name="edit" size="small" />}
                                  size="small"
                                  variant="ghost-muted"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartRename(item.id, item.title)
                                  }}
                                  aria-label="Rename chat"
                                />
                              </Tooltip>
                              <Tooltip value="Delete">
                                <IconButton
                                  icon={<Icon name="outline-trash" size="small" />}
                                  size="small"
                                  variant="ghost-muted"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    props.onDelete(item.id)
                                  }}
                                  aria-label="Delete chat"
                                />
                              </Tooltip>
                            </div>
                          </Show>
                        </div>
                      )
                    }}
                  </For>
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>
    </aside>
  )
}
