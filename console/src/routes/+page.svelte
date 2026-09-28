<section class="hero">
	<span class="eyebrow">Authorization · not login</span>
	<h1>One platform. Every client's own roles.</h1>
	<p class="lead">
		A self-hosted, multi-tenant RBAC service. Onboard any client organization, let each
		define <em>its own</em> role vocabulary, and answer one question over an API:
		<strong>“can this user do this?”</strong>
	</p>
	<div class="cta">
		<a class="btn" href="/login">Get started →</a>
		<a class="ghost" href="https://openfga.dev" target="_blank" rel="noreferrer">Powered by OpenFGA</a>
	</div>

	<div class="feature-grid">
		<div class="card">
			<h2 style="margin-top:0">Per-tenant vocabularies</h2>
			<p class="muted">
				Client A speaks <span class="mono">parent</span> / <span class="mono">child</span>;
				Client B speaks <span class="mono">dev</span> / <span class="mono">qa</span> /
				<span class="mono">platform_engineer</span>. Same platform, fully isolated.
			</p>
		</div>
		<div class="card">
			<h2 style="margin-top:0">Consumed as an API</h2>
			<p class="muted">
				Clients call a single <span class="mono">check</span> endpoint — plain HTTP or an
				OpenFGA SDK — and get back allow / deny.
			</p>
		</div>
		<div class="card">
			<h2 style="margin-top:0">Self-hosted, minimal ops</h2>
			<p class="muted">
				PostgreSQL + OpenFGA + PocketBase + this console. No cloud dependency, no per-seat
				licensing.
			</p>
		</div>
	</div>
</section>
