const PARTY_SHEET_URL = "https://script.google.com/macros/s/AKfycbwiS3Fg9jbFV3QuEV44wRPQGe99aDHfBgfOutLBjlzhJouBtxI_iAyIdL_KmQJUXE1V2Q/exec?sheet=party";
const CONSTITUENCY_SHEET_URL = "https://script.google.com/macros/s/AKfycbwiS3Fg9jbFV3QuEV44wRPQGe99aDHfBgfOutLBjlzhJouBtxI_iAyIdL_KmQJUXE1V2Q/exec?sheet=constituency";

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
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const totalSeats = 500;
  const radius = 180; // รัศมีโค้ง
  const cx = canvas.width / 2;
  const cy = canvas.height - 20; // วางที่กึ่งล่างของ canvas
  const anglePerSeat = Math.PI / (totalSeats - 1);

  // เตรียมที่นั่งรวม
  let seats = [];
  parties.forEach(p => {
    const count = Number(p.seats_district) + Number(p.seats_partylist);
    for (let i = 0; i < count; i++) {
      seats.push(p.color);
    }
  });
  // ถ้าที่นั่งไม่ครบ 500 ให้ใส่สีเทา
  while (seats.length < totalSeats) {
    seats.push("#ccc");
  }

  // วาดโค้ง 0–180 องศา
  seats.forEach((color, i) => {
    const angle = Math.PI - i * anglePerSeat; // เริ่มซ้าย → ขวา
    const x = cx + Math.cos(angle) * radius;
    const y = cy - Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function renderBars(parties) {
  const container = document.getElementById("bars");
  container.innerHTML = "";
  parties.forEach(p => {
    const seats = Number(p.seats_district) + Number(p.seats_partylist);
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = (seats * 2) + "px"; // scale
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
      <td style="color:${findColor(rows[1]?.party_id, parties)}">${rows[1]?.candidate || ""} (${rows[1]?.party_id || ""})</td>
      <td style="color:${findColor(rows[2]?.party_id, parties)}">${rows[2]?.candidate || ""} (${rows[2]?.party_id || ""})</td>
    `;
    tbody.appendChild(tr);
  }
}

function findColor(partyId, parties) {
  const p = parties.find(x => x.party_id === partyId);
  return p ? p.color : "#555";
}

loadData();
