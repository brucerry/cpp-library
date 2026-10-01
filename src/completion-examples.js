// Programs for reference pages that do not supply their own example.
// A family program exercises its operations together, with checked outcomes.
export const completionExamples = [];
function add(id, version, headers, body, roots, options = {}) {
    completionExamples.push({
        id: `completion-${id}`,
        version,
        roots,
        output: "",
        ...options,
        input:
            options.input ||
            "Run the self-contained program; assertions check the documented behavior.",
        example:
            [...new Set([...headers, "cassert", "type_traits", "utility"])]
                .map((h) => `#include <${h}>`)
                .join("\n") +
            `\n${options.setup || ""}\nint main() {\n${body
                .split("\n")
                .map((line) => `    ${line}`)
                .join("\n")}\n}\n`,
    });
}

add(
    "float-macros",
    "11",
    ["cmath", "limits"],
    `double infinity = INFINITY;
assert(std::isinf(infinity));
assert(std::isinf(HUGE_VAL));
assert(std::isnan(NAN));
assert(std::isgreater(3.0, 2.0));
assert(std::isgreaterequal(2.0, 2.0));
assert(std::isless(2.0, 3.0));
assert(std::islessequal(2.0, 2.0));
assert(std::islessgreater(2.0, 3.0));
assert(!std::isless(NAN, 3.0));`,
    ["numeric/math"],
);
add(
    "complex",
    "11",
    ["complex"],
    `std::complex<double> value{2.0, 3.0};
value.real(4.0); value.imag(5.0);
assert(std::real(value) == 4.0 && std::imag(value) == 5.0);
value += std::complex<double>{1.0, 1.0};
value -= 1.0; value *= 2.0; value /= 2.0;
assert(value == std::complex<double>(4.0, 6.0));
auto sum = value + std::complex<double>{1.0, 0.0};
value = sum;
assert(value.real() == 5.0);`,
    ["numeric/complex"],
);
add(
    "valarray",
    "11",
    ["valarray"],
    `std::valarray<int> values{1, 2, 3, 4, 5, 6};
{ auto slice = values[std::slice(0, 2, 2)]; slice = 8; slice += std::valarray<int>(1, 2); slice -= std::valarray<int>(1, 2); slice *= std::valarray<int>(2, 2); slice /= std::valarray<int>(2, 2); slice %= std::valarray<int>(7, 2); slice ^= std::valarray<int>(1, 2); slice &= std::valarray<int>(7, 2); slice |= std::valarray<int>(2, 2); slice <<= std::valarray<int>(1, 2); slice >>= std::valarray<int>(1, 2); }
std::valarray<std::size_t> sizes{2, 2}, strides{3, 1};
std::gslice selector{0, sizes, strides};
{ auto grid = values[selector]; grid = 4; grid += std::valarray<int>(1, 4); grid -= std::valarray<int>(1, 4); grid *= std::valarray<int>(2, 4); grid /= std::valarray<int>(2, 4); grid %= std::valarray<int>(7, 4); grid ^= std::valarray<int>(1, 4); grid &= std::valarray<int>(7, 4); grid |= std::valarray<int>(2, 4); grid <<= std::valarray<int>(1, 4); grid >>= std::valarray<int>(1, 4); }
std::valarray<std::size_t> indices{1, 4};
{ auto selected = values[indices]; selected = 3; selected += std::valarray<int>(1, 2); selected -= std::valarray<int>(1, 2); selected *= std::valarray<int>(2, 2); selected /= std::valarray<int>(2, 2); selected %= std::valarray<int>(7, 2); selected ^= std::valarray<int>(1, 2); selected &= std::valarray<int>(7, 2); selected |= std::valarray<int>(2, 2); selected <<= std::valarray<int>(1, 2); selected >>= std::valarray<int>(1, 2); }
std::valarray<bool> mask{true, false, false, false, false, true};
{ auto selected = values[mask]; selected = 2; selected += std::valarray<int>(1, 2); selected -= std::valarray<int>(1, 2); selected *= std::valarray<int>(2, 2); selected /= std::valarray<int>(2, 2); selected %= std::valarray<int>(7, 2); selected ^= std::valarray<int>(1, 2); selected &= std::valarray<int>(7, 2); selected |= std::valarray<int>(2, 2); selected <<= std::valarray<int>(1, 2); selected >>= std::valarray<int>(1, 2); }
std::valarray<int> other{9, 10}; values.swap(other);
assert(values.size() == 2 && values[0] == 9);`,
    ["numeric/valarray"],
);
add(
    "random-device",
    "20",
    ["random", "concepts"],
    `std::random_device source;
static_assert(std::uniform_random_bit_generator<std::random_device>);
auto value = source();
assert(value >= source.min() && value <= source.max());`,
    ["numeric/random"],
);
add(
    "float-env",
    "11",
    ["cfenv"],
    `std::fenv_t saved;
assert(std::feholdexcept(&saved) == 0);
std::fexcept_t flags;
assert(std::fegetexceptflag(&flags, FE_ALL_EXCEPT) == 0);
std::feraiseexcept(FE_INVALID);
assert(std::feupdateenv(&saved) == 0);
assert(std::fetestexcept(FE_INVALID));
std::feclearexcept(FE_ALL_EXCEPT);`,
    ["numeric/fenv"],
);
add(
    "limits-enums",
    "11",
    ["limits"],
    `std::float_denorm_style denorm = std::numeric_limits<double>::has_denorm;
std::float_round_style rounding = std::numeric_limits<double>::round_style;
assert(denorm == std::denorm_absent || denorm == std::denorm_present || denorm == std::denorm_indeterminate);
assert(rounding >= std::round_indeterminate && rounding <= std::round_toward_neg_infinity);`,
    ["types/numeric_limits"],
);
add(
    "type-index",
    "11",
    ["typeindex", "functional"],
    `// typeid objects live for the process lifetime; do not manually destroy them.
static_assert(std::is_destructible<std::type_info>::value, "type_info has a destructor");
std::type_index type{typeid(int)}, same{typeid(int)}, other{typeid(double)};
assert(type == same && type != other);
assert(type.hash_code() == same.hash_code());
assert(std::hash<std::type_index>{}(type) == type.hash_code());`,
    ["types/type_index", "types/type_info"],
);
add(
    "swappable",
    "17",
    ["vector"],
    `static_assert(std::is_swappable_v<std::vector<int>>);
static_assert(std::is_nothrow_swappable_v<std::vector<int>>);
static_assert(std::is_swappable_with_v<int&, int&>);
static_assert(!std::is_swappable_v<const int>);`,
    ["types/is_swappable"],
);
add(
    "string",
    "11",
    ["string"],
    `std::string value = "red apple";
value.replace(0, 3, "green");
assert(value == "green apple" && value != "red apple");
auto allocator = value.get_allocator(); (void)allocator;
assert(std::stof("1.5") == 1.5f);
assert(std::stoul("123") == 123ul);`,
    ["string/basic_string"],
);
add(
    "traits",
    "11",
    ["string"],
    `using T = std::char_traits<char>;
char source[] = "abc", target[8]{};
T::copy(target, source, 4); T::move(target + 1, target, 3);
assert(target[1] == 'a'); T::assign(target[0], 'z'); T::assign(target + 1, 2, 'x');
assert(T::compare("abc", "abd", 3) < 0);
assert(T::find(source, 3, 'b') == source + 1);
assert(T::eq('a', 'a') && T::lt('a', 'b'));
auto integer = T::to_int_type('a');
assert(T::to_char_type(integer) == 'a');
assert(T::eq_int_type(integer, T::to_int_type('a')));
assert(!T::eq_int_type(T::not_eof(T::eof()), T::eof()));`,
    ["string/char_traits"],
);
add(
    "isblank",
    "11",
    ["cctype"],
    `assert(std::isblank(static_cast<unsigned char>(' ')));
assert(!std::isblank(static_cast<unsigned char>('A')));`,
    ["string/byte/isblank"],
);
add(
    "wide-classification",
    "11",
    ["cwctype"],
    `std::wctype_t alpha = std::wctype("alpha");
assert(alpha && std::iswctype(L'A', alpha));
std::wctrans_t lower = std::wctrans("tolower");
assert(lower && std::towctrans(L'A', lower) == L'a');`,
    ["string/wide"],
);
add(
    "multibyte",
    "23",
    ["cuchar", "cwchar"],
    `std::mbstate_t state{};
char8_t character{};
assert(std::mbrtoc8(&character, "A", 1, &state) == 1);
assert(character == u8'A');
char bytes[MB_LEN_MAX]{};
assert(std::c8rtomb(bytes, character, &state) == 1);
assert(bytes[0] == 'A');`,
    ["string/multibyte"],
    { setup: "#include <climits>" },
);
add(
    "optional",
    "17",
    ["optional"],
    `std::optional<int> value{4}, empty{std::nullopt};
std::nullopt_t tag = std::nullopt; (void)tag;
assert(value > empty && value == 4);
try { (void)empty.value(); assert(false); } catch (const std::bad_optional_access&) {}
{ std::optional<int> scoped{2}; assert(*scoped == 2); }`,
    ["utility/optional"],
);
add(
    "expected",
    "23",
    ["expected", "string"],
    `std::expected<int, std::string> value{2}; value.emplace(7);
assert(*value == 7);
std::unexpect_t tag = std::unexpect;
std::expected<int, std::string> failure{tag, "invalid"};
assert(failure.error_or("fallback") == "invalid");
value = failure;
try { (void)value.value(); assert(false); } catch (const std::bad_expected_access<std::string>& e) { assert(e.error() == "invalid"); }`,
    ["utility/expected"],
    { feature: "__cpp_lib_expected >= 202211L" },
);
add(
    "in-place",
    "17",
    ["optional", "variant", "string"],
    `std::optional<std::string> text{std::in_place, 3, 'x'};
std::variant<int, std::string> value{std::in_place_type<std::string>, "hello"};
value.emplace<0>(7);
assert(*text == "xxx" && std::get<0>(value) == 7);`,
    ["utility/in_place"],
);
add(
    "pair-tuple",
    "23",
    ["tuple", "array", "memory", "functional"],
    `std::pair<int, int> pair{2, 3}; std::tuple<int, int> tuple{pair};
assert(std::get<0>(tuple) == 2 && pair.second == 3);
using Common = std::common_type_t<decltype(pair), std::pair<long, long>>;
static_assert(std::is_same_v<Common, std::pair<long, long>>);
using TupleCommon = std::common_type_t<std::tuple<int>, std::tuple<long>>;
static_assert(std::is_same_v<TupleCommon, std::tuple<long>>);
using TupleReference = std::common_reference_t<const std::tuple<int>&, const std::tuple<long>&>;
(void)sizeof(TupleReference);
using Reference = std::common_reference_t<const std::pair<int, int>&, const std::pair<long, long>&>;
(void)sizeof(Reference);
static_assert(std::uses_allocator_v<decltype(tuple), std::allocator<int>>);
static_assert(std::tuple_size_v<std::array<int, 2>> == 2);
auto sum = std::apply([](int a, int b) { return a + b; }, tuple);
assert(sum == 5);`,
    ["utility/pair", "utility/tuple"],
    {
        probe: "#include <tuple>\n#include <utility>\n#include <type_traits>\nusing P = std::common_type_t<std::pair<int, int>, std::pair<long, long>>;\nusing T = std::common_type_t<std::tuple<int>, std::tuple<long>>;",
        input: "Construct a pair and tuple, and inspect their common types. tuple-like and pair-like are exposition-only concepts; use their public tuple protocol.",
    },
);
add(
    "compare",
    "20",
    ["compare", "concepts"],
    `static_assert(std::three_way_comparable<int>);
using Category = std::common_comparison_category_t<std::strong_ordering, std::weak_ordering>;
static_assert(std::is_same_v<Category, std::weak_ordering>);
auto strong = std::strong_order(1, 2);
auto weak = std::weak_order(1, 2);
auto partial = std::partial_order(1.0, 2.0);
assert(strong == std::strong_ordering::less && weak == std::weak_ordering::less);
assert(partial == std::partial_ordering::less);
assert(std::is_lt(strong) && std::is_lteq(strong) && !std::is_eq(strong) && std::is_neq(strong));
assert(std::is_gt(2 <=> 1) && std::is_gteq(2 <=> 1));
assert(std::compare_strong_order_fallback(1, 2) < 0);
assert(std::compare_partial_order_fallback(1, 2) < 0);`,
    ["utility/compare"],
);
add(
    "chars-format",
    "17",
    ["charconv"],
    `char buffer[32];
auto result = std::to_chars(buffer, buffer + 32, 1.5, std::chars_format::fixed, 1);
assert(result.ec == std::errc{});
double value{}; auto parsed = std::from_chars(buffer, result.ptr, value, std::chars_format::fixed);
assert(parsed.ec == std::errc{} && value == 1.5);`,
    ["utility/chars_format"],
);
add(
    "function",
    "17",
    ["functional", "memory"],
    `int number = 2;
std::reference_wrapper ref{number}; std::reference_wrapper<int> other{number}; other = ref;
other.get() = 3; assert(number == 3);
{ std::function<int(int)> function = [](int n) { return n + 1; }; assert(function(3) == 4); }`,
    [
        "utility/functional/reference_wrapper",
        "utility/functional/function/~function",
    ],
);
add(
    "legacy-function",
    "11",
    ["functional", "memory"],
    `std::pointer_to_unary_function<int, int> unary{plus_one};
std::pointer_to_binary_function<int, int, int> binary{sum};
assert(unary(2) == 3 && binary(2, 3) == 5);
Widget widget;
std::mem_fun_t<int, Widget> pointer{&Widget::get};
std::mem_fun_ref_t<int, Widget> reference{&Widget::get};
assert(pointer(&widget) == 7 && reference(widget) == 7);
std::function<int(int)> function;
function = plus_one;
assert(function(2) == 3);
`,
    [
        "utility/functional/mem_fun_t",
        "utility/functional/mem_fun_ref_t",
        "utility/functional/pointer_to_binary_function",
        "utility/functional/pointer_to_unary_function",
    ],
    {
        setup: "int plus_one(int n) { return n + 1; }\nint sum(int a, int b) { return a + b; }\nstruct Widget { int get() { return 7; } };",
    },
);
add(
    "move-function",
    "23",
    ["functional"],
    `std::move_only_function<int()> function = [] { return 7; };
std::move_only_function<int()> other = [] { return 9; };
function.swap(other); assert(function() == 9);
other = std::move(function); assert(other() == 9);`,
    ["utility/functional/move_only_function"],
);
add(
    "allocator",
    "11",
    ["memory"],
    `std::allocator<int> allocator, other;
assert(allocator == other);
int* storage = allocator.allocate(1);
assert(allocator.address(*storage) == storage);
allocator.construct(storage, 42); assert(*storage == 42);
assert(allocator.max_size() >= 1);
allocator.destroy(storage); allocator.deallocate(storage, 1);`,
    ["memory/allocator"],
);
add(
    "allocator-traits",
    "23",
    ["memory"],
    `using A = std::allocator<int>; using T = std::allocator_traits<A>;
A allocator;
auto block = T::allocate_at_least(allocator, 3);
static_assert(std::is_same_v<decltype(block), std::allocation_result<int*, std::size_t>>);
assert(block.count >= 3);
T::construct(allocator, block.ptr, 42); assert(*block.ptr == 42);
T::destroy(allocator, block.ptr); T::deallocate(allocator, block.ptr, block.count);
int* storage = T::allocate(allocator, 1); T::deallocate(allocator, storage, 1);
auto copy = T::select_on_container_copy_construction(allocator); assert(copy == allocator);`,
    ["memory/allocator_traits", "memory/allocation_result"],
    { feature: "__cpp_lib_allocate_at_least >= 202302L" },
);
add(
    "scoped-allocator",
    "11",
    ["scoped_allocator", "vector"],
    `using A = std::scoped_allocator_adaptor<std::allocator<int>>;
A allocator, other;
assert(allocator == other);
auto outer = allocator.outer_allocator(); (void)outer;
auto& inner = allocator.inner_allocator(); (void)inner;
int* storage = allocator.allocate(1); allocator.construct(storage, 7);
assert(*storage == 7 && allocator.max_size() >= 1);
allocator.destroy(storage); allocator.deallocate(storage, 1);
other = allocator; auto copy = allocator.select_on_container_copy_construction(); assert(copy == allocator);`,
    ["memory/scoped_allocator_adaptor"],
);
add(
    "scoped-allocator-deduction",
    "17",
    ["scoped_allocator"],
    `std::scoped_allocator_adaptor<std::allocator<int>> source;
std::scoped_allocator_adaptor allocator{source};
int* storage = allocator.allocate(1); allocator.deallocate(storage, 1);`,
    ["memory/scoped_allocator_adaptor/deduction_guides"],
);
add(
    "allocator-aware",
    "20",
    ["memory", "string", "tuple"],
    `std::allocator<char> allocator;
std::allocator_arg_t tag = std::allocator_arg; (void)tag;
static_assert(std::uses_allocator_v<std::string, decltype(allocator)>);
auto text = std::make_obj_using_allocator<std::string>(allocator, "hello");
assert(text == "hello");
auto args = std::uses_allocator_construction_args<std::string>(allocator, "world");
auto other = std::make_from_tuple<std::string>(args); assert(other == "world");
alignas(std::string) unsigned char storage[sizeof(std::string)];
auto* pointer = reinterpret_cast<std::string*>(storage);
std::uninitialized_construct_using_allocator(pointer, allocator, "test");
assert(*pointer == "test"); std::destroy_at(pointer);`,
    [
        "memory/allocator_arg",
        "memory/allocator_arg_t",
        "memory/make_obj_using_allocator",
        "memory/uninitialized_construct_using_allocator",
        "memory/uses_allocator",
        "memory/uses_allocator_construction_args",
    ],
);
add(
    "pointer-traits",
    "20",
    ["memory"],
    `int value = 42;
auto* pointer = std::pointer_traits<int*>::pointer_to(value);
assert(std::to_address(pointer) == &value);`,
    ["memory/pointer_traits"],
    {
        setup: "// Raw pointers use std::to_address; custom pointer traits can supply to_address.\nstruct Pointer { using element_type = int; int* value; int* operator->() const { return value; } };",
    },
);
add(
    "aligned",
    "20",
    ["memory"],
    `alignas(64) int values[16]{};
int* pointer = std::assume_aligned<64>(values); pointer[0] = 42;
assert(values[0] == 42);`,
    ["memory/assume_aligned"],
);
add(
    "new-handler",
    "20",
    ["new"],
    `std::new_handler previous = std::set_new_handler(handler);
assert(std::get_new_handler() == handler); std::set_new_handler(previous);
auto alignment = std::align_val_t{64};
void* storage = ::operator new(64, alignment); ::operator delete(storage, alignment);
std::destroying_delete_t tag = std::destroying_delete; (void)tag;`,
    ["memory/new"],
    { setup: "void handler() { throw std::bad_alloc{}; }" },
);
add(
    "shared-atomic",
    "20",
    ["memory", "atomic", "functional"],
    `auto pointer = std::make_shared<int>(7);
std::shared_ptr<int> copy; copy = pointer; assert(*copy == 7);
assert(std::hash<std::shared_ptr<int>>{}(copy) == std::hash<int*>{}(copy.get()));
std::atomic<std::shared_ptr<int>> atomic{pointer}; assert(*atomic.load() == 7);
std::atomic_store(&copy, std::make_shared<int>(9)); assert(*std::atomic_load(&copy) == 9);
std::weak_ptr<int> weak; weak = pointer;
std::atomic<std::weak_ptr<int>> observer{weak}; assert(*observer.load().lock() == 7);`,
    ["memory/shared_ptr", "memory/weak_ptr"],
);
add(
    "owner-less",
    "17",
    ["memory"],
    `auto owner = std::make_shared<int>(7);
std::weak_ptr<int> weak = owner;
std::owner_less<std::shared_ptr<int>> compare;
assert(!compare(owner, owner));
std::owner_less<void> transparent;
assert(!transparent(owner, weak) && !transparent(weak, owner));`,
    ["memory/owner_less", "memory/owner_less_void"],
);
add(
    "shared-from-this",
    "17",
    ["memory"],
    `auto object = std::make_shared<Object>();
assert(object->weak_from_this().lock() == object);
std::weak_ptr<Object> observer = object; object.reset();
assert(observer.expired());`,
    ["memory/enable_shared_from_this"],
    { setup: "struct Object : std::enable_shared_from_this<Object> {};" },
);
add(
    "auto-pointer",
    "11",
    ["memory"],
    `std::auto_ptr<int> owner(new int(7));
assert(*owner == 7 && *owner.get() == 7);
std::auto_ptr<int> other(owner); assert(owner.get() == nullptr);
owner = other; assert(other.get() == nullptr);
int* raw = owner.release(); assert(!owner.get()); delete raw;
owner.reset(new int(9)); assert(*owner == 9);
std::auto_ptr<Derived> derived(new Derived);
std::auto_ptr<Base> base(derived); assert(base.get());`,
    ["memory/auto_ptr"],
    {
        setup: "struct Base { virtual ~Base() = default; };\nstruct Derived : Base {};",
    },
);
add(
    "gc",
    "11",
    ["memory"],
    `int* pointer = new int(7);
std::declare_reachable(pointer);
std::declare_no_pointers(reinterpret_cast<char*>(pointer), sizeof(int));
std::undeclare_no_pointers(reinterpret_cast<char*>(pointer), sizeof(int));
pointer = std::undeclare_reachable(pointer);
auto safety = std::get_pointer_safety(); (void)safety;
assert(*pointer == 7); delete pointer;`,
    ["memory/gc"],
);
add(
    "ptr-adapters",
    "23",
    ["memory"],
    `std::unique_ptr<int> pointer;
{ auto output = std::out_ptr(pointer); int** raw = output; create(raw); }
assert(*pointer == 7);
{ auto inputOutput = std::inout_ptr(pointer); int** raw = inputOutput; replace(raw); }
assert(*pointer == 9);`,
    ["memory/out_ptr_t", "memory/inout_ptr_t"],
    {
        feature: "__cpp_lib_out_ptr >= 202106L",
        setup: "void create(int** p) { *p = new int(7); }\nvoid replace(int** p) { delete *p; *p = new int(9); }",
    },
);
add(
    "pmr",
    "20",
    ["memory_resource", "vector"],
    `std::pmr::memory_resource* upstream = std::pmr::new_delete_resource();
assert(upstream->is_equal(*upstream) && *upstream == *upstream);
void* raw = upstream->allocate(16, alignof(int)); upstream->deallocate(raw, 16, alignof(int));
std::pmr::polymorphic_allocator<int> allocator{upstream};
assert(allocator.resource() == upstream && allocator == std::pmr::polymorphic_allocator<int>{upstream});
int* value = allocator.allocate(1); allocator.construct(value, 7); assert(*value == 7);
allocator.destroy(value); allocator.deallocate(value, 1);
raw = allocator.allocate_bytes(32); allocator.deallocate_bytes(raw, 32);
value = allocator.allocate_object<int>(2); allocator.deallocate_object(value, 2);
value = allocator.new_object<int>(9); assert(*value == 9); allocator.delete_object(value);
auto copy = allocator.select_on_container_copy_construction(); assert(copy.resource() == std::pmr::get_default_resource());
std::byte buffer[1024];
std::pmr::monotonic_buffer_resource arena{buffer, sizeof buffer, upstream};
assert(arena.upstream_resource() == upstream);
raw = arena.allocate(16); arena.deallocate(raw, 16); arena.release();
std::pmr::pool_options options; options.max_blocks_per_chunk = 8;
std::pmr::synchronized_pool_resource shared{options, upstream};
std::pmr::unsynchronized_pool_resource local{options, upstream};
assert(shared.upstream_resource() == upstream && local.upstream_resource() == upstream);
assert(!arena.is_equal(shared) && !shared.is_equal(local) && !local.is_equal(arena));
assert(shared.options().max_blocks_per_chunk >= 8 && local.options().max_blocks_per_chunk >= 8);
raw = shared.allocate(16); shared.deallocate(raw, 16); shared.release();
raw = local.allocate(16); local.deallocate(raw, 16); local.release();`,
    [
        "memory/get_default_resource",
        "memory/memory_resource",
        "memory/monotonic_buffer_resource",
        "memory/new_delete_resource",
        "memory/polymorphic_allocator",
        "memory/pool_options",
        "memory/synchronized_pool_resource",
        "memory/unsynchronized_pool_resource",
    ],
    {
        input: "Allocate, construct, destroy, and release storage. Public allocate/deallocate/is_equal dispatch to each resource's protected do_* implementation.",
    },
);
add(
    "fences",
    "11",
    ["atomic", "csignal"],
    `std::atomic<int> value{0};
value.store(7, std::memory_order_relaxed);
std::atomic_thread_fence(std::memory_order_seq_cst);
std::atomic_signal_fence(std::memory_order_seq_cst);
int independent = std::kill_dependency(value.load()); assert(independent == 7);`,
    [
        "atomic/atomic_signal_fence",
        "atomic/atomic_thread_fence",
        "atomic/kill_dependency",
    ],
);

for (const type of [
    "mutex",
    "recursive_mutex",
    "timed_mutex",
    "recursive_timed_mutex",
    "shared_mutex",
    "shared_timed_mutex",
]) {
    const shared = type.startsWith("shared"),
        timed = type.includes("timed");
    add(
        type,
        shared ? "17" : "11",
        [shared ? "shared_mutex" : "mutex", "chrono"],
        `std::${type} mutex;
mutex.lock(); mutex.unlock();
assert(mutex.try_lock()); mutex.unlock();
${timed ? "assert(mutex.try_lock_for(std::chrono::milliseconds(10))); mutex.unlock();\nassert(mutex.try_lock_until(std::chrono::steady_clock::now() + std::chrono::seconds(1))); mutex.unlock();" : ""}
${shared ? "mutex.lock_shared(); mutex.unlock_shared();\nassert(mutex.try_lock_shared()); mutex.unlock_shared();" : ""}
${shared && timed ? "assert(mutex.try_lock_shared_for(std::chrono::milliseconds(10))); mutex.unlock_shared();\nassert(mutex.try_lock_shared_until(std::chrono::steady_clock::now() + std::chrono::seconds(1))); mutex.unlock_shared();" : ""}
// native_handle is implementation-defined and is not required for shared_mutex.
${type !== "shared_mutex" && type !== "shared_timed_mutex" ? "auto native = mutex.native_handle(); (void)native;" : ""}`,
        [`thread/${type}`],
    );
}
add(
    "locks",
    "17",
    ["mutex", "shared_mutex", "chrono"],
    `std::timed_mutex mutex;
{ std::lock_guard<std::timed_mutex> guard{mutex}; }
{ std::scoped_lock guard{mutex}; }
std::unique_lock<std::timed_mutex> owner{mutex, std::defer_lock};
assert(owner.mutex() == &mutex && !owner.owns_lock());
assert(owner.try_lock_for(std::chrono::milliseconds(10)) && static_cast<bool>(owner)); owner.unlock();
assert(owner.try_lock_until(std::chrono::steady_clock::now() + std::chrono::seconds(1))); owner.unlock();
std::unique_lock<std::timed_mutex> other; other = std::move(owner); std::swap(owner, other);
auto* raw = owner.release(); assert(raw == &mutex);
std::shared_timed_mutex shared;
std::shared_lock<std::shared_timed_mutex> reader{shared, std::defer_lock};
assert(reader.mutex() == &shared && !reader.owns_lock());
assert(reader.try_lock() && static_cast<bool>(reader)); reader.unlock();
assert(reader.try_lock_for(std::chrono::milliseconds(10))); reader.unlock();
assert(reader.try_lock_until(std::chrono::steady_clock::now() + std::chrono::seconds(1))); reader.unlock();
std::shared_lock<std::shared_timed_mutex> copy; copy = std::move(reader); copy.swap(reader); std::swap(copy, reader);
assert(copy.release() == &shared);`,
    [
        "thread/lock_guard",
        "thread/scoped_lock",
        "thread/unique_lock",
        "thread/shared_lock",
    ],
);
add(
    "condition",
    "11",
    ["condition_variable", "mutex", "thread"],
    `std::mutex mutex;
std::condition_variable condition; auto native = condition.native_handle(); (void)native;
std::condition_variable_any any;
std::unique_lock<std::mutex> lock{mutex};
assert(any.wait_for(lock, std::chrono::milliseconds(1)) == std::cv_status::timeout);
std::once_flag flag; int count = 0; std::call_once(flag, [&] { ++count; }); std::call_once(flag, [&] { ++count; });
assert(count == 1);`,
    [
        "thread/condition_variable",
        "thread/condition_variable_any",
        "thread/cv_status",
        "thread/once_flag",
    ],
);
add(
    "stop",
    "20",
    ["stop_token", "thread"],
    `std::stop_source source; auto token = source.get_token();
std::stop_token copy; copy = token; assert(copy == token);
std::stop_source other{std::nostopstate}; std::nostopstate_t tag = std::nostopstate; (void)tag;
assert(!other.stop_possible() && source.stop_possible());
other = source; source.swap(other); std::swap(source, other);
copy.swap(token); std::swap(copy, token);
int calls = 0;
{ std::stop_callback callback{token, [&] { ++calls; }};
assert(source.request_stop()); assert(calls == 1); }
assert(token.stop_requested() && source.stop_requested());
std::jthread worker([](std::stop_token request) { (void)request.stop_requested(); });
std::jthread moved; moved = std::move(worker);`,
    [
        "thread/stop_source",
        "thread/stop_token",
        "thread/stop_callback",
        "thread/stoppable_token",
        "thread/jthread",
    ],
    {
        input: "A callback runs once when stop is requested. stoppable_token describes the interface; use std::stop_token rather than an exposition-only name.",
    },
);
add(
    "barrier",
    "20",
    ["barrier", "thread"],
    `std::barrier barrier{2};
assert(decltype(barrier)::max() >= 2);
std::jthread worker([&] { barrier.arrive_and_wait(); });
auto token = barrier.arrive(); barrier.wait(std::move(token));
worker.join();
barrier.arrive_and_drop(); barrier.arrive_and_wait();`,
    ["thread/barrier"],
);
add(
    "latch",
    "20",
    ["latch", "thread"],
    `std::latch latch{2}; assert(std::latch::max() >= 2);
assert(!latch.try_wait()); latch.count_down();
std::jthread worker([&] { latch.arrive_and_wait(); }); latch.wait(); assert(latch.try_wait());`,
    ["thread/latch"],
);
add(
    "semaphore",
    "20",
    ["semaphore", "chrono"],
    `std::counting_semaphore<2> semaphore{1}; assert(decltype(semaphore)::max() >= 2);
assert(semaphore.try_acquire()); assert(!semaphore.try_acquire());
semaphore.release(); assert(semaphore.try_acquire_for(std::chrono::milliseconds(10)));
semaphore.release(); assert(semaphore.try_acquire_until(std::chrono::steady_clock::now() + std::chrono::seconds(1)));`,
    ["thread/counting_semaphore"],
);
add(
    "thread",
    "11",
    ["thread"],
    `std::thread::id empty; assert(empty == std::thread::id{});
std::thread worker([] {}); assert(worker.get_id() != empty);
std::thread moved; moved = std::move(worker); moved.join();`,
    ["thread/thread"],
);
add(
    "future",
    "17",
    ["future", "thread", "system_error"],
    `std::promise<int> promise; std::promise<int> other; other = std::move(promise); other.swap(promise); std::swap(other, promise);
auto future = other.get_future(); other.set_value(7);
std::future<int> moved; moved = std::move(future); auto shared = moved.share();
std::shared_future<int> copy; copy = shared;
assert(copy.wait_until(std::chrono::steady_clock::now() + std::chrono::seconds(1)) == std::future_status::ready);
assert(copy.get() == 7);
std::packaged_task<int()> task{[] { return 9; }};
assert(task.valid()); auto result = task.get_future();
std::packaged_task<int()> transfer; transfer = std::move(task); transfer.swap(task); std::swap(transfer, task); transfer(); assert(result.get() == 9);
auto deferred = std::async(std::launch::deferred, [] { return 3; }); assert(deferred.get() == 3);
std::future_error error{std::future_errc::broken_promise};
std::future_error errorCopy = error; errorCopy = error;
assert(error.code() == std::make_error_code(std::future_errc::broken_promise));
assert(*error.what());
static_assert(std::is_error_code_enum<std::future_errc>::value);
assert(std::make_error_condition(std::future_errc::broken_promise).category() == std::future_category());
static_assert(std::uses_allocator<std::promise<int>, std::allocator<int>>::value);

std::promise<int> exceptional; auto failure = exceptional.get_future();
std::thread worker([p = std::move(exceptional)]() mutable { p.set_exception_at_thread_exit(std::make_exception_ptr(std::runtime_error("failed"))); });
worker.join(); try { (void)failure.get(); assert(false); } catch (const std::runtime_error&) {}`,
    [
        "thread/promise",
        "thread/future",
        "thread/shared_future",
        "thread/packaged_task",
        "thread/launch",
        "thread/future_category",
        "thread/future_errc",
        "thread/future_error",
        "thread/future_status",
    ],
    { minimumVersion: "17" },
);
add(
    "streambuf",
    "11",
    ["streambuf", "ios", "locale", "string"],
    `Buffer buffer, copy; buffer.exercise(); copy.assign(buffer); copy.exchange(buffer);
assert(buffer.sgetc() == 'a'); assert(buffer.sbumpc() == 'a');
assert(buffer.snextc() == 'c'); assert(buffer.in_avail() >= 1);
char read[2]{}; buffer.pubseekpos(0, std::ios::in); assert(buffer.sgetn(read, 2) == 2);
assert(read[0] == 'a'); buffer.pubseekoff(0, std::ios::beg, std::ios::in);
buffer.pubimbue(std::locale::classic()); assert(buffer.getloc() == std::locale::classic());
assert(buffer.pubsync() == 0);`,
    ["io/basic_streambuf"],
    {
        setup: `struct Buffer : std::streambuf {
    char input[4] = "abc", output[8]{};
    Buffer() { setg(input, input, input + 3); setp(output, output + 8); }
    void exercise() { assert(gptr() == input); gbump(1); assert(*gptr() == 'b'); gbump(-1); assert(pptr() == output); assert(showmanyc() == 0); assert(uflow() == 'a'); gbump(-1); (void)pbackfail(); }
    int_type underflow() override { return gptr() < egptr() ? traits_type::to_int_type(*gptr()) : traits_type::eof(); }
    void assign(const Buffer& other) { std::streambuf::operator=(other); }
    void exchange(Buffer& other) { swap(other); }
    pos_type seekoff(off_type offset, std::ios::seekdir, std::ios::openmode) override { setg(input, input + offset, input + 3); return offset; }
    pos_type seekpos(pos_type position, std::ios::openmode mode) override { return seekoff(off_type(position), std::ios::beg, mode); }
};`,
    },
);
add(
    "ios",
    "11",
    ["ios", "sstream", "locale"],
    `std::stringbuf buffer;
IOS state{&buffer}, other{&buffer};
state.exchange(other); state.transfer(other); state.replace(&buffer);
assert(state.widen('A') == L'A' && state.narrow('A', '?') == 'A');
state.imbue(std::locale::classic()); state.setf(std::ios::hex, std::ios::basefield);
auto flags = state.flags(); assert(flags & std::ios::hex); state.unsetf(std::ios::basefield);
std::ios_base::iostate bits = std::ios::goodbit; (void)bits;
std::ios_base::Init init;
int events = 0; state.pword(slot) = &events; state.register_callback(callback, slot); state.imbue(std::locale::classic()); assert(events > 0);
std::istringstream input{"42"}; int number{}; input >> number; assert(number == 42);
std::ostringstream output; output << number; assert(output.str() == "42");
Duplex duplex{&buffer}, second{&buffer}; duplex << "abc"; second.assign(std::move(duplex)); second.exchange(duplex);
static_assert(!std::is_copy_assignable<std::ios_base>::value, "ios_base is not copy assignable");`,
    [
        "io/basic_ios",
        "io/basic_iostream",
        "io/basic_istream",
        "io/basic_ostream",
        "io/ios_base",
    ],
    {
        setup: `struct IOS : std::ios {
    explicit IOS(std::streambuf* buffer) { init(buffer); }
    void exchange(IOS& other) { swap(other); }
    void transfer(IOS& other) { move(other); }
    void replace(std::streambuf* buffer) { set_rdbuf(buffer); }
};
struct Duplex : std::iostream {
    explicit Duplex(std::streambuf* buffer) : std::iostream(buffer) {}
    void assign(Duplex&& other) { std::iostream::operator=(std::move(other)); }
    void exchange(Duplex& other) { std::iostream::swap(other); }
};
const int slot = std::ios_base::xalloc();
void callback(std::ios_base::event event, std::ios_base& stream, int index) { if (event == std::ios_base::imbue_event) ++*static_cast<int*>(stream.pword(index)); }`,
    },
);
add(
    "stringbuf",
    "20",
    ["sstream"],
    `std::stringbuf buffer{"42", std::ios::in | std::ios::out};
assert(buffer.view() == "42"); auto allocator = buffer.get_allocator(); (void)allocator;
assert(buffer.sbumpc() == '4'); assert(buffer.sputbackc('4') == '4');
std::stringbuf other{"73"}; std::swap(buffer, other); assert(buffer.str() == "73");`,
    ["io/basic_stringbuf"],
    {
        input: "Construction initializes the input/output pointers via the exposition-only init_buf_ptrs helper. sputbackc exercises putback; buffer storage is released at scope exit.",
    },
);
add(
    "syncbuf",
    "20",
    ["syncstream", "sstream"],
    `std::ostringstream sink;
{ std::syncbuf buffer{sink.rdbuf()}; assert(buffer.get_wrapped() == sink.rdbuf());
auto allocator = buffer.get_allocator(); (void)allocator;
buffer.sputn("hello", 5); assert(buffer.emit()); assert(sink.str() == "hello");
buffer.set_emit_on_sync(true); buffer.sputc('!'); assert(buffer.pubsync() == 0);
std::syncbuf other{sink.rdbuf()}; other = std::move(buffer); other.swap(buffer); std::swap(other, buffer); }
{ std::osyncstream output{sink}; assert(output.rdbuf()); output << " world" << std::emit_on_flush << std::flush_emit; }
assert(sink.str().find("world") != std::string::npos);`,
    [
        "io/basic_syncbuf",
        "io/basic_osyncstream",
        "io/manip/emit_on_flush",
        "io/manip/flush_emit",
    ],
);
add(
    "spanbuf",
    "23",
    ["spanstream"],
    `char storage[16] = "42";
std::spanbuf buffer{std::span<char>{storage}, std::ios::in | std::ios::out};
buffer.span(std::span<char>{storage});
assert(buffer.pubseekoff(0, std::ios::beg, std::ios::in) == 0);
assert(buffer.pubseekoff(0, std::ios::beg, std::ios::in) == 0);
assert(buffer.sbumpc() == '4'); assert(buffer.pubseekpos(1, std::ios::in) == 1);
buffer.pubsetbuf(storage, 16);
char backup[16]{}; std::spanbuf other{std::span<char>{backup}};
other = std::move(buffer); other.swap(buffer); std::swap(other, buffer);`,
    ["io/basic_spanbuf"],
);
add(
    "file-streams",
    "11",
    ["fstream", "cstdio", "locale"],
    `const char* filename = file.name.c_str();
{ std::ofstream output; output.open(filename); assert(output.is_open()); assert(output.rdbuf()); output << "42"; output.close();
std::ofstream moved; moved = std::move(output); }
{ std::ifstream input; input.open(filename); assert(input.rdbuf()); int value{}; input >> value; assert(value == 42); input.close();
std::ifstream moved; moved = std::move(input); }
{ std::fstream stream{filename}; assert(stream.rdbuf()); std::fstream moved; moved = std::move(stream); }
{ std::filebuf buffer; buffer.pubimbue(std::locale::classic()); assert(buffer.open(filename, std::ios::in | std::ios::out));
assert(buffer.sbumpc() == '4'); assert(buffer.sputbackc('4') == '4');
buffer.pubseekpos(0, std::ios::out); buffer.sputc('7'); assert(buffer.pubsync() == 0);
std::filebuf other; std::swap(buffer, other); assert(other.close()); }`,
    [
        "io/basic_filebuf",
        "io/basic_fstream",
        "io/basic_ifstream",
        "io/basic_ofstream",
    ],
    {
        setup: `#include <string>
#include <filesystem>
#include <chrono>
struct TemporaryFile {
    std::string name = (std::filesystem::temp_directory_path() / ("cpp-library-example-" + std::to_string(std::chrono::steady_clock::now().time_since_epoch().count()))).string();
    ~TemporaryFile() { std::remove(name.c_str()); }
} file;`,
        minimumVersion: "17",
        input: "Write and read a temporary file, then remove it. Public streambuf operations dispatch to filebuf's protected overflow, uflow, pbackfail, imbue, and sync functions.",
    },
);
add(
    "strstream",
    "11",
    ["strstream"],
    `char input[] = "42"; std::istrstream reader{input}; assert(reader.str() == input);
int value{}; reader >> value; assert(value == 42);
std::ostrstream output; output << value << std::ends; assert(std::string(output.str()) == "42"); output.freeze(false);
char buffer[32]{}; std::strstream stream{buffer, 32}; stream << "73"; stream.seekg(0); stream >> value; assert(value == 73);
std::strstreambuf storage{buffer, 32}; storage.sgetc(); storage.sbumpc(); storage.sputbackc(buffer[0]);`,
    ["io/istrstream", "io/ostrstream", "io/strstream", "io/strstreambuf"],
    { setup: "#include <string>" },
);
add(
    "fpos",
    "11",
    ["ios", "cwchar"],
    `std::fpos<std::mbstate_t> position{0}; std::mbstate_t state{}; position.state(state);
position += std::streamoff{4}; assert(std::streamoff(position) == 4);
auto copy = position; assert(copy - position == 0);`,
    ["io/fpos", "io/streamoff"],
);
add(
    "c-file",
    "11",
    ["cstdio", "cwchar", "cstdarg"],
    `std::FILE* file = std::tmpfile(); assert(file);
std::fputs("42", file); assert(std::fflush(file) == 0); std::rewind(file);
std::fpos_t position; assert(std::fgetpos(file, &position) == 0); assert(std::fgetc(file) == '4'); assert(std::fsetpos(file, &position) == 0);
std::fclose(file);
std::FILE* wide = std::tmpfile(); assert(wide);
std::fwide(wide, 1); print(wide, L"%d", 73); std::rewind(wide);
assert(std::fgetwc(wide) == L'7'); assert(std::ungetwc(L'7', wide) == L'7'); int number{};
assert(scan(wide, L"%d", &number) == 1 && number == 73);
std::rewind(wide); number = 0; assert(std::fwscanf(wide, L"%d", &number) == 1 && number == 73); std::fclose(wide);
// getchar/getwchar read standard input; ungetc/ungetwc supply a character without interactive input.
assert(std::ungetc('A', stdin) == 'A'); assert(std::getchar() == 'A');`,
    ["io/c"],
    {
        setup: `int print(std::FILE* file, const wchar_t* format, ...) { std::va_list args; va_start(args, format); int n = std::vfwprintf(file, format, args); va_end(args); return n; }
int scan(std::FILE* file, const wchar_t* format, ...) { std::va_list args; va_start(args, format); int n = std::vfwscanf(file, format, args); va_end(args); return n; }`,
    },
);
add(
    "getwchar",
    "11",
    ["cstdio", "cwchar"],
    `std::fwide(stdin, 1); assert(std::ungetwc(L'A', stdin) == L'A'); assert(std::getwchar() == L'A');`,
    ["io/c/getwchar"],
);
add(
    "variadic",
    "11",
    ["cstdarg"],
    `assert(sum(3, 2, 3, 4) == 9);`,
    ["utility/variadic"],
    {
        setup: "int sum(int count, ...) { std::va_list arguments; va_start(arguments, count); int result = 0; for (int i = 0; i < count; ++i) result += va_arg(arguments, int); va_end(arguments); return result; }",
    },
);
add(
    "signal",
    "11",
    ["csignal"],
    `std::sig_atomic_t before = signal_count; (void)before;
auto previous = std::signal(SIGINT, handler); assert(previous != SIG_ERR);
std::raise(SIGINT); assert(signal_count == 1);
std::signal(SIGINT, SIG_IGN); std::raise(SIGINT); assert(signal_count == 1);
std::signal(SIGINT, previous);
int signals[]{SIGABRT, SIGFPE, SIGILL, SIGINT, SIGSEGV, SIGTERM}; assert(signals[3] == SIGINT);`,
    ["utility/program"],
    {
        setup: "volatile std::sig_atomic_t signal_count = 0;\nvoid handler(int) { signal_count = 1; }",
    },
);
add(
    "error",
    "11",
    ["exception", "stdexcept", "system_error", "string"],
    `std::exception base, copy; copy = base; assert(base.what());
std::bad_exception bad, other; other = bad; assert(bad.what());
std::system_error failure{std::make_error_code(std::errc::invalid_argument), "input"}; assert(failure.code() == std::errc::invalid_argument); assert(*failure.what());
const auto& category = std::generic_category(); assert(*category.name()); assert(!category.message(1).empty()); assert(category == category);
assert(category.default_error_condition(1).value() == 1);
auto code = std::make_error_code(std::errc::invalid_argument);
assert(category.equivalent(code.value(), code.default_error_condition())); assert(category.equivalent(code, code.value()));
static_assert(std::is_error_condition_enum<std::errc>::value);
auto terminate = std::get_terminate(); assert(terminate);
std::terminate_handler previous = std::set_terminate(handler); assert(std::get_terminate() == handler); std::set_terminate(previous);
try { throw std::runtime_error("inner"); } catch (...) { auto pointer = std::make_exception_ptr(std::runtime_error("message")); try { std::rethrow_exception(pointer); } catch (const std::runtime_error& e) { assert(std::string(e.what()) == "message"); } }
try { try { throw std::runtime_error("inner"); } catch (...) { std::throw_with_nested(std::logic_error("outer")); } }
catch (const std::exception& e) { auto nested = dynamic_cast<const std::nested_exception*>(&e); assert(nested && nested->nested_ptr()); std::nested_exception clone{*nested}; clone = *nested; try { clone.rethrow_nested(); } catch (const std::runtime_error& inner) { assert(std::string(inner.what()) == "inner"); } }`,
    [
        "error/bad_exception",
        "error/exception",
        "error/error_category",
        "error/error_condition/is_error_condition_enum",
        "error/errc/is_error_condition_enum",
        "error/get_terminate",
        "error/terminate_handler",
        "error/make_exception_ptr",
        "error/nested_exception",
        "error/system_error",
    ],
    { setup: "#include <cstdlib>\nvoid handler() { std::_Exit(1); }" },
);
add(
    "unexpected",
    "11",
    ["exception"],
    `std::unexpected_handler previous = std::set_unexpected(handler);
assert(std::get_unexpected() == handler); std::set_unexpected(previous);`,
    [
        "error/get_unexpected",
        "error/set_unexpected",
        "error/unexpected_handler",
        "error/exception/get_unexpected",
        "error/exception/set_unexpected",
        "error/exception/unexpected_handler",
    ],
    { setup: "void handler() { throw std::bad_exception{}; }" },
);
add(
    "terminate-process",
    "11",
    ["exception", "cstdlib"],
    `std::set_terminate([] { std::_Exit(0); });
std::terminate();`,
    ["error/terminate"],
    {
        input: "terminate does not return. The registered handler exits this example process successfully.",
    },
);
add(
    "unexpected-process",
    "11",
    ["exception", "cstdlib"],
    `std::set_unexpected([] { std::_Exit(0); });
std::unexpected();`,
    ["error/unexpected"],
    {
        input: "Historical API, removed in C++17. Its handler exits this example process successfully.",
    },
);
add(
    "iterators",
    "20",
    ["iterator", "sstream", "vector", "list", "algorithm"],
    `std::vector<int> values{2, 3};
std::back_insert_iterator back{values}; *back = 4; ++back; back++;
assert(values.back() == 4);
std::list<int> list{2, 3}; std::front_insert_iterator front{list}; *front = 1; ++front; front++;
assert(list.front() == 1);
std::insert_iterator insert{values, values.begin()}; *insert = 1; ++insert; insert++;
assert(values.front() == 1);
std::istringstream stream{"2 3"}; std::istream_iterator<int> input{stream}, end;
assert(input != end && *input == 2); ++input; assert(*input++ == 3);
std::istringstream bytes{"abc"}; std::istreambuf_iterator<char> byte{bytes}, byteEnd;
assert(!byte.equal(byteEnd) && byte != byteEnd && *byte == 'a'); assert(*byte++ == 'a');
std::ostringstream output; std::ostream_iterator<int> out{output}; *out++ = 7; ++out;
std::ostreambuf_iterator<char> buffer{output}; *buffer = 'x'; ++buffer; buffer++;
assert(!buffer.failed()); assert(output.str() == "7x");
int data[]{1, 2, 3}; std::move_iterator<int*> moved{data}, copy;
copy = moved; ++copy; copy += 1; copy -= 1; --copy;
assert(copy == moved && moved + 1 == 1 + moved && moved + 2 - moved == 2);
std::move_sentinel finish{data + 3}; std::move_sentinel<int*> finishCopy; finishCopy = finish;
assert(finishCopy.base() == data + 3 && finish - moved == 3);
static_assert(std::is_same_v<std::incrementable_traits<int*>::difference_type, std::ptrdiff_t>);
static_assert(std::is_same_v<std::indirectly_readable_traits<int*>::value_type, int>);
static_assert(std::is_same_v<std::iter_value_t<int*>, int>);
static_assert(std::is_same_v<std::iter_reference_t<int*>, int&>);
assert(std::ranges::iter_move(data) == 1); std::ranges::iter_swap(data + 0, data + 1); assert(data[0] == 2);`,
    [
        "iterator/back_insert_iterator",
        "iterator/front_insert_iterator",
        "iterator/insert_iterator",
        "iterator/istream_iterator",
        "iterator/istreambuf_iterator",
        "iterator/ostream_iterator",
        "iterator/ostreambuf_iterator",
        "iterator/move_iterator",
        "iterator/move_sentinel",
        "iterator/incrementable_traits",
        "iterator/indirectly_readable_traits",
        "iterator/iter_t",
        "iterator/ranges",
    ],
);
add(
    "raw-storage",
    "11",
    ["memory", "iterator"],
    `std::allocator<int> allocator; int* storage = allocator.allocate(2);
std::raw_storage_iterator<int*, int> output{storage}; assert(output.base() == storage);
*output = 7; ++output; *output++ = 9;
assert(storage[0] == 7 && storage[1] == 9);
allocator.destroy(storage); allocator.destroy(storage + 1); allocator.deallocate(storage, 2);`,
    ["memory/raw_storage_iterator"],
);
add(
    "const-iterator",
    "23",
    ["iterator"],
    `int values[]{1, 2, 3}; std::basic_const_iterator position{values};
assert(*position == 1 && position[1] == 2 && position.base() == values);
auto copy = position; ++position; --position; position += 1; position -= 1;
assert(position == copy && position - copy == 0 && copy + 1 == 1 + copy);
assert(std::ranges::iter_move(copy) == 1);
using Common = std::common_type_t<decltype(copy), const int*>; (void)sizeof(Common);`,
    ["iterator/basic_const_iterator"],
    { feature: "__cpp_lib_ranges_as_const >= 202207L" },
);
add(
    "subrange",
    "20",
    ["ranges", "vector"],
    `int values[]{1, 2, 3}; std::ranges::subrange range{values, values + 3};
assert(!range.empty() && *range.begin() == 1 && range.end() == values + 3);
static_assert(std::ranges::input_range<decltype(range)>);
static_assert(std::ranges::output_range<decltype(range), int>);
static_assert(std::ranges::view<decltype(range)>);
static_assert(std::is_same_v<std::ranges::iterator_t<decltype(range)>, int*>);
static_assert(std::is_same_v<std::ranges::range_reference_t<decltype(range)>, int&>);
static_assert(std::is_same_v<std::ranges::range_size_t<decltype(range)>, std::size_t>);
static_assert(std::is_same_v<std::ranges::borrowed_iterator_t<decltype(range)>, int*>);
std::ranges::subrange<int*, int*, std::ranges::subrange_kind::sized> sized{values, values + 3};
assert(sized.size() == 3);`,
    [
        "ranges/subrange",
        "ranges/subrange_kind",
        "ranges/input_range",
        "ranges/output_range",
        "ranges/view",
        "ranges/iterator_t",
        "ranges/range_reference_t",
        "ranges/range_size_t",
        "ranges/borrowed_iterator_t",
    ],
);
add(
    "view-interface",
    "23",
    ["ranges"],
    `int values[]{1, 2, 3}; auto view = std::views::all(values);
assert(view.front() == 1 && view.back() == 3 && view[1] == 2 && view.size() == 3);
assert(*view.cbegin() == 1 && view.cend() - view.cbegin() == 3);`,
    ["ranges/view_interface"],
    { feature: "__cpp_lib_ranges_as_const >= 202207L" },
);
const viewFamilies = {
    adjacent_view: [
        "23",
        "std::views::adjacent<2>(values)",
        "__cpp_lib_ranges_zip >= 202110L",
    ],
    adjacent_transform_view: [
        "23",
        "std::views::adjacent_transform<2>(values, [](int a, int b) { return a + b; })",
        "__cpp_lib_ranges_zip >= 202110L",
    ],
    cartesian_product_view: [
        "23",
        "std::views::cartesian_product(values, values)",
        "__cpp_lib_ranges_cartesian_product >= 202207L",
    ],
    join_view: ["20", "std::views::join(nested)"],
    join_with_view: [
        "23",
        "std::views::join_with(nested, 0)",
        "__cpp_lib_ranges_join_with >= 202202L",
    ],
    stride_view: [
        "23",
        "std::views::stride(values, 2)",
        "__cpp_lib_ranges_stride >= 202207L",
    ],
    zip_view: [
        "23",
        "std::views::zip(values, values)",
        "__cpp_lib_ranges_zip >= 202110L",
    ],
    zip_transform_view: [
        "23",
        "std::views::zip_transform([](int a, int b) { return a + b; }, values, values)",
        "__cpp_lib_ranges_zip >= 202110L",
    ],
    elements_view: ["20", "std::views::elements<0>(pairs)"],
    enumerate_view: [
        "23",
        "std::views::enumerate(values)",
        "__cpp_lib_ranges_enumerate >= 202302L",
    ],
    slide_view: [
        "23",
        "std::views::slide(values, 2)",
        "__cpp_lib_ranges_slide >= 202202L",
    ],
    transform_view: [
        "20",
        "std::views::transform(values, [](int n) { return n * 2; })",
    ],
    take_view: ["20", "std::views::take(values, 3)"],
    take_while_view: [
        "20",
        "std::views::take_while(values, [](int n) { return n < 5; })",
    ],
    filter_view: [
        "20",
        "std::views::filter(values, [](int n) { return n % 2 == 1; })",
    ],
    iota_view: ["20", "std::views::iota(1, 4)"],
    repeat_view: [
        "23",
        "std::views::repeat(7, 3)",
        "__cpp_lib_ranges_repeat >= 202207L",
    ],
};
for (const [name, [version, expression, feature]] of Object.entries(
    viewFamilies,
)) {
    const writable = [
        "adjacent_view",
        "cartesian_product_view",
        "join_view",
        "join_with_view",
        "stride_view",
        "zip_view",
    ].includes(name);
    add(
        name,
        version,
        ["ranges", "iterator", "tuple"],
        `[[maybe_unused]] int values[]{1, 3, 5, 7};
[[maybe_unused]] int nested[][2]{{1, 2}, {3, 4}};
[[maybe_unused]] std::pair<int, int> pairs[]{{1, 10}, {2, 20}};
auto base = std::ranges::subrange(std::counted_iterator(values, 4), std::default_sentinel);
auto nestedBase = std::ranges::subrange(std::counted_iterator(nested, 2), std::default_sentinel);
auto pairBase = std::ranges::subrange(std::counted_iterator(pairs, 2), std::default_sentinel);
(void)nestedBase; (void)pairBase;
auto view = ${expression
            .replace(/\bvalues\b/g, "base")
            .replace(/\bnested\b/g, "nestedBase")
            .replace(/\bpairs\b/g, "pairBase")};
auto first = view.begin(); auto sentinel = view.end();
assert(first != sentinel); inspectSentinel(first, sentinel); auto copy = first; assert(copy == first);
(void)*first; ++copy; assert(copy != first);
${writable ? "std::ranges::iter_swap(first, copy);" : ""}
${name === "enumerate_view" ? "assert(first.index() == 0); (void)first.base();" : ""}
${["elements_view", "stride_view"].includes(name) ? "(void)first.base();" : ""}
${name === "elements_view" ? "assert(view.size() == 2);" : ""}
assert(std::ranges::distance(view) > 0);
// A non-common base keeps a distinct sentinel type and exercises its constructor and comparison.
${
    ["elements_view", "enumerate_view", "transform_view"].includes(name)
        ? `auto counted = std::ranges::subrange(std::counted_iterator(values, 4), std::default_sentinel);
auto different = ${name === "elements_view" ? "std::views::elements<0>(std::ranges::subrange(std::counted_iterator(pairs, 2), std::default_sentinel))" : name === "enumerate_view" ? "std::views::enumerate(counted)" : "std::views::transform(counted, [](int n) { return n * 2; })"};
auto stop = different.end(); (void)stop.base(); assert(different.begin() != stop);
assert(stop - different.begin() > 0);`
        : ""
}`,
        [`ranges/${name}`],
        {
            feature,
            setup: "template<class I, class S> void inspectSentinel(I position, S sentinel) { if constexpr (requires { sentinel.base(); }) (void)sentinel.base(); if constexpr (requires { sentinel - position; }) assert(sentinel - position > 0); if constexpr (requires { position - sentinel; }) assert(position - sentinel < 0); }",
            input: "Build the view, construct and compare its iterator/sentinel, and traverse it. Internal satisfy helpers are exercised by advancing the public iterator.",
        },
    );
}
add(
    "split",
    "20",
    ["ranges", "string_view"],
    `std::string_view input = "one,two";
auto split = std::views::split(input, ','); auto first = split.begin(); auto end = split.end();
assert(first != end); auto word = *first; assert(std::ranges::distance(word) == 3); ++first; assert(first != end);
auto lazy = std::views::lazy_split(input, ','); auto outer = lazy.begin();
auto inner = (*outer).begin(); assert(*inner == 'o'); ++inner; assert(*inner == 'n');
++outer; assert(*(*outer).begin() == 't');`,
    ["ranges/split_view", "ranges/lazy_split_view"],
    {
        input: "Split a character sequence at commas. begin and iterator increment invoke the exposition-only find_next helper; inner/outer iterators read the lazy tokens.",
    },
);
add(
    "istream-view",
    "20",
    ["ranges", "sstream"],
    `std::istringstream input{"2 3"}; auto view = std::ranges::istream_view<int>(input);
auto position = view.begin(); assert(*position == 2); ++position; assert(*position == 3); ++position; assert(position == view.end());`,
    ["ranges/basic_istream_view"],
);
add(
    "range-box",
    "20",
    ["ranges"],
    `int values[]{1, 2, 3}; int factor = 2;
auto transform = std::views::transform(values, [factor](int n) { return n * factor; });
auto copy = transform; assert(*copy.begin() == 2);
auto filter = std::views::filter(values, [](int n) { return n > 1; });
assert(*filter.begin() == 2); auto copied = filter; assert(*copied.begin() == 2);`,
    ["ranges/copyable_wrapper", "ranges/non-propagating-cache"],
    {
        input: "Captured callables use the exposition-only assignable wrapper; copying a filter view resets its non-propagating begin cache. These helper names are not public APIs.",
    },
);
add(
    "chunk",
    "23",
    ["ranges", "sstream"],
    `int values[]{1, 2, 3, 4}; auto chunks = std::views::chunk(values, 2);
auto position = chunks.begin(); (void)position.base(); assert(std::ranges::distance(*position) == 2);
auto countedInput = std::ranges::subrange(std::counted_iterator(InputIterator{values}, 4), std::default_sentinel);
auto singlePass = countedInput | std::views::chunk(2);
auto outer = singlePass.begin(); auto part = *outer; auto inner = part.begin();
assert(*inner == 1); std::ranges::iter_swap(inner, inner);
assert(singlePass.end() - outer == 2); assert(part.end() - inner == 2);
(void)inner.base(); assert(std::ranges::iter_move(inner) == 1);
++inner; assert(*inner == 2); ++outer; assert(*(*outer).begin() == 3);
// Iterator assignment is deleted for the single-pass inner/outer iterator.
static_assert(!std::is_copy_assignable_v<decltype(inner)>);`,
    ["ranges/chunk_view"],
    {
        feature: "__cpp_lib_ranges_chunk >= 202202L",
        setup: "struct InputIterator { using value_type = int; using difference_type = std::ptrdiff_t; using iterator_concept = std::input_iterator_tag; int* position; int& operator*() const { return *position; } InputIterator& operator++() { ++position; return *this; } void operator++(int) { ++*this; } };",
    },
);
add(
    "filesystem",
    "17",
    ["filesystem", "fstream", "string"],
    `namespace fs = std::filesystem;
fs::path path = directory.path / "file"; auto copy = path; copy.assign(path); assert(copy == path && copy.has_filename() && !copy.empty());
assert(path.is_absolute() && !path.is_relative()); copy.clear(); assert(copy.empty()); copy = path; copy.swap(path); std::swap(copy, path);
auto format = fs::path::generic_format; (void)format;
{ std::ofstream output{path}; output << "data"; }
fs::directory_entry entry{path}, other; other = entry; assert(other == entry); entry.refresh(); assert(entry.hard_link_count() >= 1);
fs::file_status status{fs::file_type::regular}; fs::file_status assigned; assigned = status; assigned.type(fs::file_type::directory); assert(status.type() == fs::file_type::regular && status.type() != assigned.type());
assert(fs::status_known(status) && !fs::is_other(status));
fs::directory_iterator begin{directory.path}, end; assert(begin != end && begin->path() == path); auto cursor = begin; cursor.increment(error); assert(!error && cursor == end);
fs::create_directory(directory.path / "nested");
{ std::ofstream nestedFile{directory.path / "nested" / "child"}; nestedFile << "child"; }
fs::recursive_directory_iterator recursive{directory.path, fs::directory_options::none}; assert(recursive.options() == fs::directory_options::none);
assert(recursive.recursion_pending()); auto moved = recursive; recursive = moved; (void)*recursive; recursive.increment(error); assert(!error);
auto nestedCursor = fs::recursive_directory_iterator(directory.path);
while (nestedCursor != fs::recursive_directory_iterator{} && nestedCursor.depth() == 0) ++nestedCursor;
assert(nestedCursor.depth() == 1); nestedCursor.pop();
fs::filesystem_error failure{"test", path, std::make_error_code(std::errc::invalid_argument)}, assignedError = failure; assignedError = failure; assert(assignedError.path1() == path);
fs::create_symlink(path, directory.path / "link", error);
if (!error) { fs::copy_symlink(directory.path / "link", directory.path / "copy", error); assert(!error && fs::is_symlink(directory.path / "copy")); }`,
    ["filesystem"],
    {
        setup: `#include <chrono>
struct Directory {
    std::filesystem::path path = std::filesystem::temp_directory_path() / ("cpp-library-dir-" + std::to_string(std::chrono::steady_clock::now().time_since_epoch().count()));
    Directory() { std::filesystem::create_directory(path); }
    ~Directory() { std::error_code error; std::filesystem::remove_all(path, error); }
} directory;
std::error_code error;`,
    },
);
add(
    "regex",
    "11",
    ["regex", "string", "sstream"],
    `std::regex pattern{"(a+)"}; pattern.assign("(a+)"); assert(pattern.flags() == std::regex::ECMAScript);
auto locale = pattern.getloc(); pattern.imbue(locale); pattern.assign("(a+)");
std::regex other; other = pattern; other.swap(pattern); std::swap(other, pattern);
std::string input = "aa a"; std::smatch result; assert(std::regex_search(input, result, other));
assert(!result.empty() && result.length() == 2 && result.begin() != result.end() && result.max_size() >= result.size());
auto allocator = result.get_allocator(); (void)allocator;
std::smatch copy; copy = result; assert(copy == result); copy.swap(result); std::swap(copy, result);
assert(result[1].compare("aa") == 0 && result[1] == std::string("aa"));
std::sregex_iterator position{input.begin(), input.end(), other}, end;
auto next = position; ++next; assert(next != position); position = next; assert(position == next);
std::sregex_token_iterator token{input.begin(), input.end(), other, 1}, tokenEnd;
assert(token != tokenEnd && token->str() == "aa"); auto tokenCopy = token; ++tokenCopy; token = tokenCopy;
std::regex_traits<char> traits; traits.imbue(std::locale::classic()); (void)traits.getloc();
assert(traits.translate('A') == 'A' && traits.translate_nocase('A') == 'a');
assert(!traits.transform(input.begin(), input.end()).empty());
std::regex_error error{std::regex_constants::error_brack}, assigned = error; assigned = error; assert(error.code() == assigned.code());
std::regex_constants::match_flag_type flags = std::regex_constants::match_default; (void)flags;`,
    ["regex"],
);
add(
    "clocks",
    "20",
    ["chrono", "ctime", "sstream", "format"],
    `using namespace std::chrono;
auto start = steady_clock::now(); auto finish = steady_clock::now(); assert(finish >= start);
auto precise = high_resolution_clock::now(); (void)precise;
auto now = system_clock::now(); std::time_t time = system_clock::to_time_t(now); (void)time;
std::clock_t ticks = std::clock(); (void)ticks;
auto file = file_clock::now(); auto system = file_clock::to_sys(file); auto roundtrip = file_clock::from_sys(system); assert(roundtrip == file);
auto text = std::format("{}", system); assert(!text.empty());
std::ostringstream output; output << system; assert(!output.str().empty());`,
    [
        "chrono/steady_clock",
        "chrono/high_resolution_clock",
        "chrono/system_clock",
        "chrono/file_clock",
        "chrono/c",
    ],
    { feature: "__cpp_lib_chrono >= 201907L" },
);
add(
    "time-zones",
    "20",
    ["chrono", "sstream", "format", "string"],
    `using namespace std::chrono;
const auto& database = get_tzdb(); auto& databases = get_tzdb_list();
assert(databases.begin() != databases.end() && !databases.front().version.empty());
const auto* zone = locate_zone("Etc/UTC"); assert(zone == database.locate_zone("Etc/UTC"));
(void)database.current_zone(); assert(!zone->name().empty()); assert(*zone == *zone);
sys_seconds instant{seconds{0}}; auto local = zone->to_local(instant);
assert(zone->to_sys(local) == instant);
auto info = zone->get_info(instant); assert(info.offset == seconds{0});
auto localInfo = zone->get_info(local); assert(localInfo.result == local_info::unique);
zoned_time time{zone, instant}, copy = time; copy = time;
assert(time == copy && time.get_time_zone() == zone && time.get_sys_time() == instant && time.get_local_time() == local);
assert(time.get_info().offset == seconds{0});
assert(zoned_traits<const time_zone*>::locate_zone("Etc/UTC") == zone);
assert(zoned_traits<const time_zone*>::default_zone());
std::ostringstream output; output << time << info << localInfo << local;
assert(!output.str().empty());
assert(!std::format("{} {} {} {}", time, info, localInfo, local).empty());
if (!database.links.empty()) { const auto& link = database.links.front(); assert(link == link && !link.name().empty() && !link.target().empty()); }
const auto* ny = locate_zone("America/New_York");
local_seconds ambiguous = local_days{2024y/November/3} + hours{1} + minutes{30};
assert(ny->get_info(ambiguous).result == local_info::ambiguous);
try { (void)ny->to_sys(ambiguous); assert(false); } catch (const ambiguous_local_time&) {}
assert(ny->to_sys(ambiguous, choose::earliest) < ny->to_sys(ambiguous, choose::latest));
local_seconds missing = local_days{2024y/March/10} + hours{2} + minutes{30};
try { (void)ny->to_sys(missing); assert(false); } catch (const nonexistent_local_time&) {}
// tzdb_list::erase_after mutates the process-wide list. Only remove a non-current tail if one exists.
auto first = databases.begin(); auto next = first; ++next;
if (next != databases.end()) databases.erase_after(first);`,
    [
        "chrono/zoned_time",
        "chrono/choose",
        "chrono/tzdb",
        "chrono/tzdb_list",
        "chrono/tzdb_functions",
        "chrono/time_zone",
        "chrono/time_zone_link",
        "chrono/locate_zone",
        "chrono/ambiguous_local_time",
        "chrono/nonexistent_local_time",
        "chrono/local_info",
        "chrono/local_t",
        "chrono/sys_info",
        "chrono/zoned_traits",
    ],
    { feature: "__cpp_lib_chrono >= 201907L" },
);
add(
    "clock-conversion",
    "20",
    ["chrono", "sstream", "format"],
    `using namespace std::chrono;
sys_seconds system{seconds{0}};
auto utc = utc_clock::from_sys(system); assert(utc_clock::to_sys(utc) == system);
auto tai = tai_clock::from_utc(utc); assert(tai_clock::to_utc(tai) == utc);
auto gps = gps_clock::from_utc(utc); assert(gps_clock::to_utc(gps) == utc);
assert(clock_cast<utc_clock>(system) == utc);
assert((clock_time_conversion<utc_clock, system_clock>{}(system) == utc));
leap_second_info info = get_leap_second_info(utc); assert(!info.is_leap_second);
const auto& leaps = get_tzdb().leap_seconds;
if (!leaps.empty()) { const auto& leap = leaps.front(); assert(leap == leap); (void)leap.date(); }
std::ostringstream text; text << utc << tai << gps; assert(!text.str().empty());`,
    [
        "chrono/utc_clock",
        "chrono/tai_clock",
        "chrono/gps_clock",
        "chrono/clock_cast",
        "chrono/clock_time_conversion",
        "chrono/leap_second",
    ],
    { feature: "__cpp_lib_chrono >= 201907L" },
);
for (const [type, pattern, input] of [
    ["day", "%d", "15"],
    ["month", "%m", "03"],
    ["year", "%Y", "2024"],
    ["weekday", "%a", "Fri"],
    ["month_day", "%m-%d", "03-15"],
    ["year_month", "%Y-%m", "2024-03"],
    ["year_month_day", "%F", "2024-03-15"],
    ["sys_seconds", "%F %T", "2024-03-15 12:00:00"],
    ["local_seconds", "%F %T", "2024-03-15 12:00:00"],
    ["utc_seconds", "%F %T", "2024-03-15 12:00:00"],
    ["tai_seconds", "%F %T", "2024-03-15 12:00:00"],
    ["gps_seconds", "%F %T", "2024-03-15 12:00:00"],
    ["file_time<seconds>", "%F %T", "2024-03-15 12:00:00"],
]) {
    const roots = type.includes("sys_")
        ? ["chrono/system_clock/from_stream"]
        : type.includes("local_")
          ? ["chrono/local_t/from_stream"]
          : type.includes("utc_")
            ? ["chrono/utc_clock/from_stream"]
            : type.includes("tai_")
              ? ["chrono/tai_clock/from_stream"]
              : type.includes("gps_")
                ? ["chrono/gps_clock/from_stream"]
                : type.includes("file_time")
                  ? ["chrono/file_clock/from_stream"]
                  : [`chrono/${type}/from_stream`];
    add(
        `parse-${type.replace(/[^a-z0-9]/g, "-")}`,
        "20",
        ["chrono", "sstream"],
        `using namespace std::chrono;
${type} value{}; std::istringstream input{"${input}"};
from_stream(input, "${pattern}", value); assert(!input.fail());
std::istringstream second{"${input}"}; ${type} parsed{}; second >> parse("${pattern}", parsed); assert(!second.fail() && parsed == value);`,
        [...roots, ...(type === "year_month_day" ? ["chrono/parse"] : [])],
        { feature: "__cpp_lib_chrono >= 201907L" },
    );
}
add(
    "format-duration",
    "20",
    ["chrono", "format"],
    `auto text = std::format("{}", std::chrono::seconds{42}); assert(text == "42s");`,
    ["chrono/duration/formatter"],
    { feature: "__cpp_lib_chrono >= 201907L" },
);
add(
    "locale",
    "11",
    ["locale", "sstream", "iomanip", "codecvt", "string"],
    `std::locale classic = std::locale::classic(), copy; copy = classic; assert(copy == classic);
auto previous = std::locale::global(classic); std::locale::global(previous);
const auto& ctype = std::use_facet<std::ctype<char>>(classic);
assert(ctype.is(std::ctype_base::alpha, 'A') && ctype.table() && std::ctype<char>::classic_table());
const auto& numbers = std::use_facet<std::numpunct<char>>(classic); assert(numbers.decimal_point() == '.');
// Explicitly construct facets; their locale owns and destroys them.
std::locale facets{classic, new std::ctype<char>};
facets = std::locale{facets, new std::ctype<wchar_t>};
facets = std::locale{facets, new std::collate<char>};
facets = std::locale{facets, new std::codecvt<wchar_t, char, std::mbstate_t>};
facets = std::locale{facets, new std::num_get<char>};
facets = std::locale{facets, new std::num_put<char>};
facets = std::locale{facets, new std::money_get<char>};
facets = std::locale{facets, new std::money_put<char>};
facets = std::locale{facets, new std::moneypunct<char>};
facets = std::locale{facets, new std::messages<char>};
facets = std::locale{facets, new std::time_get_byname<char>("C")};
facets = std::locale{facets, new std::time_put<char>};
std::locale named{classic, new std::collate_byname<char>("C")}; assert(std::use_facet<std::collate<char>>(named).compare("a", "a" + 1, "b", "b" + 1) < 0);
const auto& codec = std::use_facet<std::codecvt<wchar_t, char, std::mbstate_t>>(classic);
std::mbstate_t state{}; char output[16], *next{}; auto result = codec.unshift(state, output, output + 16, next);
assert(result == std::codecvt_base::noconv || result == std::codecvt_base::ok);
std::wstring_convert<std::codecvt_utf8<wchar_t>> convert; assert(convert.from_bytes("A") == L"A"); (void)convert.state();
std::stringbuf bytes; std::wbuffer_convert<std::codecvt_utf8<wchar_t>> buffer{&bytes}; (void)buffer.state();
std::locale custom{classic, new Marker}; assert(std::has_facet<Marker>(custom));
std::istringstream input{"123"}; input.imbue(classic); int number{}; input >> number; assert(number == 123);
std::ostringstream text; text.imbue(classic); text << std::put_money(123); assert(!text.str().empty());
std::istringstream money{"123"}; long double amount{}; money >> std::get_money(amount); assert(!money.fail());
std::tm date{}; date.tm_year = 124; date.tm_mon = 2; date.tm_mday = 15;
std::ostringstream time; time << std::put_time(&date, "%Y-%m-%d"); assert(time.str() == "2024-03-15");
std::istringstream calendar{"2024-03-15"}; calendar >> std::get_time(&date, "%Y-%m-%d"); assert(!calendar.fail());
auto order = std::use_facet<std::time_get<char>>(classic).date_order(); (void)order;
const auto& messages = std::use_facet<std::messages<char>>(classic); std::messages_base::catalog catalog = messages.open("cpp-library-missing-catalog", classic); if (catalog >= 0) messages.close(catalog);
std::money_base::pattern pattern = std::use_facet<std::moneypunct<char>>(classic).pos_format(); (void)pattern;
// Stream extraction/insertion dispatches to the installed num_get/num_put, money_get/money_put, and time_get/time_put facets.`,
    ["locale"],
    {
        setup: "struct Marker : std::locale::facet { static std::locale::id id; Marker() : std::locale::facet(0u) {} };\nstd::locale::id Marker::id;",
    },
);
add(
    "execution",
    "17",
    ["execution", "algorithm", "array"],
    `std::execution::sequenced_policy policy = std::execution::seq;
std::array<int, 3> values{3, 1, 2}; std::sort(policy, values.begin(), values.end()); assert(values[0] == 1);`,
    ["algorithm/execution_policy_tag_t"],
);
add(
    "node",
    "17",
    ["map"],
    `std::map<int, int> source{{1, 7}}, target;
auto node = source.extract(1); assert(!node.empty() && node.key() == 1 && node.mapped() == 7);
target.insert(std::move(node)); assert(node.empty() && target.at(1) == 7);`,
    ["container/node_handle"],
);
add(
    "vector-bool",
    "11",
    ["vector"],
    `std::vector<bool> values{false, true}; std::vector<bool>::reference bit = values[0]; bit = true; bit.flip(); assert(!static_cast<bool>(bit));`,
    ["container/vector_bool"],
);
for (const type of ["flat_map", "flat_multimap", "flat_set", "flat_multiset"]) {
    const map = type.includes("map");
    add(
        type,
        "23",
        [map ? "flat_map" : "flat_set", "vector"],
        `std::${type}<int${map ? ", int" : ""}> values;
values.insert(${map ? "{2, 20}" : "2"}); values.emplace(${map ? "1, 10" : "1"}); values.emplace_hint(values.end(), ${map ? "3, 30" : "3"});
assert(values.count(2) == 1 && values.lower_bound(2) != values.end() && values.upper_bound(2) != values.begin());
std::${type}<int${map ? ", int" : ""}> copy = values; assert(copy == values); copy.swap(values); std::swap(copy, values);
${map ? "auto compare = values.value_comp(); assert(compare({1, 10}, {2, 20}));\nstd::" + type + " deduced{std::vector<int>{1, 2}, std::vector<int>{10, 20}}; assert(deduced.size() == 2);\nstd::" + type + "<int, int> sorted{std::" + (type === "flat_map" ? "sorted_unique" : "sorted_equivalent") + ", std::vector<int>{1, 2}, std::vector<int>{10, 20}}; assert(sorted.size() == 2);" : "std::" + type + " deduced(std::vector<int>{1, 2}); assert(deduced.size() == 2);\nstd::" + type + "<int> sorted{std::" + (type === "flat_set" ? "sorted_unique" : "sorted_equivalent") + ", std::vector<int>{1, 2}}; assert(sorted.size() == 2);"}`,
        [
            `container/${type}`,
            ...(type === "flat_map"
                ? ["container/sorted_unique"]
                : type === "flat_multimap"
                  ? ["container/sorted_equivalent"]
                  : []),
        ],
        { feature: `__cpp_lib_${map ? "flat_map" : "flat_set"} >= 202207L` },
    );
}
add(
    "mdspan",
    "23",
    ["mdspan", "array"],
    `using E = std::extents<std::size_t, 2, std::dynamic_extent>;
E extents{3}; assert(extents.rank() == 2 && extents.rank_dynamic() == 1 && extents.extent(1) == 3);
std::extents deduced{2, 3}; assert(deduced.extent(0) == 2);
assert(extents == E{3});
std::layout_right::mapping<E> right{extents}, rightCopy{extents}; assert(right == rightCopy);
std::layout_left::mapping<E> left{extents}, leftCopy{extents}; assert(left == leftCopy);
std::layout_stride::mapping<E> stride{extents, std::array<std::size_t, 2>{3, 1}}, strideCopy{extents, std::array<std::size_t, 2>{3, 1}}; assert(stride == strideCopy);
assert(right(1, 2) == 5 && left(1, 2) == 5 && stride(1, 2) == 5);
assert(right.required_span_size() == 6 && left.required_span_size() == 6 && stride.required_span_size() == 6);
assert(right.extents() == extents && left.extents() == extents && stride.extents() == extents);
assert(right.stride(1) == 1 && left.stride(0) == 1 && stride.strides()[0] == 3);
assert(right.is_unique() && right.is_exhaustive() && right.is_strided());
assert(left.is_unique() && left.is_exhaustive() && left.is_strided());
assert(stride.is_unique() && stride.is_exhaustive() && stride.is_strided());
static_assert(decltype(right)::is_always_unique() && decltype(right)::is_always_exhaustive() && decltype(right)::is_always_strided());
static_assert(decltype(left)::is_always_unique() && decltype(left)::is_always_exhaustive() && decltype(left)::is_always_strided());
static_assert(decltype(stride)::is_always_unique() && decltype(stride)::is_always_strided());
int values[]{1, 2, 3, 4, 5, 6}; std::mdspan<int, E> matrix{values, extents};
assert((matrix[1, 2] == 6)); assert(matrix.data_handle() == values && matrix.extents() == extents);
assert(!matrix.empty() && matrix.size() == 6 && matrix.rank() == 2 && matrix.rank_dynamic() == 1);
assert(matrix.static_extent(0) == 2 && matrix.extent(1) == 3 && matrix.stride(1) == 1);
assert(matrix.mapping()(1, 2) == 5 && matrix.accessor().access(values, 0) == 1);
assert(matrix.is_unique() && matrix.is_exhaustive() && matrix.is_strided());
std::default_accessor<int> accessor; assert(accessor.offset(values, 1) == values + 1);
auto copy = matrix; copy = matrix; std::swap(copy, matrix);
std::mdspan deducedMatrix{values}; assert(deducedMatrix.extent(0) == 6);
// extents construction/indexing exercises its private dynamic-index and product helpers; these names are exposition-only.`,
    ["container/mdspan"],
    { feature: "__cpp_lib_mdspan >= 202207L" },
);
add(
    "coroutine",
    "20",
    ["coroutine", "functional", "exception"],
    `auto task = produce(); auto handle = task.handle; assert(handle && !handle.done());
auto address = handle.address(); auto recovered = std::coroutine_handle<Promise>::from_address(address); assert(recovered == handle);
auto fromPromise = std::coroutine_handle<Promise>::from_promise(handle.promise()); assert(fromPromise == handle);
std::coroutine_handle<> erased = handle; std::coroutine_handle<> assigned; assigned = erased; assert(assigned.address() == address);
assert(std::hash<std::coroutine_handle<>>{}(erased) == std::hash<std::coroutine_handle<>>{}(assigned));
handle.resume(); assert(handle.promise().value == 7 && handle.done());
handle.destroy(); task.handle = nullptr;
std::suspend_always always; std::suspend_never never; assert(!always.await_ready() && never.await_ready());
auto noop = std::noop_coroutine(); std::noop_coroutine_promise& promise = noop.promise(); (void)promise; noop.resume(); assert(!noop.done());`,
    [
        "coroutine/coroutine_handle",
        "coroutine/suspend_always",
        "coroutine/suspend_never",
        "coroutine/noop_coroutine_promise",
    ],
    {
        setup: `struct Promise;
struct Task { using promise_type = Promise; std::coroutine_handle<Promise> handle; };
struct Promise {
    int value = 0;
    Task get_return_object() { return {std::coroutine_handle<Promise>::from_promise(*this)}; }
    std::suspend_always initial_suspend() noexcept { return {}; }
    std::suspend_always final_suspend() noexcept { return {}; }
    void return_value(int result) noexcept { value = result; }
    void unhandled_exception() { std::terminate(); }
};
Task produce() { co_return 7; }`,
    },
);
add(
    "generator",
    "23",
    ["generator", "stdexcept"],
    `auto sequence = numbers(); auto moved = std::move(sequence); auto assigned = numbers(); assigned = std::move(moved);
auto iterator = assigned.begin(); assert(iterator != assigned.end() && *iterator == 1); ++iterator; assert(*iterator == 2); ++iterator; assert(iterator == assigned.end());
try { for (int value : failure()) { (void)value; } assert(false); } catch (const std::runtime_error&) {}
// Compiler-generated calls drive promise allocation, get_return_object, initial/final suspend, yield_value, return_void, exception handling, and frame deletion.`,
    ["coroutine/generator"],
    {
        feature: "__cpp_lib_generator >= 202207L",
        probe: "#include <generator>\n#include <utility>\nstd::generator<int> values() { co_yield 1; }\nvoid probe() { auto a = values(); auto b = values(); a = std::move(b); }",
        input: "Yield two values, transfer ownership, and propagate an exception. Requires a conforming generator implementation; libstdc++ 14.2 has a missing return in its move-assignment implementation.",
        setup: 'std::generator<int> numbers() { co_yield 1; co_yield 2; co_return; }\nstd::generator<int> failure() { co_yield 0; throw std::runtime_error("failed"); co_return; }',
    },
);
add(
    "stacktrace",
    "23",
    ["stacktrace", "functional", "string", "sstream"],
    `auto trace = std::stacktrace::current(); std::stacktrace copy; copy = trace; assert(copy == trace);
auto allocator = trace.get_allocator(); (void)allocator; copy.swap(trace); std::swap(copy, trace);
(void)std::hash<std::stacktrace>{}(trace);
if (!trace.empty()) { std::stacktrace_entry entry = trace.at(0), assigned; assigned = entry;
assert(assigned == entry && static_cast<bool>(entry)); assert(trace[0] == entry);
(void)entry.native_handle(); (void)entry.description(); (void)entry.source_file(); (void)entry.source_line();
assert(std::hash<std::stacktrace_entry>{}(assigned) == std::hash<std::stacktrace_entry>{}(entry)); }
// Stack collection and source-symbol availability depend on the implementation.`,
    ["utility/basic_stacktrace", "utility/stacktrace_entry"],
    { feature: "__cpp_lib_stacktrace >= 202011L", flags: ["-lstdc++exp"] },
);
add(
    "format",
    "23",
    ["format", "string", "vector", "map", "set", "tuple"],
    `int number = 7; auto arguments = std::make_format_args(number);
std::format_args erased{arguments}; auto argument = erased.get(0);
std::visit_format_arg([](auto value) { if constexpr (std::is_same_v<decltype(value), int>) assert(value == 7); }, argument);
std::string output; std::vformat_to(std::back_inserter(output), "{}", erased); assert(output == "7");
std::format_string<int&> format{"{}"}; assert(std::format(format, number) == "7");
auto kind = std::format_kind<std::vector<int>>; assert(kind == std::range_format::sequence);
std::format_parse_context parse{"}"}; assert(parse.begin() != parse.end()); parse.advance_to(parse.begin());
static_assert(std::formattable<int, char>);
std::vector<int> sequence{1, 2}; std::map<int, int> mapping{{1, 2}}; std::set<int> set{1, 2};
assert(!std::format("{} {} {} {}", sequence, mapping, set, std::tuple{1, 2}).empty());
std::vector<char> letters{'h', 'i'}; assert(std::format("{:s}", letters) == "hi");
// Formatting drives basic_format_context and the tuple/range formatter specializations.
assert(std::format("{}", Custom{9}) == "9");`,
    ["utility/format"],
    {
        feature: "__cpp_lib_format_ranges >= 202207L",
        setup: `struct Custom { int value; };
template<> struct std::formatter<Custom> : std::formatter<int> {
    auto format(const Custom& value, std::format_context& context) const { return std::formatter<int>::format(value.value, context); }
};`,
        input: "Erase arguments, inspect an argument, write formatted text, and format containers/custom values. A custom value exercises basic_format_arg::handle.",
    },
);
for (const type of ["queue", "stack", "priority_queue"])
    add(
        `format-${type}`,
        "23",
        ["format", type === "stack" ? "stack" : "queue"],
        `std::${type}<int> values; values.push(1); values.push(2);
auto text = std::format("{}", values); assert(!text.empty());`,
        [`container/${type}/formatter`],
        { feature: "__cpp_lib_format_ranges >= 202207L" },
    );
add(
    "print",
    "23",
    ["print", "cstdio", "format", "fstream"],
    `std::FILE* file = std::tmpfile(); assert(file);
int number = 7; std::vprint_unicode(file, "{}", std::make_format_args(number));
std::vprint_nonunicode(file, "{}", std::make_format_args(number));
std::rewind(file); assert(std::fgetc(file) == '7'); assert(std::fgetc(file) == '7'); std::fclose(file);
std::ostringstream stream; std::vprint_unicode(stream, "{}", std::make_format_args(number)); std::vprint_nonunicode(stream, "{}", std::make_format_args(number)); std::println(stream, "{}", number); assert(stream.str() == "777\\n");`,
    [
        "io/vprint_unicode",
        "io/vprint_nonunicode",
        "io/basic_ostream/println",
        "io/basic_ostream/vprint_unicode",
        "io/basic_ostream/vprint_nonunicode",
    ],
    { feature: "__cpp_lib_print >= 202207L", setup: "#include <sstream>" },
);

// Most-specific roots win, so specialized examples override a general family.
export function completionFor(path) {
    let match,
        length = -1;
    for (const example of completionExamples)
        for (const root of example.roots)
            if (
                (path === `cpp/${root}.html` ||
                    path.startsWith(`cpp/${root}/`)) &&
                root.length > length
            ) {
                match = example;
                length = root.length;
            }
    return match;
}
add(
    "function-assign",
    "11",
    ["functional", "memory"],
    `std::function<int(int)> function;
function.assign([](int n) { return n + 1; }, std::allocator<int>{});
assert(function(2) == 3);`,
    ["utility/functional/function/assign"],
    {
        probe: "#include <functional>\n#include <memory>\nvoid probe() { std::function<int(int)> f; f.assign([](int n) { return n; }, std::allocator<int>{}); }",
        input: "Historical allocator-aware assignment, removed in C++17. This overload is supported by older-mode libc++ but was never implemented in libstdc++.",
    },
);
add(
    "function-allocator-trait",
    "11",
    ["functional", "memory"],
    `constexpr bool acceptsAllocator = std::uses_allocator<std::function<int(int)>, std::allocator<int>>::value;
// The C++11/C++14 specification provided this specialization, but implementations differed.
// C++17 removed allocator support from std::function.
(void)acceptsAllocator;
std::function<int(int)> function = [](int n) { return n + 1; }; assert(function(2) == 3);`,
    ["utility/functional/function/uses_allocator"],
);

add(
    "file-status-equality",
    "20",
    ["filesystem"],
    `std::filesystem::file_status status{std::filesystem::file_type::regular};
auto copy = status; assert(copy == status);`,
    ["filesystem/file_status/operator=="],
);

add(
    "packaged-allocator-trait",
    "11",
    ["future", "memory"],
    `static_assert(std::uses_allocator<std::packaged_task<int()>, std::allocator<int>>::value, "Allocator-aware in C++11/14");
std::packaged_task<int()> task{[] { return 7; }}; auto result = task.get_future(); task(); assert(result.get() == 7);`,
    ["thread/packaged_task/uses_allocator"],
    {
        input: "The uses_allocator specialization exists in C++11/14 and was removed in C++17.",
    },
);

add(
    "stacktrace-formatter",
    "23",
    ["stacktrace", "format"],
    `auto trace = std::stacktrace::current();
if (!trace.empty()) { auto text = std::format("{}", trace[0]); assert(!text.empty()); }`,
    ["utility/stacktrace_entry/formatter"],
    {
        feature:
            "__cpp_lib_stacktrace >= 202011L && __cpp_lib_formatters >= 202302L",
        flags: ["-lstdc++exp"],
    },
);
