// Select Elements
const previewBtn = document.getElementById('previewBtn');
const form = document.getElementById('addProductForm');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const previewName = document.getElementById('previewName');
const previewPrice = document.getElementById('previewPrice');
const previewPriceUnit = document.getElementById('previewPriceUnit');
const previewQty = document.getElementById('previewQty');
const previewQtyUnit = document.getElementById('previewQtyUnit');
const previewDesc = document.getElementById('previewDesc');
const imageInput = document.getElementById('productImage');

// Update Preview Function
function updatePreview() {
  previewName.textContent = document.getElementById('productName').value;
  previewPrice.textContent = document.getElementById('price').value + '/ ';
  previewPriceUnit.textContent = document.getElementById('priceUnit').value;
  previewQty.textContent = document.getElementById('quantity').value;
  previewQtyUnit.textContent = document.getElementById('quantityUnit').value;
  previewDesc.textContent = document.getElementById('description').value;
}

// Preview Button Click Event
previewBtn.addEventListener('click', () => {
  const name = document.getElementById('productName').value;
  const price = document.getElementById('price').value;
  const qty = document.getElementById('quantity').value;
  const imageFile = imageInput.files[0];

  if (!name || !price || !qty || !imageFile) {
    alert('Please fill in all fields and upload an image before preview.');
    return;
  }

  updatePreview();

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewSection.style.display = 'flex';
  };
  reader.readAsDataURL(imageFile);
});

document.getElementById('productSearchInput').addEventListener('input', function() {
  const searchValue = this.value.toLowerCase();
  const productCards = document.querySelectorAll('.product-card-wrapper');

  productCards.forEach(card => {
    const name = card.getAttribute('data-name').toLowerCase();
    if (name.includes(searchValue)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
});


// public/js/add-product.js
document.getElementById('addProductForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = document.getElementById('addProductForm');
  const formData = new FormData(form);

  // Get file name from your custom display element
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const customFileName = fileNameDisplay.textContent;

  const productId = form.getAttribute('product-id');

  // Append it to the FormData with a key, e.g. 'customFileName'
  formData.append('customFileName', customFileName);
  formData.append('productId', productId);

  const response = await fetch('/add-product', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    alert('Product added successfully');
    window.location.reload();
  } else {
    alert('Failed to add product');
  }
});

document.querySelectorAll('#delete').forEach(button => {
  button.addEventListener('click', async (event) => {
    // Find the closest product-card-wrapper parent div to get product id
    const productCard = event.target.closest('.product-card-wrapper');
    if (!productCard) return;

    const productId = productCard.getAttribute('product-id');
    if (!productId) return alert('Product ID not found');

    const confirmed = confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      const response = await fetch('/delete-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();
      if (data.success) {
        alert('Product deleted successfully');
        window.location.reload();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting product');
    }
  });
});

const loginClick = (id, url) =>
    document.getElementById(id)?.addEventListener('click', () => {
        window.location.href = url;
    });

loginClick('dealer-dashboard', '/');
loginClick('view-request', '/view-request');
loginClick('add-product', '/add-product');
loginClick('logout', '/logout');


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

document.addEventListener('DOMContentLoaded', () => {
  const editButtons = document.querySelectorAll('#edit');

  editButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
      const productDiv = event.target.closest('.product-card-wrapper');
      if (!productDiv) return;

      // Extract values from product card
      const nameWithQty = productDiv.querySelector('.card-title').innerText;
      const priceWithUnit = productDiv.querySelector('.fw-bold').innerText;
      const description = productDiv.querySelector('.card-body p:not(.fw-bold)').innerText;
      const imageSrc = productDiv.querySelector('img').src;

      // Parse name, quantity, quantityUnit from the title string e.g. "Apple (2kg)"
      const nameMatch = nameWithQty.match(/^(.*?) \((\d+)(.*?)\)$/);
      let productName = "", quantity = "", quantityUnit = "";
      if (nameMatch) {
        productName = nameMatch[1];
        quantity = nameMatch[2];
        quantityUnit = nameMatch[3];
      }

      // Parse price and priceUnit from "₹60/Kg"
      const priceMatch = priceWithUnit.match(/₹(\d+)\/(.*)/);
      let price = "", priceUnit = "";
      if (priceMatch) {
        price = priceMatch[1];
        priceUnit = priceMatch[2];
      }

      // Populate the form fields
      document.getElementById('productName').value = productName;
      document.getElementById('quantity').value = quantity;
      document.getElementById('quantityUnit').value = quantityUnit.trim();
      document.getElementById('price').value = price;
      document.getElementById('priceUnit').value = priceUnit.trim();
      document.getElementById('description').value = description;
      form.setAttribute('product-id', productDiv.getAttribute('product-id'));
      // Programmatically set the file input using imageSrc (converted to blob then File)
      fetch(imageSrc)
        .then(response => response.blob())
        .then(blob => {
          const fileName = imageSrc.split('/').pop().split('?')[0] || 'image.png';
          const file = new File([blob], fileName, { type: blob.type });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          const fileInput = document.getElementById('productImage');
          fileInput.files = dataTransfer.files;

          // Find the img element (adjust selector as needed)
          const img = productDiv.querySelector('img');

          // Get the image-name attribute value
          const imageName = img ? img.getAttribute('image-name') : null;

          // Set fileNameDisplay text content to that image name or fallback
          const fileNameDisplay = document.getElementById('fileNameDisplay');
          fileNameDisplay.textContent = imageName || 'No file selected';

        })
        .catch(err => {
          console.error('Failed to set file input:', err);
        });


      document.getElementById('addProductForm').scrollIntoView({ behavior: 'smooth' });
    });
  });
});

document.getElementById('productImage').addEventListener('change', function () {
  const fileName = this.files && this.files.length > 0 ? this.files[0].name : 'No file selected';
  document.getElementById('fileNameDisplay').textContent = fileName;
});
