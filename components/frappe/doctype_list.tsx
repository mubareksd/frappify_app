


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
        `${env.API_URL}/method/frappe.desk.form.load.getdoctype?doctype=${encodeURIComponent(value.split('-')
    .reverse()
    .join(' '))}`,
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
    const doctypeName = meta?.name || value;
    let doctypeFields = meta?.fields || [];
    doctypeFields = doctypeFields.filter(f => f.in_list_view == 1);

    // 2. Fetch list data
    const fields = [
        ...doctypeFields.map((f: { fieldname: string }) => `\`tab${doctypeName}\`.\`${f.fieldname}\``),
    ];
    const params = new URLSearchParams();
    params.append("doctype", value);
    params.append("fields", JSON.stringify(fields));
    params.append("filters", JSON.stringify([]));
    params.append("order_by", "`tab${doctypeName}`.`modified` desc");
    params.append("start", "0");
    params.append("page_length", "20");
    params.append("view", "List");
    params.append("group_by", "");
    params.append("with_comment_count", "1");

    const listRes = await fetch(
        `${env.API_URL}/method/frappe.desk.reportview.get?doctype=${doctypeName}&fields=${encodeURIComponent(JSON.stringify(fields))}&filters=${encodeURIComponent(JSON.stringify([]))}&order_by=${encodeURIComponent("`tab${doctypeName}`.`modified` desc")}&start=0&page_length=20&view=List&group_by=&with_comment_count=1`,
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
                        {doctypeFields.map((field: { label: string }) => (
                            <th key={field.label} className="p-2 border">{field.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {userRows.map((row) => (
                        <tr key={row.name} className="hover:bg-gray-50">
                            {doctypeFields.map((field: { fieldname: string }) => (
                                <td key={field.fieldname} className="p-2 border">{row[field.fieldname]}</td>
                        ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}