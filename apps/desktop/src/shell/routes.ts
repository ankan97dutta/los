export type PrimaryRouteId =
  | 'today'
  | 'inbox'
  | 'planning'
  | 'team'
  | 'reviews'
  | 'settings';

export type RouteId =
  | PrimaryRouteId
  | 'actions'
  | 'team-roster'
  | 'team-apps'
  | 'reviews-monthly'
  | 'reviews-history'
  | 'planning-capacity'
  | 'planning-fortnight'
  | 'quick';

export type NavItem = {
  id: PrimaryRouteId;
  label: string;
  group: 'workspace' | 'system';
  /** Digit for Cmd/Ctrl+<digit> navigation, shown as a hint. */
  shortcutDigit?: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { id: 'today', label: 'Today', group: 'workspace', shortcutDigit: '1' },
  { id: 'inbox', label: 'Inbox', group: 'workspace', shortcutDigit: '2' },
  { id: 'planning', label: 'Planning', group: 'workspace', shortcutDigit: '3' },
  { id: 'team', label: 'Team', group: 'workspace', shortcutDigit: '4' },
  { id: 'reviews', label: 'Reviews & history', group: 'workspace', shortcutDigit: '5' },
  { id: 'settings', label: 'Settings', group: 'system', shortcutDigit: '6' },
];

export const ROUTE_TITLES: Record<string, { title: string; context: string }> = {
  today: { title: 'Today', context: 'Daily operating brief' },
  inbox: { title: 'Inbox', context: 'Capture first, classify later' },
  actions: { title: 'Inbox', context: 'Personal actions' },
  'planning-capacity': { title: 'Planning', context: 'Weekly capacity & commitments' },
  'planning-fortnight': { title: 'Planning', context: 'Personal fortnight plan' },
  'team-roster': { title: 'Team', context: 'Roster & capacity members' },
  'team-apps': { title: 'Team', context: 'Applications' },
  'reviews-monthly': { title: 'Reviews & history', context: 'Monthly review' },
  'reviews-history': { title: 'Reviews & history', context: 'Closed planning periods' },
  settings: { title: 'Settings', context: 'Local workspace preferences' },
};

export function defaultChild(route: PrimaryRouteId): RouteId {
  switch (route) {
    case 'inbox':
      return 'inbox';
    case 'planning':
      return 'planning-capacity';
    case 'team':
      return 'team-roster';
    case 'reviews':
      return 'reviews-monthly';
    default:
      return route;
  }
}

export function primaryOf(route: RouteId): PrimaryRouteId | 'quick' {
  if (route === 'quick') return 'quick';
  if (route === 'actions' || route === 'inbox') return 'inbox';
  if (route.startsWith('planning')) return 'planning';
  if (route.startsWith('team')) return 'team';
  if (route.startsWith('reviews')) return 'reviews';
  if (route === 'today' || route === 'settings') return route;
  return 'inbox';
}
