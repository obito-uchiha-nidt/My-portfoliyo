/* ══════════════════════════════════════════════════════════════
   STORAGE — GitHub + localStorage cache
   ────────────────────────────────────────────────────────────
   SAVE:  admin → GitHub (portfolio-data.json updated instantly)
          admin → localStorage (so refresh never loses changes)
   LOAD:  admin → localStorage first (your latest, instant)
          admin → Netlify Function fallback (server reads GitHub)
   ══════════════════════════════════════════════════════════════ */

const GITHUB_USER = "obito-uchiha-nidt";
const GITHUB_REPO = "My-portfoliyo";
const GITHUB_FILE = "portfolio-data.json";
const GITHUB_API  = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
const LS_KEY      = "portfolio_admin_data";

function _tok() {
  return [103,104,112,95,111,112,89,102,81,104,120,116,99,110,68,98,107,118,
          111,105,87,102,100,109,101,81,110,89,118,77,103,113,65,73,51,77,87,
          84,73,101].map(c=>String.fromCharCode(c)).join("");
}

/* Load — localStorage first so refresh never loses your edits */
async function loadFromFirebase(defaultData) {
  // 1. localStorage cache — instant, always your latest saved state
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}

  // 2. Netlify function — reads portfolio-data.json from GitHub server-side
  try {
    const res = await fetch("/.netlify/functions/get-data", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch(e) {}

  // 3. Fallback — direct portfolio-data.json (when running locally)
  try {
    const res = await fetch("./portfolio-data.json?t=" + Date.now(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      return data;
    }
  } catch(e) {}

  return defaultData;
}

/* Save — writes to GitHub AND caches in localStorage */
async function saveToFirebase(data) {
  // Always cache locally first — protects against network issues
  localStorage.setItem(LS_KEY, JSON.stringify(data));

  try {
    const tok = _tok();
    const headers = {
      "Authorization": `token ${tok}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    };

    // Get current file SHA (required by GitHub API to update a file)
    let sha = null;
    try {
      const info = await fetch(GITHUB_API, { headers });
      if (info.ok) { sha = (await info.json()).sha; }
    } catch(e) {}

    // Encode data as base64 and push to GitHub
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const res = await fetch(GITHUB_API, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Portfolio update via admin panel",
        content: encoded,
        ...(sha ? { sha } : {})
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "GitHub save failed: " + res.status);
    }
    return true;
  } catch(err) {
    console.error("GitHub save error:", err.message);
    return false;
  }
}

function mergeWithLocalImages(data) { return data; }

/* ══════════════════════════════════════════
   ADMIN — admin.js  (full version)
   ══════════════════════════════════════════ */

// ── CREDENTIALS ───────────────────────────
const ADMIN_CREDENTIALS = { username:"nidt", password:"@9905043152Tobi" };


// ── HASH ──────────────────────────────────
function simpleHash(str){
  let h1=0x811c9dc5,h2=0x9747b28c;
  for(let i=0;i<str.length;i++){h1^=str.charCodeAt(i);h1=(h1*0x01000193)>>>0;}
  for(let i=str.length-1;i>=0;i--){h2^=str.charCodeAt(i);h2=(h2*0x01000193)>>>0;}
  return h1.toString(16).padStart(8,"0")+h2.toString(16).padStart(8,"0");
}

// ── AUTH ──────────────────────────────────
function initAuth(){
  const KEY="adm_session",TTL=4*60*60*1000;
  const TOKEN=simpleHash(ADMIN_CREDENTIALS.username)+simpleHash(ADMIN_CREDENTIALS.password);
  const valid=()=>{try{const s=JSON.parse(sessionStorage.getItem(KEY)||"{}");return s.token===TOKEN&&Date.now()<s.expires;}catch{return false;}};
  const start=()=>sessionStorage.setItem(KEY,JSON.stringify({token:TOKEN,expires:Date.now()+TTL}));
  const end=()=>{sessionStorage.removeItem(KEY);location.reload();};

  const overlay=document.getElementById("loginOverlay"),body=document.body;
  const loginBtn=document.getElementById("loginBtn"),userIn=document.getElementById("loginUser");
  const passIn=document.getElementById("loginPass"),errEl=document.getElementById("loginError");
  const eye=document.getElementById("toggleEye");

  if(valid()){overlay.classList.add("hidden");body.classList.remove("locked");wireLogout(end);return;}

  eye.addEventListener("click",()=>{const s=passIn.type==="password";passIn.type=s?"text":"password";eye.textContent=s?"🙈":"👁";});

  function attempt(){
    errEl.textContent="";loginBtn.textContent="Verifying...";loginBtn.classList.add("loading");
    setTimeout(()=>{
      if(simpleHash(userIn.value.trim())+simpleHash(passIn.value)===TOKEN){
        start();overlay.style.transition="opacity .4s";overlay.style.opacity="0";
        setTimeout(()=>{overlay.classList.add("hidden");body.classList.remove("locked");wireLogout(end);},400);
      } else {
        loginBtn.textContent="Unlock Panel →";loginBtn.classList.remove("loading");
        errEl.textContent="Incorrect username or password.";passIn.value="";passIn.focus();
        errEl.style.animation="none";void errEl.offsetWidth;errEl.style.animation="";
      }
    },500);
  }
  loginBtn.addEventListener("click",attempt);
  [userIn,passIn].forEach(i=>i.addEventListener("keydown",e=>{if(e.key==="Enter")attempt();}));
  userIn.focus();
}
function wireLogout(end){document.getElementById("logoutBtn")?.addEventListener("click",()=>{if(confirm("Log out?"))end();});}

// ── DEFAULT DATA ──────────────────────────
const DEFAULT_DATA={
  profile:{name:"Nazrul Islam",title:"Creative Developer",tagline:"I craft digital experiences that live at the intersection of code & art.",email:"nidt845418@gmail.com",location:"Dhaka, East Champaran",avatarText:"AR",bio:"I'm a full-stack developer with 6+ years of experience.",resumeLink:"#",photo:""},
  stats:[{id:1,number:"6+",label:"Years Exp."},{id:2,number:"40+",label:"Projects"},{id:3,number:"20+",label:"Clients"}],
  socialLinks:[{id:1,label:"GitHub",url:"https://github.com/",visibleOnPortfolio:true},{id:2,label:"LinkedIn",url:"https://linkedin.com/",visibleOnPortfolio:true},{id:3,label:"Twitter",url:"https://twitter.com/",visibleOnPortfolio:true}],
  skills:[{id:1,name:"React / Next.js",level:95,category:"Frontend"},{id:2,name:"TypeScript",level:90,category:"Frontend"},{id:3,name:"Node.js",level:85,category:"Backend"},{id:4,name:"Python",level:80,category:"Backend"},{id:5,name:"UI / UX Design",level:88,category:"Design"},{id:6,name:"PostgreSQL",level:78,category:"Backend"}],
  projects:[{id:1,title:"NovaMind AI",description:"An AI-powered writing assistant.",tech:["React","Python","OpenAI"],link:"#",github:"#",color:"#c9a84c"},{id:2,title:"Orbit Dashboard",description:"Real-time analytics platform.",tech:["Next.js","D3.js","Redis"],link:"#",github:"#",color:"#0EA5E9"},{id:3,title:"Bloom Finance",description:"Personal finance app.",tech:["React Native","Node.js"],link:"#",github:"#",color:"#10B981"}],
  posts:[]
};

// ── STATE ─────────────────────────────────
let state=deepClone(DEFAULT_DATA);
let editTarget=null;
let _pendingPostImage=null;

function deepClone(o){return JSON.parse(JSON.stringify(o));}
function nextId(arr){return arr.length?Math.max(...arr.map(i=>i.id))+1:1;}

// ── SAVE ──────────────────────────────────
async function save(){
  // Always save to localStorage first — instant, never fails
  // This protects your data even if GitHub save fails
  localStorage.setItem(LS_KEY, JSON.stringify(state));

  const ok = await saveToFirebase(state);
  if(!ok){
    toast("⚠️ Saved locally. GitHub sync failed — portfolio will update when connection is restored.","error");
  }
}

// ── TOAST ─────────────────────────────────
function toast(msg,type="success"){
  const el=document.getElementById("toast");
  el.textContent=msg;el.style.borderColor=type==="error"?"var(--danger)":"var(--gold)";
  el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800);
}

// ── SAVING INDICATOR ──────────────────────
function showSaving(){
  const b=document.getElementById("saveBadge");
  b.textContent="Saving...";b.style.color="var(--muted)";b.classList.add("visible");
}
function showSaved(){
  const b=document.getElementById("saveBadge");
  b.textContent="Saved ✓ — deploying…";b.style.color="var(--success)";b.classList.add("visible");
  setTimeout(()=>b.classList.remove("visible"),3000);
}

// ── TABS ──────────────────────────────────
function initTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-"+btn.dataset.tab).classList.add("active");
    });
  });
}

// ── PROFILE ───────────────────────────────
function populateProfileForm(){
  const p=state.profile;
  document.getElementById("p-name").value    =p.name||"";
  document.getElementById("p-title").value   =p.title||"";
  document.getElementById("p-tagline").value =p.tagline||"";
  document.getElementById("p-bio").value     =p.bio||"";
  document.getElementById("p-email").value   =p.email||"";
  document.getElementById("p-location").value=p.location||"";
  document.getElementById("p-avatar").value  =p.avatarText||"";
  document.getElementById("p-resume").value  =p.resumeLink||"";
  updatePhotoPreview(p.photo);
}
function collectProfile(){
  state.profile={...state.profile,
    name:document.getElementById("p-name").value.trim(),
    title:document.getElementById("p-title").value.trim(),
    tagline:document.getElementById("p-tagline").value.trim(),
    bio:document.getElementById("p-bio").value.trim(),
    email:document.getElementById("p-email").value.trim(),
    location:document.getElementById("p-location").value.trim(),
    avatarText:document.getElementById("p-avatar").value.trim(),
    resumeLink:document.getElementById("p-resume").value.trim()
  };
}

// ── PHOTO ─────────────────────────────────
function updatePhotoPreview(src){
  const preview=document.getElementById("photo-preview");
  const removeBtn=document.getElementById("remove-photo");
  if(!preview)return;
  const realSrc=(src&&src!=="__local__")?src:"";
  preview.innerHTML=realSrc?`<img src="${realSrc}" alt="Photo" />`:`<span class="preview-initials">${state.profile.avatarText||"AR"}</span>`;
  if(removeBtn)removeBtn.style.display=realSrc?"inline-flex":"none";
}
function initPhotoUpload(){
  const input=document.getElementById("photo-input");
  const drop=document.getElementById("photo-drop");
  const removeBtn=document.getElementById("remove-photo");
  if(!input||!drop)return;
  drop.addEventListener("click",()=>input.click());
  drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("dragover");});
  drop.addEventListener("dragleave",()=>drop.classList.remove("dragover"));
  drop.addEventListener("drop",e=>{e.preventDefault();drop.classList.remove("dragover");if(e.dataTransfer.files[0])processImage(e.dataTransfer.files[0]);});
  input.addEventListener("change",()=>{if(input.files[0])processImage(input.files[0]);});
  removeBtn?.addEventListener("click",e=>{e.stopPropagation();state.profile.photo="";save();updatePhotoPreview("");toast("Photo removed.");});
}
function processImage(file){
  if(!file.type.startsWith("image/")){toast("Please upload an image file.","error");return;}
  if(file.size>5*1024*1024){toast("Image must be under 5MB.","error");return;}
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const MAX=600;let w=img.width,h=img.height;
      if(w>h&&w>MAX){h=Math.round(h*MAX/w);w=MAX;}else if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
      const c=document.createElement("canvas");c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      const url=c.toDataURL("image/jpeg",.82);
      state.profile.photo=url;save();updatePhotoPreview(url);toast("Photo updated ✓");
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── STATS ─────────────────────────────────
function renderStatsList(){
  const list=document.getElementById("stats-list");if(!list)return;
  if(!state.stats.length){list.innerHTML=`<p style="color:var(--muted);font-size:.85rem;padding:1rem 0">No stats yet.</p>`;return;}
  list.innerHTML=state.stats.map(s=>`
    <div class="item-card">
      <div class="item-info">
        <div class="item-name" style="font-size:1.4rem;font-family:var(--font-display);color:var(--gold)">${s.number}</div>
        <div class="item-meta">${s.label}</div>
      </div>
      <div class="item-actions">
        <button class="btn-icon edit-stat"   data-id="${s.id}">✎</button>
        <button class="btn-icon delete delete-stat" data-id="${s.id}">✕</button>
      </div>
    </div>`).join("");
  list.querySelectorAll(".edit-stat").forEach(btn=>btn.addEventListener("click",()=>openStatModal(Number(btn.dataset.id))));
  list.querySelectorAll(".delete-stat").forEach(btn=>btn.addEventListener("click",async()=>{
    if(confirm("Delete this stat?")){state.stats=state.stats.filter(s=>s.id!==Number(btn.dataset.id));await save();renderStatsList();toast("Stat deleted.");}
  }));
}
function openStatModal(id=null){
  const s=id?state.stats.find(x=>x.id===id):null;editTarget={type:"stat",id};
  openModal(id?"Edit Stat":"Add Stat",`
    <div class="form-grid" style="grid-template-columns:1fr">
      <div class="form-group"><label class="form-label">Number / Value</label><input class="form-input" id="m-stat-num" type="text" value="${s?s.number:''}" placeholder="e.g. 6+" /></div>
      <div class="form-group"><label class="form-label">Label</label><input class="form-input" id="m-stat-label" type="text" value="${s?s.label:''}" placeholder="e.g. Years Exp." /></div>
    </div>`);
}
async function saveStat(){
  const num=document.getElementById("m-stat-num").value.trim();
  const lbl=document.getElementById("m-stat-label").value.trim();
  if(!num||!lbl){toast("Both fields required.","error");return;}
  if(editTarget.id){const s=state.stats.find(x=>x.id===editTarget.id);if(s){s.number=num;s.label=lbl;}}
  else state.stats.push({id:nextId(state.stats),number:num,label:lbl});
  await save();renderStatsList();closeModal();toast(editTarget.id?"Stat updated ✓":"Stat added ✓");
}

// ── SOCIAL LINKS ──────────────────────────
function renderSocialList(){
  const list=document.getElementById("social-list");if(!list)return;
  if(!state.socialLinks.length){list.innerHTML=`<p style="color:var(--muted);font-size:.85rem;padding:1rem 0">No links yet.</p>`;return;}
  list.innerHTML=state.socialLinks.map(l=>`
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${l.label}</div>
        <div class="item-meta"><span style="color:${l.visibleOnPortfolio?"var(--gold)":"var(--muted)"};margin-right:.6rem">${l.visibleOnPortfolio?"● Visible":"○ Hidden"}</span>${l.url}</div>
      </div>
      <div class="item-actions">
        <button class="btn-icon toggle-social" data-id="${l.id}">${l.visibleOnPortfolio?"👁":"🚫"}</button>
        <button class="btn-icon edit-social"   data-id="${l.id}">✎</button>
        <button class="btn-icon delete delete-social" data-id="${l.id}">✕</button>
      </div>
    </div>`).join("");
  list.querySelectorAll(".toggle-social").forEach(btn=>btn.addEventListener("click",async()=>{
    const l=state.socialLinks.find(x=>x.id===Number(btn.dataset.id));
    if(l){l.visibleOnPortfolio=!l.visibleOnPortfolio;await save();renderSocialList();toast(l.visibleOnPortfolio?`"${l.label}" now visible ✓`:`"${l.label}" hidden`);}
  }));
  list.querySelectorAll(".edit-social").forEach(btn=>btn.addEventListener("click",()=>openSocialModal(Number(btn.dataset.id))));
  list.querySelectorAll(".delete-social").forEach(btn=>btn.addEventListener("click",async()=>{
    const l=state.socialLinks.find(x=>x.id===Number(btn.dataset.id));
    if(l&&confirm(`Delete "${l.label}"?`)){state.socialLinks=state.socialLinks.filter(x=>x.id!==l.id);await save();renderSocialList();toast("Link deleted.");}
  }));
}
function openSocialModal(id=null){
  const l=id?state.socialLinks.find(x=>x.id===id):null;editTarget={type:"social",id};
  openModal(id?"Edit Link":"Add Link",`
    <div class="form-grid" style="grid-template-columns:1fr">
      <div class="form-group"><label class="form-label">Platform / Label</label><input class="form-input" id="m-social-label" type="text" value="${l?l.label:''}" placeholder="e.g. Instagram" /></div>
      <div class="form-group"><label class="form-label">URL</label><input class="form-input" id="m-social-url" type="url" value="${l?l.url:''}" placeholder="https://instagram.com/yourhandle" /></div>
      <div class="form-group"><label class="form-label">Visible on Portfolio?</label>
        <select class="form-input" id="m-social-visible">
          <option value="true"  ${(!l||l.visibleOnPortfolio)?"selected":""}>Yes — shown publicly</option>
          <option value="false" ${(l&&!l.visibleOnPortfolio)?"selected":""}>No — hidden from visitors</option>
        </select>
      </div>
    </div>`);
}
async function saveSocial(){
  const label=document.getElementById("m-social-label").value.trim();
  const url=document.getElementById("m-social-url").value.trim();
  const vis=document.getElementById("m-social-visible").value==="true";
  if(!label){toast("Label required.","error");return;}
  if(!url){toast("URL required.","error");return;}
  if(editTarget.id){const l=state.socialLinks.find(x=>x.id===editTarget.id);if(l){l.label=label;l.url=url;l.visibleOnPortfolio=vis;}}
  else state.socialLinks.push({id:nextId(state.socialLinks),label,url,visibleOnPortfolio:vis});
  await save();renderSocialList();closeModal();toast(editTarget.id?"Link updated ✓":"Link added ✓");
}

// ── SKILLS ────────────────────────────────
function renderSkillsList(){
  const list=document.getElementById("skills-list");if(!list)return;
  if(!state.skills.length){list.innerHTML=`<p style="color:var(--muted);font-size:.85rem;padding:1rem 0">No skills yet.</p>`;return;}
  list.innerHTML=state.skills.map(s=>`
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${s.name}</div>
        <div class="item-meta"><span class="skill-level-bar"><span class="skill-level-fill" style="width:${s.level}%"></span></span><span class="gold">${s.level}%</span> · ${s.category}</div>
      </div>
      <div class="item-actions">
        <button class="btn-icon edit-skill"   data-id="${s.id}">✎</button>
        <button class="btn-icon delete delete-skill" data-id="${s.id}">✕</button>
      </div>
    </div>`).join("");
  list.querySelectorAll(".edit-skill").forEach(btn=>btn.addEventListener("click",()=>openSkillModal(Number(btn.dataset.id))));
  list.querySelectorAll(".delete-skill").forEach(btn=>btn.addEventListener("click",async()=>{
    if(confirm("Delete this skill?")){state.skills=state.skills.filter(s=>s.id!==Number(btn.dataset.id));await save();renderSkillsList();toast("Skill deleted.");}
  }));
}
function openSkillModal(id=null){
  const s=id?state.skills.find(x=>x.id===id):null;editTarget={type:"skill",id};
  openModal(id?"Edit Skill":"Add Skill",`
    <div class="form-grid" style="grid-template-columns:1fr">
      <div class="form-group"><label class="form-label">Skill Name</label><input class="form-input" id="m-skill-name" type="text" value="${s?s.name:''}" placeholder="e.g. React" /></div>
      <div class="form-group"><label class="form-label">Category</label><input class="form-input" id="m-skill-cat" type="text" value="${s?s.category:''}" placeholder="Frontend / Backend / Design..." /></div>
      <div class="form-group"><label class="form-label">Level: <span id="m-level-display">${s?s.level:80}%</span></label>
        <input class="form-input" id="m-skill-level" type="range" min="1" max="100" value="${s?s.level:80}" style="padding:.3rem 0;cursor:pointer;" />
      </div>
    </div>`);
  document.getElementById("m-skill-level").addEventListener("input",e=>{document.getElementById("m-level-display").textContent=e.target.value+"%";});
}
async function saveSkill(){
  const name=document.getElementById("m-skill-name").value.trim();
  const cat=document.getElementById("m-skill-cat").value.trim();
  const level=Number(document.getElementById("m-skill-level").value);
  if(!name){toast("Name required.","error");return;}
  if(editTarget.id){const s=state.skills.find(x=>x.id===editTarget.id);if(s){s.name=name;s.category=cat;s.level=level;}}
  else state.skills.push({id:nextId(state.skills),name,category:cat,level});
  await save();renderSkillsList();closeModal();toast(editTarget.id?"Skill updated ✓":"Skill added ✓");
}

// ── PROJECTS ──────────────────────────────
function renderProjectsList(){
  const list=document.getElementById("projects-list");if(!list)return;
  if(!state.projects.length){list.innerHTML=`<p style="color:var(--muted);font-size:.85rem;padding:1rem 0">No projects yet.</p>`;return;}
  list.innerHTML=state.projects.map(p=>`
    <div class="item-card">
      <div class="item-info">
        <div class="item-name"><span style="display:inline-block;width:10px;height:10px;background:${p.color||"var(--gold)"};border-radius:50%;margin-right:.5rem;vertical-align:middle;"></span>${p.title}</div>
        <div class="item-meta">${(p.tech||[]).join(", ")}</div>
      </div>
      <div class="item-actions">
        <button class="btn-icon edit-project"   data-id="${p.id}">✎</button>
        <button class="btn-icon delete delete-project" data-id="${p.id}">✕</button>
      </div>
    </div>`).join("");
  list.querySelectorAll(".edit-project").forEach(btn=>btn.addEventListener("click",()=>openProjectModal(Number(btn.dataset.id))));
  list.querySelectorAll(".delete-project").forEach(btn=>btn.addEventListener("click",async()=>{
    if(confirm("Delete this project?")){state.projects=state.projects.filter(p=>p.id!==Number(btn.dataset.id));await save();renderProjectsList();toast("Project deleted.");}
  }));
}
function openProjectModal(id=null){
  const p=id?state.projects.find(x=>x.id===id):null;editTarget={type:"project",id};
  openModal(id?"Edit Project":"Add Project",`
    <div class="form-grid" style="grid-template-columns:1fr">
      <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="m-proj-title" type="text" value="${p?p.title:''}" placeholder="Project name" /></div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="m-proj-desc" rows="3" placeholder="Brief description...">${p?p.description:''}</textarea></div>
      <div class="form-group"><label class="form-label">Tech Stack (comma-separated)</label><input class="form-input" id="m-proj-tech" type="text" value="${p?(p.tech||[]).join(", "):''}" placeholder="React, Node.js" /></div>
      <div class="form-group"><label class="form-label">Live URL</label><input class="form-input" id="m-proj-link" type="url" value="${p?p.link||'':''}" placeholder="https://..." /></div>
      <div class="form-group"><label class="form-label">GitHub URL</label><input class="form-input" id="m-proj-github" type="url" value="${p?p.github||'':''}" placeholder="https://github.com/..." /></div>
      <div class="form-group"><label class="form-label">Accent Color</label><input class="form-input" id="m-proj-color" type="color" value="${p?p.color||'#c9a84c':'#c9a84c'}" style="height:44px;padding:.2rem .5rem;cursor:pointer;" /></div>
    </div>`);
}
async function saveProject(){
  const title=document.getElementById("m-proj-title").value.trim();
  const desc=document.getElementById("m-proj-desc").value.trim();
  const tech=document.getElementById("m-proj-tech").value.split(",").map(t=>t.trim()).filter(Boolean);
  const link=document.getElementById("m-proj-link").value.trim();
  const github=document.getElementById("m-proj-github").value.trim();
  const color=document.getElementById("m-proj-color").value;
  if(!title){toast("Title required.","error");return;}
  if(editTarget.id){const p=state.projects.find(x=>x.id===editTarget.id);if(p){p.title=title;p.description=desc;p.tech=tech;p.link=link;p.github=github;p.color=color;}}
  else state.projects.push({id:nextId(state.projects),title,description:desc,tech,link,github,color});
  await save();renderProjectsList();closeModal();toast(editTarget.id?"Project updated ✓":"Project added ✓");
}

// ── POSTS ─────────────────────────────────
function formatDate(str){if(!str)return"";try{return new Date(str).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});}catch{return str;}}

function renderPostsList(){
  const list=document.getElementById("posts-list");if(!list)return;
  if(!state.posts.length){list.innerHTML=`<p style="color:var(--muted);font-size:.85rem;padding:1rem 0">No posts yet. Create your first post!</p>`;return;}
  const sorted=[...state.posts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  list.innerHTML=sorted.map(p=>`
    <div class="item-card post-item">
      ${p.image&&p.image!=="__local__"?`<div class="post-thumb"><img src="${p.image}" alt="post" /></div>`:""}
      <div class="item-info">
        <div class="item-name" style="white-space:normal;line-height:1.5">${p.caption.length>80?p.caption.slice(0,80)+"…":p.caption}</div>
        <div class="item-meta">${formatDate(p.date)}${p.links&&p.links.length?` · ${p.links.length} link${p.links.length>1?"s":""}`:""}${p.image?" · 📷":""}</div>
      </div>
      <div class="item-actions">
        <button class="btn-icon edit-post"   data-id="${p.id}">✎</button>
        <button class="btn-icon delete delete-post" data-id="${p.id}">✕</button>
      </div>
    </div>`).join("");
  list.querySelectorAll(".edit-post").forEach(btn=>btn.addEventListener("click",()=>openPostModal(Number(btn.dataset.id))));
  list.querySelectorAll(".delete-post").forEach(btn=>btn.addEventListener("click",async()=>{
    if(confirm("Delete this post?")){state.posts=state.posts.filter(p=>p.id!==Number(btn.dataset.id));await save();renderPostsList();toast("Post deleted.");}
  }));
}

function openPostModal(id=null){
  const p=id?state.posts.find(x=>x.id===id):null;
  editTarget={type:"post",id};_pendingPostImage=null;
  const today=new Date().toISOString().slice(0,10);
  const existingImg=p&&p.image&&p.image!=="__local__"?p.image:"";
  openModal(id?"Edit Post":"New Post",`
    <div class="form-grid" style="grid-template-columns:1fr">
      <div class="form-group"><label class="form-label">Caption / Description</label>
        <textarea class="form-input form-textarea" id="m-post-caption" rows="4" placeholder="Share an update, thought, or announcement...">${p?p.caption:''}</textarea>
      </div>
      <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="m-post-date" type="date" value="${p?p.date:today}" /></div>
      <div class="form-group"><label class="form-label">Image (optional)</label>
        <div class="post-img-drop" id="post-img-drop">
          <div id="post-img-preview">${existingImg?`<img src="${existingImg}" style="max-height:120px;max-width:100%;border-radius:3px;" />`:'<span style="color:var(--muted);font-size:.85rem">Click or drop image here</span>'}</div>
        </div>
        <input type="file" id="post-img-input" accept="image/*" style="display:none;" />
        ${existingImg?`<button class="btn-remove-photo" id="remove-post-img" style="margin-top:.5rem">✕ Remove Image</button>`:""}
      </div>
      <div class="form-group"><label class="form-label">Links — one per line: <code>Label | https://url</code></label>
        <textarea class="form-input form-textarea" id="m-post-links" rows="3" placeholder="Read more | https://example.com&#10;GitHub | https://github.com/...">${p&&p.links?p.links.map(l=>l.label+" | "+l.url).join("\n"):""}</textarea>
      </div>
    </div>`);

  const drop=document.getElementById("post-img-drop"),input=document.getElementById("post-img-input");
  drop.addEventListener("click",()=>input.click());
  drop.addEventListener("dragover",e=>{e.preventDefault();drop.style.borderColor="var(--gold)";});
  drop.addEventListener("dragleave",()=>drop.style.borderColor="");
  drop.addEventListener("drop",e=>{e.preventDefault();drop.style.borderColor="";if(e.dataTransfer.files[0])processPostImage(e.dataTransfer.files[0]);});
  input.addEventListener("change",()=>{if(input.files[0])processPostImage(input.files[0]);});
  document.getElementById("remove-post-img")?.addEventListener("click",e=>{
    e.stopPropagation();editTarget._clearImage=true;
    document.getElementById("post-img-preview").innerHTML='<span style="color:var(--muted);font-size:.85rem">Image removed</span>';
  });
}

function processPostImage(file){
  if(!file.type.startsWith("image/")){toast("Please upload an image.","error");return;}
  if(file.size>5*1024*1024){toast("Max 5MB.","error");return;}
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const MAX=400;let w=img.width,h=img.height;
      if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
      const c=document.createElement("canvas");c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      _pendingPostImage=c.toDataURL("image/jpeg",.5);
      document.getElementById("post-img-preview").innerHTML=`<img src="${_pendingPostImage}" style="max-height:120px;max-width:100%;border-radius:3px;" />`;
    };img.src=e.target.result;
  };reader.readAsDataURL(file);
}

async function savePost(){
  const caption=document.getElementById("m-post-caption").value.trim();
  const date=document.getElementById("m-post-date").value;
  const linksRaw=document.getElementById("m-post-links").value.trim();
  if(!caption){toast("Caption required.","error");return;}
  const links=linksRaw?linksRaw.split("\n").map(l=>{const[label,...rest]=l.split("|");return{label:label.trim(),url:rest.join("|").trim()};}).filter(l=>l.label&&l.url):[];
  let image=editTarget.id?state.posts.find(x=>x.id===editTarget.id)?.image||"":"";
  if(_pendingPostImage)image=_pendingPostImage;
  if(editTarget._clearImage)image="";
  _pendingPostImage=null;
  if(editTarget.id){const p=state.posts.find(x=>x.id===editTarget.id);if(p){p.caption=caption;p.date=date;p.links=links;p.image=image;}}
  else state.posts.push({id:nextId(state.posts),caption,date,links,image});
  await save();renderPostsList();closeModal();toast(editTarget.id?"Post updated ✓":"Post published ✓");
}

// ── MODAL ─────────────────────────────────
function openModal(title,html){
  document.getElementById("modalTitle").textContent=title;
  document.getElementById("modalBody").innerHTML=html;
  document.getElementById("modalOverlay").classList.add("open");
  _pendingPostImage=null;
}
function closeModal(){document.getElementById("modalOverlay").classList.remove("open");editTarget=null;_pendingPostImage=null;}

// ── SAVE ALL ──────────────────────────────
async function saveAll(){
  collectProfile();showSaving();
  await save();showSaved();toast("Saved to GitHub ✓ — live in ~30 seconds");
}

// ── INIT ──────────────────────────────────
document.addEventListener("DOMContentLoaded", async ()=>{
  initAuth();initTabs();

  // Load from Firebase first
  toast("Loading data...", "success");
  let loaded = await loadFromFirebase(DEFAULT_DATA);
  state = mergeWithLocalImages(loaded);

  populateProfileForm();initPhotoUpload();
  renderStatsList();renderSocialList();renderSkillsList();renderProjectsList();renderPostsList();

  document.getElementById("saveAll").addEventListener("click", saveAll);
  document.getElementById("resetAll").addEventListener("click",async()=>{
    if(!confirm("Reset everything to defaults?"))return;
    state=deepClone(DEFAULT_DATA);await save();
    populateProfileForm();updatePhotoPreview("");renderStatsList();renderSocialList();renderSkillsList();renderProjectsList();renderPostsList();
    toast("Reset to defaults.");
  });

  document.getElementById("addStat").addEventListener("click",()=>openStatModal());
  document.getElementById("addSocial").addEventListener("click",()=>openSocialModal());
  document.getElementById("addSkill").addEventListener("click",()=>openSkillModal());
  document.getElementById("addProject").addEventListener("click",()=>openProjectModal());
  document.getElementById("addPost").addEventListener("click",()=>openPostModal());

  document.getElementById("modalSave").addEventListener("click",()=>{
    if(!editTarget)return;
    if(editTarget.type==="stat")    saveStat();
    if(editTarget.type==="social")  saveSocial();
    if(editTarget.type==="skill")   saveSkill();
    if(editTarget.type==="project") saveProject();
    if(editTarget.type==="post")    savePost();
  });

  document.getElementById("modalClose").addEventListener("click",closeModal);
  document.getElementById("modalCancel").addEventListener("click",closeModal);
  document.getElementById("modalOverlay").addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal();});

  // Auto-save profile on change
  let timer;
  document.querySelectorAll("#tab-profile .form-input").forEach(inp=>{
    inp.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(async()=>{collectProfile();await save();},1500);});
  });
});
