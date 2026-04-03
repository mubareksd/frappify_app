type DropdownProps = {
	value?: string;
	disabled?: boolean;
	options: Array<
		| string
		| {
				value: string;
				label?: string;
				description?: string;
		  }
	>;
};

export default function Dropdown({
	value = "",
	disabled = false,
	options,
}: DropdownProps) {
	return (
		<select
			className="h-7 w-full rounded-md border border-input bg-input/20 px-2 py-0.5 text-xs/relaxed text-foreground"
			defaultValue={value}
			disabled={disabled}
			aria-label="Field options"
		>
			<option value="">Select an option</option>
			{options.map((option) => {
				if (typeof option === "string") {
					return (
						<option key={option} value={option}>
							{option}
						</option>
					);
				}

				return (
					<option key={option.value} value={option.value}>
						{option.label || option.value}
					</option>
				);
			})}
		</select>
	);
}
