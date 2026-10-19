import { PRIMARY_NAV, type PrimaryRouteId, primaryOf, type RouteId } from './routes';

type Props = {
  route: RouteId;
  onNavigate: (id: PrimaryRouteId) => void;
};

export function Nav({ route, onNavigate }: Props) {
  const activePrimary = primaryOf(route);
  return (
    <nav className="nav" aria-label="Primary">
      {PRIMARY_NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          className={activePrimary === item.id ? 'active' : undefined}
          aria-current={activePrimary === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
