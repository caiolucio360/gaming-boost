// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window.location (apenas em ambiente jsdom)
if (typeof window !== 'undefined') {
  delete window.location
  window.location = {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

// Mock PointerEvent
if (!global.PointerEvent) {
  class PointerEvent extends Event {
    constructor(type, props) {
      super(type, props)
      if (props) {
        // Only assign properties that are not read-only Event properties
        // and are specific to PointerEvent
        for (const key in props) {
          if (key !== 'bubbles' && key !== 'cancelable' && key !== 'composed' && key !== 'isTrusted' && key !== 'defaultPrevented') {
            try {
              this[key] = props[key]
            } catch (e) {
              // Ignore read-only properties
            }
          }
        }
      }
    }
  }
  global.PointerEvent = PointerEvent
}

// Mock scrollIntoView (apenas se Element estiver disponível)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = jest.fn()
}

// Mock matchMedia (apenas se window estiver disponível)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}
