(function(){
  const KEY="horiyumeStoreSettings";
  const DEFAULTS={address:"",businessHours:"",holiday:"",mapQuery:""};
  const HOME_MAP_STYLE_ID="horiyume-home-map-preview-style";
  const HOME_MAP_FRAME_ID="horiyumeHomeMapPreview";

  function clean(v){return String(v==null?"":v).trim()}
  function read(){
    try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(KEY)||"null")||{})}
    catch(e){return Object.assign({},DEFAULTS)}
  }
  function write(next){
    const saved=Object.assign({},read(),next||{});
    localStorage.setItem(KEY,JSON.stringify(saved));
    return saved;
  }
  function visibleValue(value,placeholder){
    const v=clean(value);
    return v||placeholder;
  }
  function ensureHomeMapStyle(doc){
    if(!doc||doc.getElementById(HOME_MAP_STYLE_ID))return;
    const style=doc.createElement("style");
    style.id=HOME_MAP_STYLE_ID;
    style.textContent=`
      .king-home-map-preview{
        position:relative!important;
        overflow:hidden!important;
        isolation:isolate;
      }
      .king-home-map-preview > img{
        position:relative!important;
        z-index:0!important;
        opacity:0!important;
      }
      .king-home-map-frame{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        min-width:100%!important;
        min-height:100%!important;
        border:0!important;
        display:block!important;
        pointer-events:none!important;
        z-index:1!important;
        filter:saturate(.82) contrast(1.06) brightness(.68);
      }
      .king-home-map-preview::after{
        content:"";
        position:absolute;
        inset:0;
        z-index:2;
        pointer-events:none;
        background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.42));
      }
      .king-home-map-preview > .label,
      .king-home-map-preview > span:not(.map-open-badge),
      .king-home-map-preview > div{
        position:relative!important;
        z-index:3!important;
      }
    `;
    (doc.head||doc.documentElement).appendChild(style);
  }
  function findHomeMapCard(doc){
    if(!doc)return null;
    let target=doc.querySelector('#page-top label[for="nav-map"].card, #page-top .card.map, #page-top [data-page="map"].card');
    if(target)return target;
    const candidates=Array.from(doc.querySelectorAll('label[for="nav-map"]'));
    const hit=candidates.find(el=>{
      if(el.closest("header,.site-header,.site-nav,nav"))return false;
      return !!el.closest("#page-top,.stage,.shell");
    });
    if(!hit)return null;
    return hit.classList.contains("card")?hit:(hit.closest(".card")||hit);
  }
  function syncHomeMapPreview(doc,embed){
    if(!doc)return;
    const card=findHomeMapCard(doc);
    if(!card)return;
    ensureHomeMapStyle(doc);
    let preview=doc.getElementById(HOME_MAP_FRAME_ID);
    if(!embed){
      if(preview)preview.remove();
      card.classList.remove("king-home-map-preview");
      return;
    }
    card.classList.add("king-home-map-preview");
    if(!preview){
      preview=doc.createElement("iframe");
      preview.id=HOME_MAP_FRAME_ID;
      preview.className="king-home-map-frame";
      preview.loading="lazy";
      preview.referrerPolicy="no-referrer-when-downgrade";
      preview.title="店舗位置 MAP プレビュー";
      preview.tabIndex=-1;
      preview.setAttribute("aria-hidden","true");
      card.insertBefore(preview,card.firstChild);
    }else if(preview.parentElement!==card){
      card.insertBefore(preview,card.firstChild);
    }
    if(preview.getAttribute("src")!==embed)preview.setAttribute("src",embed);
  }
  function applyToDoc(doc){
    if(!doc)return;
    const s=read();
    const address=doc.getElementById("addressText");
    const hours=doc.getElementById("hoursText");
    const holiday=doc.getElementById("holidayText");
    const mapFrame=doc.getElementById("mapFrame");
    const mapPlaceholder=doc.getElementById("mapPlaceholder");
    const mapLink=doc.getElementById("mapPreviewLink")||doc.getElementById("googleMapsLink");

    if(address)address.textContent=visibleValue(s.address,"住所未登録");
    if(hours)hours.textContent=visibleValue(s.businessHours,"営業時間未登録");
    if(holiday)holiday.textContent=visibleValue(s.holiday,"定休日未登録");

    const query=clean(s.mapQuery)||clean(s.address);
    let embed="";
    let q="";
    if(query){
      q=encodeURIComponent(query);
      embed="https://www.google.com/maps?q="+q+"&output=embed";
    }

    // HOMEのMAPカード自体に、登録済み位置の地図を常時プレビュー表示する。
    // iframeはpointer-events:noneなので、カードを押した時の既存MAPページ遷移はそのまま維持する。
    syncHomeMapPreview(doc,embed);

    if(!mapFrame||!mapPlaceholder)return;

    if(!query){
      mapFrame.removeAttribute("src");
      mapFrame.style.display="none";
      mapPlaceholder.style.display="grid";
      if(mapLink){mapLink.href="#";mapLink.setAttribute("aria-disabled","true")}
      return;
    }

    if(mapFrame.getAttribute("src")!==embed)mapFrame.src=embed;
    mapFrame.style.display="block";
    mapFrame.style.pointerEvents="none";
    mapPlaceholder.style.display="none";

    if(mapLink){
      mapLink.href="https://www.google.com/maps/search/?api=1&query="+q;
      mapLink.target="_blank";
      mapLink.rel="noopener";
      mapLink.removeAttribute("aria-disabled");
      mapLink.style.cursor="pointer";
    }
  }
  function applyToFrame(frame){
    try{applyToDoc(frame&&frame.contentDocument)}catch(e){}
  }

  window.HoriyumeStore={KEY,read,write,applyToDoc,applyToFrame};
  window.addEventListener("storage",function(e){
    if(e.key!==KEY)return;
    const frame=document.getElementById("site");
    if(frame)applyToFrame(frame);
  });
})();
