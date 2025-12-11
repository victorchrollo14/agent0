import type { ModelMessage, StepResult, ToolSet } from "ai";

/**
 * Provider-specific options for reasoning/thinking configuration.
 * Each provider has its own format for controlling reasoning behavior.
 */
export type ProviderOptions = {
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

export type VersionData = {
	model: { provider_id: string; name: string };
	messages: ModelMessage[];
	maxOutputTokens?: number;
	outputFormat?: "text" | "json";
	temperature?: number;
	maxStepCount?: number;
	tools?: { mcp_id: string; name: string }[];
	providerOptions?: ProviderOptions;
};

export type RunData = {
	request?: VersionData & {
		stream: boolean;
		overrides?: {
			model?: {
				provider_id?: string;
				name?: string;
			};
			maxOutputTokens?: number;
			temperature?: number;
			maxStepCount?: number;
			providerOptions?: ProviderOptions;
		};
	};

	steps?: StepResult<ToolSet>[];
	error?: {
		name: string;
		message: string;
		cause?: unknown;
	};
	metrics: {
		preProcessingTime: number;
		firstTokenTime: number;
		responseTime: number;
	};
};

export type MCPConfig = {
	transport: {
		type: "sse" | "http";
		url: string;
		headers?: Record<string, string>;
	};
};
