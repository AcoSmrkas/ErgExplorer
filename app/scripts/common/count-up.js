// Counts a summary card's figures up from zero the first time they show. render(t) draws them at t
// of their final value (0 to 1, eased). A later call for the same element, like the redraw once
// prices are in, stops any count still running and draws the final values.
function countUp(element, render, duration = 900) {
	if (!element) return;

	const token = {};
	const first = !element.dataset.counted;
	element.dataset.counted = '1';
	element._countUpToken = token;
	element.style.fontVariantNumeric = 'tabular-nums';

	if (!first || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		render(1);
		return;
	}

	const start = performance.now();
	const step = function(now) {
		if (element._countUpToken !== token) return;

		const t = Math.min(1, (now - start) / duration);
		render(1 - Math.pow(1 - t, 3));

		if (t < 1) requestAnimationFrame(step);
	};

	render(0);
	requestAnimationFrame(step);
}
