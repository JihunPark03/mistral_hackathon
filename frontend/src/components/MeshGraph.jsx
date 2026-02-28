import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const SKILL_COLORS = {
  writing: '#34d399',
  voice: '#a78bfa',
  image: '#fbbf24',
  code: '#22d3ee',
  orchestration: '#fb7185',
}

export default function MeshGraph({ topology, events }) {
  const svgRef = useRef(null)
  const simulationRef = useRef(null)

  useEffect(() => {
    if (!topology || !topology.nodes.length) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    svg.selectAll('*').remove()

    // Defs for glow filter
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'rgba(255,255,255,0.3)')

    const nodes = topology.nodes.map(n => ({ ...n }))
    const links = topology.edges.map(e => ({
      ...e,
      source: nodes.find(n => n.id === e.source),
      target: nodes.find(n => n.id === e.target),
    })).filter(l => l.source && l.target)

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(140).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45))

    simulationRef.current = simulation

    const g = svg.append('g')

    // Zoom
    svg.call(
      d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)')

    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // Node circles
    node.append('circle')
      .attr('r', 22)
      .attr('fill', d => {
        const skill = d.skills?.[0]
        return SKILL_COLORS[skill] || '#5c7cfa'
      })
      .attr('fill-opacity', 0.15)
      .attr('stroke', d => {
        const skill = d.skills?.[0]
        return SKILL_COLORS[skill] || '#5c7cfa'
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .style('filter', 'url(#glow)')

    // Status dot
    node.append('circle')
      .attr('cx', 16)
      .attr('cy', -16)
      .attr('r', 4)
      .attr('fill', d => d.status === 'available' ? '#4ade80' : d.status === 'busy' ? '#fbbf24' : '#6b7280')

    // Labels
    node.append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 38)
      .attr('fill', 'white')
      .attr('font-size', '11px')
      .attr('font-weight', '500')

    // Role sublabel
    node.append('text')
      .text(d => d.role)
      .attr('text-anchor', 'middle')
      .attr('dy', 52)
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('font-size', '9px')

    // Emoji inside node
    node.append('text')
      .text(d => {
        const map = { pencil: '✍️', microphone: '🎙️', palette: '🎨', terminal: '💻', network: '🕸️' }
        return map[d.avatar] || '🤖'
      })
      .attr('text-anchor', 'middle')
      .attr('dy', 6)
      .attr('font-size', '18px')

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => simulation.stop()
  }, [topology])

  // Animate edges on events
  useEffect(() => {
    if (!events.length) return
    const latest = events[events.length - 1]
    if (latest.type === 'subtask_started' || latest.type === 'handoff') {
      const svg = d3.select(svgRef.current)
      svg.selectAll('line')
        .transition()
        .duration(300)
        .attr('stroke', 'rgba(92, 124, 250, 0.6)')
        .attr('stroke-width', 3)
        .transition()
        .duration(600)
        .attr('stroke', 'rgba(255,255,255,0.12)')
        .attr('stroke-width', 1.5)
    }
  }, [events])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  )
}
