
let currentContent = null;
let currentLanguage = localStorage.getItem('zazaa-language') || 'en';

async function loadLanguage(lang){
  const response = await fetch(`data/${lang}.json`);
  currentContent = await response.json();
  currentLanguage = lang;
  localStorage.setItem('zazaa-language', lang);
  document.documentElement.lang = lang;
  renderLanguage();
}

function getValue(path){
  return path.split('.').reduce((obj, key) => obj && obj[key], currentContent);
}

function renderLanguage(){
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = getValue(element.dataset.i18n);
    if (value) element.textContent = value;
  });

  document.querySelectorAll('[data-lang]').forEach(button => {
    button.classList.toggle('active', button.dataset.lang === currentLanguage);
  });

  document.getElementById('footerArtist').textContent = currentContent.footerArtist;
  renderWorks();
  renderSeries();
  renderAbout();
  renderExhibitions();
  renderEducation();
}

function renderWorks(){
  const grid = document.getElementById('worksGrid');
  grid.innerHTML = currentContent.works.map(work => `
    <article class="work-card" data-series="${work.seriesKey}">
      <button class="work-button" data-slug="${work.slug}" aria-label="Open artwork ${work.title}">
        <img src="${work.image}" alt="${work.title}, artwork by Zazaa Ganbold" loading="lazy">
      </button>
      <div class="work-meta">
        <h3>${work.title}</h3>
        <p>${work.year}</p>
        <p>${work.medium}</p>
        <p>${work.size}</p>
        ${work.status ? `<p>${work.status}</p>` : ''}
      </div>
    </article>
  `).join('');
}

function renderSeries(){
  const grid = document.getElementById('seriesGrid');
  grid.innerHTML = Object.entries(currentContent.series).map(([key, name]) => {
    const titles = currentContent.works.filter(work => work.seriesKey === key).slice(0,5).map(work => work.title).join(', ');
    return `<article><h3>${name}</h3><p>${titles}</p></article>`;
  }).join('');
}

function renderAbout(){
  const about = document.getElementById('aboutText');
  about.innerHTML = currentContent.about.map(text => `<p>${text}</p>`).join('');
}

function renderExhibitions(){
  const wrap = document.getElementById('exhibitionContent');
  const block = (title, items) => `
    <div class="exhibition-block">
      <h3>${title}</h3>
      <ul>
        ${items.map(item => `<li><span>${item.year}</span><p>${item.text}</p></li>`).join('')}
      </ul>
    </div>`;
  wrap.innerHTML = block(currentContent.exhibitions.soloTitle, currentContent.exhibitions.solo) + block(currentContent.exhibitions.groupTitle, currentContent.exhibitions.group);
}

function renderEducation(){
  document.getElementById('educationText').innerHTML = currentContent.education.map(text => `<p>${text}</p>`).join('');
}

document.addEventListener('click', event => {
  const langButton = event.target.closest('[data-lang]');
  if (langButton) loadLanguage(langButton.dataset.lang);

  const workButton = event.target.closest('.work-button');
  if (workButton && currentContent) {
    const work = currentContent.works.find(item => item.slug === workButton.dataset.slug);
    if (!work) return;
    document.getElementById('modalImage').src = work.image;
    document.getElementById('modalImage').alt = work.title + ', artwork by Zazaa Ganbold';
    document.getElementById('modalTitle').textContent = work.title;
    document.getElementById('modalDetails').textContent = `${work.year}. ${work.medium}. ${work.size}.`;
    document.getElementById('modalStatus').textContent = work.status || '';
    document.getElementById('modal').classList.add('open');
    document.getElementById('modal').setAttribute('aria-hidden','false');
  }
});

function closeModal(){
  const modal = document.getElementById('modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.getElementById('modalImage').src = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', event => {
  if (event.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

loadLanguage(currentLanguage);
