// Smooth scrolling for anchor links and active state handling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // allow default behavior for external links
        if (!href || href === '#') return;
        e.preventDefault();

        // close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }

        // Find target; if href is '#top' or target missing, scroll to top
        const target = document.querySelector(href);
        const offset = 80; // header height offset
        const topPos = target ? (target.offsetTop - offset) : 0;

        window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });

        // Update active link styling for desktop nav
        document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
        // if clicked link is inside .main-nav, mark it active
        const inMainNav = this.closest('.main-nav');
        if (inMainNav) {
            this.classList.add('active');
        }
    });
});

// Form submission
const contactForm = document.querySelector('form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const message = document.getElementById('message').value;
        
        // Simple validation
        if (name && email && message) {
            // In a real application, you would send this data to a server
            alert('Merci pour votre message! Nous vous contacterons bientôt.');
            contactForm.reset();
        } else {
            alert('Veuillez remplir tous les champs obligatoires.');
        }
    });
}

// Animation on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Observe elements for animation
    document.querySelectorAll('section > div > *').forEach(el => {
        observer.observe(el);
    });
    
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
});

// Mobile menu toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Attach mobile menu button after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.menu-toggle');
    if (btn) btn.addEventListener('click', toggleMobileMenu);
});

/* --- Chat bot (simple local/responsive) --- */
function appendMessage(text, who = 'bot') {
    const wrap = document.getElementById('chat-messages');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'chat-bubble ' + (who === 'user' ? 'user' : 'bot');
    el.textContent = text;
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
}

// Typing indicator (single, stable element)
function showTyping() {
    const wrap = document.getElementById('chat-messages');
    if (!wrap) return;
    if (wrap.querySelector('.chat-typing')) return; // already shown
    const el = document.createElement('div');
    el.className = 'chat-bubble bot chat-typing';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
}

function hideTyping() {
    const wrap = document.getElementById('chat-messages');
    if (!wrap) return;
    const t = wrap.querySelector('.chat-typing');
    if (t) t.remove();
}

function getBotReply(message) {
    const msg = message.toLowerCase();
    // Basic small-talk and fallback
    if (msg.includes('bonjour') || msg.includes('salut')) return 'Bonjour ! Je suis l\'assistant de Voyageurs de Beni Saf — je peux aider pour les réservations, donner les horaires, répondre aux FAQ et plus. Tapez "réserver" pour commencer.';
    if (msg.includes('merci') || msg.includes('thanks')) return 'Avec plaisir ! Si vous voulez faire une réservation, tapez "réserver".';
    // Fallback
    return 'Désolé, je n\'ai pas compris. Vous pouvez taper "aide" pour voir ce que je peux faire, ou "réserver" pour commencer une réservation.';
}

// --- Reservation + FAQ logic ---
const chatState = {
    mode: null, // 'reservation'
    step: 0,
    data: {}
};

const openingHoursText = 'Horaires : Lundi - Vendredi: 08:00 - 18:00; Samedi: 09:00 - 14:00; Dimanche: Fermé.';

const faqs = [
    {q: ['documents', 'passeport', 'visa'], a: 'Pour voyager, vous aurez généralement besoin d\'un passeport valide. Pour les visas, cela dépend de la destination — nous pouvons vérifier pour vous.'},
    {q: ['annulation', 'annuler'], a: 'Les conditions d\'annulation varient selon l\'offre. Dites-moi quelle réservation vous intéresse et je vous dirai la politique.'},
    {q: ['paiement', 'payer', 'carte'], a: 'Nous acceptons les paiements par carte bancaire et virement. Pour les acomptes, nous demandons généralement 30% à la réservation.'}
];

const reservationSteps = [
    {key: 'fullName', prompt: 'Très bien — commençons la réservation. Quel est votre nom complet ?'},
    {key: 'email', prompt: 'Votre adresse email ?'},
    {key: 'phone', prompt: 'Numéro de téléphone (ex: +213...) ?'},
    {key: 'destination', prompt: 'Quelle destination souhaitez-vous ?'},
    {key: 'startDate', prompt: 'Date de départ (YYYY-MM-DD) ?'},
    {key: 'endDate', prompt: 'Date de retour (YYYY-MM-DD) ?'},
    {key: 'passengers', prompt: 'Nombre de voyageurs ?'},
    {key: 'notes', prompt: 'Souhaitez-vous ajouter une demande particulière (repas, hébergement, etc.) ? (ou tapez "non")'}
];

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /[0-9+]{6,}/.test(phone);
}

function isValidDate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

function saveReservation(res) {
    try {
        const key = 'reservations_voyageurs';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push(Object.assign({ createdAt: new Date().toISOString() }, res));
        localStorage.setItem(key, JSON.stringify(list));
        return true;
    } catch (e) {
        console.error('saveReservation error', e);
        return false;
    }
}

function formatReservationSummary(res) {
    return `Réservation reçue:\nNom: ${res.fullName}\nEmail: ${res.email}\nTel: ${res.phone}\nDestination: ${res.destination}\nDu: ${res.startDate} Au: ${res.endDate}\nVoyageurs: ${res.passengers}\nDemandes: ${res.notes}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('chat-toggle');
    const windowEl = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    if (toggle && windowEl) {
        // prevent rapid double-clicks
        let lastToggle = 0;
        let docClickHandler = null;

        function removeDocClick() {
            if (docClickHandler) {
                document.removeEventListener('click', docClickHandler);
                docClickHandler = null;
            }
        }

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const now = Date.now();
            if (now - lastToggle < 250) return; // ignore very fast clicks
            lastToggle = now;

            if (windowEl.classList.contains('hidden')) {
                windowEl.classList.remove('hidden');
                // focus input when opened
                setTimeout(() => { if (!windowEl.classList.contains('hidden')) input && input.focus(); }, 100);

                // attach a one-time listener to close when clicking outside
                removeDocClick();
                docClickHandler = function(ev) {
                    const widget = document.getElementById('chat-widget');
                    if (!widget) return;
                    if (!widget.contains(ev.target)) {
                        windowEl.classList.add('hidden');
                        removeDocClick();
                    }
                };
                document.addEventListener('click', docClickHandler);
            } else {
                windowEl.classList.add('hidden');
                removeDocClick();
            }
        });

        // clicking inside the window shouldn't close it (stop propagation)
        windowEl.addEventListener('click', (ev) => ev.stopPropagation());
    }
    if (closeBtn && windowEl) {
        closeBtn.addEventListener('click', () => windowEl.classList.add('hidden'));
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = (input && input.value) ? input.value.trim() : '';
            if (!text) return;
            appendMessage(text, 'user');
            input.value = '';

            // handle reservation flow if active
            if (chatState.mode === 'reservation') {
                handleReservationAnswer(text);
                return;
            }

            // not in reservation mode: detect if user wants to start reservation locally
            const l = text.toLowerCase();
            if (l.includes('réserver') || l.includes('reservation') || l.includes('reserver') || l.includes('je veux réserver')) {
                chatState.mode = 'reservation';
                chatState.step = 0;
                chatState.data = {};
                appendMessage("D'accord, je vais vous aider à faire une réservation.");
                setTimeout(() => appendMessage(reservationSteps[0].prompt), 300);
                return;
            }

            // Otherwise call server API for replies (stable, server-side)
            showTyping();
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            }).then(r => r.json()).then(data => {
                hideTyping();
                if (data && data.reply) appendMessage(data.reply);
                else appendMessage('Désolé, aucune réponse du serveur.');
            }).catch(err => {
                hideTyping();
                console.error('chat api error', err);
                appendMessage('Erreur réseau : impossible de joindre le serveur de chat.');
            });
        });
    }
});

// Close chat when clicking outside the whole widget (robust handler)
document.addEventListener('click', (e) => {
    const widget = document.getElementById('chat-widget');
    const windowEl = document.getElementById('chat-window');
    if (!widget || !windowEl) return;
    // if click is outside widget and window is open => close
    if (!widget.contains(e.target) && !windowEl.classList.contains('hidden')) {
        windowEl.classList.add('hidden');
    }
});

function handleReservationAnswer(text) {
    const stepIndex = chatState.step;
    const step = reservationSteps[stepIndex];
    if (!step) {
        appendMessage('Erreur dans le processus de réservation.');
        chatState.mode = null;
        chatState.step = 0;
        chatState.data = {};
        return;
    }

    // basic validation per step
    const val = text.trim();
    if (step.key === 'email' && !validateEmail(val)) {
        appendMessage('Adresse email invalide. Veuillez saisir un email valide (ex: nom@exemple.com).');
        return;
    }
    if (step.key === 'phone' && !validatePhone(val)) {
        appendMessage('Numéro invalide. Veuillez saisir un numéro de téléphone (ex: +213...).');
        return;
    }
    if ((step.key === 'startDate' || step.key === 'endDate') && !isValidDate(val)) {
        appendMessage('Format de date invalide. Utilisez YYYY-MM-DD.');
        return;
    }
    if (step.key === 'passengers' && isNaN(parseInt(val))) {
        appendMessage('Veuillez indiquer un nombre valide de voyageurs.');
        return;
    }

    chatState.data[step.key] = val;
    chatState.step += 1;

    // if more steps
    if (chatState.step < reservationSteps.length) {
        const next = reservationSteps[chatState.step].prompt;
        setTimeout(() => appendMessage(next), 300);
        return;
    }

    // finished reservation
    const reservation = chatState.data;
    // default notes
    if (!reservation.notes || reservation.notes.toLowerCase() === 'non') reservation.notes = '';
    const saved = saveReservation(reservation);
    if (saved) {
        appendMessage('Votre réservation a été enregistrée localement. J\'envoie maintenant la réservation au serveur...');
        setTimeout(() => appendMessage(formatReservationSummary(reservation)), 300);
        // Send to server for storage/processing
        fetch('/api/reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservation)
        }).then(r => r.json()).then(res => {
            if (res && res.ok) {
                appendMessage('Réservation envoyée au serveur. ID: ' + (res.id || '—') + '. Un conseiller vous contactera bientôt pour confirmer et procéder au paiement.');
            } else {
                appendMessage('La réservation a été enregistrée localement, mais l\'envoi au serveur a échoué.');
            }
        }).catch(err => {
            console.error('reservation post error', err);
            appendMessage('Erreur lors de l\'envoi de la réservation au serveur. Vous pouvez réessayer plus tard.');
        });
    } else {
        appendMessage('Erreur lors de l\'enregistrement. Veuillez réessayer plus tard ou nous contacter directement.');
    }

    // reset state
    chatState.mode = null;
    chatState.step = 0;
    chatState.data = {};


}



/* Optional: to integrate an external AI (OpenAI/other) replace getBotReply with an async function that calls your API.
   For security, do NOT put API keys in client-side JS; instead use a server endpoint that proxies requests.
*/