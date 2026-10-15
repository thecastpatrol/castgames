(function(){
    var faqs=[
      ["What is 27-0?","A free online Rugby League game where you build your ultimate NRL era dream team and try to go 27-0 undefeated across a full season and finals."],
      ["How do you play 27-0?","Spin to get a random NRL club and season, pick your best player, repeat until your 13 is full, then simulate a complete 27-round NRL season and finals. The goal is to win every single game, including the Grand Final, and go an entire season undefeated. That's 27-0."],
      ["Which NRL era players are included?","The game covers players from across the entire NRL era (1998 to present), rated by The Cast Patrol. Legends, cult heroes and modern stars all included."],
      ["What is Pack Mode?","An alternate way to build your squad. Rip open 7 packs of 6 cards each, collect players across Gold, Green, Blue, Silver and Bronze rarities, then pick your best 13 from what you pull."],
      ["What is Hard Mode?","Classic 27-0 with nothing to lean on. Player ratings stay hidden until your squad is complete, and there are no free wildcards: only ones from your Vault or bought on the spot. Pure footy knowledge, with its own leaderboard."],
      ["What is the Daily Challenge?","A new challenge drops every day at midnight Sydney time, the same for everyone. It could be a Match Day between two clubs, one club across the whole NRL era, the same spins for all, or a squad rating to hit. You get 3 goes and your best one counts on the Daily leaderboard."],
      ["What is World Cup 8-0?","The 2026 Rugby League World Cup, with your team in France&rsquo;s place in Pool C. Spin a nation and pick from its 2026 squad until your 13 is full, then take the long road: Samoa, PNG, England, Tonga and Lebanon in the pool, then a quarter final, a semi and the final. Win all eight to go 8-0. World Legends, the game&rsquo;s international greats, can turn up in a nation&rsquo;s spin, and a World Legend Pick lets you choose one. One free World Cup a day without signing up, and as many as you like with a free CAST Profile, with its own leaderboard.","wc"],
      ["How do the leaderboards work?","Sign in free with a CAST Profile and pick a username. Your best season in every mode goes up automatically on today&rsquo;s, this week&rsquo;s and the all-time boards, along with Perfect Seasons, the Daily and your longest streak. Tap any name to see the 13 behind the score."],
      ["Do I need an account?","No. You can play 2 seasons a day as a guest, and they stay on this device. A free CAST Profile (Google or Apple, for ages 13 and over) gives you unlimited seasons, the Daily, wildcards in Classic, and saves your history, stats and trophies and puts you on the leaderboards."],
      ["Is 27-0 free to play?","Yes. 27-0 is free to play in your browser, with nothing to download. Guests get 2 seasons a day, and a free CAST Profile unlocks unlimited seasons. CAST Pass is an optional paid subscription with extras like Custom Seasons."],
      ["Where do player ratings come from?","The Cast Patrol uses a formula based on peak performance, era context and career impact. They are debatable. That is the point. 27-0 player ratings are an independent interpretation based on publicly available data and are used for descriptive purposes only. They may differ from any official source."],
      ["Who made 27-0?","The Cast Patrol, the team behind CAST Games."], // 16 Oct 2026: the same answer on every CAST game
      ["Is 27-0 affiliated with the NRL?","No. 27-0 is a fan-made game created by The Cast Patrol and is not affiliated with, endorsed by or associated with the NRL, its clubs or any official Rugby League organisation."],
      ["How can I sponsor The Cast Patrol?","Businesses interested in sponsoring The Cast Patrol podcast, 27-0 or partnering with us across social media can contact us at <a href='mailto:cast@thecastpatrol.com.au'>cast@thecastpatrol.com.au</a>. We work with brands on podcast integrations, social content, competitions, live activations and custom campaigns."],
      ["Where can I listen to The Cast Patrol podcast?","You can find The Cast Patrol on all major podcast platforms including Spotify, Apple Podcasts and Amazon Music. Full episodes are also released weekly on YouTube."]
    ];
    var list=document.getElementById('faqList');
    if(!list) return;
    faqs.forEach(function(faq,i){
      var item=document.createElement('div');
      item.style.cssText='background:#111;border:1px solid #1e1e2e;border-radius:12px;overflow:hidden';
      if(faq[2]==='wc'){item.hidden=true;item.setAttribute('data-cast-wc','');} // World Cup: shown once it is launched (js/world-cup.js)
      var btn=document.createElement('button');
      btn.style.cssText='width:100%;background:none;border:none;padding:13px 16px;text-align:left;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;touch-action:manipulation';
      btn.setAttribute('aria-expanded','false');
      var q=document.createElement('span');
      q.style.cssText='font-size:14px;font-weight:700;color:#fff;line-height:1.4;font-family:"Inter",sans-serif;text-align:left';
      q.textContent=faq[0];
      var icon=document.createElement('span');
      icon.style.cssText='font-size:18px;color:var(--gold);flex-shrink:0;transition:transform .25s;line-height:1;font-weight:300';
      icon.textContent='+';
      btn.appendChild(q);
      btn.appendChild(icon);
      var ans=document.createElement('div');
      ans.style.cssText='max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;padding:0 18px';
      var p=document.createElement('p');
      p.style.cssText='font-size:13px;color:#888;line-height:1.65;margin:0 0 14px;font-family:"Inter",sans-serif;text-align:left';
      p.innerHTML=faq[1];
      ans.appendChild(p);
      btn.onclick=function(){
        var open=btn.getAttribute('aria-expanded')==='true';
        // Close all other FAQs first
        list.querySelectorAll('button[aria-expanded="true"]').forEach(function(otherBtn){
          if(otherBtn===btn) return;
          otherBtn.setAttribute('aria-expanded','false');
          otherBtn.querySelector('span:last-child').style.transform='';
          otherBtn.querySelector('span:last-child').style.color='var(--gold)';
          otherBtn.nextElementSibling.style.maxHeight='0';
          otherBtn.nextElementSibling.style.paddingTop='0';
        });
        btn.setAttribute('aria-expanded',open?'false':'true');
        icon.style.transform=open?'':'rotate(45deg)';
        icon.style.color=open?'var(--gold)':'#fff';
        ans.style.maxHeight=open?'0':ans.scrollHeight+32+'px';
        ans.style.paddingTop=open?'0':'12px';
      };
      item.appendChild(btn);
      item.appendChild(ans);
      list.appendChild(item);
    });
    // The questions start folded away so the home page stays short: the heading opens them, and so does the
    // Full Rules & FAQ button (#faq)
    var sec = document.getElementById('faq'), title = document.getElementById('faqTitle');
    if (sec && title) {
      var tog = document.createElement('button');
      tog.type = 'button'; tog.className = 'cp-faq-toggle';
      tog.setAttribute('aria-expanded', 'false'); tog.setAttribute('aria-controls', 'faqList');
      tog.innerHTML = '<span class="cp-faq-t">Frequently Asked Questions</span><small>' + faqs.length + ' questions</small><span class="cp-faq-chev" aria-hidden="true"></span>';
      title.textContent = ''; title.appendChild(tog);
      var setOpen = function (on) { list.hidden = !on; tog.setAttribute('aria-expanded', String(on)); sec.classList.toggle('is-open', on); };
      setOpen(false);
      tog.addEventListener('click', function () { setOpen(list.hidden); });
      var fromHash = function () { if (location.hash === '#faq') setOpen(true); };
      window.addEventListener('hashchange', fromHash); fromHash();
      document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href="#faq"]')) setOpen(true); });
    }
  })();
