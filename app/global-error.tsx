"use client";

import "./globals.css";
import { useEffect } from "react";
import { RuntimeDiagnosticsPopup } from "@/components/RuntimeDiagnosticsPopup";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="diagnosticsErrorPage">
          <section className="diagnosticsErrorCard">
            <p className="diagnosticsEyebrow">App error</p>
            <h1>The app shell failed to load.</h1>
            <p className="muted">
              The diagnostics popup shows the captured error and deployment configuration checks from Vercel.
            </p>
            <button className="button primary" type="button" onClick={reset}>
              Try again
            </button>
          </section>
          <RuntimeDiagnosticsPopup
            initialTitle="Global crash diagnostics"
            initialIssues={[
              {
                severity: "error",
                title: "Root app render failed",
                message: error.message || "Next.js reported a root render error.",
                fix: error.digest
                  ? `Next error digest: ${error.digest}`
                  : "Check the browser console and Vercel runtime logs."
              }
            ]}
          />
        </main>
      </body>
    </html>
  );
}
