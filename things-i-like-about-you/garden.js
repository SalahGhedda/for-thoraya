(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const notesRoot = document.getElementById('notes');
  const vine = document.getElementById('vine-art');
  const section = document.querySelector('.note-garden');
  const hero = document.getElementById('hero-botanical');
  let vinePath, vineLength = 0, vineDetails = [], tip;
  let drawnLength = 0, desiredLength = 0, drawingFrame = 0, measureFrame = 0;
  let sectionTop = 0, sectionHeight = 0, resizeTimer;

  function svg(tag, attrs = {}, parent) {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (parent) parent.append(el);
    return el;
  }
  function node(tag, className, parent, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text !== undefined) el.textContent = text;
    if (parent) parent.append(el);
    return el;
  }
  function group(parent, x = 0, y = 0, angle = 0, scale = 1) {
    return svg('g', {transform:'translate('+x+' '+y+') rotate('+angle+') scale('+scale+')'}, parent);
  }
  function path(parent, d, fill = 'none', stroke = 'none', width = .7) {
    return svg('path', {d, fill, stroke, 'stroke-width':width, 'stroke-linecap':'round', 'stroke-linejoin':'round'}, parent);
  }
  function definitions(root, prefix) {
    const defs = svg('defs', {}, root);
    const colors = {
      leaf:['#b7c58b','#58805b','#183e31'],
      jade:['#779c72','#36654e','#112f29'],
      pink:['#fce6d4','#edb5ac','#b86879'],
      rose:['#f3c6c0','#d68c98','#8e465e'],
      cream:['#fff9dd','#e8d4a5','#b3955f'],
      wax:['#e5c78b','#b48b4d','#6d4f2d']
    };
    const palette = {};
    for (const [name, colorset] of Object.entries(colors)) {
      const id = prefix+'-'+name;
      const gradient = svg(name==='leaf'||name==='jade'?'linearGradient':'radialGradient', {id, cx:'.38', cy:'.25', r:'.85', x1:'0', y1:'0', x2:'1', y2:'1'}, defs);
      colorset.forEach((color, index) => svg('stop', {offset:index/2, 'stop-color':color}, gradient));
      palette[name] = 'url(#'+id+')';
    }
    return palette;
  }
  function animatedGroup(parent, x, y, angle, delay, heroAnimation = false) {
    const position = group(parent, x, y, angle);
    const growth = svg('g', {class:'growth'+(heroAnimation?' hero-growth':'')}, position);
    growth.style.setProperty('--delay', delay+'s');
    const sway = svg('g', {}, growth);
    sway.style.setProperty('--sway-duration', (6+delay%4)+'s');
    sway.style.setProperty('--sway-delay', -delay+'s');
    return {position, growth, content:sway};
  }
  function leaf(parent, x, y, length, angle, palette, shade = false) {
    const g = group(parent, x, y, angle);
    path(g, 'M0 0C'+(-length*.55)+' '+(-length*.25)+' '+(-length*.48)+' '+(-length*.78)+' 1 '+(-length)+'C'+(length*.43)+' '+(-length*.68)+' '+(length*.52)+' '+(-length*.21)+' 0 0Z', shade?palette.jade:palette.leaf, '#9bb88b', .38);
    path(g, 'M0 0Q-2 '+(-length*.5)+' 1 '+(-length*.96), 'none', '#d2d9a5', .55);
    for(let i=1;i<5;i++) {
      const y=-length*i*.17, w=length*.23*Math.sin(i*.63);
      path(g,'M0 '+y+'Q'+(-w*.7)+' '+(y-3)+' '+(-w)+' '+(y-length*.1)+'M0 '+y+'Q'+(w*.8)+' '+(y-3)+' '+w+' '+(y-length*.1),'none','#becd9b',.24);
    }
    return g;
  }
  function flower(parent, x, y, size, palette, kind = 'pink', angle = 0) {
    const root = group(parent, x, y, angle);
    if (kind === 'daisy') {
      for(let i=0;i<13;i++) {
        const petal = group(root,0,0,i*360/13);
        path(petal,'M-2 2C'+(-size*.34)+' '+(-size*.4)+' '+(-size*.24)+' '+(-size)+' 0 '+(-size)+'C'+(size*.25)+' '+(-size)+' '+(size*.33)+' '+(-size*.35)+' 2 2Z',palette.cream,'#e2ca99',.4);
        path(petal,'M0 -3V'+(-size*.83),'none','#fff7dd',.4);
      }
      svg('circle',{r:size*.25,fill:'#9c743d'},root);
      for(let i=0;i<24;i++) {
        const r=Math.sqrt(i/24)*size*.23;
        svg('circle',{cx:Math.cos(i*2.4)*r,cy:Math.sin(i*2.4)*r,r:size*.035,fill:'#f5d389'},root);
      }
    } else {
      [[9,1,0],[7,.7,19],[5,.43,-15]].forEach(([count,scale,rotation],layer) => {
        const ring=group(root,0,0,rotation,scale);
        const tier=svg('g',{class:'petal-tier'},ring);
        tier.style.setProperty('--tier',layer);
        for(let i=0;i<count;i++) {
          const petal=group(tier,0,0,i*360/count);
          const s=size*(1+Math.sin(i*2.3+layer)*.08);
          path(petal,'M-3 6C'+(-s*.65)+' '+(s*.1)+' '+(-s*.78)+' '+(-s*.56)+' '+(-s*.42)+' '+(-s*.86)+'Q'+(-s*.13)+' '+(-s*1.1)+' '+(s*.04)+' '+(-s*.91)+'Q'+(s*.45)+' '+(-s*1.07)+' '+(s*.64)+' '+(-s*.63)+'C'+(s*.8)+' '+(-s*.22)+' '+(s*.24)+' '+(s*.17)+' -3 6Z',palette[kind]||palette.pink,kind==='rose'?'#af6e7b':'#d39f99',.45);
          path(petal,'M-2 1Q'+(-s*.33)+' '+(-s*.36)+' '+(-s*.19)+' '+(-s*.72),'none',kind==='rose'?'#f0c3b5':'#fff0db',.65);
          path(petal,'M2 1Q'+(s*.3)+' '+(-s*.3)+' '+(s*.35)+' '+(-s*.6),'none','#b273791c',.5);
        }
      });
      svg('circle',{r:size*.11,fill:'#c5a16a'},root);
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        svg('circle',{cx:Math.cos(a)*size*.14,cy:Math.sin(a)*size*.14,r:1.1,fill:'#ffe7ad'},root);
      }
    }
    return root;
  }
  function sprig(parent, d, palette, {heroAnimation=false, delay=0, spacing=36, size=45, shade=false}={}) {
    const stem=path(parent,d,'none',shade?'#52785b':'#a9b981',1.2);
    stem.setAttribute('pathLength',1);
    if(heroAnimation){stem.classList.add('hero-stem');stem.style.setProperty('--delay',delay+'s')}
    const length=stem.getTotalLength();
    for(let distance=20,index=0;distance<length-12;distance+=spacing,index++) {
      const point=stem.getPointAtLength(distance);
      const next=stem.getPointAtLength(Math.min(length,distance+2));
      const tangent=Math.atan2(next.y-point.y,next.x-point.x)*180/Math.PI;
      const angle=tangent+90+(index%2?48:-48);
      const g=animatedGroup(parent,point.x,point.y,0,delay+distance/length*1.7,heroAnimation);
      leaf(g.content,0,0,size*(.65+Math.sin(index*2.1)*.1),angle,palette,shade||index%3===0);
      if(index%3===0)leaf(g.content,0,3,size*.4,tangent+90+(index%2?-48:48),palette,true);
    }
    return stem;
  }
  const heroPalette = definitions(hero,'hero');
  function drawHero() {
    path(hero,'M350 740C105 642 95 430 140 250C169 130 264 72 350 53C436 72 531 130 560 250C605 430 595 642 350 740','none','#d2b67835',.8);
    path(hero,'M350 725C125 620 112 430 155 255C184 143 270 90 350 71C430 90 516 143 545 255C588 430 575 620 350 725','none','#d2b67818',.6);
    sprig(hero,'M345 705C200 671 106 578 121 460C138 347 97 249 191 144',heroPalette,{heroAnimation:true,spacing:29,size:61,shade:true});
    sprig(hero,'M359 703C497 655 595 566 576 451C560 339 608 246 509 138',heroPalette,{heroAnimation:true,delay:.15,spacing:30,size:60,shade:true});
    sprig(hero,'M325 688C234 619 161 626 166 538C170 463 149 421 159 361',heroPalette,{heroAnimation:true,delay:.2,spacing:31,size:57});
    sprig(hero,'M374 690C449 615 536 634 533 546C530 466 551 421 542 371',heroPalette,{heroAnimation:true,delay:.35,spacing:31,size:54});
    sprig(hero,'M190 163Q243 102 290 131',heroPalette,{heroAnimation:true,delay:.4,spacing:26,size:36});
    sprig(hero,'M506 164Q452 107 410 131',heroPalette,{heroAnimation:true,delay:.5,spacing:26,size:37});
    sprig(hero,'M248 637Q291 570 324 589',heroPalette,{heroAnimation:true,delay:.35,spacing:22,size:35});
    sprig(hero,'M460 621Q416 569 386 590',heroPalette,{heroAnimation:true,delay:.6,spacing:22,size:35});
    const flowers=[
      [176,545,45,'rose',-25,.5],[208,594,57,'pink',8,.75],[267,637,39,'cream',-15,1.1],
      [146,489,27,'daisy',8,.9],[521,551,47,'pink',12,.7],[479,605,57,'rose',-8,.95],
      [425,641,35,'cream',5,1.25],[556,492,28,'daisy',0,1.1],
      [209,155,30,'pink',-7,.8],[250,130,18,'daisy',11,1.3],
      [490,161,29,'rose',15,1],[450,137,18,'daisy',-9,1.5]
    ];
    flowers.forEach(([x,y,s,kind,a,delay])=>{
      const g=animatedGroup(hero,x,y,0,delay,true);
      g.content.classList.add('sway');
      flower(g.content,0,0,s,heroPalette,kind,a);
    });
    for(let i=0;i<23;i++) {
      const a=i*2.4, x=350+Math.cos(a)*(205+Math.sin(i)*18), y=390+Math.sin(a)*286;
      const dot=svg('circle',{cx:x,cy:y,r:i%3?1:2,fill:'#e6ca91',opacity:.55},hero);
      dot.style.animation='star-breathe '+(3+i%4)+'s '+(-i*.4)+'s ease-in-out infinite';
    }
  }

  function addCard(entry,index) {
    const article=node('article','note',notesRoot);
    article.dataset.index=index;
    node('div','note-aura',article);
    const shell=node('div','note-shell',article);
    node('div','note-back',shell);
    const paper=node('div','note-paper',shell);
    node('div','paper-light',paper);
    node('span','note-number',paper,String(index+1).padStart(2,'0')).setAttribute('aria-hidden','true');
    for(const corner of ['top','bottom']) {
      const ornament=svg('svg',{viewBox:'0 0 50 50',class:'note-corner corner-'+corner,'aria-hidden':'true'},paper);
      path(ornament,'M5 43V5H43M10 30V10H30M5 21Q20 20 21 5M9 18Q16 16 18 9','none','#a88c59',.7);
      svg('circle',{cx:5,cy:5,r:2,fill:'#a88c59'},ornament);
    }
    const title=typeof entry?.title==='string'?entry.title.trim():'';
    const text=typeof entry?.text==='string'?entry.text.trim():'';
    if(title)node('h2','',paper,title);
    node('p',text||title?'':'placeholder',paper,text||(!title?'Your words go here.':''));
    const foot=svg('svg',{viewBox:'0 0 50 24',class:'note-foot','aria-hidden':'true'},paper);
    path(foot,'M3 12H16M34 12H47M25 17C10 8 20 2 25 9C30 2 40 8 25 17Z','none','#a28956',.8);
    const decoration=svg('svg',{viewBox:'0 0 120 150',class:'note-decoration','aria-hidden':'true'},paper);
    const botanical=svg('svg',{viewBox:'0 0 150 190',class:'card-botanical','aria-hidden':'true'},shell);
    const palette=definitions(botanical,'card'+index);
    sprig(decoration,'M60 155Q20 86 73 18',palette,{size:35,spacing:24});
    sprig(botanical,'M82 183Q46 111 101 20',palette,{size:40,spacing:24});
    leaf(botanical,72,130,55,-65,palette);
    leaf(botanical,73,127,45,40,palette,true);
    flower(botanical,73,111,30,palette,index%2?'rose':'pink',index*17);
    flower(botanical,94,58,19,palette,'daisy',index*9);
    const seal=node('div','note-seal',shell);
    seal.setAttribute('aria-hidden','true');
    const medallion=svg('svg',{viewBox:'0 0 60 60'},seal);
    let edge='';
    for(let i=0;i<40;i++) {
      const a=i*Math.PI/20, r=i%2?26:28;
      edge+=(i?'L':'M')+(30+Math.cos(a)*r)+' '+(30+Math.sin(a)*r);
    }
    path(medallion,edge+'Z',palette.wax,'#ecd49b',.7);
    svg('circle',{cx:30,cy:30,r:21,fill:'none',stroke:'#684d2a','stroke-width':.7,opacity:.55},medallion);
    svg('circle',{cx:30,cy:30,r:19,fill:'none',stroke:'#f9dfa0','stroke-width':.7,opacity:.6},medallion);
    path(medallion,'M30 39C8 25 22 14 30 25C38 14 52 25 30 39Z','none','#6a4c2c',1.2);
    path(medallion,'M30 40C8 26 22 15 30 26C38 15 52 26 30 40Z','none','#f2d499',.55);
    article.addEventListener('pointermove',event=>{
      if(!finePointer.matches||reduced.matches)return;
      const r=article.getBoundingClientRect();
      shell.style.setProperty('--rx',(-(event.clientY-r.top-r.height/2)/r.height*9)+'deg');
      shell.style.setProperty('--ry',((event.clientX-r.left-r.width/2)/r.width*9)+'deg');
    });
    article.addEventListener('pointerleave',()=>{
      shell.style.setProperty('--rx','0deg');shell.style.setProperty('--ry','0deg');
    });
  }
  function drawEnding() {
    const ending=document.getElementById('ending-art');
    const palette=definitions(ending,'ending');
    sprig(ending,'M200 215C130 199 80 140 119 86Q143 58 169 91',palette,{spacing:23,size:35});
    sprig(ending,'M200 215C270 199 320 140 281 86Q257 58 231 91',palette,{spacing:23,size:35});
    flower(ending,118,100,27,palette,'rose');
    flower(ending,281,100,27,palette,'pink');
    flower(ending,146,174,17,palette,'daisy');
    flower(ending,254,174,17,palette,'daisy');
    path(ending,'M200 165C125 118 166 71 200 113C234 71 275 118 200 165Z','none','#dbc08c',1.1);
    path(ending,'M200 230V261M195 255L200 265L205 255','none','#d4b987',.8);
  }

  function buildVine() {
    const oldProgress=vineLength?drawnLength/vineLength:0;
    vine.replaceChildren();vineDetails=[];
    const palette=definitions(vine,'vine');
    const width=section.clientWidth;
    sectionHeight=section.offsetHeight;
    sectionTop=section.getBoundingClientRect().top+scrollY;
    vine.setAttribute('viewBox','0 0 '+width+' '+sectionHeight);
    const mobile=width<=700;
    const anchors=[...notesRoot.children].map((card,i)=>({
      x:Math.max(24,Math.min(width-24,i%2?card.offsetLeft+card.offsetWidth+17:card.offsetLeft-17)),
      y:card.offsetTop+35
    }));
    const points=[{x:width/2,y:-65},...anchors,{x:width/2,y:sectionHeight-45}];
    let d='M'+points[0].x+' '+points[0].y;
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i],dy=b.y-a.y;
      d+='C'+a.x+' '+(a.y+dy*.53)+' '+b.x+' '+(b.y-dy*.52)+' '+b.x+' '+b.y;
    }
    path(vine,d,'none','#a1bb7612',6);
    const trunk=path(vine,d,'none','#61885c',3.1);
    trunk.setAttribute('pathLength',1);trunk.setAttribute('class','vine-line vine-progress');
    const gold=path(vine,d,'none','#d8c38d',.65);
    gold.setAttribute('pathLength',1);gold.setAttribute('class','vine-line vine-progress');
    vinePath=trunk;vineLength=trunk.getTotalLength();
    for(let distance=25,i=0;distance<vineLength-30;distance+=mobile?40:38,i++) {
      const point=trunk.getPointAtLength(distance),next=trunk.getPointAtLength(Math.min(vineLength,distance+2));
      const tangent=Math.atan2(next.y-point.y,next.x-point.x)*180/Math.PI;
      const position=svg('g',{class:'vine-detail',transform:'translate('+point.x+' '+point.y+')'},vine);
      const growth=svg('g',{class:'growth'},position);
      const size=(mobile?35:44)*(1+Math.sin(i*2.1)*.18);
      leaf(growth,0,0,size,tangent+90+(i%2?54:-54),palette,i%3===0);
      if(i%4===0)leaf(growth,0,2,size*.65,tangent+90+(i%2?-49:49),palette,true);
      if(i%13===5)flower(growth,0,-4,mobile?12:15,palette,'daisy',i*7);
      vineDetails.push({el:position,distance});
    }
    anchors.forEach((anchor,i)=>{
      const position=svg('g',{class:'vine-detail',transform:'translate('+anchor.x+' '+anchor.y+')'},vine);
      const growth=svg('g',{class:'growth'},position);
      flower(growth,0,0,mobile?24:32,palette,i%2?'pink':'rose',i*13);
      flower(growth,i%2?-19:19,-27,12,palette,'daisy');
      let low=0,high=vineLength;
      for(let n=0;n<14;n++){const m=(low+high)/2;if(trunk.getPointAtLength(m).y<anchor.y)low=m;else high=m}
      vineDetails.push({el:position,distance:low});
    });
    tip=svg('circle',{r:3.3,class:'vine-tip'},vine);
    drawnLength=oldProgress*vineLength;
    desiredLength=drawnLength;
    updateTarget();
  }
  function updateTarget() {
    measureFrame=0;
    if(!vinePath)return;
    const visibleY=scrollY+innerHeight*.85-sectionTop;
    const atBottom=scrollY+innerHeight>=document.documentElement.scrollHeight-8;
    if(reduced.matches||atBottom)desiredLength=vineLength;
    else {
      let low=0,high=vineLength;
      for(let i=0;i<14;i++){
        const mid=(low+high)/2;
        if(vinePath.getPointAtLength(mid).y<visibleY)low=mid;else high=mid;
      }
      desiredLength=Math.max(desiredLength,low);
    }
    if(!drawingFrame)drawingFrame=requestAnimationFrame(animateVine);
  }
  function animateVine() {
    drawingFrame=0;
    if(document.hidden)return;
    const delta=desiredLength-drawnLength;
    drawnLength=reduced.matches||delta<.35?desiredLength:drawnLength+delta*.065;
    vine.style.setProperty('--progress',vineLength?drawnLength/vineLength:1);
    for(const item of vineDetails)if(item.distance<drawnLength+5)item.el.classList.add('is-visible');
    const point=vinePath.getPointAtLength(drawnLength);
    tip.setAttribute('cx',point.x);tip.setAttribute('cy',point.y);
    tip.style.opacity=reduced.matches||drawnLength<2||drawnLength>=vineLength-2?'0':'1';
    if(desiredLength-drawnLength>.35)drawingFrame=requestAnimationFrame(animateVine);
  }
  function burst(x,y,count=10) {
    if(reduced.matches)return;
    const container=document.getElementById('petal-bursts');
    if(container.childElementCount>50)return;
    for(let i=0;i<count;i++){
      const petal=node('i','burst-petal',container);
      const angle=i/count*Math.PI*2;
      const radius=50+Math.random()*90;
      petal.style.left=x+'px';petal.style.top=y+'px';
      petal.style.setProperty('--dx',Math.cos(angle)*radius+'px');
      petal.style.setProperty('--dy',(Math.sin(angle)*radius-30)+'px');
      petal.style.setProperty('--spin',(Math.random()*360-180)+'deg');
      petal.style.animationDelay=i*.018+'s';
      petal.addEventListener('animationend',()=>petal.remove(),{once:true});
    }
  }
  // A tap is decorative only: reading never depends on finding an interaction.
  let pointerStart=null;
  addEventListener('pointerdown',event=>{if(event.isPrimary)pointerStart={x:event.clientX,y:event.clientY,time:performance.now()}},{passive:true});
  addEventListener('pointercancel',()=>{pointerStart=null},{passive:true});
  addEventListener('pointerup',event=>{
    if(pointerStart&&performance.now()-pointerStart.time<500&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)<12)burst(event.clientX,event.clientY);
    pointerStart=null;
  },{passive:true});

  const canvas=document.getElementById('fireflies');
  const context=canvas.getContext('2d');
  let motes=[],width=0,height=0,ambientFrame=0,lastFrame=0;
  function resizeAtmosphere(){
    if(!context)return;
    width=innerWidth;height=innerHeight;
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    motes=Array.from({length:width<700?27:45},(_,i)=>({x:Math.random()*width,y:Math.random()*height,phase:Math.random()*Math.PI*2,speed:8+Math.random()*13,size:i%6===0?4+Math.random()*3:1+Math.random()*1.4,petal:i%6===0}));
  }
  function animateAtmosphere(time){
    ambientFrame=0;
    if(reduced.matches||document.hidden||!context)return;
    ambientFrame=requestAnimationFrame(animateAtmosphere);
    if(time-lastFrame<32)return; // Cap ambient drawing at 30 fps on phones.
    const step=Math.min((time-lastFrame)/1000,.05);lastFrame=time;
    context.clearRect(0,0,width,height);
    for(const mote of motes){
      mote.y+=step*mote.speed*(mote.petal?1:-.45);
      mote.x+=Math.sin(time*.00035+mote.phase)*step*8;
      if(mote.y>height+15)mote.y=-15;
      if(mote.y<-15)mote.y=height+15;
      const glow=.25+(Math.sin(time*.001+mote.phase)+1)*.22;
      context.save();context.translate(mote.x,mote.y);
      if(mote.petal){
        context.rotate(time*.0003+mote.phase);context.scale(Math.cos(time*.0006+mote.phase)*.4+.6,1);
        context.fillStyle='rgba(231,168,157,'+(glow*.55)+')';
        context.beginPath();context.ellipse(0,0,mote.size*.55,mote.size,Math.PI/4,0,Math.PI*2);context.fill();
      }else{
        const gradient=context.createRadialGradient(0,0,0,0,0,mote.size*5);
        gradient.addColorStop(0,'rgba(248,224,157,'+glow+')');
        gradient.addColorStop(.23,'rgba(229,208,138,'+(glow*.45)+')');
        gradient.addColorStop(1,'rgba(229,208,138,0)');
        context.fillStyle=gradient;context.fillRect(-mote.size*5,-mote.size*5,mote.size*10,mote.size*10);
      }
      context.restore();
    }
  }
  function syncMotion(){
    if(reduced.matches||document.hidden){
      cancelAnimationFrame(ambientFrame);ambientFrame=0;
      cancelAnimationFrame(drawingFrame);drawingFrame=0;
      if(reduced.matches&&context)context.clearRect(0,0,width,height);
    }else{
      if(!ambientFrame){lastFrame=performance.now();ambientFrame=requestAnimationFrame(animateAtmosphere)}
      updateTarget();
    }
    if(reduced.matches)updateTarget();
  }

  const data=Array.isArray(window.LOVE_NOTES)?window.LOVE_NOTES:[];
  data.forEach(addCard);
  drawHero();drawEnding();
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  },{threshold:.12,rootMargin:'0px 0px -35px 0px'});
  document.querySelectorAll('.note,.garden-ending').forEach(card=>observer.observe(card));
  new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('is-offscreen',!entry.isIntersecting));
  },{rootMargin:'100px'}).observe(document.querySelector('.introduction'));
  document.body.classList.add('garden-ready');
  document.fonts.ready.then(()=>{buildVine();resizeAtmosphere();syncMotion()});
  const resize=new ResizeObserver(()=>{
    clearTimeout(resizeTimer);resizeTimer=setTimeout(buildVine,180);
  });
  resize.observe(notesRoot);
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{buildVine();resizeAtmosphere()},180)});
  addEventListener('scroll',()=>{if(!measureFrame)measureFrame=requestAnimationFrame(updateTarget)},{passive:true});
  document.addEventListener('visibilitychange',syncMotion);
  reduced.addEventListener('change',syncMotion);
})();
