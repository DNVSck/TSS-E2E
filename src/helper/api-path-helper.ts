/** The names a template asks for, read off the template itself. */
type PathParam<S extends string> =
    S extends `${string}{${infer Name}}${infer Rest}` ? Name | PathParam<Rest> : never;

const PLACEHOLDER = /\{([^}]+)\}/g;

/**
 * Fill a template's placeholders.
 *
 * Not `template.replace('{name}', value)`, which this replaces for three reasons that
 * all fail silently: it substitutes only the FIRST occurrence, it pastes the value in
 * raw so a reference carrying a space or an ampersand addresses something else, and it
 * cannot tell a caller that a placeholder was left behind.
 *
 * The parameter names are read off the template by the compiler, so a wrong or missing
 * one is a build error rather than a `{reference}` sent to the server.
 *
 * Shared by every API family's path catalogue - it knows nothing about any of them.
 */
export function buildPath<S extends string>(
    template: S,
    params: Record<PathParam<S>, string> = {} as Record<PathParam<S>, string>
): string {
    const filled = template.replaceAll(PLACEHOLDER, (whole, name: string) => {
        const value = (params as Record<string, string>)[name];
        return value === undefined ? whole : encodeURIComponent(value);
    });

    const missing = [...filled.matchAll(PLACEHOLDER)].map(match => match[0]);

    if (missing.length > 0) {
        throw new Error(
            `The path "${template}" still carries ${missing.join(', ')} after being filled `
            + `in, so the request would ask the service for a literal placeholder. Pass `
            + `every name the template asks for.`
        );
    }

    return filled;
}
