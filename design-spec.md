#Design Spec

This is the design specification for ng-gridview. It describes the goal for design this component, theory for how it works and some use caveats.

##Goal

The ng-gridview component is a **infinite grid view** for angular 1.x, the performance is always the first concern

- It can provide the smooth scrolling for super large dataset. but not fit for frequently changed dataset.
- The grid template can be any angular directive or DOM node except for text node.
- To provide a fast initial render. the row height and column count must be specified at the intialization.
- Keep a small memory usage.

##Theory

###Scroll Space Calculation.

The scroll space is calculated base on the `rowHeight`, `columnCount` and the size of dataset. the total scroll space
will be calculated once both the three factor is ready. Once any factor is changed, it is required to recalculate the
scroll space and relayout

###Grid cell positioning

Thanks to the predefined `rowHeight` and `columnCount`, all the grid cell position can be calculated according to its index
 in dataset. the is a compromise for flexibility of grid size, means it is not allow the change grid size for each grid.

Because we have already calculate the total height of the grid cell holder, so the actual positioning operation is translate
the grid cell by its top left corner.

First, calcalute the current scrollTop of wrapper (This operation will force a relayout which may impact the rendering
performance) then calculate the first row index and last row index which is the row just leaving current screen bound.
then we can get the start index and end index to be rendered.

Then, iterating the existing grid cells, recycle any grid cell which index is out of the range of we just calculated. The
recycled cells may be reused in the future, so we need to implement a Recycler(see the section below)

The last job is insert new cells to cell holder. this operation have two strategies depend on whether there are cells
 in holder.

- If there are cells in holder, then insert cells from start index to the first existing cell index.
- If the holder is empty, insert cells from start index to the end index.

This diagram demostrates the position theory

![layout](gridview-layout.png)

###Recycler

To improve rendering performance when user scroll between two directions, a cache for detached cells is required. when user
scroll back to a position which is rendered with cells just a moment ago. it is faster to re-attach the old cells from that
position than render a brand new cell.

To satisfy the requirements for recycling cells, a recycler should 
- record the position for each detached cell.
- retrieve cells according to given position. when no recycled cell is found for a given position, a `null` is returned.
- should limit the recycled cells number, when limit is exceed, the recycler should be able to clean the unused cells to keep small memory usage. 