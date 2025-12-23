import {
	addToast,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollShadow,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LucidePlus, LucideRefreshCcw } from "lucide-react";
import { mcpsQuery } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

type SelectedTool = { mcp_id: string; name: string };

interface ToolsSectionProps {
	workspaceId: string;
	value: SelectedTool[];
	onValueChange: (value: SelectedTool[]) => void;
	isInvalid?: boolean;
}

export default function ToolsSection({
	workspaceId,
	value,
	onValueChange,
	isInvalid,
}: ToolsSectionProps) {
	const queryClient = useQueryClient();

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

	const handleRemoveTool = (tool: SelectedTool) => {
		onValueChange(
			value.filter(
				(item) => !(item.mcp_id === tool.mcp_id && item.name === tool.name),
			),
		);
	};

	const handleAddTool = (mcp_id: string, toolName: string) => {
		// Check if already added
		const isAlreadyAdded = value.some(
			(item) => item.mcp_id === mcp_id && item.name === toolName,
		);

		if (isAlreadyAdded) {
			return;
		}

		onValueChange([...value, { mcp_id, name: toolName }]);
	};

	// Get MCP name by id for display purposes
	const getMcpName = (mcp_id: string) => {
		const mcp = mcps?.find((m) => m.id === mcp_id);
		return mcp?.name || mcp_id;
	};

	// Get all available tools that are not yet selected
	const getAvailableTools = () => {
		const availableTools: {
			mcp_id: string;
			mcp_name: string;
			name: string;
			description: string;
		}[] = [];

		mcps?.forEach((mcp) => {
			const tools = mcp?.tools as
				| { name: string; description: string }[]
				| undefined;

			tools?.forEach((tool) => {
				const isSelected = value.some(
					(item) => item.mcp_id === mcp.id && item.name === tool.name,
				);

				if (!isSelected) {
					availableTools.push({
						mcp_id: mcp.id,
						mcp_name: mcp.name,
						name: tool.name,
						description: tool.description,
					});
				}
			});
		});

		return availableTools;
	};

	const availableTools = getAvailableTools();

	return (
		<Card className={isInvalid ? "border-danger border" : ""}>
			<CardHeader className="flex items-center justify-between pl-3 pr-1 h-10">
				<span className="text-sm text-default-500">Tools</span>
				<Popover placement="bottom-end">
					<PopoverTrigger>
						<Button
							size="sm"
							variant="light"
							isIconOnly
							isDisabled={availableTools.length === 0}
						>
							<LucidePlus className="size-3.5" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-96 p-0">
						<ScrollShadow className="max-h-80">
							{mcps?.map((mcp) => {
								const tools = mcp?.tools as
									| { name: string; description: string }[]
									| undefined;

								const availableMcpTools = tools?.filter(
									(tool) =>
										!value.some(
											(item) =>
												item.mcp_id === mcp.id && item.name === tool.name,
										),
								);

								if (!availableMcpTools || availableMcpTools.length === 0) {
									return null;
								}

								return (
									<div key={mcp.id} className="p-3 border-b border-default-100">
										<div className="flex items-center justify-between mb-2">
											<p className="text-sm font-medium">{mcp.name}</p>
											<Button
												size="sm"
												isIconOnly
												variant="light"
												isLoading={refreshMcpMutation.isPending}
												onPress={() => refreshMcpMutation.mutate(mcp.id)}
											>
												<LucideRefreshCcw className="size-3" />
											</Button>
										</div>
										<div className="space-y-1">
											{availableMcpTools?.map((tool) => (
												<button
													key={tool.name}
													type="button"
													className="w-full text-left px-2 py-1.5 rounded-md hover:bg-default-100 transition-colors"
													onClick={() => handleAddTool(mcp.id, tool.name)}
												>
													<p className="text-sm">{tool.name}</p>
													<p className="text-xs text-default-500 line-clamp-1">
														{tool.description}
													</p>
												</button>
											))}
										</div>
									</div>
								);
							})}
							{availableTools.length === 0 && (
								<div className="p-4 text-center">
									<p className="text-sm text-default-500">
										No more tools available
									</p>
								</div>
							)}
						</ScrollShadow>
					</PopoverContent>
				</Popover>
			</CardHeader>
			<CardBody className="p-3 border-t border-default-200">
				{value.length === 0 ? (
					<p className="text-sm text-default-400">
						No tools added. Click "+" to add tools to your agent. (Optional)
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{value.map((tool) => (
							<Chip
								key={`${tool.mcp_id}-${tool.name}`}
								variant="flat"
								onClose={() => handleRemoveTool(tool)}
							>
								<span>{tool.name}</span>
								<span className="text-default-400 ml-1 text-xs">
									{getMcpName(tool.mcp_id)}
								</span>
							</Chip>
						))}
					</div>
				)}
			</CardBody>
		</Card>
	);
}
