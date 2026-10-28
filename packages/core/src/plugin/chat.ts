export * as ChatPlugin from "./chat.js"

import { define } from "@opencode/plugin/effect/plugin"
import { Agent } from "@opencode/schema/agent"
import { Effect } from "effect"

const chat = Agent.ID.make("chat")

export const Plugin = define({
  id: "opencode.chat",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.agent.transform((editor) => {
      editor.update(chat, (item) => {
        item.name = Agent.Name.make("Chat")
        item.description = "Conversational assistant for plain chat without workspace or tool access."
        item.mode = "primary"
        item.system =
          "You are a helpful, versatile AI assistant. Answer user queries clearly and concisely using standard markdown."
        item.permissions = [{ action: "*", resource: "*", effect: "deny" }]
      })
    })
  }),
})
