const FORM_ACTION = /<form[^>]*action="([^"]+)"/i;
const HIDDEN_INPUT = /<input[^>]*type="hidden"[^>]*>/gi;
const INPUT_NAME = /name="([^"]+)"/i;
const INPUT_VALUE = /value="([^"]*)"/i;
const ENTITY = /&(?:amp|quot|lt|gt|#39|#x27|#x2F);/gi;

const ENTITIES: Record<string, string> = {
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2f;': '/',
    '&lt;': '<',
    '&gt;': '>',
};

export function formAction(html: string): string | undefined {
    return decodeEntities(FORM_ACTION.exec(html)?.[1]);
}

export function hiddenFields(html: string): Record<string, string> {
    const fields: Record<string, string> = {};

    for (const input of html.matchAll(HIDDEN_INPUT)) {
        const name = INPUT_NAME.exec(input[0])?.[1];
        const value = INPUT_VALUE.exec(input[0])?.[1];

        if (name) {
            fields[name] = decodeEntities(value) ?? '';
        }
    }

    return fields;
}

export function hasField(html: string, name: string): boolean {
    return new RegExp(`name="${name}"`, 'i').test(html);
}

function decodeEntities(value?: string): string | undefined {
    return value?.replaceAll(ENTITY, entity => ENTITIES[entity.toLowerCase()] ?? entity);
}
