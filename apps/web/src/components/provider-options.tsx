import { Divider, Input, Select, SelectItem, Switch } from "@heroui/react";

/**
 * Provider-specific options type matching the form schema.
 */
export type ProviderOptionsValue = {
	openai?: {
		reasoningEffort?: "minimal" | "low" | "medium" | "high";
	};
	xai?: {
		reasoningEffort?: "low" | "medium" | "high";
	};
	google?: {
		thinkingConfig?: {
			thinkingBudget?: number;
			thinkingLevel?: "low" | "medium" | "high";
			includeThoughts?: boolean;
		};
	};
};

interface ProviderOptionsProps {
	providerType: string;
	value: ProviderOptionsValue | undefined;
	onValueChange: (value: ProviderOptionsValue) => void;
}

/**
 * Provider-specific options UI for reasoning/thinking configuration.
 * Shows different options based on the provider type.
 */
export function ProviderOptions({
	providerType,
	value,
	onValueChange,
}: ProviderOptionsProps) {
	// Only show for providers with reasoning options
	if (
		!["openai", "xai", "azure", "google", "google-vertex"].includes(
			providerType,
		)
	) {
		return null;
	}

	return (
		<>
			<Divider className="my-2" />

			{/* OpenAI / Azure reasoning effort */}
			{(providerType === "openai" || providerType === "azure") && (
				<Select
					variant="bordered"
					label="Reasoning Effort"
					placeholder="Not set"
					selectedKeys={
						value?.openai?.reasoningEffort ? [value.openai.reasoningEffort] : []
					}
					onSelectionChange={(keys) => {
						const selected = Array.from(keys)[0] as
							| "minimal"
							| "low"
							| "medium"
							| "high"
							| undefined;
						onValueChange({
							...value,
							openai: { reasoningEffort: selected },
						});
					}}
				>
					<SelectItem key="minimal">Minimal</SelectItem>
					<SelectItem key="low">Low</SelectItem>
					<SelectItem key="medium">Medium</SelectItem>
					<SelectItem key="high">High</SelectItem>
				</Select>
			)}

			{/* xAI reasoning effort */}
			{providerType === "xai" && (
				<Select
					variant="bordered"
					label="Reasoning Effort"
					placeholder="Not set"
					selectedKeys={
						value?.xai?.reasoningEffort ? [value.xai.reasoningEffort] : []
					}
					onSelectionChange={(keys) => {
						const selected = Array.from(keys)[0] as
							| "low"
							| "medium"
							| "high"
							| undefined;
						onValueChange({
							...value,
							xai: { reasoningEffort: selected },
						});
					}}
				>
					<SelectItem key="low">Low</SelectItem>
					<SelectItem key="medium">Medium</SelectItem>
					<SelectItem key="high">High</SelectItem>
				</Select>
			)}

			{/* Google / Vertex thinking config */}
			{(providerType === "google" || providerType === "google-vertex") && (
				<>
					<div className="flex flex-col gap-2 w-full">
						<div className="flex gap-2 w-full">
							<Select
								className="flex-1"
								variant="bordered"
								label="Thinking Level"
								placeholder="Not set"
								isClearable
								isDisabled={!!value?.google?.thinkingConfig?.thinkingBudget}
								selectedKeys={
									value?.google?.thinkingConfig?.thinkingLevel
										? [value.google.thinkingConfig.thinkingLevel]
										: []
								}
								onSelectionChange={(keys) => {
									const selected = Array.from(keys)[0] as
										| "low"
										| "medium"
										| "high"
										| undefined;
									onValueChange({
										...value,
										google: {
											thinkingConfig: {
												includeThoughts:
													value?.google?.thinkingConfig?.includeThoughts,
												thinkingLevel: selected,
												thinkingBudget: undefined,
											},
										},
									});
								}}
							>
								<SelectItem key="low">Low</SelectItem>
								<SelectItem key="medium">Medium</SelectItem>
								<SelectItem key="high">High</SelectItem>
							</Select>
							<Input
								className="flex-1"
								isClearable
								variant="bordered"
								type="number"
								label="Thinking Budget"
								placeholder="e.g. 8192"
								isDisabled={!!value?.google?.thinkingConfig?.thinkingLevel}
								value={
									value?.google?.thinkingConfig?.thinkingBudget?.toString() ||
									""
								}
								onValueChange={(inputValue) => {
									const numValue = inputValue
										? parseInt(inputValue, 10)
										: undefined;
									onValueChange({
										...value,
										google: {
											thinkingConfig: {
												includeThoughts:
													value?.google?.thinkingConfig?.includeThoughts,
												thinkingBudget: numValue,
												thinkingLevel: undefined,
											},
										},
									});
								}}
							/>
						</div>
						<p className="text-xs text-default-500">
							Use either Thinking Level or Thinking Budget (not both)
						</p>
					</div>
					<Switch
						size="sm"
						isSelected={value?.google?.thinkingConfig?.includeThoughts || false}
						onValueChange={(checked) => {
							onValueChange({
								...value,
								google: {
									thinkingConfig: {
										...value?.google?.thinkingConfig,
										includeThoughts: checked,
									},
								},
							});
						}}
					>
						Include Thoughts
					</Switch>
				</>
			)}
		</>
	);
}
