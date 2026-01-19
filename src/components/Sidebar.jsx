import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, TrendingUp, FileText } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '#', icon: TrendingUp, label: 'Team Analysis', disabled: true },
  { to: '#', icon: Users, label: 'Player Analysis', disabled: true },
  { to: '#', icon: FileText, label: 'Reports', disabled: true },
]

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-blue-600 text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <img
          src="/mascotMightyBanyan.png"
          alt="Mighty Banyans Mascot"
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div>
          <h1 className="font-bold text-lg leading-tight">Mighty</h1>
          <h1 className="font-bold text-lg leading-tight">Banyans</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map(({ to, icon: Icon, label, disabled }) => (
            <li key={label}>
              {disabled ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/40 cursor-not-allowed">
                  <Icon size={20} />
                  <span>{label}</span>
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded"></span>
                </div>
              ) : (
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-blue-600 font-semibold shadow-md'
                        : 'text-white/90 hover:bg-blue-500 hover:text-white'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
