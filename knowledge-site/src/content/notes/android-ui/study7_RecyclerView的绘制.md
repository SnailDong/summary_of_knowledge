## 一、绘制流程
在我们分析回收流程时，其实onMeasure和onLayout已经执行到了fill方法，fill方法是填充子布局的方法，根据 LayoutState 填充 RecyclerView 的子视图，直接决定了子视图如何被添加到 RecyclerView 中，我们一开始在RecylerView的缓存和复用基本知识中对`fill`方法和`fill`方法调用的`layoutChunk`都做了代码注释和分析。

这里再次把那段代码拿过来看一下：

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

可以看到，layoutChunk中拿到view之后，会调用`measureChildWithMargins`测量，这部分代码我们之前也讲过了，忘记了可以看下章节一开始的代码分析，然后会调用`layoutDecoratedWithMargins(view, left, top, right, bottom);`布局子视图。

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

onMeasure和onLayout之后就开始进行绘制，

绘制从RecyclerView的draw方法开始

首先调用super.draw，会调用到View的draw方法

```java
public void draw(Canvas c) {
	super.draw(c);

	final int count = mItemDecorations.size();
	for (int i = 0; i < count; i++) {
		mItemDecorations.get(i).onDrawOver(c, this, mState);
	}
	//......
}
```

view的draw中会调用onDraw方法，而RecyclerView重写了该方法

```java
public void draw(Canvas canvas) {
	//......
	if (!verticalEdges && !horizontalEdges) {
            // Step 3, draw the content
            onDraw(canvas);
			//......
			// Step 4, draw the children
            dispatchDraw(canvas);
	}
	//......
}
```

在RecyclerView重写的onDraw方法中除了执行onDraw之外，还去执行了子视图装饰的onDraw，绘制分割线等。

```java
public void onDraw(Canvas c) {
	super.onDraw(c);
	int count = this.mItemDecorations.size();

	for(int i = 0; i < count; ++i) {
		((ItemDecoration)this.mItemDecorations.get(i)).onDraw(c, this, this.mState);
	}

}
```

从上面看可以看出View中调用了onDraw再调用dispatchDraw，也就是说`mItemDecorations.get(i)).onDraw`的执行是在绘制子布局的之前去执行，所以如果在`mItemDecorations.get(i)).onDraw`重写onDraw方法绘制分割线，会被同位置上的itemView覆盖掉。

再回到RecyclerView的draw中，执行完super.draw后，会执行`mItemDecorations.get(i).onDrawOver`所以，`onDrawOver`是执行在绘制itemView之后的，如果重写`onDrawOver`绘制分割线，那么分割线就会在itemView上面。

所以自定义VIew的绘制流程如下：

-->ReyclerView.draw

--> super.draw(c);（View）

	--> 绘制自己

--> ReyclerView.onDraw

		--> ItemDecoration.onDraw

	--> 绘制孩子(ItemView)

--> ItemDecoration.onDrawOver()

所以分割线和孩子的绘制有如下顺序

ItemDecoration.onDraw

--> 绘制孩子(ItemView)

--> ItemDecoration.onDrawOver

后面绘制的会覆盖前面绘制的。

如果绘制的东西在outRect的话就无所谓使用onDraw还是onDrawOver

例如紫色区域是Rect的范围，预留的分割线在rect外即outRect范围，所以使用onDraw还是onDrawOver都不会被覆盖。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725932484226-d379cfab-86de-4c4c-8ca6-47b7dae8ea46.png)

## 二、实例分析
### 1、示例简介
如果我们想实现下面的效果

每组数据都有一个组名，当滑动时每一组的组名都会在上方悬浮，当下一组滑到最上方时会将前一组组名顶上去然后吸顶直到自己这一组全部被滑出屏幕。

图中黄色带字的窗格是我们一直悬浮在整个列表最上方显示组名的窗格

红色的较宽的且带有文字的窗格是我们每一组在滑动时都会跟随滑动来显示组名的窗格

红色的较窄的横线是我们每一组在滑动时都会跟随滑动的item之间的分割线

紫色的窗格是我们每个item的窗格


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725940732259-3b95a723-15c4-4718-ba49-2186ef19bf98.png)-->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725940758014-5590f38c-c7e0-4048-95ea-64918feb01d0.png)-->


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725940776404-722a74f3-af23-4c99-b936-fb093853e6bf.png)-->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725940793462-d7c1c853-eff6-4f5f-9dc3-a5bfb908d6e3.png)-->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725940807916-032c03b9-3bc9-4a18-b9d2-7a6473cdd4ba.png)-->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725940819974-e11eff6b-b299-4a79-a743-2c9954cacbfa.png)

首先我们定义了简单的实体类和adapter以及mainactivity的实现

```java
package com.leo.rv_itemdecoration;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private List<Star> starList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        init();

        RecyclerView recyclerView = findViewById(R.id.rv_list);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(new StarAdapter(this, starList));

        // 添加自定义ItemDecoration
        recyclerView.addItemDecoration(new StarDecoration(this));
    }

    private void init() {
        starList = new ArrayList<>();

        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 20; j++) {
                if (i % 2 == 0) {
                    starList.add(new Star("何炅" + j, "快乐家族" + i));
                } else {
                    starList.add(new Star("汪涵" + j, "天天兄弟" + i));
                }
            }
        }
    }
}
```

Star实体类

```java
package com.leo.rv_itemdecoration;

public class Star {

    private String name;
    private String grounpName;

    public Star(String name, String grounpName) {
        this.name = name;
        this.grounpName = grounpName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGrounpName() {
        return grounpName;
    }

    public void setGrounpName(String grounpName) {
        this.grounpName = grounpName;
    }
}

```

StarAdapter适配器

```java
package com.leo.rv_itemdecoration;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class StarAdapter extends RecyclerView.Adapter<StarAdapter.StarViewHolder> {

    private Context context;
    private List<Star> starList;

    public StarAdapter(Context context, List<Star> starList) {
        this.context = context;
        this.starList = starList;
    }

    // 是否是组的第一个Item
    public boolean isFirstItemOfGroup(int position) {
        if(position == 0){
            return true;
        } else {
            // 拿到当前位置的和前一个位置的 组名
            String currentItemGroupName = getGroupName(position);
            String preItemGroupName = getGroupName(position - 1);
            // 如果相等，则表示position的item不是第一个，否则是的
            if (preItemGroupName.equals(currentItemGroupName)) {
                return false;
            } else {
                return true;
            }
        }
    }

    public String getGroupName(int position) {
        return starList.get(position).getGrounpName();
    }

    @NonNull
    @Override
    public StarViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.rv_item_star, null);
        return new StarViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull StarViewHolder holder, int position) {
        holder.tv.setText(starList.get(position).getName());
    }

    @Override
    public int getItemCount() {
        return starList == null ? 0 : starList.size();
    }

    public class StarViewHolder extends RecyclerView.ViewHolder {
        private TextView tv;

        public StarViewHolder(@NonNull View itemView) {
            super(itemView);
            tv = itemView.findViewById(R.id.tv_star);
        }
    }
}
```

### 2、getItemOffsets
如果我们想实现上述效果，需要给每个itemView绘制分割线进行装饰。

首先给每个itemView预留出分割线的空间，需要我们重写`getItemOffsets`方法，如下：

```java
/
 * 预留分割线的位置
 * @param outRect 一个矩形对象，用于存储每个item的偏移量。你需要设置这个对象的left、top、right和bottom属性来定义item的边距
 * @param view 当前被处理的item的视图
 * @param parent 包含item的RecyclerView
 * @param state 当前RecyclerView的状态，包含了关于布局的信息
 */
@Override
public void getItemOffsets(@NonNull Rect outRect, @NonNull View view,
						   @NonNull RecyclerView parent, @NonNull RecyclerView.State state) {
	super.getItemOffsets(outRect, view, parent, state);

	if (parent.getAdapter() instanceof StarAdapter) {
		StarAdapter adapter = (StarAdapter) parent.getAdapter();
		// 当前Item的位置
		int position = parent.getChildLayoutPosition(view);

		// 如何判断 item 是头部
		boolean isGroupHeader = adapter.isFirstItemOfGroup(position);
		// 是第一个
		if (isGroupHeader) {
			outRect.set(0, headerHeight, 0, 0);
		} else {
			// padding，margin
			outRect.set(0, 4, 0, 0);
		}
	}
}
```

### 3、onDraw
重写完getItemOffsets后就可以在预留的分割线内绘制装饰的代码了，

首先，在我们代码中因为每个itemView和自己的分割线并没有重合，我们在每个itemView上方都空出了4个单位的距离用于分割线的绘制，所以在分割线中绘制视图时使用onDraw和onDrawOver都是可以的，我们这里使用onDraw去绘制这部分视图。

```java
@Override
public void onDraw(@NonNull Canvas c, @NonNull RecyclerView parent, @NonNull RecyclerView.State state) {
	super.onDraw(c, parent, state);

	if (parent.getAdapter() instanceof StarAdapter) {
		StarAdapter adapter = (StarAdapter) parent.getAdapter();

		// 当前屏幕上的
		int count = parent.getChildCount();

		// 实现itemView的宽度和分割线的宽度一样
		int left = parent.getPaddingLeft();
		int right = parent.getWidth() - parent.getPaddingRight();
		for (int i = 0; i < count; i++) {
			View view = parent.getChildAt(i);

			if (view.getTop() - headerHeight - parent.getPaddingTop() >= 0) {
				// 当前Item的位置
				int position = parent.getChildLayoutPosition(view);
				// 如何判断 item 是头部
				boolean isGroupHeader = adapter.isFirstItemOfGroup(position);
				// 判断是否是头部
				if (isGroupHeader) {
					c.drawRect(left, view.getTop() - headerHeight, right, view.getTop(), headPaint);
					String groupName = adapter.getGroupName(position);
					drawTextPaint.getTextBounds(groupName, 0, groupName.length(), textRect);
					// 绘制文字
					c.drawText(groupName, left + 20,
							view.getTop() - headerHeight / 2 + textRect.height() / 2, drawTextPaint);

				} else { // 普通的itemView的分割线
					c.drawRect(left, view.getTop() - 4, right, view.getTop(), headPaint);
				}
			}
		}
	}
}
```

首先就是先调用super.onDraw，然后我们要获取RecyclerView当前在屏幕内的所有子视图的数量，RecyclerView当前在屏幕内的所有子视图是指包括上下边界上滑出没完全消失或者滑入没完全显示完毕的视图，也就是说只要子视图有一个像素在屏幕内，getChild就包括了这个子视图。

绘制每一个itemView的分割线时，要通过每个item所在的位置信息去实现，因为我们是在每个子View的上方空余了4个单位的距离去实现分割线的绘制，所以每个子View上方的分割线绘制如代码所示：

`c.drawRect(left, view.getTop() - headerHeight, right, view.getTop(), headPaint)`

绘制分割线的矩形区域设置左上右下的坐标，如果是每个组的第一个视图，如实例的截图，该分割线内会填充组名，而该分割线的宽设置为headerHeight，所以滑动时当前view分割线的下边界就是当前view的上边界，当前view分割线的上边界就是当前itemView的top值减去headerHeight。

然后调用Paint.getTextBounds获取文本的边界框，`Canvas.drawText` 方法在画布（`Canvas`）上绘制文本。

如果不是每个组的第一个视图，则因为设置的分割线的宽为4，所以滑动时当前view分割线的下边界就是当前view的上边界，当前view分割线的上边界就是当前itemView的top值减去4。

如上实现后效果如图：

向上滑动时屏幕效果截图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725946855916-2012f86a-a2c7-48a1-b52a-ac5da34dbee7.png)-->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725946872668-b7e620ef-8813-46d1-8818-194f6311a563.png)-->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725946891143-2e8acdc1-be27-44da-ac50-8d525168baaf.png)

### 4、onDrawOver
我们在onDraw中的代码只是针对每个itemView的分割线去绘制，但是我们在示例中说过，希望每一组的组名可以吸顶显示，直到这一组的item全部滑到屏幕外，目前还没有实现，我们之前有讲到过onDrawOver是在子view绘制后被调用的，可以覆盖在子View上面，所以这里的吸顶效果就需要我们在原本视图上能一直有一个覆盖的分割线显示，实现代码如下：

```java
@Override
public void onDrawOver(@NonNull Canvas c, @NonNull RecyclerView parent, @NonNull RecyclerView.State state) {
	super.onDrawOver(c, parent, state);
	if (parent.getAdapter() instanceof StarAdapter) {
		StarAdapter adapter = (StarAdapter) parent.getAdapter();

		int left = parent.getPaddingLeft();
		int right = parent.getWidth() - parent.getPaddingRight();
		int top = parent.getPaddingTop();

		// 当前显示在界面的 第一个item
		int position = ((LinearLayoutManager) parent.getLayoutManager()).findFirstVisibleItemPosition();
		View itemView = parent.findViewHolderForAdapterPosition(position).itemView;

		boolean isFirstItemOfGroup = adapter.isFirstItemOfGroup(position + 1);
		if (isFirstItemOfGroup) {
			//如果是第一个
			int bottom = Math.min(top + headerHeight, itemView.getBottom());
			c.drawRect(left, top, right, bottom, headOverPaint);

			String groupName = adapter.getGroupName(position);
			drawOverTextPaint.getTextBounds(groupName, 0, groupName.length(), textRect);

			c.clipRect(left, top, right, bottom);

			c.drawText(groupName, left + 20,
					bottom - headerHeight / 2 + textRect.height() / 2, drawOverTextPaint);
		} else {// 固定的 会覆盖在itemView上面
			//如果不是第一个，一直显示固定的悬浮窗口
			c.drawRect(left, top, right, top + headerHeight, headOverPaint);

			String groupName = adapter.getGroupName(position);
			drawTextPaint.getTextBounds(groupName, 0, groupName.length(), textRect);
			// 绘制文字
			c.drawText(groupName, left + 20,
					top + headerHeight / 2 + textRect.height() / 2, drawOverTextPaint);
		}
	}
}
```

在onDrawOver中，我们并没有像在onDraw中一样获取到每个item然后给他们自己的分割线绘制，因为这部分已经在onDraw中做过了，其实这部分逻辑不再onDraw中做放到onDrawOver也可以。

我们想绘制一个能覆盖在所有子View上面的吸顶效果的窗口，并且还想要在列表滑动时，列表内的分割线中的分组线可以和悬浮的吸顶分组线有个更换的交互，就要用到onDrawOver。说白了，onDraw时我们是在RecyclerView的列表上操作，每个itemView相当于一个盒子，预留分割线相当于把每个item拉开一点距离，绘制的分割线相当于在盒子缝隙里塞了一点装饰物用于区分出是盒子，而我们的headerView相当于在每两组不同的盒子的首位之间放了一个牌子，对于盒子、盒子间缝隙里的分割线以及每组的牌子的绘制都属于在同一层级也就是同一个平面上去绘制，并没有物体的上下叠层，而我们现在想在最顶处悬浮放置一个牌子一直显示当前的盒子组名，这就要在第二层去绘制，所以要使用onDrawOver去绘制，onDrawOver可以在第二层任意的位置去绘制，无论绘制在哪里都会覆盖同位置下的物体。所以我们只要计算在顶出悬浮使用的空间，然后还要计算并绘制当两个组交换时悬浮窗口随着上滑在屏幕中应该显示的裁剪视图。当上一个组名完全移除屏幕后再绘制出下一个组名的悬浮窗口。

代码中注意`boolean isFirstItemOfGroup = adapter.isFirstItemOfGroup(position + 1);`这里我们想要拿到是不是一组中的第一个item，传的是position + 1，原因是当我们使用悬浮的窗口时，第一个item被覆盖在了悬浮窗口的下面，当第一个item为上一个组的最后一个时，如图


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725949036782-b9f83e15-0f5a-444e-aa30-f087517482f1.jpeg)绿色区域是我们将要绘制悬浮窗口的位置，因为悬浮窗口的宽度和item的宽度相同，所以当第一个item是上一组最后一个时，position + 1就是下一组的第一个item,此时我们就需要把悬浮窗口随者屏幕上移做剪裁显示，直到下一组红色的组名分割窗口到达最顶部，我们重新绘制一个悬浮串口盖到红色的组名分割窗口上方即可。

代码实现效果最终如我们一开始的示例。

