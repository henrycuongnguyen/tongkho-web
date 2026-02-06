import { useState } from 'react';
import type { NavItem } from '@/types/menu';

interface Props {
  navItems: NavItem[];
}

export default function HeaderMobileMenu({ navItems }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle('overflow-hidden', !isOpen);
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <>
      {/* Toggle Button - handled by parent */}
      <div id="mobile-menu-trigger" className="hidden" onClick={toggleMenu} />

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 top-16 bg-white z-40 lg:hidden transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="h-full overflow-y-auto pb-20">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <div key={item.label} className="border-b border-secondary-100 last:border-0">
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className="flex items-center justify-between w-full py-3 text-secondary-700 font-medium"
                    >
                      {item.label}
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          expandedItems.includes(item.label) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedItems.includes(item.label) && (
                      <div className="pl-4 pb-2 space-y-1">
                        {item.children.map((child) => (
                          <a
                            key={child.href}
                            href={child.href}
                            className="block py-2 text-secondary-600 hover:text-primary-500"
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={item.href}
                    className="block py-3 text-secondary-700 font-medium hover:text-primary-500"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="p-4 space-y-3 border-t border-secondary-100">
            <a
              href="/dang-nhap"
              className="block w-full py-3 text-center text-secondary-700 font-medium border border-secondary-200 rounded-full hover:border-primary-500 hover:text-primary-500"
            >
              Đăng nhập
            </a>
            <a
              href="/dang-ky"
              className="block w-full py-3 text-center text-secondary-700 font-medium border border-secondary-200 rounded-full hover:border-primary-500 hover:text-primary-500"
            >
              Đăng ký
            </a>
            <a
              href="/dang-tin"
              className="block w-full py-3 text-center text-white font-medium bg-primary-500 rounded-full hover:bg-primary-600"
            >
              Đăng tin
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
