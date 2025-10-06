import { getJointImageSrc } from "./joint-images.js";

let lastFocusedElement = null;

function openImageModal(src, caption) {
  const modal = document.getElementById("imgModal");
  const img = document.getElementById("imgModalPic");
  const cap = document.getElementById("imgModalCaption");
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  img.src = src;
  img.alt = caption;
  cap.textContent = caption || "";
  modal.classList.remove("hidden");
  document.body?.classList.add("modal-open");
  modal.querySelector(".close")?.focus();
}

function closeImageModal() {
  const modal = document.getElementById("imgModal");
  const img = document.getElementById("imgModalPic");
  img.src = "";
  document.getElementById("imgModalCaption").textContent = "";
  modal.classList.add("hidden");
  document.body?.classList.remove("modal-open");
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

(function wireModal() {
  const modal = document.getElementById("imgModal");
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    if (e.target.id === "imgModal" || e.target.classList.contains("close")) {
      closeImageModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeImageModal();
  });
})();

// Llama a esto DESPUÉS de renderizar las tarjetas (cada evaluación)
export function wireViewButtons(root = document) {
  root.querySelectorAll('[data-action="view-joint"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled") || btn.getAttribute("aria-disabled") === "true") {
        return;
      }
      const id = btn.dataset.subtypeId;
      const name = btn.dataset.subtypeName || btn.textContent.trim();
      openImageModal(getJointImageSrc(id), name);
    });
  });
}
