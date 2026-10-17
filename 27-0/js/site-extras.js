
(function(){
  function checkHash(){
    var h=window.location.hash;
    if(h==='#privacy'||h==='#terms'){
      var m=document.getElementById('privacyModal');
      if(m){
        m.style.display='flex';
        if(h==='#terms'){
          setTimeout(function(){
            var t=m.querySelector('#terms-of-use');
            if(t)t.scrollIntoView({behavior:'smooth'});
          },100);
        }
      }
    }
  }
  window.addEventListener('hashchange',checkHash);
  document.addEventListener('DOMContentLoaded',checkHash);
})();



var ADS_ON = false;


(function(){
  if (!ADS_ON) return;
  fetch('banners/homepage-manifest.json')
    .then(function(r){return r.json();})
    .then(function(list){
      if(!list||!list.length)return;
      var pick=list[Math.floor(Math.random()*list.length)];
      var test=new Image();
      test.onload=function(){
        var img=document.getElementById('unibet-banner');
        if(img)img.src=test.src;
      };
      test.src='banners/'+encodeURIComponent(pick);
    })
    .catch(function(){});
})();


var _unibetPopupList=null;
var _seasonsPlayed=0;
var _resetGameCount=0;
var UNIBET_LINK='https://bit.ly/betwithcast';

if (ADS_ON) fetch('banners/popup-manifest.json')
  .then(function(r){return r.json();})
  .then(function(list){_unibetPopupList=list;})
  .catch(function(){});

function _showUnibetInterstitial(onClose){
  if(!_unibetPopupList||!_unibetPopupList.length){onClose();return;}
  var pick=_unibetPopupList[Math.floor(Math.random()*_unibetPopupList.length)];
  var src='banners/'+encodeURIComponent(pick);

  var ov=document.createElement('div');
  ov.id='unibetInterstitial';
  ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  var inner=document.createElement('div');
  inner.style.cssText='position:relative;width:100%;max-width:480px;border-radius:16px;overflow:hidden;cursor:pointer';

  var img=document.createElement('img');
  img.src=src;
  img.style.cssText='width:100%;height:auto;display:block';
  img.onclick=function(){
    if(typeof gtag!=='undefined')gtag('event','unibet_click',{event_category:'monetisation'});
    window.open(UNIBET_LINK,'_blank','noopener,noreferrer');
    _closeInterstitial(onClose);
  };

  
  var rgLine=document.createElement('p');
  rgLine.style.cssText='color:#888;font-size:10px;text-align:center;margin:6px 0 2px;font-family:Inter,sans-serif;max-width:480px;width:100%';
  rgLine.innerHTML='18+ only. Gambling advertising. For support call <strong style="color:#aaa">1800 858 858</strong> or visit <a href="https://www.gamblinghelponline.org.au" target="_blank" style="color:#aaa">gamblinghelponline.org.au</a>.';
  var barWrap=document.createElement('div');
  barWrap.style.cssText='width:100%;max-width:480px;margin-top:6px';
  var barBg=document.createElement('div');
  barBg.style.cssText='background:#333;border-radius:4px;height:6px;overflow:hidden';
  var bar=document.createElement('div');
  bar.style.cssText='height:6px;background:var(--gold,#f1c073);border-radius:4px;width:100%;transition:width 0.1s linear';
  barBg.appendChild(bar);

  var label=document.createElement('div');
  label.style.cssText='text-align:center;color:#888;font-size:11px;margin-top:6px;font-family:Inter,sans-serif';
  label.textContent='Ad closes in 7s';

  barWrap.appendChild(barBg);
  barWrap.appendChild(label);

  inner.appendChild(img);
  ov.appendChild(inner);
  ov.appendChild(rgLine);
  ov.appendChild(barWrap);
  document.body.appendChild(ov);

  var elapsed=0;
  var total=7000;
  var interval=100;
  var timer=setInterval(function(){
    elapsed+=interval;
    var pct=Math.max(0,100-(elapsed/total*100));
    bar.style.width=pct+'%';
    var remaining=Math.ceil((total-elapsed)/1000);
    label.textContent=remaining>0?'Ad closes in '+remaining+'s':'';
    if(elapsed>=total){
      clearInterval(timer);
      _closeInterstitial(onClose);
    }
  },interval);

  ov._timer=timer;
}

function _closeInterstitial(onClose){
  var ov=document.getElementById('unibetInterstitial');
  if(ov){clearInterval(ov._timer);ov.remove();}
  if(onClose)onClose();
}


var _origShowSocialPrompt=showSocialPrompt;
showSocialPrompt=function(){
  _seasonsPlayed++;
  var isPack=typeof STATE!=='undefined'&&STATE.gameMode==='pack';
  if(isPack||((_seasonsPlayed>1)&&_seasonsPlayed%2===0)){
    _seasonsPlayed=0;_resetGameCount=0;
    _showUnibetInterstitial(function(){_origShowSocialPrompt();});
  } else {
    _origShowSocialPrompt();
  }
};


var _origResetGame=resetGame;
resetGame=function(){
  _resetGameCount++;
  var isPack=typeof STATE!=='undefined'&&STATE.gameMode==='pack';
  if(isPack||(_resetGameCount>0&&_resetGameCount%2===0)){
    _seasonsPlayed=0;_resetGameCount=0;
    _showUnibetInterstitial(function(){_origResetGame();});
  } else {
    _origResetGame();
  }
};



(function(){
  function fit(el){
    el.style.fontSize='';
    if(document.body.classList.contains('cp-wc'))return;
    
    var t=el.textContent,i=t.lastIndexOf(' ');
    if(i>0&&t.indexOf('\u00A0')<0&&el.children.length===0){el.textContent=t.slice(0,i)+'\u00A0'+t.slice(i+1);return;} 
    var cs=getComputedStyle(el),fs=parseFloat(cs.fontSize)||15;
    function lines(){var lh=parseFloat(getComputedStyle(el).lineHeight)||fs*1.15;return el.scrollHeight/lh;}
    while(lines()>2.2&&fs>11){fs-=0.5;el.style.fontSize=fs+'px';}
  }
  document.addEventListener('DOMContentLoaded',function(){
    var el=document.getElementById('spinClubVal');
    if(!el||!window.MutationObserver)return;
    new MutationObserver(function(){fit(el);}).observe(el,{childList:true,characterData:true,subtree:true});
    window.addEventListener('resize',function(){fit(el);});
  });
})();
