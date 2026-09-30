// Original, compiler-checked examples supplement pages without an upstream sample.
// A shared example is attached only to pages whose operation it demonstrates.
const sample = (id, version, headers, body, output, paths, input) => ({
    id,
    version,
    paths,
    input,
    example:
        headers.map((header) => `#include <${header}>`).join("\n") +
        `\n\nint main() {\n${body
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}\n}\n`,
    output,
});

export const supplementalExamples = [
    sample(
        "atomic-value",
        "11",
        ["atomic", "iostream"],
        'std::atomic<int> count{4};\ncount.store(8);\nstd::cout << count.load() << "\\n";\ncount = 10;\nint previous = count.exchange(12);\nstd::cout << previous << " -> " << static_cast<int>(count) << "\\n";',
        "8\n10 -> 12\n",
        [
            "atomic/atomic/atomic",
            "atomic/atomic/store",
            "atomic/atomic/load",
            "atomic/atomic/operator=",
            "atomic/atomic/operator_T",
            "atomic/atomic/exchange",
        ],
        "A shared counter starts at 4, then receives 8, 10, and 12.",
    ),
    sample(
        "atomic-bits",
        "11",
        ["atomic", "iostream"],
        'std::atomic<unsigned> flags{12}; // Binary 1100\nstd::cout << flags.fetch_and(10) << " -> " << flags.load() << "\\n";\nstd::cout << flags.fetch_or(3) << " -> " << flags.load() << "\\n";\nstd::cout << flags.fetch_xor(1) << " -> " << flags.load() << "\\n";\nflags &= 7;\nflags |= 4;\nflags ^= 1;\nstd::cout << flags.load() << "\\n";',
        "12 -> 8\n8 -> 11\n11 -> 10\n7\n",
        [
            "atomic/atomic/fetch_and",
            "atomic/atomic/fetch_or",
            "atomic/atomic/fetch_xor",
            "atomic/atomic/operator_arith3",
        ],
        "A bit mask of 12 and masks of 10, 3, and 1. Fetch operations return the previous value.",
    ),
    sample(
        "atomic-arithmetic",
        "11",
        ["atomic", "iostream"],
        'std::atomic<int> stock{20};\nstd::cout << stock.fetch_add(5) << " -> " << stock.load() << "\\n";\nstd::cout << stock.fetch_sub(3) << " -> " << stock.load() << "\\n";\nstock += 2;\nstock -= 4;\n++stock;\n--stock;\nstd::cout << stock.load() << "\\n";',
        "20 -> 25\n25 -> 22\n20\n",
        [
            "atomic/atomic/fetch_add",
            "atomic/atomic/fetch_sub",
            "atomic/atomic/operator_arith",
            "atomic/atomic/operator_arith2",
        ],
        "A stock count of 20 is increased and decreased atomically.",
    ),
    sample(
        "atomic-free-functions",
        "11",
        ["atomic", "iostream"],
        'std::atomic<int> counter{0};\nstd::atomic_store(&counter, 7);\nstd::cout << std::atomic_load(&counter) << "\\n";\nstd::atomic_store_explicit(&counter, 9, std::memory_order_seq_cst);\nstd::cout << std::atomic_load_explicit(&counter, std::memory_order_seq_cst) << "\\n";\nstd::atomic_init(&counter, 11);\nstd::cout << counter.load() << "\\n";',
        "7\n9\n11\n",
        ["atomic/atomic_store", "atomic/atomic_load", "atomic/atomic_init"],
        "A counter receives 7, 9, and 11. Initialization occurs without any concurrent access.",
    ),
    sample(
        "atomic-free-xor",
        "11",
        ["atomic", "iostream"],
        'std::atomic<unsigned> flags{10};\nstd::cout << std::atomic_fetch_xor(&flags, 3u) << " -> " << flags.load() << "\\n";\nstd::cout << std::atomic_fetch_xor_explicit(&flags, 1u, std::memory_order_seq_cst) << " -> " << flags.load() << "\\n";',
        "10 -> 9\n9 -> 8\n",
        ["atomic/atomic_fetch_xor"],
        "A bit mask starts at 10. Toggle the bits selected by 3, then by 1.",
    ),
    sample(
        "atomic-flag",
        "20",
        ["atomic", "iostream"],
        'std::atomic_flag busy{};\nstd::cout << std::boolalpha << busy.test() << "\\n";\nstd::cout << busy.test_and_set() << " -> " << busy.test() << "\\n";\nbusy.clear();\nstd::cout << busy.test() << "\\n";',
        "false\nfalse -> true\nfalse\n",
        [
            "atomic/atomic_flag/atomic_flag",
            "atomic/atomic_flag/clear",
            "atomic/atomic_flag/test",
            "atomic/atomic_flag/test_and_set",
        ],
        "A flag starts clear. Setting it returns the old value; clearing it makes it false again.",
    ),
    sample(
        "atomic-flag-free",
        "20",
        ["atomic", "iostream"],
        'std::atomic_flag flag{};\nstd::atomic_flag_test_and_set(&flag);\nstd::cout << std::boolalpha << std::atomic_flag_test(&flag) << "\\n";\nstd::atomic_flag_clear(&flag);\nstd::cout << std::atomic_flag_test_explicit(&flag, std::memory_order_seq_cst) << "\\n";\nstd::atomic_flag_clear_explicit(&flag, std::memory_order_seq_cst);',
        "true\nfalse\n",
        ["atomic/atomic_flag_clear", "atomic/atomic_flag_test"],
        "A flag is set, tested, and cleared with the non-member functions.",
    ),
    sample(
        "atomic-notification",
        "20",
        ["atomic", "iostream", "thread"],
        'std::atomic<int> ready{0};\nstd::jthread worker([&] {\n    ready.store(42);\n    ready.notify_one();\n    ready.notify_all();\n});\nready.wait(0);\nworker.join();\nstd::cout << ready.load() << "\\n";',
        "42\n",
        [
            "atomic/atomic/wait",
            "atomic/atomic/notify_one",
            "atomic/atomic/notify_all",
        ],
        "A worker publishes 42. The reader waits while the shared value is still 0.",
    ),
    sample(
        "atomic-free-notification",
        "20",
        ["atomic", "iostream", "thread"],
        'std::atomic<int> ready{0};\nstd::jthread worker([&] {\n    ready.store(42);\n    std::atomic_notify_one(&ready);\n    std::atomic_notify_all(&ready);\n});\nstd::atomic_wait(&ready, 0);\nstd::atomic_wait_explicit(&ready, 0, std::memory_order_seq_cst);\nworker.join();\nstd::cout << ready.load() << "\\n";',
        "42\n",
        [
            "atomic/atomic_wait",
            "atomic/atomic_notify_one",
            "atomic/atomic_notify_all",
        ],
        "The free functions wait for a shared value to change from 0 to 42.",
    ),
    sample(
        "flag-notification",
        "20",
        ["atomic", "iostream", "thread"],
        'std::atomic_flag ready{};\nstd::jthread worker([&] {\n    ready.test_and_set();\n    ready.notify_one();\n    ready.notify_all();\n});\nready.wait(false);\nworker.join();\nstd::cout << std::boolalpha << ready.test() << "\\n";',
        "true\n",
        [
            "atomic/atomic_flag/wait",
            "atomic/atomic_flag/notify_one",
            "atomic/atomic_flag/notify_all",
        ],
        "The reader waits until the worker sets a flag.",
    ),
    sample(
        "flag-free-notification",
        "20",
        ["atomic", "iostream", "thread"],
        'std::atomic_flag ready{};\nstd::jthread worker([&] {\n    ready.test_and_set();\n    std::atomic_flag_notify_one(&ready);\n    std::atomic_flag_notify_all(&ready);\n});\nstd::atomic_flag_wait(&ready, false);\nstd::atomic_flag_wait_explicit(&ready, false, std::memory_order_seq_cst);\nworker.join();\nstd::cout << std::boolalpha << ready.test() << "\\n";',
        "true\n",
        [
            "atomic/atomic_flag_wait",
            "atomic/atomic_flag_notify_one",
            "atomic/atomic_flag_notify_all",
        ],
        "The non-member waiting functions observe the worker setting the flag.",
    ),
    sample(
        "expected-value",
        "23",
        ["expected", "iostream", "string"],
        'std::expected<int, std::string> result{42};\nstd::cout << std::boolalpha << result.has_value() << "\\n";\nstd::cout << result.value() << "\\n";\nstd::expected<int, std::string> failed{std::unexpected(std::string{"Missing input"})};\nstd::cout << failed.error() << "\\n";\nstd::cout << failed.value_or(0) << "\\n";',
        "true\n42\nMissing input\n0\n",
        [
            "utility/expected/expected",
            "utility/expected/value",
            "utility/expected/error",
            "utility/expected/value_or",
            "utility/expected/operator_bool",
        ],
        "One result contains 42. Another contains the error message “Missing input”.",
    ),
    sample(
        "expected-monadic",
        "23",
        ["expected", "iostream", "string"],
        'std::expected<int, std::string> value{6};\nauto doubled = value.transform([](int number) { return number * 2; });\nauto next = doubled.and_then([](int number) -> std::expected<int, std::string> {\n    return number + 1;\n});\nstd::expected<int, std::string> failed{std::unexpected(std::string{"bad"})};\nauto labeled = failed.transform_error([](const std::string& error) {\n    return "Error: " + error;\n});\nauto recovered = labeled.or_else([](const std::string&) -> std::expected<int, std::string> {\n    return 0;\n});\nstd::cout << next.value() << "\\n" << labeled.error() << "\\n" << recovered.value() << "\\n";',
        "13\nError: bad\n0\n",
        [
            "utility/expected/transform",
            "utility/expected/and_then",
            "utility/expected/transform_error",
            "utility/expected/or_else",
        ],
        "A successful value of 6 is doubled and incremented. A failed result is labeled and recovered.",
    ),
];

// atomic_ref operates on an existing object. The same operations have the same
// observable results; alignment is supplied explicitly as required by the type.
for (const original of supplementalExamples.slice(0, 3)) {
    const unsigned = original.id === "atomic-bits";
    const type = unsigned ? "unsigned" : "int";
    const example = original.example.replace(
        new RegExp(`std::atomic<${type}> (\\w+)\\{(\\d+)\\};`),
        `alignas(std::atomic_ref<${type}>::required_alignment) ${type} storage{$2};\n    std::atomic_ref<${type}> $1{storage};`,
    );
    supplementalExamples.push({
        ...original,
        id: original.id.replace("atomic-", "atomic-ref-"),
        version: "20",
        example,
        paths: original.paths
            .map((path) => path.replace("atomic/atomic/", "atomic/atomic_ref/"))
            .filter((path) => !path.endsWith("/atomic")),
    });
}
