/* ═══════════════════════════════
   PEQATECH  script.js  v3
═══════════════════════════════ */
'use strict';

/* ── 1. SCROLL PROGRESS ── */
(function(){
  const bar = document.getElementById('scrollProgress');
  if(!bar) return;
  window.addEventListener('scroll',()=>{
    const pct = window.scrollY/(document.body.scrollHeight - window.innerHeight)*100;
    bar.style.width = Math.min(pct,100)+'%';
  },{passive:true});
})();

/* ── 2. CUSTOM CURSOR ── */
(function(){
  const c  = document.getElementById('cursor');
  const tr = document.getElementById('cursorTrail');
  if(!c||!tr) return;
  let mx=0,my=0,tx=0,ty=0;
  document.addEventListener('mousemove',e=>{
    mx=e.clientX; my=e.clientY;
    c.style.left=mx+'px'; c.style.top=my+'px';
  });
  (function loop(){
    tx+=(mx-tx)*.1; ty+=(my-ty)*.1;
    tr.style.left=tx+'px'; tr.style.top=ty+'px';
    requestAnimationFrame(loop);
  })();
})();

/* ── 3. STICKY HEADER ── */
(function(){
  const h = document.getElementById('header');
  if(!h) return;
  const fn = ()=>h.classList.toggle('scrolled',window.scrollY>30);
  window.addEventListener('scroll',fn,{passive:true});
  fn();
})();

/* ── 4. HAMBURGER ── */
(function(){
  const btn  = document.getElementById('hamburger');
  const draw = document.getElementById('navDrawer');
  if(!btn||!draw) return;
  btn.addEventListener('click',()=>{
    const o = draw.classList.toggle('open');
    btn.classList.toggle('open',o);
    document.body.style.overflow = o?'hidden':'';
  });
  draw.querySelectorAll('.drawer-link').forEach(l=>l.addEventListener('click',()=>{
    draw.classList.remove('open');
    btn.classList.remove('open');
    document.body.style.overflow='';
  }));
})();

/* ── 5. SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const href = a.getAttribute('href');
    // Logo / home link → scroll to very top
    if(href === '#' || href === '#hero'){
      e.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    const t=document.querySelector(href);
    if(!t) return;
    e.preventDefault();
    const hh = 72;
    // For sections after the scroll scene, account for the scene height
    window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-hh,behavior:'smooth'});
  });
});

/* ── 6. SCROLL REVEAL ── */
(function(){
  const els=document.querySelectorAll('.reveal-up');
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}
    });
  },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  els.forEach(el=>io.observe(el));
})();

/* ── 7. MOUSE GLOW (attaches to scene stage) ── */
(function(){
  const glow=document.getElementById('mouseGlow');
  const stage=document.querySelector('.scene-stage');
  if(!glow||!stage) return;
  stage.addEventListener('mousemove',e=>{
    const r=stage.getBoundingClientRect();
    glow.style.left=(e.clientX-r.left)+'px';
    glow.style.top=(e.clientY-r.top)+'px';
    glow.style.opacity='1';
  });
  stage.addEventListener('mouseleave',()=>glow.style.opacity='0');
})();

/* ── 8. PARTICLE FIELD ── */
(function(){
  const container=document.getElementById('heroParticles');
  if(!container) return;
  for(let i=0;i<38;i++){
    const p=document.createElement('div');
    p.className='hp';
    const size=Math.random()*2.5+.8;
    const colors=['rgba(124,58,237,.55)','rgba(167,139,250,.4)','rgba(52,211,153,.35)','rgba(59,130,246,.35)'];
    const col=colors[Math.floor(Math.random()*colors.length)];
    p.style.cssText=`width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:-8px;background:${col};animation-duration:${Math.random()*12+8}s;animation-delay:${Math.random()*10}s;box-shadow:0 0 ${size*3}px ${col};`;
    container.appendChild(p);
  }
})();

/* ═══════════════════════════════════════════════════
   ── 9. APPLE-STYLE SCROLL SCENE (main driver) ──
   
   Phase 0 (0–20%):  light pass sweeps across chars
   Phase 1 (20–55%): support content fades out, cards fade out
   Phase 2 (55–80%): headline scales down + moves to top-center
   Phase 3 (80–100%): ambient text appears, scroll indicator hides
═══════════════════════════════════════════════════ */
(function(){
  const scene     = document.getElementById('scrollScene');
  const headline  = document.getElementById('sceneHeadline');
  const support   = document.getElementById('sceneSupport');
  const scrollInd = document.getElementById('scrollInd');
  const sceneBg   = document.getElementById('sceneBg');
  const hfc       = [document.getElementById('hfc1'),document.getElementById('hfc2'),document.getElementById('hfc3'),document.getElementById('hfc4')];
  const chars     = document.querySelectorAll('.sh-char');
  const orbs      = document.querySelectorAll('.scene-stage .orb');
  if(!scene||!headline) return;

  // Pre-calculate char total for light pass
  const totalChars = chars.length;

  // Easing helpers
  const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
  const mapRange=(v,a,b,c,d)=>c+(d-c)*clamp((v-a)/(b-a),0,1);
  const easeOut=(t)=>1-Math.pow(1-t,3);
  const easeInOut=(t)=>t<.5?4*t*t*t:(1-Math.pow(-2*t+2,3)/2);

  let raf=null;

  function update(){
    raf=null;
    const sceneTop    = scene.getBoundingClientRect().top + window.scrollY;
    const sceneH      = scene.offsetHeight;
    const scrollable  = sceneH - window.innerHeight;
    const raw         = window.scrollY - sceneTop;
    const progress    = clamp(raw / scrollable, 0, 1); // 0→1 across the whole scene

    /* ─ All chars start fully lit ─ */
    /* ─ Dim OFF left→right from 55% scroll onwards, completes at 90% ─ */
    const dimP   = mapRange(progress, 0.55, 0.90, 0, 1);
    const dimUpTo = Math.floor(easeOut(dimP) * totalChars);

    chars.forEach((ch, i) => {
      if(i < dimUpTo) ch.classList.remove('lit');
      else ch.classList.add('lit');
    });

    /* ─ Phase 1: Only scroll indicator fades (slow) ─ */
    if(scrollInd) scrollInd.style.opacity = 1 - mapRange(progress, 0.08, 0.35, 0, 1);

    /* ─ Headline stays fully visible — hidden only when About covers it ─ */
    headline.style.opacity   = 1;
    headline.style.transform = 'translate(-50%, -50%)';

    /* Cards stay visible too */
    hfc.forEach((c)=>{ if(c) c.style.opacity = 1; });

    /* ─ Orb parallax ─ */
    const sy = window.scrollY;
    orbs.forEach((o,i) => {
      const s=[.04,-.03,.06][i]||0;
      o.style.transform=`translateY(${sy*s}px)`;
    });
  }

  window.addEventListener('scroll', ()=>{
    if(!raf) raf = requestAnimationFrame(update);
  }, {passive:true});

  // Initial run
  update();
})();

/* ── HIDE HEADLINE WHEN ABOUT SECTION FULLY COVERS VIEWPORT ── */
(function(){
  const headline = document.getElementById('sceneHeadline');
  const about    = document.getElementById('about');
  if(!headline || !about) return;
  function update(){
    const aboutTop = about.getBoundingClientRect().top;
    headline.style.display = aboutTop <= 0 ? 'none' : '';
  }
  window.addEventListener('scroll', update, {passive:true});
  update();
})();

/* ── 12. HERO GRID PARALLAX ── */
(function(){
  const g=document.querySelector('.hero-grid');
  if(!g) return;
  window.addEventListener('scroll',()=>{ g.style.transform=`translateY(${window.scrollY*.08}px)`; },{passive:true});
})();

/* ── 13. BIG SCROLL WORDS ── */
(function(){
  // Each word element gets its own scroll speed
  const wordDefs=[
    {id:'swAbout',        dir:1,  speed:.35},
    {id:'swPortfolio',    dir:1,  speed:.35},
    {id:'swPricing',      dir:1,  speed:.35},
    {id:'swTestimonials', dir:1,  speed:.35},
  ];
  const words = wordDefs.map(d=>({ el:document.getElementById(d.id), ...d })).filter(d=>d.el);

  function update(){
    const sy = window.scrollY;
    words.forEach(d=>{
      const rect = d.el.closest('.scroll-word-wrap').getBoundingClientRect();
      const mid  = rect.top + rect.height/2;
      const vMid = window.innerHeight/2;
      const diff = (mid - vMid) * d.speed * d.dir;
      d.el.style.transform = `translateX(${diff}px)`;
    });
  }
  window.addEventListener('scroll', update, {passive:true});
  update();
})();

/* ── 11. BIG STATEMENT WORDS (different speeds, move on scroll) ── */
(function(){
  const words=[
    {id:'bsw1', speed:.25, dir:1},
    {id:'bsw2', speed:.4,  dir:-1},
  ];
  const refs = words.map(w=>({ el:document.getElementById(w.id), ...w })).filter(w=>w.el);
  if(!refs.length) return;

  function update(){
    const sy=window.scrollY;
    refs.forEach(r=>{
      const rect = r.el.getBoundingClientRect();
      const mid  = rect.top + rect.height/2;
      const vMid = window.innerHeight/2;
      const offset = (mid - vMid) * r.speed * r.dir;
      r.el.style.transform = `translateX(${offset}px)`;
    });
  }
  window.addEventListener('scroll',update,{passive:true});
  update();
})();

/* ── 12. SCROLL-DRIVEN LIGHT SWEEP ON PORTFOLIO IMAGES ── */
(function(){
  const imgs = document.querySelectorAll('.pf-light');
  if(!imgs.length) return;

  function update(){
    const vh = window.innerHeight;
    imgs.forEach(img=>{
      const sweep = img.querySelector('.pf-sweep');
      if(!sweep) return;
      const rect  = img.getBoundingClientRect();
      const centerY = rect.top + rect.height/2;
      // progress: 0 when at bottom of screen, 1 when at top
      const t = 1 - (centerY / vh);
      const clamped = Math.max(0, Math.min(1, t));
      // sweep position moves diagonally as element scrolls through viewport
      const gx = (30 + clamped * 60).toFixed(1) + '%';
      const gy = (80 - clamped * 80).toFixed(1) + '%';
      const brightness = 0.85 + clamped * 0.3;
      const contrast   = 0.95 + clamped * 0.1;
      sweep.style.background = `radial-gradient(circle 200px at ${gx} ${gy}, rgba(255,255,255,.12) 0%, transparent 70%)`;
      img.style.filter = `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`;
    });
  }
  window.addEventListener('scroll',update,{passive:true});
  update();
})();

/* ── 13. GLOW CARD MOUSE FOLLOW LIGHT ── */
(function(){
  const cards = document.querySelectorAll('.glow-card');
  cards.forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=((e.clientX-r.left)/r.width*100).toFixed(1)+'%';
      const y=((e.clientY-r.top)/r.height*100).toFixed(1)+'%';
      card.style.setProperty('--gx',x);
      card.style.setProperty('--gy',y);
    });
  });
})();

/* ── 14. FOUNDER CARD SCROLL LIGHT ── */
(function(){
  const card = document.getElementById('founderCard');
  if(!card) return;
  function update(){
    const vh   = window.innerHeight;
    const rect = card.getBoundingClientRect();
    const t    = 1 - (rect.top + rect.height/2) / vh;
    const cl   = Math.max(0, Math.min(1, t));
    const img  = card.querySelector('img');
    if(img) img.style.filter=`grayscale(${Math.round(20-cl*18)}%) brightness(${(.9+cl*.18).toFixed(2)})`;
  }
  window.addEventListener('scroll',update,{passive:true});
  update();
})();

/* ── 15. PORTFOLIO FILTER ── */
(function(){
  const btns  = document.querySelectorAll('.pf-filter');
  const cards = document.querySelectorAll('#pfGrid .pf-card');
  if(!btns.length) return;
  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      btns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      cards.forEach(card=>{
        const match = cat==='all' || card.dataset.cat===cat;
        card.classList.toggle('hidden',!match);
      });
    });
  });
})();

/* ── 15. ABOUT CARD SCROLL LIGHT ── */
(function(){
  const card = document.getElementById('aboutCard');
  if(!card) return;
  const sweep = card.querySelector('.glow-sweep');
  if(!sweep) return;

  function update(){
    const vh   = window.innerHeight;
    const rect = card.getBoundingClientRect();
    const t    = 1 - (rect.top + rect.height/2) / vh;
    const cl   = Math.max(0, Math.min(1, t));
    const gx   = (10 + cl * 80).toFixed(1) + '%';
    const gy   = (90 - cl * 85).toFixed(1) + '%';
    sweep.style.background = `radial-gradient(circle 350px at ${gx} ${gy}, rgba(124,58,237,.12) 0%, transparent 70%)`;
    sweep.style.opacity='1';
  }
  window.addEventListener('scroll',update,{passive:true});
  update();
})();

/* ── 16. STAT COUNTER ANIMATION ── */
(function(){
  const nums = document.querySelectorAll('.stat-num[data-target]');
  if(!nums.length) return;
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      const start  = performance.now();
      const dur    = 1600;
      function tick(now){
        const p  = Math.min((now-start)/dur,1);
        const ep = 1-Math.pow(1-p,4); // easeOutQuart
        el.textContent = Math.round(ep*target);
        if(p<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  },{threshold:.6});
  nums.forEach(n=>io.observe(n));
})();

/* ── 17. TESTIMONIALS SLIDER ── */
(function(){
  const track  = document.getElementById('testiTrack');
  const dotsW  = document.getElementById('testiDots');
  const prev   = document.getElementById('testiPrev');
  const next   = document.getElementById('testiNext');
  if(!track) return;

  const cards = Array.from(track.children);
  let cur=0, pv=getPerView(), drag0=0, dragging=false;
  let timer;

  function getPerView(){
    if(window.innerWidth>=1024) return 3;
    if(window.innerWidth>=640)  return 2;
    return 1;
  }
  function max(){ return Math.max(0, cards.length-pv); }
  function pages(){ return Math.ceil(cards.length/pv); }

  function buildDots(){
    dotsW.innerHTML='';
    for(let i=0;i<pages();i++){
      const d=document.createElement('button');
      d.className='testi-dot';
      d.addEventListener('click',()=>{ cur=i*pv; render(); resetTimer(); });
      dotsW.appendChild(d);
    }
  }

  function render(){
    pv=getPerView();
    if(cur>max()) cur=max();
    const gap=24;
    const w=(track.parentElement.offsetWidth - gap*(pv-1))/pv;
    cards.forEach((c,i)=>{
      c.style.flex=`0 0 ${w}px`;
      c.classList.toggle('active',i>=cur&&i<cur+pv);
    });
    track.style.transform=`translateX(-${cur*(w+gap)}px)`;
    dotsW.querySelectorAll('.testi-dot').forEach((d,i)=>d.classList.toggle('active',i===Math.floor(cur/pv)));
  }

  function goNext(){ cur=cur>=max()?0:cur+pv; render(); }
  function goPrev(){ cur=cur<=0?max():cur-pv; render(); }
  function resetTimer(){ clearInterval(timer); timer=setInterval(goNext,4500); }

  next.addEventListener('click',()=>{ goNext(); resetTimer(); });
  prev.addEventListener('click',()=>{ goPrev(); resetTimer(); });

  track.addEventListener('pointerdown',e=>{ drag0=e.clientX; dragging=true; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointerup',e=>{
    if(!dragging) return; dragging=false;
    const dx=e.clientX-drag0;
    if(Math.abs(dx)>40){ dx<0?goNext():goPrev(); resetTimer(); }
  });

  buildDots(); render(); resetTimer();
  window.addEventListener('resize',()=>{ pv=getPerView(); buildDots(); render(); });
})();

/* ── 18. 3D TILT ON CARDS ── */
(function(){
  const els=document.querySelectorAll('.pf-card,.mini-card,.contact-card');
  els.forEach(el=>{
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      const dx=(e.clientX-r.left-r.width/2)/(r.width/2);
      const dy=(e.clientY-r.top-r.height/2)/(r.height/2);
      el.style.transform=`perspective(700px) rotateX(${(-dy*5).toFixed(2)}deg) rotateY(${(dx*5).toFixed(2)}deg) translateY(-4px)`;
    });
    el.addEventListener('mouseleave',()=>{ el.style.transform=''; });
  });
})();

/* ── 19. ACTIVE NAV HIGHLIGHT ── */
(function(){
  const secs=document.querySelectorAll('section[id]');
  const links=document.querySelectorAll('.nav-desktop a[href^="#"]');
  window.addEventListener('scroll',()=>{
    let cur='';
    secs.forEach(s=>{ if(window.scrollY>=s.offsetTop-100) cur=s.id; });
    links.forEach(a=>{ a.style.color=a.getAttribute('href')==='#'+cur?'var(--w)':''; });
  },{passive:true});
})();
