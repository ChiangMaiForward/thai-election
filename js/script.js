const API_URL = "https://script.google.com/macros/s/AKfycbxQ79QlsadIqW12MLP-hoKSBtFQRaXtFeRYGyJkF-_q-UK9qJ4az-0XFOQxVGL9-baeiA/exec"; // <<--- ใส่ URL จาก Apps Script
const TOTAL_SEATS = 500;
const CONSTITUENCY_SEATS = 400;

let state = { parties: [], constituencies: [], seatsMapping: null, view: 'total' };

async function fetchData(){
  const res = await fetch(API_URL);
  const json = await res.json();
  state.constituencies = json.constituencies || [];
  state.party_list = json.party_list || [];
  document.getElementById('lastUpdated').textContent = new Date(json.timestamp).toLocaleString();
  buildPartySummary();
  renderAll();
}

function buildPartySummary(){
  const conCount = {};
  state.constituencies.forEach(c=>{
    const p = String(c.party1 || "Independent");
    conCount[p] = (conCount[p]||0) + 1;
  });
  const map = {};
  state.party_list.forEach(p=>{
    const name = String(p.party);
    const seats = Number(p.seats)||0;
    map[name] = { party: name, listSeats: seats, conSeats: conCount[name]||0 };
  });
  Object.keys(conCount).forEach(p=>{
    if(!map[p]) map[p] = { party: p, listSeats:0, conSeats:conCount[p]||0 };
  });
  state.parties = Object.values(map).map(x=>{
    x.totalSeats = (x.listSeats||0)+(x.conSeats||0);
    return x;
  }).sort((a,b)=>b.totalSeats - a.totalSeats);
  buildSeatsMapping();
}

function buildSeatsMapping(){
  const seats = [];
  state.constituencies.forEach(c=>{
    seats.push({ type:'con', party: String(c.party1||"Independent"), constituency: c.name, id: c.id });
  });
  while(seats.length < CONSTITUENCY_SEATS) seats.push({ type:'con', party:'Vacant', constituency:null });
  state.party_list.forEach(p=>{
    const n = Number(p.seats)||0;
    for(let i=0;i<n;i++) seats.push({ type:'list', party:String(p.party) });
  });
  while(seats.length < TOTAL_SEATS) seats.push({ type:'list', party:'Vacant' });
  state.seatsMapping = seats.slice(0,TOTAL_SEATS);
}

function colorForParty(p){
  if(!p) return '#ccc';
  const seed = [...p].reduce((s,ch)=>s+ch.charCodeAt(0),0);
  const h = seed*137 % 360;
  return `hsl(${h},70%,45%)`;
}

function renderAll(){ renderBars(); renderSeatMap(); renderLegend(); }

function renderBars(){
  const container = document.getElementById('barsContainer');
  container.innerHTML = '';
  const bars = document.createElement('div'); bars.className='bars';
  state.parties.forEach(p=>{
    const bar=document.createElement('div');bar.className='bar';
    const inner=document.createElement('div');inner.className='barInner';
    inner.style.height=Math.max(6,(p.totalSeats/TOTAL_SEATS)*100)+'%';
    inner.style.background=colorForParty(p.party);
    inner.textContent=p.totalSeats;
    bar.appendChild(inner);
    const label=document.createElement('div');label.className='barLabel';label.textContent=p.party;
    container.appendChild(bar);container.appendChild(label);
  });
}

function renderLegend(){
  const el=document.getElementById('legend');el.innerHTML='';
  state.parties.forEach(p=>{
    const it=document.createElement('div');it.className='legendItem';
    const sw=document.createElement('div');sw.style.width='18px';sw.style.height='18px';sw.style.borderRadius='4px';
    sw.style.background=colorForParty(p.party);it.appendChild(sw);
    it.appendChild(document.createTextNode(`${p.party} — ${p.totalSeats} ที่นั่ง`));
    el.appendChild(it);
  });
}

function renderSeatMap(){
  const container=document.getElementById('seatmap');container.innerHTML='';
  const width=Math.min(900,container.clientWidth||900);const height=420;
  const cx=width/2;const cy=height-10;const radius=Math.min(width/2-20,360);
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute('width',width);svg.setAttribute('height',height);
  const n=state.seatsMapping.length;const angleStart=Math.PI;const angleEnd=0;
  const rows=10;const seatsPerRow=Math.ceil(n/rows);
  for(let i=0;i<n;i++){
    const row=Math.floor(i/seatsPerRow);
    const posInRow=i%seatsPerRow;
    const rowRadius=radius-row*18;
    const ang=angleStart+(angleEnd-angleStart)*(posInRow/Math.max(1,seatsPerRow-1));
    const sx=cx+Math.cos(ang)*rowRadius;const sy=cy+Math.sin(ang)*rowRadius;
    const seat=state.seatsMapping[i];
    const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
    circle.setAttribute('cx',sx);circle.setAttribute('cy',sy);
    circle.setAttribute('r',7);circle.setAttribute('fill',colorForParty(seat.party));
    circle.dataset.index=i;circle.classList.add('seat');
    circle.addEventListener('mouseenter',showTooltip);
    circle.addEventListener('mouseleave',hideTooltip);
    circle.addEventListener('click',seatClicked);
    svg.appendChild(circle);
  }
  container.appendChild(svg);
}

function showTooltip(e){
  const tt=document.getElementById('tooltip');
  const idx=e.target.dataset.index;const seat=state.seatsMapping[idx];
  let text='';
  if(seat.type==='con'){
    const c=state.constituencies.find(x=>String(x.name)===seat.constituency);
    if(c){
      text=`เขต ${c.id} — ${c.name}\n`;
      text+=`1) ${c.candidate1} (${c.party1}) — ${c.votes1}\n`;
      text+=`2) ${c.candidate2} (${c.party2}) — ${c.votes2}\n`;
      text+=`3) ${c.candidate3} (${c.party3}) — ${c.votes3}`;
    }
  }else{
    text=`บัญชีรายชื่อ — พรรค ${seat.party}`;
  }
  tt.textContent=text;tt.style.left=(e.pageX+12)+'px';tt.style.top=(e.pageY+12)+'px';tt.style.opacity=1;
}

function hideTooltip(){document.getElementById('tooltip').style.opacity=0;}

function seatClicked(e){
  const idx=e.target.dataset.index;const seat=state.seatsMapping[idx];
  const info=document.getElementById('info');
  if(seat.type==='con'){
    const c=state.constituencies.find(x=>String(x.name)===seat.constituency);
    if(c){
      info.textContent=`เขต ${c.id} — ${c.name}\n`+
        `1) ${c.candidate1} (${c.party1}) — ${c.votes1}\n`+
        `2) ${c.candidate2} (${c.party2}) — ${c.votes2}\n`+
        `3) ${c.candidate3} (${c.party3}) — ${c.votes3}`;
    }
  }else{
    info.textContent=`บัญชีรายชื่อ — พรรค ${seat.party}`;
  }
}

document.getElementById('refreshBtn').addEventListener('click',()=>fetchData());
document.getElementById('viewTotal').addEventListener('click',()=>{state.view='total';renderAll();});
document.getElementById('viewByConstituency').addEventListener('click',()=>{state.view='byConstituency';renderAll();});

fetchData();
