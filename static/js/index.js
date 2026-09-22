const scrollButton = document.querySelector('[data-scroll-to-top]');
const copyButton = document.querySelector('[data-copy-bibtex]');

copyButton.addEventListener('click', async function() {
    const bibtex = document.getElementById('bibtex-code').textContent;

    try {
        await navigator.clipboard.writeText(bibtex);
    } catch (error) {
        const textArea = document.createElement('textarea');
        textArea.value = bibtex;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
    }

    copyButton.classList.add('copied');
    copyButton.textContent = 'Copied!';
    window.setTimeout(function() {
        copyButton.classList.remove('copied');
        copyButton.textContent = 'Copy';
    }, 2000);
});

scrollButton.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

function setupTeaserCarousel() {
    const carousel = document.querySelector('[data-teaser-carousel]');
    if (!carousel) return;

    const viewport = carousel.querySelector('.teaser-viewport');
    const track = carousel.querySelector('[data-teaser-track]');
    const slides = Array.from(carousel.querySelectorAll('[data-teaser-slide]'));
    const tabs = Array.from(carousel.querySelectorAll('[data-teaser-tab]'));
    const previousButton = carousel.querySelector('[data-teaser-prev]');
    const nextButton = carousel.querySelector('[data-teaser-next]');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex = 0;
    let trackIndex = 1;
    let swipeStartX = null;
    let isAnimating = false;

    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.classList.add('is-clone');
    lastClone.classList.add('is-clone');
    firstClone.classList.remove('is-active');
    lastClone.classList.remove('is-active');
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    firstClone.inert = true;
    lastClone.inert = true;
    track.prepend(lastClone);
    track.append(firstClone);

    const trackSlides = Array.from(track.querySelectorAll('[data-teaser-slide]'));

    function positionTrack(animate) {
        const slide = trackSlides[trackIndex];
        if (!slide) return;

        track.style.transition = animate ? '' : 'none';
        const offset = viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
        track.style.transform = `translateX(${offset}px)`;
    }

    function updatePlayback() {
        trackSlides.forEach(function(slide, index) {
            const isCurrent = index === trackIndex;
            const isNearby = Math.abs(index - trackIndex) <= 1;
            const video = slide.querySelector('video');

            slide.classList.toggle('is-active', isCurrent);

            if (isNearby) {
                video.play().catch(function() {});
            } else {
                video.pause();
            }
        });
    }

    function showSlide(nextIndex, nextTrackIndex) {
        if (isAnimating) return;

        const resolvedIndex = (nextIndex + slides.length) % slides.length;
        const resolvedTrackIndex = nextTrackIndex === undefined ? resolvedIndex + 1 : nextTrackIndex;
        if (resolvedIndex === activeIndex && resolvedTrackIndex === trackIndex) return;

        activeIndex = resolvedIndex;
        trackIndex = resolvedTrackIndex;
        positionTrack(!prefersReducedMotion);
        isAnimating = !prefersReducedMotion;

        slides.forEach(function(slide, index) {
            const isActive = index === activeIndex;

            slide.setAttribute('aria-hidden', String(!isActive));
            slide.inert = !isActive;
        });

        updatePlayback();

        tabs.forEach(function(tab, index) {
            const isActive = index === activeIndex;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
        });

        if (prefersReducedMotion) {
            if (trackIndex === 0) trackIndex = slides.length;
            if (trackIndex === slides.length + 1) trackIndex = 1;
            positionTrack(false);
            updatePlayback();
        }
    }

    tabs.forEach(function(tab, index) {
        tab.addEventListener('click', function() {
            showSlide(index, index + 1);
        });

        tab.addEventListener('keydown', function(event) {
            let nextIndex = null;

            if (event.key === 'ArrowLeft') nextIndex = activeIndex - 1;
            if (event.key === 'ArrowRight') nextIndex = activeIndex + 1;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = slides.length - 1;
            if (nextIndex === null) return;

            event.preventDefault();
            showSlide(nextIndex);
            tabs[activeIndex].focus();
        });
    });

    previousButton.addEventListener('click', function() {
        showSlide(activeIndex - 1, trackIndex - 1);
    });

    nextButton.addEventListener('click', function() {
        showSlide(activeIndex + 1, trackIndex + 1);
    });

    viewport.addEventListener('touchstart', function(event) {
        swipeStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', function(event) {
        if (swipeStartX === null) return;

        const distance = event.changedTouches[0].clientX - swipeStartX;
        swipeStartX = null;

        if (Math.abs(distance) < 50) return;
        const direction = distance < 0 ? 1 : -1;
        showSlide(activeIndex + direction, trackIndex + direction);
    }, { passive: true });

    track.addEventListener('transitionend', function(event) {
        if (event.propertyName !== 'transform') return;

        if (trackIndex === 0) trackIndex = slides.length;
        if (trackIndex === slides.length + 1) trackIndex = 1;
        positionTrack(false);
        updatePlayback();
        isAnimating = false;
    });

    window.addEventListener('resize', function() {
        positionTrack(false);
    });

    positionTrack(false);
    updatePlayback();
}

document.addEventListener('DOMContentLoaded', setupTeaserCarousel);
