import React from 'react';
import './AboutUs.css';

function AboutUs() {
  return (
    <div className="about-page">
      {/* What is Franchiso Section */}
      <section className="about-section what-is-franchiso">
        <div className="about-content">
          <div className="about-logo-container">
            <img src="/image/logo.png" alt="Franchiso Logo" className="about-logo" />
          </div>
          <div className="about-text">
            <h1>What is <span className="highlight">Franchiso</span>?</h1>
            <p>
              <strong>Franchiso</strong> is a web-based marketplace platform designed to facilitate the buying and selling of franchise businesses in Indonesia by connecting franchisors and potential franchisees in a single digital ecosystem.
            </p>
            <p>
            The platform allows franchisors to publish detailed franchise information, including investment costs, return on investment, business documents, and outlet locations, while enabling franchisees to search and compare opportunities using advanced filters and location mapping features.
            </p>
            <p>
            By incorporating business verification, structured information, and secure transaction support, Franchiso aims to increase transparency, trust, and efficiency in the franchise trading process, making it easier for users to find, evaluate, and acquire franchise business opportunities.
            </p>
            <div className="about-features">
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Advanced Search With AI</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Accurate ROI Filter</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤝</span>
                <span>Built Connection Directly To Franchisor</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Verified Franchise</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our CEO Section */}
      <section className="about-section meet-ceo">
        <div className="about-content reverse">
          <div className="about-text">
            <h2>Meet Our <span className="highlight">CEO</span></h2>
            <h3> <span className="highlight">Christian Antonius Anggaresta</span></h3>
            <p>
            I'm software Engineer specializing in Go and Python, with hands-on experience building scalable microservices, search systems, and high-performance APIs. Experienced in leveraging AI code assistants to improve development efficiency, code quality, and problem-solving.
            </p>
            <blockquote className="ceo-quote">
              "Don't just write a code, but provide a solution."
            </blockquote>
          </div>
          <div className="ceo-image-container">
            <img src="/image/meet_our_ceo.jpg" alt="CEO Franchiso" className="ceo-image" />
          </div>
        </div>
      </section>

      <footer className="footer">© 2025 Franchiso. All rights reserved.</footer>
    </div>
  );
}

export default AboutUs;