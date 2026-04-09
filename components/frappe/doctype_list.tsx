// --- Server Component Wrapper ---

import React from "react";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";

type UserRow = Record<string, unknown>;

type DoctypeField = {
  fieldname: string;
  label: string;
};

type MetaField = {
  fieldname?: string;
  label?: string;
  in_list_view?: number | string;
};

type DoctypeMeta = {
  name?: string;
  fields?: MetaField[];
};

type DoctypeListProps = {
  title: string;
  value: string;
  currentPage: number;
  pageSize: number;
  listPath: string;
};

function randomText(length: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";

  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars[index];
  }

  return result;
}

export default async function DoctypeList({
  title,
  value,
  currentPage,
  pageSize,
  listPath,
}: DoctypeListProps) {
  const pageLength = pageSize;
  const start = (currentPage - 1) * pageLength;

  // Get session and check authentication
  const session = await getCurrentSession();
  const user = session?.user;
  const accessToken = session?.accessToken;
  const siteId = session?.user?.siteId;
  if (
    !user ||
    !accessToken ||
    !siteId ||
    session.error === "AccessTokenExpired"
  ) {
    redirect(`${env.PUBLIC_APP_URL}/login`);
  }

  // --- Fetch doctype metadata ---
  let meta: DoctypeMeta | null = null;

  let doctypeFields: DoctypeField[] = [];
  let doctypeName = value;

  try {
    const metaRes = await fetch(
      `${env.API_URL}/method/frappe.desk.form.load.getdoctype?doctype=${encodeURIComponent(
        value.split("-").reverse().join(" "),
      )}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Frappe-Site": siteId,
          "Accept-Encoding": "identity",
        },
      },
    );
    const metaJson = await metaRes.json();
    meta = metaJson.docs?.[0] || null;
    doctypeName = meta?.name || value;

    // Dynamically get listview fields from API (add_fields in listview_settings)
    if (doctypeName === "User") {
      // Fetch listview settings for User doctype
      const listviewRes = await fetch(
        `${env.API_URL}/method/frappe.desk.reportview.get_list_settings?doctype=${doctypeName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Frappe-Site": siteId,
            "Accept-Encoding": "identity",
          },
        },
      );
      const listviewJson = await listviewRes.json();
      const addFields: string[] = listviewJson.message?.add_fields || ["name"];
      // Always include name
      const uniqueFields = Array.from(new Set(["name", ...addFields]));
      // Map to label using meta.fields
      const metaFields = meta?.fields || [];
      doctypeFields = uniqueFields.map((fieldname) => {
        if (fieldname === "name") return { fieldname: "name", label: "ID" };
        const metaField = metaFields.find(
          (f: MetaField) => f.fieldname === fieldname,
        );
        return {
          fieldname,
          label:
            metaField?.label ||
            fieldname
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
        };
      });
    } else {
      doctypeFields = (meta?.fields || [])
        .filter(
          (f: MetaField) =>
            Number(f.in_list_view) === 1 && Boolean(f.fieldname),
        )
        .map((f: MetaField) => ({
          fieldname: f.fieldname as string,
          label:
            f.label ||
            (f.fieldname as string)
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
        }));
    }
  } catch {
    return <div className="text-red-500">Failed to load metadata.</div>;
  }

  if (!meta) return <div>No metadata found.</div>;

  // --- Fetch list data ---
  let userRows: UserRow[] = [];
  let totalCount = 0;

  try {
    // For User doctype, use dynamic fields from listview settings
    let fields;
    if (doctypeName === "User") {
      fields = doctypeFields.map(
        (f: { fieldname: string }) => `\`tabUser\`.\`${f.fieldname}\``,
      );
    } else {
      fields = doctypeFields.map(
        (f: { fieldname: string }) =>
          `\`tab${doctypeName}\`.\`${f.fieldname}\``,
      );
    }
    const listRes = await fetch(
      `${env.API_URL}/method/frappe.desk.reportview.get?doctype=${doctypeName}` +
        `&fields=${encodeURIComponent(JSON.stringify(fields))}` +
        `&filters=${encodeURIComponent(JSON.stringify([]))}` +
        `&order_by=${encodeURIComponent(`\`tab${doctypeName}\`.\`modified\` desc`)}` +
        `&start=${start}&page_length=${pageLength}&view=List&group_by=&with_comment_count=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Frappe-Site": siteId,
          "Accept-Encoding": "identity",
        },
      },
    );
    const listJson = await listRes.json();
    const keys: string[] = listJson.message?.keys || [];
    const values: unknown[][] = listJson.message?.values || [];
    userRows = values.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {};
      keys.forEach((k: string, i: number) => {
        obj[k] = row[i];
      });
      return obj as UserRow;
    });

    try {
      const countRes = await fetch(
        `${env.API_URL}/method/frappe.desk.reportview.get_count?doctype=${encodeURIComponent(doctypeName)}&filters=${encodeURIComponent(JSON.stringify([]))}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Frappe-Site": siteId,
            "Accept-Encoding": "identity",
          },
        },
      );

      if (countRes.ok) {
        const countJson = await countRes.json();
        totalCount = Number(countJson?.message || 0);
      }
    } catch {
      totalCount = 0;
    }

    if (totalCount === 0) {
      try {
        const fallbackCountRes = await fetch(
          `${env.API_URL}/method/frappe.client.get_count?doctype=${encodeURIComponent(doctypeName)}&filters=${encodeURIComponent(JSON.stringify([]))}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "X-Frappe-Site": siteId,
              "Accept-Encoding": "identity",
            },
          },
        );

        if (fallbackCountRes.ok) {
          const fallbackCountJson = await fallbackCountRes.json();
          totalCount = Number(fallbackCountJson?.message || 0);
        }
      } catch {
        totalCount = 0;
      }
    }
  } catch {
    return <div className="text-red-500">Failed to load list data.</div>;
  }

  const formatCellValue = (input: unknown): string => {
    if (input === null || input === undefined) return "";
    if (
      typeof input === "string" ||
      typeof input === "number" ||
      typeof input === "boolean"
    ) {
      return String(input);
    }

    return JSON.stringify(input);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageLength));
  const normalizedPage = Math.min(currentPage, totalPages);

  const buildListHref = (page: number, size: number) => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set("page", String(page));
    }
    if (size !== 20) {
      params.set("page_size", String(size));
    }

    const query = params.toString();
    return query ? `${listPath}?${query}` : listPath;
  };

  const hasPrevious = normalizedPage > 1;
  const hasNext = normalizedPage < totalPages;
  const previousHref = buildListHref(normalizedPage - 1, pageLength);
  const nextHref = buildListHref(normalizedPage + 1, pageLength);
  const firstHref = buildListHref(1, pageLength);
  const lastHref = buildListHref(totalPages, pageLength);

  const pageWindow = 2;
  const startPage = Math.max(1, normalizedPage - pageWindow);
  const endPage = Math.min(totalPages, normalizedPage + pageWindow);
  const pageNumbers: number[] = [];
  for (let page = startPage; page <= endPage; page++) {
    pageNumbers.push(page);
  }

  const pageSizes = [10, 20, 50, 100];

  // --- Render table ---
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="mb-4 text-xl font-bold">
          {title}: {value}
        </h2>
        <Button variant="default" size="sm" asChild>
          <Link href={`/app/${value}/new-${value}-${randomText()}`}>
            Add {value}
          </Link>
        </Button>
      </div>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            {doctypeFields.map((field: { label: string }) => (
              <th key={field.label} className="p-2 border">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {userRows.length === 0 ? (
            <tr>
              <td
                colSpan={doctypeFields.length}
                className="p-2 text-center text-gray-400"
              >
                No records found.
              </td>
            </tr>
          ) : (
            userRows.map((row) => (
              <tr
                key={
                  typeof row.name === "string" ? row.name : JSON.stringify(row)
                }
                className="hover:bg-gray-50"
              >
                {doctypeFields.map((field: { fieldname: string }) => {
                  // For User doctype, show "Active"/"Disabled" for enabled
                  if (doctypeName === "User" && field.fieldname === "enabled") {
                    return (
                      <td key={field.fieldname} className="p-2 border">
                        {row.enabled === 1 || row.enabled === "1"
                          ? "Active"
                          : "Disabled"}
                      </td>
                    );
                  }
                  return (
                    <td key={field.fieldname} className="p-2 border">
                      {formatCellValue(row[field.fieldname])}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Total: {totalCount} records | Page {normalizedPage} of {totalPages}
          </p>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Page size:</span>
            {pageSizes.map((size) => (
              <Button
                key={size}
                variant={size === pageLength ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={buildListHref(1, size)}>{size}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Button variant="outline" size="sm" asChild>
            {hasPrevious ? (
              <Link href={firstHref}>First</Link>
            ) : (
              <span className="opacity-50">First</span>
            )}
          </Button>

          <Button variant="outline" size="sm" asChild>
            {hasPrevious ? (
              <Link href={previousHref}>Previous</Link>
            ) : (
              <span className="opacity-50">Previous</span>
            )}
          </Button>

          {startPage > 1 ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={buildListHref(1, pageLength)}>1</Link>
              </Button>
              {startPage > 2 ? (
                <span className="px-1 text-xs text-muted-foreground">...</span>
              ) : null}
            </>
          ) : null}

          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={page === normalizedPage ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={buildListHref(page, pageLength)}>{page}</Link>
            </Button>
          ))}

          {endPage < totalPages ? (
            <>
              {endPage < totalPages - 1 ? (
                <span className="px-1 text-xs text-muted-foreground">...</span>
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <Link href={buildListHref(totalPages, pageLength)}>
                  {totalPages}
                </Link>
              </Button>
            </>
          ) : null}

          <Button variant="outline" size="sm" asChild>
            {hasNext ? (
              <Link href={nextHref}>Next</Link>
            ) : (
              <span className="opacity-50">Next</span>
            )}
          </Button>

          <Button variant="outline" size="sm" asChild>
            {hasNext ? (
              <Link href={lastHref}>Last</Link>
            ) : (
              <span className="opacity-50">Last</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
