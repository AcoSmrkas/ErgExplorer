<script>
	export let status;
	export let type = 'default'; // 'default', 'success', 'warning', 'danger'
	
	function getStatusClass(statusType) {
		switch (statusType) {
			case 'success': return 'text-success';
			case 'warning': return 'text-warning';
			case 'danger': return 'text-danger';
			default: return 'text-muted';
		}
	}
</script>

<span class="badge status-badge {getStatusClass(type)}">{status}</span>

<!-- Badge styles are defined globally in common-components.css -->