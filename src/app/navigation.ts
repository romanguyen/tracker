import {
  BookOpenCheckIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  type LucideIcon,
} from "lucide-react"

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    label: "Overview",
    path: "/",
    icon: LayoutDashboardIcon,
  },
  {
    label: "Topics",
    path: "/topics",
    icon: BookOpenCheckIcon,
  },
  {
    label: "History",
    path: "/history",
    icon: HistoryIcon,
  },
]

export const LOGIN_PATH = "/login"
