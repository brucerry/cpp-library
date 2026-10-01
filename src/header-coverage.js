// Labels for headers whose content is presented as an imported overview.
const labels = {
    climits: "Integer limit macros",
    cstdint: "Integer types & macros",
    numbers: "Mathematical constants",
    stdfloat: "Floating-point types",
    version: "Feature-test macros",
    iosfwd: "Forward declarations",
    ciso646: "Empty compatibility header",
    "iso646.h": "Empty compatibility header",
    cstdalign: "Compatibility macros",
    "stdalign.h": "Compatibility macros",
    cstdbool: "Compatibility macros",
    "stdbool.h": "Compatibility macros",
};

export function headerCoverage(library) {
    return {
        label:
            labels[library.header] ||
            labels[library.aliasOf] ||
            "Header overview",
    };
}
