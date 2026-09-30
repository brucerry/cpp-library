export const CACHE_PREFIX = "cpp-library:";
export const CACHE_KEY = `${CACHE_PREFIX}index:v2`;
export const standards = ["98", "03", "11", "14", "17", "20", "23"];
export const year = (value) =>
    ({ 98: 1998, "03": 2003 })[value] || 2000 + Number(value);

export function validIndex(data) {
    return (
        data?.schemaVersion === 2 &&
        Number.isFinite(Date.parse(data.syncedAt)) &&
        /^[a-f0-9]{64}$/.test(data.archiveSha256) &&
        (data.development === undefined ||
            (Number.isFinite(Date.parse(data.development.checkedAt)) &&
                Array.isArray(data.development.editions) &&
                data.development.editions.every(
                    (item) =>
                        /^\d{2}$/.test(item.version) &&
                        !standards.includes(item.version) &&
                        item.status === "Under development" &&
                        item.source === "https://isocpp.org/std/status" &&
                        item.draft === "https://github.com/cplusplus/draft",
                ))) &&
        Array.isArray(data.libraries) &&
        data.libraries.length > 0 &&
        data.libraries.every(
            (library) =>
                /^[a-z0-9_.]+$/.test(library.header) &&
                /^[a-z0-9_-]+$/.test(library.id) &&
                standards.includes(library.introduced),
        ) &&
        Array.isArray(data.entries) &&
        data.entries.length > 0 &&
        new Set(data.entries.map((entry) => entry.id)).size ===
            data.entries.length &&
        data.entries.every(
            (entry) =>
                /^ref-[a-f0-9]{16}$/.test(entry.id) &&
                typeof entry.name === "string" &&
                typeof entry.summary === "string" &&
                standards.includes(entry.introduced) &&
                Array.isArray(entry.headers) &&
                entry.headers.length > 0 &&
                entry.headers.every((header) =>
                    data.libraries.some((library) => library.header === header),
                ) &&
                /^reference\/v\d+\/ref-[a-f0-9]{16}-[a-f0-9]{16}\.json$/.test(
                    entry.detail,
                ),
        )
    );
}

export function readCache(storage) {
    try {
        const data = JSON.parse(storage.getItem(CACHE_KEY));
        if (validIndex(data)) return data;
        storage.removeItem(CACHE_KEY);
    } catch {
        /* Private browsing and storage quota failures must not block reading. */
    }
    return null;
}

export function clearCache(storage) {
    try {
        const keys = [];
        for (let index = 0; index < storage.length; index++) {
            const key = storage.key(index);
            if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
        }
        for (const key of keys) storage.removeItem(key);
    } catch {
        /* Cleanup is best effort when browser storage is restricted. */
    }
}

async function getJson(url) {
    const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function fetchIndex(base, storage) {
    const data = await getJson(`${base}data/library-index.json`);
    if (!validIndex(data)) throw new Error("Invalid library index");
    try {
        storage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
        /* The current copy stays usable in memory. */
    }
    return data;
}

export function validDetail(data, entry) {
    return (
        data?.id === entry.id &&
        typeof data.name === "string" &&
        typeof data.intro === "string" &&
        Array.isArray(data.declarations) &&
        data.declarations.length > 0 &&
        data.declarations.every(
            (item) =>
                typeof item.code === "string" && typeof item.notes === "string",
        ) &&
        Array.isArray(data.examples) &&
        data.examples.every(
            (item) =>
                typeof item.code === "string" &&
                (item.output === null || typeof item.output === "string"),
        ) &&
        (data.recommendedExamples === undefined ||
            (Array.isArray(data.recommendedExamples) &&
                data.recommendedExamples.every(
                    (item) =>
                        typeof item.code === "string" &&
                        (item.output === null ||
                            typeof item.output === "string") &&
                        /^ref-[a-f0-9]{16}$/.test(item.recommendation?.id) &&
                        typeof item.recommendation?.name === "string" &&
                        ["same type or topic", "same header"].includes(
                            item.recommendation?.relationship,
                        ) &&
                        /^https:\/\/en\.cppreference\.com\/w\/cpp\//.test(
                            item.recommendation?.source,
                        ),
                ))) &&
        Array.isArray(data.sections) &&
        data.sections.every(
            (item) =>
                typeof item.title === "string" && typeof item.text === "string",
        ) &&
        /^https:\/\/en\.cppreference\.com\/w\/cpp\//.test(data.source)
    );
}

export async function fetchDetail(base, storage, entry) {
    const key = `${CACHE_PREFIX}${entry.detail}`;
    try {
        const data = JSON.parse(storage.getItem(key));
        if (validDetail(data, entry)) return data;
    } catch {
        /* Fall through to a fresh request. */
    }
    const data = await getJson(`${base}data/${entry.detail}`);
    if (!validDetail(data, entry)) throw new Error("Invalid function page");
    try {
        // Bound detail storage; keep the index and newest pages under normal quotas.
        const keys = [];
        for (let index = 0; index < storage.length; index++) {
            const existing = storage.key(index);
            if (existing?.startsWith(`${CACHE_PREFIX}reference/`))
                keys.push(existing);
        }
        while (keys.length >= 24) storage.removeItem(keys.shift());
        storage.setItem(key, JSON.stringify(data));
    } catch {
        /* Reading still works when session storage is full. */
    }
    return data;
}

export function inEdition(entry, selected, mode = "introduced") {
    if (selected === "all") return true;
    if (mode === "introduced") return entry.introduced === selected;
    return (
        year(entry.introduced) <= year(selected) &&
        (!entry.removed || year(entry.removed) > year(selected))
    );
}
