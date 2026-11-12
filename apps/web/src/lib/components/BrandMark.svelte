<script lang="ts">
	let { size = 40 }: { size?: number } = $props();
</script>

<svg
	class="brand-mark"
	style:width={size + 'px'}
	style:height={size + 'px'}
	viewBox="0 0 64 64"
	fill="currentColor"
	aria-hidden="true"
	focusable="false"
>
	<path d="m8 10 4-4h8v14l12 9 12-9V6h8l4 4v44l-4 4h-8V44l-12-9-12 9v14h-8l-4-4z" />
	<path d="M24 6h16v4H24zm0 48h16v4H24z" />
</svg>

<style>
	.brand-mark {
		display: block;
		flex: none;
	}
</style>
