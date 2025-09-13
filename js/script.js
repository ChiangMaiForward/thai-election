const PARTY_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwiS3Fg9jbFV3QuEV44wRPQGe99aDHfBgfOutLBjlzhJouBtxI_iAyIdL_KmQJUXE1V2Q/exec?sheet=party";
const CONSTITUENCY_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwiS3Fg9jbFV3QuEV44wRPQGe99aDHfBgfOutLBjlzhJouBtxI_iAyIdL_KmQJUXE1V2Q/exec?sheet=constituency";

async function loadData() {
  const partyRes = await fetch(PARTY_SHEET_URL);
  const parties = await partyRes.json();

  const conRes = await fetch(CONSTITUENCY_SHEET_URL);
  const constituencies = await conRes.json();

  renderSeatMap(parties);
  renderBars(parties);
  renderDistrictTable(constituencies, parties);
}

// ✅ วาดที่นั่ง 500 จุดเป็นครึ่งวงกลม (0–π)
function renderSeatMap(parties) {
  const canvas = document.getElementById("seatMap");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const totalSeats = 500;
  const radius = 180;
  const cx = canvas.width / 2;
  const cy = canvas.height - 20; // ล่างสุด
  const anglePerSeat = Math.PI / (totalSeats - 1);

  // สร้าง array seats = สีพรรคเรียงตามจำนวน
  let seats = [];
  parties.forEach((p) => {
    const count = Number(p.seats_district) + Number(p.seats_partylist);
    for (let i = 0; i < count; i++) {
      seats.push(p.color);
    }
  });
  while (seats.length < totalSeats) seats.push("#ccc");

  seats.forEach((color, i) => {
    const angle = i * anglePerSeat; // 0 → π
    const x = cx + Math.cos(angle) * radius;
    const y = cy - Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

// ✅ แถบจำนวน ส.ส. ต่อพรรค
function renderBars(parties) {
  const container = document.getElementById("bars");
  container.innerHTML = "";
  parties.forEach((p) => {
    const seats = Number(p.seats_district) + Number(p.seats_partylist);
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = seats * 2 + "px";
    bar.style.backgroundColor = p.color;
    bar.innerText = `${p.party_name} ${seats} ที่นั่ง`;
    container.appendChild(bar);
  });
}

// ✅ ตารางเขตเลือกตั้ง (ผู้ชนะ 3 อันดับแรก)
function renderDistrictTable(data, parties) {
  const tbody = document.querySelector("#districtTable tbody");
  tbody.innerHTML = "";

  const grouped = {};
  data.forEach((row) => {
    const key = row.province + "-" + row.district;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  for (let key in grouped) {
    const rows = grouped[key].sort((a, b) => a.rank - b.rank).slice(0, 3);
    const tr = document.createElement("tr");

    const makeCell = (r) => {
      if (!r) return `<td></td>`;
      return `
        <td style="color:${findColor(r.party_id, parties)}">
          ${r.candidate} (${r.party_id})
          <span class="votes">${r.votes} คะแนน</span>
        </td>
      `;
    };

    tr.innerHTML = `
      <td>${rows[0]?.province || ""}</td>
      <td>${rows[0]?.district || ""}</td>
      ${makeCell(rows[0])}
      ${makeCell(rows[1])}
      ${makeCell(rows[2])}
    `;
    tbody.appendChild(tr);
  }
}

function findColor(partyId, parties) {
  const p = parties.find((x) => x.party_id === partyId);
  return p ? p.color : "#555";
}

loadData();
