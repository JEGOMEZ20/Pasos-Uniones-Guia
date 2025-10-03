import "./joint-images.js";
import "./joint-viewer.js";
import { LR_SHIPS_SYSTEMS } from "./data-lr-ships.js";
import { LR_NAVAL_SYSTEMS } from "./data-lr-naval.js";
import { evaluateLRShips } from "./engine-lr-ships.js";
import { evaluateLRNaval } from "./engine-lr-naval.js";
import { renderUI } from "./ui.js";

const regulationSel = document.querySelector("#regulation");
const systemSel = document.querySelector("#system");

const REGULATIONS = {
  ships: {
    systems: LR_SHIPS_SYSTEMS,
    evaluate: evaluateLRShips,
    defaultSystem: "cargo_oil_lines_lt60"
  },
  naval: {
    systems: LR_NAVAL_SYSTEMS,
    evaluate: evaluateLRNaval,
    defaultSystem: LR_NAVAL_SYSTEMS[0]?.id || ""
  }
};

function populateSystems(regKey) {
  const reg = REGULATIONS[regKey];
  systemSel.innerHTML = "";
  if (!reg) return;
  reg.systems.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.label;
    systemSel.appendChild(opt);
  });
  const def = reg.defaultSystem || reg.systems[0]?.id;
  if (def) {
    systemSel.value = def;
  }
}

populateSystems(regulationSel.value || "ships");

regulationSel.addEventListener("change", () => {
  populateSystems(regulationSel.value);
  document.querySelector("#cards").innerHTML = "";
  document.querySelector("#notes").innerHTML = "";
});

document.querySelector("#eval").addEventListener("click", () => {
  const reg = REGULATIONS[regulationSel.value] || REGULATIONS.ships;
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
  const res = reg.evaluate(ctx);
  renderUI(res);
});
