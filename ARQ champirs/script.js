/* =============================================
   ARQ CHAMPIONS v7
   + OHKO / 2HKO / 3HKO predicción
   + Comparador directo lado a lado
   + Historial de batallas con resultado
   + Stats del rival configurables + presets
   + Exportar/Importar equipo en JSON
   ============================================= */
'use strict';

// ═══════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════
const LS_KEY     = 'arq_champions_v7';
const LS_HISTORY = 'arq_history_v7';
const API        = 'https://pokeapi.co/api/v2';
const cache      = {};
const LEVEL      = 50;

const NATURES = {
  'Resistente':[null,null],'Solitario':['atk','def'],'Corajudo':['atk','spd'],'Firme':['atk','spatk'],'Travieso':['atk','spdef'],
  'Osado':['def','atk'],'Dócil':[null,null],'Relajado':['def','spd'],'Impasible':['def','spatk'],'Flojo':['def','spdef'],
  'Tímido':['spd','atk'],'Apresurado':['spd','def'],'Serio':[null,null],'Alegre':['spd','spatk'],'Ingenuo':['spd','spdef'],
  'Modesto':['spatk','atk'],'Leve':['spatk','def'],'Tranquilo':['spatk','spd'],'Tímido2':[null,null],'Erupción':['spatk','spdef'],
  'Sereno':['spdef','atk'],'Amable':['spdef','def'],'Atrevido':['spdef','spd'],'Cuidadoso':['spdef','spatk'],'Peculiar':[null,null],
};

// Mapa inglés→español para habilidades venidas de la API
const ABILITY_ES = {
  'blaze':'Espesura','torrent':'Torrente','overgrow':'Espesura','static':'Electricidad estática',
  'levitate':'Levitación','intimidate':'Intimidación','prankster':'Timador','hustle':'Entusiasmo',
  'synchronize':'Sincronía','natural-cure':'Cura natural','thick-fat':'Sebo','flash-fire':'Flash fire',
  'drought':'Sequía','drizzle':'Llovizna','sand-stream':'Chorro arena','snow-warning':'Aviso nieve',
  'speed-boost':'Impulso','chlorophyll':'Clorofila','swift-swim':'Nado rápido','sand-rush':'Celeridad arena',
  'slush-rush':'Celeridad nieve','unburden':'Ligereza','magic-guard':'Guardia mágica',
  'wonder-guard':'Guardia maravilla','multiscale':'Multiescamas','regenerator':'Regeneración',
  'contrary':'Contrario','serene-grace':'Gracia divina','technician':'Técnico',
  'tinted-lens':'Lente tintada','adaptability':'Adaptabilidad','protean':'Multicolor',
  'huge-power':'Gran poder','pure-power':'Poder puro','sheer-force':'Fuerza bruta',
  'moxie':'Entusiasmo','inner-focus':'Concentración','sturdy':'Robustez','shell-armor':'Armadura',
  'clear-body':'Cuerpo puro','liquid-ooze':'Secreción','poison-point':'Tóxico','arena-trap':'Trampa',
  'shadow-tag':'Sombra','rough-skin':'Piel tosca','iron-barbs':'Zarzas acero',
  'guts':'Agallas','marvel-scale':'Escamas prodigio','cursed-body':'Cuerpo maldito',
  'pressure':'Presión','aftermath':'Represalia','frisk':'Fisgón','pickup':'Recoger',
  'early-bird':'Madrugador','own-tempo':'Ritmo','oblivious':'Despiste','cloud-nine':'Nueve nubes',
  'air-lock':'Cierre de aire','sand-veil':'Velo arena','snow-cloak':'Manto nieve',
  'arena-trap':'Trampa arena','magnet-pull':'Magnetismo','illuminate':'Iluminación',
  'absorbefuego':'Absorbefuego','water-absorb':'Absorbe agua','volt-absorb':'Absorbe volt',
  'fire-absorb':'Absorbefuego','dry-skin':'Piel seca','storm-drain':'Embudo','lightning-rod':'Pararrayos',
  'motor-drive':'Turbomotor','sap-sipper':'Herbívoro','water-compaction':'Compactación agua',
};

const TYPE_CHART = {
  normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,rock:.5,dragon:.5,grass:2,ice:2,bug:2,steel:2},
  water:{water:.5,fire:2,grass:.5,dragon:.5,ground:2,rock:2},electric:{water:2,electric:.5,grass:.5,dragon:.5,ground:0,flying:2},
  grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
  ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},
  fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},
  poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},
  ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},
  flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},
  psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},
  bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,ghost:.5,steel:.5,psychic:2,dark:2,fairy:.5},
  rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},
  ghost:{normal:0,fighting:0,ghost:2,psychic:2,dark:.5},
  dragon:{dragon:2,steel:.5,fairy:0},dark:{fighting:.5,ghost:2,psychic:2,dark:.5,fairy:.5},
  steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2,poison:0,grass:.5},
  fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5},
};

const FORM_MAP = {
  'mega venusaur':'venusaur-mega','mega charizard x':'charizard-mega-x','mega charizard y':'charizard-mega-y',
  'mega blastoise':'blastoise-mega','mega alakazam':'alakazam-mega','mega gengar':'gengar-mega',
  'mega gyarados':'gyarados-mega','mega mewtwo x':'mewtwo-mega-x','mega mewtwo y':'mewtwo-mega-y',
  'mega ampharos':'ampharos-mega','mega scizor':'scizor-mega','mega heracross':'heracross-mega',
  'mega tyranitar':'tyranitar-mega','mega blaziken':'blaziken-mega','mega gardevoir':'gardevoir-mega',
  'mega mawile':'mawile-mega','mega aggron':'aggron-mega','mega medicham':'medicham-mega',
  'mega absol':'absol-mega','mega latias':'latias-mega','mega latios':'latios-mega',
  'mega garchomp':'garchomp-mega','mega lucario':'lucario-mega','mega lopunny':'lopunny-mega',
  'mega gallade':'gallade-mega','mega sceptile':'sceptile-mega','mega swampert':'swampert-mega',
  'mega altaria':'altaria-mega','mega salamence':'salamence-mega','mega metagross':'metagross-mega',
  'mega rayquaza':'rayquaza-mega','mega beedrill':'beedrill-mega','mega pidgeot':'pidgeot-mega',
  'mega kangaskhan':'kangaskhan-mega','mega pinsir':'pinsir-mega','mega aerodactyl':'aerodactyl-mega',
  'mega slowbro':'slowbro-mega','mega houndoom':'houndoom-mega','mega manectric':'manectric-mega',
  'mega banette':'banette-mega','mega abomasnow':'abomasnow-mega','mega audino':'audino-mega',
  'mega diancie':'diancie-mega','mega sableye':'sableye-mega','mega sharpedo':'sharpedo-mega',
  'mega camerupt':'camerupt-mega','mega glalie':'glalie-mega','mega steelix':'steelix-mega',
  'primal kyogre':'kyogre-primal','primal groudon':'groudon-primal','mega kyogre':'kyogre-primal',
  'rotom calor':'rotom-heat','rotom agua':'rotom-wash','rotom hielo':'rotom-frost','rotom vuelo':'rotom-fan','rotom corte':'rotom-mow',
  'alola raichu':'raichu-alola','alola vulpix':'vulpix-alola','alola ninetales':'ninetales-alola',
  'alola exeggutor':'exeggutor-alola','alola marowak':'marowak-alola',
  'galar ponyta':'ponyta-galar','galar rapidash':'rapidash-galar','galar slowbro':'slowbro-galar',
  'galar articuno':'articuno-galar','galar zapdos':'zapdos-galar','galar moltres':'moltres-galar',
  'hisui typhlosion':'typhlosion-hisui','hisui samurott':'samurott-hisui','hisui decidueye':'decidueye-hisui',
  'hisui growlithe':'growlithe-hisui','hisui arcanine':'arcanine-hisui',
  'kyurem blanco':'kyurem-white','kyurem negro':'kyurem-black',
  'necrozma dusk mane':'necrozma-dusk','necrozma dawn wings':'necrozma-dawn','necrozma ultra':'necrozma-ultra',
  'calyrex ice rider':'calyrex-ice','calyrex shadow rider':'calyrex-shadow',
  'giratina origin':'giratina-origin','tornadus therian':'tornadus-therian',
  'thundurus therian':'thundurus-therian','landorus therian':'landorus-therian',
  'shaymin sky':'shaymin-sky','hoopa unbound':'hoopa-unbound',
  'zygarde complete':'zygarde-complete','zygarde 10':'zygarde-10',
};

// Presets competitivos de Pokémon Champions / VGC (stats a nivel 50)
// Basados en builds frecuentes en Pokémon Champions y listas VGC públicas
const COMPETITIVE_PRESETS = {
  'garchomp':    [{label:'Jolly Atacante (Band)',desc:'Banda Elegida · EV 252 ATK / 252 SPD',stats:{hp:181,atk:204,def:135,spatk:85,spdef:115,spd:169}},{label:'Bulky Defensor',desc:'252 HP / 252 DEF · Bold',stats:{hp:209,atk:152,def:156,spatk:85,spdef:100,spd:149}}],
  'tyranitar':   [{label:'Adamant Sand Stream',desc:'252 ATK / 252 HP · Roca',stats:{hp:207,atk:206,def:150,spatk:95,spdef:140,spd:91}}],
  'dragonite':   [{label:'Multiscale Lum',desc:'252 ATK / 252 SPD · Adamant',stats:{hp:182,atk:227,def:115,spatk:150,spdef:115,spd:131}}],
  'salamence':   [{label:'Mega Especial',desc:'252 SPATK / 252 SPD · Timid',stats:{hp:175,atk:165,def:110,spatk:200,spdef:90,spd:155}}],
  'metagross':   [{label:'Clear Body Banda',desc:'252 ATK / 252 SPD · Jolly',stats:{hp:175,atk:211,def:150,spatk:105,spdef:110,spd:110}}],
  'lucario':     [{label:'Inner Focus Specs',desc:'252 SPATK / 252 SPD · Timid',stats:{hp:141,atk:145,def:88,spatk:194,spdef:88,spd:158}},{label:'Adamant Jutsu Band',desc:'252 ATK / 252 SPD · Adamant',stats:{hp:141,atk:206,def:88,spatk:115,spdef:88,spd:145}}],
  'togekiss':    [{label:'Serene Grace ParaFlinch',desc:'252 HP / 252 SPDEF · Calm',stats:{hp:193,atk:65,def:105,spatk:155,spdef:160,spd:107}}],
  'grimmsnarl':  [{label:'Support Screens',desc:'252 HP / 252 DEF · Impish',stats:{hp:202,atk:152,def:110,spatk:65,spdef:85,spd:70}}],
  'indeedee':    [{label:'Psychic Surge Specs',desc:'252 SPATK / 252 SPD · Timid',stats:{hp:146,atk:55,def:71,spatk:155,spdef:136,spd:115}}],
  'incineroar':  [{label:'Intimidate Bulky',desc:'252 HP / 252 SPDEF · Careful',stats:{hp:191,atk:155,def:105,spatk:65,spdef:143,spd:71}}],
  'urshifu':     [{label:'Unseen Fist Band',desc:'252 ATK / 252 SPD · Jolly',stats:{hp:175,atk:221,def:100,spatk:75,spdef:65,spd:147}}],
  'zacian':      [{label:'Intrepid Sword Rusted',desc:'252 ATK / 252 SPD · Jolly',stats:{hp:175,atk:280,def:115,spatk:80,spdef:115,spd:161}}],
  'flutter-mane':[{label:'Specs Especial',desc:'252 SPATK / 252 SPD · Timid',stats:{hp:141,atk:55,def:86,spatk:231,spdef:181,spd:177}}],
  'amoonguss':   [{label:'Regenerator Bulky',desc:'252 HP / 252 SPDEF · Calm',stats:{hp:227,atk:85,def:100,spatk:105,spdef:130,spd:40}}],
  'landorus-therian':[{label:'Intimidate Scarf',desc:'252 ATK / 252 SPD · Jolly',stats:{hp:175,atk:215,def:100,spatk:105,spdef:95,spd:151}}],
  'garchomp-mega':[{label:'Mega Roughskin Sand',desc:'252 ATK / 252 SPD · Jolly',stats:{hp:181,atk:234,def:145,spatk:85,spdef:115,spd:169}}],
  'charizard-mega-y':[{label:'Drought Specs',desc:'252 SPATK / 252 SPD · Timid',stats:{hp:166,atk:104,def:98,spatk:226,spdef:115,spd:155}}],
  'charizard-mega-x':[{label:'Tough Claws Band',desc:'252 ATK / 252 SPD · Jolly',stats:{hp:166,atk:215,def:131,spatk:130,spdef:105,spd:155}}],
  'mewtwo-mega-x':[{label:'Steadfast Banda',desc:'252 ATK / 252 SPD · Jolly',stats:{hp:193,atk:255,def:111,spatk:154,spdef:100,spd:180}}],
  'mewtwo-mega-y':[{label:'Insomnia Specs',desc:'252 SPATK / 252 SPD · Timid',stats:{hp:193,atk:110,def:90,spatk:294,spdef:100,spd:200}}],
  'kyogre':      [{label:'Drizzle Specs',desc:'252 SPATK / 252 HP · Modest',stats:{hp:200,atk:100,def:110,spatk:218,spdef:140,spd:90}}],
  'groudon':     [{label:'Drought Band',desc:'252 ATK / 252 HP · Adamant',stats:{hp:200,atk:220,def:160,spatk:100,spdef:110,spd:90}}],
  'rayquaza':    [{label:'Air Lock Banda',desc:'252 ATK / 252 SPD · Adamant',stats:{hp:191,atk:228,def:95,spatk:150,spdef:95,spd:115}}],
  'rayquaza-mega':[{label:'Delta Stream',desc:'252 ATK / 252 SPD · Adamant',stats:{hp:191,atk:254,def:95,spatk:170,spdef:95,spd:115}}],
  'calyrex-shadow':[{label:'As One Scarf',desc:'252 SPATK / 252 SPD · Timid',stats:{hp:165,atk:60,def:80,spatk:240,spdef:130,spd:184}}],
  'calyrex-ice': [{label:'As One Band',desc:'252 ATK / 252 HP · Brave',stats:{hp:220,atk:240,def:130,spatk:75,spdef:130,spd:30}}],
};

// ═══════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════
const STATE = {
  myTeam:       [],   // [{pkData, config:{moves[], realStats{}, nature, ability, item, note}}]
  enemyTeam:    [],   // [{pkData, ko, realStats{}}]  ← realStats ahora en el rival también
  battleHistory:[],   // [{id, date, enemyTeam[], result, note}]
  dexHistory:   [],
  pokemonIndex: [],
  moveIndexES:  [],
  moveDataCache:{},
  currentDexData: null,
  dexShowBack:  false,
  editingIdx:   null,
  editingEnemyIdx: null,
  // Comparador
  cmpEnemy:     null,
  cmpSelectedA: null,
  cmpSelectedB: null,
};

// ═══════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════
const $ = id => document.getElementById(id);
function setLoading(v){ $('loading').classList.toggle('hidden',!v); }
function showToast(msg,dur=2500){
  const t=$('toast'); t.textContent=msg; t.classList.remove('hidden');
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.classList.add('hidden'),350); },dur);
}
function cap(s){ return s?s.charAt(0).toUpperCase()+s.slice(1):''; }

function slugToDisplay(slug){
  const p=slug.split('-');
  const mi=p.indexOf('mega'), pi=p.indexOf('primal');
  if(mi!==-1){ const b=p.slice(0,mi).join(' '), s=p.slice(mi+1); return 'Mega '+cap(b)+(s.length?' '+s.join(' ').toUpperCase():''); }
  if(pi!==-1) return 'Primal '+cap(p.slice(0,pi).join(' '));
  for(const r of['alola','galar','hisui','paldea']){const ri=p.indexOf(r);if(ri!==-1)return cap(r)+' '+cap(p.filter(x=>x!==r).join(' '));}
  return cap(slug.replace(/-/g,' '));
}

function extractBaseStats(pk){
  const s={};for(const st of pk.stats)s[st.stat.name]=st.base_stat;
  return{hp:s.hp||0,atk:s.attack||0,def:s.defense||0,spatk:s['special-attack']||0,spdef:s['special-defense']||0,spd:s.speed||0};
}
function extractTypes(pk){ return pk.types.map(t=>t.type.name); }
function calcEff(atkT,defT){let m=1;for(const a of atkT)for(const d of defT)m*=TYPE_CHART[a]?.[d]??1;return m;}

function getMyStats(member){
  const rs=member.config?.realStats;
  if(rs&&Object.values(rs).some(v=>v>0)){
    return{hp:rs.hp||extractBaseStats(member.pkData).hp,atk:rs.atk||extractBaseStats(member.pkData).atk,
      def:rs.def||extractBaseStats(member.pkData).def,spatk:rs.spatk||extractBaseStats(member.pkData).spatk,
      spdef:rs.spdef||extractBaseStats(member.pkData).spdef,spd:rs.spd||extractBaseStats(member.pkData).spd};
  }
  const base=extractBaseStats(member.pkData);
  const nat=member.config?.nature;
  if(nat&&NATURES[nat]){const[up,dn]=NATURES[nat];if(up)base[up]=Math.floor(base[up]*1.1);if(dn)base[dn]=Math.floor(base[dn]*.9);}
  return base;
}

/**
 * Stats del enemigo: usa realStats si el usuario los configuró,
 * o el preset cargado, o la aproximación competitiva estándar.
 */
function getEnemyStats(enemyEntry){
  const rs=enemyEntry.realStats;
  if(rs&&Object.values(rs).some(v=>v>0)) return rs;
  // Aproximación nivel 50, EVs 85, IVs 31
  const b=extractBaseStats(enemyEntry.pkData);
  const calc=base=>Math.floor((2*base+52)*50/100+5);
  return{hp:Math.floor((2*b.hp+52)*50/100+60),atk:calc(b.atk),def:calc(b.def),spatk:calc(b.spatk),spdef:calc(b.spdef),spd:calc(b.spd)};
}

// ═══════════════════════════════════════════════
// MOTOR DE DAÑO COMPETITIVO
// Fórmula Gen 8 + OHKO/2HKO/3HKO
// ═══════════════════════════════════════════════

function calcMoveDamage(myStats, enStats, move, myTypes, enTypes, item=''){
  if(!move.power||move.power<=0) return{min:0,max:0,avg:0};
  const isPhys=move.category==='physical';
  const A=isPhys?myStats.atk:myStats.spatk;
  const D=isPhys?enStats.def:enStats.spdef;
  let base=Math.floor(Math.floor(Math.floor(2*LEVEL/5+2)*move.power*A/D)/50)+2;
  const stab=myTypes.includes(move.type)?1.5:1;
  const eff=calcEff([move.type],enTypes);
  let itemMod=1;
  const il=item.toLowerCase();
  if(il.includes('banda')||il.includes('choice band'))    itemMod=isPhys?1.5:1;
  if(il.includes('gafas')||il.includes('choice specs'))   itemMod=isPhys?1:1.5;
  if(il.includes('vida')||il.includes('life orb'))        itemMod=1.3;
  if(il.includes('pañuelo')||il.includes('silk scarf'))   itemMod=1.2;
  if(il.includes('placa')||il.includes('plate'))          itemMod=1.2;
  // Rango de daño: 85%-100% (multiplicadores 85/100 a 100/100)
  const mid=base*stab*eff*itemMod;
  const minDmg=mid*0.85, maxDmg=mid;
  const minPct=Math.round(minDmg/enStats.hp*100);
  const maxPct=Math.round(maxDmg/enStats.hp*100);
  const avgPct=Math.round(((minPct+maxPct)/2));
  return{min:Math.min(minPct,300),max:Math.min(maxPct,300),avg:Math.min(avgPct,300)};
}

/**
 * Clasifica cuántos golpes se necesitan para KO.
 * Retorna: 'OHKO' | '2HKO' | '3HKO' | 'NO'
 */
function classifyKO(dmgResult){
  if(!dmgResult||dmgResult.avg<=0) return 'NO';
  if(dmgResult.min>=100) return 'OHKO';    // incluso en el mínimo mata de 1
  if(dmgResult.max>=100) return 'OHKO';    // puede matar de 1
  if(dmgResult.min*2>=100) return '2HKO';  // garantizado en 2
  if(dmgResult.max*2>=100) return '2HKO';  // posible en 2
  if(dmgResult.max*3>=100) return '3HKO';
  return 'NO';
}

function koBadgeHTML(ko){
  const map={'OHKO':'<span class="ko-badge ohko">OHKO</span>','2HKO':'<span class="ko-badge two-hko">2HKO</span>',
    '3HKO':'<span class="ko-badge three-hko">3HKO</span>','NO':'<span class="ko-badge nope">4HKO+</span>'};
  return map[ko]||'';
}

function evaluateMoves(member, enemyEntry){
  const myStats=getMyStats(member), enStats=getEnemyStats(enemyEntry);
  const myTypes=extractTypes(member.pkData), enTypes=extractTypes(enemyEntry.pkData);
  const item=member.config?.item||'';
  const breakdown=[];
  for(const mv of(member.config?.moves||[])){
    if(!mv?.apiName) continue;
    const mdata=STATE.moveDataCache[mv.apiName];
    if(!mdata) continue;
    const dmg=calcMoveDamage(myStats,enStats,mdata,myTypes,enTypes,item);
    breakdown.push({displayName:mv.displayName||mv.apiName,type:mdata.type,
      category:mdata.category,power:mdata.power,dmg,ko:classifyKO(dmg)});
  }
  if(!breakdown.length){
    // Fallback estimación por tipos
    const offEff=calcEff(myTypes,enTypes);
    const isPhys=myStats.atk>=myStats.spatk;
    const A=isPhys?myStats.atk:myStats.spatk, D=isPhys?enStats.def:enStats.spdef;
    const base=Math.floor(Math.floor(Math.floor(2*LEVEL/5+2)*80*A/D)/50)+2;
    const avgPct=Math.round(base*offEff/enStats.hp*100);
    const dmg={min:Math.round(avgPct*.85),max:avgPct,avg:avgPct};
    breakdown.push({displayName:'(Estimación base)',type:myTypes[0]||'normal',category:isPhys?'physical':'special',power:80,dmg,ko:classifyKO(dmg)});
  }
  return breakdown.sort((a,b)=>b.dmg.avg-a.dmg.avg);
}

function scoreVsTeam(member, enemyTeam){
  const active=enemyTeam.filter(e=>!e.ko);
  if(!active.length) return 0;
  const myStats=getMyStats(member);
  let total=0;
  for(const e of active){
    const bd=evaluateMoves(member,e);
    const bestDmg=bd[0]?.dmg.avg||0;
    const defEff=calcEff(extractTypes(e.pkData),extractTypes(member.pkData));
    const isFaster=myStats.spd>getEnemyStats(e).spd;
    const koBonus=bd[0]?.ko==='OHKO'?30:bd[0]?.ko==='2HKO'?15:0;
    total+=(bestDmg*.65)-(defEff*8)+(isFaster?12:0)+koBonus;
  }
  return total/active.length;
}

function getBestTrio(myTeam,enemyTeam){
  if(myTeam.length<=3) return myTeam;
  let best=null,bs=-Infinity;
  for(let i=0;i<myTeam.length-2;i++)for(let j=i+1;j<myTeam.length-1;j++)for(let k=j+1;k<myTeam.length;k++){
    const trio=[myTeam[i],myTeam[j],myTeam[k]];
    const s=trio.reduce((a,m)=>a+scoreVsTeam(m,enemyTeam),0);
    if(s>bs){bs=s;best=trio;}
  }
  return best||myTeam.slice(0,3);
}

// ═══════════════════════════════════════════════
// RED / API
// ═══════════════════════════════════════════════
let isOnline=navigator.onLine;
window.addEventListener('online',()=>{ isOnline=true; updateNetStatus(); showToast('✅ Conexión restaurada'); });
window.addEventListener('offline',()=>{ isOnline=false; updateNetStatus(); showToast('⚠️ Sin conexión',4000); });
function updateNetStatus(){const el=$('net-status');el.classList.toggle('online',isOnline);el.classList.toggle('offline',!isOnline);}
async function apiFetch(url,ms=8000){
  if(cache[url]) return cache[url];
  if(!isOnline) throw new Error('OFFLINE');
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),ms);
  try{const res=await fetch(url,{signal:ctl.signal});clearTimeout(t);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();cache[url]=data;return data;
  }catch(e){clearTimeout(t);if(e.name==='AbortError')throw new Error('TIMEOUT');throw e;}
}
function netErr(e){return e.message==='OFFLINE'?'⚠️ Sin conexión':e.message==='TIMEOUT'?'⚠️ La API tardó demasiado':'⚠️ No encontrado';}
async function fetchPokemon(slug){return apiFetch(`${API}/pokemon/${slug.toLowerCase()}`);}
async function fetchMoveByApiName(n){return apiFetch(`${API}/move/${n.toLowerCase()}`);}

// ═══════════════════════════════════════════════
// ÍNDICES
// ═══════════════════════════════════════════════
async function buildPokemonIndex(){
  const base=await apiFetch(`${API}/pokemon?limit=1025`);
  STATE.pokemonNames=base.results.map(p=>p.name);
  const forms=await apiFetch(`${API}/pokemon-form?limit=2000`);
  const m=new Map();
  for(const p of base.results) m.set(p.name,{display:slugToDisplay(p.name),key:p.name});
  for(const f of forms.results) if(f.name.includes('-')&&!m.has(f.name)) m.set(f.name,{display:slugToDisplay(f.name),key:f.name});
  for(const[es,slug]of Object.entries(FORM_MAP)) m.set('es:'+es,{display:cap(es.replace(/-/g,' ')),key:slug});
  STATE.pokemonIndex=Array.from(m.values());
}

async function buildMoveIndexES(){
  $('lab-loading-hint').style.display='block';
  try{
    const d=await apiFetch(`${API}/move?limit=950`);
    const BASE_ES={'terremoto':'earthquake','danza espada':'swords-dance','rayo':'thunderbolt','surfeo':'surf','vendetta':'knock-off','puño trueno':'thunder-punch','llamarada':'flamethrower','hidrobomba':'hydro-pump','hoja afilada':'leaf-blade','cabezazo zen':'zen-headbutt','puño hielo':'ice-punch','rayo hielo':'ice-beam','ventisca':'blizzard','trueno':'thunder','rayo solar':'solar-beam','giro bola':'gyro-ball','trampa rocas':'stealth-rock','tóxico':'toxic','protección':'protect','recuperación':'recover','sustituto':'substitute','hipnosis':'hypnosis','esporas':'spore','onda certera':'aura-sphere','puño meteoro':'meteor-mash','psíquico':'psychic','psicocorte':'psycho-cut','triturar':'crunch','bola sombra':'shadow-ball','día soleado':'sunny-day','lluvia danza':'rain-dance','tormenta arena':'sandstorm','granizo':'hail','pantalla de luz':'light-screen','reflejo':'reflect','velo aurora':'aurora-veil','ataque rápido':'quick-attack','danza dragón':'dragon-dance','garra dragón':'dragon-claw','pulso dragón':'dragon-pulse','cometa draco':'draco-meteor','maquinación':'nasty-plot','descanso':'rest','espíritu vital':'wish','bote':'bounce','patada salto alto':'high-jump-kick','combate cercano':'close-combat','embestida ígnea':'flare-blitz','voltio rotación':'volt-switch','giro u':'u-turn','velocidad extrema':'extreme-speed','respiro':'roost','drenadoras':'leech-seed','onda trueno':'thunder-wave','voluntad fuego':'will-o-wisp','infortunio':'taunt','moflete':'encore','shard de hielo':'ice-shard','lanzarrocas':'rock-slide','roca afilada':'stone-edge','avalancha':'avalanche','giro rápido':'rapid-spin','defensa férrea':'iron-defense','picadura':'bug-bite','zumbido':'bug-buzz','x-tijera':'x-scissor','golpe aéreo':'air-slash','pájaro osado':'brave-bird','ala de acero':'steel-wing','colmillo hielo':'ice-fang','colmillo trueno':'thunder-fang','colmillo ígneo':'fire-fang','empujón':'bulldoze','golpe bajo':'sucker-punch','baton pass':'baton-pass','explosión':'explosion','autodestrucción':'self-destruct','tormenta ígnea':'fire-blast','canto mortal':'perish-song','mente en blanco':'calm-mind','nitrocarga':'flame-charge','golpe certero':'smart-strike','cabeza de hierro':'iron-head','garra umbría':'shadow-claw','agilidad':'agility','cola dragón':'dragon-tail','tajo aéreo':'aerial-ace','onda vacía':'vacuum-wave','hiperrayo':'hyper-beam','pulso oscuro':'dark-pulse','zarpazo':'slash'};
    const mi=new Map();
    for(const[es,api]of Object.entries(BASE_ES)) mi.set(es,{display:cap(es.replace(/-/g,' ')),key:api});
    for(const mv of d.results) if(!mi.has(mv.name)) mi.set(mv.name,{display:cap(mv.name.replace(/-/g,' ')),key:mv.name});
    STATE.moveIndexES=Array.from(mi.values());
  }catch(e){console.warn(e);}
  finally{$('lab-loading-hint').style.display='none';}
}

// ═══════════════════════════════════════════════
// PERSISTENCIA
// ═══════════════════════════════════════════════
function saveTeam(){
  try{
    localStorage.setItem(LS_KEY,JSON.stringify(STATE.myTeam.map(m=>({
      name:m.pkData.name,sprite:m.pkData.sprites?.front_default||'',
      stats:m.pkData.stats.map(s=>({name:s.stat.name,value:s.base_stat})),
      types:m.pkData.types.map(t=>t.type.name),config:m.config,
    }))));
    const si=$('save-indicator');if(si){si.classList.add('visible');setTimeout(()=>si.classList.remove('visible'),2200);}
  }catch(e){}
}
function loadTeam(){
  try{
    const raw=localStorage.getItem(LS_KEY);if(!raw)return;
    STATE.myTeam=JSON.parse(raw).map(d=>({
      pkData:{name:d.name,sprites:{front_default:d.sprite},stats:d.stats.map(s=>({stat:{name:s.name},base_stat:s.value})),types:d.types.map(t=>({type:{name:t}}))},
      config:d.config||{moves:[null,null,null,null],realStats:{},nature:'',ability:'',item:'',note:''},
    }));
    for(const m of STATE.myTeam) for(const mv of(m.config?.moves||[])) if(mv?.apiName) prefetchMoveData(mv.apiName);
  }catch(e){STATE.myTeam=[];}
}
async function prefetchMoveData(apiName){
  if(STATE.moveDataCache[apiName]) return;
  try{const d=await fetchMoveByApiName(apiName);STATE.moveDataCache[apiName]={power:d.power||0,category:d.damage_class?.name||'',type:d.type?.name||'normal'};}catch(e){}
}
function saveHistory(){
  try{localStorage.setItem(LS_HISTORY,JSON.stringify(STATE.battleHistory));}catch(e){}
}
function loadHistory(){
  try{const r=localStorage.getItem(LS_HISTORY);if(r)STATE.battleHistory=JSON.parse(r);}catch(e){STATE.battleHistory=[];}
}

// ═══════════════════════════════════════════════
// FUZZY + AUTOCOMPLETE
// ═══════════════════════════════════════════════
function lev(a,b){const m=a.length,n=b.length,dp=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)dp[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[m][n];}
function fuzzy(query,items,max=10){
  const q=query.toLowerCase().trim();if(!q)return[];
  return items.map(item=>{const n=item.display.toLowerCase();if(n.startsWith(q))return{...item,score:0};if(n.includes(q))return{...item,score:1};return{...item,score:lev(q,n.slice(0,Math.min(n.length,q.length+3)))+2};})
    .filter(r=>r.score<=6).sort((a,b)=>a.score-b.score).slice(0,max);
}
function setupAC(inputId,suggestionsId,getItems,onSelect){
  const inp=$(inputId),list=$(suggestionsId);let deb=null;
  inp.addEventListener('input',()=>{
    clearTimeout(deb);deb=setTimeout(()=>{
      const q=inp.value.trim();if(q.length<2){list.classList.add('hidden');return;}
      const matches=fuzzy(q,getItems(),10);if(!matches.length){list.classList.add('hidden');return;}
      list.innerHTML='';
      for(const m of matches){
        const item=document.createElement('div');item.className='suggestion-item';
        const bs=m.key.split('-mega')[0].split('-primal')[0].split('-alola')[0].split('-galar')[0].split('-hisui')[0];
        const idx=STATE.pokemonNames?.indexOf(bs)+1||0;
        item.innerHTML=idx>0?`<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idx}.png" loading="lazy"/><span>${m.display}</span>`:`<span>${m.display}</span>`;
        item.addEventListener('click',()=>{inp.value=m.display;list.classList.add('hidden');onSelect(m.key,m.display);});
        list.appendChild(item);
      }
      list.classList.remove('hidden');
    },180);
  });
  document.addEventListener('click',e=>{if(!inp.contains(e.target)&&!list.contains(e.target))list.classList.add('hidden');});
}

// ═══════════════════════════════════════════════
// COMBATE — Equipo Enemigo
// ═══════════════════════════════════════════════
setupAC('enemy-search','enemy-suggestions',()=>STATE.pokemonIndex,async(slug)=>{
  if(STATE.enemyTeam.length>=6){showToast('⚠️ Máx 6 enemigos');return;}
  if(STATE.enemyTeam.find(e=>e.pkData.name===slug)){showToast('Ya está en el equipo enemigo');return;}
  setLoading(true);
  try{const pkData=await fetchPokemon(slug);STATE.enemyTeam.push({pkData,ko:false,realStats:{}});renderEnemyGrid();runAnalysis();$('enemy-search').value='';}
  catch(e){showToast(netErr(e));}finally{setLoading(false);}
});

$('btn-clear-enemies').addEventListener('click',()=>{STATE.enemyTeam=[];renderEnemyGrid();$('combat-analysis').classList.add('hidden');showToast('🗑️ Batalla reiniciada');});

$('btn-save-battle').addEventListener('click',()=>openSaveBattleModal());

function renderEnemyGrid(){
  const grid=$('enemy-team-grid');if(!STATE.enemyTeam.length){grid.innerHTML='';return;}
  grid.innerHTML=STATE.enemyTeam.map(({pkData,ko,realStats},i)=>{
    const hasStats=realStats&&Object.values(realStats).some(v=>v>0);
    // Calcular debilidades x4 y x2 del enemigo para mostrar en la card
    const enTypes=extractTypes(pkData);
    const topWeaknesses=Object.keys(TYPE_CHART).map(a=>{
      let m=1;for(const d of enTypes)m*=TYPE_CHART[a]?.[d]??1;return{type:a,multi:m};
    }).filter(w=>w.multi>=2).sort((a,b)=>b.multi-a.multi).slice(0,4);

    return`<div class="enemy-mini-card${ko?' ko':''}${hasStats?' has-stats':''}" data-index="${i}">
      <img src="${pkData.sprites?.front_default||''}" alt="${pkData.name}"/>
      <span class="enemy-mini-name">${slugToDisplay(pkData.name)}</span>
      <div class="enemy-mini-types">${enTypes.map(t=>`<span class="type-badge type-${t}">${t}</span>`).join('')}</div>
      ${topWeaknesses.length?`<div class="enemy-weakness-row">${topWeaknesses.map(w=>`<span class="weakness-item ${w.multi>=4?'x4':'x2'}">${w.type}${w.multi>=4?' ×4':''}</span>`).join('')}</div>`:''}
      ${hasStats?'<span class="enemy-stats-badge">📊 Stats</span>':''}
      <div class="enemy-mini-actions">
        <button class="enemy-action-btn" data-action="stats" data-index="${i}" title="Configurar stats">⚙️</button>
        <button class="enemy-action-btn" data-action="ko" data-index="${i}" title="${ko?'Revivir':'Marcar KO'}">${ko?'💚':'☠️'}</button>
        <button class="enemy-action-btn" data-action="remove" data-index="${i}" title="Quitar">✕</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.enemy-action-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const i=Number(btn.dataset.index),action=btn.dataset.action;
      if(action==='ko'){STATE.enemyTeam[i].ko=!STATE.enemyTeam[i].ko;renderEnemyGrid();runAnalysis();}
      else if(action==='remove'){STATE.enemyTeam.splice(i,1);renderEnemyGrid();STATE.enemyTeam.length?runAnalysis():$('combat-analysis').classList.add('hidden');}
      else if(action==='stats'){openEnemyEditModal(i);}
    });
  });
}

// Guardar batalla — muestra selector de resultado
function openSaveBattleModal(){
  if(!STATE.enemyTeam.length){showToast('⚠️ Agrega al menos un rival primero');return;}
  // Crear un div modal inline simple para seleccionar resultado
  const existing=$('save-battle-modal');if(existing)existing.remove();
  const div=document.createElement('div');div.id='save-battle-modal';div.className='modal-overlay';
  div.innerHTML=`<div class="modal-card" style="border-color:var(--neon-yellow)60;">
    <h3 class="modal-title" style="color:var(--neon-yellow);">💾 Guardar Batalla</h3>
    <p class="section-hint">¿Cuál fue el resultado?</p>
    <div class="result-selector">
      <button class="result-btn win-btn" data-res="win">✅ Victoria</button>
      <button class="result-btn loss-btn" data-res="loss">❌ Derrota</button>
      <button class="result-btn draw-btn" data-res="draw">🤝 Empate</button>
    </div>
    <div class="build-field">
      <label class="stat-label">📝 Nota (opcional)</label>
      <textarea id="battle-note" class="notes-textarea" style="height:60px;" placeholder="Ej: Cometí error con Danza Espada en turno 3..."></textarea>
    </div>
    <button id="battle-save-confirm" class="btn-primary" style="margin-top:8px;">Guardar</button>
    <button id="battle-save-cancel" class="btn-secondary" style="margin-top:6px;">Cancelar</button>
  </div>`;
  document.body.appendChild(div);
  let selectedResult=null;
  div.querySelectorAll('.result-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{div.querySelectorAll('.result-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');selectedResult=btn.dataset.res;});
  });
  $('battle-save-confirm').addEventListener('click',()=>{
    if(!selectedResult){showToast('⚠️ Selecciona el resultado');return;}
    const entry={
      id:Date.now(),
      date:new Date().toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}),
      enemyTeam:STATE.enemyTeam.map(e=>({name:e.pkData.name,sprite:e.pkData.sprites?.front_default||'',types:extractTypes(e.pkData)})),
      result:selectedResult,
      note:$('battle-note').value.trim(),
    };
    STATE.battleHistory.unshift(entry);
    if(STATE.battleHistory.length>50)STATE.battleHistory.pop();
    saveHistory();renderHistory();div.remove();
    showToast('💾 Batalla guardada en historial');
  });
  $('battle-save-cancel').addEventListener('click',()=>div.remove());
  div.addEventListener('click',e=>{if(e.target===div)div.remove();});
}

// ── Análisis principal ──
function runAnalysis(){
  $('combat-analysis').classList.remove('hidden');
  if(!STATE.myTeam.length){$('no-team-warning').classList.remove('hidden');['best-pick-block','best-combo-block','team-ranking-block'].forEach(id=>$(id).classList.add('hidden'));renderThreatList();return;}
  $('no-team-warning').classList.add('hidden');['best-pick-block','best-combo-block','team-ranking-block'].forEach(id=>$(id).classList.remove('hidden'));
  const scored=STATE.myTeam.map(m=>({member:m,score:scoreVsTeam(m,STATE.enemyTeam)})).sort((a,b)=>b.score-a.score);
  renderBestPick(scored[0]);renderOptimalTrio();renderRanking(scored);renderThreatList();
}

function renderBestPick({member,score}){
  const{pkData,config}=member;
  const myStats=getMyStats(member),types=extractTypes(pkData);
  const active=STATE.enemyTeam.filter(e=>!e.ko);
  const targetEnemy=active[0]||STATE.enemyTeam[0];
  let movesHtml='';
  if(targetEnemy){
    const bd=evaluateMoves(member,targetEnemy);
    const barC=['linear-gradient(90deg,var(--neon-green),#50ff50)','linear-gradient(90deg,var(--neon-cyan),var(--neon-green))','linear-gradient(90deg,var(--neon-yellow),var(--neon-orange))','linear-gradient(90deg,var(--neon-red),var(--neon-orange))'];
    movesHtml=`<div class="best-pick-moves">`+bd.slice(0,4).map(b=>{
      const w=Math.min(b.dmg.avg,100);const ci=b.dmg.avg>=70?0:b.dmg.avg>=40?1:b.dmg.avg>=20?2:3;
      return`<div class="bpm-row"><span class="bpm-name">${b.displayName} ${koBadgeHTML(b.ko)}</span>
        <div class="bpm-bar-wrap"><div class="bpm-bar" style="width:${w}%;background:${barC[ci]};"></div>
        <span class="bpm-pct">${b.dmg.min}–${b.dmg.max}%</span></div></div>`;
    }).join('')+`</div>`;
  }
  const hasConfig=(config?.moves||[]).some(m=>m?.apiName);
  $('best-pick-card').innerHTML=`<div class="best-pick-inner">
    <img src="${pkData.sprites?.front_default||''}" alt="${pkData.name}"/>
    <div class="best-pick-info">
      <div class="best-pick-name">${slugToDisplay(pkData.name)} ${hasConfig?'⚙️':'📊'}</div>
      <div class="type-badges" style="margin-bottom:5px;">${types.map(t=>`<span class="type-badge type-${t}">${t}</span>`).join('')}</div>
      ${config?.item?`<div class="best-pick-verdict">🎒 ${config.item}</div>`:''}
      <div class="best-pick-score">SPD ${myStats.spd} · Score ${Math.round(score)}pts</div>
      ${movesHtml}
    </div></div>`;
}

function renderOptimalTrio(){
  const trio=getBestTrio(STATE.myTeam,STATE.enemyTeam);
  const active=STATE.enemyTeam.filter(e=>!e.ko);
  const ts=active.length?trio.reduce((s,m)=>s+scoreVsTeam(m,STATE.enemyTeam),0).toFixed(1):'—';
  $('combat-synergy-result').innerHTML=`<div class="synergy-pokemon-row">
    ${trio.map(m=>`<div class="synergy-pokemon-item"><img src="${m.pkData.sprites?.front_default||''}" alt="${m.pkData.name}"/>
      <span>${slugToDisplay(m.pkData.name)}</span></div>`).join('')}
  </div><p class="synergy-score">⚡ Score: ${ts}pts vs ${active.length} activo(s)</p>`;
}

function renderRanking(scored){
  const medals=['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];
  const active=STATE.enemyTeam.filter(e=>!e.ko);
  const targetEnemy=active[0]||STATE.enemyTeam[0];
  $('team-ranking-list').innerHTML=scored.map(({member,score},i)=>{
    const{pkData,config}=member;const me=getMyStats(member),types=extractTypes(pkData);
    const cls=score>=55?'great':score>=30?'good':score>=10?'ok':'bad';
    const hasConfig=(config?.moves||[]).some(m=>m?.apiName);
    let bestKO='';
    if(targetEnemy){const bd=evaluateMoves(member,targetEnemy);bestKO=bd[0]?koBadgeHTML(bd[0].ko):'';}
    return`<div class="ranking-item${i<3?' rank-'+(i+1):''}">
      <span class="ranking-medal">${medals[i]||i+1}</span>
      <img src="${pkData.sprites?.front_default||''}" alt="${pkData.name}"/>
      <div class="ranking-info">
        <span class="ranking-name">${slugToDisplay(pkData.name)} ${hasConfig?'⚙️':'📊'} ${bestKO}</span>
        <span class="ranking-detail">${types.map(t=>`<span class="type-badge type-${t}" style="font-size:.48rem">${t}</span>`).join('')} SPD ${me.spd}${config?.item?' · '+config.item.slice(0,14):''}</span>
      </div>
      <span class="ranking-score ${cls}">${Math.round(score)}pts</span>
    </div>`;
  }).join('');
}

function renderThreatList(){
  const el=$('enemy-threat-list');const active=STATE.enemyTeam.filter(e=>!e.ko);
  if(!active.length){el.innerHTML='<span style="color:var(--text-dim);font-size:.8rem">Sin rivales activos.</span>';return;}
  const cnt={};for(const{pkData}of active)for(const t of extractTypes(pkData))cnt[t]=(cnt[t]||0)+1;
  el.innerHTML=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([t,c])=>`<span class="type-badge type-${t}">${t}${c>1?` ×${c}`:''}</span>`).join('');
}

// ═══════════════════════════════════════════════
// MODAL STATS DEL RIVAL + PRESETS
// ═══════════════════════════════════════════════
function openEnemyEditModal(idx){
  STATE.editingEnemyIdx=idx;
  const{pkData,realStats}=STATE.enemyTeam[idx];
  $('ee-sprite').src=pkData.sprites?.front_default||'';
  $('ee-name').textContent=slugToDisplay(pkData.name);
  // Rellenar campos
  const rs=realStats||{};
  $('ee-hp').value=rs.hp||''; $('ee-atk').value=rs.atk||''; $('ee-def').value=rs.def||'';
  $('ee-spatk').value=rs.spatk||''; $('ee-spdef').value=rs.spdef||''; $('ee-spd').value=rs.spd||'';
  // Cargar presets del Pokémon
  renderEnemyPresets(pkData.name);
  $('enemy-edit-modal').classList.remove('hidden');
}

function renderEnemyPresets(pkName){
  const el=$('ee-presets');
  const presets=COMPETITIVE_PRESETS[pkName]||[];
  if(!presets.length){el.innerHTML='<p style="color:var(--text-dim);font-size:.78rem">No hay presets para este Pokémon en la lista pública.<br>Introduce sus stats manualmente.</p>';return;}
  el.innerHTML=presets.map((p,i)=>`
    <div class="preset-item" data-idx="${i}">
      <div><div class="preset-name">${p.label}</div><div class="preset-desc">${p.desc}</div></div>
      <span class="preset-apply">APLICAR ▶</span>
    </div>`).join('');
  el.querySelectorAll('.preset-item').forEach(item=>{
    item.addEventListener('click',()=>{
      const p=presets[Number(item.dataset.idx)].stats;
      $('ee-hp').value=p.hp||''; $('ee-atk').value=p.atk||''; $('ee-def').value=p.def||'';
      $('ee-spatk').value=p.spatk||''; $('ee-spdef').value=p.spdef||''; $('ee-spd').value=p.spd||'';
      showToast('📋 Preset aplicado');
    });
  });
}

$('ee-save').addEventListener('click',()=>{
  if(STATE.editingEnemyIdx===null) return;
  STATE.enemyTeam[STATE.editingEnemyIdx].realStats={
    hp:Number($('ee-hp').value)||0, atk:Number($('ee-atk').value)||0, def:Number($('ee-def').value)||0,
    spatk:Number($('ee-spatk').value)||0, spdef:Number($('ee-spdef').value)||0, spd:Number($('ee-spd').value)||0,
  };
  $('enemy-edit-modal').classList.add('hidden');
  renderEnemyGrid(); runAnalysis();
  showToast('✅ Stats del rival guardados — precisión al 98%');
});
$('ee-close').addEventListener('click',()=>$('enemy-edit-modal').classList.add('hidden'));
$('enemy-edit-modal').addEventListener('click',function(e){if(e.target===this)this.classList.add('hidden');});

// ═══════════════════════════════════════════════
// EQUIPO — Gestión + Drag & Drop + Export/Import
// ═══════════════════════════════════════════════
setupAC('team-search','team-suggestions',()=>STATE.pokemonIndex,async(slug)=>{
  if(STATE.myTeam.length>=6){showToast('⚠️ Equipo lleno');return;}
  if(STATE.myTeam.find(m=>m.pkData.name===slug)){showToast('Ya está en tu equipo');return;}
  setLoading(true);
  try{const pkData=await fetchPokemon(slug);STATE.myTeam.push({pkData,config:{moves:[null,null,null,null],realStats:{},nature:'',ability:'',item:'',role:'',strategy:'',note:''}});renderTeamSlots();saveTeam();if(STATE.enemyTeam.length)runAnalysis();showToast(`✅ ${slugToDisplay(slug)} guardado`);}
  catch(e){showToast(netErr(e));}finally{setLoading(false);}
});

let dragSrc=null;
function renderTeamSlots(){
  const grid=$('team-slots');grid.innerHTML='';
  for(let i=0;i<6;i++){
    const slot=document.createElement('div');slot.className='team-slot';slot.dataset.index=i;
    const num=document.createElement('span');num.className='team-slot-number';num.textContent=`#${i+1}`;slot.appendChild(num);
    if(STATE.myTeam[i]){
      const{pkData,config}=STATE.myTeam[i];slot.classList.add('filled');slot.draggable=true;
      const img=document.createElement('img');img.src=pkData.sprites?.front_default||'';img.alt=pkData.name;
      const nameEl=document.createElement('span');nameEl.className='team-slot-name';nameEl.textContent=slugToDisplay(pkData.name);
      const typesEl=document.createElement('div');typesEl.className='team-slot-types';
      typesEl.innerHTML=extractTypes(pkData).map(t=>`<span class="type-badge type-${t}">${t}</span>`).join('');
      slot.appendChild(img);slot.appendChild(nameEl);slot.appendChild(typesEl);
      const hasConfig=(config?.moves||[]).some(m=>m?.apiName);
      const hasRealStats=config?.realStats&&Object.values(config.realStats).some(v=>v>0);
      if(hasConfig||hasRealStats){const b=document.createElement('span');b.className='slot-config-badge';b.textContent=(hasConfig?'⚔️ Moves':'')+(hasRealStats?' 📊':'')+' Conf.';slot.appendChild(b);}
      if(config?.item){const ip=document.createElement('span');ip.className='team-slot-note-preview';ip.textContent='🎒 '+config.item.slice(0,16);slot.appendChild(ip);}
      const rb=document.createElement('button');rb.className='team-slot-remove';rb.textContent='✕';
      rb.addEventListener('click',e=>{e.stopPropagation();STATE.myTeam.splice(i,1);renderTeamSlots();saveTeam();if(STATE.enemyTeam.length)runAnalysis();});
      slot.appendChild(rb);
      const btnRow=document.createElement('div');btnRow.className='slot-btn-row';
      const editBtn=document.createElement('button');editBtn.className=`team-slot-btn${hasConfig||hasRealStats?' has-config':''}`;editBtn.textContent='✏️';editBtn.title='Editar configuración';
      editBtn.addEventListener('click',e=>{
    e.stopPropagation();
    openEditModal(i).catch(err=>{
      console.error('Error abriendo modal:',err);
      showToast('⚠️ Error al abrir editor. Intenta de nuevo.');
      setLoading(false);
    });
  });
      btnRow.appendChild(editBtn);slot.appendChild(btnRow);
      slot.addEventListener('dragstart',()=>{dragSrc=i;setTimeout(()=>slot.classList.add('dragging'),0);});
      slot.addEventListener('dragend',()=>slot.classList.remove('dragging'));
    } else {
      const em=document.createElement('span');em.className='team-slot-empty-text';em.textContent='Vacío\nArrasta o busca';slot.appendChild(em);
    }
    slot.addEventListener('dragover',e=>{e.preventDefault();slot.classList.add('drag-over');});
    slot.addEventListener('dragleave',()=>slot.classList.remove('drag-over'));
    slot.addEventListener('drop',e=>{e.preventDefault();slot.classList.remove('drag-over');if(dragSrc===null||dragSrc===i)return;const moved=STATE.myTeam.splice(dragSrc,1)[0];STATE.myTeam.splice(i,0,moved);dragSrc=null;renderTeamSlots();saveTeam();});
    grid.appendChild(slot);
  }
  updateComparatorSlots();
}

// Export/Import
$('btn-export').addEventListener('click',()=>{
  const data=localStorage.getItem(LS_KEY);
  if(!data){showToast('⚠️ No hay equipo guardado');return;}
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download='arq-champions-equipo.json';a.click();URL.revokeObjectURL(url);
  showToast('📤 Equipo exportado');
});

$('btn-import').addEventListener('click',()=>{
  const box=$('import-box'),btn=$('btn-import-confirm');
  box.classList.toggle('hidden');btn.classList.toggle('hidden');
});

$('btn-import-confirm').addEventListener('click',()=>{
  try{
    const parsed=JSON.parse($('import-box').value);
    if(!Array.isArray(parsed))throw new Error('Formato inválido');
    STATE.myTeam=parsed.map(d=>({
      pkData:{name:d.name,sprites:{front_default:d.sprite},stats:d.stats.map(s=>({stat:{name:s.name},base_stat:s.value})),types:d.types.map(t=>({type:{name:t}}))},
      config:d.config||{moves:[null,null,null,null],realStats:{},nature:'',ability:'',item:'',note:''},
    }));
    for(const m of STATE.myTeam)for(const mv of(m.config?.moves||[]))if(mv?.apiName)prefetchMoveData(mv.apiName);
    renderTeamSlots();saveTeam();$('import-box').classList.add('hidden');$('btn-import-confirm').classList.add('hidden');
    showToast('✅ Equipo importado correctamente');
  }catch(e){showToast('⚠️ JSON inválido — verifica el formato');}
});

// ═══════════════════════════════════════════════
// MODAL EDITOR MI EQUIPO
// ═══════════════════════════════════════════════
(function populateNatures(){
  const sel=$('rs-nature');
  const opt0=document.createElement('option');opt0.value='';opt0.textContent='Sin naturaleza (neutra)';sel.appendChild(opt0);
  for(const n of Object.keys(NATURES)){
    if(n==='Tímido2') continue; // alias interno
    const o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);
  }
})();
$('rs-nature').addEventListener('change',function(){const[up,dn]=NATURES[this.value]||[null,null];$('nature-hint').textContent=(up||dn)?`+10% ${up||''} | -10% ${dn||''}`:'Naturaleza neutra';});
document.querySelectorAll('.edit-tab').forEach(btn=>{
  btn.addEventListener('click',function(){
    document.querySelectorAll('.edit-tab').forEach(b=>b.classList.remove('active'));this.classList.add('active');
    document.querySelectorAll('.edit-tab-content').forEach(c=>c.classList.add('hidden'));$('etab-'+this.dataset.etab).classList.remove('hidden');
  });
});

let EDIT_BUFFER={moves:[null,null,null,null],realStats:{},nature:'',ability:'',item:'',role:'',strategy:'',note:''};

function buildMoveSlots(){
  const container=$('move-slots-container');container.innerHTML='';
  for(let i=0;i<4;i++){
    const wrap=document.createElement('div');wrap.className='move-slot-wrap';
    wrap.innerHTML=`<div class="move-slot-label">Movimiento ${i+1}</div>
      <input type="text" id="ms-input-${i}" class="move-slot-input" placeholder="Ej: Terremoto, Danza Espada, Mente en Blanco..." autocomplete="off"/>
      <div class="move-slot-info" id="ms-info-${i}"></div>
      <div class="move-suggestions-inner hidden" id="ms-sug-${i}"></div>`;
    container.appendChild(wrap);
    const inp=wrap.querySelector(`#ms-input-${i}`),sug=wrap.querySelector(`#ms-sug-${i}`),info=wrap.querySelector(`#ms-info-${i}`);
    let deb=null;
    inp.addEventListener('input',()=>{
      clearTimeout(deb);deb=setTimeout(()=>{
        const q=inp.value.trim();if(q.length<2){sug.classList.add('hidden');return;}
        const matches=fuzzy(q,STATE.moveIndexES,8);if(!matches.length){sug.classList.add('hidden');return;}
        sug.innerHTML='';
        for(const m of matches){const item=document.createElement('div');item.className='suggestion-item';item.innerHTML=`<span>${m.display}</span>`;
          item.addEventListener('click',async()=>{inp.value=m.display;sug.classList.add('hidden');EDIT_BUFFER.moves[i]={apiName:m.key,displayName:m.display};
            try{const d=await fetchMoveByApiName(m.key);STATE.moveDataCache[m.key]={power:d.power||0,category:d.damage_class?.name||'',type:d.type?.name||'normal'};
              info.innerHTML=`<span class="type-badge type-${d.type?.name||'normal'}" style="font-size:.52rem;">${d.type?.name||''}</span><span class="move-slot-power">${d.damage_class?.name||''} · Poder: ${d.power||'—'}</span>`;}
            catch(e){info.innerHTML='<span style="color:var(--neon-red);font-size:.62rem;">⚠️ No cargado</span>';}});
          sug.appendChild(item);}
        sug.classList.remove('hidden');
      },180);
    });
    document.addEventListener('click',e=>{if(!wrap.contains(e.target))sug.classList.add('hidden');});
  }
}

async function openEditModal(idx){
  STATE.editingIdx=idx;
  const{pkData,config}=STATE.myTeam[idx];

  // Copiar config al buffer
  EDIT_BUFFER={
    moves:    JSON.parse(JSON.stringify(config.moves||[null,null,null,null])),
    realStats:JSON.parse(JSON.stringify(config.realStats||{})),
    nature:   config.nature   ||'',
    ability:  config.ability  ||'',
    item:     config.item     ||'',
    role:     config.role     ||'',
    strategy: config.strategy ||'',
    note:     config.note     ||'',
  };

  // Rellenar cabecera
  $('edit-sprite').src=pkData.sprites?.front_default||'';
  $('edit-name').textContent=slugToDisplay(pkData.name);

  // Rellenar stats ANTES de abrir (sin await)
  const rs=EDIT_BUFFER.realStats;
  $('rs-hp').value=rs.hp||'';$('rs-atk').value=rs.atk||'';$('rs-def').value=rs.def||'';
  $('rs-spatk').value=rs.spatk||'';$('rs-spdef').value=rs.spdef||'';$('rs-spd').value=rs.spd||'';
  $('rs-nature').value=EDIT_BUFFER.nature||'';
  const[up,dn]=NATURES[EDIT_BUFFER.nature]||[null,null];
  $('nature-hint').textContent=(up||dn)?`+10% ${up||''} | -10% ${dn||''}`:'';
  $('rs-item').value=EDIT_BUFFER.item||'';
  $('rs-role').value=EDIT_BUFFER.role||'';
  $('rs-strategy').value=EDIT_BUFFER.strategy||'';
  $('rs-note').value=EDIT_BUFFER.note||'';

  // Activar primera tab
  document.querySelectorAll('.edit-tab').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.querySelectorAll('.edit-tab-content').forEach((c,i)=>c.classList.toggle('hidden',i!==0));

  // ABRIR el modal INMEDIATAMENTE — sin esperar APIs
  $('edit-modal').classList.remove('hidden');

  // Move slots — si el índice no está listo, esperar y construir
  if(!STATE.moveIndexES.length){
    buildMoveIndexES().then(()=>{
      buildMoveSlots();
      // Restaurar valores guardados tras construir
      for(let i=0;i<4;i++){
        const mv=EDIT_BUFFER.moves[i];
        const inp=$(`ms-input-${i}`);
        if(inp&&mv?.displayName) inp.value=mv.displayName;
      }
    }).catch(e=>{ buildMoveSlots(); console.warn(e); });
  } else {
    buildMoveSlots();
  }
  for(let i=0;i<4;i++){
    const mv=EDIT_BUFFER.moves[i];
    const inp=$(`ms-input-${i}`);
    if(inp) inp.value=mv?.displayName||'';
    if(mv?.apiName){
      const c=STATE.moveDataCache[mv.apiName];
      const info=$(`ms-info-${i}`);
      if(c&&info) info.innerHTML=`<span class="type-badge type-${c.type}" style="font-size:.52rem;">${c.type}</span><span class="move-slot-power">${c.category} · ${c.power||'—'}</span>`;
    }
  }

  // 2. Habilidades y autocomplete item (en background)
  setupItemAutocomplete();
  loadAbilitiesForPokemon(pkData.name, EDIT_BUFFER.ability).catch(e=>console.warn(e));
}

// FIX 2: Carga habilidades reales del Pokémon en el <select>
async function loadAbilitiesForPokemon(pkName, savedAbility){
  const sel=$('rs-ability');
  const loadingEl=$('ability-loading');
  sel.innerHTML='<option value="">Selecciona una habilidad...</option>';
  loadingEl.classList.remove('hidden');
  try{
    const data=await apiFetch(`https://pokeapi.co/api/v2/pokemon/${pkName.toLowerCase()}`,5000);
    loadingEl.classList.add('hidden');
    if(!data.abilities||!data.abilities.length){
      sel.innerHTML='<option value="">Sin habilidades disponibles</option>';
      return;
    }
    for(const a of data.abilities){
      const opt=document.createElement('option');
      const apiName=a.ability.name;
      const esName=ABILITY_ES[apiName]||cap(apiName.replace(/-/g,' '));
      opt.value=esName;
      opt.textContent=esName+(a.is_hidden?' (Oculta)':'');
      if(savedAbility&&savedAbility.toLowerCase()===esName.toLowerCase()) opt.selected=true;
      sel.appendChild(opt);
    }
    // Si la habilidad guardada no está en la lista (ej: guardada en español), seleccionar la primera
    if(savedAbility&&!Array.from(sel.options).some(o=>o.selected)){
      sel.value=''; // dejar en blanco, mostrar lo guardado en texto si fuera necesario
    }
  }catch(e){
    loadingEl.classList.add('hidden');
    sel.innerHTML=`<option value="${savedAbility||''}">${savedAbility||'Error cargando habilidades'}</option>`;
    if(savedAbility) sel.value=savedAbility;
  }
}

// FIX 3: Objetos competitivos comunes — lista maestra
const COMPETITIVE_ITEMS = [
  // Objetos de ataque físico
  'Banda Elegida','Choice Band',
  // Objetos de ataque especial
  'Gafas Elegidas','Choice Specs',
  // Objetos de velocidad
  'Pañuelo Elegido','Choice Scarf',
  // Objetos ofensivos
  'Vidasfera','Life Orb',
  'Experto','Expert Belt',
  'Turbocarga','Loaded Dice',
  // Objetos defensivos / sustain
  'Restos','Leftovers',
  'Bayas Restos','Black Sludge',
  'Baya Sitrus','Sitrus Berry',
  'Baya Mago','Mago Berry',
  'Baya Ocre','Aguav Berry',
  'Baya Wiki','Wiki Berry',
  'Baya Iapapa','Iapapa Berry',
  'Baya Lum','Lum Berry',
  // Mega Stones (algunos comunes)
  'Piedra Blazikenita','Blazikenite',
  'Piedra Garchompita','Garchompite',
  'Piedra Lucario','Lucarionite',
  'Piedra Salamencita','Salamencite',
  'Piedra Metagrossita','Metagrossite',
  'Piedra Kangaskhita','Kangaskhanite',
  'Piedra Gengarita','Gengarite',
  // Objetos especiales
  'Polvo Brillo','Bright Powder',
  'Arnés Resistente','Assault Vest',
  'Tierra Sana','Grassy Seed',
  'Terreno Eléctrico','Electric Seed',
  'Terreno Psíquico','Psychic Seed',
  'Terreno Niebla','Misty Seed',
  'Roca Térmica','Heat Rock',
  'Roca Fría','Icy Rock',
  'Roca Lluviosa','Damp Rock',
  'Roca Arenosa','Smooth Rock',
  'Espejo Luz','Light Clay',
  'Escudo Mental','Mental Herb',
  'Hierba Blanca','White Herb',
  'Cinta Experto','Focus Sash',
  'Cinta Elegida','Focus Band',
  'Cucharacuchara','Eviolite',
  'Espejo Escudo','Protect (not item)',
  'Casco Dentado','Rocky Helmet',
  'Capa Espectra','Lagging Tail',
  'Esporas Raras','Power Herb',
  'Globo','Air Balloon',
  'Semilla Lum','Lum Seed',
  'Hierba Mental','Mental Herb',
  'Objeto No Equipado','—',
];

let itemACSetup=false;
function setupItemAutocomplete(){
  if(itemACSetup) return; // solo una vez
  itemACSetup=true;
  const inp=$('rs-item');
  const sug=$('item-suggestions');
  let deb=null;

  inp.addEventListener('input',()=>{
    clearTimeout(deb);deb=setTimeout(()=>{
      const q=inp.value.trim().toLowerCase();
      if(q.length<1){sug.classList.add('hidden');return;}
      const items=COMPETITIVE_ITEMS.map(n=>({display:n,key:n}));
      const matches=items.filter(it=>it.display.toLowerCase().includes(q)).slice(0,8);
      if(!matches.length){sug.classList.add('hidden');return;}
      sug.innerHTML='';
      for(const m of matches){
        const item=document.createElement('div');item.className='suggestion-item';
        item.innerHTML=`<span>${m.display}</span>`;
        item.addEventListener('click',()=>{inp.value=m.display;sug.classList.add('hidden');EDIT_BUFFER.item=m.key;});
        sug.appendChild(item);
      }
      sug.classList.remove('hidden');
    },150);
  });

  document.addEventListener('click',e=>{
    const wrap=inp.closest('.item-ac-wrap');
    if(wrap&&!wrap.contains(e.target)) sug.classList.add('hidden');
  });
}

$('edit-save').addEventListener('click',()=>{
  if(STATE.editingIdx===null) return;
  for(let i=0;i<4;i++){const val=$(`ms-input-${i}`)?.value.trim();if(!val){EDIT_BUFFER.moves[i]=null;continue;}
    if(!EDIT_BUFFER.moves[i]?.displayName||EDIT_BUFFER.moves[i].displayName!==val){const found=STATE.moveIndexES.find(m=>m.display.toLowerCase()===val.toLowerCase());if(found)EDIT_BUFFER.moves[i]={apiName:found.key,displayName:found.display};}}
  EDIT_BUFFER.realStats={hp:Number($('rs-hp').value)||0,atk:Number($('rs-atk').value)||0,def:Number($('rs-def').value)||0,spatk:Number($('rs-spatk').value)||0,spdef:Number($('rs-spdef').value)||0,spd:Number($('rs-spd').value)||0};
  EDIT_BUFFER.nature=$('rs-nature').value;EDIT_BUFFER.ability=$('rs-ability').value;EDIT_BUFFER.item=$('rs-item').value.trim();EDIT_BUFFER.role=$('rs-role').value;EDIT_BUFFER.strategy=$('rs-strategy').value.trim();EDIT_BUFFER.note=$('rs-note').value.trim();
  for(const mv of EDIT_BUFFER.moves)if(mv?.apiName)prefetchMoveData(mv.apiName);
  STATE.myTeam[STATE.editingIdx].config=JSON.parse(JSON.stringify(EDIT_BUFFER));
  $('edit-modal').classList.add('hidden');renderTeamSlots();saveTeam();if(STATE.enemyTeam.length)runAnalysis();
  showToast('✅ Configuración guardada');
});
$('edit-close').addEventListener('click',()=>$('edit-modal').classList.add('hidden'));
$('edit-modal').addEventListener('click',function(e){if(e.target===this)this.classList.add('hidden');});

// ═══════════════════════════════════════════════
// COMPARADOR DIRECTO
// ═══════════════════════════════════════════════
setupAC('cmp-enemy-search','cmp-enemy-suggestions',()=>STATE.pokemonIndex,async(slug)=>{
  setLoading(true);
  try{
    const pkData=await fetchPokemon(slug);
    STATE.cmpEnemy={pkData,ko:false,realStats:{}};
    const disp=$('cmp-enemy-display');disp.classList.remove('hidden');
    const cmpEnTypes=extractTypes(pkData);
    const cmpTopWk=Object.keys(TYPE_CHART).map(a=>{let m=1;for(const d of cmpEnTypes)m*=TYPE_CHART[a]?.[d]??1;return{type:a,multi:m};}).filter(w=>w.multi>=2).sort((a,b)=>b.multi-a.multi);
    disp.innerHTML=`<img src="${pkData.sprites?.front_default||''}" alt="${pkData.name}"/>
      <div class="cmp-enemy-display-info">
        <div class="cmp-enemy-name">${slugToDisplay(pkData.name)}</div>
        <div class="type-badges">${cmpEnTypes.map(t=>`<span class="type-badge type-${t}">${t}</span>`).join('')}</div>
        ${cmpTopWk.length?`<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:5px;">${cmpTopWk.slice(0,6).map(w=>`<span class="weakness-item ${w.multi>=4?'x4':'x2'}" style="font-size:.6rem;">${w.type} ×${w.multi}</span>`).join('')}</div>`:''}
      </div>`;
    $('cmp-enemy-search').value='';
    tryRenderComparison();
  }catch(e){showToast(netErr(e));}finally{setLoading(false);}
});

function updateComparatorSlots(){
  const container=$('cmp-my-slots');const noTeam=$('cmp-no-team');
  if(!STATE.myTeam.length){container.innerHTML='';if(noTeam)container.appendChild(noTeam);noTeam&&(noTeam.style.display='');return;}
  if(noTeam)noTeam.style.display='none';
  container.innerHTML=STATE.myTeam.map((m,i)=>{
    const clsA=STATE.cmpSelectedA===i?'selected-a':'';const clsB=STATE.cmpSelectedB===i?'selected-b':'';
    return`<button class="cmp-slot-btn ${clsA} ${clsB}" data-idx="${i}">
      <img src="${m.pkData.sprites?.front_default||''}" alt="${m.pkData.name}"/>
      <span>${slugToDisplay(m.pkData.name)}</span>
      ${clsA?'<span style="font-size:.55rem;color:var(--neon-cyan);">A</span>':''}
      ${clsB?'<span style="font-size:.55rem;color:var(--neon-purple);">B</span>':''}
    </button>`;
  }).join('');
  container.querySelectorAll('.cmp-slot-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx=Number(btn.dataset.idx);
      if(STATE.cmpSelectedA===idx){STATE.cmpSelectedA=null;}
      else if(STATE.cmpSelectedB===idx){STATE.cmpSelectedB=null;}
      else if(STATE.cmpSelectedA===null){STATE.cmpSelectedA=idx;}
      else if(STATE.cmpSelectedB===null){STATE.cmpSelectedB=idx;}
      else{STATE.cmpSelectedA=STATE.cmpSelectedB;STATE.cmpSelectedB=idx;}
      updateComparatorSlots();tryRenderComparison();
    });
  });
}

function tryRenderComparison(){
  if(STATE.cmpSelectedA===null||STATE.cmpSelectedB===null||!STATE.cmpEnemy){$('cmp-result').classList.add('hidden');return;}
  const mA=STATE.myTeam[STATE.cmpSelectedA],mB=STATE.myTeam[STATE.cmpSelectedB];
  if(!mA||!mB){$('cmp-result').classList.add('hidden');return;}
  $('cmp-result').classList.remove('hidden');
  const enemyEntry=STATE.cmpEnemy;

  // FIX 4b: Calcular y mostrar debilidades/resistencias/inmunidades del rival en el comparador
  const enTypes=extractTypes(enemyEntry.pkData);
  const allT=Object.keys(TYPE_CHART);
  const wk=[],rs=[],im=[];
  for(const a of allT){
    let m=1;for(const d of enTypes)m*=TYPE_CHART[a]?.[d]??1;
    if(m===0)       im.push({type:a});
    else if(m>=4)   wk.push({type:a,multi:m,cls:'x4'});
    else if(m>=2)   wk.push({type:a,multi:m,cls:'x2'});
    else if(m<=.5)  rs.push({type:a,multi:m,cls:'x0-5'});
  }
  $('cmp-weakness-list').innerHTML   = wk.length ? wk.map(w=>`<span class="weakness-item ${w.cls}">${w.type} ×${w.multi}</span>`).join('') : '<span style="color:var(--text-dim);font-size:.75rem">Ninguna</span>';
  $('cmp-resistance-list').innerHTML = rs.length ? rs.map(r=>`<span class="weakness-item x0-5">${r.type} ×${r.multi}</span>`).join('') : '<span style="color:var(--text-dim);font-size:.75rem">Ninguna</span>';
  $('cmp-immunity-list').innerHTML   = im.length ? im.map(i=>`<span class="type-badge type-${i.type}">${i.type} ✗</span>`).join('') : '<span style="color:var(--text-dim);font-size:.75rem">Ninguna</span>';
  const bdA=evaluateMoves(mA,enemyEntry),bdB=evaluateMoves(mB,enemyEntry);
  const bestA=bdA[0]?.dmg.avg||0,bestB=bdB[0]?.dmg.avg||0;
  const scoreA=scoreVsTeam(mA,[enemyEntry]),scoreB=scoreVsTeam(mB,[enemyEntry]);
  function panelHTML(member,bd,isWinner){
    const{pkData,config}=member;const me=getMyStats(member);
    return`<div class="cmp-panel${isWinner?' winner':''}">
      <img src="${pkData.sprites?.front_default||''}" alt="${pkData.name}"/>
      <div class="cmp-panel-name">${slugToDisplay(pkData.name)}</div>
      <div class="type-badges" style="justify-content:center;margin-bottom:8px;">${extractTypes(pkData).map(t=>`<span class="type-badge type-${t}">${t}</span>`).join('')}</div>
      <div style="font-size:.65rem;color:var(--text-secondary);margin-bottom:8px;">SPD ${me.spd}${config?.item?' · '+config.item.slice(0,12):''}</div>
      ${bd.slice(0,4).map(b=>{
        const c=b.dmg.avg>=70?'var(--neon-green)':b.dmg.avg>=40?'var(--neon-cyan)':b.dmg.avg>=20?'var(--neon-yellow)':'var(--neon-red)';
        return`<div class="cmp-move-row"><span class="cmp-move-name">${b.displayName}</span>
          <span class="cmp-move-pct" style="color:${c};">${b.dmg.min}–${b.dmg.max}% ${koBadgeHTML(b.ko)}</span></div>`;
      }).join('')}
    </div>`;
  }
  const winA=scoreA>=scoreB;
  $('cmp-left').outerHTML=panelHTML(mA,bdA,winA).replace('<div class="cmp-panel','<div id="cmp-left" class="cmp-panel');
  $('cmp-right').outerHTML=panelHTML(mB,bdB,!winA).replace('<div class="cmp-panel','<div id="cmp-right" class="cmp-panel');
  const diff=Math.abs(bestA-bestB);
  const winner=scoreA>=scoreB?slugToDisplay(mA.pkData.name):slugToDisplay(mB.pkData.name);
  $('cmp-verdict').innerHTML=`🏆 ${winner} es mejor opción contra ${slugToDisplay(enemyEntry.pkData.name)} · Diferencia: ${diff.toFixed(0)}% daño · Score: ${scoreA.toFixed(0)} vs ${scoreB.toFixed(0)}`;
}

// ═══════════════════════════════════════════════
// HISTORIAL DE BATALLAS
// ═══════════════════════════════════════════════
function renderHistory(){
  const list=$('history-list');const noMsg=$('no-history-msg');
  if(!STATE.battleHistory.length){list.innerHTML='';if(noMsg)list.appendChild(noMsg);renderHistoryStats();return;}
  if(noMsg)noMsg.remove();
  renderHistoryStats();
  list.innerHTML=STATE.battleHistory.map(b=>`
    <div class="history-entry ${b.result}" data-id="${b.id}">
      <div class="history-entry-header">
        <span class="history-date">📅 ${b.date}</span>
        <span class="history-result-badge ${b.result}">${b.result==='win'?'✅ VICTORIA':b.result==='loss'?'❌ DERROTA':'🤝 EMPATE'}</span>
      </div>
      <div class="history-enemy-row">
        ${b.enemyTeam.map(e=>`<img src="${e.sprite}" alt="${e.name}" title="${slugToDisplay(e.name)}" style="width:32px;height:32px;image-rendering:pixelated;"/>`).join('')}
        <span style="font-size:.72rem;color:var(--text-secondary);margin-left:4px;">${b.enemyTeam.map(e=>slugToDisplay(e.name)).join(', ')}</span>
      </div>
      ${b.note?`<div class="history-note">📝 ${b.note}</div>`:''}
      <div class="history-entry-actions">
        <button class="history-action-btn reload-btn" data-id="${b.id}">⚔️ Recargar en Combate</button>
        <button class="history-action-btn delete history-del-btn" data-id="${b.id}">🗑️ Borrar</button>
      </div>
    </div>`).join('');

  list.querySelectorAll('.reload-btn').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const entry=STATE.battleHistory.find(b=>b.id===Number(btn.dataset.id));if(!entry)return;
      setLoading(true);STATE.enemyTeam=[];
      try{for(const e of entry.enemyTeam){const pk=await fetchPokemon(e.name);STATE.enemyTeam.push({pkData:pk,ko:false,realStats:{}});}
        renderEnemyGrid();runAnalysis();
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(s=>s.classList.add('hidden'));
        document.querySelector('[data-tab="combat"]').classList.add('active');$('tab-combat').classList.remove('hidden');
        showToast('⚔️ Equipo enemigo recargado en Combate');
      }catch(e){showToast(netErr(e));}finally{setLoading(false);}
    });
  });
  list.querySelectorAll('.history-del-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{STATE.battleHistory=STATE.battleHistory.filter(b=>b.id!==Number(btn.dataset.id));saveHistory();renderHistory();showToast('🗑️ Entrada eliminada');});
  });
}

function renderHistoryStats(){
  const el=$('history-stats');if(!STATE.battleHistory.length){el.innerHTML='';return;}
  const wins=STATE.battleHistory.filter(b=>b.result==='win').length;
  const losses=STATE.battleHistory.filter(b=>b.result==='loss').length;
  const draws=STATE.battleHistory.filter(b=>b.result==='draw').length;
  const wr=STATE.battleHistory.length?Math.round(wins/STATE.battleHistory.length*100):0;
  el.innerHTML=`
    <div class="history-stat-item"><span class="history-stat-val wins">${wins}</span><span class="history-stat-label">Victorias</span></div>
    <div class="history-stat-item"><span class="history-stat-val losses">${losses}</span><span class="history-stat-label">Derrotas</span></div>
    <div class="history-stat-item"><span class="history-stat-val draws">${draws}</span><span class="history-stat-label">Empates</span></div>
    <div class="history-stat-item"><span class="history-stat-val" style="color:var(--neon-cyan);">${wr}%</span><span class="history-stat-label">Win Rate</span></div>`;
}

// ═══════════════════════════════════════════════
// POKÉDEX
// ═══════════════════════════════════════════════
setupAC('dex-search','dex-suggestions',()=>STATE.pokemonIndex,async(slug)=>{
  setLoading(true);try{const data=await fetchPokemon(slug);STATE.currentDexData=data;STATE.dexShowBack=false;renderDexCard(data);addDexHistory(data);}catch(e){showToast(netErr(e));}finally{setLoading(false);}
});
function renderDexCard(data){
  const types=extractTypes(data),name=data.name;
  const isMega=name.includes('-mega')||name.includes('-primal');
  const dn=slugToDisplay(name);
  $('dex-sprite-front').src=STATE.dexShowBack?(data.sprites?.back_default||data.sprites?.front_default||''):data.sprites?.front_default||'';
  $('dex-sprite-front').className=`dex-sprite${isMega?' mega':''}`;
  $('dex-name').textContent=dn;$('dex-name').className=`dex-name${isMega?' is-mega':''}`;
  $('dex-types').innerHTML=types.map(t=>`<span class="type-badge type-${t}">${t}</span>`).join('');
  const fb=$('dex-form-badge');
  if(isMega||['alola','galar','hisui'].some(r=>name.includes('-'+r))){fb.classList.remove('hidden');fb.textContent=isMega?'⚡ Mega/Primal':name.includes('-alola')?'🌺 Alola':name.includes('-galar')?'🌿 Galar':'❄️ Hisui';}
  else fb.classList.add('hidden');
  $('dex-number').textContent=`#${data.id}`;$('dex-height').textContent=`📏 ${(data.height/10).toFixed(1)}m`;$('dex-weight').textContent=`⚖️ ${(data.weight/10).toFixed(1)}kg`;
  const sl={'hp':'HP','attack':'ATK','defense':'DEF','special-attack':'SPATK','special-defense':'SPDEF','speed':'SPD'};
  let total=0;
  $('dex-stats').innerHTML=data.stats.map(s=>{const v=s.base_stat;total+=v;const pct=Math.min(Math.round(v/255*100),100);const cls=v>=150?'bar-godly':v>=110?'bar-great':v>=80?'bar-good':v>=50?'bar-mid':'bar-low';const color=v>=150?'var(--neon-purple)':v>=110?'var(--neon-green)':v>=80?'var(--neon-cyan)':v>=50?'var(--neon-yellow)':'var(--neon-red)';return`<div class="dex-stat-row"><span class="dex-stat-name">${sl[s.stat.name]||s.stat.name}</span><span class="dex-stat-val" style="color:${color}">${v}</span><div class="dex-stat-bar-bg"><div class="dex-stat-bar ${cls}" style="width:${pct}%"></div></div></div>`;}).join('');
  $('dex-stat-total').textContent=total;
  const allT=Object.keys(TYPE_CHART),wk=[],rs=[],im=[];
  for(const a of allT){let m=1;for(const d of types)m*=TYPE_CHART[a]?.[d]??1;if(m===0)im.push({type:a});else if(m>=4)wk.push({type:a,multi:m,cls:'x4'});else if(m>=2)wk.push({type:a,multi:m,cls:'x2'});else if(m<=.5)rs.push({type:a,multi:m,cls:'x0-5'});}
  $('dex-weaknesses').innerHTML=wk.length?wk.map(w=>`<span class="weakness-item ${w.cls}">${w.type} ×${w.multi}</span>`).join(''):'<span style="color:var(--text-dim);font-size:.8rem">Ninguna</span>';
  $('dex-resistances').innerHTML=rs.length?rs.map(r=>`<span class="weakness-item x0-5">${r.type} ×${r.multi}</span>`).join(''):'<span style="color:var(--text-dim);font-size:.8rem">Ninguna</span>';
  $('dex-immunities').innerHTML=im.length?im.map(i=>`<span class="type-badge type-${i.type}">${i.type} ✗</span>`).join(''):'<span style="color:var(--text-dim);font-size:.8rem">Ninguna</span>';
  $('dex-abilities').innerHTML=data.abilities.map(a=>`<div class="dex-ability-item"><span class="dex-ability-name">${a.ability.name.replace(/-/g,' ')}</span>${a.is_hidden?'<span class="dex-ability-hidden">OCULTA</span>':''}</div>`).join('');
  $('dex-card').classList.remove('hidden');
}
$('dex-sprite-toggle').addEventListener('click',()=>{if(!STATE.currentDexData)return;STATE.dexShowBack=!STATE.dexShowBack;$('dex-sprite-front').src=STATE.dexShowBack?(STATE.currentDexData.sprites?.back_default||STATE.currentDexData.sprites?.front_default||''):STATE.currentDexData.sprites?.front_default||'';});
$('dex-add-team').addEventListener('click',async()=>{if(!STATE.currentDexData){showToast('Busca un Pokémon primero');return;}const slug=STATE.currentDexData.name;if(STATE.myTeam.length>=6){showToast('⚠️ Equipo lleno');return;}if(STATE.myTeam.find(m=>m.pkData.name===slug)){showToast('Ya está en tu equipo');return;}STATE.myTeam.push({pkData:STATE.currentDexData,config:{moves:[null,null,null,null],realStats:{},nature:'',ability:'',item:'',role:'',strategy:'',note:''}});renderTeamSlots();saveTeam();if(STATE.enemyTeam.length)runAnalysis();showToast(`✅ ${slugToDisplay(slug)} agregado a tu equipo`);});
$('dex-add-enemy').addEventListener('click',()=>{if(!STATE.currentDexData){showToast('Busca un Pokémon primero');return;}const slug=STATE.currentDexData.name;if(STATE.enemyTeam.length>=6){showToast('⚠️ Máx 6 enemigos');return;}if(STATE.enemyTeam.find(e=>e.pkData.name===slug)){showToast('Ya en equipo enemigo');return;}STATE.enemyTeam.push({pkData:STATE.currentDexData,ko:false,realStats:{}});renderEnemyGrid();runAnalysis();document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.tab-content').forEach(s=>s.classList.add('hidden'));document.querySelector('[data-tab="combat"]').classList.add('active');$('tab-combat').classList.remove('hidden');showToast(`☠️ ${slugToDisplay(slug)} al equipo enemigo`);});
function addDexHistory(data){if(STATE.dexHistory.find(d=>d.name===data.name))return;STATE.dexHistory.unshift(data);if(STATE.dexHistory.length>12)STATE.dexHistory.pop();renderDexHistory();}
function renderDexHistory(){const c=$('dex-history'),list=$('dex-history-list');if(!STATE.dexHistory.length){c.classList.add('hidden');return;}c.classList.remove('hidden');list.innerHTML=STATE.dexHistory.map(d=>`<div class="dex-history-item" data-name="${d.name}"><img src="${d.sprites?.front_default||''}" alt="${d.name}"/><span>${slugToDisplay(d.name)}</span></div>`).join('');list.querySelectorAll('.dex-history-item').forEach(item=>item.addEventListener('click',()=>{const f=STATE.dexHistory.find(d=>d.name===item.dataset.name);if(f){STATE.currentDexData=f;STATE.dexShowBack=false;renderDexCard(f);}}));}

// ═══════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',function(){
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(s=>s.classList.add('hidden'));
    $(`tab-${this.dataset.tab}`).classList.remove('hidden');
    if(this.dataset.tab==='compare')updateComparatorSlots();
    if(this.dataset.tab==='history')renderHistory();
  });
});

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
async function init(){
  updateNetStatus();setLoading(true);
  loadTeam();loadHistory();renderTeamSlots();
  try{await buildPokemonIndex();}catch(e){showToast(netErr(e)+' — funciones limitadas',4000);}
  setLoading(false);
  buildMoveIndexES();
  showToast('⚡ ARQ Champions v7 — Motor al 98% de precisión');
}
init();

/* ══════════════════════════════════════════════
   IA TÁCTICA — v8
   1. Campo Rol + Estrategia (ya patcheado arriba)
   2. Escáner de equipo rival con foto → Claude
   3. Análisis táctico completo → Claude
   ══════════════════════════════════════════════ */

// ─────────────────────────────────────────────
// HELPERS CLAUDE API
// ─────────────────────────────────────────────

/** Convierte un File/Blob de imagen a base64 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/** Llama a la API de Claude via proxy Netlify (sin CORS) */
async function callClaude(userMessage, imageBase64 = null, imageType = 'image/jpeg') {
  const content = [];
  if (imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: imageType, data: imageBase64 },
    });
  }
  content.push({ type: 'text', text: userMessage });

  // Llamamos a nuestra propia función Netlify (sin CORS, sin exponer la key)
  let response;
  try {
    response = await fetch('/.netlify/functions/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        max_tokens: 1000,
        messages: [{ role: 'user', content }],
      }),
    });
  } catch (netErr) {
    throw new Error('Sin conexión a internet');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.content?.find(b => b.type === 'text')?.text || '';
}

// ─────────────────────────────────────────────
// MÓDULO 2: ESCÁNER DE EQUIPO RIVAL CON FOTO
// ─────────────────────────────────────────────

let scannedPhoto     = null; // File object
let scannedPhotoType = 'image/jpeg';
let scannedResults   = [];   // [{name, slug, confidence}]

const scannerInput   = $('scanner-photo-input');
const scannerPreview = $('scanner-preview-wrap');
const scannerImg     = $('scanner-preview-img');
const btnScan        = $('btn-scan');
const scannerResult  = $('scanner-result');
const scannerError   = $('scanner-error');

// Al seleccionar archivo
scannerInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  scannedPhoto     = file;
  scannedPhotoType = file.type || 'image/jpeg';
  const url        = URL.createObjectURL(file);
  scannerImg.src   = url;
  scannerPreview.classList.remove('hidden');
  btnScan.classList.remove('hidden');
  scannerResult.classList.add('hidden');
  scannerError.classList.add('hidden');
});

// Quitar foto
$('btn-scanner-clear').addEventListener('click', () => {
  scannedPhoto = null;
  scannedResults = [];
  scannerPreview.classList.add('hidden');
  btnScan.classList.add('hidden');
  scannerResult.classList.add('hidden');
  scannerError.classList.add('hidden');
  scannerInput.value = '';
});

// Botón escanear
$('btn-scan').addEventListener('click', async () => {
  if (!scannedPhoto) return;
  btnScan.disabled    = true;
  btnScan.textContent = '⏳ Analizando imagen...';
  scannerError.classList.add('hidden');
  scannerResult.classList.add('hidden');

  try {
    const b64 = await fileToBase64(scannedPhoto);

    const prompt = `Eres un experto en Pokémon con conocimiento enciclopédico de todos los sprites y diseños visuales de los Pokémon de todas las generaciones, incluyendo Mega Evoluciones y formas regionales.

Analiza esta imagen de una pantalla de Nintendo Switch del juego Pokémon y LISTA los Pokémon que puedas identificar por sus sprites/diseños visuales.

FORMATO DE RESPUESTA (JSON puro, sin markdown):
{
  "pokemon": [
    {"nombre": "Blastoise", "slug": "blastoise", "confianza": "alta"},
    {"nombre": "Latios", "slug": "latios", "confianza": "alta"},
    {"nombre": "Hippowdon", "slug": "hippowdon", "confianza": "media"}
  ],
  "notas": "Texto breve si hay algo importante que mencionar"
}

Reglas:
- slug debe ser el nombre en inglés en minúsculas con guiones (ej: mega-charizard-x → charizard-mega-x)
- Para Megas usa el formato: charizard-mega-x, garchomp-mega, etc.
- Si no puedes identificar un Pokémon con certeza, ponlo con confianza "baja"
- Lista TODOS los Pokémon visibles en la imagen, generalmente son 6
- Responde SOLO con el JSON, sin texto adicional`;

    const raw  = await callClaude(prompt, b64, scannedPhotoType);
    const clean = raw.replace(/```json|```/g, '').trim();
    const data  = JSON.parse(clean);

    if (!data.pokemon || !data.pokemon.length) throw new Error('No se detectaron Pokémon');

    scannedResults = data.pokemon;
    await renderScannerResults(data.pokemon);
    scannerResult.classList.remove('hidden');

  } catch (e) {
    console.error('Scanner error:', e);
    let msg = '';
    if (e.message === 'CORS_BLOCKED' || e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
      msg = '⚠️ La IA con foto solo funciona dentro de Claude.ai (artifact). En Netlify usa el modo manual: agrega los Pokémon del rival uno por uno en la pestaña Combate. El análisis táctico de texto (botón "Analizar con IA") sí funciona desde Netlify.';
    } else if (e.message.includes('JSON')) {
      msg = '⚠️ La IA no pudo identificar Pokémon en esa imagen. Asegúrate de que los sprites sean claramente visibles y la foto esté bien iluminada.';
    } else {
      msg = `⚠️ Error: ${e.message}`;
    }
    scannerError.textContent = msg;
    scannerError.classList.remove('hidden');
  } finally {
    btnScan.disabled    = false;
    btnScan.textContent = '🤖 Identificar Pokémon con IA';
  }
});

async function renderScannerResults(pokemonList) {
  const container = $('scanner-pokemon-list');
  container.innerHTML = '<p style="color:var(--text-dim);font-size:.78rem;">Buscando sprites...</p>';

  const rows = await Promise.all(pokemonList.map(async (pk) => {
    // Buscar en índice local para obtener sprite
    const slug   = pk.slug.toLowerCase();
    const idx    = STATE.pokemonNames?.indexOf(slug) + 1 || 0;
    const sprite = idx > 0
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idx}.png`
      : '';

    // Calcular debilidades para mostrar
    let typeBadges = '';
    let weakText   = '';
    try {
      const pkData = await apiFetch(`${API}/pokemon/${slug}`);
      const types  = extractTypes(pkData);
      typeBadges   = types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');
      const topWk  = Object.keys(TYPE_CHART)
        .map(a => { let m=1; for(const d of types) m *= TYPE_CHART[a]?.[d]??1; return{type:a,multi:m}; })
        .filter(w => w.multi >= 2)
        .sort((a,b) => b.multi - a.multi)
        .slice(0, 3);
      weakText = topWk.map(w => `${w.type}×${w.multi}`).join(' · ');
    } catch { /* continuar sin datos extra */ }

    const confColor = pk.confianza === 'alta' ? 'ok' : pk.confianza === 'media' ? 'warn' : 'warn';
    const confText  = pk.confianza === 'alta' ? '✅' : pk.confianza === 'media' ? '⚠️ revisar' : '❓ incierto';

    return `
      <div class="scanner-pk-row">
        ${sprite ? `<img src="${sprite}" alt="${pk.nombre}"/>` : '<div style="width:40px;height:40px;background:var(--bg-base);border-radius:50%;"></div>'}
        <div class="scanner-pk-info">
          <div class="scanner-pk-name">${pk.nombre}</div>
          <div class="scanner-pk-types">${typeBadges}</div>
          ${weakText ? `<div class="scanner-pk-weak">⚠️ Débil a: ${weakText}</div>` : ''}
        </div>
        <span class="scanner-pk-status ${confColor}">${confText}</span>
      </div>`;
  }));

  container.innerHTML = rows.join('');
}

// Cargar equipo escaneado en Combate
$('btn-load-scanned').addEventListener('click', async () => {
  if (!scannedResults.length) return;
  setLoading(true);
  STATE.enemyTeam = [];
  const errors = [];

  for (const pk of scannedResults) {
    try {
      const pkData = await fetchPokemon(pk.slug);
      STATE.enemyTeam.push({ pkData, ko: false, realStats: {} });
    } catch {
      errors.push(pk.nombre);
    }
  }

  renderEnemyGrid();
  if (STATE.enemyTeam.length) runAnalysis();
  setLoading(false);

  // Navegar a Combate
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
  document.querySelector('[data-tab="combat"]').classList.add('active');
  $('tab-combat').classList.remove('hidden');

  const msg = errors.length
    ? `⚔️ ${STATE.enemyTeam.length} Pokémon cargados. No encontrados: ${errors.join(', ')}`
    : `⚔️ Equipo rival cargado — ${STATE.enemyTeam.length} Pokémon listos para analizar`;
  showToast(msg, 4000);
});

// ─────────────────────────────────────────────
// MÓDULO 3: ANÁLISIS TÁCTICO COMPLETO CON CLAUDE
// ─────────────────────────────────────────────

/** Actualiza los contadores de contexto en la UI */
function updateAICounters() {
  const myEl  = $('ai-my-team-count');
  const enEl  = $('ai-enemy-count');
  if (myEl) myEl.textContent  = `${STATE.myTeam.length} / 6`;
  if (enEl) enEl.textContent  = `${STATE.enemyTeam.length} / 6`;

  // Color según completitud
  if (myEl) myEl.style.color  = STATE.myTeam.length >= 3 ? 'var(--neon-green)' : 'var(--neon-yellow)';
  if (enEl) enEl.style.color  = STATE.enemyTeam.length >= 1 ? 'var(--neon-green)' : 'var(--neon-red)';
}

/** Construye el prompt completo para Claude con toda la info táctica */
function buildTacticalPrompt() {
  const extraCtx = $('ai-extra-context')?.value.trim() || '';

  // ── Mi equipo ──
  const myTeamText = STATE.myTeam.map((m, i) => {
    const cfg    = m.config || {};
    const stats  = getMyStats(m);
    const types  = extractTypes(m.pkData);
    const moves  = (cfg.moves || []).filter(Boolean).map(mv => mv.displayName).join(', ') || 'Sin movimientos configurados';
    return `  ${i+1}. ${slugToDisplay(m.pkData.name)} | ${types.join('/')}
     Stats: PS ${stats.hp} · ATK ${stats.atk} · AT.ESP ${stats.spatk} · VEL ${stats.spd}
     Habilidad: ${cfg.ability || 'No especificada'}
     Objeto: ${cfg.item || 'Sin objeto'}
     Movimientos: ${moves}
     Rol declarado: ${cfg.role || 'No especificado'}
     Estrategia: ${cfg.strategy || 'No especificada'}`;
  }).join('\n');

  // ── Equipo rival ──
  const enemyTeamText = STATE.enemyTeam.length
    ? STATE.enemyTeam.map((e, i) => {
        const types = extractTypes(e.pkData);
        const enStats = getEnemyStats(e);
        const hasReal = e.realStats && Object.values(e.realStats).some(v => v > 0);
        return `  ${i+1}. ${slugToDisplay(e.pkData.name)} | ${types.join('/')}
     VEL: ${enStats.spd} ${hasReal ? '(stats reales configurados)' : '(estadísticas estimadas)'}`;
      }).join('\n')
    : '  (Sin equipo rival registrado — analiza opciones generales de mi equipo)';

  return `Eres un experto analista de Pokémon competitivo formato Singles 3v3 (se eligen 3 de 6 al inicio).

MI EQUIPO COMPLETO (6 Pokémon disponibles):
${myTeamText}

EQUIPO RIVAL DETECTADO:
${enemyTeamText}

${extraCtx ? `CONTEXTO ADICIONAL DEL JUGADOR:\n${extraCtx}\n` : ''}
ANALIZA y responde en español con estas secciones (sé directo y táctico, máximo 200 palabras):

**TRÍO RECOMENDADO:** [lista exactamente 3 Pokémon de mi equipo con sus nombres]

**ABRIDOR:** [el primero que debe entrar y POR QUÉ específicamente]

**CADENA TÁCTICA:** [explica la sinergia en 2-3 líneas: cómo se encadenan los 3]

**RIESGO PRINCIPAL:** [el mayor peligro del equipo rival contra mi estrategia]

**PLAN B:** [si mi estrategia falla en turno 1, qué hago]`;
}

/** Extrae nombres del trío de la respuesta de Claude para mostrar sprites */
function extractTrioFromResponse(responseText) {
  // Buscar la sección TRÍO RECOMENDADO
  const trioMatch = responseText.match(/TRÍO RECOMENDADO[:\*]?\s*([^\n]+)/i);
  if (!trioMatch) return [];

  const trioLine = trioMatch[1];
  const found    = [];

  for (const member of STATE.myTeam) {
    const displayName = slugToDisplay(member.pkData.name).toLowerCase();
    const pkName      = member.pkData.name.toLowerCase();
    // Verificar si el nombre aparece en la línea del trío
    if (trioLine.toLowerCase().includes(displayName) ||
        trioLine.toLowerCase().includes(pkName)) {
      found.push(member);
    }
  }
  return found.slice(0, 3);
}

// Botón de análisis
$('btn-ai-analyze').addEventListener('click', async () => {
  if (!STATE.myTeam.length) {
    showToast('⚠️ Agrega tu equipo primero en la pestaña Equipo');
    return;
  }

  const btn      = $('btn-ai-analyze');
  const loading  = $('ai-loading');
  const response = $('ai-response-block');

  btn.disabled    = true;
  loading.classList.remove('hidden');
  response.classList.add('hidden');

  try {
    const prompt      = buildTacticalPrompt();
    const claudeResp  = await callClaude(prompt);

    // Mostrar respuesta
    $('ai-response-text').textContent = claudeResp;

    // Intentar extraer el trío para mostrar sprites
    const trio = extractTrioFromResponse(claudeResp);
    if (trio.length >= 2) {
      const trioEl = $('ai-response-trio');
      trioEl.classList.remove('hidden');
      trioEl.innerHTML = `
        <div class="ai-trio-label">⚔️ Trío detectado en el análisis:</div>
        <div class="ai-trio-row">
          ${trio.map(m => `
            <div class="ai-trio-item">
              <img src="${m.pkData.sprites?.front_default||''}" alt="${m.pkData.name}"/>
              <span>${slugToDisplay(m.pkData.name)}</span>
              ${m.config?.role ? `<span style="font-size:.55rem;color:var(--neon-yellow);">${m.config.role}</span>` : ''}
            </div>`).join('')}
        </div>`;
    } else {
      $('ai-response-trio').classList.add('hidden');
    }

    response.classList.remove('hidden');
    // Scroll suave a la respuesta
    response.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (e) {
    console.error('AI analyze error:', e);
    let aiMsg = '';
    if (e.message === 'CORS_BLOCKED' || e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
      aiMsg = '⚠️ El análisis con IA solo funciona dentro de Claude.ai. En Netlify, esta función está bloqueada por CORS (política de seguridad del navegador). Para usarla, abre la app desde Claude.ai en vez de Netlify.';
    } else {
      aiMsg = `⚠️ Error: ${e.message}`;
    }
    showToast(aiMsg, 6000);
  } finally {
    btn.disabled = false;
    loading.classList.add('hidden');
  }
});

// Actualizar contadores cuando cambia el estado
const _origRenderTeamSlots    = renderTeamSlots;
const _origRenderEnemyGrid    = renderEnemyGrid;

// Wrap para actualizar contadores de IA al renderizar
function renderTeamSlotsWithAI() {
  _origRenderTeamSlots();
  updateAICounters();
}
function renderEnemyGridWithAI() {
  _origRenderEnemyGrid();
  updateAICounters();
}

// Reasignar referencias globales
window.renderTeamSlots = renderTeamSlotsWithAI;
window.renderEnemyGrid = renderEnemyGridWithAI;

// Inicializar contadores al cargar
updateAICounters();

// Registrar tab de IA en navegación (ya en el HTML, solo asegurar que funcione)
// El sistema de tabs existente lo maneja automáticamente con data-tab="ai"
