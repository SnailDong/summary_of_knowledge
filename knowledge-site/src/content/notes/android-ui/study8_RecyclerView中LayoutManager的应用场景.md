## 一、自定义LayoutManager重写onLayoutChildren
自定义LayoutManager继承RecyclerView.LayoutManager实现滑动卡片效果。

```java
package com.leo.slidecard;

import android.view.View;
import android.view.ViewGroup;

import androidx.recyclerview.widget.RecyclerView;

public class SlideCardLayoutManager extends RecyclerView.LayoutManager {

    @Override
    public RecyclerView.LayoutParams generateDefaultLayoutParams() {
        return new RecyclerView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    // 必须要重写
    @Override
    public void onLayoutChildren(RecyclerView.Recycler recycler, RecyclerView.State state) {
        // 1、暂时分离已经附加的view，将所有child 分离并通过Scrap回收
        detachAndScrapAttachedViews(recycler);

        // 总共的item个数：8个
        int itemCount = getItemCount();
        // 当前底部的 position
        int bottomPosition;

        // 总个数少于4个的时候
        if (itemCount < CardConfig.MAX_SHOW_COUNT) {
            bottomPosition = 0;
        } else {
            bottomPosition = itemCount - CardConfig.MAX_SHOW_COUNT;
        }

        // 自定义View -- onMeasure  onLayout
        // 4.5.6.7
        for (int i = bottomPosition; i < itemCount; i++) {
            // 2、获取View --》 复用
            View view = recycler.getViewForPosition(i);
			// 3、将view添加到RecyclerView
            addView(view);

            // 4、测量子布局 onMeasure
            measureChildWithMargins(view, 0, 0);

            int widthSpace = getWidth() - getDecoratedMeasuredWidth(view);
            int heightSpace = getHeight() - getDecoratedMeasuredHeight(view);

            // 5、布局子布局 onLayout -- 布局所有子View
            layoutDecoratedWithMargins(view, widthSpace / 2, heightSpace / 2,
                    widthSpace / 2 + getDecoratedMeasuredWidth(view),
                    heightSpace / 2 + getDecoratedMeasuredHeight(view));

            // 8-4-1  8-5-1 --> 3,2,1,0
            int level = itemCount - i - 1;

            // 6、布局后对子View进行缩放平移处理，绘制视图缩放效果
            if (level > 0) {
                // level < 3
                if (level < CardConfig.MAX_SHOW_COUNT - 1) {// 2,1
                    view.setTranslationY(CardConfig.TRANS_Y_GAP * level);
                    view.setScaleX(1 - CardConfig.SCALE_GAP * level);
                    view.setScaleY(1 - CardConfig.SCALE_GAP * level);
                } else {//3
                    // 如果是最底下那张，则效果与前一张一样
                    view.setTranslationY(CardConfig.TRANS_Y_GAP * (level - 1));
                    view.setScaleX(1 - CardConfig.SCALE_GAP * (level - 1));
                    view.setScaleY(1 - CardConfig.SCALE_GAP * (level - 1));
                }
            }
        }
    }
}

```

在重写的`onLayoutChildren`方法中，我们的整体流程基本和我们在讲解RecyclerView的回收复用流程以及View绘制差不多。我们在`linearLayoutManager`的`onLayoutChildren`之前有说到主要的代码是执行了`detachAndScrapAttachedViews(recycler)`和`fill`方法，而fill方法主要就是执行获取view和调用`layoutChunk`布局子视图，在`layoutChunk`我们先将view添加到`RecyclerView`中，然后调用了`measureChildWithMargins`去测量子视图，再然后计算了布局子视图用到的左上右下位置的值，最后调用`layoutDecoratedWithMargins`。

所以在我们自定义的SlideCardLayoutManager中，我们重写的`onLayoutChildren`也要将这几个关键代码实现，代码如上。

## 二、ItemTouchHelper.SimpleCallback
ItemTouchHelper为 `RecyclerView` 提供了一个简单的回调接口来实现拖拽和滑动删除（swipe to dismiss）功能。这个类是 `ItemTouchHelper.Callback` 的一个便捷实现，它允许通过覆盖几个方法来自定义拖拽和滑动的行为，实现添加拖拽排序和滑动删除的功能，同时自定义动画效果以提高用户体验。

主要功能和关键点解释：

1. 构造函数：
    - `SimpleCallback(int dragDirs, int swipeDirs)`：构造函数接受两个参数，`dragDirs` 指定了可以拖拽的方向（例如 `ItemTouchHelper.UP` 或 `ItemTouchHelper.DOWN`），`swipeDirs` 指定了可以滑动的方向。
1. onMove：
    - `boolean onMove(RecyclerView recyclerView, RecyclerView.ViewHolder viewHolder, RecyclerView.ViewHolder target)`：当用户尝试拖拽一个项目时调用。如果返回 `true`，则表示拖拽操作成功，项目将被移动到目标位置。
2. onSwiped：
    - `void onSwiped(RecyclerView.ViewHolder viewHolder, int direction)`：动画结束后的操作，例如当用户滑动删除一个项目时调用。`direction` 参数指示了滑动的方向。
3. onChildDraw：
    - `void onChildDraw(Canvas c, RecyclerView recyclerView, RecyclerView.ViewHolder viewHolder, float dX, float dY, int actionState, boolean isCurrentlyActive)`：自定义拖拽和滑动时的动画效果。`dX` 和 `dY` 参数表示子项相对于其原始位置的偏移量。
4. getAnimationDuration：
    - `long getAnimationDuration(RecyclerView recyclerView, int animationType, float animateDx, float animateDy)`：这个方法返回拖拽或滑动动画的持续时间。
5. getSwipeThreshold：
    - `float getSwipeThreshold(RecyclerView.ViewHolder viewHolder)`：返回触发滑动操作的阈值，通常是一个介于 0 到 1 之间的值，表示子项宽度或高度的百分比。
6. getMoveThreshold：
    - `float getMoveThreshold(RecyclerView.ViewHolder viewHolder)`：返回触发拖拽操作的阈值，通常是一个介于 0 到 1 之间的值，表示子项宽度或高度的百分比。

### 1、`ItemTouchHelper.SimpleCallback` 和 `ItemTouchHelper.Callback`的区别
都是用于实现拖拽和滑动删除等交互效果。

关系和区别如下:

1. 继承关系：
    - `ItemTouchHelper.SimpleCallback` 是 `ItemTouchHelper.Callback` 的一个具体实现。
    - `ItemTouchHelper.Callback` 是一个抽象类，提供了拖拽和滑动操作的基本框架。
2. 使用方法：
    - `ItemTouchHelper.SimpleCallback` 提供了一些默认实现，只需覆盖特定的方法即可实现基本的拖拽和滑动删除功能。
    - `ItemTouchHelper.Callback` 需要实现所有的抽象方法，提供了更高的自定义程度。
3. 覆盖方法：
    - `ItemTouchHelper.SimpleCallback` 已经实现了 `onMove`、`onSwiped`、`onChildDraw`、`onSelectedChanged` 等方法，可以根据需要覆盖这些方法。
    - `ItemTouchHelper.Callback` 需要自己实现所有这些方法，包括 `onMove`、`onSwiped`、`onChildDraw`、`onSelectedChanged`、`getMovementFlags`、`getSwipeThreshold`、`getMoveThreshold` 等。
4. 自定义程度：
    - `ItemTouchHelper.SimpleCallback` 提供了一种快捷方式，适用于大多数基本的拖拽和滑动删除场景，简化了代码。
    - `ItemTouchHelper.Callback` 提供了更高的灵活性，允许我们实现更复杂的交互效果，例如自定义拖拽和滑动的方向、动画效果等。
5. 使用场景：
    - 如果需求比较常见，例如简单的拖拽排序或滑动删除，使用 `ItemTouchHelper.SimpleCallback` 可以快速实现。
    - 如果需要更复杂的交互逻辑，或者想要实现一些特殊的效果，那么继承 `ItemTouchHelper.Callback` 并实现所有抽象方法可能更适合。

总结来说，`ItemTouchHelper.SimpleCallback` 是 `ItemTouchHelper.Callback` 的一个简化版，提供了一些默认实现，适用于大多数基本场景。而 `ItemTouchHelper.Callback` 提供了更高的自定义程度，适用于需要更复杂交互逻辑的场景。

## 三、ItemTouchHelper的使用
首先，初始化时的步骤

```java
// 创建 ItemTouchHelper ，必须要使用 ItemTouchHelper.Callback
ItemTouchHelper.Callback callback = new SlideCardCallback(rv, adapter, mDatas);
ItemTouchHelper helper = new ItemTouchHelper(callback);

// 绑定rv
helper.attachToRecyclerView(rv);
```

重写ItemTouchHelper.SimpleCallback方法

```java
@Override
public void onSwiped(@NonNull RecyclerView.ViewHolder viewHolder, int direction) {
	// 数据循环使用
	// 移除最上面的
	SlideCardBean remove = mDatas.remove(viewHolder.getLayoutPosition());
	// 添加到数组的第一个位置
	mDatas.add(0, remove);
	// 刷新
	adapter.notifyDataSetChanged();
}
```

重写onSwiped，设置拖动后移除item，因为我们是循环使用的，所以再把移除的放到最底部，又因为最顶部是末端，最底部是0，所以添加到数组的第一个位置。然后刷新列表。

重写onChildDraw，绘制拖拽过程中的变化效果。

这里的绘制与前面在SlideCardLayoutManager中有相似之处，因为我们实现的是在拖拽第一个卡片时，下方卡片可以有一个放大缩小的变化。

```java
@Override
public void onChildDraw(@NonNull Canvas c, @NonNull RecyclerView recyclerView,
						@NonNull RecyclerView.ViewHolder viewHolder, float dX,
						float dY, int actionState, boolean isCurrentlyActive) {
	super.onChildDraw(c, recyclerView, viewHolder, dX, dY, actionState, isCurrentlyActive);

	//绘制拖动时下面的卡片随者拖拽有一个放大缩小的效果
	double maxDistance = recyclerView.getWidth() * 0.5f;
	double distance = Math.sqrt(dX * dX + dY * dY);
	// 放大的系数
	double fraction = distance / maxDistance;

	if (fraction > 1) {
		fraction = 1;
	}

	// 当前显示在界面的item数，0，1，2，3
	// 与SlideCardLayoutManager中不同，这里拿的是recyclerView中当前屏幕中的item个数
	// 所以这里从0开始
	// 在SlideCardLayoutManager中拿的是所有item个数。
	int itemCount = recyclerView.getChildCount();
	for (int i = 0; i < itemCount; i++) {
		View view = recyclerView.getChildAt(i);

		int level = itemCount - i - 1;

		// 对子View进行缩放平移处理
		if (level > 0) {
			// level < 3
			if (level < CardConfig.MAX_SHOW_COUNT - 1) {// 2,1
				// 最大达到它的上一个Item的效果
				view.setTranslationY((float) (CardConfig.TRANS_Y_GAP * level - fraction * CardConfig.TRANS_Y_GAP));
				view.setScaleX((float) (1 - CardConfig.SCALE_GAP * level + fraction * CardConfig.SCALE_GAP));
				view.setScaleY((float) (1 - CardConfig.SCALE_GAP * level + fraction * CardConfig.SCALE_GAP));
			}
		}
	}
}
```

设置回弹时间和回弹距离

```java
// 设置回弹时间，不重写则使用默认值
@Override
public long getAnimationDuration(@NonNull RecyclerView recyclerView, int animationType, float animateDx, float animateDy) {
	return 1000;
}

// 设置的回弹距离，默认是0.5f
@Override
public float getSwipeThreshold(@NonNull RecyclerView.ViewHolder viewHolder) {
	return 0.2f;
}
```

