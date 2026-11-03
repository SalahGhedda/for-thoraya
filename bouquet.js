(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const layers = Object.fromEntries(['paper-back','stems','foliage','flowers','paper-front','ribbon'].map(id => [id, document.getElementById(id)]));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pauseButton = document.getElementById('pause');
  let drawingEnd = 0;
  let elapsed = 0;
  let previous = null;
  let frame;
  let paused = false;
  let finished = false;

  function group(parent,x=0,y=0,angle=0,scale=1) {
    const g=document.createElementNS(NS,'g');
    g.setAttribute('transform',`translate(${x} ${y}) rotate(${angle}) scale(${scale})`);
    parent.append(g);
    return g;
  }
  function path(parent,d,{fill='none',stroke='#6a886d',width=1,delay=0,duration=1.4,opacity=1,wash=1.2}={}) {
    const p=document.createElementNS(NS,'path');
    for(const [k,v] of Object.entries({d,fill,stroke,'stroke-width':width,class:'ink'}))p.setAttribute(k,v);
    parent.append(p);
    p.style.setProperty('--length',Math.ceil(p.getTotalLength())+2);
    p.style.setProperty('--delay',`${delay}s`);
    p.style.setProperty('--duration',`${duration}s`);
    p.style.setProperty('--wash-duration',`${wash}s`);
    p.style.setProperty('--opacity',opacity);
    drawingEnd=Math.max(drawingEnd,delay+duration,fill==='none'?0:delay+duration*.55+wash);
    return p;
  }
  function dot(parent,x,y,r,options) {
    return path(parent,`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0`,options);
  }

  // The flared back sheets frame the flowers before the front is folded over.
  path(layers['paper-back'],'M109 278L54 334Q144 441 225 592L311 703L393 516L473 343L432 247L360 307L293 254L212 312Z',{fill:'url(#back-paper)',stroke:'#c9aba6',width:1.2,delay:.1,duration:2.4});
  path(layers['paper-back'],'M348 364L488 290L548 346Q452 462 377 625L316 711L286 522Z',{fill:'url(#rose-paper)',stroke:'#bc919e',width:1.1,delay:.35,duration:2.1});
  path(layers['paper-back'],'M117 309L73 337L221 523L296 659L237 438Z',{fill:'url(#fold)',stroke:'#d1b3a8',width:.9,delay:.6,duration:1.7});
  path(layers['paper-back'],'M57 337Q159 456 230 591M490 296L538 346Q439 474 378 614',{stroke:'#c09c6b',width:1.3,delay:1.2,duration:1.8});
  path(layers['paper-back'],'M63 337Q163 458 235 590M491 302L532 346Q434 475 375 608',{stroke:'#e5cda5',width:.65,delay:1.45,duration:1.8});

  // Stems taper into the wrapping; only their tips show below the paper.
  [[191,188],[325,135],[394,246],[265,291],[155,307],[447,175],[214,110],[292,84],[104,246],[486,281],[335,218],[351,366]].forEach(([x,y],i)=>{
    path(layers.stems,`M${288+i*2.3} ${737+Math.sin(i)*6}C${310+i*2} 600 ${x+30} 405 ${x} ${y}`,{stroke:['#6c8465','#839574','#597b65'][i%3],width:1.5,delay:.65+i*.075,duration:2.3});
  });
  function leaf(parent,x,y,size,angle,delay,round=false) {
    const g=group(parent,x,y,angle);
    const d=round?`M0 0C${-size*.9} ${-size*.2} ${-size} ${-size*1.3} ${-size*.05} ${-size*1.28}C${size*.9} ${-size*1.3} ${size*.85} ${-size*.25} 0 0Z`:`M0 0C${-size*.75} ${-size*.5} ${-size*.4} ${-size*1.3} ${size*.18} ${-size*1.8}C${size*.15} ${-size*1.16} ${size*.96} ${-size*.6} 0 0Z`;
    path(g,d,{fill:`url(#${round?'eucalyptus':'leaf'})`,stroke:round?'#7a9d8d':'#587d66',width:.85,delay,duration:1.1,opacity:.96});
    path(g,`M0 0Q${size*.02} ${-size*.7} ${size*(round?.04:.18)} ${-size*(round?1.15:1.65)}`,{stroke:round?'#719789':'#d2d6ad',width:.65,delay:delay+.35,duration:.9});
    if(!round)path(g,`M0 ${-size*.4}L${-size*.25} ${-size*.76}M${size*.03} ${-size*.68}L${size*.35} ${-size*.98}M${size*.06} ${-size*.94}L${-size*.13} ${-size*1.2}`,{stroke:'#b8c5a1',width:.42,delay:delay+.55,duration:.8});
  }
  [
    [170,365,34,-75],[138,322,32,-76],[110,277,25,-61],[106,221,27,-38],[130,178,32,-45],[171,145,29,-37],
    [241,147,30,-23],[267,120,29,-13],[342,122,30,13],[385,137,32,37],[452,170,29,54],[483,218,29,63],
    [481,305,31,74],[442,361,33,64],[392,398,31,68],[250,397,29,-51],[206,348,26,-14],[354,300,27,29],
    [301,240,32,-27],[401,230,30,35],[184,250,27,-55],[462,332,26,85],[295,421,29,-28],[337,423,32,44]
  ].forEach(([x,y,s,a],i)=>leaf(layers.foliage,x,y,s,a,1.15+i*.065));

  function eucalyptus(points,delay) {
    const [start,...rest]=points;
    path(layers.stems,`M${start[0]} ${start[1]}${rest.map(p=>`L${p[0]} ${p[1]}`).join('')}`,{stroke:'#829e86',width:1.15,delay,duration:2});
    points.slice(1).forEach(([x,y],i)=>leaf(layers.foliage,x,y,23-i*1.8,i%2?-55:48,delay+.3+i*.13,true));
  }
  eucalyptus([[208,371],[146,297],[101,239],[95,193],[113,152],[138,117],[157,90]],1.5);
  eucalyptus([[398,371],[464,316],[501,260],[513,216],[501,168],[476,132],[458,95]],1.7);
  eucalyptus([[304,229],[300,168],[283,125],[259,86],[245,58]],1.8);

  function fern(x,y,angle,scale,delay) {
    const g=group(layers.foliage,x,y,angle,scale);
    path(g,'M0 105Q-6 39 0-28',{stroke:'#79916f',width:1,delay,duration:1.6});
    for(let i=0;i<10;i++) {
      const yy=83-i*11,ss=21-i*1.5;
      [-1,1].forEach(side=>path(g,`M0 ${yy}Q${side*ss} ${yy-4} ${side*ss*1.17} ${yy-23}Q${side*ss*.2} ${yy-14} 0 ${yy}Z`,{stroke:'#819775',fill:'#98ae83',width:.6,delay:delay+.4+i*.06,duration:.8}));
    }
  }
  fern(98,316,-53,.87,2.1);
  fern(458,318,52,.9,2.2);
  fern(368,105,12,.7,2.25);

  function lavender(x,y,angle,scale,delay) {
    const g=group(layers.flowers,x,y,angle,scale);
    path(g,'M0 95Q-3 25 0-36',{stroke:'#7d9073',width:1,delay,duration:1.6});
    for(let i=0;i<11;i++) {
      const yy=40-i*7,ss=10-i*.6;
      [-1,1].forEach(side=>path(g,`M0 ${yy+6}C${side*ss*2} ${yy+3} ${side*ss*1.6} ${yy-12} ${side*ss*.4} ${yy-6}Q0 ${yy-1} 0 ${yy+6}Z`,{stroke:'#8c769d',fill:i%3?'#c4b0d3':'#a78fbf',width:.65,delay:delay+.4+i*.055,duration:.7}));
    }
  }
  lavender(167,83,-24,.86,2.7);
  lavender(193,75,-7,.7,2.8);
  lavender(424,89,21,.92,2.9);
  lavender(446,120,34,.76,3);

  const palettes={coral:['#b86e77','#ffe3ce'],wine:['#963d61','#efb8c1'],pink:['#bc829b','#fff0e9'],cream:['#c4a397','#fffdf4'],apricot:['#ca9870','#fff0ce']};
  function rose(x,y,r,angle,delay,color='coral',ruffled=false) {
    const g=group(layers.flowers,x,y,angle);
    const [stroke,highlight]=palettes[color];
    const rings=ruffled?[[9,1],[8,.75],[7,.52],[5,.31],[4,.15]]:[[6,1],[6,.76],[5,.53],[4,.32],[3,.16]];
    rings.forEach(([count,mult],ring)=>{
      for(let i=0;i<count;i++) {
        const rr=r*mult*(1+Math.sin(i*3.7+ring*5)*.09);
        const p=group(g,Math.sin(i*2.1+ring)*r*.035,Math.cos(i*2.8)*r*.025,i*360/count+ring*29+Math.sin(i)*7);
        const top=ruffled
          ?`C${-rr*.75} ${-rr*.72} ${-rr*.7} ${-rr*.97} ${-rr*.47} ${-rr*.88}Q${-rr*.35} ${-rr*1.14} ${-rr*.16} ${-rr*.96}Q${rr*.06} ${-rr*1.15} ${rr*.2} ${-rr*.95}Q${rr*.45} ${-rr*1.09} ${rr*.57} ${-rr*.86}Q${rr*.8} ${-rr*.92} ${rr*.79} ${-rr*.57}`
          :`C${-rr*.73} ${-rr*.92} ${-rr*.29} ${-rr*1.12} ${rr*.03} ${-rr*.94}C${rr*.37} ${-rr*1.05} ${rr*.82} ${-rr*.88} ${rr*.79} ${-rr*.57}`;
        const d=`M${-rr*.14} ${rr*.22}C${-rr*.59} ${rr*.24} ${-rr*1.02} ${-rr*.29} ${-rr*.75} ${-rr*.64}${top}C${rr*.9} ${-rr*.13} ${rr*.33} ${rr*.22} ${-rr*.14} ${rr*.22}Z`;
        const dd=delay+ring*.32+i*.055;
        path(p,d,{fill:`url(#${color})`,stroke,width:ring?.8:1.05,delay:dd,duration:1.2});
        path(p,`M${-rr*.55} ${-rr*.65}Q${-rr*.29} ${-rr*.89} ${rr*.02} ${-rr*.79}Q${rr*.4} ${-rr*.91} ${rr*.59} ${-rr*.62}`,{stroke:highlight,width:ruffled?.9:.8,delay:dd+.35,duration:.85,opacity:.6});
        if(ruffled&&ring<2)path(p,`M${-rr*.35} ${-rr*.68}Q${-rr*.16} ${-rr*.43} ${-rr*.1} ${-rr*.2}M${rr*.32} ${-rr*.72}Q${rr*.15} ${-rr*.42} ${rr*.07} ${-rr*.2}`,{stroke,width:.45,delay:dd+.6,duration:.7});
      }
    });
    path(g,'M-4 2C-10-6 4-12 8-4C13 4-4 8-5 1Q-5-5 3-2',{stroke,width:1,delay:delay+2,duration:1.1});
  }

  function lily(x,y,r,angle,delay) {
    const g=group(layers.flowers,x,y,angle);
    [0,120,240,60,180,300].forEach((angle,i)=>{
      const p=group(g,0,0,angle);
      path(p,`M0 7C${-r*.2} ${-r*.12} ${-r*.6} ${-r*.48} ${-r*.35} ${-r*.83}Q${-r*.25} ${-r*1.12} ${r*.12} ${-r*1.2}C${-r*.02} ${-r*.84} ${r*.38} ${-r*.71} ${r*.24} ${-r*.39}Q${r*.12} ${-r*.13} 0 7Z`,{fill:'url(#lily)',stroke:'#bf9b9e',width:.95,delay:delay+i*.12,duration:1.4});
      path(p,`M0 0Q${-r*.08} ${-r*.51} ${r*.08} ${-r*1.08}`,{stroke:'#d4a8b2',width:.7,delay:delay+.6+i*.1,duration:1});
      for(let j=0;j<6;j++)dot(p,Math.sin(j*3)*r*.09,-r*(.15+j*.055),.65,{fill:'#b6758b',stroke:'none',delay:delay+1+i*.08,duration:.3});
    });
    for(let i=0;i<6;i++) {
      const a=i*1.05,xx=Math.cos(a)*20,yy=Math.sin(a)*15-9;
      path(g,`M0 4Q${xx*.7} ${yy*.3-8} ${xx} ${yy}`,{stroke:'#9a9a63',width:1,delay:delay+1.6+i*.04,duration:.7});
      path(g,`M${xx-2} ${yy-2}q5-4 6 1q-2 5-6-1`,{stroke:'#987747',fill:'#b69a60',width:.8,delay:delay+2+i*.04,duration:.5});
    }
  }
  function tulip(x,y,angle,delay) {
    const g=group(layers.flowers,x,y,angle);
    path(g,'M0 40C-33 26-35-6-20-22Q-10-16-2-20Q12-31 24-22C39 2 31 31 0 40Z',{stroke:'#c2858b',fill:'url(#coral)',width:1,delay,duration:1.4});
    path(g,'M0 40C-22 20-19-9-21-22Q1-16 9 5Q17 25 0 40Z',{stroke:'#c2858b',fill:'url(#pink)',width:.85,delay:delay+.3,duration:1.2});
    path(g,'M0 40Q-2 15 24-22Q41 8 16 31Z',{stroke:'#c2858b',fill:'url(#coral)',width:.85,delay:delay+.5,duration:1.2});
    path(g,'M-5 31Q-17 14-16-10M6 29Q13 10 21-10',{stroke:'#f9d2cc',width:.8,delay:delay+1,duration:.8});
  }
  function daisy(x,y,r,angle,delay) {
    const g=group(layers.flowers,x,y,angle);
    for(let i=0;i<12;i++) {
      const p=group(g,0,0,i*30);
      const rr=r*(1+Math.sin(i*4)*.07);
      path(p,`M-3-3C-6-12-11 ${-rr*.85}-4 ${-rr}C4 ${-rr*1.1} 9 ${-rr*.88} 6 ${-rr*.66}L3-3Z`,{stroke:'#c8b996',fill:'url(#cream)',width:.7,delay:delay+i*.045,duration:.9});
      path(p,`M0-8L1 ${-rr*.8}`,{stroke:'#e1cfb2',width:.45,delay:delay+.4+i*.045,duration:.6});
    }
    dot(g,0,0,r*.23,{stroke:'#b08e4a',fill:'#dfbd68',width:.8,delay:delay+.8,duration:.7});
    for(let i=0;i<16;i++)dot(g,Math.cos(i*2.4)*Math.sqrt(i)*r*.045,Math.sin(i*2.4)*Math.sqrt(i)*r*.045,.65,{stroke:'#9c7c43',fill:'#ac8d48',width:.3,delay:delay+1.15,duration:.4});
  }
  function hydrangea(x,y,r,delay) {
    const g=group(layers.flowers,x,y);
    for(let i=0;i<18;i++) {
      const a=i*2.4,rr=Math.sqrt(i/18)*r;
      const f=group(g,Math.cos(a)*rr,Math.sin(a)*rr,Math.sin(i)*35);
      for(let j=0;j<4;j++) {
        const p=group(f,0,0,j*90);
        path(p,'M0 1C-10-1-13-10-6-13Q0-17 5-11Q10-3 0 1Z',{stroke:'#839eb8',fill:'url(#blue)',width:.7,delay:delay+i*.035+j*.03,duration:.85});
        path(p,'M0-2L-3-10',{stroke:'#e0edf0',width:.5,delay:delay+.4+i*.035,duration:.6});
      }
      dot(f,0,0,1.6,{stroke:'#b6a77a',fill:'#ecddab',width:.5,delay:delay+.7+i*.035,duration:.5});
    }
  }

  // Back-to-front placement makes a dense, rounded crown.
  tulip(219,107,-18,3.2);
  tulip(287,72,13,3.5);
  rose(330,151,54,15,3.7,'wine');
  hydrangea(112,245,33,4);
  hydrangea(479,277,35,4.2);
  lily(431,191,52,28,4.3);
  rose(197,210,65,-18,4.6,'coral');
  daisy(331,235,29,8,4.9);
  rose(391,296,63,15,5.1,'cream',true);
  rose(165,327,46,-17,5.4,'apricot');
  rose(273,313,68,4,5.7,'pink',true);
  rose(337,395,43,-23,6.2,'coral');
  daisy(452,363,26,8,6.4);
  daisy(111,339,24,-12,6.6);

  // Tiny sprays of baby's breath soften the edges.
  [[80,278],[97,211],[143,151],[356,86],[469,147],[518,322],[410,403],[215,397]].forEach(([x,y],i)=>{
    const g=group(layers.flowers,x,y);
    for(let j=0;j<5;j++) {
      const xx=Math.cos(j*2.4)*14,yy=Math.sin(j*2.4)*16;
      path(g,`M0 26Q${xx*.5} ${yy+8} ${xx} ${yy}`,{stroke:'#93a084',width:.6,delay:5.8+i*.07,duration:1.2});
      for(let k=0;k<4;k++)dot(g,xx+Math.cos(k*1.57)*2.3,yy+Math.sin(k*1.57)*2.3,2.2,{fill:'#fffdf0',stroke:'#c4bea0',width:.5,delay:6.3+i*.07+j*.04,duration:.7});
    }
  });

  // Broad visible panels, curled edges, seams, and fine gold trim.
  const front=layers['paper-front'];
  path(front,'M101 378Q144 409 208 421Q246 447 284 479L339 696Q314 723 278 717Q231 594 174 501Z',{fill:'url(#rose-paper)',stroke:'#b9929d',width:1.15,delay:8.1,duration:2.1});
  path(front,'M101 378Q137 429 164 493Q202 539 231 587L208 421Q146 408 101 378Z',{fill:'url(#fold)',stroke:'#c7a49e',width:.95,delay:8.3,duration:1.8});
  path(front,'M497 371Q448 418 377 444Q317 481 273 559Q300 634 322 720L365 712Q395 592 439 499Z',{fill:'url(#ivory-paper)',stroke:'#c7aca0',width:1.2,delay:8.5,duration:2.2});
  path(front,'M497 371Q470 425 438 499Q417 537 391 577L377 444Q446 420 497 371Z',{fill:'url(#fold)',stroke:'#cfb7a6',width:.95,delay:8.7,duration:1.8});
  path(front,'M208 421Q234 498 284 582L321 716M377 444Q363 520 321 581L357 710',{stroke:'#b68d97',width:.8,delay:9.15,duration:1.7});
  path(front,'M105 385Q148 421 204 428M494 379Q443 426 381 451',{stroke:'#b59a67',width:1.65,delay:9.2,duration:1.5});
  path(front,'M110 392Q149 428 201 434M488 389Q439 433 384 458',{stroke:'#e3c89b',width:.65,delay:9.4,duration:1.4});
  path(front,'M175 497Q224 591 272 694M440 494Q389 590 368 695M218 450Q232 509 258 550M366 470Q355 521 334 553',{stroke:'#fff6e9',width:1.25,delay:9.6,duration:1.2});

  // A satin bow anchors the wrapping, with curved loops and long tails.
  const bow=group(layers.ribbon,309,580,-6);
  const satin={fill:'url(#satin)',stroke:'#93475f',width:1.1,duration:1.5};
  path(bow,'M-9 2C-22 43-29 88-65 125L-66 105L-89 107C-51 70-47 36-29 0Z',{...satin,fill:'url(#satin-tail)',delay:10.4});
  path(bow,'M8 5C36 38 20 87 54 141L61 120L84 127C48 82 65 36 28-1Z',{...satin,fill:'url(#satin-tail)',delay:10.55});
  path(bow,'M-6-2C-37-46-106-52-108-22C-111 13-55 28-5 10Z',{...satin,delay:10.8});
  path(bow,'M6-2C41-43 100-48 106-22C115 13 54 28 6 10Z',{...satin,delay:11});
  path(bow,'M-10 2C-48-20-90-31-101-20Q-75-8-10 8Z',{fill:'#a85472',stroke:'#9c4c6c',width:.7,delay:11.2,duration:1.2});
  path(bow,'M11 2Q73-28 99-21Q66-3 10 9Z',{fill:'#a35070',stroke:'#984768',width:.7,delay:11.35,duration:1.2});
  path(bow,'M-15-7Q0-13 14-5L18 13Q1 22-16 12Z',{...satin,delay:11.55,duration:1.1});
  path(bow,'M-26-12Q-63-35-94-29M28-12Q66-33 93-27M-27 25Q-39 74-66 101M31 29Q41 77 58 112M-7-5L-3 12',{stroke:'#efb7bd',width:1.1,delay:11.8,duration:1.1});

  // The dedication always starts after the final stroke and color wash.
  const fromDelay=drawingEnd+.35;
  const toDelay=fromDelay+1.2;
  document.documentElement.style.setProperty('--from-delay',`${fromDelay}s`);
  document.documentElement.style.setProperty('--to-delay',`${toDelay}s`);
  const totalTime=(toDelay+1.75)*1000;

  function complete() {
    finished=true;
    document.body.classList.add('finished');
    frame=null;
  }
  function tick(now) {
    if(previous!==null)elapsed+=now-previous;
    previous=now;
    if(elapsed>=totalTime){complete();return;}
    frame=requestAnimationFrame(tick);
  }
  function reset() {
    cancelAnimationFrame(frame);
    elapsed=0;previous=null;paused=false;finished=false;
    document.body.classList.remove('paused','finished');
    pauseButton.setAttribute('aria-label','Pause animation');
    pauseButton.title='Pause';
    // Collect the timeline once so every stroke restarts in the same frame.
    const animations=document.querySelector('.gift').getAnimations({subtree:true});
    animations.forEach(animation=>{animation.currentTime=0;animation.play();});
    if(motion.matches)complete();
    else frame=requestAnimationFrame(tick);
  }
  pauseButton.addEventListener('click',()=>{
    if(finished)return;
    paused=!paused;
    document.body.classList.toggle('paused',paused);
    pauseButton.setAttribute('aria-label',paused?'Resume animation':'Pause animation');
    pauseButton.title=paused?'Resume':'Pause';
    previous=null;
    if(paused)cancelAnimationFrame(frame);
    else frame=requestAnimationFrame(tick);
  });
  document.getElementById('replay').addEventListener('click',reset);
  motion.addEventListener('change',reset);
  document.body.classList.remove('preparing');
  if(motion.matches)complete();
  else frame=requestAnimationFrame(tick);
})();
