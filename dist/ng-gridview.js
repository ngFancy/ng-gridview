(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	exports.NgGridView = 'ngFancy.GridView';
	var DATA_LIST = 'list';
	var ROW_HEIGHT = 'rowHeight';
	var COLUMN_COUNT = 'columnCount';
	var SCOPE_KEY = '$$transcludeScope';
	var CELL_CLASS = 'grid-cell';
	var VIEW_INDEX = 'viewIndex';
	/**
	 * keep the reference of child view detached from GridView.
	 * when volume limit is exceed, remove the farthest view from current center position
	 * when retrieve a recycled view, id and position is needed.
	 */
	var Recycler = (function () {
	    function Recycler() {
	        this.recycledViewMap = new Map();
	        this.maxRecycledCount = 10;
	    }
	    Recycler.prototype.cleanup = function (view) {
	        var transcludedScope = view[SCOPE_KEY];
	        transcludedScope.$destroy();
	    };
	    Recycler.prototype.recycleView = function (position, view) {
	        this.recycledViewMap.set(position, view);
	    };
	    Recycler.prototype.getView = function (position) {
	        var recycledView = this.recycledViewMap.get(position);
	        if (recycledView && recycledView[SCOPE_KEY]) {
	            this.recycledViewMap.delete(position);
	            return recycledView;
	        }
	        else {
	            return null;
	        }
	    };
	    Recycler.prototype.clean = function () {
	        if (this.recycledViewMap.size > this.maxRecycledCount) {
	            var positions = Array.from(this.recycledViewMap.keys());
	            var sortedPosition = positions.sort(function (n1, n2) {
	                return n1 - n2;
	            });
	            var deleteCount = this.recycledViewMap.size - this.maxRecycledCount;
	            for (var i = 0; i < deleteCount; i++) {
	                this.cleanup(this.recycledViewMap.get(sortedPosition[i]));
	                this.recycledViewMap.delete(sortedPosition[i]);
	            }
	        }
	    };
	    Recycler.prototype.empty = function () {
	        var next, iter = this.recycledViewMap.values();
	        while ((next = iter.next().value)) {
	            this.cleanup(next);
	        }
	        this.recycledViewMap.clear();
	    };
	    return Recycler;
	}());
	exports.Recycler = Recycler;
	var GridView = (function () {
	    function GridView($scope, $element, $transclude) {
	        this.$scope = $scope;
	        this.$element = $element;
	        this.$transclude = $transclude;
	        this.scrollBarWidth = 17;
	        this.firstChildPosition = 0;
	        this.recycleViewStash = [];
	        this.isPerformingLayout = false;
	        this.recycler = new Recycler();
	        this.hostElement = this.$element[0].querySelector('.gridview-wrapper');
	        this.scrollLayer = this.hostElement.querySelector('.scroll-layer');
	        this.childrenHolder = this.hostElement.querySelector('.children-holder');
	    }
	    GridView.prototype.applyTransform = function (view, x, y) {
	        view.style.transform = "translate(" + x + "px, " + y + "px)";
	        view.style.webkitTransform = "translate(" + x + "px, " + y + "px)";
	    };
	    GridView.prototype.dispatchLayout = function (view, addBefore) {
	        var viewIndex = view[VIEW_INDEX];
	        var rowIndex = Math.floor(viewIndex / this.columnCount);
	        var startPosY = rowIndex * (this.rowHeight + this.verticalGutter);
	        var startPosX = (viewIndex - (rowIndex * this.columnCount)) * (this.columnWidth + this.horizontalGutter);
	        this.applyTransform(view, startPosX, startPosY);
	        view.style.width = this.columnWidth + 'px';
	        view.style.height = this.rowHeight + 'px';
	        view.style.position = 'absolute';
	        if (addBefore) {
	            this.childrenHolder.insertBefore(view, this.childrenHolder.firstChild);
	        }
	        else {
	            this.childrenHolder.appendChild(view);
	        }
	    };
	    GridView.prototype.getDataList = function () {
	        return this.$scope[DATA_LIST];
	    };
	    GridView.prototype.getView = function (position) {
	        var dataList = this.getDataList();
	        var view;
	        this.$transclude(function (clone, scope) {
	            scope['$data'] = dataList[position];
	            for (var i = 0; i < clone.length; i++) {
	                if (clone[i].classList && clone[i].classList.contains(CELL_CLASS)) {
	                    view = clone[i];
	                    break;
	                }
	            }
	            view[SCOPE_KEY] = scope;
	            view[VIEW_INDEX] = position;
	        });
	        return view;
	    };
	    GridView.prototype.insertView = function (startIndex, endIndex) {
	        var dataList = this.getDataList();
	        var firstChild = this.childrenHolder.firstChild, lastChild = this.childrenHolder.lastChild;
	        if (firstChild && lastChild) {
	            for (var i = firstChild[VIEW_INDEX] - 1; i >= startIndex; i--) {
	                var view = this.recycler.getView(i);
	                if (!view) {
	                    view = this.getView(i);
	                }
	                this.dispatchLayout(view, true);
	            }
	            for (var i = lastChild[VIEW_INDEX] + 1; i <= endIndex; i++) {
	                var view = this.recycler.getView(i);
	                if (!view) {
	                    view = this.getView(i);
	                }
	                this.dispatchLayout(view, false);
	            }
	        }
	        else {
	            for (var i = startIndex; i <= endIndex; i++) {
	                var view = this.recycler.getView(i);
	                if (!view) {
	                    view = this.getView(i);
	                }
	                this.dispatchLayout(view, false);
	            }
	        }
	    };
	    GridView.prototype.findCurrentIndexRange = function () {
	        var currentScrollTop = this.hostElement.scrollTop;
	        var startRow = Math.floor(currentScrollTop / (this.rowHeight + this.verticalGutter));
	        var startRowOffset = currentScrollTop - startRow * (this.rowHeight + this.verticalGutter);
	        var endRow = Math.ceil((this.hostHeight + this.verticalGutter + startRowOffset) / (this.rowHeight + this.verticalGutter)) + startRow;
	        var dataList = this.getDataList();
	        return {
	            startIndex: startRow * this.columnCount,
	            endIndex: Math.min(endRow * this.columnCount - 1, dataList.length - 1)
	        };
	    };
	    GridView.prototype.layoutChildren = function () {
	        var _a = this.findCurrentIndexRange(), startIndex = _a.startIndex, endIndex = _a.endIndex;
	        var childrenViews = this.childrenHolder.children;
	        for (var i = 0; i < childrenViews.length; i++) {
	            var childView = childrenViews[i];
	            if (childView[VIEW_INDEX] < startIndex || childView[VIEW_INDEX] > endIndex) {
	                this.childrenHolder.removeChild(childView);
	                this.recycler.recycleView(childView[VIEW_INDEX], childView);
	                i--;
	            }
	        }
	        this.insertView(startIndex, endIndex);
	    };
	    GridView.prototype.layout = function () {
	        if (this.isPerformingLayout) {
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
	    };
	    GridView.prototype.clearLayout = function () {
	        this.recycler.empty();
	        var lastChild;
	        while ((lastChild = this.childrenHolder.lastChild)) {
	            this.childrenHolder.removeChild(lastChild);
	        }
	    };
	    GridView.prototype.measure = function (horizontalGutter, verticalGutter) {
	        this.clearLayout();
	        this.horizontalGutter = horizontalGutter;
	        this.verticalGutter = verticalGutter;
	        this.hostWidth = this.hostElement.clientWidth;
	        this.hostHeight = this.hostElement.clientHeight;
	        this.columnCount = this.$scope[COLUMN_COUNT];
	        this.rowHeight = this.$scope[ROW_HEIGHT];
	        this.columnWidth = (this.hostWidth - this.scrollBarWidth) / this.columnCount - this.horizontalGutter * (this.columnCount - 1);
	        var dataList = this.getDataList();
	        var dataCount = dataList.length;
	        var holderHeight = Math.ceil(dataCount / this.columnCount) * (this.rowHeight + this.verticalGutter) - this.verticalGutter;
	        this.scrollLayer.style.height = holderHeight + 'px';
	        this.childrenHolder.style.height = holderHeight + 'px';
	    };
	    GridView.$inject = ['$scope', '$element', '$transclude'];
	    return GridView;
	}());
	exports.GridView = GridView;
	angular.module(exports.NgGridView, [])
	    .directive('ngGridview', ['$timeout', function ($timeout) {
	        return {
	            restrict: 'E',
	            template: __webpack_require__(1),
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
	            link: function (scope, element, attr, ctrl) {
	                var hGutter = scope['horizontalGutter'] || 10;
	                var vGutter = scope['verticalGutter'] || 10;
	                scope.$watchCollection('list', function (newValue) {
	                    if (newValue) {
	                        ctrl.measure(hGutter, vGutter);
	                        ctrl.layout();
	                    }
	                });
	                var gridviewWrapper = element[0].querySelector('.gridview-wrapper');
	                var deterDigest = null;
	                var scrollListener = function () {
	                    if (ctrl.isPerformingLayout) {
	                        clearTimeout(deterDigest);
	                        deterDigest = setTimeout(function () {
	                            scope.$apply();
	                        });
	                    }
	                    else {
	                        ctrl.layout();
	                        scope.$apply();
	                    }
	                };
	                gridviewWrapper.addEventListener('scroll', scrollListener, false);
	                scope.$on('$destory', function () {
	                    gridviewWrapper.removeEventListener('scroll', scrollListener);
	                });
	            }
	        };
	    }]);
	

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = "<div class=\"gridview-wrapper\">\n    <div class=\"scroll-layer\">\n        <div class=\"children-holder\"></div>\n    </div>\n</div>"

/***/ }
/******/ ])
});
;
//# sourceMappingURL=ng-gridview.map