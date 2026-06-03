"use client";

import { useEffect } from "react";
import { RuntimeDiagnosticsPopup } from "@/components/RuntimeDiagnosticsPopup";

export default function Error({
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
    <main className="diagnosticsErrorPage">
      <section className="diagnosticsErrorCard">
        <p className="diagnosticsEyebrow">App error</p>
        <h1>Something failed while loading this page.</h1>
        <p className="muted">
          The diagnostics popup has the exact error message and deployment checks. Use the retry button after fixing the
          reported issue.
        </p>
        <button className="button primary" type="button" onClick={reset}>
          Try again
        </button>
      </section>
      <RuntimeDiagnosticsPopup
        initialTitle="Page crash diagnostics"
        initialIssues={[
          {
            severity: "error",
            title: "Page render failed",
            message: error.message || "Next.js reported a page render error.",
            fix: error.digest ? `Next error digest: ${error.digest}` : "Check the browser console and Vercel runtime logs."
          }
        ]}
      />
    </main>
  );
}
