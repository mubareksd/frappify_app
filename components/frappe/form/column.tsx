type ColumnProps = {
	children: React.ReactNode;
};

export default function Column({ children }: ColumnProps) {
	return <div className="space-y-4 rounded-md border bg-muted/10 p-3">{children}</div>;
}
