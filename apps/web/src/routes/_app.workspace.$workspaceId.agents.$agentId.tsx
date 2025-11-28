import {
	Button,
	Listbox,
	ListboxItem,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@heroui/react";
import type { Json } from "@repo/database";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { z } from "zod";
import { Messages, type MessageT, messageSchema } from "@/components/messages";
import { PROVIDER_TYPES } from "@/lib/providers";
import { agentVersionsQuery, providersQuery } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute(
	"/_app/workspace/$workspaceId/agents/$agentId",
)({
	component: RouteComponent,
});

// Zod schema for form validation
const agentFormSchema = z.object({
	provider: z.object({
		id: z.string(),
		model: z.string(),
	}),
	messages: z.array(messageSchema).min(1, "At least one message is required"),
});

// Helper to get error message as string
function getErrorMessage(errors: unknown[]): string | undefined {
	if (errors.length === 0) return undefined;
	const error = errors[0];
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		return String(error.message);
	}
	return undefined;
}

function RouteComponent() {
	const { workspaceId, agentId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const isNewAgent = agentId === "new";

	// Fetch available providers
	const { data: providers, isLoading: isLoadingProviders } = useQuery(
		providersQuery(workspaceId),
	);

	// Fetch existing agent versions if editing
	const { data: versions, isLoading: isLoadingVersions } = useQuery({
		...agentVersionsQuery(agentId),
		enabled: !isNewAgent,
	});

	const latestVersion = versions?.[0]; // Versions are ordered by created_at desc

	// Create mutation (creates both agent and first version)
	const createMutation = useMutation({
		mutationFn: async (values: {
			provider: { id: string; model: string };
			messages: MessageT[];
		}) => {
			const newAgentId = nanoid();
			const newVersionId = nanoid();

			// Create agent
			const { error: agentError } = await supabase.from("agents").insert({
				id: newAgentId,
				name: "",
				workspace_id: workspaceId,
			});

			if (agentError) throw agentError;

			// Create first version
			const { error: versionError } = await supabase.from("versions").insert({
				id: newVersionId,
				agent_id: newAgentId,
				provider_id: values.provider.id,
				data: {
					model: values.provider.model,
					messages: values.messages,
				} as unknown as Json,
				is_deployed: false,
			});

			if (versionError) throw versionError;

			return newAgentId;
		},
		onSuccess: (newAgentId) => {
			queryClient.invalidateQueries({ queryKey: ["agents", workspaceId] });
			toast.success("Agent created successfully");
			navigate({
				to: "/workspace/$workspaceId/agents/$agentId",
				params: { workspaceId, agentId: newAgentId },
			});
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to create agent",
			);
		},
	});

	// Update mutation (creates new version)
	const updateMutation = useMutation({
		mutationFn: async (values: {
			provider: {
				id: string;
				model: string;
			};
			messages: MessageT[];
		}) => {
			const newVersionId = nanoid();

			// Create new version
			const { error: versionError } = await supabase.from("versions").insert({
				id: newVersionId,
				agent_id: agentId,
				provider_id: values.provider.id,
				data: {
					model: values.provider.model,
					messages: values.messages,
				} as unknown as Json,
				is_deployed: false,
			});

			if (versionError) throw versionError;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agents", workspaceId] });
			queryClient.invalidateQueries({ queryKey: ["agent-versions", agentId] });
			queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
			toast.success("New version created successfully");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to create new version",
			);
		},
	});

	// Initialize TanStack Form
	const form = useForm({
		defaultValues: {
			provider: {
				id: latestVersion?.provider_id || "",
				model: (latestVersion?.data as { model?: string } | null)?.model || "",
			},
			messages: (latestVersion?.data as { messages?: MessageT[] } | null)
				?.messages || [
				{
					role: "system",
					content: "",
				},
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "",
						},
					],
				},
			],
		},
		validators: {
			onChange: agentFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (isNewAgent) {
				await createMutation.mutateAsync(value);
			} else {
				await updateMutation.mutateAsync(value);
			}
		},
	});

	const isLoading =
		createMutation.isPending ||
		updateMutation.isPending ||
		isLoadingProviders ||
		isLoadingVersions;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div className="min-h-screen">
				<div className="mt-[1px] w-full flex items-center justify-between p-6 h-16 border-b border-default-200">
					<p>Name</p>

					<div className="flex items-center gap-2">
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{(state) => (
								<Button
									type="submit"
									color="primary"
									isLoading={isLoading || state.isSubmitting}
									isDisabled={!state.canSubmit || isLoading}
								>
									{isNewAgent ? "Create Agent" : "Save New Version"}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</div>
				<div className="flex h-full">
					<div className="flex-1 p-6 space-y-6 border-r border-default-200">
						<form.Field name="provider">
							{(field) => {
								const selectedProvider = providers?.find(
									(provider) => provider.id === field.state.value.id,
								);

								const availableModels =
									PROVIDER_TYPES.find(
										(provider) => provider.key === selectedProvider?.type,
									)?.models || [];

								return (
									<Popover placement="bottom-start">
										<PopoverTrigger>
											<Button>
												@{selectedProvider?.name}/{field.state.value.model}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-2 flex flex-row">
											<div className="w-36 h-64 border-r border-default-200 overflow-y-scroll">
												<Listbox
													selectionMode="single"
													selectedKeys={[field.state.value.id]}
													onSelectionChange={(keys) => {
														const selected = Array.from(keys)[0];
														field.handleChange({
															id: selected as string,
															model: field.state.value.model,
														});
													}}
													variant="flat"
												>
													{providers?.map((provider) => (
														<ListboxItem key={provider.id}>
															{provider.name}
														</ListboxItem>
													)) || []}
												</Listbox>
											</div>
											<div className="w-56 h-64 overflow-y-scroll">
												<Listbox
													selectionMode="single"
													selectedKeys={[field.state.value.model]}
													onSelectionChange={(keys) => {
														const selected = Array.from(keys)[0];
														field.handleChange({
															id: field.state.value.id,
															model: selected as string,
														});
													}}
													variant="flat"
												>
													{availableModels.map((model) => (
														<ListboxItem key={model}>{model}</ListboxItem>
													))}
												</Listbox>
											</div>
										</PopoverContent>
									</Popover>
								);
							}}
						</form.Field>

						<form.Field name="messages" mode="array">
							{(field) => (
								<Messages
									value={field.state.value}
									onValueChange={field.handleChange}
								/>
							)}
						</form.Field>
					</div>

					<div className="flex-1 p-6">
						<p>Right Side</p>
					</div>
				</div>
			</div>
		</form>
	);
}
