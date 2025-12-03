const { Agent0 } = require("./packages/agent0/dist/index.js");

const agentId = process.argv[2];
const apiKey = process.argv[3];

if (!agentId || !apiKey) {
	console.error("Usage: node verify-sdk.js <agent_id> <api_key>");
	process.exit(1);
}

const client = new Agent0({
	apiKey: apiKey,
	baseUrl: "http://localhost:2223",
});

async function test() {
	console.log("Testing generate...");
	try {
		const result = await client.generate({
			agentId,
			variables: { test: "hello" },
		});
		console.log("Generate result:", JSON.stringify(result, null, 2));
	} catch (e) {
		console.error("Generate failed:", e);
	}

	console.log("\nTesting stream...");
	try {
		const stream = await client.stream({
			agentId,
			variables: { test: "hello stream" },
		});

		for await (const chunk of stream) {
			console.log("Stream chunk:", JSON.stringify(chunk));
		}
	} catch (e) {
		console.error("Stream failed:", e);
	}
}

test();
