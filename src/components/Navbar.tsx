"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", visible: true },
    { 
      name: "Factory Locations", 
      href: "/factories", 
      visible: session.user.role === "ADMIN" 
    },
    { 
      name: "Users", 
      href: "/users", 
      visible: session.user.role ? ["ADMIN", "SUPERVISOR"].includes(session.user.role) : false
    },
    { 
      name: "Forms", 
      href: "/forms", 
      visible: session.user.role ? ["ADMIN", "SUPERVISOR", "FIELD_OFFICER"].includes(session.user.role) : false
    },
    { 
      name: "Tables", 
      href: "/tables", 
      visible: true 
    },
    { 
      name: "Documentation", 
      href: "/admin/documentation", 
      visible: session.user.role === "ADMIN" 
    },
    { 
      name: "Settings", 
      href: "/settings", 
      visible: session.user.role === "ADMIN" 
    },
  ];

  return (
    <nav className="bg-koa-orange">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white font-bold text-xl">Koa Pod Portal</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation
                  .filter(item => item.visible)
                  .map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        pathname.startsWith(item.href)
                          ? "bg-orange-700 text-white"
                          : "text-white hover:bg-orange-600"
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="text-white mr-4">
                    {session.user.name}{" "}
                    {session.user.factoryName && `(${session.user.factoryName})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="bg-orange-700 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-orange-800"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="bg-orange-700 inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-orange-600 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation
              .filter(item => item.visible)
              .map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    pathname.startsWith(item.href)
                      ? "bg-orange-700 text-white"
                      : "text-white hover:bg-orange-600"
                  } block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
          </div>
          <div className="pt-4 pb-3 border-t border-orange-700">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">
                  {session.user.name}
                </div>
                <div className="text-sm font-medium leading-none text-orange-200">
                  {session.user.email}
                </div>
                {session.user.factoryName && (
                  <div className="text-sm font-medium leading-none text-orange-200 mt-1">
                    {session.user.factoryName}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-orange-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 