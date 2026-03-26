import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  const accessToken = session?.accessToken;
  const siteId = session?.user?.siteId;

  if (!accessToken || !siteId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return new NextResponse("Missing path parameter", { status: 400 });
  }

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const upstream = `${env.API_URL}/${normalizedPath}`;

  const upstream_res = await fetch(upstream, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Frappe-Site": siteId,
    },
    cache: "no-store",
  });

  if (!upstream_res.ok) {
    return new NextResponse(null, { status: upstream_res.status });
  }

  const contentType = upstream_res.headers.get("content-type") ?? "application/octet-stream";
  const buffer = await upstream_res.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
