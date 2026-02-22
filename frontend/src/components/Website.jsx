// src/components/Website.jsx
import { useEffect } from 'react';


// src/components/Website.jsx
function Website() {
  // Smooth scroll + auto-close mobile menu
  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    // Auto-close mobile menu
    const collapse = document.querySelector('.navbar-collapse.show');
    if (collapse) {
      collapse.classList.remove('show');
    }
  };

  // Hardcoded years for now (later from backend)
  const reportsYears = [2026, 2025, 2024, 2023, 2022];

  return (
    <>
      {/* Fixed Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top">
        <div className="container-fluid px-3 px-md-5">
          <a className="navbar-brand fw-bold fs-3" href="#">
            Bokamoso
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="nav-link btn btn-link text-white" onClick={() => scrollTo('home')}>
                  Home
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link text-white" onClick={() => scrollTo('about')}>
                  About
                </button>
              </li>
              <li className="nav-item dropdown">
                <button
                  className="nav-link btn btn-link text-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Reports
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {reportsYears.map((year) => (
                    <li key={year}>
                      <button className="dropdown-item" onClick={() => scrollTo('reports')}>
                        {year} Report
                      </button>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-primary fw-bold" onClick={() => scrollTo('reports')}>
                      View All Reports
                    </button>
                  </li>
                </ul>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link text-white" onClick={() => scrollTo('contact')}>
                  Contact
                </button>
              </li>
              <li className="nav-item ms-3">
                <a className="nav-link btn btn-outline-light px-4" href="/login">
                  Login
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main scrolling content */}
      <main style={{ paddingTop: '80px' }}>
        {/* Home Hero */}
        <section id="home" className="bg-primary text-white py-5 py-md-5 text-center">
          <div className="container py-5">
            <h1 className="display-3 fw-bold mb-4">Bokamoso Educational Trust</h1>
            <p className="lead fs-4 mb-5">
              Empowering learners, supporting educators, transforming communities.
            </p>
            <div className="d-flex justify-content-center gap-4 flex-wrap">
              <a href="/learner" className="btn btn-light btn-lg px-5 py-3 fw-bold">
                Learner Portal
              </a>
              <a href="/staff" className="btn btn-outline-light btn-lg px-5 py-3 fw-bold">
                Staff Portal
              </a>
              <a href="/admin" className="btn btn-outline-light btn-lg px-5 py-3 fw-bold">
                Admin Portal
              </a>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-5 bg-light">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6 mb-5 mb-lg-0">
                <h2 className="display-5 fw-bold mb-4">Who We Are</h2>
                <p className="lead text-muted mb-4">
                  Bokamoso is a non-profit organisation committed to quality education in underserved areas.
                </p>
                <p>
                  Through passionate staff, innovative programs, and community support, we create opportunities for every learner.
                </p>
                <a href="#" className="btn btn-primary btn-lg mt-3">
                  Our Mission
                </a>
              </div>
              <div className="col-lg-6">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1470&q=80"
                  alt="Students in classroom"
                  className="img-fluid rounded shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Reports */}
        <section id="reports" className="py-5">
          <div className="container">
            <h2 className="display-5 fw-bold text-center mb-5">Annual & Term Reports</h2>
            <div className="row g-4 justify-content-center">
              {reportsYears.length > 0 ? (
                reportsYears.map((year) => (
                  <div key={year} className="col-md-4 col-lg-3">
                    <div className="card h-100 shadow border-0">
                      <div className="card-body text-center py-5">
                        <i className="bi bi-file-earmark-text display-1 text-primary mb-4"></i>
                        <h5 className="card-title fs-3">{year}</h5>
                        <p className="card-text text-muted">
                          Full report including term summaries and key achievements.
                        </p>
                        <a href="#" className="btn btn-outline-primary mt-3">
                          View {year} Report
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted py-5">No reports available yet.</p>
              )}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-5 bg-light">
          <div className="container">
            <h2 className="display-5 fw-bold text-center mb-5">Get In Touch</h2>
            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6">
                <div className="card shadow border-0">
                  <div className="card-body p-5">
                    <form>
                      <div className="mb-4">
                        <label htmlFor="name" className="form-label fw-bold">Full Name</label>
                        <input type="text" className="form-control form-control-lg" id="name" placeholder="Your name" required />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="email" className="form-label fw-bold">Email Address</label>
                        <input type="email" className="form-control form-control-lg" id="email" placeholder="name@example.com" required />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="message" className="form-label fw-bold">Your Message</label>
                        <textarea className="form-control form-control-lg" id="message" rows="5" placeholder="How can we assist you?" required></textarea>
                      </div>
                      <button type="submit" className="btn btn-primary btn-lg w-100">
                        Send Message
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 text-center">
        <div className="container">
          <p className="mb-2">
            © {new Date().getFullYear()} Bokamoso Educational Trust • Dedicated to Nkateko
          </p>
          <p className="mb-0 small">
            Johannesburg, South Africa • bokamosoedutrust@gmail.com
          </p>
        </div>
      </footer>
    </>
  );
}

export default Website;