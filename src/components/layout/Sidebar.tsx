'use client'

// React Imports
import { type ComponentType } from 'react'

import { useCallback, useEffect, useMemo, useState } from 'react'

// Router Imports
import { Link, useLocation, useSearchParams } from 'react-router-dom'

// Third-party Imports
import * as Icon from 'lucide-react'
import { ChevronRightIcon, SquareArrowOutUpRightIcon } from 'lucide-react'

// Type Imports
import type { MenuGroupSubItem, MenuItem, MenuLeafSubItem, MenuSubItem, NavItem } from '@/configs/navConfig'

// Component Imports
import LogoSvg from '@/assets/svg/logo'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar'

// Config Imports
import { navItems } from '@/configs/navConfig'
import themeConfig from '@/configs/themeConfig'

// Util Imports
import { cn } from '@/lib/utils'

import { getNavApps } from '@/lib/nav-apps'

const isSubGroup = (item: MenuSubItem): item is MenuGroupSubItem => 'childItems' in item

const isExternalLink = (href: string) => href.startsWith('http://') || href.startsWith('https://')

// Pro-badged entries that link out to an external site are demo links. They are removed
// from the sidebar only; navConfig keeps them so no other surface is affected.
const isProBadge = (badge?: string) => badge?.toLowerCase() === 'pro'

const isExternalLeaf = (leaf: MenuLeafSubItem) => isExternalLink(leaf.href)

// Every leaf under a sub-item tree points to an external site.
const hasOnlyExternalLeaves = (subItems: MenuSubItem[]): boolean =>
  subItems.every(subItem => (isSubGroup(subItem) ? subItem.childItems.every(isExternalLeaf) : isExternalLeaf(subItem)))

// Drops Pro-badged leaves that link out to an external site, plus any sub-group that
// ends up empty. Non-badged external leaves (Support, Documentation, …) are kept.
const filterProExternalSubItems = (subItems: MenuSubItem[]): MenuSubItem[] =>
  subItems
    .map(subItem =>
      isSubGroup(subItem)
        ? { ...subItem, childItems: subItem.childItems.filter(leaf => !(isProBadge(leaf.badge) && isExternalLeaf(leaf))) }
        : subItem
    )
    .filter(subItem =>
      isSubGroup(subItem) ? subItem.childItems.length > 0 : !(isProBadge(subItem.badge) && isExternalLink(subItem.href))
    )

// Drops top-level Pro-badged entries: external links themselves, or branches whose
// every leaf redirects to an external site.
const filterProExternalItems = (items: MenuItem[]): MenuItem[] =>
  items
    .map(item => (item.childItems ? { ...item, childItems: filterProExternalSubItems(item.childItems) } : item))
    .filter(item => {
      if (item.childItems) {
        if (item.childItems.length === 0) return false

        return !(isProBadge(item.badge) && hasOnlyExternalLeaves(item.childItems))
      }

      return !(isProBadge(item.badge) && isExternalLink(item.href))
    })

// Key used to track the open state of a nested sub-group, namespaced by its parent
// so two sub-groups sharing a label in different parents never collide.
const subGroupKey = (itemLabel: string, subItemLabel: string) => `${itemLabel}::${subItemLabel}`

function isLinkActive(
  href: string,
  activePath: string | undefined,
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'>
): boolean {
  if (activePath) {
    return pathname.startsWith(activePath)
  }

  if (href.includes('?')) {
    const [hrefPath, hrefQuery] = href.split('?')

    if (pathname !== hrefPath) return false

    const hrefParams = new URLSearchParams(hrefQuery)

    for (const [key, value] of hrefParams.entries()) {
      if (searchParams.get(key) !== value) return false
    }

    return true
  }

  return pathname === href
}

// Keys of every branch (top-level item, plus nested sub-group) that contains the active
// route. Branches the user has never toggled fall back to this, so the tree opens itself
// on first render and follows the route on every navigation.
function getActiveBranchKeys(
  groups: NavItem[],
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'>
): Set<string> {
  const keys = new Set<string>()

  groups.forEach(group => {
    group.items.forEach(item => {
      item.childItems?.forEach(subItem => {
        if (isSubGroup(subItem)) {
          if (subItem.childItems.some(leaf => isLinkActive(leaf.href, leaf.activePath, pathname, searchParams))) {
            keys.add(item.label)
            keys.add(subGroupKey(item.label, subItem.label))
          }
        } else if (isLinkActive(subItem.href, subItem.activePath, pathname, searchParams)) {
          keys.add(item.label)
        }
      })
    })
  })

  return keys
}

// A single navigable link inside the icon-mode flyout, at either nesting level.
const FlyoutMenuLink = ({ item, isActive }: { item: MenuLeafSubItem; isActive: boolean }) => (
  <DropdownMenuItem
    className={cn('justify-between gap-2', isActive && 'bg-primary/10 text-accent-foreground font-medium')}
    render={<Link to={item.href} target={item.target} />}
  >
    <span className='truncate'>{item.label}</span>
    <div className='flex items-center gap-2'>
      {item.badge && (
        <span className={cn('bg-primary/10 ml-auto rounded-full px-1.5 text-xs font-normal', item.badgeClassName)}>
          {item.badge}
        </span>
      )}
      {isExternalLink(item.href) && <SquareArrowOutUpRightIcon className='ml-auto size-3.5 shrink-0 opacity-50' />}
    </div>
  </DropdownMenuItem>
)

// Icon-mode stand-in for a collapsible menu item. The rail is too narrow to show the
// inline sub-menu, so the children open in a dropdown to the right of the rail — with
// nested sub-groups rendered as submenus so every leaf stays reachable.
const FlyoutMenuItem = ({
  item,
  childItems,
  isChildActive,
  pathname,
  searchParams
}: {
  item: MenuItem
  childItems: MenuSubItem[]
  isChildActive: boolean
  pathname: string
  searchParams: Pick<URLSearchParams, 'get'>
}) => {
  const Tag = item.icon ? (Icon[item.icon] as ComponentType) : null

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarMenuButton isActive={isChildActive} className='data-active:bg-primary/5!' />}
        >
          {Tag && <Tag />}
          <span className='min-w-0 flex-1 truncate'>{item.label}</span>
          <ChevronRightIcon className='ml-auto' />
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={12} className='w-auto min-w-52'>
          {/* The label must live inside a Group — Base UI's GroupLabel throws without one. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className='text-foreground flex items-center gap-2 text-sm'>
              <span className='truncate'>{item.label}</span>
              {item.badge && (
                <span className={cn('bg-primary/10 rounded-full px-1.5 text-xs font-normal', item.badgeClassName)}>
                  {item.badge}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {childItems.map(subItem =>
              isSubGroup(subItem) ? (
                <DropdownMenuSub key={subItem.label}>
                  <DropdownMenuSubTrigger
                    className={cn(
                      subItem.childItems.some(leaf =>
                        isLinkActive(leaf.href, leaf.activePath, pathname, searchParams)
                      ) && 'bg-primary/10 text-accent-foreground font-medium'
                    )}
                  >
                    <span className='truncate'>{subItem.label}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent sideOffset={9} className='w-auto min-w-48'>
                    {subItem.childItems.map(leaf => (
                      <FlyoutMenuLink
                        key={leaf.label}
                        item={leaf}
                        isActive={isLinkActive(leaf.href, leaf.activePath, pathname, searchParams)}
                      />
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <FlyoutMenuLink
                  key={subItem.label}
                  item={subItem}
                  isActive={isLinkActive(subItem.href, subItem.activePath, pathname, searchParams)}
                />
              )
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

const SidebarGroupedMenuItems = ({
  data,
  groupLabel,
  pathname,
  searchParams,
  isIconMode,
  isBranchOpen,
  setOpenItem
}: {
  data: MenuItem[]
  groupLabel?: string
  pathname: string
  searchParams: Pick<URLSearchParams, 'get'>
  isIconMode: boolean
  isBranchOpen: (key: string) => boolean
  setOpenItem: (key: string, open: boolean) => void
}) => {
  return (
    <SidebarGroup>
      {groupLabel && (
        <SidebarGroupLabel className='text-sidebar-foreground/50 tracking-wider uppercase'>
          {groupLabel}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {data.map(item => {
            const Tag = item.icon ? (Icon[item.icon] as ComponentType) : null

            const isChildActive =
              item.childItems?.some(subItem =>
                isSubGroup(subItem)
                  ? subItem.childItems.some(leaf => isLinkActive(leaf.href, leaf.activePath, pathname, searchParams))
                  : isLinkActive(subItem.href, subItem.activePath, pathname, searchParams)
              ) ?? false

            if (item.childItems && isIconMode) {
              return (
                <FlyoutMenuItem
                  key={item.label}
                  item={item}
                  childItems={item.childItems}
                  isChildActive={isChildActive}
                  pathname={pathname}
                  searchParams={searchParams}
                />
              )
            }

            return item.childItems ? (
              <Collapsible
                className='group/collapsible'
                key={item.label}
                open={isBranchOpen(item.label)}
                onOpenChange={open => setOpenItem(item.label, open)}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={isChildActive}
                        className='data-active:bg-primary/5!'
                      />
                    }
                  >
                    {Tag && <Tag />}
                    <span className={cn('min-w-0 flex-1 truncate', item.badge && 'pr-14')}>{item.label}</span>
                    {item.badge && (
                      <SidebarMenuBadge
                        className={cn(
                          'bg-primary/10 max-w-24 truncate rounded-full px-1.5 font-normal',
                          item.badgeClassName
                        )}
                      >
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                    <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                  </CollapsibleTrigger>
                  <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                    <SidebarMenuSub>
                      {item.childItems.map(subItem =>
                        isSubGroup(subItem) ? (
                          <Collapsible
                            className='group/subcollapsible'
                            key={subItem.label}
                            open={isBranchOpen(subGroupKey(item.label, subItem.label))}
                            onOpenChange={open => setOpenItem(subGroupKey(item.label, subItem.label), open)}
                          >
                            <SidebarMenuSubItem>
                              <CollapsibleTrigger
                                nativeButton={false}
                                render={
                                  <SidebarMenuSubButton
                                    className='data-active:bg-primary/10! justify-between'
                                    isActive={subItem.childItems.some(leaf =>
                                      isLinkActive(leaf.href, leaf.activePath, pathname, searchParams)
                                    )}
                                  />
                                }
                              >
                                {subItem.label}
                                <ChevronRightIcon className='ml-auto shrink-0 transition-transform duration-200 group-data-open/subcollapsible:rotate-90' />
                              </CollapsibleTrigger>
                              <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                                <SidebarMenuSub className='mx-0'>
                                  {subItem.childItems.map(leaf => (
                                    <SidebarMenuSubItem key={leaf.label}>
                                      <SidebarMenuSubButton
                                        className='data-active:bg-primary/10! justify-between'
                                        render={<Link to={leaf.href} target={leaf.target} />}
                                        isActive={isLinkActive(leaf.href, leaf.activePath, pathname, searchParams)}
                                      >
                                        <span
                                          className={cn(
                                            'min-w-0 flex-1 truncate',
                                            leaf.badge && isExternalLink(leaf.href) && 'pr-8',
                                            leaf.badge && !isExternalLink(leaf.href) && 'pr-14',
                                            !leaf.badge && isExternalLink(leaf.href) && 'pr-6'
                                          )}
                                        >
                                          {leaf.label}
                                        </span>
                                        {leaf.badge && (
                                          <SidebarMenuBadge
                                            className={cn(
                                              'bg-primary/10 max-w-24 truncate rounded-full px-1.5 font-normal',
                                              isExternalLink(leaf.href) && 'right-6',
                                              leaf.badgeClassName
                                            )}
                                          >
                                            {leaf.badge}
                                          </SidebarMenuBadge>
                                        )}
                                        {isExternalLink(leaf.href) && (
                                          <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                                        )}
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        ) : (
                          <SidebarMenuSubItem key={subItem.label}>
                            <SidebarMenuSubButton
                              className='data-active:bg-primary/10! justify-between'
                              render={<Link to={subItem.href} target={subItem.target} />}
                              isActive={isLinkActive(subItem.href, subItem.activePath, pathname, searchParams)}
                            >
                              <span
                                className={cn(
                                  'min-w-0 flex-1 truncate',
                                  subItem.badge && isExternalLink(subItem.href) && 'pr-8',
                                  subItem.badge && !isExternalLink(subItem.href) && 'pr-14',
                                  !subItem.badge && isExternalLink(subItem.href) && 'pr-6'
                                )}
                              >
                                {subItem.label}
                              </span>
                              {subItem.badge && (
                                <SidebarMenuBadge
                                  className={cn(
                                    'bg-primary/10 max-w-24 truncate rounded-full px-1.5 font-normal',
                                    isExternalLink(subItem.href) && 'right-6',
                                    subItem.badgeClassName
                                  )}
                                >
                                  {subItem.badge}
                                </SidebarMenuBadge>
                              )}
                              {isExternalLink(subItem.href) && (
                                <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  tooltip={item.label}
                  render={<Link to={item.href} target={item.target} />}
                  isActive={pathname === item.href}
                  className='data-active:bg-primary/10!'
                >
                  {Tag && <Tag />}
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate',
                      item.badge && isExternalLink(item.href) && 'pr-8',
                      item.badge && !isExternalLink(item.href) && 'pr-14',
                      !item.badge && isExternalLink(item.href) && 'pr-6'
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <SidebarMenuBadge
                      className={cn(
                        'bg-primary/10 max-w-24 truncate rounded-full px-1.5 font-normal',
                        isExternalLink(item.href) && 'right-6',
                        item.badgeClassName
                      )}
                    >
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                  {isExternalLink(item.href) && (
                    <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

const SidebarLayout = () => {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { state, isMobile } = useSidebar()

  // Remove this state when the nav-apps API is removed. Until then, this state is used to hold the external nav-apps fetched from the API JSON.
  const [externalApps, setExternalApps] = useState<MenuItem[]>([])

  // Branches the user has explicitly opened or closed, keyed by label. It lives here rather
  // than inside each Collapsible so it survives the swap between the inline sub-menu and the
  // icon-mode flyout — collapsing and re-expanding the sidebar keeps the tree as it was.
  // Anything absent from this map falls back to "open if it holds the active route".
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let mounted = true

    getNavApps().then(data => {
      if (!mounted) return

      setExternalApps(
        data.map(app => ({
          icon: app.icon as MenuItem['icon'],
          label: app.name,
          href: app.href,
          badge: 'Pro',
          badgeClassName: 'right-8',
          ...(app.openInNewTab ? { target: '_blank' as const } : {})
        }))
      )
    })

    return () => {
      mounted = false
    }
  }, [])

  // Nav groups rendered in the sidebar.
  // Remove the externalApps branch when the nav-apps API is removed. Until then, this is used to merge external nav-apps into the "Apps" group.
  const navGroups = useMemo(() => {
    const groups =
      externalApps.length > 0
        ? navItems.map(item =>
            item.groupLabel === 'Apps' ? { ...item, items: item.items.concat(externalApps) } : item
          )
        : navItems

    // Pro-badged demo links to external sites are removed from the sidebar only.
    return groups
      .map(group => ({ ...group, items: filterProExternalItems(group.items) }))
      .filter(group => group.items.length > 0)
  }, [externalApps])

  const activeBranchKeys = useMemo(
    () => getActiveBranchKeys(navGroups, pathname, searchParams),
    [navGroups, pathname, searchParams]
  )

  // A user toggle wins; otherwise the branch mirrors whether it holds the active route.
  const isBranchOpen = useCallback(
    (key: string) => openItems[key] ?? activeBranchKeys.has(key),
    [openItems, activeBranchKeys]
  )

  const setOpenItem = useCallback((key: string, open: boolean) => {
    setOpenItems(prev => ({ ...prev, [key]: open }))
  }, [])

  // Only the icon rail is too narrow for the inline sub-menu. Mobile renders the full-width
  // sheet, so it keeps the normal tree.
  const isIconMode = state === 'collapsed' && !isMobile

  return (
    <Sidebar collapsible='icon' variant='sidebar'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              className='gap-2.5 bg-transparent! [&>svg]:size-8'
              render={<Link to={`${themeConfig.homePageUrl}`} />}
            >
              <LogoSvg className='[&_rect]:fill-sidebar [&_rect:first-child]:fill-primary' />
              <div className='flex flex-col items-start'>
                <span className='text-lg font-semibold text-nowrap'>{themeConfig.templateName}</span>
                <span className='text-xs font-light text-nowrap'>Dashboard Template</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='group-data-[collapsible=icon]:overflow-y-auto'>
        {navGroups.map((navItem, index) => {
          return (
            <SidebarGroupedMenuItems
              key={navItem.groupLabel || index}
              data={navItem.items}
              groupLabel={navItem.groupLabel}
              pathname={pathname}
              searchParams={searchParams}
              isIconMode={isIconMode}
              isBranchOpen={isBranchOpen}
              setOpenItem={setOpenItem}
            />
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}

export default SidebarLayout
