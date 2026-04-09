import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";

type FormField = {
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

type FormColumn = {
	id: string;
	fields: FormField[];
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

type TabProps = {
	tabs: FormTab[];
	children: (tab: FormTab) => React.ReactNode;
};

export default function Tab({ tabs, children }: TabProps) {
	if (tabs.length === 0) {
		return <div className="text-sm text-muted-foreground">No fields to render.</div>;
	}

	return (
		<Tabs defaultValue={tabs[0]?.id} className="w-full gap-4">
			<div className="sticky top-0 z-10 -mx-2 rounded-md bg-card/95 px-2 py-1 backdrop-blur supports-[backdrop-filter]:bg-card/80">
				<TabsList
					className="h-auto w-full justify-start gap-1 overflow-x-auto"
					variant="line"
				>
				{tabs.map((tab) => (
					<TabsTrigger key={tab.id} value={tab.id}>
						{tab.title}
					</TabsTrigger>
				))}
				</TabsList>
			</div>

			{tabs.map((tab) => (
				<TabsContent key={tab.id} value={tab.id} className="space-y-4">
					{children(tab)}
				</TabsContent>
			))}
		</Tabs>
	);
}
