const DATA_URL = "./leaderboard.json";
const IMG = id => `./resources/${id}.png`;

async function loadData() {
    const res = await fetch(DATA_URL);
    return res.json();
}

function parsePlayers(raw) {
    return Object.entries(raw).map(([key, obj]) => {
        const data = { ...obj };
        delete data.name;
        delete data.color;

        return {
            id: key.replace(/[^a-z0-9]/gi, "").toLowerCase(),
            name: obj.name ?? key,
            color: obj.color ?? "#999",
            data
        };
    });
}

/* Years for TABLE: ASC */
function collectYearsAsc(players) {
    const years = new Set();
    players.forEach(p =>
        Object.keys(p.data).forEach(y => /^\d{4}$/.test(y) && years.add(y))
    );
    return [...years].sort((a, b) => a - b);
}

/* Years for BEST: DESC */
function collectYearsDesc(players) {
    return collectYearsAsc(players).slice().reverse();
}

/* ===== PLAYERS ===== */

function renderPlayers(players) {
    const root = document.getElementById("playersGrid");
    root.innerHTML = "";

    players.forEach(p => {
        root.innerHTML += `
      <div class="player-card" style="border-left: 6px solid ${p.color}">
        <div class="avatar">
          <img src="${IMG(p.id)}" alt="${p.name}">
        </div>
        <div class="player-name">${p.name}</div>
      </div>
    `;
    });
}

/* ===== BEST PLAYERS ===== */

function renderBest(players, yearsDesc) {
    const root = document.getElementById("bestList");
    root.innerHTML = "";

    yearsDesc.forEach(year => {
        let best = null;

        players.forEach(p => {
            const score = Number(p.data[year]);
            if (!Number.isFinite(score)) return;
            if (!best || score > best.score) best = { player: p, score };
        });

        if (!best) return;

        root.innerHTML += `
      <div class="best-card">
        <div class="best-photo">
          <img src="${IMG(best.player.id)}" alt="${best.player.name}">
          <div class="best-year">${year}</div>
        </div>
        <div class="best-info">
          <div class="best-name" style="color:${best.player.color}">
            ${best.player.name}
          </div>
          <div class="best-score" style="color:${best.player.color}">
            ${best.score} pts
          </div>
        </div>
      </div>
    `;
    });
}

/* ===== TABLE ===== */

function renderTable(players, yearsAsc) {
    const table = document.getElementById("leaderboardTable");

    const head = `
    <thead>
      <tr>
        <th>Year</th>
        ${players.map(p =>
        `<th title="${p.name}" style="color:${p.color}">${p.name}</th>`
    ).join("")}
      </tr>
    </thead>
  `;

    const body = yearsAsc.map(year => {
        const values = players.map(p => Number(p.data[year]));
        const valid = values.filter(Number.isFinite);

        const max = Math.max(...valid);
        const min = Math.min(...valid);

        return `
      <tr>
        <td>${year}</td>
        ${values.map((v, i) => {
            if (!Number.isFinite(v)) return `<td>—</td>`;
            const cls =
                v === max ? "cell-good" :
                    v === min ? "cell-bad" : "";
            return `<td class="${cls}" style="color:${players[i].color}">${v}</td>`;
        }).join("")}
      </tr>
    `;
    }).join("");

    const totals = players.map(p =>
        Object.values(p.data)
            .map(Number)
            .filter(Number.isFinite)
            .reduce((a, b) => a + b, 0)
    );

    const bestTotal = Math.max(...totals);

    const totalRow = `
    <tr class="total-row">
      <td>TOTAL</td>
      ${totals.map((t, i) =>
        `<td class="${t === bestTotal ? "total-best" : ""}"
             style="color:${players[i].color}">${t}</td>`
    ).join("")}
    </tr>
  `;

    table.innerHTML = head + `<tbody>${body}${totalRow}</tbody>`;
}

/* ===== INIT ===== */

async function main() {
    const raw = await loadData();
    const players = parsePlayers(raw);

    const yearsAsc = collectYearsAsc(players);
    const yearsDesc = collectYearsDesc(players);

    renderPlayers(players);
    renderBest(players, yearsDesc);
    renderTable(players, yearsAsc);
}

main();
