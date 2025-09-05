const viewBtn = document.getElementById('viewGroupBtn');
const membersList = document.getElementById('membersList');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
const statusMessage = document.getElementById('statusMessage');
const dynamicActions = document.getElementById('dynamicActions');
const viewCart = document.getElementById('view-cart');

// Example values (replace with EJS variables later)
let totalAmountText = document.getElementById('totalAmount').textContent; // e.g. "₹1200"
let totalAmount = parseFloat(totalAmountText.replace(/[^\d.]/g, ''));     // result: 1200

let targetAmount = 500;
let orderConfirmed = false;

viewBtn.addEventListener('click', () => {
    membersList.style.display = membersList.style.display === 'none' ? 'block' : 'none';
    viewBtn.innerHTML = membersList.style.display === 'block'
        ? '<i class="fa-solid fa-eye-slash"></i> Hide Group'
        : '<i class="fa-solid fa-eye"></i> View Group';
});

document.getElementById('confirmOrderBtn').addEventListener('click', () => {
    if(currentUserAmount > 0){
        fetch('/confirm-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Order confirmed!");
                    window.location.reload();
                } else {
                    alert("Failed to confirm order.");
                }
            })
            .catch(err => {
                console.error("Error:", err);
                alert("Something went wrong.");
            });
    }
    else {
        alert("Please insert some items into the cart before ordering !!!");
    }
});

console.log(currentUserAmount);

viewCart.addEventListener('click', () => {
    window.location.href = '/dealer-products';
});

const loginClick = (id, url) =>
    document.getElementById(id)?.addEventListener('click', () => {
        window.location.href = url;
    });

loginClick('vendor-dashboard', '/');
loginClick('find-group', '/find-group');
loginClick('dealer-products', '/dealer-products');
loginClick('my-orders', '/my-orders');
loginClick('logout', '/logout');


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
