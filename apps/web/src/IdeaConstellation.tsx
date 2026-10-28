import { useEffect, useMemo, useRef } from 'react';
import type { IdeaCardV1 } from '@hacktor/contracts';

interface IdeaNode { id: string; strategy: string; visibility: string; pinned: boolean; card: IdeaCardV1 }
interface IdeaEdge { child_version_id: string; parent_version_id: string; edge_kind: string }

export function IdeaConstellation({ ideas, edges, selectedId, origin, onSelect }: {
  ideas: IdeaNode[]; edges: IdeaEdge[]; selectedId: string; origin: string; onSelect: (id: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = [...(viewport.current?.querySelectorAll<HTMLButtonElement>('[data-idea-id]') || [])].find((item) => item.dataset.ideaId === selectedId);
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [selectedId]);
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
    const roots = ideas.filter((idea) => !parents.has(idea.id));
    const positions = new Map<string, { x: number; y: number }>();
    roots.forEach((idea, index) => positions.set(idea.id, { x: 205 + (index % 3) * 250, y: 130 + Math.floor(index / 3) * 190 }));
    const occupied = new Map<number, number[]>();
    for (const level of [...new Set(depths.values())].filter((value) => value > 0).sort((a, b) => a - b)) {
      for (const idea of ideas.filter((item) => depths.get(item.id) === level)) {
        const ancestors = (parents.get(idea.id) || []).map((id) => positions.get(id)).filter((point) => point !== undefined);
        const desired = ancestors.length ? ancestors.reduce((sum, point) => sum + point.y, 0) / ancestors.length : 130;
        const x = 975 + (level - 1) * 270;
        const used = occupied.get(x) || [];
        let y = Math.max(130, desired);
        while (used.some((other) => Math.abs(other - y) < 190)) y += 200;
        used.push(y);
        occupied.set(x, used);
        positions.set(idea.id, { x, y });
      }
    }
    const height = Math.max(730, ...[...positions.values()].map((point) => point.y + 190));
    const width = Math.max(910, ...[...positions.values()].map((point) => point.x + 250));
    return { positions, height, width, parents };
  }, [ideas, edges]);

  return <div ref={viewport} className="constellation-scroll" role="region" aria-label="Idea constellation" tabIndex={0}>
    <div className="constellation" style={{ width: graph.width, minHeight: graph.height }}>
      <div className="graph-origin"><small>ORIGIN / CONFIRMED CONTEXT</small><strong>{origin}</strong><span>Ideas without parent versions begin here.</span></div>
      <svg className="graph-lines" width={graph.width} height={graph.height} aria-hidden="true">
        <defs><marker id="graph-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="none" stroke="currentColor" /></marker></defs>
        {ideas.filter((idea) => !graph.parents.has(idea.id)).map((idea) => { const p = graph.positions.get(idea.id)!; return <path key={`origin-${idea.id}`} d={`M 165 375 C 180 375, ${p.x - 35} ${p.y + 85}, ${p.x} ${p.y + 85}`} />; })}
        {edges.filter((edge) => graph.positions.has(edge.child_version_id) && graph.positions.has(edge.parent_version_id)).map((edge) => {
          const from = graph.positions.get(edge.parent_version_id)!;
          const to = graph.positions.get(edge.child_version_id)!;
          const active = selectedId === edge.child_version_id || selectedId === edge.parent_version_id;
          return <path className={active ? 'graph-line active' : 'graph-line'} key={`${edge.child_version_id}:${edge.parent_version_id}`} d={`M ${from.x + 218} ${from.y + 85} C ${from.x + 255} ${from.y + 85}, ${to.x - 40} ${to.y + 85}, ${to.x} ${to.y + 85}`} />;
        })}
      </svg>
      {ideas.map((idea) => { const p = graph.positions.get(idea.id)!; const parentCount = graph.parents.get(idea.id)?.length || 0; return <button key={idea.id} type="button" data-idea-id={idea.id} className={`graph-node ${selectedId === idea.id ? 'selected' : ''}`} style={{ left: p.x, top: p.y }} aria-pressed={selectedId === idea.id} aria-label={`${idea.card.name}, ${idea.strategy.replaceAll('_', ' ')}, ${parentCount === 2 ? 'combined from two parents' : parentCount ? 'derived version' : 'initial direction'}`} onClick={() => onSelect(idea.id)}><small>{idea.strategy.replaceAll('_', ' ')} / {idea.id.slice(0, 8)}</small><strong>{idea.card.name}</strong><span>{idea.card.one_liner}</span><em>{parentCount === 2 ? 'Two-parent combination' : parentCount ? 'Derived direction' : 'Initial direction'} {idea.pinned ? '/ pinned' : ''}</em></button>; })}
    </div>
  </div>;
}
