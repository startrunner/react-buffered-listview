import IDataStore, { EventHandler, ItemAddedEventArgs, PageChangedEventArgs, TotalCountChangedEventArgs } from "./IDataStore";

export default class ListDataStore<T> implements IDataStore<T> {
    constructor(items: T[] | null) {
        this._items = items ?? [];
    }

    _items: T[];

    async getTotalCount(): Promise<number> {
        return this._items.length;
    }
    getPageSize(): number {
        return 3;
    }

    async getPageItems(pageIx: number): Promise<T[]> {
        const pageSize = this.getPageSize();
        const start = pageSize * pageIx;
        const end = start + pageSize;
        const page = this._items.slice(start, end)
        return page;
    }

    add(item: T) {
        this._items.push(item);

        this.fireTotalCountChanged({
            newTotalCount: this._items.length,
        });

        const itemIndex = this._items.length - 1;
        this.fireItemAdded({
            index: itemIndex,
            item,
        });

        const pageIndex = Math.floor(itemIndex / this.getPageSize());
        this.firePageChanged({
            pageIndex,
        });
    }

    public onTotalCountChanged(handler: EventHandler<TotalCountChangedEventArgs>): void { this._totalCountChangedHandlers.push(handler); }
    private fireTotalCountChanged(e: TotalCountChangedEventArgs) { this._totalCountChangedHandlers.forEach(handler => handler(e)); }
    private _totalCountChangedHandlers: EventHandler<TotalCountChangedEventArgs>[] = [];

    onItemAdded(handler: EventHandler<ItemAddedEventArgs<T>>): void { this._onItemAddedHandlers.push(handler); }
    private fireItemAdded(args: ItemAddedEventArgs<T>) { this._onItemAddedHandlers.forEach(x => x(args)); }
    private _onItemAddedHandlers: EventHandler<ItemAddedEventArgs<T>>[] = [];

    onPageChanged(handler: EventHandler<PageChangedEventArgs>): void { this._onPageChangedHandlers.push(handler); }
    private firePageChanged(args: PageChangedEventArgs) { this._onPageChangedHandlers.forEach(x => x(args)); }
    private _onPageChangedHandlers: EventHandler<PageChangedEventArgs>[] = [];
}