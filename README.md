# CPP Library

[![Update library and deploy Pages](https://github.com/brucerry/cpp-library/actions/workflows/pages.yml/badge.svg)](https://github.com/brucerry/cpp-library/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

We are building a library of C++ libraries. Welcome to join us as one of the librarians.

---

## Develop

Use Node.js 22.19+ and Python 3.12+ (for archive extraction).

```sh
npm ci
npm run dev
```

```sh
npm run sync           # Import the latest English reference archive
npm test               # Validate inventory, every page, English text, versions, and cache behavior
npm run test:examples  # Compile and run original examples; requires GCC 14+, CXX override supported
npm run test:browser   # Navigation, mobile, themes, offline behavior, and visual checkpoints
npm run build         # Generate dist/ for GitHub Pages
npm run format:check  # Check four-space formatting
```

Before the first browser test, run `npx playwright install chromium webkit`. Set `CXX` to a modern compiler path if the default compiler lacks C++23 support. Original and supplemental examples are in `src/catalog.js`, `src/supplemental-examples.js`, and `src/family-examples.js`. Imported C++ snippets are formatted with the four-space `.clang-format` configuration.

---

## Coverage and sources

The importer reads all declaration pages from the latest [English cppreference archive](https://github.com/PeterFeicht/cppreference-doc/releases/latest), excluding draft-only and non-library pages. The navigation includes 139 historical and current headers and over 4,500 reference pages. Pages group related overloads; page counts are not function or overload counts. Header introductions, known removals, and declaration versions are preserved. “Available in this version” is the default filter; “New or updated” remains selectable. C++03 is available as a maintenance edition without inventing new headers.

`public/data/coverage.json` records the archive SHA-256, header audit, exclusions, unresolved classifications, and pages missing standalone examples. The header inventory is checked against [N4950, the public C++23 committee draft](https://github.com/cplusplus/draft/blob/n4950/source/lib-intro.tex). **Complete ISO symbol/overload coverage and an example for every function are not yet verified.** Every page includes direct code or a clearly labeled related standalone example from the same type, topic, or header. Related examples retain their own attribution and do not count as examples of the exact API; the audit reports these separately. Imported reference examples retain their published expected or possible output; they are not all compiler-tested locally.

`npm run sync` updates the reference content, declarations, examples, and index and checks the [official development status](https://isocpp.org/std/status). Draft editions get a separate status page and official links. If the status website is unavailable, the last verified status and its original check date are retained with a workflow warning. An unrecognized status page stops publication for review. Function details load on demand from content-hashed JSON files. A failed import or validation prevents deployment and leaves the last successful site in place.

---

## Browser data

Each visit fetches the published index. Refreshes reuse tab-scoped `sessionStorage` and revalidate; visible tabs also poll every 15 minutes and recheck on reconnection. Up to 24 visited detail pages are cached. Failed updates preserve the last good copy. Closing a tab normally clears its session data; same-tab external links clear this project's keys. Crashes, address-bar navigation, and browser session restoration prevent guaranteed cleanup for every departure. No service worker or localStorage cache is used.

---

## Publish

In repository **Settings → Pages**, select **GitHub Actions**. A push to `main` or a manual run of **Update library and deploy Pages** validates and deploys the static site. The workflow also checks for source updates daily at 05:17 UTC. Scheduled workflows depend on GitHub availability and repository activity. Hash routes support direct function links without server rewrites. No generated updates are committed by the workflow.

---

## Attribution

Application code and original guides/examples use MIT. Imported and adapted reference content is by **cppreference contributors**, under [CC BY-SA 3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/); each page links to its source. Adaptations include text extraction, navigation, four-space code formatting, and Unicode escape display. That material is not relicensed as MIT. See [REFERENCE-LICENSE.md](REFERENCE-LICENSE.md). DM Sans and Manrope use the SIL Open Font License; notices are in `public/fonts/`. This independent project is not an official ISO or cppreference website.
