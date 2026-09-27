import type { ConsoleUser } from '$lib/server/pocketbase';

declare global {
	namespace App {
		interface Locals {
			user: ConsoleUser | null;
		}
	}
}

export {};
