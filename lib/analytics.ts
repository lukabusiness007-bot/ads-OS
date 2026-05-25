import type { HostedPageAnalyticsEvent } from "./types";

type TrackHostedPageEventInput = {
  event: HostedPageAnalyticsEvent;
  productId: string;
  merchantSlug: string;
  productSlug: string;
};

export function trackHostedPageEvent(input: TrackHostedPageEventInput) {
  const payload = {
    ...input,
    browser: getBrowserName(),
    deviceType: getDeviceType(),
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  window.localStorage.setItem("lastHostedPageAnalyticsEvent", JSON.stringify(payload));
  console.info("hosted-page-analytics", payload);
}

function getDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet/.test(userAgent)) {
    return "tablet";
  }

  if (/android|iphone|ipod|mobile/.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}

function getBrowserName() {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Edg/")) {
    return "Edge";
  }

  if (userAgent.includes("Chrome/")) {
    return "Chrome";
  }

  if (userAgent.includes("Safari/")) {
    return "Safari";
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }

  return "Unknown";
}
