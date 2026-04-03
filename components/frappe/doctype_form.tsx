import Column from "@/components/frappe/form/column";
import Field from "@/components/frappe/form/field";
import Section from "@/components/frappe/form/section";
import Tab from "@/components/frappe/form/tab";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

type DoctypeFormProps = {
    title: string;
    value: string;
    name: string;
};

type FrappeField = {
    name?: string;
    idx?: number;
    fieldname?: string;
    label?: string;
    fieldtype?: string;
    options?: string;
    description?: string;
    reqd?: number;
    read_only?: number;
    hidden?: number;
    default?: string;
};

type LinkOption = {
    value: string;
    label?: string;
    description?: string;
};

type FrappeDoctype = {
    doctype: string;
    name: string;
    fields?: FrappeField[];
};

type FormColumn = {
    id: string;
    fields: FrappeField[];
};

type FormSection = {
    id: string;
    title: string;
    columns: FormColumn[];
};

type FormTab = {
    id: string;
    title: string;
    sections: FormSection[];
};

function buildFormLayout(fields: FrappeField[]): FormTab[] {
    const tabs: FormTab[] = [];

    const createTab = (title: string, idSeed: string): FormTab => ({
        id: idSeed,
        title,
        sections: [],
    });

    const createSection = (title: string, idSeed: string): FormSection => ({
        id: idSeed,
        title,
        columns: [{ id: `${idSeed}-col-0`, fields: [] }],
    });

    let tabCounter = 0;
    let sectionCounter = 0;

    let currentTab = createTab("Details", `tab-${tabCounter}`);
    tabs.push(currentTab);

    let currentSection = createSection("General", `section-${sectionCounter}`);
    currentTab.sections.push(currentSection);

    let currentColumn = currentSection.columns[0];

    for (const field of fields) {
        if (field.hidden) {
            continue;
        }

        const fieldtype = field.fieldtype || "Data";

        if (fieldtype === "Tab Break") {
            tabCounter += 1;
            const tabTitle = field.label || `Tab ${tabCounter + 1}`;
            currentTab = createTab(tabTitle, `tab-${tabCounter}`);
            tabs.push(currentTab);

            sectionCounter += 1;
            currentSection = createSection("General", `section-${sectionCounter}`);
            currentTab.sections.push(currentSection);
            currentColumn = currentSection.columns[0];
            continue;
        }

        if (fieldtype === "Section Break") {
            sectionCounter += 1;
            currentSection = createSection(
                field.label || "Section",
                `section-${sectionCounter}`
            );
            currentTab.sections.push(currentSection);
            currentColumn = currentSection.columns[0];
            continue;
        }

        if (fieldtype === "Column Break") {
            const columnId = `${currentSection.id}-col-${currentSection.columns.length}`;
            currentColumn = { id: columnId, fields: [] };
            currentSection.columns.push(currentColumn);
            continue;
        }

        currentColumn.fields.push(field);
    }

    return tabs
        .map((tab) => ({
            ...tab,
            sections: tab.sections.filter((section) =>
                section.columns.some((column) => column.fields.length > 0)
            ),
        }))
        .filter((tab) => tab.sections.length > 0);
}

export default async function DoctypeForm({
    title,
    value,
    name,
}: DoctypeFormProps) {
    const session = await getCurrentSession();
    const user = session?.user;
    const accessToken = session?.accessToken;
    const siteId = session?.user?.siteId;

    if (!user || !accessToken || !siteId || session.error === "AccessTokenExpired") {
        redirect(`${env.PUBLIC_APP_URL}/login`);
    }

    let doctypeMeta: FrappeDoctype | null = null;
    let docValues: Record<string, unknown> = {};
    let linkOptionsByDoctype: Record<string, LinkOption[]> = {};

    try {
        const doctypeRes = await fetch(
            `${env.API_URL}/method/frappe.desk.form.load.getdoctype?doctype=${encodeURIComponent(value)}&with_parent=1`,
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

        const doctypeJson = await doctypeRes.json();
        const docs = Array.isArray(doctypeJson?.docs) ? doctypeJson.docs : [];

        doctypeMeta =
            docs.find(
                (doc: FrappeDoctype) => doc.doctype === "DocType" && doc.name === value
            ) || docs[0] || null;
    } catch {
        return <div className="text-red-500">Failed to load doctype metadata.</div>;
    }

    if (!doctypeMeta) {
        return <div className="text-muted-foreground">Doctype metadata not found.</div>;
    }

    try {
        const docRes = await fetch(
            `${env.API_URL}/resource/${encodeURIComponent(value)}/${encodeURIComponent(name)}`,
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

        if (docRes.ok) {
            const docJson = await docRes.json();
            docValues = (docJson?.data as Record<string, unknown>) || {};
        }
    } catch {
        docValues = {};
    }

    const fields = Array.isArray(doctypeMeta.fields) ? doctypeMeta.fields : [];

    const linkDoctypes = Array.from(
        new Set(
            fields
                .filter((field) => field.fieldtype === "Link" && Boolean(field.options))
                .map((field) => field.options as string)
        )
    );

    if (linkDoctypes.length > 0) {
        const results = await Promise.all(
            linkDoctypes.map(async (linkDoctype) => {
                try {
                    const body = new URLSearchParams({
                        doctype: linkDoctype,
                        ignore_user_permissions: "0",
                        reference_doctype: value,
                        page_length: "10",
                        txt: "",
                    });

                    const response = await fetch(
                        `${env.API_URL}/method/frappe.desk.search.search_link`,
                        {
                            method: "POST",
                            cache: "no-store",
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                "X-Frappe-Site": siteId,
                                "Accept-Encoding": "identity",
                                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            },
                            body: body.toString(),
                        }
                    );

                    if (!response.ok) {
                        return [linkDoctype, []] as const;
                    }

                    const json = await response.json();
                    const message = Array.isArray(json?.message) ? json.message : [];
                    const options: LinkOption[] = message
                        .map((item: unknown) => {
                            const row = item as Partial<LinkOption>;
                            if (!row.value) {
                                return null;
                            }

                            return {
                                value: String(row.value),
                                label: row.label ? String(row.label) : undefined,
                                description: row.description
                                    ? String(row.description)
                                    : undefined,
                            };
                        })
                        .filter((item: LinkOption | null): item is LinkOption => Boolean(item));

                    return [linkDoctype, options] as const;
                } catch {
                    return [linkDoctype, []] as const;
                }
            })
        );

        linkOptionsByDoctype = Object.fromEntries(results);
    }

    const tabs = buildFormLayout(fields);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
                    <h2 className="text-xl font-semibold">{doctypeMeta.name}</h2>
                    <p className="text-sm text-muted-foreground">Document: {name}</p>
                </div>
                <div className="text-xs text-muted-foreground">View mode</div>
            </div>

            <Tab tabs={tabs}>
                {(tab) => (
                    <div className="space-y-4">
                        {tab.sections.map((section) => (
                            <Section
                                key={section.id}
                                title={section.title}
                                columnCount={section.columns.length}
                            >
                                {section.columns.map((column) => (
                                    <Column key={column.id}>
                                        {column.fields.map((field) => (
                                            <Field
                                                key={field.fieldname || field.name || String(field.idx)}
                                                field={field}
                                                value={
                                                    field.fieldname
                                                        ? docValues[field.fieldname] ?? field.default ?? ""
                                                        : ""
                                                }
                                                linkOptions={
                                                    field.fieldtype === "Link" && field.options
                                                        ? linkOptionsByDoctype[field.options] || []
                                                        : []
                                                }
                                            />
                                        ))}
                                    </Column>
                                ))}
                            </Section>
                        ))}
                    </div>
                )}
            </Tab>
        </div>
    );
}