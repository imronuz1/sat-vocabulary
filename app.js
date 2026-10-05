(() => {
  const sets = window.VOCABULARY_SETS || { pdf: window.VOCABULARY || [], original: [] };
  const allWords = [...new Map([...sets.original, ...sets.pdf, ...sets.pspart1].map(word => [word.word.toLocaleLowerCase(), word])).values()];
  const grid = document.getElementById('grid');
  const query = document.getElementById('query');
  const sort = document.getElementById('sort');
  const dialog = document.getElementById('detail');
  const study = document.getElementById('study');
  let filter = 'all', selectedDeck = 'pdf', current = null, session = [], sessionIndex = 0;
  let changingCard = false;
  let statuses = {}, reviews = {};
  try { statuses = JSON.parse(localStorage.getItem('verba-status') || '{}'); } catch {}
  try { reviews = JSON.parse(localStorage.getItem('verba-reviews') || '{}'); } catch {}

  const status = word => statuses[word] || 'new';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const deckWords = () => selectedDeck === 'all' ? allWords : sets[selectedDeck];
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate(element, frames, options) {
    return reduceMotion() ? Promise.resolve() : element.animate(frames, options).finished.catch(() => {});
  }

  function parseRange(value, length) {
    const match = value.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!match) return null;
    const start = match[2] === undefined ? 0 : Number(match[1]);
    const end = match[2] === undefined ? Number(match[1]) : Number(match[2]);
    if (end <= start || start >= length) return null;
    return {start, end:Math.min(end,length), requestedEnd:end};
  }

  function updateRangePreview() {
    const isCustom = document.getElementById('study-limit').value === 'custom';
    const field = document.getElementById('range-field');
    field.hidden = !isCustom;
    if (!isCustom) return;
    const deck = document.getElementById('study-deck').value;
    const pool = deck === 'all' ? allWords : sets[deck];
    const input = document.getElementById('word-range');
    const preview = document.getElementById('range-preview');
    const range = parseRange(input.value, pool.length);
    if (!range) {
      preview.textContent = input.value.trim() ? 'Enter a range within 0–' + pool.length + '.' : pool.length + ' words in this list.';
      return;
    }
    preview.textContent = 'Words ' + range.start + '–' + range.end + ' · ' + (range.end-range.start) + ' words' + (range.requestedEnd > pool.length ? ' (end capped at list size)' : '');
  }

  function updateStats() {
    const scoped = deckWords();
    const mastered = scoped.filter(w => status(w.word) === 'mastered').length;
    const learning = scoped.filter(w => status(w.word) === 'learning').length;
    const percent = scoped.length ? Math.round(mastered / scoped.length * 100) : 0;
    document.getElementById('total').textContent = allWords.length;
    document.getElementById('all-stat').textContent = scoped.length;
    document.getElementById('all-count').textContent = scoped.length;
    document.getElementById('learn-stat').textContent = learning;
    document.getElementById('master-stat').textContent = mastered;
    document.getElementById('progress').style.width = percent + '%';
    document.getElementById('progress-label').textContent = percent + '% mastered';
    document.getElementById('deck-all-count').textContent = allWords.length;
    document.getElementById('deck-pdf-count').textContent = sets.pdf.length;
    document.getElementById('deck-original-count').textContent = sets.original.length;
    document.getElementById('deck-pspart1-count').textContent = sets.pspart1.length;
  }

  function row(label, value, cls = '', attr = '', synonyms = '') {
    return '<div class="row ' + cls + (synonyms ? ' has-synonyms' : '') + '"><span class="label">' + label +
      '</span><span class="value" ' + attr + '>' +
      escapeHTML(value || '—') + '</span>' + (synonyms ? '<small class="synonyms">Synonyms · ' +
      escapeHTML(synonyms) + '</small>' : '') + '</div>';
  }

  function draw() {
    const needle = query.value.trim().toLocaleLowerCase();
    const scoped = deckWords();
    const visible = scoped.filter(word => {
      const searchable = [word.word, word.definition, word.synonyms, word.russian, word.uzbek].join(' ').toLocaleLowerCase();
      return searchable.includes(needle) && (filter === 'all' || status(word.word) === filter);
    });
    if (sort.value === 'az') visible.sort((a, b) => a.word.localeCompare(b.word));
    if (sort.value === 'za') visible.sort((a, b) => b.word.localeCompare(a.word));
    if (sort.value === 'random') visible.sort((a, b) => (a.randomKey ??= Math.random()) - (b.randomKey ??= Math.random()));
    grid.innerHTML = visible.map(word => '<article class="card" tabindex="0" role="button" data-word="' + escapeHTML(word.word) + '" aria-label="Study ' + escapeHTML(word.word) + '"><div class="card-head"><span class="card-word">' + escapeHTML(word.word) + '</span>' + (word.sourceNumber ? '<span class="source-number">#' + word.sourceNumber + '</span>' : '') + '<span class="status ' + status(word.word) + '">' + status(word.word) + '</span></div>' + row('Definition', word.definition, '', '', word.synonyms) + row('Russian', word.russian, '', 'lang="ru"') + row('Uzbek', word.uzbek, '', 'lang="uz"') + row('Example', word.sentence, 'example') + '</article>').join('');
    document.getElementById('empty').hidden = visible.length > 0;
    grid.hidden = visible.length === 0;
    document.getElementById('results').textContent = (needle || filter !== 'all' || selectedDeck !== 'all') ? 'Showing ' + visible.length + ' of ' + scoped.length + ' words' : 'Showing all ' + visible.length + ' words';
    grid.querySelectorAll('.card').forEach(card => {
      const open = () => showDetails(scoped.find(word => word.word === card.dataset.word));
      card.onclick = open;
      card.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } };
    });
    updateStats();
  }

  function showDetails(word) {
    if (!word) return;
    current = word;
    [['d-word',word.word],['d-pos',word.partOfSpeech||'word'],['d-pron',word.pronunciation||'—'],['d-def',word.definition||'—'],['d-synonyms',word.synonyms?'Synonyms · '+word.synonyms:''],['d-ru',word.russian||'—'],['d-uz',word.uzbek||'—'],['d-sentence',word.sentence||'—']].forEach(([id,value]) => document.getElementById(id).textContent=value);
    dialog.showModal();
  }

  function setStatus(value) {
    if (!current) return;
    statuses[current.word] = value;
    localStorage.setItem('verba-status', JSON.stringify(statuses));
    dialog.close(); draw();
  }

  function beginStudy() {
    const studyDeck = document.getElementById('study-deck').value;
    const pool = studyDeck === 'all' ? allWords : sets[studyDeck];
    const now = Date.now();
    let available = pool.filter(w => !reviews[w.word] || (reviews[w.word].due || 0) <= now);
    const order = document.querySelector('input[name="study-order"]:checked').value;
    const requested = document.getElementById('study-limit').value;
    if (requested === 'custom') {
      const range = parseRange(document.getElementById('word-range').value, pool.length);
      if (!range) { updateRangePreview(); document.getElementById('word-range').focus(); return; }
      available = pool.slice(range.start, range.end);
    } else {
      available = available.slice(0, requested === 'all' ? available.length : Number(requested));
    }
    if (order === 'random') {
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
    }
    session = available;
    sessionIndex = 0;
    changingCard = false;
    document.getElementById('study-setup').hidden = true;
    document.querySelector('.study-progress').hidden = false;
    document.querySelector('.study-progress-track').hidden = false;
    document.getElementById('study-finished').hidden = true;
    document.querySelector('.flashcard').hidden = session.length === 0;
    document.getElementById('review-actions').hidden = true;
    if (!session.length) {
      document.querySelector('.study-progress-track').hidden = true;
      document.getElementById('study-finished').hidden = false;
      document.getElementById('study-finished').querySelector('strong').textContent = 'All caught up';
      document.getElementById('study-finished').querySelector('span').textContent = 'No words are due right now. Come back later for your next spaced review.';
    } else showStudyCard();
  }

  function showStudyCard() {
    const word = session[sessionIndex];
    document.getElementById('study-count').textContent = 'Card ' + (sessionIndex + 1) + ' of ' + session.length;
    document.getElementById('study-due').textContent = session.length + ' selected';
    document.getElementById('study-progress-fill').style.width = ((sessionIndex + 1) / session.length * 100) + '%';
    document.getElementById('flash-word').textContent = word.word;
    document.getElementById('flashcard-label').textContent = 'TRY TO RECALL THE MEANING';
    document.getElementById('flash-answer').hidden = true;
    document.getElementById('review-actions').hidden = true;
    document.getElementById('reveal').hidden = false;
    animate(document.querySelector('.flashcard'), [
      {opacity:0,transform:'translateX(34px) scale(.96)'},
      {opacity:1,transform:'translateX(0) scale(1)'}
    ], {duration:380,easing:'cubic-bezier(.18,.8,.25,1)'});
  }

  function revealAnswer() {
    const word = session[sessionIndex];
    const answer = document.getElementById('flash-answer');
    answer.querySelector('.flash-definition').textContent = word.definition || 'Definition unavailable';
    answer.querySelector('.flash-translations').innerHTML = [['Russian',word.russian],['Uzbek',word.uzbek]].filter(x=>x[1]).map(([label,value])=>'<div><b>'+label+'</b><span>'+escapeHTML(value)+'</span></div>').join('');
    answer.querySelector('.flash-example').textContent = word.sentence || '';
    answer.hidden = false;
    animate(answer, [{opacity:0,transform:'translateY(18px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}], {duration:340,easing:'cubic-bezier(.18,.8,.25,1)'});
    document.getElementById('flashcard-label').textContent = word.partOfSpeech || 'WORD';
    document.getElementById('reveal').hidden = true;
    document.getElementById('review-actions').hidden = false;
    animate(document.getElementById('review-actions'), [{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}], {duration:300,easing:'ease-out'});
  }

  async function rateCard(rating) {
    if (changingCard) return;
    changingCard = true;
    const word = session[sessionIndex];
    const prev = reviews[word.word] || {box:0};
    const intervals = [1,3,7,14,30,60];
    let box = prev.box || 0, delay;
    if (rating === 'again') { box = 0; delay = 60_000; statuses[word.word] = 'learning'; }
    else if (rating === 'hard') { box = Math.max(1,box); delay = 86_400_000; statuses[word.word] = 'learning'; }
    else {
      box = Math.min(intervals.length - 1, box + (rating === 'easy' ? 2 : 1));
      delay = intervals[box] * 86_400_000;
      statuses[word.word] = box >= 3 ? 'mastered' : 'learning';
    }
    reviews[word.word] = {box, due:Date.now()+delay, seen:(prev.seen||0)+1};
    localStorage.setItem('verba-reviews', JSON.stringify(reviews));
    localStorage.setItem('verba-status', JSON.stringify(statuses));
    await animate(document.querySelector('.flashcard'), [
      {opacity:1,transform:'translateX(0) scale(1)'},
      {opacity:0,transform:'translateX(' + (rating === 'again' ? '-38px' : '38px') + ') scale(.96)'}
    ], {duration:230,easing:'ease-in'});
    sessionIndex++;
    if (sessionIndex >= session.length) {
      document.querySelector('.flashcard').hidden = true;
      document.getElementById('review-actions').hidden = true;
      document.querySelector('.study-progress-track').hidden = true;
      document.getElementById('study-finished').hidden = false;
      document.getElementById('study-finished').querySelector('strong').textContent = 'Session complete';
      document.getElementById('study-finished').querySelector('span').textContent = 'You reviewed ' + session.length + ' words. Your next reviews are scheduled automatically.';
      document.getElementById('study-finished').querySelector('button').textContent = 'Choose another session';
    } else showStudyCard();
    changingCard = false;
    draw();
  }

  query.oninput = draw;
  sort.onchange = draw;
  document.querySelectorAll('.filters button').forEach(button => button.onclick = () => {
    filter = button.dataset.filter;
    document.querySelectorAll('.filters button').forEach(item => item.classList.toggle('active', item === button));
    draw();
  });
  document.querySelectorAll('.deck').forEach(button => button.onclick = () => {
    selectedDeck = button.dataset.deck;
    document.querySelectorAll('.deck').forEach(item => item.classList.toggle('active',item===button));
    draw();
  });
  document.getElementById('close').onclick = () => dialog.close();
  document.getElementById('learning').onclick = () => setStatus('learning');
  document.getElementById('mastered').onclick = () => setStatus('mastered');
  dialog.onclick = event => { if (event.target === dialog) dialog.close(); };
  document.getElementById('start-study').onclick = () => { study.showModal(); };
  document.getElementById('study-limit').onchange = updateRangePreview;
  document.getElementById('study-deck').onchange = updateRangePreview;
  document.getElementById('word-range').oninput = updateRangePreview;
  document.getElementById('begin-study').onclick = beginStudy;
  document.getElementById('study-again').onclick = () => {
    document.getElementById('study-finished').hidden = true;
    document.getElementById('study-setup').hidden = false;
    document.querySelector('.study-progress').hidden = true;
    document.querySelector('.study-progress-track').hidden = true;
  };
  document.getElementById('study-home').onclick = () => study.close();
  document.getElementById('reveal').onclick = revealAnswer;
  document.querySelectorAll('.review-actions button').forEach(button => button.onclick = () => rateCard(button.dataset.rating));
  study.addEventListener('cancel', event => event.preventDefault());
  document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); query.focus(); } });
  draw();
})();
