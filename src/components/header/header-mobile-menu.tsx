import { useState } from 'react';
import type { NavItem } from '@/types/menu';

interface Props {
  navItems: NavItem[];
}

interface MenuItemProps {
  item: NavItem;
  path: string;
  depth: number;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
}

const MAX_DEPTH = 10; // Safeguard against infinite recursion

function MenuItem({ item, path, depth, expandedPaths, toggleExpanded }: MenuItemProps) {
  const isExpanded = expandedPaths.has(path);
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = `${(depth + 1) * 1}rem`; // pl-4 → pl-8 → pl-12 (4px = 1rem in Tailwind)

  if (depth >= MAX_DEPTH) {
    return null; // Prevent infinite recursion
  }

  if (!hasChildren) {
    return (
      <a
        href={item.href}
        data-astro-reload={item.href === '/maps' ? 'true' : undefined}
        className="block py-2 text-secondary-600 hover:text-primary-500 transition-colors"
        style={{ paddingLeft }}
      >
        {item.label}
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => toggleExpanded(path)}
        className="flex items-center justify-between w-full py-2 text-secondary-600 hover:text-primary-500 transition-colors"
        style={{ paddingLeft }}
        aria-expanded={isExpanded}
        aria-haspopup="true"
      >
        <span>{item.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{
          maxHeight: isExpanded ? `${(item.children?.length || 0) * 48}px` : '0',
        }}
      >
        {item.children?.map((child) => (
          <MenuItem
            key={child.href}
            item={child}
            path={`${path}.${child.label}`}
            depth={depth + 1}
            expandedPaths={expandedPaths}
            toggleExpanded={toggleExpanded}
          />
        ))}
      </div>
    </>
  );
}

export default function HeaderMobileMenu({ navItems }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle('overflow-hidden', !isOpen);
  };

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
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
              <div key={item.label} className="border-b border-secondary-100 last:border-0 py-1">
                {item.children && item.children.length > 0 ? (
                  <MenuItem
                    item={item}
                    path={item.label}
                    depth={0}
                    expandedPaths={expandedPaths}
                    toggleExpanded={toggleExpanded}
                  />
                ) : (
                  <a
                    href={item.href}
                    data-astro-reload={item.href === '/maps' ? 'true' : undefined}
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
