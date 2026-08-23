import { useEffect } from 'react'

/** Per-route document title — helps orient users with multiple tabs open, and gives shared links a real title. */
export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${pageTitle} · The Judgment Ledger`
    return () => {
      document.title = previous
    }
  }, [pageTitle])
}
