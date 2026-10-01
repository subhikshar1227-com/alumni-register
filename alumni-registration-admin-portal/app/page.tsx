'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  Bell,
  ChevronDown,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Users,
  X,
} from 'lucide-react'
import EmailWorkspace from '@/components/email-workspace'
import RegistrationsWorkspace from '@/components/registrations-workspace'
import LoginScreen from '@/components/login-screen'
import { authClient } from '@/lib/auth-client'

export default function Page() {
  const [mobileNav, setMobileNav] = useState(false)
  const [currentView, setCurrentView] = useState<'registrations' | 'email'>('registrations')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    authClient.session().then((value) => {
      setAuthenticated(value)
      setAuthChecked(true)
    })
  }, [])

  function navigateTo(view: 'registrations' | 'email') {
    setCurrentView(view)
    setMobileNav(false)
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
    setSidebarMenuOpen(false)
  }

  async function handleLogout() {
    await authClient.logout()
    setAuthenticated(false)
  }

  if (!authChecked) return null
  if (!authenticated) return <LoginScreen onSignedIn={() => setAuthenticated(true)} />

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#18202b]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col border-r border-[#e6e9ee] bg-white transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <button type="button" onClick={() => navigateTo('registrations')} aria-label="SVCE home, go to Alumni Registration" title="SVCE / SVCE Silver Jubilee 25" className="flex h-[82px] w-full items-center gap-3 border-b border-[#eef0f3] px-6 text-left hover:bg-[#fbfcfd] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#176b87]">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#e6e9ee]"><Image src="/svce-logo.png" alt="SVCE crest" width={40} height={40} className="size-full object-contain" /></span>
          <span className="min-w-0"><span className="block text-[13px] font-bold tracking-[0.08em] text-[#183b56]">SVCE</span><span className="block truncate text-[11px] text-[#7a8593]">Silver Jubilee • 25 years</span></span>
        </button>
        <div className="flex-1 px-3 py-6">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa3ae]">Workspace</p>
          <nav className="flex flex-col gap-1">
            <button type="button" onClick={() => navigateTo('registrations')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${currentView === 'registrations' ? 'bg-[#edf4f7] font-semibold text-[#183b56]' : 'text-[#697583] hover:bg-[#f5f7f8]'}`}><Users data-icon="inline-start" />Alumni Registration</button>
            <button type="button" onClick={() => navigateTo('email')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${currentView === 'email' ? 'bg-[#edf4f7] font-semibold text-[#183b56]' : 'text-[#697583] hover:bg-[#f5f7f8]'}`}><Mail data-icon="inline-start" />Email Workspace</button>
          </nav>
        </div>
        <div className="relative border-t border-[#eef0f3] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dce9ed] text-xs font-bold text-[#183b56]">AD</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Administrator</p><p className="truncate text-[11px] text-[#87919d]">Admin workspace</p></div><button type="button" aria-label="Open admin menu" aria-expanded={sidebarMenuOpen} onClick={() => setSidebarMenuOpen((open) => !open)} className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#697583] hover:bg-[#edf0f3]"><MoreHorizontal className="size-4" /></button></div>
          {sidebarMenuOpen && <div role="menu" className="absolute bottom-[calc(100%-8px)] left-4 right-4 z-40 rounded-lg border border-[#e1e5e9] bg-white p-2 shadow-lg"><p className="px-2 py-1 text-xs text-[#87919d]">Administrator</p><button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[#9a3f31] hover:bg-[#fff3f1]"><LogOut className="size-4" />Sign out</button></div>}
        </div>
      </aside>
      {mobileNav && <button aria-label="Close navigation" className="fixed inset-0 z-20 bg-[#18202b]/20 lg:hidden" onClick={() => setMobileNav(false)} />}

      <section className="min-w-0 lg:pl-[248px]">
        <header className="sticky top-0 z-10 flex min-h-[72px] items-center justify-between gap-3 border-b border-[#e6e9ee] bg-white/95 px-4 py-3 backdrop-blur sm:min-h-[82px] sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3"><button type="button" aria-label="Open navigation" aria-expanded={mobileNav} className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#f4f6f8] lg:hidden" onClick={() => setMobileNav(true)}><Menu className="size-5" /></button><div className="min-w-0"><p className="truncate text-[11px] font-medium text-[#89939f] sm:text-xs">Admin workspace / {currentView === 'email' ? 'Email' : 'Alumni Registration'}</p><h1 className="mt-0.5 truncate text-base font-bold sm:text-xl">{currentView === 'email' ? 'Email Workspace' : 'Alumni Registration'}</h1></div></div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setProfileMenuOpen(false) }} className="flex size-9 items-center justify-center rounded-lg text-[#65717f] hover:bg-[#f4f6f8]"><Bell className="size-5" /></button>
              {notificationsOpen && <div role="dialog" aria-label="Notifications" className="absolute right-0 top-11 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[#e1e5e9] bg-white p-4 shadow-xl"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-[#18202b]">Notifications</h2><button type="button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} className="flex size-8 items-center justify-center rounded-md text-[#697583] hover:bg-[#f4f6f8]"><X className="size-4" /></button></div><p className="mt-3 text-sm text-[#697583]">You’re all caught up.</p></div>}
            </div>
            <div className="relative hidden sm:block">
              <button type="button" aria-label="Admin profile menu" aria-expanded={profileMenuOpen} onClick={() => { setProfileMenuOpen((open) => !open); setNotificationsOpen(false) }} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f4f6f8]"><span className="flex size-8 items-center justify-center rounded-full bg-[#dce9ed] text-xs font-bold text-[#183b56]">AD</span><span className="text-sm font-medium">Admin</span><ChevronDown className={`size-4 text-[#9aa3ae] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} /></button>
              {profileMenuOpen && <div role="menu" className="absolute right-0 top-11 z-40 w-52 rounded-lg border border-[#e1e5e9] bg-white p-2 shadow-xl"><p className="px-2 py-1 text-xs text-[#87919d]">Administrator</p><button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[#9a3f31] hover:bg-[#fff3f1]"><LogOut className="size-4" />Sign out</button></div>}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 2xl:px-10">
          {currentView === 'email' ? <EmailWorkspace /> : <>
          <RegistrationsWorkspace />
          <p className="mt-6 text-center text-[11px] text-[#a0a8b2]">SVCE Alumni Administration • Secure workspace • Silver Jubilee 2025</p>
          </>}
        </div>
      </section>
    </main>
  )
}
