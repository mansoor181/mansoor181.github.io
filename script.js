// Lightbox
function openLightbox(src) {
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    img.src = src;
    lb.style.display = 'flex';
    requestAnimationFrame(function() {
        requestAnimationFrame(function() { lb.classList.add('show'); });
    });
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    var lb = document.getElementById('lightbox');
    lb.classList.remove('show');
    setTimeout(function() { lb.style.display = 'none'; }, 300);
    document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox();
});

// Nav shadow on scroll
var nav = document.getElementById('nav');
window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Active nav link
var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('.nav-links a');

function updateNav() {
    var y = window.scrollY + 100;
    sections.forEach(function(s) {
        var t = s.offsetTop, h = s.offsetHeight, id = s.id;
        if (y >= t && y < t + h) {
            navLinks.forEach(function(a) {
                a.classList.toggle('active', a.getAttribute('href') === '#' + id);
            });
        }
    });
}
window.addEventListener('scroll', updateNav);
updateNav();

// Scroll-reveal animations
var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-animate]').forEach(function(el) {
    observer.observe(el);
});
