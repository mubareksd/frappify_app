type DropdownProps = {
	value?: string;
	options: string[];
};

export default function Dropdown({ value = "", options }: DropdownProps) {
	return (
		<select
			className="h-7 w-full rounded-md border border-input bg-input/20 px-2 py-0.5 text-xs/relaxed text-foreground"
			value={value}
			disabled
			aria-label="Field options"
		>
			<option value="">Select an option</option>
			{options.map((option) => (
				<option key={option} value={option}>
					{option}
				</option>
			))}
		</select>
	);
}
