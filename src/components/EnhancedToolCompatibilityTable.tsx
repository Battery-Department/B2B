import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface ToolRuntime {
  sixAh: number;
  nineAh: number;
  fifteenAh: number;
}

interface Tool {
  id: string;
  model: string;
  description: string;
  category: string;
  categoryId: string;
  runtime: ToolRuntime;
  powerConsumption: number;
  compatibility: string;
}

interface Category {
  id: string;
  name: string;
}

interface EnhancedToolCompatibilityTableProps {
  tools: Tool[];
  categories: Category[];
  isMobile: boolean;
  onSelectToolForRuntimeCalculator?: (toolId: string) => void;
  switchTab?: (tabId: string) => void;
}

const EnhancedToolCompatibilityTable: React.FC<EnhancedToolCompatibilityTableProps> = ({
  tools,
  categories,
  isMobile,
  onSelectToolForRuntimeCalculator,
  switchTab
}) => {
  // State for filters and sorting
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('model');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter tools based on category and search
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesCategory = activeCategory === 'all' || tool.categoryId === activeCategory;
      const matchesSearch = !searchQuery || 
        tool.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [tools, activeCategory, searchQuery]);
  
  // Sort tools based on current sort field and direction
  const sortedTools = useMemo(() => {
    return [...filteredTools].sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortField === 'runtime') {
        // Sort by 15Ah runtime for simplicity
        aValue = a.runtime.fifteenAh;
        bValue = b.runtime.fifteenAh;
      } else if (sortField === 'model') {
        aValue = a.model;
        bValue = b.model;
      } else if (sortField === 'compatibility') {
        aValue = a.compatibility;
        bValue = b.compatibility;
      } else if (sortField === 'category') {
        aValue = a.category;
        bValue = b.category;
      } else {
        aValue = a[sortField as keyof Tool];
        bValue = b[sortField as keyof Tool];
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [filteredTools, sortField, sortDirection]);
  
  // Pagination logic
  const totalPages = Math.ceil(sortedTools.length / itemsPerPage);
  const paginatedTools = sortedTools.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const paginationStart = sortedTools.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const paginationEnd = Math.min(currentPage * itemsPerPage, sortedTools.length);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);
  
  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get badge color based on category
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'drills': return 'bg-blue-100 text-blue-800';
      case 'saws': return 'bg-green-100 text-green-800';
      case 'grinders': return 'bg-orange-100 text-orange-800';
      case 'impact drivers': 
      case 'impacts': return 'bg-purple-100 text-purple-800';
      case 'nailers': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Export tools list as CSV
  const exportCompatibleTools = () => {
    // Create CSV header
    const header = ['Model', 'Description', 'Category', 'Runtime (6Ah)', 'Runtime (9Ah)', 'Runtime (15Ah)', 'Power Consumption', 'Compatibility'].join(',');
    
    // Create CSV rows
    const rows = sortedTools.map(tool => {
      return [
        tool.model,
        `"${tool.description}"`, // Add quotes to handle commas in description
        tool.category,
        tool.runtime.sixAh,
        tool.runtime.nineAh,
        tool.runtime.fifteenAh,
        tool.powerConsumption,
        tool.compatibility
      ].join(',');
    });
    
    // Combine header and rows
    const csv = [header, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'compatible_tools.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render tool icon based on category
  const renderToolIcon = (category: string) => {
    return (
      <svg 
        className="h-6 w-6 text-gray-600" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {category.toLowerCase() === 'drills' && (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </>
        )}
        {category.toLowerCase() === 'saws' && (
          <>
            <path d="M3 8l4 2 3-3-2-4" />
            <path d="M11 4l3 3M10.5 13.5l8-8" />
            <path d="M18.5 5.5L20 7l-8 8-2-2" />
          </>
        )}
        {category.toLowerCase() === 'grinders' && (
          <>
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="9" />
            <line x1="3" y1="12" x2="9" y2="12" />
            <line x1="15" y1="12" x2="21" y2="12" />
          </>
        )}
        {(category.toLowerCase() === 'impact drivers' || category.toLowerCase() === 'impacts') && (
          <>
            <path d="M10 10h4v4h-4z" />
            <path d="M4 18L20 18" />
            <path d="M12 8V4" />
            <path d="M12 18L18 21" />
            <path d="M12 18L6 21" />
          </>
        )}
        {category.toLowerCase() === 'nailers' && (
          <>
            <path d="M5 12h14" />
            <path d="M5 12l4-8" />
            <path d="M19 12l-4-8" />
            <path d="M5 12l4 8" />
            <path d="M19 12l-4 8" />
          </>
        )}
      </svg>
    );
  };
  
  return (
    <div className="tool-compatibility-container bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Category Filter Tabs */}
      <div className="flex overflow-x-auto py-2 px-2 border-b border-gray-200 bg-gray-50">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            style={{
              padding: '8px 16px',
              marginRight: '12px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              background: activeCategory === category.id ? '#2563EB' : 'white',
              color: activeCategory === category.id ? 'white' : '#6B7280',
              border: activeCategory === category.id ? 'none' : '1px solid #D1D5DB',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Searchable Table Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', background: 'white' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Compatible DeWalt Tools
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search tools..."
                style={{
                  paddingLeft: '36px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  width: isMobile ? '100%' : '240px',
                  fontSize: '14px'
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div style={{ position: 'absolute', left: '12px', top: '9px', color: '#9CA3AF' }}>
                <Search size={18} />
              </div>
            </div>
            
            <button
              onClick={exportCompatibleTools}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4B5563',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <Download size={16} style={{ marginRight: '6px' }} />
              Export List
            </button>
          </div>
        </div>
      </div>

      {/* Tool Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          minWidth: '100%', 
          borderCollapse: 'collapse',
          display: isMobile ? 'block' : 'table'
        }}>
          <thead style={{ 
            background: '#F9FAFB',
            display: isMobile ? 'none' : 'table-header-group'
          }}>
            <tr>
              <th style={{ 
                padding: '12px 24px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('model')}
                >
                  Model
                  {sortField === 'model' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp size={16} style={{ marginLeft: '4px' }} /> : 
                      <ArrowDown size={16} style={{ marginLeft: '4px' }} />
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 24px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('description')}
                >
                  Description
                  {sortField === 'description' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp size={16} style={{ marginLeft: '4px' }} /> : 
                      <ArrowDown size={16} style={{ marginLeft: '4px' }} />
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 24px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('category')}
                >
                  Category
                  {sortField === 'category' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp size={16} style={{ marginLeft: '4px' }} /> : 
                      <ArrowDown size={16} style={{ marginLeft: '4px' }} />
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 24px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('runtime')}
                >
                  Runtime (6Ah | 9Ah | 15Ah)
                  {sortField === 'runtime' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp size={16} style={{ marginLeft: '4px' }} /> : 
                      <ArrowDown size={16} style={{ marginLeft: '4px' }} />
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 24px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('compatibility')}
                >
                  Compatibility
                  {sortField === 'compatibility' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp size={16} style={{ marginLeft: '4px' }} /> : 
                      <ArrowDown size={16} style={{ marginLeft: '4px' }} />
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 24px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody style={{ 
            background: 'white',
            display: isMobile ? 'block' : 'table-row-group' 
          }}>
            {paginatedTools.length > 0 ? (
              paginatedTools.map((tool, idx) => (
                <tr 
                  key={tool.id} 
                  style={{ 
                    background: hoveredRow === tool.id ? '#F0F7FF' : (idx % 2 === 0 ? 'white' : '#F9FAFB'),
                    transition: 'background-color 0.15s ease',
                    display: isMobile ? 'block' : 'table-row',
                    marginBottom: isMobile ? '16px' : '0',
                    border: isMobile ? '1px solid #E5E7EB' : 'none',
                    borderRadius: isMobile ? '8px' : '0',
                    overflow: isMobile ? 'hidden' : 'visible'
                  }}
                  onMouseEnter={() => setHoveredRow(tool.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #E5E7EB',
                    whiteSpace: 'nowrap',
                    display: isMobile ? 'block' : 'table-cell',
                    textAlign: isMobile ? 'right' : 'left',
                    position: 'relative'
                  }}
                  data-label="Model"
                  >
                    {isMobile && (
                      <span style={{
                        float: 'left',
                        fontWeight: 500,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6B7280'
                      }}>
                        Model
                      </span>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: isMobile ? 'flex-end' : 'flex-start'
                    }}>
                      {!isMobile && (
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#F3F4F6',
                          marginRight: '12px',
                          flexShrink: 0
                        }}>
                          {renderToolIcon(tool.category)}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#111827'
                      }}>
                        {tool.model}
                      </div>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #E5E7EB',
                    display: isMobile ? 'block' : 'table-cell',
                    textAlign: isMobile ? 'right' : 'left',
                    position: 'relative'
                  }}
                  data-label="Description"
                  >
                    {isMobile && (
                      <span style={{
                        float: 'left',
                        fontWeight: 500,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6B7280'
                      }}>
                        Description
                      </span>
                    )}
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#4B5563'
                    }}>
                      {tool.description}
                    </div>
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #E5E7EB',
                    whiteSpace: 'nowrap',
                    display: isMobile ? 'block' : 'table-cell',
                    textAlign: isMobile ? 'right' : 'left',
                    position: 'relative'
                  }}
                  data-label="Category"
                  >
                    {isMobile && (
                      <span style={{
                        float: 'left',
                        fontWeight: 500,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6B7280'
                      }}>
                        Category
                      </span>
                    )}
                    <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        ...getCategoryColorStyles(tool.category)
                      }}>
                        {tool.category}
                      </span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #E5E7EB',
                    whiteSpace: 'nowrap',
                    display: isMobile ? 'block' : 'table-cell',
                    textAlign: isMobile ? 'right' : 'left',
                    position: 'relative'
                  }}
                  data-label="Runtime"
                  >
                    {isMobile && (
                      <span style={{
                        float: 'left',
                        fontWeight: 500,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6B7280'
                      }}>
                        Runtime
                      </span>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      justifyContent: isMobile ? 'flex-end' : 'flex-start',
                      flexWrap: isMobile ? 'wrap' : 'nowrap'
                    }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#6B7280',
                        minWidth: '60px',
                        textAlign: 'center'
                      }}>
                        {tool.runtime.sixAh}h
                      </span>
                      <span style={{ color: '#D1D5DB' }}>|</span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#4B5563',
                        minWidth: '60px',
                        textAlign: 'center'
                      }}>
                        {tool.runtime.nineAh}h
                      </span>
                      <span style={{ color: '#D1D5DB' }}>|</span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#2563EB',
                        minWidth: '60px',
                        textAlign: 'center'
                      }}>
                        {tool.runtime.fifteenAh}h
                      </span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #E5E7EB',
                    whiteSpace: 'nowrap',
                    display: isMobile ? 'block' : 'table-cell',
                    textAlign: isMobile ? 'right' : 'left',
                    position: 'relative'
                  }}
                  data-label="Compatibility"
                  >
                    {isMobile && (
                      <span style={{
                        float: 'left',
                        fontWeight: 500,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6B7280'
                      }}>
                        Compatibility
                      </span>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: isMobile ? 'flex-end' : 'flex-start'
                    }}>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ECFDF5',
                        marginRight: '8px',
                        color: '#10B981',
                        flexShrink: 0
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#4B5563'
                      }}>
                        Compatible
                      </span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid #E5E7EB',
                    whiteSpace: 'nowrap',
                    display: isMobile ? 'block' : 'table-cell',
                    textAlign: isMobile ? 'right' : 'left',
                    position: 'relative'
                  }}
                  data-label="Actions"
                  >
                    {isMobile && (
                      <span style={{
                        float: 'left',
                        fontWeight: 500,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6B7280'
                      }}>
                        Actions
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (onSelectToolForRuntimeCalculator) {
                          onSelectToolForRuntimeCalculator(tool.id);
                        }
                        if (switchTab) {
                          switchTab('runtime');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'transparent',
                        border: 'none',
                        padding: '0',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#2563EB',
                        cursor: 'pointer',
                        marginLeft: isMobile ? 'auto' : '0'
                      }}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{ marginRight: '6px' }}
                      >
                        <path d="M10 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 10h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"></path>
                        <circle cx="12" cy="12" r="5"></circle>
                      </svg>
                      Calculate Runtime
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={6} 
                  style={{ 
                    padding: '24px', 
                    textAlign: 'center', 
                    color: '#6B7280',
                    borderBottom: '1px solid #E5E7EB'
                  }}
                >
                  No tools found matching your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {paginatedTools.length > 0 && (
        <div style={{ 
          background: 'white', 
          padding: '16px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderTop: '1px solid #E5E7EB'
        }}>
          <div style={{ 
            display: isMobile ? 'none' : 'block', 
            fontSize: '14px', 
            color: '#6B7280'
          }}>
            Showing <span style={{ fontWeight: '600' }}>{paginationStart}</span> to <span style={{ fontWeight: '600' }}>{paginationEnd}</span> of{' '}
            <span style={{ fontWeight: '600' }}>{sortedTools.length}</span> tools
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            margin: isMobile ? '0 auto' : '0'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: 'white',
                color: currentPage === 1 ? '#D1D5DB' : '#4B5563',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic for showing the right page numbers
              let pageNum = 1;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: currentPage === pageNum ? 'none' : '1px solid #D1D5DB',
                    background: currentPage === pageNum ? '#2563EB' : 'white',
                    color: currentPage === pageNum ? 'white' : '#4B5563',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: 'white',
                color: currentPage === totalPages ? '#D1D5DB' : '#4B5563',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get category badge colors
function getCategoryColorStyles(category: string) {
  switch (category.toLowerCase()) {
    case 'drills':
      return { background: '#EFF6FF', color: '#1E40AF' };
    case 'saws':
      return { background: '#ECFDF5', color: '#065F46' };
    case 'grinders':
      return { background: '#FFF7ED', color: '#9A3412' };
    case 'impact drivers':
    case 'impacts':
      return { background: '#F5F3FF', color: '#5B21B6' };
    case 'nailers':
      return { background: '#FEF2F2', color: '#991B1B' };
    default:
      return { background: '#F3F4F6', color: '#374151' };
  }
}

export default EnhancedToolCompatibilityTable;