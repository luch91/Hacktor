import { useEffect, useRef } from 'react';

const movements = [
  { number: '01', title: 'Read the signal.', detail: 'Start with the challenge as it is, including what is known and what is still uncertain.', kind: 'signal' },
  { number: '02', title: 'Open the field.', detail: 'Nine strategies make room for distinct directions. Each new version keeps its lineage.', kind: 'field' },
  { number: '03', title: 'Trace a way forward.', detail: 'Select one exact idea version and carry its decisions into a buildable blueprint.', kind: 'resolve' },
] as const;

export function MotionSequence() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!section.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.18 });
    section.current.querySelectorAll('.motion-scene').forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  return <section className="motion-sequence" aria-labelledby="motion-heading" ref={section}>
    <div className="motion-sequence-intro"><span className="eyebrow">A THOUGHT IN MOTION / 001-003</span><h2 id="motion-heading">From a single point<br />to a path you can build.</h2><p>Follow the same thread through interpretation, exploration, and a chosen direction.</p></div>
    {movements.map((movement) => <article className={`motion-scene motion-${movement.kind}`} key={movement.number}>
      <div className="motion-scene-caption"><span>{movement.number} / 03</span><h3>{movement.title}</h3><p>{movement.detail}</p></div>
      <div className="motion-graphic" aria-hidden="true">
        <svg viewBox="0 0 800 430" preserveAspectRatio="xMidYMid meet">
          <circle className="motion-halo" cx="400" cy="215" r="148" />
          <path className="motion-line motion-line-one" d="M400 215 C330 165 260 125 145 100" />
          <path className="motion-line motion-line-two" d="M400 215 C470 155 565 120 685 96" />
          <path className="motion-line motion-line-three" d="M400 215 C490 260 580 310 680 338" />
          <path className="motion-line motion-line-four" d="M400 215 C320 280 250 320 132 340" />
          <circle className="motion-center" cx="400" cy="215" r="35" />
          <circle className="motion-node motion-node-one" cx="145" cy="100" r="13" />
          <circle className="motion-node motion-node-two" cx="685" cy="96" r="13" />
          <circle className="motion-node motion-node-three" cx="680" cy="338" r="13" />
          <circle className="motion-node motion-node-four" cx="132" cy="340" r="13" />
          <text x="400" y="220" textAnchor="middle">IDEA</text>
        </svg>
        <span className="motion-graphic-label">{movement.kind === 'signal' ? 'ORIGIN / THE BRIEF' : movement.kind === 'field' ? 'DIRECTIONS / POSSIBILITIES' : 'SELECT / BUILD'}</span>
      </div>
    </article>)}
    <p className="motion-disclosure">Illustrative motion. Your own idea relationships appear in Studio after generation.</p>
  </section>;
}
