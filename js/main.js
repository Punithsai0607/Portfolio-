document.addEventListener('DOMContentLoaded', () => {
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- Scroll Reveals --- */
    const revealElements = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    revealElements.forEach(el => {
        // If reduced motion, show immediately
        if (prefersReducedMotion) {
            el.classList.add('active');
        } else {
            revealObserver.observe(el);
        }
    });

    /* --- 3D Tilt on Hover for Project Cards --- */
    if (!prefersReducedMotion) {
        const tiltCards = document.querySelectorAll('.tilt-card');

        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Calculate rotation (max 10 degrees)
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                card.style.transition = 'transform 0.5s ease';
            });
            
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'none';
            });
        });

        /* --- Hero Photo Parallax on Mousemove --- */
        const heroSection = document.getElementById('hero');
        const heroPhoto = document.querySelector('.hero-photo');

        if (heroSection && heroPhoto) {
            heroSection.addEventListener('mousemove', (e) => {
                const rect = heroSection.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width; // 0 to 1
                const y = (e.clientY - rect.top) / rect.height; // 0 to 1

                // Subtle shift — the photo is full screen so we just nudge it
                const moveX = (x - 0.5) * -20;
                const moveY = (y - 0.5) * -20;
                
                heroPhoto.style.transform = `scale(1.08) translate(${moveX}px, ${moveY}px)`;
            });

            heroSection.addEventListener('mouseleave', () => {
                heroPhoto.style.transition = 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
                heroPhoto.style.transform = 'scale(1.08) translate(0px, 0px)';
                
                setTimeout(() => {
                    heroPhoto.style.transition = 'transform 0.15s ease-out';
                }, 1000);
            });
            
            heroSection.addEventListener('mouseenter', () => {
                heroPhoto.style.transition = 'transform 0.15s ease-out';
            });

            // Start with a slight scale so parallax movement doesn't show edges
            heroPhoto.style.transform = 'scale(1.08)';
        }
    }
});
