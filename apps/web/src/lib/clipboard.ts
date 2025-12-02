import { addToast } from "@heroui/react";

export const copyToClipboard = (text: string) => {
    try {
        navigator.clipboard.writeText(text);
        addToast({
            title: "Copied!",
            color: "success"
        })
    } catch {
        addToast({
            title: "Unable to copy to clipboard.",
            color: "danger",
        })
    }
};