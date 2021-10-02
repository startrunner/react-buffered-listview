export type TotalCountChangedEventArgs = {
    newTotalCount: number,
}

export type ItemAddedEventArgs<T> = {
    item: T,
    index: number,
}

export type PageChangedEventArgs = {
    pageIndex: number,
}

export type EventHandler<TEventArgs> = { (e: TEventArgs): void };

export default interface IDataStore<T> {
    //Fetches
    getTotalCount(): Promise<number>;
    getPageSize(): number;
    getPageItems(pageIx: number): Promise<T[]>;


    //Events
    onTotalCountChanged(handler: EventHandler<TotalCountChangedEventArgs>): void
    onPageChanged(handler: EventHandler<PageChangedEventArgs>): void;
}