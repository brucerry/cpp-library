import { icon } from "./ui.js";

const themes = {
    light: ["Light", "sun"],
    dark: ["Dark", "moon"],
    colorful: ["Colorful", "paint"],
};
export function themeControl() {
    return `<div class="theme-picker"><button class="icon-button theme-toggle" aria-label="Choose color theme" aria-haspopup="menu" aria-expanded="false" aria-controls="theme-menu"></button><div class="theme-popover" id="theme-menu" role="menu" aria-label="Color theme" hidden>${Object.entries(
        themes,
    )
        .map(
            ([value, [label, glyph]]) =>
                `<button role="menuitemradio" aria-checked="false" data-theme-choice="${value}" aria-label="${label}" title="${label}" tabindex="-1">${icon(glyph)}<span>${label}</span></button>`,
        )
        .join("")}</div></div>`;
}
export function installThemes(storage, prefix) {
    let theme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    try {
        const saved = storage.getItem(`${prefix}theme`);
        if (themes[saved]) theme = saved;
    } catch {}
    const picker = document.querySelector(".theme-picker");
    const trigger = picker.querySelector(".theme-toggle");
    const menu = picker.querySelector(".theme-popover");
    const choices = [...menu.querySelectorAll("button")];
    let closeTimer;
    const apply = () => {
        document.documentElement.dataset.theme = theme;
        trigger.innerHTML = icon(themes[theme][1]);
        trigger.setAttribute(
            "aria-label",
            `Choose color theme: ${themes[theme][0]}`,
        );
        choices.forEach((button) =>
            button.setAttribute(
                "aria-checked",
                String(button.dataset.themeChoice === theme),
            ),
        );
        window.dispatchEvent(new Event("themechange"));
    };
    const open = (focus = false) => {
        clearTimeout(closeTimer);
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        if (focus)
            choices
                .find((button) => button.dataset.themeChoice === theme)
                .focus();
    };
    const close = (focus = false) => {
        clearTimeout(closeTimer);
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        if (focus) trigger.focus();
    };
    picker.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") open();
    });
    picker.addEventListener("pointerleave", () => {
        closeTimer = setTimeout(() => {
            if (!picker.contains(document.activeElement)) close();
        }, 180);
    });
    trigger.addEventListener("click", () => open(true));
    choices.forEach((button) =>
        button.addEventListener("click", () => {
            theme = button.dataset.themeChoice;
            apply();
            try {
                storage.setItem(`${prefix}theme`, theme);
            } catch {}
            close(true);
        }),
    );
    picker.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            close(true);
        }
        if (event.key === "Tab") {
            close();
            return;
        }
        if (
            [
                "ArrowDown",
                "ArrowUp",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
            ].includes(event.key)
        ) {
            event.preventDefault();
            if (menu.hidden || document.activeElement === trigger) {
                open(true);
                return;
            }
            const position = choices.indexOf(document.activeElement);
            const next =
                event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (position +
                            (["ArrowDown", "ArrowRight"].includes(event.key)
                                ? 1
                                : -1) +
                            3) %
                        3;
            choices[next].focus();
        }
    });
    document.addEventListener("pointerdown", (event) => {
        if (!picker.contains(event.target)) close();
    });
    document.addEventListener("focusin", (event) => {
        if (!picker.contains(event.target)) close();
    });
    apply();
}
