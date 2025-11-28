export const PROVIDER_TYPES = [
    {
        key: "xai", label: "XAI", models: [
            "grok-4-fast-non-reasoning",
            "grok-4-fast-reasoning",
            "grok-4-1-non-reasoning",
            "grok-4-1-reasoning",
        ]
    },
    {
        key: "openai", label: "OpenAI", models: [
            "gpt-5.1",
            "gpt-5",
            "gpt-4.1"
        ]
    },
    {
        key: "google-vertex", label: "Google Vertex AI", models: [
            "gemini-2.5-pro",
            "gemini-2.5-flash",
        ]
    },
    {
        key: "google", label: "Google Generative AI", models: [
            "gemini-2.5-pro",
            "gemini-2.5-flash",
        ]
    },
    {
        key: "azure", label: "Azure OpenAI", models: [
            "gpt-5.1",
            "gpt-5",
            "gpt-4.1"
        ]
    },
];