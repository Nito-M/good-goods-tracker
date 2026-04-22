import { useState } from "react";
import { Home, ShoppingCart, ClipboardList, Settings, ChevronLeft, ChevronRight, Package, FileText, Wallet, ListTodo, CalendarDays, StickyNote, Briefcase, Plus, ChevronDown, LogOut, Layers, Puzzle, Store, ExternalLink, Truck, Wrench, Table2 } from "lucide-react";
import { useBoards } from "@/hooks/useBoards";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useJobSidebarLinks } from "@/hooks/useJobSidebarLinks";
import { usePagePermissions } from "@/hooks/usePagePermissions";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar } from
"@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
{ title: "Dashboard", url: "/", icon: Home, pageKey: "dashboard" },
{ title: "Items", url: "/items", icon: Package, pageKey: "items" },
{ title: "Purchase Orders", url: "/purchase-orders", icon: ClipboardList, pageKey: "purchase-orders" },
{ title: "Requests", url: "/requests", icon: ListTodo, pageKey: "requests" },
{ title: "Calendar", url: "/calendar", icon: CalendarDays, pageKey: "calendar" },
{ title: "Notes", url: "/notes", icon: StickyNote, pageKey: "notes" },
{ title: "Bank", url: "/bank", icon: Wallet, pageKey: "bank" },
{ title: "Assemblies", url: "/assemblies", icon: Layers, pageKey: "assemblies" },
{ title: "Assets", url: "/assets", icon: Truck, pageKey: "assets" },
{ title: "Parts Library", url: "/parts", icon: Puzzle, pageKey: "parts" },
{ title: "Tax Documents", url: "/tax-documents", icon: FileText, pageKey: "tax-documents" },
{ title: "Storefront", url: "/storefront", icon: ShoppingCart, pageKey: "storefront" },
{ title: "Trailer Config", url: "/trailer-configurator", icon: Wrench, pageKey: "trailer-config" }];


interface OrgShop {
  id: string;
  name: string;
  slug: string;
}

interface AppSidebarProps {
  shopSlug?: string | null;
  shops?: OrgShop[];
}

export function AppSidebar({ shopSlug, shops = [] }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { links, addLink } = useJobSidebarLinks();
  const { isPageAllowed } = usePagePermissions();
  const [jobsOpen, setJobsOpen] = useState(location.pathname.startsWith("/jobs"));
  const [salesOpen, setSalesOpen] = useState(location.pathname.startsWith("/sales") || location.pathname.startsWith("/quotes") || location.pathname.startsWith("/sales-orders"));
  const [boardsOpen, setBoardsOpen] = useState(location.pathname.startsWith("/boards"));
  const [addingLink, setAddingLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const { boards } = useBoards();

  const filteredMenuItems = menuItems.filter((item) => isPageAllowed(item.pageKey));

  const isActive = (path: string) => {
    if (path === "/items") {
      return location.pathname === "/items" || location.pathname.startsWith("/item/");
    }
    if (path === "/parts") {
      return location.pathname.startsWith("/parts");
    }
    if (path === "/sales") {
      return location.pathname === "/sales";
    }
    return location.pathname === path;
  };

  const handleAddLink = async () => {
    if (!newLinkLabel.trim()) return;
    await addLink(newLinkLabel.trim());
    setNewLinkLabel("");
    setAddingLink(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          {!collapsed &&
          <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
                Zumy
              </h1>
              <p className="text-xs text-muted-foreground">

            </p>
            </div>
          }
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) =>
              <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={item.title}>

                    <NavLink
                    to={item.url}
                    className="flex items-center gap-3"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">

                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Sales with Quotes subitem */}
              {isPageAllowed('sales') &&
              <SidebarMenuItem>
                <Collapsible open={salesOpen} onOpenChange={setSalesOpen}>
                  <div className="flex items-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith("/sales") || location.pathname.startsWith("/quotes")}
                      tooltip="Sales"
                      className="flex-1">

                      <NavLink
                        to="/sales"
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">

                        <ShoppingCart className="h-4 w-4" />
                        <span>Sales</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {!collapsed &&
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <ChevronDown className={`h-3 w-3 transition-transform ${salesOpen ? '' : '-rotate-90'}`} />
                        </Button>
                      </CollapsibleTrigger>
                    }
                  </div>
                  {!collapsed &&
                  <CollapsibleContent>
                      <div className="ml-7 border-l border-border pl-2 mt-1 space-y-0.5">
                        {isPageAllowed('quotes') &&
                      <NavLink
                        to="/quotes"
                        className="block text-sm py-1 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent truncate"
                        activeClassName="text-sidebar-accent-foreground bg-sidebar-accent">

                            Quotes
                          </NavLink>
                      }
                        {isPageAllowed('sales-orders') &&
                      <NavLink
                        to="/sales-orders"
                        className="block text-sm py-1 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent truncate"
                        activeClassName="text-sidebar-accent-foreground bg-sidebar-accent">

                            Sales Orders
                          </NavLink>
                      }
                      </div>
                    </CollapsibleContent>
                  }
                </Collapsible>
              </SidebarMenuItem>
              }

              {/* Jobs with collapsible subitems */}
              {isPageAllowed('jobs') &&
              <SidebarMenuItem>
                <Collapsible open={jobsOpen} onOpenChange={setJobsOpen}>
                  <div className="flex items-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith("/jobs")}
                      tooltip="Jobs"
                      className="flex-1">

                      <NavLink
                        to="/jobs"
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">

                        <Briefcase className="h-4 w-4" />
                        <span>Jobs</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {!collapsed &&
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <ChevronDown className={`h-3 w-3 transition-transform ${jobsOpen ? '' : '-rotate-90'}`} />
                        </Button>
                      </CollapsibleTrigger>
                    }
                  </div>
                  {!collapsed &&
                  <CollapsibleContent>
                      <div className="ml-7 border-l border-border pl-2 mt-1 space-y-0.5">
                        {links.map((link) =>
                      <NavLink
                        key={link.id}
                        to={`/jobs/link/${link.id}`}
                        className="block text-sm py-1 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent truncate"
                        activeClassName="text-sidebar-accent-foreground bg-sidebar-accent">

                            {link.label}
                          </NavLink>
                      )}
                        {addingLink ?
                      <div className="flex items-center gap-1 px-1">
                            <Input
                          autoFocus
                          value={newLinkLabel}
                          onChange={(e) => setNewLinkLabel(e.target.value)}
                          onKeyDown={(e) => {if (e.key === 'Enter') handleAddLink();if (e.key === 'Escape') {setAddingLink(false);setNewLinkLabel('');}}}
                          placeholder="Link name..."
                          className="h-6 text-xs" />

                            <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={handleAddLink}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div> :

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs text-muted-foreground h-6 px-2"
                        onClick={() => setAddingLink(true)}>

                            <Plus className="h-3 w-3 mr-1" />
                            Add subitem
                          </Button>
                      }
                      </div>
                    </CollapsibleContent>
                  }
                </Collapsible>
              </SidebarMenuItem>
              }

              {/* Boards (no sub-list — pick a company on the page) */}
              {isPageAllowed('boards') &&
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith("/boards")}
                  tooltip="Boards">
                  <NavLink
                    to="/boards"
                    className="flex items-center gap-3"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                    <Table2 className="h-4 w-4" />
                    <span>Boards</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        {shops.length > 0 ? (
          shops.map(shop => (
            <SidebarMenuButton
              key={shop.id}
              asChild
              tooltip={`View ${shop.name} Shop`}>
              <a
                href={`/shop/${shop.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-primary">
                <Store className="h-4 w-4" />
                <span className="flex items-center gap-1 truncate">
                  {shops.length > 1 ? shop.name : 'View Shop'}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </span>
              </a>
            </SidebarMenuButton>
          ))
        ) : shopSlug && (
          <SidebarMenuButton
            asChild
            tooltip="View Public Shop">
            <a
              href={`/shop/${shopSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-primary">
              <Store className="h-4 w-4" />
              <span className="flex items-center gap-1">
                View Shop
                <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          </SidebarMenuButton>
        )}
        {isPageAllowed('settings') &&
        <SidebarMenuButton
          asChild
          isActive={isActive("/settings")}
          tooltip="Settings">

            <NavLink
            to="/settings"
            className="flex items-center gap-3"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">

              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </NavLink>
          </SidebarMenuButton>
        }
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive">

          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && <span>Logout</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center">

          {collapsed ?
          <ChevronRight className="h-4 w-4" /> :

          <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          }
        </Button>
      </SidebarFooter>
    </Sidebar>);

}