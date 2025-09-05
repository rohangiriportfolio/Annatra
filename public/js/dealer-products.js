// Global cart and total price
let cart = {}; // { "productKey": { qty, price, item } }
let totalPrice = 0;

// Cached DOM references
const dealerContainer = document.getElementById('dealer-container');
const productList = document.getElementById('productList');
const dealerSearch = document.getElementById('dealerSearch');
const saveCartBtn = document.getElementById('saveCartBtn');
const productContainer = document.getElementById('products-container');


// Load cart from server on page load and update UI
async function loadCartFromServer() {
  try {
    const response = await fetch('/get-cart');
    if (!response.ok) throw new Error('Failed to fetch cart');
    const data = await response.json();
    if (data.success && Array.isArray(data.cart)) {
      cart = {};
      data.cart.forEach(item => {
        cart[item.item] = { qty: item.quantity, price: item.price, item: item.item };
      });
    } else {
      cart = {};
    }
    updateCart();
  } catch (err) {
    console.error('Error loading cart from server:', err);
    cart = {};
    updateCart();
  }
}

// Save entire cart to server and return success status
async function saveCartToServer() {
  const cartItems = Object.keys(cart).map(key => ({
    item: key,
    price: cart[key].price,
    quantity: cart[key].qty
  }));
  try {
    const response = await fetch('/save-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems })
    });
    if (!response.ok) throw new Error('Failed to save cart');
    const result = await response.json();
    return result.success;
  } catch (err) {
    console.error('Failed to save cart to server:', err);
    return false;
  }
}

// Setup dealer search filter
function setupDealerSearch() {
  const searchInput = document.getElementById('searchBar1');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const searchValue = searchInput.value.toLowerCase();
    const dealerCards = document.querySelectorAll('.dealer-card');
    dealerCards.forEach(card => {
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      card.style.display = name.includes(searchValue) ? '' : 'none';
    });
  });
}
setupDealerSearch();

// Setup product search filter
function setupProductSearch() {
  const searchInput = document.getElementById('searchBar2');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const searchValue = searchInput.value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card-wrapper');
    productCards.forEach(card => {
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      card.style.display = name.includes(searchValue) ? '' : 'none';
    });
  });
}

// Enable plus/minus buttons on product cards with server sync
function enableProductCardButtons() {
  const wrappers = productList.querySelectorAll('.product-card-wrapper');
  wrappers.forEach(wrapper => {
    const card = wrapper.querySelector('.product-card');
    if (!card) return;
    const plusBtn = card.querySelector('.plus-btn');
    const minusBtn = card.querySelector('.minus-btn');
    const quantitySpan = card.querySelector('.quantity');
    const productName = card.querySelector('.card-title')?.textContent || '';
    const priceText = card.querySelector('.fw-bold')?.textContent.replace(/[^\d]/g, '') || '0';
    const price = parseInt(priceText, 10);
    const productKey = wrapper.getAttribute('data-name') || '';

    if (!plusBtn || !minusBtn || !quantitySpan || !productKey) return;

    // Remove previous listeners to avoid duplicates
    plusBtn.replaceWith(plusBtn.cloneNode(true));
    minusBtn.replaceWith(minusBtn.cloneNode(true));
    const newPlusBtn = card.querySelector('.plus-btn');
    const newMinusBtn = card.querySelector('.minus-btn');

    quantitySpan.textContent = cart[productKey]?.qty || 0;

    newPlusBtn.addEventListener('click', async () => {
      let qty = parseInt(quantitySpan.textContent);
      qty++;
      cart[productKey] = { qty, price, item: productName };
      const success = await saveCartToServer();
      if (success) {
        quantitySpan.textContent = qty;
        updateCart();
      } else {
        alert('Failed to add item to cart. Please try again.');
        qty--;
        if (qty > 0) {
          cart[productKey].qty = qty;
        } else {
          delete cart[productKey];
        }
      }
    });

    newMinusBtn.addEventListener('click', async () => {
      let qty = parseInt(quantitySpan.textContent);
      if (qty > 0) qty--;
      if (qty > 0) {
        cart[productKey].qty = qty;
      } else {
        delete cart[productKey];
      }
      const success = await saveCartToServer();
      if (success) {
        quantitySpan.textContent = qty > 0 ? qty : 0;
        updateCart();
      } else {
        alert('Failed to remove item from cart. Please try again.');
        qty++;
        cart[productKey] = { qty, price, item: productName };
      }
    });
  });
}

// Update cart sidebar UI from full global cart
function updateCart() {
  const cartList = document.getElementById('cartItems');
  const totalPriceEl = document.getElementById('totalPrice');
  if (!cartList || !totalPriceEl) return;

  cartList.innerHTML = '';
  totalPrice = 0;
  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    cartList.innerHTML = `<li class="list-group-item text-muted">Your cart is empty</li>`;
    totalPriceEl.textContent = '0';
    return;
  }

  cartKeys.forEach(key => {
    const { qty, price, item } = cart[key];
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <div class="list-group-item-div d-flex align-items-center justify-content-between">
        <div>
          <strong>${item}</strong><br>
          <small>₹${price} | ${qty}Pcs | Price:₹${qty * price}</small>
        </div>
        <span></span>
      </div>
    `;
    cartList.appendChild(li);
    totalPrice += qty * price;
  });

  totalPriceEl.textContent = totalPrice;
}

// Load dealer products into DOM and restore quantities from global cart
function loadDealerProductsIntoDOM(data) {
  if (!data) return;

  const dealerImageEl = document.getElementById('dealer-image');
if (dealerImageEl) {
  dealerImageEl.innerHTML = `<img src="${data.dealerImage}" alt="Profile Image">`;

  // Remove previous click listeners before adding
  dealerImageEl.replaceWith(dealerImageEl.cloneNode(true));
  // const newDealerImageEl = document.getElementById('dealer-image');

  // newDealerImageEl.addEventListener('click', () => {
  const removeCurrentDealer = document.getElementById('remove-currentDealer');

  removeCurrentDealer.addEventListener('click', () => {
    // fetch and clear
    fetch('/clear-cart-dealer', { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          window.currentDealer = null; 
          window.location.reload();
        } else {
          alert('Failed to clear cart and dealer');
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  });
}

  const dealerInfoEl = document.getElementById('dealer-info');
  if (dealerInfoEl) {
    dealerInfoEl.innerHTML = `${data.dealerName}`;
  }

  const container = document.getElementById('products-container');
  if (!container) return;

  container.innerHTML = ''; // clear first

  if (!data.products || data.products.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center">No products from dealers available.</div>
      </div>
    `;
  } else {
    data.products.forEach(product => {
      const productKey = `${product.name} (${product.quantity}${product.quantityUnit})`;
      const qtyInCart = cart[productKey]?.qty || 0;

      container.innerHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 product-card-wrapper" data-name="${productKey}">
          <div class="card product-card shadow-sm mx-auto">
            <img src="${product.image ? product.image : 'https://via.placeholder.com/200'}"
              class="card-img-top mx-auto d-block"
              alt="${product.name}"
              style="width: 150px; height: 150px; object-fit: cover;">
            <div class="card-body text-center">
              <h6 class="card-title">${product.name} (${product.quantity}${product.quantityUnit})</h6>
              <p class="fw-bold">₹${product.price}/${product.priceUnit}</p>
              <p class="text-muted small">${product.description}</p>
              <div class="d-flex justify-content-center align-items-center">
                <button class="btn btn-danger btn-sm minus-btn">
                  <i class="fa-solid fa-minus"></i>
                </button>
                <span class="mx-2 quantity">${qtyInCart}</span>
                <button class="btn btn-success btn-sm plus-btn">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  setupProductSearch();
  enableProductCardButtons();
}

// Bind click events for dealer view buttons
function bindDealerViewButtons() {
  const buttons = document.querySelectorAll('.view-items-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const dealerId = btn.getAttribute('data-dealer-id');
      if (!dealerId) {
        alert('Dealer ID not found');
        return;
      }
      fetch(`/dealer-products/${dealerId}`)
        .then(res => {
          if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
          return res.json();
        })
        .then(data => {
          loadDealerProductsIntoDOM(data);
          if (dealerContainer) dealerContainer.style.display = 'none';
          if (productList) productList.style.display = 'flex';
        })
        .catch(err => {
          alert('Failed to load dealer products');
          console.error(err);
        });
    });
  });
}

// Save entire cart to server, not only visible UI items
function setupSaveCartBtn() {
  if (!saveCartBtn) return;
  saveCartBtn.addEventListener('click', async () => {
      window.location.href='/view-group';
    // const cartItems = Object.keys(cart).map(key => ({
    //   item: key,
    //   price: cart[key].price,
    //   quantity: cart[key].qty
    // }));

    // try {
    //   const response = await fetch('/save-cart', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ cartItems })
    //   });
    //   const result = await response.json();
    //   if (result.success) {
    //     alert('Cart saved successfully!');
    //     location.reload();
    //   } else {
    //     alert('Failed to save cart');
    //   }
    // } catch (error) {
    //   console.error(error);
    //   alert('Failed to save cart');
    // }
  });
}

// Get dealerId from URL query string (NEW)
function getDealerIdFromURL() {
  return window.currentDealer;
}


// Initialization - runs when DOM fully loaded (UPDATED)
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('dealer-products').classList.add('active-link');
  await loadCartFromServer();
  bindDealerViewButtons();
  setupSaveCartBtn();

  // other setups...

  if (productList) productList.style.display = 'none';
  if (dealerContainer) dealerContainer.style.display = 'flex';

  const dealerId = getDealerIdFromURL();
  if (dealerId) {
    try {
      const response = await fetch(`/dealer-products/${dealerId}`);
      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
      const data = await response.json();
      if (data && data.products && data.products.length > 0) {
        loadDealerProductsIntoDOM(data);
        if (dealerContainer) dealerContainer.style.display = 'none';
        if (productList) productList.style.display = 'flex';
      } else {
        if (dealerContainer) {
          dealerContainer.innerHTML = '<div class="alert alert-info">No products available for selected dealer.</div>';
        }
      }
    } catch (err) {
      // alert('Failed to load dealer products');
      console.error(err);
    }
  }
});



// Login click helpers
const loginClick = (id, url) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', () => {
      window.location.href = url;
    });
  }
};

loginClick('vendor-dashboard', '/');
loginClick('find-group', '/view-group');
loginClick('dealer-products', '/dealer-products');
loginClick('my-orders', '/my-orders');
loginClick('logout', '/logout');
loginClick('viewer', '/');

// const loginEl = document.getElementById('login');
// if (loginEl) {
//   loginEl.addEventListener('click', () => {
//     const registerWrapper = document.querySelector('.register-wrapper');
//     const loginWrapper = document.querySelector('.login-wrapper');
//     if (registerWrapper) registerWrapper.style.display = 'none';
//     if (loginWrapper) loginWrapper.style.display = 'flex';
//   });
// }

// const registerEl = document.getElementById('register');
// if (registerEl) {
//   registerEl.addEventListener('click', () => {
//     const registerWrapper = document.querySelector('.register-wrapper');
//     const loginWrapper = document.querySelector('.login-wrapper');
//     if (loginWrapper) loginWrapper.style.display = 'none';
//     if (registerWrapper) registerWrapper.style.display = 'flex';
//   });
// }

// document.querySelectorAll('.close').forEach(btn => {
//   btn.addEventListener('click', () => {
//     const wrapper = btn.closest('.login-wrapper, .register-wrapper');
//     if (!wrapper) return;
//     wrapper.classList.add('closing');
//     wrapper.addEventListener('transitionend', () => {
//       wrapper.style.display = 'none';
//       wrapper.classList.remove('closing');
//     });
//   });
// });

// SIDEBAR & HEADER LOGIC
const sidebar = document.getElementById('sidebar');
const navIcons = sidebar?.querySelectorAll('nav div') || [];

navIcons.forEach(icon => {
  icon.addEventListener('mouseenter', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.add('expanded');
    }
  });

  icon.addEventListener('mouseleave', event => {
    if (window.innerWidth > 768) {
      const toElement = event.relatedTarget;
      if (!sidebar.contains(toElement)) {
        sidebar.classList.remove('expanded');
      }
    }
  });
});

if (sidebar) {
  sidebar.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('expanded');
    }
  });
}

const closeBtn = document.getElementById('closeBtn');
if (closeBtn) closeBtn.onclick = () => sidebar.classList.remove('expanded');

function isMobile() {
  return window.innerWidth <= 768;
}
window.addEventListener('resize', () => {
  if (!isMobile()) {
    sidebar.classList.remove('expanded');
  }
});

document.addEventListener('click', event => {
  const hamburger = document.querySelector('.hamburger');
  if (
    isMobile() &&
    sidebar.classList.contains('expanded') &&
    !sidebar.contains(event.target) &&
    (!hamburger || !hamburger.contains(event.target))
  ) {
    sidebar.classList.remove('expanded');
  }
});

window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  const main = document.querySelector('main.container');
  if (window.scrollY > 10) {
    header.classList.add('scrolled');
    main.classList.add('header-fixed');
  } else {
    header.classList.remove('scrolled');
    main.classList.remove('header-fixed');
  }
});

function openSidebar() {
    sidebar.classList.add('expanded');
}
function closeSidebar() {
    sidebar.classList.remove('expanded');
}
document.getElementById('closeBtn').onclick = closeSidebar;