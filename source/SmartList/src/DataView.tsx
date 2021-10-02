import React, { Component, ReactElement } from "react";
import IDataStore from "./IDataStore";

type DataViewProps<T> = {
    store: IDataStore<T>,
    itemHeight: number,
    itemRenderer: ItemRenderer<T>,
};

type DataViewState<T> = {
    knownTotalCount: number | null,
    //scrollPosition: number,
    visiblePages: Page<T>[],
    visiblePageIndices: number[],
};

export type ItemRenderer<T> = { (item: T): ReactElement };

type Page<T> = {
    index: number,
    items: (T | null)[],
}

export default class DataView<T> extends Component<DataViewProps<T>, DataViewState<T>> {

    public constructor(props: DataViewProps<T>, x: any) {
        super(props, x);
        this.state = {
            knownTotalCount: null,
            visiblePages: [],
            visiblePageIndices: [],
            //scrollPosition: 0,
        }
    }

    componentDidMount() {
        //const pageSize = this.props.store.getPageSize();
        const store = this.props.store;

        store.onTotalCountChanged(e => {
            this.setState({ knownTotalCount: e.newTotalCount });
        });

        store.onPageChanged(async ({ pageIndex }) => {
            if (!this.state.visiblePageIndices.includes(pageIndex))
                return;

            const thePage: Page<T> = {
                items: await this.props.store.getPageItems(pageIndex),
                index: pageIndex,
            };

            const oldVisiblePages = this.state.visiblePages;
            const newVisiblePages: Page<T>[] = [
                ...oldVisiblePages
                    .filter(x => x.index !== thePage.index),

                thePage,
            ];

            const totalCountFromPage =
                thePage.index * this.props.store.getPageSize()
                + thePage.items.length;

            const knownTotalCount = Math.max(totalCountFromPage, this.state.knownTotalCount ?? 0);

            this.setState({
                visiblePages: newVisiblePages,
                knownTotalCount,
            });
        });

        (async () => {
            const knownTotalCount = await this.props.store.getTotalCount();
            this.setState({ knownTotalCount });

            {
                const pages: Page<T>[] = [];
                const pageSize = this.props.store.getPageSize();
                const pageCount = Math.ceil(knownTotalCount / pageSize);
                for (let i = 0; i < pageCount; i++) {
                    const items = await this.props.store.getPageItems(i);
                    pages.push({ items, index: i });
                }
                this.setState({ visiblePages: pages });
            }
        })();
    }

    render(): ReactElement {
        if (this.state.knownTotalCount === null)
            return <>Fetching page count...</>

        console.log(`Rendering Pages${JSON.stringify(this.state.visiblePages.map(x => x.index))}`);

        const totalItemHeight = this.state.knownTotalCount * this.props.itemHeight;
        const spaceFillerMaxHeight = 10000;

        const spaceFillerStyle: React.CSSProperties = {
            boxSizing: 'border-box',

            backgroundColor: '#e3e3e3',
            backgroundImage: 'linear-gradient(135deg, #e9eaf9 25%, transparent 25%), linear-gradient(225deg, #e9eaf9 25%, transparent 25%), linear-gradient(45deg, #e9eaf9 25%, transparent 25%), linear-gradient(315deg, #e9eaf9 25%, #e3e3e3 25%)',
            backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
            backgroundSize: '10px 10px',
            backgroundRepeat: 'repeat',
        }

        const shell = <div
            className="scrollHost"
            style={{
                height: '300px',
                width: '600px',
                overflowY: 'scroll',
            }}
            onScroll={e => this.fetchVisiblePages(e.target)}
        >
            <div className="spaceFiller" style={{
                height: DataView.stringifyPixels(Math.min(totalItemHeight, spaceFillerMaxHeight)),
                //border: '2px solid red',
                ...spaceFillerStyle,
            }} >
                <div
                    className="thisMustBeRelativeForAbsolutelyPositionedChildren"
                    style={{ position: "relative" }}
                >
                    {this.renderItemShells()}
                </div>
            </div>

            {(() => {
                const fillers: ReactElement[] = [];
                for (let filler = 1; ; filler++) {
                    const heightSoFar = filler * spaceFillerMaxHeight;
                    if (heightSoFar > totalItemHeight) break;
                    const height = Math.min(spaceFillerMaxHeight, totalItemHeight - heightSoFar);
                    fillers.push(<div key={`filler-${filler}`} className="spaceFiller" style={{
                        height: height,
                        //border: '2px solid red',
                        ...spaceFillerStyle,
                    }} />);
                }
                return fillers;
            })()}

        </div>

        return shell;
    }

    _latestFetchOfVisiblePages: number = 0;
    private async fetchVisiblePages(scrollHost: any) {
        const currentFetch =
            this._latestFetchOfVisiblePages =
            (this._latestFetchOfVisiblePages + 1) % 100000;

        const visiblePageIndices = this.getVisiblePageIndices(scrollHost);

        const newPages: Page<T>[] = [];
        {
            const { store } = this.props;
            const oldPages = this.state.visiblePages;
            for (const visibleIx of visiblePageIndices) {
                const existing = oldPages.find(x => x.index === visibleIx) ?? null;
                if (currentFetch !== this._latestFetchOfVisiblePages) return;

                if (existing) newPages.push(existing);
                else {
                    const pageItems = await store.getPageItems(visibleIx);
                    if (pageItems.length > 0) {
                        const page: Page<T> = {
                            index: visibleIx,
                            items: pageItems,
                        };
                        newPages.push(page);
                    }
                }
            }
        }

        this.setState({
            visiblePages: newPages,
            visiblePageIndices,
        });
    }

    private getVisiblePageIndices(scrollHost: any): number[] {
        const scrollPosition: number = scrollHost.scrollTop;
        const scrollHostRectangle: DOMRect = scrollHost.getBoundingClientRect();
        //const viewWidth = scrollHostRectangle.width;
        const viewHeight = scrollHostRectangle.height;
        const { itemHeight, store } = this.props;
        const pageHeight = store.getPageSize() * itemHeight;

        const pageCountBeforeVisible = Math.floor(scrollPosition / pageHeight);
        const pageCountVisible = Math.floor(viewHeight / pageHeight);

        const lookaheadPageCount = this.getLookAheadPageCount();
        const visiblePageIndices: number[] = [];
        for (
            let i = 0 - lookaheadPageCount;
            i < pageCountVisible + lookaheadPageCount;
            ++i
        ) {
            const visiblePageIx = pageCountBeforeVisible + i;
            if (visiblePageIx < 0) continue;
            visiblePageIndices.push(visiblePageIx);
        }
        return visiblePageIndices;
    }

    getLookAheadPageCount(): number { return 1; }

    private renderItemShells(): ReactElement[] {
        const { visiblePages } = this.state;
        const pageSize = this.props.store.getPageSize();
        //const { scrollPosition } = this.state;
        const { itemHeight } = this.props;

        const itemShells: ReactElement[] = [];
        for (const page of visiblePages) {
            const { items } = page, pageIndex = page.index;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item) continue;

                const absoluteIndex = page.index * pageSize + i;
                //debugger;
                const offset = absoluteIndex * itemHeight;// - scrollPosition;

                const shell =
                    <div
                        className="itemShell"
                        style={{
                            border: "1px dotted gray",
                            height: DataView.stringifyPixels(this.props.itemHeight),
                            boxSizing: 'border-box',
                            position: 'absolute',
                            top: DataView.stringifyPixels(offset),
                        }}
                    >{this.props.itemRenderer(item)}</div>;
                itemShells.push(shell);
            }

        }

        return itemShells;
    }

    static stringifyPixels(size: number): string {
        const result = `${size.toLocaleString('fullwide', { useGrouping: false })}px`;
        return result;
    }
}