// สร้างอัตโนมัติจาก p2_template.html · ห้ามแก้มือ
const D = window.__P2D;

const R = D.rows;
const ST = {
  done:{t:'เสร็จพร้อมส่งมอบ',s:'งานครบ ผ่าน QC5',c:'var(--z-done)'},
  z95:{t:'95%+',s:'อีกนิดเดียว',c:'var(--z95)'},
  z85:{t:'85–95%',s:'โค้งสุดท้าย',c:'var(--z85)'},
  z50:{t:'50–85%',s:'กำลังเร่ง',c:'var(--z50)'},
  z0:{t:'ต่ำกว่า 50%',s:'ช่วงต้น',c:'var(--z0)'},
  noplan:{t:'ชะลอการก่อสร้าง',s:'ชะลอการก่อสร้าง',c:'var(--z-np)'}
};
const STK = ['done','z95','z85','z50','z0','noplan'];
const SALE = {'ขายแล้ว รอโอน':'var(--c-sold)','รอขาย':'var(--c-wait)','ยังไม่เปิดเฟสขาย':'var(--c-closed)'};
const NEAR = r => r.st==='z95'||r.st==='z85';
const MONEY = r => NEAR(r) || (r.st==='done' && (r.pay || r.expo));   // บ้านที่ยังต้องเตรียมเงิน: 85%+ ที่ยังไม่เสร็จ + บ้านเสร็จที่รอจ่ายผู้รับเหมา
const MTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd = s => { if(!s) return '–'; const [y,m,d]=s.slice(0,10).split('-'); return `${+d} ${MTH[+m-1]} ${String(+y+543).slice(2)}`; };
const fm = v => v==null?'–':(Math.abs(v)>=1e6?(v/1e6).toLocaleString('th-TH',{maximumFractionDigits:2})+' ล.':Math.round(v).toLocaleString('th-TH'));
const rem = r => Math.max(0,(r.n||0)-(r.dn||0));
const pctTxt = r => r.pct==null?'–':r.pct+'%';
let SALEON = true; try{ if(localStorage.getItem('p2-saleon')==='0') SALEON=false; }catch(e){}
const LBL = 'face';   /* ยกเลิกปุ่มสลับ ใช้หน้ายิ้ม/บึ้งเหมือนเดิม + เลขแปลงข้างจุด (ผู้ใช้ขอ 15 ต.ค. 69) */   // บนจุดแสดง หน้า หรือ เลขแปลง (ผู้ใช้ขอ 15 ต.ค. 69)
const urgent = r => SALEON && r.sale==='ขายแล้ว รอโอน' && r.dd!=null && r.dd<=60 && r.st!=='done';
function dueChip(r){
  if(r.sale!=='ขายแล้ว รอโอน'||!r.due) return '';
  if(r.dd<0) return `<span class="chip crit">เลยกำหนดโอน ${-r.dd} วัน</span>`;
  if(r.dd<=60) return `<span class="chip ${r.st==='done'?'good':'crit'}">นัดโอนอีก ${r.dd} วัน</span>`;
  return `<span class="chip">นัดโอน ${fd(r.due)}</span>`;
}
function blkChip(b){
  if(!b) return '';
  const [h,...tt] = b.split(' · '); const t = tt.join(' · ');
  const cls = b.includes('บ้านเสร็จแล้ว')?'good':((h.startsWith('ติด')||h.startsWith('รอ')||h.startsWith('ค้าง'))?'warn':'');
  return `<span class="chip ${cls}" title="${esc(b)}">${esc(h)}${t?' · '+esc(t):''}</span>`;
}
const qcTxt = r => { const q=r.qc||{}; return q.ok?'ผ่าน':q.st==='N'?'ไม่ผ่าน':q.st==='D'?'รออนุมัติ':'ยังไม่มีใบ'; };
function qcChip(r){ const q=r.qc||{};
  if(q.ok) return `<span class="chip good" title="ใบตรวจ ${esc(q.doc)}">QC5 ผ่าน ${fd(q.d)}</span>`;
  if(q.st) return `<span class="chip warn" title="ใบตรวจ ${esc(q.doc)}">QC5 ${q.st==='N'?'ไม่ผ่าน':'ยังไม่อนุมัติ'}</span>`;
  return `<span class="chip">ยังไม่มีใบ QC5</span>`; }
// เช็กลิสต์เกณฑ์เข้าเส้นชัยรายแปลง (ชุดเดียวกับที่ build_p2dash.py ใช้ตัดสิน)
function ckHtml(r){
  // เกณฑ์เข้าเส้นชัยข้อเดียว: ผ่าน QC5 · ที่เหลือเป็นข้อมูลประกอบ (กลุ่มหลังเส้นชัย · PO ที่ควรตรวจสอบ · งานเพิ่มเติม)
  const q=r.qc||{}, done=r.st==='done';
  const GN={full:'PPN 100%',ext:'มีงานเพิ่มเติมและ PO ค้างรับ',po:'มีงานเพิ่มเติมและ PO ค้างรับ'};
  const qs = q.ok?`ผ่านเมื่อ ${fd(q.d)}`:q.st==='N'?'ผลตรวจไม่ผ่าน':q.st?'มีใบตรวจแล้ว ยังไม่อนุมัติ':'ยังไม่มีใบตรวจ QC งวดที่ 8';
  const extra=[]; if(done){ if(r.ext) extra.push(`งานใน PPN ค้าง ${r.ext} งาน`); if(r.expo) extra.push(`PO เปิดหลัง QC5 ${r.expo} ใบ`); if(r.exwo) extra.push(`WO เปิดหลัง QC5 ${r.exwo} ใบ`); if(r.airpo) extra.push(`PO แอร์ ${r.airpo} ใบ`); }
  return `<div class="ck"><div class="ck-h"><b>เกณฑ์เข้าเส้นชัย</b><span class="${q.ok?'ok':''}">${q.ok?'ผ่านแล้ว · เข้าเส้นชัย':'ยังไม่ผ่าน'}</span></div>
    <div class="ck-g"><div class="ck-i ${q.ok?'ok':'no'}"><span class="ck-m" aria-hidden="true">${q.ok?'✓':'✗'}</span><span><b>ผ่าน QC5 End Product</b><small>${qs}</small></span></div></div>
    ${done?`<div class="ck-grp">กลุ่มหลังเส้นชัย: <b>${GN[r.grp]||''}</b></div>`:''}
    ${r.pox?`<div class="ck-warn"><b>⚠ ควรตรวจสอบรายการรับของ PO</b><small>PO ${q.ok?'ที่เปิดก่อนผ่าน QC5 ':''}ยังไม่รับของ ${r.pox} ใบ · ${fm(r.poxamt)} บาท (ดูรายใบด้านล่าง) · ถ้าของมาแล้วให้ทำใบรับของ ถ้าไม่ใช้แล้วให้ปิดใบ</small></div>`:''}
    ${extra.length?`<div class="ck-f">งานเพิ่มเติม: ${extra.join(' · ')}</div>`:''}</div>`;
}
function qcBox(r){ const q=r.qc||{}, ok=!!q.ok;
  const sub = ok ? `ตรวจงวดงานที่ 8 ผ่านเมื่อ ${fd(q.d)} · ใบ ${esc(q.doc)}`
    : q.st==='N' ? `ผลตรวจไม่ผ่าน · ใบ ${esc(q.doc)} (${fd(q.d)})`
    : q.st ? `มีใบตรวจแล้วแต่ยังไม่อนุมัติ · ใบ ${esc(q.doc)} (${fd(q.d)})`
    : 'ยังไม่มีใบตรวจ QC งวดที่ 8 ในแมงโก้';
  return `<div class="qcbox ${ok?'ok':'no'}"><span class="qi" aria-hidden="true">${ok?'✓':'!'}</span>
    <span><b>${ok?'ผ่าน QC5 · End Product':'ยังไม่ผ่าน QC5 · End Product'}</b><small>${sub}</small></span></div>`; }
const gdOf = r => { const g=r.gd; if(!g || !g.per || !Object.keys(g.per).length) return null; return g.cur==null?9:g.cur; };
const gdTxt = r => { const c=gdOf(r); return c==null?'ไม่มีงวดในแผน':c===9?(rem(r)>0?`เหลืองานนอกงวด ${rem(r)} งาน`:'ครบทุกงาน'):'งวด '+c; };
const gdName = r => { const c=gdOf(r); return (c && c<9 && r.gd.nm && r.gd.nm[c])? r.gd.nm[c] : ''; };
const saleDot = s => `<span class="dot" style="background:${SALE[s]||'var(--ink-3)'}"></span>`;

$('asof').textContent = (()=>{const [d,t]=D.asof.split(' ');return fd(d)+' '+(t||'').slice(0,5)+' น.';})();
$('scope').textContent = D.scope + ' · ดึงจาก Mango โดยตรง';
$('idd').textContent = D.idle; $('mtd').textContent = D.matd; $('ntr').textContent = D.ntr.toLocaleString('th-TH'); $('nwait').textContent = D.nwait.toLocaleString('th-TH');

/* ---------- filters state ---------- */
const F = {pj:'', sale:'', st:'', q:'', blk:'', rem:null, old:false, gd:''};
let moFocus=null;
function openTable(){ if(!$('sec-tbl').hidden) return; moFocus=document.activeElement; hideTip(); $('sec-tbl').hidden=false; $('mo-bg').hidden=false; document.body.classList.add('lock'); $('sec-tbl').querySelector('.tbl-wrap').scrollTop=0; $('mo-x').focus(); }
function closeTable(){ $('sec-tbl').hidden=true; $('mo-bg').hidden=true; document.body.classList.remove('lock'); if(moFocus) moFocus.focus(); }
function setF(p, open){ if(open){ if(!('gd' in p)) p.gd=''; if(!('old' in p)) p.old=false; } Object.assign(F,p); syncControls(); renderTable(); if(open) openTable(); }

/* ---------- KPI ---------- */
(function(){
  const inb = R.filter(r=>r.st!=='done');
  const done = R.filter(r=>r.st==='done');
  const z95 = R.filter(r=>r.st==='z95'), z85 = R.filter(r=>r.st==='z85');
    const K = [
    {l:'บ้านที่กำลังก่อสร้าง',n:inb.length,u:'หลัง',s:`จาก ${R.length} หลังที่เริ่มสร้างและยังไม่โอน`,f:{st:''}},
    {l:'เสร็จพร้อมส่งมอบ',sw:ST.done.c,n:done.length,u:'หลัง',s:`ผ่าน QC5 · PPN 100% ${done.filter(r=>r.grp==='full').length} · มีงานเพิ่มเติมและ PO ค้างรับ ${done.filter(r=>r.grp==='ext'||r.grp==='po').length}`,f:{st:'done'}},
    {l:'95%+ อีกนิดเดียว',sw:ST.z95.c,n:z95.length,u:'หลัง',s:`เหลือเฉลี่ย ${(z95.reduce((a,r)=>a+rem(r),0)/Math.max(1,z95.length)).toFixed(1)} งานต่อหลัง`,f:{st:'z95'},hero:1},
    {l:'85–95% โค้งสุดท้าย',sw:ST.z85.c,n:z85.length,u:'หลัง',s:`ขายแล้ว ${z85.filter(r=>r.sale==='ขายแล้ว รอโอน').length} หลัง`,f:{st:'z85'}},
    {l:'เงินที่ต้องจ่ายในการสร้างบ้านเหล่านี้ให้เสร็จ',n:(R.filter(MONEY).reduce((a,r)=>a+((r.ct&&r.ct.tot)||0),0)/1e6).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}),u:'ล้านบาท',s:(()=>{const M=R.filter(MONEY), a=M.filter(NEAR), b=M.filter(r=>r.st==='done'), S=rs=>(rs.reduce((x,r)=>x+((r.ct&&r.ct.tot)||0),0)/1e6).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}); return `<span class="k-split"><span>ก่อนเข้าเส้นชัย · ${a.length} หลัง</span><b>${S(a)} ล.</b><span>เข้าเส้นชัยแล้ว · ${b.length} หลัง</span><b>${S(b)} ล.</b></span>รวม VAT · หลังเส้นชัย = ค้างจ่ายผู้รับเหมา/ร้านค้า`;})(),f:{st:'cash',sort:'tot'}}
  ];
  $('kpis').innerHTML = K.map((k,i)=>`<button class="kpi${k.hero?' hero':''}" data-i="${i}" type="button">
    <span class="k-lab">${k.sw?`<span class="sw" style="background:${k.sw}"></span>`:''}${k.l}</span>
    <span class="k-num">${typeof k.n==='number'?k.n.toLocaleString('th-TH'):k.n}<small>${k.u}</small></span>
    <span class="k-sub">${k.s}</span><span class="k-go">ดูรายชื่อ →</span></button>`).join('');
  $('kpis').querySelectorAll('.kpi').forEach(b=>b.onclick=()=>{ const f={...K[+b.dataset.i].f}; if(f.sort){ sortK=f.sort; sortD=-1; delete f.sort; } else { sortK='pct'; sortD=-1; } setF({pj:'',sale:'',q:'',blk:'',rem:null,st:'',...f},true); });
})();

/* ---------- legends ---------- */
function drawLegend(){ $('lg-sale').innerHTML = (SALEON ? Object.entries(SALE).map(([k,c])=>`<span><span class="dot" style="background:${c}"></span>${k} (${R.filter(r=>r.sale===k).length})</span>`).join('') : `<span><span class="dot" style="background:var(--c-none)"></span>บ้าน 1 หลัง (${R.length})</span>`)
  + `<span><svg width="12" height="12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" rx="2" fill="var(--ink-2)"/></svg>สี่เหลี่ยม = เสร็จพร้อมส่งมอบ</span><span><svg width="14" height="11" aria-hidden="true"><path d="M1 10 L1 4 L4 7 L7 1 L10 7 L13 4 L13 10 Z" fill="#d4a106" stroke="none" stroke-width="0.8" stroke-linejoin="round"/></svg>มงกุฎ = บ้านตัวอย่าง</span><span><svg width="15" height="11" viewBox="-7.5 -9.5 15 10.5" aria-hidden="true" style="vertical-align:-1px"><path d="M-7 0 h14 v-1.6 h-1.6 A5.4 5.4 0 0 0 -5.4 -1.6 h-1.6 Z" fill="#3b3f42"/><rect x="-1" y="-8" width="2" height="4" rx=".5" fill="#fff" opacity=".7"/></svg>หมวกนิรภัย = มีงานต่อเติม</span><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="none" stroke="var(--ink-2)" stroke-width="2"/></svg>วงกลมโปร่ง = ชะลอการก่อสร้าง</span>${SALEON?`<span><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--crit)" stroke-width="2"/></svg>นัดโอนภายใน 60 วัน</span>`:''}${LBL==='face' ? `<span><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#c9d1d3"/><circle cx="5.5" cy="6.3" r="1.1" fill="#111"/><circle cx="10.5" cy="6.3" r="1.1" fill="#111"/><path d="M5 9 Q8 12 11 9" fill="none" stroke="#111" stroke-width="1.3" stroke-linecap="round"/></svg>หน้ายิ้ม = ทันตามแผน</span><span><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#c9d1d3"/><circle cx="5.5" cy="6.3" r="1.1" fill="#111"/><circle cx="10.5" cy="6.3" r="1.1" fill="#111"/><path d="M5 11.5 Q8 8.6 11 11.5" fill="none" stroke="#111" stroke-width="1.3" stroke-linecap="round"/></svg>หน้าบึ้ง = ล่าช้ากว่าแผน</span>` : `<span><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="7.5" fill="var(--c-sold)"/><text x="8" y="8" dy=".35em" text-anchor="middle" style="font:700 7px Anuphan,sans-serif;fill:#fff">012</text></svg>ตัวเลข = เลขแปลง (ดูชื่อโครงการที่หัวแถว) · กด "หน้ายิ้ม/บึ้ง" เพื่อดูทัน/ล่าช้าตามแผน</span>`}`; }
drawLegend();
document.querySelectorAll('#seg-sale button').forEach(b=>{ b.setAttribute('aria-pressed', String((b.dataset.v==='1')===SALEON)); b.onclick=()=>{
  SALEON = b.dataset.v==='1'; try{ localStorage.setItem('p2-saleon', SALEON?'1':'0'); }catch(e){}
  document.querySelectorAll('#seg-sale button').forEach(x=>x.setAttribute('aria-pressed', String(x===b)));
  drawLegend(); drawTrack(); }; });
document.querySelectorAll('#seg-lbl button').forEach(b=>{ b.setAttribute('aria-pressed', String(b.dataset.v===LBL)); b.onclick=()=>{
  LBL = b.dataset.v; try{ localStorage.setItem('p2-lbl', LBL); }catch(e){}
  document.querySelectorAll('#seg-lbl button').forEach(x=>x.setAttribute('aria-pressed', String(x===b)));
  drawLegend(); drawTrack(); }; });
$('lg-st').innerHTML = STK.map(k=>`<span><span class="sw" style="background:${({done:'var(--pc-done)',z95:'var(--pc95)',z85:'var(--pc85)',z50:'var(--pc50)',z0:'var(--pc0)',noplan:'var(--surface)'})[k]};${k==='noplan'?'box-shadow:inset 0 0 0 1.5px var(--z-np)':k==='z0'?'box-shadow:inset 0 0 0 1px var(--line)':''}"></span>${ST[k].t}</span>`).join('');

/* ---------- tooltip ---------- */
const tip = $('tip');
function tipHtml(r){
  const w = r.w;
  return `<b>${r.ref}</b> <span class="muted">${esc(D.pj[r.pj]||r.pj)}</span>
  <div style="margin:6px 0 8px;display:flex;gap:6px;flex-wrap:wrap">${saleDot(r.sale)}<span>${r.sale}</span></div>
  <div class="r"><span>ความคืบหน้า</span><span>${pctTxt(r)}${r.n?` · เหลือ ${rem(r)} งาน`:''}</span></div>
  <div class="r"><span>งานก่อสร้างอยู่ที่</span><span>${gdTxt(r)}</span></div>
  <div class="r"><span>เบิกงวด ผรม.</span><span>${r.wo==null?'–':r.wo+'%'}${r.gd&&r.gd.wcur?` · เบิกถึงงวด ${r.gd.wcur}`:''}</span></div>
  ${r.sale==='ขายแล้ว รอโอน'?`<div class="r"><span>นัดโอน</span><span>${fd(r.due)}</span></div>`:''}
  ${w?`<div style="margin-top:6px;color:var(--ink-2)">ค้าง: ${esc(w[2]||w[0])}</div>`:''}
  <div style="margin-top:6px">${blkChip(r.blk)}</div>`;
}
function showTip(e,r){ tip.innerHTML=tipHtml(r); tip.classList.add('show'); moveTip(e); }
function moveTip(e){ const x=e.clientX, y=e.clientY, w=tip.offsetWidth, h=tip.offsetHeight;
  tip.style.left = Math.min(window.innerWidth-w-8, x+14)+'px'; tip.style.top = (y+h+20>window.innerHeight? y-h-12 : y+14)+'px'; }
function hideTip(){ tip.classList.remove('show'); }

/* ---------- seen (จุดที่เปิดดูแล้ว) ---------- */
const SEEN = new Set();   // ยกเลิกการจำ "ดูแล้ว" ตามที่ผู้ใช้ขอ
function markSeen(ref){}

/* ---------- track (beeswarm per project) ---------- */
const PJS = [...new Set(R.map(r=>r.pj))].map(pj=>{
  const rs = R.filter(r=>r.pj===pj);
  return {pj, rs, near: rs.filter(r=>r.st==='done'||NEAR(r)).length};
}).sort((a,b)=>(a.pj==='ELE')-(b.pj==='ELE') || b.near-a.near || b.rs.length-a.rs.length);   // ผู้ใช้ขอ: ELE อยู่ท้ายสุด (ต่อจาก PPL)

const MOTION = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
// ให้สนามพอดีความสูงจอ: ลองขนาดจุดจากใหญ่ไปเล็ก ใช้ขนาดแรกที่สนามไม่สูงเกินจอ
function drawTrack(){
  const sizes = [[10,1],[9.5,0.8],[9,0.6],[8.5,0.5],[8,0.4],[7.5,0.4],[7,0.3],[6.5,0.3],[6,0.3],[5.5,0.3]];   // เลือกขนาดใหญ่สุดที่สนามยังพอดีจอ
  for(let i=0;i<sizes.length;i++){ if(drawTrack1(sizes[i][0], sizes[i][1], i===sizes.length-1)) break; }
}
function drawTrack1(R0, G0, force){
  const box = $('track');
  const W = Math.max(640, box.clientWidth);
  const LW = W<760?112:168, PR = 16, rad = W<760?Math.min(6,R0):R0, gap = G0;
  const x0 = LW, x1 = W-PR;
  const FZ = Math.max(260, (x1-x0)*0.27), xf = x1 - FZ, xm = xf + FZ/3;   /* รวมกลุ่ม งานเพิ่มเติม+PO ค้างรับ เป็นช่องเดียว (ผู้ใช้ขอ 15 ต.ค. 69) */   // หลังเส้นชัย 3 กลุ่ม: PPN 100% | งานเพิ่มเติม | PO ก่อน QC5 ค้างรับ   // โซน "เข้าเส้นชัยแล้ว" หลังเส้นชัย · แบ่ง 2 ฝั่ง: PPN ครบทั้งแผน | มีงานเพิ่มเติมค้าง
  // สเกลแบบขยายช่วงท้าย: 0–50% ใช้ 22% · 50–85% ใช้ 28% · 85–100% ใช้ 50% ของช่วงก่อนเส้นชัย
  const KN = [[0,0],[50,.26],[85,.45],[95,.63],[99,.84],[100,1]];   /* ขยายช่วง 0–85% ให้จุดไม่ซ้อนหลายชั้น (15 ต.ค. 69) */   // 95–100% กว้างเกือบครึ่ง · 99–100 เป็นแถบของบ้านงานครบรอปิด WO/PO
  const X = p => { p=Math.max(0,Math.min(100,p)); for(let i=1;i<KN.length;i++){ if(p<=KN[i][0]){ const [a,fa]=KN[i-1],[b,fb]=KN[i]; return x0+(xf-x0)*(fa+(fb-fa)*(p-a)/(b-a)); } } return xf; };
  const sq = rad + 2;   /* ใหญ่ขึ้นนิด (ผู้ใช้ขอ 15 ต.ค. 69) */   // สี่เหลี่ยมหลังเส้นชัยคงขนาดเดิม (ผู้ใช้ว่าพอดีแล้ว)
  const cell = sq*2+6+Math.round(Math.max(8, rad*0.95)*1.75)+3, cellY = sq*2+6 + Math.round(sq*0.6), fcols = Math.max(1, Math.floor((FZ/3-10)/cell)), fcols2 = Math.max(1, Math.floor((FZ*2/3-10)/cell));
  const atFin = r => r.st==='done';   // ข้ามเส้นชัย = ผ่าน QC5 ข้อเดียว (เกณฑ์ 8 ต.ค. 69)
  let y = 96; const rowsSvg = [];
  const rc = rad + 2.5;   // วงกลมบ้านที่ยังไม่เข้าเส้นชัยใหญ่กว่าสี่เหลี่ยมหลังเส้นชัย 25% (ผู้ใช้ขอ)
  const fsz = Math.max(8, rad*0.95), lw = Math.round(fsz*1.75) + 3;   // เลขแปลง 3 หลักข้างจุด (ผู้ใช้ขอ 15 ต.ค. 69)
  const step = rc*2+gap, wcell = rc*2+6+lw, vs = step*0.5;
  let CRS = [];   // มงกุฎวาดทีหลังจุดทั้งแถว จะได้ไม่ถูกจุดอื่นทับ
  const dot = (r,x,py) => { const R0 = r.st==='done' ? sq : rc, top = py-R0-(r.st==='done'?1:0)-(urgent(r)?3.5:0), both = r.sh && r.hm;
    if(r.sh) CRS.push(crown(x, top)); if(r.hm) CRS.push(hardhat(x, both ? top - sq*0.85 + 1 : top)); /* มีทั้งคู่: หมวกซ้อนบนมงกุฎเป็นแท่ง (ผู้ใช้ขอ 12 ต.ค. 69) */ const fill = SALEON ? (SALE[r.sale]||'var(--ink-3)') : 'var(--c-none)', np = r.pct==null;
    return `<g class="hs${SEEN.has(r.ref)?' seen':''}" tabindex="0" role="button" aria-label="${r.ref} ${pctTxt(r)} ${r.sale}" data-ref="${r.ref}">
      <circle cx="${x}" cy="${py}" r="${R0+5}" fill="transparent"/>
      ${r.st==='done'?`<rect class="m" x="${x-rad-0.8}" y="${py-rad-0.8}" width="${rad*2+1.6}" height="${rad*2+1.6}" rx="2" fill="${fill}"/>`:`<circle class="m" cx="${x}" cy="${py}" r="${R0}" fill="${np?'var(--surface)':fill}" ${np?`style="stroke:${fill};stroke-width:2"`:''}/>`}
      ${LBL==='num' ? numLbl(r,x,py,R0,fill,np) : face(r,x,py,R0)}
      ${urgent(r)?`<circle class="ring" cx="${x}" cy="${py}" r="${R0+3}"/>`:''}<text class="nl2${r.st==='done'?' d':''}" pointer-events="none" x="${x+R0+(urgent(r)?4.5:2.5)}" y="${py}" dy=".35em" style="font-size:${fsz.toFixed(1)}px">${String(r.ref).slice(3)}</text></g>`; };
  const crown = (x,y0) => { y0 += 2; const w=sq*1.5, h=sq*0.85; return `<path pointer-events="none" d="M${x-w/2} ${y0} L${x-w/2} ${y0-h*0.65} L${x-w/4} ${y0-h*0.25} L${x} ${y0-h} L${x+w/4} ${y0-h*0.25} L${x+w/2} ${y0-h*0.65} L${x+w/2} ${y0} Z" fill="#d4a106" stroke="#fff" stroke-width="0.9" stroke-linejoin="round"/>`; };
  // หมวกนิรภัยเล็กสีเทาเข้ม = มีงานต่อเติม (Cost Code งานต่อเติม)
  const hardhat = (x,y0) => { const k=sq/8; return `<g pointer-events="none" transform="translate(${x} ${y0+2}) scale(${k})"><path d="M-7 0 h14 v-1.6 h-1.6 A5.4 5.4 0 0 0 -5.4 -1.6 h-1.6 Z" fill="#3b3f42" stroke="#fff" stroke-width="0.9" stroke-linejoin="round"/><rect x="-1" y="-8" width="2" height="4" rx=".5" fill="#fff" opacity=".7"/></g>`; };
  // เลขแปลง 3 หลักท้าย (ชื่อโครงการอยู่หัวแถวแล้ว) ตัวขาวหนาบนจุดสี · โหมดไม่มีสถานะขาย (ฟ้าอ่อน) ใช้ตัวเข้ม · วงโปร่งใช้สีขอบ
  const numLbl = (r,x,y,rad,fill,np) => { const t = String(r.ref).slice(3), c = np ? fill : SALEON ? '#fff' : '#0f1a1c';
    return `<text class="nl" pointer-events="none" x="${x}" y="${y}" dy=".35em" text-anchor="middle" style="font-size:${Math.max(8,rad*0.92).toFixed(1)}px;fill:${c}">${t}</text>`; };
  const face = (r,x,y,rad) => { if(r.pct==null) return ''; const e=rad*0.36, ey=y-rad*0.22, er=rad*0.13, mw=rad*0.42, sad=(r.late||0)>0;
    const m = sad ? `M${x-mw} ${y+rad*0.5} Q${x} ${y+rad*0.12} ${x+mw} ${y+rad*0.5}` : `M${x-mw} ${y+rad*0.2} Q${x} ${y+rad*0.62} ${x+mw} ${y+rad*0.2}`;
    return `<g class="fc" pointer-events="none"><circle cx="${x-e}" cy="${ey}" r="${er*1.15}" fill="#111"/><circle cx="${x+e}" cy="${ey}" r="${er*1.15}" fill="#111"/><path d="${m}" fill="none" stroke="#111" stroke-width="${Math.max(1.1,rad*0.16)}" stroke-linecap="round"/></g>`; };
  PJS.forEach(P=>{
    const srt = (a,b)=>(a.sale<b.sale?-1:1) || (a.ref<b.ref?-1:1);
    const fin = P.rs.filter(r=>atFin(r)&&r.grp==='full').sort(srt), finx = P.rs.filter(r=>atFin(r)&&(r.grp==='ext'||r.grp==='po')).sort(srt);
    const wait = P.rs.filter(r=>!atFin(r) && r.pct===100).sort((a,b)=>(a.sale<b.sale?-1:1)||(a.ref<b.ref?-1:1));
    const pts = P.rs.filter(r=>!atFin(r) && r.pct!==100).map(r=>({r, x: Math.min(X(r.pct==null ? (r.wo??0) : r.pct), X(99)-rc-lw-3)})).sort((a,b)=>a.x-b.x);
    pts.forEach(p=>{
      for(let k=0;;k++){
        const off = k===0?0:(k%2?1:-1)*Math.ceil(k/2);
        if(!pts.some(q=>q!==p && q.l!==undefined && Math.abs(q.l-off)*vs < step-0.3 && (Math.abs(q.x-p.x) < rc*2+lw+1 ))){ p.l=off; break; }   // จัดแบบรังผึ้ง จุดซ้อนแทรกกันได้ ประหยัดความสูง
      }
    });
    const mx = Math.max(0,...pts.map(p=>Math.abs(p.l)));
    const frows = Math.max(Math.ceil(fin.length/fcols), Math.ceil(finx.length/fcols2));
    const wcols = Math.max(1, Math.floor((xf - X(99) - 16)/wcell)), wrows = Math.ceil(wait.length/wcols);
    const hh = Math.max(58, mx*2*vs+step+12, frows*cellY+12, wrows*wcell+12);
    const cy = y + hh/2;
    CRS = [];
    let s = `<line class="t-base" x1="0" x2="${x1}" y1="${y+hh}" y2="${y+hh}"/>`;
    s += `<text class="t-row-lab" x="0" y="${cy-8}">${esc(D.pj[P.pj]||P.pj).replace('ภัททา ','')}</text>`;
    s += `<text class="t-row-sub" x="0" y="${cy+8}">${P.pj} · ถึงเส้นชัย ${fin.length+finx.length} · ใกล้เสร็จ ${P.rs.filter(NEAR).length}</text>`;
    s += `<text class="t-row-tot" x="0" y="${cy+25}">บนสนามทั้งหมด <tspan class="n">${P.rs.length}</tspan> หลัง</text>`;   /* ยอดรวมบ้านบนสนามต่อโครงการ (ผู้ใช้ขอ 21 ต.ค. 69) */
    pts.forEach(p=>{ s += dot(p.r, p.x, cy + p.l*vs); });
    const fy0 = cy + sq*0.4 - (Math.ceil(fin.length/fcols)-1)*cellY/2, fx0 = cy + sq*0.4 - (Math.ceil(finx.length/fcols2)-1)*cellY/2;
    const wy0 = cy - (wrows-1)*wcell/2;
    wait.forEach((r,i)=>{ s += dot(r, X(99) + 8 + rc + (i%wcols)*wcell, wy0 + Math.floor(i/wcols)*wcell); });
    fin.forEach((r,i)=>{ s += dot(r, xf + 10 + sq + (i%fcols)*cell, fy0 + Math.floor(i/fcols)*cellY); });
    finx.forEach((r,i)=>{ s += dot(r, xm + 7 + sq + (i%fcols2)*cell, fx0 + Math.floor(i/fcols2)*cellY); });
    s += CRS.join('');
    rowsSvg.push(s); y += hh + 6;
  });
  const yb = y - 6, H = yb + 20, TOP = 12;
  const sec = box.closest('section'), headH = sec ? box.getBoundingClientRect().top - sec.getBoundingClientRect().top : 115;
  const avail = Math.max(420, window.innerHeight - headH - 26);   // ทั้งการ์ด (หัว + คำอธิบาย + สนาม) พอดี 1 จอ
  if(!force && H + TOP > avail) return false;
  // หัวแถบหน้าเส้นชัย: บอกเฉพาะสาเหตุที่มีจริงในแถบ (ตอนนี้ทุกหลังติด PO) · ถ้ามีหลังที่ติดแค่ QC5 ค่อยเติมท้าย
  const wr = R.filter(r=>r.st!=='done'&&r.pct===100), wqc = wr.filter(r=>!(r.dt&&r.dt.po&&r.dt.po.length)).length;
  const WLAB = 'งานครบตามแผน';
  const zc = {fin: R.filter(r=>r.st==='done').length, z95: R.filter(r=>r.st==='z95').length, z85: R.filter(r=>r.st==='z85').length};
  zc.lo = R.length - zc.fin - zc.z95 - zc.z85;
  let g = `<rect class="t-zone" x="${X(85)}" y="88" width="${X(95)-X(85)}" height="${yb-88}"/><rect class="t-zone2" x="${X(95)}" y="88" width="${xf-X(95)}" height="${yb-88}"/><rect class="t-fin" x="${xf}" y="88" width="${xm-xf}" height="${yb-88}" rx="0"/><rect class="t-fin2" x="${xm}" y="88" width="${x1-xm}" height="${yb-88}" rx="0"/>${[xm].map(v=>`<line x1="${v}" x2="${v}" y1="88" y2="${yb}" style="stroke:#fff;stroke-width:1.2;stroke-dasharray:4 4;opacity:.8"/>`).join('')}`;
  [0,25,50,85,90,95].forEach(t=>{ g += (t===25||t===90?'':`<line class="t-grid" x1="${X(t)}" x2="${X(t)}" y1="90" y2="${yb}"/>`) + `<text class="t-axis" x="${X(t)}" y="${H-6}" text-anchor="${t===0?'start':'middle'}">${t}%</text>`; });
  g += `<line class="t-grid" x1="${X(99)}" x2="${X(99)}" y1="90" y2="${yb}"/><text class="t-axis" x="${X(99)}" y="${H-6}" text-anchor="middle">99%</text><text class="t-axis" x="${xf-6}" y="${H-6}" text-anchor="end">100%</text><text class="t-zone-lab" x="${X(99)+6}" y="66" style="font-weight:600">${WLAB}</text><text class="t-axis" x="${X(99)+6}" y="83">${wr.length} แปลง</text><text class="t-axis" x="${x1}" y="${H-6}" text-anchor="end">พร้อมส่งมอบ</text>`;
  g += `<line x1="${xf}" x2="${xf}" y1="84" y2="${yb}" stroke="#ffffff" stroke-width="7"/><line x1="${xf}" x2="${xf}" y1="84" y2="${yb}" stroke="#0f1a1c" stroke-width="7" stroke-dasharray="7 7"/><line x1="${xf-3.5}" x2="${xf-3.5}" y1="84" y2="${yb}" stroke="#0f1a1c" stroke-width="1"/><line x1="${xf+3.5}" x2="${xf+3.5}" y1="84" y2="${yb}" stroke="#0f1a1c" stroke-width="1"/>`;
  { // ธงตาหมากรุก เส้นชัย · เสาสูง ธงพริ้ว
    const fx = xf, cw = 15, rows = 3, cols = 4, fw = cw*cols, fh = cw*rows, fy = 7 - TOP;   // ธงยกสูงขึ้น ไม่ทับหัวข้อความ
    const wave = (a,e) => `M${fx} ${fy} C${fx-fw/3} ${fy-a} ${fx-2*fw/3} ${fy+a} ${fx-fw} ${fy+e} L${fx-fw} ${fy+fh+e} C${fx-2*fw/3} ${fy+fh+a} ${fx-fw/3} ${fy+fh-a} ${fx} ${fy+fh} Z`;
    const A = wave(6,0), B = wave(-6,4), C = wave(3,2);
    const anim = MOTION ? `<animate attributeName="d" dur="1.8s" repeatCount="indefinite" values="${A};${B};${C};${A}" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>` : '';
    let f = `<g aria-label="ธงเส้นชัย"><defs><clipPath id="flagclip"><path d="${A}">${anim}</path></clipPath></defs>`;
    f += `<line x1="${fx}" x2="${fx}" y1="${fy-3}" y2="88" stroke="var(--ink)" stroke-width="3.5" stroke-linecap="round"/>`;
    f += `<path d="${A}" fill="#fff">${anim}</path><g clip-path="url(#flagclip)"><g>`;
    for(let i=0;i<rows+1;i++) for(let j=0;j<cols;j++) if((i+j)%2===0) f += `<rect x="${fx-fw+j*cw}" y="${fy-3+i*cw}" width="${cw}" height="${cw}" fill="#0f1a1c"/>`;
    f += MOTION ? `<animateTransform attributeName="transform" type="translate" dur="1.8s" repeatCount="indefinite" values="0 0;0 3;0 1.5;0 0"/>` : '';
    f += `</g></g><path d="${A}" fill="none" stroke="var(--ink)" stroke-width="1.2">${anim}</path>`;
    f += `<circle cx="${fx}" cy="${fy-4}" r="3.6" fill="var(--mat)"/></g>`;
    g += f;
  }
  g += `<text class="t-zone-lab t-zl85" x="${X(85)+6}" y="66">85–95% โค้งสุดท้าย</text><text class="t-zone-lab t-zl85" x="${X(85)+6}" y="83"><tspan class="t-zc">${zc.z85}</tspan> แปลง</text><text class="t-zone-lab" x="${X(95)+6}" y="66">95%+ อีกนิดเดียว</text><text class="t-zone-lab" x="${X(95)+6}" y="83"><tspan class="t-zc">${zc.z95}</tspan> แปลง</text>`;
  const gc = k => R.filter(r=>r.st==='done'&&r.grp===k).length;
  g += `<text class="t-fin-lab" x="${xf+8}" y="66">เข้าเส้นชัยแล้ว <tspan class="t-zc">${zc.fin}</tspan> แปลง</text><text class="t-axis" x="${xf+8}" y="83" style="font-weight:600">PPN 100% ${gc('full')}</text><text class="t-axis" x="${xm+6}" y="83" style="font-weight:600">มีงานเพิ่มเติมและ PO ค้างรับ ${gc('ext')+gc('po')}</text>`;
  g += `<text class="t-zone-lab t-zlo" x="${x0}" y="66">ต่ำกว่า 85% กำลังสร้าง</text><text class="t-zone-lab t-zlo" x="${x0}" y="83"><tspan class="t-zc">${zc.lo}</tspan> แปลง</text><text class="t-axis" x="${x0}" y="${H-6-14}" dy="0" style="display:none"></text>`;
  box.innerHTML = `<svg width="${W}" height="${H+TOP}" viewBox="0 ${-TOP} ${W} ${H+TOP}" role="img" aria-label="ความคืบหน้าบ้านแต่ละหลังแยกตามโครงการ">${g}${rowsSvg.join('')}</svg>`;
  box.querySelectorAll('.hs').forEach(el=>{
    const r = R.find(x=>x.ref===el.dataset.ref);
    el.addEventListener('mouseenter',e=>showTip(e,r)); el.addEventListener('mousemove',moveTip); el.addEventListener('mouseleave',hideTip);
    el.addEventListener('click',()=>{hideTip();openD(r);});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openD(r);}});
  });
  return true;
}
drawTrack();
let rz; window.addEventListener('resize',()=>{clearTimeout(rz); rz=setTimeout(drawTrack,120);});

/* ---------- cost to complete ---------- */
const OWNT = {c:'หักผู้รับเหมา', p:'ของโครงการ', m:'ผสม'};
const ownB = p => p.own ? `<span class="own own-${p.own==='c'?'c':'p'}" title="${p.own==='c'?'Cost Code 050401 ซื้อของแทนผู้รับเหมา · หักจากค่างวด':p.own==='m'?`หักผู้รับเหมา ${fm(p.camt)} · ของโครงการ ${fm(p.pamt)}`:'Cost Code อื่น · บริษัทรับภาระ'}">${OWNT[p.own]}</span>` : '';
const CT0 = {wo:0,sub:0,ctr:0,po:0,tot:0,tot_x:0,nwo:0,sup:[]};
const ct = r => r.ct || CT0;
const CX = {pj:'', tab:'wo', q:''};
const PJN = [...new Set(R.filter(MONEY).map(r=>r.pj))].sort().map(pj=>[pj,(D.pj[pj]||pj).replace('ภัททา ','')]);
function renderCtc(){
  const near = R.filter(r=>MONEY(r) && (!CX.pj || r.pj===CX.pj));
  const sum = (rs,k)=>rs.reduce((a,r)=>a+(ct(r)[k]||0),0);
  const tot = sum(near,'tot');
  const M = v => (v/1e6).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('ctc-big').innerHTML = `${M(tot)}<small>ล้านบาท</small>`;
  $('ctc-note').textContent = `${CX.pj?(D.pj[CX.pj]||CX.pj)+' · ':''}บ้าน ${near.length} หลัง (ก่อนเข้าเส้นชัย 85%+ ${near.filter(NEAR).length} + เข้าเส้นชัยแล้วค้างจ่ายผู้รับเหมา/ร้านค้า ${near.length-near.filter(NEAR).length}) ยอดรวม VAT นับเฉพาะเงินที่ยังไม่ได้จ่าย และตัดยอดที่ซ้ำกันออกแล้ว · ก่อน VAT ${M(sum(near,'tot_x'))} ล.`;
  $('ctc-eq').innerHTML = `
    <div><span><span class="op"></span>ค่าจ้างผู้รับเหมาคงเหลือตามสัญญา WO (รวม VAT)</span><b>${M(sum(near,'wo'))} ล.</b></div>
    <div class="neg"><span><span class="op">−</span>วัสดุที่บริษัทสั่งแทน ผรม. รอหักจากงวด</span><b>${M(sum(near,'sub'))} ล.</b></div>
    <div><span><span class="op">=</span>เงินที่ต้องจ่ายผู้รับเหมา</span><b>${M(sum(near,'ctr'))} ล.</b></div>
    <div><span><span class="op">+</span>PO วัสดุที่สั่งแล้วยังไม่รับของ</span><b>${M(sum(near,'po'))} ล.</b></div>
    <div class="tot"><span><span class="op">=</span>รวมต้องใช้อีก</span><b>${M(tot)} ล.</b></div>`;
  // จัดเป็น 2 กลุ่มหลัก (หัวกลุ่มตัวหนา + ยอดรวม) และรายการย่อยเยื้องเข้า ตัวอ่อนลง (ผู้ใช้ขอ 10 ต.ค. 69)
  const ZG = [
    {t:'ก่อนเข้าเส้นชัย', d:'85%+ ที่ยังไม่ผ่าน QC5', c:ST.z95.c, f:NEAR, it:[
      {t:'95%+ อีกนิดเดียว', f:r=>r.st==='z95'},
      {t:'85–95% โค้งสุดท้าย', f:r=>r.st==='z85'}]},
    {t:'เข้าเส้นชัยแล้ว ค้างจ่าย', d:'ผู้รับเหมาและร้านค้า', c:ST.done.c, f:r=>r.st==='done', it:[
      {t:'มีงานเพิ่มเติมและ PO ค้างรับ', f:r=>r.st==='done'&&(r.grp==='ext'||r.grp==='po')},
      {t:'PPN 100%', f:r=>r.st==='done'&&r.grp==='full'}]}];
  const zrow = (cls, lab, rs) => `<tr class="${cls}"><td>${lab}</td><td class="num zn">${rs.length} หลัง</td><td class="num"><b>${M(sum(rs,'tot'))}</b></td></tr>`;
  $('ctc-zt').innerHTML = `<thead><tr><th>กลุ่ม</th><th class="num">หลัง</th><th class="num">ล้านบาท</th></tr></thead>` +
    ZG.map(g=>{ const rs=near.filter(g.f);
      return `<tbody class="zg">` + zrow('zh', `<span class="stp"><span class="sw" style="background:${g.c}"></span><b>${g.t}</b><span class="zd">${g.d}</span></span>`, rs) +
        g.it.map(z=>{ const r2=near.filter(z.f); return r2.length ? zrow('zi', z.t, r2) : ''; }).join('') + `</tbody>`; }).join('') +
    `<tbody>${zrow('zall', '<b>รวมทั้งหมด</b>', near)}</tbody>`;
  // เอกสาร WO / PO ของบ้านกลุ่มนี้
  const wos = [], pos = [];
  near.forEach(r=>{ const d=r.dt||{po:[],wo:[]}; d.wo.forEach(w=>wos.push({r,x:w})); d.po.forEach(p=>pos.push({r,x:p})); });
  const q = CX.q.toLowerCase();
  const hit = (o,isWo)=> !q || [o.r.ref,o.x.no,o.x.sup,OWNT[o.x.own]||'',...o.x.it.map(i=>i[0])].join(' ').toLowerCase().includes(q);
  const W = wos.filter(o=>hit(o,1)).sort((a,b)=>b.x.bal-a.x.bal), P = pos.filter(o=>hit(o,0)).sort((a,b)=>b.x.amt-a.x.amt);
  const sw = W.reduce((a,o)=>a+o.x.bal,0), sp = P.reduce((a,o)=>a+o.x.amt,0);
  $('c-pjs').innerHTML = [['','ทุกโครงการ'],...PJN].map(([k,t])=>`<button type="button" data-k="${k}" aria-pressed="${CX.pj===k}">${esc(t)} (${R.filter(r=>MONEY(r)&&(!k||r.pj===k)).length})</button>`).join('');
  $('c-pjs').querySelectorAll('button').forEach(b=>b.onclick=()=>{ CX.pj=b.dataset.k; $('c-pj').value=CX.pj; renderCtc(); });
  $('c-tab').innerHTML = `<button type="button" role="tab" data-t="wo" aria-pressed="${CX.tab==='wo'}">WO ผู้รับเหมา ${W.length} ใบ · ${fm(sw)}</button><button type="button" role="tab" data-t="po" aria-pressed="${CX.tab==='po'}">PO วัสดุค้างรับ ${P.length} ใบ · ${fm(sp)}</button>`;
  $('c-tab').querySelectorAll('button').forEach(b=>b.onclick=()=>{CX.tab=b.dataset.t; renderCtc();});
  $('c-dd-n').textContent = `WO ${W.length} ใบ · PO ${P.length} ใบ`;
  let h;
  if(CX.tab==='wo'){
    h = `<div class="cx-hd"><span>แปลง</span><span>เลขที่ WO</span><span class="h-su">ผู้รับเหมา · เบิกแล้ว</span><span class="h-st">สถานะ</span><span>คงเหลือ</span></div>` + W.map(({r,x:w})=>{
      const idle = w.idle!=null && w.idle>D.idle;
      const st = w.never?`<span class="chip ${idle?'crit':''}">ยังไม่เคยเบิก ${w.idle} วัน</span>`:`<span class="chip ${idle?'crit':''}">ไม่เบิกมา ${w.idle} วัน</span>`;
      return `<details class="cx-row"><summary><button class="rf" type="button" data-ref="${r.ref}">${r.ref}</button><span class="no">${esc(w.no)}</span><span class="su">${esc(w.sup)} · ${w.pct}%</span><span class="stc">${st}</span><span class="am">${fm(w.bal)}</span></summary>
        <div class="bd"><span class="muted">สัญญา ${fd(w.d)} · ${fm(w.ctr)} · เบิกแล้ว ${fm(w.bill)}${w.last?` · เบิกล่าสุด ${fd(w.last)}${w.lref?' ('+esc(w.lref)+')':''}`:''}</span>
        <span style="font-weight:600;margin-top:2px">งานที่ยังไม่เบิก</span>${w.it.map(i=>`<div class="it"><span>${esc(i[0])}</span><span>${fm(i[1])}</span></div>`).join('')}${w.n>w.it.length?`<span class="muted">และอีก ${w.n-w.it.length} รายการ</span>`:''}</div></details>`;}).join('');
  } else {
    h = `<div class="cx-hd"><span>แปลง</span><span>เลขที่ PO</span><span class="h-su">ร้านค้า</span><span class="h-st">สถานะ</span><span>ยอดค้างรับ</span></div>` + P.map(({r,x:p})=>{
      const st = (p.stuck&&p.days>D.oldpo)?`<span class="chip warn">ค้าง ${p.days} วัน · ควรปิดใบ</span>`:p.stuck?`<span class="chip crit">อนุมัติแล้ว ${p.days} วัน ยังไม่รับของ</span>`:!p.sign?`<span class="chip warn">ยังไม่อนุมัติ PO</span>`:p.rec?`<span class="chip">รับของแล้วบางส่วน</span>`:`<span class="chip">สั่งเมื่อ ${p.days} วันก่อน</span>`;
      return `<details class="cx-row"><summary><button class="rf" type="button" data-ref="${r.ref}">${r.ref}</button><span class="no">${esc(p.no)}</span><span class="su">${ownB(p)}${esc(p.sup)}</span><span class="stc">${st}</span><span class="am">${fm(p.amt)}</span></summary>
        <div class="bd"><span class="muted">สั่งวันที่ ${fd(p.d)} · ค้าง ${p.n} รายการ</span>${p.it.map(i=>`<div class="it"><span>${esc(i[0])}</span><span>${i[1]?i[1].toLocaleString('th-TH')+' หน่วย · ':''}${fm(i[2])}</span></div>`).join('')}${p.n>p.it.length?`<span class="muted">และอีก ${p.n-p.it.length} รายการ</span>`:''}</div></details>`;}).join('');
  }
  $('c-list').innerHTML = h + ((CX.tab==='wo'?W:P).length?'':`<div class="muted sm" style="padding:18px;text-align:center">ไม่มีเอกสารตรงกับที่เลือก</div>`);
  $('c-list').querySelectorAll('.rf').forEach(b=>b.onclick=e=>{ e.preventDefault(); e.stopPropagation(); openD(R.find(x=>x.ref===b.dataset.ref)); });
}
(function(){
  const pjs = [...new Set(R.filter(MONEY).map(r=>r.pj))].sort();
  $('c-pj').innerHTML = `<option value="">ทุกโครงการ (${R.filter(MONEY).length} หลัง)</option>` + pjs.map(pj=>`<option value="${pj}">${esc(D.pj[pj]||pj)} (${R.filter(r=>MONEY(r)&&r.pj===pj).length})</option>`).join('');
  $('c-pj').onchange = e=>{ CX.pj=e.target.value; renderCtc(); };
  $('c-q').oninput = e=>{ CX.q=e.target.value.trim(); renderCtc(); };
  renderCtc();
})();

/* ---------- priority list (ซ่อนไว้ตามผู้ใช้ขอ · ใส่ <div id="plist"> กลับเพื่อเปิด) ---------- */
(function(){
  if(!$('plist')) return;
  const c = R.filter(NEAR).sort((a,b)=>{
    const sa=a.sale==='ขายแล้ว รอโอน'?0:1, sb=b.sale==='ขายแล้ว รอโอน'?0:1;
    if(sa!==sb) return sa-sb;
    if(sa===0){ const da=a.dd??9999, db=b.dd??9999; if(da!==db) return da-db; }
    return rem(a)-rem(b) || b.pct-a.pct;
  }).slice(0,12);
  $('plist').innerHTML = c.map((r,i)=>{
    const w=r.w;
    return `<button class="pi" type="button" data-ref="${r.ref}">
      <span class="rk">${i+1}</span>
      <span style="min-width:0">
        <span class="t1"><span class="ref">${r.ref}</span>${saleDot(r.sale)}<span class="sm muted">${esc((D.pj[r.pj]||'').replace('ภัททา ',''))}</span>${dueChip(r)}</span>
        <span class="t2">${w?`ค้าง: ${esc(w[2]||w[0])}${w[3]?` · กำหนด ${fd(w[3])}`:''}`:'งานในแผนครบ รอปิดเบิกงวดผู้รับเหมา'} · ${esc(r.blk.split(' · ')[0])}</span>
      </span>
      <span class="rt"><span class="big">${r.pct}%</span><span class="left" style="display:block">${rem(r)?`เหลือ ${rem(r)} งาน`:`เบิกงวด ${r.wo??'–'}%`}</span>
        <span class="bar"><i style="width:${r.pct}%"></i></span><span class="left">ใช้อีก ${fm(ct(r).tot)}</span></span>
    </button>`;}).join('');
  $('plist').querySelectorAll('.pi').forEach(b=>b.onclick=()=>openD(R.find(x=>x.ref===b.dataset.ref)));
})();

/* ---------- blockers ---------- */
(function(){
  const near = R.filter(r=>r.st==='z95'); const m = {};   // บ้าน 95%+ ที่ยังไม่ข้ามเส้นชัย (ชุดเดียวกับนับถอยหลัง)
  near.forEach(r=>{ m[r.blk]=(m[r.blk]||0)+1; });
  const e = Object.entries(m).sort((a,b)=>b[1]-a[1]); const mx = Math.max(...e.map(x=>x[1]),1);
  $('cd-n').textContent = near.length;
  const GG = [[7,'งวด 7'],[8,'งวด 8'],[9,'งวด 1–8 ครบ · เหลืองานนอกงวด'],[null,'ไม่มีงวดในแผน']];
  const gcnt = k => near.filter(r=>{const c=gdOf(r); return k===7? (c!=null&&c<=7) : c===k;}).length;
  const gsum = [[7,'งวด 7 หรือก่อนหน้า'],[8,'งวด 8'],[9,'งวด 1–8 ครบ · เหลืองานนอกงวด'],[null,'ไม่มีงวดในแผน']].map(([k,t])=>[k,t,gcnt(k)]).filter(x=>x[2]);
  $('hb').insertAdjacentHTML('beforebegin', `<div class="gsum"><span class="eyebrow">งานก่อสร้างอยู่งวดไหน</span>${gsum.map(([k,t,n])=>`<button class="gsb" type="button" data-k="${k}"><b>${n}</b> ${t}</button>`).join('')}</div>`);
  document.querySelectorAll('.gsb').forEach(b=>b.onclick=()=>setF({pj:'',sale:'',q:'',rem:null,old:false,blk:'',st:'z95',gd:b.dataset.k},true));
  $('hb').className = 'hb2';
  $('hb').innerHTML = e.map(([k,v])=>{const [h,t]=k.split(' · '); const rs=near.filter(r=>r.blk===k).sort((a,b)=>b.pct-a.pct||(a.ref<b.ref?-1:1));
    return `<div class="hr" role="button" tabindex="0" data-b="${esc(k)}">
    <span class="lab"><b>${esc(h)}</b><br>${esc(t||'')}</span><span class="trk"><i style="width:${v/mx*100}%"></i></span><span class="v">${v}</span>
    <span class="chips">${rs.map(r=>`<button class="rc" type="button" data-ref="${r.ref}">${saleDot(r.sale).replace('class="dot"','class="dot" style="width:7px;height:7px;background:'+(SALE[r.sale])+'"')}${r.ref}<sup title="${gdTxt(r)}">${gdOf(r)==null?'':gdOf(r)===9?(rem(r)>0?'+'+rem(r):'✓'):'ง'+gdOf(r)}</sup>${urgent(r)?'<i class="u" title="นัดโอนภายใน 60 วัน"></i>':''}</button>`).join('')}</span></div>`;}).join('')
    + `<p class="sm muted" style="margin:0">จุดหน้าเลขแปลง = สถานะขาย · ตัวเล็กหลังเลขแปลง = งวดที่งานก่อสร้างอยู่ (ง8 = งวด 8 · +2 = งวด 1–8 ครบแล้ว แต่เหลืองานนอกงวด 2 งาน) · จุดแดง = นัดโอนภายใน 60 วัน</p>`;
  $('hb').querySelectorAll('.hr').forEach(el=>{ const go=()=>setF({pj:'',sale:'',q:'',rem:null,old:false,st:'z95',blk:el.dataset.b},true); el.onclick=e=>{ if(e.target.closest('.rc')) return; go(); }; el.onkeydown=e=>{if(e.key==='Enter'&&!e.target.closest('.rc'))go();}; });
  $('hb').querySelectorAll('.rc').forEach(b=>{ const r=R.find(x=>x.ref===b.dataset.ref);
    b.onclick=e=>{e.stopPropagation(); hideTip(); openD(r);}; b.onmouseenter=e=>showTip(e,r); b.onmousemove=moveTip; b.onmouseleave=hideTip; });
  const od = near.filter(r=>r.oldpo>0);
  if(od.length) $('hb').insertAdjacentHTML('afterend', `<button class="oldpo" type="button" id="oldpo"><b>⚠ PO ค้างในระบบเกิน ${D.oldpo} วัน ควรปิดใบ</b><span>${od.length} หลัง · ${od.reduce((a,r)=>a+r.oldpo,0)} ใบ · ${fm(od.reduce((a,r)=>a+r.oldamt,0))} บาท · น่าจะเป็นใบที่ลืมปิด ให้ฝ่ายจัดซื้อตรวจและปิดใบ</span></button>`);
  if($('oldpo')) $('oldpo').onclick = ()=>setF({pj:'',sale:'',q:'',rem:null,blk:'',st:'z95',old:true},true);
})();

/* ---------- projects stacked ---------- */
// สีโทนเดียวกับสนามสู่เส้นชัย (เส้นชัย = เขียวเข้มหม่น · 95%+ = เขียวมิ้นต์อ่อน · 85–95 = ครีมเหลือง · ต่ำกว่า 85 = เทาอ่อน · ไม่มีแผน = กรอบโปร่ง)
const PC = {done:'var(--pc-done)', z95:'var(--pc95)', z85:'var(--pc85)', z50:'var(--pc50)', z0:'var(--pc0)', noplan:'var(--surface)'};
const pcSty = k => `background:${PC[k]};${k==='noplan'?'box-shadow:inset 0 0 0 1.5px var(--z-np)':''}`;
(function(){
  const mxn = Math.max(...PJS.map(p=>p.rs.length));
  $('pjt').innerHTML = PJS.map(P=>{
    const seg = STK.map(k=>({k,n:P.rs.filter(r=>r.st===k).length})).filter(s=>s.n);
    return `<div class="nm">${D.map[P.pj]?`<button class="pjb" type="button" data-pj="${P.pj}">${esc(D.pj[P.pj]||P.pj)} <span class="pjm">ดูผัง ↗</span></button>`:`<b>${esc(D.pj[P.pj]||P.pj)}</b>`}<span>${P.pj} · ใกล้เสร็จหรือเสร็จ ${P.near} หลัง</span></div>
      <div class="stk" style="width:${P.rs.length/mxn*100}%">${seg.map(s=>`<i style="flex:${s.n};${pcSty(s.k)}" data-pj="${P.pj}" data-st="${s.k}" title="${ST[s.k].t}: ${s.n} หลัง"></i>`).join('')}</div>
      <div class="n">${P.rs.length}</div>`;
  }).join('');
  $('pjt').querySelectorAll('.stk i').forEach(el=>{
    const P = el.dataset.pj, k = el.dataset.st, n = R.filter(r=>r.pj===P&&r.st===k).length;
    el.onmouseenter = e=>{ tip.innerHTML=`<b>${esc(D.pj[P])}</b><div class="r" style="margin-top:4px"><span>${ST[k].t} · ${ST[k].s}</span><span>${n} หลัง</span></div>`; tip.classList.add('show'); moveTip(e); };
    el.onmousemove = moveTip; el.onmouseleave = hideTip;
    el.onclick = ()=>{ hideTip(); setF({pj:P,st:k,sale:'',q:'',blk:'',rem:null},true); };
  });
})();

/* ---------- table ---------- */
const COLS = [
  {k:'ref',t:'แปลง',v:r=>r.ref},
  {k:'st',t:'ช่วง',v:r=>STK.indexOf(r.st)},
  {k:'pct',t:'ความคืบหน้า',v:r=>r.pct??-1},
  {k:'rem',t:'เหลืองาน',num:1,v:r=>r.n?rem(r):999},
  {k:'gd',t:'อยู่งวด',v:r=>gdOf(r)??-1},
  {k:'wo',t:'เบิกงวด',num:1,v:r=>r.wo??-1},
  {k:'sale',t:'สถานะขาย',v:r=>r.sale},
  {k:'dd',t:'นัดโอน',v:r=>r.dd??99999},
  {k:'w',t:'งานที่ค้าง',v:r=>r.w?(r.w[2]||r.w[0]):''},
  {k:'qc',t:'QC5',v:r=>(r.qc&&r.qc.ok)?2:(r.qc&&r.qc.st)?1:0},
  {k:'blk',t:'ติดอะไร',v:r=>r.blk},
  {k:'tot',t:'ต้องใช้อีก รวม VAT',num:1,v:r=>ct(r).tot},
];
var sortK='pct', sortD=-1;
$('thead').innerHTML = COLS.map(c=>`<th class="${c.num?'num':''}" data-k="${c.k}" scope="col">${c.t}</th>`).join('');
$('thead').querySelectorAll('th').forEach(th=>th.onclick=()=>{ const k=th.dataset.k; if(sortK===k) sortD*=-1; else {sortK=k; sortD=(k==='ref'||k==='dd'||k==='rem'||k==='sale'||k==='st')?1:-1;} renderTable(); });
$('f-pj').innerHTML = `<option value="">ทุกโครงการ</option>`+PJS.map(P=>`<option value="${P.pj}">${esc(D.pj[P.pj]||P.pj)} (${P.rs.length})</option>`).join('');
const SEGS = [{k:'',t:'ทั้งหมด'},{k:'near',t:'ใกล้เสร็จ 85%+'},...STK.map(k=>({k,t:ST[k].t,c:ST[k].c}))];
$('f-st').innerHTML = SEGS.map(s=>`<button type="button" data-k="${s.k}" aria-pressed="false">${s.c?`<span class="sw" style="background:${s.c}"></span>`:''}${s.t}</button>`).join('');
$('f-st').querySelectorAll('button').forEach(b=>b.onclick=()=>setF({st:b.dataset.k,rem:null}));
$('f-pj').onchange = e=>setF({pj:e.target.value});
$('f-sale').onchange = e=>setF({sale:e.target.value});
$('f-q').oninput = e=>setF({q:e.target.value.trim()});
$('f-clear').onclick = ()=>setF({pj:'',sale:'',st:'',q:'',blk:'',rem:null,old:false,gd:''});
function syncControls(){
  $('f-pj').value=F.pj; $('f-sale').value=F.sale; if($('f-q').value.trim()!==F.q) $('f-q').value=F.q;
  $('f-st').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.k===F.st)));
  $('f-clear').hidden = !(F.pj||F.sale||F.st||F.q||F.blk||F.rem!=null||F.old||F.gd!=='');
}
function pass(r){
  if(F.pj && r.pj!==F.pj) return false;
  if(F.sale && r.sale!==F.sale) return false;
  if(F.st==='near'){ if(!NEAR(r)) return false; }
  else if(F.st==='cash'){ if(!MONEY(r)) return false; }
  else if(F.st && r.st!==F.st) return false;
  if(F.blk && r.blk!==F.blk) return false;
  if(F.old && !(r.oldpo>0)) return false;
  if(F.gd!==''){ const c=gdOf(r); if(F.gd==='7'){ if(!(c!=null&&c<=7)) return false; } else if(F.gd==='null'){ if(c!=null) return false; } else if(String(c)!==F.gd) return false; }
  if(F.rem!=null){ const n=rem(r), b=n>=8?8:n>=5?5:n; if(b!==F.rem) return false; }
  if(F.q){ const q=F.q.toLowerCase(); const hay=[r.ref,r.cust,r.blk,r.w&&r.w[0],r.w&&r.w[2],D.pj[r.pj]].join(' ').toLowerCase(); if(!hay.includes(q)) return false; }
  return true;
}
function renderTable(){
  const col = COLS.find(c=>c.k===sortK);
  const rs = R.filter(pass).sort((a,b)=>{ const x=col.v(a), y=col.v(b); return (x<y?-1:x>y?1:0)*sortD || (b.pct??-1)-(a.pct??-1); });
  $('thead').querySelectorAll('th').forEach(th=>th.setAttribute('aria-sort', th.dataset.k===sortK?(sortD>0?'ascending':'descending'):'none'));
  const parts = [];
  if(F.pj) parts.push(D.pj[F.pj]); if(F.sale) parts.push(F.sale);
  if(F.gd!=='') parts.push(F.gd==='7'?'งวด 7 หรือก่อนหน้า':F.gd==='8'?'งวด 8':F.gd==='9'?'งวด 1–8 ครบ · เหลืองานนอกงวด':'ไม่มีงวดในแผน'); if(F.old) parts.push('มี PO ค้างในระบบเกิน '+D.oldpo+' วัน'); if(F.st) parts.push(F.st==='near'?'ใกล้เสร็จ 85%+':F.st==='cash'?'ต้องเตรียมเงิน (85%+ ที่ยังไม่เสร็จ + เสร็จแล้วรอจ่ายผู้รับเหมา)':ST[F.st].t); if(F.blk) parts.push(F.blk);
  if(F.rem!=null) parts.push('เหลือ '+({0:'0',5:'5–7',8:'8+'}[F.rem]??F.rem)+' งาน');
  $('tbl-note').textContent = `${rs.length} หลัง${parts.length?' · '+parts.join(' · '):''} · กดหัวคอลัมน์เพื่อเรียง กดแถวเพื่อดูรายละเอียด`;
  $('tbody').innerHTML = rs.map(r=>{ const w=r.w; return `<tr data-ref="${r.ref}">
    <td><span class="ref">${r.ref}</span>${urgent(r)?' <span class="chip crit" style="margin-left:4px">ด่วน</span>':''}</td>
    <td><span class="stp"><span class="sw" style="background:${ST[r.st].c}"></span>${ST[r.st].s}</span></td>
    <td><div class="pc"><span class="bar"><i style="width:${r.pct??0}%;background:${ST[r.st].c}"></i></span><b>${pctTxt(r)}</b></div></td>
    <td class="num">${r.n?rem(r):'–'}</td>
    <td style="white-space:nowrap">${gdTxt(r)}</td>
    <td class="num">${r.wo==null?'–':r.wo+'%'}</td>
    <td><span class="stp">${saleDot(r.sale)}${r.sale}</span></td>
    <td>${r.sale==='ขายแล้ว รอโอน'?(r.dd!=null&&r.dd<=60&&r.st!=='done'?`<b style="color:var(--crit)">${fd(r.due)}</b>`:fd(r.due)):'<span class="muted">–</span>'}</td>
    <td style="max-width:240px">${w?esc(w[2]||w[0]):'<span class="muted">–</span>'}</td>
    <td style="white-space:nowrap">${(r.qc&&r.qc.ok)?'<b style="color:var(--good)">✓ ผ่าน</b>':`<span class="muted">${qcTxt(r)}</span>`}</td>
    <td>${blkChip(r.blk)}</td>
    <td class="num">${ct(r).tot?fm(ct(r).tot):'0'}</td></tr>`;}).join('') || `<tr><td colspan="12" class="muted" style="text-align:center;padding:24px">ไม่มีบ้านตรงกับตัวกรองนี้ ลองกด "ล้างตัวกรอง"</td></tr>`;
  $('tbody').querySelectorAll('tr[data-ref]').forEach(tr=>tr.onclick=()=>openD(R.find(x=>x.ref===tr.dataset.ref)));
}
syncControls(); renderTable();

/* ---------- map modal ---------- */
const MC = {done:'#0b6b4b', z95:'#27b27a', z85:'#e8b100', z50:'#2f7ed8', z0:'#8a4fc0', noplan:'#59636a'};
let mapPj = null, mapFocus = null, mapZ = 1;
function openMap(pj){
  const M = D.map[pj]; if(!M) return;
  mapPj = pj; mapFocus = document.activeElement; hideTip();
  const rs = R.filter(r=>r.pj===pj);
  const on = rs.filter(r=>M.pts[String(+r.ref.slice(3))]), off = rs.filter(r=>!M.pts[String(+r.ref.slice(3))]);
  $('map-h').textContent = D.pj[pj]||pj;
  $('map-note').textContent = `วงกลมคือบ้าน ${on.length} หลังที่กำลังสร้างหรือยังไม่โอน สีบอกช่วงความคืบหน้า ✓ = เข้าเส้นชัย พร้อมส่งมอบ วงแดงรอบนอก = ขายแล้วและนัดโอนกับลูกค้าภายใน 60 วัน แต่บ้านยังไม่เสร็จ ต้องเร่ง · กดวงกลมเพื่อดูรายละเอียด · แปลงที่ไม่มีวงกลมคือโอนแล้วหรือยังไม่เริ่มสร้าง`;
  $('map-lg').innerHTML = ['done','z95','z85','z50','z0','noplan'].filter(k=>rs.some(r=>r.st===k)).map(k=>`<span><span class="dot" style="background:${MC[k]}"></span>${k==='done'?'เข้าเส้นชัย พร้อมส่งมอบ':ST[k].t} (${rs.filter(r=>r.st===k).length})</span>`).join('')
    + (rs.some(urgent)?`<span><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" fill="none" stroke="#c93838" stroke-width="2.2"/></svg>วงแดงรอบนอก = ขายแล้ว นัดโอนภายใน 60 วัน แต่บ้านยังไม่เสร็จ (${rs.filter(urgent).length})</span>`:'');
  const rr = M.r*M.w*1.35;
  let svg = `<svg viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="ผังโครงการ ${esc(D.pj[pj]||pj)}">`;
  on.forEach(r=>{ const [x,y] = M.pts[String(+r.ref.slice(3))], X=x*M.w, Y=y*M.h, c=MC[r.st];
    svg += `<g class="mk${SEEN.has(r.ref)?' seen':''}" tabindex="0" role="button" data-ref="${r.ref}" aria-label="${r.ref} ${ST[r.st].t}">
      <circle class="o" cx="${X}" cy="${Y}" r="${rr}" fill="${c}" stroke="${c}"/>
      ${r.st==='done'?`<circle cx="${X+rr*.72}" cy="${Y-rr*.72}" r="${rr*.38}" fill="#0b6b4b" stroke="#fff" stroke-width="3"/><path d="M${X+rr*.55} ${Y-rr*.72} l${rr*.13} ${rr*.14} l${rr*.24} -${rr*.28}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`:''}
      ${urgent(r)?`<circle cx="${X}" cy="${Y}" r="${rr*1.28}" fill="none" stroke="#c93838" stroke-width="5"/>`:''}</g>`; });
  svg += `</svg>`;
  $('map-wrap').innerHTML = `<div class="map-box" id="map-box"><img src="${D.img[pj]||('maps/'+pj+'.jpg')}" alt="ผังโครงการ ${esc(D.pj[pj]||pj)}">${svg}</div>`;
  $('map-foot').innerHTML = off.length?`ไม่อยู่บนผังนี้: ${off.map(r=>`<button class="rc" type="button" data-ref="${r.ref}">${r.ref}</button>`).join(' ')}`:'';
  $('mapmo').hidden=false; $('map-bg').hidden=false; document.body.classList.add('lock');
  mapZ = 1; fitMap();
  $('map-wrap').querySelectorAll('.mk').forEach(el=>{ const r=R.find(x=>x.ref===el.dataset.ref);
    el.addEventListener('mouseenter',e=>showTip(e,r)); el.addEventListener('mousemove',moveTip); el.addEventListener('mouseleave',hideTip);
    el.addEventListener('click',()=>{hideTip();openD(r);}); el.addEventListener('keydown',e=>{if(e.key==='Enter'){openD(r);}}); });
  $('map-foot').querySelectorAll('.rc').forEach(b=>b.onclick=()=>openD(R.find(x=>x.ref===b.dataset.ref)));
  $('map-x').focus();
}
function fitMap(){ if(!mapPj || $('mapmo').hidden) return; const M=D.map[mapPj], w=$('map-wrap'), bx=$('map-box'); if(!bx) return;
  const aw=w.clientWidth-2, ah=w.clientHeight-2, sc=Math.min(aw/M.w, ah/M.h)*mapZ;
  w.style.alignItems = mapZ>1?'flex-start':'flex-start'; w.style.justifyContent = (M.w*sc>aw)?'flex-start':'center';
  bx.style.width=Math.round(M.w*sc)+'px'; bx.style.height=Math.round(M.h*sc)+'px'; }
window.addEventListener('resize', fitMap);
function closeMap(){ $('mapmo').hidden=true; $('map-bg').hidden=true; mapPj=null; if($('sec-tbl').hidden) document.body.classList.remove('lock'); if(mapFocus) mapFocus.focus(); }
$('map-x').onclick = closeMap;
$('z-in').onclick = ()=>{ mapZ=Math.min(4,mapZ*1.4); fitMap(); };
$('z-out').onclick = ()=>{ mapZ=Math.max(1,mapZ/1.4); fitMap(); };
$('z-fit').onclick = ()=>{ mapZ=1; fitMap(); }; $('map-bg').onclick = closeMap;
document.addEventListener('click', e=>{ const b=e.target.closest('.pjb'); if(b){ e.preventDefault(); openMap(b.dataset.pj); } });

/* ---------- drawer ---------- */
function gdStrip(r){
  const g=r.gd; if(!g) return '';
  const cells=[1,2,3,4,5,6,7,8].map(n=>{ const p=(g.per||{})[n], w=(g.wper||{})[n];
    const pp=p?(p[1]<p[2]?Math.min(p[0],99):p[0]):null, cls = p==null?'na':(p[1]>=p[2]?'ok':(n===g.cur?'cur':'no'));
    return `<div class="gs ${cls}" title="งวด ${n}${g.nm&&g.nm[n]?' · '+esc(g.nm[n]):''}&#10;งานตามแผน ${p?`${p[1]}/${p[2]} งาน (${pp}%)`:'ไม่มีในแผน'}&#10;เบิกงวดแล้ว ${w==null?'–':w+'%'}">
      <b>${n}</b><span class="gb"><i style="width:${pp??0}%"></i></span><span class="gw">${w==null?'–':w+'%'}</span></div>`; }).join('');
  const c=gdOf(r);
  // ช่องที่ 9 = งานอื่นในแผน PPN ที่อยู่นอกงวด 1–8 (ราวบันได รั้ว งานเพิ่มเติม ฯลฯ) ต้องครบด้วยถึงจะนับว่างานครบ 100%
  const sg=[1,2,3,4,5,6,7,8].reduce((a,n)=>{const p=(g.per||{})[n]; return p?[a[0]+p[1],a[1]+p[2]]:a;},[0,0]);
  const ot=Math.max(0,(r.n||0)-sg[1]), od=Math.max(0,Math.min(ot,(r.dn||0)-sg[0]));
  const ocls = !ot?'na':od>=ot?'ok':(c===9?'cur':'no'), opp = ot?Math.floor(od/ot*100):0;
  const cell9 = `<div class="gs ${ocls}" title="งานอื่นในแผน PPN นอกงวด 1–8&#10;${ot?`${od}/${ot} งาน`:'ไม่มี'}"><b>อื่นๆ</b><span class="gb"><i style="width:${opp}%"></i></span><span class="gw">${ot?`${od}/${ot}`:'–'}</span></div>`;
  return `<div class="gdx"><div class="gd-h"><span class="eyebrow">งานก่อสร้างอยู่ที่</span><b>${gdTxt(r)}</b>${gdName(r)?`<span class="muted sm">${esc(gdName(r))}</span>`:''}
    ${c===9 && rem(r)>0?`<span class="sm" style="color:var(--warn)">งวด 1–8 ครบแล้ว แต่ยังเหลืองานอื่นในแผน PPN ${rem(r)} งาน จึงยังไม่นับว่างานครบ 100%</span>`:''}</div><div class="gs-row">${cells}${cell9}</div>
    <div class="sm muted">เขียว = งานครบ · กรอบเหลือง = ส่วนที่อยู่ตอนนี้ · แถบ = งานตามแผน PPN · ตัวเลขล่าง = ผู้รับเหมาเบิกงวดนั้นแล้วกี่ % · ช่อง "อื่นๆ" = งานนอกงวด เช่น ราวบันได รั้ว งานเพิ่มเติม (งานที่ทำแล้ว/ทั้งหมด)</div></div>`;
}

function utHtml(r){
  const doneBox = r.st!=='done' ? '' : `<div class="task-box" style="background:var(--good-bg);color:var(--good)"><b>บ้านเข้าเส้นชัยแล้ว</b> ผ่าน QC5 End Product ${r.ext?`· งานใน PPN ที่ยังค้าง ${r.ext} งาน (รายการด้านล่าง) `:''}${r.pay?`· เหลือเตรียมเงินจ่ายผู้รับเหมาอีก ${Math.round(ct(r).tot).toLocaleString('th-TH')} บาท (รวม VAT) `:''}</div>`;
  if(r.st==='done' && !r.ext) return doneBox;
  const u = (r.ut||[]).filter(t=>!(r.st==='done' && /แอร์|ปรับอากาศ/.test(t[0]+' '+t[1]))); if(!u.length) return doneBox;
  const T = new Date(D.today+'T00:00:00');
  const late = u.filter(t=>t[3] && new Date(t[3]+'T00:00:00')<T).length;
  return doneBox + `<div class="dx"><h3>${r.st==='done'?'งานเพิ่มเติมที่ยังค้างในแผน PPN':'งานที่ยังไม่เสร็จตามแผน PPN'} <span>${u.length} งาน${late?` · <b style="color:var(--crit)">เลยกำหนด ${late}</b>`:''}</span></h3>
    <div class="ut">${u.slice(0,14).map(t=>{ const d = t[3]?Math.round((T-new Date(t[3]+'T00:00:00'))/864e5):null, lt = d!=null && d>0;
      return `<div class="ut-r${lt?' lt':''}"><span class="ut-n"><b>${esc(t[1]||'–')}</b><span>${esc(t[0])} · คืบหน้า ${t[2]}%</span></span><span class="ut-d">กำหนด ${fd(t[3])}<br>${lt?`<span class="chip crit">เลย ${d} วัน</span>`:d!=null?`<span class="chip">อีก ${-d} วัน</span>`:''}</span></div>`;}).join('')}
    ${u.length>14?`<span class="sm muted">และอีก ${u.length-14} งาน</span>`:''}</div></div>`;
}

function detHtml(r){
  const d = r.dt || {po:[],wo:[]}; let h = '';
  const MX = 8;
  if(d.po.length){
    { const sc=d.po.reduce((a,p)=>a+(p.own==='c'?p.amt:p.own==='m'?p.camt:0),0), tp=d.po.reduce((a,p)=>a+p.amt,0);
    h += `<div class="dx"><h3>PO ที่ยังไม่ได้รับของ <span>${d.po.length} ใบ · ${fm(tp)}</span></h3>`;
    if(d.po.some(p=>p.own)) h += `<div class="sm muted" style="margin-top:-2px">หักผู้รับเหมา ${fm(sc)} · ของโครงการ ${fm(tp-sc)}</div>`; }
    h += d.po.slice(0,MX).map(p=>{
      const st = (p.stuck&&p.days>D.oldpo)?`<span class="chip warn">ค้าง ${p.days} วัน · ควรปิดใบ</span>`:p.stuck?`<span class="chip crit">อนุมัติแล้ว ${p.days} วัน ยังไม่รับของ</span>`:!p.sign?`<span class="chip warn">ยังไม่อนุมัติ PO</span>`:p.rec?`<span class="chip">รับของแล้วบางส่วน</span>`:`<span class="chip">สั่งเมื่อ ${p.days} วันก่อน</span>`;
      return `<details${(p.stuck&&p.days<=D.oldpo)?' open':''}><summary><span class="no">${esc(p.no)}</span><span class="am">${ownB(p)}${fm(p.amt)}</span><span class="su">${esc(p.sup)}</span><span>${st}</span></summary>
        <div class="bd"><span class="muted">สั่งวันที่ ${fd(p.d)} · ค้าง ${p.n} รายการ</span>${p.it.map(i=>`<div class="it"><span>${esc(i[0])}</span><span>${i[1]?i[1].toLocaleString('th-TH')+' หน่วย · ':''}${fm(i[2])}</span></div>`).join('')}${p.n>p.it.length?`<span class="muted">และอีก ${p.n-p.it.length} รายการ</span>`:''}</div></details>`;}).join('');
    if(d.po.length>MX) h += `<span class="sm muted">และอีก ${d.po.length-MX} ใบ</span>`;
    h += `</div>`;
  }
  if(d.wo.length){
    h += `<div class="dx"><h3>WO ผู้รับเหมาที่ยังเบิกไม่ครบ <span>${d.wo.length} ใบ · คงเหลือ ${fm(d.wo.reduce((a,w)=>a+w.bal,0))}</span></h3>`;
    h += d.wo.slice(0,MX).map(w=>{
      const idle = w.idle!=null && w.idle>D.idle;
      const st = w.never?`<span class="chip ${idle?'crit':''}">ยังไม่เคยเบิก · ทำสัญญา ${w.idle} วัน</span>`:`<span class="chip ${idle?'crit':''}">ไม่เบิกมา ${w.idle} วัน</span>`;
      return `<details${idle?' open':''}><summary><span class="no">${esc(w.no)}</span><span class="am">${fm(w.bal)}</span><span class="su">${esc(w.sup)} · เบิกแล้ว ${w.pct}%</span><span>${st}</span></summary>
        <div class="bd"><span class="muted">สัญญา ${fd(w.d)} · ${fm(w.ctr)} · เบิกแล้ว ${fm(w.bill)}</span>${w.last?`<span class="muted">เบิกล่าสุด ${fd(w.last)}${w.lref?' · '+esc(w.lref):''}</span>`:''}
        <span style="margin-top:3px;font-weight:600">งานที่ยังไม่เบิก</span>${w.it.map(i=>`<div class="it"><span>${esc(i[0])}</span><span>${fm(i[1])}</span></div>`).join('')}${w.n>w.it.length?`<span class="muted">และอีก ${w.n-w.it.length} รายการ</span>`:''}</div></details>`;}).join('');
    if(d.wo.length>MX) h += `<span class="sm muted">และอีก ${d.wo.length-MX} ใบ</span>`;
    h += `</div>`;
  }
  return h;
}

let lastFocus=null;
function ring(p,c){ const r=34, C=2*Math.PI*r, v=Math.max(0,Math.min(100,p??0));
  return `<svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="8"/>
  <circle cx="42" cy="42" r="${r}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C*v/100} ${C}" transform="rotate(-90 42 42)"/>
  <text x="42" y="47" text-anchor="middle" style="font-family:Anuphan,sans-serif;font-weight:700;font-size:17px;fill:var(--ink)">${p==null?'–':p+'%'}</text></svg>`; }
function openD(r){
  lastFocus = document.activeElement; markSeen(r.ref);
  const w = r.w, sold = r.sale==='ขายแล้ว รอโอน';
  $('drawer').innerHTML = `<button class="x" id="d-x" type="button" aria-label="ปิด">×</button>
    <div><div class="eyebrow">${esc(D.pj[r.pj]||r.pj)}</div><h2 id="d-ref" style="font-size:24px">${r.ref}</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"><span class="chip">${saleDot(r.sale)}${r.sale}</span>${dueChip(r)}${blkChip(r.blk)}${r.sh?`<span class="chip" title="${esc(r.sh)}" style="background:#fff6cc;color:#7a5c00;border-color:#d4a106"><svg style="margin-right:3px;vertical-align:-1px" width="14" height="11" aria-hidden="true"><path d="M1 10 L1 4 L4 7 L7 1 L10 7 L13 4 L13 10 Z" fill="#d4a106" stroke="none" stroke-width="0.8" stroke-linejoin="round"/></svg>บ้านตัวอย่าง</span>`:''}${r.hm?`<span class="chip" title="${esc(r.hm)}" style="background:#eceeef;color:#3b3f42;border-color:#9aa1a6"><svg width="15" height="11" viewBox="-7.5 -9.5 15 10.5" aria-hidden="true" style="margin-right:3px;vertical-align:-1px"><path d="M-7 0 h14 v-1.6 h-1.6 A5.4 5.4 0 0 0 -5.4 -1.6 h-1.6 Z" fill="#3b3f42"/><rect x="-1" y="-8" width="2" height="4" rx=".5" fill="#fff" opacity=".7"/></svg>มีงานต่อเติม</span>`:''}</div>${ckHtml(r)}</div>
    ${gdStrip(r)}
    <div class="ring-big">${ring(r.pct,ST[r.st].c)}
      <div class="meter2" style="flex:1">
        <div><div class="l"><span>งานในแผนเสร็จ</span><b>${r.n?`${r.dn}/${r.n} งาน`:'ไม่มีแผน'}</b></div><div class="bar"><i style="width:${r.n?r.dn/r.n*100:0}%;background:${ST[r.st].c}"></i></div></div>
        <div><div class="l"><span>เบิกงวดผู้รับเหมา</span><b>${r.wo==null?'–':r.wo+'%'}</b></div><div class="bar"><i style="width:${r.wo??0}%;background:var(--navy)"></i></div></div>
      </div></div>
    ${qcBox(r)}
    ${utHtml(r)}
    ${detHtml(r)}
    <dl class="dl">
      <dt>งานยังไม่เสร็จ</dt><dd>${r.n?`${r.nbad} สาย · ${rem(r)} งาน`:'–'}</dd>
      <dt>งานเลยกำหนดในแผน</dt><dd ${r.late?'style="color:var(--crit)"':''}>${r.late||0} งาน</dd>
      <dt>วางบิลล่าสุด</dt><dd>${r.idle==null?'ยังไม่เคยวางบิล':r.idle+' วันก่อน'}</dd>
      <dt>PO/PR รออนุมัติ</dt><dd>${(r.pow||0)+(r.prw||0)} ใบ</dd>
      <dt>PO รอรับของ ${D.matd}–${D.oldpo} วัน</dt><dd>${r.mat||0} ใบ</dd>${r.oldpo?`<dt>PO ค้างเกิน ${D.oldpo} วัน (ควรปิดใบ)</dt><dd style="color:var(--warn)">${r.oldpo} ใบ · ${fm(r.oldamt)}</dd>`:''}
      <dt>ค่าจ้างตามสัญญา / เบิกแล้ว</dt><dd>${fm(r.ctr)} / ${fm(r.bill)}</dd>
    </dl>
    <div><div class="eyebrow" style="margin-bottom:6px">ต้องใช้เงินอีกเท่าไรให้หลังนี้เสร็จ (รวม VAT)</div>
    <div class="eq" style="margin-top:0">
      <div><span><span class="op"></span>ค่าจ้าง ผรม. คงเหลือ (${ct(r).nwo} ใบ WO)</span><b>${fm(ct(r).wo)}</b></div>
      <div class="neg"><span><span class="op">−</span>วัสดุสั่งแทน รอหักงวด</span><b>${fm(ct(r).sub)}</b></div>
      <div><span><span class="op">+</span>PO วัสดุค้างรับ</span><b>${fm(ct(r).po)}</b></div>
      <div class="tot"><span><span class="op">=</span>รวม</span><b>${fm(ct(r).tot)}</b></div><div class="sm muted"><span>ก่อน VAT</span><span>${fm(ct(r).tot_x)}</span></div>
    </div>
    ${ct(r).sup.length?`<div class="sm muted" style="margin-top:8px">ค้างจ่ายมากสุด: ${ct(r).sup.map(x=>esc(x[0])+' '+fm(x[1])).join(' · ')}</div>`:''}</div>
    <dl class="dl">
      ${sold?`<dt>ลูกค้า</dt><dd>${esc(r.cust)} · ${esc(r.cus)}</dd><dt>ราคาขาย</dt><dd>${fm(r.net)}</dd><dt>เงินรอรับตอนโอน</dt><dd><b>${fm(r.left)}</b></dd><dt>นัดโอน</dt><dd>${fd(r.due)}</dd>`
            :`<dt>ราคาตั้งขาย</dt><dd>${fm(r.ask)}</dd>`}
    </dl>`;
  $('drawer').hidden=false; $('ov').hidden=false; $('d-x').focus();
  $('d-x').onclick = closeD;
}
function closeD(){ $('drawer').hidden=true; $('ov').hidden=true; if(lastFocus) lastFocus.focus(); }
$('ov').onclick = closeD;
$('mo-bg').onclick = closeTable; $('mo-x').onclick = closeTable;
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(!$('drawer').hidden) closeD(); else if(!$('mapmo').hidden) closeMap(); else if(!$('sec-tbl').hidden) closeTable(); });
