export declare var MODULE_NAME: string;
/**
 * keep the reference of child view detached from GridView.
 * when volume limit is exceed, remove the farthest view from current center position
 * when retrieve a recycled view, id and position is needed.
 */
export declare class Recycler {
    recycledViewMap: Map<number, Element>;
    maxRecycledCount: number;
    private cleanup(view);
    recycleView(position: number, view: Element): void;
    getView(position: number): Element;
    clean(): void;
    empty(): void;
}
export declare class GridView {
    private $scope;
    private $element;
    private $transclude;
    static $inject: string[];
    private hostWidth;
    private hostHeight;
    /**
     * horizontal and vertical gutter between grid cell
     */
    private horizontalGutter;
    private verticalGutter;
    private rowHeight;
    private columnWidth;
    private columnCount;
    private scrollBarWidth;
    private firstChildPosition;
    private scrollLayer;
    private childrenHolder;
    private recycleViewStash;
    isPerformingLayout: boolean;
    hostElement: HTMLElement;
    private recycler;
    constructor($scope: ng.IScope, $element: ng.IAugmentedJQuery, $transclude: ng.ITranscludeFunction);
    private applyTransform(view, x, y);
    protected dispatchLayout(view: HTMLElement, addBefore: boolean): void;
    private getDataList();
    private recycleChild(position, childElement);
    private getView(position);
    private insertView(startIndex, endIndex);
    private findCurrentIndexRange();
    protected layoutChildren(): void;
    layout(): void;
    clearLayout(): void;
    measure(horizontalGutter: number, verticalGutter: number): void;
}
