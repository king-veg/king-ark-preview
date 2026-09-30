(function(){
  const DRAFT_KEY='horiyumeDraftConfigV2';
  const PUBLISHED_KEY='horiyumePublishedConfigV2';
  const AUTH_KEY='horiyumeAdminPassHashV1';
  const STORE_KEY='horiyumeStoreSettings';
  const DEFAULTS={
    identity:{studio:'HORIYUME',artistJa:'彫夢',artistEn:'HORIYUME'},
    homeCopy:{lead:'彫りの世界観を、肌に刻む。',copy:'伝統と現代が交わる、\n唯一無二の和彫りを。'},
    storeSettings:{address:'',businessHours:'',holiday:'',mapQuery:''},
    textEdits:{},imageEdits:{},galleryExtraImages:[],background:'',bookingEmail:''
  };
  const TEXT_SELECTOR='h1,h2,h3,p,b,small,span,.value,.label';

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(base,next){
    const out=clone(base); next=next||{};
    Object.keys(next).forEach(k=>{
      if(next[k]&&typeof next[k]==='object'&&!Array.isArray(next[k])&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k])) out[k]=Object.assign({},out[k],next[k]);
      else out[k]=next[k];
    });
    return out;
  }
  function read(key){try{return merge(DEFAULTS,JSON.parse(localStorage.getItem(key)||'null')||{});}catch(e){return clone(DEFAULTS)}}
  function write(key,cfg){localStorage.setItem(key,JSON.stringify(merge(DEFAULTS,cfg||{})));return read(key)}
  function draft(){const raw=localStorage.getItem(DRAFT_KEY);return raw?read(DRAFT_KEY):published();}
  function published(){return read(PUBLISHED_KEY)}
  function saveDraft(cfg){return write(DRAFT_KEY,cfg)}
  function publish(cfg){const saved=write(PUBLISHED_KEY,cfg||draft());write(DRAFT_KEY,saved);return saved}
  function roomRoot(doc,room){return room==='top'?doc.getElementById('page-top'):doc.getElementById('page-'+room)}
  function textTargets(root){return root?Array.from(root.querySelectorAll(TEXT_SELECTOR)).filter(el=>el.children.length===0&&String(el.textContent||'').trim()):[]}
  function imageTargets(root){return root?Array.from(root.querySelectorAll('img')):[]}
  function assignKeys(doc){
    ['top','price','voice','gallery','sns','map','booking'].forEach(room=>{
      const root=roomRoot(doc,room); if(!root)return;
      textTargets(root).forEach((el,i)=>{if(!el.dataset.horiyumeKey)el.dataset.horiyumeKey=room+':text:'+i});
      imageTargets(root).forEach((el,i)=>{if(!el.dataset.horiyumeKey)el.dataset.horiyumeKey=room+':image:'+i});
    });
  }
  function injectMobile(doc){
    if(doc.getElementById('horiyume-mobile-fix'))return;
    const s=doc.createElement('style');s.id='horiyume-mobile-fix';
    s.textContent=`
      @media (max-width:900px) and (orientation:portrait){
        .rotate-gate,.subpage-rotate-gate{display:none!important}
        #page-price .page,#page-voice .page,#page-gallery .page,#page-sns .page,#page-map .page,#page-booking .page{visibility:visible!important;display:block!important}
        #page-price .site-header,#page-voice .site-header,#page-gallery .site-header,#page-sns .site-header,#page-map .site-header,#page-booking .site-header{display:flex!important}
        html,body{overflow:auto!important;overflow-x:hidden!important}
        .page,.shell,.stage{max-width:100vw!important}
        img,iframe{max-width:100%!important}
      }
    `;
    (doc.head||doc.documentElement).appendChild(s);
  }
  function applyIdentity(doc,cfg){
    const id=cfg.identity||DEFAULTS.identity;
    doc.title=`Artist — ${id.artistJa} / ${id.artistEn}`;
    doc.querySelectorAll('body *').forEach(el=>{
      if(el.children.length===0&&el.textContent){
        el.textContent=el.textContent.replace(/KOKURYU TATTOO STUDIO/g,id.studio).replace(/KOKURYU/g,id.studio);
      }
      ['aria-label','title','alt'].forEach(a=>{const v=el.getAttribute&&el.getAttribute(a);if(v&&/KOKURYU/.test(v))el.setAttribute(a,v.replace(/KOKURYU TATTOO STUDIO/g,id.studio).replace(/KOKURYU/g,id.studio))});
    });
  }
  function applyBackground(doc,cfg){
    let s=doc.getElementById('horiyume-bg-override');
    if(!cfg.background){if(s)s.remove();return;}
    if(!s){s=doc.createElement('style');s.id='horiyume-bg-override';doc.head.appendChild(s)}
    s.textContent='.bg{background:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.34)),url("'+String(cfg.background).replace(/"/g,'')+'") center top / cover no-repeat!important}';
  }
  function applyHome(doc,cfg){
    const c=cfg.homeCopy||DEFAULTS.homeCopy;
    const l=doc.querySelector('.hero-info__lead'),p=doc.querySelector('.hero-info__copy');
    if(l)l.textContent=c.lead||'';
    if(p)p.innerHTML=String(c.copy||'').split('\n').map(escapeHtml).join('<br>');
  }
  function escapeHtml(v){return String(v).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
  function applyEdits(doc,cfg){
    assignKeys(doc);
    Object.entries(cfg.textEdits||{}).forEach(([k,v])=>{const el=doc.querySelector('[data-horiyume-key="'+CSS.escape(k)+'"]');if(el)el.innerHTML=escapeHtml(v).replace(/\n/g,'<br>')});
    Object.entries(cfg.imageEdits||{}).forEach(([k,v])=>{const el=doc.querySelector('[data-horiyume-key="'+CSS.escape(k)+'"]');if(el&&v)el.src=v});
  }
  function applyGalleryExtras(doc,cfg){
    const root=roomRoot(doc,'gallery');if(!root)return;
    root.querySelectorAll('[data-horiyume-extra="1"]').forEach(n=>n.remove());
    const imgs=imageTargets(root);if(!imgs.length)return;
    const template=imgs[imgs.length-1].closest('figure,.gallery-item,.work-card,.card')||imgs[imgs.length-1].parentElement;
    const parent=template&&template.parentElement;if(!template||!parent)return;
    (cfg.galleryExtraImages||[]).forEach(src=>{
      const node=template.cloneNode(true);node.dataset.horiyumeExtra='1';
      const img=node.querySelector('img');if(img)img.src=src;
      parent.appendChild(node);
    });
  }
  function applyStore(doc,cfg){
    const s=cfg.storeSettings||DEFAULTS.storeSettings;
    localStorage.setItem(STORE_KEY,JSON.stringify(s));
    if(window.HoriyumeStore)window.HoriyumeStore.applyToDoc(doc);
  }
  function applyBooking(doc,cfg){
    const form=doc.getElementById('contactForm'); if(!form)return;
    const status=doc.getElementById('formStatus');
    form.onsubmit=function(e){
      e.preventDefault();
      if(!cfg.bookingEmail){if(status)status.textContent='送信先が未設定です。店舗へ直接お問い合わせください。';return;}
      const name=doc.getElementById('name')?.value||'';
      const message=doc.getElementById('message')?.value||'';
      location.href='mailto:'+encodeURIComponent(cfg.bookingEmail)+'?subject='+encodeURIComponent('HORIYUME お問い合わせ '+name)+'&body='+encodeURIComponent(message);
    };
    if(status)status.textContent=cfg.bookingEmail?'入力後「送信する」でメール作成画面が開きます。':'送信先は管理画面から設定できます。';
  }
  function applyToDoc(doc,cfg){
    if(!doc)return; cfg=merge(DEFAULTS,cfg||published());
    injectMobile(doc);applyIdentity(doc,cfg);applyHome(doc,cfg);applyBackground(doc,cfg);applyEdits(doc,cfg);applyGalleryExtras(doc,cfg);applyStore(doc,cfg);applyBooking(doc,cfg);
  }
  function applyToFrame(frame,cfg){try{applyToDoc(frame&&frame.contentDocument,cfg)}catch(e){console.error(e)}}
  async function hash(text){const b=new TextEncoder().encode(text);const d=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,'0')).join('')}
  async function setPass(pass){if(!/^[0-9A-Za-z]{4}$/.test(pass))throw new Error('4文字の英数字で設定してください');localStorage.setItem(AUTH_KEY,await hash(pass));return true}
  async function checkPass(pass){const h=localStorage.getItem(AUTH_KEY);return !!h&&h===await hash(pass)}
  function hasPass(){return !!localStorage.getItem(AUTH_KEY)}
  window.HoriyumeRuntime={DEFAULTS,DRAFT_KEY,PUBLISHED_KEY,AUTH_KEY,draft,published,saveDraft,publish,applyToDoc,applyToFrame,roomRoot,textTargets,imageTargets,assignKeys,setPass,checkPass,hasPass,merge};
})();