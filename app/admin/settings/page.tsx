import { requirePlatformAdmin } from "@/lib/supabase/auth-guard"
import { getAdminConfig } from "@/lib/admin/data"
import { PageHeader } from "@/components/admin/PageHeader"
import { AutoReviewToggle } from "./AutoReviewToggle"

export default async function AdminSettingsPage() {
  const admin = await requirePlatformAdmin("/admin/settings")
  const config = await getAdminConfig(admin)

  return (
    <div className="stack">
      <PageHeader eyebrow="Admin" title="Settings" subtitle="Platform-wide configuration for the review pipeline." />

      <div className="panel stack" style={{ gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Review pipeline</h2>
          <p className="muted" style={{ margin: 0 }}>Controls how generated products move through moderation.</p>
        </div>
        <AutoReviewToggle enabled={config.auto_review_enabled} />
      </div>

      <div className="panel stack" style={{ gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Notifications</h2>
          <p className="muted" style={{ margin: 0 }}>Admin alerts (new submissions, flagged content, etc.) are sent here.</p>
        </div>
        <div className="toggleField">
          <div>
            <label>Notification email</label>
            <p className="muted" style={{ margin: 0 }}>Set via the ADMIN_NOTIFICATION_EMAIL environment variable.</p>
          </div>
          <span className="badge neutral">{process.env.ADMIN_NOTIFICATION_EMAIL ?? "Not configured"}</span>
        </div>
      </div>
    </div>
  )
}
