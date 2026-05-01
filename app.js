/* ══ Local JSON Storage ══
   portfolio-data.json lives in the same folder.
   Admin saves it to GitHub → Netlify redeploys → this fetch gets fresh data.
   Works in ALL browsers with zero API calls.
   ══════════════════════════════════════════════════════ */

async function loadFromFirebase(defaultData) {
  try {
    // Add timestamp to bust any browser cache
    const res = await fetch("./portfolio-data.json?t=" + Date.now(), {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("portfolio-data.json not found");
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("Could not load portfolio-data.json, using defaults:", err.message);
    return defaultData;
  }
}

async function saveToFirebase(data) { return true; }
function mergeWithLocalImages(data) { return data; }

/* ══════════════════════════════════════════
   app.js  —  Portfolio frontend
   Loads data from Firebase (with localStorage fallback)
   ══════════════════════════════════════════ */


// ── DEFAULT DATA ──────────────────────────
const DEFAULT_DATA = {
  profile: {
    name:"Nazrul Islam", title:"Creative Developer",
    tagline:"I craft digital experiences that live at the intersection of code & art.",
    email:"nidt845418@gmail.com", location:"Dhaka, East Champaran",
    avatarText:"NI",
    bio:"I'm a full-stack developer with 6+ years of experience building products that millions of people use. Passionate about clean code, beautiful interfaces, and solving hard problems.",
    resumeLink:"#", photo:""
  },
  stats:[
    {id:1,number:"6+",label:"Years Exp."},
    {id:2,number:"40+",label:"Projects"},
    {id:3,number:"20+",label:"Clients"}
  ],
  socialLinks:[
    {id:1,label:"GitHub",  url:"https://github.com/obito-uchiha-nidt",  visibleOnPortfolio:true},
    {id:2,label:"LinkedIn",url:"https://linkedin.com/",visibleOnPortfolio:true},
    {id:3,label:"Twitter", url:"https://twitter.com/", visibleOnPortfolio:true}
  ],
  skills:[
    {id:1,name:"HTML / CSS",    level:95,category:"Frontend"},
    {id:2,name:"JavaScript",    level:90,category:"Frontend"},
    {id:3,name:"React",         level:80,category:"Frontend"},
    {id:4,name:"Node.js",       level:75,category:"Backend"},
    {id:5,name:"UI / UX Design",level:85,category:"Design"}
  ],
  projects:[
    {id:1,title:"Smart Door Unlock System",description:"A smart IoT-based door unlock system with mobile control and real-time monitoring.",tech:["IoT","JavaScript","Node.js"],link:"#",github:"#",color:"#c9a84c"}
  ],
  posts:[]
};

// ── RENDER HELPERS ────────────────────────
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}

function renderProfile(data){
  const {profile,socialLinks,stats}=data;
  setText("nav-name",          profile.name);
  setText("hero-name-display", profile.name);
  setText("hero-title-display",profile.title);
  setText("hero-tagline",      profile.tagline);
  setText("hero-location",     profile.location);
  setText("about-bio",         profile.bio);
  setText("about-email",       profile.email);
  setText("about-location",    profile.location);
  setText("footer-name",       profile.name);
  setText("footer-year",       new Date().getFullYear());
  document.title = "Portfolio — "+profile.name;

  const cEmail=document.getElementById("contact-email-link");
  if(cEmail){cEmail.textContent=profile.email;cEmail.href="mailto:"+profile.email;}
  const resumeEl=document.getElementById("resume-link");
  if(resumeEl) resumeEl.href=profile.resumeLink||"#";

  // Photo
  const heroInner=document.getElementById("hero-photo-inner");
  if(heroInner) heroInner.innerHTML=profile.photo
    ?`<img src="${profile.photo}" alt="${profile.name}" />`
    :`<span class="photo-initials">${profile.avatarText||"AR"}</span>`;
  const aboutAv=document.getElementById("about-avatar-el");
  if(aboutAv) aboutAv.innerHTML=profile.photo
    ?`<img src="${profile.photo}" alt="${profile.name}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:4px;" />`
    :profile.avatarText||"AR";

  // Stats
  const statsEl=document.getElementById("about-stats");
  if(statsEl) statsEl.innerHTML=(stats||DEFAULT_DATA.stats).map(s=>`
    <div class="stat">
      <span class="stat-num">${s.number}</span>
      <span class="stat-label">${s.label}</span>
    </div>`).join("");

  // Social links — visible only
  const visible=(socialLinks||[]).filter(l=>l.visibleOnPortfolio);
  const aboutLinks=document.getElementById("about-social-links");
  if(aboutLinks) aboutLinks.innerHTML=visible.map(l=>`<a href="${l.url}" class="social-link" target="_blank" rel="noopener">${l.label}</a>`).join("");
  const contactLinks=document.getElementById("contact-social-links");
  if(contactLinks) contactLinks.innerHTML=visible.map(l=>`<a href="${l.url}" class="c-social" target="_blank" rel="noopener">${l.label}</a>`).join("");
}

function renderSkills(skills){
  const grid=document.getElementById("skills-grid");
  if(!grid)return;
  grid.innerHTML=skills.map((s,i)=>`
    <div class="skill-card reveal" style="transition-delay:${i*60}ms">
      <div class="skill-header">
        <span class="skill-name">${s.name}</span>
        <span class="skill-meta"><span class="skill-category">${s.category}</span><span class="skill-pct">${s.level}%</span></span>
      </div>
      <div class="skill-bar-bg"><div class="skill-bar-fill" data-width="${s.level}"></div></div>
    </div>`).join("");
}

function renderProjects(projects){
  const grid=document.getElementById("projects-grid");
  if(!grid)return;
  grid.innerHTML=projects.map((p,i)=>`
    <div class="project-card reveal" style="--project-color:${p.color||"var(--gold)"}; transition-delay:${i*80}ms">
      <div class="project-top">
        <span class="project-number">${String(i+1).padStart(2,"0")}</span>
        <div class="project-links">
          <a href="${p.github||'#'}" class="project-link" target="_blank">GitHub</a>
          <a href="${p.link||'#'}"   class="project-link" target="_blank">Live &#8599;</a>
        </div>
      </div>
      <h3 class="project-title">${p.title}</h3>
      <p class="project-desc">${p.description}</p>
      <div class="project-tech">${(p.tech||[]).map(t=>`<span class="tech-tag">${t}</span>`).join("")}</div>
    </div>`).join("");
}

function renderPosts(posts){
  const grid=document.getElementById("posts-grid");
  if(!grid)return;
  if(!posts||!posts.length){grid.innerHTML=`<p class="posts-empty">No posts yet. Check back soon.</p>`;return;}
  const sorted=[...posts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  grid.innerHTML=sorted.map((p,i)=>`
    <div class="post-card reveal" style="transition-delay:${i*70}ms">
      ${p.image&&p.image!=="__local__"?`<div class="post-image"><img src="${p.image}" alt="Post" loading="lazy" /></div>`:""}
      <div class="post-body">
        <span class="post-date">${formatDate(p.date)}</span>
        <p class="post-caption">${p.caption}</p>
        ${(p.links||[]).length?`<div class="post-links">${p.links.map(l=>`<a href="${l.url}" class="post-link-tag" target="_blank" rel="noopener">&#8599; ${l.label}</a>`).join("")}</div>`:""}
      </div>
    </div>`).join("");
}

function formatDate(str){
  if(!str)return"";
  try{return new Date(str).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});}catch{return str;}
}

// ── LOADING STATE ─────────────────────────
function showLoading(){
  document.getElementById("hero-tagline").textContent="Loading...";
}
function hideLoading(){
  // tagline will be overwritten by renderProfile
}

// ── SCROLL REVEAL ─────────────────────────
function initReveal(){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("visible");
        const bar=e.target.querySelector(".skill-bar-fill");
        if(bar)bar.style.width=bar.dataset.width+"%";
      }
    });
  },{threshold:0.1});
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
}

// ── NAV ───────────────────────────────────
function initNav(){
  const nav=document.getElementById("nav");
  const toggle=document.getElementById("navToggle");
  const menu=document.getElementById("mobileMenu");
  window.addEventListener("scroll",()=>nav.classList.toggle("scrolled",window.scrollY>50));
  toggle.addEventListener("click",()=>{
    const open=menu.classList.toggle("open");
    toggle.classList.toggle("open",open);
    document.body.style.overflow=open?"hidden":"";
  });
  document.querySelectorAll(".mob-link").forEach(l=>l.addEventListener("click",()=>{
    menu.classList.remove("open");toggle.classList.remove("open");document.body.style.overflow="";
  }));
}

// ── CURSOR ────────────────────────────────
function initCursor(){
  const dot=document.getElementById("cursor"),fol=document.getElementById("cursorFollower");
  if(!dot||!fol)return;
  let mx=0,my=0,fx=0,fy=0;
  document.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;});
  (function loop(){
    dot.style.left=mx+"px";dot.style.top=my+"px";
    fx+=(mx-fx)*.1;fy+=(my-fy)*.1;
    fol.style.left=fx+"px";fol.style.top=fy+"px";
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll("a,button,.project-card,.skill-card,.post-card").forEach(el=>{
    el.addEventListener("mouseenter",()=>{fol.style.width="60px";fol.style.height="60px";});
    el.addEventListener("mouseleave",()=>{fol.style.width="36px";fol.style.height="36px";});
  });
}

// ── INIT ──────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  initCursor();
  showLoading();

  // Load from Firebase (falls back to localStorage if offline)
  let data = await loadFromFirebase(DEFAULT_DATA);
  data = mergeWithLocalImages(data);

  renderProfile(data);
  renderSkills(data.skills);
  renderProjects(data.projects);
  renderPosts(data.posts);

  setTimeout(()=>{
    document.querySelectorAll(".about-grid,.contact-inner").forEach(el=>el.classList.add("reveal"));
    initReveal();
  },0);
});
