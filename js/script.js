  // === ตั้งค่า Google Sheet (ผ่าน Apps Script Web App JSON API) ===
  const SHEET_URL = "https://script.google.com/macros/s/AKfycbxQ79QlsadIqW12MLP-hoKSBtFQRaXtFeRYGyJkF-_q-UK9qJ4az-0XFOQxVGL9-baeiA/exec"; 

  let state = { parties: [], seatsMapping: [], districts: [] };

  // === โหลดข้อมูลจาก Google Sheet ===
  async function loadData(){
    const res = await fetch(SHEET_URL);
    const data = await res.json();

    // สมมติว่า data.party_list, data.constituency, data.districts
    const partyList = data.party_list || [];
    const constituency = data.constituency || [];
    const districts = data.districts || [];

    // รวมจำนวนที่นั่งต่อพรรค
    const map = {};
    for(const p of partyList){
      const name = p.party;
      const seats = parseInt(p.seats)||0;
      if(!map[name]) map[name] = { party:name, listSeats:0, conSeats:0, color:p.color||null };
      map[name].listSeats = seats;
    }
    for(const c of constituency){
      const name = c.winner;
      if(!map[name]) map[name] = { party:name, listSeats:0, conSeats:0, color:null };
      map[name].conSeats += 1;
    }
    state.parties = Object.values(map);
    state.districts = districts;

    // Mapping 500 ที่นั่ง
    state.seatsMapping = [];
    for(const p of state.parties){
      const total = p.listSeats + p.conSeats;
      for(let i=0;i<total;i++) state.seatsMapping.push(p.party);
    }
    render();
  }

  // === ฟังก์ชันกำหนดสีพรรค ===
  function colorForParty(p){
    if(!p) return '#ccc';
    const found = state.parties.find(x=>x.party===p);
    if(found && found.color) return found.color;
    const seed = [...p].reduce((s,ch)=>s+ch.charCodeAt(0),0);
    const h = seed*137 % 360;
    return `hsl(${h},70%,45%)`;
  }

  // === แสดงกราฟแท่งจำนวน ส.ส. ===
  function renderBars(){
    const container = document.getElementById('bars');
    container.innerHTML = '';
    const total = 500;
    for(const p of state.parties){
      const n = p.listSeats + p.conSeats;
      const bar = document.createElement('div');
      bar.className='bar';
      const colorDiv=document.createElement('div');
      colorDiv.style.background=colorForParty(p.party);
      colorDiv.style.width=(n/total*100)+'%';
      bar.appendChild(colorDiv);
      bar.appendChild(document.createTextNode(`${p.party} ${n} ที่นั่ง (เขต ${p.conSeats}, บัญชี ${p.listSeats})`));
      container.appendChild(bar);
    }
  }

  // === แสดงครึ่งวงกลม seatmap ===
  function renderSeatMap(){
    const container=document.getElementById('seatmap');
    container.innerHTML='';
    const width=Math.min(900,container.clientWidth||900);
    const height=420;
    const cx=width/2;
    const cy=height-10;   // ✅ วางที่ด้านล่าง
    const radius=Math.min(width/2-20,360);
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute('width',width);svg.setAttribute('height',height);
    const n=state.seatsMapping.length;
    const angleStart=0;
    const angleEnd=Math.PI;
    const rows=10;const seatsPerRow=Math.ceil(n/rows);
    for(let i=0;i<n;i++){
      const row=Math.floor(i/seatsPerRow);
      const j=i%seatsPerRow;
      const angle=angleStart+(angleEnd-angleStart)*j/(seatsPerRow-1);
      const r=radius-row*25;
      const x=cx+r*Math.cos(angle);
      const y=cy-r*Math.sin(angle); // ✅ โค้งขึ้น
      const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
      circle.setAttribute('cx',x);
      circle.setAttribute('cy',y);
      circle.setAttribute('r',7);
      circle.setAttribute('fill',colorForParty(state.seatsMapping[i]));
      svg.appendChild(circle);
    }
    container.appendChild(svg);
  }

  // === แสดง legend ===
  function renderLegend(){
    const container=document.getElementById('legend');
    container.innerHTML='';
    for(const p of state.parties){
      const item=document.createElement('div');
      item.className='legend-item';
      const cdiv=document.createElement('div');
      cdiv.className='legend-color';
      cdiv.style.background=colorForParty(p.party);
      item.appendChild(cdiv);
      item.appendChild(document.createTextNode(p.party));
      container.appendChild(item);
    }
  }

  // === แสดงผลการเลือกตั้งรายเขต (Top 3) ===
  function renderDistricts(){
    const container=document.getElementById('districts');
    container.innerHTML='';
    for(const d of state.districts){
      const div=document.createElement('div');
      div.className='district';
      const title=document.createElement('div');
      title.textContent=`${d.name}`;
      title.style.fontWeight='bold';
      div.appendChild(title);

      if(d.results){
        const sorted=[...d.results].sort((a,b)=>b.votes-a.votes).slice(0,3);
        for(const r of sorted){
          const row=document.createElement('div');
          row.textContent=`${r.candidate} (${r.party}) - ${r.votes} คะแนน`;
          row.style.color=colorForParty(r.party);
          div.appendChild(row);
        }
      }
      container.appendChild(div);
    }
  }

  // === Render รวม ===
  function render(){
    renderBars();
    renderSeatMap();
    renderLegend();
    renderDistricts();
  }

  loadData();
