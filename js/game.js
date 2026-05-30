'use strict';

// ══════════════════════════════════════════════════════════
//  LAYOUT
// ══════════════════════════════════════════════════════════
let CW = 375, CH = 686;
let COUNTER_Y, COUNTER_BOT, FLOOR_Y, FLOOR_BOT;
let STANDS = [], BROWSE = [], QSLOT = [];
let DOOR, CLERK_X, CLERK_Y;
const STAND_W = 86, STAND_H = 80, DOOR_W = 96;
const MAX_QUEUE = 7;

function computeLayout() {
  const wrap = document.getElementById('shop-wrap');
  CW = wrap.clientWidth  || 375;
  CH = wrap.clientHeight || 686;
  COUNTER_Y   = 96;
  COUNTER_BOT = 152;
  FLOOR_Y     = 152;
  FLOOR_BOT   = CH - 80;

  STANDS = []; BROWSE = [];
  const mainShelves   = shelves.filter(s=>s.room==='main');
  const annexShelves  = shelves.filter(s=>s.room==='annex');
  // 본관 — 3열
  const COLS_M = 3, ROWS_M = Math.ceil(mainShelves.length / COLS_M);
  const cellWM = CW / COLS_M;
  const topYM  = FLOOR_Y + 38;
  const rowPitchM = ROWS_M > 1 ? Math.min(136, (FLOOR_BOT - topYM - STAND_H - 52) / (ROWS_M - 1)) : 0;
  // 별관 — 카드 배틀 카페: 위 3개 배틀 테이블, 아래 3개 배틀 테이블, 맨 아래 3개 카드팩 진열대
  const COLS_A = 3;
  const cellWA = CW / COLS_A;
  // 배틀 테이블 두 줄
  const BT_W = 64, BT_H = 32;
  const btTopY = FLOOR_Y + 30;
  const btRowPitch = 90;
  battleTables.forEach((bt, i)=>{
    const c = i % COLS_A, r = (i / COLS_A) | 0;
    bt.x = Math.round(c*cellWA + (cellWA-BT_W)/2);
    bt.y = Math.round(btTopY + r*btRowPitch);
    bt.w = BT_W; bt.h = BT_H;
  });
  // 별관 카드팩 진열대 — 배틀 테이블 아래 한 줄
  // 별관 카드팩 진열대 — 배틀 테이블 아래 한 줄
  const packRowY = btTopY + btRowPitch*2 + 24;
  let aIdx=0, mIdx=0;
  shelves.forEach((s,idx)=>{
    if (s.room==='main'){
      const c=mIdx%COLS_M, r=(mIdx/COLS_M)|0;
      const x=Math.round(c*cellWM + (cellWM-STAND_W)/2);
      const y=Math.round(topYM + r*rowPitchM);
      STANDS[idx]={x,y}; BROWSE[idx]={x:x+STAND_W/2-14, y:y+STAND_H+4};
      mIdx++;
    } else {
      const c = aIdx % COLS_A;
      const x = Math.round(c*cellWA + (cellWA-STAND_W)/2);
      const y = packRowY;
      STANDS[idx]={x,y}; BROWSE[idx]={x:x+STAND_W/2-14, y:y+STAND_H+4};
      aIdx++;
    }
  });
  // 계산대 줄서기 슬롯 (좌측 0번 → 우측)
  QSLOT = [];
  // 줄서기 위치 — 카운터 바로 앞으로 끌어올림 (CHECKOUT 명패는 손님 머리에 가려도 OK)
  for (let i = 0; i < MAX_QUEUE; i++) QSLOT.push({ x: 30 + i*34, y: COUNTER_BOT - 4 });
  DOOR    = { x: CW/2 - 14, y: FLOOR_BOT - 6 };
  CLERK_X = 40;
  CLERK_Y = COUNTER_Y - 40;
}

// ══════════════════════════════════════════════════════════
//  COLOR HELPER
// ══════════════════════════════════════════════════════════
function shade(hex, f) {
  let r = parseInt(hex.slice(1,3),16),
      g = parseInt(hex.slice(3,5),16),
      b = parseInt(hex.slice(5,7),16);
  r = Math.max(0,Math.min(255,Math.round(r*f)));
  g = Math.max(0,Math.min(255,Math.round(g*f)));
  b = Math.max(0,Math.min(255,Math.round(b*f)));
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ── 테마 색상 (런타임 교체 가능) ──
const CL = {
  wall:'#d6bf96', wallEdge:'#b89a6a', baseboard:'#6b4226',
  cream:'#f4e4c1', creamDk:'#e3cd9f', creamSh:'#cdb184',
  wood:'#a66a3d', woodDk:'#6b4226', woodLt:'#c98a52',
  signRed:'#bb3b2d', signRedDk:'#8a2a20', signCream:'#ffe9c4',
  amber:'#f2a007', teal:'#3fa796', green:'#2e7d32',
  textDk:'#4a3520', glass:'#2c2118',
};
const THEMES = {
  cozy:  { name:'코지 (기본)', wall:'#d6bf96', wallEdge:'#b89a6a', baseboard:'#6b4226', wood:'#a66a3d', woodDk:'#6b4226', woodLt:'#c98a52' },
  royal: { name:'로얄 퍼플',   wall:'#5e3d8a', wallEdge:'#3e2670', baseboard:'#241445', wood:'#7e54c0', woodDk:'#4a2880', woodLt:'#a07ce0' },
  cyber: { name:'사이버 네온', wall:'#1a3045', wallEdge:'#0a1a2a', baseboard:'#020815', wood:'#356a8c', woodDk:'#1a3850', woodLt:'#56a8d0' },
  cherry:{ name:'벚꽃 핑크',   wall:'#f5b4c4', wallEdge:'#d88aa0', baseboard:'#a04a6a', wood:'#c47090', woodDk:'#8a4a60', woodLt:'#e4a4b8' },
};
function applyTheme(){
  const t = THEMES[G.theme] || THEMES.cozy;
  CL.wall=t.wall; CL.wallEdge=t.wallEdge; CL.baseboard=t.baseboard;
  CL.wood=t.wood; CL.woodDk=t.woodDk; CL.woodLt=t.woodLt;
}

// ══════════════════════════════════════════════════════════
//  PIXEL-ART CHARACTERS  (14×22 logical, 2px each)
// ══════════════════════════════════════════════════════════
const CPX = 2;
const CHAR_DW = 14 * CPX;
const CHAR_DH = 22 * CPX;

const PRESETS = [
  { skin:'#e8b088', hair:'#3a2a1a', shirt:'#5f8a4a', pants:'#39507a', shoe:'#4a3520', style:'beanie',  hatC:'#4a5a6a' },
  { skin:'#ecc4a4', hair:'#d2d2d2', shirt:'#a85a4a', pants:'#5a4a3a', shoe:'#33261a', style:'old' },
  { skin:'#e8b890', hair:'#191919', shirt:'#2d3f63', pants:'#1c2c44', shoe:'#161616', style:'suit' },
  { skin:'#d8a878', hair:'#5a3a24', shirt:'#cd7a4e', pants:'#46584a', shoe:'#262626', style:'bag',     bagC:'#8a6a44' },
  { skin:'#ecc4a4', hair:'#8c8c8c', shirt:'#7a6a55', pants:'#454545', shoe:'#241f15', style:'glasses' },
  { skin:'#f0c8a4', hair:'#3a2a1a', shirt:'#e3b440', pants:'#356a8c', shoe:'#d44040', style:'cap',     hatC:'#3a8ac8' },
  { skin:'#e2b48c', hair:'#26263a', shirt:'#54b4c4', pants:'#9558b0', shoe:'#eaeaea', style:'trendy' },
  { skin:'#e8b890', hair:'#4a3a26', shirt:'#5a9070', pants:'#373745', shoe:'#222222', style:'glasses' },
];
const CLERK = { skin:'#e8b890', hair:'#2a1c10', shirt:'#c0392b', pants:'#2c2c38', shoe:'#1a1a1a', style:'apron', apronC:'#1e2d4a' };

// PNG 캐릭터 (손님) 그리기 — 16px 원본을 정수 3배(48px)로 또렷하게
const CHAR_SCALE = 3;
function drawCharImg(sx, sy, name, frame, walking, flip, carry, carryImg, carryQty){
  const img=CHAR_IMG[name];
  let w, h;
  if (img && img.naturalWidth > 32){
    // 사진형 큰 PNG — 높이 기준 통일 (직원<손님<청소부 순으로 차등)
    const isStaff   = (name==='man_staff' || name==='woman_staff');
    const isCleaner = name && name.indexOf('Cleaner')===0;
    h = isStaff ? 48 : isCleaner ? 60 : 54;
    w = Math.round(h * img.naturalWidth / img.naturalHeight);
  } else {
    w = (img && img.naturalWidth ? img.naturalWidth : 16) * CHAR_SCALE;
    h = (img && img.naturalHeight ? img.naturalHeight : 16) * CHAR_SCALE;
  }
  const dx = Math.round(sx + CHAR_DW/2 - w/2);
  const dy = Math.round(sy + CHAR_DH - h + 2);   // 바닥 정렬
  // 드롭 섀도 (2겹 — 부드러운 외곽 + 진한 안쪽)
  const cxm = sx+CHAR_DW/2;
  ctx.fillStyle='rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(cxm, sy+CHAR_DH, w/2+1, 5.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.34)';
  ctx.beginPath(); ctx.ellipse(cxm, sy+CHAR_DH-1, w/2-5, 3.2, 0, 0, Math.PI*2); ctx.fill();
  if (!img || !img.complete || !img.naturalWidth){
    ctx.fillStyle='#8a6a44'; ctx.fillRect(sx+2,sy+8,CHAR_DW-4,CHAR_DH-10);
    return;
  }
  const bob = walking ? (frame ? -2 : 0) : 0;
  ctx.save();
  if (flip){ ctx.translate(dx*2+w,0); ctx.scale(-1,1); }
  ctx.drawImage(img, dx, dy+bob, w, h);
  ctx.restore();
  if (carry){
    if (carryImg && carryImg.complete && carryImg.naturalWidth){
      // 손에 실제 카드팩 이미지
      const cw=13, ch=Math.round(cw*carryImg.naturalHeight/carryImg.naturalWidth);
      const px = flip ? sx-7 : sx+CHAR_DW-7;
      const py = sy+CHAR_DH/2-ch/2+2;
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(px+1,py+2,cw,ch);
      ctx.drawImage(carryImg, px, py, cw, ch);
      // 다중 구매 표시 ×N (2자리수 폭 자동 조정)
      if (carryQty && carryQty>1){
        const bw = carryQty>9 ? 13 : 9;
        const bx=px-3, by=py-3;
        ctx.fillStyle='#bb3b2d'; ctx.fillRect(bx,by,bw,8);
        ctx.fillStyle='#ffe9c4'; ctx.font='bold 7px Arial'; ctx.textAlign='center';
        ctx.fillText('×'+carryQty, bx+bw/2, by+6.5);
      }
    } else {
      // 기본 카드 (전시 손님 등)
      const px = flip ? sx-5 : sx+CHAR_DW-5;
      ctx.fillStyle='#f4ead0'; ctx.fillRect(px, sy+CHAR_DH/2-6, 10, 14);
      ctx.fillStyle='#d4870a'; ctx.fillRect(px+1, sy+CHAR_DH/2-5, 8, 12);
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(px+1, sy+CHAR_DH/2-5, 8, 2);
    }
  }
}

function drawChar(ctx, sx, sy, ps, frame, opts) {
  opts = opts || {};
  const walking = opts.walking, flip = opts.flip, carry = opts.carry;
  if (typeof ps === 'string'){ drawCharImg(sx,sy,ps,frame,walking,flip,carry,opts.carryImg,opts.carryQty); return; }
  const P = CPX;
  ctx.save();
  if (flip) { ctx.translate(sx*2 + CHAR_DW, 0); ctx.scale(-1,1); }
  const blk = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(sx+x*P, sy+y*P, w*P, h*P); };
  const bob = walking ? (frame ? 1 : 0) : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(sx+7*P, sy+21*P, 6*P, 1.6*P, 0, 0, Math.PI*2);
  ctx.fill();

  if (!walking) {
    blk(4,17,2,3,ps.pants); blk(8,17,2,3,ps.pants);
    blk(4,20,3,1,ps.shoe);  blk(8,20,3,1,ps.shoe);
  } else if (frame) {
    blk(3,17,3,3,ps.pants); blk(8,17,2,3,ps.pants);
    blk(3,20,3,1,ps.shoe);  blk(8,20,2,1,ps.shoe);
  } else {
    blk(4,17,2,3,ps.pants); blk(8,17,3,3,ps.pants);
    blk(4,20,2,1,ps.shoe);  blk(8,20,3,1,ps.shoe);
  }

  const by = 9 - bob, hy = 2 - bob;
  if (ps.style === 'bag') blk(0, by+1, 3, 6, ps.bagC);

  blk(3, by, 8, 8, ps.shirt);
  if (ps.style === 'suit') {
    blk(6,by,2,8,'#f4f4f4'); blk(6,by,1,5,'#c0392b');
    blk(5,by,1,6,ps.shirt);  blk(8,by,1,6,ps.shirt);
  }
  if (ps.style === 'apron') { blk(4,by+2,6,6,ps.apronC); blk(6,by+3,2,1,'#fff'); }
  ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(sx+3*P,sy+by*P,8*P,P);

  blk(1,by+1,2,5,ps.shirt); blk(11,by+1,2,5,ps.shirt);
  blk(1,by+6,2,1,ps.skin);  blk(11,by+6,2,1,ps.skin);

  blk(4,hy+1,6,6,ps.skin);
  blk(3,hy+3,1,2,ps.skin); blk(10,hy+3,1,2,ps.skin);
  blk(5,hy+4,1,1,'#15151f'); blk(8,hy+4,1,1,'#15151f');
  if (ps.style==='glasses' || ps.style==='old') {
    ctx.fillStyle='#15151f';
    ctx.fillRect(sx+4*P,sy+(hy+3)*P,3*P,P);
    ctx.fillRect(sx+7*P,sy+(hy+3)*P,3*P,P);
    ctx.fillRect(sx+4*P,sy+(hy+3)*P,P,2*P);
    ctx.fillRect(sx+9*P,sy+(hy+3)*P,P,2*P);
  }

  const h = ps.hair;
  if (ps.style==='beanie') {
    blk(3,hy,8,3,ps.hatC); blk(3,hy-1,8,1,ps.hatC);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(sx+3*P,sy+hy*P,8*P,P);
  } else if (ps.style==='cap') {
    blk(3,hy,8,2,ps.hatC); blk(2,hy+1,5,1,ps.hatC); blk(4,hy-1,6,1,ps.hatC);
  } else if (ps.style==='old') {
    blk(3,hy+1,8,2,h); blk(3,hy+2,1,3,h); blk(10,hy+2,1,3,h);
  } else {
    blk(3,hy,8,3,h); blk(3,hy+2,1,3,h); blk(10,hy+2,1,3,h);
    if (ps.style==='trendy') blk(3,hy-1,8,1,h);
  }

  if (carry) {
    blk(10,by+4,4,5,'#f4c430');
    ctx.fillStyle='#c0392b'; ctx.fillRect(sx+11*P,sy+(by+5)*P,2*P,3*P);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(sx+10*P,sy+(by+4)*P,4*P,P);
  }
  ctx.restore();
}

// ══════════════════════════════════════════════════════════
//  MONSTER & PACK SPRITES
// ══════════════════════════════════════════════════════════
// 풀바디 몬스터 렌더러 — 24x28 논리 그리드, 부위별 파라미터로 100종 고유 디자인
function drawMonster(ctx, ox, oy, P, card) {
  const c1 = card.c1 || card.color || '#9aa3ad';
  const c2 = card.c2 || '#f4ead0';
  const L1 = shade(c1,1.34), D1 = shade(c1,0.56);
  const L2 = shade(c2,1.1),  D2 = shade(c2,0.78);
  const HORN = '#efe7cf', HORN_D = '#cdc3a4';
  const blk = (x,y,w,h,col) => { ctx.fillStyle=col; ctx.fillRect(ox+x*P, oy+y*P, w*P, h*P); };
  const bd=card.bd|0, hd=card.hd|0, er=card.er|0, ar=card.ar|0, lg=card.lg|0,
        tl=card.tl|0, wg=card.wg|0, bk=card.bk|0, ey=card.ey|0;
  const cx=12, hy=6;
  const M=[
    {hw:8, hh:8, tw:8,  ty:13, th:8 },
    {hw:9, hh:8, tw:12, ty:13, th:8 },
    {hw:13,hh:11,tw:11, ty:17, th:6 },
    {hw:10,hh:9, tw:12, ty:14, th:10},
  ][bd] || {hw:8,hh:8,tw:8,ty:13,th:8};
  let hw=M.hw, hh=M.hh;
  if (hd===1){ hw+=2; hh-=1; }
  if (hd===2){ hw-=2; hh+=2; }
  const tw=M.tw, ty=M.ty, th=M.th;
  const hx=Math.round(cx-hw/2), tx=Math.round(cx-tw/2);
  const legTop=ty+th-1, legBot=27;

  // 날개
  if (wg){ for (const s of [-1,1]){
    const wx = s<0 ? tx-5 : tx+tw;
    const tp = s<0 ? tx-6 : tx+tw+4;
    if (wg===1){ blk(wx,ty,5,9,D1); blk(wx,ty,5,1,c1); blk(tp,ty+2,2,5,D1); }
    else if (wg===2){ blk(wx,ty-1,5,10,'#f3f3f7'); blk(wx,ty-1,5,1,'#ffffff'); blk(tp,ty+1,2,6,'#d8d8e2'); }
    else { blk(wx,ty-2,5,8,'rgba(212,236,255,0.7)'); blk(wx,ty-2,5,1,L1); }
  }}
  // 꼬리
  if (tl){
    const qx=tx+tw-2, qy=legTop;
    if (tl===1){ blk(qx+1,qy,3,3,c1); blk(qx+1,qy,3,1,L1); }
    else if (tl===2){ blk(qx,qy,3,2,c1); blk(qx+2,qy-3,2,4,c1); blk(qx+3,qy-6,2,4,c1); blk(qx+3,qy-6,2,1,L1); }
    else if (tl===3){ blk(qx,qy,3,2,c1); blk(qx+2,qy-2,2,3,c1); blk(qx+4,qy-3,3,3,D1); blk(qx+5,qy-6,2,3,D1); }
    else { blk(qx,qy-3,6,6,L1); blk(qx+1,qy-4,4,1,L1); blk(qx,qy+3,6,1,c1); }
  }
  // 갈기(뒤)
  if (bk===2){ blk(tx-2,ty-1,tw+4,4,D1); }
  // 다리
  const legW = bd===3?4:3;
  for (const lx of [cx-1-legW, cx+1]){
    blk(lx,legTop,legW,legBot-legTop,c1);
    blk(lx,legTop,1,legBot-legTop,L1);
    if (lg===2){ blk(lx-1,legBot-1,2,1,'#eef0f2'); blk(lx+legW-1,legBot-1,2,1,'#eef0f2'); }
    else if (lg===1){ blk(lx-1,legBot-2,legW+2,2,D1); }
    else { blk(lx-1,legBot-1,legW+2,1,D1); }
  }
  // 어깨 가시(뒤)
  if (bk===1){ for (let i=0;i<3;i++){ blk(tx+2+i*Math.floor((tw-4)/2),ty-2,2,3,D1); } }
  // 몸통
  blk(tx+1,ty,tw-2,1,c1);
  blk(tx,ty+1,tw,th-2,c1);
  blk(tx+1,ty+th-1,tw-2,1,c1);
  blk(tx+1,ty,tw-2,1,L1);
  blk(tx,ty+1,1,th-3,L1);
  blk(tx+1,ty+th-1,tw-2,1,D1);
  blk(tx+2,ty+2,tw-4,th-3,c2);
  blk(tx+2,ty+2,tw-4,1,L2);
  // 팔
  for (const s of [-1,1]){
    const ax = s<0 ? tx-2 : tx+tw-1;
    if (ar===2){ blk(ax,ty+1,3,6,c1); blk(ax,ty+1,3,1,L1); }
    else if (ar===3){ blk(ax+1,ty+1,2,8,c1); blk(ax+1,ty+1,1,8,L1); }
    else if (ar===1){ blk(ax,ty+2,3,3,c1); blk(ax,ty+5,3,2,c2); }
    else { blk(ax,ty+2,3,4,c1); blk(ax,ty+2,3,1,L1); }
  }
  // 머리
  blk(hx+1,hy,hw-2,1,c1);
  blk(hx,hy+1,hw,hh-2,c1);
  blk(hx+1,hy+hh-1,hw-2,1,c1);
  blk(hx+1,hy,hw-2,1,L1);
  blk(hx,hy+1,1,hh-3,L1);
  blk(hx+1,hy+hh-1,hw-2,1,D1);
  if (hd===3){ blk(cx-2,hy+hh-2,4,3,c2); blk(cx-2,hy+hh-2,4,1,L2);
               blk(cx-2,hy+hh,1,1,D2); blk(cx+1,hy+hh,1,1,D2); }
  // 귀 / 뿔
  const el=hx+1, e2=hx+hw-3;
  if (er===1){ blk(el,hy-3,3,4,c1); blk(e2,hy-3,3,4,c1); blk(el+1,hy-2,1,2,D1); blk(e2+1,hy-2,1,2,D1); }
  else if (er===2){ blk(el-1,hy-2,4,3,c1); blk(e2-1,hy-2,4,3,c1); blk(el,hy-1,1,1,L1); blk(e2,hy-1,1,1,L1); }
  else if (er===3){ blk(el+1,hy-6,2,7,c1); blk(e2,hy-6,2,7,c1); blk(el+1,hy-5,2,4,c2); blk(e2,hy-5,2,4,c2); }
  else if (er===4){ blk(cx-1,hy-5,2,6,HORN); blk(cx,hy-6,1,2,HORN); blk(cx-1,hy-1,2,1,HORN_D); }
  else if (er===5){ blk(el,hy-5,2,6,HORN); blk(e2+1,hy-5,2,6,HORN); blk(el,hy-6,2,2,HORN); blk(e2+1,hy-6,2,2,HORN); }
  else if (er===6){ blk(el+1,hy-5,1,5,D1); blk(e2+1,hy-5,1,5,D1); blk(el,hy-6,2,2,c1); blk(e2,hy-6,2,2,c1); }
  else if (er===7){ blk(cx-1,hy-5,2,6,L1); blk(cx-3,hy-3,2,4,L1); blk(cx+1,hy-3,2,4,L1); blk(cx-1,hy-5,2,1,c2); }
  else if (er===8){ blk(el-3,hy-1,3,2,HORN); blk(el-4,hy-3,2,3,HORN); blk(e2,hy-1,3,2,HORN); blk(e2+2,hy-3,2,3,HORN); }
  // 갈기 앞
  if (bk===2){ blk(hx-2,hy+2,2,hh-1,D1); blk(hx+hw,hy+2,2,hh-1,D1); }
  // 얼굴
  const fcy = hy + Math.round(hh*0.4);
  const eye = (x,w)=>{ blk(x,fcy,w,w+1,'#ffffff'); blk(x+(w>2?1:0),fcy+1,w>2?2:1,w>2?2:1,'#15151f'); };
  if (ey===3){ blk(cx-2,fcy,5,5,'#ffffff'); blk(cx-1,fcy+1,3,3,'#15151f'); blk(cx,fcy+1,1,1,'#6b78ff'); }
  else if (ey===4){ eye(cx-5,2); eye(cx+3,2); blk(cx-1,fcy-3,2,2,'#ffffff'); blk(cx,fcy-3,1,1,'#15151f'); }
  else { const ew=ey===1?3:2; eye(cx-1-ew,ew); eye(cx+1,ew);
         if (ey===2){ blk(cx-1-ew,fcy-1,ew,1,D1); blk(cx+1,fcy-1,ew,1,D1); } }
  if (hd!==3){ blk(cx-1,hy+hh-3,2,1,D1); }
}

function drawPackIcon(ctx, ox, oy, P, p) {
  const c = p.color, lite = shade(c,1.4), dark = shade(c,0.58);
  const blk = (x,y,w,h,col) => { ctx.fillStyle=col; ctx.fillRect(ox+x*P, oy+y*P, w*P, h*P); };
  blk(2,1,9,14,c);
  blk(2,1,9,1,lite);
  blk(3,2,2,12,lite);
  blk(2,1,1,14,dark); blk(10,1,1,14,dark); blk(2,14,9,1,dark);
  blk(2,6,9,4,'#f3f4f6');
  blk(3,7,7,1,dark); blk(3,9,7,1,'#cbd5e1');
  blk(6,7,1,2,c); blk(5,8,3,1,c);
}

function drawLockPx(ctx, ox, oy, P) {
  const blk = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(ox+x*P, oy+y*P, w*P, h*P); };
  blk(2,0,1,3,'#cbd5e1'); blk(7,0,1,3,'#cbd5e1'); blk(2,0,6,1,'#cbd5e1');
  blk(1,3,8,6,'#fbbf24'); blk(1,3,8,1,'#fde68a'); blk(1,8,8,1,'#d97706');
  blk(4,5,2,3,'#92400e');
}

function drawStar(ctx, cx, cy, r, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i=0;i<10;i++) {
    const ang = i*Math.PI/5 - Math.PI/2;
    const rad = i%2===0 ? r : r*0.42;
    const px = cx+Math.cos(ang)*rad, py = cy+Math.sin(ang)*rad;
    i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
  }
  ctx.closePath(); ctx.fill();
}

function prerenderSprites() {
  CARDS.forEach(card => {
    const cv = document.createElement('canvas');
    cv.width = 24*4; cv.height = 28*4;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    drawMonster(c, 0, 0, 4, card);
    card.sprite = cv.toDataURL();
    card.spriteCanvas = cv;
  });
}

// ── 외부 PNG 에셋 (캐릭터 / 카드팩) ──
const PACK_FILES = { basic:'Basic', rare:'Rare', epic:'Epic', legend:'Legend' };
// 손님 풀 — 신규 캐릭터 6명을 추가
const CHAR_NAMES = ['children','company','Glass','grandma','maleStudent','universityStudent',
                    'DAVID','EMMA','LIAM','NOAH','SOPHIE','MIA'];
const STAFF_NAMES   = ['man_staff','woman_staff'];   // 카운터 직원 (로드 + 선택지)
const STAFF_CHOICES = ['man_staff','woman_staff'];
const INSPECTORS    = ['OLIVIA','WILLIAM'];          // 본사 점검 직원
const CLEANER_NAMES = ['Cleaner1','Cleaner2','Cleaner3'];   // 청소부 (등급별)
const CLEANER_TIERS = [
  { id:'Cleaner1', name:'초급 청소부', tierLabel:'초급', speed:40, cleanT:3000, cost:50000 },
  { id:'Cleaner2', name:'중급 청소부', tierLabel:'중급', speed:65, cleanT:2000, cost:1000000 },
  { id:'Cleaner3', name:'고급 청소부', tierLabel:'고급', speed:95, cleanT:1000, cost:50000000 },
];
const PACK_IMG = {};
const CHAR_IMG = {};
const MENU_IMG = [];
const ITEM_IMG = {};
function loadGameImages() {
  PACKS.forEach(p=>{
    const path='assets/packs/'+PACK_FILES[p.id]+'.png';
    const im=new Image(); im.src=path;
    PACK_IMG[p.id]=im;
    p.sprite=path;                       // HTML 패널용
  });
  CHAR_NAMES.concat(STAFF_NAMES).concat(INSPECTORS).concat(CLEANER_NAMES).forEach(n=>{
    const im=new Image();
    im.src='assets/characters/'+n+'.png?v=3';
    CHAR_IMG[n]=im;
  });
  for (let i=1;i<=4;i++){
    const im=new Image(); im.src='assets/menu/CardMenu'+i+'.png';
    MENU_IMG[i-1]=im;
  }
  // 쓰레기 이미지
  const garbageImg = new Image();
  garbageImg.src = 'assets/items/garbage.png?v=1';
  ITEM_IMG.garbage = garbageImg;
}

// ══════════════════════════════════════════════════════════
//  NAV PIXEL ICONS  (32×32 logical)
// ══════════════════════════════════════════════════════════
function icoCollection(c,P){
  const b=(x,y,w,h,k)=>{c.fillStyle=k;c.fillRect(x*P,y*P,w*P,h*P);};
  b(6,4,3,24,'#5a2a14');              // 책등
  b(9,4,18,24,'#8a3a1e');             // 표지
  b(9,4,18,2,'#a44a26');
  b(25,6,3,20,'#ece0c4');             // 책장
  b(11,8,14,16,'#3a6a3a'); b(11,8,14,1,'#4a8a4a');
  b(13,9,2,2,'#62b04e'); b(21,9,2,2,'#62b04e');  // 귀
  b(14,11,8,8,'#62b04e'); b(14,11,8,1,'#7ac060');
  b(15,13,2,2,'#fff'); b(19,13,2,2,'#fff');
  b(16,14,1,1,'#111'); b(20,14,1,1,'#111');
  b(15,17,6,1,'#2a4a2a');
  b(20,4,3,7,'#d4493a');              // 책갈피
}
function icoRestock(c,P){
  const b=(x,y,w,h,k)=>{c.fillStyle=k;c.fillRect(x*P,y*P,w*P,h*P);};
  b(3,17,13,11,'#c08a4e'); b(3,17,13,2,'#d8a868'); b(3,17,2,11,'#d8a868'); b(8,17,2,11,'#9a6a38');
  b(17,17,12,11,'#b07e44'); b(17,17,12,2,'#caa060'); b(22,17,2,11,'#8a5e30');
  b(9,5,13,11,'#cf9c5e'); b(9,5,13,2,'#e6bc7c'); b(9,5,2,11,'#e6bc7c'); b(14,5,2,11,'#a4763e');
  // 위 화살표
  c.fillStyle='#3aa84a';
  b(25,5,2,7,'#3aa84a');
  c.beginPath(); c.moveTo(22*P,6*P); c.lineTo(26*P,1*P); c.lineTo(30*P,6*P); c.closePath(); c.fill();
}
function icoGacha(c,P){
  const b=(x,y,w,h,k)=>{c.fillStyle=k;c.fillRect(x*P,y*P,w*P,h*P);};
  const circ=(x,y,r,k)=>{c.fillStyle=k;c.beginPath();c.arc(x*P,y*P,r*P,0,7);c.fill();};
  b(5,16,22,13,'#d23b2e'); b(5,16,22,2,'#e85a4a'); b(5,27,22,2,'#9e2418');
  b(6,29,5,2,'#2a2a2a'); b(21,29,5,2,'#2a2a2a');
  c.fillStyle='#bfe4f0'; c.beginPath(); c.arc(16*P,16*P,10.5*P,Math.PI,0); c.fill();
  circ(12,12,2.6,'#f2c037'); circ(19,11,2.6,'#4aa0e0'); circ(16,15,2.6,'#5cc05c');
  b(5,15,22,2,'#eef2f4');
  b(12,19,8,4,'#3a1812'); b(14,20,4,1,'#f2c037');
  circ(16,25,2.6,'#e8e8ec'); circ(16,25,1.1,'#9099a0');
}
function icoUpgrade(c,P){
  const gx=14,gy=15,gr=9;
  c.fillStyle='#8a9099';
  for(let t=0;t<8;t++){
    const a=t*Math.PI/4, tx=gx+Math.cos(a)*gr, ty=gy+Math.sin(a)*gr;
    c.fillRect((tx-2)*P,(ty-2)*P,4*P,4*P);
  }
  c.fillStyle='#9aa0aa'; c.beginPath(); c.arc(gx*P,gy*P,gr*0.86*P,0,7); c.fill();
  c.fillStyle='#6a7079'; c.beginPath(); c.arc(gx*P,gy*P,4*P,0,7); c.fill();
  c.fillStyle='#3a4049'; c.beginPath(); c.arc(gx*P,gy*P,2*P,0,7); c.fill();
  // 초록 위 화살표
  c.fillStyle='#3aa84a';
  c.beginPath();
  c.moveTo(24*P,9*P); c.lineTo(31*P,16*P); c.lineTo(28*P,16*P);
  c.lineTo(28*P,25*P); c.lineTo(20*P,25*P); c.lineTo(20*P,16*P); c.lineTo(17*P,16*P);
  c.closePath(); c.fill();
  c.fillStyle='#5ac86a'; c.fillRect(22*P,17*P,4*P,1*P);
  drawStar(c,27*P,6*P,4*P,'#f2c037');
}
function icoGoals(c,P){
  const b=(x,y,w,h,k)=>{c.fillStyle=k;c.fillRect(x*P,y*P,w*P,h*P);};
  b(6,5,20,24,'#7a4a26'); b(6,5,20,2,'#9a6238');
  b(8,8,16,19,'#f6efdc');
  b(13,3,6,4,'#9099a0'); b(14,2,4,2,'#b0b8c0');
  for(let i=0;i<3;i++){
    const ly=12+i*5;
    b(10,ly,3,3,'#3aa84a');
    c.strokeStyle='#fff'; c.lineWidth=P;
    c.beginPath();
    c.moveTo(10.4*P,(ly+1.6)*P); c.lineTo(11.4*P,(ly+2.6)*P); c.lineTo(13*P,(ly+0.4)*P);
    c.stroke();
    b(15,ly+1,7,1,'#c0b596');
  }
  b(21,19,3,9,'#f2b840'); b(21,27,3,2,'#3a2a18'); b(21,17,3,2,'#e85a4a');
}
function icoShowcase(c,P){
  const b=(x,y,w,h,k)=>{c.fillStyle=k;c.fillRect(x*P,y*P,w*P,h*P);};
  b(2,6,28,22,'#a66a3d'); b(2,6,28,2,'#c98a52'); b(2,26,28,2,'#6b4226');
  b(2,6,2,22,'#c98a52'); b(28,6,2,22,'#6b4226');
  b(4,8,24,18,'#1a2a1a');
  b(6,10,5,13,'#ef4444');  b(6,10,5,2,'#fca5a5'); b(7,22,3,2,'#a66a3d');
  b(13,9,6,14,'#a855f7');  b(13,9,6,2,'#d8b4fe'); b(14,22,4,2,'#a66a3d');
  b(21,11,5,11,'#f59e0b'); b(21,11,5,2,'#fde68a'); b(22,21,3,2,'#a66a3d');
  b(5,21,7,2,'#f2a007'); b(12,21,8,2,'#f2a007'); b(20,21,7,2,'#f2a007');
  b(7,28,3,4,'#6b4226'); b(22,28,3,4,'#6b4226');
  b(6,2,20,5,'#f2a007'); b(6,2,20,1,'#fde68a');
  drawStar(c,16*P,5*P,2.5*P,'#6b4226');
}
function icoHire(c,P){
  const b=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x*P,y*P,w*P,h*P); };
  // 머리
  b(12,6,8,8,'#e8b890'); b(13,5,6,2,'#3a2a1a');
  // 몸통 (작업복)
  b(10,14,12,10,'#5fa5d9'); b(10,14,12,2,'#7cc3f0');
  // 빗자루 손잡이
  b(22,10,2,16,'#a66a3d'); b(22,9,2,1,'#c98a52');
  // 빗자루 솔
  b(20,24,6,4,'#fbbf24'); b(20,24,6,1,'#fde68a'); b(20,27,1,1,'#d97706'); b(22,27,1,1,'#d97706'); b(24,27,1,1,'#d97706');
  // 다리
  b(11,24,4,6,'#2c2c38'); b(17,24,4,6,'#2c2c38');
}
const NAV_ICOS = { collection:icoCollection, restock:icoRestock, gacha:icoGacha, upgrade:icoUpgrade, goals:icoGoals, showcase:icoShowcase, hire:icoHire };

function prerenderNavIcons(){
  Object.keys(NAV_ICOS).forEach(name=>{
    const cv=document.createElement('canvas');
    cv.width=32*4; cv.height=32*4;
    const c=cv.getContext('2d'); c.imageSmoothingEnabled=false;
    NAV_ICOS[name](c,4);
    const el=document.getElementById('nav-ic-'+name);
    if (el) el.innerHTML=`<img src="${cv.toDataURL()}" alt="">`;
  });
}

// SVG icons for HUD + small panel icons
const ICONS = {
  coin:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#fbbf24" stroke="#d97706" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#d97706" stroke-width="1.6"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" fill="#fbbf24"/></svg>',
  gem:'<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z" fill="#a78bfa" stroke="#7c3aed" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  speed:'<svg viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="#fbbf24"/></svg>',
  box:'<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4z" fill="#22c55e"/><path d="M3 7l9 4 9-4M12 11v10" stroke="#0f3d22" stroke-width="1.6" fill="none"/></svg>',
  shelf:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#3b82f6"/><path d="M4 9h16M4 15h16" stroke="#1e3a8a" stroke-width="1.6"/></svg>',
  auto:'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-3-6.2" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/><path d="M21 3v6h-6" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  timer:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="#3fa796" stroke="#1e5a52" stroke-width="2"/><path d="M12 13V8M12 13l4 3" stroke="#fff" stroke-width="2" stroke-linecap="round"/><rect x="9" y="2" width="6" height="3" rx="1" fill="#1e5a52"/></svg>',
  bolt:'<svg viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="#facc15" stroke="#a16207" stroke-width="1.4" stroke-linejoin="round"/></svg>',
};

// ══════════════════════════════════════════════════════════
//  GAME DATA
// ══════════════════════════════════════════════════════════
const CARDS = [
  { id:'fire_dragon',   name:'파이어 드래곤', rarity:'legendary', c1:'#ef4444', c2:'#fde68a', bd:3,hd:3,er:5,ar:1,lg:2,tl:3,wg:1,bk:1,ey:2 },
  { id:'thunder_wolf',  name:'썬더 울프',     rarity:'epic',      c1:'#a855f7', c2:'#e9d5ff', bd:0,hd:3,er:1,ar:1,lg:0,tl:4,wg:0,bk:2,ey:2 },
  { id:'ice_phoenix',   name:'아이스 피닉스', rarity:'epic',      c1:'#38bdf8', c2:'#e0f2fe', bd:0,hd:0,er:7,ar:3,lg:2,tl:2,wg:2,bk:1,ey:1 },
  { id:'dark_cat',      name:'다크 캣',       rarity:'rare',      c1:'#475569', c2:'#cbd5e1', bd:2,hd:0,er:1,ar:0,lg:0,tl:2,wg:0,bk:0,ey:2 },
  { id:'storm_eagle',   name:'스톰 이글',     rarity:'rare',      c1:'#fbbf24', c2:'#fef3c7', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:2 },
  { id:'rock_golem',    name:'록 골렘',       rarity:'rare',      c1:'#a16207', c2:'#fde68a', bd:3,hd:1,er:0,ar:2,lg:1,tl:0,wg:0,bk:1,ey:0 },
  { id:'water_turtle',  name:'워터 터틀',     rarity:'common',    c1:'#22c55e', c2:'#bbf7d0', bd:1,hd:0,er:0,ar:0,lg:1,tl:1,wg:0,bk:1,ey:0 },
  { id:'leaf_bunny',    name:'리프 버니',     rarity:'common',    c1:'#86efac', c2:'#f0fdf4', bd:2,hd:0,er:3,ar:0,lg:1,tl:4,wg:0,bk:0,ey:1 },
  { id:'fire_fox',      name:'파이어 폭스',   rarity:'common',    c1:'#fb923c', c2:'#ffedd5', bd:0,hd:3,er:1,ar:0,lg:0,tl:4,wg:0,bk:0,ey:0 },
  { id:'thunder_mouse', name:'썬더 마우스',   rarity:'common',    c1:'#94a3b8', c2:'#f1f5f9', bd:2,hd:0,er:2,ar:0,lg:1,tl:2,wg:0,bk:0,ey:1 },
  { id:'wind_bird',     name:'윈드 버드',     rarity:'common',    c1:'#7dd3fc', c2:'#e0f2fe', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:0 },
  { id:'earth_bear',    name:'어스 베어',     rarity:'common',    c1:'#b45309', c2:'#fde68a', bd:3,hd:0,er:2,ar:2,lg:1,tl:1,wg:0,bk:2,ey:0 },
  { id:'void_serpent',  name:'보이드 서펀트', rarity:'legendary', c1:'#7c3aed', c2:'#ddd6fe', bd:0,hd:3,er:5,ar:3,lg:1,tl:2,wg:1,bk:1,ey:2 },
  { id:'holy_griffin',  name:'홀리 그리핀',   rarity:'legendary', c1:'#fde047', c2:'#fffbeb', bd:0,hd:3,er:0,ar:1,lg:2,tl:2,wg:2,bk:2,ey:1 },
  { id:'shadow_panther',name:'섀도 팬서',     rarity:'epic',      c1:'#334155', c2:'#94a3b8', bd:0,hd:0,er:1,ar:1,lg:0,tl:2,wg:0,bk:0,ey:2 },
  { id:'crystal_deer',  name:'크리스탈 디어', rarity:'epic',      c1:'#22d3ee', c2:'#ecfeff', bd:0,hd:2,er:8,ar:3,lg:0,tl:1,wg:0,bk:0,ey:1 },
  { id:'magma_titan',   name:'마그마 타이탄', rarity:'epic',      c1:'#dc2626', c2:'#fb923c', bd:3,hd:1,er:4,ar:2,lg:1,tl:0,wg:0,bk:1,ey:2 },
  { id:'frost_owl',     name:'프로스트 아울', rarity:'rare',      c1:'#bae6fd', c2:'#f0f9ff', bd:1,hd:0,er:2,ar:0,lg:2,tl:1,wg:2,bk:0,ey:1 },
  { id:'venom_toad',    name:'베놈 토드',     rarity:'rare',      c1:'#65a30d', c2:'#d9f99d', bd:1,hd:1,er:0,ar:0,lg:1,tl:0,wg:0,bk:1,ey:1 },
  { id:'sand_scorpion', name:'샌드 스콜피온', rarity:'rare',      c1:'#d97706', c2:'#fde68a', bd:2,hd:1,er:6,ar:1,lg:2,tl:3,wg:0,bk:1,ey:2 },
  { id:'coral_seahorse',name:'코랄 시호스',   rarity:'rare',      c1:'#fb7185', c2:'#ffe4e6', bd:0,hd:3,er:7,ar:0,lg:1,tl:2,wg:0,bk:1,ey:1 },
  { id:'moss_slime',    name:'모스 슬라임',   rarity:'common',    c1:'#4ade80', c2:'#ecfdf5', bd:2,hd:1,er:0,ar:0,lg:1,tl:0,wg:0,bk:0,ey:1 },
  { id:'pebble_mole',   name:'페블 몰',       rarity:'common',    c1:'#a8a29e', c2:'#e7e5e4', bd:2,hd:0,er:2,ar:1,lg:1,tl:1,wg:0,bk:0,ey:0 },
  { id:'spark_chick',   name:'스파크 칙',     rarity:'common',    c1:'#facc15', c2:'#fef9c3', bd:2,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:1 },
  // ── 확장 카드 (총 100종) ──
  { id:'celestial_dragon', name:'셀레스철 드래곤', rarity:'legendary', c1:'#fcd34d', c2:'#fffbeb', bd:3,hd:3,er:5,ar:1,lg:2,tl:3,wg:2,bk:1,ey:1 },
  { id:'abyss_kraken',     name:'어비스 크라켄',   rarity:'legendary', c1:'#1e3a8a', c2:'#60a5fa', bd:1,hd:1,er:7,ar:2,lg:1,tl:2,wg:0,bk:1,ey:4 },
  { id:'solar_phoenix',    name:'솔라 피닉스',     rarity:'legendary', c1:'#f97316', c2:'#fed7aa', bd:0,hd:3,er:7,ar:3,lg:2,tl:2,wg:2,bk:1,ey:1 },
  { id:'cosmic_hydra',     name:'코스믹 히드라',   rarity:'legendary', c1:'#8b5cf6', c2:'#ddd6fe', bd:3,hd:3,er:5,ar:1,lg:2,tl:3,wg:1,bk:1,ey:4 },
  { id:'eternal_titan',    name:'이터널 타이탄',   rarity:'legendary', c1:'#eab308', c2:'#fef08a', bd:3,hd:1,er:8,ar:2,lg:1,tl:0,wg:0,bk:1,ey:2 },
  { id:'radiant_seraph',   name:'레디언트 세라프', rarity:'legendary', c1:'#fde68a', c2:'#ffffff', bd:0,hd:2,er:0,ar:3,lg:0,tl:0,wg:2,bk:2,ey:1 },
  { id:'nightmare_demon',  name:'나이트메어 데몬', rarity:'legendary', c1:'#7f1d1d', c2:'#1f2937', bd:3,hd:3,er:8,ar:1,lg:2,tl:3,wg:1,bk:1,ey:2 },
  { id:'inferno_wyvern',   name:'인페르노 와이번', rarity:'epic',      c1:'#ea580c', c2:'#fde68a', bd:0,hd:3,er:5,ar:1,lg:2,tl:3,wg:1,bk:1,ey:2 },
  { id:'glacier_bear',     name:'글레이셔 베어',   rarity:'epic',      c1:'#7dd3fc', c2:'#f0f9ff', bd:3,hd:0,er:2,ar:2,lg:1,tl:1,wg:0,bk:2,ey:0 },
  { id:'storm_griffin',    name:'스톰 그리핀',     rarity:'epic',      c1:'#f59e0b', c2:'#fffbeb', bd:0,hd:3,er:0,ar:1,lg:2,tl:2,wg:2,bk:2,ey:1 },
  { id:'venom_basilisk',   name:'베놈 바실리스크', rarity:'epic',      c1:'#4d7c0f', c2:'#bef264', bd:0,hd:3,er:4,ar:3,lg:1,tl:2,wg:0,bk:1,ey:2 },
  { id:'shadow_manticore', name:'섀도 만티코어',   rarity:'epic',      c1:'#1f2937', c2:'#6b7280', bd:0,hd:0,er:1,ar:1,lg:2,tl:3,wg:1,bk:2,ey:2 },
  { id:'crystal_unicorn',  name:'크리스탈 유니콘', rarity:'epic',      c1:'#a5f3fc', c2:'#ecfeff', bd:0,hd:2,er:4,ar:3,lg:0,tl:4,wg:0,bk:2,ey:1 },
  { id:'magma_cerberus',   name:'마그마 케르베로스',rarity:'epic',     c1:'#b91c1c', c2:'#f97316', bd:3,hd:3,er:1,ar:2,lg:2,tl:2,wg:0,bk:1,ey:2 },
  { id:'thunder_chimera',  name:'썬더 키메라',     rarity:'epic',      c1:'#c084fc', c2:'#f3e8ff', bd:0,hd:3,er:5,ar:1,lg:2,tl:3,wg:1,bk:2,ey:4 },
  { id:'mystic_sphinx',    name:'미스틱 스핑크스', rarity:'epic',      c1:'#d8b4fe', c2:'#f5f3ff', bd:1,hd:0,er:1,ar:1,lg:0,tl:2,wg:2,bk:2,ey:1 },
  { id:'frost_salamander', name:'프로스트 살라만더',rarity:'epic',     c1:'#93c5fd', c2:'#eff6ff', bd:0,hd:3,er:7,ar:3,lg:0,tl:2,wg:0,bk:1,ey:1 },
  { id:'void_raven',       name:'보이드 레이븐',   rarity:'epic',      c1:'#4c1d95', c2:'#a78bfa', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:1,bk:0,ey:2 },
  { id:'solar_lion',       name:'솔라 라이언',     rarity:'epic',      c1:'#f4a823', c2:'#fef3c7', bd:0,hd:0,er:2,ar:1,lg:0,tl:4,wg:0,bk:2,ey:0 },
  { id:'lunar_owl',        name:'루나 아울',       rarity:'epic',      c1:'#c7d2fe', c2:'#eef2ff', bd:1,hd:0,er:2,ar:0,lg:2,tl:1,wg:2,bk:0,ey:1 },
  { id:'ember_tiger',      name:'엠버 타이거',     rarity:'epic',      c1:'#f87171', c2:'#fee2e2', bd:0,hd:3,er:1,ar:1,lg:0,tl:2,wg:0,bk:0,ey:2 },
  { id:'tempest_eagle',    name:'템페스트 이글',   rarity:'epic',      c1:'#0ea5e9', c2:'#e0f2fe', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:2 },
  { id:'flame_viper',      name:'플레임 바이퍼',   rarity:'rare',      c1:'#f43f5e', c2:'#fecdd3', bd:0,hd:3,er:4,ar:3,lg:1,tl:2,wg:0,bk:1,ey:2 },
  { id:'aqua_shark',       name:'아쿠아 샤크',     rarity:'rare',      c1:'#0284c7', c2:'#e0f2fe', bd:1,hd:3,er:7,ar:0,lg:1,tl:2,wg:0,bk:1,ey:2 },
  { id:'wind_hawk',        name:'윈드 호크',       rarity:'rare',      c1:'#67e8f9', c2:'#ecfeff', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:2 },
  { id:'earth_boar',       name:'어스 보어',       rarity:'rare',      c1:'#92400e', c2:'#fde68a', bd:3,hd:3,er:8,ar:2,lg:1,tl:1,wg:0,bk:2,ey:0 },
  { id:'ice_lynx',         name:'아이스 링크스',   rarity:'rare',      c1:'#cae9fb', c2:'#f0f9ff', bd:0,hd:0,er:1,ar:1,lg:0,tl:1,wg:0,bk:0,ey:1 },
  { id:'dark_raven',       name:'다크 레이븐',     rarity:'rare',      c1:'#1e293b', c2:'#64748b', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:1,bk:0,ey:2 },
  { id:'poison_spider',    name:'포이즌 스파이더', rarity:'rare',      c1:'#84cc16', c2:'#365314', bd:2,hd:1,er:6,ar:1,lg:2,tl:0,wg:0,bk:1,ey:4 },
  { id:'steel_beetle',     name:'스틸 비틀',       rarity:'rare',      c1:'#9ca3af', c2:'#374151', bd:1,hd:1,er:4,ar:1,lg:1,tl:0,wg:3,bk:1,ey:0 },
  { id:'magic_imp',        name:'매직 임프',       rarity:'rare',      c1:'#a78bfa', c2:'#ede9fe', bd:2,hd:0,er:8,ar:0,lg:1,tl:3,wg:1,bk:0,ey:2 },
  { id:'coral_crab',       name:'코랄 크랩',       rarity:'rare',      c1:'#fda4af', c2:'#ffe4e6', bd:1,hd:1,er:6,ar:1,lg:2,tl:0,wg:0,bk:1,ey:1 },
  { id:'mist_newt',        name:'미스트 뉴트',     rarity:'rare',      c1:'#5eead4', c2:'#f0fdfa', bd:0,hd:3,er:7,ar:3,lg:1,tl:2,wg:0,bk:1,ey:1 },
  { id:'solar_cobra',      name:'솔라 코브라',     rarity:'rare',      c1:'#f0b429', c2:'#fef9c3', bd:0,hd:3,er:0,ar:3,lg:1,tl:2,wg:0,bk:2,ey:2 },
  { id:'lunar_bat',        name:'루나 배트',       rarity:'rare',      c1:'#818cf8', c2:'#e0e7ff', bd:2,hd:0,er:1,ar:0,lg:1,tl:1,wg:1,bk:0,ey:1 },
  { id:'ember_hornet',     name:'엠버 호넷',       rarity:'rare',      c1:'#fdba74', c2:'#431407', bd:2,hd:1,er:6,ar:0,lg:2,tl:3,wg:3,bk:0,ey:4 },
  { id:'glacial_seal',     name:'글레이셜 씰',     rarity:'rare',      c1:'#bfdbfe', c2:'#f0f9ff', bd:1,hd:0,er:0,ar:0,lg:1,tl:1,wg:0,bk:0,ey:1 },
  { id:'cyclone_moth',     name:'사이클론 모스',   rarity:'rare',      c1:'#a3e635', c2:'#ecfccb', bd:0,hd:1,er:6,ar:3,lg:1,tl:0,wg:3,bk:2,ey:1 },
  { id:'shadow_lizard',    name:'섀도 리저드',     rarity:'rare',      c1:'#374151', c2:'#9ca3af', bd:0,hd:3,er:4,ar:1,lg:2,tl:2,wg:0,bk:1,ey:2 },
  { id:'crystal_frog',     name:'크리스탈 프로그', rarity:'rare',      c1:'#2dd4bf', c2:'#ecfeff', bd:1,hd:1,er:0,ar:0,lg:1,tl:0,wg:0,bk:0,ey:1 },
  { id:'thunder_ram',      name:'썬더 램',         rarity:'rare',      c1:'#fce96a', c2:'#fef9c3', bd:0,hd:0,er:8,ar:1,lg:0,tl:1,wg:0,bk:2,ey:0 },
  { id:'flame_jackal',     name:'플레임 자칼',     rarity:'rare',      c1:'#e23b3b', c2:'#fecaca', bd:0,hd:3,er:1,ar:1,lg:0,tl:2,wg:0,bk:1,ey:2 },
  { id:'aqua_otter',       name:'아쿠아 오터',     rarity:'rare',      c1:'#56c5f5', c2:'#e0f2fe', bd:0,hd:0,er:2,ar:0,lg:0,tl:2,wg:0,bk:0,ey:1 },
  { id:'wind_falcon',      name:'윈드 팰컨',       rarity:'rare',      c1:'#7ee0ef', c2:'#ecfeff', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:2 },
  { id:'earth_armadillo',  name:'어스 아르마딜로', rarity:'rare',      c1:'#c2691a', c2:'#fde68a', bd:1,hd:0,er:2,ar:1,lg:1,tl:2,wg:0,bk:1,ey:0 },
  { id:'pebble_frog',      name:'페블 프로그',     rarity:'common',    c1:'#a7f3c4', c2:'#f0fdf4', bd:1,hd:1,er:0,ar:0,lg:1,tl:0,wg:0,bk:0,ey:1 },
  { id:'spark_mouse',      name:'스파크 마우스',   rarity:'common',    c1:'#fef08a', c2:'#fefce8', bd:2,hd:0,er:2,ar:0,lg:1,tl:2,wg:0,bk:0,ey:1 },
  { id:'leaf_squirrel',    name:'리프 스쿼럴',     rarity:'common',    c1:'#5fd98a', c2:'#dcfce7', bd:2,hd:0,er:1,ar:0,lg:1,tl:4,wg:0,bk:0,ey:1 },
  { id:'mud_piglet',       name:'머드 피글렛',     rarity:'common',    c1:'#d6a373', c2:'#f5e6d3', bd:1,hd:1,er:2,ar:0,lg:1,tl:1,wg:0,bk:0,ey:0 },
  { id:'snow_bunny',       name:'스노 버니',       rarity:'common',    c1:'#e0f2fe', c2:'#ffffff', bd:2,hd:0,er:3,ar:0,lg:1,tl:4,wg:0,bk:0,ey:1 },
  { id:'dust_mole',        name:'더스트 몰',       rarity:'common',    c1:'#b8b2ac', c2:'#e7e5e4', bd:2,hd:0,er:2,ar:1,lg:1,tl:1,wg:0,bk:0,ey:0 },
  { id:'puddle_duck',      name:'퍼들 덕',         rarity:'common',    c1:'#90dbf9', c2:'#e0f2fe', bd:1,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:0 },
  { id:'twig_bird',        name:'트위그 버드',     rarity:'common',    c1:'#bef264', c2:'#f7fee7', bd:0,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:1 },
  { id:'coal_imp',         name:'콜 임프',         rarity:'common',    c1:'#6b7280', c2:'#9ca3af', bd:2,hd:0,er:4,ar:0,lg:1,tl:3,wg:1,bk:0,ey:2 },
  { id:'berry_bat',        name:'베리 배트',       rarity:'common',    c1:'#f9a8d4', c2:'#fce7f3', bd:2,hd:0,er:1,ar:0,lg:1,tl:1,wg:1,bk:0,ey:1 },
  { id:'moss_turtle',      name:'모스 터틀',       rarity:'common',    c1:'#76b81a', c2:'#d9f99d', bd:1,hd:0,er:0,ar:0,lg:1,tl:1,wg:0,bk:1,ey:0 },
  { id:'cloud_lamb',       name:'클라우드 램',     rarity:'common',    c1:'#f1f5f9', c2:'#ffffff', bd:1,hd:0,er:5,ar:0,lg:1,tl:1,wg:0,bk:2,ey:1 },
  { id:'clay_crab',        name:'클레이 크랩',     rarity:'common',    c1:'#e8a838', c2:'#fef3c7', bd:1,hd:1,er:6,ar:1,lg:2,tl:0,wg:0,bk:0,ey:1 },
  { id:'fern_newt',        name:'펀 뉴트',         rarity:'common',    c1:'#34d399', c2:'#d1fae5', bd:0,hd:3,er:0,ar:3,lg:1,tl:2,wg:0,bk:1,ey:1 },
  { id:'acorn_chick',      name:'에이콘 칙',       rarity:'common',    c1:'#fadf63', c2:'#fef9c3', bd:2,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:1 },
  { id:'river_minnow',     name:'리버 미노',       rarity:'common',    c1:'#3ddcef', c2:'#ecfeff', bd:2,hd:0,er:7,ar:0,lg:1,tl:2,wg:0,bk:0,ey:1 },
  { id:'breeze_moth',      name:'브리즈 모스',     rarity:'common',    c1:'#d9f99d', c2:'#f7fee7', bd:0,hd:1,er:6,ar:3,lg:1,tl:0,wg:3,bk:0,ey:0 },
  { id:'spark_beetle',     name:'스파크 비틀',     rarity:'common',    c1:'#f5c211', c2:'#7c5e0a', bd:1,hd:1,er:4,ar:1,lg:1,tl:0,wg:3,bk:1,ey:0 },
  { id:'pebble_toad',      name:'페블 토드',       rarity:'common',    c1:'#b6e85a', c2:'#ecfccb', bd:1,hd:1,er:0,ar:0,lg:1,tl:0,wg:0,bk:0,ey:1 },
  { id:'frost_chick',      name:'프로스트 칙',     rarity:'common',    c1:'#cdebfb', c2:'#f0f9ff', bd:2,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:1 },
  { id:'ash_fox',          name:'애시 폭스',       rarity:'common',    c1:'#aab0b8', c2:'#e5e7eb', bd:0,hd:3,er:1,ar:0,lg:0,tl:4,wg:0,bk:0,ey:0 },
  { id:'sprout_slime',     name:'스프라우트 슬라임',rarity:'common',   c1:'#6ee7a0', c2:'#ecfdf5', bd:2,hd:1,er:7,ar:0,lg:1,tl:0,wg:0,bk:0,ey:1 },
  { id:'glow_worm',        name:'글로 웜',         rarity:'common',    c1:'#fdee5a', c2:'#fefce8', bd:2,hd:0,er:6,ar:0,lg:1,tl:1,wg:0,bk:0,ey:1 },
  { id:'shade_cat',        name:'셰이드 캣',       rarity:'common',    c1:'#64748b', c2:'#cbd5e1', bd:2,hd:0,er:1,ar:0,lg:0,tl:2,wg:0,bk:0,ey:2 },
  { id:'bubble_fish',      name:'버블 피쉬',       rarity:'common',    c1:'#4cc4f0', c2:'#e0f2fe', bd:1,hd:1,er:7,ar:0,lg:1,tl:2,wg:0,bk:0,ey:1 },
  { id:'thorn_lizard',     name:'쏜 리저드',       rarity:'common',    c1:'#588f0c', c2:'#d9f99d', bd:0,hd:3,er:4,ar:1,lg:2,tl:2,wg:0,bk:1,ey:2 },
  { id:'sandy_gecko',      name:'샌디 게코',       rarity:'common',    c1:'#f6cf57', c2:'#fef3c7', bd:0,hd:3,er:0,ar:3,lg:2,tl:2,wg:0,bk:0,ey:1 },
  { id:'ember_chick',      name:'엠버 칙',         rarity:'common',    c1:'#fca65a', c2:'#ffedd5', bd:2,hd:3,er:0,ar:0,lg:2,tl:1,wg:2,bk:0,ey:1 },
  { id:'drift_jelly',      name:'드리프트 젤리',   rarity:'common',    c1:'#a5b4fc', c2:'#e0e7ff', bd:2,hd:0,er:0,ar:3,lg:1,tl:0,wg:0,bk:0,ey:1 },
  { id:'hollow_ghost',     name:'할로 고스트',     rarity:'common',    c1:'#cbd5e1', c2:'#f8fafc', bd:2,hd:0,er:0,ar:3,lg:1,tl:0,wg:0,bk:0,ey:3 },
  { id:'tiny_drake',       name:'타이니 드레이크', rarity:'common',    c1:'#fb8a8a', c2:'#fee2e2', bd:2,hd:3,er:5,ar:0,lg:2,tl:3,wg:1,bk:1,ey:1 },
];

const PACKS = [
  { id:'basic',  name:'베이직 팩', color:'#3b82f6', buyPrice:50,    sellPrice:80,    maxStock:200, rw:{common:85,rare:13,epic:2,legendary:0},  unlock:1,  xp:8   },
  { id:'rare',   name:'레어 팩',   color:'#22c55e', buyPrice:500,   sellPrice:800,   maxStock:100, rw:{common:50,rare:35,epic:13,legendary:2}, unlock:3,  xp:24  },
  { id:'epic',   name:'에픽 팩',   color:'#a855f7', buyPrice:5000,  sellPrice:8000,  maxStock:50,  rw:{common:20,rare:40,epic:30,legendary:10},unlock:10, xp:65  },
  { id:'legend', name:'레전드 팩', color:'#f59e0b', buyPrice:50000, sellPrice:80000, maxStock:20,  rw:{common:0,rare:20,epic:50,legendary:30}, unlock:20, xp:160 },
];

const shelves = [
  // 본관 — 9개
  { packId:'basic',  unlockLv:1,  stock:50, maxStock:100, level:1, room:'main' },
  { packId:'basic',  unlockLv:3,  stock:0,  maxStock:100, level:1, room:'main' },
  { packId:'rare',   unlockLv:5,  stock:0,  maxStock:50,  level:1, room:'main' },
  { packId:'rare',   unlockLv:7,  stock:0,  maxStock:50,  level:1, room:'main' },
  { packId:'epic',   unlockLv:10, stock:0,  maxStock:30,  level:1, room:'main' },
  { packId:'epic',   unlockLv:15, stock:0,  maxStock:30,  level:1, room:'main' },
  { packId:'legend', unlockLv:20, stock:0,  maxStock:20,  level:1, room:'main' },
  { packId:'legend', unlockLv:25, stock:0,  maxStock:20,  level:1, room:'main' },
  { packId:'legend', unlockLv:30, stock:0,  maxStock:20,  level:1, room:'main' },
  // 별관 — 3개 (배틀 카페 하단)
  { packId:'rare',   unlockLv:22, stock:0,  maxStock:60,  level:1, room:'annex' },
  { packId:'epic',   unlockLv:30, stock:0,  maxStock:35,  level:1, room:'annex' },
  { packId:'legend', unlockLv:40, stock:0,  maxStock:25,  level:1, room:'annex' },
];

// ── 별관 카드 배틀 테이블 — 6개 (기본 2개, 레벨별 해금) ──
// 각 테이블: 2명이 앉아 1:1 카드게임. 1명만 앉으면 대기. 2명 차면 게이지 진행 → 매출.
const battleTables = [
  { id:0, x:0, y:0, seats:[null,null], queue:[], gauge:0, duration:27000, state:'empty', unlockLv:1,  card0:null, card1:null },
  { id:1, x:0, y:0, seats:[null,null], queue:[], gauge:0, duration:27000, state:'empty', unlockLv:1,  card0:null, card1:null },
  { id:2, x:0, y:0, seats:[null,null], queue:[], gauge:0, duration:27000, state:'empty', unlockLv:30, card0:null, card1:null },
  { id:3, x:0, y:0, seats:[null,null], queue:[], gauge:0, duration:27000, state:'empty', unlockLv:35, card0:null, card1:null },
  { id:4, x:0, y:0, seats:[null,null], queue:[], gauge:0, duration:27000, state:'empty', unlockLv:40, card0:null, card1:null },
  { id:5, x:0, y:0, seats:[null,null], queue:[], gauge:0, duration:27000, state:'empty', unlockLv:45, card0:null, card1:null },
];

// 테이블별 대기 줄 — 각 테이블당 최대 2명, 테이블 바로 아래 양옆에 한 명씩
const BATTLE_QUEUE_PER_TABLE = 2;

function battleTableQueuePos(bt, idx){
  const qy = bt.y + bt.h + 6;
  if (idx === 0) return { x: bt.x - 2, y: qy };
  return { x: bt.x + bt.w - CHAR_DW + 2, y: qy };
}

function assignFromTableQueue(bt){
  if (!bt || !bt.queue.length) return;
  const c = bt.queue.shift();
  // 나머지 큐 위치 조정
  bt.queue.forEach((qc, i) => {
    if (qc.state === 'battle_wait'){
      const np = battleTableQueuePos(bt, i);
      qc.tx = np.x; qc.ty = np.y; qc.atDoor = true;
      qc.state = 'enter';
    }
  });
  // 테이블 좌석 배정
  const seatIdx = bt.seats[0] ? 1 : 0;
  const seatPos = battleSeatPos(bt, seatIdx);
  c.dest = seatPos;
  c.tx = seatPos.x; c.ty = seatPos.y;
  c.atDoor = true;
  c.state = 'enter';
  c.type = 'battler';
  c.battleSeatIdx = seatIdx;
  bt.seats[seatIdx] = c;
  const randCard = CARDS[Math.floor(Math.random()*CARDS.length)];
  if (seatIdx===0) bt.card0 = randCard; else bt.card1 = randCard;
  if (bt.seats.filter(Boolean).length === 1) bt.state = 'waiting';
  setBubble(c, rndOf(['드디어 내 차례!','기다렸어!','빨리 배틀하자!']));
}

// 큐에 자리가 남은 테이블 찾기 (배틀 진행 중인 테이블만)
function findQueueableTable(){
  let best=null;
  for (const bt of battleTables){
    if ((bt.unlockLv||1) > G.level) continue;
    if (bt.queue.length >= BATTLE_QUEUE_PER_TABLE) continue;
    if (bt.state === 'battling'){
      if (!best || bt.queue.length < best.queue.length) best = bt;
    }
  }
  return best;
}

const upgrades = [
  { id:'customer_speed', name:'손님 속도',   icon:'speed', desc:'손님 방문 주기 단축',         level:1, maxLevel:10, baseCost:200,  effect:'방문 +10%' },
  { id:'checkout_speed', name:'계산 속도',   icon:'timer', desc:'점원 계산 시간 단축',         level:1, maxLevel:10, baseCost:800,  effect:'계산 -10%' },
  { id:'sell_price',     name:'판매 보너스', icon:'coin',  desc:'모든 판매가 보너스',           level:1, maxLevel:10, baseCost:500,  effect:'수익 +10%' },
  { id:'shelf_size',     name:'진열대 용량', icon:'shelf', desc:'최대 재고 증가',               level:1, maxLevel:10, baseCost:1000, effect:'재고 +20%' },
  { id:'auto_restock',   name:'자동 재고',   icon:'auto',  desc:'재고 자동 보충',               level:0, maxLevel:1,  baseCost:5000, cash:5000, effect:'자동 활성화' },
  { id:'battle_speed',   name:'배틀 속도',   icon:'bolt',  desc:'별관 카드 배틀 게이지 속도 +20%', level:0, maxLevel:5, baseCost:1200, effect:'게이지 +20%' },
];

const goals = [
  { id:'sales',   name:'누적 판매',   stat:'totalSales',     target:25,   reward:3600, rtype:'money', scale:2.5, tier:1, done:false, claimed:false },
  { id:'money',   name:'자산 모으기', stat:'money',          target:8000, reward:6,    rtype:'gems',  scale:3,   tier:1, done:false, claimed:false },
  { id:'level',   name:'레벨 달성',   stat:'level',          target:5,    reward:40,   rtype:'stars', scale:1.5, tier:1, done:false, claimed:false },
  { id:'collect', name:'카드 수집',   stat:'collectionSize', target:6,    reward:6000, rtype:'money', scale:1.6, tier:1, done:false, claimed:false },
];
const RTYPE = { money:'coin', gems:'gem', stars:'star' };

// ── 전시 카드 컬렉션 데이터 ──
const CARD_BASE_PRICE = { common:1000, rare:4000, epic:40000, legendary:300000 };   // 등급별 기준가 — 카드별 hash로 0.5~30배 변동
// 카드 id 해시 기반 결정론적 가치 배수 (같은 카드는 항상 같은 가격)
function _cardHash(id){
  let h = 5381;
  for (let i=0;i<id.length;i++) h = ((h<<5) + h + id.charCodeAt(i)) | 0;
  return h>>>0;   // unsigned
}
function cardValueMul(id){
  const r = (_cardHash(id) % 10000) / 10000;   // 0~1
  if (r < 0.60)      return 0.5 + (r/0.60)*0.5;            // 60%: 0.5~1.0 (저가)
  if (r < 0.90)      return 1.0 + ((r-0.60)/0.30)*2.0;     // 30%: 1.0~3.0 (보통)
  if (r < 0.98)      return 3.0 + ((r-0.90)/0.08)*7.0;     // 8%:  3.0~10  (고가)
  return 10.0 + ((r-0.98)/0.02)*20.0;                       // 2%:  10~30  (프리미엄)
}
function cardLvMul(){ return Math.pow(1.38, Math.max(0, G.level - 1)); }
function cardBaseValue(card){ return Math.max(1, Math.round(CARD_BASE_PRICE[card.rarity] * cardValueMul(card.id) * cardLvMul())); }
function cardSellValue(card){ return Math.max(1, Math.round(CARD_SELL[card.rarity] * cardValueMul(card.id) * cardLvMul())); }
const CARD_SELL       = { common:100, rare:600, epic:2500, legendary:10000 };  // 중복 카드 판매가
const showcaseSlots   = [null,null,null,null,null,null,null,null]; // { cardId, price } | null (8칸)
let   showcasePickSlot = -1;                       // -1 = 첫 빈 칸, ≥0 = 특정 칸
const SHOWCASE_BROWSE_LINES = ['진열장 구경~','오, 멋진 카드!','이게 뭐지?','우와 희귀해!','탐난다~'];
const SHOWCASE_BUY_LINES    = ['이 카드 살래!','득템~!','완전 좋아!','이건 꼭 사야지!'];
const SHOWCASE_REJECT_LINES = ['좀 비싸네..','다음에~','음.. 고민중','지갑이 얇아서ㅠ'];

// ══════════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════════
const G = { money:500, gems:0, stars:0, level:1, xp:0, xpNeeded:80, totalSales:0, collection:{}, everOwned:{},
            prestige:0, tutorialDone:false, prestigeIntroSeen:false, annexIntroSeen:false, prestige50Seen:false, packChangeUnlockSeen:false, goalsTripled:true, epicLegendBumped:true, priceBumpedV2:true, incomeRate:0,
            shopName:'', clerk:'man_staff', cleaner:null, cleanerMain:null, cleanerAnnex:null, reputation:50, dirtLevel:0,
            lastDailyClaim:'', dailyStreak:0, playTime:0, gemsEarnedTotal:0,
            prestigeUpg:{ startMoney:0, gemBonus:0, shelfBonus:0, popFloor:0 },
            theme:'cozy', annexUnlocked:false, currentRoom:'main', garbageStarted:false,
            starUpg:{ income:0, speed:0, xp:0 } };
let priceMulti = 1.0, speedMulti = 1.0, autoRestock = false;
let starIncome = 1.0, starSpeed = 1.0, starXpMul = 1.0, prestigeMulti = 1.0;
// 도감 보너스 — 수집률·등급별 컴플리트로 결정
let dexIncomeMul = 1.0, dexSpawnMul = 1.0, dexCheckoutMul = 1.0, dexGemX2 = false;
let audioCtx = null, muted = false, sfxGain = null, bgmGain = null;
let bgmVol = 0.5, sfxVol = 0.8, notifEnabled = false;
const liveOsc = new Set();

// ══════════════════════════════════════════════════════════
//  CUSTOMERS  +  QUEUE
// ══════════════════════════════════════════════════════════
const customers  = [];
const floatTexts = [];
const qline       = [];   // 본관 계산대 줄
const qline_annex = [];   // 별관 계산대 줄
function qlineFor(room){ return room==='annex' ? qline_annex : qline; }
let lastTime = 0, spawnTimer = 0, spawnInterval = 2600, clerkBob = 0;
let clerkBubble = null, checkoutTime = 1200;
let incomeAccum = 0, saveTimer = 0, rateTimer = 0;
// 인기도 — 0~1. 손님 방문 속도·최대 인원을 좌우. 동작하면 오르고 가만히 있으면 내려감
let popularity = 0.2;
const MAX_CUSTOMERS = 50;
function boostPopularity(a){ popularity = Math.min(1, popularity + a); }

// ── 쓰레기 + 청소부 시스템 ──
const garbages = [];           // {x,y,t} 매장 바닥의 쓰레기
let garbageTimer = 25000;       // 첫 쓰레기 25초 후
// 쓰레기는 초급 청소부 고용 가능 시점쯤(첫 청소부 비용의 60%)부터 생성
// 한번이라도 임계 골드에 도달하면 그 이후엔 계속 진행 (돈을 다 써도 멈추지 않음)
function garbageSpawnUnlocked(){
  if (G.garbageStarted) return true;
  const threshold = (CLEANER_TIERS[0] ? CLEANER_TIERS[0].cost : 50000) * 0.6;
  if (G.money >= threshold || (G.cleanerMain || G.cleanerAnnex)){
    G.garbageStarted = true;
    return true;
  }
  return false;
}
// 방별 청소부 엔티티 — 본관·별관 각각 독립적으로 운영
const cleanerEntities = { main:null, annex:null };
// 레거시 호환 (드로잉/디버깅) — 현재 방의 엔티티
let cleanerEntity = null;       // {x,y,tx,ty,state,targetIdx,waitT,frame,animT,flip,walking}
function getCleanerId(room){ return room==='annex' ? G.cleanerAnnex : G.cleanerMain; }
function getCleanerEntity(room){ return cleanerEntities[room==='annex'?'annex':'main']; }
function garbageMaxCount(){ return Math.min(50, 20 + Math.max(0,G.level)); }
// 청소부 등급별 쓰레기 감소율 — 등급이 오를수록 감소율이 낮아져(쓰레기가 더 자주 생김) 청소 부담 증가
// 본관/별관 중 더 높은 등급을 기준
function bestCleanerTier(){
  const order = { Cleaner1:1, Cleaner2:2, Cleaner3:3 };
  return Math.max(order[G.cleanerMain]||0, order[G.cleanerAnnex]||0);
}
function garbageReductionMul(){
  // 감소율: 미고용/초급=60%, 중급=45%, 고급=30%
  // interval 배수 = 1 / (1 - reduction)
  const t = bestCleanerTier();
  if (t>=3) return 1 / 0.70;   // 고급 — 30% 감소
  if (t>=2) return 1 / 0.55;   // 중급 — 45% 감소
  return     1 / 0.40;          // 미고용·초급 — 60% 감소
}
function nextGarbageInterval(){
  // Lv1 ~6초, Lv10 ~4초, Lv20 ~3초, Lv30 ~2.5초, Lv50 ~2초 (이전보다 약 2배 빠름)
  const base = Math.max(2000, 6000 / (1 + Math.max(0,G.level)*0.05));
  return base * garbageReductionMul() * (0.7 + Math.random()*0.6);  // ±30% 변동
}
function spawnGarbage(){
  if (!garbageSpawnUnlocked()) return;
  if (garbages.length >= garbageMaxCount()) return;
  // 별관 해금 시 50/50 확률로 어느 방에 쓰레기 생성
  const room = (G.annexUnlocked && Math.random()<0.5) ? 'annex' : 'main';
  garbages.push({
    x: 30 + Math.random()*(CW-60),
    y: FLOOR_Y + 25 + Math.random()*Math.max(40, FLOOR_BOT - FLOOR_Y - 80),
    room,
  });
  G.dirtLevel = Math.min(100, (G.dirtLevel||0) + 2);
}
function getCleanerTier(room){
  const id = getCleanerId(room||(G.currentRoom||'main'));
  return CLEANER_TIERS.find(t=>t.id===id) || null;
}
function initCleaner(room){
  if (room){
    const id = getCleanerId(room);
    if (!id){ cleanerEntities[room] = null; return; }
    if (cleanerEntities[room]) return;
    cleanerEntities[room] = {
      x: CW/2, y: FLOOR_Y+30, tx: CW/2, ty: FLOOR_Y+30,
      state:'idle', targetIdx:-1, waitT:0,
      flip:false, frame:0, animT:0, walking:false,
      room,
    };
  } else {
    initCleaner('main'); initCleaner('annex');
  }
  cleanerEntity = getCleanerEntity(G.currentRoom||'main');
}
function updateCleanerForRoom(dt, room){
  const id = getCleanerId(room);
  if (!id) return;
  if (!cleanerEntities[room]) initCleaner(room);
  const c = cleanerEntities[room];
  if (!c) return;
  const tier = CLEANER_TIERS.find(t=>t.id===id); if (!tier) return;
  c.animT += dt;
  if (c.animT > 170){ c.frame ^= 1; c.animT = 0; }

  if (c.state === 'idle'){
    // 자기 방 쓰레기 중 가장 가까운 것
    let minD=Infinity, idx=-1;
    garbages.forEach((g,i)=>{
      if ((g.room||'main')!==room) return;
      const d = Math.hypot(g.x-c.x, g.y-c.y);
      if (d<minD){ minD=d; idx=i; }
    });
    if (idx>=0){
      c.targetIdx = idx;
      c.tx = garbages[idx].x; c.ty = garbages[idx].y;
      c.state = 'walk';
    } else {
      c.waitT += dt;
      if (c.waitT > 2200){
        c.tx = 30 + Math.random()*(CW-60);
        c.ty = FLOOR_Y + 30 + Math.random()*Math.max(40, FLOOR_BOT - FLOOR_Y - 100);
        c.state = 'wander';
        c.waitT = 0;
      }
    }
  } else if (c.state === 'walk' || c.state === 'wander'){
    if (c.state==='walk'){
      const target = c.targetIdx>=0 ? garbages[c.targetIdx] : null;
      // 타겟이 사라졌거나 다른 방의 것이면 idle로
      if (!target || (target.room||'main')!==room){
        c.state='idle'; c.targetIdx=-1; c.walking=false; return;
      }
      c.tx = target.x; c.ty = target.y;
    }
    const dx = c.tx-c.x, dy = c.ty-c.y, d = Math.hypot(dx,dy);
    if (d < 3){
      c.x = c.tx; c.y = c.ty; c.walking = false;
      if (c.state==='walk'){ c.state = 'clean'; c.waitT = 0; }
      else { c.state = 'idle'; c.waitT = 0; }
    } else {
      c.x += dx/d * tier.speed * dt/1000;
      c.y += dy/d * tier.speed * dt/1000;
      if (Math.abs(dx)>2) c.flip = dx<0;
      c.walking = true;
    }
  } else if (c.state === 'clean'){
    c.walking = false;
    c.waitT += dt;
    if (c.waitT >= tier.cleanT){
      if (c.targetIdx>=0 && c.targetIdx<garbages.length){
        const tgt = garbages[c.targetIdx];
        if (tgt && (tgt.room||'main')===room){
          garbages.splice(c.targetIdx, 1);
          G.dirtLevel = Math.max(0, (G.dirtLevel||0) - 2);
          sfxClean();
        }
      }
      c.targetIdx = -1;
      c.state = 'idle';
      c.waitT = 0;
    }
  }
}
function updateCleaner(dt){
  updateCleanerForRoom(dt, 'main');
  if (G.annexUnlocked) updateCleanerForRoom(dt, 'annex');
  cleanerEntity = getCleanerEntity(G.currentRoom||'main');
}
function drawGarbages(){
  const img = ITEM_IMG.garbage;
  const room = G.currentRoom || 'main';
  garbages.forEach(g=>{
    if ((g.room||'main')!==room) return;   // 현재 방의 쓰레기만
    if (img && img.complete && img.naturalWidth){
      const w = 26, h = Math.round(26 * img.naturalHeight / img.naturalWidth);
      // 짙은 그림자 + 외곽 글로우로 강조
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(g.x, g.y+h/2+2, w/2-1, 3.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(187,59,45,0.18)';
      ctx.beginPath(); ctx.ellipse(g.x, g.y, w/2+2, h/2+2, 0, 0, Math.PI*2); ctx.fill();
      ctx.drawImage(img, Math.round(g.x-w/2), Math.round(g.y-h/2), w, h);
    } else {
      ctx.fillStyle='#6b4226'; ctx.fillRect(Math.round(g.x-6), Math.round(g.y-4), 12, 8);
    }
  });
}
function drawCleaner(){
  const room = G.currentRoom || 'main';
  const id = getCleanerId(room);
  const c = cleanerEntities[room];
  if (!id || !c) return;
  drawChar(ctx, c.x-CHAR_DW/2, c.y-CHAR_DH/2,
           id, c.frame, { walking:c.walking, flip:c.flip });
  // 청소중 — 머리 위 진행 게이지
  if (c.state === 'clean'){
    const tier = getCleanerTier();
    if (tier){
      const prog = Math.max(0, Math.min(1, c.waitT / tier.cleanT));
      const barW = 30, barH = 5;
      const bx = Math.round(c.x - barW/2);
      const by = Math.round(c.y - CHAR_DH/2 - 12);
      // 배경 + 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx-1, by-1, barW+2, barH+2);
      ctx.fillStyle = '#3a2a1f'; ctx.fillRect(bx, by, barW, barH);
      // 진행 채움 (초록 그라데이션 흉내)
      ctx.fillStyle = '#2e7d32'; ctx.fillRect(bx, by, Math.round(barW*prog), barH);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(bx, by, Math.round(barW*prog), 1);
      // 청소 표시 텍스트
      ctx.fillStyle = '#ffe9c4'; ctx.font='bold 6px Arial'; ctx.textAlign='center';
      ctx.fillText('청소중', c.x, by-1);
    }
    // 쓰레기 위에 빛나는 반짝임 효과
    const target = c.targetIdx>=0 ? garbages[c.targetIdx] : null;
    if (target){
      const t = (performance.now()/200)%(Math.PI*2);
      const op = 0.3 + 0.3*Math.sin(t);
      ctx.fillStyle = `rgba(255,232,150,${op.toFixed(2)})`;
      ctx.beginPath(); ctx.arc(target.x, target.y, 10+2*Math.sin(t), 0, Math.PI*2); ctx.fill();
    }
  }
}
// 평판 효과 — 0이면 70%, 50에서 95%, 100에서 120% (높은 평판은 보너스, 낮아도 완전히 죽진 않음)
function repMul(){ return 0.7 + 0.5 * Math.max(0,Math.min(100,(G.reputation==null?0:G.reputation)))/100; }
// 평판 변동
function changeRep(d){ G.reputation = Math.max(0, Math.min(100, (G.reputation||0)+d)); }

// 손님 리뷰 시스템 — 최근 80개 보관
const reviews = [];
function addReview(c, msg, mood){
  reviews.unshift({ msg, mood, name:(c&&c.ps)||'손님', t:Date.now() });
  while (reviews.length>80) reviews.pop();
  if (curPanel==='review') renderReviewPanel();
}
const REV_BUY    = ['가격 좋네요! 잘 골랐어요','자주 올게요','이 가격이면 합리적이네','대만족!'];
const REV_BUY_HI = ['이 카드 너무 마음에 들어요','득템한 기분이에요','희귀템 발견~'];
const REV_PRICE  = ['가격이 좀 비싸네요..','너무 비싸서 다음에 살게요','이 가격은 부담스럽네요','조금만 더 싸면 살텐데'];
const REV_OUT    = ['재고가 다 떨어졌네요','품절이라 그냥 가요','다음엔 미리 채워두세요'];
const REV_QUEUE  = ['줄이 너무 길어요','대기가 길어서 그냥 갑니다','계산대를 늘려야 할듯'];
const REV_DIRTY  = ['매장이 좀 더럽네요','청소 좀 해야겠어요','먼지가 많은데..'];
const REV_CLEAN  = ['매장이 깔끔해요','정돈이 잘 돼있네요'];
const REV_CHEAP  = ['가격이 정말 저렴해요!','득템 찬스!','이 가격은 못 참지'];
// ── 본사 점검 직원 (OLIVIA / WILLIAM / MIA) — 무작위 등장 ──
let inspectorTimer = 180000 + Math.random()*180000;   // 3~6분 후 첫 점검
function inspectorActive(){ return customers.some(c=>c.type==='inspector'); }
function spawnInspector(){
  if (inspectorActive()) return;
  const name = INSPECTORS[Math.floor(Math.random()*INSPECTORS.length)];
  const e = doorEntry();
  customers.push({
    x:e.x, y:e.y, tx:e.tx, ty:e.ty, atDoor:false,
    dest: randWanderPoint(),
    shelfIdx:-1, ps:name,
    state:'enter', flip:false, frame:0, animT:0, waitT:0, carry:false, moving:true,
    type:'inspector', wanders:4, bubble:null, qi:-1, room:'main',
  });
  notice(`본사 ${name} 점검 시작 — 매장 상태를 둘러봅니다`);
  sfxInspect();
}
function doInspectorEval(c){
  if (typeof G.reputation!=='number') G.reputation=100;
  if (typeof G.dirtLevel!=='number')  G.dirtLevel=0;
  const outOfStock = shelves.filter(s=>G.level>=s.unlockLv && s.stock<=0).length;
  const dirt = G.dirtLevel;
  const dirtPenalty = Math.max(0, Math.floor((dirt-30)/10))*2;
  const penalty = outOfStock*3 + dirtPenalty;
  if (penalty>0){
    changeRep(-penalty);
    setBubble(c, '관리가 필요하네요..');
    addReview(c, `[본사 점검] 품절 ${outOfStock}곳, 청결 ${Math.max(0,Math.round(100-dirt))}점 — 평판 -${penalty}`, 'bad');
    notice(`점검 결과: 평판 -${penalty} (품절 ${outOfStock}곳, 청결 ${Math.max(0,Math.round(100-dirt))}점)`);
  } else {
    changeRep(5);
    setBubble(c, '훌륭한 매장이군요!');
    addReview(c, '[본사 점검] 매장 상태 양호 — 평판 +5', 'good');
    notice('점검 통과! 평판 +5');
  }
  updateHUD(); saveGame();
}
// ── AD 보상 버튼 — 일정시간마다 등장 ──
let surgeUntil = 0;
function surgeOn(){ return performance.now() < surgeUntil; }
function makeAdRewards(){
  return [
    { id:'buff',  cd:630000, next:150000, ready:false },
    { id:'gem',   cd:900000, next:255000, ready:false },
    { id:'money', cd:450000, next:83000,  ready:false },
  ];
}
const adRewardsByRoom = { main: makeAdRewards(), annex: makeAdRewards() };
function curAdRewards(){ return adRewardsByRoom[G.currentRoom==='annex' ? 'annex' : 'main']; }
// 하위 호환 (기존 코드 일부가 참조)
const adRewards = adRewardsByRoom.main;
// 버튼 길게 누르기 — 누르고 있으면 연속 실행
let holdIv=null, holdTo=null;
function startHold(fn){
  stopHold(); fn();
  holdTo=setTimeout(()=>{ holdIv=setInterval(fn,80); }, 340);
}
function stopHold(){
  if (holdTo) clearTimeout(holdTo);
  if (holdIv) clearInterval(holdIv);
  holdTo=holdIv=null;
}

const BROWSE_LINES = ['구경 중~','우와 많다!','예쁜 카드다','뭐 살까~','이것저것 보는 중','음~ 멋지다'];
const REJECT_LINES = ['좀 비싸네..','이 가격엔 음..','다음에 살까','너무 비싸!','지갑이 가벼워..'];
const BUY_LINES    = ['이거 살래!','득템 찬스!','이건 사야지!','완전 좋아!'];
const OPEN_LINES   = ['이얏호! 좋은 카드다!','대박! 레어 떴어!','오예~ 신난다!','이거 갖고 싶었는데!','운수대통이야!','우와아 최고야!'];
function rndOf(a){ return a[Math.floor(Math.random()*a.length)]; }
function setBubble(c,t){ c.bubble = { text:t, t:2600 }; }

// 레벨이 오를수록 손님들의 권장가 인식도 함께 상승 — 후반에 비싸게 받아도 잘 팔리도록
function effectiveSellPrice(p){
  return Math.round(p.sellPrice * (1 + Math.max(0, G.level-1)*0.12));
}
// 레벨에 따라 재고 구매가도 상승 (판매보다 살짝 천천히 — 마진은 점점 커짐)
function effectiveBuyPrice(p){
  return Math.round(p.buyPrice * (1 + Math.max(0, G.level-1)*0.10));
}
function buyChance(shelf){
  const p = pack(shelf.packId);
  const ratio = shelf.price / effectiveSellPrice(p);
  return Math.max(0.05, Math.min(0.95, 1.15 - 0.45*ratio));
}

function randWanderPoint(){
  return {
    x: 30 + Math.random()*(CW-90),
    y: FLOOR_Y + 30 + Math.random()*Math.max(40,(FLOOR_BOT-FLOOR_Y-120)),
  };
}

// 문 입장 — 측면 화면 밖에서 출발 → 문 앞 경유점
function doorEntry(){
  const side = Math.random()<0.5 ? -1 : 1;
  return {
    x: side<0 ? -30 : CW+30,
    y: FLOOR_BOT+30,
    tx: DOOR.x+(Math.random()*48-24),
    ty: FLOOR_BOT+30,
  };
}

function customersInRoom(r){ return customers.filter(c=>c.room===r).length; }
function spawnCustomer(){
  // 방마다 독립 cap — 본관·별관 각각 최대 50명
  const cap = surgeOn() ? MAX_CUSTOMERS : Math.min(MAX_CUSTOMERS, Math.round((4 + popularity*46) * repMul()));
  // 어느 방에 스폰할지 결정 (해금된 방 중)
  const rooms = ['main'];
  if (G.annexUnlocked) rooms.push('annex');
  // 두 방 다 가득 차 있으면 스킵
  const roomsAvail = rooms.filter(r=>customersInRoom(r) < cap);
  if (!roomsAvail.length) return;
  const targetRoom = roomsAvail[Math.floor(Math.random()*roomsAvail.length)];
  // 손님이 들어오면 매장이 조금씩 더러워짐
  G.dirtLevel = Math.min(100, (G.dirtLevel||0) + 0.15);
  // 가끔 매장 청결에 대한 리뷰 (10% 확률, 입장 시점) — 청결 보너스 강화
  if (Math.random()<0.10){
    const dirt = G.dirtLevel||0;
    if (dirt>50){ /* 더러움 - 곧 push 될 손님이 작성 */
      setTimeout(()=>{ const lastC=customers[customers.length-1]; if(lastC){ addReview(lastC, rndOf(REV_DIRTY), 'meh'); changeRep(-0.2); } }, 0);
    } else if (dirt<30){
      setTimeout(()=>{ const lastC=customers[customers.length-1]; if(lastC){ addReview(lastC, rndOf(REV_CLEAN), 'good'); changeRep(0.25); } }, 0);
    }
  }

  // 전시 손님 — 본관에만 (전시 케이스는 본관 카운터에 있음). 25% 확률.
  if (targetRoom==='main'){
    const scAvail = showcaseSlots.filter(s=>s&&s.cardId&&(G.collection[s.cardId]||0)>0);
    if (scAvail.length>0 && Math.random()<0.25){
      const ref = scAvail[Math.floor(Math.random()*scAvail.length)];
      const e = doorEntry();
      customers.push({
        x:e.x, y:e.y, tx:e.tx, ty:e.ty, atDoor:false,
        dest:{ x:190+Math.random()*Math.max(0,CW-280), y:FLOOR_Y+14 },
        shelfIdx:-1, ps:CHAR_NAMES[Math.floor(Math.random()*CHAR_NAMES.length)],
        state:'enter', flip:false, frame:0, animT:0, waitT:0, carry:false, moving:true,
        type:'showcase_shopper', wanders:0, bubble:null, qi:-1, showcaseRef:ref, room:'main',
      });
      return;
    }
  }

  // 별관 — 카드 배틀 손님 우선 (빈 좌석이 있으면 70% 확률로 배틀 선택)
  if (targetRoom==='annex'){
    const bt = findOpenBattleTable();
    if (bt && Math.random()<0.7){
      const seatIdx = bt.seats[0] ? 1 : 0;
      const seatPos = battleSeatPos(bt, seatIdx);
      const e = doorEntry();
      const c = {
        x:e.x, y:e.y, tx:e.tx, ty:e.ty, atDoor:false,
        dest:{ x: seatPos.x, y: seatPos.y },
        shelfIdx:-1, ps:CHAR_NAMES[Math.floor(Math.random()*CHAR_NAMES.length)],
        state:'enter', flip:false, frame:0, animT:0, waitT:0, carry:false, moving:true,
        type:'battler', wanders:0, bubble:null, qi:-1, room:'annex',
        battleTableId: bt.id, battleSeatIdx: seatIdx,
      };
      customers.push(c);
      bt.seats[seatIdx] = c;
      const randCard = CARDS[Math.floor(Math.random()*CARDS.length)];
      if (seatIdx===0) bt.card0 = randCard; else bt.card1 = randCard;
      const filled = bt.seats.filter(Boolean).length;
      if (filled===1) bt.state = 'waiting';
      else if (filled===2) bt.state = 'waiting';
      return;
    }
    // 빈 좌석 없으면 — 큐에 자리 있는 테이블 골라 줄서기 (65% 확률)
    if (!bt){
      const qt = findQueueableTable();
      if (qt && Math.random()<0.65){
        const queueIdx = qt.queue.length;
        const qPos = battleTableQueuePos(qt, queueIdx);
        const e = doorEntry();
        const c = {
          x:e.x, y:e.y, tx:e.tx, ty:e.ty, atDoor:false,
          dest: qPos,
          shelfIdx:-1, ps:CHAR_NAMES[Math.floor(Math.random()*CHAR_NAMES.length)],
          state:'enter', flip:false, frame:0, animT:0, waitT:0, carry:false, moving:true,
          type:'battle_queuer', wanders:0, bubble:null, qi:-1, room:'annex',
          battleTableId: qt.id,
        };
        customers.push(c);
        qt.queue.push(c);
        if (Math.random()<0.5) setBubble(c, rndOf(['기다릴게요','줄 서는 중..','빨리 빠졌으면~']));
        return;
      }
    }
  }

  // targetRoom의 해금된 진열대만
  const unlocked = shelves.map((s,i)=>({s,i})).filter(({s})=> G.level>=s.unlockLv && s.room===targetRoom);
  if (!unlocked.length) return;
  const inStock = unlocked.filter(({s})=>s.stock>0);
  // 재고 있는 곳 우선(85%), 가끔 품절 진열대도 방문 — 품절이면 둘러보고 그냥 나감
  let chosen;
  if (inStock.length && Math.random()<0.85) chosen = inStock[(Math.random()*inStock.length)|0];
  else chosen = unlocked[(Math.random()*unlocked.length)|0];
  const { i } = chosen;
  const type = Math.random()<0.34 ? 'browser' : 'shopper';
  // 둘러보기 횟수 — 구경 손님이 매장을 더 많이 돌아다님
  const wanders = type==='browser'
    ? 1 + Math.floor(Math.random()*3)     // 1~3
    : Math.floor(Math.random()*2);        // 0~1
  const first = wanders>0 ? randWanderPoint() : BROWSE[i];
  const e = doorEntry();
  customers.push({
    x:e.x, y:e.y, tx:e.tx, ty:e.ty, atDoor:false,
    dest:{ x:first.x+(Math.random()*20-10), y:first.y+(Math.random()*16-8) },
    shelfIdx: i, ps: CHAR_NAMES[Math.floor(Math.random()*CHAR_NAMES.length)],
    state:'enter', flip:false, frame:0, animT:0, waitT:0, carry:false, moving:true,
    type, wanders, bubble:null, qi:-1, room:targetRoom,
  });
}

// 해금된 팩 등급에 따른 최대 동시 구매 장수
function maxBulkBuy(){
  if (G.level>=10) return 15;   // 레전드 해금
  if (G.level>=6)  return 10;   // 에픽 해금
  if (G.level>=3)  return 5;    // 레어 해금
  return 3;                     // 베이직만
}
function rollBuyQty(){
  const max = maxBulkBuy();
  const r = Math.random();
  let q;
  if (r<0.60)      q = 1;
  else if (r<0.85) q = 2 + Math.floor(Math.random()*2);   // 2~3
  else if (r<0.95) q = 4 + Math.floor(Math.random()*3);   // 4~6
  else             q = 7 + Math.floor(Math.random()*9);   // 7~15
  return Math.min(max, q);
}

// 손님이 구경을 끝내고 구매 여부 결정
function decide(c){
  const shelf = shelves[c.shelfIdx];
  let buy = false;
  if (c.type==='shopper' && shelf.stock>0) buy = Math.random() < buyChance(shelf);
  if (buy){
    const q = qlineFor(c.room);
    if (q.length < MAX_QUEUE){
      // 해금된 팩 등급에 따라 최대 구매 장수 차등 (베이직→3 / 레어→5 / 에픽→10 / 레전드→15)
      let qty = rollBuyQty();
      qty = Math.min(qty, shelf.stock);
      shelf.stock -= qty;
      c.qty = qty;
      c.carry = true;
      c.qi = q.length; q.push(c);
      c.state = 'to_queue';
      c.tx = QSLOT[c.qi].x; c.ty = QSLOT[c.qi].y;
      setBubble(c, (qty>1?'＋'+qty+'장! ':'')+rndOf(BUY_LINES));
    } else {
      c.state='reject'; c.waitT=0; c.carry=false;
      setBubble(c, '줄이 너무 길어..');
      addReview(c, rndOf(REV_QUEUE), 'bad');
      changeRep(-0.15);
    }
  } else {
    c.state='reject'; c.waitT=0; c.carry=shelf.stock>0;
    if (shelf.stock<=0){
      setBubble(c, '품절이네ㅠ');
      addReview(c, rndOf(REV_OUT), 'bad');
      changeRep(-0.2);
    } else if (c.type==='browser'){
      setBubble(c, rndOf(BROWSE_LINES));
    } else {
      setBubble(c, rndOf(REJECT_LINES));
      addReview(c, rndOf(REV_PRICE), 'bad');
      changeRep(-0.1);
    }
  }
}

function decideShowcase(c){
  const sc = c.showcaseRef;
  if (!sc || !showcaseSlots.includes(sc) || (G.collection[sc.cardId]||0)<=0){
    c.state='reject'; c.waitT=0;
    setBubble(c, sc&&(G.collection[sc.cardId]||0)<=0 ? '품절이네ㅠ' : '어, 없어졌네..');
    return;
  }
  const card  = CARDS.find(x=>x.id===sc.cardId);
  const ratio = sc.price / cardBaseValue(card);
  const prob  = Math.max(0.01, Math.min(0.90, 1.15-0.45*ratio));
  if (Math.random()<prob) doShowcaseSale(c, sc);
  else { c.state='reject'; c.waitT=0; setBubble(c, rndOf(SHOWCASE_REJECT_LINES)); }
}

function doShowcaseSale(c, sc){
  G.collection[sc.cardId]--;
  const earned = Math.floor(sc.price * starIncome * prestigeMulti);
  addReview(c, rndOf(REV_BUY_HI), 'good');
  changeRep(0.7);
  G.money+=earned; G.stars++; G.totalSales++; incomeAccum+=earned;
  if (G.totalSales % gemSaleThreshold() === 0){
    const gg=dexGemX2?2:1; G.gems+=gg; G.gemsEarnedTotal=(G.gemsEarnedTotal||0)+gg;
    floatTexts.push({x:c.x+CHAR_DW/2, y:c.y-14, text:'+'+gg+' 다이아', t:0, color:'#c9a8f5'});
  }
  const card=CARDS.find(x=>x.id===sc.cardId);
  addXP({legendary:140,epic:55,rare:20,common:8}[card?card.rarity:'common']||10);
  floatTexts.push({x:c.x+CHAR_DW/2, y:c.y, text:'+'+fmt(earned), t:0, color:'#fde047'});
  setBubble(c, rndOf(SHOWCASE_BUY_LINES));
  sfxSale(); boostPopularity(0.013);
  c.carry=true; c.bought=true; c.state='reject'; c.waitT=0;
  updateHUD(); checkGoals();
  if (autoRestock) doAutoRestock();
}

// 줄이 한 칸 줄면 모두 앞으로 (방별 큐)
function advanceQueue(room){
  const q = qlineFor(room);
  for (let i=0;i<q.length;i++){
    const c = q[i];
    c.qi = i;
    c.tx = QSLOT[i].x; c.ty = QSLOT[i].y;
    if (c.state==='in_queue') c.state='to_queue';
  }
}

function updateCustomers(dt){
  const spd = 72 * speedMulti * starSpeed;
  // 인기도 자연 감소 — 가만히 둬도 하한 유지 (프레스티지 트리로 하한 추가)
  const popFloorBonus = G.prestigeUpg ? (G.prestigeUpg.popFloor||0)*0.05 : 0;
  popularity = Math.max(0.2 + popFloorBonus, popularity - 0.0000058*dt);
  if (clerkBubble){ clerkBubble.t -= dt; if (clerkBubble.t<=0) clerkBubble=null; }
  for (let i = customers.length-1; i >= 0; i--){
    const c = customers[i];
    c.animT += dt;
    if (c.animT>170){ c.frame^=1; c.animT=0; }
    if (c.bubble){ c.bubble.t -= dt; if (c.bubble.t<=0) c.bubble=null; }

    if (c.state==='enter' || c.state==='to_queue' || c.state==='leave'){
      const dx=c.tx-c.x, dy=c.ty-c.y, d=Math.hypot(dx,dy);
      if (d<3){
        c.x=c.tx; c.y=c.ty; c.moving=false;
        if (c.state==='enter'){
          if (!c.atDoor){
            // 문 앞 경유점 도착 → 매장 안으로 이동
            c.atDoor=true; c.tx=c.dest.x; c.ty=c.dest.y;
          }
          else if (c.wanders>0){ c.state='wander'; c.waitT=0; }
          else if (c.type==='showcase_shopper'){
            c.state='showcase_browse'; c.waitT=0;
            if (Math.random()<0.5) setBubble(c, rndOf(SHOWCASE_BROWSE_LINES));
          }
          else if (c.type==='battler'){
            // 배틀 좌석 도착
            const bt = battleTables[c.battleTableId];
            if (!bt || bt.seats[c.battleSeatIdx] !== c){
              c.state='leave'; c.leaving2=false;
              c.tx=DOOR.x+(Math.random()*48-24); c.ty=FLOOR_BOT+30;
            } else {
              const otherIdx = c.battleSeatIdx === 0 ? 1 : 0;
              const other = bt.seats[otherIdx];
              if (other && other.state === 'waiting_opponent'){
                // 두 명 모두 도착 — 배틀 시작
                bt.state = 'battling'; bt.gauge = 0;
                c.state = 'battling'; c.waitT = 0;
                other.state = 'battling'; other.waitT = 0;
                if (Math.random()<0.5) setBubble(c, rndOf(['카드 배틀 ㄱㄱ!','내가 이긴다!','준비됐어!','한판 붙자!']));
                if (Math.random()<0.4) setBubble(other, rndOf(['덤벼라!','시작!','내가 이긴다','이번엔 진짜!']));
              } else {
                c.state='waiting_opponent'; c.waitT=0;
                if (Math.random()<0.5) setBubble(c, rndOf(['상대 어딨지..','누구 한판?','대결 상대 구함','심심하다..']));
              }
            }
          }
          else if (c.type==='battle_queuer'){
            c.state='battle_wait'; c.waitT=0;
          }
          else { c.state='browse'; c.waitT=0;
                 if (Math.random()<0.4) setBubble(c, rndOf(BROWSE_LINES)); }
        } else if (c.state==='to_queue'){
          c.state='in_queue';
        } else {
          // leave 도착
          if (!c.leaving2){
            if (c.bought && Math.random()<0.35){
              // 일부 손님만 — 문 앞에서 카드팩 개봉 + 환호 점프
              c.bought=false; c.carry=true;
              c.state='celebrate'; c.waitT=0; c.jy=0;
              setBubble(c, rndOf(OPEN_LINES));
              floatTexts.push({ x:c.x+CHAR_DW/2-6, y:c.y-6, text:'✨', t:0, color:'#fde047' });
              floatTexts.push({ x:c.x+CHAR_DW/2+8, y:c.y-2, text:'★',  t:0, color:'#fbbf24' });
            } else {
              c.leaving2=true;
              c.tx = (Math.random()<0.5?-30:CW+30);
              c.ty = FLOOR_BOT+30;
            }
          } else { customers.splice(i,1); continue; }
        }
      } else {
        c.x += dx/d*spd*dt/1000;
        c.y += dy/d*spd*dt/1000;
        if (Math.abs(dx)>2) c.flip = dx<0;
        c.moving = true;
      }
    } else if (c.state==='wander'){
      // 매장을 잠깐 둘러봄
      c.moving=false; c.waitT+=dt;
      const wait = c.type==='inspector' ? 1200+Math.random()*600 : 700+Math.random()*400;
      if (c.waitT>wait){
        c.wanders--;
        if (c.wanders>0){
          const nxt = randWanderPoint();
          c.tx = nxt.x+(Math.random()*20-10);
          c.ty = nxt.y+(Math.random()*16-8);
          c.state='enter';
          if (c.type==='inspector' && Math.random()<0.4) setBubble(c, rndOf(['음... 진열대 점검중','매장 정돈 상태는?','품절은 없는지...','청결도 살펴봅니다']));
          else if (Math.random()<0.5) setBubble(c, rndOf(BROWSE_LINES));
        } else if (c.type==='inspector'){
          // 검사 종료 — 평가 후 문으로 퇴장
          doInspectorEval(c);
          c.state='leave'; c.leaving2=false;
          c.tx=DOOR.x+(Math.random()*48-24); c.ty=FLOOR_BOT+30;
        } else {
          const nxt = BROWSE[c.shelfIdx];
          c.tx = nxt.x+(Math.random()*20-10);
          c.ty = nxt.y+(Math.random()*16-8);
          c.state='enter';
          if (Math.random()<0.5) setBubble(c, rndOf(BROWSE_LINES));
        }
      }
    } else if (c.state==='showcase_browse'){
      c.moving=false; c.waitT+=dt;
      if (c.waitT>1800) decideShowcase(c);
    } else if (c.state==='browse'){
      c.moving=false; c.waitT+=dt;
      if (c.waitT>1500) decide(c);
    } else if (c.state==='reject'){
      c.moving=false; c.waitT+=dt;
      if (c.waitT>450 && !c.bought) c.carry=false;     // 안 산 손님은 카드 내려놓음
      if (c.waitT>1700){ c.state='leave'; c.leaving2=false; c.tx=DOOR.x+(Math.random()*48-24); c.ty=FLOOR_BOT+30; }
    } else if (c.state==='celebrate'){
      // 카드팩 개봉 — 통통 점프하며 환호
      c.moving=false; c.waitT+=dt;
      c.jy = -Math.abs(Math.sin(c.waitT*0.0085))*12;
      if (c.waitT>1700){
        c.jy=0;
        c.state='leave'; c.leaving2=true;
        c.tx=(Math.random()<0.5?-30:CW+30); c.ty=FLOOR_BOT+30;
      }
    } else if (c.state==='waiting_opponent'){
      c.moving=false; c.waitT+=dt;
      // 좌석에 두번째 손님이 도착하면 배틀 시작
      const bt = battleTables[c.battleTableId];
      if (bt && bt.state==='battling'){
        c.state='battling'; c.waitT=0;
        if (Math.random()<0.4) setBubble(c, rndOf(['덤벼라!','시작!','내가 이긴다','이번엔 진짜!']));
      }
      // 너무 오래 기다리면 떠남
      else if (c.waitT > 25000){
        if (bt && bt.seats[c.battleSeatIdx]===c){
          bt.seats[c.battleSeatIdx] = null;
          const left = bt.seats.filter(Boolean).length;
          bt.state = left===0 ? 'empty' : 'waiting';
        }
        setBubble(c, '상대가 안오네..');
        c.state='leave'; c.leaving2=false;
        c.tx=DOOR.x+(Math.random()*48-24); c.ty=FLOOR_BOT+30;
        if (bt) assignFromTableQueue(bt);
      }
    } else if (c.state==='battle_wait'){
      c.moving=false; c.waitT+=dt;
      if (c.waitT > 28000){
        // 너무 오래 기다리면 큐에서 이탈
        const bt = battleTables[c.battleTableId];
        if (bt){
          const qi = bt.queue.indexOf(c);
          if (qi>=0){
            bt.queue.splice(qi, 1);
            bt.queue.forEach((qc, i) => {
              if (qc.state === 'battle_wait'){
                const np = battleTableQueuePos(bt, i);
                qc.tx = np.x; qc.ty = np.y; qc.atDoor = true;
                qc.state = 'enter';
              }
            });
          }
        }
        setBubble(c, '못 기다리겠어..'); c.state='leave'; c.leaving2=false;
        c.tx=DOOR.x+(Math.random()*48-24); c.ty=FLOOR_BOT+30;
      }
    } else if (c.state==='battling'){
      c.moving=false; c.waitT+=dt;
      // 가끔 채팅 말풍선
      if (c.waitT>0 && Math.random()<0.0008*dt){
        setBubble(c, rndOf(['오..!','나이스 패','이게 내 카드','체크메이트?','받아라!']));
      }
      const bt = battleTables[c.battleTableId];
      if (!bt){ c.state='leave'; c.leaving2=false; c.tx=DOOR.x; c.ty=FLOOR_BOT+30; continue; }
      // 첫 번째 손님이 게이지 진행을 책임 (중복 가산 방지)
      if (bt.seats[0]===c && bt.state==='battling'){
        bt.gauge += dt * battleGaugeMul();
        if (bt.gauge >= bt.duration){
          // 배틀 완료 — 매출 정산
          const earned = battleReward();
          G.money += earned; G.totalSales++; incomeAccum += earned;
          if (G.totalSales % gemSaleThreshold() === 0){
            const gg=dexGemX2?2:1; G.gems+=gg; G.gemsEarnedTotal=(G.gemsEarnedTotal||0)+gg;
          }
          floatTexts.push({x: bt.x+bt.w/2, y: bt.y-6,  text:'+'+fmt(earned), t:0, color:'#fde047', room:'annex'});
          floatTexts.push({x: bt.x+bt.w/2, y: bt.y-18, text:'배틀 완료!',     t:0, color:'#22d3ee', room:'annex'});
          sfxSale && sfxSale(); boostPopularity(0.018);
          // 두 손님 모두 떠나기
          bt.seats.forEach(p=>{
            if (!p) return;
            p.state='leave'; p.leaving2=false;
            p.tx=DOOR.x+(Math.random()*48-24); p.ty=FLOOR_BOT+30;
            setBubble(p, rndOf(['재밌었다!','한판 더?','즐거웠어~','잘했어!']));
          });
          bt.seats[0]=null; bt.seats[1]=null;
          bt.state='empty'; bt.gauge=0; bt.card0=null; bt.card1=null;
          // 큐에서 한 명씩 배치 (좌석 2자리 모두)
          assignFromTableQueue(bt);
          assignFromTableQueue(bt);
          addXP(35); updateHUD(); checkGoals(); saveGame();
        }
      }
    } else if (c.state==='in_queue'){
      c.moving=false;
      if (c.qi===0){
        c.state='checkout'; c.waitT=0;
        clerkBubble={ text:'계산 중..', t:99999 };
      }
    } else if (c.state==='checkout'){
      c.moving=false; c.waitT+=dt;
      if (c.waitT>checkoutTime*dexCheckoutMul){
        doSale(c);
        qlineFor(c.room).shift(); advanceQueue(c.room);
        c.carry=true; c.bought=true; c.qi=-1;
        c.state='leave'; c.leaving2=false; c.tx=DOOR.x+(Math.random()*48-24); c.ty=FLOOR_BOT+30;
        clerkBubble={ text:'감사합니다!', t:1300 };
      }
    }
  }
}

function gemSaleThreshold(){
  if (G.level >= 31) return 100;
  if (G.level >= 21) return 50;
  if (G.level >= 11) return 20;
  return 10;
}

function doSale(c){
  const shelf = shelves[c.shelfIdx];
  const qty = c.qty || 1;
  const earned = salePrice(shelf) * qty;
  // 리뷰 — 가격이 권장가보다 낮으면 '저렴해요' 칭찬, 평소 가격이면 일반 칭찬
  const cheap = shelf.price < pack(shelf.packId).sellPrice;
  addReview(c, rndOf(cheap?REV_CHEAP:REV_BUY), 'good');
  changeRep(0.5 * qty);
  G.money+=earned; G.stars+=qty; incomeAccum+=earned;
  // 다이아 — 레벨에 따라 기준 판매 수 증가
  const oldSales=G.totalSales; G.totalSales += qty;
  const th = gemSaleThreshold();
  const gemTriggers = Math.floor(G.totalSales/th) - Math.floor(oldSales/th);
  if (gemTriggers>0){
    let gg=(dexGemX2?2:1)*gemTriggers;
    if (G.prestigeUpg && G.prestigeUpg.gemBonus){ gg = Math.max(gg, Math.ceil(gg * (1 + G.prestigeUpg.gemBonus*0.1))); }
    G.gems+=gg; G.gemsEarnedTotal=(G.gemsEarnedTotal||0)+gg;
    floatTexts.push({ x:c.x+CHAR_DW/2, y:c.y-14, text:'+'+gg+' 다이아', t:0, color:'#c9a8f5' });
  }
  addXP(pack(shelf.packId).xp * qty);
  floatTexts.push({ x:c.x+CHAR_DW/2, y:c.y, text:'+'+fmt(earned)+(qty>1?'  ×'+qty:''), t:0, color:'#4ade80' });
  sfxSale(); boostPopularity(0.013*qty);
  updateHUD(); checkGoals();
  if (autoRestock) doAutoRestock();
  checkSoldOutNotify();
}

// ══════════════════════════════════════════════════════════
//  RENDERING
// ══════════════════════════════════════════════════════════
let canvas, ctx;
const woodImg = new Image();
let woodPattern = null;

function rr(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

function drawBubble(cx, topY, text){
  ctx.font='8px Arial';
  const tw = ctx.measureText(text).width;
  const w = tw+12, h=15, x=cx-w/2, y=topY-h-6;
  ctx.fillStyle='rgba(0,0,0,0.22)'; rr(x+1,y+2,w,h,5); ctx.fill();
  ctx.fillStyle='#fffaf0'; rr(x,y,w,h,5); ctx.fill();
  ctx.strokeStyle=CL.woodDk; ctx.lineWidth=1.4; rr(x,y,w,h,5); ctx.stroke();
  ctx.fillStyle='#fffaf0';
  ctx.beginPath(); ctx.moveTo(cx-3,y+h-1); ctx.lineTo(cx+4,y+h-1); ctx.lineTo(cx,y+h+5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=CL.woodDk;
  ctx.beginPath(); ctx.moveTo(cx-3,y+h-1); ctx.lineTo(cx,y+h+5); ctx.lineTo(cx+4,y+h-1); ctx.stroke();
  ctx.fillStyle=CL.textDk; ctx.textAlign='center';
  ctx.fillText(text, cx, y+10);
}

// ── 계산대 기기 ──
function devRegister(x, by){
  const w=27, h=21, y=by-h;
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(x-1,by-2,w+3,3);
  ctx.fillStyle='#3a3a46'; rr(x+4,y-11,18,12,2); ctx.fill();
  ctx.fillStyle='#0a2a18'; ctx.fillRect(x+6,y-9,14,8);
  ctx.fillStyle='#5cff9c'; ctx.font='bold 5px monospace'; ctx.textAlign='center';
  ctx.fillText(fmt(G.money), x+13, y-3);
  ctx.fillStyle='#2c2c38'; rr(x,y,w,h,2); ctx.fill();
  ctx.fillStyle='#3c3c4a'; ctx.fillRect(x+1,y+1,w-2,2);
  ctx.fillStyle='#c4c4d0';
  for(let r=0;r<3;r++) for(let c=0;c<4;c++) ctx.fillRect(x+3+c*4,y+5+r*4,3,3);
  ctx.fillStyle='#e0503a'; ctx.fillRect(x+w-5,y+5,3,7);
  ctx.fillStyle='#16161e'; ctx.fillRect(x,y+h-5,w,2);
  ctx.fillStyle=CL.amber; ctx.fillRect(x+w/2-2,y+h-4,4,1);
}
function devPOS(x, by){
  const w=14, h=17, y=by-h;
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(x-1,by-2,w+2,3);
  ctx.fillStyle='#54545f'; rr(x,y,w,h,2); ctx.fill();
  ctx.fillStyle='#64646f'; ctx.fillRect(x+1,y+1,w-2,2);
  ctx.fillStyle='#0e3a52'; ctx.fillRect(x+2,y+2,w-4,6);
  ctx.fillStyle='#5cd0ff'; ctx.fillRect(x+3,y+3,w-6,2);
  ctx.fillStyle='#d4d4dc';
  for(let r=0;r<3;r++) for(let c=0;c<3;c++) ctx.fillRect(x+3+c*3,y+10+r*2,2,1.5);
  ctx.fillStyle='#15151c'; ctx.fillRect(x+1,y-2,w-2,2);
}
function devMonitor(x, by){
  const w=32, h=22, y=by-h-6;
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(x+2,by-2,w-4,3);
  ctx.fillStyle='#2a2a32'; ctx.fillRect(x+w/2-3,by-8,6,8);
  ctx.fillStyle='#1c1c24'; rr(x+w/2-8,by-3,16,3,1); ctx.fill();
  ctx.fillStyle='#1a1a22'; rr(x,y,w,h,2); ctx.fill();
  ctx.fillStyle='#1452b0'; ctx.fillRect(x+2,y+2,w-4,h-4);
  ctx.fillStyle='#5b9bf0'; ctx.fillRect(x+4,y+4,w-8,3);
  ctx.fillStyle='#fbbf24'; rr(x+4,y+9,9,6,1); ctx.fill();
  ctx.fillStyle='#22c55e'; rr(x+15,y+9,9,6,1); ctx.fill();
  ctx.fillStyle='#e0e0e8'; ctx.fillRect(x+4,y+17,w-8,2);
  ctx.fillStyle='rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.moveTo(x+2,y+2); ctx.lineTo(x+11,y+2); ctx.lineTo(x+2,y+11); ctx.closePath(); ctx.fill();
}
function devJoystick(x, by){
  const w=17, h=9, y=by-h;
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(x,by-2,w,3);
  ctx.fillStyle='#2c2c38'; rr(x,y,w,h,3); ctx.fill();
  ctx.fillStyle='#3c3c4a'; ctx.fillRect(x+1,y+1,w-2,2);
  ctx.fillStyle='#a0a0ac'; ctx.fillRect(x+w/2-1,y-9,3,10);
  ctx.fillStyle='#e0402c'; ctx.beginPath(); ctx.arc(x+w/2,y-10,5,0,7); ctx.fill();
  ctx.fillStyle='#ff8a6a'; ctx.beginPath(); ctx.arc(x+w/2-1.6,y-11.6,1.8,0,7); ctx.fill();
  ctx.fillStyle=CL.amber; ctx.beginPath(); ctx.arc(x+4,y+5,2,0,7); ctx.fill();
  ctx.fillStyle=CL.teal;  ctx.beginPath(); ctx.arc(x+w-4,y+5,2,0,7); ctx.fill();
}
function devCardHolder(x, by){
  const w=24, h=7, y=by-h;
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(x,by-2,w,3);
  const cols=['#3b82f6','#22c55e','#a855f7','#f59e0b'];
  for(let i=0;i<4;i++){
    const cx=x+3+i*5;
    ctx.fillStyle=cols[i]; rr(cx,y-13,4.5,14,1); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.fillRect(cx,y-13,4.5,2);
  }
  ctx.fillStyle=CL.woodDk; rr(x,y,w,h,2); ctx.fill();
  ctx.fillStyle=CL.wood; ctx.fillRect(x+1,y+1,w-2,2);
}

// 우측 카운터 — 유리 카드 전시장
const RC_RARITY = {legendary:'#f97316',epic:'#a78bfa',rare:'#fbbf24',common:'#94a3b8'};

function devShowcase(x, by, w){
  const h=58, y=by-h;   // 8칸 2행 표시를 위해 높이 확장
  // 그림자
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(x+2,by-2,w-4,3);
  // 투명 아크릴 케이스 외곽
  ctx.fillStyle='rgba(180,208,218,0.55)';
  rr(x,y,w,h,4); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=1.5;
  rr(x,y,w,h,4); ctx.stroke();
  // 라벨 헤더
  ctx.fillStyle=CL.amber; rr(x+4,y+2,w-8,8,2); ctx.fill();
  ctx.fillStyle=CL.textDk; ctx.font='bold 6px Arial'; ctx.textAlign='center';
  ctx.fillText('전시 카드 컬렉션', x+w/2, y+8);

  const gx=x+4, gy=y+11, gw=w-8, gh=h-15;
  // 아크릴 내부 (반투명 그라데이션)
  const ag=ctx.createLinearGradient(0,gy,0,gy+gh);
  ag.addColorStop(0,'rgba(228,244,248,0.55)');
  ag.addColorStop(0.5,'rgba(198,224,232,0.34)');
  ag.addColorStop(1,'rgba(214,235,240,0.5)');
  ctx.fillStyle=ag; ctx.fillRect(gx,gy,gw,gh);

  // 2행 4열로 8칸 표시
  const COLS=4, ROWS=2;
  const slotW = gw/COLS;
  const rowH  = (gh-1)/ROWS;
  const hasListings = showcaseSlots.some(Boolean);

  if (!hasListings) {
    // 빈 상태 — 카드 8장 플레이스홀더
    for (let i=0;i<COLS*ROWS;i++){
      const r=(i/COLS)|0, col=i%COLS;
      const sx=gx+col*slotW, sy=gy+r*rowH;
      const cw3=Math.min(slotW-10,15), ch3=rowH-4;
      const ccx=sx+slotW/2-cw3/2, ccy=sy+1;
      ctx.fillStyle='rgba(255,255,255,0.34)';
      rr(ccx,ccy,cw3,ch3,2); ctx.fill();
      ctx.strokeStyle='rgba(86,116,126,0.6)'; ctx.lineWidth=1;
      ctx.setLineDash([2,2]); rr(ccx,ccy,cw3,ch3,2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(66,96,106,0.7)';
      ctx.font='7px Arial'; ctx.textAlign='center';
      ctx.fillText('+', ccx+cw3/2, ccy+ch3/2+2.6);
    }
    ctx.fillStyle='rgba(56,80,90,0.7)';
    ctx.font='5px Arial'; ctx.textAlign='right';
    ctx.fillText('▼탭하여 관리', x+w-5, y+h-2);
  } else {
    showcaseSlots.forEach((slot, i) => {
      const r=(i/COLS)|0, col=i%COLS;
      const sx = gx + col*slotW;
      const sy = gy + r*rowH;
      const cardW = slotW-4, cardX = sx+2;
      const cardH = rowH-1;
      if (!slot) {
        const cw3=Math.min(cardW,15), ch3=cardH-3;
        const ccx=sx+slotW/2-cw3/2, ccy=sy+1;
        ctx.fillStyle='rgba(255,255,255,0.3)';
        rr(ccx,ccy,cw3,ch3,2); ctx.fill();
        ctx.strokeStyle='rgba(86,116,126,0.55)'; ctx.lineWidth=1;
        ctx.setLineDash([2,2]); rr(ccx,ccy,cw3,ch3,2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='rgba(66,96,106,0.65)';
        ctx.font='6px Arial'; ctx.textAlign='center';
        ctx.fillText('+', ccx+cw3/2, ccy+ch3/2+2);
        return;
      }
      const card = CARDS.find(c=>c.id===slot.cardId);
      const owned = G.collection[slot.cardId]||0;
      if (owned > 0) {
        ctx.fillStyle=RC_RARITY[card.rarity];
        rr(cardX, sy+1, cardW, cardH, 2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.28)';
        ctx.fillRect(cardX+1, sy+1, cardW-2, 2);
        // 미니 몬스터 (프리렌더 스프라이트 축소)
        if (card.spriteCanvas){
          const mh=cardH-7, mw=Math.round(mh*24/28);
          ctx.drawImage(card.spriteCanvas, Math.round(cardX+cardW/2-mw/2), sy+2, mw, mh);
        }
        // 가격 태그
        ctx.fillStyle=CL.amber;
        ctx.fillRect(cardX, sy+cardH-5, cardW, 5);
        ctx.fillStyle=CL.textDk;
        ctx.font='bold 4px Arial'; ctx.textAlign='center';
        ctx.fillText(fmt(slot.price), cardX+cardW/2, sy+cardH-1);
        // 수량
        ctx.fillStyle='rgba(0,0,0,0.6)';
        ctx.fillRect(cardX, sy+1, 10, 6);
        ctx.fillStyle='#fff';
        ctx.font='4px Arial'; ctx.textAlign='left';
        ctx.fillText('x'+owned, cardX+1, sy+5.5);
      } else {
        ctx.fillStyle='rgba(80,20,20,0.9)';
        rr(cardX, sy+1, cardW, cardH, 2); ctx.fill();
        ctx.fillStyle='#ff6b6b';
        ctx.font='bold 4px Arial'; ctx.textAlign='center';
        ctx.fillText('SOLD', cardX+cardW/2, sy+cardH/2);
        ctx.fillText('OUT',  cardX+cardW/2, sy+cardH/2+5);
      }
    });
    ctx.fillStyle='rgba(56,80,90,0.7)';
    ctx.font='5px Arial'; ctx.textAlign='right';
    ctx.fillText('▼탭', x+w-5, y+h-2);
  }
  // 아크릴 광택 (대각선 스트릭)
  ctx.fillStyle='rgba(255,255,255,0.32)';
  ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+13,gy); ctx.lineTo(gx,gy+13); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.moveTo(gx+gw*0.62,gy); ctx.lineTo(gx+gw*0.74,gy);
  ctx.lineTo(gx+gw*0.4,gy+gh); ctx.lineTo(gx+gw*0.28,gy+gh); ctx.closePath(); ctx.fill();
}

// ── 카드 배틀 테이블 (별관) ──
function drawBattleTable(bt){
  const x=bt.x, y=bt.y, w=bt.w, h=bt.h;
  const locked = (bt.unlockLv||1) > G.level;

  if (locked){
    // 잠긴 테이블 — 반투명 테이블
    ctx.save(); ctx.globalAlpha=0.28;
    ctx.fillStyle=CL.woodDk; rr(x, y+h-6, w, 6, 2); ctx.fill();
    ctx.fillStyle=CL.wood;   rr(x, y, w, h-3, 4); ctx.fill();
    ctx.fillStyle='#1d6b3f'; rr(x+4, y+4, w-8, h-12, 3); ctx.fill();
    ctx.restore();
    // 어두운 오버레이
    ctx.fillStyle='rgba(10,6,2,0.62)'; rr(x, y, w, h, 4); ctx.fill();
    // 자물쇠 몸체
    const lx2=x+w/2, ly2=y+h/2-4;
    const bw=10, bh=7;
    ctx.fillStyle='#92400e';
    rr(lx2-bw/2-0.6, ly2-0.6, bw+1.2, bh+1.2, 2.2); ctx.fill();
    ctx.fillStyle='#f59e0b';
    rr(lx2-bw/2, ly2, bw, bh, 2); ctx.fill();
    // 광택
    ctx.fillStyle='rgba(255,255,255,0.22)';
    rr(lx2-bw/2+1, ly2+1, bw-2, 2, 1); ctx.fill();
    // 활 (shackle)
    ctx.beginPath();
    ctx.arc(lx2, ly2+0.5, bw*0.30, Math.PI, 0, false);
    ctx.strokeStyle='#92400e'; ctx.lineWidth=2.6; ctx.stroke();
    ctx.beginPath();
    ctx.arc(lx2, ly2+0.5, bw*0.30, Math.PI, 0, false);
    ctx.strokeStyle='#fbbf24'; ctx.lineWidth=1.8; ctx.stroke();
    // 열쇠 구멍
    ctx.fillStyle='#7c2d12';
    ctx.beginPath(); ctx.arc(lx2, ly2+bh*0.36, 1.4, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(lx2-0.8, ly2+bh*0.36, 1.6, 2.6);
    // 레벨 텍스트
    ctx.font='bold 5.5px Arial'; ctx.textAlign='center';
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=2;
    ctx.strokeText('Lv '+bt.unlockLv, lx2, ly2+bh+8);
    ctx.fillStyle='#fef3c7';
    ctx.fillText('Lv '+bt.unlockLv, lx2, ly2+bh+8);
    return;
  }

  // 테이블 다리 그림자
  ctx.fillStyle='rgba(0,0,0,0.18)';
  ctx.fillRect(x+2, y+h, w-4, 4);
  // 테이블 상판
  ctx.fillStyle=CL.woodDk; rr(x, y+h-6, w, 6, 2); ctx.fill();
  ctx.fillStyle=CL.wood;   rr(x, y, w, h-3, 4); ctx.fill();
  ctx.fillStyle=CL.woodLt; rr(x+2, y+2, w-4, 3, 2); ctx.fill();
  // 카드 매트(녹색 펠트)
  ctx.fillStyle='#1d6b3f'; rr(x+4, y+4, w-8, h-12, 3); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.08)'; rr(x+5, y+5, w-10, 2, 1); ctx.fill();

  // 카드 슬롯 배경 (실제 스프라이트가 없을 때 폴백)
  const cw=9, ch=12;
  const lx=x+7, rx=x+w-16, cy=y+6;

  function drawCardSlot(cx2, card){
    ctx.fillStyle='#f4e4c1'; rr(cx2, cy, cw, ch, 1.5); ctx.fill();
    if (card && card.spriteCanvas){
      ctx.save(); ctx.imageSmoothingEnabled=false;
      ctx.drawImage(card.spriteCanvas, cx2, cy, cw, ch);
      ctx.restore();
    } else {
      ctx.fillStyle='#bb3b2d'; ctx.fillRect(cx2+1,cy+1,cw-2,ch-2);
    }
  }
  drawCardSlot(lx, bt.card0);
  drawCardSlot(rx, bt.card1);

  // 의자 표시
  ctx.fillStyle=CL.woodDk;
  ctx.fillRect(x-4, y+h-8, 4, 8);
  ctx.fillRect(x+w, y+h-8, 4, 8);
  // 게이지 — 2명일 때만
  if (bt.state==='battling'){
    const gw=w-6, gh=4, gx=x+3, gy=y-9;
    ctx.fillStyle='rgba(0,0,0,0.55)'; rr(gx-1,gy-1,gw+2,gh+2,2); ctx.fill();
    ctx.fillStyle='#1a1a1a'; rr(gx,gy,gw,gh,1.5); ctx.fill();
    const pct = Math.min(1, bt.gauge/bt.duration);
    ctx.fillStyle='#ef4444'; rr(gx, gy, gw*pct, gh, 1.5); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 5px Arial'; ctx.textAlign='center';
    ctx.fillText('카드배틀중', x+w/2, gy-2);
  } else if (bt.state==='waiting'){
    ctx.fillStyle='#fbbf24'; ctx.font='bold 5px Arial'; ctx.textAlign='center';
    ctx.fillText('상대 기다리는중', x+w/2, y-3);
  }
}

// 배틀 테이블 좌석 좌표
function battleSeatPos(bt, seatIdx){
  // seatIdx 0 = 좌측 의자, 1 = 우측 의자
  if (seatIdx===0) return { x: bt.x - 10, y: bt.y + bt.h - CHAR_DH + 4 };
  return                  { x: bt.x + bt.w - 4, y: bt.y + bt.h - CHAR_DH + 4 };
}

// 빈 좌석이 있는 배틀 테이블 찾기 (1명 대기 중인 테이블 우선)
function findOpenBattleTable(){
  let waiting=null, empty=null;
  for (const bt of battleTables){
    if ((bt.unlockLv||1) > G.level) continue;
    // 실제로 좌석에 빈 자리가 있어야 함 (이미 두 명이 배정된 테이블 제외)
    const hasEmpty = !bt.seats[0] || !bt.seats[1];
    if (!hasEmpty) continue;
    if (bt.state==='waiting' && !waiting) waiting=bt;
    else if (bt.state==='empty' && !empty) empty=bt;
  }
  return waiting || empty;
}

// 배틀 완료 — 매출 계산
function battleGaugeMul(){
  const u = upg('battle_speed');
  return 1 + (u ? u.level * 0.2 : 0);
}
function battleReward(){
  const base = 8000 + G.level*600;
  return Math.floor(base * starIncome * prestigeMulti);
}

function drawScene(){
  ctx.clearRect(0,0,CW,CH);
  drawTopWall();
  drawClerk();
  drawCounter();
  drawFloor();
  drawBottomWall();
  drawDecorations();

  drawGarbages();   // 바닥의 쓰레기
  const room = G.currentRoom || 'main';
  const items = [];
  STANDS.forEach((s,i)=>{
    if (shelves[i] && shelves[i].room===room) items.push({ y:s.y+STAND_H, draw:()=>drawStand(s,shelves[i]) });
  });
  // 별관 — 카드 배틀 테이블 (위 3, 아래 3)
  if (room==='annex'){
    battleTables.forEach(bt=>{
      items.push({ y: bt.y + bt.h, draw: ()=>drawBattleTable(bt) });
    });
  }
  customers.forEach(c=>{
    const cr = c.room || ((c.shelfIdx>=0 && shelves[c.shelfIdx]) ? shelves[c.shelfIdx].room : 'main');
    if (cr===room) items.push({ y:c.y+CHAR_DH, draw:()=>drawCustomer(c) });
  });
  // 방별 청소부 — 현재 보는 방의 청소부만 그림
  {
    const cid = getCleanerId(room);
    const cEnt = cleanerEntities[room];
    if (cid && cEnt){
      items.push({ y:cEnt.y+CHAR_DH/2, draw:drawCleaner });
    }
  }
  items.sort((a,b)=>a.y-b.y).forEach(it=>it.draw());

  // 말풍선은 항상 맨 위 (현재 방의 손님만)
  const currentRoom = G.currentRoom || 'main';
  customers.forEach(c=>{
    if (!c.bubble || c.bubble.t<=0) return;
    const cr = c.room || ((c.shelfIdx>=0 && shelves[c.shelfIdx]) ? shelves[c.shelfIdx].room : 'main');
    if (cr!==currentRoom) return;
    drawBubble(c.x+CHAR_DW/2, c.y+(c.jy||0), c.bubble.text);
  });
  if (clerkBubble && clerkBubble.t>0){
    // 직원 이미지 상단(머리 위)에 말풍선
    let ps = G.clerk;
    if (ps!=='man_staff' && ps!=='woman_staff') ps='man_staff';
    const ch = 48;   // 직원 표시 높이와 동일
    // 머리 위 — 단, 캔버스 상단을 넘지 않도록 클램프
    const rawTop = CLERK_Y + CHAR_DH - ch + 2 + Math.sin(clerkBob)*1.4;
    const topY = Math.max(rawTop, 24);   // 말풍선 박스가 캔버스 안에 들어오게
    drawBubble(CLERK_X+CHAR_DW/2, topY, clerkBubble.text);
  }

  drawFloats();
  drawXPBar();
}

// 중앙 매장 간판
function drawSign(){
  const sw=150, sx=CW/2-sw/2, sy=6, shh=33;
  // 매다는 줄
  ctx.strokeStyle=CL.woodDk; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(sx+24,0); ctx.lineTo(sx+24,sy+3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx+sw-24,0); ctx.lineTo(sx+sw-24,sy+3); ctx.stroke();
  // 시안 글로우 + 본체
  ctx.save();
  ctx.shadowColor='#22d3ee'; ctx.shadowBlur=7;
  ctx.fillStyle='#0e2a38'; rr(sx,sy,sw,shh,7); ctx.fill();
  ctx.restore();
  ctx.fillStyle='#143b4d'; rr(sx+2,sy+2,sw-4,shh-4,6); ctx.fill();
  ctx.strokeStyle='#2dd4e0'; ctx.lineWidth=2; rr(sx+4,sy+3,sw-8,shh-7,5); ctx.stroke();
  // 텍스트 — 사용자 지정 샵 이름 (길면 폰트 자동 축소)
  const shopTxt=(G.shopName||'MONSTER CARD SHOP').toUpperCase();
  ctx.fillStyle='#ffffff'; ctx.textAlign='center';
  let fSize=12;
  do { ctx.font='bold '+fSize+'px Arial'; if (ctx.measureText(shopTxt).width<=sw-20) break; fSize--; } while (fSize>=7);
  ctx.fillText(shopTxt, sx+sw/2, sy+16);
  ctx.fillStyle=CL.amber; ctx.font='6px Arial';
  ctx.fillText('TRADING CARD STORE', sx+sw/2, sy+26);
  // 별
  drawStar(ctx,sx+12,sy+shh/2,4,CL.amber);
  drawStar(ctx,sx+sw-12,sy+shh/2,4,CL.amber);
}

// 벽 메뉴판 — 카드 포스터 4개 + 중앙 간판
function drawTopWall(){
  if (woodPattern){ ctx.fillStyle=woodPattern; ctx.fillRect(0,0,CW,COUNTER_Y); }
  else { ctx.fillStyle=CL.wood; ctx.fillRect(0,0,CW,COUNTER_Y); }
  ctx.fillStyle='rgba(18,8,2,0.34)'; ctx.fillRect(0,0,CW,COUNTER_Y);
  const tg=ctx.createLinearGradient(0,0,0,26);
  tg.addColorStop(0,'rgba(0,0,0,0.4)'); tg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=tg; ctx.fillRect(0,0,CW,26);
  ctx.fillStyle=CL.woodDk; ctx.fillRect(0,COUNTER_Y-7,CW,7);
  ctx.fillStyle=CL.woodLt; ctx.fillRect(0,COUNTER_Y-9,CW,2);

  // 메뉴판 — 카드 포스터 4개 (좌2 / 우2, 중앙 간판 양옆)
  const ih=44, centers=[31,84,291,344];
  for (let i=0;i<4;i++){
    const img=MENU_IMG[i];
    if (!img || !img.complete || !img.naturalWidth) continue;
    const iw=Math.round(ih*img.naturalWidth/img.naturalHeight);
    const ix=Math.round(centers[i]-iw/2), iy=13;
    const fx2=ix-4, fy2=iy-4, fw2=iw+8, fh2=ih+8;
    ctx.fillStyle='rgba(0,0,0,0.34)'; rr(fx2+2,fy2+3,fw2,fh2,3); ctx.fill();
    ctx.fillStyle=CL.woodDk; rr(fx2,fy2,fw2,fh2,3); ctx.fill();
    ctx.fillStyle=CL.woodLt; ctx.fillRect(fx2+2,fy2+1,fw2-4,2);
    ctx.save(); ctx.imageSmoothingEnabled=true;
    ctx.drawImage(img,ix,iy,iw,ih);
    ctx.restore();
  }

  // 중앙 간판
  drawSign();
}

const COUNTER_MARGIN = 12;

function drawCounter(){
  const cx0=COUNTER_MARGIN, cw=CW-COUNTER_MARGIN*2, ch=COUNTER_BOT-COUNTER_Y;

  // 인셋 여백 — 뒷벽 연장 (카운터가 가구처럼 보이게)
  ctx.fillStyle = woodPattern || CL.wood;
  ctx.fillRect(0,COUNTER_Y,CW,ch);
  ctx.fillStyle='rgba(18,8,2,0.34)'; ctx.fillRect(0,COUNTER_Y,CW,ch);
  // 벽 → 카운터 그림자
  const sh=ctx.createLinearGradient(0,COUNTER_Y-6,0,COUNTER_Y);
  sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.3)');
  ctx.fillStyle=sh; ctx.fillRect(0,COUNTER_Y-6,CW,6);

  // 카운터 본체 (인셋 + 둥근 모서리)
  ctx.fillStyle='rgba(0,0,0,0.3)';
  rr(cx0+3,COUNTER_Y+5,cw,ch-3,8); ctx.fill();
  ctx.fillStyle=CL.wood;
  rr(cx0,COUNTER_Y,cw,ch,8); ctx.fill();

  ctx.save();
  rr(cx0,COUNTER_Y,cw,ch,8); ctx.clip();
  ctx.fillStyle=CL.woodDk; ctx.fillRect(cx0,COUNTER_BOT-7,cw,7);
  // 세로 나무 패널 구획
  for (let x=cx0+30;x<cx0+cw-14;x+=52){
    ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.fillRect(x,COUNTER_Y+13,2,ch-22);
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(x+2,COUNTER_Y+13,1,ch-22);
  }
  // 가로 우드 결
  ctx.fillStyle='rgba(0,0,0,0.07)'; ctx.fillRect(cx0,COUNTER_Y+25,cw,1);
  ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(cx0,COUNTER_Y+26,cw,1);
  ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(cx0,COUNTER_Y+38,cw,1);
  // 크림 상판
  ctx.fillStyle=CL.cream; ctx.fillRect(cx0,COUNTER_Y,cw,10);
  ctx.fillStyle=CL.woodLt; ctx.fillRect(cx0,COUNTER_Y,cw,2);
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(cx0,COUNTER_Y+10,cw,2);
  ctx.restore();
  ctx.strokeStyle=CL.woodDk; ctx.lineWidth=2;
  rr(cx0,COUNTER_Y,cw,ch,8); ctx.stroke();

  // CHECKOUT 명패
  ctx.fillStyle=CL.woodDk; rr(cx0+4,COUNTER_BOT-20,104,15,3); ctx.fill();
  ctx.fillStyle=CL.cream; rr(cx0+7,COUNTER_BOT-18,98,11,2); ctx.fill();
  ctx.fillStyle=CL.textDk; ctx.font='bold 8px Arial'; ctx.textAlign='center';
  ctx.fillText('CHECKOUT  계산대', cx0+56, COUNTER_BOT-9);

  // 카운터 위 기기
  const by=COUNTER_Y+11;
  devRegister(cx0+6, by);
  devPOS(cx0+92, by);
  devMonitor(cx0+120, by);
  devShowcase(cx0+178, by, 150);
}

function drawClerk(){
  clerkBob += 0.04;
  // G.clerk 정규화: 구버전(man/woman/DAVID 등) → man_staff/woman_staff
  let ps = G.clerk;
  if (ps==='man'  || ps==='DAVID' || ps==='LIAM' || ps==='NOAH') ps='man_staff';
  if (ps==='woman'|| ps==='EMMA'  || ps==='SOPHIE'|| ps==='MIA') ps='woman_staff';
  if (ps!=='man_staff' && ps!=='woman_staff') ps='man_staff';
  drawChar(ctx, CLERK_X, CLERK_Y + Math.sin(clerkBob)*1.4, ps, 0, { walking:false, flip:false });
}

function drawFloor(){
  if (woodPattern){
    ctx.fillStyle=woodPattern;
    ctx.fillRect(0,FLOOR_Y,CW,FLOOR_BOT-FLOOR_Y);
  } else {
    ctx.fillStyle=CL.woodDk;
    ctx.fillRect(0,FLOOR_Y,CW,FLOOR_BOT-FLOOR_Y);
  }
  // 타일 미세 톤 변화 — 똑같은 반복을 깨서 자연스러운 마루 느낌
  const TT=42;
  for (let gx=0; gx<CW; gx+=TT){
    for (let gy=FLOOR_Y; gy<FLOOR_BOT; gy+=TT){
      const s = (((gx*7) ^ (gy*13)) >> 2) % 7;
      if      (s<2) ctx.fillStyle='rgba(0,0,0,'+(0.05+s*0.035)+')';
      else if (s>4) ctx.fillStyle='rgba(255,238,205,'+((s-4)*0.04)+')';
      else continue;
      ctx.fillRect(gx,gy,TT,TT);
    }
  }
  const ws=ctx.createLinearGradient(0,FLOOR_Y,0,FLOOR_Y+20);
  ws.addColorStop(0,'rgba(0,0,0,0.32)'); ws.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ws; ctx.fillRect(0,FLOOR_Y,CW,20);

  // 줄서기 안내선 (계산대 앞 바닥)
  ctx.fillStyle='rgba(242,160,7,0.22)';
  QSLOT.forEach(q=>{
    ctx.beginPath(); ctx.arc(q.x+14,q.y+38,11,0,Math.PI*2); ctx.fill();
  });
}

function drawBottomWall(){
  ctx.fillStyle=CL.wall; ctx.fillRect(0,FLOOR_BOT,CW,CH-FLOOR_BOT);
  ctx.fillStyle=CL.baseboard; ctx.fillRect(0,FLOOR_BOT,CW,4);

  // ── 손님 통행로 — 문 양옆 바닥 돌길 (문이 가운데를 덮음) ──
  const pTop=FLOOR_BOT+44;
  ctx.fillStyle='#5e4a30'; ctx.fillRect(0,pTop,CW,CH-pTop);
  const ptw=16, pth=12;
  for (let r=0,gy=pTop+2; gy<CH-1; gy+=pth+2, r++){
    const off=(r%2)*((ptw+2)/2);
    for (let gx=2-off; gx<CW-2; gx+=ptw+2){
      const a=Math.max(2,gx), b=Math.min(CW-2,gx+ptw);
      if (b-a<3) continue;
      ctx.fillStyle='#aea693'; rr(a,gy,b-a,pth,2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(a+1,gy+1,b-a-2,2);
      ctx.fillStyle='rgba(0,0,0,0.14)';       ctx.fillRect(a+1,gy+pth-2,b-a-2,2);
    }
  }

  const dx=CW/2-DOOR_W/2, dy=FLOOR_BOT-5, dh=CH-FLOOR_BOT+5;
  // 문틀
  ctx.fillStyle=CL.woodDk; ctx.fillRect(dx-8,dy,DOOR_W+16,dh);
  ctx.fillStyle=CL.wood;   ctx.fillRect(dx-8,dy,DOOR_W+16,5);   // 상단 인방
  ctx.fillStyle=CL.woodLt; ctx.fillRect(dx-8,dy,DOOR_W+16,2);
  // ── 열린 문 사이로 보이는 바깥 풍경 ──
  const ix=dx+3, iy=dy+5, iw=DOOR_W-6, ih=dh-7, gh2=Math.round(ih*0.42);
  const sky=ctx.createLinearGradient(0,iy,0,iy+ih-gh2);
  sky.addColorStop(0,'#a6d8ef'); sky.addColorStop(1,'#dff1ea');
  ctx.fillStyle=sky; ctx.fillRect(ix,iy,iw,ih-gh2);
  ctx.fillStyle='#a89868'; ctx.fillRect(ix,iy+ih-gh2,iw,gh2);          // 바깥 땅
  ctx.fillStyle='#bcab7e'; ctx.fillRect(ix,iy+ih-gh2,iw,3);
  ctx.fillStyle='#aea693'; ctx.fillRect(CW/2-15,iy+ih-gh2,30,gh2);     // 바깥으로 이어진 길
  ctx.fillStyle='rgba(255,255,255,0.85)';                              // 구름
  ctx.beginPath(); ctx.arc(ix+iw*0.68,iy+9,5,0,7); ctx.arc(ix+iw*0.68+6,iy+10,4,0,7); ctx.fill();
  // ── 활짝 열린 문짝 2개 ──
  const pw=15;
  [0,1].forEach(side=>{
    const px = side===0 ? dx+2 : dx+DOOR_W-2-pw;
    ctx.fillStyle=CL.wood; ctx.fillRect(px,dy+5,pw,dh-7);
    ctx.fillStyle=CL.woodLt; ctx.fillRect(px,dy+5,pw,2);
    ctx.fillStyle='rgba(0,0,0,0.24)'; ctx.fillRect(side===0?px+pw-3:px,dy+5,3,dh-7); // 안쪽 모서리
    ctx.fillStyle='#bcd9e2'; rr(px+3,dy+10,pw-6,15,2); ctx.fill();      // 유리창
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillRect(px+4,dy+11,pw-8,3);
    ctx.fillStyle=CL.woodDk; rr(px+3,dy+29,pw-6,dh-39,2); ctx.fill();   // 아래 패널 음각
    ctx.fillStyle=CL.woodLt; rr(px+4,dy+30,pw-8,dh-42,1); ctx.fill();
    ctx.fillStyle=CL.amber;                                            // 손잡이
    ctx.beginPath(); ctx.arc((side===0?px+pw-4:px+3),dy+dh/2,2.6,0,7); ctx.fill();
  });
  // 문지방 매트
  ctx.fillStyle='#7a241a'; rr(CW/2-27,FLOOR_BOT-4,54,8,2); ctx.fill();
  ctx.fillStyle='#bb4a38'; rr(CW/2-24,FLOOR_BOT-3,48,5,1); ctx.fill();
  // 바닥에 비치는 햇빛
  const lg=ctx.createRadialGradient(CW/2,FLOOR_BOT,4,CW/2,FLOOR_BOT,70);
  lg.addColorStop(0,'rgba(255,235,170,0.36)'); lg.addColorStop(1,'rgba(255,235,170,0)');
  ctx.fillStyle=lg; ctx.fillRect(CW/2-80,FLOOR_BOT-40,160,58);
  // OPEN 간판
  ctx.fillStyle=CL.signRedDk; rr(CW/2-26,dy+6,52,16,3); ctx.fill();
  ctx.fillStyle=CL.green;     rr(CW/2-24,dy+7,48,13,2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
  ctx.fillText('OPEN', CW/2, dy+17);
  ctx.fillStyle=CL.signRedDk; ctx.font='bold 7px Arial';
  ctx.fillText('▼ ENTRANCE 입구 ▼', CW/2, FLOOR_BOT-9);

  ctx.fillStyle=CL.signRedDk; rr(CW/2-42,FLOOR_BOT-26,84,18,3); ctx.fill();
  ctx.fillStyle=CL.signRed; rr(CW/2-36,FLOOR_BOT-23,72,12,2); ctx.fill();
  ctx.fillStyle=CL.signCream; ctx.font='bold 8px Arial'; ctx.textAlign='center';
  ctx.fillText('WELCOME', CW/2, FLOOR_BOT-14);
}

// 바닥 카펫 (러너)
function drawRug(x, y, w, h){
  ctx.fillStyle='rgba(0,0,0,0.22)'; rr(x+3,y+5,w,h,8); ctx.fill();
  ctx.fillStyle='#9a3324'; rr(x,y,w,h,8); ctx.fill();
  ctx.fillStyle='#bb4a38'; rr(x+5,y+5,w-10,h-10,5); ctx.fill();
  ctx.strokeStyle='#7a241a'; ctx.lineWidth=2; rr(x+7,y+7,w-14,h-14,4); ctx.stroke();
  const cy=y+h/2, n=Math.max(1,Math.floor((w-30)/44));
  for (let i=0;i<n;i++){
    const cx=x+w/2+(i-(n-1)/2)*44;
    ctx.fillStyle='#e8a850';
    ctx.beginPath();
    ctx.moveTo(cx,cy-8); ctx.lineTo(cx+8,cy); ctx.lineTo(cx,cy+8); ctx.lineTo(cx-8,cy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#9a3324';
    ctx.beginPath();
    ctx.moveTo(cx,cy-4); ctx.lineTo(cx+4,cy); ctx.lineTo(cx,cy+4); ctx.lineTo(cx-4,cy);
    ctx.closePath(); ctx.fill();
  }
}

function drawDecorations(){
  const rows = Math.ceil(STANDS.length / 3);
  for (let r=0;r<rows;r++){
    const st = STANDS[r*3];
    if (!st) continue;
    drawRug(14, st.y-11, CW-28, STAND_H+24);
  }
}

function drawStand(s, shelf){
  const x=s.x, y=s.y, w=STAND_W, h=STAND_H;
  const p=pack(shelf.packId);
  const locked=G.level<shelf.unlockLv;
  const pct=shelf.stock/shelf.maxStock;
  const bodyH=h-16;                       // 본체 (다리 16px 제외)
  const legTop=y+bodyH-4, legBot=y+h;

  // 바닥 그림자
  ctx.fillStyle='rgba(0,0,0,0.24)';
  ctx.beginPath(); ctx.ellipse(x+w/2,y+h,w/2,7,0,0,Math.PI*2); ctx.fill();

  // ── 다리 4개 (벌어진 받침대) ──
  // 뒤쪽 다리 (어두운 곧은 기둥)
  ctx.fillStyle='#5a3a1f';
  ctx.fillRect(x+22,legTop-2,6,legBot-legTop+2);
  ctx.fillRect(x+w-28,legTop-2,6,legBot-legTop+2);
  // 가로 가름대
  ctx.fillStyle='#6b4226';
  ctx.fillRect(x+15,legBot-9,w-30,4);
  // 앞쪽 다리 (밝은 우드, 바깥으로 벌어짐)
  ctx.fillStyle=CL.woodDk;
  ctx.beginPath();
  ctx.moveTo(x+10,legTop); ctx.lineTo(x+19,legTop);
  ctx.lineTo(x+15,legBot); ctx.lineTo(x+3,legBot);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x+w-19,legTop); ctx.lineTo(x+w-10,legTop);
  ctx.lineTo(x+w-3,legBot); ctx.lineTo(x+w-15,legBot);
  ctx.closePath(); ctx.fill();
  // 다리 하이라이트 + 발
  ctx.fillStyle=CL.wood;
  ctx.fillRect(x+11,legTop+2,2,legBot-legTop-5);
  ctx.fillRect(x+w-18,legTop+2,2,legBot-legTop-5);
  ctx.fillStyle='#3a2616';
  ctx.fillRect(x+2,legBot-3,14,3);
  ctx.fillRect(x+w-16,legBot-3,14,3);

  // ── 본체 (우드 프레임) ──
  ctx.fillStyle=locked?'#9a8a70':CL.wood;
  rr(x,y,w,bodyH,5); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.16)'; ctx.fillRect(x+w-6,y+6,4,bodyH-14);
  ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(x+4,y+6,3,bodyH-14);
  ctx.strokeStyle=CL.woodDk; ctx.lineWidth=2;
  rr(x,y,w,bodyH,5); ctx.stroke();

  if (locked){
    drawLockPx(ctx, x+w/2-9, y+14, 2);
    ctx.fillStyle=CL.woodDk; ctx.font='bold 9px Arial'; ctx.textAlign='center';
    ctx.fillText(`Lv${shelf.unlockLv} 해금`, x+w/2, y+bodyH-13);
    return;
  }

  // 상단 나무 명패
  ctx.fillStyle=CL.woodDk; rr(x+4,y+3,w-8,14,3); ctx.fill();
  ctx.fillStyle=p.color;  rr(x+6,y+4,w-12,11,2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fillRect(x+7,y+5,w-14,2);
  ctx.fillStyle='#fff'; ctx.font='bold 8px Arial'; ctx.textAlign='left';
  ctx.fillText(p.name, x+9, y+12);
  ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='bold 6px Arial'; ctx.textAlign='right';
  ctx.fillText(`Lv${shelf.level}`, x+w-9, y+12);

  // 카드 진열 랙 — 오목한 디스플레이 + 카드 + 받침 선반
  const dX=x+5, dY=y+19, dW=w-10, dH=26;
  ctx.fillStyle='#3a2616'; rr(dX,dY,dW,dH,2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(dX+1,dY+1,dW-2,3);
  const slots=4, slotW2=dW/slots;
  const filled=shelf.stock>0 ? Math.max(2,Math.min(4,Math.ceil(pct*4))) : 0;
  const pim=PACK_IMG[p.id];
  const ch2=dH-7, cw2=Math.min(slotW2-4, ch2*0.72);
  for (let i=0;i<filled;i++){
    const ccx=Math.round(dX+i*slotW2+(slotW2-cw2)/2), ccy=dY+2;
    ctx.fillStyle='rgba(0,0,0,0.4)'; rr(ccx+1.5,ccy+1,cw2,ch2,2); ctx.fill();
    if (pim && pim.complete && pim.naturalWidth){
      ctx.drawImage(pim, ccx, ccy, Math.round(cw2), ch2);
    } else {
      ctx.fillStyle='#f4ead0'; rr(ccx,ccy,cw2,ch2,2); ctx.fill();
      ctx.fillStyle=p.color; rr(ccx+1.5,ccy+1.5,cw2-3,ch2-3,1.5); ctx.fill();
      drawStar(ctx,ccx+cw2/2,ccy+ch2*0.4,cw2/4,'rgba(255,255,255,0.9)');
    }
  }
  // 받침 선반 (나무 턱)
  ctx.fillStyle=CL.woodLt; rr(dX-1,dY+dH-4,dW+2,5,2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fillRect(dX,dY+dH-4,dW,1.5);
  ctx.fillStyle=CL.woodDk; ctx.fillRect(dX-1,dY+dH,dW+2,1);

  // 푸터 — 재고 바 + 재고 수량 + 가격
  const fy=y+46;
  ctx.fillStyle=CL.cream; rr(x+5,fy,w-10,17,3); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.22)'; rr(x+9,fy+3,w-18,4,2); ctx.fill();
  if (pct>0){
    ctx.fillStyle=pct>0.5?CL.green:pct>0.2?CL.amber:CL.signRed;
    rr(x+9,fy+3,Math.max(3,(w-18)*pct),4,2); ctx.fill();
  }
  ctx.fillStyle=CL.textDk; ctx.font='7px Arial'; ctx.textAlign='left';
  ctx.fillText(`재고 ${shelf.stock}`, x+9, fy+14);
  // 가격 태그 (앰버 알약 = 클릭하면 가격 수정)
  const ptxt=fmt(salePrice(shelf));
  ctx.font='bold 9px Arial';
  const ptw=ctx.measureText(ptxt).width+12;
  ctx.fillStyle=CL.amber; rr(x+w-9-ptw,fy+4,ptw,11,3); ctx.fill();
  ctx.strokeStyle=CL.woodDk; ctx.lineWidth=1; rr(x+w-9-ptw,fy+4,ptw,11,3); ctx.stroke();
  ctx.fillStyle=CL.textDk; ctx.textAlign='center';
  ctx.fillText(ptxt, x+w-9-ptw/2, fy+12);

  if (shelf.stock===0){
    ctx.fillStyle='rgba(187,59,45,0.26)'; rr(x,y,w,bodyH,5); ctx.fill();
    ctx.fillStyle=CL.signRed; ctx.font='bold 10px Arial'; ctx.textAlign='center';
    ctx.fillText('SOLD OUT', x+w/2, y+bodyH/2+3);
  }
}

function drawCustomer(c){
  let carryImg=null;
  if (c.carry && c.shelfIdx>=0 && shelves[c.shelfIdx]){
    carryImg = PACK_IMG[shelves[c.shelfIdx].packId];   // 해당 진열대 팩 이미지
  }
  drawChar(ctx, Math.round(c.x), Math.round(c.y+(c.jy||0)), c.ps, c.frame, {
    walking:c.moving, flip:c.flip, carry:c.carry, carryImg, carryQty:c.qty,
  });
}

function drawFloats(){
  const curRoom = G.currentRoom || 'main';
  for (let i=floatTexts.length-1;i>=0;i--){
    const ft=floatTexts[i];
    ft.t+=16;
    if (ft.t>1400){ floatTexts.splice(i,1); continue; }
    if (ft.room && ft.room !== curRoom) continue;
    const pr=ft.t/1400, a=Math.max(0,1-pr*1.4);
    ctx.save(); ctx.globalAlpha=a;
    ctx.font='bold 14px Arial'; ctx.textAlign='center';
    ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.lineWidth=3;
    ctx.strokeText(ft.text, ft.x, ft.y-pr*54);
    ctx.fillStyle=ft.color;
    ctx.fillText(ft.text, ft.x, ft.y-pr*54);
    ctx.restore();
  }
}

function drawXPBar(){
  const pct=G.xp/G.xpNeeded;
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,CH-5,CW,5);
  ctx.fillStyle=CL.amber; ctx.fillRect(0,CH-5,CW*pct,5);
}

let repBadgeRect = null;
function drawCustomerCount(){
  ctx.font='bold 8px Arial';
  // 손님 수 배지
  const txt='손님 '+customers.length+'명';
  const tw=ctx.measureText(txt).width;
  const w=tw+12, h=14, x=CW-w-5, y=CH-h-8;
  ctx.fillStyle='rgba(42,28,16,0.8)'; rr(x,y,w,h,5); ctx.fill();
  ctx.strokeStyle='rgba(255,233,196,0.45)'; ctx.lineWidth=1; rr(x,y,w,h,5); ctx.stroke();
  ctx.fillStyle='#ffe9c4'; ctx.textAlign='center';
  ctx.fillText(txt, x+w/2, y+10);
  // 평판 / 청결 배지 — 탭하면 리뷰 패널 열림
  const rep = Math.round(G.reputation||0);
  const clean = Math.max(0, 100-Math.round(G.dirtLevel||0));
  const txt2 = '평판 '+rep+' · 청결 '+clean+' ▸';
  const tw2 = ctx.measureText(txt2).width;
  const w2 = tw2+12, x2=CW-w2-5, y2 = y-h-3;
  const repCol = rep>=80 ? 'rgba(46,125,50,0.85)' : rep>=50 ? 'rgba(180,120,30,0.85)' : 'rgba(187,59,45,0.85)';
  ctx.fillStyle=repCol; rr(x2,y2,w2,h,5); ctx.fill();
  ctx.strokeStyle='rgba(255,233,196,0.45)'; rr(x2,y2,w2,h,5); ctx.stroke();
  ctx.fillStyle='#ffe9c4'; ctx.textAlign='center';
  ctx.fillText(txt2, x2+w2/2, y2+10);
  repBadgeRect = { x:x2, y:y2, w:w2, h:h };
}

// ══════════════════════════════════════════════════════════
//  GAME LOOP  (fixed timestep)
// ══════════════════════════════════════════════════════════
let accumulator=0;
const STEP=16;
function gameLoop(){
  const ts=performance.now();
  let frame=ts-lastTime;
  lastTime=ts;
  if (frame>1000) frame=1000;
  accumulator+=frame;
  while (accumulator>=STEP){
    spawnTimer+=STEP;
    // 인기도가 낮으면 손님이 천천히, 높으면 빠르게 옴 (최대 4배 느림)
    const interval = (surgeOn() ? 340 : spawnInterval * (1 + (1-popularity)*3) / repMul()) / dexSpawnMul;
    if (spawnTimer>=interval){ spawnCustomer(); spawnTimer=0; }
    updateCustomers(STEP);
    updateCleaner(STEP);
    accumulator-=STEP;
  }
  rateTimer+=frame;
  if (rateTimer>=1000){
    G.incomeRate = G.incomeRate*0.8 + (incomeAccum*1000/rateTimer)*0.2;
    incomeAccum=0; rateTimer=0;
    updateHint();
  }
  // 본사 점검 직원 — 무작위 등장 (4~8분 간격)
  inspectorTimer -= frame;
  if (inspectorTimer<=0){
    if (!inspectorActive()) spawnInspector();
    inspectorTimer = 240000 + Math.random()*240000;
  }
  // 쓰레기 — 레벨에 따라 빈도 증가
  garbageTimer -= frame;
  if (garbageTimer<=0){
    spawnGarbage();
    garbageTimer = nextGarbageInterval();
  }
  // 플레이 시간 누적
  G.playTime = (G.playTime||0) + frame;
  saveTimer+=frame;
  if (saveTimer>=8000){ saveGame(); saveTimer=0; }
  // AD 보상 버튼 쿨다운 — 본관·별관 둘 다 독립적으로 진행
  [adRewardsByRoom.main, adRewardsByRoom.annex].forEach(arr=>{
    arr.forEach(r=>{
      if (!r.ready){
        r.next-=frame;
        if (r.next<=0){ r.next=0; r.ready=true; renderRewardButtons(); }
      }
    });
  });
  drawScene();
}

// ══════════════════════════════════════════════════════════
//  AD 보상 버튼
// ══════════════════════════════════════════════════════════
function initRewardIcons(){
  const bolt='<svg viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="#fff" stroke="#7a4a00" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  const ic={ buff:bolt, gem:ICONS.gem, money:ICONS.coin };
  curAdRewards().forEach(r=>{
    const el=document.querySelector('#rfab-'+r.id+' .rfab-ic');
    if (el) el.innerHTML=ic[r.id];
  });
}
function renderRewardButtons(){
  curAdRewards().forEach(r=>{
    const el=document.getElementById('rfab-'+r.id);
    if (el) el.classList.toggle('on', r.ready);
  });
}
// 광고 골드 보상 — 레벨에 따라 지수 상승해 후반에도 의미있음
function adGoldAmount(){ return Math.floor(30000 * Math.pow(1.3, Math.max(0,G.level-1))); }
function adRewardLabel(id){
  if (id==='buff')  return '손님 폭주 버프 (30초)';
  if (id==='gem')   return '다이아 30개';
  if (id==='money') return fmt(adGoldAmount())+' 골드';
  return '';
}
// 광고 시청 확인 다이얼로그
let confirmAdId=null;
function confirmAd(id){
  const r=curAdRewards().find(x=>x.id===id);
  if (!r||!r.ready) return;
  confirmAdId=id;
  showAdConfirm('ask');
}
function showAdConfirm(mode){
  const ov=document.getElementById('ad-confirm');
  const msg=document.getElementById('adc-msg');
  const yes=document.getElementById('adc-yes');
  const no=document.getElementById('adc-no');
  if (mode==='ask'){
    msg.innerHTML='광고를 보고 <b>'+adRewardLabel(confirmAdId)+'</b><br>보상을 받으시겠습니까?';
    yes.onclick=()=>{ const id=confirmAdId; hideAdConfirm(); openAd(id); };
    no.onclick=()=>showAdConfirm('warn');
  } else {
    msg.innerHTML='취소하면 이 보상 버튼이 <b>사라집니다.</b><br>정말 취소하시겠습니까?';
    yes.onclick=()=>{ dismissReward(confirmAdId); hideAdConfirm(); };
    no.onclick=()=>showAdConfirm('ask');
  }
  ov.classList.add('show');
}
function hideAdConfirm(){
  document.getElementById('ad-confirm').classList.remove('show');
  confirmAdId=null;
}
function dismissReward(id){
  const r=curAdRewards().find(x=>x.id===id);
  if (r){ r.ready=false; r.next=r.cd; }
  renderRewardButtons();
  notice('보상 버튼이 사라졌습니다');
}

let currentAdId=null, adTimer=null;
// 광고 표시 — Capacitor 앱 환경에서는 AdMob 실광고, 웹/개발에서는 5초 fake 광고
async function openAd(id){
  const r=curAdRewards().find(x=>x.id===id);
  if (!r||!r.ready) return;
  currentAdId=id;
  initAudio();
  document.getElementById('ad-reward').textContent='보상: '+adRewardLabel(id);
  const claim=document.getElementById('ad-claim');
  document.getElementById('ad-overlay').classList.add('show');

  // Capacitor(앱) — AdMob 호출 시 SDK가 자체 UI를 띄움, 우리 오버레이는 가드 역할
  if (window.Platform && window.Platform.IS_CAPACITOR){
    document.getElementById('ad-stxt').textContent='광고 로딩 중...';
    claim.disabled=true;
    const ok = await window.Platform.showRewardedAd(id);
    if (ok){
      // AdMob 시청 완료 — 즉시 보상 지급
      grantReward(id);
    } else {
      notice('광고 실패 또는 취소');
    }
    closeAd();
    return;
  }

  // 웹 환경 — fake 5초 광고 (보상 수령 버튼 누를 때까지 대기)
  const cnt=document.getElementById('ad-count');
  const stxt=document.getElementById('ad-stxt');
  claim.disabled=true;
  stxt.textContent='광고 시청 중...';
  cnt.style.display='';
  let n=5; cnt.textContent=n+'초';
  clearInterval(adTimer);
  adTimer=setInterval(()=>{
    n--;
    if (n>0){ cnt.textContent=n+'초'; }
    else {
      clearInterval(adTimer); adTimer=null;
      cnt.style.display='none';
      stxt.textContent='시청 완료! 보상을 받으세요';
      claim.disabled=false;
    }
  },1000);
}
function closeAd(){
  clearInterval(adTimer); adTimer=null;
  document.getElementById('ad-overlay').classList.remove('show');
  currentAdId=null;
}
function claimAdReward(){
  const id=currentAdId;
  if (!id||document.getElementById('ad-claim').disabled) return;
  grantReward(id);
  closeAd();
}
function grantReward(id){
  const r=curAdRewards().find(x=>x.id===id);
  if (id==='buff'){
    surgeUntil=performance.now()+30000;
    popularity=Math.max(popularity,0.85);
    notice('손님 폭주! 30초간 손님이 몰려옵니다');
  } else if (id==='gem'){
    G.gems+=30; G.gemsEarnedTotal=(G.gemsEarnedTotal||0)+30;
    notice('다이아 30개 획득!');
  } else if (id==='money'){
    const amt=adGoldAmount();
    G.money+=amt;
    notice(fmt(amt)+' 골드 획득!');
  }
  if (r){ r.ready=false; r.next=r.cd; }
  updateHUD(); renderRewardButtons(); sfxBuy(); saveGame();
}

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
function pack(id){ return PACKS.find(p=>p.id===id); }
function upg(id){ return upgrades.find(u=>u.id===id); }
function upgCost(u){
  // 자동 재고는 1회성 unlock — 레벨에 따라 비용 스케일 (후반에도 의미있게)
  if (u.id==='auto_restock') return Math.floor(u.baseCost*Math.pow(1.4, Math.max(0,G.level-1)));
  return Math.floor(u.baseCost*Math.pow(1.8,u.level));
}
function upgCurrent(u){
  const n=Math.max(0,u.level-1);  // 구매 횟수
  if (u.id==='customer_speed') return '+'+Math.round((Math.pow(1.1,n)-1)*100)+'%';
  if (u.id==='sell_price')     return '+'+Math.round((Math.pow(1.1,n)-1)*100)+'%';
  if (u.id==='checkout_speed') return '-'+Math.round((1-Math.pow(0.9,n))*100)+'%';
  if (u.id==='shelf_size')     return '+'+Math.round((Math.pow(1.2,n)-1)*100)+'%';
  if (u.id==='auto_restock')   return u.level>0?'활성':'비활성';
  if (u.id==='battle_speed')   return '+'+Math.round(u.level*20)+'%';
  return '';
}
// 한 번이라도 획득한 카드 수 (수집 버프 기준 — 다 팔아도 카운트 유지)
function colSize(){
  const all = Object.assign({}, G.collection||{}, G.everOwned||{});
  return CARDS.filter(c=> (G.collection[c.id]||0)>0 || (G.everOwned && G.everOwned[c.id])).length;
}

// ── XP / 수익 배수 ──
function xpForLevel(L){ return Math.floor(60 + L*L*20); }
function shelfMul(s){ return 1 + (((s&&s.level)||1)-1)*0.12; }   // 진열대 레벨당 +12%
function salePrice(shelf){ return Math.floor(shelf.price*priceMulti*starIncome*prestigeMulti*dexIncomeMul*shelfMul(shelf)); }
function recomputeStarPrestige(){
  starIncome    = 1 + G.starUpg.income*0.05;
  starSpeed     = 1 + G.starUpg.speed*0.04;
  starXpMul     = 1 + G.starUpg.xp*0.06;
  prestigeMulti = 1 + G.prestige*0.4;
}
// 한 번이라도 획득했으면 수집된 것으로 간주 (다 팔아도 버프 유지)
function isCollected(cardId){ return (G.collection[cardId]||0)>0 || (G.everOwned && G.everOwned[cardId]); }
// 도감 수집 보너스 + 등급별 컴플리트 보상 재계산
function recomputeDex(){
  const tot={common:0,rare:0,epic:0,legendary:0}, got={common:0,rare:0,epic:0,legendary:0};
  let sz=0;
  CARDS.forEach(c=>{ tot[c.rarity]++; if (isCollected(c.id)){ got[c.rarity]++; sz++; } });
  let inc = 1 + sz*0.003;                              // #3 수집 1종당 +0.3%
  if (got.common>=tot.common       && tot.common)    inc += 0.15;   // 일반 컴플리트
  if (sz>=CARDS.length)                              inc += 0.5;    // 100종 전체
  dexIncomeMul   = inc;
  dexSpawnMul    = (got.rare>=tot.rare && tot.rare)            ? 1.15 : 1;   // 레어 컴플리트
  dexCheckoutMul = (got.epic>=tot.epic && tot.epic)           ? 0.85 : 1;   // 에픽 컴플리트
  dexGemX2       = (got.legendary>=tot.legendary && tot.legendary);          // 레전드 컴플리트
}
// 등급별 수집 현황 — 도감 패널 표시용
function dexProgress(){
  const tot={common:0,rare:0,epic:0,legendary:0}, got={common:0,rare:0,epic:0,legendary:0};
  CARDS.forEach(c=>{ tot[c.rarity]++; if (isCollected(c.id)) got[c.rarity]++; });
  return { tot, got };
}
// 추천 행동 한 줄 안내
function recommendAction(){
  if (inspectorActive()) return '본사 직원이 점검 중! 품절·청결을 빨리 확인하세요';
  if (goals.some(g=>g.done&&!g.claimed)) return '목표 보상을 받을 수 있어요 — 목표 탭 확인';
  if (shelves.some(s=>G.level>=s.unlockLv && s.stock<=0)) return '빈 진열대가 있어요 — 재고 탭에서 보충하세요';
  if ((G.dirtLevel||0)>50){
    if (!G.cleanerMain && !G.cleanerAnnex) return '매장이 더러워요 — [고용] 탭에서 청소부를 고용하세요';
    return '매장이 더러워요 — 청소부가 곧 처리해요 (쓰레기가 너무 빨리 쌓이면 상위 청소부로 교체)';
  }
  if ((G.reputation||100)<60) return '평판이 낮아요 — 품절·청결을 관리하세요';
  if (CARDS.some(c=>(G.collection[c.id]||0)>1)) return '중복 카드가 쌓였어요 — 도감에서 판매하세요';
  const up=upgrades.find(u=>u.level<u.maxLevel && G.money>=upgCost(u));
  if (up) return `'${up.name}' 업그레이드를 구매할 수 있어요`;
  if (shelves.some(s=>G.level>=s.unlockLv && s.stock>0 && s.stock<s.maxStock*0.25)) return '재고가 얼마 안 남았어요 — 곧 보충하세요';
  if (G.gems>=30) return '다이아가 모였어요 — 다이아 상점을 확인해보세요';
  return '순조롭게 운영 중! 가격을 조절해 손님을 늘려보세요';
}
function updateHint(){
  const el=document.getElementById('hint-bar');
  if (el) el.textContent=recommendAction();
}

// ── 사운드 (WebAudio 합성) ──
function initAudio(){
  if (audioCtx) return;
  try {
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    sfxGain=audioCtx.createGain(); bgmGain=audioCtx.createGain();
    applyVolumes();   // 출력 연결은 applyVolumes가 담당
  } catch(e){ audioCtx=null; }
}
function killAllSound(){
  // 재생 중·예약된 모든 오실레이터 강제 정지 + 그래프에서 분리
  liveOsc.forEach(o=>{ try{o.stop();}catch(e){} try{o.disconnect();}catch(e){} });
  liveOsc.clear();
}
function applyVolumes(){
  if (!audioCtx) return;
  sfxGain.gain.value = sfxVol;
  bgmGain.gain.value = bgmVol*0.45;
  // 게인 노드를 출력에서 분리/연결 — 음소거·0볼륨이면 신호 경로 자체를 끊음
  try { sfxGain.disconnect(); } catch(e){}
  try { bgmGain.disconnect(); } catch(e){}
  if (!muted && sfxVol>0) sfxGain.connect(audioCtx.destination);
  if (!muted && bgmVol>0) bgmGain.connect(audioCtx.destination);
  // 완전 무음이면 모든 사운드 강제 정지 + 컨텍스트 정지
  const allSilent = muted || (sfxVol<=0 && bgmVol<=0);
  try {
    if (allSilent){
      killAllSound();
      if (audioCtx.state==='running') audioCtx.suspend();
    } else if (audioCtx.state==='suspended'){
      audioCtx.resume().then(()=>{ try{ scheduleBgm(); }catch(e){} });
    }
  } catch(e){}
}
function beep(freq,dur,type,vol,delay){
  if (muted||!audioCtx||sfxVol<=0) return;
  try {
    const t0=audioCtx.currentTime+(delay||0);
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type||'square'; o.frequency.value=freq;
    g.gain.setValueAtTime(vol||0.12,t0);
    g.gain.exponentialRampToValueAtTime(0.0008,t0+dur);
    o.connect(g); g.connect(sfxGain);
    liveOsc.add(o); o.onended=()=>liveOsc.delete(o);
    o.start(t0); o.stop(t0+dur+0.02);
  } catch(e){}
}
function sfxSale(){ beep(880,0.07,'square',0.10,0); beep(1245,0.09,'square',0.08,0.05); }
function sfxLevelUp(){ [523,659,784,1047].forEach((f,i)=>beep(f,0.16,'triangle',0.13,i*0.085)); }
function sfxGacha(){ beep(1568,0.32,'sine',0.10,0); beep(2093,0.28,'sine',0.07,0.13); }
function sfxBuy(){ beep(660,0.06,'square',0.09,0); beep(990,0.08,'square',0.07,0.05); }
function sfxClean(){ beep(440,0.05,'sine',0.08,0); beep(880,0.05,'sine',0.06,0.04); }
function sfxInspect(){ [392,494,659].forEach((f,i)=>beep(f,0.11,'sine',0.08,i*0.07)); }
function sfxIAP(){ [523,784,1047,1319].forEach((f,i)=>beep(f,0.13,'triangle',0.11,i*0.06)); }
function toggleMute(){
  muted=!muted; applyVolumes();
  if (curPanel==='settings') renderSettingsPanel();
  saveGame();
}
function setBgmVol(v){ bgmVol=v/100; applyVolumes(); saveGame(); }
function setSfxVol(v){ sfxVol=v/100; applyVolumes(); saveGame(); }

// ── 배경음악 (합성 루프) ──
const BGM_MELODY=[523,659,784,659, 587,784,659,587, 523,587,659,440, 392,523,587,523];
const BGM_BASS  =[262,262,196,196, 220,220,247,196];
let bgmTimer=null;
function bgmTone(freq,t0,dur,type,peak){
  if (!audioCtx||!bgmGain) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(peak,t0+0.05);
  g.gain.exponentialRampToValueAtTime(0.0006,t0+dur);
  o.connect(g); g.connect(bgmGain);
  liveOsc.add(o); o.onended=()=>liveOsc.delete(o);
  o.start(t0); o.stop(t0+dur+0.05);
}
function scheduleBgm(){
  if (!audioCtx||!bgmGain||muted||bgmVol<=0||audioCtx.state!=='running') return;
  const beat=0.36, t0=audioCtx.currentTime+0.08;
  BGM_MELODY.forEach((f,i)=>bgmTone(f,t0+i*beat,beat*0.85,'triangle',0.5));
  BGM_BASS.forEach((f,i)=>bgmTone(f,t0+i*beat*2,beat*1.8,'sine',0.5));
}
function startBgm(){
  if (!audioCtx||bgmTimer) return;
  scheduleBgm();
  bgmTimer=setInterval(scheduleBgm, BGM_MELODY.length*360);
}

// ── 게임 알림 (브라우저 Notification) ──
let lastNotifT=0;
function toggleNotif(){
  if (!notifEnabled){
    if (!('Notification' in window)){ notice('이 브라우저는 알림 미지원'); return; }
    Notification.requestPermission().then(perm=>{
      notifEnabled=(perm==='granted');
      if (!notifEnabled) notice('알림 권한이 거부되었습니다');
      if (curPanel==='settings') renderSettingsPanel();
      saveGame();
    });
  } else {
    notifEnabled=false;
    if (curPanel==='settings') renderSettingsPanel();
    saveGame();
  }
}
function gameNotify(msg){
  if (!notifEnabled || !('Notification' in window) || Notification.permission!=='granted') return;
  if (document.visibilityState==='visible') return;
  if (Date.now()-lastNotifT < 300000) return;
  lastNotifT=Date.now();
  try { new Notification('몬스터 카드샵', { body:msg }); } catch(e){}
}
function checkSoldOutNotify(){
  const anyStock=shelves.some(s=>G.level>=s.unlockLv && s.stock>0);
  if (!anyStock) gameNotify('매장 재고가 모두 소진됐어요! 재고를 보충해 주세요.');
}

// ── 설정 ──
function openSettings(){
  closePanel(false); curPanel='settings';
  renderSettingsPanel();
  requestAnimationFrame(()=>document.getElementById('panel-settings').classList.add('open'));
}
function renderSettingsPanel(){
  document.getElementById('settings-body').innerHTML=`
    <div class="set-row">
      <span class="set-label">샵 이름</span>
      <input class="set-input" type="text" maxlength="22" value="${(G.shopName||'').replace(/"/g,'&quot;')}" onchange="renameShop(this.value)">
    </div>
    <div class="set-row set-row-col">
      <span class="set-label">카운터 직원</span>
      <div class="set-clerk-grid set-clerk-grid-2">
        <button class="set-clerk-mini ${(G.clerk||'man_staff')==='man_staff'?'on':''}" onclick="setClerk('man_staff')">
          <img src="assets/characters/man_staff.png?v=3" alt=""><span>남성</span>
        </button>
        <button class="set-clerk-mini ${G.clerk==='woman_staff'?'on':''}" onclick="setClerk('woman_staff')">
          <img src="assets/characters/woman_staff.png?v=3" alt=""><span>여성</span>
        </button>
      </div>
    </div>
    <div class="set-row">
      <span class="set-label">🎵 배경음</span>
      <input class="set-slider" type="range" min="0" max="100" value="${Math.round(bgmVol*100)}" oninput="setBgmVol(this.value)">
    </div>
    <div class="set-row">
      <span class="set-label">🔔 효과음</span>
      <input class="set-slider" type="range" min="0" max="100" value="${Math.round(sfxVol*100)}" oninput="setSfxVol(this.value)">
    </div>
    <div class="set-row">
      <span class="set-label">전체 음소거</span>
      <button class="set-toggle ${muted?'on':''}" onclick="toggleMute()">${muted?'ON':'OFF'}</button>
    </div>
    <div class="set-row">
      <span class="set-label">게임 알림 받기</span>
      <button class="set-toggle ${notifEnabled?'on':''}" onclick="toggleNotif()">${notifEnabled?'ON':'OFF'}</button>
    </div>
    <div class="set-note">게임 알림: 다른 탭/창에 있을 때 매장 재고가 모두 소진되면 브라우저 알림으로 알려드려요.</div>
    <div class="set-row">
      <button class="set-action" onclick="closePanel();openPanel('stats')">📊 통계 보기</button>
    </div>
    <div class="set-row">
      <button class="set-action" onclick="closePanel();openThemePicker()">🎨 매장 테마</button>
    </div>
    <div class="set-reset-row">
      <button class="set-reset" onclick="resetGame()">⚠ 게임 데이터 초기화</button>
    </div>`;
}
function setClerk(c){
  if (STAFF_CHOICES.indexOf(c)<0) c='man_staff';
  G.clerk=c;
  saveGame(); renderSettingsPanel();
  notice('카운터 직원이 변경됐어요');
}
function renameShop(v){
  v=(v||'').trim().slice(0,22);
  if (!v){ notice('샵 이름이 비어있어요'); return; }
  G.shopName=v; saveGame();
  notice(`샵 이름이 '${v}'(으)로 변경됐어요`);
}
function resetGame(){
  if (!confirm('정말 모든 게임 데이터를 초기화할까요? 되돌릴 수 없습니다.')) return;
  try { localStorage.removeItem(SAVE_KEY); } catch(e){}
  location.reload();
}

// ── 저장 / 불러오기 ──
const SAVE_KEY='monsterCardShop_v1';
function saveGame(){
  try {
    const json = JSON.stringify({
      G, priceMulti, speedMulti, autoRestock, spawnInterval, checkoutTime,
      muted, bgmVol, sfxVol, notifEnabled,
      shelves: shelves.map(s=>({stock:s.stock,price:s.price,level:s.level,maxStock:s.maxStock,packId:s.packId})),
      upgrades: upgrades.map(u=>({level:u.level})),
      goals: goals.map(g=>({target:g.target,reward:g.reward,tier:g.tier,done:g.done,claimed:g.claimed})),
      showcaseSlots,
      savedAt: Date.now(),
    });
    localStorage.setItem(SAVE_KEY, json);
    // 클라우드 동기화 — Platform 브릿지가 자체적으로 throttle (10초 간격)
    if (window.Platform && window.Platform.cloudSave){
      window.Platform.cloudSave(json);
    }
  } catch(e){}
}
function loadGame(){
  let d;
  try { d=JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e){ return null; }
  if (!d||!d.G) return null;
  Object.assign(G,d.G);
  if (!G.starUpg) G.starUpg={income:0,speed:0,xp:0};
  if (typeof G.prestige!=='number') G.prestige=0;
  if (typeof G.incomeRate!=='number') G.incomeRate=0;
  priceMulti=(d.priceMulti!=null?d.priceMulti:1);
  speedMulti=(d.speedMulti!=null?d.speedMulti:1);
  autoRestock=!!d.autoRestock;
  spawnInterval=(d.spawnInterval!=null?d.spawnInterval:2600);
  checkoutTime=(d.checkoutTime!=null?d.checkoutTime:1200);
  muted=!!d.muted;
  if (typeof d.bgmVol==='number') bgmVol=d.bgmVol;
  if (typeof d.sfxVol==='number') sfxVol=d.sfxVol;
  notifEnabled=!!d.notifEnabled;
  if (d.shelves) d.shelves.forEach((sd,i)=>{ if (shelves[i]) Object.assign(shelves[i],sd); });
  if (d.upgrades) d.upgrades.forEach((ud,i)=>{ if (upgrades[i]) upgrades[i].level=ud.level; });
  if (d.goals) d.goals.forEach((gd,i)=>{ if (goals[i]) Object.assign(goals[i],gd); });
  goals.forEach(g=>{ if (g.rtype==='gems') g.reward = Math.min(100, g.reward); });
  // 누적 판매·카드 수집 보상 3배 — 기존 세이브 1회 마이그레이션
  if (!G.goalsTripled){
    const sales=goals.find(g=>g.id==='sales');
    const collect=goals.find(g=>g.id==='collect');
    if (sales) sales.reward = Math.ceil(sales.reward*3);
    if (collect) collect.reward = Math.ceil(collect.reward*3);
    G.goalsTripled = true;
  }
  // 에픽·레전드 전시 기본가 상향 — 기존 슬롯 가격도 같은 배율로 1회 마이그레이션
  if (!G.epicLegendBumped){
    showcaseSlots.forEach(slot=>{
      if (!slot) return;
      const card = CARDS.find(c=>c.id===slot.cardId);
      if (!card) return;
      if (card.rarity==='epic')      slot.price = Math.round(slot.price*3);
      else if (card.rarity==='legendary') slot.price = Math.round(slot.price*5);
    });
    G.epicLegendBumped = true;
  }
  // 전체 전시 카드가 일괄 상향(V2) — 후반 성장 동력 강화
  if (!G.priceBumpedV2){
    const ratios = { common: 1000/300, rare: 4000/1200, epic: 40000/13500, legendary: 300000/90000 };
    showcaseSlots.forEach(slot=>{
      if (!slot) return;
      const card = CARDS.find(c=>c.id===slot.cardId);
      if (!card) return;
      slot.price = Math.round(slot.price * ratios[card.rarity]);
    });
    G.priceBumpedV2 = true;
  }
  if (d.showcaseSlots) d.showcaseSlots.forEach((v,i)=>{ showcaseSlots[i]=v; });
  // 마이그레이션: 기존 세이브의 보유 카드를 everOwned에 반영 (한번이라도 가진 카드)
  if (!G.everOwned) G.everOwned = {};
  Object.keys(G.collection||{}).forEach(id=>{ if ((G.collection[id]||0)>0) G.everOwned[id] = true; });
  // 청소부 방별 분리 마이그레이션 — 기존 G.cleaner는 본관 청소부로 승계
  if (G.cleaner && !G.cleanerMain){ G.cleanerMain = G.cleaner; }
  if (typeof G.cleanerMain==='undefined') G.cleanerMain = null;
  if (typeof G.cleanerAnnex==='undefined') G.cleanerAnnex = null;
  // 평판 초기치 50으로 상향 + 청결 정리 — 기존 세이브에 1회 마이그레이션
  if (!G.repCleanBumpV2){
    if ((G.reputation||0) < 50) G.reputation = 50;
    G.dirtLevel = Math.max(0, (G.dirtLevel||0) * 0.5);
    G.repCleanBumpV2 = true;
  }
  recomputeStarPrestige();
  recomputeDex();
  return d;
}

// ── 별 상점 ──
const STAR_ITEMS=[
  { id:'income', name:'수익 강화',   what:'판매 수익', per:5, base:30 },
  { id:'speed',  name:'방문 강화',   what:'손님 이동', per:4, base:40 },
  { id:'xp',     name:'경험치 강화', what:'XP 획득',   per:6, base:25 },
];
function starCost(it){ return Math.floor(it.base*Math.pow(1.35,G.starUpg[it.id])); }
function openStarShop(){
  closePanel(false); curPanel='star';
  renderStarPanel();
  requestAnimationFrame(()=>document.getElementById('panel-star').classList.add('open'));
}
function renderStarPanel(){
  const items=STAR_ITEMS.map(it=>{
    const cost=starCost(it), lv=G.starUpg[it.id];
    return `<div class="gem-item">
      <div class="gem-info"><div class="gem-name">${it.name} <span style="color:#b06a18">Lv${lv}</span></div>
        <div class="gem-desc">${it.what} 영구 <b style="color:#2e7d32">+${lv*it.per}%</b> · 구매 시 +${it.per}%</div></div>
      <button class="gem-btn star-btn" ${G.stars<cost?'disabled':''} onclick="buyStarItem('${it.id}')">⭐ ${cost}</button>
    </div>`;
  }).join('');
  // 별관 해금 — Lv20 이상에서만 표시
  const annex = G.level>=20 ? `<div class="sc-section-title" style="margin-top:12px">매장 확장</div>
    <div class="gem-item">
      <div class="gem-info"><div class="gem-name">별관 해금 ${G.annexUnlocked?'<span class="hire-badge">완료</span>':''}</div>
        <div class="gem-desc">새 진열대 4개(레어·에픽·레전드×2) 영역 추가 · 좌측 버튼으로 이동</div></div>
      <button class="gem-btn star-btn" ${G.annexUnlocked||G.stars<30?'disabled':''} onclick="unlockAnnex()">${G.annexUnlocked?'해금됨':'⭐ 30'}</button>
    </div>` : '';
  const pres=`<div class="sc-section-title" style="margin-top:12px">프레스티지 (환생)</div>
    <div class="gem-item">
      <div class="gem-info"><div class="gem-name">매장 환생 · ${G.prestige}회</div>
        <div class="gem-desc">Lv20 달성 시 매장(돈·레벨·진열대·업그레이드)을 리셋하고 영구 수익 배수를 얻습니다. 현재 배수 ×${prestigeMulti.toFixed(1)}</div></div>
      <button class="gem-btn" ${canPrestige()?'':'disabled'} onclick="confirmPrestige()">${canPrestige()?'환생하기':'Lv20 필요'}</button>
    </div>`;
  // 프레스티지 트리 — 환생 포인트로 영구 보너스 구매
  const avail = prestigePointsAvail();
  const tree = `<div class="sc-section-title" style="margin-top:14px">환생 트리 · 사용 가능 포인트 <b style="color:#bb3b2d">${avail}</b></div>
    ${PRESTIGE_UPG.map(u=>{
      const lv = (G.prestigeUpg && G.prestigeUpg[u.id]) || 0;
      return `<div class="gem-item">
        <div class="gem-info"><div class="gem-name">${u.name} <span style="color:#b06a18">Lv${lv}</span></div>
          <div class="gem-desc">${u.desc} · 단계당 ${u.per}</div></div>
        <button class="gem-btn" ${avail<=0?'disabled':''} onclick="buyPrestigeUpg('${u.id}')">1 포인트</button>
      </div>`;
    }).join('')}
    <div class="gem-note">환생 1회 = 1 포인트 획득. 트리 보너스는 영구 적용·환생 후에도 유지</div>`;
  document.getElementById('star-body').innerHTML=
    `<div class="gem-balance">보유 별 <b style="color:#f2a007">${G.stars}</b></div>`+
    items + annex + pres + tree +
    `<div class="gem-note">별은 카드 판매마다 1개씩 모여요</div>`;
}
function buyStarItem(id){
  const it=STAR_ITEMS.find(x=>x.id===id);
  if (!it) return;
  const cost=starCost(it);
  if (G.stars<cost){ notice('별이 부족합니다'); return; }
  G.stars-=cost; G.starUpg[id]++;
  recomputeStarPrestige();
  updateHUD(); renderStarPanel(); sfxBuy(); saveGame();
}

// ── 진열 팩 변경 기능 해금 안내 (Lv10 1회) ──
function showPackChangeIntro(){
  if (G.packChangeUnlockSeen) return;
  G.packChangeUnlockSeen = true;
  saveGame();
  document.getElementById('pack-change-intro').classList.add('show');
}
function closePackChangeIntro(){
  document.getElementById('pack-change-intro').classList.remove('show');
}

// ── 별관 해금 안내 (Lv20 1회) ──
function showAnnexIntro(){
  if (G.annexIntroSeen || G.annexUnlocked) return;
  G.annexIntroSeen = true;
  saveGame();
  document.getElementById('annex-intro').classList.add('show');
}
function closeAnnexIntro(){
  document.getElementById('annex-intro').classList.remove('show');
}
function openStarFromAnnexIntro(){
  closeAnnexIntro();
  if (typeof openStarShop==='function') openStarShop();
}

// ── 프레스티지 ──
function canPrestige(){ return G.level>=30; }
// Lv30 도달 시 1회 환생 시스템 소개 팝업
function showPrestigeIntro(){
  if (G.prestigeIntroSeen) return;
  G.prestigeIntroSeen = true;
  saveGame();
  document.getElementById('prestige-intro').classList.add('show');
}
function closePrestigeIntro(){
  document.getElementById('prestige-intro').classList.remove('show');
}
function openStarFromIntro(){
  closePrestigeIntro();
  if (typeof openStarShop==='function') openStarShop();
}
// Lv50 환생 권유 팝업
function showPrestigeLv50(){
  if (G.prestige50Seen) return;
  G.prestige50Seen = true; saveGame();
  document.getElementById('prestige-lv50').classList.add('show');
}
function closePrestigeLv50(){
  document.getElementById('prestige-lv50').classList.remove('show');
}
function openStarFromLv50(){
  closePrestigeLv50();
  if (typeof openStarShop==='function') openStarShop();
}
function confirmPrestige(){
  if (!canPrestige()) return;
  document.getElementById('prestige-confirm').classList.add('show');
}
function closePrestigeConfirm(){
  document.getElementById('prestige-confirm').classList.remove('show');
}
function confirmedPrestige(){
  closePrestigeConfirm();
  doPrestige();
}
// 프레스티지 트리 정의
const PRESTIGE_UPG = [
  { id:'startMoney',  name:'시작 자금',     per:'$50K',     desc:'환생 후 시작 자금 +50K' },
  { id:'gemBonus',    name:'다이아 보너스', per:'+10%',     desc:'판매로 얻는 다이아 +10%' },
  { id:'shelfBonus',  name:'시작 재고',     per:'+15%',     desc:'환생 후 모든 진열대 +15% 가득' },
  { id:'popFloor',    name:'인기 하한',     per:'+0.05',    desc:'인기도 최저 +0.05 (방치 시 손님↑)' },
];
function prestigePointsSpent(){
  const u = G.prestigeUpg || {};
  return (u.startMoney||0)+(u.gemBonus||0)+(u.shelfBonus||0)+(u.popFloor||0);
}
function prestigePointsAvail(){ return Math.max(0, (G.prestige||0) - prestigePointsSpent()); }
function buyPrestigeUpg(id){
  if (prestigePointsAvail()<=0){ notice('환생 포인트가 부족합니다 (1포인트=1회 환생)'); return; }
  if (!G.prestigeUpg) G.prestigeUpg = { startMoney:0, gemBonus:0, shelfBonus:0, popFloor:0 };
  G.prestigeUpg[id] = (G.prestigeUpg[id]||0) + 1;
  notice('영구 보너스 강화: '+(PRESTIGE_UPG.find(u=>u.id===id)?.name||''));
  sfxLevelUp(); updateHUD(); saveGame();
  if (curPanel==='star') renderStarPanel();
}

function doPrestige(){
  if (!canPrestige()) return;
  G.prestige++;
  // 프레스티지 트리 적용: 시작 자금
  const upg = G.prestigeUpg || {};
  const startMoney = 500 + (upg.startMoney||0) * 50000;
  G.money=startMoney; G.level=1; G.xp=0; G.xpNeeded=xpForLevel(1); G.totalSales=0;
  priceMulti=1; speedMulti=1; autoRestock=false;
  spawnInterval=2600; checkoutTime=1200;
  const baseMax={basic:100,rare:50,epic:30,legend:20};
  const stockBonus = 1 + (upg.shelfBonus||0)*0.15;
  shelves.forEach((s,i)=>{
    s.maxStock=baseMax[s.packId];
    s.stock=Math.min(s.maxStock, Math.floor((i===0?50:s.maxStock*0.5) * stockBonus));
    s.level=1;
    s.price=pack(s.packId).sellPrice;
  });
  upgrades.forEach(u=>{ u.level=(u.id==='auto_restock'?0:1); });
  showcaseSlots.forEach((_,i)=>{ showcaseSlots[i]=null; });
  customers.length=0; qline.length=0; qline_annex.length=0;
  recomputeStarPrestige();
  updateHUD(); closePanel(); saveGame();
  notice(`프레스티지 ${G.prestige}회! 영구 수익 ×${prestigeMulti.toFixed(1)}`);
  sfxLevelUp();
}

// ── 튜토리얼 ──
// {coin} {gem} {bolt} {star} {gear} {heart} {clean} 토큰은 HTML 아이콘으로 치환됨
const TUT_BOLT_SVG  = '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="#facc15" stroke="#a16207" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const TUT_GEAR_SVG  = '<svg viewBox="0 0 24 24"><path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-1.7-1L15 3.5h-4l-.3 2.5a7.5 7.5 0 0 0-1.7 1L6.6 6 4.6 9.5 6.6 11a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.5z" fill="#94a3b8" stroke="#475569" stroke-width="1.4"/><circle cx="13" cy="12" r="2.6" fill="#475569"/></svg>';
const TUT_HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.4-9.1C.8 8.5 2.6 4.5 6.3 4.5c2 0 3.6 1.1 4.7 2.8C12.1 5.6 13.7 4.5 15.7 4.5c3.7 0 5.5 4 3.7 7.4C19 16.5 12 21 12 21z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const TUT_CLEAN_SVG = '<svg viewBox="0 0 24 24"><path d="M14 3l4 4-9 9-4 1 1-4z" fill="#a78bfa" stroke="#4c1d95" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 21l3-1" stroke="#22d3ee" stroke-width="1.8" stroke-linecap="round"/><path d="M19 5l1-2M17 3l-1 2M21 8l2-1" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"/></svg>';
// 카드 배틀 테이블 미니 일러스트 — 게임 내 drawBattleTable 디자인을 미러
const TUT_BATTLE_SVG = '<svg viewBox="0 0 24 16">'
  +'<rect x="1" y="2" width="22" height="11" rx="1.5" fill="#a66a3d" stroke="#6b4226" stroke-width="0.8"/>'
  +'<rect x="2.5" y="3.5" width="19" height="7" rx="1" fill="#1d6b3f"/>'
  +'<rect x="4" y="4.5" width="4.5" height="6" rx="0.6" fill="#f4e4c1" stroke="#6b4226" stroke-width="0.4"/>'
  +'<rect x="15.5" y="4.5" width="4.5" height="6" rx="0.6" fill="#f4e4c1" stroke="#6b4226" stroke-width="0.4"/>'
  +'<rect x="4.8" y="5.2" width="3" height="4.6" fill="#bb3b2d"/>'
  +'<rect x="16.2" y="5.2" width="3" height="4.6" fill="#bb3b2d"/>'
  +'<rect x="0" y="11.5" width="2" height="3.5" fill="#6b4226"/>'
  +'<rect x="22" y="11.5" width="2" height="3.5" fill="#6b4226"/>'
  +'</svg>';
function tutIc(key){
  const sv =
    key==='coin'   ? ICONS.coin :
    key==='gem'    ? ICONS.gem  :
    key==='star'   ? ICONS.star :
    key==='bolt'   ? TUT_BOLT_SVG :
    key==='gear'   ? TUT_GEAR_SVG :
    key==='heart'  ? TUT_HEART_SVG :
    key==='clean'  ? TUT_CLEAN_SVG :
    key==='battle' ? TUT_BATTLE_SVG : '';
  const cls = key==='battle' ? 'tut-ic tut-ic-wide' : 'tut-ic';
  return `<span class="${cls}">${sv}</span>`;
}
function tutFmt(text){
  return text.replace(/\{(coin|gem|star|bolt|gear|heart|clean|battle)\}/g, (_,k)=>tutIc(k));
}
const TUTORIAL_STEPS=[
  // 1. 환영
  { text:'{shop}에 오신 걸 환영합니다! 손님에게 카드팩을 팔아 돈을 벌어요.' },
  // 2. 진열대 운영 (재고 + 가격조절 + 레벨업)
  { text:'<b>진열대 운영</b><br>'
       + '하단 [재고]로 진열대에 카드팩을 채우세요.<br>'
       + '진열대를 탭하면 <b>판매 가격</b>을 조절할 수 있고, 가격 패널 아래 [진열대 레벨업]으로 수익·재고를 키울 수 있어요.' },
  // 3. 카드 뽑기 + 전시
  { text:'[뽑기]로 카드를 모으고, 카운터 위 전시대에 올려 추가 수익을 내보세요. 도감에서 중복 카드는 판매·등급별 정렬 가능.' },
  // 4. 평판 + 청결 (통합)
  { text:'{heart} <b>평판</b> & {clean} <b>청결</b>은 손님 방문에 영향을 줘요.<br>'
       + '<span class="tut-up">▲ 오름</span> 판매·청결한 매장·점검관 좋은 평가<br>'
       + '<span class="tut-dn">▼ 떨어짐</span> 품절·실망 손님·더러운 매장<br>'
       + '우측 하단 평판 배지(▸)를 탭하면 손님 리뷰를 볼 수 있어요.' },
  // 5. 청소부 + 점검관 (통합)
  { text:'<b>매장 관리 도우미</b><br>'
       + '시간이 지나면 쓰레기가 생겨요 — [고용] 탭에서 <b>청소부</b>를 고용하면 자동 청소! (본관·별관 따로)<br>'
       + '가끔 본사 <b>점검관</b>(OLIVIA·WILLIAM)이 들러요. 품절·청결을 잘 관리하면 평판 +5!' },
  // 6. 광고 보상
  { text:'좌측 하단에 광고 보상 버튼({coin}·{gem}·{bolt})이 가끔 등장해요. 시청하면 골드·다이아·손님 폭주 버프를 받아요.' },
  // 7. 별 + 다이아 상점 (통합, 둘 다 글로우)
  { text:'{star} <b>별 상점·프레스티지</b> & {gem} <b>다이아 상점</b><br>'
       + '화면 위쪽 노란 별·보라 다이아 아이콘을 누르면 각각 상점이 열려요! (지금 반짝이는 곳)', hl:['star','gem'] },
  // 8. 별관 + 환생 (통합)
  { text:'<div class="tut-hero">{battle}</div>'
       + '<b>Lv20 도달 시 [별관]이 해금돼요!</b><br>'
       + '손님들이 1:1로 <b>카드 배틀</b>을 벌이는 공간 — 테이블 6개 + 카드팩 진열대 3개.<br>'
       + '<b>Lv30 도달 시 [환생]</b>이 해금돼요 — 영구 수익 보너스를 얻으며 새 게임을 시작할 수 있습니다.' },
  // 9. 설정
  { text:'우측 상단 {gear} 버튼으로 음량·알림·통계·테마를 설정할 수 있어요. 자, 시작해 볼까요!' },
];
let tutorialStep=0;
// 최초 1회 — 샵 이름 + 점원 선택
let pendingClerk='man_staff';
function showNameEntry(){
  pendingClerk = (G.clerk && STAFF_CHOICES.indexOf(G.clerk)>=0) ? G.clerk : 'man_staff';
  selectClerk(pendingClerk);
  const ov=document.getElementById('name-entry');
  ov.classList.add('show');
  const inp=document.getElementById('ne-input');
  setTimeout(()=>inp.focus(), 120);
  inp.onkeydown=(e)=>{ if (e.key==='Enter') submitShopName(); };
}
function selectClerk(c){
  if (STAFF_CHOICES.indexOf(c)<0) c='man_staff';
  pendingClerk = c;
  document.querySelectorAll('.ne-clerk-btn').forEach(btn=>{
    btn.classList.toggle('selected', btn.getAttribute('data-id')===c);
  });
}
function submitShopName(){
  const v=(document.getElementById('ne-input').value||'').trim();
  if (!v){ notice('샵 이름을 입력해 주세요'); return; }
  G.shopName=v.slice(0,22);
  G.clerk=pendingClerk;
  saveGame();
  document.getElementById('name-entry').classList.remove('show');
  if (!G.tutorialDone) showTutorial();
}

function showTutorial(){
  tutorialStep=0;
  document.getElementById('tutorial-overlay').classList.add('show');
  renderTutorialStep();
}
function setTutGlow(which){
  // which: undefined | 'star' | 'gem' | ['star','gem']
  const arr = Array.isArray(which) ? which : (which ? [which] : []);
  document.getElementById('hud-star').classList.toggle('tut-glow', arr.indexOf('star')>=0);
  document.getElementById('hud-gem').classList.toggle('tut-glow', arr.indexOf('gem')>=0);
}
function renderTutorialStep(){
  const s=TUTORIAL_STEPS[tutorialStep];
  const raw = s.text.replace(/\{shop\}/g, G.shopName||'몬스터 카드샵');
  document.getElementById('tutorial-text').innerHTML = tutFmt(raw);
  const isLast = tutorialStep>=TUTORIAL_STEPS.length-1;
  document.getElementById('tutorial-btn').textContent = isLast ? '시작하기' : '다음 ▶';
  document.getElementById('tutorial-step').textContent=`${tutorialStep+1} / ${TUTORIAL_STEPS.length}`;
  document.getElementById('tutorial-skip').style.display = isLast ? 'none' : '';
  setTutGlow(s.hl);
}
function tutorialNext(){
  tutorialStep++;
  if (tutorialStep>=TUTORIAL_STEPS.length){
    document.getElementById('tutorial-overlay').classList.remove('show');
    setTutGlow(null);
    G.tutorialDone=true; saveGame();
  } else renderTutorialStep();
}
function tutorialSkip(){
  document.getElementById('tutorial-overlay').classList.remove('show');
  setTutGlow(null);
  G.tutorialDone=true; saveGame();
}

function fmt(n){
  if (n>=1e33) return '$'+(n/1e33).toFixed(1)+'De';  // Decillion
  if (n>=1e30) return '$'+(n/1e30).toFixed(1)+'No';  // Nonillion
  if (n>=1e27) return '$'+(n/1e27).toFixed(1)+'Oc';  // Octillion
  if (n>=1e24) return '$'+(n/1e24).toFixed(1)+'Sp';  // Septillion
  if (n>=1e21) return '$'+(n/1e21).toFixed(1)+'Sx';  // Sextillion
  if (n>=1e18) return '$'+(n/1e18).toFixed(1)+'Qi';  // Quintillion
  if (n>=1e15) return '$'+(n/1e15).toFixed(1)+'Qa';  // Quadrillion
  if (n>=1e12) return '$'+(n/1e12).toFixed(1)+'T';
  if (n>=1e9)  return '$'+(n/1e9).toFixed(1)+'B';
  if (n>=1e6)  return '$'+(n/1e6).toFixed(1)+'M';
  if (n>=1e3)  return '$'+(n/1e3).toFixed(1)+'K';
  return '$'+Math.floor(n);
}

function updateHUD(){
  document.getElementById('money-display').textContent=fmt(G.money);
  document.getElementById('stars-display').textContent=G.stars;
  document.getElementById('gems-display').textContent=G.gems;
  const lv=document.getElementById('level-display');
  if (lv) lv.textContent=G.level;
  // stat-strip
  const repEl=document.getElementById('ss-rep-val');
  if (repEl) repEl.textContent=Math.round(G.reputation||0);
  const cleanEl=document.getElementById('ss-clean-val');
  if (cleanEl) cleanEl.textContent=Math.max(0,100-Math.round(G.dirtLevel||0));
  const custWrap=document.getElementById('ss-cust-wrap');
  if (custWrap){
    const mainN=customers.filter(c=>c.room==='main').length;
    if (G.annexUnlocked){
      const annexN=customers.filter(c=>c.room==='annex').length;
      custWrap.innerHTML=`<span class="sstat">🏠 본관 <b>${mainN}</b>명</span><span class="sstat-sep">|</span><span class="sstat">🏪 별관 <b>${annexN}</b>명</span>`;
    } else {
      custWrap.innerHTML=`<span class="sstat">👥 손님 <b>${mainN}</b>명</span>`;
    }
  }
}
function openNotice(){
  document.getElementById('notice-modal').classList.add('show');
}
function closeNotice(){
  document.getElementById('notice-modal').classList.remove('show');
}

function addXP(n){
  G.xp += n*starXpMul;
  while (G.xp>=G.xpNeeded){
    G.xp-=G.xpNeeded; G.level++;
    G.xpNeeded=xpForLevel(G.level);
    const lvGems = G.level*2;
    G.gems += lvGems; G.gemsEarnedTotal = (G.gemsEarnedTotal||0)+lvGems;   // 레벨업 다이아 보너스
    showLevelUp(); sfxLevelUp();
    spawnInterval=Math.max(680,spawnInterval*0.93);
    boostPopularity(0.12);
    updateHUD();
    // Lv10 — 진열 팩 변경 기능 해금 안내 (1회)
    if (G.level===10 && !G.packChangeUnlockSeen){
      setTimeout(showPackChangeIntro, 1400);
    }
    // Lv20 — 별관 안내 (1회)
    if (G.level===20 && !G.annexIntroSeen && !G.annexUnlocked){
      setTimeout(showAnnexIntro, 1400);
    }
    // Lv30 — 환생 소개 (1회)
    if (G.level>=30 && !G.prestigeIntroSeen){
      setTimeout(showPrestigeIntro, 3200);
    }
    // Lv50 — 환생 강력 권유 (1회)
    if (G.level===50 && !G.prestige50Seen){
      setTimeout(showPrestigeLv50, 2000);
    }
  }
}

function showLevelUp(){
  const b=document.getElementById('levelup-banner');
  b.textContent=`LEVEL UP!  Lv ${G.level}`;
  b.classList.add('show');
  setTimeout(()=>b.classList.remove('show'),2200);
}

// ── 일일 출석 보상 ──
const DAILY_REWARDS = [
  { type:'gems',  amt:5,      label:'다이아 5' },
  { type:'money', amt:10000,  label:'$10K' },
  { type:'gems',  amt:10,     label:'다이아 10' },
  { type:'money', amt:50000,  label:'$50K' },
  { type:'gems',  amt:20,     label:'다이아 20' },
  { type:'money', amt:200000, label:'$200K' },
  { type:'gems',  amt:50,     label:'다이아 50 ★' },
];
function todayStr(){
  const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function dayDiff(a,b){
  const ta=new Date(a).getTime(), tb=new Date(b).getTime();
  return Math.round((tb-ta)/(86400*1000));
}
function checkDaily(){
  const today = todayStr();
  if (G.lastDailyClaim === today) return;
  // 연속 끊겼는지 체크 — 1일 차이면 연속 유지, 그 외엔 리셋
  const diff = G.lastDailyClaim ? dayDiff(G.lastDailyClaim, today) : 99;
  if (diff !== 1) G.dailyStreak = 0;   // 첫 출석 or 끊김
  showDailyReward();
}
function showDailyReward(){
  const grid = document.getElementById('dr-grid');
  const dayIdx = (G.dailyStreak||0) % 7;
  grid.innerHTML = DAILY_REWARDS.map((r,i)=>{
    const cls = i===dayIdx ? 'dr-today' : (i<dayIdx ? 'dr-past' : '');
    const icon = r.type==='gems' ? '💎' : '$';
    return `<div class="dr-day ${cls}">
      <div class="dr-d">DAY ${i+1}</div>
      <div class="dr-i">${icon}</div>
      <div class="dr-l">${r.label}</div>
    </div>`;
  }).join('');
  document.getElementById('dr-streak').textContent = (G.dailyStreak||0)+1;
  document.getElementById('daily-reward').classList.add('show');
}
function claimDaily(){
  const dayIdx = (G.dailyStreak||0) % 7;
  const r = DAILY_REWARDS[dayIdx];
  if (r.type==='gems'){ G.gems += r.amt; G.gemsEarnedTotal = (G.gemsEarnedTotal||0)+r.amt; }
  else if (r.type==='money') G.money += r.amt;
  G.dailyStreak = (G.dailyStreak||0)+1;
  G.lastDailyClaim = todayStr();
  document.getElementById('daily-reward').classList.remove('show');
  notice(`출석 보상: ${r.label} 받기 완료`);
  sfxLevelUp(); updateHUD(); saveGame();
}

// 알림 큐 — 빠른 연속 이벤트도 순차적으로 모두 표시
const noticeQueue = [];
let noticeShowing = false;
function notice(msg){
  // 중복 메시지가 연속으로 큐에 들어가는 것 방지
  if (noticeQueue.length && noticeQueue[noticeQueue.length-1]===msg) return;
  noticeQueue.push(msg);
  if (!noticeShowing) showNextNotice();
}
function showNextNotice(){
  if (noticeQueue.length===0){ noticeShowing=false; return; }
  noticeShowing=true;
  const el=document.getElementById('notice-box');
  el.textContent = noticeQueue.shift();
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(()=>{
    el.style.opacity = '0';
    setTimeout(showNextNotice, 350);   // 페이드 후 다음 메시지
  }, 1700);
}

function checkGoals(){
  recomputeDex();
  goals.forEach(g=>{
    if (g.done) return;
    const v=g.stat==='collectionSize'?colSize():G[g.stat];
    if (v>=g.target){ g.done=true; notice(`목표 달성: ${g.name}`); }
  });
}

// ══════════════════════════════════════════════════════════
//  ACTIONS
// ══════════════════════════════════════════════════════════
function restockShelf(idx,amount){
  const s=shelves[idx];
  const p=pack(s.packId);
  const actual=Math.min(amount,s.maxStock-s.stock);
  if (actual<=0){ notice('진열대가 가득 찼습니다'); return; }
  const cost=effectiveBuyPrice(p)*actual;
  if (G.money<cost){ notice('돈이 부족합니다'); return; }
  G.money-=cost; s.stock+=actual;
  // 재고 보충은 매장 청소 효과도 약간 (먼지 감소)
  G.dirtLevel = Math.max(0, (G.dirtLevel||0) - 8);
  boostPopularity(0.22); sfxBuy();
  updateHUD(); renderRestockPanel();
}

function doAutoRestock(){
  shelves.forEach(s=>{
    if (G.level>=s.unlockLv && s.stock<s.maxStock*0.5){
      const p=pack(s.packId), need=s.maxStock-s.stock, cost=effectiveBuyPrice(p)*need;
      if (G.money>=cost){ G.money-=cost; s.stock=s.maxStock; }
    }
  });
  updateHUD();
}

// 현금 결제 항목 (IAP)
let pendingCashId = null;
function openCashPurchase(id){
  const u = upg(id);
  if (!u || !u.cash) return;
  if (u.level>=u.maxLevel){ notice('이미 구매했어요'); return; }
  pendingCashId = id;
  document.getElementById('cc-title').textContent = u.name;
  document.getElementById('cc-price-num').textContent = u.cash.toLocaleString();
  document.getElementById('cash-confirm').classList.add('show');
}
function closeCashConfirm(){
  document.getElementById('cash-confirm').classList.remove('show');
  pendingCashId = null;
}
// 결제 진행 — Capacitor 앱은 RevenueCat 실결제, 웹은 confirm 다이얼로그 폴백
async function cashPurchaseTestActivate(){
  const id = pendingCashId;
  closeCashConfirm();
  if (!id) return;
  const u = upg(id);
  if (!u || u.level>=u.maxLevel) return;

  notice('결제 진행 중...');

  // Platform 브릿지 호출 — 앱에서는 RevenueCat, 웹에서는 confirm 다이얼로그
  const ok = window.Platform
    ? await window.Platform.purchaseProduct(id)
    : confirm('[웹 폴백] 테스트 활성화하시겠습니까?');

  if (!ok){
    // 사용자 취소 또는 결제 실패 — 아무 변화 없음
    return;
  }

  // 결제 성공 — 영구 활성화
  u.level++;
  if (id==='auto_restock'){ autoRestock = true; }
  notice(u.name + ' 활성화 완료!');
  sfxIAP(); updateHUD(); renderUpgradePanel(); saveGame();
}

// 결제 복원 — 기기 변경/재설치 후 영수증 복구 (설정에서 호출용)
async function restoreIAP(){
  if (!window.Platform || !window.Platform.IS_CAPACITOR){
    notice('앱에서만 사용 가능합니다');
    return;
  }
  notice('구매 내역 복원 중...');
  const ents = await window.Platform.restorePurchases();
  if (!ents){ notice('복원 실패'); return; }
  // entitlements에 따라 업그레이드 재적용
  // RevenueCat 콘솔에서 entitlement 식별자를 'auto_restock'으로 설정해두면 자동 매칭
  Object.keys(ents).forEach(key=>{
    const u = upg(key);
    if (u && u.level<u.maxLevel){
      u.level = u.maxLevel;
      if (key==='auto_restock') autoRestock = true;
    }
  });
  saveGame(); updateHUD();
  notice('복원 완료');
}

function buyUpgrade(id){
  const u=upg(id);
  if (!u||u.level>=u.maxLevel) return;
  if (u.cash){ openCashPurchase(id); return; }   // 현금 결제 항목은 별도 다이얼로그로
  const cost=upgCost(u);
  if (G.money<cost){ notice('돈이 부족합니다'); return; }
  G.money-=cost; u.level++;
  if (id==='customer_speed'){ speedMulti*=1.1; spawnInterval=Math.max(680,spawnInterval*0.92); }
  if (id==='checkout_speed') checkoutTime=Math.max(450,checkoutTime*0.90);
  if (id==='sell_price') priceMulti*=1.1;
  if (id==='shelf_size') shelves.forEach(s=>{ s.maxStock=Math.floor(s.maxStock*1.2); });
  if (id==='auto_restock'){ autoRestock=true; notice('자동 재고 활성화'); }
  boostPopularity(0.16); sfxBuy();
  updateHUD(); renderUpgradePanel();
}

// 뽑기 비용 — 재고 구매가와 분리, 레벨에 따라 상승해 매출과 균형 유지
const GACHA_BASE = { basic:3000, rare:30000, epic:300000, legend:3000000 };
function gachaCost(packId){
  return Math.floor((GACHA_BASE[packId]||3000) * Math.pow(1.15, Math.max(0,G.level-1)*2));
}
// 10연 할인 — 전 팩에 할인 적용
const GACHA_X10_MULT = { basic:7, rare:7, epic:5, legend:4 };
function gachaCost10(packId){
  const mult = GACHA_X10_MULT[packId] != null ? GACHA_X10_MULT[packId] : 10;
  return Math.floor(gachaCost(packId) * mult);
}
function pullGacha(packId){
  const p=pack(packId);
  const cost=gachaCost(packId);
  if (!p||G.money<cost){ notice('돈이 부족합니다'); return; }
  G.money-=cost; updateHUD();
  const roll=Math.random()*100, w=p.rw;
  let rarity;
  if (roll<w.legendary) rarity='legendary';
  else if (roll<w.legendary+w.epic) rarity='epic';
  else if (roll<100-w.common) rarity='rare';
  else rarity='common';
  const pool=CARDS.filter(c=>c.rarity===rarity);
  const card=pool[Math.floor(Math.random()*pool.length)];
  G.collection[card.id]=(G.collection[card.id]||0)+1; G.everOwned[card.id]=true;
  addXP(rarity==='legendary'?100:rarity==='epic'?45:rarity==='rare'?18:6);
  checkGoals();
  sfxGacha(); boostPopularity(0.16);
  showGachaResult(card,rarity);
}

function showGachaResult(card,rarity){
  const RC={legendary:'#f97316',epic:'#a78bfa',rare:'#fbbf24',common:'#94a3b8'};
  const RN={legendary:'LEGENDARY',epic:'EPIC',rare:'RARE',common:'COMMON'};
  const ov=document.getElementById('gacha-result');
  ov.innerHTML=`<div class="result-card" style="border-color:${RC[rarity]}">
    <img class="result-img" src="${card.sprite}" alt="">
    <div class="result-rarity" style="color:${RC[rarity]}">${RN[rarity]}</div>
    <div class="result-name">${card.name}</div>
    <div class="result-sub">보유 ${G.collection[card.id]}장</div>
  </div><button class="result-close" onclick="closeGacha()">확인</button>`;
  ov.classList.add('show');
}
function closeGacha(){
  document.getElementById('gacha-result').classList.remove('show');
  renderCollectionPanel();
}

function pullGacha10(packId){
  const p=pack(packId);
  if (!p||G.level<p.unlock){ notice('잠긴 팩입니다'); return; }
  const cost=gachaCost10(packId);
  if (G.money<cost){ notice('돈이 부족합니다'); return; }
  G.money-=cost; updateHUD();
  const results=[];
  for (let k=0;k<10;k++){
    const roll=Math.random()*100, w=p.rw;
    let rarity;
    if (roll<w.legendary) rarity='legendary';
    else if (roll<w.legendary+w.epic) rarity='epic';
    else if (roll<100-w.common) rarity='rare';
    else rarity='common';
    const pool=CARDS.filter(c=>c.rarity===rarity);
    const card=pool[Math.floor(Math.random()*pool.length)];
    G.collection[card.id]=(G.collection[card.id]||0)+1; G.everOwned[card.id]=true;
    addXP(rarity==='legendary'?100:rarity==='epic'?45:rarity==='rare'?18:6);
    results.push({card,rarity});
  }
  checkGoals(); sfxGacha(); boostPopularity(0.32);
  show10Result(results, packId);
  saveGame();
}
function show10Result(results, packId){
  const RC={legendary:'#f97316',epic:'#a78bfa',rare:'#fbbf24',common:'#94a3b8'};
  const ov=document.getElementById('gacha-result');
  const cards=results.map((res,i)=>`
    <div class="r10-card ${res.rarity}" style="animation-delay:${(i*0.08).toFixed(2)}s;border-color:${RC[res.rarity]}">
      <img class="r10-img" src="${res.card.sprite}" alt="">
      <div class="r10-name">${res.card.name}</div>
    </div>`).join('');
  const againBtn = packId
    ? `<button class="result-again" onclick="closeGacha();pullGacha10('${packId}')">×10 한번 더</button>`
    : '';
  ov.innerHTML=`<div class="r10-title">✨ 10연속 뽑기 결과 ✨</div>
    <div class="r10-grid">${cards}</div>
    <div class="r10-btns">${againBtn}<button class="result-close" onclick="closeGacha()">확인</button></div>`;
  ov.classList.add('show');
}

function applyGoalClaim(g){
  if (g.rtype==='money') G.money+=g.reward;
  if (g.rtype==='gems'){ G.gems+=g.reward; G.gemsEarnedTotal=(G.gemsEarnedTotal||0)+g.reward; }
  if (g.rtype==='stars') G.stars+=g.reward;
  // 다음 단계 목표 자동 생성 (무한)
  if (g.stat==='collectionSize' && g.target>=CARDS.length){
    g.claimed=true;            // 전 카드 수집 — 영구 완료
  } else {
    g.tier++;
    if (g.stat==='level')               g.target += 5;
    else if (g.stat==='collectionSize') g.target = Math.min(CARDS.length, g.target+4);
    else                                g.target = Math.ceil(g.target*g.scale);
    g.reward = Math.ceil(g.reward*g.scale);
    if (g.rtype==='gems') g.reward = Math.min(100, g.reward);
    g.done=false; g.claimed=false;
  }
}
function claimGoal(id){
  const g=goals.find(x=>x.id===id);
  if (!g||g.claimed||!g.done) return;
  applyGoalClaim(g);
  updateHUD(); checkGoals(); renderGoalsPanel(); notice('보상을 받았습니다'); sfxBuy();
}
function claimAllGoals(){
  const list=goals.filter(g=>g.done&&!g.claimed);
  if (!list.length){ notice('받을 보상이 없습니다'); return; }
  list.forEach(applyGoalClaim);
  updateHUD(); checkGoals(); renderGoalsPanel();
  notice(`${list.length}개 목표 보상 수령!`); sfxBuy(); saveGame();
}

// ── 가격 수정 (진열대 클릭) ──
let priceEditIdx = 0;
function openPricePanel(idx){
  priceEditIdx = idx;
  closePanel(false);
  curPanel = 'price';
  renderPricePanel();
  requestAnimationFrame(()=>document.getElementById('panel-price').classList.add('open'));
}
function shelfLvCost(s){ return Math.floor(pack(s.packId).sellPrice*25*Math.pow(1.55,((s.level||1)-1))); }
function levelUpShelf(){
  const s=shelves[priceEditIdx];
  const cost=shelfLvCost(s);
  if (G.money<cost){ notice('돈이 부족합니다'); return; }
  G.money-=cost;
  s.level=(s.level||1)+1;
  s.maxStock=Math.floor(s.maxStock*1.1);
  notice(`진열대 Lv${s.level} 달성!`);
  sfxBuy(); updateHUD(); renderPricePanel(); saveGame();
}
function renderPricePanel(){
  const s=shelves[priceEditIdx], p=pack(s.packId);
  const chance=Math.round(buyChance(s)*100);
  const effSell=effectiveSellPrice(p);
  const ratioPct=Math.round(s.price/effSell*100);
  const lvCost=shelfLvCost(s);
  const lvBonusPct=Math.round((effSell/p.sellPrice-1)*100);
  // 해금된 팩 목록 (현재 방 기준)
  const unlockedPacks = PACKS.filter(pk=> G.level>=pk.unlock);
  const packBtns = unlockedPacks.map(pk=>`
    <button class="pack-sel-btn${pk.id===s.packId?' active':''}" onclick="changeShelfPack('${pk.id}')">
      <img src="${pk.sprite}" alt="" style="width:22px;height:22px;image-rendering:pixelated;vertical-align:middle">
      ${pk.name}
    </button>`).join('');
  const allPackBtns = unlockedPacks.map(pk=>`
    <button class="pack-sel-btn pack-sel-all${pk.id===s.packId?' active':''}" onclick="changeAllShelvesPack('${pk.id}')">
      ${pk.name}
    </button>`).join('');
  document.getElementById('price-body').innerHTML=`
    <div class="price-head">
      <img class="price-img" src="${p.sprite}" alt="">
      <div class="price-head-info">
        <div class="price-name">${p.name}</div>
        <div class="price-base">팩 구매가 <b>${fmt(effectiveBuyPrice(p))}</b>  →  권장 판매가 <b>${fmt(effSell)}</b>${lvBonusPct>0?` <span style="color:#2e7d32">(Lv +${lvBonusPct}%)</span>`:''}</div>
        <div class="price-base price-base-now">현재 판매가 · 권장가의 <b>${ratioPct}%</b></div>
      </div>
    </div>
    ${G.level>=10?`
    <div class="price-section-title">■ 진열 팩 변경</div>
    <div class="pack-sel-row">${packBtns}</div>
    <div class="price-section-title" style="margin-top:6px">■ 본관 전체를 한 팩으로 교체</div>
    <div class="pack-sel-row">${allPackBtns}</div>`:''}
    <div class="price-section-title" style="margin-top:8px">■ 판매 가격 조절</div>
    <div class="price-stepper">
      <button class="step-btn" onpointerdown="startHold(()=>adjustPrice(-1))">−</button>
      <span class="price-val">${fmt(salePrice(s))}</span>
      <button class="step-btn" onpointerdown="startHold(()=>adjustPrice(1))">＋</button>
    </div>
    <div class="price-stepper" style="margin-top:-6px">
      <button class="price-all-btn" onclick="applyPriceToAll()">${p.name} 전체에 이 가격 일괄 적용</button>
    </div>
    <div class="price-rate">예상 구매율 <b>${chance}%</b></div>
    <div class="rate-bar"><div class="rate-fill" style="width:${chance}%"></div></div>
    <div class="price-note">가격 ↑ 판매당 이익은 크지만 구매율 ↓<br>가격 ↓ 구매율 ↑ 이익 ↓ — 적정선을 찾으세요</div>
    <div class="shelf-lv">
      <div class="price-section-title">■ 진열대 레벨업 (선택)</div>
      <div class="shelf-lv-top">진열대 <b>Lv ${s.level||1}</b> · 수익 <b style="color:#2e7d32">+${Math.round((shelfMul(s)-1)*100)}%</b> · 최대 재고 ${s.maxStock}</div>
      <button class="shelf-lv-btn" ${G.money<lvCost?'disabled':''} onclick="levelUpShelf()">
        레벨업 비용 — ${fmt(lvCost)}<span class="shelf-lv-eff">레벨당 수익 +12% · 재고 +10% (무한)</span>
      </button>
    </div>`;
}
function changeShelfPack(packId){
  const s=shelves[priceEditIdx];
  if (s.packId===packId) return;
  const newPack=pack(packId);
  if (!newPack || G.level<newPack.unlock){ notice('아직 해금되지 않은 팩입니다'); return; }
  s.packId=packId;
  s.price=newPack.sellPrice;
  s.stock=0;
  notice(`진열대를 ${newPack.name}으로 변경했습니다`);
  sfxBuy(); computeLayout(); renderPricePanel(); saveGame();
}
function changeAllShelvesPack(packId){
  const newPack=pack(packId);
  if (!newPack || G.level<newPack.unlock){ notice('아직 해금되지 않은 팩입니다'); return; }
  const room = shelves[priceEditIdx].room || 'main';
  let n=0;
  shelves.forEach(s=>{
    if (s.room===room && G.level>=s.unlockLv){
      s.packId=packId; s.price=newPack.sellPrice; s.stock=0; n++;
    }
  });
  notice(`${room==='annex'?'별관':'본관'} 진열대 ${n}개 → ${newPack.name}`);
  sfxBuy(); computeLayout(); renderPricePanel(); saveGame();
}
function adjustPrice(dir){
  const s=shelves[priceEditIdx], p=pack(s.packId);
  const effSell=effectiveSellPrice(p);
  const step=Math.max(10,Math.round(effSell*0.1));
  const lo=Math.max(10,Math.round(effSell*0.3)), hi=Math.round(effSell*3);
  s.price=Math.max(lo,Math.min(hi,s.price+dir*step));
  renderPricePanel();
}
function applyPriceToAll(){
  const s=shelves[priceEditIdx], p=pack(s.packId);
  let n=0;
  shelves.forEach(sh=>{ if (sh.packId===s.packId){ sh.price=s.price; n++; } });
  notice(`${p.name} ${n}곳에 ${fmt(s.price)} 일괄 적용`);
  sfxBuy(); saveGame();
}

// ── 다이아 상점 ──
const GEM_ITEMS = [
  { id:'restock_all', name:'재고 풀충전',   desc:'해금된 모든 진열대를 최대치로 채움' },
  { id:'premium',     name:'프리미엄 뽑기', desc:'레어 이상 카드 확정 뽑기',        cost:50 },
  { id:'legend_pull', name:'레전드 뽑기',   desc:'에픽~레전드 카드 (레전드 20%)',   cost:70 },
  { id:'gold_bag',    name:'골드 보따리',   desc:'레벨에 비례한 골드 즉시 지급',    cost:100 },
];
// 재고 풀충전 — 레벨에 따라 비용 상승
function restockAllCost(){
  if (G.level>=31) return 300;
  if (G.level>=21) return 200;
  if (G.level>=11) return 100;
  return 50;
}
function gemCost(it){ return it.id==='restock_all' ? restockAllCost() : it.cost; }
function openGemShop(){
  closePanel(false);
  curPanel='gem';
  renderGemPanel();
  requestAnimationFrame(()=>document.getElementById('panel-gem').classList.add('open'));
}
function renderGemPanel(){
  document.getElementById('gem-body').innerHTML =
    `<div class="gem-balance">보유 다이아 <b>${G.gems}</b></div>` +
    GEM_ITEMS.map(it=>{
      const cost=gemCost(it);
      return `
      <div class="gem-item">
        <div class="gem-info"><div class="gem-name">${it.name}</div>
          <div class="gem-desc">${it.desc}</div></div>
        <button class="gem-btn" ${G.gems<cost?'disabled':''} onclick="buyGemItem('${it.id}')">
          ${cost} 다이아</button>
      </div>`;
    }).join('') +
    `<div class="gem-note">다이아는 판매 10회마다 · 레벨업·도감 보상으로도 모여요</div>`;
}
function buyGemItem(id){
  const it=GEM_ITEMS.find(x=>x.id===id);
  if (!it) return;
  const cost=gemCost(it);
  if (G.gems<cost){ notice('다이아가 부족합니다'); return; }
  G.gems-=cost;
  if (id==='restock_all'){
    shelves.forEach(s=>{ if (G.level>=s.unlockLv) s.stock=s.maxStock; });
    notice('모든 재고를 채웠습니다');
  } else if (id==='premium'){
    const roll=Math.random();
    const rar = roll<0.10 ? 'legendary' : roll<0.40 ? 'epic' : 'rare';
    const pool = CARDS.filter(c=>c.rarity===rar);
    const card = pool[Math.floor(Math.random()*pool.length)];
    G.collection[card.id]=(G.collection[card.id]||0)+1; G.everOwned[card.id]=true;
    addXP(rar==='legendary'?30:rar==='epic'?15:8); checkGoals();
    showGachaResult(card,rar);
  } else if (id==='legend_pull'){
    const rar = Math.random()<0.20 ? 'legendary' : 'epic';
    const pool = CARDS.filter(c=>c.rarity===rar);
    const card = pool[Math.floor(Math.random()*pool.length)];
    G.collection[card.id]=(G.collection[card.id]||0)+1; G.everOwned[card.id]=true;
    addXP(rar==='legendary'?30:15); checkGoals();
    showGachaResult(card,rar);
  } else if (id==='gold_bag'){
    const amt=Math.floor(2000*Math.pow(1.6,Math.max(0,G.level-1)));
    G.money+=amt;
    notice('골드 보따리 +'+fmt(amt));
  }
  updateHUD(); renderGemPanel();
}

// ══════════════════════════════════════════════════════════
//  PANELS
// ══════════════════════════════════════════════════════════
let curPanel=null;
function openPanel(name){
  if (curPanel===name){ closePanel(); return; }
  closePanel(false); curPanel=name;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`[data-panel="${name}"]`)?.classList.add('active');
  ({restock:renderRestockPanel,upgrade:renderUpgradePanel,collection:renderCollectionPanel,
    gacha:renderGachaPanel,goals:renderGoalsPanel,price:renderPricePanel,gem:renderGemPanel,
    showcase:renderShowcasePanel,review:renderReviewPanel,hire:renderHirePanel,stats:renderStatsPanel})[name]?.();
  requestAnimationFrame(()=>document.getElementById(`panel-${name}`)?.classList.add('open'));
}
function closePanel(reset=true){
  if (!curPanel) return;
  document.getElementById(`panel-${curPanel}`)?.classList.remove('open');
  if (reset) document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  curPanel=null;
}

function renderRestockPanel(){
  // 본관 / 별관(해금 시) 섹션 구분
  function shelfRowHtml(s,i){
    const p=pack(s.packId), locked=G.level<s.unlockLv, bp=effectiveBuyPrice(p);
    return `<div class="restock-item">
      <img class="ri-img" src="${p.sprite}" alt="">
      <div class="ri-info"><div class="ri-name">${p.name}${locked?` <span style="color:#a0906a">Lv${s.unlockLv} 해금</span>`:''}</div>
        <div class="ri-stock">재고 ${s.stock}/${s.maxStock} · 구매 ${fmt(bp)}/개</div></div>
      <div class="ri-btns">
        <button class="restock-btn" ${locked||G.money<bp*10?'disabled':''} onclick="restockShelf(${i},10)">x10<br>${fmt(bp*10)}</button>
        <button class="restock-btn" ${locked||G.money<bp*50?'disabled':''} onclick="restockShelf(${i},50)">x50<br>${fmt(bp*50)}</button>
      </div></div>`;
  }
  const main = shelves.map((s,i)=>s.room==='main'?shelfRowHtml(s,i):'').join('');
  const annex = G.annexUnlocked ? shelves.map((s,i)=>s.room==='annex'?shelfRowHtml(s,i):'').join('') : '';
  document.getElementById('restock-body').innerHTML =
    `<div class="sc-section-title">■ 본관</div>${main}` +
    (annex ? `<div class="sc-section-title" style="margin-top:10px">■ 별관</div>${annex}` : '');
}

function renderUpgradePanel(){
  document.getElementById('upgrade-body').innerHTML = upgrades.map(u=>{
    const maxed=u.level>=u.maxLevel;
    // 현금 결제 항목
    if (u.cash){
      return `<div class="upgrade-item upgrade-cash">
        <div class="ui-header">
          <span class="ui-name"><span class="ico-sm">${ICONS[u.icon]}</span>${u.name} <span class="ui-cash-badge">현금</span></span>
          <span class="ui-level">${u.level>0?'활성':'비활성'}</span></div>
        <div class="ui-desc">${u.desc} · ${u.effect}<br><span style="color:#bb3b2d">실제 결제 항목 · 영구 적용</span></div>
        <button class="upgrade-btn upgrade-cash-btn" ${maxed?'disabled':''} onclick="openCashPurchase('${u.id}')">
          ${maxed?'구매 완료':`₩${u.cash.toLocaleString()} 구매`}</button>
      </div>`;
    }
    // 일반 골드 업그레이드
    const cost=maxed?null:upgCost(u);
    return `<div class="upgrade-item">
      <div class="ui-header">
        <span class="ui-name"><span class="ico-sm">${ICONS[u.icon]}</span>${u.name}</span>
        <span class="ui-level">Lv ${u.level}/${u.maxLevel}</span></div>
      <div class="ui-desc">${u.desc} · 한 단계 ${u.effect}<br>현재 누적 <b style="color:#2e7d32">${upgCurrent(u)}</b></div>
      <button class="upgrade-btn" ${maxed||G.money<cost?'disabled':''} onclick="buyUpgrade('${u.id}')">
        ${maxed?'최대 레벨':`업그레이드 ${fmt(cost)}`}</button>
    </div>`;
  }).join('');
}

function renderStatsPanel(){
  const playMin = Math.floor((G.playTime||0)/60000);
  const playH = Math.floor(playMin/60);
  const playRest = playMin%60;
  const sz = colSize();
  const completePct = Math.round(sz/CARDS.length*100);
  const rep = Math.round(G.reputation||0);
  const clean = Math.max(0, 100-Math.round(G.dirtLevel||0));
  const STATS = [
    { label:'샵 이름',          val: G.shopName||'(미설정)' },
    { label:'레벨',             val: 'Lv '+G.level },
    { label:'환생 횟수',         val: G.prestige+'회' },
    { label:'누적 판매',         val: fmt(G.totalSales)+'회' },
    { label:'현재 자산',         val: fmt(G.money) },
    { label:'보유 다이아',       val: G.gems },
    { label:'누적 다이아 획득',  val: (G.gemsEarnedTotal||0)+'개' },
    { label:'보유 별',          val: G.stars },
    { label:'카드 도감',         val: sz+'/'+CARDS.length+'종 ('+completePct+'%)' },
    { label:'평판',             val: rep+'/100' },
    { label:'청결도',           val: clean+'/100' },
    { label:'플레이 시간',       val: (playH>0?playH+'시간 ':'')+playRest+'분' },
    { label:'연속 출석',         val: (G.dailyStreak||0)+'일' },
  ];
  document.getElementById('stats-body').innerHTML = `
    <div class="stats-title">${G.shopName||'카드샵'} 운영 현황</div>
    ${STATS.map(s=>`<div class="stat-row"><span class="stat-l">${s.label}</span><span class="stat-v">${s.val}</span></div>`).join('')}
  `;
}

function renderHirePanel(){
  const mainCnt = garbages.filter(g=>(g.room||'main')==='main').length;
  const annexCnt = garbages.filter(g=>g.room==='annex').length;
  const sectionHtml = (room)=>{
    const curId = getCleanerId(room);
    const cards = CLEANER_TIERS.map(t=>{
      const current = curId===t.id;
      const canAfford = G.money>=t.cost;
      const cleanSec = (t.cleanT/1000).toFixed(1);
      return `<div class="hire-card ${current?'hire-current':''}">
        <div class="hire-img-wrap"><img class="hire-img" src="assets/characters/${t.id}.png?v=3" alt=""></div>
        <div class="hire-info">
          <div class="hire-name">${t.name}${current?' <span class="hire-badge">고용중</span>':''}</div>
          <div class="hire-spec">이동속도 <b>${t.speed}px/s</b> · 청소시간 <b>${cleanSec}초</b></div>
        </div>
        <button class="hire-btn" ${current||!canAfford?'disabled':''} onclick="hireCleaner('${t.id}','${room}')">
          ${current?'고용 완료':fmt(t.cost)}
        </button>
      </div>`;
    }).join('');
    const title = room==='annex' ? '🏠 별관 청소부' : '🏠 본관 청소부';
    const cnt = room==='annex' ? annexCnt : mainCnt;
    return `<div class="hire-section">
      <div class="hire-sec-title">${title} <span class="hire-sec-cnt">쓰레기 ${cnt}개</span></div>
      ${cards}
    </div>`;
  };
  const annexBlock = G.annexUnlocked ? sectionHtml('annex') : `<div class="hire-section hire-locked">
    <div class="hire-sec-title">🔒 별관 청소부 — 별관 해금 후 고용 가능</div>
  </div>`;
  document.getElementById('hire-body').innerHTML = `
    <div class="hire-status">전체 쓰레기 <b>${mainCnt+annexCnt}개</b> · 청결 <b>${Math.max(0,100-Math.round(G.dirtLevel||0))}/100</b></div>
    <div class="hire-note">본관·별관 청소부는 따로 고용해야 해요. 각 청소부는 자기 방 쓰레기만 청소합니다.</div>
    ${sectionHtml('main')}
    ${annexBlock}
  `;
}
function hireCleaner(id, room){
  room = room || 'main';
  const tier = CLEANER_TIERS.find(t=>t.id===id);
  if (!tier) return;
  const curId = getCleanerId(room);
  if (curId===id){ notice('이미 고용 중입니다'); return; }
  if (G.money<tier.cost){ notice('돈이 부족합니다'); return; }
  if (curId){
    openHireConfirm(id, room);
    return;
  }
  finalizeHire(id, room);
}
function finalizeHire(id, room){
  room = room || 'main';
  const tier = CLEANER_TIERS.find(t=>t.id===id);
  if (!tier) return;
  if (G.money<tier.cost){ notice('돈이 부족합니다'); return; }
  G.money -= tier.cost;
  if (room==='annex') G.cleanerAnnex = id;
  else G.cleanerMain = id;
  cleanerEntities[room] = null;
  initCleaner(room);
  const where = room==='annex' ? '별관' : '본관';
  notice(`${where} ${tier.name} 고용 완료`);
  sfxBuy(); updateHUD(); renderHirePanel(); saveGame();
}
// 청소부 교체 팝업
let pendingHireId = null;
let pendingHireRoom = 'main';
function openHireConfirm(id, room){
  room = room || 'main';
  const newTier = CLEANER_TIERS.find(t=>t.id===id);
  const oldTier = CLEANER_TIERS.find(t=>t.id===getCleanerId(room));
  if (!newTier || !oldTier) return;
  pendingHireId = id; pendingHireRoom = room;
  const where = room==='annex' ? '별관' : '본관';
  document.getElementById('hc-title').textContent = where+' '+newTier.name+' 고용';
  document.getElementById('hc-old-img').src = 'assets/characters/'+oldTier.id+'.png?v=3';
  document.getElementById('hc-new-img').src = 'assets/characters/'+newTier.id+'.png?v=3';
  document.getElementById('hc-old-name').textContent = oldTier.name;
  document.getElementById('hc-new-name').textContent = newTier.name;
  document.getElementById('hc-cost-val').textContent = fmt(newTier.cost);
  document.getElementById('hire-confirm').classList.add('show');
}
function closeHireConfirm(){
  document.getElementById('hire-confirm').classList.remove('show');
  pendingHireId = null;
}
function confirmHire(){
  const id = pendingHireId;
  const room = pendingHireRoom;
  closeHireConfirm();
  if (!id) return;
  finalizeHire(id, room);
}

function renderReviewPanel(){
  const summary = `<div class="rev-summary">평판 <b>${Math.round(G.reputation||0)}/100</b> · 청결 <b>${Math.max(0,Math.round(100-(G.dirtLevel||0)))}/100</b> · 리뷰 ${reviews.length}건</div>`;
  if (!reviews.length){
    document.getElementById('review-body').innerHTML = summary + `<div class="rev-empty">아직 리뷰가 없어요. 손님이 다녀가면 여기에 후기가 쌓여요.</div>`;
    return;
  }
  const list = reviews.map(r=>{
    const cls = r.mood==='good' ? 'rev-good' : r.mood==='bad' ? 'rev-bad' : 'rev-meh';
    const ago = Math.max(0,Math.round((Date.now()-r.t)/1000));
    const agoTxt = ago<60 ? ago+'초 전' : ago<3600 ? Math.floor(ago/60)+'분 전' : Math.floor(ago/3600)+'시간 전';
    // 손님 캐릭터 이미지 — 캐릭터 파일이 없으면 fallback
    const validNames = ['children','company','Glass','grandma','maleStudent','universityStudent','DAVID','EMMA','LIAM','NOAH','SOPHIE','MIA','OLIVIA','WILLIAM'];
    const charName = validNames.indexOf(r.name)>=0 ? r.name : 'company';
    return `<div class="rev-item ${cls}">
      <div class="rev-avatar-wrap"><img class="rev-avatar" src="assets/characters/${charName}.png?v=3" alt=""></div>
      <div class="rev-body"><div class="rev-msg">${r.msg}</div><div class="rev-meta">${r.name} · ${agoTxt}</div></div>
    </div>`;
  }).join('');
  document.getElementById('review-body').innerHTML = summary + list;
}

let collectionSort = 'default';
function setCollectionSort(s){ collectionSort = s; renderCollectionPanel(); }
function renderCollectionPanel(){
  const owned=colSize();
  const dp=dexProgress();
  let dupTotal=0, dupValue=0;
  CARDS.forEach(c=>{ const n=(G.collection[c.id]||0)-1; if(n>0){ dupTotal+=n; dupValue+=n*cardSellValue(c); } });
  const RBON=[
    {r:'common',    txt:'판매 수익 +15%'},
    {r:'rare',      txt:'손님 방문 +15%'},
    {r:'epic',      txt:'계산 속도 +15%'},
    {r:'legendary', txt:'다이아 2배'},
  ];
  const milestones = RBON.map(b=>{
    const done=dp.got[b.r]>=dp.tot[b.r];
    return `<div class="dex-ms ${b.r}${done?' dex-ms-on':''}">
      <span class="dex-ms-p">${dp.got[b.r]}/${dp.tot[b.r]}</span>
      <span class="dex-ms-t">${b.txt}</span>
      <span class="dex-ms-c">${done?'✓':''}</span></div>`;
  }).join('');
  const allDone = owned>=CARDS.length;
  const sellBtn = dupTotal>0
    ? `<button class="dex-sellall" onclick="sellAllDuplicates()">중복 ${dupTotal}장 전체 판매  +${fmt(dupValue)}</button>`
    : '';
  // 정렬
  const rarityRank = { legendary:0, epic:1, rare:2, common:3 };
  const sorted = CARDS.slice();
  if (collectionSort==='rarity-desc'){
    sorted.sort((a,b)=> rarityRank[a.rarity] - rarityRank[b.rarity]);
  } else if (collectionSort==='rarity-asc'){
    sorted.sort((a,b)=> rarityRank[b.rarity] - rarityRank[a.rarity]);
  } else if (collectionSort==='count-desc'){
    sorted.sort((a,b)=> (G.collection[b.id]||0) - (G.collection[a.id]||0)
                      || rarityRank[a.rarity] - rarityRank[b.rarity]);
  }
  const sortBar = `<div class="dex-sort">
    <button class="dex-sort-btn ${collectionSort==='default'?'on':''}"      onclick="setCollectionSort('default')">기본</button>
    <button class="dex-sort-btn ${collectionSort==='rarity-desc'?'on':''}"  onclick="setCollectionSort('rarity-desc')">등급 높은순</button>
    <button class="dex-sort-btn ${collectionSort==='rarity-asc'?'on':''}"   onclick="setCollectionSort('rarity-asc')">등급 낮은순</button>
    <button class="dex-sort-btn ${collectionSort==='count-desc'?'on':''}"   onclick="setCollectionSort('count-desc')">보유 많은순</button>
  </div>`;
  document.getElementById('collection-body').innerHTML =
    `<div class="collection-info">수집 ${owned}/${CARDS.length}종${allDone?' · <b style="color:#2e7d32">전체 완성! 수익 +50%</b>':''}</div>
    <div class="dex-ms-grid">${milestones}</div>
    ${sellBtn}
    ${sortBar}
    <div class="collection-grid">${sorted.map(c=>{
      const cnt=G.collection[c.id]||0;
      const collected = isCollected(c.id);   // 한번이라도 가졌었음
      const cls = collected ? c.rarity : '';
      const imgFilter = collected ? 'none' : 'grayscale(1) brightness(0.4)';
      const cntHtml = cnt>0 ? `<div class="cs-count">${cnt}장</div>`
                  : collected ? '<div class="cs-count cs-sold">0장</div>'
                              : '<div class="cs-count cs-locked">미보유</div>';
      return `<div class="card-slot ${cls}" onclick="openCardDetail('${c.id}')">
        <img class="cs-img" src="${c.sprite}" alt="" style="filter:${imgFilter}">
        <div class="cs-name">${c.name}</div>
        ${cntHtml}
        ${cnt>1?`<button class="cs-sell" onclick="event.stopPropagation();sellDuplicates('${c.id}')">＋${cnt-1} 판매</button>`:''}</div>`;
    }).join('')}</div>`;
}
// 자리 비움 수익 팝업
function showOfflinePopup(offSec, earn){
  const h = Math.floor(offSec/3600);
  const m = Math.floor((offSec%3600)/60);
  const timeStr = h>0 ? `${h}시간 ${m}분` : `${m}분`;
  document.getElementById('op-time-val').textContent = timeStr;
  document.getElementById('op-earn-val').textContent = '+'+fmt(earn);
  document.getElementById('offline-popup').classList.add('show');
  sfxLevelUp();
}
function closeOfflinePopup(){
  document.getElementById('offline-popup').classList.remove('show');
  updateHUD();
}

// 본관 ↔ 별관 전환 — 손님과 큐는 그대로 유지(양쪽 방 동시에 돌아감)
function switchRoom(){
  if (!G.annexUnlocked){ notice('별관이 아직 해금되지 않았어요'); return; }
  G.currentRoom = (G.currentRoom==='annex') ? 'main' : 'annex';
  // 청소부 엔티티는 방마다 독립 — 현재 방의 엔티티만 레거시 변수에 연결
  cleanerEntity = getCleanerEntity(G.currentRoom);
  updateRoomBtn();
  renderRewardButtons();
  if (typeof renderShowcasePanel==='function') { try { renderShowcasePanel(); } catch(e){} }
  notice(G.currentRoom==='annex' ? '별관으로 이동' : '본관으로 이동');
  sfxBuy(); saveGame();
}
function updateRoomBtn(){
  const btn = document.getElementById('room-btn');
  const label = document.getElementById('room-btn-label');
  if (!btn) return;
  if (G.annexUnlocked){
    btn.style.display = 'block';
    label.textContent = (G.currentRoom==='annex') ? '◀ 본관' : '▶ 별관';
  } else {
    btn.style.display = 'none';
  }
}
function unlockAnnex(){
  if (G.annexUnlocked){ notice('이미 별관을 해금했어요'); return; }
  if (G.level<20){ notice('Lv20에 해금 가능합니다'); return; }
  const cost = 30;
  if (G.stars<cost){ notice('별이 부족합니다 (별 30개 필요)'); return; }
  G.stars -= cost;
  G.annexUnlocked = true;
  updateRoomBtn();
  notice('별관 해금! 매장 좌측 상단 버튼으로 이동');
  sfxLevelUp(); updateHUD(); saveGame();
  if (curPanel==='star') renderStarPanel();
}

// 매장 테마 선택 다이얼로그
function openThemePicker(){
  const grid = document.getElementById('tp-grid');
  grid.innerHTML = Object.entries(THEMES).map(([id,t])=>{
    const cur = (G.theme||'cozy')===id;
    return `<button class="tp-card ${cur?'tp-on':''}" onclick="setTheme('${id}')">
      <div class="tp-swatches">
        <span class="tp-sw" style="background:${t.wall}"></span>
        <span class="tp-sw" style="background:${t.wood}"></span>
        <span class="tp-sw" style="background:${t.baseboard}"></span>
      </div>
      <div class="tp-name">${t.name}</div>
      ${cur?'<div class="tp-cur">사용 중 ✓</div>':''}
    </button>`;
  }).join('');
  document.getElementById('theme-picker').classList.add('show');
}
function closeThemePicker(){ document.getElementById('theme-picker').classList.remove('show'); }
function setTheme(id){
  if (!THEMES[id]) return;
  G.theme = id; applyTheme(); saveGame();
  notice('테마 변경: '+THEMES[id].name);
  sfxBuy();
  openThemePicker();   // 갱신
}

// 카드 상세 모달 — 도감에서 카드 탭 시
function openCardDetail(cardId){
  const card = CARDS.find(c=>c.id===cardId); if (!card) return;
  const cnt = G.collection[cardId]||0;
  const rarityLabel = { common:'COMMON', rare:'RARE', epic:'EPIC', legendary:'LEGENDARY' }[card.rarity];
  const rarityColor = { common:'#94a3b8', rare:'#fbbf24', epic:'#a78bfa', legendary:'#f97316' }[card.rarity];
  document.getElementById('cd-rarity').textContent = rarityLabel;
  document.getElementById('cd-rarity').style.background = rarityColor;
  document.getElementById('cd-img').src = card.sprite;
  document.getElementById('cd-img').style.filter = cnt>0?'none':'grayscale(1) brightness(0.4)';
  document.getElementById('cd-name').textContent = card.name;
  const collected = isCollected(cardId);
  document.getElementById('cd-count').innerHTML = cnt>0
    ? `보유 <b>${cnt}장</b>`+(cnt>1?` <button class="cd-sell-btn" onclick="sellDuplicates('${cardId}');closeCardDetail()">+${cnt-1} 판매</button>`:'')
    : collected ? '<span class="cd-sold">수집됨 · 현재 0장 (수집 버프 유지)</span>'
                : '<span class="cd-locked">아직 미보유</span>';
  document.getElementById('cd-sell').textContent = fmt(cardSellValue(card));
  document.getElementById('cd-base').textContent = fmt(cardBaseValue(card));
  // 어느 팩에서 나오는지
  const drops = PACKS.filter(p=>p.rw[card.rarity]>0).map(p=>{
    const rarityW = p.rw[card.rarity];
    const inPool = CARDS.filter(x=>x.rarity===card.rarity).length;
    const single = (rarityW/inPool).toFixed(2);
    return `<div class="cd-drop"><span class="cd-drop-pack">${p.name}</span> <span class="cd-drop-rate">등급 ${rarityW}% · 이 카드 ${single}%</span></div>`;
  }).join('');
  document.getElementById('cd-drops').innerHTML = drops || '<div class="cd-locked">획득 불가</div>';
  document.getElementById('card-detail').classList.add('show');
}
function closeCardDetail(){
  document.getElementById('card-detail').classList.remove('show');
}

function sellDuplicates(cardId){
  const have=G.collection[cardId]||0;
  if (have<=1){ notice('판매할 중복 카드가 없습니다'); return; }
  const card=CARDS.find(c=>c.id===cardId);
  const dup=have-1, gain=cardSellValue(card)*dup;
  G.collection[cardId]=1; G.money+=gain;
  notice(`${card.name} ${dup}장 판매  +${fmt(gain)}`);
  sfxBuy(); updateHUD(); recomputeDex(); renderCollectionPanel(); saveGame();
}
function sellAllDuplicates(){
  let dup=0, gain=0;
  CARDS.forEach(c=>{
    const n=(G.collection[c.id]||0)-1;
    if (n>0){ dup+=n; gain+=n*cardSellValue(c); G.collection[c.id]=1; }
  });
  if (!dup){ notice('판매할 중복 카드가 없습니다'); return; }
  G.money+=gain;
  notice(`중복 ${dup}장 판매  +${fmt(gain)}`);
  sfxBuy(); updateHUD(); recomputeDex(); renderCollectionPanel(); saveGame();
}

function renderGachaPanel(){
  document.getElementById('gacha-body').innerHTML =
    `<div class="gacha-grid">${PACKS.map(p=>{
      const locked=G.level<p.unlock;
      return `<div class="gacha-pack" style="opacity:${locked?0.55:1}">
        <img class="gp-img" src="${p.sprite}" alt="">
        <div class="gp-name">${p.name}</div>
        ${locked
          ? `<div class="gp-lock">Lv${p.unlock} 해금</div>`
          : `<div class="gp-pulls">
               <button class="gp-btn" onclick="pullGacha('${p.id}')">×1<br>${fmt(gachaCost(p.id))}</button>
               <button class="gp-btn gp-btn10" onclick="pullGacha10('${p.id}')">×10${(GACHA_X10_MULT[p.id]||10)<10?` <span class="gp-sale">${Math.round((1-(GACHA_X10_MULT[p.id]||10)/10)*100)}%↓</span>`:''}<br>${fmt(gachaCost10(p.id))}</button>
             </div>`}
      </div>`;
    }).join('')}</div>`;
}

function renderGoalsPanel(){
  const claimable=goals.filter(g=>g.done&&!g.claimed).length;
  const head=`<div class="goals-head">
    <button class="claim-all-btn" ${claimable?'':'disabled'} onclick="claimAllGoals()">전체 받기${claimable?` (${claimable})`:''}</button>
  </div>`;
  document.getElementById('goals-body').innerHTML = head + goals.map(g=>{
    const val=g.stat==='collectionSize'?colSize():G[g.stat];
    const pct=Math.min(100,val/g.target*100);
    const rewTxt=g.rtype==='money'?fmt(g.reward):g.reward;
    return `<div class="goal-item">
      <div class="gi-header"><span class="gi-name">${g.name}${g.tier>1?` <span style="color:#b06a18;font-size:10px">${g.tier}단계</span>`:''}</span>
        <span class="gi-reward"><span class="ico-sm">${ICONS[RTYPE[g.rtype]]}</span>${rewTxt}</span></div>
      <div class="gi-bar"><div class="gi-fill" style="width:${pct}%"></div></div>
      <div class="gi-footer"><span class="gi-progress">${Math.min(val,g.target)}/${g.target}</span>
        ${g.done&&!g.claimed?`<button class="claim-btn" onclick="claimGoal('${g.id}')">보상 받기</button>`
          :g.claimed?'<span class="gi-done">완료</span>':''}</div>
    </div>`;
  }).join('');
}

// ── 전시 카드 패널 ──
function renderShowcasePanel(){
  const showcasedIds = showcaseSlots.filter(Boolean).map(s=>s.cardId);

  const slotsHTML = showcaseSlots.map((slot,i)=>{
    const sel = showcasePickSlot===i;
    if (!slot){
      return `<div class="sc-slot sc-slot-empty${sel?' sc-slot-selecting':''}" onclick="selectShowcaseSlot(${i})">
        <div class="sc-empty-icon">${sel?'아래에서 카드 선택':'＋ 카드 추가'}</div>
      </div>`;
    }
    const card  = CARDS.find(c=>c.id===slot.cardId);
    const owned = G.collection[slot.cardId]||0;
    const baseP = cardBaseValue(card);
    const chance= Math.round(Math.max(1,Math.min(90,115-45*(slot.price/baseP))));
    return `<div class="sc-slot sc-slot-filled ${card.rarity}">
      <button class="sc-remove" onclick="removeShowcaseSlot(${i})">✕</button>
      <img class="sc-card-img" src="${card.sprite}" alt="">
      <div class="sc-card-name">${card.name}</div>
      <div class="sc-card-owned${owned===0?' sc-out':''}">보유 ${owned}장${owned===0?' · 품절':''}</div>
      <div class="sc-price-row">
        <button class="sc-step" onpointerdown="startHold(()=>adjustShowcaseRate(${i},-1))">−</button>
        <span class="sc-rate-val">구매율 <b>${chance}%</b></span>
        <button class="sc-step" onpointerdown="startHold(()=>adjustShowcaseRate(${i},1))">＋</button>
      </div>
      <div class="sc-chance">판매가 <b>${fmt(slot.price)}</b></div>
    </div>`;
  }).join('');

  const pickable = showcasePickSlot>=0 || showcaseSlots.includes(null);
  const ownedCards = CARDS.filter(c=>(G.collection[c.id]||0)>0 && !showcasedIds.includes(c.id));
  const invHTML = ownedCards.length>0
    ? `<div class="sc-inv-grid">${ownedCards.map(c=>`
        <div class="sc-inv-item${!pickable?' sc-inv-disabled':''}" onclick="${pickable?`showcasePickCard('${c.id}')`:''}" style="border-color:${RC_RARITY[c.rarity]}">
          <img class="sc-inv-img" src="${c.sprite}" alt="">
          <div class="sc-inv-name">${c.name}</div>
          <div class="sc-inv-count">${G.collection[c.id]}장</div>
        </div>`).join('')}</div>`
    : `<div class="sc-no-cards">전시할 카드가 없습니다<br>뽑기에서 카드를 획득하세요</div>`;

  const globalRate = G.showcaseGlobalRate || 70;
  document.getElementById('showcase-body').innerHTML=`
    <div class="sc-actions">
      <button class="sc-auto" onclick="autoFillShowcase()">⚡ 자동 등록</button>
      <div class="sc-global-rate">
        <span class="sc-gr-label">전체 구매율</span>
        <button class="sc-step" onpointerdown="startHold(()=>adjustGlobalRate(-1))">−</button>
        <span class="sc-gr-val"><b>${globalRate}%</b></span>
        <button class="sc-step" onpointerdown="startHold(()=>adjustGlobalRate(1))">＋</button>
      </div>
    </div>
    <div class="sc-slots-grid">${slotsHTML}</div>
    <div class="sc-section-title">보유 카드 (클릭하여 등록)</div>
    ${invHTML}
    <div class="sc-note">구매율↑이면 가격이 싸져서 자주 팔리고, ↓이면 가격이 비싸 가끔 팔려요</div>`;
}

// 전시 자동 등록 — 솔드아웃 정리 + 보유 카드로 빈 슬롯 채움 (등급 우선, 전체 구매율 반영)
function autoFillShowcase(){
  // 1. 솔드아웃 슬롯 제거
  showcaseSlots.forEach((s,i)=>{ if (s && (G.collection[s.cardId]||0)<=0) showcaseSlots[i]=null; });
  // 2. 빈 슬롯 채우기 — 이미 전시된 카드 제외, 등급 우선 (레전드→일반)
  const occupied = new Set(showcaseSlots.filter(Boolean).map(s=>s.cardId));
  const rarityRank = {legendary:0, epic:1, rare:2, common:3};
  const available = CARDS
    .filter(c => (G.collection[c.id]||0)>0 && !occupied.has(c.id))
    .sort((a,b)=> rarityRank[a.rarity]-rarityRank[b.rarity]);
  // 현재 전체 구매율 기준 가격
  const globalRate = G.showcaseGlobalRate || 70;
  const ratio = (115 - globalRate) / 45;
  let added=0;
  for (let i=0;i<showcaseSlots.length;i++){
    if (!showcaseSlots[i] && available.length>0){
      const card = available.shift();
      const base = cardBaseValue(card);
      showcaseSlots[i] = { cardId: card.id, price: Math.max(1, Math.round(base * ratio)) };
      added++;
    }
  }
  renderShowcasePanel(); saveGame(); sfxBuy();
  notice(added>0 ? `자동 등록 ${added}장 완료 (구매율 ${globalRate}%)` : '추가할 카드가 없어요');
}

function selectShowcaseSlot(i){
  showcasePickSlot = (showcasePickSlot===i) ? -1 : i;
  renderShowcasePanel();
}

function showcasePickCard(cardId){
  const card = CARDS.find(c=>c.id===cardId);
  const target = showcasePickSlot>=0 ? showcasePickSlot : showcaseSlots.indexOf(null);
  if (target<0){ notice('전시 슬롯이 꽉 찼습니다'); return; }
  // 전체 구매율 기준 가격으로 등록
  const globalRate = G.showcaseGlobalRate || 70;
  const ratio = (115 - globalRate) / 45;
  showcaseSlots[target] = { cardId, price: Math.max(1, Math.round(cardBaseValue(card) * ratio)) };
  showcasePickSlot = -1;
  renderShowcasePanel();
}

function removeShowcaseSlot(i){
  showcaseSlots[i]=null;
  if (showcasePickSlot===i) showcasePickSlot=-1;
  renderShowcasePanel();
}

function adjustShowcasePrice(i, dir){
  const slot = showcaseSlots[i];
  if (!slot) return;
  const card = CARDS.find(c=>c.id===slot.cardId);
  const base = cardBaseValue(card);
  const step = Math.max(50, Math.round(base*0.1));
  slot.price  = Math.max(Math.round(base*0.2), Math.min(Math.round(base*5), slot.price+dir*step));
  renderShowcasePanel();
}
// 전체 슬롯 구매율 일괄 조정 (모든 슬롯 가격이 새 구매율에 맞춰 재계산)
function adjustGlobalRate(dir){
  const cur = G.showcaseGlobalRate || 70;
  const next = Math.max(1, Math.min(90, cur + dir*5));
  if (next === cur) { renderShowcasePanel(); return; }
  G.showcaseGlobalRate = next;
  const newRatio = (115 - next) / 45;
  showcaseSlots.forEach(slot=>{
    if (slot){
      const card = CARDS.find(c=>c.id===slot.cardId);
      const base = cardBaseValue(card);
      slot.price = Math.max(1, Math.round(base * newRatio));
    }
  });
  renderShowcasePanel(); saveGame();
}
// 구매율 직접 조정 — 가격은 자동 계산 (rate = 115 - 45·ratio  →  ratio = (115-rate)/45)
function adjustShowcaseRate(i, dir){
  const slot = showcaseSlots[i];
  if (!slot) return;
  const card = CARDS.find(c=>c.id===slot.cardId);
  const base = cardBaseValue(card);
  const ratio = slot.price / base;
  const cur = Math.max(1, Math.min(90, Math.round(115 - 45*ratio)));
  const next = Math.max(1, Math.min(90, cur + dir*5));   // 5%p 단위
  const newRatio = (115 - next) / 45;
  slot.price = Math.max(1, Math.round(base * newRatio));
  renderShowcasePanel();
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
function init(){
  canvas=document.getElementById('shop-canvas');
  computeLayout();
  canvas.width=CW; canvas.height=CH;
  ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const saved=loadGame();
  shelves.forEach(s=>{ if (s.price==null) s.price=pack(s.packId).sellPrice; });
  // 오프라인 수익 — 팝업으로 표시
  if (saved && saved.savedAt){
    const offSec=Math.min((Date.now()-saved.savedAt)/1000, 4*3600);
    const earn=Math.floor(offSec*(G.incomeRate||0)*0.45);
    if (offSec>60 && earn>0){
      G.money+=earn;
      setTimeout(()=>showOfflinePopup(offSec, earn), 1200);
    }
  }
  prerenderSprites();
  prerenderNavIcons();
  loadGameImages();
  woodImg.onload=()=>{
    const oc=document.createElement('canvas');
    oc.width=woodImg.width*2; oc.height=woodImg.height*2;
    const octx=oc.getContext('2d');
    octx.imageSmoothingEnabled=false;
    octx.drawImage(woodImg,0,0,oc.width,oc.height);
    woodPattern=ctx.createPattern(oc,'repeat');
  };
  woodImg.src='assets/wood_floor.png';
  document.getElementById('ic-money').innerHTML=ICONS.coin;
  document.getElementById('ic-star').innerHTML=ICONS.star;
  document.getElementById('ic-gem').innerHTML=ICONS.gem;
  initRewardIcons();

  // 캔버스 클릭 — 진열대(가격수정) + 전시 케이스(전시관리)
  canvas.addEventListener('click',e=>{
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)/rect.width*CW;
    const my=(e.clientY-rect.top)/rect.height*CH;
    // 평판 배지 — 리뷰 패널 열기
    if (repBadgeRect && mx>=repBadgeRect.x && mx<=repBadgeRect.x+repBadgeRect.w
                    && my>=repBadgeRect.y && my<=repBadgeRect.y+repBadgeRect.h){
      openPanel('review'); return;
    }
    // 전시 케이스 (인셋 카운터 우측, y:70~107)
    if (mx>=190 && mx<=341 && my>=49 && my<=107){   // 케이스 높이 확장(58px) 반영
      openPanel('showcase'); return;
    }
    const room = G.currentRoom||'main';
    for (let i=0;i<STANDS.length;i++){
      const sh=shelves[i];
      if (!sh || sh.room!==room) continue;   // 현재 방의 진열대만 클릭 가능
      const s=STANDS[i];
      if (mx>=s.x&&mx<=s.x+STAND_W&&my>=s.y&&my<=s.y+STAND_H){
        if (G.level<sh.unlockLv){ notice(`Lv${sh.unlockLv} 해금 필요`); return; }
        openPricePanel(i); return;
      }
    }
  });

  recomputeDex();
  applyTheme();
  initCleaner();   // 세이브에 청소부가 있으면 엔티티 생성
  updateRoomBtn();
  updateHUD();
  updateHint();
  // 첫 입력 시 오디오 활성화 + 배경음악 시작
  document.addEventListener('pointerdown',()=>{
    initAudio();
    if (audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
    startBgm();
  },{once:true});
  // 패널 드래그 스크롤 + 버튼 길게 누르기 해제
  document.querySelectorAll('.panel').forEach(makeDragScroll);
  document.addEventListener('pointerup', stopHold);
  document.addEventListener('pointercancel', stopHold);
  // 첫 플레이 — 샵 이름 입력 → 튜토리얼 → 일일 출석
  if (!G.shopName) showNameEntry();
  else if (!G.tutorialDone) showTutorial();
  else {
    setTimeout(()=>{
      checkDaily();
      // 이미 Lv10+인데 팩 변경 안내를 못 본 경우 (기존 세이브 유저 포함)
      if (G.level>=10 && !G.packChangeUnlockSeen){
        setTimeout(showPackChangeIntro, 800);
      }
      // 이미 Lv20+인데 별관 안내를 못 본 경우 (기존 세이브 유저 포함)
      if (G.level>=20 && !G.annexIntroSeen && !G.annexUnlocked){
        setTimeout(showAnnexIntro, 1200);
      } else if (G.level>=50 && !G.prestige50Seen){
        setTimeout(showPrestigeLv50, 1800);
      } else if (G.level>=30 && !G.prestigeIntroSeen){
        setTimeout(showPrestigeIntro, 1800);
      }
    }, 600);
  }
  lastTime=performance.now();
  setInterval(gameLoop,16);
  window.addEventListener('resize',()=>{computeLayout();canvas.width=CW;canvas.height=CH;});
  window.addEventListener('beforeunload',saveGame);
}
function makeDragScroll(el){
  let dragging=false, startY=0, startScroll=0;
  el.addEventListener('pointerdown',e=>{
    if (e.pointerType!=='mouse') return;            // 터치는 네이티브 스크롤
    if (e.target.closest('button,input,a')) return; // 버튼·슬라이더는 드래그 제외
    dragging=true; startY=e.clientY; startScroll=el.scrollTop;
  });
  el.addEventListener('pointermove',e=>{
    if (dragging) el.scrollTop=startScroll-(e.clientY-startY);
  });
  const end=()=>{ dragging=false; };
  el.addEventListener('pointerup',end);
  el.addEventListener('pointerleave',end);
  el.addEventListener('pointercancel',end);
}
document.addEventListener('DOMContentLoaded',init);
