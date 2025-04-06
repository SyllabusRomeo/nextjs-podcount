import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const AdminMenu = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  const menuItems = [
    {
      title: 'User Management',
      items: [
        { name: 'All Users', href: '/admin/users' },
        { name: 'Create User', href: '/admin/users/create' },
        { name: 'Role Management', href: '/admin/roles' },
        { name: 'Access Logs', href: '/admin/logs/access' },
      ]
    },
    {
      title: 'Form Management',
      items: [
        { name: 'All Forms', href: '/admin/forms' },
        { name: 'Create Form', href: '/admin/forms/create' },
        { name: 'Form Templates', href: '/admin/forms/templates' },
        { name: 'Form Archives', href: '/admin/forms/archives' },
      ]
    },
    {
      title: 'Factory Management',
      items: [
        { name: 'All Factories', href: '/admin/factories' },
        { name: 'Create Factory', href: '/admin/factories/create' },
        { name: 'Factory Reports', href: '/admin/factories/reports' },
        { name: 'Assign Supervisors', href: '/admin/factories/supervisors' },
      ]
    },
    {
      title: 'Data Management',
      items: [
        { name: 'All Data', href: '/admin/data' },
        { name: 'Export Data', href: '/admin/data/export' },
        { name: 'Data Backup', href: '/admin/data/backup' },
        { name: 'Data Archives', href: '/admin/data/archives' },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', href: '/admin/settings' },
        { name: 'Security', href: '/admin/security' },
        { name: 'API Keys', href: '/admin/api-keys' },
        { name: 'System Logs', href: '/admin/logs/system' },
      ]
    },
    {
      title: 'Reports',
      items: [
        { name: 'System Analytics', href: '/admin/reports/analytics' },
        { name: 'User Activity', href: '/admin/reports/activity' },
        { name: 'Form Statistics', href: '/admin/reports/forms' },
        { name: 'Custom Reports', href: '/admin/reports/custom' },
      ]
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-koa-orange hover:bg-orange-600 rounded-md focus:outline-none"
      >
        <span>Admin Menu</span>
        <svg
          className={`ml-2 h-5 w-5 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-screen max-w-screen-xl bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="grid grid-cols-3 gap-8 p-8">
            {menuItems.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-2 rounded-md text-sm ${
                          router.pathname === item.href
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-8 py-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Logged in as {session.user.name}
                </span>
                <span className="text-sm text-gray-500">|</span>
                <Link
                  href="/admin/documentation"
                  className="text-sm text-orange-600 hover:text-orange-500"
                >
                  View Documentation
                </Link>
              </div>
              <Link
                href="/admin/support"
                className="text-sm text-orange-600 hover:text-orange-500"
              >
                Get Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu; 