// Auto-advance every --tab-interval while visible; stop after a manual pick.
document.querySelectorAll<HTMLElement>("[data-process]").forEach((root) => {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const interval =
    parseFloat(getComputedStyle(root).getPropertyValue("--tab-interval")) *
    1000;
  let current = 0;
  let timer: number | undefined;
  let auto = !matchMedia("(prefers-reduced-motion: reduce)").matches;

  const show = (i: number) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const pane = document.getElementById(
        t.getAttribute("aria-controls") ?? "",
      );
      if (pane) {
        pane.hidden = !on;
        pane.classList.toggle("on", on);
      }
      const bar = t.querySelector<HTMLElement>(".prog");
      if (!bar) return;
      bar.classList.remove("run");
      void bar.offsetWidth; // restart the progress animation
      if (on && auto) bar.classList.add("run");
    });
    current = i;
  };
  const stop = () => {
    auto = false;
    clearInterval(timer);
  };
  const start = () => {
    if (!auto) return;
    clearInterval(timer);
    timer = window.setInterval(
      () => show((current + 1) % tabs.length),
      interval,
    );
    show(current);
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => {
      stop();
      show(i);
    });
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const n =
        (i + (e.key === "ArrowDown" ? 1 : -1) + tabs.length) % tabs.length;
      stop();
      show(n);
      tabs[n].focus();
    });
  });
  new IntersectionObserver(
    ([e]) => (e.isIntersecting ? start() : clearInterval(timer)),
    { threshold: 0.3 },
  ).observe(root);
});

export {};
