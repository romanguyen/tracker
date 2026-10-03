import { useState, type FormEvent } from "react"
import {
  ExternalLinkIcon,
  Loader2Icon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/features/auth/auth-context"
import {
  deleteTopicLink,
  insertTopicLink,
  normalizePinnedUrl,
  updateTopicLink,
  type TopicLinkRow,
} from "@/features/topic-links/topic-links-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseClient } from "@/lib/supabase"

type LinkDraft = {
  label: string
  url: string
}

function validateDraft(draft: LinkDraft): string | null {
  if (!draft.label.trim()) {
    return "Give the link a short name."
  }

  try {
    normalizePinnedUrl(draft.url)
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "That URL doesn't look valid."
  }

  return null
}

export function ManageTopicLinksDialog({
  topicId,
  topicTitle,
  links,
  loadError,
  refresh,
  open,
  onOpenChange,
}: {
  topicId: string
  topicTitle: string
  links: TopicLinkRow[]
  loadError: string | null
  refresh: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const supabase = getSupabaseClient()
  const { user } = useAuth()

  const [newLabel, setNewLabel] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newError, setNewError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [editTarget, setEditTarget] = useState<TopicLinkRow | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [busyLinkId, setBusyLinkId] = useState<string | null>(null)

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !user) {
      return
    }

    const draft = { label: newLabel, url: newUrl }
    const validation = validateDraft(draft)
    setNewError(validation)

    if (validation) {
      return
    }

    setIsAdding(true)

    try {
      await insertTopicLink(supabase, {
        userId: user.id,
        topicId,
        label: draft.label.trim(),
        url: normalizePinnedUrl(draft.url),
      })
      setNewLabel("")
      setNewUrl("")
      refresh()
    } catch (saveError) {
      setNewError(
        saveError instanceof Error
          ? saveError.message
          : "Could not pin the link.",
      )
    } finally {
      setIsAdding(false)
    }
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !editTarget) {
      return
    }

    const draft = { label: editLabel, url: editUrl }
    const validation = validateDraft(draft)
    setEditError(validation)

    if (validation) {
      return
    }

    setIsSavingEdit(true)

    try {
      await updateTopicLink(supabase, editTarget.id, {
        label: draft.label.trim(),
        url: normalizePinnedUrl(draft.url),
      })
      setEditTarget(null)
      refresh()
    } catch (saveError) {
      setEditError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the link.",
      )
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDelete(link: TopicLinkRow) {
    if (!supabase) {
      return
    }

    setBusyLinkId(link.id)

    try {
      await deleteTopicLink(supabase, link.id)
      toast.success(`Removed “${link.label}”`)
      refresh()
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not remove the link.",
      )
    } finally {
      setBusyLinkId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pinned links — {topicTitle}</DialogTitle>
          <DialogDescription>
            Your own study resources for this topic, kept across devices.
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {links.length > 0 ? (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {links.map((link) => (
              <li key={link.id}>
                {editTarget?.id === link.id ? (
                  <form
                    onSubmit={handleSaveEdit}
                    className="space-y-2 rounded-lg border border-border/70 p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-[1fr_1.6fr]">
                      <Input
                        value={editLabel}
                        onChange={(event) => setEditLabel(event.target.value)}
                        aria-label="Link name"
                        maxLength={120}
                      />
                      <Input
                        value={editUrl}
                        onChange={(event) => setEditUrl(event.target.value)}
                        aria-label="Link URL"
                        type="url"
                      />
                    </div>
                    {editError ? (
                      <Alert variant="destructive">
                        <AlertDescription>{editError}</AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditTarget(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={isSavingEdit}>
                        {isSavingEdit ? (
                          <Loader2Icon
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : null}
                        Save
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
                    <div className="min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 truncate text-sm font-medium hover:underline"
                      >
                        <PinIcon
                          className="size-3.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        {link.label}
                      </a>
                      <p className="truncate text-xs text-muted-foreground">
                        {link.url.replace(/^(?:https?|file):\/\//, "")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditTarget(link)
                          setEditLabel(link.label)
                          setEditUrl(link.url)
                          setEditError(null)
                        }}
                        aria-label={`Edit “${link.label}”`}
                      >
                        <PencilIcon aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={busyLinkId === link.id}
                        onClick={() => void handleDelete(link)}
                        aria-label={`Remove “${link.label}”`}
                      >
                        {busyLinkId === link.id ? (
                          <Loader2Icon
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <XIcon aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : loadError ? null : (
          <p className="text-sm text-muted-foreground">
            Nothing pinned yet — add your first study resource below.
          </p>
        )}

        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-lg border border-dashed border-border p-3"
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_1.6fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="pinned-label">Name</Label>
              <Input
                id="pinned-label"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                placeholder="Dijkstra visualized"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pinned-url">URL</Label>
              <Input
                id="pinned-url"
                value={newUrl}
                onChange={(event) => setNewUrl(event.target.value)}
                placeholder="https://… or file://…"
                type="url"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isAdding || !newLabel.trim() || !newUrl.trim()}
              >
                {isAdding ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : (
                  <PlusIcon aria-hidden="true" />
                )}
                Pin
              </Button>
            </div>
          </div>
          {newError ? (
            <Alert variant="destructive">
              <AlertDescription>{newError}</AlertDescription>
            </Alert>
          ) : null}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
            Links open in a new tab. file:// links need a browser that allows
            opening local files (e.g. a LocalLinks extension).
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
