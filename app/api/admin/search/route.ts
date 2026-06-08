import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { listOrganizations, listUsers, searchProducts } from "@/lib/admin/data";

const RESULTS_PER_GROUP = 5;

export async function GET(request: Request) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ products: [], users: [], orgs: [] });
  }

  const [products, { rows: users }, { rows: orgs }] = await Promise.all([
    searchProducts(verify.user, q, RESULTS_PER_GROUP),
    listUsers(verify.user, { search: q, pageSize: RESULTS_PER_GROUP }),
    listOrganizations(verify.user, { search: q, pageSize: RESULTS_PER_GROUP })
  ]);

  return NextResponse.json({
    products: products.map((p) => ({ id: p.id, name: p.name, status: p.status, orgName: p.org_name })),
    users: users.map((u) => ({ id: u.id, name: u.full_name ?? u.email ?? "Unnamed user", email: u.email })),
    orgs: orgs.map((o) => ({ id: o.id, name: o.name }))
  });
}
