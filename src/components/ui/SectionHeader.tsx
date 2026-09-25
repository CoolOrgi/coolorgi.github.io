/** The hairline + mono label row that opens every section: "(02)  Selected Works  ·  03" */
export function SectionHeader({
  index,
  title,
  aside,
}: {
  index: string;
  title: string;
  aside?: string;
}) {
  return (
    <div className="type-meta grid grid-cols-[auto_1fr_auto] gap-4 border-t border-hairline pt-4 text-ash md:grid-cols-4">
      <span className="text-bone">({index})</span>
      <span className="pl-2 md:pl-0">{title}</span>
      <span className="hidden md:block" />
      <span className="text-right">{aside}</span>
    </div>
  );
}
