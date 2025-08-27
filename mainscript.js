 /* =====================
       State & Persistence
    ===================== */
    const STORAGE_KEY = 'sustainhub-v1';
    const seedIdeas = [
      { id: crypto.randomUUID(), title: 'Solar-Powered Borehole for Rural Community', summary: 'Hybrid solar + DC pump borehole to supply 20,000 L/day.', content: 'Install a 2.5kW solar array powering a brushless DC pump with 10,000 L elevated storage. Gravity distribution with vandal-proof enclosure. Include water quality testing schedule and local caretaker training.', author: 'Ada', country: 'Nigeria', tags: ['water','energy','community'], votes: 24, sponsors: 5, comments: [ {id: crypto.randomUUID(), author:'Mo', text:'Consider fencing around the tank.', ts: Date.now()-86400000} ], createdAt: Date.now()-2*86400000 },
      { id: crypto.randomUUID(), title: 'Low-cost Biochar Stoves for Urban Areas', summary: 'Biochar cookstoves reduce smoke and store carbon.', content: 'Use agri-waste pellets; launch with microfinance and local assembly. Track indoor air quality improvements and carbon sequestered as biochar.', author: 'Khalid', country: 'Kenya', tags: ['sustainability','air','health'], votes: 12, sponsors: 2, comments: [], createdAt: Date.now()-4*86400000 },
      { id: crypto.randomUUID(), title: 'School Rooftop Rainwater Harvesting', summary: 'Gutter + tank + first-flush diverter for sanitation.', content: 'Capture 50,000 L/season; add signage for learning; set maintenance rota and quality checks.', author: 'Asha', country: 'India', tags: ['water','education'], votes: 31, sponsors: 7, comments: [], createdAt: Date.now()-6*86400000 },
    ];

    let state = load();
    function load(){
      try{ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return { ideas: seedIdeas, theme: 'dark' }; return JSON.parse(raw); }catch{ return { ideas: seedIdeas, theme: 'dark' }; }
    }
    function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

    /* =====================
       Theme toggle
    ===================== */

    /* =====================
       World updates (demo)
    ===================== */
    const updatesList = document.getElementById('updatesList');
    const demoUpdates = [
      { t:'Global renewable capacity hits a new record', topic:'Green Energy', source:'Demo', ts: Date.now()-3600e3 },
      { t:'City pilots greywater reuse for irrigation', topic:'Water', source:'Demo', ts: Date.now()-7200e3 },
      { t:'Startup turns textile waste into insulation', topic:'Sustainability', source:'Demo', ts: Date.now()-86400e3 },
      { t:'Community microgrid cuts outages by 80%', topic:'Energy', source:'Demo', ts: Date.now()-3*86400e3 },
      { t:'UN says booming solar, wind and other green energy hits global tipping point for even lower costs', topic:'Green Energy', source:'APnews', ts: Date.now()-3600e3 },
      { t:'China races to build world’s largest solar farm to meet emissions targets', topic:'Sustainability', source:'APnews', ts: Date.now()-7200e3 },
      { t:'Urban Waterfronts Are Making a Sustainable Rebound', topic:'Sustainability', source:'The Wall Street Journal', ts: Date.now()-86400e3 },
      { t:'Proposed data center prompts Tucson to regulate large water users, require conservation', topic:'Water', source:'APnews', ts: Date.now()-3*86400e3 },
    ];
    function renderUpdates(){
      updatesList.innerHTML = '';
      demoUpdates.forEach((u,i)=>{
        const card = el('article', { class:'card pad pop' });
        const top = el('div', { class:'row', style:'justify-content:space-between' },
          el('span', { class:'chip' }, `${u.topic}`),
          el('span', { class:'muted' }, new Date(u.ts).toLocaleString())
        );
        const h3 = el('h3', {}, u.t);
        const p = el('p', { class:'muted' }, `${u.source} • demo feed`);
        card.append(top,h3,p);
        updatesList.append(card);
      });
    }

    /* =====================
       Ideas list + filters
    ===================== */
    const $list = document.getElementById('ideaList');
    const $empty = document.getElementById('emptyState');
    const $search = document.getElementById('search');
    const $countryFilter = document.getElementById('countryFilter');
    const $tagFilter = document.getElementById('tagFilter');

    $search.addEventListener('input', renderIdeas);
    $countryFilter.addEventListener('change', renderIdeas);
    $tagFilter.addEventListener('change', renderIdeas);

    function matchesFilters(idea){
      const q = $search.value.trim().toLowerCase();
      const byQ = !q || (idea.title+" "+idea.summary+" "+idea.content+" "+idea.tags.join(' ')).toLowerCase().includes(q);
      const byC = !$countryFilter.value || idea.country?.toLowerCase() === $countryFilter.value.toLowerCase();
      const byT = !$tagFilter.value || idea.tags.includes($tagFilter.value);
      return byQ && byC && byT;
    }

    function renderIdeas(){
      $list.innerHTML='';
      const ideas = [...state.ideas].sort((a,b)=> b.createdAt - a.createdAt).filter(matchesFilters);
      $empty.style.display = ideas.length? 'none' : 'block';
      ideas.forEach((idea,i)=> $list.append(renderIdeaCard(idea)));
    }

    function renderIdeaCard(idea){
      const card = el('article', { class:'card pad idea pop' });
      const top = el('div', { class:'top' },
        avatar(idea.author),
        el('div', {},
          el('strong', {}, idea.title),
          el('div', { class:'meta' }, `${idea.author ?? 'Someone'} • ${idea.country || 'Unknown'} • ${new Date(idea.createdAt).toLocaleString()}`)
        )
      );
      const sum = el('div', { class:'muted' }, idea.summary);
      const tags = el('div', { class:'tags' }, ...idea.tags.map(t=> el('span', { class:'chip' }, `#${t}`)));
      const actions = el('div', { class:'actions' },
        button('👍 Upvote', ()=> upvote(idea.id)), spanCount(idea.votes, 'votes'),
        button('💚 Sponsor', ()=> sponsor(idea.id)), spanCount(idea.sponsors, 'sponsors'),
        button('💬 Comments', ()=> openIdea(idea.id))
      );
      card.append(top,sum,tags,actions);
      card.addEventListener('click', (e)=>{ if(e.target.closest('button')) return; openIdea(idea.id) });
      return card;
    }

    function spanCount(n, label){ return el('span', { class:'muted' }, `${n} ${label}`) }

    function upvote(id){ const it = state.ideas.find(x=>x.id===id); if(!it) return; it.votes++; save(); renderIdeas(); }
    function sponsor(id){ const it = state.ideas.find(x=>x.id===id); if(!it) return; it.sponsors++; save(); renderIdeas(); }

    /* =====================
       Idea modal (detail + comments)
    ===================== */
    const dlg = document.getElementById('ideaDialog');
    const dlgTitle = document.getElementById('dlgTitle');
    const dlgBody = document.getElementById('dlgBody');
    document.getElementById('dlgClose').addEventListener('click', ()=> dlg.close());

    function openIdea(id){
      const it = state.ideas.find(x=>x.id===id); if(!it) return;
      dlgTitle.textContent = it.title;
      dlgBody.innerHTML = '';
      dlgBody.append(
        el('div', { class:'row', style:'justify-content:space-between' },
          el('div', { class:'row' }, avatar(it.author), el('div', {}, el('div', { class:'meta' }, `${it.author} • ${it.country||'Unknown'}`), el('div', { class:'muted' }, new Date(it.createdAt).toLocaleString()))),
          el('div', { class:'row' }, button('👍 Upvote', ()=>{it.votes++; save(); renderIdeas(); openIdea(id)}), button('💚 Sponsor', ()=>{it.sponsors++; save(); renderIdeas(); openIdea(id)}))
        ),
        el('p', {}, it.content),
        el('div', { class:'tags' }, ...it.tags.map(t=> el('span', { class:'chip' }, `#${t}`))),
        el('hr', { style:'border-color:#1f2a36' }),
        el('h4', {}, 'Comments'),
        commentsList(it),
        commentForm(it)
      );
      dlg.showModal();
    }

    function commentsList(idea){
      const wrap = el('div', { id:'comments' });
      if(!idea.comments?.length){ wrap.append(el('div', { class:'muted' }, 'No comments yet. Be the first!')); return wrap }
      idea.comments.forEach(c=>{
        const item = el('div', { class:'card pad', style:'margin:8px 0' },
          el('div', { class:'row', style:'justify-content:space-between' },
            el('div', { class:'row' }, avatar(c.author, 28), el('strong', {}, c.author)),
            el('span', { class:'muted' }, new Date(c.ts).toLocaleString())
          ),
          el('div', {}, c.text)
        );
        wrap.append(item);
      });
      return wrap;
    }

    function commentForm(idea){
      const name = el('input', { type:'text', placeholder:'Your name', required:true });
      const text = el('input', { type:'text', placeholder:'Your comment', required:true });
      const btn = button('Post Comment', ()=>{
        if(!name.value.trim() || !text.value.trim()) return;
        idea.comments.push({ id: crypto.randomUUID(), author: name.value.trim(), text: text.value.trim(), ts: Date.now() });
        save(); openIdea(idea.id); renderIdeas();
      });
      const row = el('div', { class:'row' }, name, text, btn); row.style.gap='8px'; row.style.flexWrap='wrap';
      name.style.flex='1 1 160px'; text.style.flex='2 1 260px';
      return row;
    }

    /* =====================
       Submit Idea
    ===================== */
    const form = document.getElementById('ideaForm');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const idea = {
        id: crypto.randomUUID(),
        author: document.getElementById('author').value.trim(),
        country: document.getElementById('country').value.trim(),
        title: document.getElementById('title').value.trim(),
        summary: document.getElementById('summary').value.trim(),
        content: document.getElementById('content').value.trim(),
        tags: parseTags(document.getElementById('tags').value),
        votes: 0,
        sponsors: 0,
        comments: [],
        createdAt: Date.now()
      };
      if(!idea.author || !idea.title || !idea.summary || !idea.content){ return }
      state.ideas.unshift(idea); save();
      form.reset();
      location.hash = '#ideas';
      renderIdeas();
    });

    /* =====================
       Import/Export/Reset
    ===================== */
    document.getElementById('exportBtn').addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sustainhub-data.json';
      a.click();
    });
    document.getElementById('importFile').addEventListener('change', (e)=>{
      const file = e.target.files[0]; if(!file) return;
      const reader = new FileReader(); reader.onload = ()=>{
        try{ const data = JSON.parse(reader.result); if(data && data.ideas){ state = { ...state, ...data }; save(); renderIdeas(); alert('Imported!'); } }
        catch{ alert('Invalid file'); }
      }; reader.readAsText(file);
    });
    document.getElementById('resetBtn').addEventListener('click', ()=>{
      if(confirm('This will clear local data and reload. Continue?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
    });

    /* =====================
       Helpers
    ===================== */
    function el(tag, attrs={}, ...children){
      const node = document.createElement(tag);
      for(const [k,v] of Object.entries(attrs||{})){
        if(k==='class') node.className = v; else if(k==='style') node.setAttribute('style', v); else node[k] = v;
      }
      for(const c of children){ node.append(c?.nodeType? c : document.createTextNode(String(c))) }
      return node;
    }
    function avatar(name, size=40){
      const seed = encodeURIComponent(name || 'User');
      const img = new Image(size,size);
      img.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}`;
      img.alt = name || 'User avatar';
      img.width = size; img.height = size; img.className = 'avatar';
      return img;
    }
    function button(label, onClick){ const b = el('button', { class:'btn' }, label); b.addEventListener('click', (e)=>{ e.stopPropagation(); onClick?.();}); return b }
    function parseTags(s){ return (s||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,8) }

    /* =====================
       Boot
    ===================== */
    renderUpdates();
    renderIdeas();
    document.getElementById('year').textContent = new Date().getFullYear();
    
    /* ====== Mobile nav (hamburger) toggle ====== */
    (function(){
      const navToggle = document.getElementById('navToggle');
      function setNavOpen(open){
        document.body.classList.toggle('nav-open', !!open);
        if(navToggle) navToggle.setAttribute('aria-expanded', open? 'true' : 'false');
      }
      if(navToggle){
        navToggle.addEventListener('click', (e)=>{ e.stopPropagation(); setNavOpen(!document.body.classList.contains('nav-open')); });
        // close on outside click
        document.addEventListener('click', (e)=>{ if(document.body.classList.contains('nav-open') && !e.target.closest('.topbar')) setNavOpen(false); });
        // collapse when resizing to wide screens
        window.addEventListener('resize', ()=>{ if(window.innerWidth > 760) setNavOpen(false); });
      }
    })();