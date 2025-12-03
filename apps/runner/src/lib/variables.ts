export const applyVariablesToMessages = (input: string, variables: Record<string, string>) => {

    // Plug in all variables in input string
    for (const [key, value] of Object.entries(variables)) {
        // Escape the value to prevent interference with parent JSON
        // JSON.stringify will properly escape quotes, backslashes, and other special characters
        const escapedValue = JSON.stringify(value).slice(1, -1);
        input = input.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), escapedValue);
    }

    return input;
}