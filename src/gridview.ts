export var MODULE_NAME = 'ngFancy.GridView';

const DATA_LIST: string = 'list';
const ROW_HEIGHT: string = 'rowHeight';
const COLUMN_COUNT: string = 'columnCount';
const SCOPE_KEY: string = '$$transcludeScope';
const CELL_CLASS: string = 'grid-cell';
const VIEW_INDEX: string = 'viewIndex';

/**
 * keep the reference of child view detached from GridView.
 * when volume limit is exceed, remove the farthest view from current center position
 * when retrieve a recycled view, id and position is needed.
 */
export class Recycler {

    recycledViewMap: Map<number, Element> = new Map<number, Element>();

    maxRecycledCount = 10;

    private cleanup(view: Element): void {
        let transcludedScope = view[SCOPE_KEY];
        transcludedScope.$destroy();
    }

    recycleView(position: number, view: Element): void {
        this.recycledViewMap.set(position, view);
    }

    getView(position: number): Element {
        let recycledView = this.recycledViewMap.get(position);
        if(recycledView && recycledView[SCOPE_KEY]) {
            this.recycledViewMap.delete(position);
            return recycledView;
        } else {
            return null;
        }
    }

    clean(): void {
        if(this.recycledViewMap.size > this.maxRecycledCount) {
            let positions = Array.from(this.recycledViewMap.keys());
            let sortedPosition = positions.sort((n1: number, n2:number): any => {
                return n1 - n2;
            });
            let deleteCount = this.recycledViewMap.size - this.maxRecycledCount;
            for(let i = 0; i < deleteCount; i++) {
                this.cleanup(this.recycledViewMap.get(sortedPosition[i]));
                this.recycledViewMap.delete(sortedPosition[i]);
            }
        }
    }

    empty(): void {
        let next, iter = this.recycledViewMap.values();
        while((next = iter.next().value)) {
            this.cleanup(next);
        }
        this.recycledViewMap.clear();
    }
}

export class GridView {

    static $inject = ['$scope', '$element', '$transclude'];

    private hostWidth: number;
    private hostHeight: number;
    /**
     * horizontal and vertical gutter between grid cell
     */
    private horizontalGutter: number;
    private verticalGutter: number;

    private rowHeight: number;
    private columnWidth: number;
    private columnCount: number;

    private scrollBarWidth: number = 17;
    
    private firstChildPosition: number = 0;
    
    private scrollLayer: HTMLElement;
    private childrenHolder: HTMLElement;

    private recycleViewStash: Element[] = [];

    isPerformingLayout: boolean = false;

    hostElement: HTMLElement;

    private recycler: Recycler = new Recycler();

    constructor(
        private $scope: ng.IScope,
        private $element: ng.IAugmentedJQuery,
        private $transclude: ng.ITranscludeFunction
    ) {
        this.hostElement = <HTMLElement> this.$element[0].querySelector('.gridview-wrapper');
        this.scrollLayer = <HTMLElement> this.hostElement.querySelector('.scroll-layer');
        this.childrenHolder = <HTMLElement> this.hostElement.querySelector('.children-holder');
    }

    private applyTransform(view: HTMLElement, x: number, y: number) {
        view.style.transform = `translate(${x}px, ${y}px)`;
        view.style.webkitTransform = `translate(${x}px, ${y}px)`;
    }
    
    protected dispatchLayout(view: HTMLElement, addBefore: boolean): void {
        let viewIndex = view[VIEW_INDEX];
        
        let rowIndex = Math.floor(viewIndex / this.columnCount);
        let startPosY = rowIndex * (this.rowHeight + this.verticalGutter);
        let startPosX = (viewIndex - (rowIndex * this.columnCount)) * (this.columnWidth + this.horizontalGutter);
        
        this.applyTransform(view, startPosX, startPosY);
        view.style.width = this.columnWidth + 'px';
        view.style.height = this.rowHeight + 'px';
        view.style.position = 'absolute';
        
        if(addBefore) {
            this.childrenHolder.insertBefore(view, this.childrenHolder.firstChild);
        } else {
            this.childrenHolder.appendChild(view);
        }
    
    }
    
    private getDataList(): any[] {
        return <any[]> this.$scope[DATA_LIST];
    }
    
    private getView(position: number): Element {
        let dataList = this.getDataList();
        let view: Element;
        this.$transclude((clone: ng.IAugmentedJQuery, scope: ng.IScope) => {
            scope['$data'] = dataList[position];
            for(let i = 0; i < clone.length; i++) {
                if(clone[i].classList && clone[i].classList.contains(CELL_CLASS)) {
                    view = clone[i];
                    break;
                }
            }
            view[SCOPE_KEY] = scope;
            view[VIEW_INDEX] = position;
        });
        return view;
    }

    private insertView(startIndex: number, endIndex: number): void {
        let dataList = this.getDataList();
        let firstChild = this.childrenHolder.firstChild, lastChild = this.childrenHolder.lastChild;
        if(firstChild && lastChild) {
            for(let i = firstChild[VIEW_INDEX] - 1; i >= startIndex; i--) {
                let view = this.recycler.getView(i);
                if(!view) {
                    view = this.getView(i);
                }
                this.dispatchLayout(<HTMLElement> view, true);
            }
            for(let i = lastChild[VIEW_INDEX] + 1; i <= endIndex; i++) {
                let view = this.recycler.getView(i);
                if(!view) {
                    view = this.getView(i);
                }
                this.dispatchLayout(<HTMLElement> view, false);
            }  
        } else {
            for(let i = startIndex; i <= endIndex; i++) {
                let view = this.recycler.getView(i);
                if(!view) {
                    view = this.getView(i);
                }
                this.dispatchLayout(<HTMLElement> view, false);
            }
        }
    }

    private findCurrentIndexRange(): {startIndex: number, endIndex: number} {
        let currentScrollTop = this.hostElement.scrollTop;
        let startRow = Math.floor(currentScrollTop / (this.rowHeight + this.verticalGutter));
        let startRowOffset = currentScrollTop - startRow * (this.rowHeight + this.verticalGutter)
        let endRow = Math.ceil((this.hostHeight + this.verticalGutter + startRowOffset) / (this.rowHeight + this.verticalGutter)) + startRow;
        let dataList = this.getDataList();
        return {
            startIndex: startRow * this.columnCount,
            endIndex: Math.min(endRow * this.columnCount - 1, dataList.length - 1)
        };
    }

    protected layoutChildren(): void {
        let {startIndex, endIndex} = this.findCurrentIndexRange();
        let childrenViews = this.childrenHolder.children;
        for(let i = 0; i < childrenViews.length; i++) {
            let childView = childrenViews[i];
            if(childView[VIEW_INDEX] < startIndex || childView[VIEW_INDEX] > endIndex) {
                this.childrenHolder.removeChild(childView);
                this.recycler.recycleView(childView[VIEW_INDEX], childView);
                i--;
            }
        }
        this.insertView(startIndex, endIndex);
    }

    layout(): void {
        if(this.isPerformingLayout) {
            return;
        }
        this.isPerformingLayout = true;
        // temporary detch children holder from DOM tree
        this.scrollLayer.removeChild(this.childrenHolder);

        this.layoutChildren();

        // attach back the children holder        
        this.scrollLayer.appendChild(this.childrenHolder);

        this.recycler.clean();
        this.isPerformingLayout = false;
    }

    clearLayout() {
        this.recycler.empty();
        let lastChild;
        while((lastChild = this.childrenHolder.lastChild)) {
            this.childrenHolder.removeChild(lastChild);
        }
    }

    measure(horizontalGutter: number, verticalGutter: number): void {
        this.clearLayout();
        this.horizontalGutter = horizontalGutter;
        this.verticalGutter = verticalGutter;
        
        this.hostWidth = this.hostElement.clientWidth;
        this.hostHeight = this.hostElement.clientHeight;
        
        this.columnCount = this.$scope[COLUMN_COUNT];
        this.rowHeight = this.$scope[ROW_HEIGHT];
        this.columnWidth = (this.hostWidth - this.scrollBarWidth) / this.columnCount - this.horizontalGutter * (this.columnCount - 1);
        let dataList = this.getDataList();
        
        let dataCount = dataList.length;
        let holderHeight = Math.ceil(dataCount / this.columnCount) * (this.rowHeight + this.verticalGutter) - this.verticalGutter;
        this.scrollLayer.style.height = holderHeight + 'px';
        this.childrenHolder.style.height = holderHeight + 'px';
    }

}

angular.module(MODULE_NAME, [])
    .directive('ngGridview', ['$timeout', ($timeout) => {
        return {
            restrict: 'E',
            template: require('./gridview.html'),
            scope: {
                list: '=',
                rowHeight: '=',
                columnCount: '=',
                horizontalGutter: '=?',
                verticalGutter: '=?'
            },
            controller: GridView,
            controllerAs: '$ctrl',
            transclude: true,
            require: 'ngGridview',
            link: (scope: ng.IScope, element: ng.IAugmentedJQuery, attr: any, ctrl: GridView) => {
                let hGutter = scope['horizontalGutter'] || 10;
                let vGutter = scope['verticalGutter'] || 10;
                scope.$watchCollection('list', (newValue) => {
                    if(newValue) {
                        ctrl.measure(hGutter, vGutter);
                        ctrl.layout()
                    }
                });

                let gridviewWrapper = element[0].querySelector('.gridview-wrapper');

                let deterDigest = null;
                let scrollListener = () => {
                    if(ctrl.isPerformingLayout) {
                        clearTimeout(deterDigest);
                        deterDigest = setTimeout(() => {
                            scope.$apply();
                        });
                    } else {
                        ctrl.layout();
                        scope.$apply();
                    }
                };
                gridviewWrapper.addEventListener('scroll', scrollListener, false);

                scope.$on('$destory', ()=> {
                    gridviewWrapper.removeEventListener('scroll', scrollListener);
                });

            }
        };
    }]);