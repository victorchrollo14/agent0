import { Button } from "@heroui/react";
import { LucideBraces } from "lucide-react";

export function Variables({
	variables,
	onVariablePress,
}: {
	variables: string[];
	onVariablePress: () => void;
}) {
	return (
		<div className="flex flex-wrap gap-1 items-center">
			{variables.map((variable) => (
				<Button
					color="warning"
					size="sm"
					key={variable}
					startContent={<LucideBraces className="size-3" />}
					className="gap-1 h-6 px-2"
					variant="flat"
					onPress={() => onVariablePress()}
				>
					{variable}
				</Button>
			))}
		</div>
	);
}
