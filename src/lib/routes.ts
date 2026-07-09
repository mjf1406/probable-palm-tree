export const joinSearchDefaults = { code: "" } as const;

export const loginSearchDefaults = { redirect: "/" } as const;

function getOrigin() {
    return typeof window !== "undefined" ? window.location.origin : "";
}

export function getJoinPageUrl() {
    return `${getOrigin()}/join`;
}

export function getJoinUrl(code: string) {
    return `${getJoinPageUrl()}?code=${code}`;
}
