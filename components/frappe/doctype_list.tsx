


// --- Server Component Wrapper ---

import React from "react";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";


type UserRow = Record<string, any>;


type DoctypeListProps = {
    title: string;
    value: string;
};


export default async function DoctypeList({ title, value }: DoctypeListProps) {
    // Get session and check authentication
    const session = await getCurrentSession();
    const user = session?.user;
    const accessToken = session?.accessToken;
    const siteId = session?.user?.siteId;
    if (!user || !accessToken || !siteId || session.error === "AccessTokenExpired") {
        redirect(`${env.PUBLIC_APP_URL}/login`);
    }

    // --- Fetch doctype metadata ---
    let meta: any = null;
    let doctypeFields: any[] = [];
    let doctypeName = value;
    try {
        const metaRes = await fetch(
            `${env.API_URL}/method/frappe.desk.form.load.getdoctype?doctype=${encodeURIComponent(
                value.split("-").reverse().join(" ")
            )}`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "X-Frappe-Site": siteId,
                    "Accept-Encoding": "identity",
                },
            }
        );
        const metaJson = await metaRes.json();
        meta = metaJson.docs?.[0] || null;
        doctypeName = meta?.name || value;
        doctypeFields = (meta?.fields || []).filter((f: any) => f.in_list_view == 1);
    } catch (err) {
        return <div className="text-red-500">Failed to load metadata.</div>;
    }

    if (!meta) return <div>No metadata found.</div>;

    // --- Fetch list data ---
    let userRows: UserRow[] = [];
    try {
        const fields = doctypeFields.map((f: { fieldname: string }) => `\`tab${doctypeName}\`.\`${f.fieldname}\``);
        const listRes = await fetch(
            `${env.API_URL}/method/frappe.desk.reportview.get?doctype=${doctypeName}` +
                `&fields=${encodeURIComponent(JSON.stringify(fields))}` +
                `&filters=${encodeURIComponent(JSON.stringify([]))}` +
                `&order_by=${encodeURIComponent(`\`tab${doctypeName}\`.\`modified\` desc`)}` +
                `&start=0&page_length=20&view=List&group_by=&with_comment_count=1`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "X-Frappe-Site": siteId,
                    "Accept-Encoding": "identity",
                },
            }
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
    } catch (err) {
        return <div className="text-red-500">Failed to load list data.</div>;
    }

    // --- Render table ---
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
                    {userRows.length === 0 ? (
                        <tr>
                            <td colSpan={doctypeFields.length} className="p-2 text-center text-gray-400">No records found.</td>
                        </tr>
                    ) : (
                        userRows.map((row) => (
                            <tr key={row.name || JSON.stringify(row)} className="hover:bg-gray-50">
                                {doctypeFields.map((field: { fieldname: string }) => (
                                    <td key={field.fieldname} className="p-2 border">{row[field.fieldname]}</td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}