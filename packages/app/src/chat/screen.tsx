import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import { Option, Schema } from "effect"
import { Popover } from "@kobalte/core/popover"
import { Icon } from "@opencode/ui/icon"
import { Tooltip } from "@opencode/ui/tooltip"
import { MarkdownProvider } from "@opencode/session-ui/context/markdown"
import { useData, useServer } from "@/runtime/server/current"
import { useProviders } from "@/providers/catalog/providers"
import { ChatSidebar } from "./sidebar"
import { ChatTimeline } from "./timeline"
import { ChatComposer } from "./composer"
import type { ChatModel } from "./types"

const CHAT_MODEL_KEY = "opencode.chat.model"

const decodeChatModel = Schema.decodeUnknownOption(
  Schema.fromJsonString(
    Schema.Struct({
      providerID: Schema.String,
      providerName: Schema.String,
      modelID: Schema.String,
      modelName: Schema.String,
    }),
  ),
)

export function ChatScreen() {
  const params = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const data = useData()
  const server = useServer()
  const providers = useProviders(() => undefined)

  const [composerText, setComposerText] = createSignal("")
  const [modelPickerOpen, setModelPickerOpen] = createSignal(false)
  const [selectedModel, setSelectedModel] = createSignal<ChatModel | undefined>(undefined)
  const [mobileSidebarOpen, setMobileSidebarOpen] = createSignal(false)

  const activeId = () => params.id

  const chatSessions = createMemo(() =>
    data.session.list().filter((session) => session.agent === "chat" && !session.time?.archived),
  )

  const activeSession = createMemo(() => {
    const id = activeId()
    return id ? data.session.get(id) : undefined
  })

  const isRunning = createMemo(() => {
    const id = activeId()
    return id ? data.session.status(id) === "running" : false
  })

  const messages = createMemo(() => {
    const id = activeId()
    return id ? data.session.message.list(id) : []
  })

  const availableModels = createMemo<ChatModel[]>(() => {
    const list: ChatModel[] = []
    const connected = providers.connected()
    for (const provider of connected) {
      for (const [id, model] of Object.entries(provider.models)) {
        list.push({
          providerID: provider.id,
          providerName: provider.name,
          modelID: id,
          modelName: model.name || id,
        })
      }
    }
    if (list.length === 0) {
      for (const [, provider] of providers.all()) {
        for (const [id, model] of Object.entries(provider.models)) {
          list.push({
            providerID: provider.id,
            providerName: provider.name,
            modelID: id,
            modelName: model.name || id,
          })
        }
      }
    }
    return list
  })

  onMount(() => {
    const saved = localStorage.getItem(CHAT_MODEL_KEY)
    if (!saved) return
    const model = Option.getOrUndefined(decodeChatModel(saved))
    if (model) setSelectedModel(model)
  })

  createEffect(() => {
    if (!selectedModel()) {
      const models = availableModels()
      if (models.length > 0) {
        setSelectedModel(models[0])
      }
    }
  })

  const handleSelectModel = (model: ChatModel) => {
    setSelectedModel(model)
    localStorage.setItem(CHAT_MODEL_KEY, JSON.stringify(model))
    setModelPickerOpen(false)
  }

  createEffect(() => {
    const id = activeId()
    if (id) {
      void data.session.message.sync(id)
    }
  })

  const handleSend = () => {
    const text = composerText().trim()
    if (!text || isRunning()) return

    setComposerText("")
    const id = activeId()
    const model = selectedModel()
    const modelRef = model ? { providerID: model.providerID, id: model.modelID } : undefined

    if (!id) {
      const created = data.session.create({
        agent: "chat",
        model: modelRef,
        title: text.slice(0, 40),
      })
      void data.session.prompt({
        sessionID: created.id,
        text,
      })
      navigate(`/chat/${created.id}`)
      return
    }

    void data.session.prompt({
      sessionID: id,
      text,
    })
  }

  const handleStop = () => {
    const id = activeId()
    if (id) {
      void server.ctx.sdk.api.session.interrupt({ sessionID: id })
    }
  }

  const handleDelete = (id: string) => {
    void data.session.remove(id)
    if (activeId() === id) {
      navigate("/chat")
    }
  }

  const handleRename = (id: string, newTitle: string) => {
    void server.ctx.sdk.api.session.update({ sessionID: id, title: newTitle })
  }

  const handlePromptClick = (prompt: string) => {
    setComposerText(prompt)
    handleSend()
  }

  return (
    <MarkdownProvider>
      <div
        data-slot="chat-panel"
        class={`
          mx-[var(--shell-inline-inset,8px)] mb-[var(--shell-bottom-inset,8px)] mt-[var(--shell-top-inset,8px)] flex min-h-0 flex-1 flex-row self-stretch overflow-hidden rounded-[10px]
          bg-v2-background-bg-base shadow-[var(--v2-elevation-raised)]
        `}
      >
        <div class="hidden md:flex">
          <ChatSidebar
            activeId={activeId()}
            sessions={chatSessions()}
            onSelect={(id) => navigate(`/chat/${id}`)}
            onNewChat={() => navigate("/chat")}
            onDelete={handleDelete}
            onRename={handleRename}
            onNavigateHome={() => navigate("/")}
          />
        </div>

        <Show when={mobileSidebarOpen()}>
          <div class="fixed inset-0 z-50 flex bg-black/40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div class="h-full bg-v2-background-bg-layer-01" onClick={(e) => e.stopPropagation()}>
              <ChatSidebar
                activeId={activeId()}
                sessions={chatSessions()}
                onSelect={(id) => {
                  navigate(`/chat/${id}`)
                  setMobileSidebarOpen(false)
                }}
                onNewChat={() => {
                  navigate("/chat")
                  setMobileSidebarOpen(false)
                }}
                onDelete={handleDelete}
                onRename={handleRename}
                onNavigateHome={() => navigate("/")}
              />
            </div>
          </div>
        </Show>

        <div class="flex min-w-0 flex-1 flex-col overflow-hidden bg-v2-background-bg-base">
          <header class="flex h-12 shrink-0 items-center justify-between border-b border-v2-border-border-subtle px-4">
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                class="flex h-8 w-8 items-center justify-center rounded-lg text-v2-icon-icon-muted hover:bg-v2-background-bg-layer-02 md:hidden"
                aria-label="Toggle chat history"
              >
                <Icon name="speech-bubble" size="small" />
              </button>

              <Popover
                open={modelPickerOpen()}
                onOpenChange={setModelPickerOpen}
                placement="bottom-start"
                gutter={6}
              >
                <Popover.Trigger
                  class="flex items-center gap-1.5 rounded-lg border border-v2-border-border-subtle bg-v2-background-bg-base px-2.5 py-1 text-xs font-medium text-v2-text-text-base hover:bg-v2-background-bg-layer-02 transition-colors outline-none"
                >
                  <span>{selectedModel()?.modelName || "Select Model"}</span>
                  <Icon name="chevron-down" size="small" />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content class="z-50 max-h-[320px] min-w-[240px] overflow-y-auto rounded-xl border border-v2-border-border-subtle bg-v2-background-bg-base p-1.5 shadow-xl outline-none">
                    <div class="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-v2-text-text-muted">
                      Select Model
                    </div>
                    <Show
                      when={availableModels().length > 0}
                      fallback={
                        <div class="px-2 py-4 text-center text-xs text-v2-text-text-muted">
                          No models available
                        </div>
                      }
                    >
                      <For each={availableModels()}>
                        {(model) => {
                          const isSelected = () =>
                            selectedModel()?.modelID === model.modelID &&
                            selectedModel()?.providerID === model.providerID

                          return (
                            <button
                              type="button"
                              onClick={() => handleSelectModel(model)}
                              class={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-start transition-colors ${
                                isSelected()
                                  ? "bg-v2-background-bg-layer-02 font-medium text-v2-text-text-base"
                                  : "text-v2-text-text-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base"
                              }`}
                            >
                              <div class="flex flex-col">
                                <span class="font-medium text-v2-text-text-base">{model.modelName}</span>
                                <span class="text-[10px] text-v2-text-text-muted">{model.providerName}</span>
                              </div>
                              <Show when={isSelected()}>
                                <Icon name="check" size="small" />
                              </Show>
                            </button>
                          )
                        }}
                      </For>
                    </Show>
                  </Popover.Content>
                </Popover.Portal>
              </Popover>
            </div>

            <div class="flex items-center gap-2">
              <Show when={activeSession()?.title}>
                {(title) => (
                  <span class="hidden max-w-[300px] truncate text-xs font-medium text-v2-text-text-muted sm:inline-block">
                    {title()}
                  </span>
                )}
              </Show>

              <Tooltip value="New chat">
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-v2-icon-icon-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base transition-colors"
                  aria-label="New chat"
                >
                  <Icon name="plus" size="small" />
                </button>
              </Tooltip>
            </div>
          </header>

          <ChatTimeline
            messages={messages()}
            isRunning={isRunning()}
            onPromptClick={handlePromptClick}
          />

          <ChatComposer
            value={composerText()}
            onInput={setComposerText}
            onSend={handleSend}
            onStop={handleStop}
            isRunning={isRunning()}
            selectedModelName={selectedModel()?.modelName}
            onOpenModelPicker={() => setModelPickerOpen(true)}
          />
        </div>
      </div>
    </MarkdownProvider>
  )
}
