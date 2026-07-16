import { useEffect } from "react"

const SITE_NAME = "NexPath Admin"

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  }, [title])
}
