(()=>{
  const KEY='inventory-fast-cache-v1';
  let inFlight=false;
  const saveCache=()=>{try{localStorage.setItem(KEY,JSON.stringify(items.map(x=>({...x,pallet:undefined}))))}catch(_){}};
  const readCache=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
  const parseStock=d=>Array.isArray(d)?d:(d&&Array.isArray(d.items)?d.items:(d&&Array.isArray(d.stock)?d.stock:null));

  const cached=readCache();
  if(cached.length){
    items=cached.map(normalizeItem);
    render();
    setSync('마지막 재고 즉시 표시 · 시트 확인 중…');
  }

  const baseRender=render;
  render=function(){baseRender();saveCache()};

  loadStock=async function(showToast=false){
    if(inFlight)return;
    if(!api()){setSync('Google Sheets 미연결',true);return}
    inFlight=true;
    try{
      const sep=api().includes('?')?'&':'?';
      const data=await fetchJson(api()+sep+'action=stock&_='+Date.now());
      const arr=parseStock(data);
      if(Array.isArray(arr)&&arr.length){
        items=arr.map(normalizeItem);
        saveCache();
        render();
        setSync('Google Sheets 동기화 완료');
        if(showToast)toast('재고DB가 연결되었습니다');
      }else if(!items.length){
        items=structuredClone(FALLBACK_ITEMS).map(normalizeItem);
        render();
        setSync('시트 데이터 없음 · 재고DB 임시 표시',true);
      }
    }catch(e){
      const c=readCache();
      if(c.length){items=c.map(normalizeItem);render()}
      setSync('네트워크 지연 · 마지막 재고 표시 중',true);
      if(showToast)toast('연결이 느려 마지막 재고를 먼저 표시합니다');
    }finally{inFlight=false}
  };

  mutate=async function(payload){
    if(!api()){toast('먼저 Apps Script URL을 연결해주세요');return false}
    try{
      if(payload.action==='adjust'){
        const it=items.find(x=>x.id===payload.id);
        const wire={action:'adjust',id:payload.id,name:it?.name||payload.id,mode:'add',value:payload.delta,note:[payload.actor&&payload.actor!=='미지정'?('처리자: '+payload.actor):'',payload.note||''].filter(Boolean).join(' · ')};
        const data=await fetchJson(api(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(wire)});
        if(data&&data.ok===false)throw new Error(data.error||'save error');
      }else if(payload.action==='setItem'){
        const it=items.find(x=>x.id===payload.id);
        await fetchJson(api(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'adjust',id:payload.id,name:it?.name||payload.id,mode:'set',value:payload.stock,note:[payload.actor&&payload.actor!=='미지정'?('처리자: '+payload.actor):'','실사/직접수정',payload.note||''].filter(Boolean).join(' · ')})});
        await fetchJson(api(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'saveMeta',id:payload.id,par:payload.par,expiry:payload.expiry,note:payload.note||''})});
      }
      saveCache();
      setSync('시트 저장 완료 · 다음 동기화 대기');
      setTimeout(()=>loadStock(),200);
      return true;
    }catch(e){setSync('저장 실패',true);return false}
  };

  try{clearInterval(syncTimer)}catch(_){}
  syncTimer=setInterval(()=>{if(document.visibilityState==='visible')loadStock()},2500);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadStock()});
  window.addEventListener('focus',()=>loadStock());
})();