import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-[#3d4152] text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">SPARKUR</h3>
            <p className="text-[#93959f] mb-4">
              India's favorite food delivery platform
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-[#93959f] hover:text-white transition-colors"
              >
                <i className="bi bi-facebook text-xl"></i>
              </a>
              <a
                href="#"
                className="text-[#93959f] hover:text-white transition-colors"
              >
                <i className="bi bi-twitter text-xl"></i>
              </a>
              <a
                href="#"
                className="text-[#93959f] hover:text-white transition-colors"
              >
                <i className="bi bi-instagram text-xl"></i>
              </a>
              <a
                href="#"
                className="text-[#93959f] hover:text-white transition-colors"
              >
                <i className="bi bi-linkedin text-xl"></i>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Team
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Partner With Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Partner with us
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Ride with us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[#93959f] hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 my-6" />

        <div className="text-center text-[#93959f]">
          <p>
            &copy; {new Date().getFullYear()} SPARKUR Technologies Pvt. Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
