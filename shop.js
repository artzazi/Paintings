
let shopContent = null;
let shopLanguage = localStorage.getItem('zazaa-language') || 'en';

async function loadShopLanguage(lang){
  const response = await fetch(`${lang}.json`);
  shopContent = await response.json();
  shopLanguage = lang;
  localStorage.setItem('zazaa-language', lang);
  document.documentElement.lang = lang;
  renderShop();
}

function getShopValue(path){
  return path.split('.').reduce((obj, key) => obj && obj[key], shopContent);
}

function renderShop(){
  // Plain text nav / generic data-i18n elements (nav labels, prints form labels, etc.)
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = getShopValue(element.dataset.i18n);
    if (value) element.textContent = value;
  });

  document.querySelectorAll('[data-lang]').forEach(button => {
    button.classList.toggle('active', button.dataset.lang === shopLanguage);
  });

  document.getElementById('footerArtist').textContent = shopContent.footerArtist;

  const shop = shopContent.shop;

  // Hero
  document.getElementById('shopEyebrow').textContent = shop.eyebrow;
  document.getElementById('shopTitle').innerHTML =
    `${shop.titleLine1} <em>${shop.titleEm}</em>.`;
  document.getElementById('shopText').textContent = shop.text;

  // Fabric strip
  document.getElementById('fabricTitle1').textContent = shop.fabricTitle1;
  document.getElementById('fabricText1').textContent = shop.fabricText1;
  document.getElementById('fabricTitle2').textContent = shop.fabricTitle2;
  document.getElementById('fabricText2').textContent = shop.fabricText2;
  document.getElementById('fabricTitle3').textContent = shop.fabricTitle3;
  document.getElementById('fabricText3').textContent = shop.fabricText3;

  document.getElementById('scarvesEyebrow').textContent = shop.scarvesEyebrow;
  document.getElementById('scarvesTitle').textContent = shop.scarvesTitle;
  document.getElementById('shopNote').innerHTML =
    `${shop.note} <a href="mailto:info@zazaa.de">info@zazaa.de</a>`;

  // Products
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = shop.products.map((product, i) => {
    const options = product.materials.map((m, j) =>
      `<option value="${j}" data-price="${m.price}" data-id="${m.id}">${m.label}</option>`
    ).join('');
    const first = product.materials[0];
    return `
      <article>
        <div class="shop-panel" tabindex="0">
          <div class="shop-layer shop-abstract"></div>
          <div class="shop-layer shop-portrait"></div>
        </div>
        <div class="shop-info">
          <span class="kind">${product.kind}</span>
          <h3>${product.title}</h3>
          <p class="desc">${product.desc}</p>
          <div class="shop-options">
            <select id="mat-${i}" onchange="updatePrice(${i})">${options}</select>
          </div>
          <div class="shop-buy-row">
            <span class="shop-price" id="price-${i}">${first.price} €</span>
            <button
              class="snipcart-add-item shop-add"
              id="btn-${i}"
              data-item-id="${first.id}"
              data-item-price="${first.price}.00"
              data-item-url="/shop.html"
              data-item-description="${product.kind} — ${product.title}"
              data-item-name="${product.title}"
              data-item-image="/${first.id}.jpg"
              data-item-max-quantity="8">
              ${shop.addToCart}
            </button>
          </div>
        </div>
      </article>`;
  }).join('');
}

function updatePrice(i){
  const select = document.getElementById('mat-' + i);
  const opt = select.options[select.selectedIndex];
  const price = opt.getAttribute('data-price');
  const id = opt.getAttribute('data-id');

  document.getElementById('price-' + i).textContent = price + ' €';

  const btn = document.getElementById('btn-' + i);
  btn.setAttribute('data-item-id', id);
  btn.setAttribute('data-item-price', price + '.00');
}

document.addEventListener('click', event => {
  const langButton = event.target.closest('[data-lang]');
  if (langButton) loadShopLanguage(langButton.dataset.lang);
});

// Netlify print-request form (reused from index.html, same field names)
function encodeShopFormData(form){
  return new URLSearchParams(new FormData(form)).toString();
}

function attachShopForm(){
  const form = document.getElementById('print-request-form');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeShopFormData(form)
    }).then(() => {
      const successTitle = getShopValue('prints.formSuccessTitle') || 'Thank you';
      const successText = getShopValue('prints.formSuccessText') || 'Your request has been sent.';
      form.innerHTML = `<p class="form-success"><strong>${successTitle}.</strong> ${successText}</p>`;
    }).catch(() => {
      form.insertAdjacentHTML('beforeend', '<p class="form-error">Something went wrong. Please email info@zazaa.de directly.</p>');
    });
  });
}

attachShopForm();
loadShopLanguage(shopLanguage);
