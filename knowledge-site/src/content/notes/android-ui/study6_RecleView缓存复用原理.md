## 一、RecyleView的简单用法
```java
package com.leo.rv_recycler;

import android.os.Bundle;
import android.widget.LinearLayout;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

/
 * RecyclerView缓存机制
 */
public class MainActivity extends AppCompatActivity {

    private RecyclerView rv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        rv = findViewById(R.id.rv);

        rv.setLayoutManager(new GridLayoutManager(this, 1));
        rv.addItemDecoration(new DividerItemDecoration(this, LinearLayout.VERTICAL));

        final List<String> list = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            list.add("" + i);
        }

        final CustomAdapter adapter = new CustomAdapter(this, list);
        rv.setAdapter(adapter);
    }
}
```

```java
package com.leo.rv_recycler;

import android.content.Context;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class CustomAdapter extends RecyclerView.Adapter<CustomAdapter.CustomViewHolder> {

    private final Context context;
    private List<String> list;

    private static final String TAG = "leo";

    public CustomAdapter(Context context, List<String> list) {
        this.context = context;
        this.list = list;
    }

    @Override
    public CustomViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_rv, parent, false);
        Log.e(TAG, "onCreateViewHolder: " + getItemCount());
        return new CustomViewHolder(view);
    }

    @Override
    public void onBindViewHolder(CustomViewHolder holder, int position) {
        holder.tv.setText(list.get(position));
        Log.e(TAG, "onBindViewHolder: " + position);
    }

    @Override
    public int getItemCount() {
        return list == null ? 0 : list.size();
    }

    public static class CustomViewHolder extends RecyclerView.ViewHolder {
        private TextView tv;

        public CustomViewHolder(View itemView) {
            super(itemView);
            tv = itemView.findViewById(R.id.tv);
        }
    }
}

```

写一个简单的RecyclerView的app,重写RecyclerView.Adapter，打印onCreateViewHolder和onBindViewHolder，我们发现不断地上下滑动，onCreateViewHolder没有一直打印，而onBindViewHolder会一直打印，为什么？这说明我们每次都是复用了缓存的ViewHolder.

我们知道使用ListView时我们会手写一个ViewHolder，因为getView的时候我们是使用findViewById()的方法，而使用ViewHolder的好处就在于可以避免每次getView都进行findViewById()操作，因为findViewById()利用的是DFS算法（深度优化搜索），是非常耗性能的。

对于RecyclerView来说，强制实现ViewHolder的其中一个原因就是避免多次进行findViewById()的处理，另一个原因就是因为ItemView和ViewHolder的关系是一对一，也就是说一个ViewHolder对应一个ItemView。这个ViewHolder当中持有对应的ItemView的所有信息，比如说：position；view；width等等，拿到了ViewHolder基本就拿到了ItemView的所有信息，而ViewHolder使用起来相比itemView更加方便。

RecyclerView缓存机制缓存的就是ViewHolder（ListView缓存的是ItemView），这也是为什么RecyclerView为什么强制我们实现ViewHolder的原因。

是怎么进行的缓存复用？我们要从源码分析下。

## 二、RecyclerView 的缓存和复用的示例流程
首先，我们要从源码的什么位置开始看起，从我们前面学的知识入手，因为我们滑动时会刷新列表，那么当滑动时就一定有缓存和复用，当我们滑动时，会触发onTouchEvent#onMove，回收及复用ViewHolder在这里就会开始：

我们在之前的学习中已经学习过，当嵌套滑动时RecyclerView的执行有如下过程：

RecyclerView  --》 dispatchNestedPreScroll --> scrollByInternal --> dispatchNestedScroll --> pullGlows(边缘效果)

### 1、scrollByInternal
而当我们执行到scrollByInternal时

```java
if (mAdapter != null) {
	eatRequestLayout();
	onEnterLayoutOrScroll();
	Trace.beginSection(TRACE_SCROLL_TAG);
	if (x != 0) {
		consumedX = mLayout.scrollHorizontallyBy(x, mRecycler, mState);
		unconsumedX = x - consumedX;
	}
	if (y != 0) {
		consumedY = mLayout.scrollVerticallyBy(y, mRecycler, mState);
		unconsumedY = y - consumedY;
	}
	Trace.endSection();
	repositionShadowingViews();
	onExitLayoutOrScroll();
	resumeRequestLayout(false);
}
```

会执行mLayout.scrollHorizontallyBy和mLayout.scrollVerticallyBy，会在水平或者垂直方向滑动，这里的layout就是我们在MainActivity中设置的GridLayoutManager，所以这也是为什么MainActivity里我们在使用RecyclerView的时候需要设置LayoutManager的原因，LayoutManager负责RecyclerView的布局，包含对ItemView的获取与复用。

```java
public int scrollHorizontallyBy(int dx, RecyclerView.Recycler recycler, RecyclerView.State state) {
	this.updateMeasurements();
	this.ensureViewSet();
	return super.scrollHorizontallyBy(dx, recycler, state);
}

public int scrollVerticallyBy(int dy, RecyclerView.Recycler recycler, RecyclerView.State state) {
	this.updateMeasurements();
	this.ensureViewSet();
	return super.scrollVerticallyBy(dy, recycler, state);
}
```

而我们这里使用的GridLayoutManager继承自LinearLayoutManager，所以我们继续看LinearLayoutManager代码：

```java
public int scrollVerticallyBy(int dy, RecyclerView.Recycler recycler,
							  RecyclerView.State state) {
	if (mOrientation == HORIZONTAL) {
		return 0;
	}
	return scrollBy(dy, recycler, state);
}
```

### 2、scrollBy
可以看到，会调用scrollBy，我们知道scrollBy就是用于滚动视图的方法，所以当滚动视图时，是怎么加载的item显示哪，我们继续看代码：

```java
int scrollBy(int dy, RecyclerView.Recycler recycler, RecyclerView.State state) {
	if (getChildCount() == 0 || dy == 0) {
		return 0;
	}
	mLayoutState.mRecycle = true;
	ensureLayoutState();
	final int layoutDirection = dy > 0 ? LayoutState.LAYOUT_END : LayoutState.LAYOUT_START;
	final int absDy = Math.abs(dy);
	updateLayoutState(layoutDirection, absDy, true, state);
	final int consumed = mLayoutState.mScrollingOffset
			+ fill(recycler, mLayoutState, state, false);
	if (consumed < 0) {
		if (DEBUG) {
			Log.d(TAG, "Don't have any more elements to scroll");
		}
		return 0;
	}
	final int scrolled = absDy > consumed ? layoutDirection * consumed : dy;
	mOrientationHelper.offsetChildren(-scrolled);
	if (DEBUG) {
		Log.d(TAG, "scroll req: " + dy + " scrolled: " + scrolled);
	}
	mLayoutState.mLastScrollDelta = scrolled;
	return scrolled;
}
```

重点看`final int consumed = mLayoutState.mScrollingOffset + fill(recycler, mLayoutState, state, false);`这一句，这句代码就是计算消费了多少距离，在计算时调用了fill方法，这个方法的作用是填充 RecyclerView 的布局空间，它根据 LayoutState 对象的配置来决定如何填充

### 3、fill
继续看fill代码：

fill方法中一开始会在特定条件下执行`recycleByLayoutState(recycler, layoutState);`，回收子视图缓存起来方便后面复用。

```java
int fill(RecyclerView.Recycler recycler, LayoutState layoutState,
		RecyclerView.State state, boolean stopOnFocusable) {
	// max offset we should set is mFastScroll + available
	//记录开始填充前可用的空间量
	final int start = layoutState.mAvailable;
	//如果 layoutState.mScrollingOffset 已经被设置，那么在布局之前需要进行一些滚动偏移的处理
	if (layoutState.mScrollingOffset != LayoutState.SCROLLING_OFFSET_NaN) {
		// TODO ugly bug fix. should not happen
		if (layoutState.mAvailable < 0) {
			layoutState.mScrollingOffset += layoutState.mAvailable;
		}
		recycleByLayoutState(recycler, layoutState);
	}
	//计算总共还需要填充的空间
	int remainingSpace = layoutState.mAvailable + layoutState.mExtra;
	LayoutChunkResult layoutChunkResult = mLayoutChunkResult;
	//使用 while 循环来不断布局项目，直到没有更多项目可以布局或者没有剩余空间
	//在每次循环中，调用 layoutChunk 方法来布局一个项目块
	while ((layoutState.mInfinite || remainingSpace > 0) && layoutState.hasMore(state)) {
		layoutChunkResult.resetInternal();
		layoutChunk(recycler, state, layoutState, layoutChunkResult);
		if (layoutChunkResult.mFinished) {
			break;
		}
		//根据布局方向更新偏移量
		layoutState.mOffset += layoutChunkResult.mConsumed * layoutState.mLayoutDirection;
		/
		 * Consume the available space if:
		 * * layoutChunk did not request to be ignored
		 * * OR we are laying out scrap children
		 * * OR we are not doing pre-layout
		 */
		//根据是否是预布局（state.isPreLayout()）和 layoutChunkResult.mIgnoreConsumed 的值，
		//更新 layoutState.mAvailable 和 remainingSpace
		if (!layoutChunkResult.mIgnoreConsumed || mLayoutState.mScrapList != null
				|| !state.isPreLayout()) {
			layoutState.mAvailable -= layoutChunkResult.mConsumed;
			// we keep a separate remaining space because mAvailable is important for recycling
			remainingSpace -= layoutChunkResult.mConsumed;
		}

		if (layoutState.mScrollingOffset != LayoutState.SCROLLING_OFFSET_NaN) {
			layoutState.mScrollingOffset += layoutChunkResult.mConsumed;
			if (layoutState.mAvailable < 0) {
				layoutState.mScrollingOffset += layoutState.mAvailable;
			}
			recycleByLayoutState(recycler, layoutState);
		}
		//如果 stopOnFocusable 为 true 并且最新布局的项目是可聚焦的，则停止布局
		if (stopOnFocusable && layoutChunkResult.mFocusable) {
			break;
		}
	}
	if (DEBUG) {
		validateChildOrder();
	}
	//返回填充过程中实际使用的像素数
	return start - layoutState.mAvailable;
}
```

### 4、layoutChunk
在fill方法中，一个重要的点是recycleByLayoutState回收缓存ViewHolder，另一个重要的就是使用 while 循环来不断布局项目，在每次循环中，调用 layoutChunk 方法来布局一个项目块。后面我们会分析回收ViewHolder的流程，这里我们先继续看layoutChunk方法：

```java
void layoutChunk(RecyclerView.Recycler recycler, RecyclerView.State state,
		LayoutState layoutState, LayoutChunkResult result) {
	//从 layoutState 获取下一个要布局的视图
	View view = layoutState.next(recycler);
	if (view == null) {
		//表示没有更多项目可以布局
		if (DEBUG && layoutState.mScrapList == null) {
			throw new RuntimeException("received null view when unexpected");
		}
		// if we are laying out views in scrap, this may return null which means there is
		// no more items to layout.
		result.mFinished = true;
		return;
	}
	LayoutParams params = (LayoutParams) view.getLayoutParams();
	//添加视图到 RecyclerView，根据是否使用废料列表（mScrapList）和布局方向，
	//将视图添加到 RecyclerView 的末尾或开头。
	if (layoutState.mScrapList == null) {
		if (mShouldReverseLayout == (layoutState.mLayoutDirection
				== LayoutState.LAYOUT_START)) {
			addView(view);
		} else {
			addView(view, 0);
		}
	} else {
		if (mShouldReverseLayout == (layoutState.mLayoutDirection
				== LayoutState.LAYOUT_START)) {
			addDisappearingView(view);
		} else {
			addDisappearingView(view, 0);
		}
	}
	//测量视图，包括边距
	measureChildWithMargins(view, 0, 0);
	result.mConsumed = mOrientationHelper.getDecoratedMeasurement(view);
	int left, top, right, bottom;
	//根据 LinearLayoutManager 的方向（垂直或水平）和布局方向（开始或结束），
	//计算视图的左右或上下边界
	if (mOrientation == VERTICAL) {
		if (isLayoutRTL()) {
			right = getWidth() - getPaddingRight();
			left = right - mOrientationHelper.getDecoratedMeasurementInOther(view);
		} else {
			left = getPaddingLeft();
			right = left + mOrientationHelper.getDecoratedMeasurementInOther(view);
		}
		if (layoutState.mLayoutDirection == LayoutState.LAYOUT_START) {
			bottom = layoutState.mOffset;
			top = layoutState.mOffset - result.mConsumed;
		} else {
			top = layoutState.mOffset;
			bottom = layoutState.mOffset + result.mConsumed;
		}
	} else {
		top = getPaddingTop();
		bottom = top + mOrientationHelper.getDecoratedMeasurementInOther(view);

		if (layoutState.mLayoutDirection == LayoutState.LAYOUT_START) {
			right = layoutState.mOffset;
			left = layoutState.mOffset - result.mConsumed;
		} else {
			left = layoutState.mOffset;
			right = layoutState.mOffset + result.mConsumed;
		}
	}
	// We calculate everything with View's bounding box (which includes decor and margins)
	// To calculate correct layout position, we subtract margins.
	//布局视图，使用计算出的边界值布局视图，包括边距和装饰
	layoutDecoratedWithMargins(view, left, top, right, bottom);
	if (DEBUG) {
		Log.d(TAG, "laid out child at position " + getPosition(view) + ", with l:"
				+ (left + params.leftMargin) + ", t:" + (top + params.topMargin) + ", r:"
				+ (right - params.rightMargin) + ", b:" + (bottom - params.bottomMargin));
	}
	// Consume the available space if the view is not removed OR changed
	//如果视图被标记为已移除或已更改，则设置 result.mIgnoreConsumed 为 true，
	//表示不消耗可用空间
	if (params.isItemRemoved() || params.isItemChanged()) {
		result.mIgnoreConsumed = true;
	}
	//如果视图是可聚焦的，result.mFocusable 为 true
	result.mFocusable = view.isFocusable();
}
```

`layoutChunk`负责布局 `RecyclerView` 中的单个项目，是 `fill` 方法的一部分，`fill` 方法会多次调用 `layoutChunk` 来布局多个项目，确保每个项目都被正确地测量和放置在 RecyclerView 中。通过这种方式，`LinearLayoutManager` 可以支持垂直和水平布局，以及从不同方向开始布局项目。

在这段代码中，我们先调用了`layoutState.next(recycler)`拿到了布局，然后将view添加到了RecylerView,紧接着就是进行测量`layoutDecoratedWithMargins(view, left, top, right, bottom)`，此处的测量和我们之前所说的测量还有所不同，之前讲到的，正常测量流程一般关心的是padding,margin，而这里还要关心inset,也就是分割线的空间。

### 5、next
第一行代码`View view = layoutState.next(recycler);`，在这里我们就可以看到滚动列表布局视图时，view是怎么复用的。

```java
View next(RecyclerView.Recycler recycler) {
	if (mScrapList != null) {
		return nextViewFromScrapList();
	}
	final View view = recycler.getViewForPosition(mCurrentPosition);
	mCurrentPosition += mItemDirection;
	return view;
}
```

```java
public View getViewForPosition(int position) {
	return getViewForPosition(position, false);
}

View getViewForPosition(int position, boolean dryRun) {
	return tryGetViewHolderForPositionByDeadline(position, dryRun, FOREVER_NS).itemView;
}
```

#### (1) tryGetViewHolderForPositionByDeadline
一步步跟踪代码发现最后调用到了RecyclerView中的tryGetViewHolderForPositionByDeadline方法，而这个方法就是我们主要的复用代码。

```java
ViewHolder tryGetViewHolderForPositionByDeadline(int position,
		boolean dryRun, long deadlineNs) {
	if (position < 0 || position >= mState.getItemCount()) {
		throw new IndexOutOfBoundsException("Invalid item position " + position
				+ "(" + position + "). Item count:" + mState.getItemCount());
	}
	boolean fromScrapOrHiddenOrCache = false;
	ViewHolder holder = null;
	// 0) If there is a changed scrap, try to find from there
	if (mState.isPreLayout()) {
		holder = getChangedScrapViewForPosition(position);
		fromScrapOrHiddenOrCache = holder != null;
	}
	// 1) Find by position from scrap/hidden list/cache
	if (holder == null) {
		holder = getScrapOrHiddenOrCachedHolderForPosition(position, dryRun);
		if (holder != null) {
			if (!validateViewHolderForOffsetPosition(holder)) {
				// recycle holder (and unscrap if relevant) since it can't be used
				if (!dryRun) {
					// we would like to recycle this but need to make sure it is not used by
					// animation logic etc.
					holder.addFlags(ViewHolder.FLAG_INVALID);
					if (holder.isScrap()) {
						removeDetachedView(holder.itemView, false);
						holder.unScrap();
					} else if (holder.wasReturnedFromScrap()) {
						holder.clearReturnedFromScrapFlag();
					}
					recycleViewHolderInternal(holder);
				}
				holder = null;
			} else {
				fromScrapOrHiddenOrCache = true;
			}
		}
	}
	if (holder == null) {
		final int offsetPosition = mAdapterHelper.findPositionOffset(position);
		if (offsetPosition < 0 || offsetPosition >= mAdapter.getItemCount()) {
			throw new IndexOutOfBoundsException("Inconsistency detected. Invalid item "
					+ "position " + position + "(offset:" + offsetPosition + ")."
					+ "state:" + mState.getItemCount());
		}

		final int type = mAdapter.getItemViewType(offsetPosition);
		// 2) Find from scrap/cache via stable ids, if exists
		if (mAdapter.hasStableIds()) {
			holder = getScrapOrCachedViewForId(mAdapter.getItemId(offsetPosition),
					type, dryRun);
			if (holder != null) {
				// update position
				holder.mPosition = offsetPosition;
				fromScrapOrHiddenOrCache = true;
			}
		}
		if (holder == null && mViewCacheExtension != null) {
			// We are NOT sending the offsetPosition because LayoutManager does not
			// know it.
			final View view = mViewCacheExtension
					.getViewForPositionAndType(this, position, type);
			if (view != null) {
				holder = getChildViewHolder(view);
				if (holder == null) {
					throw new IllegalArgumentException("getViewForPositionAndType returned"
							+ " a view which does not have a ViewHolder");
				} else if (holder.shouldIgnore()) {
					throw new IllegalArgumentException("getViewForPositionAndType returned"
							+ " a view that is ignored. You must call stopIgnoring before"
							+ " returning this view.");
				}
			}
		}
		if (holder == null) { // fallback to pool
			if (DEBUG) {
				Log.d(TAG, "tryGetViewHolderForPositionByDeadline("
						+ position + ") fetching from shared pool");
			}
			holder = getRecycledViewPool().getRecycledView(type);
			if (holder != null) {
				holder.resetInternal();
				if (FORCE_INVALIDATE_DISPLAY_LIST) {
					invalidateDisplayListInt(holder);
				}
			}
		}
		if (holder == null) {
			long start = getNanoTime();
			if (deadlineNs != FOREVER_NS
					&& !mRecyclerPool.willCreateInTime(type, start, deadlineNs)) {
				// abort - we have a deadline we can't meet
				return null;
			}
			holder = mAdapter.createViewHolder(RecyclerView.this, type);
			if (ALLOW_THREAD_GAP_WORK) {
				// only bother finding nested RV if prefetching
				RecyclerView innerView = findNestedRecyclerView(holder.itemView);
				if (innerView != null) {
					holder.mNestedRecyclerView = new WeakReference<>(innerView);
				}
			}

			long end = getNanoTime();
			mRecyclerPool.factorInCreateTime(type, end - start);
			if (DEBUG) {
				Log.d(TAG, "tryGetViewHolderForPositionByDeadline created new ViewHolder");
			}
		}
	}

	// This is very ugly but the only place we can grab this information
	// before the View is rebound and returned to the LayoutManager for post layout ops.
	// We don't need this in pre-layout since the VH is not updated by the LM.
	if (fromScrapOrHiddenOrCache && !mState.isPreLayout() && holder
			.hasAnyOfTheFlags(ViewHolder.FLAG_BOUNCED_FROM_HIDDEN_LIST)) {
		holder.setFlags(0, ViewHolder.FLAG_BOUNCED_FROM_HIDDEN_LIST);
		if (mState.mRunSimpleAnimations) {
			int changeFlags = ItemAnimator
					.buildAdapterChangeFlagsForAnimations(holder);
			changeFlags |= ItemAnimator.FLAG_APPEARED_IN_PRE_LAYOUT;
			final ItemHolderInfo info = mItemAnimator.recordPreLayoutInformation(mState,
					holder, changeFlags, holder.getUnmodifiedPayloads());
			recordAnimationInfoIfBouncedHiddenView(holder, info);
		}
	}

	boolean bound = false;
	if (mState.isPreLayout() && holder.isBound()) {
		// do not update unless we absolutely have to.
		holder.mPreLayoutPosition = position;
	} else if (!holder.isBound() || holder.needsUpdate() || holder.isInvalid()) {
		if (DEBUG && holder.isRemoved()) {
			throw new IllegalStateException("Removed holder should be bound and it should"
					+ " come here only in pre-layout. Holder: " + holder);
		}
		final int offsetPosition = mAdapterHelper.findPositionOffset(position);
		bound = tryBindViewHolderByDeadline(holder, offsetPosition, position, deadlineNs);
	}

	final ViewGroup.LayoutParams lp = holder.itemView.getLayoutParams();
	final LayoutParams rvLayoutParams;
	if (lp == null) {
		rvLayoutParams = (LayoutParams) generateDefaultLayoutParams();
		holder.itemView.setLayoutParams(rvLayoutParams);
	} else if (!checkLayoutParams(lp)) {
		rvLayoutParams = (LayoutParams) generateLayoutParams(lp);
		holder.itemView.setLayoutParams(rvLayoutParams);
	} else {
		rvLayoutParams = (LayoutParams) lp;
	}
	rvLayoutParams.mViewHolder = holder;
	rvLayoutParams.mPendingInvalidate = fromScrapOrHiddenOrCache && bound;
	return holder;
}
```

tryGetViewHolderForPositionByDeadline用于尝试获取特定位置的 ViewHolder。这个方法考虑了多种来源来获取 ViewHolder，包括废料列表（scrap）、隐藏列表、缓存、或者直接创建一个新的 ViewHolder。此外，它还考虑了一个性能优化的特性，即如果有一个截止时间（deadline），并且它认为没有足够的时间获取到它可能会提前返回，而不是构造或绑定 ViewHolder。

### 6、measureChildWithMargins
再回到layoutChunk方法中往下面分析，会调用到measureChildWithMargins方法，该方法用于测量 RecyclerView 中单个子视图的宽度和高度，并考虑了子视图的边距和装饰（如分割线）。

其中子视图间的分割线空间通过`mRecyclerView.getItemDecorInsetsForChild(child)`获取。然后会调用到子视图的measure方法。

```java
//widthUsed 和 heightUsed，这两个参数表示在测量之前已经使用的宽度和高度
public void measureChildWithMargins(View child, int widthUsed, int heightUsed) {
	final LayoutParams lp = (LayoutParams) child.getLayoutParams();

	//获取子视图的装饰（如分割线）插入值，这些值表示装饰在子视图周围的空间。
	final Rect insets = mRecyclerView.getItemDecorInsetsForChild(child);
	//更新已使用的宽度和高度，加上装饰的宽度和高度。
	widthUsed += insets.left + insets.right;
	heightUsed += insets.top + insets.bottom;

	//创建宽度的测量规格（widthSpec），
	//它考虑了 RecyclerView 的宽度、填充、子视图的边距、已使用的宽度和子视图的布局参数
	final int widthSpec = getChildMeasureSpec(getWidth(), getWidthMode(),
			getPaddingLeft() + getPaddingRight()
					+ lp.leftMargin + lp.rightMargin + widthUsed, lp.width,
			canScrollHorizontally());
	//创建高度的测量规格（heightSpec），
	//它考虑了 RecyclerView 的高度、填充、子视图的边距、已使用的宽度和子视图的布局参数
	final int heightSpec = getChildMeasureSpec(getHeight(), getHeightMode(),
			getPaddingTop() + getPaddingBottom()
					+ lp.topMargin + lp.bottomMargin + heightUsed, lp.height,
			canScrollVertically());
	//调用 shouldMeasureChild 方法来决定是否需要测量子视图。
	//如果需要，调用子视图的 measure 方法，传入计算出的宽度和高度规格
	if (shouldMeasureChild(child, widthSpec, heightSpec, lp)) {
		child.measure(widthSpec, heightSpec);
	}
}
```

#### (1) getItemDecorInsetsForChild
getItemDecorInsetsForChild方法用于计算给定子视图的装饰（如分割线或自定义装饰）插入值，这些插入值定义了子视图周围的空间。这些插入值随后可以用于测量和布局子视图，以确保子视图之间有适当的空间做分割线或者其他装饰布局。

```java
Rect getItemDecorInsetsForChild(View child) {
	final LayoutParams lp = (LayoutParams) child.getLayoutParams();
	//如果布局参数中的 mInsetsDirty 标志为 false，表示装饰插入值已经是最新的，可以直接返回。
	if (!lp.mInsetsDirty) {
		return lp.mDecorInsets;
	}

	//如果处于预布局阶段，并且子视图的项目已更改或视图无效，那么不应该更新装饰插入值，
	//直到它们被重新绑定
	if (mState.isPreLayout() && (lp.isItemChanged() || lp.isViewInvalid())) {
		// changed/invalid items should not be updated until they are rebound.
		return lp.mDecorInsets;
	}
	//初始化 Rect 对象 insets 来存储装饰插入值，并将所有边设置为0。
	final Rect insets = lp.mDecorInsets;
	insets.set(0, 0, 0, 0);
	//遍历所有的 ItemDecoration 对象，调用它们的 getItemOffsets 方法来获取每个装饰的插入值，
	//并累加到 insets 中
	final int decorCount = mItemDecorations.size();
	for (int i = 0; i < decorCount; i++) {
		mTempRect.set(0, 0, 0, 0);
		mItemDecorations.get(i).getItemOffsets(mTempRect, child, this, mState);
		insets.left += mTempRect.left;
		insets.top += mTempRect.top;
		insets.right += mTempRect.right;
		insets.bottom += mTempRect.bottom;
	}
	//更新布局参数中的 mInsetsDirty 标志为 false，表示装饰插入值已经更新
	lp.mInsetsDirty = false;
	//返回包含最终装饰插入值的 Rect 对象
	return insets;
}
```

在上面的代码里，最后是遍历所有的 ItemDecoration 对象并调用它们的 getItemOffsets 方法来获取每个装饰的插入值并累加到 insets 中，如果自己要画分割线就要重写getItemOffsets自己去预留出分割线的部分出来，否则用的是系统提供的默认值。

### 7、layoutDecoratedWithMargins
在measureChildWithMargins测量完子视图之后就要调用layoutDecoratedWithMargins去布局子视图，该方法会调用到子视图的layout方法。

```java
public void layoutDecoratedWithMargins(View child, int left, int top, int right,
									   int bottom) {
	final LayoutParams lp = (LayoutParams) child.getLayoutParams();
	final Rect insets = lp.mDecorInsets;
	child.layout(left + insets.left + lp.leftMargin, top + insets.top + lp.topMargin,
				 right - insets.right - lp.rightMargin,
				 bottom - insets.bottom - lp.bottomMargin);
}
```

## 三、RecyclerView的四级缓存概念和原理
> 参考文章：[深入理解Android RecyclerView的缓存机制](https://segmentfault.com/a/1190000040421118)
>

ViewHolder的复用涉及到了缓存，而RecyclerView的缓存我们一般分为四级缓存。

### 1、四级缓存
Recycler缓存ViewHolder对象有4个等级，优先级从高到底依次为：

+ mAttachedScrap：缓存屏幕中可见范围的ViewHolder；
+ mCachedViews：缓存滑动时即将与RecyclerView分离的ViewHolder，默认最大2个；
+ ViewCacheExtension：自定义实现的缓存；
+ RecycledViewPool ：ViewHolder缓存池，可以支持不同的ViewType；

#### (1) 第一级缓存 mAttachedScrap和mChangedScrap
mAttachedScrap存储的是当前屏幕中的ViewHolder，mAttachedScrap的对应数据结构是ArrayList，在调用LayoutManager#onLayoutChildren方法时对views进行布局，此时会将RecyclerView上的Views全部暂存到该集合中，该缓存中的ViewHolder的特性是，如果和RecyclerView上的position或者itemId匹配上了那么可以直接拿来使用的，无需调用onBindViewHolder方法。例如局部刷新时我们屏幕内刷新某个item，可以mAttachedScrap获取当前的viewHolder，实现性能优化。

mChangedScrap和mAttachedScrap属于同一级别的缓存，不过mChangedScrap的调用场景是notifyItemChanged和notifyItemRangeChanged，只有发生变化的ViewHolder才会放入到mChangedScrap中。mChangedScrap缓存中的ViewHolder是需要调用onBindViewHolder方法重新绑定数据的。

#### (2) 第二级缓存 mCachedViews
mCachedViews缓存滑动时即将与RecyclerView分离的ViewHolder，按子View的position或id缓存，默认最多存放2个。mCachedViews对应的数据结构是ArrayList，但是该缓存对集合的大小是有限制的。

该缓存中ViewHolder的特性和mAttachedScrap中的特性是一样的，只要position或者itemId对应就无需重新绑定数据。开发者可以调用setItemViewCacheSize(size)方法来改变缓存的大小，该层级缓存触发的一个常见的场景是滑动RecyclerView。当然调用notify()也会触发该缓存。

#### (3) 第三级缓存 ViewCacheExtension
ViewCacheExtension是需要开发者自己实现的缓存，基本上页面上的所有数据都可以通过它进行实现。

#### (4) 第四级缓存 RecyclerViewPool
ViewHolder缓存池，本质上是一个SparseArray，其中key是ViewType(int类型)，value存放的是 ArrayList< ViewHolder>，默认每个ArrayList中最多存放5个ViewHolder。

#### (5) 四级缓存对比
| 缓存级别 | 涉及对象 | 说明 | 是否重新创建视图View | 是否重新绑定数据 |
| :--- | :--- | :--- | :--- | :--- |
| 一级缓存 | mAttachedScrap mChangedScrap | 缓存屏幕中可见范围的ViewHolder | false | false |
| 二级缓存 | mCachedViews | 缓存滑动时即将与RecyclerView分离的ViewHolder，按子View的position或id缓存 | false | false |
| 三级缓存 | mViewCacheExtension | 开发者自行实现的缓存 |  |  |
| 四级缓存 | mRecyclerPool | ViewHolder缓存池，本质上是一个SparseArray，其中key是ViewType(int类型)，value存放的是 ArrayList< ViewHolder>，默认每个ArrayList中最多存放5个ViewHolder | false | true |


### 2、RecyclerView的复用流程
在复用ViewHolder时，会根据缓存层级查找是否存在缓存的ViewHolder，代码主要在前面提到的`tryGetViewHolderForPositionByDeadline`代码中，下面具体分析这段代码：

```java
//如果它是改变的废弃的ViewHolder，在scrap的mChangedScrap找
if (mState.isPreLayout()){
	holder = getChangedScrapViewForPosition(position);
	fromScrapOrHiddenOrCache = holder != null;
}
```

isPreLayout主要是对动画相关才会进行一个预处理，如果没有动画的话这一块是不会走的。

> isPreLayout用于检查当前是否处于预布局（pre-layout）阶段。预布局阶段是在 RecyclerView 布局发生之前，用于处理数据变更和动画的阶段。
>
> 当 RecyclerView 需要在布局计算之前处理动画效果时，比如在数据集变更（如添加、删除或移动项目）后显示动画，isPreLayout 可以用来标记这些项目，以便在布局阶段之前进行处理，从而确保 RecyclerView 的动画和数据变更能够平滑地进行。
>

#### (1) getChangedScrapViewForPosition
一般情况下，当我们调用adapter的notifyItemChanged()方法，数据发生变化时，item缓存在mChangedScrap中，后续拿到的ViewHolder需要重新绑定数据。此时查找ViewHolder就会通过position和StableId分别在scrap的mChangedScrap中查找，代码如下：

```java
ViewHolder getChangedScrapViewForPosition(int position) {
	// If pre-layout, check the changed scrap for an exact match.
	final int changedScrapSize;
	if (mChangedScrap == null || (changedScrapSize = mChangedScrap.size()) == 0) {
		return null;
	}
	// find by position
	for (int i = 0; i < changedScrapSize; i++) {
		final ViewHolder holder = mChangedScrap.get(i);
		if (!holder.wasReturnedFromScrap() && holder.getLayoutPosition() == position) {
			holder.addFlags(ViewHolder.FLAG_RETURNED_FROM_SCRAP);
			return holder;
		}
	}
	// find by id
	if (mAdapter.hasStableIds()) {
		final int offsetPosition = mAdapterHelper.findPositionOffset(position);
		if (offsetPosition > 0 && offsetPosition < mAdapter.getItemCount()) {
			final long id = mAdapter.getItemId(offsetPosition);
			for (int i = 0; i < changedScrapSize; i++) {
				final ViewHolder holder = mChangedScrap.get(i);
				if (!holder.wasReturnedFromScrap() && holder.getItemId() == id) {
					holder.addFlags(ViewHolder.FLAG_RETURNED_FROM_SCRAP);
					return holder;
				}
			}
		}
	}
	return null;
}
```

#### (2) getScrapOrHiddenOrCachedHolderForPosition
如果没有找到视图，根据position分别在scrap的mAttachedScrap、mChildHelper、mCachedViews中查找，涉及的方法如下：

```java
ViewHolder getScrapOrHiddenOrCachedHolderForPosition(int position, boolean dryRun) {
	final int scrapCount = mAttachedScrap.size();

	// Try first for an exact, non-invalid match from scrap.
	for (int i = 0; i < scrapCount; i++) {
		final ViewHolder holder = mAttachedScrap.get(i);
		if (!holder.wasReturnedFromScrap() && holder.getLayoutPosition() == position
				&& !holder.isInvalid() && (mState.mInPreLayout || !holder.isRemoved())) {
			holder.addFlags(ViewHolder.FLAG_RETURNED_FROM_SCRAP);
			return holder;
		}
	}

	if (!dryRun) {
		View view = mChildHelper.findHiddenNonRemovedView(position);
		if (view != null) {
			// This View is good to be used. We just need to unhide, detach and move to the
			// scrap list.
			final ViewHolder vh = getChildViewHolderInt(view);
			mChildHelper.unhide(view);
			int layoutIndex = mChildHelper.indexOfChild(view);
			if (layoutIndex == RecyclerView.NO_POSITION) {
				throw new IllegalStateException("layout index should not be -1 after "
						+ "unhiding a view:" + vh);
			}
			mChildHelper.detachViewFromParent(layoutIndex);
			scrapView(view);
			vh.addFlags(ViewHolder.FLAG_RETURNED_FROM_SCRAP
					| ViewHolder.FLAG_BOUNCED_FROM_HIDDEN_LIST);
			return vh;
		}
	}

	// Search in our first-level recycled view cache.
	final int cacheSize = mCachedViews.size();
	for (int i = 0; i < cacheSize; i++) {
		final ViewHolder holder = mCachedViews.get(i);
		// invalid view holders may be in cache if adapter has stable ids as they can be
		// retrieved via getScrapOrCachedViewForId
		if (!holder.isInvalid() && holder.getLayoutPosition() == position) {
			if (!dryRun) {
				mCachedViews.remove(i);
			}
			if (DEBUG) {
				Log.d(TAG, "getScrapOrHiddenOrCachedHolderForPosition(" + position
						+ ") found match in cache: " + holder);
			}
			return holder;
		}
	}
	return null;
}
```

可以看到，getScrapOrHiddenOrCachedHolderForPosition查找ViewHolder的顺序如下：

+ 首先，从mAttachedScrap中查找，精准匹配当前屏幕中有效的ViewHolder；
+ 接着，在mChildHelper中mHiddenViews查找隐藏的ViewHolder；
+ 最后，从mCachedViews查找。

#### (3) getScrapOrCachedViewForId
如果在getScrapOrHiddenOrCachedHolderForPosition没有找到视图，则通过id在scrap的mAttachedScrap、mCachedViews中查找，代码如下：

```java
ViewHolder getScrapOrCachedViewForId(long id, int type, boolean dryRun) {
	// Look in our attached views first
	final int count = mAttachedScrap.size();
	for (int i = count - 1; i >= 0; i--) {
		final ViewHolder holder = mAttachedScrap.get(i);
		if (holder.getItemId() == id && !holder.wasReturnedFromScrap()) {
			if (type == holder.getItemViewType()) {
				holder.addFlags(ViewHolder.FLAG_RETURNED_FROM_SCRAP);
				if (holder.isRemoved()) {
					// this might be valid in two cases:
					// > item is removed but we are in pre-layout pass
					// >> do nothing. return as is. make sure we don't rebind
					// > item is removed then added to another position and we are in
					// post layout.
					// >> remove removed and invalid flags, add update flag to rebind
					// because item was invisible to us and we don't know what happened in
					// between.
					if (!mState.isPreLayout()) {
						holder.setFlags(ViewHolder.FLAG_UPDATE, ViewHolder.FLAG_UPDATE
								| ViewHolder.FLAG_INVALID | ViewHolder.FLAG_REMOVED);
					}
				}
				return holder;
			} else if (!dryRun) {
				// if we are running animations, it is actually better to keep it in scrap
				// but this would force layout manager to lay it out which would be bad.
				// Recycle this scrap. Type mismatch.
				mAttachedScrap.remove(i);
				removeDetachedView(holder.itemView, false);
				quickRecycleScrapView(holder.itemView);
			}
		}
	}

	// Search the first-level cache
	final int cacheSize = mCachedViews.size();
	for (int i = cacheSize - 1; i >= 0; i--) {
		final ViewHolder holder = mCachedViews.get(i);
		if (holder.getItemId() == id) {
			if (type == holder.getItemViewType()) {
				if (!dryRun) {
					mCachedViews.remove(i);
				}
				return holder;
			} else if (!dryRun) {
				recycleCachedViewAt(i);
				return null;
			}
		}
	}
	return null;
}
```

getScrapOrCachedViewForId()方法查找的顺序如下：

+ 首先， 从mAttachedScrap中查找，精准匹配有效的ViewHolder；
+ 接着， 从mCachedViews查找；

#### (4) mViewCacheExtension
mViewCacheExtension是由开发者定义的一层缓存策略，Recycler并没有将任何view缓存到这里。

```java
if (holder == null && mViewCacheExtension != null) {
	// We are NOT sending the offsetPosition because LayoutManager does not
	// know it.
	final View view = mViewCacheExtension
			.getViewForPositionAndType(this, position, type);
	if (view != null) {
		holder = getChildViewHolder(view);
		if (holder == null) {
			throw new IllegalArgumentException("getViewForPositionAndType returned"
					+ " a view which does not have a ViewHolder");
		} else if (holder.shouldIgnore()) {
			throw new IllegalArgumentException("getViewForPositionAndType returned"
					+ " a view that is ignored. You must call stopIgnoring before"
					+ " returning this view.");
		}
	}
}
```

这里没有自定义缓存策略，那么就找不到对应的view。

#### (5) RecycledViewPool
在ViewHolder的四级缓存中，我们有提到过RecycledViewPool，它是通过itemType把ViewHolder的List缓存到SparseArray中的，在getRecycledViewPool().getRecycledView(type)根据itemType从SparseArray获取ScrapData ，然后再从里面获取ArrayList<ViewHolder>，从而获取到ViewHolder。

```java
public ViewHolder getRecycledView(int viewType) {
	final ScrapData scrapData = mScrap.get(viewType);
	if (scrapData != null && !scrapData.mScrapHeap.isEmpty()) {
		final ArrayList<ViewHolder> scrapHeap = scrapData.mScrapHeap;
		return scrapHeap.remove(scrapHeap.size() - 1);
	}
	return null;
}
```

#### (6) 创建新的ViewHolder
如果还没有获取到ViewHolder，则通过mAdapter.createViewHolder()创建一个新的ViewHolder返回。

```java
if (holder == null) {
		long start = getNanoTime();
		if (deadlineNs != FOREVER_NS
				&& !mRecyclerPool.willCreateInTime(type, start, deadlineNs)) {
			// abort - we have a deadline we can't meet
			return null;
		}
		holder = mAdapter.createViewHolder(RecyclerView.this, type);
		if (ALLOW_THREAD_GAP_WORK) {
			// only bother finding nested RV if prefetching
			RecyclerView innerView = findNestedRecyclerView(holder.itemView);
			if (innerView != null) {
				holder.mNestedRecyclerView = new WeakReference<>(innerView);
			}
		}

		long end = getNanoTime();
		mRecyclerPool.factorInCreateTime(type, end - start);
		if (DEBUG) {
			Log.d(TAG, "tryGetViewHolderForPositionByDeadline created new ViewHolder");
		}
	}
}
```

#### (7) 绑定View
无论时创建还是找到了缓存的viewHolder，都需要判断在不同情况下是否需要绑定 `ViewHolder` （例如从屏幕外滑动后刷新到屏幕内显示时要绑定），然后调用tryBindViewHolderByDeadline绑定。

```java
if (mState.isPreLayout() && holder.isBound()) {
	// do not update unless we absolutely have to.
	holder.mPreLayoutPosition = position;
} else if (!holder.isBound() || holder.needsUpdate() || holder.isInvalid()) {
	//如果 ViewHolder 未绑定、需要更新或无效，那么就需要进行绑定操作
	if (DEBUG && holder.isRemoved()) {
		throw new IllegalStateException("Removed holder should be bound and it should"
				+ " come here only in pre-layout. Holder: " + holder);
	}
	final int offsetPosition = mAdapterHelper.findPositionOffset(position);
	bound = tryBindViewHolderByDeadline(holder, offsetPosition, position, deadlineNs);
}
```

```java
private boolean tryBindViewHolderByDeadline(ViewHolder holder, int offsetPosition,
		int position, long deadlineNs) {
	holder.mOwnerRecyclerView = RecyclerView.this;
	final int viewType = holder.getItemViewType();
	long startBindNs = getNanoTime();
	if (deadlineNs != FOREVER_NS
			&& !mRecyclerPool.willBindInTime(viewType, startBindNs, deadlineNs)) {
		// abort - we have a deadline we can't meet
		return false;
	}
	mAdapter.bindViewHolder(holder, offsetPosition);
	long endBindNs = getNanoTime();
	mRecyclerPool.factorInBindTime(holder.getItemViewType(), endBindNs - startBindNs);
	attachAccessibilityDelegate(holder.itemView);
	if (mState.isPreLayout()) {
		holder.mPreLayoutPosition = position;
	}
	return true;
}
```

```java
public final void bindViewHolder(VH holder, int position) {
	holder.mPosition = position;
	if (hasStableIds()) {
		holder.mItemId = getItemId(position);
	}
	holder.setFlags(ViewHolder.FLAG_BOUND,
					ViewHolder.FLAG_BOUND | ViewHolder.FLAG_UPDATE | ViewHolder.FLAG_INVALID
					| ViewHolder.FLAG_ADAPTER_POSITION_UNKNOWN);
	Trace.beginSection(TRACE_BIND_VIEW_TAG);
	onBindViewHolder(holder, position, holder.getUnmodifiedPayloads());
	holder.clearPayload();
	final ViewGroup.LayoutParams layoutParams = holder.itemView.getLayoutParams();
	if (layoutParams instanceof RecyclerView.LayoutParams) {
		((LayoutParams) layoutParams).mInsetsDirty = true;
	}
	Trace.endSection();
}
```

最终调用onBindViewHolder处理数据，我们重写的onBindViewHolder就是在这里被调用。

### 3、RecyclerView的回收流程
前面我们讲到RecyclerView有四级缓存，而我们分析在缓存和复用的基本知识一节中分析onTouchEvent#MOVE事件时其实已经涉及了两级缓存，当调用到fill方法后，在fill方法中会回收移出屏幕的view到mCachedViews或者RecycledViewPool中，这就是我们之前说过的第二级缓存和第四级缓存，因为第三级缓存要开发者实现，我们暂且不做分析，剩下的第一级的缓存在哪里？

RecyclerView回收的入口有很多， 但是不管怎么样操作，RecyclerView 的回收或者复用必然涉及到add View 和 remove View 操作， 前面我们通过分析滑动事件MOVE知道最终在填充子布局时会有回收和缓存发生，除此之外，我们在测量布局时也同样会缓存回收ViewHolder。

我们从onMeasure代码和onLayout的代码开始看起：

```java
protected void onMeasure(int widthSpec, int heightSpec) {
	if (mLayout == null) {
		defaultOnMeasure(widthSpec, heightSpec);
		return;
	}
	//检查布局是否开启了自动测量模式（mAutoMeasure 属性）
	if (mLayout.mAutoMeasure) {
		final int widthMode = MeasureSpec.getMode(widthSpec);
		final int heightMode = MeasureSpec.getMode(heightSpec);
		final boolean skipMeasure = widthMode == MeasureSpec.EXACTLY
				&& heightMode == MeasureSpec.EXACTLY;
		mLayout.onMeasure(mRecycler, mState, widthSpec, heightSpec);

		//如果宽高是确定值就直接return，后面onLayout会再次执行测量再布局
		if (skipMeasure || mAdapter == null) {
			return;
		}
		//如果布局步骤是 STEP_START，则分派第一步的布局逻辑。
		//该方法内会执行PreLayout： 动画前布局，
		//例如左滑删除一个item时，会进行预布局，提前把新要显示的item从缓存中拿到摆在下方的列表内
		if (mState.mLayoutStep == State.STEP_START) {
			dispatchLayoutStep1();
		}
		// set dimensions in 2nd step. Pre-layout should happen with old dimensions for
		// consistency
		//设置布局的测量规格，并标记为正在测量
		mLayout.setMeasureSpecs(widthSpec, heightSpec);
		mState.mIsMeasuring = true;
		//分派第二步的布局逻辑，会进行测量和布局
		dispatchLayoutStep2();

		// now we can get the width and height from the children.
		//根据子视图的尺寸来设置 RecyclerView 的测量尺寸
		mLayout.setMeasuredDimensionFromChildren(widthSpec, heightSpec);

		// if RecyclerView has non-exact width and height and if there is at least one child
		// which also has non-exact width & height, we have to re-measure.
		//如果布局需要进行两次测量
		//例如，当 RecyclerView 的宽度和高度都不是精确值时，则进行第二次测量。
		if (mLayout.shouldMeasureTwice()) {
			mLayout.setMeasureSpecs(
					MeasureSpec.makeMeasureSpec(getMeasuredWidth(), MeasureSpec.EXACTLY),
					MeasureSpec.makeMeasureSpec(getMeasuredHeight(), MeasureSpec.EXACTLY));
			mState.mIsMeasuring = true;
			dispatchLayoutStep2();
			// now we can get the width and height from the children.
			mLayout.setMeasuredDimensionFromChildren(widthSpec, heightSpec);
		}
	} else {
		//如果 RecyclerView 有固定尺寸，则直接调用布局的 onMeasure 方法。
		if (mHasFixedSize) {
			mLayout.onMeasure(mRecycler, mState, widthSpec, heightSpec);
			return;
		}
		// custom onMeasure
		//如果在测量期间有适配器更新，则处理这些更新。
		if (mAdapterUpdateDuringMeasure) {
			eatRequestLayout();
			onEnterLayoutOrScroll();
			processAdapterUpdatesAndSetAnimationFlags();
			onExitLayoutOrScroll();

			if (mState.mRunPredictiveAnimations) {
				mState.mInPreLayout = true;
			} else {
				// consume remaining updates to provide a consistent state with the layout pass.
				mAdapterHelper.consumeUpdatesInOnePass();
				mState.mInPreLayout = false;
			}
			//阻止进一步的布局请求，进入布局或滚动状态，处理适配器更新，
			//并设置动画标志，然后退出布局或滚动状态
			mAdapterUpdateDuringMeasure = false;
			resumeRequestLayout(false);
		}

		if (mAdapter != null) {
			mState.mItemCount = mAdapter.getItemCount();
		} else {
			mState.mItemCount = 0;
		}
		//阻止进一步的布局请求，调用布局的 onMeasure 方法，恢复布局请求，并清除预布局标志
		eatRequestLayout();
		mLayout.onMeasure(mRecycler, mState, widthSpec, heightSpec);
		resumeRequestLayout(false);
		mState.mInPreLayout = false; // clear
	}
}
```

```java
protected void onLayout(boolean changed, int l, int t, int r, int b) {
	Trace.beginSection(TRACE_ON_LAYOUT_TAG);
	dispatchLayout();
	Trace.endSection();
	mFirstLayoutComplete = true;
}
```

```java
void dispatchLayout() {
	if (mAdapter == null) {
		Log.e(TAG, "No adapter attached; skipping layout");
		// leave the state in START
		return;
	}
	if (mLayout == null) {
		Log.e(TAG, "No layout manager attached; skipping layout");
		// leave the state in START
		return;
	}
	mState.mIsMeasuring = false;
	if (mState.mLayoutStep == State.STEP_START) {
		dispatchLayoutStep1();
		mLayout.setExactMeasureSpecsFrom(this);
		dispatchLayoutStep2();
	} else if (mAdapterHelper.hasUpdates() || mLayout.getWidth() != getWidth()
			   || mLayout.getHeight() != getHeight()) {
		// First 2 steps are done in onMeasure but looks like we have to run again due to
		// changed size.
		mLayout.setExactMeasureSpecsFrom(this);
		dispatchLayoutStep2();
	} else {
		// always make sure we sync them (to ensure mode is exact)
		mLayout.setExactMeasureSpecsFrom(this);
	}
	dispatchLayoutStep3();
}
```

上面onMeasure和onLayout中最关键的三个方法如下：

dispatchLayoutStep1：

该方法内会执行PreLayout： 动画前布局，例如左滑删除一个item时，会进行预布局，提前把新item读出来。

dispatchLayoutStep2

该方法会进行测量和布局，有可能被多次调用。

dispatchLayoutStep3：

该方法内会执行postLayout： 动画后布局，同PreLayout,动画后更新布局。

从onMeasure和onLayout中可以看出：

dispatchLayoutStep1只会执行一次，因为如果onMeasure中dispatchLayoutStep1不执行，onLayout中也会执行一次dispatchLayoutStep1，而如果onMeasure中执行了dispatchLayoutStep1，则onLayout不会再次执行dispatchLayoutStep1。

dispatchLayoutStep3只会在onLayout中执行一次，

只有dispatchLayoutStep2可能会执行多次。

dispatchLayoutStep2是测量和布局的主要代码，我们主要看这部分，代码如下。

```java
private void dispatchLayoutStep2() {
	eatRequestLayout();
	onEnterLayoutOrScroll();
	mState.assertLayoutStep(State.STEP_LAYOUT | State.STEP_ANIMATIONS);
	mAdapterHelper.consumeUpdatesInOnePass();
	mState.mItemCount = mAdapter.getItemCount();
	mState.mDeletedInvisibleItemCountSincePreviousLayout = 0;

	// Step 2: Run layout
	mState.mInPreLayout = false;
	mLayout.onLayoutChildren(mRecycler, mState);

	mState.mStructureChanged = false;
	mPendingSavedState = null;

	// onLayoutChildren may have caused client code to disable item animations; re-check
	mState.mRunSimpleAnimations = mState.mRunSimpleAnimations && mItemAnimator != null;
	mState.mLayoutStep = State.STEP_ANIMATIONS;
	onExitLayoutOrScroll();
	resumeRequestLayout(false);
}
```

dispatchLayoutStep2中会调用到`mLayout.onLayoutChildren(mRecycler, mState);`而mLayout我们在一开始的缓存和复用基本知识中已经讲过了，这句代码调用会调用到LinearLayoutManager的onLayoutChildren中，如下所示。

```java
@Override
public void onLayoutChildren(RecyclerView.Recycler recycler, RecyclerView.State state) {
	if (mPendingSavedState != null || mPendingScrollPosition != RecyclerView.NO_POSITION) {
		if (state.getItemCount() == 0) {
			removeAndRecycleAllViews(recycler);//移除所有子View
			return;
		}
	}

	//......

	ensureLayoutState();
	mLayoutState.mRecycle = false;//禁止回收
	//颠倒绘制布局,取决于布局的方向和是否从末尾开始布局
	resolveShouldLayoutReverse();

	//......
	onAnchorReady(recycler, state, mAnchorInfo, firstLayoutDirection);

	//暂时分离已经附加的view，即将所有child detach并通过Scrap回收
	detachAndScrapAttachedViews(recycler);

	//......

	if(XXXXXXXX){
		//......
		fill(recycler, mLayoutState, state, false);//填充子视图
		//.....
	}
}
```

在onLayoutChildren()布局的时候，先根据实际情况是否需要removeAndRecycleAllViews()移除所有的子View，哪些ViewHolder不可用；然后通过detachAndScrapAttachedViews()暂时分离已经附加的ItemView，并缓存到List中。

detachAndScrapAttachedViews()的作用就是把当前屏幕所有的item与屏幕分离，将他们从RecyclerView的布局中拿下来，保存到list中，在重新布局时，再将ViewHolder重新一个个放到新的位置上去。

将屏幕上的ViewHolder从RecyclerView的布局中拿下来后，存放在Scrap中，Scrap包括mAttachedScrap和mChangedScrap，它们是一个list，用来保存从RecyclerView布局中拿下来ViewHolder列表，detachAndScrapAttachedViews()只会在onLayoutChildren()中调用，只有在布局的时候，才会把ViewHolder detach掉，然后再add进来重新布局，但是大家需要注意，Scrap只是保存从RecyclerView布局中当前屏幕显示的item的ViewHolder，不参与回收复用，单纯是为了现从RecyclerView中拿下来再重新布局上去。对于没有保存到的item，会放到mCachedViews或者RecycledViewPool缓存中参与回收复用。

```java
public void detachAndScrapAttachedViews(@NonNull Recycler recycler) {
	final int childCount = getChildCount();
	for (int i = childCount - 1; i >= 0; i--) {
		final View v = getChildAt(i);
		scrapOrRecycleView(recycler, i, v);
	}
}
```

上面代码的作用是，遍历所有view，分离所有已经添加到RecyclerView的itemView。

```java
private void scrapOrRecycleView(Recycler recycler, int index, View view) {
	final ViewHolder viewHolder = getChildViewHolderInt(view);
	if (viewHolder.shouldIgnore()) {
		if (DEBUG) {
			Log.d(TAG, "ignoring view " + viewHolder);
		}
		return;
	}
	if (viewHolder.isInvalid() && !viewHolder.isRemoved()
			&& !mRecyclerView.mAdapter.hasStableIds()) {
		removeViewAt(index);
		recycler.recycleViewHolderInternal(viewHolder);
	} else {
		detachViewAt(index);
		recycler.scrapView(view);
		mRecyclerView.mViewInfoStore.onViewDetached(viewHolder);
	}
}
```

然后，我们看detachViewAt()方法分离视图，再通过scrapView()缓存到scrap中，这里就是第一级缓存的mAttachedScrap和mChangedScrap使用的位置，在布局时被缓存进列表中。

```java
void scrapView(View view) {
	final ViewHolder holder = getChildViewHolderInt(view);
	if (holder.hasAnyOfTheFlags(ViewHolder.FLAG_REMOVED | ViewHolder.FLAG_INVALID)
			|| !holder.isUpdated() || canReuseUpdatedViewHolder(holder)) {
		if (holder.isInvalid() && !holder.isRemoved() && !mAdapter.hasStableIds()) {
			throw new IllegalArgumentException("Called scrap view with an invalid view."
					+ " Invalid views cannot be reused from scrap, they should rebound from"
					+ " recycler pool.");
		}
		holder.setScrapContainer(this, false);
		mAttachedScrap.add(holder);
	} else {
		if (mChangedScrap == null) {
			mChangedScrap = new ArrayList<ViewHolder>();
		}
		holder.setScrapContainer(this, true);
		mChangedScrap.add(holder);
	}
}
```

然后，我们回到scrapOrRecycleView()方法中，进入if()分支。如果viewHolder是无效、未被移除、未被标记的则放到recycleViewHolderInternal()缓存起来，同时removeViewAt()移除了viewHolder。

```java
void recycleViewHolderInternal(ViewHolder holder) {
	//·····
	if (forceRecycle || holder.isRecyclable()) {
		if (mViewCacheMax > 0
				&& !holder.hasAnyOfTheFlags(ViewHolder.FLAG_INVALID
				| ViewHolder.FLAG_REMOVED
				| ViewHolder.FLAG_UPDATE
				| ViewHolder.FLAG_ADAPTER_POSITION_UNKNOWN)) {

			int cachedViewSize = mCachedViews.size();
			if (cachedViewSize >= mViewCacheMax && cachedViewSize > 0) {
				//如果超出容量限制，把第一个移除,新的Item肯定是放在 CacheView 中的
				//CacheView 把旧的item从集合中移除，放入 pool 中
				//mViewCacheMax默认是2
				recycleCachedViewAt(0);
				cachedViewSize--;
			}
			// ·····
			mCachedViews.add(targetCacheIndex, holder);//mCachedViews回收
			cached = true;
		}
		if (!cached) {
			addViewHolderToRecycledViewPool(holder, true);//放到RecycledViewPool回收
			recycled = true;
		}
	}
}

```

```java
void recycleCachedViewAt(int cachedViewIndex) {
	if (DEBUG) {
		Log.d(TAG, "Recycling cached view at index " + cachedViewIndex);
	}
	ViewHolder viewHolder = mCachedViews.get(cachedViewIndex);
	if (DEBUG) {
		Log.d(TAG, "CachedViewHolder to be recycled: " + viewHolder);
	}
	addViewHolderToRecycledViewPool(viewHolder, true);//添加到终极回收池RecycledViewPool
	mCachedViews.remove(cachedViewIndex);//mCachedViews集合中移除这个旧的viewholder
}
```

如果符合条件，会优先缓存到mCachedViews中时，如果超出了mCachedViews的最大限制，通过recycleCachedViewAt()将CacheView缓存的第一个数据添加到终极回收池RecycledViewPool后再移除掉，最后才会add()新的ViewHolder添加到mCachedViews中。

剩下不符合条件的则通过addViewHolderToRecycledViewPool()缓存到RecycledViewPool中。

```java
void addViewHolderToRecycledViewPool(@NonNull ViewHolder holder, boolean dispatchRecycled) {
	clearNestedRecyclerViewIfNotNested(holder);
	View itemView = holder.itemView;
	//······
	holder.mOwnerRecyclerView = null;
	getRecycledViewPool().putRecycledView(holder);//将holder添加到RecycledViewPool中
}
```

```java
public void putRecycledView(ViewHolder scrap) {
	final int viewType = scrap.getItemViewType();
	final ArrayList scrapHeap = getScrapDataForType(viewType).mScrapHeap;
	if (mScrap.get(viewType).mMaxScrap <= scrapHeap.size()) {
		//pool缓存池也满了直接返回 scrapHeap.size默认是5
		return;
	}
	if (DEBUG && scrapHeap.contains(scrap)) {
		throw new IllegalArgumentException("this scrap item already exists");
	}
	scrap.resetInternal();
	scrapHeap.add(scrap);//添加进缓存池中
}
```

最后，就是在填充布局调用fill()方法的时候，它会回收移出屏幕的view到mCachedViews或者RecycledViewPool中。

```java
int fill(RecyclerView.Recycler recycler, LayoutState layoutState,
		 RecyclerView.State state, boolean stopOnFocusable) {
	if (layoutState.mScrollingOffset != LayoutState.SCROLLING_OFFSET_NaN) {
		// TODO ugly bug fix. should not happen
		if (layoutState.mAvailable < 0) {
			layoutState.mScrollingOffset += layoutState.mAvailable;
		}
		recycleByLayoutState(recycler, layoutState);//回收移出屏幕的view
	}
}
```

而recycleByLayoutState()方法就是用来回收移出屏幕的view


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725866338498-b7366484-c39b-459c-ba82-af7e19cb96d2.jpeg)

### 4、RecyclerView 缓存复用完整流程
下面是寻找ViewHolder的一个完整的流程图：

![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725862592684-f19810aa-4cc8-425d-bb90-be1e90cfc724.jpeg)

### 5、RecyclerView缓存相关的补充点
#### (1) 缓存容量大小
ArrayList<ViewHolder> mCachedViews --》 DEFAULT_CACHE_SIZE = 2  --> setViewCacheSize

ArrayList<ViewHolder> scrapHeap --》 DEFAULT_MAX_SCRAP = 5 --> setMaxRecycledViews

在回收流程中我们分析到mCachedViews默认大小是2，scrapHeap默认大小是5，使用时可以通过setViewCacheSize和setMaxRecycledViews调整容量的大小。

#### (2) 缓存池
在放入缓存池时调用putRecycledView方法时有如下两句代码：

```java
final int viewType = scrap.getItemViewType();
final ArrayList scrapHeap = getScrapDataForType(viewType).mScrapHeap;
```

先获取当前的ViewHolder的ItemViewType，然后调用`getScrapDataForType(viewType).mScrapHeap`获取到当前ItemViewType的缓存池。

因为每一个ViewHolder都可能是不同的类型，例如有的只是一个TextView，有的是一个组合起来的item，且不同组合形式的item也算是不同的类型，例如下面两种布局的item就是两个类型，


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725868842168-f08a6ada-3aad-4b8b-98bd-e87582b485c0.png)

继续看getScrapDataForType方法如下：

```java
private ScrapData getScrapDataForType(int viewType) {
	ScrapData scrapData = mScrap.get(viewType);
	if (scrapData == null) {
		scrapData = new ScrapData();
		mScrap.put(viewType, scrapData);
	}
	return scrapData;
}
```

首先先从mScrap中获取，如果没有的话就创建一个新的viewType的scrapData。

这里的mScrap结构很复杂，我们可以简单在这里把他想象成一个类似map的东西，Map<int,ScrapData>，所以我们的缓存池就可以想象成一个hashmap的东西，如下图：

![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725869556317-3131f83f-3d41-4637-abbe-d015e4865089.jpeg)

#### (3) ViewHolder的复用和绑定
从缓存池中 复用  ViewHolder ：需要调用 onBindViewHOdler

从 CacheView  复用: 不用调用 onBindViewHOdler

从缓存中没有拿到 ViewHolder： onCreate onBind

