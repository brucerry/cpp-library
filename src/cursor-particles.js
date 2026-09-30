// A persistent field of tiny cubes. Pointer forces travel through the field;
// springs return each cube to its place instead of leaving a cursor trail.
export function installCursorParticles() {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(pointer: fine)");
    const canvas = document.createElement("canvas");
    canvas.className = "cursor-particles";
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.effect = "wave-field";
    document.body.prepend(canvas);
    const context = canvas.getContext("2d");
    if (!context) return;
    let points = [];
    let frame = 0;
    let lastFrame = 0;
    let lastMove = -Infinity;
    let cursor = { x: -1000, y: -1000 };
    let palette;
    const colors = () => {
        const theme = document.documentElement.dataset.theme;
        palette =
            theme === "colorful"
                ? ["#8271c1", "#469990", "#d08098", "#b7964b"]
                : theme === "dark"
                  ? ["#94a6d9", "#99bbb8", "#b09dcc"]
                  : ["#8c9fcc", "#a2a5c7", "#a5bdb9"];
    };
    const draw = (time) => {
        context.clearRect(0, 0, innerWidth, innerHeight);
        const interactive = fine.matches && time - lastMove < 1600;
        canvas.dataset.active = String(interactive);
        for (const point of points) {
            const dx = point.x - cursor.x;
            const dy = point.y - cursor.y;
            const distance = Math.hypot(dx, dy);
            const influence = interactive ? Math.max(0, 1 - distance / 230) : 0;
            const safeDistance = Math.max(1, distance);
            const wave = motion.matches
                ? 0
                : Math.sin(point.x * 0.006 + point.y * 0.008 - time * 0.0007);
            const targetX = (dx / safeDistance) * influence * 42;
            const targetY =
                (dy / safeDistance) * influence * 42 +
                wave * (5 + influence * 22);
            point.vx = (point.vx + (targetX - point.ox) * 0.055) * 0.82;
            point.vy = (point.vy + (targetY - point.oy) * 0.055) * 0.82;
            point.ox += point.vx;
            point.oy += point.vy;
            const size = point.size + influence * 1.4;
            context.save();
            context.translate(point.x + point.ox, point.y + point.oy);
            context.rotate(wave * 0.22 + influence * 0.4);
            context.fillStyle = palette[point.color % palette.length];
            context.globalAlpha = 0.25 + influence * 0.35;
            context.beginPath();
            context.moveTo(0, -size);
            context.lineTo(size, -size / 2);
            context.lineTo(0, 0);
            context.lineTo(-size, -size / 2);
            context.closePath();
            context.fill();
            context.globalAlpha *= 0.65;
            context.beginPath();
            context.moveTo(-size, -size / 2);
            context.lineTo(0, 0);
            context.lineTo(0, size);
            context.lineTo(-size, size / 2);
            context.closePath();
            context.fill();
            context.globalAlpha *= 1.3;
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(size, -size / 2);
            context.lineTo(size, size / 2);
            context.lineTo(0, size);
            context.closePath();
            context.fill();
            context.restore();
        }
    };
    const tick = (time) => {
        // Cap this decorative layer at 30 fps, even on high-refresh displays.
        if (time - lastFrame >= 1000 / 30) {
            draw(time);
            lastFrame = time;
        }
        frame = requestAnimationFrame(tick);
    };
    const resume = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        if (document.hidden) return;
        draw(performance.now());
        if (!motion.matches && fine.matches)
            frame = requestAnimationFrame(tick);
    };
    const resize = () => {
        const scale = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = innerWidth * scale;
        canvas.height = innerHeight * scale;
        context.setTransform(scale, 0, 0, scale, 0, 0);
        const spacing = Math.max(
            34,
            Math.sqrt((innerWidth * innerHeight) / 1100),
        );
        points = [];
        for (let y = 15; y < innerHeight; y += spacing) {
            for (let x = 15; x < innerWidth; x += spacing) {
                points.push({
                    x,
                    y,
                    ox: 0,
                    oy: 0,
                    vx: 0,
                    vy: 0,
                    size: 1.1 + ((x + y) % 7) / 10,
                    color: points.length % 4,
                });
            }
        }
        canvas.dataset.count = String(points.length);
        resume();
    };
    window.addEventListener(
        "pointermove",
        (event) => {
            if (
                motion.matches ||
                !fine.matches ||
                event.pointerType === "touch"
            )
                return;
            cursor = { x: event.clientX, y: event.clientY };
            lastMove = performance.now();
        },
        { passive: true },
    );
    document.documentElement.addEventListener("pointerleave", () => {
        lastMove = -Infinity;
    });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("themechange", () => {
        colors();
        if (!frame) draw(performance.now());
    });
    document.addEventListener("visibilitychange", resume);
    motion.addEventListener("change", () => {
        lastMove = -Infinity;
        resume();
    });
    fine.addEventListener("change", resume);
    colors();
    resize();
}
