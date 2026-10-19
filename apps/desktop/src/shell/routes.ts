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
};

export const PRIMARY_NAV: NavItem[] = [
  { id: 'today', label: 'Today' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'planning', label: 'Planning' },
  { id: 'team', label: 'Team' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'settings', label: 'Settings' },
];

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
