import {
	addToast,
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Switch,
	useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LucidePlug, LucideRefreshCcw } from "lucide-react";
import { mcpsQuery } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

type SelectedTool = { mcp_id: string; name: string };

interface ModelSelectorProps {
	workspaceId: string;
	value: SelectedTool[];
	onValueChange: (value: SelectedTool[]) => void;
	isInvalid?: boolean;
}

export default function ToolsSelector({
	workspaceId,
	value,
	onValueChange,
	isInvalid,
}: ModelSelectorProps) {
	const queryClient = useQueryClient();
	const { isOpen, onOpenChange } = useDisclosure();

	const { data: mcps } = useQuery(mcpsQuery(workspaceId));

	const refreshMcpMutation = useMutation({
		mutationFn: async (mcp_id: string) => {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session) {
				throw new Error("You must be logged in to refresh MCP.");
			}

			const baseURL = import.meta.env.DEV ? "http://localhost:2223" : "";

			const response = await fetch(`${baseURL}/api/v1/refresh-mcp`, {
				method: "POST",
				body: JSON.stringify({ mcp_id }),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to refresh MCP");
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["mcps", workspaceId] });
		},
		onError: (error) => {
			addToast({
				title:
					error instanceof Error ? error.message : "Failed to refresh MCP.",
				color: "danger",
			});
		},
	});

	return (
		<>
			<Button
				size="sm"
				variant="flat"
				color={isInvalid ? "danger" : "default"}
				startContent={<LucidePlug className="size-3.5" />}
				onPress={onOpenChange}
			>
				{value.length === 0 ? "Add Tools" : `${value.length} Tools`}
			</Button>
			<Modal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				scrollBehavior="inside"
				size="4xl"
			>
				<ModalContent>
					<ModalHeader>Tools</ModalHeader>
					<ModalBody className="py-0">
						{mcps?.map((mcp) => {
							const tools = mcp.tools as {
								name: string;
								description: string;
							}[];

							return (
								<div key={mcp.id}>
									<div className="bg-background pb-6 z-20 sticky top-0">
										<div className="flex items-center gap-2">
											<p className="text-lg font-medium">{mcp.name}</p>
											<Button
												size="sm"
												isIconOnly
												variant="flat"
												isLoading={refreshMcpMutation.isPending}
												onPress={async () => {
													await refreshMcpMutation.mutate(mcp.id);
												}}
											>
												<LucideRefreshCcw className="size-3.5" />
											</Button>
										</div>
									</div>

									<div className="space-y-4">
										{tools.map((tool) => (
											<div key={tool.name} className="flex gap-2">
												<div className="flex-1">
													<p>{tool.name}</p>
													<p className="text-sm text-default-500">
														{tool.description}
													</p>
												</div>
												<Switch
													isSelected={
														value.find(
															(item) =>
																item.mcp_id === mcp.id &&
																item.name === tool.name,
														) !== undefined
													}
													onValueChange={(selected: boolean) => {
														if (!selected) {
															onValueChange(
																value.filter(
																	(item) =>
																		item.mcp_id !== mcp.id ||
																		item.name !== tool.name,
																),
															);
														} else {
															onValueChange([
																...value,
																{
																	mcp_id: mcp.id,
																	name: tool.name,
																},
															]);
														}
													}}
												/>
											</div>
										))}
									</div>
								</div>
							);
						})}
					</ModalBody>
					<ModalFooter></ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
