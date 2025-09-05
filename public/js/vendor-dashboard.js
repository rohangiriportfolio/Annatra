const loginClick = (id, url) =>
    document.getElementById(id)?.addEventListener('click', () => {
        window.location.href = url;
    });

loginClick('vendor-dashboard', '/');
loginClick('find-group', '/view-group');
loginClick('dealer-products', '/dealer-products');
loginClick('my-orders', '/my-orders');

loginClick('dealer-dashboard', '/');
loginClick('view-request', '/view-request');
loginClick('add-product', '/add-product');

loginClick('viewer', '/');

loginClick('logout', '/logout');


document.getElementById('login')?.addEventListener('click', () => {
    document.getElementById('viewer')?.classList.remove('active-link');
    document.getElementById('login')?.classList.add('active-link');
    document.querySelector('.register-wrapper').style.display = 'none';
    document.querySelector('.login-wrapper').style.display = 'flex';
    document.querySelector('.overlay').style.display = 'flex';
    document.querySelector('body').style.height = '100vh';
    // document.querySelector('main.container').style.position = 'fixed';
});

document.getElementById('register')?.addEventListener('click', () => {
    document.getElementById('viewer')?.classList.remove('active-link');
    document.getElementById('register')?.classList.add('active-link');
    document.querySelector('.login-wrapper').style.display = 'none';
    document.querySelector('.register-wrapper').style.display = 'flex';
    document.querySelector('.overlay').style.display = 'flex';
    document.querySelector('body').style.height = '100vh';
});

document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
        const wrapper = btn.closest('.login-wrapper, .register-wrapper');
        wrapper.classList.add('closing');
        document.getElementById('login')?.classList.remove('active-link');
        document.getElementById('register')?.classList.remove('active-link');
        document.getElementById('viewer')?.classList.add('active-link');
        wrapper.addEventListener('transitionend', (e) => {
            if (e.propertyName !== 'opacity') return; // Ignore unrelated transitions
            wrapper.style.display = 'none';
            wrapper.classList.remove('closing');
            document.querySelector('body').style.height = 'auto';
            document.querySelector('.overlay').style.display = 'none';
        });

    });
});




//SIDEBAR & HEADER LOGIC

const sidebar = document.getElementById('sidebar');
const navIcons = sidebar.querySelectorAll('nav div');

navIcons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.add('expanded');
        }
    });

    icon.addEventListener('mouseleave', (event) => {
        if (window.innerWidth > 768) {
            const toElement = event.relatedTarget;
            if (!sidebar.contains(toElement)) {
                sidebar.classList.remove('expanded');
            }
        }
    });
});

sidebar.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('expanded');
    }
});

function openSidebar() {
    sidebar.classList.add('expanded');
}
function closeSidebar() {
    sidebar.classList.remove('expanded');
}
document.getElementById('closeBtn').onclick = closeSidebar;

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
        !hamburger.contains(event.target)
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

document.getElementById('tryLogin').addEventListener('click', () => {
    document.querySelector('.register-wrapper').style.display = 'none';
    document.querySelector('.login-wrapper').style.display = 'flex';
});

document.getElementById('tryRegister').addEventListener('click', () => {
    document.querySelector('.login-wrapper').style.display = 'none';
    document.querySelector('.register-wrapper').style.display = 'flex';
});

document.getElementById('auto-location')?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      fetch('/add-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon })
      })
      .then(response => response.json())
      .then(data => {
        alert('Location saved!!!');
      })
      .catch(error => {
        console.error('Error:', error);
      });
    },
    (error) => {
      alert('Error getting location: ' + error.message);
    }
  );
});

document.getElementById('manual-location')?.addEventListener('click', ()=>{
    window.location.href='/manual-location';
});

document.getElementById('popup-close')?.addEventListener('click', ()=>{
    document.getElementById('popup').style.display='none';
});

document.querySelector('#location img')?.addEventListener('click', ()=>{
    document.getElementById('popup').style.display='block';
});

document.getElementById('range-popup-close')?.addEventListener('click', ()=>{
    document.getElementById('range-popup').style.display='none';
});

document.querySelector('#range img')?.addEventListener('click', ()=>{
    document.getElementById('range-popup').style.display='block';
});

document.getElementById('range-save')?.addEventListener('click', ()=>{
    const limit = document.getElementById('buy-limit').value;
    const radius = document.getElementById('radius').value;

    fetch('/range-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit, radius })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Range saved:', data);
      })
      .catch(error => {
        console.error('Error:', error);
      });

});


