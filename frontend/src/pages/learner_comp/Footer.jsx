// src/pages/learner_comp/Footer.jsx

const Footer = ({ sidebarIsClosed }) => {
  const year = new Date().getFullYear();

  const sidebarWidth = sidebarIsClosed ? 80 : 280;

  return (
    <footer
      className="bg-white dark:bg-dark shadow-top py-3 text-center fixed-bottom"
      style={{
        marginLeft: `${sidebarWidth}px`,
        width: `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin-left 0.3s ease, width 0.3s ease',
      }}
    >
      <div className="container-fluid px-3 px-md-5">
        <p className="text-muted mb-0">
          © {year} Zakes Matsimbe. All rights reserved. | 
          <a href="#" className="text-primary mx-2">Privacy Policy</a> | 
          <a href="#" className="text-primary">Terms of Service</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;