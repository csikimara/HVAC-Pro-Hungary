module.exports = {
	globDirectory: 'dist',
	globPatterns: [
		'**/*.{js,css,html,png,jpg,jpeg,svg,ico,json}'
	],
	swDest: 'dist/sw.js',
	// Expo's single web bundle is currently ~4.8 MB; keep it available for field use
	// after the first successful load instead of silently omitting it from precache.
	maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [{
		urlPattern: /.*/,
		handler: 'NetworkFirst',
		options: {
			networkTimeoutSeconds: 10,
			backgroundSync: {
				name: 'navigation-queue',
				options: {
					maxRetentionTime: 24 * 60 // 24 hours
				}
			}
		}
	}]
};
