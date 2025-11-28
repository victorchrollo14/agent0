import { Textarea } from "@heroui/react";
import { z } from "zod";

const systemMessageSchema = z.object({
	role: z.literal("system"),
	content: z.string().min(1, "System message content is required"),
});

const userMessageSchema = z.object({
	role: z.literal("user"),
	content: z
		.array(
			z.union([
				z.object({
					type: z.literal("text"),
					text: z.string(),
				}),
				z.object({
					type: z.literal("image"),
					image: z.string(),
					mediaType: z.string().optional(),
				}),
				z.object({
					type: z.literal("file"),
					data: z.string(),
					mediaType: z.string(),
				}),
			]),
		)
		.min(1, "User message must have at least one content part"),
});

const assistantMessage = z.object({
	role: z.literal("assistant"),
	content: z
		.array(
			z.union([
				z.object({
					type: z.literal("text"),
					text: z.string(),
				}),
				z.object({
					type: z.literal("reasoning"),
					text: z.string(),
				}),
				z.object({
					type: z.literal("file"),
					data: z.string(),
					mediaType: z.string(),
					fileName: z.string().optional(),
				}),
				z.object({
					type: z.literal("tool-call"),
					toolCallId: z.string(),
					toolName: z.string(),
					input: z.any(),
				}),
			]),
		)
		.min(1, "Assistant message must have at least one content part"),
});

const toolMessageSchema = z.object({
	role: z.literal("tool"),
	content: z.array(
		z.object({
			type: z.literal("tool-result"),
			toolCallId: z.string(),
			toolName: z.string(),
			output: z.unknown(),
			isError: z.boolean().optional(),
		}),
	),
});

export const messageSchema = z.discriminatedUnion("role", [
	systemMessageSchema,
	userMessageSchema,
	assistantMessage,
	toolMessageSchema,
]);

export type MessageT = z.infer<typeof messageSchema>;

function SystemMessage({
	value,
	onValueChange,
}: {
	value: string;
	onValueChange: (value: string) => void;
}) {
	return (
		<div>
			<Textarea
				variant="bordered"
				label="System"
				value={value}
				onValueChange={onValueChange}
			/>
		</div>
	);
}

function UserMessage({
	value,
	onValueChange,
}: {
	value: Extract<MessageT, { role: "user" }>["content"];
	onValueChange: (
		value: Extract<MessageT, { role: "user" }>["content"],
	) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			{value.map((part, index) => {
				if (part.type === "text") {
					return (
						<Textarea
							key={`${index + 1}`}
							variant="bordered"
							label="User"
							value={part.text}
							onValueChange={(text) => {
								const newContent = [...value];
								newContent[index] = { ...part, text };
								onValueChange(newContent);
							}}
						/>
					);
				}
				return null;
			})}
		</div>
	);
}

interface MessagesProps {
	value: MessageT[];
	onValueChange: (value: MessageT[]) => void;
}

export function Messages({ value, onValueChange }: MessagesProps) {
	return (
		<div>
			{value.map((message, index) => {
				if (message.role === "system") {
					return (
						<SystemMessage
							key={`${index + 1}`}
							value={message.content}
							onValueChange={(content) => {
								const newMessages = [...value];

								newMessages[index] = {
									role: "system",
									content,
								};

								onValueChange(newMessages);
							}}
						/>
					);
				}

				if (message.role === "user") {
					return (
						<UserMessage
							key={`${index + 1}`}
							value={message.content}
							onValueChange={(content) => {
								const newMessages = [...value];

								newMessages[index] = {
									role: "user",
									content,
								};

								onValueChange(newMessages);
							}}
						/>
					);
				}

				return null;
			})}
		</div>
	);
}
