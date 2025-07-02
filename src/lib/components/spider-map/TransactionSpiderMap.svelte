<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import * as d3 from 'd3';
	import { getTransactionDetails } from '$lib/services/spiderMapService.js';
	import { formatErgValue, formatAddress } from '$lib/utils/formatting.js';
	import { addressBook, getOwner } from '$lib/stores/addressBook.js';

	export let txId;
	export let showLegend = true;

	let container;
	let svg;
	let simulation;
	let nodes = [];
	let links = [];
	let nodeById = new Map();
	let nodeByBoxId = new Map(); // Track nodes by boxId to avoid duplicates
	let expandedNodes = new Set();
	let loading = false;
	let error = null;
	let dragStartTime = 0;
	let dragDistance = 0;
	let currentAddressBook = [];

	// Visualization constants
	const width = 800;
	const height = 600;
	const nodeRadius = 35;
	const centralNodeRadius = 50;

	onMount(() => {
		if (browser && txId) {
			initializeVisualization();
			loadRootTransaction();
		}
		
		// Subscribe to address book updates
		const unsubscribe = addressBook.subscribe(value => {
			currentAddressBook = value;
			// Re-render visualization when addressbook changes
			if (nodes.length > 0) {
				updateVisualization();
			}
		});
		
		return unsubscribe;
	});

	onDestroy(() => {
		if (simulation) {
			simulation.stop();
		}
	});

	$: if (browser && txId && container) {
		loadRootTransaction();
	}

	function initializeVisualization() {
		// Clear any existing SVG
		d3.select(container).selectAll('*').remove();

		// Create SVG
		svg = d3.select(container)
			.append('svg')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('viewBox', `0 0 ${width} ${height}`)
			.style('background', 'transparent');

		// Add zoom behavior
		const zoom = d3.zoom()
			.scaleExtent([0.1, 3])
			.on('zoom', (event) => {
				svg.select('g').attr('transform', event.transform);
			});

		svg.call(zoom);

		// Create main group for zoomable content
		svg.append('g');

		// Initialize force simulation
		simulation = d3.forceSimulation()
			.force('link', d3.forceLink().id(d => d.id).distance(180))
			.force('charge', d3.forceManyBody().strength(-600))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide().radius(d => d.type === 'root' ? 80 : 70));
	}

	async function loadRootTransaction() {
		if (!txId) return;

		loading = true;
		error = null;

		try {
			const transaction = await getTransactionDetails(txId);
			console.log('Loaded transaction:', transaction);
			console.log('Transaction inputs:', transaction?.inputs?.length || 0);
			console.log('Transaction outputs:', transaction?.outputs?.length || 0);
			
			// Create root node
			const rootNode = {
				id: txId,
				type: 'root',
				data: transaction,
				x: width / 2,
				y: height / 2,
				fx: width / 2, // Fix position initially
				fy: height / 2
			};

			nodes = [rootNode];
			links = [];
			nodeById.clear();
			nodeByBoxId.clear();
			nodeById.set(txId, rootNode);
			expandedNodes.clear(); // Reset expanded nodes

			// Add input and output nodes
			await expandTransaction(rootNode);
			
			updateVisualization();
		} catch (err) {
			console.error('Error loading transaction:', err);
			error = 'Failed to load transaction. Please check the transaction ID.';
		} finally {
			loading = false;
		}
	}

	async function expandTransaction(node) {
		if (expandedNodes.has(node.id)) {
			console.log('Node already expanded:', node.id);
			return;
		}
		
		expandedNodes.add(node.id);
		const transaction = node.data;
		console.log('Expanding transaction:', node.id, transaction);

		// Add input nodes (from previous transactions)
		console.log('Processing inputs:', transaction.inputs?.length || 0);
		for (const input of transaction.inputs || []) {
			console.log('Processing input:', input);
			if (input.outputTransactionId && input.outputTransactionId !== node.id && input.boxId) {
				// Check if we already have a node for this box (by boxId)
				let inputNode = nodeByBoxId.get(input.boxId);
				let sourceNodeId;
				
				if (inputNode) {
					// Reuse existing box node and update its type to 'both' if it was an output
					sourceNodeId = inputNode.id;
					if (inputNode.type === 'output') {
						inputNode.type = 'both'; // Box serves as both input and output
						console.log('Updated box type to "both":', input.boxId);
					}
					console.log('Reusing existing box node:', input.boxId, 'as', sourceNodeId);
				} else {
					// Create new input node
					const inputNodeId = `input-${input.outputTransactionId}`;
					
					if (!nodeById.has(inputNodeId)) {
						inputNode = {
							id: inputNodeId,
							type: 'input',
							txId: input.outputTransactionId,
							data: input,
							boxId: input.boxId
						};
						
						nodes.push(inputNode);
						nodeById.set(inputNodeId, inputNode);
						nodeByBoxId.set(input.boxId, inputNode);
					}
					sourceNodeId = inputNodeId;
				}

				// Create link (avoid duplicate links)
				const linkKey = `${sourceNodeId}->${node.id}`;
				const existingLink = links.find(l => 
					(l.source === sourceNodeId || l.source.id === sourceNodeId) && 
					(l.target === node.id || l.target.id === node.id)
				);
				
				if (!existingLink) {
					links.push({
						source: sourceNodeId,
						target: node.id,
						type: 'input',
						value: input.value || 0
					});
				}
			}
		}

		// Add output nodes (boxes that can be spent in future transactions)
		console.log('Processing outputs:', transaction.outputs?.length || 0);
		for (let i = 0; i < (transaction.outputs || []).length; i++) {
			const output = transaction.outputs[i];
			console.log('Processing output:', i, output);
			
			if (output.boxId) {
				// Check if we already have a node for this box (by boxId)
				let outputNode = nodeByBoxId.get(output.boxId);
				let targetNodeId;
				
				if (outputNode) {
					// Reuse existing box node and update its type to 'both' if it was an input
					targetNodeId = outputNode.id;
					if (outputNode.type === 'input') {
						outputNode.type = 'both'; // Box serves as both input and output
						console.log('Updated box type to "both":', output.boxId);
					}
					console.log('Reusing existing box node:', output.boxId, 'as', targetNodeId);
				} else {
					// Create new output node
					const outputNodeId = `output-${node.id}-${i}`;
					
					if (!nodeById.has(outputNodeId)) {
						// Check if output is spent by looking for spentTransactionId
						const isSpent = !!(output.spentTransactionId);
						
						outputNode = {
							id: outputNodeId,
							type: 'output',
							txId: node.id,
							data: {
								...output,
								isSpent: isSpent
							},
							boxId: output.boxId,
							outputIndex: i
						};
						
						nodes.push(outputNode);
						nodeById.set(outputNodeId, outputNode);
						nodeByBoxId.set(output.boxId, outputNode);
					}
					targetNodeId = outputNodeId;
				}

				// Create link (avoid duplicate links)
				const existingLink = links.find(l => 
					(l.source === node.id || l.source.id === node.id) && 
					(l.target === targetNodeId || l.target.id === targetNodeId)
				);
				
				if (!existingLink) {
					links.push({
						source: node.id,
						target: targetNodeId,
						type: 'output',
						value: output.value || 0
					});
				}
			}
		}
	}

	async function handleNodeClick(event, d) {
		// Prevent drag from triggering click
		if (event.defaultPrevented) return;
		
		// Ignore clicks that were actually drags
		if (dragDistance > 5) return;
		
		console.log('Node clicked:', d);
		console.log('Node data:', d.data);
		console.log('Has spentTransactionId?', !!d.data.spentTransactionId);
		
		if (d.type === 'input') {
			// For input boxes, load the transaction that created this box
			if (d.data.outputTransactionId && !nodeById.has(d.data.outputTransactionId)) {
				try {
					loading = true;
					const transaction = await getTransactionDetails(d.data.outputTransactionId);
					
					if (transaction) {
						// Position new transaction node strategically to avoid crossing root
						const angle = Math.atan2(d.y - height/2, d.x - width/2);
						const distance = 350; // Distance from the clicked box
						const newX = d.x + Math.cos(angle) * distance;
						const newY = d.y + Math.sin(angle) * distance;

						// Create transaction node with better positioning
						const txNode = {
							id: d.data.outputTransactionId,
							type: 'transaction', 
							data: transaction,
							x: newX,
							y: newY
						};
						nodes.push(txNode);
						nodeById.set(d.data.outputTransactionId, txNode);

						// Create link from the new transaction to this input box
						links.push({
							source: d.data.outputTransactionId,
							target: d.id,
							type: 'output', // Use output type consistently - the box is an output of the loaded transaction
							value: d.data.value || 0
						});

						// Expand the new transaction to show its other inputs/outputs
						await expandTransaction(txNode);
						updateVisualization();
					}
				} catch (err) {
					console.error('Error loading input transaction:', err);
					error = `Failed to load transaction: ${d.data.outputTransactionId}`;
					setTimeout(() => error = null, 3000);
				} finally {
					loading = false;
				}
			}
		} else if (d.type === 'output' && d.data.spentTransactionId) {
			// For spent output boxes, load the spending transaction
			console.log('Spent output clicked, spentTransactionId:', d.data.spentTransactionId);
			console.log('Node already exists?', nodeById.has(d.data.spentTransactionId));
			if (!nodeById.has(d.data.spentTransactionId)) {
				try {
					loading = true;
					const spendingTransaction = await getTransactionDetails(d.data.spentTransactionId);
					
					if (spendingTransaction) {
						// Position new transaction node strategically
						const angle = Math.atan2(d.y - height/2, d.x - width/2);
						const distance = 350;
						const newX = d.x + Math.cos(angle) * distance;
						const newY = d.y + Math.sin(angle) * distance;

						// Create spending transaction node
						const spendingTxNode = {
							id: d.data.spentTransactionId,
							type: 'transaction',
							data: spendingTransaction,
							x: newX,
							y: newY
						};
						nodes.push(spendingTxNode);
						nodeById.set(d.data.spentTransactionId, spendingTxNode);

						// Create link from this output box to the spending transaction
						links.push({
							source: d.id,
							target: d.data.spentTransactionId,
							type: 'input', // Use input type since the box becomes an input to the spending transaction
							value: d.data.value || 0
						});

						// Expand the spending transaction to show its other inputs/outputs
						await expandTransaction(spendingTxNode);
						updateVisualization();
					}
				} catch (err) {
					console.error('Error loading spending transaction:', err);
					console.error('Failed spentTransactionId:', d.data.spentTransactionId);
					error = `Failed to load spending transaction: ${d.data.spentTransactionId}`;
					setTimeout(() => error = null, 3000);
				} finally {
					loading = false;
				}
			}
		} else if (d.type === 'output' && !d.data.spentTransactionId) {
			// For unspent output boxes, just log - no alert
			console.log('Unspent output box clicked - still available to be spent');
		} else if (d.type === 'transaction' && !expandedNodes.has(d.id)) {
			// Expand transaction to show its inputs/outputs
			try {
				loading = true;
				await expandTransaction(d);
				updateVisualization();
			} catch (err) {
				console.error('Error expanding transaction:', err);
			} finally {
				loading = false;
			}
		}
		
		// Navigate to detail page on double-click
		if (event.detail === 2) { // Double click
			if (d.type === 'root' || d.type === 'transaction') {
				window.open(`/transactions/${d.id}`, '_blank');
			} else if (d.type === 'input' || d.type === 'output') {
				window.open(`/boxes/${d.boxId}`, '_blank');
			}
		}
	}

	function updateVisualization() {
		if (!svg) return;

		const g = svg.select('g');

		// Update links
		const link = g.selectAll('.link')
			.data(links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

		link.exit().remove();

		const linkEnter = link.enter()
			.append('line')
			.attr('class', 'link')
			.attr('stroke', d => {
				switch (d.type) {
					case 'input': return '#3f51b5'; // Indigo
					case 'output': return '#009688'; // Teal
					case 'creation': return '#4caf50'; // Green
					default: return '#2196f3'; // Blue
				}
			})
			.attr('stroke-width', d => Math.min(6, Math.max(2, Math.log(d.value + 1))))
			.attr('stroke-opacity', 0.7)
			.attr('stroke-dasharray', 'none');

		// Update nodes
		const node = g.selectAll('.node')
			.data(nodes, d => d.id);

		node.exit().remove();

		const nodeEnter = node.enter()
			.append('g')
			.attr('class', 'node')
			.style('cursor', 'pointer')
			.on('click', handleNodeClick)
			.call(d3.drag()
				.on('start', dragStarted)
				.on('drag', dragged)
				.on('end', dragEnded));

		// Update existing nodes (for when type changes)
		const nodeUpdate = node.merge(nodeEnter);
		nodeUpdate.selectAll('*').remove(); // Clear existing content
		const nodeGroups = nodeUpdate.append('g').attr('class', 'node-content');

		// Add background rectangles/cards
		nodeGroups
			.append('rect')
			.attr('width', d => d.type === 'root' ? 120 : 110)
			.attr('height', d => d.type === 'root' ? 80 : (d.type === 'input' || d.type === 'output' || d.type === 'both') ? 85 : 60)
			.attr('x', d => d.type === 'root' ? -60 : -55)
			.attr('y', d => d.type === 'root' ? -40 : (d.type === 'input' || d.type === 'output' || d.type === 'both') ? -42 : -30)
			.attr('rx', 12)
			.attr('ry', 12)
			.attr('fill', d => {
				switch (d.type) {
					case 'root': return 'rgba(255, 152, 0, 0.95)'; // Orange
					case 'input': return 'rgba(63, 81, 181, 0.95)'; // Indigo
					case 'output': 
						// Different colors for spent vs unspent outputs
						return d.data.isSpent ? 'rgba(0, 150, 136, 0.95)' : 'rgba(0, 150, 136, 0.65)'; // Teal
					case 'both': return 'rgba(156, 39, 176, 0.95)'; // Purple - serves as both input and output
					case 'transaction': return 'rgba(76, 175, 80, 0.95)'; // Green
					default: return 'rgba(33, 150, 243, 0.95)'; // Blue
				}
			})
			.attr('stroke', d => {
				if (d.type === 'output') {
					return d.data.isSpent ? '#fff' : '#666';
				} else if (d.type === 'both') {
					return '#fff'; // White outline for boxes that serve both roles
				}
				return '#fff';
			})
			.attr('stroke-width', d => {
				if (d.type === 'output') {
					return d.data.isSpent ? 3 : 2;
				} else if (d.type === 'both') {
					return 3; // Thicker outline for both-type boxes
				}
				return 2;
			})
			.attr('stroke-dasharray', d => {
				if (d.type === 'output' && !d.data.isSpent) {
					return '5,5'; // Dashed border for unspent
				}
				return 'none';
			})
			.style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

		// Add type badges
		nodeGroups
			.append('rect')
			.attr('width', d => d.type === 'root' ? 50 : (d.type === 'input' || d.type === 'output' || d.type === 'both') ? 50 : 40)
			.attr('height', 16)
			.attr('x', d => d.type === 'root' ? -25 : (d.type === 'input' || d.type === 'output' || d.type === 'both') ? -25 : -20)
			.attr('y', d => d.type === 'root' ? -35 : -30)
			.attr('rx', 8)
			.attr('fill', 'rgba(0,0,0,0.7)')
			.attr('stroke', 'none');

		// Add type labels
		nodeGroups
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', d => d.type === 'root' ? -25 : -20)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.attr('fill', '#fff')
			.text(d => {
				switch (d.type) {
					case 'root': return 'ROOT';
					case 'input': return 'INPUT';
					case 'output': return 'OUTPUT';
					case 'both': return 'I/O';
					case 'transaction': return 'TX';
					default: return d.type.toUpperCase();
				}
			});

		// Add main ID labels
		nodeGroups
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', d => d.type === 'root' ? -5 : 0)
			.attr('font-size', d => d.type === 'root' ? '11px' : '10px')
			.attr('font-weight', 'bold')
			.attr('font-family', 'monospace')
			.attr('fill', '#000')
			.text(d => {
				if (d.type === 'root' || d.type === 'transaction') {
					return formatAddress(d.id, 8, 4);
				} else if (d.type === 'input' || d.type === 'output') {
					return formatAddress(d.boxId || 'Unknown', 7, 3);
				}
				return '';
			});

		// Add value labels for boxes
		nodeGroups
			.filter(d => d.type === 'input' || d.type === 'output' || d.type === 'both')
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', 15)
			.attr('font-size', '10px')
			.attr('font-weight', '600')
			.attr('fill', '#000')
			.text(d => {
				if (d.data.value) {
					const ergValue = parseFloat(d.data.value) / 1000000000;
					if (ergValue >= 1) {
						return `${ergValue.toFixed(1)} ERG`;
					} else if (ergValue >= 0.001) {
						return `${ergValue.toFixed(3)} ERG`;
					} else {
						return `${(ergValue * 1000).toFixed(1)}m ERG`;
					}
				}
				return 'No value';
			});

		// Add address labels for boxes
		nodeGroups
			.filter(d => d.type === 'input' || d.type === 'output' || d.type === 'both')
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', 28)
			.attr('font-size', '8px')
			.attr('font-weight', '600')
			.attr('font-family', 'monospace')
			.attr('fill', '#fff')
			.attr('stroke', '#000')
			.attr('stroke-width', '0.5')
			.text(d => {
				if (d.data.address) {
					// Check if address has a name in addressbook
					const ownerName = getOwner(d.data.address, currentAddressBook);
					if (ownerName && ownerName !== 'Unknown') {
						return ownerName.length > 12 ? ownerName.substring(0, 10) + '...' : ownerName;
					}
					return formatAddress(d.data.address, 6, 4);
				}
				return 'No address';
			});

		// Add asset count for boxes
		nodeGroups
			.filter(d => d.type === 'input' || d.type === 'output' || d.type === 'both')
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', 38)
			.attr('font-size', '9px')
			.attr('font-weight', '600')
			.attr('fill', '#fff')
			.attr('stroke', '#000')
			.attr('stroke-width', '0.5')
			.text(d => {
				const assetCount = d.data.assets?.length || 0;
				return assetCount > 0 ? `+${assetCount} asset${assetCount !== 1 ? 's' : ''}` : '';
			});

		// Add clickable indicator for spent outputs
		nodeGroups
			.filter(d => d.type === 'output' && d.data.spentTransactionId)
			.append('text')
			.attr('text-anchor', 'start')
			.attr('x', -50)
			.attr('y', -32)
			.attr('font-size', '8px')
			.attr('font-weight', 'bold')
			.attr('fill', '#009688')
			.text('Click →');

		// Add popup hover attributes for proper popups
		nodeUpdate.each(function(d) {
			const element = d3.select(this);
			if (d.type === 'root' || d.type === 'transaction') {
				element.attr('data-transaction-hover', d.id);
			} else if ((d.type === 'input' || d.type === 'output' || d.type === 'both') && d.boxId) {
				element.attr('data-box-id', d.boxId);
			}
		});

		// Update simulation
		simulation.nodes(nodes);
		simulation.force('link').links(links);
		simulation.alpha(0.3).restart();

		// Update positions on tick
		simulation.on('tick', () => {
			g.selectAll('.link')
				.attr('x1', d => d.source.x)
				.attr('y1', d => d.source.y)
				.attr('x2', d => d.target.x)
				.attr('y2', d => d.target.y);

			g.selectAll('.node')
				.attr('transform', d => `translate(${d.x},${d.y})`);
		});
	}

	function dragStarted(event, d) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
		dragStartTime = Date.now();
		dragDistance = 0;
	}

	function dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
		
		// Calculate drag distance
		const dx = event.x - d.x;
		const dy = event.y - d.y;
		dragDistance += Math.sqrt(dx * dx + dy * dy);
	}

	function dragEnded(event, d) {
		if (!event.active) simulation.alphaTarget(0);
		if (d.type !== 'root') {
			d.fx = null;
			d.fy = null;
		}
		
		// Reset drag distance after a short delay
		setTimeout(() => {
			dragDistance = 0;
		}, 100);
	}


	// Export methods for parent component
	export function updateControls(controls) {
		// Update visualization based on controls
		console.log('Controls updated:', controls);
		// TODO: Implement control filtering logic
	}

	export function resetView() {
		if (svg) {
			// Reset zoom and pan
			const zoom = d3.zoom()
				.scaleExtent([0.1, 3])
				.on('zoom', (event) => {
					svg.select('g').attr('transform', event.transform);
				});
			
			svg.transition()
				.duration(750)
				.call(zoom.transform, d3.zoomIdentity);
		}
	}

	export function exportData() {
		const data = {
			nodes: nodes.map(n => ({
				id: n.id,
				type: n.type,
				txId: n.txId,
				boxId: n.boxId
			})),
			links: links.map(l => ({
				source: typeof l.source === 'object' ? l.source.id : l.source,
				target: typeof l.target === 'object' ? l.target.id : l.target,
				type: l.type,
				value: l.value
			}))
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `transaction-spider-${txId}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="spider-map-container" bind:this={container}>
	{#if loading}
		<div class="loading-overlay">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
			<p class="mt-2">Loading transaction data...</p>
		</div>
	{/if}

	{#if error}
		<div class="error-overlay">
			<div class="alert alert-danger" role="alert">
				<i class="fas fa-exclamation-triangle me-2"></i>
				{error}
			</div>
		</div>
	{/if}

	{#if !loading && !error && nodes.length > 0 && showLegend}
		<div class="legend">
			<div class="legend-header">
				<i class="fas fa-info-circle me-2"></i>
				<strong>Legend</strong>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: #ff9800;"></div>
				<span>Root Transaction</span>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: #3f51b5;"></div>
				<span>Input Boxes</span>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: #009688;"></div>
				<span>Output Boxes (Spent)</span>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: #009688; opacity: 0.65;"></div>
				<span>Output Boxes (Unspent)</span>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: #9c27b0;"></div>
				<span>Input/Output Boxes</span>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: #4caf50;"></div>
				<span>Related Transactions</span>
			</div>
			<div class="legend-separator"></div>
			<div class="legend-item legend-line">
				<div class="line-sample" style="background-color: #3f51b5;"></div>
				<span>Input Flow</span>
			</div>
			<div class="legend-item legend-line">
				<div class="line-sample" style="background-color: #009688;"></div>
				<span>Output Flow</span>
			</div>
			<div class="legend-help">
				<small>
					<strong>Hover:</strong> View details<br>
					<strong>Click:</strong> Expand network<br>
					<strong>Double-click:</strong> Open details<br>
					<strong>Drag:</strong> Rearrange nodes
				</small>
			</div>
		</div>
	{/if}

</div>

<style>
	.spider-map-container {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		border-radius: 12px;
	}

	.loading-overlay, .error-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		z-index: 1000;
	}

	.loading-overlay p {
		color: var(--text-strong);
		margin: 0;
	}

	.legend {
		position: absolute;
		top: 10px;
		left: 10px;
		background: var(--glass-bg-medium);
		backdrop-filter: var(--glass-blur-sm);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 12px;
		z-index: 100;
		min-width: 180px;
	}

	.legend-header {
		display: flex;
		align-items: center;
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-strong);
		font-size: 12px;
	}

	.legend-header i {
		color: var(--main-color);
	}

	.legend-help {
		margin-top: 8px;
		padding-top: 6px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-muted);
		line-height: 1.3;
	}

	.legend-item {
		display: flex;
		align-items: center;
		margin-bottom: 5px;
		font-size: 12px;
		color: var(--text-strong);
	}

	.legend-item:last-child {
		margin-bottom: 0;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		margin-right: 6px;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.legend-separator {
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
		margin: 6px 0;
	}

	.legend-line .line-sample {
		width: 16px;
		height: 3px;
		border-radius: 1px;
		margin-right: 6px;
		border: none;
	}

	.legend-line .line-sample.dashed {
		background-image: repeating-linear-gradient(
			to right,
			currentColor 0px,
			currentColor 3px,
			transparent 3px,
			transparent 6px
		);
		background-size: 6px 100%;
	}

	:global(.spider-map-container svg) {
		border-radius: 12px;
	}

	:global(.spider-map-container .node:hover .node-content rect) {
		stroke-width: 3px;
		filter: brightness(1.1) drop-shadow(0 6px 12px rgba(0,0,0,0.3));
		transform: scale(1.05);
		transition: all 0.2s ease;
	}

	:global(.spider-map-container .node-content) {
		transition: all 0.2s ease;
	}

	:global(.spider-map-container .link:hover) {
		stroke-opacity: 1;
		stroke-width: 3px;
	}

</style>