import React from 'react';
import { Droppable, Plugins } from '@shopify/draggable'
import './Map.css'

export function City({ dim, stations, generators, map }) {
	function refcallback(ref) {
		if (ref) {
			// console.log(ref)
			const droppable = new Droppable(ref, {
				draggable: ".generator",
				droppable: ".station, .generators",
				plugins: [Plugins.Snappable]
			})
			droppable.on('drag:stop', ev => {
				// console.log(ev)
				ev.source.parentNode.classList.remove('draggable-droppable--occupied')
				//can still add more items if necessary
				Object.assign(map, {
					data: parseMap(ref.firstElementChild)
				})
				console.log(map)
			})
		}
	}
	return makeCity(dim, stations, generators, refcallback)
}

function parseMap(citymap) {
	const stations = Array.from(citymap.querySelectorAll('.station'))
	return stations.map(station => station.textContent)
}

function makeCity(dim, stations, generators, refcallback) {
	const [numrows, numcols] = dim
	const gridstyle = {
		display: "grid",
		gridTemplateRows: " 1fr".repeat(numrows).slice(1),
		gridTemplateColumns: " 1fr".repeat(numcols).slice(1)
	}
	return <div className="city" ref={refcallback}>
		<div className="map" style={gridstyle}>
			{stations.map(([row, col], i) =>
				<div className="station" style={{
					gridRow: `${row}/${row + 1}`,
					gridColumn: `${col}/${col + 1}`,
				}} key={`${row}${col}`}
					data-i={i}
				>
					{row},{col}
				</div>)}
		</div>
		<div className="generators">
			{generators.map((name, i) => <div className="generator" key={name} style={{ order: i }}>{name}</div>)}
		</div>
	</div>
}