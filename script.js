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

// Publication videos: load and play only while on screen
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var videoObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) entry.target.play().catch(function() {});
            else entry.target.pause();
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.pub-fig video').forEach(function(v) {
        videoObserver.observe(v);
    });
}

// Research areas: count each area's papers, list them, and filter the publications on click
var areas = document.querySelectorAll('.area');
var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub[data-topic]'));
var areaFilter = document.getElementById('area-filter');
var activeArea = null;

function setArea(topic) {
    activeArea = topic;
    areas.forEach(function(a) { a.setAttribute('aria-pressed', String(a.dataset.topic === topic)); });
    pubs.forEach(function(p) { p.classList.toggle('is-filtered-out', !!topic && p.dataset.topic !== topic); });
    areaFilter.hidden = !topic;
    if (topic) areaFilter.querySelector('strong').textContent = document.querySelector('.area[data-topic="' + topic + '"] .area-head').firstChild.textContent;
}

areas.forEach(function(a) {
    var mine = pubs.filter(function(p) { return p.dataset.topic === a.dataset.topic; });
    a.querySelector('.area-count').textContent = mine.length + (mine.length === 1 ? ' paper' : ' papers');
    a.querySelector('.area-papers').textContent = mine.map(function(p) { return p.dataset.short; }).join(' · ');
    a.addEventListener('click', function() {
        setArea(activeArea === a.dataset.topic ? null : a.dataset.topic);
        if (activeArea) document.getElementById('publications').scrollIntoView();
    });
});
if (areaFilter) areaFilter.querySelector('button').addEventListener('click', function() { setArea(null); });
