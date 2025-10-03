import { getJointImageSrc } from "./joint-images.js";

function openImageModal(src, caption) {
  const modal = document.getElementById("imgModal");
  const img = document.getElementById("imgModalPic");
  const cap = document.getElementById("imgModalCaption");
  img.src = src;
  img.alt = caption;
  cap.textContent = caption || "";
  modal.classList.remove("hidden");
}

function closeImageModal() {
  const modal = document.getElementById("imgModal");
  const img = document.getElementById("imgModalPic");
  img.src = "";
  document.getElementById("imgModalCaption").textContent = "";
  modal.classList.add("hidden");
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
      const id = btn.dataset.subtypeId;
      const name = btn.dataset.subtypeName || btn.textContent.trim();
      openImageModal(getJointImageSrc(id), name);
    });
  });
}
