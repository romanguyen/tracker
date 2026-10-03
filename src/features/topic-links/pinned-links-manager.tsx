import { useState } from "react"
import { PinIcon, PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ManageTopicLinksDialog } from "@/features/topic-links/manage-topic-links-dialog"
import { useTopicLinks } from "@/features/topic-links/use-topic-links"

export function PinnedLinksManager({
  topicId,
  topicTitle,
}: {
  topicId: string
  topicTitle: string
}) {
  const { links, error, refresh } = useTopicLinks(topicId)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {links.map((link) => (
        <Button key={link.id} asChild size="sm" variant="secondary">
          <a href={link.url} target="_blank" rel="noreferrer">
            <PinIcon aria-hidden="true" />
            {link.label}
          </a>
        </Button>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        aria-label="Manage pinned links"
        title="Pin your own links"
      >
        <PlusIcon aria-hidden="true" />
        {links.length > 0 ? (
          <Badge variant="secondary" className="ml-0.5">
            {links.length}
          </Badge>
        ) : (
          "Pin link"
        )}
      </Button>
      <ManageTopicLinksDialog
        topicId={topicId}
        topicTitle={topicTitle}
        links={links}
        loadError={error}
        refresh={refresh}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}
