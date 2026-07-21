export const TILE=32;
export const LURES=[
 {id:'classic',name:'Old Reliable',color:'#e9d39b',desc:'Balanced attack, retrieval and grappling.'},
 {id:'ember',name:'Ember Minnow',color:'#ff704d',desc:'Burns brambles and pierces icy armor.'},
 {id:'bubble',name:'Bubble Bobber',color:'#72dfe0',desc:'Slows falls and floats hooked enemies.'},
 {id:'magnet',name:'Iron Mackerel',color:'#9ab7c5',desc:'Pulls metal, coins and distant switches.'},
 {id:'anchor',name:'Anchor Grub',color:'#687786',desc:'Slams downward through cracked floors.'},
 {id:'storm',name:'Storm Squid',color:'#f2d45c',desc:'Chains lightning between nearby targets.'},
 {id:'moon',name:'Moon Jelly',color:'#b99bff',desc:'Hooks spectral anchors and star paths.'},
 {id:'golden',name:'Golden Fly',color:'#ffd45a',desc:'Finds treasure and multiplies pearl value.'}
];

const THEMES=[
 {name:'Tacklewick Harbor',fish:'Copper Koi',bg:'harbor.png',top:'#d29a51',body:'#543b32',music:0,lure:'ember',gimmick:'boats'},
 {name:'Glowkelp Grotto',fish:'Lantern Eel',bg:'grotto.png',top:'#55c9a4',body:'#173d43',music:1,lure:'bubble',gimmick:'current'},
 {name:'Stormbreak Cliffs',fish:'Thunder Marlin',bg:'cliffs.png',top:'#b9c8aa',body:'#344854',music:2,lure:'magnet',gimmick:'wind'},
 {name:'Icewater Village',fish:'Frostfin Tuna',bg:'icewater.png',top:'#e5f7ee',body:'#42748b',music:3,lure:'anchor',gimmick:'ice'},
 {name:'The Star-Sea',fish:'The Starwhale',bg:'starsea.png',top:'#d4b9ff',body:'#3a326b',music:4,lure:'moon',gimmick:'stars'}
];

function baseLevel(t){return {...t,width:236,start:[2,13],goal:[231,12],platforms:[],hazards:[],hooks:[],pearls:[],enemies:[],movers:[],checkpoints:[],lurePickups:[],secrets:[],currents:[],windZones:[],signs:[],itemPlan:{pearls:'Pearls trace safe lines, expressive movement arcs, and optional high routes.',lure:'The world lure rests at a safe landmark before its optional caches.',caches:'Three lure caches reward exploration and mastery without blocking the main route.'}}}

function buildHarbor(t){
 const l=baseLevel(t);
 l.lessons=[
  {id:'move_jump',x:0,purpose:'Safe runway and low steps establish acceleration and variable jump height.'},
  {id:'crouch_slide',x:18,purpose:'Low rigging makes the reduced collider visible before slide speed matters.'},
  {id:'double_jump',x:34,purpose:'Rising pearl stair teaches the optional second jump with a safe floor below.'},
  {id:'dash',x:52,purpose:'A readable water gap makes dash useful while double jump remains a recovery.'},
  {id:'wall_movement',x:69,purpose:'A catch-safe shaft teaches wall slide and wall jump without a death pit.'},
  {id:'reel_grapple',x:97,purpose:'A ring offers a fast high route while the ordinary route remains possible.'},
  {id:'slide_combat',x:120,purpose:'Low rigging flows directly into Clackett so a fast slide becomes an attack.'},
  {id:'skipper_read',x:143,purpose:'Open air gives the gull room to telegraph and complete its dive.'},
  {id:'moving_docks',x:166,purpose:'Isolated moving docks teach riding and jumping from carried momentum.'},
  {id:'final_remix',x:199,purpose:'A short finale recombines gaps, walls, enemies, dash, and reel.'},
 ];
 l.platforms.push(
  [0,15,18,2],[6,12,3,1],[11,10,3,1],
  [18,15,16,2],[23,13,3,1],[31,10,3,1],
  [34,15,18,2],[37,12,3,1],[40,9,3,1],[43,6,3,1],[46,9,3,1],[49,12,3,1],
  [52,15,7,2],[64,15,7,2],[56,8,3,1],[60,10,3,1],
  [71,15,7,2],[72,12,2,3],[77,6,2,9],[77,6,8,1],[84,8,4,1],[88,11,4,1],[92,14,5,3],
  [97,15,7,2],[108,13,8,4],[116,15,4,2],[103,8,3,1],[108,5,3,1],
  [120,15,23,2],[124,13,4,1],[136,10,4,1],
  [143,15,8,2],[154,14,7,3],[148,10,4,1],[161,15,5,2],
  [166,15,4,2],[176,11,5,6],[181,14,4,3],[194,11,5,6],
  [199,15,5,2],[208,13,4,4],[213,9,2,8],[215,9,6,1],[221,12,5,5],[226,15,10,2]
 );
 l.hazards.push([59,15,5,2],[104,15,4,2],[151,15,3,2],[170,15,6,2],[185,15,9,2],[204,15,4,2],[212,15,1,2]);
 l.movers.push([169,13,3,1,0,-96,1.15],[184,13,3,1,160,0,1]);
 l.hooks.push([106,7],[111,6],[188,7],[218,5]);
 l.enemies.push([129,13,'clackett'],[149,13,'skipper'],[201,13,'clackett'],[218,10,'skipper']);
 l.checkpoints.push([55,13],[119,13],[164,13],[199,13]);
 l.lurePickups.push([109,3,'ember']);
 l.secrets.push([45,4,'ember'],[113,8,'ember'],[219,6,'ember']);
 l.signs.push(
  [3,13,'FIND YOUR SEA LEGS','Move first. Tap Jump for a hop; hold it to climb higher.'],
  [20,13,'DUCK THE RIGGING','Hold Slide to crouch. Build speed first and Finn will skim beneath it.'],
  [35,13,'A SECOND WIND','Jump again in the air. The high pearls are practice, not the only way onward.'],
  [53,13,'CLEAR THE WATER','Jump, then Dash for a short committed burst. Double jump can rescue a late attempt.'],
  [69,13,'WALL WORK','Hold toward a wall to slide slowly, then Jump to kick away.'],
  [97,13,'OLD RELIABLE','Tap Reel to strike. Hold it near a gold ring to pull Finn toward it.'],
  [120,13,'LOW AND LOUD','Slide under the beam with speed and carry that momentum through Clackett.'],
  [144,13,'SKIPPER GULL','Raised wings mean a dive is coming. Move late and let Skipper miss.'],
  [165,13,'RIDE THE TIDE','Moving docks carry Finn. Jump from them to keep their momentum.'],
  [199,13,'THE HARBOR TEST','No new tricks now. Choose your own line to the Copper Koi.']
 );
 l.pearls.push(
  [4,13],[7,11],[12,9],[16,13],
  [21,13],[24,14],[27,14],[31,11],
  [36,13],[38,11],[40,8],[43,5],[46,8],[49,11],
  [55,13],[58,12],[60,11],[62,11],[64,12],[67,13],
  [72,12],[73,11],[75,10],[76,8],[74,7],[76,6],[80,5],[85,7],[90,10],[94,13],
  [99,13],[103,10],[106,6],[109,4],[112,7],[116,12],
  [122,13],[125,13],[128,13],[132,13],[138,9],[141,13],
  [145,13],[149,9],[153,11],[157,13],[163,13],
  [168,13],[170,11],[173,9],[177,10],[183,13],[187,10],[191,9],[196,10],
  [201,13],[204,12],[207,11],[210,12],[214,8],[218,8],[222,11],[227,13],[231,11]
 );
 return l;
}

function buildLevel(t,li){
 const l=baseLevel(t);
 for(let room=0;room<12;room++){
  const x=room*19,pattern=(room+li)%4;
  if(pattern===0){l.platforms.push([x,15,12,2],[x+15,14,4,3],[x+6,10,4,1]);l.hazards.push([x+12,15,3,2])}
  if(pattern===1){l.platforms.push([x,15,7,2],[x+10,12,6,5],[x+17,15,2,2],[x+5,8,4,1]);l.hazards.push([x+7,15,3,2])}
  if(pattern===2){l.platforms.push([x,14,5,3],[x+8,15,6,2],[x+17,13,2,4],[x+5,9,4,1],[x+13,7,3,1]);l.hazards.push([x+5,15,3,2],[x+14,15,3,2])}
  if(pattern===3){l.platforms.push([x,15,9,2],[x+12,11,5,6],[x+18,15,1,2],[x+7,7,4,1]);l.hazards.push([x+9,15,3,2],[x+17,15,1,2])}
  l.hooks.push([x+9,5+(room%2)*2],[x+16,4]);
  if(pattern===0)l.pearls.push([x+3,13],[x+7,9],[x+13,12],[x+16,12]);
  if(pattern===1)l.pearls.push([x+3,13],[x+7,10],[x+11,10],[x+15,10]);
  if(pattern===2)l.pearls.push([x+2,12],[x+6,8],[x+11,13],[x+14,6],[x+17,11]);
  if(pattern===3)l.pearls.push([x+3,13],[x+8,6],[x+10,9],[x+13,9],[x+17,13]);
  const enemyType=li===0?(room%3===0?'skipper':'clackett'):(li===1?'bloop':(room%3===0?'skipper':'clackett'));
  l.enemies.push([x+4,13,enemyType]);
  if(room%3===1)l.movers.push([x+7,11,3,1,room%2?0:80,room%2?80:0,1.5+li*.12]);
  if(room===3||room===6||room===9)l.checkpoints.push([x+2,12]);
 }
 l.platforms.push([228,15,8,2]);
 const lureLandmarks=[[0,0],[24,8],[26,6],[25,9],[24,7]];
 l.lurePickups.push([...lureLandmarks[li],t.lure]);
 l.secrets.push([46,6,t.lure],[121,5,t.lure],[198,4,t.lure]);
 l.signs.push([4,13,'RUN & JUMP','Hold to run. Tap jump for a hop; hold it for height.'],[21,12,'CAST','Tap the rod to strike or retrieve. Hold near a gold ring to grapple.'],[43,12,'TACKLE BOX','Collected lures are permanent. Open the box whenever you are safe.']);
 if(t.gimmick==='current')l.currents.push([54,3,7,12],[142,2,7,13]);
 if(t.gimmick==='wind')l.windZones.push([70,0,18,15,70],[165,0,18,15,-65]);
 if(t.gimmick==='stars')l.currents.push([102,4,8,11],[191,2,8,13]);
 return l;
}
export const LEVELS=THEMES.map((theme,index)=>index===0?buildHarbor(theme):buildLevel(theme,index));
