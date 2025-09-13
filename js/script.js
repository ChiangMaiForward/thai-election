const PARTY_SHEET_URL = "YOUR_PARTY_SHEET_JSON_URL";
const CONSTITUENCY_SHEET_URL = "YOUR_CONSTITUENCY_SHEET_JSON_URL";

async function loadData() {
  const partyRes = await fetch(PARTY_SHEET_URL);
  const parties = await partyRes.json();

  const conRes = await fetch(CONSTITUENCY_SHEET_URL);
  const constituencies = await conRes.json();

  renderSeatMap(parties);
  renderBars(parties);
  renderDistrictTable(constituencies, parties);
}

function renderSeatMap(parties) {
  const canvas = document.getElementById("seatMap");
  const ctx = canvas.getContext("2d");

  const totalSeats = 500;
  let seatIndex = 0;

  parties.forEach(p => {
    const count = Number(p.seats_district) + Number(p.seats_partylist);
    const anglePerSeat = Math.PI / totalSeats;

    ctx.fillStyle = p.color;
    for (let i = 0; i < count; i++) {
      const angle = i * anglePerSeat; // 0–180 องศา
      const x = canvas.width/2 + Math.cos(angle) * 180;
      const y = canvas.height - Math.sin(angle) * 180;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2*Math.PI);
      ctx.fill();
      seatIndex++;
    }
  });
}

function renderBars(parties) {
  const container = document.getElementById("bars");
  container.innerHTML = "";
  parties.forEach(p => {
    const seats = Number(p.seats_district) + Number(p.seats_partylist);
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = (seats*2) + "px"; // scale
    bar.style.backgroundColor = p.color;
    bar.innerText = `${p.party_name} ${seats} ที่นั่ง`;
    container.appendChild(bar);
  });
}

function renderDistrictTable(data, parties) {
  const tbody = document.querySelector("#districtTable tbody");
  tbody.innerHTML = "";

  // Group by province + district
  const grouped = {};
  data.forEach(row => {
    const key = row.province + "-" + row.district;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  for (let key in grouped) {
    const rows = grouped[key].sort((a,b) => a.rank - b.rank).slice(0,3);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${rows[0].province}</td>
      <td>${rows[0].district}</td>
      <td style="color:${findColor(rows[0].party_id, parties)}">${rows[0].candidate} (${rows[0].party_id})</td>
      <td style="color:${findColor(rows[1].party_id, parties)}">${rows[1].candidate} (${rows[1].party_id})</td>
      <td style="color:${findColor(rows[2].party_id, parties)}">${rows[2].candidate} (${rows[2].party_id})</td>
    `;
    tbody.appendChild(tr);
  }
}

function findColor(partyId, parties) {
  const p = parties.find(x => x.party_id === partyId);
  return p ? p.color : "#555";
}

loadData();
