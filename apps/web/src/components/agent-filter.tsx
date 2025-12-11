import { Select, SelectItem } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { LucideBot } from "lucide-react";
import { agentsQuery } from "@/lib/queries";

interface AgentFilterProps {
	workspaceId: string;
	value: string | undefined;
	onValueChange: (value: string | undefined) => void;
}

export function AgentFilter({
	workspaceId,
	value,
	onValueChange,
}: AgentFilterProps) {
	const { data: agents } = useQuery(agentsQuery(workspaceId));

	return (
		<Select
			startContent={<LucideBot className="size-3.5 shrink-0" />}
			variant="bordered"
			aria-label="Filter by agent"
			placeholder="All Agents"
			size="sm"
			classNames={{
				base: "w-64",
				popoverContent: "w-96",
			}}
			isClearable
			selectedKeys={value ? [value] : []}
			onSelectionChange={(keys) => {
				const selectedKey = Array.from(keys)[0] as string | undefined;
				onValueChange(selectedKey || undefined);
			}}
		>
			{(agents || []).map((agent) => (
				<SelectItem key={agent.id}>{agent.name}</SelectItem>
			))}
		</Select>
	);
}
