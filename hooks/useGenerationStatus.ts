"use client"

import { useEffect, useState } from "react"
import type { GenerationStatusResponse } from "@/lib/types"

export function useGenerationStatus(productId: string, taskId: string) {
  const [statusPayload, setStatusPayload] = useState<GenerationStatusResponse | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollError, setPollError] = useState("")

  useEffect(() => {
    if (!productId || !taskId) return

    let timeoutId: number | undefined
    let isCancelled = false

    async function poll() {
      setIsPolling(true)
      setPollError("")

      try {
        const res = await fetch(
          `/api/generation/status?productId=${encodeURIComponent(productId)}&taskId=${encodeURIComponent(taskId)}`,
          { cache: "no-store" }
        )
        const payload = (await res.json()) as GenerationStatusResponse

        if (isCancelled) return

        if (!res.ok) {
          throw new Error(payload.errorMessage ?? payload.message)
        }

        setStatusPayload(payload)

        if (payload.status !== "succeeded" && payload.status !== "failed") {
          timeoutId = window.setTimeout(poll, 5000)
        }
      } catch (err) {
        if (!isCancelled) {
          setPollError(err instanceof Error ? err.message : "Status check failed.")
        }
      } finally {
        if (!isCancelled) {
          setIsPolling(false)
        }
      }
    }

    void poll()

    return () => {
      isCancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [productId, taskId])

  return { statusPayload, isPolling, pollError }
}
