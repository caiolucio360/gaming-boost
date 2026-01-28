'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Gamepad2, Package, Bell, User, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  showBadge?: boolean
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { items } = useCart()
  
  const cartItemsCount = items.length

  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { icon: Home, label: 'Início', href: '/' },
      { icon: Gamepad2, label: 'Jogos', href: '/games/cs2' },
    ]

    if (!user) {
      return [
        ...baseItems,
        { icon: ShoppingCart, label: 'Carrinho', href: '/cart', showBadge: cartItemsCount > 0 },
        { icon: User, label: 'Entrar', href: '/login' },
      ]
    }

    // Role-specific items
    if (user.role === 'ADMIN') {
      return [
        ...baseItems,
        { icon: ShieldCheck, label: 'Admin', href: '/admin' },
        { icon: Bell, label: 'Alertas', href: '/notifications' },
      ]
    }
    
    if (user.role === 'BOOSTER') {
      return [
        ...baseItems,
        { icon: Package, label: 'Trabalhos', href: '/booster' },
        { icon: Bell, label: 'Alertas', href: '/notifications' },
      ]
    }

    // CLIENT
    return [
      ...baseItems,
      { icon: ShoppingCart, label: 'Carrinho', href: '/cart', showBadge: cartItemsCount > 0 },
      { icon: Package, label: 'Pedidos', href: '/dashboard' },
    ]
  }

  const navItems = getNavItems()
  
  // Find the active index
  const getActiveIndex = (): number => {
    const exactIndex = navItems.findIndex(item => item.href === pathname)
    if (exactIndex !== -1) return exactIndex
    
    const partialIndex = navItems.findIndex(item => 
      item.href !== '/' && pathname.startsWith(item.href)
    )
    if (partialIndex !== -1) return partialIndex
    
    return pathname === '/' ? 0 : -1
  }

  const activeIndex = getActiveIndex()

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
      role="navigation"
      aria-label="Navegação principal mobile"
    >
      {/* Glassmorphism background with gradient overlay */}
      <div className="relative mx-3 mb-3 rounded-2xl overflow-hidden">
        {/* Gradient border glow effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-purple/50 via-brand-purple-light/30 to-brand-purple/50 rounded-2xl blur-sm" />
        
        {/* Main background with glass effect */}
        <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl border border-brand-purple/30">
          {/* Animated pill indicator that slides behind active item */}
          <motion.div 
            className="absolute top-2 bottom-2 rounded-xl bg-gradient-to-br from-brand-purple-dark/40 to-brand-purple-dark/40 border border-brand-purple/40"
            initial={false}
            animate={{ 
              left: `calc(${(activeIndex / navItems.length) * 100}% + 8px)`,
              width: `calc(${100 / navItems.length}% - 16px)`,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 380, 
              damping: 30,
              mass: 0.8
            }}
          />

          {/* Navigation items */}
          <div className="relative flex items-center px-1 py-2">
            {navItems.map((item, index) => {
              const isActive = index === activeIndex
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all duration-300",
                    isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Icon container with scale animation */}
                  <motion.div
                    className="relative"
                    animate={{ 
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 400, 
                      damping: 25 
                    }}
                  >
                    {/* Glow effect for active icon */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-brand-purple/40 rounded-full blur-md"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1.8 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </AnimatePresence>
                    
                    {/* Icon */}
                    <div className="relative z-10">
                      <Icon 
                        className={cn(
                          "w-5 h-5 transition-all duration-300",
                          isActive && "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                        )} 
                        aria-hidden="true" 
                      />
                      
                      {/* Badge for cart */}
                      {item.showBadge && (
                        <motion.span 
                          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[10px] font-bold bg-brand-purple text-white rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          {cartItemsCount > 9 ? '9+' : cartItemsCount}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
