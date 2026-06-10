import { headers } from "next/headers";
import { ModelViewer } from "@/components/ModelViewer";
import { noIndexMetadata } from "@/lib/seo";
import { verifyArPreviewToken } from "@/lib/ar-preview-token";
import { viewerAssetFromModelAssetRow } from "@/lib/model-asset-urls";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import type { AdminModelAsset } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = noIndexMetadata;

function MessageCard({ title, message }: { title: string; message: string }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif", background: "#f4f5f3" }}>
      <div style={{ maxWidth: 460, background: "#fff", border: "1px solid #e7e9e6", borderRadius: 14, padding: 32, textAlign: "center" }}>
        <p style={{ color: "#0f7a52", fontWeight: 800, fontSize: 20, margin: "0 0 12px" }}>Augmenta</p>
        <h1 style={{ fontSize: 20, margin: "0 0 10px", color: "#1a1a1a" }}>{title}</h1>
        <p style={{ color: "#555", lineHeight: "22px", margin: 0 }}>{message}</p>
      </div>
    </main>
  );
}

export default async function ArPreviewPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const ip = clientIpFromHeaders(await headers());
  const { allowed } = await checkRateLimit(`ar-preview-page:${ip}`, 60, 60);
  if (!allowed) {
    return <MessageCard title="Too many requests" message="Please wait a moment and try again." />;
  }

  const productId = verifyArPreviewToken(token);
  if (!productId) {
    return (
      <MessageCard
        title="Preview link expired"
        message="This AR preview link is invalid or has expired. Ask the merchant or admin to generate a new QR code."
      />
    );
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return <MessageCard title="Model not available" message="This 3D model isn't available right now." />;
  }

  const admin = createServiceRoleSupabaseClient();

  const [{ data: product }, { data: asset }] = await Promise.all([
    admin.from("products").select("id, name").eq("id", productId).maybeSingle(),
    admin
      .from("model_assets")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (!product || !asset) {
    return <MessageCard title="Model not available" message="This product's 3D model isn't available right now." />;
  }

  const productName = (product as { name: string }).name;
  const viewerAsset = viewerAssetFromModelAssetRow(asset as AdminModelAsset);

  return (
    <main className="publicPage">
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 16 }}>
        <div className="panel stack">
          <h1 style={{ margin: 0 }}>{productName}</h1>
          <ModelViewer asset={viewerAsset} alt={`${productName} 3D model`} />
          {!viewerAsset.usdzUrl && (
            <p className="muted" style={{ fontSize: 13 }}>
              AR on iPhone/iPad (Quick Look) isn’t available for this model yet — Android AR (Scene Viewer) still works.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
