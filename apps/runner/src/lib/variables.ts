export const applyVariablesToMessages = (input: string, variables: Record<string, string>) => {

    // Plug in all variables in input string
    for (const [key, value] of Object.entries(variables)) {
        input = input.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    }

    return input;
}