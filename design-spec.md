#Design Spec

This is the design specification for ng-gridview. It describes the goal for design this component, theory for how it works and some use caveats.

##Goal

The ng-gridview component is a **infinite grid view** for angular 1.x

- It can provide the smooth scrolling for super large dataset. but not fit for frequently changed dataset.
- The grid template can be any angular directive or DOM node except for text node.
- To provide a fast initial render. the row height and column count must be specified at the intialization.
- Keep a small memory usage.

##Theory

###Scroll Space Calculation.

The scroll space is calculated base on the `rowHeight`, `columnCount` and the size of dataset. the total scroll space
will be calculated once both the three factor is ready. Once any factor is changed, it is required to recalculate the
scroll space and relayout

