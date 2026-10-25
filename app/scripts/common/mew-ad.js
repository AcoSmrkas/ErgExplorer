// Mew Finance banner (partials/mew-ad.njk): scene carousel, blinking, eye tracking and peeking cats.
(function () {
	'use strict';

	var SCENE_MS = 4600;
	var PEEKS = { 1: 'up', 3: 'down', 5: 'up' };
	var SLOTS = ['is-on', 'is-next', 'is-prev', 'is-gone-l', 'is-gone-r', 'is-intro'];

	function init(ad) {
		var scenes = ad.querySelectorAll('.mew-ad__scene');
		var lines = ad.querySelectorAll('.mew-ad__line');
		var n = scenes.length;
		var logo = ad.querySelector('.mew-ad__logo');
		var stage = ad.querySelector('.mew-ad__stage');
		var halo = ad.querySelector('.mew-ad__halo');
		var burst = ad.querySelector('.mew-ad__burst');
		var peeks = {
			up: ad.querySelector('.mew-ad__peek--up'),
			down: ad.querySelector('.mew-ad__peek--down')
		};

		var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var current = parseInt(ad.getAttribute('data-scene'), 10) || 0;
		var running = false;
		var hovering = false;
		var onScreen = true;
		var ready = false;
		var sceneDue = 0;
		var remaining = SCENE_MS;
		var timers = {};
		var lastMove = 0;

		function later(key, fn, ms) {
			clearTimeout(timers[key]);
			timers[key] = setTimeout(fn, ms);
		}

		function clearTimers() {
			for (var key in timers) {
				clearTimeout(timers[key]);
			}
			timers = {};
		}

		// restart a CSS animation class
		function replay(el, cls, ms) {
			el.classList.remove(cls);
			void el.getBoundingClientRect();
			el.classList.add(cls);
			later(cls + 'Off', function () {
				el.classList.remove(cls);
			}, ms);
		}

		function load(img) {
			if (img && !img.getAttribute('src')) {
				img.src = img.getAttribute('data-src');
			}
			return img;
		}

		function loadImg(i) {
			return load(scenes[(i + n) % n].querySelector('img[data-src]'));
		}

		// a cat peeks in from the edge unless it is hidden at this size or already out
		function peekOut(name, ms) {
			var peek = peeks[name];
			if (reduced || !peek || peek.offsetParent === null || peek.classList.contains('is-peek')) {
				return;
			}
			load(peek.querySelector('img'));
			later('peek-' + name, function () {
				peek.classList.add('is-peek');
			}, ms);
		}

		// wrap tagline words so they can rise one after another
		function splitWords(line) {
			var i = 0;
			(function walk(node) {
				Array.prototype.slice.call(node.childNodes).forEach(function (child) {
					if (child.nodeType === 1) {
						walk(child);
						return;
					}
					if (child.nodeType !== 3) {
						return;
					}
					var frag = document.createDocumentFragment();
					child.textContent.split(/(\s+)/).forEach(function (part) {
						if (!part) {
							return;
						}
						if (/^\s+$/.test(part)) {
							frag.appendChild(document.createTextNode(part));
							return;
						}
						var w = document.createElement('span');
						w.className = 'mew-ad__w';
						w.style.setProperty('--i', i++);
						w.textContent = part;
						frag.appendChild(w);
					});
					node.replaceChild(frag, child);
				});
			})(line);
		}

		// eyes: x and y from -1 to 1
		function look(x, y) {
			logo.style.setProperty('--ex', (x * 34).toFixed(1));
			logo.style.setProperty('--ey', (y * 24).toFixed(1));
			logo.style.setProperty('--tilt', (x * 4).toFixed(2));
		}

		function idle() {
			return Date.now() - lastMove > 2500;
		}

		function slotOf(i) {
			var d = (i - current + n) % n;
			if (d === 0) {
				return 'is-on';
			}
			if (d === 1) {
				return 'is-next';
			}
			if (d === n - 1) {
				return 'is-prev';
			}
			return d === n - 2 ? 'is-gone-l' : 'is-gone-r';
		}

		function place(intro) {
			Array.prototype.forEach.call(scenes, function (scene, i) {
				var slot = slotOf(i);
				var wasLeft = scene.classList.contains('is-gone-l') || (intro && slot === 'is-prev');
				if (wasLeft && slot !== 'is-gone-l') {
					// jump to the side it comes in from without animating
					scene.classList.add('is-snap');
					scene.classList.remove.apply(scene.classList, SLOTS);
					scene.classList.add(slot === 'is-prev' ? 'is-gone-l' : 'is-gone-r');
					void scene.offsetWidth;
					scene.classList.remove('is-snap');
				}
				scene.classList.remove.apply(scene.classList, SLOTS);
				scene.classList.add(slot);
				if (intro && slot === 'is-on') {
					scene.classList.add('is-intro');
				}
			});
		}

		function enter(i) {
			halo.style.color = scenes[i].getAttribute('data-halo');
			if (reduced) {
				return;
			}
			later('land', function () {
				replay(burst, 'is-go', 950);
				replay(stage, 'is-land', 850);
			}, ready ? 420 : 0);
			replay(logo, i % 2 ? 'is-perk' : 'is-twitch', 600);

			// glance at the new scene while the pointer is still
			if (idle()) {
				look(1, 0.25);
				later('glance', function () {
					if (idle()) {
						look(0, 0);
					}
				}, 1500);
			}

			if (PEEKS[i]) {
				peekOut(PEEKS[i], 1300);
			}
		}

		function show(next) {
			var prev = current;
			current = next;
			loadImg(next + 1);
			loadImg(next + 2);

			lines[prev].classList.remove('is-on');
			if (!reduced) {
				lines[prev].classList.add('is-off');
				setTimeout(function () {
					lines[prev].classList.remove('is-off');
				}, 420);
			}
			lines[next].classList.remove('is-off');
			lines[next].classList.add('is-on');
			place(false);

			try {
				sessionStorage.setItem('mewAdScene', next);
			} catch (e) {}

			enter(next);
		}

		function schedule(ms) {
			sceneDue = Date.now() + ms;
			later('scene', function () {
				show((current + 1) % n);
				schedule(SCENE_MS);
			}, ms);
		}

		function blink() {
			if (!reduced) {
				replay(logo, 'is-blink', 220);
				if (Math.random() < 0.22) {
					later('blink2', function () {
						replay(logo, 'is-blink', 220);
					}, 330);
				}
			}
			later('blink', blink, 2200 + Math.random() * 3200);
		}

		function start() {
			if (running || !ready) {
				return;
			}
			running = true;
			ad.classList.remove('is-paused');
			if (!hovering) {
				schedule(remaining);
			}
			later('blink', blink, 1800);
		}

		function stop() {
			if (!running) {
				return;
			}
			running = false;
			ad.classList.add('is-paused');
			remaining = Math.max(600, sceneDue - Date.now());
			clearTimers();
		}

		function update() {
			if (onScreen && !document.hidden) {
				start();
			} else {
				stop();
			}
		}

		function begin() {
			if (ready) {
				return;
			}
			place(true);
			enter(current);
			ready = true;
			update();

			// the peeking cats are small; fetch the ones shown at this size before their first peek
			for (var name in peeks) {
				if (peeks[name] && peeks[name].offsetParent !== null) {
					load(peeks[name].querySelector('img'));
				}
			}
		}

		Array.prototype.forEach.call(lines, splitWords);
		lines[current].classList.add('is-on');
		loadImg(current - 1);
		loadImg(current + 1);
		loadImg(current + 2);

		// wait for the first picture so its entrance is seen
		var first = loadImg(current);
		if (first && !first.complete) {
			first.addEventListener('load', begin);
			first.addEventListener('error', begin);
			setTimeout(begin, 2500);
		} else {
			begin();
		}

		Object.keys(peeks).forEach(function (name) {
			var peek = peeks[name];
			if (peek) {
				peek.addEventListener('animationend', function () {
					peek.classList.remove('is-peek');
				});
			}
		});

		// hold the current scene while the pointer is over the banner; the cat by the button says hi
		ad.addEventListener('pointerenter', function (e) {
			if (e.pointerType !== 'mouse') {
				return;
			}
			hovering = true;
			remaining = Math.max(1200, sceneDue - Date.now());
			clearTimeout(timers.scene);
			if (running) {
				peekOut('up', 250);
			}
		});

		ad.addEventListener('pointerleave', function (e) {
			if (e.pointerType !== 'mouse') {
				return;
			}
			hovering = false;
			if (running) {
				schedule(remaining);
			}
		});

		if (!reduced && window.matchMedia('(hover: hover)').matches) {
			var px = 0;
			var py = 0;
			var raf = 0;

			var track = function () {
				raf = 0;
				var r = logo.getBoundingClientRect();
				var dx = px - (r.left + r.width / 2);
				var dy = py - (r.top + r.height * 0.62);
				var d = Math.sqrt(dx * dx + dy * dy) || 1;
				var k = Math.min(1, d / 260);
				look(dx / d * k, dy / d * k);
			};

			document.addEventListener('pointermove', function (e) {
				if (!running) {
					return;
				}
				px = e.clientX;
				py = e.clientY;
				lastMove = Date.now();
				if (!raf) {
					raf = requestAnimationFrame(track);
				}
			}, { passive: true });
		}

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				onScreen = entries[entries.length - 1].isIntersecting;
				update();
			}).observe(ad);
		}

		document.addEventListener('visibilitychange', update);
	}

	Array.prototype.forEach.call(document.querySelectorAll('.mew-ad'), init);
})();
