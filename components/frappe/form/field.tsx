import Dropdown from "@/components/frappe/form/dropdown";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FrappeField = {
	fieldname?: string;
	label?: string;
	fieldtype?: string;
	options?: string;
	description?: string;
	reqd?: number;
	read_only?: number;
};

type LinkOption = {
	value: string;
	label?: string;
	description?: string;
};

type FieldProps = {
	field: FrappeField;
	value: unknown;
	linkOptions?: LinkOption[];
};

function stringifyValue(value: unknown) {
	if (value === null || value === undefined) {
		return "";
	}

	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	return JSON.stringify(value);
}

export default function Field({ field, value, linkOptions = [] }: FieldProps) {
	const fieldtype = field.fieldtype || "Data";
	const label = field.label || field.fieldname || "Field";
	const textValue = stringifyValue(value);
	const requiredMark = field.reqd ? " *" : "";
	const hasValue = textValue.trim().length > 0;
	const isReadOnly = field.read_only === 1;

	const options = field.options
		? field.options
				.split("\n")
				.map((option) => option.trim())
				.filter(Boolean)
		: [];

	let control: React.ReactNode;

	if (fieldtype === "Check") {
		const checked = value === 1 || value === "1" || value === true;
		control = (
			<div className="flex h-7 items-center gap-2 rounded-md border border-input bg-input/20 px-2 py-0.5">
				<Checkbox defaultChecked={checked} disabled={isReadOnly} aria-label={label} />
				<span className="text-xs/relaxed text-muted-foreground">
					{checked ? "Enabled" : "Disabled"}
				</span>
			</div>
		);
	} else if (fieldtype === "Select" || fieldtype === "Autocomplete") {
		control = <Dropdown value={textValue} disabled={isReadOnly} options={options} />;
	} else if (fieldtype === "Link") {
		const normalizedOptions = [...linkOptions];

		if (textValue && !normalizedOptions.some((option) => option.value === textValue)) {
			normalizedOptions.unshift({
				value: textValue,
				label: textValue,
			});
		}

		control = (
			<Dropdown value={textValue} disabled={isReadOnly} options={normalizedOptions} />
		);
	} else if (fieldtype === "Small Text" || fieldtype === "Text" || fieldtype === "Code") {
		control = <Textarea defaultValue={textValue} disabled={isReadOnly} rows={3} />;
	} else if (fieldtype === "HTML") {
		control = (
			<div className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
				HTML field preview is not rendered.
			</div>
		);
	} else if (fieldtype === "Button") {
		control = (
			<button
				type="button"
				disabled={isReadOnly}
				className="h-7 rounded-md border px-3 text-xs/relaxed text-muted-foreground"
			>
				{label}
			</button>
		);
	} else if (fieldtype === "Table") {
		control = (
			<div className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
				Child table field ({field.options || "unknown"})
			</div>
		);
	} else {
		const inputType = fieldtype === "Password" ? "password" : "text";
		control = (
			<Input
				type={inputType}
				defaultValue={textValue}
				disabled={isReadOnly}
				placeholder={hasValue ? "" : "No value"}
			/>
		);
	}

	return (
		<div className="space-y-1.5 rounded-md border border-transparent p-1 transition-colors hover:border-border/60">
			<p className="text-xs font-medium text-foreground/90">
				{label}
				{requiredMark ? <span className="text-destructive">{requiredMark}</span> : null}
				{isReadOnly ? (
					<span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
						read only
					</span>
				) : null}
			</p>
			{control}
			{field.description ? (
				<p className="text-xs text-muted-foreground">{field.description}</p>
			) : null}
		</div>
	);
}
