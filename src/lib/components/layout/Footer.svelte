<script>
	import { onMount } from 'svelte';
	
	let currentYear = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="container text-center">
		&copy; Erg Explorer {currentYear} - 
		<a href="/addresses/9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk">
			Donate <span style="color:pink;">&hearts;</span>
		</a>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
		color: var(--text-light);
		padding: 10px;
	}
	
	.footer a {
		color: var(--text-color);
		text-decoration: none;
	}
	
	.footer a:hover {
		color: var(--main-color) !important;
	}
</style>