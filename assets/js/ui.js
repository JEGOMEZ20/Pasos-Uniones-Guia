export function renderUI({ row, result }) {
  const cards = document.querySelector("#cards");
  cards.innerHTML = "";
  const order = [
    { key:"pipe_unions", title:"Uniones para tubería" },
    { key:"compression_couplings", title:"Acoples de compresión" },
    { key:"slip_on_joints", title:"Juntas tipo Slip-on" },
  ];
  order.forEach(({key,title}) => {
    const ev = result[key];
    const clauseList = [...new Set(ev.clauses)];
    const noteList = [...new Set(ev.notes)];
    const el = document.createElement("div");
    el.className = `card ${ev.status}`;
    el.innerHTML = `
      <h3>${title}</h3>
      <div>Estado: <b>${ev.status === "allowed" ? "PERMITIDO" : ev.status === "conditional" ? "CONDICIONAL" : "NO PERMITIDO"}</b></div>
      ${ev.conditions.length ? `<div>${ev.conditions.map(c=>`<span class="tag">${c}</span>`).join("")}</div>` : ""}
      ${ev.reasons.length ? `<div style="margin-top:8px">Motivos:<br>${ev.reasons.map(r=>`• ${r}`).join("<br>")}</div>` : ""}
      ${clauseList.length ? `<div style="margin-top:8px">Cláusulas: ${clauseList.map(c=>`<span class="tag clause">${c}</span>`).join(" ")}</div>` : ""}
      ${noteList.length ? `<div style="margin-top:8px">Notas de referencia: ${noteList.map(n=>`<span class="tag note">Nota ${n}</span>`).join(" ")}</div>` : ""}
      <div style="margin-top:8px">Subtipos:</div>
      <div>${ev.subtypes.map(s=>`
        <div class="subtype ${s.valid?'valid':''}">
          <span class="dot"></span><span>${s.name}</span> ${s.valid?'':'(no válido por clase/OD)'}
        </div>`).join("")}
      </div>
    `;
    cards.appendChild(el);
  });

  const notes = document.querySelector("#notes");
  if (row) {
    notes.innerHTML = `
      <div style="margin-top:16px" class="card">
        <div><b>Sistema:</b> ${row.label}</div>
        <div><b>Clasificación del sistema:</b> ${row.class_of_pipe_system}</div>
        <div><b>Ensayo de fuego:</b> ${row.fire_test==="not_required"?"No requerido": row.fire_test==="8+22"?"8 min seco + 22 min húmedo": (row.fire_test==="30min_dry"?"30 min seco":"30 min húmedo")}</div>
        ${row.notes.length ? `<div><b>Notas aplicables a este sistema:</b><br>${row.notes.map(n=>`Nota ${n.n}: ${n.text||""}`).join("<br>")}</div>` : ""}
      </div>
    `;
  } else {
    notes.innerHTML = "";
  }
}
