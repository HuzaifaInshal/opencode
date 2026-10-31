export type ChatModel = {
  providerID: string
  providerName: string
  modelID: string
  modelName: string
}

export type ChatSessionItem = {
  id: string
  title: string
  updated: number
}

export type ChatGroup = {
  title: string
  sessions: ChatSessionItem[]
}

export function groupSessionsByDate(
  sessions: readonly { id: string; title?: string; time: { updated: number } }[],
): ChatGroup[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
  const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000

  const today: ChatSessionItem[] = []
  const yesterday: ChatSessionItem[] = []
  const previous7Days: ChatSessionItem[] = []
  const older: ChatSessionItem[] = []

  for (const session of sessions) {
    const item: ChatSessionItem = {
      id: session.id,
      title: session.title || "New chat",
      updated: session.time.updated,
    }
    if (session.time.updated >= todayStart) {
      today.push(item)
      continue
    }
    if (session.time.updated >= yesterdayStart) {
      yesterday.push(item)
      continue
    }
    if (session.time.updated >= sevenDaysAgoStart) {
      previous7Days.push(item)
      continue
    }
    older.push(item)
  }

  const groups: ChatGroup[] = []
  if (today.length > 0) groups.push({ title: "Today", sessions: today })
  if (yesterday.length > 0) groups.push({ title: "Yesterday", sessions: yesterday })
  if (previous7Days.length > 0) groups.push({ title: "Previous 7 Days", sessions: previous7Days })
  if (older.length > 0) groups.push({ title: "Older", sessions: older })
  return groups
}
