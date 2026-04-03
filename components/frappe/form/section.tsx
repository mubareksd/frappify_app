type SectionProps = {
	title: string;
	columnCount?: number;
	children: React.ReactNode;
};

export default function Section({ title, columnCount = 1, children }: SectionProps) {
	const gridClass =
		columnCount >= 3
			? "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
			: columnCount === 2
				? "grid-cols-1 xl:grid-cols-2"
				: "grid-cols-1";

	return (
		<section className="rounded-lg border bg-card p-4 shadow-sm">
			<h4 className="mb-4 text-sm font-semibold text-foreground">{title}</h4>
			<div className={`grid gap-4 ${gridClass}`}>{children}</div>
		</section>
	);
}
