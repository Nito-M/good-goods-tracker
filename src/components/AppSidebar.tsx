import { useState } from "react";
import { Home, ShoppingCart, ClipboardList, Settings, ChevronLeft, ChevronRight, Package, FileText, Wallet, ListTodo, CalendarDays, StickyNote, Briefcase, Plus, X, ChevronDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useJobSidebarLinks } from "@/hooks/useJobSidebarLinks";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Items", url: "/items", icon: Package },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Purchase Orders", url: "/purchase-orders", icon: ClipboardList },
  { title: "Requests", url: "/requests", icon: ListTodo },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Notes", url: "/notes", icon: StickyNote },
  { title: "Bank", url: "/bank", icon: Wallet },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { links, addLink, removeLink } = useJobSidebarLinks();
  const [jobsOpen, setJobsOpen] = useState(location.pathname.startsWith("/jobs"));
  const [addingLink, setAddingLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");

  const isActive = (path: string) => {
    if (path === "/items") {
      return location.pathname === "/items" || location.pathname.startsWith("/item/");
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
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
                Zumy
              </h1>
              <p className="text-xs text-muted-foreground">
                Inventory Management
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Jobs with collapsible subitems */}
              <SidebarMenuItem>
                <Collapsible open={jobsOpen} onOpenChange={setJobsOpen}>
                  <div className="flex items-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith("/jobs")}
                      tooltip="Jobs"
                      className="flex-1"
                    >
                      <NavLink
                        to="/jobs"
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>Jobs</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {!collapsed && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <ChevronDown className={`h-3 w-3 transition-transform ${jobsOpen ? '' : '-rotate-90'}`} />
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </div>
                  {!collapsed && (
                    <CollapsibleContent>
                      <div className="ml-7 border-l border-border pl-2 mt-1 space-y-0.5">
                        {links.map(link => (
                          <div key={link.id} className="flex items-center group">
                            <NavLink
                              to={link.jobId ? `/jobs/${link.jobId}` : '/jobs'}
                              className="flex-1 text-sm py-1 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent truncate"
                              activeClassName="text-sidebar-accent-foreground bg-sidebar-accent"
                            >
                              {link.label}
                            </NavLink>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                              onClick={(e) => { e.preventDefault(); removeLink(link.id); }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {addingLink ? (
                          <div className="flex items-center gap-1 px-1">
                            <Input
                              autoFocus
                              value={newLinkLabel}
                              onChange={e => setNewLinkLabel(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddLink(); if (e.key === 'Escape') { setAddingLink(false); setNewLinkLabel(''); } }}
                              placeholder="Link name..."
                              className="h-6 text-xs"
                            />
                            <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={handleAddLink}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs text-muted-foreground h-6 px-2"
                            onClick={() => setAddingLink(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add subitem
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
