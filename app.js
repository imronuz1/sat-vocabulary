(() => {
  const words = window.VOCABULARY || [];
  const grid = document.getElementById('grid');
  const query = document.getElementById('query');
  const sort = document.getElementById('sort');
  const dialog = document.getElementById('detail');
  let filter = 'all';
  let current = null;
  let statuses = {};
  try { statuses = JSON.parse(localStorage.getItem('verba-status') || '{}'); } catch {}

  const status = word => statuses[word] || 'new';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function updateStats() {
    const mastered = words.filter(word => status(word.word) === 'mastered').length;
    const learning = words.filter(word => status(word.word) === 'learning').length;
    const percent = words.length ? Math.round(mastered / words.length * 100) : 0;
    document.getElementById('total').textContent = words.length;
    document.getElementById('all-stat').textContent = words.length;
    document.getElementById('all-count').textContent = words.length;
    document.getElementById('learn-stat').textContent = learning;
    document.getElementById('master-stat').textContent = mastered;
    document.getElementById('progress').style.width = percent + '%';
    document.getElementById('progress-label').textContent = percent + '% mastered';
  }

  function row(label, value, cls = '', attr = '', synonyms = '') {
    const shown = value || '—';
    return '<div class="row ' + cls + (synonyms ? ' has-synonyms' : '') + '">' +
      '<span class="label">' + label + '</span><span class="value ' +
      (cls === 'arabic' ? 'arabic' : '') + '" ' + attr + '>' + escapeHTML(shown) +
      '</span>' + (synonyms ? '<small class="synonyms">Synonyms · ' +
        escapeHTML(synonyms) + '</small>' : '') + '</div>';
  }

  function draw() {
    const needle = query.value.trim().toLocaleLowerCase();
    const visible = words.filter(word => {
      const searchable = [word.word, word.definition, word.synonyms, word.arabic,
        word.russian, word.uzbek].join(' ').toLocaleLowerCase();
      return searchable.includes(needle) && (filter === 'all' || status(word.word) === filter);
    });
    if (sort.value === 'az') visible.sort((a, b) => a.word.localeCompare(b.word));
    if (sort.value === 'za') visible.sort((a, b) => b.word.localeCompare(a.word));
    if (sort.value === 'random') visible.sort((a, b) =>
      (a.randomKey ??= Math.random()) - (b.randomKey ??= Math.random()));

    grid.innerHTML = visible.map(word =>
      '<article class="card" tabindex="0" role="button" data-word="' +
      escapeHTML(word.word) + '" aria-label="Study ' + escapeHTML(word.word) + '">' +
      '<div class="card-head"><span class="card-word">' + escapeHTML(word.word) +
      '</span><span class="status ' + status(word.word) + '">' + status(word.word) +
      '</span></div>' + row('Definition', word.definition, '', '', word.synonyms) +
      row('Arabic', word.arabic, 'arabic', 'lang="ar" dir="rtl"') +
      row('Russian', word.russian, '', 'lang="ru"') +
      row('Uzbek', word.uzbek, '', 'lang="uz"') +
      row('Example', word.sentence, 'example') + '</article>'
    ).join('');
    document.getElementById('empty').hidden = visible.length > 0;
    grid.hidden = visible.length === 0;
    document.getElementById('results').textContent = needle || filter !== 'all'
      ? 'Showing ' + visible.length + ' of ' + words.length + ' words'
      : 'Showing all ' + visible.length + ' words';
    grid.querySelectorAll('.card').forEach(card => {
      const open = () => showDetails(words.find(word => word.word === card.dataset.word));
      card.onclick = open;
      card.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      };
    });
    updateStats();
  }

  function showDetails(word) {
    if (!word) return;
    current = word;
    const values = [
      ['d-word', word.word], ['d-pos', word.partOfSpeech || 'word'],
      ['d-pron', word.pronunciation || '—'], ['d-def', word.definition || '—'],
      ['d-synonyms', word.synonyms ? 'Synonyms · ' + word.synonyms : ''],
      ['d-ar', word.arabic || '—'], ['d-ru', word.russian || '—'],
      ['d-uz', word.uzbek || '—'], ['d-sentence', word.sentence || '—']
    ];
    values.forEach(([id, value]) => { document.getElementById(id).textContent = value; });
    dialog.showModal();
  }

  function setStatus(value) {
    if (!current) return;
    statuses[current.word] = value;
    localStorage.setItem('verba-status', JSON.stringify(statuses));
    dialog.close();
    draw();
  }

  query.oninput = draw;
  sort.onchange = draw;
  document.querySelectorAll('.filters button').forEach(button => {
    button.onclick = () => {
      filter = button.dataset.filter;
      document.querySelectorAll('.filters button').forEach(item =>
        item.classList.toggle('active', item === button));
      draw();
    };
  });
  document.getElementById('close').onclick = () => dialog.close();
  document.getElementById('learning').onclick = () => setStatus('learning');
  document.getElementById('mastered').onclick = () => setStatus('mastered');
  dialog.onclick = event => { if (event.target === dialog) dialog.close(); };
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); query.focus();
    }
  });
  draw();
})();
