// Toggle member details visibility
document.querySelectorAll('.toggle-members').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (targetEl.style.display === 'none') {
      targetEl.style.display = 'block';
      button.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide Members';
    } else {
      targetEl.style.display = 'none';
      button.innerHTML = '<i class="fa-solid fa-eye"></i> Show Members';
    }
  });
});

// Approve order request button click handler
document.querySelectorAll('.approve-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const orderId = button.getAttribute('data-orderid');
    const dealerId = button.getAttribute('data-dealerid');

    button.disabled = true;
    button.textContent = 'Approving...';

    try {
      const res = await fetch('/approve-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, dealerId })
      });

      const result = await res.json();
      if (result.success) {
        alert(`Order ${orderId} approved successfully.`);
        location.reload();
      } else {
        alert(`Error: ${result.message}`);
        button.disabled = false;
        button.textContent = 'Approve Request';
      }
    } catch (err) {
      alert('Failed to approve order. Try again later.');
      button.disabled = false;
      button.textContent = 'Approve Request';
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

function openSidebar() {
    sidebar.classList.add('expanded');
}
function closeSidebar() {
    sidebar.classList.remove('expanded');
}
document.getElementById('closeBtn').onclick = closeSidebar;

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