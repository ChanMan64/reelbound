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

function buildLevel(t,li){
 const l={...t,width:236,start:[2,13],goal:[231,12],platforms:[],hazards:[],hooks:[],pearls:[],enemies:[],movers:[],checkpoints:[],lurePickups:[],secrets:[],currents:[],windZones:[],signs:[]};
 for(let room=0;room<12;room++){
  const x=room*19,pattern=(room+li)%4;
  if(pattern===0){l.platforms.push([x,15,12,2],[x+15,14,4,3],[x+6,10,4,1]);l.hazards.push([x+12,15,3,2])}
  if(pattern===1){l.platforms.push([x,15,7,2],[x+10,12,6,5],[x+17,15,2,2],[x+5,8,4,1]);l.hazards.push([x+7,15,3,2])}
  if(pattern===2){l.platforms.push([x,14,5,3],[x+8,15,6,2],[x+17,13,2,4],[x+5,9,4,1],[x+13,7,3,1]);l.hazards.push([x+5,15,3,2],[x+14,15,3,2])}
  if(pattern===3){l.platforms.push([x,15,9,2],[x+12,11,5,6],[x+18,15,1,2],[x+7,7,4,1]);l.hazards.push([x+9,15,3,2],[x+17,15,1,2])}
  l.hooks.push([x+9,5+(room%2)*2],[x+16,4]);
  l.pearls.push([x+5,12],[x+9,8],[x+16,10]);
  const enemyType=li===0?(room%3===0?'skipper':'clackett'):(li===1?'bloop':(room%3===0?'skipper':'clackett'));
  l.enemies.push([x+4,13,enemyType]);
  if(room%3===1)l.movers.push([x+7,11,3,1,room%2?0:80,room%2?80:0,1.5+li*.12]);
  if(room===3||room===6||room===9)l.checkpoints.push([x+2,12]);
 }
 l.platforms.push([228,15,8,2]);
 l.lurePickups.push([25+li*2,6,t.lure]);
 l.secrets.push([46,6,t.lure],[121,5,t.lure],[198,4,t.lure]);
 l.signs.push([4,13,'RUN & JUMP','Hold to run. Tap jump for a hop; hold it for height.'],[21,12,'CAST','Tap the rod to strike or retrieve. Hold near a gold ring to grapple.'],[43,12,'TACKLE BOX','Collected lures are permanent. Open the box whenever you are safe.']);
 if(t.gimmick==='current')l.currents.push([54,3,7,12],[142,2,7,13]);
 if(t.gimmick==='wind')l.windZones.push([70,0,18,15,70],[165,0,18,15,-65]);
 if(t.gimmick==='stars')l.currents.push([102,4,8,11],[191,2,8,13]);
 return l;
}
export const LEVELS=THEMES.map(buildLevel);
