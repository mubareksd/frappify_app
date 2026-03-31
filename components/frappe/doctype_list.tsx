


// --- Server Component Wrapper ---
import React from "react";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

function toCapitalCase(input: string): string {
  return input
    .split('-')                // split by dash
    .reverse()                 // reverse order
    .map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

type UserRow = {
    name: string;
    owner: string;
    creation: string;
    modified: string;
    modified_by: string;
    user_type: string;
    full_name: string;
    user_image: string | null;
    enabled: number;
};

type DoctypeListProps = {
    title: string;
    value: string;
};

export default async function DoctypeList({ title, value }: DoctypeListProps) {
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

    // 1. Fetch doctype metadata
    const metaRes = await fetch(
        `${env.API_URL}/method/frappe.desk.form.load.getdoctype?doctype=${encodeURIComponent(value)}`,
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
    const meta = metaJson.docs?.[0] || null;

    // 2. Fetch list data
    const fields = [
        "`tabUser`.`name`",
        "`tabUser`.`owner`",
        "`tabUser`.`creation`",
        "`tabUser`.`modified`",
        "`tabUser`.`modified_by`",
        "`tabUser`.`user_type`",
        "`tabUser`.`full_name`",
        "`tabUser`.`user_image`",
        "`tabUser`.`enabled`"
    ];
    const params = new URLSearchParams();
    params.append("doctype", value);
    params.append("fields", JSON.stringify(fields));
    params.append("filters", JSON.stringify([]));
    params.append("order_by", "`tabUser`.`modified` desc");
    params.append("start", "0");
    params.append("page_length", "20");
    params.append("view", "List");
    params.append("group_by", "");
    params.append("with_comment_count", "1");

    const listRes = await fetch(
        `${env.API_URL}/method/frappe.desk.reportview.get?doctype=${toCapitalCase(value)}&fields=${encodeURIComponent(JSON.stringify(fields))}&filters=${encodeURIComponent(JSON.stringify([]))}&order_by=${encodeURIComponent("`tabUser`.`modified` desc")}&start=0&page_length=20&view=List&group_by=&with_comment_count=1`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                // "Content-Type": "application/x-www-form-urlencoded",
                "X-Frappe-Site": siteId,
                "Accept-Encoding": "identity",
            },
            // body: params,
        }
    );
    const listJson = await listRes.json();
    const keys: string[] = listJson.message?.keys || [];
    const values: unknown[][] = listJson.message?.values || [];
    const userRows: UserRow[] = values.map((row: unknown[]) => {
        const obj: Record<string, unknown> = {};
        keys.forEach((k: string, i: number) => {
            obj[k] = row[i];
        });
        return obj as UserRow;
    });

    // Render the table (purely server-side, no client interactivity needed)
    if (!meta) return <div>No metadata found.</div>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <table className="min-w-full border border-gray-200">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Full Name</th>
                        <th className="p-2 border">User Type</th>
                        <th className="p-2 border">Enabled</th>
                        <th className="p-2 border">Modified</th>
                    </tr>
                </thead>
                <tbody>
                    {userRows.map((row) => (
                        <tr key={row.name} className="hover:bg-gray-50">
                            <td className="p-2 border">{row.name}</td>
                            <td className="p-2 border">{row.full_name}</td>
                            <td className="p-2 border">{row.user_type}</td>
                            <td className="p-2 border">{row.enabled ? "Yes" : "No"}</td>
                            <td className="p-2 border">{row.modified}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}