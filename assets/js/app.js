import { LR_SHIPS_SYSTEMS } from "./data-lr-ships.js";
import { evaluateLRShips } from "./engine-lr-ships.js";
import { renderUI } from "./ui.js";

const systemSel = document.querySelector("#system");
LR_SHIPS_SYSTEMS.forEach(r => {
  const opt = document.createElement("option"); opt.value = r.id; opt.textContent = r.label; systemSel.appendChild(opt);
});
systemSel.value = "cargo_oil_lines_lt60"; // por defecto (tu caso típico)

document.querySelector("#eval").addEventListener("click", () => {
  const ctx = {
    systemId: systemSel.value,
    space: document.querySelector("#space").value,
    pipeClass: document.querySelector("#pipeClass").value,
    od_mm: parseFloat(document.querySelector("#od").value),
    isPumpRoom: document.querySelector("#pumpRoom").checked,
    isOpenDeck: document.querySelector("#space").value==="open_deck",
    accessibility: document.querySelector("#notEasy").checked ? "not_easy" : "easy",
    asMainMeans: document.querySelector("#asMain").checked,
    // flags opcionales (colocar según tu UI cuando los uses):
    directToShipSideBelowLimit:false,
    tankContainsFlammable:false,
    isSteam: systemSel.value==="steam",
    designPressureBar: 10
  };
  const res = evaluateLRShips(ctx);
  renderUI(res);
});
