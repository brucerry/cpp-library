// The header inventory includes facilities documented in overview/synopsis
// pages, which the declaration-table importer does not currently index.
const descriptions = {
    climits: {
        label: "Integer limit macros",
        explanation:
            "This header defines integer limit macros. Their shared reference overview has no standalone declaration table, so those macros are not indexed as separate reference pages here.",
    },
    cstdint: {
        label: "Integer types & macros",
        explanation:
            "This header defines integer type aliases and limit macros. Their shared reference overview is excluded by the declaration-table importer; a zero page count does not mean the header has no facilities.",
    },
    numbers: {
        label: "Mathematical constants",
        explanation:
            "This header provides mathematical constants. The archive documents them on a shared overview page that the declaration-table importer currently skips.",
    },
    stdfloat: {
        label: "Floating-point types",
        explanation:
            "This header provides floating-point type aliases. They are documented in the header synopsis rather than standalone declaration pages in this index.",
    },
    version: {
        label: "Feature-test macros",
        explanation:
            "This header supplies library feature-test macros. The macro reference overview is not imported as a standalone declaration page.",
    },
    iosfwd: {
        label: "Forward declarations",
        explanation:
            "This header provides forward declarations for input/output classes and related aliases. The importer excludes header synopsis pages, so these declarations are not indexed as separate reference pages here.",
    },
};
for (const header of ["ciso646", "iso646.h"])
    descriptions[header] = {
        label: "Empty compatibility header",
        explanation:
            "This compatibility header has no effect in C++. There are no standalone facilities to list; the C alternative operator spellings are already C++ keywords.",
    };
for (const header of ["cstdalign", "stdalign.h", "cstdbool", "stdbool.h"])
    descriptions[header] = {
        label: "Compatibility macros",
        explanation:
            "This compatibility header defines a compatibility macro rather than standalone functions. Its contents are documented in the header synopsis, which the importer does not index as a reference page.",
    };

export function headerCoverage(library) {
    return (
        descriptions[library.header] ||
        descriptions[library.aliasOf] || {
            label: "Coverage pending",
            explanation:
                "This header is in the released header inventory, but no reference pages are indexed for it in the selected version. This is a coverage gap, not evidence that the header has no facilities.",
        }
    );
}
