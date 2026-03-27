import { RoutePlaceholder } from "@/components/frappe/route-placeholder";
import { env } from "@/lib/env";
import { resolveFrappeRouteWithApi } from "@/lib/frappe-route";
import { getCurrentSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug: slugParam } = await params;
  const slug = slugParam || [];

  const session = await getCurrentSession();
  const user = session?.user;
  const accessToken = session?.accessToken;
  const siteId = session?.user.siteId;

  if (
    !user ||
    !accessToken ||
    !siteId ||
    session.error === "AccessTokenExpired"
  ) {
    redirect(`${env.PUBLIC_APP_URL}/login`);
  }

  const resolvedRoute = await resolveFrappeRouteWithApi(
    slug,
    accessToken,
    siteId
  );

  if (resolvedRoute.type === "unknown") {
    notFound();
  }

  return <RoutePlaceholder route={resolvedRoute} />;
}