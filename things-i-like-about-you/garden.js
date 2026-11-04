(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const notesRoot=document.getElementById('notes');
  const vine=document.getElementById('vine-art');
  const section=document.querySelector('.note-garden');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let details=[];
  let progressFrame=null;
  let resizeTimer;
  let vinePath;
  let vineLength=0;
  let furthestProgress=0;

  function element(tag,attributes={},parent){
    const el=document.createElementNS(NS,tag);
    for(const [key,value] of Object.entries(attributes))el.setAttribute(key,value);
    if(parent)parent.append(el);
    return el;
  }
  function group(parent,x=0,y=0,rotation=0,scale=1){return element('g',{transform:`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`},parent)}
  function path(parent,d,fill='none',stroke='#7c926d',width=1){return element('path',{d,fill,stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'},parent)}
  function leaf(parent,x,y,size,angle,light=false){
    const g=group(parent,x,y,angle);
    path(g,`M0 0C${-size*.75} ${-size*.3} ${-size*.62} ${-size*1.2} ${size*.1} ${-size*1.7}C${size*.05} ${-size*1.15} ${size*.8} ${-size*.55} 0 0Z`,light?'#b9c6a0':'#8fa67c',light?'#98ab7d':'#6e8966',.8);
    path(g,`M0 0Q${-size*.06} ${-size*.67} ${size*.1} ${-size*1.55}`,'none','#e1e5c4',.7);
    path(g,`M0 ${-size*.47}L${-size*.26} ${-size*.8}M0 ${-size*.8}L${size*.25} ${-size*1.07}`,'none','#bdcda5',.45);
  }
  function blossom(parent,x,y,size,angle=0,cream=false){
    const g=group(parent,x,y,angle);
    for(let i=0;i<5;i++){
      const petal=group(g,0,0,i*72);
      path(petal,`M-2 3C${-size*.7} ${-size*.13} ${-size*.8} ${-size*.83} ${-size*.4} ${-size*.99}Q${-size*.15} ${-size*1.08} 0 ${-size*.88}Q${size*.26} ${-size*1.11} ${size*.53} ${-size*.91}C${size*.86} ${-size*.52} ${size*.48} ${-size*.03}-2 3Z`,cream?'#faf1d8':'#f2cdd0',cream?'#c7b990':'#d4a1b1',.8);
      path(petal,`M0-2Q${size*.09} ${-size*.35} ${-size*.05} ${-size*.75}`,'none',cream?'#e4d5b0':'#e5b3c1',.6);
    }
    element('circle',{cx:0,cy:0,r:size*.2,fill:'#d8b77d',stroke:'#b69c65','stroke-width':.7},g);
    for(let i=0;i<7;i++)element('circle',{cx:Math.cos(i*2.4)*size*.14,cy:Math.sin(i*2.4)*size*.14,r:.7,fill:'#9e8e58'},g);
    return g;
  }

  const data=Array.isArray(window.LOVE_NOTES)?window.LOVE_NOTES:[];
  data.forEach((entry,index)=>{
    const article=document.createElement('article');
    article.className='note';
    const number=document.createElement('span');number.className='note-number';number.textContent=String(index+1).padStart(2,'0');number.setAttribute('aria-hidden','true');article.append(number);
    const title=typeof entry.title==='string'?entry.title.trim():'';
    const text=typeof entry.text==='string'?entry.text.trim():'';
    if(title){const heading=document.createElement('h2');heading.textContent=title;article.append(heading)}
    if(text){const paragraph=document.createElement('p');paragraph.textContent=text;article.append(paragraph)}
    if(!title&&!text){
      const placeholder=document.createElement('p');placeholder.className='placeholder';placeholder.textContent='Your words go here.';article.append(placeholder);
      const lines=document.createElement('div');lines.className='stationery-lines';lines.setAttribute('aria-hidden','true');article.append(lines);
    }
    const seal=element('svg',{viewBox:'0 0 24 32',class:'note-seal','aria-hidden':'true'});
    path(seal,'M12 30V12M12 24Q2 21 3 14Q12 15 12 24M12 19Q22 17 21 9Q12 10 12 19M12 13Q5 4 12 2Q19 4 12 13','none','#a8ae8d',.8);article.append(seal);
    notesRoot.append(article);
  });

  function drawTitle(){
    const svg=document.getElementById('title-botanical');
    path(svg,'M154 269C82 239 84 142 153 91Q184 66 220 58','none','#9aa582',1.2);
    path(svg,'M447 269C519 231 512 141 450 95Q420 72 389 66','none','#9aa582',1.2);
    [[146,266,19,-56],[121,243,23,-57],[105,211,23,-64],[105,181,23,-20],[117,149,22,8],[138,121,20,4],[167,94,18,35],[193,76,15,38],
     [453,265,19,54],[479,237,23,62],[492,206,23,53],[490,175,22,20],[475,145,22,-6],[454,120,20,-5],[429,99,19,-28],[403,81,16,-30]].forEach(([x,y,s,a],i)=>leaf(svg,x,y,s,a,i%3===0));
    blossom(svg,119,150,20,-18);
    blossom(svg,475,233,20,13);
    blossom(svg,168,91,13,22,true);
    blossom(svg,436,102,14,-10,true);
    path(svg,'M216 56Q237 35 249 55Q237 70 216 56M384 63Q367 47 355 64Q368 77 384 63','#c2caa8','#9eac87',.8);
    [[160,54],[455,64],[84,252],[512,145],[212,311],[391,316]].forEach(([cx,cy])=>element('circle',{cx,cy,r:1.6,fill:'#c6b583'},svg));
  }

  function buildVine(){
    vine.replaceChildren();details=[];
    const width=section.clientWidth,height=section.offsetHeight;
    vine.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const cards=[...notesRoot.children];
    const mobile=width<650;
    const anchors=cards.map((card,i)=>{
      // offset positions avoid transforms changing the geometry as cards appear.
      const x=i%2===0?card.offsetLeft-15:card.offsetLeft+card.offsetWidth+15;
      return {x:Math.max(20,Math.min(width-20,x)),y:card.offsetTop-19};
    });
    const points=[{x:width/2,y:-24},...anchors,{x:width/2,y:height-80}];
    let d=`M${points[0].x} ${points[0].y}`;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],distance=b.y-a.y;
      d+=`C${a.x} ${a.y+distance*.58} ${b.x} ${b.y-distance*.5} ${b.x} ${b.y}`;
    }
    const guide=path(vine,d,'none','#d6dbc542',3.2);guide.setAttribute('class','vine-stroke');
    const trunk=path(vine,d,'none','#6d8b60',2.2);trunk.setAttribute('class','vine-stroke vine-progress');
    const length=trunk.getTotalLength();trunk.style.setProperty('--vine-length',length);
    vinePath=trunk;vineLength=length;
    const highlight=path(vine,d,'none','#b6c296',.65);highlight.setAttribute('class','vine-stroke vine-progress');highlight.style.setProperty('--vine-length',length);
    for(let distance=42,index=0;distance<length-32;distance+=mobile?52:48,index++){
      const point=trunk.getPointAtLength(distance),next=trunk.getPointAtLength(Math.min(distance+2,length));
      const tangent=Math.atan2(next.y-point.y,next.x-point.x)*180/Math.PI;
      const g=group(vine,point.x,point.y);g.setAttribute('class','vine-detail');
      const side=index%2===0?1:-1;
      const size=(mobile?14:18)+(Math.sin(index*3.7)+1)*3;
      leaf(g,0,0,size,tangent-90+side*58,index%4===0);
      if(index%3===0)leaf(g,0,8,size*.65,tangent-90-side*46,true);
      details.push({el:g,y:point.y});
    }
    anchors.forEach((anchor,i)=>{
      const g=group(vine,anchor.x,anchor.y);g.setAttribute('class','vine-detail');
      leaf(g,-3,6,mobile?17:22,i%2?-40:45);
      blossom(g,0,0,mobile?20:25,i*17);
      blossom(g,i%2?-21:21,-17,mobile?10:13,26,true);
      path(g,`M0 10Q${i%2?-20:20} 26 ${i%2?-35:35} 16`,'none','#8b9e72',.8);
      details.push({el:g,y:anchor.y});
    });
    updateProgress();
  }

  function updateProgress(){
    progressFrame=null;
    const rect=section.getBoundingClientRect();
    const visibleY=innerHeight*.83-rect.top;
    const atBottom=scrollY+innerHeight>=document.documentElement.scrollHeight-4;
    let progress=1;
    if(!reduced.matches&&!atBottom&&vinePath){
      // Match the drawn stem to the leaves' actual vertical position, even
      // when a long note changes the shape and length of a curve.
      let low=0,high=vineLength;
      for(let i=0;i<14;i++){
        const middle=(low+high)/2;
        if(vinePath.getPointAtLength(middle).y<visibleY)low=middle;
        else high=middle;
      }
      progress=low/vineLength;
    }
    furthestProgress=Math.max(furthestProgress,progress);
    vine.style.setProperty('--progress',furthestProgress);
    details.forEach(detail=>{if(reduced.matches||atBottom||detail.y<visibleY)detail.el.classList.add('is-visible')});
  }
  drawTitle();
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.1});
  document.body.classList.add('garden-ready');
  document.querySelectorAll('.note').forEach(card=>observer.observe(card));
  document.fonts.ready.then(buildVine);
  new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(buildVine,100)}).observe(notesRoot);
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(buildVine,120)});
  addEventListener('scroll',()=>{if(progressFrame===null)progressFrame=requestAnimationFrame(updateProgress)},{passive:true});
  reduced.addEventListener('change',updateProgress);
})();
