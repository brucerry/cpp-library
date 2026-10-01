import { icon } from "./ui.js";
export const modeLabels = {
    available: "Available in this version",
    introduced: "New or updated in this version",
};
export function modePicker(mode) {
    return `<div class="mode-picker"><span id="mode-label">Show</span><button type="button" id="edition-mode" role="combobox" aria-label="Version matching" aria-expanded="false" aria-controls="mode-options" aria-haspopup="listbox" data-value="${mode}">${modeLabels[mode]}${icon("chevron")}</button><div id="mode-options" role="listbox" aria-label="Version matching" hidden>${Object.entries(
        modeLabels,
    )
        .map(
            ([value, label]) =>
                `<button type="button" role="option" tabindex="-1" aria-selected="${value === mode}" data-mode="${value}">${label}${value === mode ? icon("check") : ""}</button>`,
        )
        .join("")}</div></div>`;
}
export function installModePicker(onChange) {
    const close = (focus = false) => {
        const trigger = document.querySelector("#edition-mode");
        const list = document.querySelector("#mode-options");
        if (!trigger || !list) return;
        trigger.setAttribute("aria-expanded", "false");
        list.hidden = true;
        if (focus) trigger.focus();
    };
    const open = () => {
        const trigger = document.querySelector("#edition-mode");
        const list = document.querySelector("#mode-options");
        trigger.setAttribute("aria-expanded", "true");
        list.hidden = false;
        list.querySelector('[aria-selected="true"]').focus();
    };
    document.addEventListener("click", (event) => {
        if (event.target.closest("#edition-mode")) {
            document.querySelector("#mode-options").hidden
                ? open()
                : close(true);
        } else if (event.target.closest("[data-mode]")) {
            onChange(event.target.closest("[data-mode]").dataset.mode);
            close(true);
        } else close();
    });
    document.addEventListener("focusin", (event) => {
        if (!event.target.closest(".mode-picker")) close();
    });
    document.addEventListener("keydown", (event) => {
        if (!event.target.closest(".mode-picker")) return;
        if (event.key === "Escape") {
            event.preventDefault();
            close(true);
        }
        if (event.key === "Tab") {
            close(true);
            return;
        }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const list = document.querySelector("#mode-options");
            if (list.hidden) {
                open();
                return;
            }
            const options = [...list.querySelectorAll('[role="option"]')];
            const current = options.indexOf(document.activeElement);
            const next =
                event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? options.length - 1
                      : (current +
                            (event.key === "ArrowDown" ? 1 : -1) +
                            options.length) %
                        options.length;
            options[next].focus();
        }
    });
}
