"use client";

import { useEffect, useMemo, useState } from "react";

type DiagnosticSeverity = "error" | "warning" | "info";

type DiagnosticIssue = {
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  fix?: string;
};

type DiagnosticsResponse = {
  ok: boolean;
  environment: string;
  deployment: string;
  checkedAt: string;
  issues: DiagnosticIssue[];
};

type RuntimeDiagnosticsPopupProps = {
  initialIssues?: DiagnosticIssue[];
  initialTitle?: string;
};

const debugQueryParam = "debug";
const debugStorageKey = "veridian-debug-popup";

export function RuntimeDiagnosticsPopup({
  initialIssues = [],
  initialTitle = "App diagnostics"
}: RuntimeDiagnosticsPopupProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [runtimeIssues, setRuntimeIssues] = useState<DiagnosticIssue[]>(initialIssues);
  const [isOpen, setIsOpen] = useState(initialIssues.length > 0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const debugEnabled = params.has(debugQueryParam) || window.localStorage.getItem(debugStorageKey) === "1";

    if (params.has(debugQueryParam)) {
      window.localStorage.setItem(debugStorageKey, "1");
    }

    let isMounted = true;

    async function loadDiagnostics() {
      try {
        const response = await fetch("/api/diagnostics", {
          cache: "no-store",
          headers: { Accept: "application/json" }
        });
        const payload = (await response.json()) as DiagnosticsResponse;

        if (!isMounted) {
          return;
        }

        setDiagnostics(payload);

        if ((debugEnabled || payload.issues.some((issue) => issue.severity === "error")) && payload.issues.length > 0) {
          setIsOpen(true);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRuntimeIssues((current) => [
          ...current,
          {
            severity: "error",
            title: "Diagnostics API failed",
            message: getErrorMessage(error),
            fix: "Check the Vercel function logs for /api/diagnostics and confirm the deployment finished successfully."
          }
        ]);
        setIsOpen(true);
      }
    }

    function handleWindowError(event: ErrorEvent) {
      setRuntimeIssues((current) => [
        ...current,
        {
          severity: "error",
          title: "Browser runtime error",
          message: event.message || getErrorMessage(event.error),
          fix: `${event.filename || "Unknown file"}${event.lineno ? `:${event.lineno}` : ""}`
        }
      ]);
      setIsOpen(true);
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      setRuntimeIssues((current) => [
        ...current,
        {
          severity: "error",
          title: "Unhandled async error",
          message: getErrorMessage(event.reason),
          fix: "Open the browser console for the stack trace, then check the related API response in the Network tab."
        }
      ]);
      setIsOpen(true);
    }

    loadDiagnostics();
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      isMounted = false;
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const issues = useMemo(() => {
    const combined = [...runtimeIssues, ...(diagnostics?.issues ?? [])];
    const seen = new Set<string>();

    return combined.filter((issue) => {
      const key = `${issue.severity}:${issue.title}:${issue.message}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [diagnostics, runtimeIssues]);

  const hasError = issues.some((issue) => issue.severity === "error");
  const shouldShowButton = issues.length > 0 || diagnostics;

  if (isDismissed && !shouldShowButton) {
    return null;
  }

  return (
    <>
      {shouldShowButton ? (
        <button
          className={`diagnosticsButton ${hasError ? "diagnosticsButtonError" : ""}`}
          type="button"
          onClick={() => {
            setIsDismissed(false);
            setIsOpen(true);
          }}
          aria-label="Open app diagnostics"
          title="Open app diagnostics"
        >
          !
        </button>
      ) : null}

      {isOpen && !isDismissed ? (
        <div className="diagnosticsOverlay" role="dialog" aria-modal="true" aria-labelledby="diagnostics-title">
          <div className="diagnosticsPanel">
            <div className="diagnosticsHeader">
              <div>
                <p className="diagnosticsEyebrow">Vercel check</p>
                <h2 id="diagnostics-title">{initialTitle}</h2>
              </div>
              <button
                className="diagnosticsClose"
                type="button"
                onClick={() => {
                  setIsDismissed(true);
                  setIsOpen(false);
                }}
                aria-label="Close diagnostics"
              >
                x
              </button>
            </div>

            {diagnostics ? (
              <div className="diagnosticsMeta">
                <span>{diagnostics.deployment}</span>
                <span>{diagnostics.environment}</span>
                <span>{new Date(diagnostics.checkedAt).toLocaleString()}</span>
              </div>
            ) : null}

            {issues.length > 0 ? (
              <div className="diagnosticsIssues">
                {issues.map((issue, index) => (
                  <article className="diagnosticsIssue" data-severity={issue.severity} key={`${issue.title}-${index}`}>
                    <strong>{issue.title}</strong>
                    <p>{issue.message}</p>
                    {issue.fix ? <small>{issue.fix}</small> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="diagnosticsOk">No deployment configuration problems were detected.</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
