import {
	addToast,
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollShadow,
	Textarea,
	useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	LucidePlus,
	LucideRefreshCcw,
	LucideServer,
	LucideWrench,
} from "lucide-react";
import { useState } from "react";
import { ThemedJsonEditor } from "@/components/themed-json-editor";
import { mcpsQuery } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

/**
 * MCP Tool - tool from an MCP server
 */
type MCPTool = {
	type: "mcp";
	mcp_id: string;
	name: string;
};

/**
 * Custom Tool - defined inline by the developer
 */
type CustomTool = {
	type: "custom";
	title: string;
	description: string;
	inputSchema?: Record<string, unknown>;
};

/**
 * Union type for all tools
 */
type ToolDefinition = MCPTool | CustomTool;

// For backward compatibility, support old format without type field
type LegacyTool = { mcp_id: string; name: string };
type ToolValue = ToolDefinition | LegacyTool;

interface ToolsSectionProps {
	workspaceId: string;
	value: ToolValue[];
	onValueChange: (value: ToolValue[]) => void;
	isInvalid?: boolean;
}

// Helper to normalize tool to new format
const normalizeTool = (tool: ToolValue): ToolDefinition => {
	if ("type" in tool) {
		return tool;
	}
	// Convert legacy format to new MCPTool format
	return {
		type: "mcp",
		mcp_id: tool.mcp_id,
		name: tool.name,
	};
};

// Helper to check if tool is MCP type
const isMCPTool = (tool: ToolValue): tool is MCPTool | LegacyTool => {
	return !("type" in tool) || tool.type === "mcp";
};

// Helper to check if tool is custom type
const isCustomTool = (tool: ToolValue): tool is CustomTool => {
	return "type" in tool && tool.type === "custom";
};

export default function ToolsSection({
	workspaceId,
	value,
	onValueChange,
	isInvalid,
}: ToolsSectionProps) {
	const queryClient = useQueryClient();

	// Modal state for adding custom tool
	const {
		isOpen: isCustomToolModalOpen,
		onOpen: onOpenCustomToolModal,
		onClose: onCloseCustomToolModal,
	} = useDisclosure();

	// Custom tool form state
	const [customToolTitle, setCustomToolTitle] = useState("");
	const [customToolDescription, setCustomToolDescription] = useState("");
	const [customToolInputSchema, setCustomToolInputSchema] = useState<
		Record<string, unknown>
	>({});

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

	const handleRemoveTool = (toolToRemove: ToolValue) => {
		const normalized = normalizeTool(toolToRemove);

		onValueChange(
			value.filter((item) => {
				const normalizedItem = normalizeTool(item);

				// Compare based on type
				if (normalizedItem.type === "mcp" && normalized.type === "mcp") {
					return !(
						normalizedItem.mcp_id === normalized.mcp_id &&
						normalizedItem.name === normalized.name
					);
				}
				if (normalizedItem.type === "custom" && normalized.type === "custom") {
					return normalizedItem.title !== normalized.title;
				}
				return true;
			}),
		);
	};

	const handleAddMCPTool = (mcp_id: string, toolName: string) => {
		// Check if already added
		const isAlreadyAdded = value.some((item) => {
			if (isMCPTool(item)) {
				const mcpTool = item as { mcp_id: string; name: string };
				return mcpTool.mcp_id === mcp_id && mcpTool.name === toolName;
			}
			return false;
		});

		if (isAlreadyAdded) {
			return;
		}

		const newTool: MCPTool = {
			type: "mcp",
			mcp_id,
			name: toolName,
		};

		onValueChange([...value, newTool]);
	};

	const handleAddCustomTool = () => {
		if (!customToolTitle.trim()) {
			addToast({
				title: "Tool title is required.",
				color: "danger",
			});
			return;
		}

		if (!customToolDescription.trim()) {
			addToast({
				title: "Tool description is required.",
				color: "danger",
			});
			return;
		}

		// Check if a custom tool with this title already exists
		const isAlreadyAdded = value.some((item) => {
			if (isCustomTool(item)) {
				return item.title === customToolTitle.trim();
			}
			return false;
		});

		if (isAlreadyAdded) {
			addToast({
				title: "A custom tool with this title already exists.",
				color: "danger",
			});
			return;
		}

		const newTool: CustomTool = {
			type: "custom",
			title: customToolTitle.trim(),
			description: customToolDescription.trim(),
			inputSchema:
				Object.keys(customToolInputSchema).length > 0
					? customToolInputSchema
					: undefined,
		};

		onValueChange([...value, newTool]);

		// Reset form and close modal
		setCustomToolTitle("");
		setCustomToolDescription("");
		setCustomToolInputSchema({});
		onCloseCustomToolModal();
	};

	// Get MCP name by id for display purposes
	const getMcpName = (mcp_id: string) => {
		const mcp = mcps?.find((m) => m.id === mcp_id);
		return mcp?.name || mcp_id;
	};

	// Get all available MCP tools that are not yet selected
	const getAvailableMCPTools = () => {
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
				const isSelected = value.some((item) => {
					if (isMCPTool(item)) {
						const mcpTool = item as { mcp_id: string; name: string };
						return mcpTool.mcp_id === mcp.id && mcpTool.name === tool.name;
					}
					return false;
				});

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

	const availableMCPTools = getAvailableMCPTools();
	const hasMCPs = mcps && mcps.length > 0;

	// Separate MCP tools and custom tools from value
	const mcpTools = value.filter(isMCPTool);
	const customTools = value.filter(isCustomTool);

	return (
		<>
			<Card className={isInvalid ? "border-danger border" : ""}>
				<CardHeader className="flex items-center justify-between pl-3 pr-1 h-10">
					<span className="text-sm text-default-500">Tools</span>
					<Dropdown placement="bottom-end">
						<DropdownTrigger>
							<Button size="sm" variant="light" isIconOnly>
								<LucidePlus className="size-3.5" />
							</Button>
						</DropdownTrigger>
						<DropdownMenu>
							<DropdownItem
								key="mcp"
								startContent={<LucideServer className="size-4" />}
								description="Add a tool from an MCP server"
								isDisabled={!hasMCPs || availableMCPTools.length === 0}
							>
								From MCP Server
							</DropdownItem>
							<DropdownItem
								key="custom"
								startContent={<LucideWrench className="size-4" />}
								description="Define a custom tool"
								onPress={onOpenCustomToolModal}
							>
								Custom Tool
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</CardHeader>
				<CardBody className="p-3 border-t border-default-200">
					{value.length === 0 ? (
						<p className="text-sm text-default-400">
							No tools added. Click "+" to add tools to your agent. (Optional)
						</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{/* MCP Tools */}
							{mcpTools.map((tool) => {
								const mcpTool = tool as { mcp_id: string; name: string };
								return (
									<Chip
										key={`mcp-${mcpTool.mcp_id}-${mcpTool.name}`}
										variant="flat"
										onClose={() => handleRemoveTool(tool)}
									>
										<span>{mcpTool.name}</span>
										<span className="text-default-400 ml-1 text-xs">
											{getMcpName(mcpTool.mcp_id)}
										</span>
									</Chip>
								);
							})}
							{/* Custom Tools */}
							{customTools.map((tool) => (
								<Chip
									key={`custom-${tool.title}`}
									variant="flat"
									color="secondary"
									onClose={() => handleRemoveTool(tool)}
								>
									<span>{tool.title}</span>
									<span className="text-default-400 ml-1 text-xs">Custom</span>
								</Chip>
							))}
						</div>
					)}
				</CardBody>
			</Card>

			{/* MCP Tools Popover - shown when selecting "From MCP Server" */}
			{hasMCPs && availableMCPTools.length > 0 && (
				<Popover placement="bottom-end">
					<PopoverTrigger>
						<Button
							size="sm"
							variant="flat"
							className="hidden"
							id="mcp-tools-trigger"
						>
							MCP Tools
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
										!value.some((item) => {
											if (isMCPTool(item)) {
												const mcpTool = item as {
													mcp_id: string;
													name: string;
												};
												return (
													mcpTool.mcp_id === mcp.id &&
													mcpTool.name === tool.name
												);
											}
											return false;
										}),
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
													onClick={() => handleAddMCPTool(mcp.id, tool.name)}
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
						</ScrollShadow>
					</PopoverContent>
				</Popover>
			)}

			{/* Inline MCP Tools selection - update dropdown to show MCP tools */}
			<Dropdown placement="bottom-end">
				<DropdownTrigger>
					<Button
						className="hidden"
						id="inline-mcp-dropdown"
						size="sm"
						variant="flat"
					>
						Select
					</Button>
				</DropdownTrigger>
				<DropdownMenu>
					{availableMCPTools.map((tool) => (
						<DropdownItem
							key={`${tool.mcp_id}-${tool.name}`}
							description={tool.description}
							onPress={() => handleAddMCPTool(tool.mcp_id, tool.name)}
						>
							{tool.name}
							<span className="text-xs text-default-400 ml-2">
								{tool.mcp_name}
							</span>
						</DropdownItem>
					))}
				</DropdownMenu>
			</Dropdown>

			{/* Custom Tool Modal */}
			<Modal
				isOpen={isCustomToolModalOpen}
				onClose={onCloseCustomToolModal}
				size="xl"
			>
				<ModalContent>
					<ModalHeader>Add Custom Tool</ModalHeader>
					<ModalBody className="space-y-4">
						<Input
							label="Tool Title"
							placeholder="e.g., get_weather"
							value={customToolTitle}
							onValueChange={setCustomToolTitle}
							description="A unique identifier for the tool (lowercase with underscores recommended)"
							isRequired
						/>
						<Textarea
							label="Description"
							placeholder="Describe what this tool does..."
							value={customToolDescription}
							onValueChange={setCustomToolDescription}
							description="A clear description helps the AI understand when to use this tool"
							isRequired
						/>
						<div className="space-y-2">
							<label
								htmlFor="input-schema"
								className="text-sm font-medium text-default-700"
							>
								Input Schema (JSON Schema)
							</label>
							<p className="text-xs text-default-500">
								Define the parameters this tool accepts using JSON Schema
								format. Leave empty for no parameters.
							</p>
							<ThemedJsonEditor
								data={customToolInputSchema}
								setData={(newData) => {
									if (newData && typeof newData === "object") {
										setCustomToolInputSchema(
											newData as Record<string, unknown>,
										);
									}
								}}
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button variant="flat" onPress={onCloseCustomToolModal}>
							Cancel
						</Button>
						<Button color="primary" onPress={handleAddCustomTool}>
							Add Tool
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
