// ══════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════
const W=2000,H=550;
// Editor-Canvas = 200×55 mm; Druckrand = 3 mm je Seite
const PLATE_PRINT_W_MM=200,PLATE_PRINT_H_MM=55,SAFE_MARGIN_MM=3;
const PRINT_FORMATS={
  '200x55':{wMm:200,hMm:55,label:'200×55 mm'},
  '289x36':{wMm:289,hMm:36,label:'289×36 mm'},
};
function getPrintFormatKey(){
  return PRINT_FORMATS[S.printFormat||'200x55']?S.printFormat:'200x55';
}
function getPrintFormat(){
  return PRINT_FORMATS[getPrintFormatKey()];
}
function getPrintSizeMm(){
  const f=getPrintFormat();
  return[f.wMm,f.hMm];
}
function printPageOrientation(){
  const[w,h]=getPrintSizeMm();
  return w>=h?'landscape':'portrait';
}
// PDF-Bogen: mehrere Schilder pro Blatt (spart Papier beim Druck)
const SHEET_SIZES={a4:[210,297],a3:[297,420]};
const SHEET_MARGIN_MM=5,PLATE_GAP_MM=2;
const CUT_MARK_LEN_MM=4,CUT_MARK_OFFSET_MM=1;
let PREV_SCALE=0.45; // recalculated on render

function safeMarginPx(){
  return{
    x:Math.round(SAFE_MARGIN_MM*W/PLATE_PRINT_W_MM),
    y:Math.round(SAFE_MARGIN_MM*H/PLATE_PRINT_H_MM),
  };
}
function getSafeRect(){
  const m=safeMarginPx();
  return{left:m.x,top:m.y,right:W-m.x,bottom:H-m.y};
}

const TMPL=[
  {name:'NHL Classic',  bg1:'#041E42',bg2:'#0a1830',acc:'#C8102E',nc:'#FFFFFF',nrc:'#D4B96A'},
  {name:'Dark Ice',     bg1:'#0d0d0d',bg2:'#1a1a1a',acc:'#00BFFF',nc:'#E0E0E0',nrc:'#00BFFF'},
  {name:'Gold & Glory', bg1:'#1a1200',bg2:'#2a2000',acc:'#D4B96A',nc:'#D4B96A',nrc:'#FFFFFF'},
  {name:'Carbon',       bg1:'#141414',bg2:'#202020',acc:'#555555',nc:'#CCCCCC',nrc:'#999999'},
  {name:'Retro Stripe', bg1:'#8B0000',bg2:'#5C0000',acc:'#FFFFFF',nc:'#FFFFFF',nrc:'#FFE066'},
  {name:'Minimal',      bg1:'#F0F0F0',bg2:'#E0E0E0',acc:'#1a1a3e',nc:'#111',   nrc:'#C8102E'},
  {name:'Neon Night',   bg1:'#080012',bg2:'#12001a',acc:'#FF00FF',nc:'#FFFFFF',nrc:'#00FFFF'},
  {name:'Championship', bg1:'#1a0a00',bg2:'#2a1400',acc:'#D4B96A',nc:'#FFFFFF',nrc:'#D4B96A'},
];

const SWATCHES=['#041E42','#C8102E','#D4B96A','#FFFFFF','#000000','#1a3a6e','#006400','#FF8C00','#4B0082','#00BFFF','#FF00FF','#888888','#FFE066','#8B0000','#2d2d2d'];
const BUILTIN_FONTS=[
  {l:'Bebas Neue',v:"'Bebas Neue'"},{l:'Oswald',v:"'Oswald'"},{l:'Anton',v:"'Anton'"},
  {l:'Russo One',v:"'Russo One'"},{l:'Black Ops One',v:"'Black Ops One'"},
  {l:'Teko',v:"'Teko'"},{l:'Barlow Cond.',v:"'Barlow Condensed'"},{l:'Saira Cond.',v:"'Saira Condensed'"},
  {l:'Graduate',v:"'Graduate'"},{l:'Orbitron',v:"'Orbitron'"},{l:'Exo 2',v:"'Exo 2'"},{l:'Saira Stencil',v:"'Saira Stencil One'"},
];
const STATIC_ASSETS=[
  '1.png','2.png','3.png','4.png','5.png','6.png','7.png','8.png','9.png','10.png','11.png','12.png','13.png',
  'background 1.png','background 2.png','background 3.png','background 6.png','background 7.png','background 8.png','background 9.png','background 10.png','background 11.png','background 12.png','background 13.png','background 14.png','background 15.png','background 16.png','background 17.png','background 18.png','background 19.png','background 20.png','background 21.png','background 22.png','background 23.png','background 24.png','background 25.png','background 26.png','background 27.svg','background 28.webp','background 29.png','background 30.png','background 31.png','background 72.png',
  'EHCB Logo.png','EHCB Logo.svg','EHCB Logo.webp','EHCB_Spirit Viking.PNG','Logo Spirit.png','Logo VK.png','Logo VK 1.png','Logo VK.svg','Logo_EHCB.png','Pokal.png','Spirit Viking.PNG','Spirit Viking 3x.webp',
  'ehcb blau.png','ehcb gelb.png','ehcb gelb.svg','ehcb rot.png','ehcb rot.svg',
].map(name=>({name,path:'Vorlagen Garderobenschilder/'+name}));
const STATIC_MASTER_TEMPLATES='Vorlagen json/plateforge_vorlagen_master.json';
const STATIC_MASTER_IMPORT_KEY='plateforge_static_master_import_ts';
const STATIC_MASTER_IMPORT_TTL_MS=24*60*60*1000;
const STATIC_ROSTER_FILES=[
  {label:'Kader 26-27',path:'Vorlagen json/kader_26-27.xlsx'},
  {label:'Roster U18 26-27',path:'Vorlagen Garderobenschilder/Roster U18 26-27.xlsx'},
];
const STATIC_FONTS=[
  '28 Days Later.ttf','AGRESSIVE.otf','All Star Resort.ttf','Allstar4.ttf','AtlantaCollegeRegular-1Gva2.ttf','BaseballClubSolid-E4X69.ttf','Calvier.ttf','ChicagoAthleticSlabSerif2-8OjMn.ttf','Ethnocentric-Regular.otf','Freshman.ttf','HeadCapitalBoldGrunge-KV9RA.otf','Horizon Italic.otf','JackportRegularNcv-BeY3.ttf','JerseyM54-aLX9.ttf','OldSport02AthleticNcv-E0gj.ttf','Race Sport Free.ttf','SpaceX.ttf','SportingOutline-x3e85.ttf','SupportSports-E4Xvl.ttf','UniversidadPersonalUseBold-X3D6a.ttf','VarsityTeam-Bold.otf','Vtks Escape.ttf','ZingRustDemo-Base.otf','ZingRustLH1Demo-Fill.otf','beantown.regular.ttf','heroesassemble2.ttf','heroesassemble3d.ttf','heroesassemble3dital.ttf','heroesassembleexpandital2.ttf','heroesassemblegrad.ttf','heroesassemblegradital.ttf','nasalization-rg.ttf','soviet-program.regular.ttf','swera-demo.bold.otf','thunderstrike.ttf','thunderstrikehalf.ttf',
].map(name=>({name:name.replace(/\.[^.]+$/,''),path:'Fonts/'+name}));

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
const S={
  tpl:0,
  c:{bg1:'#041E42',bg2:'#0a1830',acc:'#C8102E',nc:'#FFFFFF',nrc:'#D4B96A'},
  font:"'Bebas Neue'",
  nrFont:'',
  freeTextFont:'',
  freeText2Font:'',
  layout:'L',
  textAlign:'left',
  textVAlign:'alphabetic', // alphabetic | middle | bottom — typografische Linie / vertikal zentriert / unten
  nrAlign:'left',
  nrVAlign:'alphabetic',
  nrAlignExplicit:false,
  nrVAlignExplicit:false,
  nameMode:'last', // last | first | both | firstlast | initial
  logo:null,logoIsSvg:false,logo2:null,logo2IsSvg:false,bgImg:null,bgOp:.4,logoOp:1,
  frame:true,screws:true,bar:true,logoBand:true,showPos:true,showNat:false,showLeague:true,showGuides:true,showSafeMargin:true,
  logoSz:140,logo2Sz:90,nameSz:190,nrSz:260,frameW:10,
  freeText:'',freeTextSz:70,freeTextRot:0,
  freeText2:'',freeText2Sz:70,freeText2Rot:0,
  textBoxPadX:0,textBoxPadY:0,
  // text effects
  shadowOn:true,glowOn:false,glowColor:'#00BFFF',
  // number badge
  badge:'none',badgeColor:'#C8102E',badgeFillOp:1,badgeBorderColor:'#FFFFFF',badgeScale:72,badgeNrDx:0,badgeNrDy:0,
  userTplId:null,
  // export
  exportScale:1,exportFormat:'png',exportNamePattern:'last_nr',printFormat:'200x55',pdfSheet:'a4',pdfCutMarks:true,pdfIncludeSingle:true,batchFilter:'all',
  // currently selected drag element (for keyboard nudging)
  sel:null,
  club:'EHC BIEL-BIENNE',leagueTxt:'NATIONAL LEAGUE',
  roster:[
    {first:'',last:'LEUENBERGER',nr:'1', pos:'G', nat:'SUI'},
    {first:'RAJALA',last:'RAJALA',nr:'14',pos:'LW',nat:'FIN'},
    {first:'',last:'FUCHS',nr:'20',pos:'D', nat:'SUI'},
    {first:'KÜNZLE',last:'KÜNZLE',nr:'61',pos:'C', nat:'SUI'},
  ],
  active:0,
  savedFonts:[], // [{name,fontFamily}]
  // free positions {logo:{x,y,sz}, name:{x,y}, nr:{x,y}} in plate coords (0-W, 0-H)
  pos:{}
};

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function sv(id,vid,suf=''){document.getElementById(vid).textContent=document.getElementById(id).value+suf}
function getVal(id){return document.getElementById(id).value}
function getInt(id){return parseInt(document.getElementById(id).value)}
function getFloat(id){return parseFloat(document.getElementById(id).value)}

function normalizeHexColor(value,fallback='#000000'){
  const fb=String(fallback||'#000000').trim();
  const raw=String(value||fb).trim();
  const six=raw.match(/^#?([0-9a-f]{6})$/i);
  if(six)return'#'+six[1].toUpperCase();
  const three=raw.match(/^#?([0-9a-f]{3})$/i);
  if(three)return'#'+three[1].split('').map(ch=>ch+ch).join('').toUpperCase();
  if(raw.toLowerCase()==='transparent')return raw;
  return normalizeHexColor(fb,'#000000');
}
function normalizePalette(c={}){
  const base=TMPL[0];
  const nc=normalizeHexColor(c.nc,base.nc);
  const nrc=normalizeHexColor(c.nrc,base.nrc);
  const ftc=normalizeHexColor(c.ftc||c.freeTextColor,nc);
  return{
    bg1:normalizeHexColor(c.bg1,base.bg1),
    bg2:normalizeHexColor(c.bg2,base.bg2),
    acc:normalizeHexColor(c.acc,base.acc),
    nc,
    nrc,
    ftc,
    ft2c:normalizeHexColor(c.ft2c||c.freeText2Color,ftc),
  };
}
function cssStr(value){
  return String(value||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
}
function fontFormatForPath(path,mime=''){
  const p=String(path||mime).toLowerCase();
  if(p.includes('woff2'))return'woff2';
  if(p.includes('woff'))return'woff';
  if(p.includes('opentype')||p.endsWith('.otf'))return'opentype';
  if(p.includes('truetype')||p.endsWith('.ttf'))return'truetype';
  return'woff2';
}
const FONT_FACE_RULES=new Set();
function ensureFontFaceRule(ffName,url,mime=''){
  if(!ffName||!url||FONT_FACE_RULES.has(ffName))return;
  const st=document.createElement('style');
  st.dataset.pfFont=ffName;
  st.textContent=`@font-face{font-family:"${cssStr(ffName)}";src:url("${cssStr(url)}") format("${fontFormatForPath(url,mime)}");font-display:swap}`;
  document.head.appendChild(st);
  FONT_FACE_RULES.add(ffName);
}
function requestFontReady(fontFamily,after){
  if(!document.fonts||!fontFamily)return;
  document.fonts.load(`120px ${fontFamily}`).then(()=>{if(after)after()}).catch(()=>{});
}

function getDisplayName(p){
  const f=(p.first||'').trim().toUpperCase();
  const l=(p.last||'').trim().toUpperCase();
  const mode=getVal('selNameMode');
  if(mode==='last')  return l||f;
  if(mode==='first') return f||l;
  if(mode==='both')  return [f,l].filter(Boolean).join('\n');
  if(mode==='firstlast') return [f,l].filter(Boolean).join(' ');
  if(mode==='initial') return (f?f[0]+'. ':'')+l;
  return l||f;
}
function setFreeTextLine(line,value){
  const key=line===2?'freeText2':'freeText';
  S[key]=String(value||'');
  if(!S[key].trim()&&S.sel===key)S.sel=null;
  render();
  persistSession();
}
function setFreeText(value){setFreeTextLine(1,value)}
function setFreeTextRotation(line,value){
  const key=line===2?'freeText2Rot':'freeTextRot';
  S[key]=Math.max(-180,Math.min(180,Number(value)||0));
  const id=line===2?'vlFreeText2Rot':'vlFreeTextRot';
  const el=document.getElementById(id);if(el)el.textContent=S[key]+'°';
  render();
  persistSession();
}

// ══════════════════════════════════════════
// DEFAULT POSITIONS
// ══════════════════════════════════════════
function defPos(layout){
  const l2=Math.round(S.logo2Sz||90);
  if(layout==='L') return{logo:{x:85,y:275,sz:S.logoSz},logo2:{x:1680,y:275,sz:l2},name:{x:680,y:330},nr:{x:680,y:168},freeText:{x:1320,y:440},freeText2:{x:1320,y:500}};
  if(layout==='R') return{logo:{x:1915,y:275,sz:S.logoSz},logo2:{x:320,y:275,sz:l2},name:{x:180,y:330},nr:{x:180,y:168},freeText:{x:690,y:440},freeText2:{x:690,y:500}};
  if(layout==='S') return{logo:{x:1720,y:275,sz:S.logoSz},logo2:{x:200,y:275,sz:l2},name:{x:950,y:345},nr:{x:360,y:355},freeText:{x:1000,y:455},freeText2:{x:1000,y:505}};
  return               {logo:{x:1760,y:275,sz:S.logoSz},logo2:{x:240,y:275,sz:l2},name:{x:180,y:330},nr:{x:180,y:168},freeText:{x:1000,y:445},freeText2:{x:1000,y:505}};
}
function getPos(key){
  const d=defPos(S.layout);
  let base=d[key];
  // when a badge is active, the number anchor is its CENTER → use a vertically centred default
  if(key==='nr'&&S.badge&&S.badge!=='none')base={...base,y:H/2};
  return S.pos[key]?{...base,...S.pos[key]}:base;
}
function resetPos(){S.pos={};persistSession();updateUnsavedIndicator();render()}

// Spielerdaten ohne Kollision mit S.pos (Layout-Koordinaten)
function templateAdjustKey(){
  return S.userTplId?'u:'+S.userTplId:'b:'+Number(S.tpl||0);
}
function normalizeNameAdjustments(value){
  const out={};
  if(!value||typeof value!=='object')return out;
  Object.entries(value).forEach(([key,adj])=>{
    if(!key||!adj||typeof adj!=='object')return;
    const x=clampPlayerNameAdjust('x',adj.x??adj.dx);
    const y=clampPlayerNameAdjust('y',adj.y??adj.dy);
    if(x||y)out[key]={x,y};
  });
  return out;
}
function normalizeRosterPlayer(p={}){
  return{
    ...p,
    playerPos:p.playerPos!=null?p.playerPos:(p.pos||''),
    nameAdjustments:normalizeNameAdjustments(p.nameAdjustments||p.nameOffsets||p.nameAdjustByTemplate),
  };
}
function getPlayerNameAdjust(p,key=templateAdjustKey()){
  const map=normalizeNameAdjustments(p&&p.nameAdjustments);
  const adj=map[key]||{};
  return{x:Number(adj.x||0),y:Number(adj.y||0)};
}
function setPlayerNameAdjustForTemplate(p,x,y,key=templateAdjustKey()){
  if(!p)return;
  const map=normalizeNameAdjustments(p.nameAdjustments);
  const nx=clampPlayerNameAdjust('x',x),ny=clampPlayerNameAdjust('y',y);
  if(nx||ny)map[key]={x:nx,y:ny};
  else delete map[key];
  p.nameAdjustments=map;
  p.nameDx=0;
  p.nameDy=0;
}
function copyPlayerNameAdjustmentsForTemplate(fromKey,toKey){
  if(!fromKey||!toKey||fromKey===toKey)return false;
  let changed=false;
  S.roster.forEach(p=>{
    p.nameAdjustments=normalizeNameAdjustments(p.nameAdjustments);
    const adj=p.nameAdjustments[fromKey];
    if(adj&&(adj.x||adj.y)){
      p.nameAdjustments[toKey]={x:clampPlayerNameAdjust('x',adj.x),y:clampPlayerNameAdjust('y',adj.y)};
      changed=true;
    }
  });
  if(changed){persistRoster();refreshBatchIfVisible()}
  return changed;
}
function migrateLegacyNameAdjustmentsToCurrentTemplate(){
  const key=templateAdjustKey();
  let changed=false;
  S.roster.forEach(p=>{
    p.nameAdjustments=normalizeNameAdjustments(p.nameAdjustments);
    const legacyX=Number(p.nameDx||0),legacyY=Number(p.nameDy||0);
    if((legacyX||legacyY)&&!p.nameAdjustments[key]){
      p.nameAdjustments[key]={x:clampPlayerNameAdjust('x',legacyX),y:clampPlayerNameAdjust('y',legacyY)};
      changed=true;
    }
    if(p.nameDx||p.nameDy){p.nameDx=0;p.nameDy=0;changed=true}
  });
  if(changed){syncPlayerAdjustUi(S.roster[S.active]);persistRoster();refreshBatchIfVisible()}
  return changed;
}
function playerOpts(p){
  const adj=getPlayerNameAdjust(p);
  return{
    first:(p.first||'').trim(),
    last:(p.last||'').trim(),
    nr:String(p.nr||'').trim(),
    playerPos:(p.playerPos!=null?p.playerPos:p.pos)||'',
    nat:(p.nat||'').trim(),
    nameDx:adj.x,
    nameDy:adj.y,
  };
}
function buildRenderOpts(){
  return{...S,...readSizeOpts(),...playerOpts(activeP())};
}
let rosterWorkspaceWriteTimer=0;
let rosterLastPersistTs=0;
let suppressRosterWorkspaceWrite=false;

function persistRoster(ts=Date.now()){
  rosterLastPersistTs=ts;
  try{
    localStorage.setItem(ROSTER_KEY,JSON.stringify({roster:S.roster,active:S.active,ts}));
  }catch(e){}
  if(!suppressRosterWorkspaceWrite)scheduleWorkspaceRosterWrite();
}
function restoreRoster(){
  try{
    const d=JSON.parse(localStorage.getItem(ROSTER_KEY)||'null');
    if(!d||!Array.isArray(d.roster))return false;
    S.roster=d.roster.map(normalizeRosterPlayer);
    S.active=Math.min(d.active||0,Math.max(0,S.roster.length-1));
    rosterLastPersistTs=d.ts||Date.now();
    return true;
  }catch(e){return false}
}
function persistSession(){
  try{
    const snap=getDesignSnapshotBase();
    snap.nameMode=S.nameMode||getVal('selNameMode');
    snap.logoBand=S.logoBand;
    snap.userTplId=S.userTplId||null;
    localStorage.setItem(SESSION_KEY,JSON.stringify({snap,ts:Date.now()}));
  }catch(e){}
  updateUnsavedIndicator();
}
let _tplSavedPosJson=null;
function markTemplatePosBaseline(){
  _tplSavedPosJson=S.userTplId?JSON.stringify(S.pos||{}):null;
  updateUnsavedIndicator();
}
function updateUnsavedIndicator(){
  const el=document.getElementById('unsavedTplHint');
  if(!el)return;
  const dirty=S.userTplId&&_tplSavedPosJson!=null&&JSON.stringify(S.pos||{})!==_tplSavedPosJson;
  el.style.display=dirty?'block':'none';
}
async function restoreSession(){
  try{
    const d=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
    if(!d||!d.snap)return;
    const sessSnap=d.snap;
    const tplId=sessSnap.userTplId;
    if(tplId){
      const t=loadUserTemplates().find(x=>x.id===tplId);
      if(t&&t.snap){
        const enriched=await enrichSnapFromAssetIdb(t.snap,tplId);
        await applyDesignSnapshot(enriched,{restoreImages:true,exportSettings:sessSnap});
        S.userTplId=tplId;
        document.getElementById('tplName').textContent=t.name.toUpperCase();
        setTemplateNameInput(t.name);
        if(sessSnap.pos&&Object.keys(sessSnap.pos).length){
          S.pos=JSON.parse(JSON.stringify(sessSnap.pos));
          persistSession();
        }
        markTemplatePosBaseline();
        render();
        return;
      }
    }
    const enriched=await enrichSnapFromAssetIdb(sessSnap,null);
    const hasImg=!!(enriched.logoData||enriched.logo2Data||enriched.bgData);
    await applyDesignSnapshot(enriched,{restoreImages:hasImg});
    if(sessSnap.userTplId)S.userTplId=sessSnap.userTplId;
    if(sessSnap.pos&&Object.keys(sessSnap.pos).length){
      S.pos=JSON.parse(JSON.stringify(sessSnap.pos));
      persistSession();
      render();
    }
    markTemplatePosBaseline();
  }catch(e){}
}

// ══════════════════════════════════════════
// SIDE TABS / MAIN TABS
// ══════════════════════════════════════════
function sideTab(name){
  ['design','team','settings'].forEach(t=>{
    document.getElementById('panel'+t.charAt(0).toUpperCase()+t.slice(1)).classList.toggle('on',t===name);
    document.querySelectorAll('.side-tab')[['design','team','settings'].indexOf(t)].classList.toggle('on',t===name);
  });
  syncAriaControls();
}
function switchMain(view){
  document.getElementById('viewEditor').style.display=view==='editor'?'flex':'none';
  document.getElementById('viewBatch').style.display=view==='batch'?'flex':'none';
  document.getElementById('tabEditor').classList.toggle('btn-y',view==='editor');
  document.getElementById('tabBatch').classList.toggle('btn-y',view==='batch');
  if(view==='batch')renderBatch();
  syncAriaControls();
}
function initRuntimeModeUi(){
  document.body.classList.toggle('is-tauri',isTauriApp());
}

// ══════════════════════════════════════════
// TEXT ALIGN
// ══════════════════════════════════════════
// Textbreite (eine Zeile) für Ausrichtungs-Korrektur
function measureTextWidth(text,fontPx,fontFamily){
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font=`${fontPx}px ${fontFamily},sans-serif`;
  return ctx.measureText(text||' ').width;
}
function maxLineWidth(lines,fontPx,fontFamily){
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font=`${fontPx}px ${fontFamily},sans-serif`;
  return Math.max(...lines.map(l=>ctx.measureText(l||' ').width),1);
}
function anchorOffsetX(align,w){
  if(align==='center')return w/2;
  if(align==='right')return w;
  return 0;
}
// Bei Wechsel der horizontalen Ausrichtung X so anpassen, dass die Bounding-Box gleich bleibt
function shiftTextAnchorX(key,oldAlign,newAlign,w){
  if(!w)return;
  const base=getPos(key);
  const merged={...base,...S.pos[key]};
  const curX=merged.x;
  const newX=curX-anchorOffsetX(oldAlign,w)+anchorOffsetX(newAlign,w);
  S.pos[key]={...merged,x:newX};
}
function effectiveNrAlign(){
  return S.nrAlignExplicit&&S.nrAlign!=null?S.nrAlign:(S.textAlign||'left');
}
function effectiveNrVAlign(){
  return S.nrVAlignExplicit&&S.nrVAlign!=null?S.nrVAlign:(S.textVAlign||'alphabetic');
}
function migrateSnapAlign(snap){
  const s={...snap};
  if(s.nrAlign!=null&&s.textAlign!=null&&s.nrAlign===s.textAlign)delete s.nrAlign;
  if(s.nrVAlign!=null&&s.textVAlign!=null&&s.nrVAlign===s.textVAlign)delete s.nrVAlign;
  if(s.nrAlign==='left'&&s.textAlign&&s.textAlign!=='left')delete s.nrAlign;
  if(s.nrVAlign==='alphabetic'&&s.textVAlign&&s.textVAlign!=='alphabetic')delete s.nrVAlign;
  return s;
}
function syncAlignUi(){
  ['left','center','right'].forEach(x=>{
    const el=document.getElementById('a'+x.charAt(0).toUpperCase()+x.slice(1));
    if(el)el.classList.toggle('on',x===S.textAlign);
  });
}
function syncNrAlignUi(){
  const a=effectiveNrAlign();
  ['left','center','right'].forEach(x=>{
    const el=document.getElementById('n'+x.charAt(0).toUpperCase()+x.slice(1));
    if(el)el.classList.toggle('on',x===a);
  });
}
function setAlign(a){
  if(a===S.textAlign)return;
  const old=S.textAlign;
  const nameLines=getDisplayName(activeP()).split('\n');
  const wName=maxLineWidth(nameLines,getInt('slName'),S.font);
  shiftTextAnchorX('name',old,a,wName);
  S.textAlign=a;
  syncAlignUi();
  render();
}
function setNrAlign(a){
  const old=effectiveNrAlign();
  if(a===old)return;
  if(!(S.badge&&S.badge!=='none')){
    const wNr=measureTextWidth(String(activeP().nr||''),getInt('slNrSz'),getNrFont());
    shiftTextAnchorX('nr',old,a,wNr);
  }
  S.nrAlign=a;S.nrAlignExplicit=true;
  syncNrAlignUi();
  render();
}
function relativeNameBoundsY(vAlign){
  const lines=getDisplayName(activeP()).split('\n');
  const b=textLinesBounds(0,0,lines,getInt('slName'),S.font,S.textAlign,vAlign);
  return{top:b.top,bottom:b.bottom};
}
function relativeNrBoundsY(vAlign){
  const text=String(activeP().nr||'');
  const font=getNrFont();
  const align=effectiveNrAlign();
  const size=getInt('slNrSz');
  const baseline=nrBaselinePlateY(0,size,text,font,vAlign,align);
  const b=scanTextInkBounds(text,size,font,align);
  const padY=textBoxPad(size,'y');
  return{top:baseline+b.top-padY,bottom:baseline+b.bottom+padY};
}
function shiftTextAnchorY(key,oldVAlign,newVAlign){
  const bounds=key==='nr'?relativeNrBoundsY:relativeNameBoundsY;
  const oldB=bounds(oldVAlign);
  const newB=bounds(newVAlign);
  const base=getPos(key);
  const merged={...base,...S.pos[key]};
  S.pos[key]={...merged,y:merged.y+oldB.top-newB.top};
}
function syncVAlignUi(){
  const m={alphabetic:'vBase',middle:'vMid',bottom:'vBot'};
  ['vBase','vMid','vBot'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.toggle('on',id===m[S.textVAlign||'alphabetic'])});
}
function syncNrVAlignUi(){
  const v=effectiveNrVAlign();
  const m={alphabetic:'nvBase',middle:'nvMid',bottom:'nvBot'};
  ['nvBase','nvMid','nvBot'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.toggle('on',id===m[v])});
}
function setVAlign(v){
  if(v===S.textVAlign)return;
  shiftTextAnchorY('name',S.textVAlign||'alphabetic',v);
  S.textVAlign=v;
  syncVAlignUi();
  render();
}
function setNrVAlign(v){
  const old=effectiveNrVAlign();
  if(v===old)return;
  if(!(S.badge&&S.badge!=='none'))shiftTextAnchorY('nr',old,v);
  S.nrVAlign=v;S.nrVAlignExplicit=true;
  syncNrVAlignUi();
  render();
}

// ══════════════════════════════════════════
// SWATCHES
// ══════════════════════════════════════════
function mkSwatchG(cid,getV,setV){
  const c=document.getElementById(cid);if(!c)return;
  c.innerHTML='';
  const cur=normalizeHexColor(getV(),'#000000');
  SWATCHES.forEach(h=>{
    const sw=normalizeHexColor(h,'#000000');
    const d=document.createElement('div');d.className='sw'+(cur===sw?' sel':'');
    d.style.background=sw;d.title=sw;
    d.onclick=()=>{setV(sw);c.querySelectorAll('.sw').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');render();persistSession()};
    c.appendChild(d);
  });
  const inp=document.createElement('input');inp.type='color';inp.value=cur;
  inp.oninput=()=>{setV(normalizeHexColor(inp.value,cur));render();persistSession()};
  c.appendChild(inp);
}
function mkSwatch(cid,key){mkSwatchG(cid,()=>S.c[key],v=>S.c[key]=v)}

function selectedTextColorTarget(){
  return ['name','nr','freeText','freeText2'].includes(S.sel)?S.sel:'name';
}
function textColorKey(target=selectedTextColorTarget()){
  return{nr:'nrc',freeText:'ftc',freeText2:'ft2c',name:'nc'}[target]||'nc';
}
function syncColorTargetUi(target=selectedTextColorTarget()){
  const info=document.getElementById('colorTargetInfo');
  if(info)info.textContent='Ziel: '+fontTargetLabel(target);
}
function refreshTextColorSwatch(){
  const target=selectedTextColorTarget();
  syncColorTargetUi(target);
  mkSwatchG('swText',()=>normalizePalette(S.c)[textColorKey(target)],v=>{
    const key=textColorKey(target);
    S.c={...normalizePalette(S.c),[key]:normalizeHexColor(v,'#FFFFFF')};
  });
}

function refreshSwatches(){
  [['swBg1','bg1'],['swBg2','bg2'],['swAcc','acc']].forEach(([id,k])=>mkSwatch(id,k));
  refreshTextColorSwatch();
  mkSwatchG('swGlow', ()=>S.glowColor, v=>S.glowColor=v);
  mkSwatchG('swBadge',()=>S.badgeColor,v=>S.badgeColor=v);
  mkSwatchG('swBadgeBorder',()=>S.badgeBorderColor||'#FFFFFF',v=>S.badgeBorderColor=v);
}
function hexToRgba(hex,a){
  const h=normalizeHexColor(hex,'#000000').replace('#','');
  if(h.length!==6)return`rgba(0,0,0,${Math.max(0,Math.min(1,a))})`;
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return`rgba(${r},${g},${b},${Math.max(0,Math.min(1,a))})`;
}

// ══════════════════════════════════════════
// FONT GRID + SAVED FONTS
// ══════════════════════════════════════════
function buildFontGrid(){
  syncFontSelectOptions();
  const g=document.getElementById('fontGrid');g.innerHTML='';
  const active=effectiveSelectedFont();
  BUILTIN_FONTS.forEach(f=>{
    const d=document.createElement('div');d.className='font-opt'+(active===f.v?' on':'');
    d.tabIndex=0;d.setAttribute('role','button');d.setAttribute('aria-label','Schrift '+f.l+' wählen');
    d.dataset.font=f.v;
    d.innerHTML=`<div class="fp" style="font-family:${f.v}">${f.l.split(' ')[0].toUpperCase()}</div><div class="fn">${f.l}</div>`;
    d.onclick=()=>setFontFamily(f.v);
    g.appendChild(d);
  });
  S.savedFonts.forEach(sf=>{
    const d=document.createElement('div');d.className='font-opt'+(active===sf.fontFamily?' on':'');
    d.tabIndex=0;d.setAttribute('role','button');d.setAttribute('aria-label','Schrift '+sf.name+' wählen');
    d.dataset.font=sf.fontFamily;
    d.innerHTML=`<div class="fp" style="font-family:${sf.fontFamily}">${sf.name.split(/[\\s_-]/)[0].toUpperCase()}</div><div class="fn">${sf.name}</div>`;
    d.onclick=()=>setFontFamily(sf.fontFamily);
    g.appendChild(d);
  });
  syncFontGridToggle();
}
function fontNormName(name){
  return String(name||'').replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
}
function syncFontSelectOptions(){
  const sel=document.getElementById('selFont');
  if(!sel)return;
  const makeOption=(label,value,fontFamily,group)=>{
    const opt=document.createElement('option');
    opt.value=value;opt.textContent=group?`${label} · ${group}`:label;
    opt.style.fontFamily=fontFamily;
    return opt;
  };
  const entries=[];
  BUILTIN_FONTS.forEach(f=>entries.push({label:f.l,value:f.v,font:f.v,group:'Standard'}));
  const seen=new Set(BUILTIN_FONTS.map(f=>fontNormName(f.l)));
  S.savedFonts.forEach(sf=>{
    const key=fontNormName(sf.name);
    if(seen.has(key))return;
    seen.add(key);
    entries.push({label:sf.name,value:sf.fontFamily,font:sf.fontFamily,group:sf.static?'Repo':(sf.folder?'Ordner':'Eigen')});
  });
  const target=selectedFontTarget();
  const raw=currentSelectedFontValue(target);
  const effective=effectiveFontForTarget(target);
  sel.innerHTML='';
  if(target!=='name')sel.appendChild(makeOption('— wie Name —','__inherit__',S.font,''));
  entries.forEach(e=>sel.appendChild(makeOption(e.label,e.value,e.font,e.group)));
  sel.value=[...sel.options].some(o=>o.value===raw)?raw:(target==='name'?S.font:'__inherit__');
  sel.style.fontFamily=effective||"'Rajdhani'";
  syncFontTargetUi(target);
  refreshTextColorSwatch();
}

const CUSTOM_FONTS_KEY='plateforge_custom_fonts';
const ACTIVE_FONT_KEY='plateforge_active_font';

function selectedFontTarget(){
  return ['name','nr','freeText','freeText2'].includes(S.sel)?S.sel:'name';
}
function fontTargetLabel(target=selectedFontTarget()){
  return{nr:'Nummer / Badge',freeText:'Freier Text 1',freeText2:'Freier Text 2',name:'Name'}[target]||'Name';
}
function currentSelectedFontValue(target=selectedFontTarget()){
  if(target==='nr')return S.nrFont||'__inherit__';
  if(target==='freeText')return S.freeTextFont||'__inherit__';
  if(target==='freeText2')return S.freeText2Font||'__inherit__';
  return S.font||"'Bebas Neue'";
}
function effectiveFontForTarget(target=selectedFontTarget()){
  if(target==='nr')return S.nrFont||S.font||"'Bebas Neue'";
  if(target==='freeText')return S.freeTextFont||S.font||"'Bebas Neue'";
  if(target==='freeText2')return S.freeText2Font||S.font||"'Bebas Neue'";
  return S.font||"'Bebas Neue'";
}
function effectiveSelectedFont(){
  return effectiveFontForTarget(selectedFontTarget());
}
function syncFontTargetUi(target=selectedFontTarget()){
  const info=document.getElementById('fontTargetInfo');
  if(info)info.textContent='Ziel: '+fontTargetLabel(target);
}
function setSelectedFontTarget(key){
  S.sel=key;
  syncFontSelectOptions();
  refreshTextColorSwatch();
  document.querySelectorAll('.font-opt').forEach(x=>x.classList.toggle('on',x.dataset.font===effectiveSelectedFont()));
}

function persistCustomFonts(){
  try{
    const payload=S.savedFonts.filter(f=>!f.static&&!f.folder).map(({name,fontFamily,b64,mime,ffName})=>({name,fontFamily,b64,mime,ffName}));
    localStorage.setItem(CUSTOM_FONTS_KEY,JSON.stringify(payload));
    localStorage.setItem(ACTIVE_FONT_KEY,S.font||"'Bebas Neue'");
  }catch(e){showWarn('Fonts konnten nicht dauerhaft gespeichert werden (Speicher voll?).')}
}
function persistActiveFont(){try{localStorage.setItem(ACTIVE_FONT_KEY,S.font||"'Bebas Neue'")}catch(e){}}
function setFontFamily(fontFamily){
  const target=selectedFontTarget();
  const inherit=fontFamily==='__inherit__';
  if(target==='nr')S.nrFont=inherit?'':(fontFamily||'');
  else if(target==='freeText')S.freeTextFont=inherit?'':(fontFamily||'');
  else if(target==='freeText2')S.freeText2Font=inherit?'':(fontFamily||'');
  else S.font=fontFamily||"'Bebas Neue'";
  const effective=effectiveFontForTarget(target);
  syncFontSelectOptions();
  document.querySelectorAll('.font-opt').forEach(x=>x.classList.toggle('on',x.dataset.font===effectiveSelectedFont()));
  if(target==='name')persistActiveFont();
  persistSession();
  render();
  requestFontReady(effective,()=>{render();refreshBatchIfVisible()});
}
function setNrFontFamily(fontFamily){
  S.nrFont=fontFamily||'';
  syncFontSelectOptions();
  persistSession();
  render();
  requestFontReady(S.nrFont||S.font,()=>{render();refreshBatchIfVisible()});
}
function getNrFont(){
  return S.nrFont||S.font;
}
function getFreeTextFont(){
  return S.freeTextFont||S.font;
}
function getFreeText2Font(){
  return S.freeText2Font||S.font;
}
function collapseFontGrid(){
  const g=document.getElementById('fontGrid');
  if(g)g.classList.add('collapsed');
  syncFontGridToggle();
}
function toggleFontGrid(){
  const g=document.getElementById('fontGrid');
  if(!g)return;
  g.classList.toggle('collapsed');
  syncFontGridToggle();
}
function syncFontGridToggle(){
  const b=document.getElementById('fontGridToggle');
  const g=document.getElementById('fontGrid');
  if(b&&g)b.textContent=g.classList.contains('collapsed')?'Kacheln anzeigen':'Kacheln ausblenden';
}
function readFileAsDataUrl(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}
async function restoreCustomFonts(){
  let data=[];
  try{data=JSON.parse(localStorage.getItem(CUSTOM_FONTS_KEY)||'[]')}catch(e){data=[]}
  S.savedFonts=[];
  for(const entry of data){
    if(!entry.b64||!entry.ffName)continue;
    try{
      const mime=entry.mime||'font/woff2';
      const url=`data:${mime};base64,${entry.b64}`;
      const f=await new FontFace(entry.ffName,`url(${url})`).load();
      document.fonts.add(f);
      S.savedFonts.push({name:entry.name,fontFamily:entry.fontFamily,ffName:entry.ffName,b64:entry.b64,mime,url});
    }catch(e){/* einzelne kaputte Fonts überspringen */}
  }
  await loadStaticFonts();
  const active=localStorage.getItem(ACTIVE_FONT_KEY);
  if(active&&(BUILTIN_FONTS.some(b=>b.v===active)||S.savedFonts.some(sf=>sf.fontFamily===active))){
    S.font=active;
    const sel=document.getElementById('selFont');
    if(sel)sel.value=BUILTIN_FONTS.some(b=>b.v===active)?active:'';
  }
  renderSavedFonts();
  buildFontGrid();
}
async function loadStaticFonts(){
  for(const sf of STATIC_FONTS){
    const key=fontNormName(sf.name);
    if(S.savedFonts.some(f=>f.path===sf.path||fontNormName(f.name)===key))continue;
    try{
      const ffName='PF_STATIC_'+safeName(sf.name);
      const url=encodeURI(sf.path);
      ensureFontFaceRule(ffName,url);
      S.savedFonts.push({name:sf.name,fontFamily:`'${ffName}'`,ffName,url,path:sf.path,static:true,lazy:true});
    }catch(e){}
  }
}
async function registerUploadedFont(file,{setActive=false}={}){
  if(!file)return{ok:false,err:'Keine Datei.'};
  if(file.size>3*1024*1024)return{ok:false,err:'Font-Datei zu gross (max. 3 MB).'};
  try{
    const dataUrl=await readFileAsDataUrl(file);
    const b64=dataUrl.split(',')[1]||'';
    const mime=(dataUrl.match(/^data:([^;]+)/)||[])[1]||file.type||'font/woff2';
    const fname=file.name.replace(/\.[^.]+$/,'');
    const key=fontNormName(fname);
    S.savedFonts=S.savedFonts.filter(f=>fontNormName(f.name)!==key||f.static);
    const ffName='PF_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
    const f=await new FontFace(ffName,`url(${dataUrl})`).load();
    document.fonts.add(f);
    const fontVal=`'${ffName}'`;
    S.savedFonts.push({name:fname,fontFamily:fontVal,ffName,b64,mime,url:dataUrl});
    if(setActive)S.font=fontVal;
    return{ok:true,name:fname};
  }catch(e){return{ok:false,err:'Font konnte nicht geladen werden.'}}
}
async function loadFont(inp){
  const file=inp.files[0];if(!file)return;
  const r=await registerUploadedFont(file,{setActive:true});
  inp.value='';
  if(!r.ok){alert(r.err||'Font konnte nicht geladen werden.');return}
  persistCustomFonts();
  buildFontGrid();
  renderSavedFonts();
  render();
  showOk(`Font „${r.name}" gespeichert.`);
}
async function importAssetFonts(inp){
  const files=Array.from(inp.files||[]);
  inp.value='';
  if(!files.length)return;
  let added=0;
  for(const file of files){
    const r=await registerUploadedFont(file);
    if(r.ok)added++;
  }
  if(!added){showWarn('Keine gültigen Font-Dateien gewählt.');return}
  persistCustomFonts();
  buildFontGrid();
  renderSavedFonts();
  showOk(`${added} Font(s) in Bibliothek geladen.`);
}

function renderSavedFonts(){
  const el=document.getElementById('savedFontsList');
  el.innerHTML='';
  if(!S.savedFonts.length){document.getElementById('customFontInfo').style.display='none';return}
  document.getElementById('customFontInfo').style.display='block';
  document.getElementById('customFontBadge').textContent=`${S.savedFonts.length} eigene Font(s) geladen`;
  const seen=new Set();
  S.savedFonts.forEach((sf,i)=>{
    const key=fontNormName(sf.name);
    if(seen.has(key))return;
    seen.add(key);
    const d=document.createElement('div');d.className='saved-font-item'+(effectiveSelectedFont()===sf.fontFamily?' on':'');
    d.tabIndex=0;d.setAttribute('role','button');d.setAttribute('aria-label','Schrift '+sf.name+' wählen');
    d.innerHTML=`<span class="saved-font-name" style="font-family:${sf.fontFamily}">${sf.name}</span>
      ${sf.static||sf.folder?'<span style="font-size:.58rem;color:var(--mut)">Repo</span>':`<button class="saved-font-del" onclick="removeSavedFont(${i},event)">✕</button>`}`;
    d.onclick=e=>{if(e.target.classList.contains('saved-font-del'))return;setFontFamily(sf.fontFamily);document.querySelectorAll('.saved-font-item').forEach(x=>x.classList.remove('on'));d.classList.add('on')};
    el.appendChild(d);
  });
}

function removeSavedFont(i,e){
  e.stopPropagation();
  if(S.font===S.savedFonts[i].fontFamily)S.font="'Bebas Neue'";
  if(S.nrFont===S.savedFonts[i].fontFamily)S.nrFont='';
  if(S.freeTextFont===S.savedFonts[i].fontFamily)S.freeTextFont='';
  if(S.freeText2Font===S.savedFonts[i].fontFamily)S.freeText2Font='';
  S.savedFonts.splice(i,1);
  persistCustomFonts();
  persistActiveFont();
  renderSavedFonts();buildFontGrid();render();
}

// ══════════════════════════════════════════
// TEMPLATES
// ══════════════════════════════════════════
let _tplGridRenderRun=0;
function loadThumbImage(src){
  return new Promise(resolve=>{
    if(!src){resolve(null);return}
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}
function thumbPlayer(){
  const p=activeP();
  return{last:p.last||'MÜLLER',first:p.first||'',nr:p.nr||'17',playerPos:p.pos||'C',nat:p.nat||'SUI'};
}
function drawTemplatePreview(cv,opts,pos){
  const keep={layout:S.layout,pos:S.pos,badge:S.badge,logoSz:S.logoSz,logo2Sz:S.logo2Sz};
  S.layout=opts.layout||'L';
  S.pos=pos?JSON.parse(JSON.stringify(pos)):{};
  S.badge=opts.badge||'none';
  S.logoSz=opts.logoSz??S.logoSz;
  S.logo2Sz=opts.logo2Sz??S.logo2Sz;
  try{drawPlate(cv,cv.width,cv.height,opts,false)}
  catch(e){console.warn('Vorlagen-Vorschau konnte nicht gerendert werden',e)}
  finally{Object.assign(S,keep)}
}
function templatePreviewDefaults(){
  return{
    tpl:0,c:{...TMPL[0]},font:"'Bebas Neue'",nrFont:'',layout:'L',
    freeTextFont:'',freeText2Font:'',
    textAlign:'left',textVAlign:'alphabetic',nrAlign:'left',nrVAlign:'alphabetic',
    nameMode:'last',logoSz:140,logo2Sz:90,nameSz:190,nrSz:260,frameW:10,
    freeText:'',freeTextSz:70,freeTextRot:0,freeText2:'',freeText2Sz:70,freeText2Rot:0,
    bgOp:.4,logoOp:1,frame:true,screws:true,bar:true,logoBand:true,
    showPos:true,showNat:false,showLeague:true,shadowOn:true,glowOn:false,glowSize:26,shBlur:10,shDist:4,
    badge:'none',badgeScale:72,badgeNrDx:0,badgeNrDy:0,badgeFillOp:1,badgeColor:'#C8102E',badgeBorderColor:'#FFFFFF',
  };
}
function previewOptsFromSnap(s,player,extra={}){
  const snap=migrateSnapAlign(s||{});
  const base={
    ...templatePreviewDefaults(),
    ...snap,
    ...player,
    tpl:snap.tpl??0,
    c:normalizePalette(snap.c||templatePreviewDefaults().c),
    nrAlign:snap.nrAlign??snap.textAlign??'left',
    nrVAlign:snap.nrVAlign??snap.textVAlign??'alphabetic',
    badgeScale:snap.badgeScale??72,
    showGuides:false,
    showSafeMargin:false,
    ...extra,
  };
  return base;
}
const TPL_SORT_COLLATOR=new Intl.Collator('de',{numeric:true,sensitivity:'base'});
function templateSortName(value){
  return String(value||'').replace(/^plateforge_/i,'').replace(/\.json$/i,'').replace(/_/g,' ').trim();
}
function compareTemplateNames(a,b){
  return TPL_SORT_COLLATOR.compare(templateSortName(a),templateSortName(b));
}
function templateGroupKey(name){
  const n=String(name||'').toLowerCase();
  if(/ehcb|biel|bienne/.test(n))return'ehcb';
  if(/spirit|vosseler|team spirit/.test(n))return'spirit';
  return'custom';
}
function templateGroupLabel(name,{builtin=false}={}){
  if(builtin)return'Basis';
  const key=templateGroupKey(name);
  if(key==='ehcb')return'EHCB';
  if(key==='spirit')return'Spirit';
  return'Eigene';
}
const TPL_FAV_KEY='plateforge_tpl_favorites';
function loadTplFavorites(){
  try{return new Set(JSON.parse(localStorage.getItem(TPL_FAV_KEY)||'[]'))}catch(e){return new Set()}
}
function persistTplFavorites(set){
  try{localStorage.setItem(TPL_FAV_KEY,JSON.stringify([...set]))}catch(e){}
}
function tplFavKey(kind,id){return kind+':'+id}
function isTplFavorite(key){return loadTplFavorites().has(key)}
function toggleTplFavorite(key,e){
  if(e)e.stopPropagation();
  const fav=loadTplFavorites();
  if(fav.has(key))fav.delete(key);else fav.add(key);
  persistTplFavorites(fav);
  buildTplGrid();renderUserTplList();
}
function appendTplStar(wrap,favKey){
  const star=document.createElement('button');
  star.type='button';
  const on=isTplFavorite(favKey);
  star.className='tpl-star'+(on?' on':'');
  star.title=on?'Aus Favoriten entfernen':'Als Favorit markieren';
  star.setAttribute('aria-label',star.title);
  star.textContent='★';
  star.onclick=e=>toggleTplFavorite(favKey,e);
  wrap.appendChild(star);
}
function updateTplBrowserMeta(shown,total){
  const count=document.getElementById('tplCount');
  if(count){
    count.textContent=shown===total?`${shown} Vorlagen`:`${shown} von ${total} Vorlagen`;
  }
  const q=(getVal('tplSearch')||'').trim();
  const g=getVal('tplFilterGroup')||'all';
  const reset=document.getElementById('tplReset');
  if(reset)reset.hidden=!(q||g!=='all');
}
function resetTplBrowser(){
  const search=document.getElementById('tplSearch');
  const filter=document.getElementById('tplFilterGroup');
  if(search)search.value='';
  if(filter)filter.value='all';
  buildTplGrid();
  if(search)search.focus();
}
function createTemplateCard({name,favKey,builtin=false,id,selected=false,onSelect,onDelete}){
  const wrap=document.createElement('div');
  wrap.className='tpl-card'+(selected?' on':'');
  wrap.tabIndex=0;
  wrap.setAttribute('role','button');
  wrap.setAttribute('aria-label','Vorlage '+name+' wählen');
  wrap.dataset.group=builtin?'builtin':templateGroupKey(name);
  if(builtin)wrap.dataset.builtin=String(id);else wrap.dataset.user=id;
  wrap.onclick=onSelect;

  const thumb=document.createElement('div');
  thumb.className='tpl-thumb';
  appendTplStar(thumb,favKey);
  const cv=document.createElement('canvas');
  cv.width=320;cv.height=88;
  thumb.appendChild(cv);
  if(onDelete){
    const del=document.createElement('button');
    del.type='button';
    del.className='tpl-del';
    del.title='Vorlage löschen';
    del.setAttribute('aria-label','Vorlage '+name+' löschen');
    del.textContent='×';
    del.onclick=onDelete;
    thumb.appendChild(del);
  }

  const info=document.createElement('div');
  info.className='tpl-info';
  const lbl=document.createElement('div');
  lbl.className='tpl-lbl';
  lbl.textContent=name;
  const kind=document.createElement('span');
  kind.className='tpl-kind';
  kind.textContent=templateGroupLabel(name,{builtin});
  info.appendChild(lbl);
  info.appendChild(kind);

  wrap.appendChild(thumb);
  wrap.appendChild(info);
  return{wrap,cv};
}
function compareTplEntries(a,b){
  const fav=loadTplFavorites();
  const af=fav.has(a.favKey),bf=fav.has(b.favKey);
  if(af&&!bf)return-1;
  if(!af&&bf)return 1;
  return compareTemplateNames(a.name,b.name);
}
function matchesTplFilter(name,{builtin=false,favKey=null}={}){
  const q=(getVal('tplSearch')||'').trim().toLowerCase();
  const g=getVal('tplFilterGroup')||'all';
  if(q&&!String(name||'').toLowerCase().includes(q))return false;
  if(g==='favorites')return!!favKey&&loadTplFavorites().has(favKey);
  if(g==='all')return true;
  if(g==='builtin')return builtin;
  if(g==='ehcb')return templateGroupKey(name)==='ehcb';
  if(g==='spirit')return templateGroupKey(name)==='spirit';
  if(g==='custom')return!builtin&&templateGroupKey(name)==='custom';
  return true;
}
function buildTplGrid(){
  const run=++_tplGridRenderRun;
  const g=document.getElementById('tplGrid');g.innerHTML='';
  const player=thumbPlayer();
  const userTemplates=[...loadUserTemplates()].filter(ut=>ut&&ut.snap);
  const total=TMPL.length+userTemplates.length;
  let shown=0;
  const onlyFav=(getVal('tplFilterGroup')||'all')==='favorites';
  const builtinEntries=TMPL.map((t,i)=>({t,i,name:t.name,favKey:tplFavKey('b',i),builtin:true}))
    .filter(({name,favKey,builtin})=>matchesTplFilter(name,{builtin,favKey}))
    .sort(compareTplEntries);
  builtinEntries.forEach(({t,i,name,favKey})=>{
    shown++;
    const {wrap,cv}=createTemplateCard({
      name,
      favKey,
      builtin:true,
      id:i,
      selected:i===S.tpl&&!S.userTplId,
      onSelect:()=>selectTpl(i),
    });
    g.appendChild(wrap);
    const thumbOpts=previewOptsFromSnap({tpl:i,c:{bg1:t.bg1,bg2:t.bg2,acc:t.acc,nc:t.nc,nrc:t.nrc},badge:'none'},player,{logo:null,logo2:null,bgImg:null});
    drawTemplatePreview(cv,thumbOpts,{});
  });
  userTemplates.map(ut=>({ut,name:ut.name,favKey:tplFavKey('u',ut.id),builtin:false}))
    .filter(({name,favKey,builtin})=>matchesTplFilter(name,{builtin,favKey}))
    .sort(compareTplEntries)
    .forEach(({ut,favKey})=>{
    shown++;
    const {wrap,cv}=createTemplateCard({
      name:ut.name,
      favKey,
      id:ut.id,
      selected:S.userTplId===ut.id,
      onSelect:()=>loadUserTemplate(ut.id),
      onDelete:e=>deleteUserTemplate(ut.id,e),
    });
    g.appendChild(wrap);
    const s=ut.snap;
    let baseOpts=previewOptsFromSnap(s,player,{logo:null,logo2:null,bgImg:null});
    drawTemplatePreview(cv,baseOpts,s.pos);
    (async()=>{
      try{
        const enriched=await enrichSnapFromAssetIdb(s,ut.id);
        const [logo,logo2,bgImg]=await Promise.all([
          loadThumbImage(enriched.logoData),
          loadThumbImage(enriched.logo2Data),
          loadThumbImage(enriched.bgData),
        ]);
        if(run!==_tplGridRenderRun||!cv.isConnected)return;
        const imgOpts={...baseOpts,logo,logo2,bgImg,logoIsSvg:!!enriched.logoIsSvg,logo2IsSvg:!!enriched.logo2IsSvg,bgOp:enriched.bgOp??baseOpts.bgOp};
        drawTemplatePreview(cv,imgOpts,enriched.pos||s.pos);
      }catch(e){console.warn('Gespeicherte Vorlage konnte nicht als Vorschau geladen werden',ut&&ut.name,e)}
    })();
  });
  updateTplBrowserMeta(shown,total);
  if(!shown)g.innerHTML='<div class="tpl-empty">'+(onlyFav?'Keine Favoriten. Markiere passende Vorlagen mit dem Stern.':'Keine Vorlagen für Filter oder Suche.')+'</div>';
}
function selectTpl(i){
  S.tpl=i;S.userTplId=null;const t=TMPL[i];
  S.pos={};
  S.c={bg1:t.bg1,bg2:t.bg2,acc:t.acc,nc:t.nc,nrc:t.nrc};
  S.badgeColor=t.acc;
  syncPlayerAdjustUi(S.roster[S.active]);
  document.getElementById('tplName').textContent=t.name.toUpperCase();
  setTemplateNameInput(t.name);
  document.querySelectorAll('.tpl-card').forEach(c=>{
    const bi=c.dataset.builtin,ui=c.dataset.user;
    c.classList.toggle('on',bi!==undefined&&+bi===i&&!ui);
  });
  refreshSwatches();
  markTemplatePosBaseline();
  persistSession();render();
  refreshBatchIfVisible();
}

// ══════════════════════════════════════════
// EIGENE VORLAGEN (localStorage)
// ══════════════════════════════════════════
const USER_TPL_KEY='plateforge_user_templates';
const CREATIVE_TEMPLATE_SEEDS=[
  {
    id:'ut_seed_20260526_arctic_bolt',
    name:'EHCB Arctic Bolt',
    updated:1779793200000,
    c:{bg1:'#06111F',bg2:'#DCE7F2',acc:'#B5161E',nc:'#08274D',nrc:'#B5161E'},
    font:"'PF_STATIC_ZingRustDemo-Base'",
    nrFont:"'PF_STATIC_thunderstrikehalf'",
    layout:'F',textAlign:'center',textVAlign:'middle',nrAlign:'center',nrVAlign:'middle',
    nameSz:226,nrSz:284,logoSz:274,logo2Sz:326,frameW:12,bgOp:.88,logoOp:1,
    frame:true,screws:true,bar:false,logoBand:false,showPos:false,showNat:false,showLeague:false,shadowOn:false,glowOn:false,
    logoPath:'Vorlagen Garderobenschilder/EHCB_Spirit Viking.PNG',
    logo2Path:'Vorlagen Garderobenschilder/EHCB Logo.png',
    bgPath:'Vorlagen Garderobenschilder/background 29.png',
    pos:{logo:{x:210,y:276,sz:274},logo2:{x:1782,y:276,sz:326},name:{x:1000,y:375},nr:{x:1000,y:170}},
  },
  {
    id:'ut_seed_20260526_spirit_neon',
    name:'Spirit Neon Rush',
    updated:1779793201000,
    c:{bg1:'#020816',bg2:'#0E1D3A',acc:'#00BFFF',nc:'#FFFFFF',nrc:'#FFB43F'},
    font:"'PF_STATIC_SpaceX'",
    nrFont:"'Russo One'",
    layout:'L',textAlign:'center',textVAlign:'middle',nrAlign:'center',nrVAlign:'middle',
    nameSz:145,nrSz:244,logoSz:285,logo2Sz:245,frameW:8,bgOp:.92,logoOp:1,
    frame:true,screws:false,bar:true,logoBand:true,showPos:false,showNat:false,showLeague:false,shadowOn:true,glowOn:true,glowColor:'#00BFFF',glowSize:38,shBlur:12,shDist:5,
    badge:'circle',badgeColor:'#FFFFFF',badgeFillOp:.92,badgeBorderColor:'#C8102E',badgeScale:82,badgeNrDx:0,badgeNrDy:8,
    logoPath:'Vorlagen Garderobenschilder/Logo Spirit.png',
    logo2Path:'Vorlagen Garderobenschilder/EHCB Logo.png',
    bgPath:'Vorlagen Garderobenschilder/background 31.png',
    pos:{logo:{x:185,y:292,sz:285},logo2:{x:1788,y:276,sz:245},name:{x:1040,y:350},nr:{x:560,y:246}},
  },
  {
    id:'ut_seed_20260526_redline_viking',
    name:'Redline Viking',
    updated:1779793202000,
    c:{bg1:'#180304',bg2:'#050608',acc:'#C8102E',nc:'#111111',nrc:'#FF9C00'},
    font:"'PF_STATIC_soviet-program_regular'",
    nrFont:"'PF_STATIC_ZingRustDemo-Base'",
    layout:'F',textAlign:'center',textVAlign:'middle',nrAlign:'center',nrVAlign:'middle',
    nameSz:210,nrSz:292,logoSz:308,logo2Sz:245,frameW:9,bgOp:.9,logoOp:1,
    frame:true,screws:true,bar:false,logoBand:false,showPos:false,showNat:false,showLeague:false,shadowOn:true,glowOn:false,shBlur:14,shDist:5,
    logoPath:'Vorlagen Garderobenschilder/Spirit Viking 3x.webp',
    logo2Path:'Vorlagen Garderobenschilder/EHCB Logo.png',
    bgPath:'Vorlagen Garderobenschilder/background 2.png',
    pos:{logo:{x:210,y:276,sz:308},logo2:{x:1788,y:275,sz:245},name:{x:1020,y:365},nr:{x:1020,y:158}},
  },
  {
    id:'ut_seed_20260526_gold_crest',
    name:'Gold Crest Pro',
    updated:1779793203000,
    c:{bg1:'#120A02',bg2:'#1C1A12',acc:'#D4B96A',nc:'#F7E7A1',nrc:'#FFFFFF'},
    font:"'PF_STATIC_swera-demo_bold'",
    nrFont:"'PF_STATIC_Ethnocentric-Regular'",
    layout:'R',textAlign:'center',textVAlign:'middle',nrAlign:'center',nrVAlign:'middle',
    nameSz:176,nrSz:250,logoSz:255,logo2Sz:210,frameW:11,bgOp:.86,logoOp:.96,
    frame:true,screws:true,bar:true,logoBand:true,showPos:false,showNat:false,showLeague:false,shadowOn:true,glowOn:true,glowColor:'#D4B96A',glowSize:22,shBlur:16,shDist:5,
    badge:'hexagon',badgeColor:'#101010',badgeFillOp:.82,badgeBorderColor:'#D4B96A',badgeScale:70,badgeNrDx:0,badgeNrDy:4,
    logoPath:'Vorlagen Garderobenschilder/EHCB Logo.png',
    logo2Path:'Vorlagen Garderobenschilder/Logo_EHCB.png',
    bgPath:'Vorlagen Garderobenschilder/background 13.png',
    pos:{logo:{x:1815,y:275,sz:255},logo2:{x:210,y:276,sz:210},name:{x:960,y:342},nr:{x:470,y:276}},
  },
];

function loadUserTemplates(){
  try{return JSON.parse(localStorage.getItem(USER_TPL_KEY)||'[]')}catch(e){return[]}
}
function persistUserTemplates(list){
  try{
    const json=JSON.stringify(list);
    if(json.length>4.8e6)throw new Error('QUOTA');
    localStorage.setItem(USER_TPL_KEY,json);
    return true;
  }catch(e){return false}
}
function snapAssetFlags(snap){
  return{logo:!!(snap.logoData||snap.logoPath),logo2:!!(snap.logo2Data||snap.logo2Path),bg:!!(snap.bgData||snap.bgPath)};
}
function withAssetFlags(snap){
  return{...snap,_assets:snapAssetFlags(snap)};
}
function stripSnapImages(snap){
  const s=withAssetFlags(snap);
  delete s.logoData;delete s.logo2Data;delete s.bgData;delete s.logoIsSvg;delete s.logo2IsSvg;
  return s;
}
function creativeSeedSnapshot(seed){
  const snap={
    tpl:0,
    c:normalizePalette(seed.c),
    font:seed.font||"'Bebas Neue'",
    nrFont:seed.nrFont||'',
    freeTextFont:seed.freeTextFont||'',
    freeText2Font:seed.freeText2Font||'',
    layout:seed.layout||'F',
    textAlign:seed.textAlign||'center',
    textVAlign:seed.textVAlign||'middle',
    nrAlign:seed.nrAlign||seed.textAlign||'center',
    nrVAlign:seed.nrVAlign||seed.textVAlign||'middle',
    badge:seed.badge||'none',
    badgeColor:normalizeHexColor(seed.badgeColor,(seed.c||{}).acc||'#C8102E'),
    badgeFillOp:seed.badgeFillOp??1,
    badgeBorderColor:normalizeHexColor(seed.badgeBorderColor,'#FFFFFF'),
    badgeScale:seed.badgeScale??72,
    badgeNrDx:seed.badgeNrDx||0,
    badgeNrDy:seed.badgeNrDy||0,
    nameMode:'last',
    userTplId:seed.id,
    logoSz:seed.logoSz??220,
    logo2Sz:seed.logo2Sz??120,
    nameSz:seed.nameSz??190,
    nrSz:seed.nrSz??260,
    freeText:seed.freeText||'',
    freeTextSz:seed.freeTextSz??70,
    freeTextRot:seed.freeTextRot||0,
    freeText2:seed.freeText2||'',
    freeText2Sz:seed.freeText2Sz??70,
    freeText2Rot:seed.freeText2Rot||0,
    textBoxPadX:0,
    textBoxPadY:0,
    frameW:seed.frameW??10,
    bgOp:seed.bgOp??.8,
    logoOp:seed.logoOp??1,
    frame:seed.frame!==false,
    screws:seed.screws!==false,
    bar:seed.bar!==false,
    logoBand:seed.logoBand!==false,
    showGuides:true,
    showSafeMargin:true,
    showPos:!!seed.showPos,
    showNat:!!seed.showNat,
    showLeague:!!seed.showLeague,
    shadowOn:seed.shadowOn!==false,
    glowOn:!!seed.glowOn,
    glowColor:normalizeHexColor(seed.glowColor,'#00BFFF'),
    shBlur:seed.shBlur??10,
    shDist:seed.shDist??4,
    glowSize:seed.glowSize??26,
    club:'EHC BIEL-BIENNE',
    leagueTxt:'NATIONAL LEAGUE',
    pos:JSON.parse(JSON.stringify(seed.pos||{})),
    exportScale:2,
    exportFormat:'png',
    exportNamePattern:'last_nr',
    pdfSheet:'a4',
    pdfCutMarks:true,
    pdfIncludeSingle:true,
    batchFilter:'all',
    logoPath:seed.logoPath||'',
    logo2Path:seed.logo2Path||'',
    bgPath:seed.bgPath||'',
  };
  return withAssetFlags(snap);
}
function seedCreativeUserTemplates(){
  const list=loadUserTemplates();
  let changed=false;
  CREATIVE_TEMPLATE_SEEDS.forEach(seed=>{
    const exists=list.some(t=>t.id===seed.id||String(t.name||'').toLowerCase()===seed.name.toLowerCase());
    if(exists)return;
    list.push({id:seed.id,name:seed.name,updated:seed.updated,snap:stripSnapImages(creativeSeedSnapshot(seed))});
    changed=true;
  });
  if(changed&&!persistUserTemplates(list))showWarn('Neue Design-Vorlagen konnten nicht lokal gespeichert werden.');
  return changed;
}
function imageLikelyHasAlpha(src){
  return/png|svg/i.test(String(src||''));
}
function compressImageSource(src,maxSide,quality,keepAlpha){
  return new Promise(resolve=>{
    if(!src||typeof src!=='string'){resolve(null);return}
    const img=new Image();
    img.onload=()=>{
      const m=Math.max(img.width,img.height,1);
      const scale=m>maxSide?maxSide/m:1;
      const w=Math.max(1,Math.round(img.width*scale));
      const h=Math.max(1,Math.round(img.height*scale));
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const cx=c.getContext('2d');
      if(keepAlpha||imageLikelyHasAlpha(src))cx.clearRect(0,0,w,h);
      cx.drawImage(img,0,0,w,h);
      try{
        if(keepAlpha||imageLikelyHasAlpha(src))resolve(c.toDataURL('image/png'));
        else resolve(c.toDataURL('image/jpeg',quality));
      }catch(err){resolve(src.length<600000?src:null)}
    };
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}
function getDesignSnapshotBase(){
  const snap={
    tpl:S.tpl,c:normalizePalette(S.c),font:S.font,nrFont:S.nrFont||'',freeTextFont:S.freeTextFont||'',freeText2Font:S.freeText2Font||'',layout:S.layout,
    textAlign:S.textAlign,textVAlign:S.textVAlign||'alphabetic',
    badge:S.badge,badgeColor:normalizeHexColor(S.badgeColor,S.c.acc),badgeFillOp:S.badgeFillOp??1,badgeBorderColor:normalizeHexColor(S.badgeBorderColor,'#FFFFFF'),
    badgeScale:S.badgeScale??72,badgeNrDx:S.badgeNrDx||0,badgeNrDy:S.badgeNrDy||0,
    nameMode:S.nameMode||getVal('selNameMode'),
    userTplId:S.userTplId||null,
    logoSz:getInt('slLogo'),logo2Sz:getInt('slLogo2'),nameSz:getInt('slName'),nrSz:getInt('slNrSz'),
    freeText:String(S.freeText||''),freeTextSz:getInt('slFreeText')||S.freeTextSz||70,freeTextRot:S.freeTextRot||0,
    freeText2:String(S.freeText2||''),freeText2Sz:getInt('slFreeText2')||S.freeText2Sz||70,freeText2Rot:S.freeText2Rot||0,
    textBoxPadX:S.textBoxPadX||0,textBoxPadY:S.textBoxPadY||0,
    frameW:getInt('slFrame'),bgOp:getInt('slBgOp')/100,logoOp:getInt('slLogoOp')/100,
    frame:S.frame,screws:S.screws,bar:S.bar,logoBand:!!S.logoBand,showGuides:!!S.showGuides,showSafeMargin:S.showSafeMargin!==false,
    showPos:S.showPos,showNat:S.showNat,showLeague:S.showLeague,
    shadowOn:S.shadowOn,glowOn:S.glowOn,glowColor:normalizeHexColor(S.glowColor,'#00BFFF'),
    shBlur:getInt('slShBlur'),shDist:getInt('slShDist'),glowSize:getInt('slGlow'),
    club:getVal('iClub'),leagueTxt:getVal('iLeague'),
    pos:JSON.parse(JSON.stringify(S.pos||{})),
    exportScale:S.exportScale,exportFormat:S.exportFormat,exportNamePattern:S.exportNamePattern||'last_nr',printFormat:S.printFormat||'200x55',pdfSheet:S.pdfSheet||'a4',pdfCutMarks:S.pdfCutMarks!==false,pdfIncludeSingle:S.pdfIncludeSingle!==false,batchFilter:S.batchFilter||'all',
  };
  if(S.nrAlignExplicit&&S.nrAlign!=null)snap.nrAlign=S.nrAlign;
  if(S.nrVAlignExplicit&&S.nrVAlign!=null)snap.nrVAlign=S.nrVAlign;
  return snap;
}
function normalizeExportSettings(src={},fallback={}){
  const boolSetting=(key,def=true)=>{
    if(src[key]!=null)return src[key]!==false;
    if(fallback[key]!=null)return fallback[key]!==false;
    return def;
  };
  return{
    exportScale:src.exportScale??fallback.exportScale??1,
    exportFormat:src.exportFormat||fallback.exportFormat||'png',
    exportNamePattern:src.exportNamePattern||fallback.exportNamePattern||'last_nr',
    printFormat:PRINT_FORMATS[src.printFormat||fallback.printFormat||'200x55']?src.printFormat||fallback.printFormat||'200x55':'200x55',
    pdfSheet:src.pdfSheet||fallback.pdfSheet||'a4',
    pdfCutMarks:boolSetting('pdfCutMarks',true),
    pdfIncludeSingle:boolSetting('pdfIncludeSingle',true),
    batchFilter:src.batchFilter||fallback.batchFilter||'all',
  };
}
function captureExportSettings(){
  return normalizeExportSettings(S);
}
function applyExportSettings(settings){
  const exp=normalizeExportSettings(settings);
  S.exportScale=exp.exportScale;
  S.exportFormat=exp.exportFormat;
  S.exportNamePattern=exp.exportNamePattern;
  S.printFormat=exp.printFormat;
  S.pdfSheet=exp.pdfSheet;
  S.pdfCutMarks=exp.pdfCutMarks;
  S.pdfIncludeSingle=exp.pdfIncludeSingle;
  S.batchFilter=exp.batchFilter;
}
async function buildDesignSnapshot(includeImages){
  const snap=getDesignSnapshotBase();
  if(!includeImages)return snap;
  const lp=document.getElementById('logoPrev'),l2p=document.getElementById('logo2Prev'),bp=document.getElementById('bgPrev');
  if(S.logo&&lp&&lp.src&&lp.style.display!=='none'){
    snap.logoData=await compressImageSource(lp.src,480,0.92,true);
    snap.logoIsSvg=!!S.logoIsSvg&&/svg/i.test(lp.src);
  }
  if(S.logo2&&l2p&&l2p.src&&l2p.style.display!=='none'){
    snap.logo2Data=await compressImageSource(l2p.src,480,0.92,true);
    snap.logo2IsSvg=!!S.logo2IsSvg&&/svg/i.test(l2p.src);
  }
  if(S.bgImg&&bp&&bp.src&&bp.style.display!=='none'){
    snap.bgData=await compressImageSource(bp.src,1400,0.78);
  }
  return snap;
}
async function compressSnapForStorage(snap){
  const s={...snap};
  if(s.logoData)s.logoData=await compressImageSource(s.logoData,400,0.92,true)||null;
  if(s.logo2Data)s.logo2Data=await compressImageSource(s.logo2Data,400,0.92,true)||null;
  if(s.bgData)s.bgData=await compressImageSource(s.bgData,1000,0.75)||null;
  if(!s.logoData)delete s.logoIsSvg;
  if(!s.logo2Data)delete s.logo2IsSvg;
  return s;
}

// Bilder getrennt in IndexedDB (unabhängig von Session/localStorage-Quota)
const ASSET_IDB='plateforge_assets';
const ASSET_STORE='data';
let _assetDbPromise=null;
let _assetSyncTimer=null;

function assetIdbSupported(){return typeof indexedDB!=='undefined'}
function assetKeySet(tplId){
  const p=tplId?`tpl:${tplId}`:'cur';
  return{logo:`${p}:logo`,logo2:`${p}:logo2`,bg:`${p}:bg`};
}
function openAssetVaultDb(){
  if(!assetIdbSupported())return Promise.resolve(null);
  if(_assetDbPromise)return _assetDbPromise;
  _assetDbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(ASSET_IDB,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(ASSET_STORE))db.createObjectStore(ASSET_STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>{_assetDbPromise=null;reject(req.error)};
  });
  return _assetDbPromise;
}
async function idbAssetPut(key,dataUrl){
  if(!dataUrl||!assetIdbSupported())return;
  try{
    const db=await openAssetVaultDb();
    if(!db)return;
    await new Promise((res,rej)=>{
      const tx=db.transaction(ASSET_STORE,'readwrite');
      tx.objectStore(ASSET_STORE).put({v:dataUrl,ts:Date.now()},key);
      tx.oncomplete=()=>res();
      tx.onerror=()=>rej(tx.error);
    });
  }catch(e){}
}
async function idbAssetGet(key){
  if(!assetIdbSupported())return null;
  try{
    const db=await openAssetVaultDb();
    if(!db)return null;
    return await new Promise((res,rej)=>{
      const tx=db.transaction(ASSET_STORE,'readonly');
      const r=tx.objectStore(ASSET_STORE).get(key);
      r.onsuccess=()=>res(r.result?r.result.v:null);
      r.onerror=()=>rej(r.error);
    });
  }catch(e){return null}
}
async function idbAssetDel(key){
  if(!assetIdbSupported())return;
  try{
    const db=await openAssetVaultDb();
    if(!db)return;
    await new Promise((res,rej)=>{
      const tx=db.transaction(ASSET_STORE,'readwrite');
      tx.objectStore(ASSET_STORE).delete(key);
      tx.oncomplete=()=>res();
      tx.onerror=()=>rej(tx.error);
    });
  }catch(e){}
}
async function storeSnapAssetsInIdb(snap,tplId){
  if(!snap)return;
  const k=assetKeySet(tplId);
  if(snap.logoData)await idbAssetPut(k.logo,snap.logoData);
  else await idbAssetDel(k.logo);
  if(snap.logo2Data)await idbAssetPut(k.logo2,snap.logo2Data);
  else await idbAssetDel(k.logo2);
  if(snap.bgData)await idbAssetPut(k.bg,snap.bgData);
  else await idbAssetDel(k.bg);
}
async function enrichSnapFromAssetIdb(snap,tplId){
  const s={...snap};
  const a=snap._assets||{};
  const k=assetKeySet(tplId);
  const cur=assetKeySet(null);
  if(!s.logoData&&a.logo!==false){
    s.logoData=await idbAssetGet(k.logo);
    if(!s.logoData&&!tplId)s.logoData=await idbAssetGet(cur.logo);
    if(!s.logoData&&s.logoPath)s.logoData=encodeURI(s.logoPath);
    if(s.logoData&&!s.logoIsSvg)s.logoIsSvg=false;
    if(s.logoPath&&/\.svg$/i.test(s.logoPath))s.logoIsSvg=true;
  }
  if(!s.logo2Data&&a.logo2!==false){
    s.logo2Data=await idbAssetGet(k.logo2);
    if(!s.logo2Data&&!tplId)s.logo2Data=await idbAssetGet(cur.logo2);
    if(!s.logo2Data&&s.logo2Path)s.logo2Data=encodeURI(s.logo2Path);
    if(s.logo2Data&&!s.logo2IsSvg)s.logo2IsSvg=false;
    if(s.logo2Path&&/\.svg$/i.test(s.logo2Path))s.logo2IsSvg=true;
  }
  if(!s.bgData&&a.bg!==false){
    s.bgData=await idbAssetGet(k.bg);
    if(!s.bgData&&!tplId)s.bgData=await idbAssetGet(cur.bg);
    if(!s.bgData&&s.bgPath)s.bgData=encodeURI(s.bgPath);
  }
  return s;
}
function scheduleAssetIdbSync(){
  clearTimeout(_assetSyncTimer);
  _assetSyncTimer=setTimeout(()=>syncCanvasAssetsToIdb(),700);
}
async function syncCanvasAssetsToIdb(){
  try{
    let snap=withAssetFlags(await compressSnapForStorage(await buildDesignSnapshot(true)));
    await storeSnapAssetsInIdb(snap,null);
    if(S.userTplId)await storeSnapAssetsInIdb(snap,S.userTplId);
  }catch(e){}
}

function applyStateToUI(){
  document.getElementById('selLayout').value=S.layout;
  document.getElementById('selNameMode').value=S.nameMode||'last';
  document.getElementById('iClub').value=S.club||'';
  document.getElementById('iLeague').value=S.leagueTxt||'';
  document.getElementById('slLogo').value=S.logoSz;sv('slLogo','vlLogo');
  document.getElementById('slLogo2').value=S.logo2Sz??90;sv('slLogo2','vlLogo2');
  document.getElementById('slName').value=S.nameSz;sv('slName','vlName');
  document.getElementById('slNrSz').value=S.nrSz;sv('slNrSz','vlNrSz');
  const ft=document.getElementById('iFreeText');if(ft)ft.value=S.freeText||'';
  const fts=document.getElementById('slFreeText');if(fts){fts.value=S.freeTextSz??70;sv('slFreeText','vlFreeText')}
  const ftr=document.getElementById('slFreeTextRot');if(ftr){ftr.value=S.freeTextRot||0;sv('slFreeTextRot','vlFreeTextRot','°')}
  const ft2=document.getElementById('iFreeText2');if(ft2)ft2.value=S.freeText2||'';
  const fts2=document.getElementById('slFreeText2');if(fts2){fts2.value=S.freeText2Sz??70;sv('slFreeText2','vlFreeText2')}
  const ftr2=document.getElementById('slFreeText2Rot');if(ftr2){ftr2.value=S.freeText2Rot||0;sv('slFreeText2Rot','vlFreeText2Rot','°')}
  const tbx=document.getElementById('slTextBoxPadX');if(tbx){tbx.value=S.textBoxPadX||0;sv('slTextBoxPadX','vlTextBoxPadX')}
  const tby=document.getElementById('slTextBoxPadY');if(tby){tby.value=S.textBoxPadY||0;sv('slTextBoxPadY','vlTextBoxPadY')}
  document.getElementById('slBadgeScale').value=S.badgeScale??72;sv('slBadgeScale','vlBadgeScale','%');
  const bdx=document.getElementById('slBadgeNrDx');if(bdx){bdx.value=S.badgeNrDx||0;sv('slBadgeNrDx','vlBadgeNrDx')}
  const bdy=document.getElementById('slBadgeNrDy');if(bdy){bdy.value=S.badgeNrDy||0;sv('slBadgeNrDy','vlBadgeNrDy')}
  document.getElementById('slBadgeFillOp').value=Math.round((S.badgeFillOp??1)*100);sv('slBadgeFillOp','vlBadgeFillOp','%');
  document.getElementById('slFrame').value=S.frameW;sv('slFrame','vlFrame');
  document.getElementById('slBgOp').value=Math.round((S.bgOp??.4)*100);sv('slBgOp','vlBgOp','%');
  document.getElementById('slLogoOp').value=Math.round((S.logoOp??1)*100);sv('slLogoOp','vlLogoOp','%');
  document.getElementById('slShBlur').value=S.shBlur??10;sv('slShBlur','vlShBlur');
  document.getElementById('slShDist').value=S.shDist??4;sv('slShDist','vlShDist');
  document.getElementById('slGlow').value=S.glowSize??26;sv('slGlow','vlGlow');
  document.getElementById('selExpScale').value=S.exportScale;
  document.getElementById('selExpFormat').value=S.exportFormat;
  const enp=document.getElementById('selExpNamePattern');if(enp)enp.value=S.exportNamePattern||'last_nr';
  const pf=document.getElementById('selPrintFormat');if(pf)pf.value=getPrintFormatKey();
  const ps=document.getElementById('selPdfSheet');if(ps)ps.value=S.pdfSheet||'a4';
  const bf=document.getElementById('selBatchFilter');if(bf)bf.value=S.batchFilter||'all';
  const cm=document.getElementById('togPdfCutMarks');if(cm)cm.classList.toggle('on',S.pdfCutMarks!==false);
  const ps1=document.getElementById('togPdfSingle');if(ps1)ps1.classList.toggle('on',S.pdfIncludeSingle!==false);
  syncExportUi();
  syncAlignUi();
  syncNrAlignUi();
  syncFontSelectOptions();
  syncVAlignUi();
  syncNrVAlignUi();
  document.querySelectorAll('#badgeBtns .align-btn').forEach(b=>b.classList.toggle('on',b.dataset.b===S.badge));
  const badgeOn=S.badge&&S.badge!=='none';
  document.getElementById('badgeScaleRow').style.display=badgeOn?'block':'none';
  const ba=document.getElementById('badgeNrAdjustRow');if(ba)ba.style.display=badgeOn?'block':'none';
  const be=document.getElementById('badgeExtraRow');if(be)be.style.display=badgeOn?'block':'none';
  Object.entries(TOG_MAP).forEach(([k,prop])=>{
    const id='tog'+(k==='logoBand'?'LogoBand':k.charAt(0).toUpperCase()+k.slice(1));
    const el=document.getElementById(id);
    if(el)el.classList.toggle('on',!!S[prop]);
  });
  refreshSwatches();
  buildFontGrid();
  syncAriaControls();
}
async function applyDesignSnapshot(snap,opts={}){
  const restoreImages=opts.restoreImages!==false;
  snap=migrateSnapAlign(snap||{});
  const exportSettings=opts.preserveExportSettings
    ? captureExportSettings()
    : normalizeExportSettings(opts.exportSettings||snap,opts.exportSettings?snap:S);
  S.tpl=snap.tpl??0;
  S.c=normalizePalette(snap.c);
  S.font=snap.font||"'Bebas Neue'";
  S.nrFont=snap.nrFont||'';
  S.freeTextFont=snap.freeTextFont||'';
  S.freeText2Font=snap.freeText2Font||'';
  S.layout=snap.layout||'L';
  S.textAlign=snap.textAlign||'left';
  S.textVAlign=snap.textVAlign||'alphabetic';
  S.nrAlignExplicit=snap.nrAlign!=null;
  S.nrVAlignExplicit=snap.nrVAlign!=null;
  S.nrAlign=snap.nrAlign??snap.textAlign??'left';
  S.nrVAlign=snap.nrVAlign??snap.textVAlign??'alphabetic';
  S.badge=snap.badge||'none';
  S.badgeColor=normalizeHexColor(snap.badgeColor,S.c.acc);
  S.badgeFillOp=snap.badgeFillOp??1;
  S.badgeBorderColor=normalizeHexColor(snap.badgeBorderColor,'#FFFFFF');
  S.badgeScale=snap.badgeScale??72;
  S.badgeNrDx=snap.badgeNrDx||0;S.badgeNrDy=snap.badgeNrDy||0;
  S.nameMode=snap.nameMode||'last';
  S.logoSz=snap.logoSz??140;S.logo2Sz=snap.logo2Sz??90;S.nameSz=snap.nameSz??190;S.nrSz=snap.nrSz??260;
  S.freeText=snap.freeText||'';S.freeTextSz=snap.freeTextSz??70;S.freeTextRot=snap.freeTextRot||0;
  S.freeText2=snap.freeText2||'';S.freeText2Sz=snap.freeText2Sz??70;S.freeText2Rot=snap.freeText2Rot||0;
  S.textBoxPadX=snap.textBoxPadX||0;S.textBoxPadY=snap.textBoxPadY||0;
  S.frameW=snap.frameW??10;S.bgOp=snap.bgOp??.4;S.logoOp=snap.logoOp??1;
  S.frame=snap.frame!==false;S.screws=snap.screws!==false;S.bar=snap.bar!==false;
  S.logoBand=snap.logoBand!==false;
  S.showPos=snap.showPos!==false;S.showNat=!!snap.showNat;S.showLeague=snap.showLeague!==false;
  S.showGuides=snap.showGuides!==false;
  S.showSafeMargin=snap.showSafeMargin!==false;
  S.shadowOn=snap.shadowOn!==false;S.glowOn=!!snap.glowOn;S.glowColor=normalizeHexColor(snap.glowColor,'#00BFFF');
  S.shBlur=snap.shBlur??10;S.shDist=snap.shDist??4;S.glowSize=snap.glowSize??26;
  S.club=snap.club||'';S.leagueTxt=snap.leagueTxt||'';
  S.pos=snap.pos?JSON.parse(JSON.stringify(snap.pos)):{};
  applyExportSettings(exportSettings);
  persistActiveFont();
  applyStateToUI();
  setBadge(S.badge);
  if(restoreImages){
    if(snap.logoData){
      await new Promise(res=>{
        const img=new Image();
        img.onload=()=>{clearLogoRasterCache(S.logo);S.logo=img;S.logoIsSvg=!!snap.logoIsSvg;
          const p=document.getElementById('logoPrev');p.src=snap.logoData;p.style.display='block';res()};
        img.onerror=res;img.src=snap.logoData;
      });
    }else{
      clearLogoRasterCache(S.logo);S.logo=null;S.logoIsSvg=false;
      const p=document.getElementById('logoPrev');if(p){p.style.display='none';p.removeAttribute('src')}
    }
    if(snap.logo2Data){
      await new Promise(res=>{
        const img2=new Image();
        img2.onload=()=>{clearLogoRasterCache(S.logo2);S.logo2=img2;S.logo2IsSvg=!!snap.logo2IsSvg;
          const p2=document.getElementById('logo2Prev');p2.src=snap.logo2Data;p2.style.display='block';res()};
        img2.onerror=res;img2.src=snap.logo2Data;
      });
    }else{
      clearLogoRasterCache(S.logo2);S.logo2=null;S.logo2IsSvg=false;
      const p2=document.getElementById('logo2Prev');if(p2){p2.style.display='none';p2.removeAttribute('src')}
      if(S.sel==='logo2')S.sel=null;
    }
    if(snap.bgData){
      await new Promise(res=>{
        const img=new Image();
        img.onload=()=>{S.bgImg=img;const p=document.getElementById('bgPrev');p.src=snap.bgData;p.style.display='block';res()};
        img.onerror=res;img.src=snap.bgData;
      });
    }else{
      S.bgImg=null;
      const p=document.getElementById('bgPrev');if(p){p.style.display='none';p.removeAttribute('src')}
    }
  }
  persistSession();
  render();
}
async function saveUserTemplate(){
  let name=(getVal('userTplName')||'').trim();
  if(!name){
    const activeUser=S.userTplId&&loadUserTemplates().find(t=>t.id===S.userTplId);
    name=(activeUser&&activeUser.name)||(TMPL[S.tpl]&&TMPL[S.tpl].name)||'Vorlage';
    setTemplateNameInput(name);
  }
  if(!name){alert('Bitte einen Namen für die Vorlage eingeben.');return}
  const include=true;
  const inc=document.getElementById('userTplIncImg');if(inc)inc.checked=true;
  const list=loadUserTemplates();
  const existing=list.find(t=>t.name.toLowerCase()===name.toLowerCase());
  if(existing&&!confirm(`„${name}" existiert bereits. Überschreiben?`))return;
  const prevAdjustKey=templateAdjustKey();
  const id=existing?existing.id:'ut_'+Date.now();
  let fullSnap=await buildDesignSnapshot(include);
  if(include)fullSnap=await compressSnapForStorage(fullSnap);
  fullSnap=withAssetFlags(fullSnap);
  await storeSnapAssetsInIdb(fullSnap,id);
  await storeSnapAssetsInIdb(fullSnap,null);
  // Im Browser bleibt die Vorlage schlank; Bilder liegen in IndexedDB und im JSON-Backup.
  const entry={id,name,updated:Date.now(),snap:stripSnapImages(fullSnap)};
  const backupEntry={...entry,snap:fullSnap};
  if(existing)list[list.indexOf(existing)]=entry;else list.push(entry);
  let ok=persistUserTemplates(list);
  if(!ok){
    showErr('Speichern fehlgeschlagen. Ältere Vorlagen löschen oder JSON-Export nutzen.');
    return;
  }
  const jsonNote=await autoBackupTemplateJson(backupEntry);
  copyPlayerNameAdjustmentsForTemplate(prevAdjustKey,'u:'+id);
  finishSaveUserTemplate(entry,name);
  showOk(`Vorlage „${name}" gespeichert.`+(include?' (Bilder in IndexedDB + JSON)':'')+jsonNote);
}
async function autoBackupTemplateJson(entry){
  const payload=await buildMasterTemplatesPayload(entry);
  const saved=await saveMasterTemplatesJson(payload,{backup:true});
  if(saved.master)return saved.backup?' → Workspace + Backup':' → auch in Vorlagen json/';
  return'';
}
function finishSaveUserTemplate(entry,name){
  S.userTplId=entry.id;
  document.getElementById('tplName').textContent=name.toUpperCase();
  setTemplateNameInput(name);
  markTemplatePosBaseline();
  buildTplGrid();renderUserTplList();persistSession();render();
  refreshBatchIfVisible();
}
async function loadUserTemplate(id){
  const t=loadUserTemplates().find(x=>x.id===id);
  if(!t)return;
  S.userTplId=id;
  const enriched=await enrichSnapFromAssetIdb(t.snap,id);
  await applyDesignSnapshot(enriched,{restoreImages:true,preserveExportSettings:true});
  syncPlayerAdjustUi(S.roster[S.active]);
  document.getElementById('tplName').textContent=t.name.toUpperCase();
  setTemplateNameInput(t.name);
  document.querySelectorAll('.tpl-card').forEach(c=>c.classList.toggle('on',c.dataset.user===id));
  markTemplatePosBaseline();
  persistSession();
  refreshBatchIfVisible();
}
function uniqueTemplateName(baseName,list){
  const base=String(baseName||'Vorlage').trim()||'Vorlage';
  const taken=new Set((list||[]).map(t=>String(t.name||'').toLowerCase()));
  let name=base+' (Kopie)';
  let i=2;
  while(taken.has(name.toLowerCase())){
    name=`${base} (Kopie ${i})`;
    i++;
  }
  return name;
}
async function duplicateUserTemplate(){
  const prevAdjustKey=templateAdjustKey();
  let baseName=(getVal('userTplName')||'').trim();
  if(!baseName){
    const t=S.userTplId&&loadUserTemplates().find(x=>x.id===S.userTplId);
    baseName=t?t.name:(TMPL[S.tpl]&&TMPL[S.tpl].name)||'Vorlage';
  }
  const list=loadUserTemplates();
  const trimmed=uniqueTemplateName(baseName,list);
  const id='ut_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  let fullSnap=await buildDesignSnapshot(true);
  fullSnap=await compressSnapForStorage(fullSnap);
  fullSnap=withAssetFlags(fullSnap);
  await storeSnapAssetsInIdb(fullSnap,id);
  const entry={id,name:trimmed,updated:Date.now(),snap:stripSnapImages(fullSnap)};
  list.push(entry);
  if(!persistUserTemplates(list)){
    showErr('Duplizieren fehlgeschlagen (Speicher voll).');
    return;
  }
  await autoBackupTemplateJson({...entry,snap:fullSnap});
  copyPlayerNameAdjustmentsForTemplate(prevAdjustKey,'u:'+id);
  finishSaveUserTemplate(entry,trimmed);
  showOk(`Vorlage „${trimmed}" als Kopie gespeichert.`);
}
async function deleteUserTemplate(id,e){
  e.stopPropagation();
  if(!confirm('Vorlage löschen?'))return;
  const list=loadUserTemplates().filter(t=>t.id!==id);
  persistUserTemplates(list);
  const fav=loadTplFavorites();
  fav.delete(tplFavKey('u',id));
  persistTplFavorites(fav);
  const k=assetKeySet(id);
  await idbAssetDel(k.logo);await idbAssetDel(k.logo2);await idbAssetDel(k.bg);
  if(S.userTplId===id){S.userTplId=null;document.getElementById('tplName').textContent=TMPL[S.tpl].name.toUpperCase();setTemplateNameInput(TMPL[S.tpl].name)}
  buildTplGrid();renderUserTplList();render();
  await saveMasterTemplatesJson(await buildMasterTemplatesPayload(),{backup:true});
}
function setTemplateNameInput(name){
  const inp=document.getElementById('userTplName');
  if(inp)inp.value=name||'';
}
function renderUserTplList(){
  const el=document.getElementById('userTplList');
  const list=loadUserTemplates();
  if(!list.length){el.innerHTML='Noch keine gespeicherten Vorlagen. JSON exportieren/importieren zum Teilen im Team.';return}
  el.innerHTML='';
  list.sort((a,b)=>b.updated-a.updated).forEach(t=>{
    const row=document.createElement('div');
    row.className='saved-font-item'+(S.userTplId===t.id?' on':'');
    row.style.marginBottom='4px';
    const dt=new Date(t.updated).toLocaleDateString('de-CH');
    const fKey=tplFavKey('u',t.id);
    const fOn=isTplFavorite(fKey);
    row.innerHTML=`<button type="button" class="saved-font-del tpl-list-star${fOn?' on':''}" title="${fOn?'Aus Favoriten':'Als Favorit'}">★</button><span class="saved-font-name">${t.name}</span><span style="font-size:.6rem;color:var(--mut)">${dt}</span>
      <button class="saved-font-del" type="button" title="Als JSON exportieren">↓</button>
      <button class="saved-font-del" type="button" title="Löschen">✕</button>`;
    row.querySelector('.tpl-list-star').onclick=e=>{e.stopPropagation();toggleTplFavorite(fKey,e)};
    const btns=row.querySelectorAll('.saved-font-del:not(.tpl-list-star)');
    btns[0].onclick=e=>{e.stopPropagation();exportTemplatesJson(t.id)};
    btns[1].onclick=e=>deleteUserTemplate(t.id,e);
    row.onclick=e=>{if(e.target.classList.contains('saved-font-del'))return;loadUserTemplate(t.id)};
    el.appendChild(row);
  });
}

// JSON export/import – Vorlagen teamübergreifend teilen (nicht an localStorage gebunden)
const TPL_JSON_VER=1;
const META_IDB='plateforge_meta';
const META_STORE='kv';
const WORKSPACE_DIR_KEY='workspaceDir';
const EXPORT_DIR_KEY='exportDir';
const ASSET_DIR_KEY='assetDir';
const FONTS_DIR_KEY='fontsDir';
const PREFERRED_EXPORT_FOLDER='Vorlagen json';
const PREFERRED_ASSET_FOLDER='Vorlagen Garderobenschilder';
const PREFERRED_FONTS_FOLDER='Fonts';
const WORKSPACE_BACKUP_FOLDER='backups';
const WORKSPACE_ROSTER_FOLDER='rosters';
const WORKSPACE_ROSTER_FILE='plateforge_roster.json';
const WORKSPACE_ROSTER_NAMES=[WORKSPACE_ROSTER_FOLDER,'Roster','Kader',PREFERRED_EXPORT_FOLDER,PREFERRED_ASSET_FOLDER];
const TAURI_WORKSPACE_PATH_KEY='plateforge_tauri_workspace_path';

function fsExportSupported(){return typeof window.showDirectoryPicker==='function'}
function tauriCore(){
  const t=window.__TAURI__;
  if(t&&t.core&&typeof t.core.invoke==='function')return t.core;
  if(t&&typeof t.invoke==='function')return t;
  if(window.__TAURI_INTERNALS__&&typeof window.__TAURI_INTERNALS__.invoke==='function')return window.__TAURI_INTERNALS__;
  return null;
}
function isTauriApp(){return !!tauriCore()}
async function nativeInvoke(command,args={}){
  const core=tauriCore();
  if(!core)throw new Error('Tauri-API nicht verfügbar.');
  return core.invoke(command,args);
}
function nativeWorkspacePathSync(){
  try{return localStorage.getItem(TAURI_WORKSPACE_PATH_KEY)||''}catch(e){return ''}
}
async function loadNativeWorkspacePath(){return nativeWorkspacePathSync()}
async function storeNativeWorkspacePath(path){
  try{
    if(path)localStorage.setItem(TAURI_WORKSPACE_PATH_KEY,path);
    else localStorage.removeItem(TAURI_WORKSPACE_PATH_KEY);
  }catch(e){}
}
function nativePathJoin(...parts){
  const clean=parts.flat().filter(p=>p!==undefined&&p!==null&&String(p)!=='').map(String);
  if(!clean.length)return '';
  let out=clean[0];
  clean.slice(1).forEach(part=>{
    out=out.replace(/[\\/]+$/,'')+'/'+part.replace(/^[\\/]+/,'');
  });
  return out;
}
function nativeBasename(path){
  const clean=String(path||'').replace(/[\\/]+$/,'');
  return clean.split(/[\\/]/).pop()||clean||'PlateForge';
}
async function nativeIsDir(path){
  if(!path)return false;
  try{return !!await nativeInvoke('pf_is_dir',{path})}catch(e){return false}
}
async function getNativeChildDir(root,names,{create=false}={}){
  if(!root)return null;
  const list=Array.isArray(names)?names:[names];
  for(const name of list){
    const path=nativePathJoin(root,name);
    if(await nativeIsDir(path))return path;
  }
  if(create&&list.length){
    const path=nativePathJoin(root,list[0]);
    await nativeInvoke('pf_ensure_dir',{path});
    return path;
  }
  return null;
}
async function nativeWorkspaceFolderLabel(names){
  const root=nativeWorkspacePathSync();
  const dir=root?await getNativeChildDir(root,names,{create:false}):null;
  return dir?nativeBasename(dir):null;
}
function openMetaDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(META_IDB,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function storeExportDirHandle(handle){
  return storeMetaHandle(EXPORT_DIR_KEY,handle);
}
async function storeMetaHandle(key,handle){
  const db=await openMetaDb();
  return new Promise((res,rej)=>{
    const tx=db.transaction(META_STORE,'readwrite');
    tx.objectStore(META_STORE).put(handle,key);
    tx.oncomplete=()=>res();
    tx.onerror=()=>rej(tx.error);
  });
}
async function loadExportDirHandle(){
  return loadMetaHandle(EXPORT_DIR_KEY);
}
async function loadMetaHandle(key){
  try{
    const db=await openMetaDb();
    return new Promise((res,rej)=>{
      const tx=db.transaction(META_STORE,'readonly');
      const r=tx.objectStore(META_STORE).get(key);
      r.onsuccess=()=>res(r.result||null);
      r.onerror=()=>rej(r.error);
    });
  }catch(e){return null}
}
async function loadWorkspaceHandle(){
  return loadMetaHandle(WORKSPACE_DIR_KEY);
}
async function ensureDirPermission(handle,write){
  if(!handle)return false;
  const opts={mode:write?'readwrite':'read'};
  try{
    if((await handle.queryPermission(opts))==='granted')return true;
    return(await handle.requestPermission(opts))==='granted';
  }catch(e){return false}
}
async function getChildDir(parent,names,{create=false}={}){
  const list=Array.isArray(names)?names:[names];
  for(const name of list){
    try{return await parent.getDirectoryHandle(name,{create:false})}catch(e){}
  }
  if(create){
    try{return await parent.getDirectoryHandle(list[0],{create:true})}catch(e){}
  }
  return null;
}
let workspaceHealthToken=0;
function htmlEscape(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function formatFileSize(bytes){
  const n=Number(bytes)||0;
  if(n<1024)return n+' B';
  if(n<1024*1024)return(n/1024).toFixed(n<10240?1:0)+' KB';
  return(n/1024/1024).toFixed(n<10*1024*1024?1:0)+' MB';
}
function formatWorkspaceDate(ms){
  const n=Number(ms)||0;
  if(!n)return'';
  try{return new Intl.DateTimeFormat('de-CH',{dateStyle:'short',timeStyle:'short'}).format(new Date(n))}
  catch(e){return new Date(n).toLocaleString()}
}
function workspaceRow(label,state,detail){
  return{label,state,detail};
}
function workspaceRowHtml(row){
  return `<div class="workspace-row ${htmlEscape(row.state)}">
    <span class="workspace-label">${htmlEscape(row.label)}</span>
    <span class="workspace-dot"></span>
    <span class="workspace-detail" title="${htmlEscape(row.detail)}">${htmlEscape(row.detail)}</span>
  </div>`;
}
function syncWorkspaceControls(info={}){
  const finder=document.getElementById('workspaceFinderBtn');
  if(finder)finder.disabled=!(isTauriApp()&&info&&info.path);
}
function renderWorkspaceInfo(info={},rows=[]){
  info=info||{};
  rows=rows||[];
  const el=document.getElementById('workspaceInfo');
  if(!el)return;
  if(!info.name){
    const title=info.title||'Workspace nicht verbunden';
    const msg=info.message||(isTauriApp()
      ? 'Wähle einmal deinen iCloud-Ordner PlateForge.'
      : 'Wähle auf jedem Mac einmal deinen iCloud-Ordner PlateForge.');
    el.innerHTML=`<div class="workspace-top"><span class="workspace-dot warn"></span><strong>${htmlEscape(title)}</strong></div><div>${htmlEscape(msg)}</div>`;
    return;
  }
  const hasErr=rows.some(r=>r.state==='err');
  const hasWarn=rows.some(r=>r.state==='warn');
  const dot=hasErr?'err':hasWarn?'warn':'ok';
  const path=info.path||info.name;
  el.innerHTML=`<div class="workspace-top"><span class="workspace-dot ${dot}"></span><strong>${htmlEscape(info.name)}/</strong></div>
    <div class="workspace-path" title="${htmlEscape(path)}">${htmlEscape(path)}</div>
    <div class="workspace-grid">${rows.map(workspaceRowHtml).join('')}</div>`;
}
function loadingWorkspaceRows(info){
  return[
    workspaceRow('Master',info.jsonDir?'warn':'err',info.jsonDir?'prüfe...':'Ordner fehlt'),
    workspaceRow('Roster',info.rosterDir?'warn':'err',info.rosterDir?'prüfe...':'Ordner fehlt'),
    workspaceRow('Bilder',info.assetDir?'warn':'err',info.assetDir?'prüfe...':'Ordner fehlt'),
    workspaceRow('Fonts',info.fontsDir?'warn':'err',info.fontsDir?'prüfe...':'Ordner fehlt'),
    workspaceRow('Backups',info.backupDir?'warn':'err',info.backupDir?'prüfe...':'Ordner fehlt'),
  ];
}
function findWorkspaceFile(files,fileName){
  const lower=String(fileName).toLowerCase();
  return(files||[]).find(f=>String(f.name||nativeBasename(f.path)).toLowerCase()===lower)||null;
}
function countWorkspaceFiles(files,re){
  return(files||[]).filter(f=>re.test(String(f.path||f.name||''))).length;
}
function latestWorkspaceFile(files){
  return(files||[]).reduce((best,f)=>Number(f.modified||0)>Number(best&&best.modified||0)?f:best,null);
}
function fileDetail(file){
  if(!file)return'fehlt';
  const parts=[];
  if(file.size!=null)parts.push(formatFileSize(file.size));
  const d=formatWorkspaceDate(file.modified);
  if(d)parts.push(d);
  return parts.join(' · ')||'vorhanden';
}
function buildWorkspaceHealthRows(info,lists){
  const master=findWorkspaceFile(lists.json,'plateforge_vorlagen_master.json');
  const roster=findWorkspaceFile(lists.roster,WORKSPACE_ROSTER_FILE);
  const assetCount=countWorkspaceFiles(lists.asset,/\.(png|jpe?g|webp|svg)$/i);
  const fontCount=countWorkspaceFiles(lists.fonts,/\.(ttf|otf|woff2?)$/i);
  const backups=(lists.backup||[]).filter(f=>/\.json$/i.test(String(f.path||f.name||'')));
  const latestBackup=latestWorkspaceFile(backups);
  const latestBackupDate=formatWorkspaceDate(latestBackup&&latestBackup.modified);
  return[
    workspaceRow('Master',master?'ok':info.jsonDir?'warn':'err',master?fileDetail(master):'fehlt'),
    workspaceRow('Roster',roster?'ok':info.rosterDir?'warn':'err',roster?fileDetail(roster):'noch nicht gespeichert'),
    workspaceRow('Bilder',assetCount?'ok':info.assetDir?'warn':'err',assetCount?`${assetCount} Datei(en)`:'Ordner leer/fehlt'),
    workspaceRow('Fonts',fontCount?'ok':info.fontsDir?'warn':'err',fontCount?`${fontCount} Font(s)`:'Ordner leer/fehlt'),
    workspaceRow('Backups',backups.length?'ok':info.backupDir?'warn':'err',backups.length?(latestBackupDate?`${backups.length} · ${latestBackupDate}`:`${backups.length} Datei(en)`):'noch kein Backup'),
  ];
}
async function listNativeWorkspaceFiles(dirPath){
  if(!dirPath)return[];
  try{return await nativeInvoke('pf_read_dir_recursive',{path:dirPath})}catch(e){return[]}
}
async function listHandleWorkspaceFiles(dir){
  if(!dir)return[];
  const files=[];
  try{
    for await(const item of walkDir(dir)){
      const file=await item.handle.getFile();
      files.push({path:item.path,name:item.path.split('/').pop(),size:file.size,modified:file.lastModified});
    }
  }catch(e){}
  return files;
}
async function refreshWorkspaceHealth(info,token){
  if(!info||!info.name)return;
  const useNative=isTauriApp();
  const list=useNative?listNativeWorkspaceFiles:listHandleWorkspaceFiles;
  const [json,roster,asset,fonts,backup]=await Promise.all([
    list(info.jsonDir),
    list(info.rosterDir),
    list(info.assetDir),
    list(info.fontsDir),
    list(info.backupDir),
  ]);
  if(token!==workspaceHealthToken)return;
  renderWorkspaceInfo(info,buildWorkspaceHealthRows(info,{json,roster,asset,fonts,backup}));
}
function updateWorkspaceLabel(info={}){
  info=info||{};
  workspaceHealthToken++;
  const el=document.getElementById('workspaceInfo');
  if(!el)return;
  syncWorkspaceControls(info);
  if(!isTauriApp()&&!fsExportSupported()){
    renderWorkspaceInfo({title:'Workspace nicht verfügbar',message:'Workspace-Sync benötigt Chrome/Edge. Safari kann lokale Ordner nicht dauerhaft verbinden.'});
    return;
  }
  if(!info.name){
    renderWorkspaceInfo(null);
    return;
  }
  const token=workspaceHealthToken;
  renderWorkspaceInfo(info,loadingWorkspaceRows(info));
  refreshWorkspaceHealth(info,token);
}
async function openWorkspaceInFinder(){
  if(!isTauriApp())return;
  const root=await loadNativeWorkspacePath();
  if(!root){showWarn('Bitte zuerst den PlateForge Workspace wählen.');return}
  try{
    await nativeInvoke('pf_open_path',{path:root});
    showOk('Workspace im Finder geöffnet.');
  }catch(e){showErr('Finder: '+(e.message||e))}
}
async function connectNativeWorkspace(root,{showStatus=false}={}){
  if(!root)return null;
  try{
    await storeNativeWorkspacePath(root);
    const jsonDir=await getNativeChildDir(root,[PREFERRED_EXPORT_FOLDER,'templates'],{create:true});
    const rosterDir=await getNativeChildDir(root,WORKSPACE_ROSTER_NAMES,{create:true});
    const assetDir=await getNativeChildDir(root,[PREFERRED_ASSET_FOLDER,'assets'],{create:false});
    const fontsDir=await getNativeChildDir(root,[PREFERRED_FONTS_FOLDER,'fonts'],{create:false});
    const backupDir=await getNativeChildDir(root,[WORKSPACE_BACKUP_FOLDER,'Backups'],{create:true});

    updateWorkspaceLabel({name:nativeBasename(root),path:root,jsonDir,rosterDir,assetDir,fontsDir,backupDir});
    updateJsonExportDirLabel(PREFERRED_EXPORT_FOLDER);
    if(jsonDir){
      const r=await autoImportTemplatesFromNativeDir(jsonDir,true);
      applyImportResult(r,'Workspace',{reloadActive:false});
    }
    if(rosterDir)await importWorkspaceRoster({dir:rosterDir,force:false,showStatus:false});
    if(assetDir)await scanNativeAssetFolder(assetDir,nativeBasename(assetDir));
    else{scannedAssetItems=[];renderAssetGrid()}
    if(fontsDir)await scanNativeFontsFolder(fontsDir,nativeBasename(fontsDir));
    if(showStatus){
      const missing=[];
      if(!jsonDir)missing.push(PREFERRED_EXPORT_FOLDER);
      if(!rosterDir)missing.push(WORKSPACE_ROSTER_FOLDER);
      if(!assetDir)missing.push(PREFERRED_ASSET_FOLDER);
      if(!fontsDir)missing.push(PREFERRED_FONTS_FOLDER);
      if(missing.length)showWarn('Workspace verbunden. Nicht gefunden: '+missing.join(', '));
      else showOk('Workspace verbunden: '+nativeBasename(root));
    }
    return{path:root,jsonDir,rosterDir,assetDir,fontsDir,backupDir};
  }catch(e){
    updateWorkspaceLabel(null);
    if(showStatus)showErr('Workspace: '+(e.message||e));
    return null;
  }
}
async function connectWorkspace(handle,{showStatus=false}={}){
  if(!handle)return null;
  if(!await ensureDirPermission(handle,true)){
    updateWorkspaceLabel(null);
    if(showStatus)showWarn('Kein Zugriff auf den Workspace. Bitte Ordner erneut wählen.');
    return null;
  }
  await storeMetaHandle(WORKSPACE_DIR_KEY,handle);
  const jsonDir=await getChildDir(handle,[PREFERRED_EXPORT_FOLDER,'templates'],{create:true});
  const rosterDir=await getChildDir(handle,WORKSPACE_ROSTER_NAMES,{create:true});
  const assetDir=await getChildDir(handle,[PREFERRED_ASSET_FOLDER,'assets'],{create:false});
  const fontsDir=await getChildDir(handle,[PREFERRED_FONTS_FOLDER,'fonts'],{create:false});
  const backupDir=await getChildDir(handle,[WORKSPACE_BACKUP_FOLDER,'Backups'],{create:true});

  if(jsonDir)await storeMetaHandle(EXPORT_DIR_KEY,jsonDir);
  if(assetDir)await storeMetaHandle(ASSET_DIR_KEY,assetDir);
  if(fontsDir)await storeMetaHandle(FONTS_DIR_KEY,fontsDir);

  updateWorkspaceLabel({name:handle.name,jsonDir,rosterDir,assetDir,fontsDir,backupDir});
  if(jsonDir){
    updateJsonExportDirLabel(jsonDir.name);
    const r=await autoImportTemplatesFromDir(jsonDir,true);
    applyImportResult(r,'Workspace',{reloadActive:false});
  }
  if(rosterDir)await importWorkspaceRoster({dir:rosterDir,force:false,showStatus:false});
  if(assetDir)await scanAssetFolder(assetDir);
  else renderAssetGrid();
  if(fontsDir)await scanFontsFolder(fontsDir);
  if(showStatus){
    const missing=[];
    if(!jsonDir)missing.push(PREFERRED_EXPORT_FOLDER);
    if(!rosterDir)missing.push(WORKSPACE_ROSTER_FOLDER);
    if(!assetDir)missing.push(PREFERRED_ASSET_FOLDER);
    if(!fontsDir)missing.push(PREFERRED_FONTS_FOLDER);
    if(missing.length)showWarn('Workspace verbunden. Nicht gefunden: '+missing.join(', '));
    else showOk('Workspace verbunden: '+handle.name);
  }
  return{handle,jsonDir,assetDir,fontsDir,backupDir};
}
async function pickNativeWorkspaceFolder(){
  try{
    const selected=await nativeInvoke('plugin:dialog|open',{
      options:{directory:true,multiple:false,title:'PlateForge Workspace wählen'},
    });
    const path=Array.isArray(selected)?selected[0]:selected;
    if(!path)return null;
    return await connectNativeWorkspace(path,{showStatus:true});
  }catch(e){
    showErr('Workspace: '+(e.message||e));
    return null;
  }
}
async function pickWorkspaceFolder(){
  if(isTauriApp())return pickNativeWorkspaceFolder();
  if(!fsExportSupported()){
    showWarn('Workspace-Sync benötigt Chrome/Edge. Safari unterstützt die Ordner-API nicht.');
    return null;
  }
  try{
    const h=await window.showDirectoryPicker({
      mode:'readwrite',
      id:'plateforge-workspace',
      startIn:'documents',
    });
    return await connectWorkspace(h,{showStatus:true});
  }catch(e){
    if(e&&e.name!=='AbortError')showErr('Workspace: '+(e.message||e));
    return null;
  }
}
async function syncWorkspaceNow(showStatus=false){
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    if(!root){
      updateWorkspaceLabel(null);
      if(showStatus)showWarn('Bitte zuerst den PlateForge Workspace wählen.');
      return null;
    }
    return connectNativeWorkspace(root,{showStatus});
  }
  if(!fsExportSupported()){
    updateWorkspaceLabel(null);
    if(showStatus)showWarn('Workspace-Sync benötigt Chrome/Edge.');
    return null;
  }
  const h=await loadWorkspaceHandle();
  if(!h){
    updateWorkspaceLabel(null);
    if(showStatus)showWarn('Bitte zuerst den PlateForge Workspace wählen.');
    return null;
  }
  return connectWorkspace(h,{showStatus});
}
async function initWorkspace(){
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    if(!root){updateWorkspaceLabel(null);return null}
    return connectNativeWorkspace(root,{showStatus:false});
  }
  if(!fsExportSupported()){updateWorkspaceLabel(null);return null}
  const h=await loadWorkspaceHandle();
  if(!h){updateWorkspaceLabel(null);return null}
  return connectWorkspace(h,{showStatus:false});
}
function backupTimestamp(){
  return new Date().toISOString().replace(/[:.]/g,'-').replace('T','_').slice(0,19);
}
async function writeWorkspaceBackupJson(jsonText,base='plateforge_vorlagen_master'){
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    if(!root)return false;
    try{
      const backupDir=await getNativeChildDir(root,[WORKSPACE_BACKUP_FOLDER,'Backups'],{create:true});
      await nativeInvoke('pf_write_text_atomic',{
        path:nativePathJoin(backupDir,`${base}_${backupTimestamp()}.json`),
        contents:jsonText,
      });
      return true;
    }catch(e){
      console.warn('writeWorkspaceBackupJson native',e);
      return false;
    }
  }
  if(!fsExportSupported())return false;
  const h=await loadWorkspaceHandle();
  if(!h||!await ensureDirPermission(h,true))return false;
  const backupDir=await getChildDir(h,[WORKSPACE_BACKUP_FOLDER,'Backups'],{create:true});
  if(!backupDir)return false;
  try{
    const fh=await backupDir.getFileHandle(`${base}_${backupTimestamp()}.json`,{create:true});
    const w=await fh.createWritable();
    await w.write(jsonText);
    await w.close();
    return true;
  }catch(e){
    console.warn('writeWorkspaceBackupJson',e);
    return false;
  }
}
async function saveMasterTemplatesJson(payload,{backup=true}={}){
  const json=JSON.stringify(payload,null,2);
  const master=await writeJsonToExportDir('plateforge_vorlagen_master.json',json);
  const backupOk=master&&backup?await writeWorkspaceBackupJson(json):false;
  return{master,backup:backupOk};
}
function rosterPayload(ts=Date.now()){
  return{
    plateforge:TPL_JSON_VER,
    exported:ts,
    app:'PlateForge',
    type:'roster',
    roster:S.roster,
    active:S.active,
  };
}
function normalizeRosterRows(rows){
  if(!Array.isArray(rows))return null;
  return rows.map(p=>normalizeRosterPlayer({
    first:String(p.first||'').trim().toUpperCase(),
    last:String(p.last||'').trim().toUpperCase(),
    nr:String(p.nr||'').trim(),
    pos:String(p.pos||p.playerPos||'').trim().toUpperCase(),
    nat:String(p.nat||'').trim().toUpperCase(),
    playerPos:p.playerPos!=null?p.playerPos:(p.pos||''),
    nameAdjustments:p.nameAdjustments||p.nameOffsets||p.nameAdjustByTemplate,
    nameDx:Number(p.nameDx||0),
    nameDy:Number(p.nameDy||0),
  })).filter(p=>p.first||p.last||p.nr);
}
async function getWorkspaceRosterDir({create=false}={}){
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    if(!root)return null;
    return getNativeChildDir(root,WORKSPACE_ROSTER_NAMES,{create});
  }
  const h=await loadWorkspaceHandle();
  if(!h||!await ensureDirPermission(h,create))return null;
  return getChildDir(h,WORKSPACE_ROSTER_NAMES,{create});
}
async function readNativeWorkspaceRosterPayload(dirPath){
  if(!dirPath)return null;
  try{
    const text=await nativeInvoke('pf_read_text',{path:nativePathJoin(dirPath,WORKSPACE_ROSTER_FILE)});
    if(!text)return null;
    const raw=JSON.parse(text);
    const rows=normalizeRosterRows(raw.roster||raw.players||[]);
    if(!rows)return null;
    return{...raw,roster:rows,exported:raw.exported||raw.ts||0};
  }catch(e){return null}
}
async function readWorkspaceRosterPayload(dir){
  const rosterDir=dir||await getWorkspaceRosterDir({create:false});
  if(!rosterDir)return null;
  if(typeof rosterDir==='string')return readNativeWorkspaceRosterPayload(rosterDir);
  try{
    const fh=await rosterDir.getFileHandle(WORKSPACE_ROSTER_FILE,{create:false});
    const file=await fh.getFile();
    const raw=JSON.parse(await file.text());
    const rows=normalizeRosterRows(raw.roster||raw.players||[]);
    if(!rows)return null;
    return{...raw,roster:rows,exported:raw.exported||raw.ts||file.lastModified||0};
  }catch(e){return null}
}
function applyWorkspaceRosterPayload(payload,{showStatus=false,label='Workspace-Roster'}={}){
  const rows=normalizeRosterRows(payload&&payload.roster);
  if(!rows)return false;
  S.roster=rows;
  S.active=Math.min(payload.active||0,Math.max(0,S.roster.length-1));
  migrateLegacyNameAdjustmentsToCurrentTemplate();
  suppressRosterWorkspaceWrite=true;
  persistRoster(payload.exported||Date.now());
  suppressRosterWorkspaceWrite=false;
  buildRoster();
  if(S.roster.length){
    const p=S.roster[S.active];
    document.getElementById('iFirst').value=p.first||'';
    document.getElementById('iLast').value=p.last||'';
    document.getElementById('iNr').value=p.nr||'';
    document.getElementById('iPos').value=p.pos||'';
    document.getElementById('iNat').value=p.nat||'';
    syncPlayerAdjustUi(p);
  }
  updatePlayerNav();render();refreshBatchIfVisible();
  if(showStatus)showOk(`${label}: ${S.roster.length} Spieler übernommen.`);
  return true;
}
async function importWorkspaceRoster({dir=null,force=false,showStatus=false}={}){
  const payload=await readWorkspaceRosterPayload(dir);
  if(!payload){
    if(showStatus)showWarn('Kein '+WORKSPACE_ROSTER_FILE+' im Workspace gefunden.');
    return false;
  }
  const localTs=rosterLastPersistTs||0;
  if(!force&&localTs&&payload.exported&&payload.exported<localTs)return false;
  return applyWorkspaceRosterPayload(payload,{showStatus,label:'Workspace-Roster'});
}
async function writeWorkspaceRosterNow(){
  if(isTauriApp()){
    const dir=await getWorkspaceRosterDir({create:true});
    if(!dir)return false;
    try{
      const ts=rosterLastPersistTs||Date.now();
      await nativeInvoke('pf_write_text_atomic',{
        path:nativePathJoin(dir,WORKSPACE_ROSTER_FILE),
        contents:JSON.stringify(rosterPayload(ts),null,2),
      });
      return true;
    }catch(e){
      console.warn('writeWorkspaceRosterNow native',e);
      return false;
    }
  }
  if(!fsExportSupported())return false;
  const dir=await getWorkspaceRosterDir({create:true});
  if(!dir)return false;
  try{
    const ts=rosterLastPersistTs||Date.now();
    const fh=await dir.getFileHandle(WORKSPACE_ROSTER_FILE,{create:true});
    const w=await fh.createWritable();
    await w.write(JSON.stringify(rosterPayload(ts),null,2));
    await w.close();
    return true;
  }catch(e){
    console.warn('writeWorkspaceRosterNow',e);
    return false;
  }
}
function scheduleWorkspaceRosterWrite(){
  clearTimeout(rosterWorkspaceWriteTimer);
  rosterWorkspaceWriteTimer=setTimeout(()=>writeWorkspaceRosterNow(),650);
}
function updateJsonExportDirLabel(name){
  const el=document.getElementById('jsonExportDirInfo');
  if(!el)return;
  if(name)el.textContent='JSON-Export → '+name+'/';
  else if(isTauriApp())el.textContent=nativeWorkspacePathSync()
    ? 'JSON-Export → '+PREFERRED_EXPORT_FOLDER+'/'
    : 'JSON-Export → bitte iCloud Workspace wählen';
  else if(fsExportSupported())el.textContent='JSON-Export → bitte 📁 Zielordner „'+PREFERRED_EXPORT_FOLDER+'“ wählen';
  else el.textContent='JSON-Export → Download (Ordner-API nicht verfügbar, z. B. Safari)';
}
async function pickJsonExportFolder(showTip,skipImport){
  if(isTauriApp()){
    const connected=await pickNativeWorkspaceFolder();
    if(!connected)return null;
    if(!skipImport)await syncTemplatesFromJsonFolder(false);
    return{name:PREFERRED_EXPORT_FOLDER};
  }
  if(!fsExportSupported()){
    showWarn('Dieser Browser kann keinen Projektordner beschreiben — Export geht in den Download-Ordner.');
    return null;
  }
  try{
    if(showTip)alert(
      'Bitte den Ordner „'+PREFERRED_EXPORT_FOLDER+'“ wählen\n'+
      '(im Plate-Forge-Projekt neben index.html).\n\n'+
      'Danach speichert Master-JSON automatisch dort — ohne Download-Dialog.'
    );
    const handle=await window.showDirectoryPicker({
      mode:'readwrite',
      id:'plateforge-vorlagen-json',
      startIn:'documents',
    });
    await storeExportDirHandle(handle);
    updateJsonExportDirLabel(handle.name);
    if(!skipImport)await syncTemplatesFromJsonFolder(false,handle);
    showOk('Export-Ordner: '+handle.name);
    return handle;
  }catch(e){
    if(e&&e.name!=='AbortError')showErr('Ordnerwahl fehlgeschlagen: '+(e.message||e));
    return null;
  }
}
async function writeJsonToExportDir(filename,jsonText){
  if(isTauriApp()){
    let root=await loadNativeWorkspacePath();
    if(!root){
      const connected=await pickNativeWorkspaceFolder();
      if(!connected)return false;
      root=await loadNativeWorkspacePath();
    }
    try{
      const dir=await getNativeChildDir(root,[PREFERRED_EXPORT_FOLDER,'templates'],{create:true});
      await nativeInvoke('pf_write_text_atomic',{path:nativePathJoin(dir,filename),contents:jsonText});
      updateJsonExportDirLabel(PREFERRED_EXPORT_FOLDER);
      return true;
    }catch(e){
      console.warn('writeJsonToExportDir native',e);
      return false;
    }
  }
  if(!fsExportSupported())return false;
  let dir=await loadExportDirHandle();
  if(!dir)dir=await pickJsonExportFolder(true,true);
  if(!dir)return false;
  if(!(await ensureDirPermission(dir,true))){
    dir=await pickJsonExportFolder(true,true);
    if(!dir||!(await ensureDirPermission(dir,true)))return false;
  }
  try{
    const fh=await dir.getFileHandle(filename,{create:true});
    const w=await fh.createWritable();
    await w.write(jsonText);
    await w.close();
    return true;
  }catch(e){
    console.warn('writeJsonToExportDir',e);
    return false;
  }
}
function downloadJsonFile(obj,filename){
  try{
    const json=JSON.stringify(obj,null,2);
    const blob=new Blob([json],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;a.style.display='none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),8000);
    return true;
  }catch(e){
    showErr('Export fehlgeschlagen: '+(e.message||'Datei zu gross'));
    return false;
  }
}
async function saveJsonExport(obj,filename){
  const json=JSON.stringify(obj,null,2);
  if(await writeJsonToExportDir(filename,json)){
    const dir=isTauriApp()?null:await loadExportDirHandle();
    const folder=isTauriApp()&&nativeWorkspacePathSync()
      ? nativeBasename(nativeWorkspacePathSync())+'/'+PREFERRED_EXPORT_FOLDER
      : (dir?dir.name:PREFERRED_EXPORT_FOLDER);
    showOk('Gespeichert: '+folder+'/'+filename);
    return true;
  }
  if(downloadJsonFile(obj,filename)){
    showWarn('In Download-Ordner gespeichert (Ordner „'+PREFERRED_EXPORT_FOLDER+'“ nicht verbunden — 📁 wählen).');
    return true;
  }
  return false;
}
function buildTemplatesExportPayload(onlyId){
  let list=loadUserTemplates();
  if(onlyId)list=list.filter(t=>t.id===onlyId);
  return{plateforge:TPL_JSON_VER,exported:Date.now(),app:'PlateForge',templates:list};
}
async function buildMasterTemplatesPayload(extraEntry){
  const byId=new Map();
  loadUserTemplates().forEach(t=>byId.set(t.id,t));
  if(extraEntry)byId.set(extraEntry.id,extraEntry);
  const templates=[];
  for(const t of byId.values()){
    let snap=t.snap?await enrichSnapFromAssetIdb(t.snap,t.id):getDesignSnapshotBase();
    if(extraEntry&&extraEntry.id===t.id&&extraEntry.snap)snap=extraEntry.snap;
    snap={...snap,c:normalizePalette(snap.c),badgeColor:normalizeHexColor(snap.badgeColor,(snap.c||{}).acc||'#C8102E'),badgeBorderColor:normalizeHexColor(snap.badgeBorderColor,'#FFFFFF'),glowColor:normalizeHexColor(snap.glowColor,'#00BFFF')};
    snap=await compressSnapForStorage(snap);
    templates.push({...t,snap});
  }
  templates.sort((a,b)=>(b.updated||0)-(a.updated||0));
  return{plateforge:TPL_JSON_VER,exported:Date.now(),app:'PlateForge',backupType:'master',templates};
}
async function exportTemplatesJson(onlyId){
  try{
    const list=loadUserTemplates();
    if(onlyId&&!list.find(t=>t.id===onlyId))return;
    const includeImg=document.getElementById('userTplIncImg').checked;
    if(!onlyId&&!list.length){
      const name=(getVal('userTplName')||'').trim()||'design';
      let snap=await buildDesignSnapshot(includeImg);
      if(includeImg)snap=await compressSnapForStorage(snap);
      const fname='plateforge_vorlage_'+safeName(name)+'.json';
      if(!await saveJsonExport({plateforge:TPL_JSON_VER,exported:Date.now(),app:'PlateForge',templates:[{id:'ut_export',name,updated:Date.now(),snap}]},fname))return;
      return;
    }
    let payload,fname;
    if(onlyId){
      let templates=list.filter(t=>t.id===onlyId);
      templates=await Promise.all(templates.map(async t=>{
        let snap=t.snap?await enrichSnapFromAssetIdb(t.snap,t.id):getDesignSnapshotBase();
        if(includeImg&&(snap.logoData||snap.logo2Data||snap.bgData))snap=await compressSnapForStorage(snap);
        else if(!includeImg)snap=stripSnapImages(snap);
        return{...t,snap};
      }));
      const one=templates[0];
      payload={plateforge:TPL_JSON_VER,exported:Date.now(),app:'PlateForge',templates};
      fname=one?'plateforge_'+safeName(one.name)+'.json':'plateforge_vorlage.json';
    }else{
      payload=await buildMasterTemplatesPayload();
      fname='plateforge_vorlagen_master.json';
    }
    if(!await saveJsonExport(payload,fname))return;
  }catch(e){showErr('JSON-Export: '+(e.message||e))}
}
async function initJsonExportDir(){
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    updateJsonExportDirLabel(root?PREFERRED_EXPORT_FOLDER:null);
    if(root)await syncTemplatesFromJsonFolder(false);
    return;
  }
  if(!fsExportSupported()){updateJsonExportDirLabel(null);return}
  const h=await loadExportDirHandle();
  if(h&&await ensureDirPermission(h,true)){
    updateJsonExportDirLabel(h.name);
    await syncTemplatesFromJsonFolder(false,h);
  }else updateJsonExportDirLabel(null);
}
async function* walkDir(dir,prefix=''){
  for await(const [name,handle] of dir.entries()){
    const path=prefix?prefix+'/'+name:name;
    if(handle.kind==='directory')yield* walkDir(handle,path);
    else yield{path,handle};
  }
}
const USER_ASSETS_META_KEY='plateforge_user_assets';
const HIDDEN_ASSETS_KEY='plateforge_hidden_assets';
let userAssets=[];
let scannedAssetItems=[];

function loadHiddenAssets(){
  try{return new Set(JSON.parse(localStorage.getItem(HIDDEN_ASSETS_KEY)||'[]'))}catch(e){return new Set()}
}
function persistHiddenAssets(set){
  try{localStorage.setItem(HIDDEN_ASSETS_KEY,JSON.stringify([...set]))}catch(e){}
}

function userLibIdbKey(id){return'userlib:'+id}
function persistUserAssetsMeta(){
  try{
    localStorage.setItem(USER_ASSETS_META_KEY,JSON.stringify(userAssets.map(({id,name})=>({id,name}))));
  }catch(e){showWarn('Bild-Bibliothek konnte nicht gespeichert werden.')}
}
async function restoreUserAssets(){
  userAssets=[];
  let meta=[];
  try{meta=JSON.parse(localStorage.getItem(USER_ASSETS_META_KEY)||'[]')}catch(e){meta=[]}
  for(const m of meta){
    if(!m.id)continue;
    const dataUrl=await idbAssetGet(userLibIdbKey(m.id));
    if(dataUrl)userAssets.push({id:m.id,name:m.name,url:dataUrl});
  }
}
async function importAssetImages(inp){
  const files=Array.from(inp.files||[]);
  inp.value='';
  if(!files.length)return;
  let added=0;
  for(const file of files){
    if(!/\.(png|jpe?g|webp|svg)$/i.test(file.name))continue;
    if(file.size>8*1024*1024){showWarn(file.name+' zu gross (max. 8 MB).');continue}
    try{
      const dataUrl=await readFileAsDataUrl(file);
      const prev=userAssets.find(a=>a.name.toLowerCase()===file.name.toLowerCase());
      if(prev)await idbAssetDel(userLibIdbKey(prev.id));
      const id='ua_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
      await idbAssetPut(userLibIdbKey(id),dataUrl);
      userAssets=userAssets.filter(a=>a.name.toLowerCase()!==file.name.toLowerCase());
      userAssets.push({id,name:file.name,url:dataUrl});
      added++;
    }catch(e){}
  }
  persistUserAssetsMeta();
  renderAssetGrid();
  if(added)showOk(`${added} Bild(er) in Bibliothek geladen.`);
  else showWarn('Keine gültigen Bilddateien gewählt.');
}
function updateAssetFolderLabel(assetName,fontName){
  const el=document.getElementById('assetFolderInfo');
  if(!el)return;
  const parts=[];
  if(isTauriApp()){
    parts.push(assetName?'Bilder → '+assetName+'/':'Bilder → Workspace-Ordner fehlt');
    parts.push(fontName?'Fonts → '+fontName+'/':'Fonts → Workspace-Ordner fehlt');
  }else if(fsExportSupported()){
    parts.push(assetName?'Bilder → '+assetName+'/':'Bilder → 📁 '+PREFERRED_ASSET_FOLDER+' wählen');
    parts.push(fontName?'Fonts → '+fontName+'/':'Fonts → 🔤 '+PREFERRED_FONTS_FOLDER+' wählen');
  }else{
    parts.push('Ordnerwahl nur Chrome/Edge · Safari: 📤 Bilder/Fonts hochladen');
  }
  el.textContent=parts.join(' · ');
}
async function pickAssetFolder(){
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    if(!root){showWarn('Bitte zuerst unter Optionen den PlateForge Workspace wählen.');return null}
    const dir=await getNativeChildDir(root,[PREFERRED_ASSET_FOLDER,'assets'],{create:true});
    await scanNativeAssetFolder(dir,nativeBasename(dir));
    return dir;
  }
  if(!fsExportSupported()){
    const inp=document.getElementById('assetFolderInp');
    if(inp){inp.click();return null}
    showWarn('Ordnerwahl nicht verfügbar – bitte 📤 Bilder hochladen.');
    return null;
  }
  try{
    const h=await window.showDirectoryPicker({mode:'read',id:'plateforge-assets',startIn:'documents'});
    await storeMetaHandle(ASSET_DIR_KEY,h);
    await scanAssetFolder(h);
    return h;
  }catch(e){if(e&&e.name!=='AbortError')showErr('Asset-Ordner: '+(e.message||e));return null}
}
async function pickFontsFolder(){
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    if(!root){showWarn('Bitte zuerst unter Optionen den PlateForge Workspace wählen.');return null}
    const dir=await getNativeChildDir(root,[PREFERRED_FONTS_FOLDER,'fonts'],{create:true});
    await scanNativeFontsFolder(dir,nativeBasename(dir));
    return dir;
  }
  if(!fsExportSupported()){
    const inp=document.getElementById('fontsFolderInp');
    if(inp){inp.click();return null}
    showWarn('Font-Ordner nicht verfügbar – bitte 📤 Fonts hochladen.');
    return null;
  }
  try{
    const h=await window.showDirectoryPicker({mode:'read',id:'plateforge-fonts',startIn:'documents'});
    await storeMetaHandle(FONTS_DIR_KEY,h);
    await scanFontsFolder(h);
    return h;
  }catch(e){if(e&&e.name!=='AbortError')showErr('Fonts-Ordner: '+(e.message||e));return null}
}
async function importAssetFolder(inp){
  const files=Array.from(inp.files||[]);
  inp.value='';
  scannedAssetItems=[];
  for(const file of files){
    if(!/\.(png|jpe?g|webp|svg)$/i.test(file.name))continue;
    scannedAssetItems.push({url:URL.createObjectURL(file),name:file.name});
  }
  const label=scannedAssetItems.length?scannedAssetItems.length+' Bild(er)':'Ordner leer';
  updateAssetFolderLabel(label,(await loadMetaHandle(FONTS_DIR_KEY))?.name||null);
  renderAssetGrid();
  if(scannedAssetItems.length)showOk(`${scannedAssetItems.length} Bild(er) aus Ordner geladen.`);
  else showWarn('Im gewählten Ordner wurden keine Bilder gefunden.');
}
async function importFontsFolder(inp){
  const files=Array.from(inp.files||[]);
  inp.value='';
  let added=0;
  for(const file of files){
    if(!/\.(ttf|otf|woff2?)$/i.test(file.name))continue;
    const r=await registerUploadedFont(file);
    if(r.ok)added++;
  }
  renderSavedFonts();buildFontGrid();
  updateAssetFolderLabel((await loadMetaHandle(ASSET_DIR_KEY))?.name||null,added?added+' Font(s)':'Ordner');
  if(added)showOk(`${added} Font(s) aus Ordner geladen.`);
  else showWarn('Im gewählten Ordner wurden keine Fonts gefunden.');
}
async function initLocalFolders(){
  await restoreUserAssets();
  if(isTauriApp()){
    const root=await loadNativeWorkspacePath();
    if(!root){
      updateAssetFolderLabel(null,null);
      renderAssetGrid();
      return;
    }
    const assetDir=await getNativeChildDir(root,[PREFERRED_ASSET_FOLDER,'assets'],{create:false});
    const fontsDir=await getNativeChildDir(root,[PREFERRED_FONTS_FOLDER,'fonts'],{create:false});
    updateAssetFolderLabel(assetDir?nativeBasename(assetDir):null,fontsDir?nativeBasename(fontsDir):null);
    if(assetDir)await scanNativeAssetFolder(assetDir,nativeBasename(assetDir));
    else renderAssetGrid();
    if(fontsDir)await scanNativeFontsFolder(fontsDir,nativeBasename(fontsDir));
    return;
  }
  if(!fsExportSupported()){
    updateAssetFolderLabel(null,null);
    renderAssetGrid();
    return;
  }
  const ah=await loadMetaHandle(ASSET_DIR_KEY);
  const fh=await loadMetaHandle(FONTS_DIR_KEY);
  const an=ah&&await ensureDirPermission(ah,false)?ah.name:null;
  const fn=fh&&await ensureDirPermission(fh,false)?fh.name:null;
  updateAssetFolderLabel(an,fn);
  if(ah&&an)await scanAssetFolder(ah);
  else renderAssetGrid();
  if(fh&&fn)await scanFontsFolder(fh);
}
function addAssetCard(grid,{src,name,userId=null,source='static'}){
  const card=document.createElement('div');
  card.className='asset-card';
  const img=document.createElement('img');
  img.src=src;
  img.alt='';
  img.onerror=()=>{
    img.style.display='none';
    if(!card.querySelector('.asset-missing')){
      const miss=document.createElement('div');
      miss.className='asset-missing';
      miss.textContent='fehlt';
      card.insertBefore(miss,card.querySelector('.asset-name')||card.firstChild);
    }
  };
  const nm=document.createElement('div');
  nm.className='asset-name';
  nm.title=name;
  nm.textContent=name;
  const del=document.createElement('button');
  del.type='button';
  del.className='asset-del';
  del.title=source==='user'?'Hochgeladenes Bild entfernen':'Aus Bibliothek ausblenden';
  del.textContent='×';
  del.onclick=e=>{e.stopPropagation();removeAssetFromLibrary(name,source,userId)};
  const actions=document.createElement('div');
  actions.className='asset-actions';
  const b1=document.createElement('button');b1.type='button';b1.textContent='L1';
  const b2=document.createElement('button');b2.type='button';b2.textContent='L2';
  const bg=document.createElement('button');bg.type='button';bg.textContent='BG';
  b1.onclick=()=>applyImageAsset('logo',src,name);
  b2.onclick=()=>applyImageAsset('logo2',src,name);
  bg.onclick=()=>applyImageAsset('bg',src,name);
  actions.append(b1,b2,bg);
  card.append(del,img,nm,actions);
  grid.appendChild(card);
}
async function removeUserAsset(id){
  const item=userAssets.find(a=>a.id===id);
  if(!item)return;
  await idbAssetDel(userLibIdbKey(id));
  userAssets=userAssets.filter(a=>a.id!==id);
  persistUserAssetsMeta();
}
async function removeAssetFromLibrary(name,source,userId){
  const key=String(name||'').toLowerCase();
  if(!key)return;
  const msg=source==='user'
    ? `„${name}" aus deinen Uploads löschen?`
    : `„${name}" aus der Bibliothek ausblenden?`;
  if(!confirm(msg))return;
  if(source==='user'&&userId){
    await removeUserAsset(userId);
  }else{
    if(source==='scanned')scannedAssetItems=scannedAssetItems.filter(a=>a.name.toLowerCase()!==key);
    const hidden=loadHiddenAssets();
    hidden.add(key);
    persistHiddenAssets(hidden);
  }
  renderAssetGrid();
  refreshStorageInfo();
  showOk('Bild entfernt.');
}
function renderAssetGrid(){
  const grid=document.getElementById('assetGrid');
  if(!grid)return;
  grid.innerHTML='';
  const hidden=loadHiddenAssets();
  const byName=new Map();
  const put=(src,name,userId=null,source='static')=>{
    if(!name||hidden.has(name.toLowerCase()))return;
    byName.set(name.toLowerCase(),{src,name,userId,source});
  };
  STATIC_ASSETS.forEach(a=>put(encodeURI(a.path),a.name,null,'static'));
  userAssets.forEach(a=>put(a.url,a.name,a.id,'user'));
  scannedAssetItems.forEach(a=>put(a.url,a.name,null,'scanned'));
  if(!byName.size){
    grid.innerHTML='<div style="font-size:.65rem;color:var(--mut);grid-column:1/-1">Keine Bilder. 📤 Bilder hochladen oder 📁 Ordner wählen.</div>';
    return;
  }
  [...byName.values()]
    .sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}))
    .forEach(item=>addAssetCard(grid,item));
}
function renderStaticAssets(){renderAssetGrid()}
async function scanAssetFolder(dir){
  scannedAssetItems=[];
  for await(const item of walkDir(dir)){
    if(!/\.(png|jpe?g|webp|svg)$/i.test(item.path))continue;
    const file=await item.handle.getFile();
    const url=URL.createObjectURL(file);
    const name=item.path.replace(/^.*\//,'');
    scannedAssetItems.push({url,name});
  }
  updateAssetFolderLabel(dir.name,(await loadMetaHandle(FONTS_DIR_KEY))?.name||null);
  renderAssetGrid();
}
async function scanNativeAssetFolder(dirPath,label){
  scannedAssetItems=[];
  try{
    const files=await nativeInvoke('pf_read_dir_recursive',{path:dirPath});
    for(const item of files){
      if(!/\.(png|jpe?g|webp|svg)$/i.test(item.path))continue;
      const url=await nativeInvoke('pf_read_file_data_url',{path:nativePathJoin(dirPath,item.path)});
      scannedAssetItems.push({url,name:item.name||nativeBasename(item.path)});
    }
  }catch(e){console.warn('scanNativeAssetFolder',e)}
  updateAssetFolderLabel(label||nativeBasename(dirPath),await nativeWorkspaceFolderLabel([PREFERRED_FONTS_FOLDER,'fonts']));
  renderAssetGrid();
}
async function applyImageAsset(kind,src,name){
  const img=new Image();
  img.onload=()=>{
    const isSvg=/\.svg$/i.test(name||src);
    if(kind==='logo'){
      clearLogoRasterCache(S.logo);S.logo=img;S.logoIsSvg=isSvg;
      const p=document.getElementById('logoPrev');p.src=src;p.style.display='block';
    }else if(kind==='logo2'){
      clearLogoRasterCache(S.logo2);S.logo2=img;S.logo2IsSvg=isSvg;
      const p=document.getElementById('logo2Prev');p.src=src;p.style.display='block';
    }else{
      S.bgImg=img;const p=document.getElementById('bgPrev');p.src=src;p.style.display='block';
    }
    scheduleAssetIdbSync();persistSession();render();showOk((name||'Bild')+' angewendet.');
  };
  img.onerror=()=>showErr('Bild konnte nicht geladen werden: '+(name||src));
  img.src=src;
}
async function scanFontsFolder(dir){
  let added=0;
  for await(const item of walkDir(dir)){
    if(!/\.(ttf|otf|woff2?)$/i.test(item.path))continue;
    const file=await item.handle.getFile();
    if(await registerFolderFont(file,item.path))added++;
  }
  renderSavedFonts();buildFontGrid();
  updateAssetFolderLabel((await loadMetaHandle(ASSET_DIR_KEY))?.name||null,dir.name);
  if(added)showOk(`${added} Font(s) aus ${dir.name} geladen.`);
}
async function scanNativeFontsFolder(dirPath,label){
  let added=0;
  try{
    const files=await nativeInvoke('pf_read_dir_recursive',{path:dirPath});
    for(const item of files){
      if(!/\.(ttf|otf|woff2?)$/i.test(item.path))continue;
      const dataUrl=await nativeInvoke('pf_read_file_data_url',{path:nativePathJoin(dirPath,item.path)});
      if(await registerDataUrlFont(dataUrl,item.path))added++;
    }
  }catch(e){console.warn('scanNativeFontsFolder',e)}
  renderSavedFonts();buildFontGrid();
  updateAssetFolderLabel(await nativeWorkspaceFolderLabel([PREFERRED_ASSET_FOLDER,'assets']),label||nativeBasename(dirPath));
  if(added)showOk(`${added} Font(s) aus ${label||nativeBasename(dirPath)} geladen.`);
}
async function registerDataUrlFont(dataUrl,path){
  const fname=path.replace(/\.[^.]+$/,'').split('/').pop();
  const key=fontNormName(fname);
  if(S.savedFonts.some(f=>fontNormName(f.name)===key))return false;
  try{
    const ffName='PF_DIR_'+safeName(fname)+'_'+Math.random().toString(36).slice(2,6);
    const f=await new FontFace(ffName,`url("${dataUrl}")`).load();
    document.fonts.add(f);
    S.savedFonts.push({name:fname,fontFamily:`'${ffName}'`,ffName,url:dataUrl,folder:true});
    return true;
  }catch(e){return false}
}
async function registerFolderFont(file,path){
  try{
    const dataUrl=await readFileAsDataUrl(file);
    return await registerDataUrlFont(dataUrl,path);
  }catch(e){return false}
}
function normalizeImportedTemplates(data){
  if(!data)return null;
  if(Array.isArray(data))return data;
  if(data.templates&&Array.isArray(data.templates))return data.templates;
  if(data.snap&&data.name)return [{id:data.id||'ut_'+Date.now(),name:data.name,updated:data.updated||Date.now(),snap:data.snap}];
  if(data.tpl!==undefined||data.c)return [{id:'ut_'+Date.now(),name:data.name||'Import',updated:Date.now(),snap:data}];
  return null;
}
async function upsertImportedTemplates(valid,opts={}){
  const list=loadUserTemplates();
  let added=0,over=0;
  for(const t of valid){
    const name=String(t.name||'Import').trim();
    const existing=list.find(x=>x.name.toLowerCase()===name.toLowerCase());
    if(opts.skipOlder&&existing&&existing.updated&&(t.updated||0)<existing.updated)continue;
    const id=existing?existing.id:(t.id&&String(t.id).startsWith('ut_')?t.id:'ut_'+Date.now()+'_'+Math.random().toString(36).slice(2,6));
    let snap=migrateSnapAlign(t.snap||{});
    snap.c=normalizePalette(snap.c);
    snap.badgeColor=normalizeHexColor(snap.badgeColor,snap.c.acc);
    snap.badgeBorderColor=normalizeHexColor(snap.badgeBorderColor,'#FFFFFF');
    snap.glowColor=normalizeHexColor(snap.glowColor,'#00BFFF');
    if(snap.logoData||snap.logo2Data||snap.bgData)snap=await compressSnapForStorage(snap);
    snap=withAssetFlags(snap);
    await storeSnapAssetsInIdb(snap,id);
    const entry={id,name,updated:t.updated||Date.now(),snap:stripSnapImages(snap)};
    if(existing){list[list.indexOf(existing)]=entry;over++}
    else{list.push(entry);added++}
  }
  if(!persistUserTemplates(list)){
    showErr((opts.label||'Import')+' ok, aber Browser-Speicher voll – JSON-Dateien bleiben Backup.');
    return{added,over,ok:false};
  }
  return{added,over,ok:true};
}
function applyImportResult(r,label,{reloadActive=false}={}){
  if(!r||!r.ok)return;
  buildTplGrid();renderUserTplList();
  if(reloadActive)(async()=>{
    let id=S.userTplId;
    if(!id){
      const name=(getVal('userTplName')||'').trim();
      if(name){
        const t=loadUserTemplates().find(x=>x.name.toLowerCase()===name.toLowerCase());
        if(t)id=t.id;
      }
    }
    if(id&&loadUserTemplates().some(x=>x.id===id))await loadUserTemplate(id);
  })();
  if(r.added||r.over)showOk(`${label}: ${r.added} neu, ${r.over} aktualisiert.`);
}
async function autoImportTemplatesFromDir(dir,force){
  if(!dir||(!force&&dir._plateForgeImported))return null;
  dir._plateForgeImported=true;
  try{
    const valid=[];
    for await(const [name,handle] of dir.entries()){
      if(handle.kind!=='file'||!/\.json$/i.test(name))continue;
      const file=await handle.getFile();
      const raw=JSON.parse(await file.text());
      const incoming=normalizeImportedTemplates(raw)||[];
      incoming.forEach(t=>{if(t&&t.snap&&(t.name||t.snap.club))valid.push(t)});
    }
    if(!valid.length)return{added:0,over:0,ok:true};
    const r=await upsertImportedTemplates(valid,{label:'Auto-Import',skipOlder:true});
    return r;
  }catch(e){
    console.warn('Auto-Import Vorlagen json',e);
    return null;
  }
}
const nativeTemplateImportCache=new Set();
async function autoImportTemplatesFromNativeDir(dirPath,force){
  if(!dirPath||(!force&&nativeTemplateImportCache.has(dirPath)))return null;
  nativeTemplateImportCache.add(dirPath);
  try{
    const valid=[];
    const files=await nativeInvoke('pf_read_dir_recursive',{path:dirPath});
    for(const item of files){
      if(!/\.json$/i.test(item.path))continue;
      const text=await nativeInvoke('pf_read_text',{path:nativePathJoin(dirPath,item.path)});
      if(!text)continue;
      const raw=JSON.parse(text);
      const incoming=normalizeImportedTemplates(raw)||[];
      incoming.forEach(t=>{if(t&&t.snap&&(t.name||t.snap.club))valid.push(t)});
    }
    if(!valid.length)return{added:0,over:0,ok:true};
    return await upsertImportedTemplates(valid,{label:'Auto-Import',skipOlder:true});
  }catch(e){
    console.warn('Auto-Import native Vorlagen json',e);
    return null;
  }
}
async function syncTemplatesFromJsonFolder(forcePicker,dir){
  if(isTauriApp()){
    let root=await loadNativeWorkspacePath();
    if(forcePicker||!root){
      if(!forcePicker&&!root){updateJsonExportDirLabel(null);return null}
      const connected=await pickNativeWorkspaceFolder();
      if(!connected)return null;
      root=await loadNativeWorkspacePath();
    }
    const jsonDir=await getNativeChildDir(root,[PREFERRED_EXPORT_FOLDER,'templates'],{create:true});
    updateJsonExportDirLabel(PREFERRED_EXPORT_FOLDER);
    const r=await autoImportTemplatesFromNativeDir(jsonDir,true);
    applyImportResult(r,'JSON-Ordner',{reloadActive:!!forcePicker});
    if(forcePicker&&r&&r.ok&&!r.added&&!r.over)showWarn('Im JSON-Ordner wurden keine neuen Vorlagen gefunden.');
    return r;
  }
  if(!fsExportSupported()){
    showWarn('Dieser Browser kann keinen lokalen JSON-Ordner lesen. Bitte 📥 Import verwenden.');
    return null;
  }
  let h=dir||await loadExportDirHandle();
  if(forcePicker||!h)h=await pickJsonExportFolder(forcePicker,true);
  if(!h)return null;
  if(!await ensureDirPermission(h,false)){
    showWarn('Kein Zugriff auf den JSON-Ordner. Bitte 📁 erneut wählen.');
    return null;
  }
  updateJsonExportDirLabel(h.name);
  const r=await autoImportTemplatesFromDir(h,true);
  applyImportResult(r,'JSON-Ordner',{reloadActive:!!forcePicker});
  if(forcePicker&&r&&r.ok&&!r.added&&!r.over)showWarn('Im JSON-Ordner wurden keine neuen Vorlagen gefunden.');
  return r;
}
function shouldAutoImportStaticTemplates(force){
  if(force)return true;
  if(!loadUserTemplates().length)return true;
  try{
    const last=parseInt(localStorage.getItem(STATIC_MASTER_IMPORT_KEY)||'0',10);
    return !last||Date.now()-last>STATIC_MASTER_IMPORT_TTL_MS;
  }catch(e){return true}
}
async function autoImportStaticTemplates(force=false){
  if(!shouldAutoImportStaticTemplates(force))return null;
  try{
    const res=await fetch(encodeURI(STATIC_MASTER_TEMPLATES));
    if(!res.ok)return null;
    const incoming=normalizeImportedTemplates(await res.json())||[];
    const valid=incoming.filter(t=>t&&t.snap&&(t.name||t.snap.club));
    if(!valid.length)return null;
    const r=await upsertImportedTemplates(valid,{label:'Master-Vorlagen',skipOlder:true});
    try{localStorage.setItem(STATIC_MASTER_IMPORT_KEY,String(Date.now()))}catch(e){}
    applyImportResult(r,'Master-Vorlagen',{reloadActive:false});
    return r;
  }catch(e){return null}
}
function importTemplatesJson(inp){
  const files=Array.from(inp.files||[]);if(!files.length)return;
  (async()=>{
    try{
      const valid=[];
      for(const file of files){
        const raw=JSON.parse(await file.text());
        const incoming=normalizeImportedTemplates(raw)||[];
        incoming.forEach(t=>{if(t&&t.snap&&(t.name||t.snap.club))valid.push(t)});
      }
      if(!valid.length){showErr('Keine gültigen Vorlagen in den Dateien.');return}
      const mode=confirm(
        `${valid.length} Vorlage(n) in ${files.length} Datei(en) gefunden.\n\nOK = hinzufügen / gleiche Namen überschreiben\nAbbrechen = Import abbrechen`
      );
      if(!mode)return;
      const r=await upsertImportedTemplates(valid,{label:'Import'});
      applyImportResult(r,'Import',{reloadActive:true});
    }catch(e){showErr('JSON konnte nicht gelesen werden: '+e.message)}
    finally{inp.value=''}
  })();
}

// ══════════════════════════════════════════
// NUMBER BADGE PICKER
// ══════════════════════════════════════════
function setBadge(shape){
  S.badge=shape;
  document.querySelectorAll('#badgeBtns .align-btn').forEach(b=>b.classList.toggle('on',b.dataset.b===shape));
  const on=shape!=='none';
  const row=document.getElementById('badgeScaleRow');
  if(row)row.style.display=on?'block':'none';
  const adj=document.getElementById('badgeNrAdjustRow');
  if(adj)adj.style.display=on?'block':'none';
  const extra=document.getElementById('badgeExtraRow');
  if(extra)extra.style.display=on?'block':'none';
  persistSession();render();
}

// ══════════════════════════════════════════
// ROSTER
// ══════════════════════════════════════════
function buildRoster(){
  const l=document.getElementById('rosterList');l.innerHTML='';
  S.roster.forEach((p,i)=>{
    const d=document.createElement('div');d.className='ri'+(i===S.active?' on':'');
    d.tabIndex=0;d.setAttribute('role','button');d.setAttribute('aria-label','Spieler '+(p.last||p.first||i+1)+' wählen');
    const display=getDisplayName(p);
    d.innerHTML=`<span class="ri-nr">#${p.nr}</span><span class="ri-name">${display.replace('\n',' ')}</span><span class="ri-pos">${p.pos||''}</span><button class="ri-del" onclick="delP(${i},event)">✕</button>`;
    d.onclick=e=>{if(e.target.classList.contains('ri-del'))return;pickP(i)};
    l.appendChild(d);
  });
  updatePlayerNav();
}
function updatePlayerNav(){
  const lbl=document.getElementById('playerNavLbl');
  const prev=document.getElementById('btnPrevP');
  const next=document.getElementById('btnNextP');
  const n=S.roster.length;
  const on=n>1;
  if(prev)prev.disabled=!on;
  if(next)next.disabled=!on;
  if(!lbl)return;
  if(!n){lbl.textContent='Kein Roster';return}
  const p=S.roster[S.active];
  const nm=(p.last||p.first||'SPIELER').replace(/\n/g,' ');
  lbl.textContent=`#${p.nr} ${nm} · ${S.active+1}/${n}`;
}
function syncPlayerAdjustUi(p=S.roster[S.active]||{}){
  p=p||{};
  const dx=document.getElementById('slPlayerNameDx');
  const dy=document.getElementById('slPlayerNameDy');
  const vx=document.getElementById('vlPlayerNameDx');
  const vy=document.getElementById('vlPlayerNameDy');
  const {x,y}=getPlayerNameAdjust(p);
  if(dx)dx.value=x;
  if(dy)dy.value=y;
  if(vx)vx.value=x;
  if(vy)vy.value=y;
}
function clampPlayerNameAdjust(axis,value){
  const n=Math.round(Number(value)||0);
  const lim=axis==='x'?220:140;
  return Math.max(-lim,Math.min(lim,n));
}
function activatePlayerForNameAdjust(p){
  const i=S.roster.indexOf(p);
  if(i<0)return;
  S.active=i;
  document.getElementById('iFirst').value=p.first||'';
  document.getElementById('iLast').value=p.last||'';
  document.getElementById('iNr').value=p.nr||'';
  document.getElementById('iPos').value=p.pos||'';
  document.getElementById('iNat').value=p.nat||'';
  syncPlayerAdjustUi(p);
  buildRoster();
  updatePlayerNav();
}
function setPlayerNameAdjust(axis,value){
  if(!S.roster.length)return;
  const p=S.roster[S.active];
  const cur=getPlayerNameAdjust(p);
  const v=clampPlayerNameAdjust(axis,value);
  setPlayerNameAdjustForTemplate(p,axis==='x'?v:cur.x,axis==='y'?v:cur.y);
  syncPlayerAdjustUi(p);
  persistRoster();render();refreshBatchIfVisible();
}
function resetPlayerNameAdjust(){
  if(!S.roster.length)return;
  const p=S.roster[S.active];
  setPlayerNameAdjustForTemplate(p,0,0);
  syncPlayerAdjustUi(p);
  persistRoster();render();refreshBatchIfVisible();
}
function navPlayer(delta){
  if(S.roster.length<2)return;
  S.active=(S.active+delta+S.roster.length)%S.roster.length;
  pickP(S.active);
}
function pickP(i){
  S.active=i;const p=S.roster[i];
  document.getElementById('iFirst').value=p.first||'';
  document.getElementById('iLast').value=p.last||'';
  document.getElementById('iNr').value=p.nr;
  document.getElementById('iPos').value=p.pos||'';
  document.getElementById('iNat').value=p.nat||'';
  syncPlayerAdjustUi(p);
  buildRoster();updatePlayerNav();persistRoster();render();
  refreshBatchIfVisible();
}
function syncPlayer(){
  if(!S.roster.length)return;
  const p=S.roster[S.active];
  p.first=getVal('iFirst').trim().toUpperCase();
  p.last=getVal('iLast').trim().toUpperCase();
  p.nr=getVal('iNr').trim();
  p.pos=getVal('iPos').trim().toUpperCase();
  p.nat=getVal('iNat').trim().toUpperCase();
  p.nameAdjustments=normalizeNameAdjustments(p.nameAdjustments);
  p.nameDx=0;
  p.nameDy=0;
  buildRoster();persistRoster();render();
  refreshBatchIfVisible();
}
function addPlayer(){
  const first=getVal('iFirst').trim().toUpperCase();
  const last=getVal('iLast').trim().toUpperCase();
  const nr=getVal('iNr').trim();
  if(!last&&!first||!nr)return;
  S.roster.push({first,last,nr,pos:getVal('iPos').trim().toUpperCase(),nat:getVal('iNat').trim().toUpperCase(),nameAdjustments:{}});
  S.active=S.roster.length-1;buildRoster();persistRoster();render();refreshBatchIfVisible();
}
function delP(i,e){e.stopPropagation();S.roster.splice(i,1);if(S.active>=S.roster.length)S.active=Math.max(0,S.roster.length-1);buildRoster();persistRoster();render();refreshBatchIfVisible()}
function clearRoster(){if(confirm('Roster leeren?')){S.roster=[];S.active=0;syncPlayerAdjustUi(null);buildRoster();persistRoster();render();refreshBatchIfVisible()}}

// ══════════════════════════════════════════
// CSV / EXCEL
// ══════════════════════════════════════════
const LAST_K =['lastname','last','nachname','name','surname','familienname','familyname','spieler','player','spielername','nom'];
const FIRST_K=['firstname','first','vorname','prename','givenname','rufname','prenom'];
const NR_K   =['nr','number','nummer','jersey','jerseynr','jerseynumber','jerseyno','no','rückennummer','ruckennummer','trikotnummer','rn','num','#'];
const POS_K  =['pos','position','posizione','spielposition','rolle'];
const NAT_K  =['nat','nation','nationality','country','land','nationalität','nationalitaet','herkunft'];
// normalise a header: lowercase + strip everything but letters/digits
function norm(s){return String(s).toLowerCase().replace(/[^a-z0-9à-ÿ]/g,'')}
// find the original key of obj that matches any of the (already normalised) candidate keys
function fk(obj,keys){
  const map={};
  for(const k in obj){
    const raw=String(k).trim();
    if(raw==='#'&&!('#'in map))map['#']=k;
    const n=norm(k);
    if(n&&!(n in map))map[n]=k;
  }
  for(const want of keys)if(want in map)return map[want];
  return null;
}

function toggleCsvHint(){const h=document.getElementById('csvHint');h.style.display=h.style.display==='block'?'none':'block'}

function importFile(inp){
  const file=inp.files[0];if(!file)return;
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(ext==='csv'){
    Papa.parse(file,{header:true,skipEmptyLines:'greedy',encoding:'UTF-8',transformHeader:h=>h.trim(),
      complete:r=>{
        if(r.errors&&r.errors.length&&!r.data.length){showErr('CSV-Fehler: '+r.errors[0].message);return}
        if(!r.data.length){showErr('Keine Datenzeilen in der CSV gefunden.');return}
        processRows(r.data,file.name);
      },
      error:e=>showErr('CSV konnte nicht gelesen werden: '+e.message)});
  }else if(['xlsx','xls'].includes(ext)){
    const rd=new FileReader();
    rd.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:'binary'});
        if(!wb.SheetNames.length){showErr('Excel-Datei enthält keine Tabellenblätter.');return}
        const ws=wb.Sheets[wb.SheetNames[0]];
        const data=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
        if(!data.length){showErr('Keine Datenzeilen im ersten Tabellenblatt.');return}
        processRows(data,file.name);
      }catch(err){showErr('Excel-Fehler: '+err.message)}
    };
    rd.onerror=()=>showErr('Datei konnte nicht gelesen werden.');
    rd.readAsBinaryString(file);
  }else showErr('Format nicht unterstützt: .'+ext+' – bitte CSV, XLSX oder XLS.');
  inp.value='';
}

function processRows(data,fname){
  const first=data[0];
  const lk=fk(first,LAST_K),fik=fk(first,FIRST_K),nrk=fk(first,NR_K),pk=fk(first,POS_K),natk=fk(first,NAT_K);
  const positional=!lk&&!fik&&!nrk; // no recognised headers → read by column order
  const added=[],skipped=[];
  data.forEach((row,idx)=>{
    let last='',firstname='',nr='',pos='',nat='';
    if(positional){
      const v=Object.values(row);
      firstname=String(v[0]||'').trim().toUpperCase();
      last=String(v[1]||'').trim().toUpperCase();
      nr=String(v[2]||'').trim();
      pos=String(v[3]||'').trim().toUpperCase();
      nat=String(v[4]||'').trim().toUpperCase();
    }else{
      if(lk)last=String(row[lk]||'').trim().toUpperCase();
      if(fik)firstname=String(row[fik]||'').trim().toUpperCase();
      if(nrk)nr=String(row[nrk]||'').trim();
      if(pk)pos=String(row[pk]||'').trim().toUpperCase();
      if(natk)nat=String(row[natk]||'').trim().toUpperCase();
    }
    nr=nr.replace(/^#/,'').trim();
    if((last||firstname)&&nr)added.push({first:firstname,last,nr,pos,nat});
    else if(last||firstname||nr)skipped.push(idx+2);
  });
  if(!added.length){
    showErr(`Keine gültigen Einträge in „${fname}". Erwartete Spalten: Vorname, Name, Nr (optional Pos, Nat).`);
    return;
  }
  S.roster.push(...added);S.active=S.roster.length-1;buildRoster();persistRoster();render();refreshBatchIfVisible();
  // duplicate jersey-number check across the whole roster
  const cnt={};
  S.roster.forEach(p=>{const n=String(p.nr).trim();if(n)cnt[n]=(cnt[n]||0)+1});
  const dupes=Object.keys(cnt).filter(n=>cnt[n]>1);
  let msg=`✅ ${added.length} Spieler aus „${fname}" importiert`;
  if(skipped.length)msg+=` · ${skipped.length} Zeile(n) übersprungen`;
  if(dupes.length)showWarn(msg+`<br>⚠ Doppelte Trikotnummern: ${dupes.join(', ')}`);
  else showOk(msg);
}
function setStatus(cls,m){const e=document.getElementById('csvStatus');e.className='csv-status '+cls;e.innerHTML=m;e.style.display='block';clearTimeout(e._t);return e}
function showOk(m){const e=setStatus('csv-ok',m);e._t=setTimeout(()=>e.style.display='none',6000)}
function showWarn(m){const e=setStatus('csv-warn',m);e._t=setTimeout(()=>e.style.display='none',12000)}
function showErr(m){setStatus('csv-err',m)}

// ══════════════════════════════════════════
// LOGO / BG
// ══════════════════════════════════════════
function loadImgFile(file,cb){
  const r=new FileReader();
  r.onload=e=>{
    const src=e.target.result;
    const i=new Image();
    i.decoding='async';
    i.onload=()=>cb(i,src);
    i.src=src;
  };
  r.readAsDataURL(file);
}
function clearLogoRasterCache(img){
  if(!img||!img._pfLogoCache)return;
  try{img._pfLogoCache.canvas.width=0;img._pfLogoCache.canvas.height=0}catch(e){}
  img._pfLogoCache=null;
}
function detectSvgLogo(file,src){
  if(file&&(file.type==='image/svg+xml'||/\.svg$/i.test(file.name||'')))return true;
  return/^data:image\/svg\+xml/i.test(String(src||''));
}
// lsz = längste Seite; Seitenverhältnis bleibt erhalten (contain)
function logoFitRect(cx,cy,maxSide,nw,nh){
  const w0=Math.max(1,nw||1),h0=Math.max(1,nh||1);
  const s=maxSide/Math.max(w0,h0);
  const w=w0*s,h=h0*s;
  return{x:cx-w/2,y:cy-h/2,w,h};
}
function logoImageForKey(key,opts){
  return key==='logo'?(opts&&opts.logo!=null?opts.logo:S.logo):(opts&&opts.logo2!=null?opts.logo2:S.logo2);
}
// SVG auf hoher interner Auflösung rasterisieren, dann proportional zeichnen (scharfe Kanten)
function drawSvgLogoSharp(ctx,logo,cx,cy,maxSide){
  if(maxSide<2)return;
  const nw=logo.naturalWidth||logo.width||1;
  const nh=logo.naturalHeight||logo.height||1;
  const fit=logoFitRect(cx,cy,maxSide,nw,nh);
  const dpr=typeof devicePixelRatio==='number'&&devicePixelRatio>=1?devicePixelRatio:1;
  const boost=Math.max(fit.w,fit.h)>500?2.2:Math.max(fit.w,fit.h)>220?2.6:3;
  let rasterMax=Math.ceil(Math.max(fit.w,fit.h)*dpr*boost);
  rasterMax=Math.max(rasterMax,Math.ceil(Math.max(fit.w,fit.h)*2));
  const cap=2400;
  rasterMax=Math.min(cap,Math.max(Math.ceil(Math.max(fit.w,fit.h)),rasterMax));
  const scale=rasterMax/Math.max(nw,nh);
  const rw=Math.max(1,Math.ceil(nw*scale));
  const rh=Math.max(1,Math.ceil(nh*scale));
  const key=`${rw}x${rh}|${logo.src||''}`;
  if(!logo._pfLogoCache||logo._pfLogoCache.key!==key){
    clearLogoRasterCache(logo);
    const oc=document.createElement('canvas');oc.width=rw;oc.height=rh;
    const ox=oc.getContext('2d');
    ox.clearRect(0,0,rw,rh);
    ox.imageSmoothingEnabled=true;ox.imageSmoothingQuality='high';
    try{ox.drawImage(logo,0,0,rw,rh)}catch(e){}
    logo._pfLogoCache={canvas:oc,key};
  }
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(logo._pfLogoCache.canvas,fit.x,fit.y,fit.w,fit.h);
}
function drawLogoOnPlate(ctx,logo,lx,ly,lsz,isSvg,thumb){
  if(!logo)return;
  const nw=logo.naturalWidth||logo.width||1;
  const nh=logo.naturalHeight||logo.height||1;
  const fit=logoFitRect(lx,ly,lsz,nw,nh);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(thumb||!isSvg){ctx.drawImage(logo,fit.x,fit.y,fit.w,fit.h);return}
  drawSvgLogoSharp(ctx,logo,lx,ly,lsz);
}
function loadLogo(inp){
  const file=inp.files[0];if(!file)return;
  loadImgFile(file,(img,src)=>{
    clearLogoRasterCache(S.logo);
    S.logo=img;
    S.logoIsSvg=detectSvgLogo(file,src);
    const p=document.getElementById('logoPrev');p.src=src;p.style.display='block';
    scheduleAssetIdbSync();persistSession();render();
  });
  inp.value='';
}
function loadBg(inp){if(!inp.files[0])return;loadImgFile(inp.files[0],(img,src)=>{S.bgImg=img;const p=document.getElementById('bgPrev');p.src=src;p.style.display='block';scheduleAssetIdbSync();persistSession();render()});inp.value=''}
function clearLogo(){
  clearLogoRasterCache(S.logo);S.logo=null;S.logoIsSvg=false;
  const p=document.getElementById('logoPrev');if(p){p.style.display='none';p.removeAttribute('src')}
  syncCanvasAssetsToIdb();persistSession();render();
}
function loadLogo2(inp){
  const file=inp.files[0];if(!file)return;
  loadImgFile(file,(img,src)=>{
    clearLogoRasterCache(S.logo2);
    S.logo2=img;
    S.logo2IsSvg=detectSvgLogo(file,src);
    const p=document.getElementById('logo2Prev');p.src=src;p.style.display='block';
    scheduleAssetIdbSync();persistSession();render();
  });
  inp.value='';
}
function clearLogo2(){
  clearLogoRasterCache(S.logo2);S.logo2=null;S.logo2IsSvg=false;if(S.sel==='logo2')S.sel=null;
  const p2=document.getElementById('logo2Prev');if(p2){p2.style.display='none';p2.removeAttribute('src')}
  syncCanvasAssetsToIdb();persistSession();render();
}
function clearBg(){
  S.bgImg=null;
  const p=document.getElementById('bgPrev');if(p){p.style.display='none';p.removeAttribute('src')}
  syncCanvasAssetsToIdb();persistSession();render();
}

function useEHCLogo(){
  const oc=document.createElement('canvas');oc.width=400;oc.height=400;
  ehcLogo(oc.getContext('2d'),200,200,180);
  const url=oc.toDataURL();
  const img=new Image();img.onload=()=>{clearLogoRasterCache(S.logo);S.logo=img;S.logoIsSvg=false;render()};img.src=url;
  const p=document.getElementById('logoPrev');p.src=url;p.style.display='block';
}

// EHC BIEL LOGO
function ehcLogo(ctx,cx,cy,r){
  ctx.save();
  ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r*.85,cy-r*.55);ctx.lineTo(cx+r*.85,cy+r*.18);
  ctx.bezierCurveTo(cx+r*.85,cy+r*.75,cx+r*.3,cy+r*.95,cx,cy+r);
  ctx.bezierCurveTo(cx-r*.3,cy+r*.95,cx-r*.85,cy+r*.75,cx-r*.85,cy+r*.18);
  ctx.lineTo(cx-r*.85,cy-r*.55);ctx.closePath();
  ctx.fillStyle='#041E42';ctx.fill();ctx.strokeStyle='#C8102E';ctx.lineWidth=r*.07;ctx.stroke();
  ctx.strokeStyle='#D4B96A';ctx.lineWidth=r*.025;
  ctx.beginPath();ctx.moveTo(cx,cy-r*.82);ctx.lineTo(cx+r*.7,cy-r*.44);ctx.lineTo(cx+r*.7,cy+r*.18);
  ctx.bezierCurveTo(cx+r*.7,cy+r*.65,cx+r*.25,cy+r*.82,cx,cy+r*.88);
  ctx.bezierCurveTo(cx-r*.25,cy+r*.82,cx-r*.7,cy+r*.65,cx-r*.7,cy+r*.18);
  ctx.lineTo(cx-r*.7,cy-r*.44);ctx.closePath();ctx.stroke();
  ctx.fillStyle='#C8102E';ctx.fillRect(cx-r*.7,cy-r*.08,r*1.4,r*.28);
  ctx.fillStyle='#fff';ctx.font=`bold ${r*.34}px 'Bebas Neue',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('EHC',cx,cy-r*.3);
  ctx.fillStyle='#D4B96A';ctx.font=`bold ${r*.25}px 'Bebas Neue',sans-serif`;ctx.fillText('BIEL',cx,cy+r*.22);
  ctx.strokeStyle='#fff';ctx.lineWidth=r*.045;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx-r*.48,cy+r*.5);ctx.lineTo(cx-r*.2,cy+r*.72);ctx.lineTo(cx-r*.03,cy+r*.72);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+r*.48,cy+r*.5);ctx.lineTo(cx+r*.2,cy+r*.72);ctx.lineTo(cx+r*.03,cy+r*.72);ctx.stroke();
  ctx.fillStyle='#C8102E';ctx.beginPath();ctx.ellipse(cx,cy+r*.72,r*.12,r*.06,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// ══════════════════════════════════════════
// TOGGLES
// ══════════════════════════════════════════
const TOG_MAP={frame:'frame',screws:'screws',bar:'bar',logoBand:'logoBand',pos:'showPos',nat:'showNat',league:'showLeague',shadow:'shadowOn',glow:'glowOn',guides:'showGuides',safeMargin:'showSafeMargin'};
const ROSTER_KEY='plateforge_roster';
const SESSION_KEY='plateforge_session';
function togElId(k){
  if(k==='logoBand')return'togLogoBand';
  if(k==='safeMargin')return'togSafeMargin';
  return'tog'+k.charAt(0).toUpperCase()+k.slice(1);
}
function togOpt(k){
  const key=TOG_MAP[k];S[key]=!S[key];
  const el=document.getElementById(togElId(k));
  if(el)el.classList.toggle('on',S[key]);
  persistSession();render();
}

// ══════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════
function activeP(){
  if(!S.roster.length)return{first:'',last:'SPIELER',nr:'##',playerPos:'',nat:''};
  const p=S.roster[Math.min(S.active,S.roster.length-1)];
  const adj=getPlayerNameAdjust(p);
  return{...p,first:p.first||'',last:p.last||'',nr:p.nr,playerPos:p.playerPos!=null?p.playerPos:(p.pos||''),nat:p.nat||'',nameDx:adj.x,nameDy:adj.y};
}

function readSizeOpts(){
  return{
    logoSz:getInt('slLogo'),logo2Sz:getInt('slLogo2'),nameSz:getInt('slName'),nrSz:getInt('slNrSz'),badgeScale:getInt('slBadgeScale'),
    freeText:String(S.freeText||''),freeTextSz:getInt('slFreeText')||S.freeTextSz||70,freeTextRot:S.freeTextRot||0,
    freeText2:String(S.freeText2||''),freeText2Sz:getInt('slFreeText2')||S.freeText2Sz||70,freeText2Rot:S.freeText2Rot||0,
    badgeNrDx:S.badgeNrDx||0,badgeNrDy:S.badgeNrDy||0,
    frameW:getInt('slFrame'),bgOp:getInt('slBgOp')/100,logoOp:getInt('slLogoOp')/100,
    font:S.font,nrFont:getNrFont(),freeTextFont:getFreeTextFont(),freeText2Font:getFreeText2Font(),layout:getVal('selLayout'),textAlign:S.textAlign,textVAlign:S.textVAlign||'alphabetic',
    nrAlign:effectiveNrAlign(),nrVAlign:effectiveNrVAlign(),
    nameMode:getVal('selNameMode'),
    shBlur:getInt('slShBlur'),shDist:getInt('slShDist'),glowSize:getInt('slGlow'),
    club:getVal('iClub')||'EHC BIEL-BIENNE',
    leagueTxt:getVal('iLeague')||'NATIONAL LEAGUE',
    logoIsSvg:!!S.logoIsSvg,logo2IsSvg:!!S.logo2IsSvg,
  };
}

function render(){
  const cv=document.getElementById('plateCanvas');
  const vp=document.getElementById('cvWrap').parentElement;
  const vpW=vp.clientWidth-40;
  PREV_SCALE=Math.min(0.48,vpW/W);
  cv.width=Math.round(W*PREV_SCALE);
  cv.height=Math.round(H*PREV_SCALE);
  cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';
  const opts=buildRenderOpts();
  drawPlate(cv,cv.width,cv.height,opts,false);
  buildGuideLines();
  buildDragHandles(opts);
  if(!dragState)persistSession();
}

// ══════════════════════════════════════════
// DRAG HANDLES – pixel-accurate
// ══════════════════════════════════════════
/*
  Strategy: measure actual text bounding on a temp canvas,
  then place the div overlay exactly over that text.
*/
let dragState=null;
function isTeamNameAdjustActive(){
  return !!(S.roster.length&&document.getElementById('panelTeam')?.classList.contains('on'));
}
function nameBoundsForOpts(opts){
  const namePos=getPos('name');
  const nameText=getDisplayNameFromOpts({first:opts.first,last:opts.last},opts.nameMode||S.nameMode||'last');
  return textLinesBounds(
    namePos.x+Number(opts.nameDx||0),
    namePos.y+Number(opts.nameDy||0),
    nameText.split('\n'),
    opts.nameSz,
    opts.font,
    opts.textAlign,
    opts.textVAlign||'alphabetic'
  );
}
function pointInBounds(pt,b,pad=22){
  return pt.x>=b.left-pad&&pt.x<=b.right+pad&&pt.y>=b.top-pad&&pt.y<=b.bottom+pad;
}
function canvasPlatePoint(e,cv){
  const rect=cv.getBoundingClientRect();
  const pt=ptXY(e);
  const sc=cv.width/W;
  return{x:(pt.x-rect.left)/sc,y:(pt.y-rect.top)/sc};
}
function startPlayerNameAdjustDrag(e,p,cv,{hitTest=true}={}){
  if(!p)return false;
  const opts=makeFullOpts(p);
  if(hitTest&&!pointInBounds(canvasPlatePoint(e,cv),nameBoundsForOpts(opts)))return false;
  e.preventDefault();
  e.stopPropagation();
  activatePlayerForNameAdjust(p);
  setSelectedFontTarget('name');
  const pt=ptXY(e);
  dragState={
    mode:'playerNameAdjust',
    key:'name',
    player:p,
    canvas:cv,
    mx:pt.x,
    my:pt.y,
    ox:getPlayerNameAdjust(p).x,
    oy:getPlayerNameAdjust(p).y,
    sc:cv.width/W,
    fromBatch:cv.id!=='plateCanvas',
  };
  cv.closest('.batch-item')?.classList.add('dragging');
  document.querySelectorAll('.dh').forEach(d=>d.classList.toggle('sel',d.dataset.key==='name'));
  return true;
}

function measureText(text,fontPx,fontFamily,canvas_w,canvas_h){
  const oc=document.createElement('canvas');oc.width=canvas_w;oc.height=canvas_h;
  const ctx=oc.getContext('2d');
  ctx.font=`${fontPx}px ${fontFamily},sans-serif`;
  const m=ctx.measureText(text);
  const left=m.actualBoundingBoxLeft||0;
  const right=m.actualBoundingBoxRight||m.width;
  return{
    w:m.width,
    inkW:left+right,
    left,
    right,
    ascent:m.actualBoundingBoxAscent||fontPx*.75,
    descent:m.actualBoundingBoxDescent||fontPx*.25,
  };
}
function horizontalTextBounds(anchorX,metrics,align){
  if(align==='center')return{left:anchorX-metrics.left,right:anchorX+metrics.right};
  if(align==='right')return{left:anchorX-metrics.w-metrics.left,right:anchorX-metrics.w+metrics.right};
  return{left:anchorX-metrics.left,right:anchorX+metrics.right};
}
function scanTextInkBounds(text,fontPx,fontFamily,align){
  const value=String(text||' ');
  const m=measureText(value,fontPx,fontFamily,W,H);
  const margin=Math.ceil(fontPx*1.25+32);
  const cw=Math.ceil(Math.max(80,m.w+margin*2));
  const ch=Math.ceil(Math.max(80,fontPx*4+margin*2));
  const oc=document.createElement('canvas');oc.width=cw;oc.height=ch;
  const ctx=oc.getContext('2d');
  ctx.font=`${fontPx}px ${fontFamily},sans-serif`;
  ctx.textBaseline='alphabetic';
  setTextAlign(ctx,align);
  ctx.fillStyle='#000';
  const x=align==='center'?cw/2:align==='right'?cw-margin:margin;
  const y=Math.round(ch/2);
  ctx.fillText(value,x,y);
  const data=ctx.getImageData(0,0,cw,ch).data;
  let minX=cw,minY=ch,maxX=-1,maxY=-1;
  for(let yy=0;yy<ch;yy++){
    const row=yy*cw*4;
    for(let xx=0;xx<cw;xx++){
      if(data[row+xx*4+3]>8){
        if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;
        if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;
      }
    }
  }
  if(maxX<0){
    const hb=horizontalTextBounds(0,m,align);
    return{left:hb.left,top:-m.ascent,right:hb.right,bottom:m.descent};
  }
  return{left:minX-x,top:minY-y,right:maxX+1-x,bottom:maxY+1-y};
}
function textBoxPad(fontPx,axis){
  const extra=axis==='x'?(S.textBoxPadX||0):(S.textBoxPadY||0);
  return Math.max(-fontPx*.35,fontPx*.035+extra);
}
function textLinesBounds(anchorX,anchorY,lines,fontPx,fontFamily,align,vAlign){
  if(!lines.length)return{left:anchorX,top:anchorY,right:anchorX+1,bottom:anchorY+1};
  const baselines=nameLinePlateYs(anchorY,fontPx,lines,fontFamily,vAlign,align);
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  lines.forEach((line,i)=>{
    const b=scanTextInkBounds(line||' ',fontPx,fontFamily,align);
    const y=baselines[i];
    left=Math.min(left,anchorX+b.left);right=Math.max(right,anchorX+b.right);
    top=Math.min(top,y+b.top);bottom=Math.max(bottom,y+b.bottom);
  });
  const padX=textBoxPad(fontPx,'x'),padY=textBoxPad(fontPx,'y');
  return{left:left-padX,top:top-padY,right:right+padX,bottom:bottom+padY};
}
function rotateBounds(bounds,cx,cy,deg){
  const rad=(Number(deg)||0)*Math.PI/180;
  if(!rad)return bounds;
  const cos=Math.cos(rad),sin=Math.sin(rad);
  const pts=[
    {x:bounds.left,y:bounds.top},{x:bounds.right,y:bounds.top},
    {x:bounds.right,y:bounds.bottom},{x:bounds.left,y:bounds.bottom},
  ].map(p=>{
    const dx=p.x-cx,dy=p.y-cy;
    return{x:cx+dx*cos-dy*sin,y:cy+dx*sin+dy*cos};
  });
  return{
    left:Math.min(...pts.map(p=>p.x)),
    top:Math.min(...pts.map(p=>p.y)),
    right:Math.max(...pts.map(p=>p.x)),
    bottom:Math.max(...pts.map(p=>p.y)),
  };
}

// pointer coords – works for mouse AND touch events
function ptXY(e){
  const t=(e.touches&&e.touches[0])||(e.changedTouches&&e.changedTouches[0]);
  return t?{x:t.clientX,y:t.clientY}:{x:e.clientX,y:e.clientY};
}

// halber Badge-Radius: nur nrSz + Badge-%-Slider (nicht abhängig von 1/2/3-stellig)
function badgeR(nrText,nrFontPx,fontFamily,scalePct){
  const scale=(scalePct==null?100:scalePct)/100;
  return nrFontPx*0.52*scale;
}
const TYPO_ASC=0.72;
const TYPO_DES=0.22;
function nameBlockMetrics(nameSzPlate,lineCount){
  const gap=nameSzPlate*1.05;
  const asc=nameSzPlate*TYPO_ASC;
  const des=nameSzPlate*TYPO_DES;
  const blockH=lineCount?(lineCount-1)*gap+asc+des:0;
  return{gap,asc,des,blockH};
}
function badgeBoundsHalf(nrText,nrSz,font,badgeScale,shape){
  const R=badgeR(nrText,nrSz,font,badgeScale);
  if(shape==='shield')return{R,halfW:R*1.34,halfH:R*1.55};
  if(shape==='diamond')return{R,halfW:R*1.5,halfH:R*1.5};
  if(shape==='hexagon')return{R,halfW:R*1.34,halfH:R*1.34};
  return{R,halfW:R*1.2,halfH:R*1.2};
}
function freeTextLines(text){
  return String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
}

// Bounding-Box eines Elements in Plate-Koordinaten (für Druckrand)
function getElementPlateBounds(key,anchor,opts){
  const platePos={...getPos(key),...anchor};
  const{nameSz,nrSz,logoSz,logo2Sz,font,nrFont,freeTextFont,freeText2Font,textAlign,textVAlign,nrAlign,nrVAlign,badge,badgeScale,
    freeText,freeTextSz,freeTextRot=0,freeText2,freeText2Sz,freeText2Rot=0,nameDx=0,nameDy=0}=opts;
  const numberFont=nrFont||font;
  const ftFont=freeTextFont||font;
  const ft2Font=freeText2Font||font;
  const vA=textVAlign||'alphabetic';
  const nrA=nrAlign||textAlign||'left';
  const nrVA=nrVAlign||vA;
  const p=activeP();
  const nameText=getDisplayName(p);
  const badgeOn=badge&&badge!=='none';
  if(key==='nr'&&badgeOn){
    const bb=badgeBoundsHalf(p.nr,nrSz,numberFont,badgeScale??S.badgeScale??72,badge);
    return{left:platePos.x-bb.halfW,top:platePos.y-bb.halfH,right:platePos.x+bb.halfW,bottom:platePos.y+bb.halfH};
  }
  if(key==='name'){
    const lines=nameText.split('\n');
    return textLinesBounds(platePos.x+Number(nameDx||0),platePos.y+Number(nameDy||0),lines,nameSz,font,textAlign,vA);
  }
  if(key==='freeText'){
    const lines=freeTextLines(freeText);
    const b=textLinesBounds(platePos.x,platePos.y,lines,freeTextSz||70,ftFont,textAlign,vA);
    return rotateBounds(b,platePos.x,platePos.y,freeTextRot);
  }
  if(key==='freeText2'){
    const lines=freeTextLines(freeText2);
    const b=textLinesBounds(platePos.x,platePos.y,lines,freeText2Sz||70,ft2Font,textAlign,vA);
    return rotateBounds(b,platePos.x,platePos.y,freeText2Rot);
  }
  if(key==='nr'){
    const text=String(p.nr||'');
    const baseline=nrBaselinePlateY(platePos.y,nrSz,text,numberFont,nrVA,nrA);
    const b=scanTextInkBounds(text,nrSz,numberFont,nrA);
    const padX=textBoxPad(nrSz,'x'),padY=textBoxPad(nrSz,'y');
    return{left:platePos.x+b.left-padX,top:baseline+b.top-padY,right:platePos.x+b.right+padX,bottom:baseline+b.bottom+padY};
  }
  const lsz=(platePos.sz!=null?platePos.sz:(key==='logo2'?(logo2Sz||S.logo2Sz||90):logoSz))||logoSz;
  const img=logoImageForKey(key,opts);
  const nw=img&&(img.naturalWidth||img.width)||1;
  const nh=img&&(img.naturalHeight||img.height)||1;
  const fit=logoFitRect(platePos.x,platePos.y,lsz,nw,nh);
  return{left:fit.x,top:fit.y,right:fit.x+fit.w,bottom:fit.y+fit.h};
}
function constrainToSafe(key,x,y,opts){
  if(S.showSafeMargin===false)return{x,y};
  const safe=getSafeRect();
  const b=getElementPlateBounds(key,{x,y},opts);
  let nx=x,ny=y;
  if(b.left<safe.left)nx+=safe.left-b.left;
  if(b.right>safe.right)nx-=b.right-safe.right;
  if(b.top<safe.top)ny+=safe.top-b.top;
  if(b.bottom>safe.bottom)ny-=b.bottom-safe.bottom;
  return{x:nx,y:ny};
}

function buildDragHandles(opts){
  const wrap=document.getElementById('cvWrap');
  wrap.querySelectorAll('.dh').forEach(e=>e.remove());
  const cv=document.getElementById('plateCanvas');
  const sc=cv.width/W; // scale factor preview→plate

  const {nameSz,nrSz,logoSz,logo2Sz,font,nrFont,freeTextFont,freeText2Font,textAlign,textVAlign,nrAlign,nrVAlign,
    freeText,freeTextSz,freeTextRot=0,freeText2,freeText2Sz,freeText2Rot=0}=opts;
  const numberFont=nrFont||font;
  const ftFont=freeTextFont||font;
  const ft2Font=freeText2Font||font;
  const vA=textVAlign||'alphabetic';
  const nrA=nrAlign||textAlign||'left';
  const nrVA=nrVAlign||vA;
  const p=activeP();
  const nameText=getDisplayName(p);
  const freeLines=freeTextLines(freeText);
  const freeLines2=freeTextLines(freeText2);
  const badgeOn=S.badge&&S.badge!=='none';

  const items=[
    {key:'nr',  fontSize:nrSz,  isText:!badgeOn},
    {key:'name',fontSize:nameSz,isText:true},
    {key:'logo',fontSize:logoSz,isText:false},
  ];
  if(freeLines.length)items.push({key:'freeText',fontSize:freeTextSz||70,isText:true,lines:freeLines,font:ftFont,rot:freeTextRot||0});
  if(freeLines2.length)items.push({key:'freeText2',fontSize:freeText2Sz||70,isText:true,lines:freeLines2,font:ft2Font,rot:freeText2Rot||0});
  if(S.logo2)items.push({key:'logo2',fontSize:logo2Sz||S.logo2Sz||90,isText:false});

  items.forEach(item=>{
    const platePos=getPos(item.key);
    let px,py,pw,ph;

    if(item.key==='nr'&&badgeOn){
      const bs=opts.badgeScale??S.badgeScale??72;
      const bb=badgeBoundsHalf(p.nr,nrSz,numberFont,bs,S.badge);
      px=(platePos.x-bb.halfW)*sc;py=(platePos.y-bb.halfH)*sc;pw=2*bb.halfW*sc;ph=2*bb.halfH*sc;
    }else if(item.isText){
      if(item.key==='name'){
        const b=textLinesBounds(platePos.x+Number(opts.nameDx||0),platePos.y+Number(opts.nameDy||0),nameText.split('\n'),nameSz,font,textAlign,vA);
        px=b.left*sc;py=b.top*sc;
        pw=Math.max((b.right-b.left)*sc,8);
        ph=Math.max((b.bottom-b.top)*sc,8);
      }else if(item.key==='freeText'||item.key==='freeText2'){
        const b0=textLinesBounds(platePos.x,platePos.y,item.lines,item.fontSize,item.font,textAlign,vA);
        const b=rotateBounds(b0,platePos.x,platePos.y,item.rot||0);
        px=b.left*sc;py=b.top*sc;
        pw=Math.max((b.right-b.left)*sc,8);
        ph=Math.max((b.bottom-b.top)*sc,8);
      }else{
        const text=String(p.nr||'');
        const baseline=nrBaselinePlateY(platePos.y,nrSz,text,numberFont,nrVA,nrA);
        const b=scanTextInkBounds(text,item.fontSize,numberFont,nrA);
        const padX=textBoxPad(item.fontSize,'x'),padY=textBoxPad(item.fontSize,'y');
        px=(platePos.x+b.left-padX)*sc;
        py=(baseline+b.top-padY)*sc;
        pw=Math.max((b.right-b.left+padX*2)*sc,8);
        ph=Math.max((b.bottom-b.top+padY*2)*sc,8);
      }
    }else{
      const maxSide=item.fontSize;
      const img=item.key==='logo'?S.logo:S.logo2;
      const nw=img&&(img.naturalWidth||img.width)||1;
      const nh=img&&(img.naturalHeight||img.height)||1;
      const fit=logoFitRect(platePos.x,platePos.y,maxSide,nw,nh);
      px=fit.x*sc;py=fit.y*sc;pw=fit.w*sc;ph=fit.h*sc;
    }

    const el=document.createElement('div');
    el.className='dh'+(S.sel===item.key?' sel':'');
    el.dataset.key=item.key;
    el.style.cssText=`left:${px}px;top:${py}px;width:${Math.max(pw,20)}px;height:${Math.max(ph,20)}px`;
    const tag=document.createElement('div');tag.className='dh-tag';
    tag.textContent={nr:'✥ Nummer',name:isTeamNameAdjustActive()?'✥ Name-Offset':'✥ Name',freeText:'✥ Freitext 1',freeText2:'✥ Freitext 2',logo:'✥ Logo 1',logo2:'✥ Logo 2'}[item.key];
    el.appendChild(tag);

    // resize handle for logos (mouse + touch)
    if(item.key==='logo'||item.key==='logo2'){
      const rh=document.createElement('div');rh.className='dh-resize';
      const slId=item.key==='logo'?'slLogo':'slLogo2';
      const vlId=item.key==='logo'?'vlLogo':'vlLogo2';
      const defSz=item.key==='logo'?S.logoSz:S.logo2Sz;
      const startResize=e=>{
        e.preventDefault();e.stopPropagation();
        const startX=ptXY(e).x,startSz=getPos(item.key).sz||defSz;
        const onmove=ev=>{
          const delta=(ptXY(ev).x-startX)/sc;
          const newSz=Math.max(20,Math.min(1200,Math.round(startSz+delta)));
          S.pos[item.key]={...getPos(item.key),sz:newSz};
          document.getElementById(slId).value=newSz;sv(slId,vlId);
          if(item.key==='logo')S.logoSz=newSz;else S.logo2Sz=newSz;
          render();
        };
        const onup=()=>{
          document.removeEventListener('mousemove',onmove);document.removeEventListener('mouseup',onup);
          document.removeEventListener('touchmove',onmove);document.removeEventListener('touchend',onup);
          const pp=getPos(item.key);
          const c=constrainToSafe(item.key,pp.x,pp.y,buildRenderOpts());
          if(c.x!==pp.x||c.y!==pp.y){S.pos[item.key]={...pp,x:c.x,y:c.y};render()}
        };
        document.addEventListener('mousemove',onmove);document.addEventListener('mouseup',onup);
        document.addEventListener('touchmove',onmove,{passive:false});document.addEventListener('touchend',onup);
      };
      rh.addEventListener('mousedown',startResize);
      rh.addEventListener('touchstart',startResize,{passive:false});
      el.appendChild(rh);
    }

    // drag start (mouse + touch) – also selects the element for keyboard nudging
    const startDrag=e=>{
      if(e.target.classList.contains('dh-resize'))return;
      e.preventDefault();
      setSelectedFontTarget(item.key);
      document.querySelectorAll('.dh').forEach(d=>d.classList.toggle('sel',d.dataset.key===item.key));
      if(item.key==='name'&&isTeamNameAdjustActive()&&startPlayerNameAdjustDrag(e,S.roster[S.active],document.getElementById('plateCanvas'),{hitTest:false})){
        el.classList.add('active');
        return;
      }
      const plateP=getPos(item.key),pt=ptXY(e);
      dragState={key:item.key,mx:pt.x,my:pt.y,ox:plateP.x,oy:plateP.y,sc};
      el.classList.add('active');
    };
    el.addEventListener('mousedown',startDrag);
    el.addEventListener('touchstart',startDrag,{passive:false});
    wrap.appendChild(el);
  });
}

// ── HILFSLINIEN ───────────────────────────
function buildGuideLines(){
  const wrap=document.getElementById('cvWrap');
  wrap.querySelectorAll('.guide-layer,.safe-layer').forEach(e=>e.remove());
  const cv=document.getElementById('plateCanvas');
  const sc=cv.width/W;
  const z=v=>Math.round(v*sc)+'px';
  if(S.showGuides){
    const layer=document.createElement('div');
    layer.className='guide-layer';
    const add=(cls,style)=>{const d=document.createElement('div');d.className='guide-line '+cls;Object.assign(d.style,style);layer.appendChild(d)};
    add('guide-v',{left:z(W/2)});
    add('guide-h',{top:z(H/2)});
    [W/3,2*W/3].forEach(x=>add('guide-v minor',{left:z(x)}));
    [H/3,2*H/3].forEach(y=>add('guide-h minor',{top:z(y)}));
    [W*.1,W*.9].forEach(x=>add('guide-v edge',{left:z(x)}));
    [H*.12,H*.88].forEach(y=>add('guide-h edge',{top:z(y)}));
    wrap.insertBefore(layer,wrap.firstChild.nextSibling);
  }
  if(S.showSafeMargin!==false){
    const safe=getSafeRect();
    const layer=document.createElement('div');
    layer.className='safe-layer';
    const box=document.createElement('div');
    box.className='guide-safe';
    box.style.cssText=`left:${z(safe.left)};top:${z(safe.top)};width:${z(safe.right-safe.left)};height:${z(safe.bottom-safe.top)}`;
    layer.appendChild(box);
    const lbl=document.createElement('div');
    lbl.className='guide-safe-lbl';
    lbl.textContent='3 mm Druckrand';
    lbl.style.cssText=`left:${z(safe.left+4)};top:${z(safe.top+3)}`;
    layer.appendChild(lbl);
    wrap.insertBefore(layer,wrap.firstChild.nextSibling);
  }
}

// ── SNAPPING ──────────────────────────────
const SNAP_TOL=16;
const SNAP_MINOR=10;
function snapAxis(v,targets,tol){
  let best=v,on=false;
  targets.forEach(t=>{
    if(Math.abs(v-t)<tol){best=t;on=true}
  });
  return{best,on};
}
function applySnap(x,y){
  const vT=[W/2,W/3,2*W/3,W*.1,W*.9];
  const hT=[H/2,H/3,2*H/3,H*.12,H*.88];
  if(S.showSafeMargin!==false){
    const s=getSafeRect();
    vT.push(s.left,s.right);
    hT.push(s.top,s.bottom);
  }
  let sx=snapAxis(x,vT,SNAP_TOL);
  if(!sx.on)sx=snapAxis(x,vT,SNAP_MINOR);
  let sy=snapAxis(y,hT,SNAP_TOL);
  if(!sy.on)sy=snapAxis(y,hT,SNAP_MINOR);
  return{x:sx.best,y:sy.best,snV:sx.on,snH:sy.on};
}
function showSnap(snV,snH,snapX,snapY){
  const cv=document.getElementById('plateCanvas'),sc=cv.width/W;
  const v=document.getElementById('snapV'),h=document.getElementById('snapH');
  v.style.left=Math.round((snV?snapX:W/2)*sc)+'px';v.style.opacity=snV?'.85':'0';
  h.style.top=Math.round((snH?snapY:H/2)*sc)+'px';h.style.opacity=snH?'.85':'0';
}
function hideSnap(){document.getElementById('snapV').style.opacity='0';document.getElementById('snapH').style.opacity='0'}

// ── GLOBAL DRAG (mouse + touch) ───────────
function moveDrag(e){
  if(!dragState)return;
  if(e.cancelable)e.preventDefault();
  const{key,mx,my,ox,oy,sc}=dragState;
  const pt=ptXY(e);
  const dx=(pt.x-mx)/sc,dy=(pt.y-my)/sc;
  if(dragState.mode==='playerNameAdjust'){
    const p=dragState.player;
    if(!p)return;
    setPlayerNameAdjustForTemplate(p,ox+dx,oy+dy);
    syncPlayerAdjustUi(p);
    if(!dragState.raf)dragState.raf=requestAnimationFrame(()=>{
      const cv=dragState.canvas||document.getElementById('plateCanvas');
      drawPlate(cv,cv.width,cv.height,makeFullOpts(p),false);
      if(!dragState.fromBatch)buildDragHandles(buildRenderOpts());
      if(dragState)dragState.raf=null;
    });
    return;
  }
  const cur=getPos(key);
  let nx=Math.max(0,Math.min(W,ox+dx)),ny=Math.max(0,Math.min(H,oy+dy));
  const sn=applySnap(nx,ny);
  const opts=buildRenderOpts();
  const c=constrainToSafe(key,sn.x,sn.y,opts);
  S.pos[key]={...cur,x:c.x,y:c.y};
  showSnap(sn.snV,sn.snH,sn.x,sn.y);
  if(!dragState.raf)dragState.raf=requestAnimationFrame(()=>{
    const cv=document.getElementById('plateCanvas');
    const opts=buildRenderOpts();
    drawPlate(cv,cv.width,cv.height,opts,false);
    buildDragHandles(opts);
    if(dragState)dragState.raf=null;
  });
}
function endDrag(){
  if(!dragState)return;
  document.querySelectorAll('.dh').forEach(e=>e.classList.remove('active'));
  if(dragState.mode==='playerNameAdjust'){
    document.querySelectorAll('.batch-item.dragging').forEach(e=>e.classList.remove('dragging'));
    persistRoster();
    render();
    refreshBatchIfVisible();
  }
  dragState=null;hideSnap();
  persistSession();
}
document.addEventListener('mousemove',moveDrag);
document.addEventListener('mouseup',endDrag);
document.addEventListener('touchmove',moveDrag,{passive:false});
document.addEventListener('touchend',endDrag);

// ── KEYBOARD NUDGE of the selected element ─
document.addEventListener('keydown',e=>{
  const tag=(document.activeElement&&document.activeElement.tagName)||'';
  if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;
  if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!S.sel&&S.roster.length>1&&document.getElementById('viewEditor').style.display!=='none'){
    if(e.key==='ArrowLeft')navPlayer(-1);else navPlayer(1);
    e.preventDefault();return;
  }
  if(!S.sel)return;
  if(e.key==='Escape'){S.sel=null;syncFontSelectOptions();render();return}
  const step=e.shiftKey?25:4;
  const d={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
  if(!d)return;
  e.preventDefault();
  if(S.sel==='name'&&isTeamNameAdjustActive()){
    const p=S.roster[S.active];
    const cur=getPlayerNameAdjust(p);
    setPlayerNameAdjustForTemplate(p,cur.x+d[0],cur.y+d[1]);
    syncPlayerAdjustUi(p);
    persistRoster();render();refreshBatchIfVisible();
    return;
  }
  const cur=getPos(S.sel);
  const opts=buildRenderOpts();
  const raw={x:Math.max(0,Math.min(W,cur.x+d[0])),y:Math.max(0,Math.min(H,cur.y+d[1]))};
  const c=constrainToSafe(S.sel,raw.x,raw.y,opts);
  S.pos[S.sel]={...cur,x:c.x,y:c.y};
  persistSession();render();
});

// Vertikale Text-Anker (Plate-Koordinaten, Schrift in px wie nameSz / nrSz)
function nameLinePlateYs(yAnchor,nameSzPlate,nameLines,font,vAlign,align='left'){
  const gap=nameSzPlate*1.05;
  const rel=nameLines.map((line,i)=>{
    const b=scanTextInkBounds(line||' ',nameSzPlate,font,align);
    return{baseline:i*gap,top:i*gap+b.top,bottom:i*gap+b.bottom};
  });
  let yFirst=yAnchor;
  if(rel.length&&(vAlign==='middle'||vAlign==='bottom')){
    const top=Math.min(...rel.map(r=>r.top));
    const bottom=Math.max(...rel.map(r=>r.bottom));
    if(vAlign==='middle')yFirst=yAnchor-(top+bottom)/2;
    else yFirst=yAnchor-bottom;
  }
  return rel.length?rel.map(r=>yFirst+r.baseline):[yAnchor];
}
function nrBaselinePlateY(yAnchor,nrSzPlate,nrText,font,vAlign,align='left'){
  const b=scanTextInkBounds(nrText||' ',nrSzPlate,font,align);
  if(vAlign==='middle')return yAnchor-(b.top+b.bottom)/2;
  if(vAlign==='bottom')return yAnchor-b.bottom;
  return yAnchor;
}

// ══════════════════════════════════════════
// DRAW PLATE
// ══════════════════════════════════════════
function drawPlate(canvas,w,h,opts,thumb){
  const ctx=canvas.getContext('2d');
  const sc=w/W;const Z=v=>v*sc;
  const{tpl,c:rawC,font,nrFont,freeTextFont,freeText2Font,layout,logo,logo2,bgImg,bgOp,logoOp,frame,screws,bar,logoBand,showPos,showNat,showLeague,
    logoSz,logo2Sz,nameSz,nrSz,freeText,freeTextSz,freeTextRot=0,freeText2,freeText2Sz,freeText2Rot=0,frameW,club,leagueTxt,textAlign,textVAlign,nrAlign,nrVAlign,nameMode,logoIsSvg,logo2IsSvg,
    first='',last='SPIELER',nr='##',playerPos='',nat='',nameDx=0,nameDy=0}=opts;
  const c=normalizePalette(rawC);
  const vA=textVAlign||'alphabetic';
  const numberFont=nrFont||font;
  const ftFont=freeTextFont||font;
  const ft2Font=freeText2Font||font;
  const nrA=nrAlign||textAlign||'left';
  const nrVA=nrVAlign||vA;

  ctx.clearRect(0,0,w,h);
  const fw=Z(frameW);

  // FRAME
  if(frame&&!thumb){
    const g=ctx.createLinearGradient(0,0,w,h);
    ['#d0d0d0','#888','#e0e0e0','#777','#aaa'].forEach((c,i)=>g.addColorStop(i/4,c));
    ctx.save();rrect(ctx,0,0,w,h,Z(13));
    ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=Z(26);ctx.shadowOffsetY=Z(5);
    ctx.fillStyle=g;ctx.fill();ctx.shadowColor='transparent';ctx.restore();
  }

  // INNER CLIP
  const ix=fw,iy=fw,iw=w-fw*2,ih=h-fw*2;
  ctx.save();rrect(ctx,ix,iy,iw,ih,frame&&!thumb?Z(7):Z(13));ctx.clip();

  // BG
  const bg=ctx.createLinearGradient(ix,iy,ix+iw,iy+ih);bg.addColorStop(0,c.bg1);bg.addColorStop(1,c.bg2);
  ctx.fillStyle=bg;ctx.fillRect(ix,iy,iw,ih);
  drawTplBg(ctx,tpl,ix,iy,iw,ih,c,sc,thumb);
  if(bgImg){ctx.globalAlpha=bgOp;ctx.drawImage(bgImg,ix,iy,iw,ih);ctx.globalAlpha=1}

  // LOGO BAND (optional, nur L/R-Layout)
  if(!thumb&&logoBand&&(layout==='L'||layout==='R')){
    const lp=getPos('logo');
    const bw=Z((lp.sz||logoSz)+55);
    const bx=layout==='L'?ix:ix+iw-bw;
    const g2=ctx.createLinearGradient(bx,0,bx+bw,0);
    g2.addColorStop(0,layout==='L'?darken(c.bg1,28):c.bg2);
    g2.addColorStop(1,layout==='L'?c.bg1:darken(c.bg1,28));
    ctx.fillStyle=g2;ctx.fillRect(bx,iy,bw,ih);
    const sepX=layout==='L'?bx+bw:bx;
    const sg=ctx.createLinearGradient(0,iy,0,iy+ih);
    sg.addColorStop(0,c.acc);sg.addColorStop(.5,lighten(c.acc,28));sg.addColorStop(1,c.acc);
    ctx.strokeStyle=sg;ctx.lineWidth=Z(5);
    ctx.beginPath();ctx.moveTo(sepX,iy);ctx.lineTo(sepX,iy+ih);ctx.stroke();
  }

  // GET POSITIONS
  const logoPosData=getPos('logo');
  const logo2PosData=getPos('logo2');
  const namePosData=getPos('name');
  const nrPosData=getPos('nr');
  const effLogoSz=logoPosData.sz||logoSz;
  const effLogo2Sz=logo2PosData.sz||logo2Sz||90;

  // LOGOS – smoothing enabled
  ctx.save();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.globalAlpha=thumb?1:logoOp;
  const lsz=Z(thumb?52:effLogoSz);
  const lx=Z(logoPosData.x),ly=Z(logoPosData.y);
  if(logo)drawLogoOnPlate(ctx,logo,lx,ly,lsz,!!logoIsSvg,thumb);
  else if(!thumb&&!logo2)ehcLogo(ctx,lx,ly,lsz/2);
  if(logo2&&!thumb){
    const l2sz=Z(effLogo2Sz);
    const l2x=Z(logo2PosData.x),l2y=Z(logo2PosData.y);
    drawLogoOnPlate(ctx,logo2,l2x,l2y,l2sz,!!logo2IsSvg,false);
  }
  ctx.globalAlpha=1;ctx.restore();

  // NUMBER (+ optional badge)
  const hasBadge=opts.badge&&opts.badge!=='none'&&!thumb;
  const nrText=String(nr);
  const nrFontPx=Z(thumb?58:nrSz);
  const nrX=Z(nrPosData.x),nrY=Z(nrPosData.y);
  ctx.save();
  ctx.font=`${nrFontPx}px ${numberFont},sans-serif`;
  if(thumb){
    ctx.textBaseline='alphabetic';setTextAlign(ctx,nrA);
    ctx.shadowColor=tpl===6?c.nrc:'rgba(0,0,0,.55)';ctx.shadowBlur=Z(tpl===6?20:8);
    ctx.shadowOffsetX=Z(2);ctx.shadowOffsetY=Z(3);ctx.fillStyle=c.nrc;
    ctx.fillText(nrText,nrX,nrY);ctx.shadowColor='transparent';
  }else if(hasBadge){
    const Rp=Z(badgeR(nr,nrSz,numberFont,opts.badgeScale??S.badgeScale??72));
    drawBadge(ctx,opts.badge,nrX,nrY,Rp,opts.badgeColor||'#C8102E',opts.badgeFillOp??1,opts.badgeBorderColor||'#FFFFFF',opts.shadowOn);
    ctx.textAlign='center';ctx.textBaseline='middle';
    drawFxText(ctx,nrText,nrX+Z(opts.badgeNrDx||0),nrY+Z(opts.badgeNrDy||0),c.nrc,opts,Z);
  }else{
    ctx.textBaseline='alphabetic';setTextAlign(ctx,nrA);
    const nrYb=Z(nrBaselinePlateY(nrPosData.y,nrSz,nrText,numberFont,nrVA,nrA));
    drawFxText(ctx,nrText,nrX,nrYb,c.nrc,opts,Z);
  }
  ctx.restore();

  // NAME – handle multi-line (both / newline modes)
  const nameText=getDisplayNameFromOpts({first,last},nameMode||'last');
  const nameFontPx=Z(thumb?44:nameSz);
  const nameLines=nameText.split('\n');
  const adjNameX=namePosData.x+(thumb?0:Number(nameDx||0));
  const adjNameY=namePosData.y+(thumb?0:Number(nameDy||0));
  const nameX=Z(adjNameX);
  const nameYsPlate=thumb?nameLinePlateYs(adjNameY,nameSz,nameLines,font,'alphabetic',textAlign):nameLinePlateYs(adjNameY,nameSz,nameLines,font,vA,textAlign);
  ctx.save();
  ctx.font=`${nameFontPx}px ${font},sans-serif`;
  ctx.textBaseline='alphabetic';
  setTextAlign(ctx,textAlign);
  if(thumb){
    ctx.shadowColor=tpl===6?c.nc+'88':'rgba(0,0,0,.6)';ctx.shadowBlur=Z(tpl===6?18:10);
    ctx.shadowOffsetX=Z(2);ctx.shadowOffsetY=Z(4);ctx.fillStyle=c.nc;
    nameLines.forEach((line,li)=>ctx.fillText(line,nameX,Z(nameYsPlate[li])));
    ctx.shadowColor='transparent';
  }else{
    nameLines.forEach((line,li)=>drawFxText(ctx,line,nameX,Z(nameYsPlate[li]),c.nc,opts,Z));
  }
  ctx.restore();

  // SUBINFO
  if(!thumb){
    const parts=[];
    if(showLeague)parts.push(leagueTxt);
    if(showPos&&playerPos)parts.push(playerPos);
    if(showNat&&nat)parts.push(nat);
    if(parts.length){
      ctx.save();
      ctx.font=`${Z(30)}px 'Rajdhani',sans-serif`;
      ctx.fillStyle='rgba(255,255,255,.33)';
      setTextAlign(ctx,textAlign);
      ctx.textBaseline='alphabetic';
      const lastBase=nameYsPlate[nameYsPlate.length-1];
      ctx.fillText(parts.join('  ·  '),nameX,Z(lastBase+nameSz*TYPO_DES+6));
      ctx.restore();
    }
  }

  // FREE TEXT
  const drawFreeTextBlock=(key,text,size,fontFamily,rotation)=>{
    const ftLines=freeTextLines(text);
    if(!ftLines.length)return;
    const ftPosData=getPos(key);
    const ftSize=thumb?Math.min(size||70,32):size||70;
    const ftFontPx=Z(ftSize);
    const ftX=Z(ftPosData.x);
    const ftYsPlate=nameLinePlateYs(ftPosData.y,ftSize,ftLines,fontFamily,thumb?'alphabetic':vA,textAlign);
    ctx.save();
    ctx.translate(ftX,Z(ftPosData.y));
    ctx.rotate((Number(rotation)||0)*Math.PI/180);
    ctx.font=`${ftFontPx}px ${fontFamily},sans-serif`;
    ctx.textBaseline='alphabetic';
    setTextAlign(ctx,textAlign);
    if(thumb){
      ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=Z(8);
      ctx.shadowOffsetX=Z(2);ctx.shadowOffsetY=Z(3);ctx.fillStyle=key==='freeText2'?c.ft2c:c.ftc;
      ftLines.forEach((line,li)=>ctx.fillText(line,0,Z(ftYsPlate[li]-ftPosData.y)));
      ctx.shadowColor='transparent';
    }else{
      const textColor=key==='freeText2'?c.ft2c:c.ftc;
      ftLines.forEach((line,li)=>drawFxText(ctx,line,0,Z(ftYsPlate[li]-ftPosData.y),textColor,opts,Z));
    }
    ctx.restore();
  };
  drawFreeTextBlock('freeText',freeText,freeTextSz,ftFont,freeTextRot);
  drawFreeTextBlock('freeText2',freeText2,freeText2Sz,ft2Font,freeText2Rot);

  ctx.restore(); // inner clip

  // BARS
  if(bar&&!thumb){
    const bh=Z(9);const bg3=ctx.createLinearGradient(ix,0,ix+iw,0);
    bg3.addColorStop(0,c.acc);bg3.addColorStop(.5,lighten(c.acc,32));bg3.addColorStop(1,c.acc);
    ctx.fillStyle=bg3;ctx.fillRect(ix,iy,iw,bh);ctx.fillRect(ix,iy+ih-bh,iw,bh);
  }

  // SCREWS
  if(screws&&frame&&!thumb){
    const so=Z(18);
    [[so,so],[w-so,so],[so,h-so],[w-so,h-so]].forEach(([x,y])=>drawScrew(ctx,x,y,Z(7)));
  }
}

function getDisplayNameFromOpts(p,mode){
  const f=(p.first||'').trim().toUpperCase();
  const l=(p.last||'').trim().toUpperCase();
  if(mode==='last')  return l||f;
  if(mode==='first') return f||l;
  if(mode==='both')  return [f,l].filter(Boolean).join('\n');
  if(mode==='firstlast') return [f,l].filter(Boolean).join(' ');
  if(mode==='initial') return (f?f[0]+'. ':'')+l;
  return l||f;
}

function setTextAlign(ctx,align){
  ctx.textAlign=align==='center'?'center':align==='right'?'right':'left';
}

// ══════════════════════════════════════════
// TEXT EFFECTS – shadow + glow (uses current ctx font/align/baseline)
// ══════════════════════════════════════════
function drawFxText(ctx,text,x,y,color,opts,Z){
  ctx.save();
  ctx.fillStyle=color;
  // glow pass (drawn twice for a denser halo)
  if(opts.glowOn){
    ctx.shadowColor=opts.glowColor||'#00BFFF';
    ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    ctx.shadowBlur=Z(opts.glowSize||26);
    ctx.fillText(text,x,y);
    ctx.fillText(text,x,y);
  }
  // drop-shadow pass
  if(opts.shadowOn){
    ctx.shadowColor='rgba(0,0,0,.6)';
    ctx.shadowBlur=Z(opts.shBlur||0);
    ctx.shadowOffsetX=Z((opts.shDist||0)*.55);
    ctx.shadowOffsetY=Z(opts.shDist||0);
    ctx.fillText(text,x,y);
  }
  // crisp fill on top
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.fillText(text,x,y);
  ctx.restore();
}

// ══════════════════════════════════════════
// NUMBER BADGE – circle / shield / hexagon / diamond
// ══════════════════════════════════════════
function drawBadge(ctx,shape,cx,cy,R,fillColor,fillOp,borderColor,withShadow){
  ctx.save();
  if(withShadow){ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=R*.30;ctx.shadowOffsetY=R*.12}
  ctx.fillStyle=hexToRgba(fillColor,fillOp==null?1:fillOp);
  ctx.beginPath();
  if(shape==='circle'){
    ctx.arc(cx,cy,R*1.16,0,Math.PI*2);
  }else if(shape==='diamond'){
    const d=R*1.5;
    ctx.moveTo(cx,cy-d);ctx.lineTo(cx+d,cy);ctx.lineTo(cx,cy+d);ctx.lineTo(cx-d,cy);ctx.closePath();
  }else if(shape==='hexagon'){
    const s=R*1.34;
    for(let i=0;i<6;i++){const a=i*Math.PI/3;const X=cx+s*Math.cos(a),Y=cy+s*Math.sin(a);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)}
    ctx.closePath();
  }else if(shape==='shield'){
    const wd=R*1.34,tp=cy-R*1.36,md=cy+R*.45,bt=cy+R*1.55;
    ctx.moveTo(cx-wd,tp);ctx.lineTo(cx+wd,tp);ctx.lineTo(cx+wd,md);
    ctx.quadraticCurveTo(cx+wd,cy+R*1.12,cx,bt);
    ctx.quadraticCurveTo(cx-wd,cy+R*1.12,cx-wd,md);
    ctx.closePath();
  }
  ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.lineWidth=Math.max(2,R*.08);
  ctx.strokeStyle=borderColor||'#FFFFFF';
  ctx.stroke();
  ctx.restore();
}

// ══════════════════════════════════════════
// TEMPLATE BACKGROUNDS
// ══════════════════════════════════════════
function drawTplBg(ctx,tpl,x,y,w,h,c,sc,thumb){
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  const Z=v=>v*sc;
  if(tpl===0){ctx.strokeStyle='rgba(255,255,255,.022)';ctx.lineWidth=Z(2);for(let i=-h;i<w+h;i+=Z(50)){ctx.beginPath();ctx.moveTo(x+i,y);ctx.lineTo(x+i+h,y+h);ctx.stroke()}}
  else if(tpl===1){ctx.strokeStyle='rgba(0,191,255,.055)';ctx.lineWidth=Z(1);for(let r=0;r<7;r++)for(let cc=0;cc<30;cc++){hexPath(ctx,x+cc*Z(68)+(r%2)*Z(34),y+r*Z(58),Z(26));ctx.stroke()}}
  else if(tpl===2){const g=ctx.createRadialGradient(x+w*.5,y+h*.5,0,x+w*.5,y+h*.5,Z(330));g.addColorStop(0,'rgba(212,185,106,.12)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x,y,w,h)}
  else if(tpl===3){for(let r=0;r<h;r+=Z(8))for(let cc=0;cc<w;cc+=Z(8)){ctx.fillStyle=`rgba(255,255,255,${((Math.floor(r/Z(8))+Math.floor(cc/Z(8)))%2)*.016+.007})`;ctx.fillRect(x+cc,y+r,Z(8),Z(8))}}
  else if(tpl===4){[.22,.5,.78].forEach(p=>{ctx.fillStyle='rgba(255,255,255,.052)';ctx.fillRect(x,y+h*p-Z(13),w,Z(26))})}
  else if(tpl===5){ctx.fillStyle='rgba(0,0,0,.035)';for(let i=0;i<150;i++)ctx.fillRect(x+Math.random()*w,y+Math.random()*h,Z(2),Z(2))}
  else if(tpl===6){['#FF00FF','#00FFFF'].forEach((cc,i)=>{const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'transparent');g.addColorStop(.5,cc+'2a');g.addColorStop(1,'transparent');ctx.globalAlpha=.24;ctx.strokeStyle=g;ctx.lineWidth=Z(i*20+10);ctx.beginPath();ctx.moveTo(x,y+(i?h:0));ctx.lineTo(x+w,y+(i?0:h));ctx.stroke();ctx.globalAlpha=1})}
  else if(tpl===7){ctx.fillStyle='rgba(212,185,106,.048)';for(let i=0;i<9;i++){starPath(ctx,x+(i/8)*w,y+h/2,Z(28),Z(11),5);ctx.fill()}}
  ctx.restore();
}

// ══════════════════════════════════════════
// SHAPE HELPERS
// ══════════════════════════════════════════
function rrect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath()}
function hexPath(ctx,x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;i?ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a)):ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a))}ctx.closePath()}
function starPath(ctx,x,y,ro,ri,pts){ctx.beginPath();for(let i=0;i<pts*2;i++){const r=i%2?ri:ro,a=i*Math.PI/pts-Math.PI/2;i?ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a)):ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a))}ctx.closePath()}
function drawScrew(ctx,x,y,r){const g=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);g.addColorStop(0,'#ddd');g.addColorStop(1,'#777');ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=.5;ctx.stroke();ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.strokeStyle='rgba(0,0,0,.38)';ctx.lineWidth=r*.28;ctx.beginPath();ctx.moveTo(-r*.6,0);ctx.lineTo(r*.6,0);ctx.stroke();ctx.restore()}
function darken(h,a){return adjBr(h,-a)}function lighten(h,a){return adjBr(h,a)}
function adjBr(hex,a){
  const h=normalizeHexColor(hex,'#000000');
  if(!/^#[0-9A-F]{6}$/i.test(h))return'#000000';
  let r=parseInt(h.slice(1,3),16)+a,g=parseInt(h.slice(3,5),16)+a,b=parseInt(h.slice(5,7),16)+a;
  return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')
}

// ══════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════
// NOTE: drag positions are resolved via getPos() (global S.pos), so opts.pos
// must keep the player's POSITION string – do not overwrite it with S.pos.
function makeFullOpts(p){return{...S,...readSizeOpts(),...playerOpts(p)}}
function safeName(s){return String(s||'').trim().replace(/[^\wÀ-ſ-]+/g,'_')||'X'}
function exportFileName(p,prefix){
  const pre=prefix||'';
  const nr=safeName(p.nr||'0');
  const last=safeName(p.last||p.first||'X');
  const first=safeName(p.first||'');
  const club=safeName((S.club||'team').replace(/^EHC\s+/i,'')).slice(0,16);
  const pat=S.exportNamePattern||'last_nr';
  if(pat==='nr_last')return pre+nr+'_'+last;
  if(pat==='nr_last_club')return pre+nr+'_'+last+'_'+club;
  if(pat==='nr_last_first')return pre+nr+'_'+last+(first?'_'+first:'');
  return pre+'nameplate_'+last+'_'+nr;
}
function showBatchProgress(cur,total,msg){
  const box=document.getElementById('batchProgress');
  const lbl=document.getElementById('batchProgressLbl');
  const fill=document.getElementById('batchProgressFill');
  if(!box||!lbl||!fill)return;
  box.style.display='flex';
  box.setAttribute('aria-hidden','false');
  const pct=total?Math.round(cur/total*100):0;
  lbl.textContent=(msg||'Exportiere…')+' ('+cur+' / '+total+')';
  fill.style.width=pct+'%';
}
function hideBatchProgress(){
  const box=document.getElementById('batchProgress');
  if(box){box.style.display='none';box.setAttribute('aria-hidden','true')}
}
async function loadRepoRoster(index){
  const file=STATIC_ROSTER_FILES[index]||STATIC_ROSTER_FILES[0];
  if(!file)return;
  try{
    showOk('Lade '+file.label+'…');
    const res=await fetch(encodeURI(file.path),{cache:'no-store'});
    if(!res.ok){showErr(file.label+' nicht im Repo gefunden.');return}
    const buf=await res.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    if(!wb.SheetNames.length){showErr('Excel ohne Tabellenblatt.');return}
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
    if(!data.length){showErr('Keine Datenzeilen gefunden.');return}
    processRows(data,file.label+'.xlsx');
  }catch(e){showErr('Kader-Import: '+(e.message||e))}
}
async function parseRosterFile(file,label){
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(ext==='csv'){
    const text=await file.text();
    const parsed=Papa.parse(text,{header:true,skipEmptyLines:'greedy',encoding:'UTF-8',transformHeader:h=>h.trim()});
    if(parsed.errors&&parsed.errors.length&&!parsed.data.length)throw new Error(parsed.errors[0].message);
    if(!parsed.data.length)throw new Error('Keine Datenzeilen gefunden.');
    processRows(parsed.data,label||file.name);
    return;
  }
  if(['xlsx','xls'].includes(ext)){
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    if(!wb.SheetNames.length)throw new Error('Excel ohne Tabellenblatt.');
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
    if(!data.length)throw new Error('Keine Datenzeilen gefunden.');
    processRows(data,label||file.name);
    return;
  }
  throw new Error('Format nicht unterstützt: .'+ext);
}
function dataUrlToArrayBuffer(dataUrl){
  const base64=String(dataUrl||'').split(',')[1]||'';
  const bin=atob(base64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return bytes.buffer;
}
async function parseNativeRosterFile(path,label){
  const ext=(path.split('.').pop()||'').toLowerCase();
  if(ext==='csv'){
    const text=await nativeInvoke('pf_read_text',{path});
    if(!text)throw new Error('CSV-Datei ist leer oder nicht lesbar.');
    const parsed=Papa.parse(text,{header:true,skipEmptyLines:'greedy',encoding:'UTF-8',transformHeader:h=>h.trim()});
    if(parsed.errors&&parsed.errors.length&&!parsed.data.length)throw new Error(parsed.errors[0].message);
    if(!parsed.data.length)throw new Error('Keine Datenzeilen gefunden.');
    processRows(parsed.data,label||nativeBasename(path));
    return;
  }
  if(['xlsx','xls'].includes(ext)){
    const dataUrl=await nativeInvoke('pf_read_file_data_url',{path});
    const wb=XLSX.read(dataUrlToArrayBuffer(dataUrl),{type:'array'});
    if(!wb.SheetNames.length)throw new Error('Excel ohne Tabellenblatt.');
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
    if(!data.length)throw new Error('Keine Datenzeilen gefunden.');
    processRows(data,label||nativeBasename(path));
    return;
  }
  throw new Error('Format nicht unterstützt: .'+ext);
}
async function findNativeWorkspaceRosterFile(){
  const root=await loadNativeWorkspacePath();
  if(!root)return null;
  const files=await nativeInvoke('pf_read_dir_recursive',{path:root});
  const matches=[];
  for(const item of files){
    if(!/\.(csv|xlsx|xls)$/i.test(item.path))continue;
    const name=item.path.toLowerCase();
    const priority=/kader/.test(name)?0:/roster/.test(name)?1:2;
    matches.push({...item,fullPath:nativePathJoin(root,item.path),priority});
  }
  matches.sort((a,b)=>a.priority-b.priority||(b.modified||0)-(a.modified||0)||a.path.localeCompare(b.path,undefined,{numeric:true,sensitivity:'base'}));
  return matches[0]||null;
}
async function findWorkspaceRosterFile(){
  if(isTauriApp())return findNativeWorkspaceRosterFile();
  const h=await loadWorkspaceHandle();
  if(!h||!await ensureDirPermission(h,false))return null;
  const matches=[];
  for await(const item of walkDir(h)){
    if(!/\.(csv|xlsx|xls)$/i.test(item.path))continue;
    const file=await item.handle.getFile();
    const name=item.path.toLowerCase();
    const priority=/kader/.test(name)?0:/roster/.test(name)?1:2;
    matches.push({path:item.path,file,priority});
  }
  matches.sort((a,b)=>a.priority-b.priority||(b.file.lastModified||0)-(a.file.lastModified||0)||a.path.localeCompare(b.path,undefined,{numeric:true,sensitivity:'base'}));
  return matches[0]||null;
}
async function loadWorkspaceRoster(){
  try{
    if(isTauriApp()&&!(await loadNativeWorkspacePath())){
      showWarn('Bitte zuerst unter Optionen den PlateForge Workspace wählen.');
      return;
    }
    if(!isTauriApp()&&!(await loadWorkspaceHandle())){
      showWarn('Bitte zuerst unter Optionen den PlateForge Workspace wählen.');
      return;
    }
    if(await importWorkspaceRoster({force:true,showStatus:false})){
      showOk(`Workspace-Roster: ${S.roster.length} Spieler übernommen.`);
      return;
    }
    const item=await findWorkspaceRosterFile();
    if(!item){
      showWarn('Kein CSV/XLSX-Kader im Workspace gefunden.');
      return;
    }
    showOk('Lade Workspace-Kader: '+item.path);
    if(item.file)await parseRosterFile(item.file,item.path);
    else await parseNativeRosterFile(item.fullPath,item.path);
  }catch(e){showErr('Workspace-Kader: '+(e.message||e))}
}
async function refreshStorageInfo(){
  const el=document.getElementById('storageInfo');
  if(!el)return;
  const tplCount=loadUserTemplates().length;
  const fontCount=S.savedFonts.filter(f=>!f.static).length;
  let idbMb='—';
  try{
    if(navigator.storage&&navigator.storage.estimate){
      const est=await navigator.storage.estimate();
      idbMb=((est.usage||0)/1048576).toFixed(1)+' MB';
    }
  }catch(e){}
  el.innerHTML=`Vorlagen: <strong>${tplCount}</strong> · Eigene Fonts: <strong>${fontCount}</strong> · Hochgeladene Bilder: <strong>${userAssets.length}</strong> · Browser-Speicher: <strong>${idbMb}</strong>`;
  refreshGithubPushInfo();
}

// ══════════════════════════════════════════
// GITHUB PUSH
// ══════════════════════════════════════════
const GITHUB_DEFAULT_OWNER='Noudi72';
const GITHUB_DEFAULT_REPO='Plate-Forge';
const GITHUB_DEFAULT_BRANCH='main';
const GITHUB_TOKEN_KEY='plateforge_github_token';
const GITHUB_CFG_KEY='plateforge_github_cfg';
const GITHUB_ASSET_PREFIX='Vorlagen Garderobenschilder/';

function loadGithubCfg(){
  try{
    const c=JSON.parse(localStorage.getItem(GITHUB_CFG_KEY)||'{}');
    return{
      owner:(c.owner||GITHUB_DEFAULT_OWNER).trim(),
      repo:(c.repo||GITHUB_DEFAULT_REPO).trim(),
      branch:(c.branch||GITHUB_DEFAULT_BRANCH).trim(),
    };
  }catch(e){
    return{owner:GITHUB_DEFAULT_OWNER,repo:GITHUB_DEFAULT_REPO,branch:GITHUB_DEFAULT_BRANCH};
  }
}
function saveGithubCfg(cfg){
  try{localStorage.setItem(GITHUB_CFG_KEY,JSON.stringify(cfg))}catch(e){}
}
function getGithubToken(){
  try{return sessionStorage.getItem(GITHUB_TOKEN_KEY)||''}catch(e){return''}
}
function setGithubToken(tok){
  try{
    if(tok)sessionStorage.setItem(GITHUB_TOKEN_KEY,tok);
    else sessionStorage.removeItem(GITHUB_TOKEN_KEY);
  }catch(e){}
}
function saveGithubTokenFromUi(){
  const inp=document.getElementById('githubToken');
  if(!inp)return;
  setGithubToken(inp.value.trim());
  refreshGithubPushInfo();
}
function saveGithubCfgFromUi(){
  saveGithubCfg({
    owner:(document.getElementById('githubOwner')?.value||GITHUB_DEFAULT_OWNER).trim(),
    repo:(document.getElementById('githubRepo')?.value||GITHUB_DEFAULT_REPO).trim(),
    branch:(document.getElementById('githubBranch')?.value||GITHUB_DEFAULT_BRANCH).trim(),
  });
  refreshGithubPushInfo();
}
function initGithubUi(){
  const cfg=loadGithubCfg();
  const tokInp=document.getElementById('githubToken');
  const ownInp=document.getElementById('githubOwner');
  const repoInp=document.getElementById('githubRepo');
  const brInp=document.getElementById('githubBranch');
  if(ownInp)ownInp.value=cfg.owner;
  if(repoInp)repoInp.value=cfg.repo;
  if(brInp)brInp.value=cfg.branch;
  if(tokInp){
    const tok=getGithubToken();
    if(tok)tokInp.placeholder='●●●● verbunden (neu eingeben zum Ändern)';
  }
  refreshGithubPushInfo();
}
function refreshGithubPushInfo(){
  const el=document.getElementById('githubPushInfo');
  if(!el)return;
  const tok=getGithubToken();
  const tpl=loadUserTemplates().length;
  el.innerHTML=`Token: <strong>${tok?'verbunden':'fehlt'}</strong> · Upload-Bilder: <strong>${userAssets.length}</strong> · Vorlagen lokal: <strong>${tpl}</strong>`;
}
function dataUrlToBase64(dataUrl){
  const i=String(dataUrl||'').indexOf(',');
  return i>=0?dataUrl.slice(i+1):dataUrl;
}
async function githubFetch(path,{method='GET',body=null}={}){
  const token=getGithubToken();
  if(!token)throw new Error('Kein GitHub-Token — bitte PAT eingeben.');
  const headers={
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    Authorization:'Bearer '+token,
  };
  if(body)headers['Content-Type']='application/json';
  const res=await fetch('https://api.github.com'+path,{
    method,headers,
    body:body?JSON.stringify(body):undefined,
  });
  if(!res.ok){
    let msg=res.statusText;
    try{const j=await res.json();msg=j.message||msg}catch(e){}
    if(res.status===401)throw new Error('Token ungültig oder abgelaufen.');
    if(res.status===403)throw new Error('Keine Schreibrechte — Classic Token mit Haken bei „repo“ nötig.');
    throw new Error(`GitHub ${res.status}: ${msg}`);
  }
  if(res.status===204)return null;
  return res.json();
}
function patchStaticAssetsJs(jsText,newFileNames){
  if(!newFileNames.length)return null;
  const existing=new Set(STATIC_ASSETS.map(a=>a.name.toLowerCase()));
  const toAdd=[...new Set(newFileNames.map(n=>String(n||'').trim()).filter(n=>n&&!existing.has(n.toLowerCase())))];
  if(!toAdd.length)return null;
  const re=/const STATIC_ASSETS=\[([\s\S]*?)\]\.map\(name=>\(\{name,path:'Vorlagen Garderobenschilder\/'\+name\}\)\)/;
  if(!re.test(jsText))return null;
  const additions=toAdd.map(n=>`'${n.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}'`).join(',\n  ');
  return jsText.replace(re,(full,inner)=>{
    const trimmed=inner.trimEnd();
    const suffix=trimmed.endsWith(',')?'':',';
    return `const STATIC_ASSETS=[${trimmed}${suffix}\n  ${additions}\n].map(name=>({name,path:'Vorlagen Garderobenschilder/'+name}))`;
  });
}
async function collectGithubPushFiles(){
  const files=[];
  const assetNames=[];
  for(const a of userAssets){
    if(!a.name||!a.url)continue;
    files.push({
      path:GITHUB_ASSET_PREFIX+a.name,
      base64:dataUrlToBase64(a.url),
      binary:true,
    });
    assetNames.push(a.name);
  }
  const master=await buildMasterTemplatesPayload();
  files.push({
    path:STATIC_MASTER_TEMPLATES,
    content:JSON.stringify(master,null,2)+'\n',
    binary:false,
  });
  try{
    const res=await fetch('./app.js?'+Date.now(),{cache:'no-store'});
    if(res.ok){
      const jsText=await res.text();
      const patched=patchStaticAssetsJs(jsText,assetNames);
      if(patched&&patched!==jsText){
        files.push({path:'app.js',content:patched,binary:false});
      }
    }
  }catch(e){}
  return files;
}
async function githubCreateCommit({owner,repo,branch,message,files}){
  const ref=await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  const baseSha=ref.object.sha;
  const baseCommit=await githubFetch(`/repos/${owner}/${repo}/git/commits/${baseSha}`);
  const treeItems=[];
  for(const f of files){
    const blob=await githubFetch(`/repos/${owner}/${repo}/git/blobs`,{
      method:'POST',
      body:{content:f.binary?f.base64:f.content,encoding:f.binary?'base64':'utf-8'},
    });
    treeItems.push({path:f.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const tree=await githubFetch(`/repos/${owner}/${repo}/git/trees`,{
    method:'POST',
    body:{base_tree:baseCommit.tree.sha,tree:treeItems},
  });
  const commit=await githubFetch(`/repos/${owner}/${repo}/git/commits`,{
    method:'POST',
    body:{message,tree:tree.sha,parents:[baseSha]},
  });
  await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,{
    method:'PATCH',
    body:{sha:commit.sha},
  });
  return commit;
}
async function pushToGithub(){
  const btn=document.getElementById('btnGithubPush');
  const info=document.getElementById('githubPushInfo');
  const tokInp=document.getElementById('githubToken');
  if(tokInp&&tokInp.value.trim())setGithubToken(tokInp.value.trim());
  saveGithubCfgFromUi();
  const token=getGithubToken();
  if(!token){showErr('GitHub-Token fehlt — unter Optionen eingeben.');return}
  const cfg=loadGithubCfg();
  if(btn)btn.disabled=true;
  if(info)info.textContent='Dateien werden vorbereitet…';
  try{
    const files=await collectGithubPushFiles();
    if(!files.length){showWarn('Nichts zum Pushen.');return}
    const assetCount=userAssets.length;
    const msg=`Plate-Forge: ${assetCount?assetCount+' Asset(s) + ':''}Master-Vorlagen (${new Date().toISOString().slice(0,10)})`;
    if(info)info.textContent=`Committe ${files.length} Datei(en)…`;
    const commit=await githubCreateCommit({...cfg,message:msg,files});
    if(info)info.innerHTML=`✓ Commit <strong>${(commit.sha||'').slice(0,7)}</strong> auf <strong>${cfg.branch}</strong> — GitHub Pages aktualisiert sich in 1–2 Min.`;
    showOk(`GitHub Push erfolgreich (${files.length} Dateien).`);
  }catch(e){
    if(info)info.textContent='Push fehlgeschlagen.';
    showErr('GitHub Push: '+(e.message||e));
  }finally{
    if(btn)btn.disabled=false;
    refreshGithubPushInfo();
  }
}
async function registerServiceWorker(){
  if(!('serviceWorker'in navigator))return;
  try{
    let refreshing=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing)return;
      refreshing=true;
      location.reload();
    });
    const reg=await navigator.serviceWorker.register('sw.js?v=7',{scope:'./'});
    const activateWaiting=()=>{
      if(reg.waiting){
        reg.waiting.postMessage({type:'SKIP_WAITING'});
      }
    };
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;
      if(!nw)return;
      nw.addEventListener('statechange',()=>{
        if(nw.state==='installed'&&navigator.serviceWorker.controller){
          showOk('Update geladen — Seite wird aktualisiert.');
          setTimeout(activateWaiting,500);
        }
      });
    });
    if(reg.waiting)activateWaiting();
    reg.update();
  }catch(e){}
}

// renders one plate at the chosen export resolution / format
function renderExportCanvas(p){
  const sc=S.exportFormat==='pdf'?Math.max(1,S.exportScale||2):(S.exportScale||1);
  const ew=W*sc,eh=H*sc;
  const cv=document.createElement('canvas');cv.width=ew;cv.height=eh;
  drawPlate(cv,ew,eh,makeFullOpts(p),false);
  // JPG has no alpha → paint a dark backdrop BEHIND the (rounded) plate
  if(S.exportFormat==='jpg'){
    const ctx=cv.getContext('2d');
    ctx.globalCompositeOperation='destination-over';
    ctx.fillStyle='#0b0d12';ctx.fillRect(0,0,ew,eh);
    ctx.globalCompositeOperation='source-over';
  }
  return cv;
}
function togPdfCutMarks(){
  S.pdfCutMarks=!S.pdfCutMarks;
  const el=document.getElementById('togPdfCutMarks');
  if(el)el.classList.toggle('on',S.pdfCutMarks);
  syncExportUi();persistSession();
}
function togPdfSingle(){
  S.pdfIncludeSingle=!S.pdfIncludeSingle;
  const el=document.getElementById('togPdfSingle');
  if(el)el.classList.toggle('on',S.pdfIncludeSingle);
  syncExportUi();persistSession();
}
function getSheetSizeMm(sheet){
  return SHEET_SIZES[sheet||S.pdfSheet||'a4']||SHEET_SIZES.a4;
}
function syncExportUi(){
  const fmt=S.exportFormat||'png';
  const pdfOn=fmt==='pdf';
  const pdfRow=document.getElementById('pdfOptsRow');
  if(pdfRow)pdfRow.style.display=pdfOn?'block':'none';
  const b1=document.getElementById('btnExportCurrent');
  const b2=document.getElementById('btnExportAll');
  const bb=document.getElementById('btnBatchExportAll');
  if(b1)b1.textContent=pdfOn?'📄 PDF':fmt==='jpg'?'💾 JPG':'💾 PNG';
  if(b2)b2.textContent=pdfOn?'📄 Alle PDF':fmt==='jpg'?'📦 Alle JPG':'📦 Alle';
  if(bb)bb.textContent=pdfOn?'📄 Alle PDF':fmt==='jpg'?'📦 Alle JPG':'📦 Alle PNG';
  const pf=getPrintFormat();
  const btnPrint=document.getElementById('btnPrintPdf');
  if(btnPrint)btnPrint.textContent='📄 PDF Druck ('+pf.label+')';
  const sel=document.getElementById('selPdfSheet');
  if(sel){
    const l4=sheetLayout('a4'),l3=sheetLayout('a3');
    const n4=l4.perPage>0?`${l4.perPage}/Seite`:'nur Einzelseiten';
    const n3=l3.perPage>0?`${l3.perPage}/Seite`:'nur Einzelseiten';
    sel.options[0].text=`A4 (${n4})`;
    sel.options[1].text=`A3 (${n3})`;
    sel.value=S.pdfSheet||'a4';
  }
  const hint=document.getElementById('expFormatHint');
  if(hint){
    if(pdfOn){
      const sh=(S.pdfSheet||'a4').toUpperCase();
      const layout=sheetLayout();
      const n=layout.perPage;
      const cuts=S.pdfCutMarks!==false?' · Schnittmarken':'';
      const canva=S.pdfIncludeSingle!==false&&n>0?` · danach <strong>Einzelseiten</strong> (${pf.label}, Canva)`:n<1?` · je Schild <strong>${pf.label}</strong> pro Seite`:'';
      const tile=n>0?`bis <strong>${n}</strong>/Bogen`:'Einzelseiten';
      hint.innerHTML=`PDF <strong>${sh}</strong> · <strong>${pf.label}</strong>: ${tile}${cuts}${canva}. Auflösung = Bildschärfe.`;
    }else hint.innerHTML='<strong>Druckformat</strong> gilt für <strong>📄 PDF Druck</strong> und Format <strong>PDF (Druck)</strong>. „📦 Alle" exportiert gebündelt als ZIP.';
  }
}
const JSPDF_SCRIPTS=['vendor/js/jspdf.umd.min.js'];
let _jsPdfLoad=null;
function getJsPDFCtor(){
  return(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF||null;
}
function loadJsPDFScript(index){
  if(index>=JSPDF_SCRIPTS.length)return Promise.reject(new Error('jsPDF konnte nicht geladen werden.'));
  const J=getJsPDFCtor();
  if(J)return Promise.resolve(J);
  return new Promise((resolve,reject)=>{
    const url=JSPDF_SCRIPTS[index];
    if(document.querySelector(`script[src="${url}"]`)){
      const wait=setInterval(()=>{
        const ctor=getJsPDFCtor();
        if(ctor){clearInterval(wait);resolve(ctor)}
      },40);
      setTimeout(()=>{clearInterval(wait);loadJsPDFScript(index+1).then(resolve).catch(reject)},8000);
      return;
    }
    const s=document.createElement('script');
    s.src=url;
    s.onload=()=>{
      const ctor=getJsPDFCtor();
      if(ctor)resolve(ctor);
      else loadJsPDFScript(index+1).then(resolve).catch(reject);
    };
    s.onerror=()=>loadJsPDFScript(index+1).then(resolve).catch(reject);
    document.head.appendChild(s);
  });
}
function loadJsPDF(){
  const existing=getJsPDFCtor();
  if(existing)return Promise.resolve(existing);
  if(_jsPdfLoad)return _jsPdfLoad;
  _jsPdfLoad=loadJsPDFScript(0).catch(err=>{_jsPdfLoad=null;throw err});
  return _jsPdfLoad;
}
function newPrintPdfDoc(layout){
  const sheet=S.pdfSheet||'a4';
  const lay=layout||sheetLayout(sheet);
  return loadJsPDF().then(jsPDF=>new jsPDF({
    unit:'mm',
    format:sheet,
    orientation:lay.orient||'p',
    compress:true,
  }));
}
function sheetLayout(sheetKey){
  const sheet=sheetKey||S.pdfSheet||'a4';
  const[pw,ph]=getPrintSizeMm();
  const g=PLATE_GAP_MM,m=SHEET_MARGIN_MM;
  const[baseW,baseH]=getSheetSizeMm(sheet);
  function calc(sw,sh){
    const cols=Math.max(0,Math.floor((sw-2*m+g)/(pw+g)));
    const rows=Math.max(0,Math.floor((sh-2*m+g)/(ph+g)));
    return{cols,rows,perPage:cols*rows,sw,sh};
  }
  let layout=calc(baseW,baseH);
  let orient='p';
  if(!layout.perPage){
    layout=calc(baseH,baseW);
    orient='l';
  }
  const gridW=layout.cols*pw+(layout.cols-1)*g;
  const gridH=layout.rows*ph+(layout.rows-1)*g;
  return{
    sheet,
    orient,
    pw,ph,
    cols:Math.max(layout.cols,0),
    rows:Math.max(layout.rows,0),
    perPage:layout.perPage,
    sheetW:layout.sw,
    sheetH:layout.sh,
    originX:m+(layout.sw-2*m-gridW)/2,
    originY:m+(layout.sh-2*m-gridH)/2,
  };
}
function plateSlotXY(slot,layout){
  const col=slot%layout.cols,row=Math.floor(slot/layout.cols);
  return{
    x:layout.originX+col*(layout.pw+PLATE_GAP_MM),
    y:layout.originY+row*(layout.ph+PLATE_GAP_MM),
  };
}
function drawCutMarks(doc,x,y,w,h){
  if(S.pdfCutMarks===false)return;
  const L=CUT_MARK_LEN_MM,o=CUT_MARK_OFFSET_MM;
  const mx=x+w/2,my=y+h/2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.15);
  // Ecken (L-förmig, ausserhalb der Schildkante)
  doc.line(x-o-L,y-o,x-o,y-o);doc.line(x-o,y-o-L,x-o,y-o);
  doc.line(x+w+o,y-o,x+w+o+L,y-o);doc.line(x+w+o,y-o-L,x+w+o,y-o);
  doc.line(x-o-L,y+h+o,x-o,y+h+o);doc.line(x-o,y+h+o,x-o,y+h+o+L);
  doc.line(x+w+o,y+h+o,x+w+o+L,y+h+o);doc.line(x+w+o,y+h+o,x+w+o,y+h+o+L);
  // Mitte der Kanten
  doc.line(mx-L/2,y-o,mx+L/2,y-o);
  doc.line(mx-L/2,y+h+o,mx+L/2,y+h+o);
  doc.line(x-o,my-L/2,x-o,my+L/2);
  doc.line(x+w+o,my-L/2,x+w+o,my+L/2);
}
function addPlateToPdfPage(doc,cv,slot,layout){
  const{x,y}=plateSlotXY(slot,layout);
  const w=layout.pw,h=layout.ph;
  doc.addImage(cv.toDataURL('image/png',1),'PNG',x,y,w,h,undefined,'FAST');
  drawCutMarks(doc,x,y,w,h);
}
function addSinglePlatePdfPage(doc,cv){
  const[w,h]=getPrintSizeMm();
  const orient=printPageOrientation();
  doc.addPage([w,h],orient);
  doc.addImage(cv.toDataURL('image/png',1),'PNG',0,0,w,h,undefined,'FAST');
  if(S.pdfCutMarks!==false)drawCutMarks(doc,0,0,w,h);
}
function addExactPlatePdfPage(doc,cv,isFirst){
  const[w,h]=getPrintSizeMm();
  const orient=printPageOrientation();
  if(!isFirst)doc.addPage([w,h],orient);
  doc.addImage(cv.toDataURL('image/png',1),'PNG',0,0,w,h,undefined,'FAST');
  if(S.pdfCutMarks!==false)drawCutMarks(doc,0,0,w,h);
}
async function buildPdfFromPlayers(players,filename){
  const sheet=S.pdfSheet||'a4';
  const layout=sheetLayout(sheet);
  const pf=getPrintFormat();
  const withSingle=S.pdfIncludeSingle!==false&&layout.perPage>0;
  const total=layout.perPage>0?players.length+(withSingle?players.length:0):players.length;
  let step=0;
  if(layout.perPage<1){
    const doc=await loadJsPDF().then(jsPDF=>new jsPDF({
      unit:'mm',
      format:getPrintSizeMm(),
      orientation:printPageOrientation(),
      compress:true,
    }));
    for(let i=0;i<players.length;i++){
      addExactPlatePdfPage(doc,renderExportCanvas(players[i]),i===0);
      step++;
      showBatchProgress(step,total,'PDF wird erstellt…');
      await new Promise(r=>setTimeout(r,0));
    }
    showBatchProgress(total,total,'PDF speichern…');
    doc.save(filename.endsWith('.pdf')?filename:filename+'.pdf');
    hideBatchProgress();
    return{...layout,singleCount:players.length,tiledPages:players.length,format:pf.label};
  }
  const doc=await newPrintPdfDoc(layout);
  for(let i=0;i<players.length;i++){
    const slot=i%layout.perPage;
    if(i>0&&slot===0)doc.addPage(sheet,layout.orient);
    addPlateToPdfPage(doc,renderExportCanvas(players[i]),slot,layout);
    step++;
    showBatchProgress(step,total,'PDF wird erstellt…');
    await new Promise(r=>setTimeout(r,0));
  }
  let singleCount=0;
  if(withSingle){
    for(const p of players){
      addSinglePlatePdfPage(doc,renderExportCanvas(p));
      singleCount++;
      step++;
      showBatchProgress(step,total,'Canva-Seiten…');
      await new Promise(r=>setTimeout(r,0));
    }
  }
  showBatchProgress(total,total,'PDF speichern…');
  doc.save(filename.endsWith('.pdf')?filename:filename+'.pdf');
  hideBatchProgress();
  return{...layout,singleCount,tiledPages:Math.ceil(players.length/layout.perPage),format:pf.label};
}
async function downloadExport(cv,filename,player){
  if(S.exportFormat==='pdf'||/\.pdf$/i.test(filename)){
    if(player)await buildPdfFromPlayers([player],filename);
    else{
      const layout=sheetLayout();
      if(layout.perPage<1){
        const doc=await loadJsPDF().then(jsPDF=>new jsPDF({
          unit:'mm',format:getPrintSizeMm(),orientation:printPageOrientation(),compress:true,
        }));
        addExactPlatePdfPage(doc,cv,true);
        doc.save(filename.endsWith('.pdf')?filename:filename+'.pdf');
      }else{
        const doc=await newPrintPdfDoc(layout);
        addPlateToPdfPage(doc,cv,0,layout);
        if(S.pdfIncludeSingle!==false)addSinglePlatePdfPage(doc,cv);
        doc.save(filename.endsWith('.pdf')?filename:filename+'.pdf');
      }
    }
    return;
  }
  dlCv(cv,filename);
}
async function exportCurrent(){
  const p=activeP();
  const ext=S.exportFormat==='pdf'?'pdf':S.exportFormat;
  try{
    if(S.exportFormat==='pdf')await buildPdfFromPlayers([p],exportFileName(p)+'.pdf');
    else await downloadExport(renderExportCanvas(p),exportFileName(p)+'.'+ext);
    if(S.exportFormat==='pdf'){
      const r=sheetLayout();
      const extra=S.pdfIncludeSingle!==false?' + 1 Canva-Seite':'';
      showOk(`PDF ${(S.pdfSheet||'a4').toUpperCase()} (Bogen${extra}).`);
    }
  }catch(e){showErr('Export fehlgeschlagen: '+(e.message||e))}
}
async function exportPrintPdfCurrent(){
  const p=activeP();
  try{
    const prev=S.exportFormat;
    S.exportFormat='pdf';
    await buildPdfFromPlayers([p],exportFileName(p)+'.pdf');
    S.exportFormat=prev;
    syncExportUi();
    document.getElementById('selExpFormat').value=S.exportFormat;
    showOk(`PDF ${(S.pdfSheet||'a4').toUpperCase()} · ${getPrintFormat().label} gespeichert.`);
  }catch(e){showErr('PDF-Export: '+(e.message||e))}
}
function playerCategory(p){
  const pos=String((p&&((p.playerPos!=null?p.playerPos:p.pos)||''))||'').trim().toUpperCase();
  if(/^(G|GK|GOALIE|GOAL|TOR|TORHÜTER|TORHUETER)$/.test(pos))return'goalies';
  if(/^(D|LD|RD|DEF|DEFENSE|DEFENCE|VERTEIDIGER|VERTEIDIGUNG)$/.test(pos))return'defenders';
  return'forwards';
}
function getBatchFilter(){
  const el=document.getElementById('selBatchFilter');
  const v=el?el.value:(S.batchFilter||'all');
  S.batchFilter=v||'all';
  return S.batchFilter;
}
function filteredRoster(){
  const f=getBatchFilter();
  if(f==='all')return S.roster;
  return S.roster.filter(p=>playerCategory(p)===f);
}
function batchFilterLabel(){
  return{all:'alle Spieler',goalies:'Goalies',defenders:'Verteidiger',forwards:'Stürmer'}[getBatchFilter()]||'Spieler';
}
async function exportAllPdf(){
  const players=filteredRoster();
  if(!players.length){showWarn('Keine Spieler für Filter: '+batchFilterLabel());return}
  const layout=await buildPdfFromPlayers(players,safeName(S.club||'team')+'_'+safeName(batchFilterLabel())+'_nameplates.pdf');
  const canva=layout.singleCount?` + ${layout.singleCount} Einzelseiten (Canva)`:'';
  showOk(`${players.length} Schilder (${batchFilterLabel()}): ${layout.tiledPages} ${layout.sheet.toUpperCase()}-Bogen${canva}.`);
}
async function exportAll(){
  if(!S.roster.length){alert('Kein Roster!');return}
  const players=filteredRoster();
  if(!players.length){showWarn('Keine Spieler für Filter: '+batchFilterLabel());return}
  const fmt=S.exportFormat;
  if(fmt==='pdf'){
    try{await exportAllPdf()}
    catch(e){hideBatchProgress();showErr('PDF-Export: '+(e.message||e))}
    return;
  }
  const mime=fmt==='jpg'?'image/jpeg':'image/png';
  if(typeof JSZip!=='undefined'){
    const zip=new JSZip();
    showBatchProgress(0,players.length,'Rendere Schilder…');
    for(let i=0;i<players.length;i++){
      const p=players[i];
      const data=renderExportCanvas(p).toDataURL(mime,.95).split(',')[1];
      zip.file(exportFileName(p,String(i+1).padStart(2,'0')+'_')+'.'+fmt,data,{base64:true});
      showBatchProgress(i+1,players.length,'Rendere Schilder…');
      await new Promise(r=>setTimeout(r,0));
    }
    showBatchProgress(players.length,players.length,'ZIP wird erstellt…');
    try{
      const blob=await zip.generateAsync({type:'blob'});
      hideBatchProgress();
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=safeName(S.club||'team')+'_'+safeName(batchFilterLabel())+'_nameplates.zip';
      a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
      showOk(`${players.length} Schilder als ZIP exportiert.`);
    }catch(e){hideBatchProgress();alert('ZIP-Export fehlgeschlagen.')}
  }else{
    showBatchProgress(0,players.length,'Export…');
    for(let i=0;i<players.length;i++){
      await new Promise(r=>setTimeout(r,250));
      dlCv(renderExportCanvas(players[i]),exportFileName(players[i],String(i+1).padStart(2,'0')+'_')+'.'+fmt);
      showBatchProgress(i+1,players.length,'Export…');
    }
    hideBatchProgress();
  }
}
function dlCv(cv,name){
  const mime=/\.jpe?g$/i.test(name)?'image/jpeg':'image/png';
  const a=document.createElement('a');a.href=cv.toDataURL(mime,.95);a.download=name;a.click();
}

// SIDEBAR RESIZE
const SIDEBAR_W_KEY='plateforge_sidebar_width';
function initSidebarResize(){
  const sb=document.querySelector('.sidebar');
  const rz=document.getElementById('sidebarResizer');
  if(!sb||!rz)return;
  const saved=parseInt(localStorage.getItem(SIDEBAR_W_KEY)||'',10);
  if(saved)document.documentElement.style.setProperty('--sidebar-w',Math.max(260,Math.min(720,saved))+'px');
  let startX=0,startW=0;
  const clamp=w=>Math.max(260,Math.min(Math.min(720,window.innerWidth*.65),w));
  const move=e=>{
    const w=clamp(startW+(e.clientX-startX));
    document.documentElement.style.setProperty('--sidebar-w',Math.round(w)+'px');
    render();
  };
  const up=()=>{
    document.body.classList.remove('resizing-sidebar');
    rz.classList.remove('drag');
    document.removeEventListener('pointermove',move);
    document.removeEventListener('pointerup',up);
    localStorage.setItem(SIDEBAR_W_KEY,Math.round(sb.getBoundingClientRect().width));
  };
  rz.addEventListener('pointerdown',e=>{
    e.preventDefault();
    startX=e.clientX;
    startW=sb.getBoundingClientRect().width;
    document.body.classList.add('resizing-sidebar');
    rz.classList.add('drag');
    document.addEventListener('pointermove',move);
    document.addEventListener('pointerup',up);
  });
}

// BATCH
function renderBatch(){
  const g=document.getElementById('batchGrid');g.innerHTML='';
  if(!S.roster.length){g.innerHTML='<p style="color:var(--mut);padding:14px">Kein Roster.</p>';return}
  const players=filteredRoster();
  if(!players.length){g.innerHTML='<p style="color:var(--mut);padding:14px">Keine Spieler für Filter: '+batchFilterLabel()+'.</p>';return}
  const opts=readSizeOpts();
  players.forEach(p=>{
    const bw=560,bh=Math.round(H*(bw/W));
    const wrap=document.createElement('div');wrap.className='batch-item';
    const cv=document.createElement('canvas');cv.width=bw;cv.height=bh;
    drawPlate(cv,bw,bh,makeFullOpts(p),false);
    cv.title='Name ziehen: Spieler-Feinjustierung';
    cv.addEventListener('mousedown',e=>startPlayerNameAdjustDrag(e,p,cv));
    cv.addEventListener('touchstart',e=>startPlayerNameAdjustDrag(e,p,cv),{passive:false});
    const lbl=document.createElement('div');lbl.className='batch-lbl';lbl.textContent=`#${p.nr} ${(p.last||p.first)}`;
    const dlb=document.createElement('button');dlb.className='batch-dl';dlb.textContent='💾';
    dlb.onclick=()=>{
      const fn=exportFileName(p)+'.'+(S.exportFormat==='pdf'?'pdf':S.exportFormat);
      if(S.exportFormat==='pdf')buildPdfFromPlayers([p],fn).catch(e=>showErr('PDF: '+(e.message||e)));
      else downloadExport(renderExportCanvas(p),fn);
    };
    wrap.appendChild(cv);wrap.appendChild(lbl);wrap.appendChild(dlb);g.appendChild(wrap);
  });
}
function refreshBatchIfVisible(){
  const vb=document.getElementById('viewBatch');
  if(vb&&vb.style.display!=='none')renderBatch();
}

// ACCESSIBILITY / KEYBOARD
function syncAriaControls(){
  document.querySelectorAll('.tog').forEach(el=>{
    const label=el.closest('.tog-row')?.querySelector('.tog-lbl')?.textContent?.trim()||el.id||'Option';
    el.setAttribute('role','switch');
    el.tabIndex=0;
    el.setAttribute('aria-label',label);
    el.setAttribute('aria-checked',el.classList.contains('on')?'true':'false');
  });
  document.querySelectorAll('.side-tab').forEach(el=>{
    el.setAttribute('role','tab');
    el.setAttribute('aria-selected',el.classList.contains('on')?'true':'false');
  });
  const editor=document.getElementById('tabEditor');
  const batch=document.getElementById('tabBatch');
  if(editor){editor.setAttribute('aria-pressed',editor.classList.contains('btn-y')?'true':'false')}
  if(batch){batch.setAttribute('aria-pressed',batch.classList.contains('btn-y')?'true':'false')}
}
function initKeyboardAccess(){
  document.addEventListener('keydown',e=>{
    const el=e.target;
    if(!(el instanceof HTMLElement))return;
    if(!['Enter',' '].includes(e.key))return;
    if(el.classList.contains('tog')||el.classList.contains('font-opt')||el.classList.contains('tpl-card')||el.classList.contains('ri')||el.classList.contains('saved-font-item')){
      e.preventDefault();
      el.click();
    }
  });
  document.addEventListener('click',e=>{
    if(e.target instanceof HTMLElement&&e.target.closest('.tog,.side-tab,#tabEditor,#tabBatch')){
      requestAnimationFrame(syncAriaControls);
    }
  });
  syncAriaControls();
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
window.addEventListener('load',async()=>{
  initRuntimeModeUi();
  initSidebarResize();
  initKeyboardAccess();
  refreshSwatches();
  await restoreCustomFonts();
  restoreRoster();
  await restoreSession();
  migrateLegacyNameAdjustmentsToCurrentTemplate();
  await initWorkspace();
  await initJsonExportDir();
  await initLocalFolders();
  await autoImportStaticTemplates();
  seedCreativeUserTemplates();
  buildTplGrid();buildFontGrid();buildRoster();renderUserTplList();
  syncVAlignUi();
  setBadge(S.badge);
  document.getElementById('slBadgeScale').value=S.badgeScale;sv('slBadgeScale','vlBadgeScale','%');
  const bdx=document.getElementById('slBadgeNrDx');if(bdx){bdx.value=S.badgeNrDx||0;sv('slBadgeNrDx','vlBadgeNrDx')}
  const bdy=document.getElementById('slBadgeNrDy');if(bdy){bdy.value=S.badgeNrDy||0;sv('slBadgeNrDy','vlBadgeNrDy')}
  if(!S.logo)useEHCLogo();
  if(S.roster.length)pickP(S.active);
  else render();
  updatePlayerNav();
  switchMain('editor');
  // sync export controls with state
  document.getElementById('selExpScale').value=S.exportScale;
  document.getElementById('selExpFormat').value=S.exportFormat;
  const pfSel=document.getElementById('selPrintFormat');
  if(pfSel)pfSel.value=getPrintFormatKey();
  const patSel=document.getElementById('selExpNamePattern');
  if(patSel)patSel.value=S.exportNamePattern||'last_nr';
  syncExportUi();
  await refreshStorageInfo();
  initGithubUi();
  registerServiceWorker();
  let workspaceFocusTimer=0;
  window.addEventListener('focus',()=>{
    clearTimeout(workspaceFocusTimer);
    workspaceFocusTimer=setTimeout(()=>syncWorkspaceNow(false),600);
  });
  // click empty canvas area → deselect the active drag element
  document.getElementById('plateCanvas').addEventListener('pointerdown',()=>{
    if(S.sel){S.sel=null;syncFontSelectOptions();render()}
  });
  // Upload zone drag hover
  document.querySelectorAll('.upzone').forEach(z=>{
    z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('drag')});
    z.addEventListener('dragleave',()=>z.classList.remove('drag'));
    z.addEventListener('drop',()=>z.classList.remove('drag'));
  });
  // Resize observer
  new ResizeObserver(()=>render()).observe(document.getElementById('cvWrap').parentElement);
});
