document.addEventListener('DOMContentLoaded', () => {
    // Preloader fade-out
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            // Add small delay for effect
            setTimeout(() => {
                preloader.classList.add('fade-out');
                // Add loaded class to body and remove preloader from DOM after animation completes
                setTimeout(() => {
                    document.body.classList.add('loaded');
                    preloader.remove();
                }, 800); // Match CSS transition duration
            }, 2000); // 2s delay before fade starts
        }
    });

    // Initialize AOS
    AOS.init({
        once: false, // Whether animation should happen only once - while scrolling down
        offset: 100, // Offset (in px) from the original trigger point
        duration: 800, // Duration of animation
        easing: 'ease-out-cubic', // Easing function
    });

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth Scroll for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }

            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Project Modal Logic
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalGallery = document.getElementById('modal-gallery');
    const closeModal = document.querySelector('.close-modal');
    const projectCards = document.querySelectorAll('.project-card, .gallery-trigger');

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            // Get Project Data
            const title = card.querySelector('h4').textContent;
            const imagesJson = card.getAttribute('data-images');

            // Set Title
            modalTitle.textContent = title;

            // Clear previous images
            modalGallery.innerHTML = '';

            // Populate Images
            if (imagesJson) {
                try {
                    const images = JSON.parse(imagesJson);
                    images.forEach(imgSrc => {
                        const img = document.createElement('img');
                        img.src = imgSrc;
                        img.alt = title;
                        modalGallery.appendChild(img);
                    });
                } catch (e) {
                    console.error("Error parsing image JSON", e);
                }
            } else {
                // Fallback if no specific images set (use the card's main image)
                const mainImgSrc = card.querySelector('img').src;
                const img = document.createElement('img');
                img.src = mainImgSrc;
                modalGallery.appendChild(img);
            }

            // Show Modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Disable scroll
        });
    });

    // Close Modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Enable scroll
        });
    }

    // Close on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

});
