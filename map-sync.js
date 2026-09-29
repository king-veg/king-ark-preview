(function(){
  const KEY="horiyumeStoreSettings";
  const DEFAULTS={address:"",businessHours:"",holiday:"",mapQuery:""};

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
    if(!mapFrame||!mapPlaceholder)return;

    if(!query){
      mapFrame.removeAttribute("src");
      mapFrame.style.display="none";
      mapPlaceholder.style.display="grid";
      if(mapLink){mapLink.href="#";mapLink.setAttribute("aria-disabled","true")}
      return;
    }

    const q=encodeURIComponent(query);
    const embed="https://www.google.com/maps?q="+q+"&output=embed";
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
