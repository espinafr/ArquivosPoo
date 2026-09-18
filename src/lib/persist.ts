export interface StoredValue<T> {
	value: T;
	expiresAt: number;
}

function isStoredValue<T>(value: unknown): value is StoredValue<T> {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const storedValue = value as Partial<StoredValue<T>>;
	return typeof storedValue.expiresAt === 'number' && 'value' in storedValue;
}

export function saveValue<T>(key: string, value: T, ttlMs: number): void {
	const storedValue: StoredValue<T> = {
		value,
		expiresAt: Date.now() + ttlMs,
	};

	localStorage.setItem(key, JSON.stringify(storedValue));
}

export function readValue<T>(key: string): T | null {
	const savedValue = localStorage.getItem(key);

	if (!savedValue) {
		return null;
	}

	try {
		const storedValue: unknown = JSON.parse(savedValue);

		if (!isStoredValue<T>(storedValue)) {
			localStorage.removeItem(key);
			return null;
		}

		if (storedValue.expiresAt <= Date.now()) {
			localStorage.removeItem(key);
			return null;
		}

		return storedValue.value;
	} catch {
		localStorage.removeItem(key);
		return null;
	}
}

export function removeValue(key: string): void {
	localStorage.removeItem(key);
}
