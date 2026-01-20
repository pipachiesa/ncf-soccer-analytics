import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  options = [],
  selectedOption,
  onOptionChange,
  loading = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const colorClasses = {
    primary: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
  }

  const hasDropdown = options.length > 0

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionSelect = (option) => {
    if (onOptionChange) {
      onOptionChange(option)
    }
    setIsOpen(false)
  }

  const displayTitle = selectedOption?.label || title

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm card-hover relative ${isOpen ? 'z-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="relative" ref={dropdownRef}>
            {/* Title with dropdown toggle */}
            <button
              onClick={() => hasDropdown && setIsOpen(!isOpen)}
              className={`flex items-center gap-1 mb-1 ${hasDropdown ? 'cursor-pointer hover:text-gray-700' : 'cursor-default'}`}
              disabled={!hasDropdown}
            >
              <p className={`text-sm font-medium text-gray-500 ${isOpen ? 'text-gray-700' : ''}`}>
                {displayTitle}
              </p>
              {hasDropdown && (
                isOpen ? (
                  <ChevronUp size={14} className="text-gray-400" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400" />
                )
              )}
            </button>

            {/* Dropdown menu */}
            {hasDropdown && isOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[180px]">
                {options.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedOption?.key === option.key
                        ? 'text-blue-600 font-medium bg-blue-50'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Value */}
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '-' : value}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colorClasses[color]} flex-shrink-0`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  )
}

export default KPICard
