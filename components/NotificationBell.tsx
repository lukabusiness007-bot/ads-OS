"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import type { AdminNotification } from "@/lib/types"

type NotifRow = {
  id: string
  product_id: string | null
  action: string
  read: boolean
  created_at: string
  product?: { id: string; name: string; status: string } | null
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotifRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const ref = React.useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  // Load initial notifications
  React.useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function load() {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*, product:product_id(id, name, status)")
        .order("created_at", { ascending: false })
        .limit(30)
      setNotifications((data as NotifRow[]) ?? [])
      setLoading(false)
    }

    load()

    // Realtime subscription to admin_notifications inserts
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as NotifRow, ...prev])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_notifications" },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === (payload.new as NotifRow).id ? (payload.new as NotifRow) : n))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Close on outside click
  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (!unreadIds.length) return

    const supabase = createBrowserSupabaseClient()
    await supabase.from("admin_notifications").update({ read: true }).in("id", unreadIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function actionLabel(action: string) {
    if (action === "awaiting_review") return "Needs review"
    if (action === "generation_failed") return "Generation failed"
    return action
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="button ghost sm"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        <Bell size={15} strokeWidth={2} aria-hidden />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "var(--danger)",
              color: "#fff",
              borderRadius: "50%",
              width: 14,
              height: 14,
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,.12)",
            zIndex: 200,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid var(--line)"
            }}
          >
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            {unread > 0 && (
              <button className="button ghost sm" type="button" onClick={markAllRead} style={{ fontSize: 11 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading && (
              <p className="muted" style={{ padding: "12px 14px", fontSize: 13 }}>
                Loading…
              </p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="muted" style={{ padding: "12px 14px", fontSize: 13 }}>
                No notifications yet
              </p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.product_id ? `/admin/review/${n.product_id}` : "/admin/review"}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--line)",
                  background: n.read ? "transparent" : "var(--surface-2)",
                  textDecoration: "none",
                  color: "var(--ink)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span
                    className={`badge ${n.action === "awaiting_review" ? "warning" : "danger"}`}
                    style={{ fontSize: 11 }}
                  >
                    {actionLabel(n.action)}
                  </span>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                {n.product && (
                  <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: n.read ? 400 : 600 }}>
                    {n.product.name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
