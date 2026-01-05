class CustomHeader extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        header {
          background-color: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 1000;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
        }
        
        .logo {
          display: flex;
          align-items: center;
          font-weight: 700;
          font-size: 1.5rem;
          color: #0f766e;
        }
        
        .logo-icon {
          margin-right: 0.5rem;
          color: #14b8a6;
        }
        
        .nav-links {
          display: flex;
          list-style: none;
        }
        
        .nav-links li {
          margin-left: 2rem;
        }
        
        .nav-links a {
          font-weight: 500;
          color: #0f172a;
          transition: color 0.3s ease;
        }
        
        .nav-links a:hover {
          color: #14b8a6;
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #0f172a;
        }
        
        .contact-btn {
          background-color: #14b8a6;
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        
        .contact-btn:hover {
          background-color: #0f766e;
        }
        
        #mobile-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background-color: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1rem 0;
        }
        
        #mobile-menu ul {
          list-style: none;
          padding: 0 1rem;
        }
        
        #mobile-menu li {
          padding: 0.75rem 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        #mobile-menu li:last-child {
          border-bottom: none;
        }
        
        #mobile-menu a {
          display: block;
          color: #0f172a;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .contact-btn {
            display: none;
          }
          
          .mobile-menu-btn {
            display: block;
          }
        }
      </style>
      
      <header>
        <div class="container">
          <nav>
            <a href="/" class="logo">
              <span class="logo-icon">✈️</span>
              <span>Voyageurs de Beni Saf</span>
            </a>
            
            <ul class="nav-links">
              <li><a href="/">Accueil</a></li>
              <li><a href="#destinations">Destinations</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">À Propos</a></li>
              <li><a href="#contact" class="contact-btn">Contact</a></li>
            </ul>
            
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
              <i data-feather="menu"></i>
            </button>
          </nav>
        </div>
        
        <div id="mobile-menu" class="hidden">
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="#destinations">Destinations</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">À Propos</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </header>
    `;
    
    // Load Feather Icons if not already loaded
    if (typeof feather !== 'undefined') {
      setTimeout(() => {
        feather.replace();
      }, 0);
    }
  }
}

customElements.define('custom-header', CustomHeader);