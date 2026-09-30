export const authClient = {
	async session(): Promise<boolean> {
		const response = await fetch('/api/admin/session', { credentials: 'include' })
		if (!response.ok) return false
		const json = await response.json().catch(() => ({ authenticated: false }))
		return Boolean(json.authenticated)
	},

	async login(password: string): Promise<void> {
		const response = await fetch('/api/admin/login', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password }),
		})
		const json = await response.json().catch(() => ({}))
		if (!response.ok) throw new Error(json?.error || 'Could not sign in.')
	},

	async logout(): Promise<void> {
		await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
	},
}
