import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaShoppingBasket,
  FaTruck,
  FaToolbox,
  FaArrowRight,
  FaSeedling,
} from "react-icons/fa";
import "./css/Landing.css";

const ROLES = [
  {
    icon: FaSeedling,
    title: "Farmers",
    copy: "Monitor crops and soil health, manage warehouse stock, and list produce on the marketplace.",
    tag: "01",
  },
  {
    icon: FaShoppingBasket,
    title: "Buyers",
    copy: "Browse available listings, manage your cart, place orders, and track shipments live.",
    tag: "02",
  },
  {
    icon: FaTruck,
    title: "Delivery Drivers",
    copy: "Accept assigned deliveries and update pickup, transit, and delivery status on the go.",
    tag: "03",
  },
  {
    icon: FaToolbox,
    title: "Logistics Admins",
    copy: "Assign incoming orders to drivers, monitor all shipments, and manage the driver fleet.",
    tag: "04",
  },
];

const Landing = () => {
  return (
    <div className="landingPage">
      <nav className="landingNav">
        <div className="brand">
          <FaLeaf className="brandIcon" />
          <span>AgriNexus</span>
        </div>
        <div className="navActions">
          <Link to="/login" className="navLink">
            Login
          </Link>
          <Link to="/register" className="navBtn">
            Get Started <FaArrowRight />
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="heroCopy">
          <span className="heroEyebrow">Farm-to-doorstep platform</span>
          <h1>
            One platform to run the <em>entire</em> harvest, from soil to sale.
          </h1>
          <p>
            AgriNexus connects farmers, buyers, and logistics teams on a single
            platform to manage crops, marketplace listings, orders, and
            deliveries in real time.
          </p>
          <div className="heroActions">
            <Link to="/register" className="ctaBtn">
              Create an Account <FaArrowRight />
            </Link>
            <Link to="/login" className="ctaBtnSecondary">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="heroPanel" aria-hidden="true">
          <div className="heroStat">
            <span className="heroStatValue">4</span>
            <span className="heroStatLabel">
              Connected roles, one workspace
            </span>
          </div>
          <div className="heroStat">
            <span className="heroStatValue">24/7</span>
            <span className="heroStatLabel">
              Live shipment &amp; sensor tracking
            </span>
          </div>
          <div className="heroStat">
            <span className="heroStatValue">1</span>
            <span className="heroStatLabel">
              Login for the whole supply chain
            </span>
          </div>
        </div>
      </header>

      <section className="rolesSection">
        <div className="rolesHeading">
          <h2>Built for every role in the supply chain</h2>
          <p>Each workspace is tuned to the job people actually do.</p>
        </div>
        <div className="rolesGrid">
          {ROLES.map(({ icon: Icon, title, copy, tag }) => (
            <div className="roleCard" key={title}>
              <span className="roleTag">{tag}</span>
              <Icon className="roleIcon" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landingFooter">
        <p>&copy; {new Date().getFullYear()} AgriNexus. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
