import React from 'react'

function Per90Toggle({ isOn, onToggle }) {
    return (
        <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!isOn ? 'text-gray-900' : 'text-gray-500'}`}>
                Total
            </span>
            <button
                onClick={onToggle}
                className={`${isOn ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                aria-checked={isOn}
                role="switch"
            >
                <span
                    className={`${isOn ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </button>
            <span className={`text-sm font-medium ${isOn ? 'text-gray-900' : 'text-gray-500'}`}>
                Per 90
            </span>
        </div>
    )
}

export default Per90Toggle
