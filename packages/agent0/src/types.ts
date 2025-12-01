import type { StepResult, ToolSet } from "ai";

export interface Agent0Config {
    apiKey: string;
    baseUrl?: string;
}

export interface RunOptions {
    agent_id: string;
    variables?: Record<string, string>;
}

export interface Message {
    role: 'assistatnt'
    content: StepResult<ToolSet>["content"];
}

export interface GenerateResponse {
    messages: Message[];
}