<script>
	import { DONATION_ADDRESS } from '$lib/utils/constants.js';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>About - Erg Explorer</title>
	<meta name="description" content="Learn about Erg Explorer, contact information, and terms of service for the Ergo blockchain explorer.">
</svelte:head>

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<PageHeader 
				title="About Erg Explorer" 
				icon="fa-info-circle" 
			/>

			<div class="about-content mt-3">
				<div class="glass-card">
					<div class="card-header">
						<h2 class="section-title">About</h2>
					</div>
					<div class="card-content">
						<p class="mb-0">Erg Explorer is the brainchild of a single enthusiast software developer (yours truly!) who wanted to provide the Ergo community with a user-friendly and intuitive tool to explore the depths of our beloved Ergo blockchain. With a deep understanding of the Ergo protocol and a genuine passion for the technology, I set out to create a product that would revolutionize the way we interact with Ergo.</p>
					</div>
				</div>

				<div class="glass-card">
					<div class="card-header">
						<h2 class="section-title">Contact</h2>
					</div>
					<div class="card-content">
						<div class="contact-item">
							<span class="contact-label">Telegram:</span>
							<a target="_blank" rel="noopener" href="https://t.me/ErgExplorer">@ErgExplorer</a>
						</div>
						<div class="contact-item mb-0">
							<span class="contact-label">E-mail:</span>
							<a href="mailto:ergexplorer@gmail.com">ergexplorer@gmail.com</a>
						</div>
					</div>
				</div>

				<div class="glass-card">
					<div class="card-header">
						<h2 class="section-title">Donate</h2>
					</div>
					<div class="card-content">
						<p>I'm excited to invite you to contribute to the growth and enhancement of our user-friendly Erg Explorer. With your support, I can continue providing a seamless and enjoyable platform for exploring the Ergo blockchain. All donations are hugely appreciated. Thank you!</p>
						
						<div class="donation-address">
							<span class="address-label">Ergo wallet:</span>
							<a href="/addresses/{DONATION_ADDRESS}" class="address-link" data-address="{DONATION_ADDRESS}">{DONATION_ADDRESS}</a>
						</div>
					</div>
				</div>

				<div class="glass-card">
					<div class="card-header">
						<h2 class="section-title">Telegram Alerts</h2>
					</div>
					<div class="card-content">
						<div class="contact-item">
							<span class="contact-label">Token Alert Channel:</span>
							<a target="_blank" rel="noopener" href="https://t.me/ErgExplorerTokenAlerts">@ErgExplorerTokenAlerts</a>
						</div>
						<div class="contact-item mb-0">
							<span class="contact-label">Whale Alert Channel:</span>
							<a target="_blank" rel="noopener" href="https://t.me/ErgExplorerWhaleAlerts">@ErgExplorerWhaleAlerts</a>
						</div>
					</div>
				</div>

				<div class="glass-card">
					<div class="card-header">
						<h2 class="section-title">Terms of Service</h2>
					</div>
					<div class="card-content terms-content">
						<p>These Terms of Service ("Terms") govern your use of the Erg Explorer blockchain explorer service ("Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree with any provision of these Terms, please refrain from using the Service.</p>

						<h3>Description of Service</h3>
						<p>Erg Explorer is a blockchain explorer web service that provides users with the ability to explore the Ergo blockchain network without recording any user data. The Service allows users to view transaction history, block information, and other related data on the Ergo blockchain.</p>

						<h3>User Responsibilities</h3>
						<p><strong>1.1. Prohibited Use:</strong> You agree not to use the Service for any unlawful, fraudulent, or malicious activities. You will not attempt to gain unauthorized access to the Service or interfere with its proper functioning.</p>
						<p><strong>1.2. Compliance with Laws:</strong> You are responsible for complying with all applicable laws and regulations in your use of the Service.</p>

						<h3>Privacy</h3>
						<p><strong>1.1. Data Collection:</strong> Erg Explorer does not record or store any user data. The Service operates in a manner that preserves user privacy and does not track or retain any personal information.</p>
						<p><strong>1.2. Cookies:</strong> The Service does not create or use any cookies or similar technologies to enhance user experience.</p>

						<h3>Intellectual Property</h3>
						<p><strong>1.1. Ownership:</strong> Erg Explorer and its associated logos, trademarks, and content are owned by their respective owners and are protected by intellectual property laws. You may not use, reproduce, modify, or distribute any content from the Service without prior written permission.</p>
						<p><strong>1.2. Feedback:</strong> If you provide any suggestions, feedback, or ideas regarding the Service, you grant Erg Explorer a non-exclusive, perpetual, royalty-free, irrevocable, and worldwide right to use, modify, and incorporate such feedback.</p>

						<h3>Limitation of Liability</h3>
						<p>To the extent permitted by law, Erg Explorer shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages arising out of or in connection with your use of the Service. This includes but is not limited to damages for loss of profits, goodwill, data, or other intangible losses.</p>

						<h3>Termination</h3>
						<p>Erg Explorer reserves the right to suspend, terminate, or restrict your access to the Service at any time without notice or liability, for any reason, including if you violate these Terms.</p>

						<h3>Modifications</h3>
						<p>Erg Explorer may modify these Terms at any time by posting the updated version on its website or through the Service. It is your responsibility to review the Terms periodically. By continuing to use the Service after any modifications, you accept and agree to the updated Terms.</p>

						<h3>Governing Law</h3>
						<p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Erg Explorer is located, without regard to its conflict of law provisions.</p>

						<h3>Severability</h3>
						<p>If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>

						<h3>Entire Agreement</h3>
						<p>These Terms constitute the entire agreement between you and Erg Explorer regarding the Service and supersede all prior or contemporaneous agreements, understandings, and representations.</p>

						<p class="mb-0">If you have any questions or concerns about these Terms, please contact us at <a href="mailto:ergexplorer@gmail.com"><strong>ergexplorer@gmail.com</strong></a></p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="page-bottom-margin"></div>

<style>

	.about-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.contact-label {
		color: var(--main-color);
		font-weight: 600;
		min-width: 120px;
	}

	.donation-address {
		margin-top: 1.5rem;
	}

	.address-label {
		color: var(--main-color);
		font-weight: 600;
		display: block;
		margin-bottom: 0.5rem;
	}

	.address-link {
		word-break: break-all;
		font-family: monospace;
		font-size: 0.9rem;
		display: inline-block;
	}

	.terms-content h3 {
		color: var(--main-color);
		font-weight: 600;
		margin: 2rem 0 1rem 0;
		font-size: 1.2rem;
	}

	.terms-content h3:first-child {
		margin-top: 1rem;
	}

	p {
		line-height: 1.6;
		margin-bottom: 1rem;
		color: var(--text-strong);
	}

	a {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 600;
	}

	a:hover {
		color: var(--main-color);
	}

	.page-bottom-margin {
		height: 2rem;
	}

	@media (max-width: 768px) {
		.contact-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.contact-label {
			min-width: auto;
		}
	}
</style>