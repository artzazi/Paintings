
let currentContent = null;
let currentLanguage = localStorage.getItem('zazaa-language') || 'en';

async function loadLanguage(lang){
  const response = await fetch(`${lang}.json`);
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

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const value = getValue(element.dataset.i18nPlaceholder);
    if (value) element.setAttribute('placeholder', value);
  });

  document.querySelectorAll('[data-lang]').forEach(button => {
    button.classList.toggle('active', button.dataset.lang === currentLanguage);
  });

  document.getElementById('footerArtist').textContent = currentContent.footerArtist;
  renderWorks();
  renderAbout();
  renderExhibitions();
  renderEducation();
  if (currentWorkIndex !== -1) openModalByIndex(currentWorkIndex);
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

let currentWorkIndex = -1;

function openModalByIndex(index){
  if (!currentContent || !currentContent.works.length) return;
  const total = currentContent.works.length;
  currentWorkIndex = ((index % total) + total) % total;
  const work = currentContent.works[currentWorkIndex];
  document.getElementById('modalImage').src = work.image;
  document.getElementById('modalImage').alt = work.title + ', artwork by Zazaa Ganbold';
  document.getElementById('modalTitle').textContent = work.title;
  document.getElementById('modalDetails').innerHTML = `
    <p>${work.year}</p>
    <p>${work.medium}</p>
    <p>${work.size}</p>
  `;
  document.getElementById('modalStatus').textContent = work.status || '';

  const inquireLink = document.getElementById('modalInquire');
  const isSold = work.available === false;
  inquireLink.textContent = isSold
    ? (getValue('modal.inquireSold') || 'Ask About Similar Work')
    : (getValue('modal.inquire') || 'Inquire About This Piece');

  const subject = encodeURIComponent(isSold ? `Similar work to: ${work.title}` : `Inquiry: ${work.title}`);
  const body = isSold
    ? encodeURIComponent(`Hello Zazaa,\n\nI saw "${work.title}" (${work.year}), which I understand is no longer available. Do you have a similar piece available, or could you create something comparable?\n\nThank you.`)
    : encodeURIComponent(`Hello Zazaa,\n\nI am interested in the artwork "${work.title}" (${work.year}, ${work.medium}, ${work.size}).\nCould you please tell me more about availability and pricing?\n\nThank you.`);
  inquireLink.href = `mailto:info@zazaa.de?subject=${subject}&body=${body}`;

  document.getElementById('modal').classList.add('open');
  document.getElementById('modal').setAttribute('aria-hidden','false');
}

document.addEventListener('click', event => {
  const langButton = event.target.closest('[data-lang]');
  if (langButton) loadLanguage(langButton.dataset.lang);

  const workButton = event.target.closest('.work-button');
  if (workButton && currentContent) {
    const index = currentContent.works.findIndex(item => item.slug === workButton.dataset.slug);
    if (index === -1) return;
    openModalByIndex(index);
  }
});

function closeModal(){
  const modal = document.getElementById('modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.getElementById('modalImage').src = '';
  currentWorkIndex = -1;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalPrev').addEventListener('click', () => openModalByIndex(currentWorkIndex - 1));
document.getElementById('modalNext').addEventListener('click', () => openModalByIndex(currentWorkIndex + 1));
document.getElementById('modal').addEventListener('click', event => {
  if (event.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
  if (currentWorkIndex === -1) return;
  if (event.key === 'ArrowRight') openModalByIndex(currentWorkIndex + 1);
  if (event.key === 'ArrowLeft') openModalByIndex(currentWorkIndex - 1);
});

// Swipe navigation for touch devices
let touchStartX = 0;
let touchStartY = 0;
const modalEl = document.getElementById('modal');
modalEl.addEventListener('touchstart', event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });
modalEl.addEventListener('touchend', event => {
  if (currentWorkIndex === -1) return;
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) openModalByIndex(currentWorkIndex + 1);
    else openModalByIndex(currentWorkIndex - 1);
  }
}, { passive: true });


function encodeFormData(form){
  return new URLSearchParams(new FormData(form)).toString();
}

function attachNetlifyForm(formId, successKey){
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData(form)
    }).then(() => {
      const successTitle = getValue(`${successKey}.formSuccessTitle`) || getValue(`${successKey}.successTitle`) || 'Thank you';
      const successText = getValue(`${successKey}.formSuccessText`) || getValue(`${successKey}.successText`) || 'Your request has been sent.';
      form.innerHTML = `<p class="form-success"><strong>${successTitle}.</strong> ${successText}</p>`;
    }).catch(() => {
      form.insertAdjacentHTML('beforeend', '<p class="form-error">Something went wrong. Please email info@zazaa.de directly.</p>');
    });
  });
}

attachNetlifyForm('print-request-form', 'prints');
attachNetlifyForm('newsletter-form', 'newsletter');

loadLanguage(currentLanguage);
