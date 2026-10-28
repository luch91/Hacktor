import { useMemo } from 'react';
import type { IdeaCardV1 } from '@hacktor/contracts';

interface IdeaNode { id: string; strategy: string; visibility: string; pinned: boolean; card: IdeaCardV1 }
interface IdeaEdge { child_version_id: string; parent_version_id: string; edge_kind: string }

export function IdeaConstellation({ ideas, edges, selectedId, origin, onSelect }: {
  ideas: IdeaNode[]; edges: IdeaEdge[]; selectedId: string; origin: string; onSelect: (id: string) => void;
}) {
  const graph = useMemo(() => {
    const ids = new Set(ideas.map((idea) => idea.id));
    const parents = new Map<string, string[]>();
    for (const edge of edges) if (ids.has(edge.child_version_id) && ids.has(edge.parent_version_id)) {
      parents.set(edge.child_version_id, [...(parents.get(edge.child_version_id) || []), edge.parent_version_id]);
    }
    const depths = new Map<string, number>();
    const depth = (id: string, seen = new Set<string>()): number => {
      if (seen.has(id)) return 0;
      const cached = depths.get(id);
      if (cached !== undefined) return cached;
      const ancestors = parents.get(id) || [];
      const value = ancestors.length ? 1 + Math.max(...ancestors.map((parent) => depth(parent, new Set([...seen, id])))) : 0;
      depths.set(id, value);
      return value;
    };
    ideas.forEach((idea) => depth(idea.id));
    const columns = new Map<number, IdeaNode[]>();
    ideas.forEach((idea) => { const level = depths.get(idea.id) || 0; columns.set(level, [...(columns.get(level) || []), idea]); });
    const levels = [...columns.keys()].sort((a, b) => a - b);
    const positions = new Map<string, { x: number; y: number }>();
    for (const level of levels) columns.get(level)?.forEach((idea, index) => positions.set(idea.id, { x: 18 + level * 290, y: 120 + index * 170 }));
    const height = Math.max(510, ...[...columns.values()].map((column) => 230 + column.length * 170));
    const width = Math.max(760, 350 + (Math.max(0, ...levels) + 1) * 290);
    return { positions, height, width, parents };
  }, [ideas, edges]);

  return <div className="constellation-scroll" role="region" aria-label="Idea constellation" tabIndex={0}>
    <div className="constellation" style={{ width: graph.width, minHeight: graph.height }}>
      <div className="graph-origin"><small>ORIGIN / CONFIRMED CONTEXT</small><strong>{origin}</strong><span>Ideas without parent versions begin here.</span></div>
      <svg className="graph-lines" width={graph.width} height={graph.height} aria-hidden="true">
        <defs><marker id="graph-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="none" stroke="currentColor" /></marker></defs>
        {ideas.filter((idea) => !graph.parents.has(idea.id)).map((idea) => { const p = graph.positions.get(idea.id)!; return <path key={`origin-${idea.id}`} d={`M 165 82 C 185 82, ${p.x - 40} ${p.y + 48}, ${p.x} ${p.y + 48}`} />; })}
        {edges.filter((edge) => graph.positions.has(edge.child_version_id) && graph.positions.has(edge.parent_version_id)).map((edge) => {
          const from = graph.positions.get(edge.parent_version_id)!;
          const to = graph.positions.get(edge.child_version_id)!;
          const active = selectedId === edge.child_version_id || selectedId === edge.parent_version_id;
          return <path className={active ? 'graph-line active' : 'graph-line'} key={`${edge.child_version_id}:${edge.parent_version_id}`} d={`M ${from.x + 218} ${from.y + 48} C ${from.x + 255} ${from.y + 48}, ${to.x - 40} ${to.y + 48}, ${to.x} ${to.y + 48}`} />;
        })}
      </svg>
      {ideas.map((idea) => { const p = graph.positions.get(idea.id)!; const parentCount = graph.parents.get(idea.id)?.length || 0; return <button key={idea.id} type="button" className={`graph-node ${selectedId === idea.id ? 'selected' : ''}`} style={{ left: p.x, top: p.y }} aria-pressed={selectedId === idea.id} aria-label={`${idea.card.name}, ${idea.strategy.replaceAll('_', ' ')}, ${parentCount === 2 ? 'combined from two parents' : parentCount ? 'derived version' : 'initial direction'}`} onClick={() => onSelect(idea.id)}><small>{idea.strategy.replaceAll('_', ' ')} / {idea.id.slice(0, 8)}</small><strong>{idea.card.name}</strong><span>{idea.card.one_liner}</span><em>{parentCount === 2 ? 'Two-parent combination' : parentCount ? 'Derived direction' : 'Initial direction'} {idea.pinned ? '/ pinned' : ''}</em></button>; })}
    </div>
  </div>;
}
