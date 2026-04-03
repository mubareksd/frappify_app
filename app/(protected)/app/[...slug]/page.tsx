import { RoutePlaceholder } from "@/components/frappe/route-placeholder";
import { env } from "@/lib/env";
import { resolveFrappeRouteWithApi } from "@/lib/frappe-route";
import { getCurrentSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug: slugParam } = await params;
  const resolvedSearchParams = await searchParams;
  const slug = slugParam || [];

  const pageParam = resolvedSearchParams.page;
  const pageValue = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const parsedPage = Number(pageValue);
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const pageSizeParam = resolvedSearchParams.page_size;
  const pageSizeValue = Array.isArray(pageSizeParam)
    ? pageSizeParam[0]
    : pageSizeParam;
  const parsedPageSize = Number(pageSizeValue);
  const allowedPageSizes = new Set([10, 20, 50, 100]);
  const pageSize =
    Number.isFinite(parsedPageSize) && allowedPageSizes.has(parsedPageSize)
      ? parsedPageSize
      : 20;

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
    siteId,
  );

  if (resolvedRoute.type === "unknown") {
    notFound();
  }

  return (
    <RoutePlaceholder
      route={resolvedRoute}
      currentPage={currentPage}
      pageSize={pageSize}
    />
  );
}
