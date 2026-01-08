import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@heroui/react";
import { LucideListPlus } from "lucide-react";
import type { MessageT } from "@/components/messages";

export function AddMessage({ onAdd }: { onAdd: (m: MessageT) => void }) {
	return (
		<Dropdown placement="top-start">
			<DropdownTrigger>
				<Button
					size="sm"
					variant="flat"
					startContent={<LucideListPlus className="size-3.5" />}
				>
					Add
				</Button>
			</DropdownTrigger>
			<DropdownMenu>
				<DropdownItem
					key="user"
					title="User Message"
					onPress={() => {
						onAdd({ role: "user", content: [{ type: "text", text: "" }] });
					}}
				/>
				<DropdownItem
					key="assistant"
					title="Assistant Message"
					onPress={() => {
						onAdd({ role: "assistant", content: [{ type: "text", text: "" }] });
					}}
				/>
				<DropdownItem
					key="tool"
					title="Tool Message"
					onPress={() => {
						onAdd({
							role: "tool",
							content: [
								{
									type: "tool-result",
									toolCallId: "",
									toolName: "",
									output: {
										type: "json",
										value: {},
									},
								},
							],
						});
					}}
				/>
			</DropdownMenu>
		</Dropdown>
	);
}
