import type { StepResult, ToolSet } from "ai";
import type { MessageT } from "@/components/messages";

export type RunData = {
	request?: {
		model: { provider_id: string; name: string };
		messages: MessageT[];
		maxOutputTokens?: number;
		outputFormat?: "text" | "json";
		temperature?: number;
		maxStepCount?: number;
	};
	steps?: StepResult<ToolSet>[];
	error?: {
		name: string;
		message: string;
		cause?: unknown;
	};
};
