// Original examples. Explicit path lists keep each example tied to APIs it uses.
export const familyExamples = [];
function add(
    id,
    version,
    headers,
    body,
    paths,
    input,
    output = "Checks passed\n",
) {
    familyExamples.push({
        id: `family-${id}`,
        version,
        paths,
        input,
        output,
        example:
            [...new Set([...headers, "cassert", "iostream"])]
                .map((header) => `#include <${header}>`)
                .join("\n") +
            `\n\nint main() {\n${body
                .split("\n")
                .map((line) => `    ${line}`)
                .join("\n")}\n    std::cout << "Checks passed\\n";\n}\n`,
    });
}
const under = (root, names) => names.map((name) => `${root}/${name}`);

const distributions = {
    bernoulli_distribution: ["std::bernoulli_distribution", "0.5", ["p"]],
    binomial_distribution: [
        "std::binomial_distribution<int>",
        "10, 0.5",
        ["t", "p"],
    ],
    cauchy_distribution: [
        "std::cauchy_distribution<double>",
        "0.0, 1.0",
        ["a", "b"],
    ],
    chi_squared_distribution: [
        "std::chi_squared_distribution<double>",
        "2.0",
        ["n"],
    ],
    discrete_distribution: [
        "std::discrete_distribution<int>",
        "{1, 2, 3}",
        ["probabilities"],
    ],
    exponential_distribution: [
        "std::exponential_distribution<double>",
        "2.0",
        ["lambda"],
    ],
    extreme_value_distribution: [
        "std::extreme_value_distribution<double>",
        "0.0, 1.0",
        ["a", "b"],
    ],
    fisher_f_distribution: [
        "std::fisher_f_distribution<double>",
        "2.0, 3.0",
        ["m", "n"],
    ],
    gamma_distribution: [
        "std::gamma_distribution<double>",
        "2.0, 1.0",
        ["alpha", "beta"],
    ],
    geometric_distribution: ["std::geometric_distribution<int>", "0.5", ["p"]],
    lognormal_distribution: [
        "std::lognormal_distribution<double>",
        "0.0, 1.0",
        ["m", "s"],
    ],
    negative_binomial_distribution: [
        "std::negative_binomial_distribution<int>",
        "3, 0.5",
        ["k", "p"],
    ],
    normal_distribution: [
        "std::normal_distribution<double>",
        "0.0, 1.0",
        ["mean", "stddev"],
    ],
    piecewise_constant_distribution: [
        "std::piecewise_constant_distribution<double>",
        "{0.0, 1.0, 2.0}, [](double) { return 1.0; }",
        ["intervals", "densities"],
    ],
    piecewise_linear_distribution: [
        "std::piecewise_linear_distribution<double>",
        "{0.0, 1.0, 2.0}, [](double) { return 1.0; }",
        ["intervals", "densities"],
    ],
    poisson_distribution: ["std::poisson_distribution<int>", "4.0", ["mean"]],
    student_t_distribution: [
        "std::student_t_distribution<double>",
        "3.0",
        ["n"],
    ],
    uniform_int_distribution: [
        "std::uniform_int_distribution<int>",
        "1, 6",
        ["a", "b"],
    ],
    uniform_real_distribution: [
        "std::uniform_real_distribution<double>",
        "0.0, 1.0",
        ["a", "b"],
    ],
    weibull_distribution: [
        "std::weibull_distribution<double>",
        "2.0, 1.0",
        ["a", "b"],
    ],
};
for (const [name, [type, args, accessors]] of Object.entries(distributions)) {
    add(
        name,
        "11",
        ["random", "sstream"],
        `using Distribution = ${type};
std::mt19937 engine{42};
Distribution distribution(${args});
auto parameters = distribution.param();
Distribution copy(parameters);
assert(copy == distribution);
${accessors.map((method) => `assert(copy.${method}() == distribution.${method}());`).join("\n")}
auto value = distribution(engine);
assert(value >= distribution.min() && value <= distribution.max());
// Replace the parameters, then discard any cached random values.
distribution.param(parameters);
distribution.reset();
// Save and restore the complete distribution state.
std::stringstream saved;
saved << distribution;
saved >> copy;
assert(copy == distribution);`,
        [
            `numeric/random/${name}`,
            ...under(`numeric/random/${name}`, [
                name,
                "operator()",
                "operator_cmp",
                "operator_ltltgtgt",
                "param",
                "params",
                "reset",
                "min",
                "max",
                ...accessors,
            ]),
        ],
        "Seed 42 and the parameters shown below. Assertions check the range and state; random values vary between library implementations.",
    );
}
const engines = {
    linear_congruential_engine: "std::minstd_rand",
    mersenne_twister_engine: "std::mt19937",
    subtract_with_carry_engine: "std::ranlux24_base",
    discard_block_engine: "std::discard_block_engine<std::minstd_rand, 10, 5>",
    independent_bits_engine:
        "std::independent_bits_engine<std::minstd_rand, 16, unsigned>",
    shuffle_order_engine: "std::shuffle_order_engine<std::minstd_rand, 16>",
};
for (const [name, type] of Object.entries(engines)) {
    const adaptor = /block|bits|shuffle/.test(name);
    add(
        name,
        "11",
        ["random", "sstream"],
        `using Engine = ${type};
Engine engine{42};
Engine copy{42};
assert(engine == copy);
auto value = engine();
assert(value >= Engine::min() && value <= Engine::max());
engine.seed(42);
engine.discard(3);
for (int i = 0; i < 3; ++i) { (void)copy(); }
assert(engine == copy);
${adaptor ? "(void)engine.base(); // Inspect the underlying engine without advancing it." : ""}
std::stringstream saved;
saved << engine;
saved >> copy;
assert(copy == engine);`,
        [
            `numeric/random/${name}`,
            ...under(`numeric/random/${name}`, [
                name,
                "operator()",
                "operator_cmp",
                "operator_ltltgtgt",
                "seed",
                "discard",
                "min",
                "max",
                ...(adaptor ? ["base"] : []),
            ]),
        ],
        "Two engines start with seed 42. Advancing one by discard(3) matches three calls to the other.",
    );
}
const functors = {
    plus: ["8, 2", "10"],
    minus: ["8, 2", "6"],
    multiplies: ["8, 2", "16"],
    divides: ["8, 2", "4"],
    modulus: ["8, 3", "2"],
    negate: ["8", "-8"],
    equal_to: ["8, 8", "true"],
    not_equal_to: ["8, 2", "true"],
    greater: ["8, 2", "true"],
    greater_equal: ["8, 8", "true"],
    less_equal: ["2, 8", "true"],
    less: ["2, 8", "true"],
    logical_and: ["true, false", "false"],
    logical_or: ["true, false", "true"],
    logical_not: ["false", "true"],
    bit_and: ["12, 10", "8"],
    bit_or: ["12, 3", "15"],
    bit_xor: ["12, 10", "6"],
    bit_not: ["0u", "~0u"],
};
for (const [name, [args, expected]] of Object.entries(functors)) {
    const version = name === "bit_not" ? "14" : "11";
    add(
        `functor-${name}`,
        version,
        ["functional"],
        `auto result = std::${name}<${name === "bit_not" ? "unsigned" : "int"}>{}(${args});
assert(result == ${expected});`,
        [`utility/functional/${name}`],
        `Apply ${name} to ${args}.`,
    );
    add(
        `transparent-${name}`,
        "14",
        ["functional"],
        `auto result = std::${name}<>{}(${args});
assert(result == ${expected});`,
        [`utility/functional/${name}_void`],
        `The transparent function object deduces its argument types from ${args}.`,
    );
    if (
        /^(equal_to|not_equal_to|greater|greater_equal|less|less_equal)$/.test(
            name,
        )
    ) {
        add(
            `ranges-${name}`,
            "20",
            ["functional"],
            `assert(std::ranges::${name}{}(${args}) == ${expected});`,
            [`utility/functional/ranges/${name}`],
            `Compare ${args} using a constrained function object.`,
        );
    }
}
const concepts = {
    common_reference_with: "int&, const int&",
    common_with: "int, long",
    constructible_from: "int, short",
    convertible_to: "int, double",
    copy_constructible: "int",
    copyable: "int",
    default_initializable: "int",
    destructible: "int",
    equality_comparable: "int",
    equivalence_relation: "std::equal_to<>, int, int",
    invocable: "std::plus<>, int, int",
    movable: "int",
    move_constructible: "int",
    predicate: "std::less<>, int, int",
    relation: "std::less<>, int, int",
    strict_weak_order: "std::less<>, int, int",
    swappable: "int",
    totally_ordered: "int",
};
for (const [name, args] of Object.entries(concepts)) {
    add(
        `concept-${name}`,
        "20",
        ["concepts", "functional"],
        `// The compiler verifies this requirement before the program runs.
static_assert(std::${name}<${args}>);`,
        [`concepts/${name}`],
        `Check ${name} for ${args}.`,
    );
}
const iteratorConcepts = {
    bidirectional_iterator: "int*",
    contiguous_iterator: "int*",
    forward_iterator: "int*",
    incrementable: "int*",
    indirect_binary_predicate: "std::less<>, int*, int*",
    indirect_equivalence_relation: "std::equal_to<>, int*, int*",
    indirect_strict_weak_order: "std::less<>, int*, int*",
    indirect_unary_predicate: "std::logical_not<>, int*",
    indirectly_comparable: "int*, int*, std::equal_to<>",
    indirectly_copyable: "int*, int*",
    indirectly_copyable_storable: "int*, int*",
    indirectly_movable: "int*, int*",
    indirectly_movable_storable: "int*, int*",
    indirectly_readable: "int*",
    indirectly_swappable: "int*, int*",
    indirectly_writable: "int*, int",
    input_iterator: "int*",
    input_or_output_iterator: "int*",
    mergeable: "int*, int*, int*",
    output_iterator: "int*, int",
    permutable: "int*",
    sentinel_for: "int*, int*",
    sized_sentinel_for: "int*, int*",
    sortable: "int*",
    weakly_incrementable: "int*",
};
for (const [name, args] of Object.entries(iteratorConcepts)) {
    add(
        `iterator-${name}`,
        "20",
        ["iterator", "functional"],
        `static_assert(std::${name}<${args}>);
int values[]{3, 7};
int* position = values;
assert(*position == 3);
++position;
assert(*position == 7);`,
        [`iterator/${name}`],
        `An int pointer iterates over {3, 7} and satisfies ${name}.`,
    );
}
for (const type of ["map", "multimap", "set", "multiset"]) {
    const map = type.endsWith("map");
    const multi = type.startsWith("multi");
    add(
        `ordered-${type}`,
        "11",
        [map ? "map" : "set"],
        `std::${type}<int${map ? ", int" : ""}> values${map ? "{{1, 10}, {3, 30}}" : "{1, 3}"};
values.insert(${map ? "{2, 20}" : "2"});
values.emplace_hint(values.end(), ${map ? "4, 40" : "4"});
assert(values.count(2) == 1);
auto first = values.lower_bound(2);
auto last = values.upper_bound(2);
assert(${map ? "first->first" : "*first"} == 2);
assert(${map ? "last->first" : "*last"} == 3);
auto allocator = values.get_allocator();
(void)allocator;
${map ? "assert(values.value_comp()(*values.begin(), *first));" : ""}
// The container releases its storage automatically at the end of this scope.`,
        [
            `container/${type}`,
            ...under(`container/${type}`, [
                `~${type}`,
                "count",
                "lower_bound",
                "upper_bound",
                "get_allocator",
                "insert",
                "emplace_hint",
                ...(map ? ["value_compare"] : []),
            ]),
        ],
        `Find key 2 among keys 1, 2, 3, and 4. ${multi ? "This container also permits duplicate keys." : "Keys are unique."}`,
    );
}
for (const type of [
    "unordered_map",
    "unordered_multimap",
    "unordered_set",
    "unordered_multiset",
]) {
    const map = type.endsWith("map");
    add(
        type,
        "11",
        [map ? "unordered_map" : "unordered_set"],
        `std::${type}<int${map ? ", int" : ""}> values;
values.max_load_factor(0.75f);
values.reserve(20);
values.emplace(${map ? "2, 20" : "2"});
values.emplace_hint(values.end(), ${map ? "3, 30" : "3"});
values.insert(${map ? "{4, 40}" : "4"});
values.rehash(40);
assert(values.bucket_count() >= 40);
auto bucket = values.bucket(2);
assert(values.bucket_size(bucket) >= 1);
auto first = values.begin(bucket);
auto last = values.end(bucket);
assert(first != last);
assert(values.load_factor() <= values.max_load_factor());
assert(values.key_eq()(2, 2));
assert(values.hash_function()(2) == values.hash_function()(2));
assert(values.get_allocator() == values.get_allocator());
auto range = values.equal_range(2);
assert(range.first != range.second);
auto copy = values;
assert(copy == values);
${type === "unordered_map" ? "assert(values.at(2) == 20);" : ""}
// Destruction releases every node automatically.`,
        [
            `container/${type}`,
            ...under(`container/${type}`, [
                type,
                `~${type}`,
                "operator_cmp",
                "begin2",
                "end2",
                "bucket",
                "bucket_count",
                "bucket_size",
                "emplace",
                "emplace_hint",
                "equal_range",
                "get_allocator",
                "hash_function",
                "insert",
                "key_eq",
                "load_factor",
                "max_load_factor",
                "rehash",
                "reserve",
                ...(type === "unordered_map" ? ["at"] : []),
            ]),
        ],
        "Insert keys 2, 3, and 4, then inspect the bucket holding key 2. Bucket counts and iteration order are implementation-dependent.",
    );
}
for (const type of ["vector", "deque", "list", "forward_list"]) {
    const front = type !== "vector";
    add(
        `sequence-${type}`,
        "11",
        [type],
        `std::${type}<int> values{2, 3};
${front ? "values.emplace_front(1);\nassert(values.front() == 1);" : "values.push_back(4);\nassert(values.back() == 4);"}
${type === "forward_list" ? "auto before = values.before_begin();\nvalues.insert_after(before, 0);\nassert(values.front() == 0);" : ""}
auto allocator = values.get_allocator();
assert(allocator == values.get_allocator());
// All elements and their storage are released when values leaves this scope.`,
        [
            `container/${type}`,
            ...under(`container/${type}`, [
                `~${type}`,
                "get_allocator",
                ...(front ? ["emplace_front"] : []),
                ...(type === "forward_list" ? ["before_begin"] : []),
            ]),
        ],
        "Start with elements 2 and 3; add an element and inspect the container's allocator.",
    );
}
for (const type of ["queue", "stack", "priority_queue"]) {
    const queue = type === "queue";
    add(
        `adaptor-${type}`,
        "11",
        [queue || type === "priority_queue" ? "queue" : "stack"],
        `std::${type}<int> values;
values.push(2);
values.push(7);
assert(values.${queue ? "front" : "top"}() == ${queue ? 2 : 7});
${queue ? "assert(values.back() == 7);" : ""}
std::${type}<int> copy;
copy = values;
${type !== "priority_queue" ? "assert(copy == values);" : "assert(copy.top() == values.top());"}
values.pop();
assert(values.${queue ? "front" : "top"}() == ${queue ? 7 : 2});`,
        [
            `container/${type}`,
            ...under(`container/${type}`, [
                `~${type}`,
                "operator=",
                "pop",
                "push",
                ...(queue ? ["front", "back"] : []),
                ...(type !== "priority_queue" ? ["operator_cmp"] : []),
            ]),
        ],
        `Insert 2 and 7, then remove the ${queue ? "first" : "top"} element.`,
    );
}
for (const [name, type] of Object.entries({
    digits: "int",
    digits10: "int",
    radix: "int",
    is_bounded: "int",
    is_exact: "int",
    has_denorm: "double",
    has_denorm_loss: "double",
    has_quiet_NaN: "double",
    has_signaling_NaN: "double",
    is_iec559: "double",
    round_error: "double",
})) {
    const expr = `std::numeric_limits<${type}>::${name}${name === "round_error" ? "()" : ""}`;
    add(
        `limits-${name}`,
        "11",
        ["limits"],
        `auto property = ${expr};
// This property describes the current implementation; do not assume a fixed value.
(void)property;
assert(std::numeric_limits<${type}>::is_specialized);`,
        [`types/numeric_limits/${name}`],
        `Read ${name} for ${type}; the value can depend on the platform.`,
    );
}

const views = {
    adjacent_view: ["23", "std::views::adjacent<2>(values)", true, false],
    adjacent_transform_view: [
        "23",
        "std::views::adjacent_transform<2>(values, [](int a, int b) { return a + b; })",
        true,
        false,
    ],
    cartesian_product_view: [
        "23",
        "std::ranges::cartesian_product_view{values, values}",
        true,
        false,
    ],
    chunk_view: ["23", "std::ranges::chunk_view{values, 2}", true, false],
    chunk_by_view: [
        "23",
        "std::ranges::chunk_by_view{values, std::less<>{}}",
        false,
        false,
    ],
    common_view: [
        "20",
        "std::ranges::common_view{std::ranges::subrange(std::counted_iterator(values, 4), std::default_sentinel)}",
        true,
        true,
    ],
    drop_view: ["20", "std::ranges::drop_view{values, 1}", true, true],
    drop_while_view: [
        "20",
        "std::ranges::drop_while_view{values, [](int n) { return n < 5; }}",
        true,
        true,
    ],
    enumerate_view: ["23", "std::ranges::enumerate_view{values}", true, true],
    join_view: ["20", "std::ranges::join_view{nested}", false, true],
    join_with_view: [
        "23",
        "std::ranges::join_with_view{nested, 0}",
        false,
        true,
    ],
    slide_view: ["23", "std::ranges::slide_view{values, 2}", true, false],
    stride_view: ["23", "std::ranges::stride_view{values, 2}", true, true],
    take_view: ["20", "std::ranges::take_view{values, 3}", true, true],
    take_while_view: [
        "20",
        "std::ranges::take_while_view{values, [](int n) { return n < 9; }}",
        false,
        true,
    ],
    transform_view: [
        "20",
        "std::ranges::transform_view{values, [](int n) { return n * 2; }}",
        true,
        true,
    ],
    zip_view: ["23", "std::ranges::zip_view{values, values}", true, false],
    zip_transform_view: [
        "23",
        "std::ranges::zip_transform_view{[](int a, int b) { return a + b; }, values, values}",
        true,
        false,
    ],
    elements_view: ["20", "std::views::elements<0>(pairs)", true, true],
};
for (const [name, [version, expression, randomAccess, base]] of Object.entries(
    views,
)) {
    const root = `ranges/${name}`;
    add(
        `view-${name}`,
        version,
        ["ranges", "iterator", "functional", "utility"],
        `int values[]{3, 5, 7, 9};
[[maybe_unused]] int nested[][2]{{1, 2}, {3, 4}};
[[maybe_unused]] std::pair<int, int> pairs[]{{1, 10}, {2, 20}, {3, 30}};
auto view = ${expression};
auto position = view.begin();
auto finish = view.end();
assert(position != finish);
(void)*position;
auto copy = position;
assert(copy == position);
++position;
assert(position != copy);
${
    randomAccess
        ? `--position;
assert(position == copy);
position += 1;
position -= 1;
assert(position - copy == 0);
assert(copy + 1 > copy);
assert(1 + copy == copy + 1);
(void)position[0];`
        : ""
}
(void)std::ranges::iter_move(copy);
${base ? "(void)view.base();" : ""}
assert(std::ranges::distance(view) > 0);`,
        [
            root,
            ...under(root, [
                "deduction_guides",
                "begin",
                "end",
                name,
                "iterator",
                ...(base ? ["base"] : []),
            ]),
            ...under(`${root}/iterator`, [
                "iterator",
                "operator_star_",
                "operator_arith",
                "operator_cmp",
                "iter_move",
                ...(randomAccess ? ["operator_arith2", "operator_at"] : []),
            ]),
        ],
        `Build a ${name} over the arrays below, read the first item, and move to the next position.`,
    );
}
for (const type of ["istringstream", "ostringstream", "stringstream"]) {
    const read = type !== "ostringstream";
    const write = type !== "istringstream";
    add(
        `stream-${type}`,
        "11",
        ["sstream", "utility"],
        `std::${type} stream${read ? '{"42"}' : ""};
${write && !read ? "stream << 42;" : ""}
${read ? "int value{};\nstream >> value;\nassert(value == 42);" : 'assert(stream.str() == "42");'}
assert(stream.rdbuf() != nullptr);
std::${type} other;
other = std::move(stream);
other.swap(stream);
std::swap(other, stream);`,
        [
            `io/basic_${type}`,
            ...under(`io/basic_${type}`, [
                "operator=",
                "rdbuf",
                "swap",
                "swap2",
            ]),
        ],
        "Use an in-memory stream holding 42, then move and swap its state.",
    );
}
for (const type of ["ispanstream", "ospanstream", "spanstream"]) {
    const read = type !== "ospanstream";
    add(
        `stream-${type}`,
        "23",
        ["spanstream", "utility"],
        `char buffer[16] = "42";
std::${type} stream{std::span<char>{buffer}};
${read ? "int value{};\nstream >> value;\nassert(value == 42);" : "stream << 73;\nassert(buffer[0] == '7' && buffer[1] == '3');"}
assert(stream.rdbuf() != nullptr);
char backup[16]{};
std::${type} other{std::span<char>{backup}};
other = std::move(stream);
other.swap(stream);
std::swap(other, stream);`,
        [
            `io/basic_${type}`,
            ...under(`io/basic_${type}`, [
                `basic_${type}`,
                "operator=",
                "rdbuf",
                "swap",
                "swap2",
            ]),
        ],
        "Read or write a number using a fixed 16-character buffer that outlives the stream.",
    );
}
for (const type of [
    "day",
    "month",
    "year",
    "weekday",
    "year_month",
    "year_month_day",
    "year_month_day_last",
    "month_day",
    "month_day_last",
    "weekday_indexed",
    "weekday_last",
    "month_weekday",
    "month_weekday_last",
    "year_month_weekday",
    "year_month_weekday_last",
]) {
    const expressions = {
        day: "day{15}",
        month: "March",
        year: "year{2024}",
        weekday: "Friday",
        year_month: "year{2024} / March",
        year_month_day: "year{2024} / March / 15",
        year_month_day_last: "year{2024} / March / last",
        month_day: "March / 15",
        month_day_last: "March / last",
        weekday_indexed: "Friday[3]",
        weekday_last: "Friday[last]",
        month_weekday: "March / Friday[3]",
        month_weekday_last: "March / Friday[last]",
        year_month_weekday: "year{2024} / March / Friday[3]",
        year_month_weekday_last: "year{2024} / March / Friday[last]",
    };
    add(
        `calendar-${type}`,
        "20",
        ["chrono", "format", "sstream", "string"],
        `using namespace std::chrono;
${type} date{${expressions[type]}};
assert(date.ok());
std::ostringstream text;
text << date;
assert(!text.str().empty());
auto formatted = std::format("{}", date);
assert(!formatted.empty());`,
        [
            `chrono/${type}`,
            ...under(`chrono/${type}`, [type, "operator_ltlt", "formatter"]),
        ],
        "Represent a valid calendar component or date in March 2024, then convert it to text.",
    );
}
add(
    "duration-values",
    "11",
    ["chrono", "limits"],
    `using Values = std::chrono::duration_values<int>;
assert(Values::zero() == 0);
assert(Values::min() == std::numeric_limits<int>::lowest());
assert(Values::max() == std::numeric_limits<int>::max());
assert(std::chrono::seconds::min() < std::chrono::seconds::zero());`,
    [
        "chrono/duration_values",
        ...under("chrono/duration_values", ["min", "max", "zero"]),
        "chrono/duration/min",
    ],
    "Read the zero and bounds used by integer duration counts.",
);
add(
    "time-point",
    "20",
    ["chrono", "type_traits"],
    `using namespace std::chrono;
time_point<steady_clock, seconds> start{seconds{10}};
auto later = start + seconds{3};
assert(later - start == seconds{3});
++later;
--later;
later += seconds{2};
later -= seconds{1};
assert(later > start);
using Common = std::common_type_t<decltype(start), time_point<steady_clock, milliseconds>>;
Common precise = start;
assert(precise.time_since_epoch() == milliseconds{10000});`,
    under("chrono/time_point", [
        "operator_arith2",
        "operator_cmp",
        "operator_inc_dec",
        "operator_arith",
        "common_type",
    ]),
    "A timestamp starts at 10 seconds since its clock's epoch; add and subtract durations.",
);
add(
    "hours-minutes-seconds",
    "20",
    ["chrono", "sstream"],
    `using namespace std::chrono;
hh_mm_ss parts{hours{2} + minutes{3} + seconds{4}};
assert(parts.hours() == hours{2});
assert(parts.minutes() == minutes{3});
assert(parts.seconds() == seconds{4});
assert(!parts.is_negative());
assert(parts.subseconds() == seconds{0});
assert(parts.to_duration() == seconds{7384});
assert(static_cast<hh_mm_ss<seconds>::precision>(parts) == seconds{7384});
std::ostringstream text;
text << parts;
assert(text.str() == "02:03:04");`,
    [
        "chrono/hh_mm_ss",
        ...under("chrono/hh_mm_ss", ["accessors", "duration", "operator_ltlt"]),
    ],
    "Split 7,384 seconds into hours, minutes, and seconds.",
);
for (const type of [
    "domain_error",
    "length_error",
    "logic_error",
    "out_of_range",
    "range_error",
    "runtime_error",
    "underflow_error",
]) {
    add(
        `error-${type}`,
        "11",
        ["stdexcept", "string"],
        `try {
    throw std::${type}("Invalid input");
} catch (const std::${type}& error) {
    assert(std::string(error.what()) == "Invalid input");
}`,
        [`error/${type}`],
        "Throw and catch an exception carrying the message Invalid input.",
    );
}
for (const type of ["error_code", "error_condition"]) {
    const make =
        type === "error_code" ? "make_error_code" : "make_error_condition";
    add(
        type,
        "17",
        ["system_error", "functional", "sstream"],
        `std::${type} error = std::${make}(std::errc::invalid_argument);
assert(error);
assert(error.value() != 0);
assert(!error.message().empty());
assert(error.category() == std::generic_category());
std::${type} copy;
copy.assign(error.value(), error.category());
assert(copy == error);
assert(std::hash<std::${type}>{}(copy) == std::hash<std::${type}>{}(error));
copy.clear();
assert(!copy);
copy = std::${make}(std::errc::invalid_argument);
assert(copy == error);
${type === "error_code" ? "assert(error.default_error_condition() == std::errc::invalid_argument);\nstd::ostringstream text;\ntext << error;\nassert(!text.str().empty());" : ""}`,
        [
            `error/${type}`,
            ...under(`error/${type}`, [
                type,
                "operator_cmp",
                "assign",
                "category",
                "clear",
                "message",
                "operator_bool",
                "operator=",
                "value",
                "hash",
                ...(type === "error_code"
                    ? ["default_error_condition", "operator_ltlt"]
                    : []),
            ]),
            `error/errc/${make}`,
        ],
        "Represent invalid_argument, inspect it, copy it, and clear it. Error messages depend on the implementation.",
    );
}
add(
    "atomic-ref-properties",
    "20",
    ["atomic", "thread"],
    `alignas(std::atomic_ref<int>::required_alignment) int value = 0;
std::atomic_ref<int> counter{value};
int expected = 0;
assert(counter.compare_exchange_strong(expected, 5));
assert(counter.load() == 5);
(void)counter.is_lock_free(); // Hardware-dependent.
constexpr bool always = std::atomic_ref<int>::is_always_lock_free;
(void)always;
std::jthread worker([&] {
    counter.store(7);
    counter.notify_one();
    counter.notify_all();
});
counter.wait(5);
assert(counter.load() == 7);`,
    [
        "atomic/atomic_ref",
        ...under("atomic/atomic_ref", [
            "compare_exchange",
            "is_always_lock_free",
            "is_lock_free",
            "required_alignment",
            "notify_one",
            "notify_all",
            "wait",
        ]),
    ],
    "Use aligned integer storage; atomically change 0 to 5, then wait for a worker to store 7.",
);
add(
    "noncopyable-atomic-flag",
    "11",
    ["atomic", "type_traits"],
    `static_assert(!std::is_copy_assignable<std::atomic_flag>::value,
    "Atomic flags cannot be copy-assigned");
std::atomic_flag flag = ATOMIC_FLAG_INIT;
assert(!flag.test_and_set());
flag.clear();`,
    ["atomic/atomic_flag/operator="],
    "Copy assignment is deleted. Use test_and_set and clear to change a flag instead.",
);
add(
    "atomic-lock-free",
    "17",
    ["atomic"],
    `constexpr bool always = std::atomic<int>::is_always_lock_free;
std::atomic<int> value{0};
assert(!always || value.is_lock_free());`,
    ["atomic/atomic/is_always_lock_free"],
    "If the type is always lock-free, every instance must also report lock-free operations.",
);
add(
    "float-evaluation",
    "11",
    ["cfloat"],
    `// 0: evaluate at the type's precision; 1: at least double;
// 2: at least long double; -1: evaluation cannot be determined.
int evaluation = FLT_EVAL_METHOD;
(void)evaluation;
// -1: unknown; 0: toward zero; 1: nearest; 2: upward; 3: downward.
// Other values can be implementation-defined.
int rounding = FLT_ROUNDS;
(void)rounding;
assert(FLT_RADIX >= 2);`,
    ["types/climits/FLT_EVAL_METHOD", "types/climits/FLT_ROUNDS"],
    "Inspect this implementation's floating-point evaluation and rounding modes.",
);
