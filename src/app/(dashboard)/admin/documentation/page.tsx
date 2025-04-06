'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DocumentationPage() {
  const { data: session, status } = useSession();
  const [content, setContent] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toc, setToc] = useState<{ id: string; title: string; level: number }[]>([]);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        const response = await fetch('/docs/DOCUMENTATION.md');
        const text = await response.text();
        
        // Convert markdown to HTML using regex
        let html = text;
        
        // Process code blocks first
        html = html.replace(/```([^`]+)```/g, (_, code) => 
          `<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto"><code>${code.trim()}</code></pre>`
        );
        
        // Process inline code
        html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
        
        // Process headers and generate TOC
        const headings: { id: string; title: string; level: number }[] = [];
        html = html.replace(/^(#{1,3}) (.+)$/gm, (match, hashes, title) => {
          const level = hashes.length;
          const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          headings.push({ id, title, level });
          const size = level === 1 ? '4xl' : level === 2 ? '3xl' : '2xl';
          const margin = level === 1 ? '8' : level === 2 ? '6' : '5';
          return `<h${level} id="${id}" class="text-${size} font-bold mb-${margin} mt-${margin}">${title}</h${level}>`;
        });
        
        // Process lists
        html = html.replace(/^[*-] (.+)$/gm, '<li class="ml-4">$1</li>');
        html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="list-disc mb-4">$1</ul>');
        
        // Process paragraphs
        html = html.replace(/^(?!<[uh]|<pre|<li)(.+)$/gm, '<p class="mb-4">$1</p>');
        
        // Process links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-orange-600 hover:text-orange-800">$1</a>');
        
        // Process emphasis
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        setToc(headings);
        setContent(html);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching documentation:', error);
        setIsLoading(false);
      }
    };

    fetchDocumentation();
  }, []);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-koa-orange"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Side Navigation */}
          <div className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-8 space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contents</h2>
                <ul className="space-y-2">
                  {toc.map(({ id, title, level }) => (
                    <li key={id} style={{ marginLeft: `${(level - 1) * 1}rem` }}>
                      <a
                        href={`#${id}`}
                        className={`block px-3 py-2 text-sm rounded-md ${
                          activeSection === id
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveSection(id)}
                      >
                        {title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow">
              <div className="prose prose-orange max-w-none p-8">
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 