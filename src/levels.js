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
  [20,13,'DUCK THE RIGGING','Hold Ctrl to crouch. Build speed to skim, then Jump during the slide for a fast Skim Jump.'],
  [35,13,'A SECOND WIND','Jump again in the air. The high pearls are practice, not the only way onward.'],
  [53,13,'CLEAR THE WATER','Dash for a burst, or Jump during it for a long Surge Jump. Landing or a three-pearl air chain refills it.'],
  [69,13,'WALL WORK','Hold toward a wall to slide slowly, then Jump to kick away.'],
  [97,13,'OLD RELIABLE','Tap Reel to strike. Hold near a gold ring to swing, then release with speed for an extra kick.'],
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

const OPENING_PLATFORMS=[[0,15,9,2],[9,13,4,4],[14,11,5,6]];
const OPENING_PEARLS=[[3,13],[6,13],[9,12],[11,11],[14,10],[16,9]];

function beginVoyage(l,pedestal,routeStyle){
 l.routeStyle=routeStyle;
 l.platforms.push(...OPENING_PLATFORMS.map(platform=>[...platform]),pedestal);
 l.pearls.push(...OPENING_PEARLS.map(pearl=>[...pearl]));
}

function stampRoom(l,x,plan,room,enemyType){
 l.platforms.push(...plan.p.map(platform=>[x+platform[0],...platform.slice(1)]));
 l.hazards.push(...(plan.h||[]).map(hazard=>[x+hazard[0],...hazard.slice(1)]));
 l.hooks.push(...(plan.k||[]).map(hook=>[x+hook[0],hook[1]]));
 l.pearls.push(...plan.r.map(pearl=>[x+pearl[0],pearl[1]]));
 if(plan.m)l.movers.push([x+plan.m[0],...plan.m.slice(1)]);
 if(plan.c)l.currents.push([x+plan.c[0],...plan.c.slice(1)]);
 if(plan.w)l.windZones.push([x+plan.w[0],...plan.w.slice(1)]);
 if(room%2===0||room===5){
  const type=typeof enemyType==='function'?enemyType(room):enemyType;
  l.enemies.push([x+(plan.e||3),plan.ey||13,type]);
 }
 if(room===3||room===6||room===9)l.checkpoints.push([x+1,12]);
}

function finishVoyage(l,t,li,signs){
 l.platforms.push([228,15,8,2]);
 const lureLandmarks=[[0,0],[24,8],[26,6],[25,9],[24,7]];
 l.lurePickups.push([...lureLandmarks[li],t.lure]);
 l.secrets.push([46,6,t.lure],[121,5,t.lure],[198,4,t.lure]);
 l.signs.push(...signs);
 return l;
}

function buildGrotto(t){
 const l=baseLevel(t);
 beginVoyage(l,[22,10,5,1],'Ride rising currents, swing across flooded chambers, and choose between safe stone paths and faster aerial pearl lines.');
 const plans=[
  {p:[[0,15,6,2],[8,13,5,4],[15,11,4,6],[4,8,3,1]],h:[[6,15,2,2]],k:[[7,5],[14,6]],r:[[2,13],[5,11],[8,10],[12,9],[16,8]],e:10},
  {p:[[0,14,4,3],[7,11,4,6],[14,14,5,3],[4,7,3,1]],h:[[4,15,3,2],[11,15,3,2]],k:[[6,4],[13,6]],c:[4,3,3,12],r:[[2,12],[5,10],[7,7],[11,9],[16,12]],e:15},
  {p:[[0,15,5,2],[7,12,3,5],[12,9,4,8],[17,13,2,4]],h:[[5,15,2,2],[16,15,1,2]],k:[[6,6],[16,5]],r:[[2,13],[6,11],[9,10],[13,8],[17,11]],m:[7,10,3,1,0,-78,1.25],e:8,ey:10},
  {p:[[0,13,5,4],[8,15,4,2],[14,11,5,6],[5,7,4,1]],h:[[5,15,3,2],[12,15,2,2]],k:[[7,4],[13,7]],r:[[2,11],[6,8],[9,13],[13,10],[17,9]],e:10},
  {p:[[0,15,7,2],[10,13,4,4],[16,15,3,2],[6,9,4,1]],h:[[7,15,3,2],[14,15,2,2]],k:[[9,5],[16,7]],c:[7,4,3,11],r:[[3,13],[7,11],[9,8],[13,11],[17,13]],e:11},
 ];
 const order=[0,1,2,3,4,1,3,0,4,2,3];
 order.forEach((plan,index)=>stampRoom(l,19+index*19,plans[plan],index+1,'bloop'));
 return finishVoyage(l,t,1,[
  [4,13,'FOLLOW THE GLOW','Pearls now build Reel Flow. Keep moving to run faster and recharge spent dashes.'],
  [39,12,'RIDE THE CURRENT','Teal streams lift Finn. Enter low, steer in the air, and leave at the top with your momentum.'],
  [96,12,'SWING, DON’T HANG','Hold the rod to build a swing. Release while moving quickly for a Reel Release boost.'],
 ]);
}

function buildStormbreak(t){
 const l=baseLevel(t);
 beginVoyage(l,[24,8,5,1],'Use tailwinds, long surge jumps, and low cliff routes to turn a storm into a high-speed playground.');
 const plans=[
  {p:[[0,15,8,2],[12,13,7,4],[5,10,4,1],[15,7,3,1]],h:[[8,15,4,2]],k:[[10,6],[17,4]],r:[[3,13],[7,11],[10,9],[14,11],[17,10]],w:[7,2,10,13,90],e:14},
  {p:[[0,14,5,3],[9,12,5,5],[17,15,2,2],[4,8,4,1]],h:[[5,15,4,2],[14,15,3,2]],k:[[8,5],[16,6]],r:[[2,12],[5,9],[9,10],[13,10],[17,13]],e:2},
  {p:[[0,15,6,2],[10,15,9,2],[5,11,3,1],[13,8,4,1]],h:[[6,15,4,2]],k:[[8,6],[17,5]],r:[[2,13],[6,11],[9,12],[13,7],[17,12]],m:[6,12,3,1,92,0,1.7],e:14},
  {p:[[0,12,5,5],[8,15,5,2],[16,11,3,6],[5,7,3,1]],h:[[5,15,3,2],[13,15,3,2]],k:[[7,4],[14,5]],r:[[2,10],[6,7],[9,13],[13,11],[17,9]],w:[0,1,18,14,-82],e:9},
  {p:[[0,15,10,2],[13,13,6,4],[4,12,3,1],[10,8,4,1]],h:[[10,15,3,2]],k:[[12,5],[18,6]],r:[[3,13],[7,13],[10,10],[14,11],[18,11]],e:15},
 ];
 const order=[4,0,2,1,3,0,4,2,3,1,0];
 order.forEach((plan,index)=>stampRoom(l,19+index*19,plans[plan],index+1,room=>room%3===0?'skipper':'clackett'));
 return finishVoyage(l,t,2,[
  [4,13,'CHASE THE GALE','Flow raises Finn’s running speed. The broad cliff paths are built for staying in motion.'],
  [42,12,'SURGE JUMP','Jump during a dash to trade the burst for a long controllable leap.'],
  [99,12,'USE THE WIND','Grass and streaks show the wind direction. A tailwind extends a jump; a headwind rewards the low route.'],
 ]);
}

function buildIcewater(t){
 const l=baseLevel(t);
 beginVoyage(l,[23,11,5,1],'Convert slippery runways into long skims, duck through snow tunnels, and jump from slides to keep control.');
 const plans=[
  {p:[[0,15,19,2],[5,13,6,1],[13,11,4,1],[16,8,3,1]],k:[[7,7],[12,6]],r:[[2,13],[6,14],[10,14],[14,10],[17,7]],e:14},
  {p:[[0,15,7,2],[10,15,9,2],[4,10,4,1],[12,12,5,1]],h:[[7,15,3,2]],k:[[9,6]],r:[[3,13],[7,11],[10,13],[14,11],[18,13]],m:[7,12,3,1,0,-72,1.1],e:14},
  {p:[[0,13,5,4],[7,15,6,2],[15,12,4,5],[4,8,4,1]],h:[[5,15,2,2],[13,15,2,2]],k:[[6,5],[14,6]],r:[[2,11],[5,8],[8,13],[13,11],[17,10]],e:9},
  {p:[[0,15,19,2],[3,12,5,1],[10,13,6,1],[15,9,4,1]],k:[[9,7],[17,6]],r:[[2,14],[5,11],[9,14],[13,12],[17,8]],e:12},
  {p:[[0,15,5,2],[8,13,4,4],[15,15,4,2],[4,9,3,1]],h:[[5,15,3,2],[12,15,3,2]],k:[[7,5],[14,7]],r:[[2,13],[5,10],[8,11],[12,12],[16,13]],e:9},
 ];
 const order=[0,3,1,4,2,0,1,3,4,2,0];
 order.forEach((plan,index)=>stampRoom(l,19+index*19,plans[plan],index+1,room=>room%4===0?'skipper':'clackett'));
 return finishVoyage(l,t,3,[
  [4,13,'KEEP YOUR EDGE','Ice carries speed after you release a direction. Turn early, or crouch to settle into a controlled skim.'],
  [39,12,'SKIM JUMP','Jump from a slide to keep its speed in the air. It is fast, forgiving, and uses only two buttons.'],
  [96,12,'PICK A LINE','The low tunnels favor sliding. The snowy rooftops favor grapples and double jumps. Both lead onward.'],
 ]);
}

function buildStarSea(t){
 const l=baseLevel(t);
 beginVoyage(l,[22,9,5,1],'Chain moonlit hooks, buoyant star currents, and dash refills into long aerial routes above the safe islands.');
 const plans=[
  {p:[[0,15,5,2],[8,12,4,5],[15,9,4,8],[4,7,3,1]],h:[[5,15,3,2],[12,15,3,2]],k:[[7,4],[14,5]],r:[[2,13],[5,9],[8,10],[13,7],[17,8]],c:[5,5,3,10],e:9,ey:10},
  {p:[[0,13,4,4],[7,10,4,7],[14,13,5,4],[4,6,3,1]],h:[[4,15,3,2],[11,15,3,2]],k:[[6,3],[13,5],[18,4]],r:[[2,11],[5,7],[8,8],[13,9],[17,11]],e:15},
  {p:[[0,15,7,2],[11,12,4,5],[17,15,2,2],[6,8,4,1]],h:[[7,15,4,2],[15,15,2,2]],k:[[9,4],[16,6]],r:[[3,13],[7,10],[10,8],[14,10],[18,13]],m:[7,11,3,1,100,-35,1.35],e:12},
  {p:[[0,11,5,6],[8,14,5,3],[16,10,3,7],[5,6,4,1]],h:[[5,15,3,2],[13,15,3,2]],k:[[7,3],[14,4]],r:[[2,9],[6,6],[9,12],[14,8],[17,8]],c:[5,3,3,12],e:10},
  {p:[[0,15,5,2],[9,15,5,2],[17,13,2,4],[5,9,4,1]],h:[[5,15,4,2],[14,15,3,2]],k:[[8,4],[15,5]],r:[[2,13],[5,10],[9,13],[14,10],[18,11]],m:[6,11,3,1,0,-92,1.55],e:10},
 ];
 const order=[1,0,2,4,3,1,0,4,2,3,1];
 order.forEach((plan,index)=>stampRoom(l,19+index*19,plans[plan],index+1,room=>room%3===0?'skipper':'clackett'));
 return finishVoyage(l,t,4,[
  [4,13,'MAKE A CONSTELLATION','A route is a chain: pearl, dash, wall kick, grapple, release. Keep the line alive to reach High Tide.'],
  [40,12,'THREE PEARLS','Collect three pearls after spending your air dash to refill it without touching down.'],
  [97,12,'THE SKY ROUTE','Every aerial shortcut has a safe island beneath it. Experiment first; perfect the chain later.'],
 ]);
}

export const LEVELS=[buildHarbor(THEMES[0]),buildGrotto(THEMES[1]),buildStormbreak(THEMES[2]),buildIcewater(THEMES[3]),buildStarSea(THEMES[4])];
