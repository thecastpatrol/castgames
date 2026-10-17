function showSocialPrompt(){
  const m=document.getElementById('socialModal');
  if(m) m.style.display='flex';
}

/* The undefeated season (8 Oct 2026, the owner: "It should be ultra special"): the big moment both games share
   (js/cast-celebrate.js) with this season in it: the 27 clubs beaten in order, the 13, the season's numbers and the six
   seasons nobody lost before it (checked 8 Oct 2026). The overlay keeps the id cel27 and its button the class
   cel-continue (theme-fx.js plays the win sound, and its Quick Draft taps the button). */
const CEL_UNBEATEN=['Balmain 1915','North Sydney 1921','South Sydney 1925','Eastern Suburbs 1936','Eastern Suburbs 1937','St George 1959'];
function show270Celebration(onComplete){
  if(!window.CastCelebrate){onComplete();return;}
  const A=window.CastAccount,C=window.CAST_ACCOUNT,s=STATE.season,f=s.finals||{},me=myTeam();
  const clubOf=id=>{const c=C&&C.club?C.club(id):null;return c?{abbr:c.abbr,bg:c.bg,fg:c.fg}:{abbr:String(id||'?').slice(0,3).toUpperCase(),bg:'#2a2a3a',fg:'#fff'};};
  const shortOf=(id,name)=>{const t=A&&A.teamColours?A.teamColours(id):null;return t?t.short:name;};
  const ROUND={grand:'Grand Final',prelim:'Preliminary Final',semi:'Semi Final',qualif:'Qualifying Final',elim:'Elimination Final'};
  // Finals Week 1 holds the two Qualifying Finals, then the two Elimination Finals (finishRegularSeason)
  const roundOf=(w,gi)=>{const l=String(w.label).toLowerCase();if(l.indexOf('week 1')>=0)return gi<(w.qfGames||2)?'Qualifying Final':'Elimination Final';const k=Object.keys(ROUND).find(x=>l.indexOf(x)>=0);return k?ROUND[k]:'Finals';};
  // The count-up: every win in order, the finals last
  const steps=[];let pf=s.pf||0,pa=s.pa||0,tries=s.tries||0,gf='';
  s.schedule.forEach(g=>{
    if(g.bye||!g.result||!g.result.won)return;
    const id=OPPONENT_CLUB_MAP[g.opp];
    steps.push(Object.assign(clubOf(id),{label:shortOf(id,g.opp)}));
  });
  (f.weeks||[]).forEach(w=>w.games.forEach((g,gi)=>{
    if(!g.winner||g.winner.name!==me)return;
    const id=OPPONENT_CLUB_MAP[g.loser.name],r=roundOf(w,gi);
    steps.push(Object.assign(clubOf(id),{label:r+': '+shortOf(id,g.loser.name)}));
    pf+=g.wPts||0;pa+=g.lPts||0;tries+=g.wTries||0;
    if(r==='Grand Final')gf=g.wPts+'-'+g.lPts;
  }));
  steps.forEach((x,i)=>{x.n=i+1;});
  // The player's club (their CAST Profile), else the club most of the 13 come from
  const b=A&&A.myBadge?A.myBadge():null;
  let colours=b&&b.c1?[b.c1,b.c2]:null;
  if(!colours){
    const n={};STATE.team.forEach(p=>{if(p&&p.club)n[p.club]=(n[p.club]||0)+1;});
    const top=Object.keys(n).sort((x,y)=>n[y]-n[x])[0],t=top&&A&&A.teamColours?A.teamColours(top):null;
    colours=t?[t.c1,t.c2]:top&&CLUB_COLORS[top]?[CLUB_COLORS[top],'#ffffff']:['#ffffff','#9aa4b2'];
  }
  const cards=STATE.team.map((p,i)=>{
    if(!p)return null;
    const c=clubOf(p.club);
    return {pos:SLOTS[i].type,name:cardSurname(p.name),val:Math.round(p.rating),vc:ratingColor(p.rating),abbr:c.abbr,bg:c.bg,fg:c.fg};
  });
  const pt=s.playerTries||[];let ti=-1;
  pt.forEach((t,i)=>{if(STATE.team[i]&&(ti<0||t>pt[ti]))ti=i;});
  window.CastCelebrate.show({
    id:'cel27',label:'27-0, Undefeated',from:0,fmt:n=>n+'-0',steps,big:'27-0',stamp:'Undefeated',line:me,colours,
    cards,rows:[[0],[1,2,3,4],[5,6],[7,8,9],[10,12,11]],
    stats:[{label:'Points For',value:pf},{label:'Points Against',value:pa},{label:'Tries',value:tries}].concat(gf?[{label:'Grand Final',value:gf}]:[]),
    star:ti>=0&&pt[ti]>0?{label:'Top Try Scorer',value:STATE.team[ti].name,extra:pt[ti]+(pt[ti]===1?' try':' tries')}:null,
    history:{head:'Unbeaten Premiers',text:'Only 6 teams have gone a whole season unbeaten. Until now.',items:CEL_UNBEATEN,you:me+' '+new Date().getFullYear()},
    button:'⭐ See Your Season',done:onComplete
  });
}

function buildShareCanvas(fmt){
  const s=STATE.season,f=s.finals;
  const sub=calcSubRatings();
  const fw=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;
  const fl=f.myTeamInFinals?f.myJourney.filter(j=>!j.won).length:0;
  const tw=s.wins+fw,tl=s.losses+fl;
  const is27=tw===27&&tl===0;
  const isStory=fmt==='story';
  // Mode colour (share-story.js defines the palette; gold if it isn't loaded)
  const M=(typeof window.cpModeSkin==='function'&&window.cpModeSkin())||{a:'#f5c518',hi:'#ffe2a8',lo:'#c9953a',rgb:'245,197,24',pill:'#f5c518',ink:'#111'};
  const W=isStory?360:400,H=isStory?640:500,SC=2;
  const cv=document.createElement('canvas');
  cv.width=W*SC;cv.height=H*SC;
  const ctx=cv.getContext('2d');ctx.scale(SC,SC);

  // helpers
  function rrect(x,y,w,h,r,fill,stroke,lw){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
    if(fill!=null){ctx.fillStyle=fill;ctx.fill();}
    if(stroke!=null){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1;ctx.stroke();}
  }
  function tx(str,x,y,font,col,align,base){
    ctx.font=font;ctx.fillStyle=col;ctx.textAlign=align||'left';ctx.textBaseline=base||'top';ctx.fillText(String(str),x,y);
  }
  function rCol(r){return r>=95?'#f5c518':r>=90?'#fbbf24':r>=85?'#4ade80':r>=80?'#60a5fa':'#94a3b8';}
  // Club badge colour map
  const CBCOL={roosters:'#e23020',storm:'#4a1b7a',panthers:'#000',broncos:'#840026',bulldogs:'#005499',rabbitohs:'#009640',warriors:'#0057a8',eels:'#003b9e',sharks:'#00b5cc',raiders:'#63b32e',knights:'#003f7d',titans:'#e8273d',dragons:'#e4072f',cowboys:'#00254a',seaeagles:'#8b0000',tigers:'#ef7c00',dolphins:'#e2001a',bears:'#cc0000',default:'#444466'};
  function clubCol(club){const k=club?club.toLowerCase().replace(/[\s-]/g,''):'';for(const[key,col] of Object.entries(CBCOL)){if(k.includes(key.replace(/[\s-]/g,'')))return col;}return CBCOL.default;}

  // ── BACKGROUND
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,(M.bg&&M.bg[0])||'#0c0c1a');bg.addColorStop(1,(M.bg&&M.bg[1])||'#07070e');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(typeof window.cpModeMotif==='function'&&M.id) window.cpModeMotif(ctx,M,W,H,W/1080);
  // Corner glows
  ctx.fillStyle=M.a;ctx.fillRect(0,0,W,4);ctx.fillRect(0,H-4,W,4);
  const g1=ctx.createRadialGradient(0,0,0,0,0,180);g1.addColorStop(0,'rgba('+M.rgb+',0.14)');g1.addColorStop(1,'transparent');ctx.fillStyle=g1;ctx.fillRect(0,0,180,180);
  const g2=ctx.createRadialGradient(W,H,0,W,H,200);g2.addColorStop(0,'rgba('+M.rgb+',0.12)');g2.addColorStop(1,'transparent');ctx.fillStyle=g2;ctx.fillRect(W-200,H-200,200,200);

  // ── HEADER: draw logo image (base64 data URL, safe for canvas)
  let y=12;
  const logoEl=document.querySelector('.header-logo');
  const logoH=36,logoDrawn=logoEl&&logoEl.complete&&logoEl.naturalWidth>0;
  if(logoDrawn){
    const aspect=logoEl.naturalWidth/logoEl.naturalHeight;
    ctx.drawImage(logoEl,14,y,logoH*aspect,logoH);
  } else {
    tx('27-0',14,y+8,'900 24px "Lilita One",cursive','#f5c518','left','middle');
  }
  // Era pill right
  const daily=window.CastDaily&&CastDaily.current&&CastDaily.current();
  const era=daily?'📅 Daily':STATE.gameMode==='pack'?'📦 Pack Mode':STATE.gameMode==='hard'?'🔥 Hard Mode':STATE.yearFrom===1998&&STATE.yearTo===2026?'All-Time':STATE.yearFrom===STATE.yearTo?String(STATE.yearFrom):`${STATE.yearFrom} to ${STATE.yearTo}`;
  ctx.font='700 10px system-ui';
  const eraW=ctx.measureText(era).width+16;
  rrect(W-14-eraW,y+9,eraW,18,9,M.pill,null);
  tx(era,W-14-eraW/2,y+18,'800 10px system-ui',M.ink,'center','middle');
  y+=logoH+10;

  // ── DIVIDER
  ctx.strokeStyle='#1e1e30';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(14,y);ctx.lineTo(W-14,y);ctx.stroke();y+=14;

  // ── RECORD
  const recStr=`${tw}-${tl}`;
  const recCol=is27||f.isChampion?M.a:tw>=20?'#4ade80':'#ffffff';
  const recSize=isStory?68:56;
  ctx.font=`900 ${recSize}px "Inter",sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillStyle=recCol;ctx.fillText(recStr,W/2,y);
  y+=recSize+4;

  // Team name: big, prominent
  const teamDisplay=myTeam().toUpperCase();
  tx(teamDisplay,W/2,y,'800 18px system-ui','#ffffff','center','top');
  y+=26;

  // ── STATS ROW
  const stats=[{l:'OVERALL',v:s.rating},{l:'BACKS',v:sub.backs},{l:'FORWARDS',v:sub.forwards},{l:'SPINE',v:sub.spine}];
  const sw=(W-32)/4,sx=16;
  stats.forEach((st,i)=>{
    const bx=sx+i*sw+2,bw=sw-4,bh=38,by=y;
    rrect(bx,by,bw,bh,6,'#111122',null);
    tx(st.l,bx+bw/2,by+7,'600 7px system-ui','#666677','center','top');
    const val=st.v!=null?st.v:'--';
    tx(val,bx+bw/2,by+bh-8,'900 15px system-ui',st.v!=null?rCol(st.v):'#555566','center','bottom');
  });
  y+=48;

  // ── DIVIDER
  ctx.strokeStyle='rgba('+M.rgb+',0.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(W-16,y);ctx.stroke();y+=10;

  // ── PLAYER LIST
  const POS_ABBR=['FB','RW','RC','LC','LW','5/8','HB','P','HK','P','SR','LK','SR'];
  const rowH=isStory?27:21;
  // Right-align club+rating badges, fill remaining width with name
  const MARGIN=16,RAT_W=28,CLB_W=30,GAP=4;
  const ratX0=W-MARGIN-RAT_W;          // rating badge x
  const clbX0=ratX0-GAP-CLB_W;         // club badge x
  const nameX=MARGIN+30+GAP;           // after pos badge
  const nameMaxW=clbX0-GAP-nameX;      // name clips here

  for(let i=0;i<13;i++){
    const p=STATE.team[i];
    if(!p)continue;
    const rowY=y+i*rowH;
    const midY=rowY+rowH/2;
    const badgeH=rowH-6,badgeY=rowY+3;
    if(i%2===0)rrect(MARGIN-4,rowY,W-MARGIN*2+8,rowH-1,4,'rgba(255,255,255,0.028)',null);

    // Position badge: vertically centred
    rrect(MARGIN,badgeY,28,badgeH,4,'rgba('+M.rgb+',0.18)',null);
    tx(POS_ABBR[i],MARGIN+14,midY,'800 8px system-ui',M.a,'center','middle');

    // Player name: vertically centred
    ctx.save();ctx.beginPath();ctx.rect(nameX,rowY,nameMaxW,rowH);ctx.clip();
    tx(p.name,nameX,midY,'600 11px system-ui','#ffffff','left','middle');
    ctx.restore();

    // Club badge: centred
    const cname=p.club||'';
    const cabbr=cname.slice(0,3).toUpperCase();
    rrect(clbX0,badgeY,CLB_W,badgeH,4,clubCol(cname),null);
    tx(cabbr,clbX0+CLB_W/2,midY,'800 7px system-ui','#fff','center','middle');

    // Rating badge: centred
    const rat=p.rating||0;
    rrect(ratX0,badgeY,RAT_W,badgeH,4,rCol(rat),null);
    tx(rat,ratX0+RAT_W/2,midY,'900 11px system-ui','#000','center','middle');
  }
  y+=13*rowH+8;

  // ── FOOTER
  ctx.strokeStyle='#1e1e30';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(W-16,y);ctx.stroke();y+=8;
  tx('Can you go 27-0?',16,y,'700 10px system-ui','#666677','left','top');
  tx('CASTGAMES.COM.AU',W-16,y,'800 10px system-ui',M.a,'right','top');

  return cv;
}
