/* ===================================================================
 * Waldo 1.0.0 - Main JS
 *
 *
 * ------------------------------------------------------------------- */

(function(html) {

    'use strict';

    
   /* preloader
    * -------------------------------------------------- */
    const ssPreloader = function() {

        const siteBody = document.querySelector('body');
        const pageWrap = document.querySelector('#page');
        const preloader = document.querySelector('#preloader');

        if (!preloader) return;

        html.classList.add('ss-preload');
        
        window.addEventListener('load', function() {
            
            html.classList.remove('ss-preload');
            html.classList.add('ss-loaded');
            
            preloader.addEventListener('transitionend', function afterTransition(e) {
                if (e.target.matches('#preloader'))  {
                    if (pageWrap.classList.contains("is-home")) {
                        siteBody.classList.add("animate-fold");
                    }
                    e.target.style.display = "none";
                    preloader.removeEventListener(e.type, afterTransition);
                }
            });
        });

    }; // end ssPreloader


   /* slide-in nav
    * -------------------------------------------------- */
    const ssSlideInNav = function() {

        const hdr = document.querySelector('.s-header');
        const hero = document.querySelector('#intro');

        if (!(hdr && hero)) return;

        let scrollThreshold = hero.offsetHeight;
        let lastScrollTop = 0;

        // Update scrollThreshold on window resize
        window.addEventListener('resize', function() {
            scrollThreshold = hero.offsetHeight;
        });        

        window.addEventListener('scroll', function() {    

            // skip sticky nav logic if modal is open
            const modal = document.querySelector('#portfolio-modal');
            const isVisible = modal && modal.getBoundingClientRect().height > 0;

            if (isVisible) return;

            // Get current scroll position
            let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

            if (currentScroll > scrollThreshold) {

                if (currentScroll > lastScrollTop) {
                    // Scrolling down
                    hdr.classList.add('is-hidden');
                    hdr.classList.remove('is-visible');
                } else {
                    // Scrolling up
                    hdr.classList.remove('is-hidden');
                    hdr.classList.add('is-visible');
                }
            } else {
                // Above threshold, ensure navbar is visible and transparent
                hdr.classList.remove('is-hidden');
                hdr.classList.remove('is-visible'); 
            }

            // Update last scroll position
            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        });


    }; // end ssSlideInNav


   /* mobile menu
    * ---------------------------------------------------- */ 
    const ssMobileMenu = function() {

        const toggleButton = document.querySelector('.header-menu-toggle');
        const mainNavWrap = document.querySelector('.header-nav');
        const siteBody = document.querySelector('body');

        if (!(toggleButton && mainNavWrap)) return;

        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleButton.classList.toggle('is-clicked');
            siteBody.classList.toggle('menu-is-open');
        });

        mainNavWrap.querySelectorAll('.header-nav a').forEach(function(link) {

            link.addEventListener("click", function(event) {

                // at 900px and below
                if (window.matchMedia('(max-width: 900px)').matches) {
                    toggleButton.classList.toggle('is-clicked');
                    siteBody.classList.toggle('menu-is-open');
                }
            });
        });

        window.addEventListener('resize', function() {

            // above 900px
            if (window.matchMedia('(min-width: 901px)').matches) {
                if (siteBody.classList.contains('menu-is-open')) siteBody.classList.remove('menu-is-open');
                if (toggleButton.classList.contains('is-clicked')) toggleButton.classList.remove('is-clicked');
            }
        });

    }; // end ssMobileMenu

     
   /* highlight active menu link on pagescroll
    * ------------------------------------------------------ */
    const ssScrollSpy = function() {

        const sections = document.querySelectorAll('.target-section');
        if (!sections) return;

        // Add an event listener listening for scroll
        window.addEventListener('scroll', navHighlight);

        function navHighlight() {
        
            // Get current scroll position
            let scrollY = window.pageYOffset;
        
            // Loop through sections to get height(including padding and border), 
            // top and ID values for each
            sections.forEach(function(current) {
                const sectionHeight = current.offsetHeight;
                const sectionTop = current.offsetTop - 50;
                const sectionId = current.getAttribute('id');
            
               /* If our current scroll position enters the space where current section 
                * on screen is, add .current class to parent element(li) of the thecorresponding 
                * navigation link, else remove it. To know which link is active, we use 
                * sectionId variable we are getting while looping through sections as 
                * an selector
                */
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    document.querySelector('.header-nav a[href*=' + sectionId + ']').parentNode.classList.add('current');
                } else {
                    document.querySelector('.header-nav a[href*=' + sectionId + ']').parentNode.classList.remove('current');
                }
            });
        }

    }; // end ssScrollSpy


   /* alert boxes
    * ------------------------------------------------------ */
    const ssAlertBoxes = function() {

        const boxes = document.querySelectorAll('.alert-box');
  
        boxes.forEach(function(box){

            box.addEventListener('click', function(e) {
                if (e.target.matches('.alert-box__close')) {
                    e.stopPropagation();
                    e.target.parentElement.classList.add('hideit');

                    setTimeout(function() {
                        box.style.display = 'none';
                    }, 500)
                }
            });
        })

    }; // end ssAlertBoxes


   /* smoothscroll
    * ---------------------------------------------------- */ 
    const ssSmoothScroll = function() {
        
        // Easing functions for smooth scroll animation
        const easeFunctions = {
            easeInQuad: function(t, b, c, d) {
                t /= d;
                return c * t * t + b;
            },
            easeOutQuad: function(t, b, c, d) {
                t /= d;
                return -c * t * (t - 2) + b;
            },
            easeInOutQuad: function(t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t + b;
                t--;
                return -c/2 * (t*(t-2) - 1) + b;
            },
            easeInOutCubic: function(t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t*t + b;
                t -= 2;
                return c/2*(t*t*t + 2) + b;
            },
            easeSmoothInOut: function(t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t*t*t*t + b;
                t -= 2;
                return c/2*(t*t*t*t*t + 2) + b;
            }
        };

        // Scroll configuration options
        const config = {            
            // onStart: function() { console.log('Scroll started'); },
            // onComplete: function() { console.log('Scroll completed'); },
            tolerance: 0,
            duration: 1800,
            easing: 'easeSmoothInOut',
            container: window
        };

        // Track animation state
        let animationFrameId = null;
        let isScrolling = false;

        // Smooth scroll to target element
        function smoothScrollTo(target, options) {

            // Cancel ongoing animation if active
            if (isScrolling && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            isScrolling = true;

            // Destructure options and set initial values
            const { duration, easing, tolerance, container, onStart, onComplete } = options;
            const startY = container === window ? window.pageYOffset : container.scrollTop;
            const startTime = performance.now();

            // Trigger start callback
            if (typeof onStart === 'function') onStart();

            // Animation loop
            function animateScroll(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Calculate target position
                const targetRect = target.getBoundingClientRect();
                const targetY = (container === window ? targetRect.top + window.pageYOffset : targetRect.top) - tolerance;
                const change = targetY - startY;

                // Apply easing to scroll position
                const easedProgress = easeFunctions[easing](progress, startY, change, 1);

                // Update scroll position
                if (container === window) {
                    window.scrollTo(0, easedProgress);
                } else {
                    container.scrollTop = easedProgress;
                }

                // Continue or complete animation
                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animateScroll);
                } else {
                    isScrolling = false;
                    animationFrameId = null;

                    // Ensure target is focusable
                    if (target && target.focus && !target.hasAttribute('tabindex')) {
                        target.setAttribute('tabindex', '-1');
                    }
                    if (target && target.focus) {
                        target.focus({ preventScroll: true });
                    }

                    // Trigger complete callback
                    if (typeof onComplete === 'function') onComplete();
                }
            }

            // Start animation
            animationFrameId = requestAnimationFrame(animateScroll);
        }
        

        // Find smooth scroll triggers
        const triggers = document.querySelectorAll('.smoothscroll');        

        // Add click event listeners to triggers
        triggers.forEach(function(trigger) {

            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                const href = trigger.getAttribute('href');
                const target = href === '#' ? { getBoundingClientRect: function() { return { top: 0 }; } } : document.querySelector(href);

                // Scroll to target or warn if not found
                if (target) {
                    smoothScrollTo(target, config);
                } else {
                    console.warn(`Target "${href}" not found`);
                }
            });

        });

    }; // end ssSmoothScroll
 

   /* portfolio modal
    * ---------------------------------------------------- */ 
    const ssPortfolioModal = function () {

        const folioModal = document.querySelector('#portfolio-modal');
        if (!folioModal) return;

        //
        // 1. Select all modal related elements
        //
        const modalEls = {
            portfolioItems: document.querySelectorAll('.portfolio-item'),
            wrapper: document.getElementById('portfolio-modal'),
            closeBtn: document.querySelector('.modal__close-btn'),
            imageContainer: document.getElementById('modal-image-container'),
            title: document.getElementById('modal-title'),
            description: document.getElementById('modal-description-text'),
            client: document.getElementById('modal-client'),
            services: document.getElementById('modal-services'),
            date: document.getElementById('modal-date'),
            linkContainer: document.getElementById('modal-link-container'),
            link: document.getElementById('modal-link')
        };

        //
        // 2. Trap focus inside modal (Accessibility)
        //
        function trapFocus(event) {
            const focusableEls = modalEls.wrapper.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
            const first = focusableEls[0];
            const last = focusableEls[focusableEls.length - 1];

            if (event.key === 'Tab') {
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }

        //
        // 3. Open modal and populate with data
        //        
        function openModalWithData(item) {
            const details = item.querySelector('.portfolio-item__details');
            const data = {
                title: item.dataset.title || '',
                images: item.dataset.images ? item.dataset.images.split(',').map(function (i) { return i.trim(); }) : [],
                client: item.dataset.client || '',
                date: item.dataset.date || '',
                link: item.dataset.link || '',
                descriptionElement: details ? details.querySelector('.portfolio-item__description') : null,
                servicesElement: details ? details.querySelector('.portfolio-item__services') : null
            };

            if (!data.title || !data.images.length || !data.descriptionElement || !data.servicesElement) {
                console.error('Missing modal content data');
                return;
            }

            modalEls.title.textContent = data.title;
            modalEls.client.textContent = data.client;
            modalEls.date.textContent = data.date;

            const descriptionHTML = Array.from(data.descriptionElement.querySelectorAll('p'))
                .map(function (p) {
                    return '<p>' + p.textContent + '</p>';
                })
                .join('');
            modalEls.description.innerHTML = descriptionHTML;

            const servicesHTML = Array.from(data.servicesElement.querySelectorAll('li'))
                .map(function (li) {
                    return '<li>' + li.textContent + '</li>';
                })
                .join('');
            modalEls.services.innerHTML = servicesHTML;

            if (data.link && data.link !== '#' && data.link.trim() !== '') {
                modalEls.linkContainer.style.display = 'block';
                modalEls.link.href = data.link;
            } else {
                modalEls.linkContainer.style.display = 'none';
            }

            // Clear and load new images
            modalEls.imageContainer.innerHTML = '';
            data.images.forEach(function (src, index) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('image-wrapper');

                const loader = document.createElement('div');
                loader.classList.add('loader');

                const loaderLabel = document.createElement('span');
                loaderLabel.classList.add('u-sr-hidden');
                loaderLabel.textContent = 'Loading image';

                wrapper.appendChild(loader);
                wrapper.appendChild(loaderLabel);
                modalEls.imageContainer.appendChild(wrapper);

                const img = new Image();
                img.src = src;
                img.alt = data.title + ' Image ' + (index + 1);

                img.onload = function () {
                    const loadedImg = document.createElement('img');
                    loadedImg.src = src;
                    loadedImg.alt = img.alt;
                    loadedImg.classList.add('loaded');

                    wrapper.appendChild(loadedImg);
                    wrapper.removeChild(loader);
                    wrapper.removeChild(loaderLabel);
                };

                img.onerror = function () {
                    const fallbackImg = document.createElement('img');
                    fallbackImg.src = 'https://via.placeholder.com/1200/1200?text=Image+Not+Found';
                    fallbackImg.alt = data.title + ' Fallback Image ' + (index + 1);
                    fallbackImg.classList.add('loaded');

                    wrapper.appendChild(fallbackImg);
                    wrapper.removeChild(loader);
                    wrapper.removeChild(loaderLabel);
                };
            });

            modalEls.wrapper.style.display = 'block';
            modalEls.wrapper.setAttribute('aria-hidden', 'false');

            setTimeout(function () {
                modalEls.wrapper.classList.add('show');
            }, 10);

            document.body.style.overflow = 'hidden';
            modalEls.closeBtn.focus();

            document.addEventListener('keydown', trapFocus);
        }
        
        //
        // 4. Close modal      
        //  
        function closeModal() {
            modalEls.wrapper.classList.remove('show');

            setTimeout(function () {
                modalEls.wrapper.style.display = 'none';
                modalEls.wrapper.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = 'auto';
            }, 800);

            document.removeEventListener('keydown', trapFocus);
        }

        //
        // 5. Set up event listeners
        //
        modalEls.portfolioItems.forEach(function (item) {
            const link = item.querySelector('.portfolio-item__link');
            if (link) {
                link.addEventListener('click', function (event) {
                    event.preventDefault();
                    openModalWithData(item);
                });
            }
        });

        if (modalEls.closeBtn) {
            modalEls.closeBtn.addEventListener('click', closeModal);
        }

        modalEls.wrapper.addEventListener('click', function (e) {
            if (e.target === modalEls.wrapper) {
                closeModal();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modalEls.wrapper.style.display === 'block') {
                closeModal();
            }
        });

    };


   /* Initialize
    * ------------------------------------------------------ */
    (function ssInit() {

        ssPreloader();
        ssSlideInNav();
        ssMobileMenu();
        ssScrollSpy();
        ssAlertBoxes();
        ssSmoothScroll();
        ssPortfolioModal();

    })();

})(document.documentElement);