type Props = {
  title: string;
  actionHint: string;
};

export function EmptyState({ title, actionHint }: Props) {
  return (
    <div className="empty" role="status">
      <strong>{title}</strong>
      <p className="muted" style={{ margin: '0.35rem 0 0' }}>
        {actionHint}
      </p>
    </div>
  );
}
