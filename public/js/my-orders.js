const loginClick = (id, url) =>
    document.getElementById(id)?.addEventListener('click', () => {
        window.location.href = url;
    });

loginClick('vendor-dashboard', '/');
loginClick('find-group', '/view-group');
loginClick('dealer-products', '/dealer-products');
loginClick('my-orders', '/my-orders');
loginClick('logout', '/logout');

// Toggle My Order details
document.querySelectorAll('.toggle-details').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const elem = document.querySelector(targetId);
        console.log('Toggling element:', targetId, elem);
        if (!elem) {
            console.error('Target element not found for:', targetId);
            return;
        }
        const currentDisplay = window.getComputedStyle(elem).display;
        console.log('Current display:', currentDisplay);
        if (currentDisplay === 'none') {
            elem.style.display = 'block';
            button.innerHTML = '<i class="fa-solid fa-eye-slash"></i> My Order';
        } else {
            elem.style.display = 'none';
            button.innerHTML = '<i class="fa-solid fa-eye"></i> My Order';
        }
    });
});

// Toggle Other Members orders
document.querySelectorAll('.toggle-members').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const elem = document.querySelector(targetId);
        if (elem.style.display === 'none') {
            elem.style.display = 'block';
            button.innerHTML = `<i class="fa-solid fa-eye-slash"></i> Member Order`;
        } else {
            elem.style.display = 'none';
            button.innerHTML = `<i class="fa-solid fa-eye"></i> Member Order`;
        }
    });
});

//SIDEBAR & HEADER LOGIC

const sidebar = document.getElementById('sidebar');
const navIcons = sidebar.querySelectorAll('nav div i');

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