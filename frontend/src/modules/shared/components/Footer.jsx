import { useNavigate } from 'react-router-dom';
import siteLogo from '../../../assets/scraptox-removebg-preview.png';

const Footer = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: 'Company',
            links: [
                { label: 'About Us', path: '/about-us' },
                { label: 'Contact Us', path: '/contact-us' },
            ]
        },
        {
            title: 'Policies',
            links: [
                { label: 'Privacy Policy', path: '/privacy-policy' },
                { label: 'Terms & Conditions', path: '/terms-conditions' },
                { label: 'Refund Policy', path: '/refund-policy' },
            ]
        }
    ];

    return (
        <footer className="bg-white border-t border-gray-100 pt-12 pb-24 md:pb-8 px-6 mt-auto">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <img src={siteLogo} alt="Scraptox" className="h-16 w-auto object-contain -ml-2" />
                        </div>
                        <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                            Organizing the unorganized scrap industry in India. 
                            Clean streets, fair prices, and a greener planet — one pickup at a time.
                        </p>
                    </div>

                    {/* Links Sections */}
                    {footerSections.map((section) => (
                        <div key={section.title} className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <button
                                            onClick={() => navigate(link.path)}
                                            className="text-gray-500 hover:text-emerald-600 transition-colors text-sm"
                                        >
                                            {link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-xs text-center md:text-left">
                        © {currentYear} Scraptox. All rights reserved. Made with ❤️ for a Greener India.
                    </p>
                    <div className="flex gap-6">
                        {/* Placeholder for social links if needed */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
