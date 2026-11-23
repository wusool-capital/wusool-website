// Referral partner modal: opens from [data-form="refer"], validates in the
// browser and shows a thank-you. Nothing is sent yet.
const dialog = document.querySelector<HTMLDialogElement>("#refer-dialog");
const form = document.querySelector<HTMLFormElement>("#refer-form");
const thanks = document.querySelector<HTMLElement>("#refer-thanks");
const owner = document.querySelector<HTMLInputElement>("#refer-owner");
const ownerWrap = document.querySelector<HTMLElement>("#refer-owner-wrap");
const source = document.querySelector<HTMLInputElement>("#refer-source");

if (dialog && form && thanks && owner && ownerWrap && source) {
  document.querySelectorAll<HTMLElement>('[data-form="refer"]').forEach((b) =>
    b.addEventListener("click", () => {
      // Start fresh each time, then record which button opened it.
      form.reset();
      ownerWrap.hidden = true;
      owner.required = false;
      source.value = b.dataset.source ?? "";
      form.hidden = false;
      thanks.hidden = true;
      dialog.showModal();
    }),
  );
  dialog
    .querySelectorAll("[data-close]")
    .forEach((b) => b.addEventListener("click", () => dialog.close()));
  // Close on a click on the backdrop, but not when a text selection that
  // started in a field ends there.
  let downOnBackdrop = false;
  dialog.addEventListener("mousedown", (e) => {
    downOnBackdrop = e.target === dialog;
  });
  dialog.addEventListener("click", (e) => {
    if (downOnBackdrop && e.target === dialog) dialog.close();
  });
  // The owner's agreement is required only for an introduction.
  form.addEventListener("change", () => {
    const type = form.elements.namedItem("type") as RadioNodeList;
    const introduce = type.value === "introduce";
    ownerWrap.hidden = !introduce;
    owner.required = introduce;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.hidden = true;
    thanks.hidden = false;
    thanks.querySelector<HTMLElement>("h2")?.focus();
  });
}
