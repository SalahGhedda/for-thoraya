(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('bouquet');
  const layers = Object.fromEntries(['stems','foliage','flowers','ribbon','accents'].map(id => [id, document.getElementById(id)]));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const status = document.getElementById('status');
  const pause = document.getElementById('pause');
  const totalTime = 16500;
  let elapsed = 0;
  let previousTime = null;
  let frame = null;
  let paused = false;
  let completed = false;

  function group(parent, x, y, rotation = 0, scale = 1) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`);
    parent.append(g);
    return g;
  }

  function path(parent, d, {stroke = '#6d8163', fill = 'none', width = 1.3, delay = 0, duration = 1.8, opacity = .92} = {}) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', width);
    p.setAttribute('fill', fill);
    p.setAttribute('class', `ink${fill === 'none' ? ' line' : ''}`);
    p.style.setProperty('--delay', `${delay}s`);
    p.style.setProperty('--draw-time', `${duration}s`);
    p.style.setProperty('--wash', opacity);
    parent.append(p);
    p.style.setProperty('--length', Math.ceil(p.getTotalLength()) + 2);
    return p;
  }

  function circle(parent, x, y, r, opts) {
    return path(parent, `M ${x-r} ${y} a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0`, opts);
  }

  // Long, slightly irregular stems gather naturally beneath the ribbon.
  const stems = [
    'M332 605C358 488 309 322 263 264',
    'M356 611C341 490 380 350 386 222',
    'M345 602C375 412 332 280 330 129',
    'M325 598C350 468 437 324 446 154',
    'M366 603C356 500 453 385 474 310',
    'M347 603C322 491 239 421 216 353',
    'M336 595C352 465 474 337 526 241',
    'M363 592C328 436 226 267 198 149',
    'M354 598C376 457 466 259 510 153',
    'M341 589C303 465 195 358 144 268',
    'M346 579C374 472 504 401 559 310',
    'M340 581C316 453 222 361 180 235'
  ];
  stems.forEach((d, i) => path(layers.stems, d, {width: i < 6 ? 2.1 : 1.4, stroke: ['#758967','#8b9976','#819171'][i%3], delay:.25+i*.11, duration:2.5}));
  path(layers.stems, 'M339 601C354 500 343 406 345 335', {stroke:'#b6aa78',width:1.2,delay:1.1,duration:2});

  function leaf(x,y,size,angle,delay,kind = 'point') {
    const g = group(layers.foliage,x,y,angle);
    const round = kind === 'round';
    const d = round
      ? `M0 0C${-size*.9} ${-size*.3} ${-size*.9} ${-size*1.2} ${-size*.1} ${-size*1.25}C${size*.8} ${-size*1.4} ${size*.9} ${-size*.35} 0 0Z`
      : `M0 0C${-size*.65} ${-size*.36} ${-size*.45} ${-size*.95} ${size*.1} ${-size*1.55}C${size*.6} ${-size*.95} ${size*.7} ${-size*.3} 0 0Z`;
    path(g,d,{stroke:round?'#7d9a8c':'#73896b',fill:`url(#${round?'eucalyptus':'leaf'}-wash)`,width:1.05,delay,duration:1.3,opacity:round?.72:.84});
    path(g,`M0 0Q${size*.03} ${-size*.6} ${size*.1} ${-size*(round?1.12:1.45)}`,{stroke:round?'#759587':'#6c8364',width:.7,delay:delay+.55,duration:.9});
    if (!round) {
      path(g,`M${size*.03} ${-size*.45}L${-size*.24} ${-size*.75}M${size*.05} ${-size*.7}L${size*.32} ${-size*.99}`,{stroke:'#7f9775',width:.55,delay:delay+.8,duration:.6});
    }
  }

  [
    [328,508,42,-51],[364,483,44,48],[306,457,45,-70],[387,449,41,54],
    [284,417,35,-61],[421,414,39,68],[245,381,31,-62],[440,371,32,55],
    [283,337,35,30],[363,340,38,-40],[391,305,31,45],[329,258,28,-39],
    [323,205,24,-48],[330,186,20,41],[450,226,27,64],[454,261,28,-30],
    [215,261,25,-59],[228,290,31,48],[244,316,35,-51],[488,282,26,58],
    [483,349,30,75],[521,364,23,63],[535,348,21,-24],[548,326,18,58]
  ].forEach(([x,y,s,a],i) => leaf(x,y,s,a,1.7+i*.065));

  // Eucalyptus and airy sprigs keep the silhouette loose and botanical.
  path(layers.stems,'M286 435C232 393 181 310 161 229',{stroke:'#829b8b',delay:1.6,duration:2.2});
  [[231,375,24,-68],[218,354,24,24],[203,332,23,-63],[187,303,21,24],[174,278,19,-53],[163,251,17,20],[158,230,14,-11]].forEach(([x,y,s,a],i)=>leaf(x,y,s,a,2.1+i*.16,'round'));
  path(layers.stems,'M424 401C456 338 527 278 558 205',{stroke:'#829b8b',delay:1.7,duration:2.2});
  [[469,330,21,-22],[487,307,22,65],[507,282,20,-20],[526,254,18,63],[541,229,17,-18],[554,207,13,20]].forEach(([x,y,s,a],i)=>leaf(x,y,s,a,2.5+i*.15,'round'));

  function lavender(x,y,angle,scale,delay) {
    const g = group(layers.flowers,x,y,angle,scale);
    path(g,'M0 100Q-5 38 0-37',{stroke:'#849077',width:1.2,delay,duration:1.8});
    for(let i=0;i<10;i++) {
      const yy=39-i*7;
      const extent=10-(i*.55);
      [-1,1].forEach((side,j)=>{
        path(g,`M0 ${yy+7}C${side*extent*2} ${yy+3} ${side*extent*1.55} ${yy-12} ${side*extent*.45} ${yy-6}Q${side*2} ${yy-2} 0 ${yy+7}Z`,{stroke:'#8c7e9b',fill:i%2?'#b7a6c9':'#c7b9d4',width:.8,delay:delay+.5+i*.055+j*.04,duration:.8,opacity:.9});
      });
    }
    path(g,'M-1 68Q-21 64-23 43M0 80Q14 72 18 56',{stroke:'#839273',width:1,delay:delay+.7,duration:1});
  }
  lavender(195,168,-24,1.04,3.6);
  lavender(224,159,-9,.75,3.9);
  lavender(508,145,26,.94,4.1);
  lavender(479,115,6,.73,4.25);

  function rose(x,y,r,angle,delay,peony=false) {
    const g=group(layers.flowers,x,y,angle);
    const stroke=peony?'#b46f8a':'#bc786a';
    const fill=`url(#${peony?'peony':'rose'}-wash)`;
    const rings=peony?[[8,1],[7,.72],[5,.45],[4,.23]]:[[7,1],[5,.73],[4,.46],[3,.24]];
    rings.forEach(([count,mult],ring)=>{
      for(let i=0;i<count;i++) {
        const rr=r*mult*(1+Math.sin(i*5.3+ring)*.06);
        const p=group(g,0,0,(360/count)*i+ring*33);
        const d=`M${-rr*.17} ${rr*.24}C${-rr*.65} ${rr*.21} ${-rr*1.03} ${-rr*.29} ${-rr*.77} ${-rr*.65}C${-rr*.64} ${-rr*.98} ${-rr*.26} ${-rr*1.06} ${-rr*.03} ${-rr*.91}C${rr*.25} ${-rr*1.07} ${rr*.7} ${-rr*.91} ${rr*.75} ${-rr*.56}C${rr*.93} ${-rr*.11} ${rr*.43} ${rr*.22} ${-rr*.17} ${rr*.24}Z`;
        path(p,d,{stroke,fill,width:ring===0?1.25:1,delay:delay+ring*.4+i*.08,duration:1.3,opacity:.95});
        if (ring < 2 && i%2===0) path(p,`M${-rr*.53} ${-rr*.59}Q${-rr*.35} ${-rr*.78} ${-rr*.1} ${-rr*.72}`,{stroke:peony?'#bc8095':'#c88779',width:.65,delay:delay+ring*.4+i*.08+.6,duration:.8});
      }
    });
    path(g,'M-6 1C-10-10 10-11 9-1C8 5-2 7-4 1C-7-5 3-6 4-2',{stroke:peony?'#a85f7b':'#ac665e',width:1.2,delay:delay+2.1,duration:1.2});
  }

  function poppy(x,y,r,angle,delay) {
    const g=group(layers.flowers,x,y,angle);
    for(let i=0;i<5;i++) {
      const p=group(g,0,0,i*72+7);
      path(p,`M-5 5C${-r*.7} ${r*.05} ${-r*.96} ${-r*.55} ${-r*.6} ${-r*.84}Q${-r*.3} ${-r*1.05} 0 ${-r*.86}Q${r*.36} ${-r*1.08} ${r*.66} ${-r*.83}C${r} ${-r*.39} ${r*.54} 3-5 5Z`,{stroke:'#c79a68',fill:'url(#poppy-wash)',width:1.1,delay:delay+i*.13,duration:1.5,opacity:.92});
      path(p,`M-2-8Q${-r*.28} ${-r*.4} ${-r*.34} ${-r*.71}M3-9Q${r*.3} ${-r*.39} ${r*.39} ${-r*.68}`,{stroke:'#cd9f6c',width:.65,delay:delay+.7+i*.1,duration:.9});
    }
    for(let i=0;i<17;i++) {
      const a=i*Math.PI*2/17;
      const xx=Math.cos(a)*12, yy=Math.sin(a)*12;
      path(g,`M0 0L${xx} ${yy}`,{stroke:'#85775e',width:.7,delay:delay+1.25+i*.025,duration:.6});
      circle(g,xx,yy,1.4,{stroke:'#86745b',fill:'#9a8969',width:.5,delay:delay+1.5+i*.025,duration:.5});
    }
    circle(g,0,0,6.5,{fill:'#c3b47d',stroke:'#8e8e61',width:1,delay:delay+1.9,duration:.9});
    path(g,'M-5 0H5M0-5V5M-4-4L4 4M4-4L-4 4',{stroke:'#8c8e64',width:.6,delay:delay+2.2,duration:.6});
  }

  function daisy(x,y,r,angle,delay) {
    const g=group(layers.flowers,x,y,angle);
    for(let i=0;i<13;i++) {
      const p=group(g,0,0,i*360/13);
      const rr=r*(1+.065*Math.sin(i*8));
      path(p,`M-3-3C-8-12-12 ${-rr*.8}-5 ${-rr}C2 ${-rr*1.14} 11 ${-rr*.96} 8 ${-rr*.72}L4-4Z`,{stroke:'#b8ac8e',fill:'url(#daisy-wash)',width:.95,delay:delay+i*.07,duration:1.1,opacity:.98});
      path(p,`M0-11L1 ${-rr*.78}`,{stroke:'#d9cdb1',width:.6,delay:delay+.5+i*.07,duration:.7});
    }
    circle(g,0,0,10,{stroke:'#b39754',fill:'#dfbf6b',width:1.1,delay:delay+1.2,duration:1});
    for(let i=0;i<23;i++) {
      const a=i*2.4, rr=Math.sqrt(i)*1.6;
      circle(g,Math.cos(a)*rr,Math.sin(a)*rr,.65,{stroke:'#a88b4b',fill:'#a88b4b',width:.4,delay:delay+1.55+i*.017,duration:.4});
    }
  }

  function cosmos(x,y,r,angle,delay) {
    const g=group(layers.flowers,x,y,angle);
    for(let i=0;i<8;i++) {
      const p=group(g,0,0,i*45);
      path(p,`M-3-2L${-r*.36} ${-r*.7}Q${-r*.48} ${-r*1.05} ${-r*.19} ${-r*.94}L0 ${-r}L${r*.17} ${-r*.91}Q${r*.43} ${-r*1.02} ${r*.36} ${-r*.7}L4-2Z`,{stroke:'#c08899',fill:'url(#cosmos-wash)',width:1,delay:delay+i*.1,duration:1.2,opacity:.94});
      path(p,`M0-8L${-r*.12} ${-r*.82}M3-9L${r*.15} ${-r*.78}`,{stroke:'#ca92a1',width:.55,delay:delay+i*.1+.6,duration:.7});
    }
    circle(g,0,0,7,{stroke:'#ad9654',fill:'#d8b66a',width:1,delay:delay+1.3,duration:.9});
    for(let i=0;i<9;i++) circle(g,Math.cos(i*2.4)*4,Math.sin(i*2.4)*4,.8,{stroke:'#9f854b',fill:'#b39550',width:.6,delay:delay+1.7,duration:.5});
  }

  function blueFlower(x,y,r,delay) {
    const g=group(layers.flowers,x,y);
    for(let i=0;i<5;i++) {
      const p=group(g,0,0,i*72);
      path(p,`M-1 1C${-r} ${-r*.3} ${-r*.8} ${-r*1.3} 0 ${-r}C${r*.9} ${-r*1.3} ${r} ${-r*.2} 1 1Z`,{stroke:'#8a9fa6',fill:i%2?'#bfd1d5':'#aec7ce',width:.8,delay:delay+i*.07,duration:.8});
    }
    circle(g,0,0,2,{stroke:'#baa66b',fill:'#dfcc8a',width:.6,delay:delay+.65,duration:.5});
  }

  poppy(329,141,43,-15,4.8);
  cosmos(438,183,40,9,5.3);
  [[519,258,12],[539,243,11],[514,233,13],[535,217,10],[495,250,10],[546,265,9]].forEach(([x,y,r],i)=>{
    path(layers.stems,`M498 302Q512 270 ${x} ${y}`,{stroke:'#8b9b7c',width:1,delay:3.3+i*.1,duration:1.5});
    blueFlower(x,y,r,6.4+i*.12);
  });
  rose(386,267,58,12,6.05,true);
  rose(265,280,61,-18,5.65);
  daisy(465,341,39,12,7.1);
  daisy(219,377,32,-9,7.6);
  cosmos(341,368,31,-12,7.85);

  // A few tiny buds and airy baby's breath are drawn last.
  [[154,317],[161,349],[185,337],[547,352],[560,332],[579,312]].forEach(([x,y],i)=>{
    path(layers.stems,`M${i<3?252:468} 440Q${x+10} ${y+20} ${x} ${y}`,{stroke:'#96a184',width:.8,delay:3.2+i*.15,duration:2});
    for(let j=0;j<3;j++) {
      const xx=x+(j-1)*8, yy=y-Math.sin(j*2)*8;
      circle(layers.flowers,xx,yy,3.6,{stroke:'#b5ac8f',fill:'#faf5df',width:.8,delay:8.4+i*.12+j*.08,duration:.7});
    }
  });
  leaf(280,198,16,10,3.9);
  path(layers.flowers,'M276 182C257 167 265 149 278 151C294 146 302 165 283 184Z',{stroke:'#bc8b86',fill:'#e4b1ad',width:1.1,delay:6.2,duration:1.4});
  path(layers.flowers,'M279 181Q272 168 279 153M280 183Q294 168 290 158',{stroke:'#b27c79',width:.8,delay:6.9,duration:1});
  path(layers.stems,'M326 345Q277 271 280 183',{stroke:'#829171',width:1.3,delay:1.5,duration:2.3});

  // Soft silk bow, with its own folds and two loose tails.
  const bow=group(layers.ribbon,350,514,-5);
  const ribbon={stroke:'#aa7b75',fill:'url(#ribbon-wash)',width:1.2,duration:1.6,opacity:.92};
  path(bow,'M-4 0C-23-27-69-38-67-14C-66 5-30 11-4 5Z',{...ribbon,delay:10});
  path(bow,'M5 0C23-28 58-29 61-14C64 5 26 13 4 7Z',{...ribbon,delay:10.3});
  path(bow,'M-5 6C-13 34-23 54-40 68L-44 52L-58 52C-32 34-23 18-13 3Z',{...ribbon,delay:10.5});
  path(bow,'M5 5C15 26 9 50 26 71L32 57L46 62C25 37 28 12 12 1Z',{...ribbon,delay:10.7});
  path(bow,'M-11-5Q-1-9 9-3L12 8Q0 14-10 8Z',{...ribbon,delay:10.95,duration:1.1});
  path(bow,'M-16 1Q-39-15-56-17M15 1Q36-13 51-15M-15 14Q-25 39-42 52M14 17Q15 42 28 54',{stroke:'#af807b',width:.75,delay:11.2,duration:1});

  // Small ink flecks, like pollen suspended around the flowers.
  [[164,197,2],[414,99,2],[566,280,1.5],[184,407,1.6],[477,406,1.5],[285,101,1.5],[121,289,1.5]].forEach(([x,y,r],i)=>circle(layers.accents,x,y,r,{stroke:'#beaa7c',fill:'#c6b58c',width:.5,delay:9.1+i*.15,duration:.6,opacity:.7}));
  path(layers.accents,'M241 122Q236 111 243 108Q251 111 241 122M572 381Q583 368 585 377Q583 384 572 381',{stroke:'#c5a098',fill:'#e5c6bd',width:.8,delay:10.2,duration:1.3,opacity:.65});

  function setStatus(text) {
    if(status.textContent !== text) status.textContent=text;
  }

  function finish() {
    completed=true;
    document.body.classList.add('finished');
    setStatus('A little bouquet. All yours, always.');
    frame=null;
  }

  function tick(now) {
    if(previousTime !== null) elapsed += now-previousTime;
    previousTime=now;
    if(elapsed >= totalTime) { finish(); return; }
    if(elapsed > 12700) setStatus('And a little note, from the heart…');
    else if(elapsed > 9800) setStatus('Tying it all together…');
    else if(elapsed > 4200) setStatus('One petal at a time…');
    frame=requestAnimationFrame(tick);
  }

  function reset() {
    cancelAnimationFrame(frame);
    elapsed=0;
    previousTime=null;
    paused=false;
    completed=false;
    document.body.classList.remove('paused','finished');
    pause.setAttribute('aria-label','Pause animation');
    pause.title='Pause animation';
    setStatus('A little love is taking shape…');
    // Restart the complete timeline, including the handwritten dedication.
    document.querySelectorAll('.gift *').forEach(element=>{
      element.getAnimations().forEach(animation=>{
        animation.currentTime=0;
        animation.play();
      });
    });
    if(reducedMotion.matches) finish();
    else frame=requestAnimationFrame(tick);
  }

  pause.addEventListener('click',()=>{
    if(completed) return;
    paused=!paused;
    document.body.classList.toggle('paused',paused);
    pause.setAttribute('aria-label',paused?'Resume animation':'Pause animation');
    pause.title=paused?'Resume animation':'Pause animation';
    if(paused) {
      cancelAnimationFrame(frame);
      previousTime=null;
      setStatus('A little moment to pause.');
    } else {
      setStatus('A little love is taking shape…');
      frame=requestAnimationFrame(tick);
    }
  });
  document.getElementById('replay').addEventListener('click',reset);
  reducedMotion.addEventListener('change',reset);
  // Fonts resolve before the dedication arrives; drawing never waits on a network.
  if(reducedMotion.matches) finish();
  else frame=requestAnimationFrame(tick);
})();
