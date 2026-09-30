(function(){
  const API_BASE='https://horiyume-site-api.mutenrosi-01.workers.dev';
  const DRAFT_KEY='horiyumeDraftConfigV3';
  const PUBLISHED_KEY='horiyumePublishedConfigV3';
  const LEGACY_DRAFT_KEY='horiyumeDraftConfigV2';
  const LEGACY_PUBLISHED_KEY='horiyumePublishedConfigV2';
  const STORE_KEY='horiyumeStoreSettings';
  const SESSION_PIN_KEY='horiyumeAdminSessionPinV1';
  const DEFAULTS={
    identity:{studio:'HORIYUME',artistJa:'彫夢',artistEn:'HORIYUME'},
    homeCopy:{lead:'彫りの世界観を、肌に刻む。',copy:'伝統と現代が交わる、\n唯一無二の和彫りを。'},
    storeSettings:{address:'',businessHours:'',holiday:'',mapQuery:''},
    textEdits:{},imageEdits:{},galleryExtraImages:[],background:'',bookingEmail:''
  };
  const TEXT_SELECTOR='h1,h2,h3,p,b,small,span,.value,.label';
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(base,next){const out=clone(base);next=next||{};Object.keys(next).forEach(k=>{if(next[k]&&typeof next[k]==='object'&&!Array.isArray(next[k])&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k]))out[k]=Object.assign({},out[k],next[k]);else out[k]=next[k]});return out}
  function raw(key){try{return localStorage.getItem(key)}catch(e){return null}}
  function read(key){try{return merge(DEFAULTS,JSON.parse(raw(key)||'null')||{})}catch(e){return clone(DEFAULTS)}}
  function write(key,cfg){const v=merge(DEFAULTS,cfg||{});try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}return v}
  function legacySeed(){
    let v=clone(DEFAULTS);
    try{const s=JSON.parse(raw(STORE_KEY)||'null');if(s&&typeof s==='object')v.storeSettings=Object.assign({},v.storeSettings,s)}catch(e){}
    try{const c=JSON.parse(raw('horiyumeHomeCopy')||'null');if(c&&typeof c==='object')v.homeCopy=Object.assign({},v.homeCopy,c)}catch(e){}
    try{const i=JSON.parse(raw('horiyumeSiteIdentity')||'null');if(i&&typeof i==='object')v.identity=Object.assign({},v.identity,i)}catch(e){}
    return v;
  }
  function published(){
    if(raw(PUBLISHED_KEY)!==null)return read(PUBLISHED_KEY);
    if(raw(LEGACY_PUBLISHED_KEY)!==null){const v=read(LEGACY_PUBLISHED_KEY);write(PUBLISHED_KEY,v);return v}
    const v=legacySeed();write(PUBLISHED_KEY,v);return v;
  }
  function draft(){
    if(raw(DRAFT_KEY)!==null)return read(DRAFT_KEY);
    if(raw(LEGACY_DRAFT_KEY)!==null){const v=read(LEGACY_DRAFT_KEY);write(DRAFT_KEY,v);return v}
    return published();
  }
  function saveDraft(cfg){return write(DRAFT_KEY,cfg)}
  function publishLocal(cfg){const saved=write(PUBLISHED_KEY,cfg||draft());write(DRAFT_KEY,saved);return saved}
  async function api(path,opt={}){
    const headers=Object.assign({'content-type':'application/json'},opt.headers||{});
    const res=await fetch(API_BASE+path,Object.assign({cache:'no-store'},opt,{headers}));
    let data={};try{data=await res.json()}catch(e){}
    if(!res.ok||data.status==='ERROR'){const err=new Error(data.error||('HTTP '+res.status));err.status=res.status;err.code=data.error||'';throw err}
    return data;
  }
  async function fetchPublished(){try{const r=await api('/api/site',{method:'GET',headers:{}});return write(PUBLISHED_KEY,merge(DEFAULTS,r.config||{}))}catch(e){console.warn('HORIYUME published fallback',e);return published()}}
  async function adminStatus(){return api('/api/admin/status',{method:'GET',headers:{}})}
  async function setupPass(pin){const r=await api('/api/admin/setup',{method:'POST',body:JSON.stringify({pin})});sessionStorage.setItem(SESSION_PIN_KEY,pin);return r}
  async function login(pin){const r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({pin})});sessionStorage.setItem(SESSION_PIN_KEY,pin);return r}
  async function loadDraftRemote(pin){const r=await api('/api/admin/draft',{method:'GET',headers:{'x-horiyume-pin':pin}});return write(DRAFT_KEY,merge(DEFAULTS,r.config||{}))}
  async function saveDraftRemote(cfg,pin){const local=saveDraft(cfg);const r=await api('/api/admin/draft',{method:'POST',headers:{'x-horiyume-pin':pin},body:JSON.stringify({config:local})});return write(DRAFT_KEY,merge(DEFAULTS,r.config||local))}
  async function publishRemote(cfg,pin){const local=saveDraft(cfg);const r=await api('/api/admin/publish',{method:'POST',headers:{'x-horiyume-pin':pin},body:JSON.stringify({config:local})});const saved=merge(DEFAULTS,r.config||local);write(DRAFT_KEY,saved);write(PUBLISHED_KEY,saved);return saved}
  async function changePass(currentPin,newPin){const r=await api('/api/admin/pin',{method:'POST',body:JSON.stringify({currentPin,newPin})});sessionStorage.setItem(SESSION_PIN_KEY,newPin);return r}
  async function uploadImage(dataUrl,pin){return api('/api/admin/image',{method:'POST',headers:{'x-horiyume-pin':pin},body:JSON.stringify({dataUrl})})}
  async function listInquiries(pin){const r=await api('/api/admin/inquiries',{method:'GET',headers:{'x-horiyume-pin':pin}});return r.items||[]}
  async function submitInquiry(payload){return api('/api/inquiry',{method:'POST',body:JSON.stringify(payload)})}
  function sessionPin(){return sessionStorage.getItem(SESSION_PIN_KEY)||''}
  function clearSessionPin(){sessionStorage.removeItem(SESSION_PIN_KEY)}
  function roomRoot(doc,room){return room==='top'?doc.getElementById('page-top'):doc.getElementById('page-'+room)}
  function textTargets(root){return root?Array.from(root.querySelectorAll(TEXT_SELECTOR)).filter(el=>el.children.length===0&&String(el.textContent||'').trim()):[]}
  function imageTargets(root){return root?Array.from(root.querySelectorAll('img')):[]}
  function assignKeys(doc){['top','price','voice','gallery','sns','map','booking'].forEach(room=>{const root=roomRoot(doc,room);if(!root)return;textTargets(root).forEach((el,i)=>{if(!el.dataset.horiyumeKey)el.dataset.horiyumeKey=room+':text:'+i});imageTargets(root).forEach((el,i)=>{if(!el.dataset.horiyumeKey)el.dataset.horiyumeKey=room+':image:'+i})})}
  function injectMobile(doc){if(doc.getElementById('horiyume-mobile-fix'))return;const s=doc.createElement('style');s.id='horiyume-mobile-fix';s.textContent=`@media (max-width:900px) and (orientation:portrait){.rotate-gate,.subpage-rotate-gate{display:none!important}#page-price .page,#page-voice .page,#page-gallery .page,#page-sns .page,#page-map .page,#page-booking .page{visibility:visible!important;display:block!important}#page-price .site-header,#page-voice .site-header,#page-gallery .site-header,#page-sns .site-header,#page-map .site-header,#page-booking .site-header{display:flex!important}html,body{overflow:auto!important;overflow-x:hidden!important}.page,.shell,.stage{max-width:100vw!important}img,iframe{max-width:100%!important}}`; (doc.head||doc.documentElement).appendChild(s)}
  function applyIdentity(doc,cfg){const id=cfg.identity||DEFAULTS.identity;doc.title=`Artist — ${id.artistJa} / ${id.artistEn}`;doc.querySelectorAll('body *').forEach(el=>{if(el.children.length===0&&el.textContent)el.textContent=el.textContent.replace(/KOKURYU TATTOO STUDIO/g,id.studio).replace(/KOKURYU/g,id.studio);['aria-label','title','alt'].forEach(a=>{const v=el.getAttribute&&el.getAttribute(a);if(v&&/KOKURYU/.test(v))el.setAttribute(a,v.replace(/KOKURYU TATTOO STUDIO/g,id.studio).replace(/KOKURYU/g,id.studio))})})}
  function applyBackground(doc,cfg){let s=doc.getElementById('horiyume-bg-override');if(!cfg.background){if(s)s.remove();return}if(!s){s=doc.createElement('style');s.id='horiyume-bg-override';doc.head.appendChild(s)}s.textContent='.bg{background:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.34)),url("'+String(cfg.background).replace(/"/g,'')+'") center top / cover no-repeat!important}'}
  function applyHome(doc,cfg){const c=cfg.homeCopy||DEFAULTS.homeCopy,l=doc.querySelector('.hero-info__lead'),p=doc.querySelector('.hero-info__copy');if(l)l.textContent=c.lead||'';if(p)p.innerHTML=String(c.copy||'').split('\n').map(escapeHtml).join('<br>')}
  function escapeHtml(v){return String(v).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
  function applyEdits(doc,cfg){assignKeys(doc);Object.entries(cfg.textEdits||{}).forEach(([k,v])=>{const el=doc.querySelector('[data-horiyume-key="'+CSS.escape(k)+'"]');if(el)el.innerHTML=escapeHtml(v).replace(/\n/g,'<br>')});Object.entries(cfg.imageEdits||{}).forEach(([k,v])=>{const el=doc.querySelector('[data-horiyume-key="'+CSS.escape(k)+'"]');if(el&&v)el.src=v})}
  function applyGalleryExtras(doc,cfg){const root=roomRoot(doc,'gallery');if(!root)return;root.querySelectorAll('[data-horiyume-extra="1"]').forEach(n=>n.remove());const imgs=imageTargets(root);if(!imgs.length)return;const template=imgs[imgs.length-1].closest('figure,.gallery-item,.work-card,.card')||imgs[imgs.length-1].parentElement,parent=template&&template.parentElement;if(!template||!parent)return;(cfg.galleryExtraImages||[]).forEach((item,i)=>{const src=typeof item==='string'?item:item&&item.src;if(!src)return;const node=template.cloneNode(true);node.dataset.horiyumeExtra='1';node.dataset.horiyumeExtraIndex=String(i);const img=node.querySelector('img');if(img)img.src=src;const uploaded=typeof item==='object'&&item.uploadedAt?item.uploadedAt:'';if(uploaded){let meta=node.querySelector('[data-horiyume-upload-date]');if(!meta){meta=doc.createElement('small');meta.dataset.horiyumeUploadDate='1';meta.style.cssText='display:block;margin-top:6px;opacity:.68;font-size:10px;letter-spacing:.04em';node.appendChild(meta)}meta.textContent='UPLOAD '+new Date(uploaded).toLocaleDateString('ja-JP')}parent.appendChild(node)})}
  function applyStore(doc,cfg){const s=cfg.storeSettings||DEFAULTS.storeSettings;try{localStorage.setItem(STORE_KEY,JSON.stringify(s))}catch(e){}if(window.HoriyumeStore)window.HoriyumeStore.applyToDoc(doc)}
  function collectForm(form){const fields={};form.querySelectorAll('input,textarea,select').forEach((el,i)=>{if(el.type==='file'||((el.type==='checkbox'||el.type==='radio')&&!el.checked))return;const key=el.name||el.id||('field'+i);fields[key]=el.value});return {fields,page:'booking',studio:'HORIYUME'}}
  function applyBooking(doc,cfg){const form=doc.getElementById('contactForm');if(!form)return;const status=doc.getElementById('formStatus');form.onsubmit=async function(e){e.preventDefault();const btn=form.querySelector('button[type="submit"],input[type="submit"]');if(btn)btn.disabled=true;if(status)status.textContent='送信中…';try{await submitInquiry(collectForm(form));if(status)status.textContent='送信しました。彫夢からの返信をお待ちください。';form.reset()}catch(err){if(status)status.textContent=cfg.bookingEmail?'送信できませんでした。 '+cfg.bookingEmail+' へ直接お問い合わせください。':'送信できませんでした。時間をおいてもう一度お試しください。'}finally{if(btn)btn.disabled=false}};if(status&&!String(status.textContent||'').includes('送信しました'))status.textContent='入力内容はHORIYUMEへ直接送信されます。'}
  function applyToDoc(doc,cfg){if(!doc)return;cfg=merge(DEFAULTS,cfg||published());injectMobile(doc);applyIdentity(doc,cfg);applyHome(doc,cfg);applyBackground(doc,cfg);applyEdits(doc,cfg);applyGalleryExtras(doc,cfg);applyStore(doc,cfg);applyBooking(doc,cfg)}
  function applyToFrame(frame,cfg){try{applyToDoc(frame&&frame.contentDocument,cfg)}catch(e){console.error(e)}}
  window.HoriyumeRuntime={API_BASE,DEFAULTS,DRAFT_KEY,PUBLISHED_KEY,SESSION_PIN_KEY,draft,published,saveDraft,publishLocal,fetchPublished,adminStatus,setupPass,login,loadDraftRemote,saveDraftRemote,publishRemote,changePass,uploadImage,listInquiries,submitInquiry,sessionPin,clearSessionPin,applyToDoc,applyToFrame,roomRoot,textTargets,imageTargets,assignKeys,merge};
})();