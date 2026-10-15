(function(){
  function qsa(sel, ctx){ return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  qsa('.store-nav-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var links = document.querySelector('.store-nav-links');
      if (links) links.classList.toggle('is-open');
    });
  });

  var grid = document.querySelector('.store-services-grid');
  if (!grid) return;

  var cards = qsa('.store-service-card', grid);
  var pills = qsa('.store-pill');
  var search = document.querySelector('.store-search-input');
  var emptyNote = document.querySelector('.store-empty-note');
  var activeTag = 'all';

  function applyFilter(){
    var query = ((search && search.value) || '').trim().toLowerCase();
    var visible = 0;
    cards.forEach(function(card){
      var tag = card.getAttribute('data-tag') || '';
      var text = (card.getAttribute('data-search-text') || '').toLowerCase();
      var matchesTag = activeTag === 'all' || tag === activeTag;
      var matchesSearch = !query || text.indexOf(query) !== -1;
      var show = matchesTag && matchesSearch;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    if (emptyNote) emptyNote.classList.toggle('is-visible', visible === 0);
  }

  pills.forEach(function(pill){
    pill.addEventListener('click', function(){
      pills.forEach(function(p){ p.classList.remove('is-active'); });
      pill.classList.add('is-active');
      activeTag = pill.getAttribute('data-tag') || 'all';
      applyFilter();
    });
  });
  if (search) search.addEventListener('input', applyFilter);
})();
