const sample = (version, headers, body) => ({
    version,
    example:
        headers.map((header) => `#include <${header}>`).join("\n") +
        `\n\nint main() {\n${body
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}\n}\n`,
    output: "",
});
export const headerExamples = {
    climits: sample(
        "98",
        ["climits", "cassert"],
        `assert(CHAR_BIT >= 8);
int count = INT_MAX;
// Check the limit before incrementing, to avoid signed overflow.
if (count < INT_MAX) ++count;
assert(count == INT_MAX);
assert(INT_MIN < 0);`,
    ),
    cstdint: sample(
        "11",
        ["cstdint", "cassert"],
        `std::uint_least32_t value = UINT32_C(4000000000);
assert(value >= UINT32_C(4000000000));
assert(UINT_LEAST32_MAX >= value);`,
    ),
    numbers: sample(
        "20",
        ["numbers", "cassert"],
        `constexpr double radius = 2.0;
constexpr double area = std::numbers::pi * radius * radius;
static_assert(area > 12.56 && area < 12.57);
constexpr long double root = std::numbers::sqrt2_v<long double>;
assert(root > 1.414L && root < 1.415L);`,
    ),
    stdfloat: sample(
        "23",
        ["stdfloat", "cassert"],
        `// Fixed-width floating-point types are optional.
#ifdef __STDCPP_FLOAT32_T__
std::float32_t value = 1.5f;
assert(value > 1.0f);
#endif`,
    ),
    version: sample(
        "20",
        ["version", "vector", "cassert"],
        `#if defined(__cpp_lib_erase_if) && __cpp_lib_erase_if >= 202002L
std::vector<int> values{1, 2, 3};
std::erase_if(values, [](int n) { return n % 2 == 0; });
assert(values.size() == 2);
#endif`,
    ),
    iosfwd: sample(
        "98",
        ["iosfwd", "sstream", "cassert"],
        `// <iosfwd> lets interfaces declare references without defining stream types.
std::ostream* stream = 0;
std::ostringstream buffer;
stream = &buffer;
*stream << 42;
assert(buffer.str() == "42");`,
    ),
    ciso646: sample(
        "98",
        ["ciso646", "cassert"],
        `// Alternative operator spellings are language keywords in C++.
// This compatibility header adds no macros.
bool enabled = true and not false;
assert(enabled);`,
    ),
    cstdalign: sample(
        "11",
        ["cstdalign", "cassert"],
        `// alignas and alignof are language keywords in C++.
alignas(16) unsigned char bytes[16]{};
static_assert(alignof(decltype(bytes)) >= 1);
assert(sizeof(bytes) == 16);`,
    ),
    cstdbool: sample(
        "11",
        ["cstdbool", "cassert"],
        `// bool, true, and false are built into the C++ language.
bool enabled = true;
assert(enabled != false);`,
    ),
};
