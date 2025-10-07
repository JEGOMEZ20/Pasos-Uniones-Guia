// rules-router.js

// Importa evaluadores y helpers ya creados
import { evaluateLRShips, getNoteText as getShipsNoteText } from './rules-lr-ships.js';
import { evaluateLRNaval, getNavalNoteText } from './rules-lr-naval.js';

// Catálogos de sistemas (se leen del JSON real para no duplicar)
async function loadServiceList(norm){
  const url = norm === 'lr_ships' ? './lr_ships.table_service.json' : './lr_naval.table_service.json';
  const data = await (await fetch(url)).json();
  const arr = Array.isArray(data) ? data : Object.values(data);
  // Espera {key,label_es} por fila
  return arr
    .filter(r => r && r.key)
    .map(r => ({ key: r.key, label: r.label_es || r.label || r.key }));
}

// Catálogos de espacios por norma (claves que usa la lógica)
const SPACES = {
  lr_ships: [
    { key:'machinery_category_A', label:'Máquinas Categoría A' },
    { key:'accommodation', label:'Acomodaciones' },
    { key:'pump_room', label:'Sala de bombas' },
    { key:'open_deck', label:'Cubierta abierta / Weather deck' },
    { key:'service_space', label:'Espacio de servicio' }
  ],
  lr_naval: [
    { key:'machinery_category_A', label:'Máquinas Categoría A' },
    { key:'accommodation', label:'Acomodaciones' },
    { key:'munition_store', label:'Pañol de munición' },
    { key:'open_deck_low_fire_risk', label:'Cubierta abierta (bajo riesgo de fuego)' },
    { key:'weather_deck', label:'Weather deck' },
    { key:'cargo_hold', label:'Bodega (no fácilmente accesible)' },
    { key:'tank_same_medium', label:'Tanque (mismo medio)' },
    { key:'tank_other_medium', label:'Tanque (otro medio)' },
    { key:'above_limit_watertight_integrity_only', label:'Sobre límite estanqueidad (drenajes internos)' }
  ]
};

const form = document.querySelector('#form-lr');
const selNorm   = document.querySelector('#select-norm');
const selSystem = document.querySelector('#select-system');
const selSpace  = document.querySelector('#select-space');
const selClass  = document.querySelector('#select-class');
const inOD      = document.querySelector('#input-od');
const tankField = document.querySelector('#field-tank-same');
const chkTank   = document.querySelector('#chk-tank-same');
const host      = document.querySelector('#result');

selNorm.addEventListener('change', refreshLists);
selSpace.addEventListener('change', () => toggleTankFlag(selNorm.value, selSpace.value));
form.addEventListener('submit', onSubmit);

// Primera carga
await refreshLists();

async function refreshLists(){
  // Sistemas
  const systems = await loadServiceList(selNorm.value);
  selSystem.innerHTML = systems.map(o => `<option value="${o.key}">${o.label}</option>`).join('');

  // Espacios
  const spaces = SPACES[selNorm.value] || [];
  selSpace.innerHTML = spaces.map(o => `<option value="${o.key}">${o.label}</option>`).join('');

  // Flags especiales
  toggleTankFlag(selNorm.value, selSpace.value);

  // Limpiar resultados
  host.innerHTML = '';
}

function toggleTankFlag(norm, space){
  const show = norm === 'lr_naval' && (space?.startsWith('tank'));
  tankField.style.display = show ? 'block' : 'none';
  if (!show) chkTank.checked = false;
}

async function onSubmit(e){
  e.preventDefault();
  const norm   = selNorm.value;
  const input  = {
    systemKey: selSystem.value,
    spaceKey : selSpace.value,
    klass    : selClass.value,
    od_mm    : Number(inOD.value || 0)
  };
  if (!input.od_mm || input.od_mm <= 0) {
    alert('Ingresa un OD (mm) válido.');
    return;
  }
  if (norm === 'lr_naval' && selSpace.value?.startsWith('tank')) {
    input.inside_tank_medium_same = !!chkTank.checked;
  }

  let cards;
  if (norm === 'lr_ships') {
    ({ cards } = evaluateLRShips(input));
    render(cards, 'ships');
  } else {
    ({ cards } = evaluateLRNaval(input));
    render(cards, 'naval');
  }
}

function render(cards, norm){
  host.innerHTML = '';
  cards.forEach(c => host.appendChild(cardNode(c, norm)));
}

function cardNode(card, norm){
  const node = document.createElement('div');
  node.className = `card ${card.status === 'NO PERMITIDO' ? 'card--blocked' : ''}`;
  node.innerHTML = `
    <div class="card__head">
      <h3>${card.title}</h3>
      <span class="badge ${card.status==='NO PERMITIDO'?'badge--danger':'badge--ok'}">${card.status}</span>
    </div>
    <div class="card__body">
      ${card.reason ? `<p class="muted">${card.reason}</p>` : ''}
      ${card.fire_resistant_tag ? `<p class="muted">${card.fire_resistant_tag}</p>` : ''}
      ${card.fire_test ? `<p class="muted">${card.fire_test}</p>` : ''}
      ${notesChips(card.notes)}
      <button class="btn-see" ${card.status==='NO PERMITIDO' ? 'disabled aria-disabled="true"': ''}>VER</button>
    </div>
  `;

  // Tooltips ES/EN por nota
  node.querySelectorAll('.note-chip').forEach(chip => {
    chip.addEventListener('click', ()=>{
      const id = chip.getAttribute('data-id');
      const getText = norm === 'ships' ? getShipsNoteText : getNavalNoteText;
      const { es, en } = getText(id, 'es');
      showNoteModal(`Nota ${id}`, es, en);
    });
  });
  return node;
}

function notesChips(ids=[]){
  if (!ids.length) return `<p class="muted">Notas aplicadas: —</p>`;
  const chips = ids.map(id => `<button type="button" class="note-chip" data-id="${id}">N${id}</button>`).join(' ');
  return `<p class="muted">Notas aplicadas: ${chips}</p>`;
}

function showNoteModal(title, es, en){
  const modal = document.querySelector('#note-modal');
  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-es').textContent = es;
  modal.querySelector('.modal-en').textContent = en;
  modal.showModal();
}
