import { Select, SelectItem } from "@heroui/react";
import { Activity } from "lucide-react";

export type StatusFilterValue = "success" | "failed" | undefined;

interface StatusFilterProps {
	value: StatusFilterValue;
	onValueChange: (value: StatusFilterValue) => void;
}

export function StatusFilter({ value, onValueChange }: StatusFilterProps) {
	return (
		<Select
			isClearable
			startContent={<Activity className="size-3.5 shrink-0" />}
			variant="bordered"
			aria-label="Filter by status"
			placeholder="All Statuses"
			size="sm"
			classNames={{
				base: "w-40",
				trigger: "min-h-8",
			}}
			selectedKeys={value ? [value] : []}
			onSelectionChange={(keys) => {
				const selected = Array.from(keys)[0] as StatusFilterValue;
				onValueChange(selected || undefined);
			}}
		>
			<SelectItem key="sucess" color="success">
				Success
			</SelectItem>
			<SelectItem key="failed" color="danger">
				Failed
			</SelectItem>
		</Select>
	);
}
