export interface IStorage {
    // Define storage interface methods here if needed
}

export class MemStorage implements IStorage {
    private data: Map<string, any>;

    constructor() {
        this.data = new Map();
    }

    get(key: string): any {
        return this.data.get(key);
    }

    set(key: string, value: any): void {
        this.data.set(key, value);
    }

    delete(key: string): boolean {
        return this.data.delete(key);
    }

    clear(): void {
        this.data.clear();
    }
}

export const storage = new MemStorage();
