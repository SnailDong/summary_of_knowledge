## 一、概念和设计效果
"嵌套滑动"（Nested Scrolling）是指在一个可滑动的视图（如 `ScrollView`、`HorizontalScrollView` 或 `ViewPager`）内部嵌套另一个可滑动的视图（如 `RecyclerView`、`ScrollView` 等），并且这两个视图能够独立地响应用户的滑动事件

二级嵌套滑动（也称为多层嵌套滑动）是指在一个已经嵌套的滑动视图（如 `RecyclerView` 在 `ViewPager` 内）中再嵌套一个可滑动的视图，从而形成多层级的滑动结构，例如：

`ViewPager` 内嵌 `RecyclerView`，`RecyclerView` 内再嵌 `ScrollView`

二级嵌套滑动在各个应用app都很常见，例如淘宝京东等首页，当我们网上滑动时会出现吸顶的效果，下面是一个应用截图，最上方的一个左右滑动的控件未截图展示，那么这样的一个整体是怎么布局的哪？如何才能实现这样的一个效果，首先我们先看一下这个布局具体是怎么嵌套的，各个部分由哪些控件组成，简单实现右侧的页面设计如下方左侧的布局图所示。


![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725592774572-0b9f1876-2d3c-4658-a891-de448214d6a8.jpeg)

1. 首先最外层是一个滑动刷新布局`SwipeRefreshLayout`，提供了一个下拉刷新的功能，用户可以通过下拉动作来触发刷新操作。这个组件非常适合用于列表、网格或其他可滚动视图的刷新操作。
2. 往里一层是滚动容器ScrollView，`ScrollView` 是一个可以包含单个子视图的滚动容器。它可以垂直滚动，也可以水平滚动，但不能同时进行。`ScrollView` 只能包含一个直接子视图，这意味着如果需要滚动多个视图，需要将它们放在一个单一的 `LinearLayout` 或其他 `ViewGroup` 中，然后将这个 `ViewGroup` 放入 `ScrollView`，但是`ScrollView`不支持嵌套滚动，所以我们这里选择使用它的扩展组件`NestedScrollView`，`NestedScrollView` 是一个较新的组件，支持嵌套滚动。这意味着它可以与其他滚动视图（如 `RecyclerView` 或另一个 `NestedScrollView`）一起使用，而不会相互干扰。`NestedScrollView` 可以正确处理触摸事件的传递，使得内部的滚动视图可以在外部的 `NestedScrollView` 滚动到顶部或底部时接管滚动。
+ 如果只需要简单的滚动，或者当你的滚动内容不超过一个屏幕大小时，`ScrollView` 可能是更好的选择。
+ 如果布局中包含多个滚动视图，或者需要更复杂的滚动交互，比如一个 `RecyclerView` 在 `NestedScrollView` 内部，并且它们需要独立滚动，那么 `NestedScrollView` 会是更合适的选择。
3. 滚动容器内从上往下分别是一个自定义的recyleview,tablelayout和一个viewpager
4. viewpager内部又存在一个fragmentLayout，内部使用recyleview实现一个展示列表

## 二、ScrollView做滚动容器
### 1、代码和预期效果
我们简单写一个这样的布局，其中FixedDataScrollDisabledRecyclerView我们重写了onTouchEvent和onInterceptTouchEvent返回false，看下效果,

我们先使用ScrollView做滚动容器，

```java
<?xml version="1.0" encoding="utf-8"?>
<layout>

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout xmlns:android="http://schemas.android.com/apk/res/android"
        android:layout_width="match_parent"
        android:id="@+id/swipe_refresh_layout"
        android:layout_height="match_parent">

        <ScrollView
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:orientation="vertical">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:orientation="vertical">

                <com.android.taobao.common.views.xxrecyclerview.FixedDataScrollDisabledRecyclerView
                    android:id="@+id/combo_top_view"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content" />

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="match_parent"
                    android:orientation="vertical">

                    <com.google.android.material.tabs.TabLayout
                        android:id="@+id/tablayout"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content" />

                    <androidx.viewpager2.widget.ViewPager2
                        android:id="@+id/viewpager_view"
                        android:layout_width="match_parent"
                        android:layout_height="match_parent" />
                </LinearLayout>
            </LinearLayout>
        </ScrollView>
    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

</layout>
```

```java
package com.android.taobao.nestedscroll.a_scrollview_recyclerview;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.databinding.DataBindingUtil;
import androidx.fragment.app.Fragment;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.android.taobao.common.fragment.RecyclerViewFragment;
import com.android.taobao.R;
import com.android.taobao.databinding.ActivityNestedscrollScrollviewRecyclerviewBinding;
import com.android.taobao.common.viewpager.ViewPagerAdapter;

import java.util.ArrayList;
import java.util.List;

public class NestedViewPagerActivityTest1 extends AppCompatActivity {
    ActivityNestedscrollScrollviewRecyclerviewBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = DataBindingUtil.setContentView(this, R.layout.activity_nestedscroll_scrollview_recyclerview);
        ViewPagerAdapter pagerAdapter = new ViewPagerAdapter(this, getPageFragments());
        binding.viewpagerView.setAdapter(pagerAdapter);
        final String[] labels = new String[]{"linear", "scroll", "recycler"};
        new TabLayoutMediator(binding.tablayout, binding.viewpagerView, new TabLayoutMediator.TabConfigurationStrategy() {
            @Override
            public void onConfigureTab(@NonNull TabLayout.Tab tab, int position) {
                tab.setText(labels[position]);
            }
        }).attach();
        binding.swipeRefreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                binding.getRoot().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        binding.swipeRefreshLayout.setRefreshing(false);
                    }
                },1000);
            }
        });
    }

    private List<Fragment> getPageFragments() {
        List<Fragment> data = new ArrayList<>();
        data.add(new RecyclerViewFragment());
        data.add(new RecyclerViewFragment());
        data.add(new RecyclerViewFragment());
        return data;
    }
}
```

定义的xml和MainActivity如上，首先我们的布局最外层是一个滚动下拉刷新布局，内层是一个滚动容器，容器内只有一个LinearLayout，LinearLayout里面顺序排列了一个自定义的RecyleView和一个LinearLayout，内层的LinearLayout是一个tableLayout和一个ViewPager2的垂直排列，

其中在MainActivity中，我们将tableLayout和ViewPager2两个控件使用`TabLayoutMediator`确保`ViewPager2` 中的每个页面都有一个对应的标签，用户在 `ViewPager2` 之间滑动时，`TabLayout` 中的标签也会相应地更新。

而我们想要的效果就是，最上方的自定义RecyleView不能内部滑动，且要响应页面的上下滚动，同时上下滚动时，当tablelayout滚动到最顶端时固定不再滑动，实现一个吸顶效果，继续滑动页面时只有下方的RecyleView的列表在滑动，吸顶后可以根据tablelayout的标签切换页面，当下拉回来时直到下拉到第一个item后，tablelayout也会随者滚动下拉回原来的位置。

### 2、出现的问题
当我们按照上述去实现的时候，运行app后，发现上方的自定义RecyleView可以滑动列表，下方的RecyleView也可以滑动列表，但是滑动页面的时候只能滚动一点点，即向上滑动到屏幕最下方未完全暴漏的ChildView item 4完全出现后就不能再滑动了，这不是我们想要的效果。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725678437268-1692db43-10b6-4744-a892-41777a6325e8.png)

通过上一节学习事件处理机制我们应该明白这是为什么。这里再简述一下

首先运行app后进入到我们的嵌套滑动页面如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725602743414-9dae344e-660c-4a7a-a93a-bfe5abc2bf1a.png)

选择我们的AS导航栏 Tools--->Layout Inspector工具，可以看到动态的布局层次结构，如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725608789355-971abdf9-6064-40d8-bd58-f46913b43de7.png)

根据之前的事件处理机制学习，我们知道事件一开始从activity给到DecorView，DecorView将事件分发下去，如上图中，事件从上往下开始分发，到了ScrollView后，因为disallowIntercept默认是false，所以会执行到ScrollView的onInterceptTouchEvent，

当DOWN事件分发时时，有如下代码

```java
case MotionEvent.ACTION_DOWN: {
	final int y = (int) ev.getY();
	if (!inChild((int) ev.getX(), (int) y)) {
		mIsBeingDragged = false;
		recycleVelocityTracker();
		break;
	}
```

因为ScrollView只能容纳一个子View，而我们也是这么写的，它的子View是linearLayout，所以只要触摸的位置在linearLayout内部，这里mIsBeingDragged就赋值为false,所以onInterceptTouchEvent会返回false，导致事件交给了子view去处理。

而我们的ScrollView它的子view就是内部的两个recyleview和tablelayout，所以ScrollView内部的滑动是先交给内部的view去处理，不能处理的才自己去处理，因此就有了我们上面的效果：两个recyleview列表分别可以内部滑动，当在tablelayout上滑动时，页面有向上滚动，但是只滚动到将下方还未完全展示的item展示全就不再滚动了(从截图效果看viewpager显示的是4个多一点item的高度，但是滑动时页面向上滚动会把viewpager的高度计算为5个item，可能和其内部的实现有关，没有仔细去研究)，再滑动就只能去滑动下方的recyleview让它的列表继续向上滑动，而整个页面不会向上移动。

### 3、RecyleView可以滑动的原理
在继续分析代码前，我们需要先明白recyleview的事件分发原理，当Down事件由ScrollView分发给recyleview后，从源码可以看出recyleview继承了ViewGroup，所以recyleview的dispatchTouchEvent就是ViewGroup的dispatchTouchEvent，当执行到onInterceptTouchEvent时，因为是DOWN事件，此时返回false(看源码分析)，recyleview继续将Down事件分发给它的子view处理；

当MOVE事件过来后，最终也是recyleview处理后再交给子view处理，因为在处理MOVE时，如代码所示，可以看出onInterceptTouchEvent的返回结果为mScrollState == SCROLL_STATE_DRAGGING，而现在的状态并不是拖动状态，只有当startScroll设为true的条件下才会设置mScrollState为SCROLL_STATE_DRAGGING，也就是如果当前状态不是拖动，检查用户是否移动了足够的距离（超过 `mTouchSlop`）。如果是才设置为拖动状态。

```java
switch (action) {
	case MotionEvent.ACTION_DOWN:
		//......
		break;

	case MotionEvent.ACTION_POINTER_DOWN:
		//......
		break;

	case MotionEvent.ACTION_MOVE: {
		final int index = e.findPointerIndex(mScrollPointerId);
		if (index < 0) {
			Log.e(TAG, "Error processing scroll; pointer index for id "
					+ mScrollPointerId + " not found. Did any MotionEvents get skipped?");
			return false;
		}

		final int x = (int) (e.getX(index) + 0.5f);
		final int y = (int) (e.getY(index) + 0.5f);
		if (mScrollState != SCROLL_STATE_DRAGGING) {
			final int dx = x - mInitialTouchX;
			final int dy = y - mInitialTouchY;
			boolean startScroll = false;
			if (canScrollHorizontally && Math.abs(dx) > mTouchSlop) {
				mLastTouchX = x;
				startScroll = true;
			}
			if (canScrollVertically && Math.abs(dy) > mTouchSlop) {
				mLastTouchY = y;
				startScroll = true;
			}
			if (startScroll) {
				setScrollState(SCROLL_STATE_DRAGGING);
			}
		}
	} break;

	case MotionEvent.ACTION_POINTER_UP: {
		onPointerUp(e);
	} break;

	case MotionEvent.ACTION_UP: {
		mVelocityTracker.clear();
		stopNestedScroll(TYPE_TOUCH);
	} break;

	case MotionEvent.ACTION_CANCEL: {
		cancelScroll();
	}
}
return mScrollState == SCROLL_STATE_DRAGGING;
```

当我们的移动距离没有达到拖动状态前，依然返回的是false，这次的MOVE也就依然交给了RecyleView的子View处理（我们之前在事件分发机制中说过，DOWN谁处理，MOVE就是谁处理，前提是不拦截子View的情况）；

直到第N个MOVE移动的距离达到滑动的条件后，startScroll被设置为true，然后触发`setScrollState(SCROLL_STATE_DRAGGING);`所以此时调用onInterceptTouchEvent返回为`mScrollState == SCROLL_STATE_DRAGGING`结果是true，即我们的intercepted被置为true。

下面的知识点是我们在事件分发机制中的实例小节说的第一二三段代码(不记得可以看下源码或者翻到该小节回顾下)，现在第一段代码因为设置了intercepted为true，所以第二段代码`if (!canceled && !intercepted)`不成立，第二段代码不会执行，也就不会遍历子view去分发事件，而第三段代码`if (mFirstTouchTarget == null) {...... } else`，因为`mFirstTouchTarget`不为空所以执行else语句，又因为第二段代码没执行，所以`if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget)`条件不成立代码执行了下面的逻辑：

```java
final boolean cancelChild = resetCancelNextUpFlag(target.child) || intercepted;
if (dispatchTransformedTouchEvent(ev, cancelChild,target.child, target.pointerIdBits)) {
	handled = true;
}
if (cancelChild) {
	if (predecessor == null) {
		mFirstTouchTarget = next;
	} else {
		predecessor.next = next;
	}
	target.recycle();
	target = next;
	continue;
}
```

cancelChild因为intercepted为true所以被置为true，dispatchTransformedTouchEvent调用时变成了分发给子View取消事件，紧接着mFirstTouchTarget被置为null，当下一次MOVE再次需要分发时，我们发现第一二段代码都不执行了，执行到第三段代码时也只会执行`if (mFirstTouchTarget == null)`的逻辑，MOVE事件交给了recyleview去处理，不再分发给RecyleView的子View了，所以就实现了Recycle可以滑动列表的操作，

这段代码就和我们在事件分发机制中分析外部拦截法是一个道理，首先要明白的是当事件从RecyleView分发给子View的时候，两者中RecyleView是父容器，子View是列表里的item，重写RecyleView的onInterceptTouchEvent就等于在父容器内拦截子View的事件，所以RecyleView本身的实现是实现了外部拦截法，而向我们之前学习的外部拦截法是在某个条件下让onInterceptTouchEvent返回true，达到拦截子View处理Move事件从而交给自身处理的目的，而在RecyleView的实现里，它是当达成拖动条件后，onInterceptTouchEvent会返回true，假如onInterceptTouchEvent依然返回false，RecyleView的拖动效果就没有了。

### 4、实现不能拖动的自定义RecyleView
我们想实现的界面中最上方的控件就是一个headerView，一个不能滑动的RecyleView，既然知道了RecyleView的滑动原理，如何让它的滑动不生效就有了思路，即重写它的onInterceptTouchEvent方法，通过外部拦截法，也就是不让它在判断滑动条件成立时onInterceptTouchEvent返回true，只要我们重写该方法返回false既可以生效。

## 三、NestedScrollView 做滚动容器
虽然我们弄明白了RecyleView的滑动原理，也知道如何才能做出一个不能滑动的RecyleView，但是因为ScrollView是一个简单个滚动容器，不支持嵌套滚动，也就是我们想往上滑动时，让整个页面能一直向上滑动，让我们的tableLayout和下方的recycleview占据整个页面的想法无法实现，所以我们更换了滚动容器，使用NestedScrollView。

当我们把xml中的ScrollView替换成NestedScrollView后再次运行程序，我们发现滑动时界面效果变成了这样：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725673612548-89d2f40e-ad97-490b-adbe-5de7f472f22d.png)---->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725673510910-bdd1f5c2-3e47-4853-9c4a-57b2367f4c36.png)---->
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725673521762-2ef2cbbd-2ba3-445f-a7ba-c95335f44a2a.png)

当我们滑动ParentView字样 的区域时，滑动不生效，因为我们已经在自定义的RecyleView中重写了onInterceptTouchEvent返回false，

而当我们滑动ChildView字样的区域时，发现界面一直往上滑动，最后我们的tableLayout也被滑出屏幕如第三张图所示。

在更换NestedScrollView后，我们已经解决了之前的问题，滑动不能使页面向上滚动的问题，

但是我们还存在两个问题

1.我们滑动重写onInterceptTouchEvent的自定义recyleview时没有任何效果，只有滑动下面的recyleview才可以页面和列表向上滚动。

2.tablelayout滑到最顶部时没有吸顶，按我们的想法应该一直保持在顶部不动除非往下滑动才会下来。

### 1、实现不能滑动的RecyleView且滑动时页面向上滚动有效
第一个问题，如何在滑动上面的headerview时向上滚动哪？我们已经实现了滑动这个recyleview不拦截子view事件了，对于recyleview不响应滑动事件来说，父容器是recyleview，子View是列表里的item，但是如果想实现向上滚动，则需要清楚这个滑动其实是响应的NestedScrollView的滑动，即当NestedScrollView传递move时拦截传递给它的子View也就是拦截recyleview去处理事件，对于这个事件响应，父容器是NestedScrollView，而子view是recyleview，这里就要用到我们之前学过的内部拦截法，我们只需要在NestedScrollView分发给子View即recyleview的时候，在其调用dispatchTransformedTouchEvent时返回false，让子View不能去处理事件从而最后交给父容器处理即可达成我们的目的，dispatchTransformedTouchEvent时返回false就需要`handled = child.dispatchTouchEvent(event)`时返回false，也就是我们只需要在recyleview里面重写dispatchTouchEvent并返回false就可以实现。

所以，我们的自定义RecyleView中代码有如下片段

```java
@Override
public boolean dispatchTouchEvent(MotionEvent e) {
	return false;
}

@Override
public boolean onInterceptTouchEvent(MotionEvent e) {
	return false;
}
```

按照这样去重写后，我们就实现了一个不能滑动的RecyleView和滑动RecyleView时会跟随NestedScrollView而上下滑动的效果。

总结上面的两个重写方法：

onInterceptTouchEvent实现了外部拦截法，即事件从RecyleView传给子View时拦截，使得RecyleView的滑动效果失效。

dispatchTouchEvent实现了内部拦截法，即事件从NestedScrollView传给RecyleView时拦截，使得RecyleView不处理该事件交由父容器即NestedScrollView处理。


### 2、NestedScrollView实现嵌套滑动的原理
针对第二个问题，首先我们应该有一个疑问，就是按照我们之前的源码分析，当事件交给NestedScrollView的子view也就是RecyleView处理时，NestedScrollView不再处理滑动事件，但是效果展示我们发现，我们的列表在滑动，页面整体也在向上滑动，这就是我们想要的嵌套滑动，但这是为什么呢？

我们先想一下嵌套滑动，嵌套滑动两个角色，一个是父亲，一个是孩子。

在我们的代码中，孩子是recyleview，让我们看下recyleview

```java
public class RecyclerView extends ViewGroup implements ScrollingView,
        NestedScrollingChild2, NestedScrollingChild3 {
}
```

在RecyclerView的源码中，明显的实现了 `ScrollingView,NestedScrollingChild2,NestedScrollingChild3`，所以RecyclerView是孩子的角色。

但是父亲是谁哪？

我们先看下之前的ScrollView

```java
public class ScrollView extends FrameLayout {
}
```

ScrollView并没有实现任何东西，所以他不是嵌套滑动，没办法充当嵌套滑动的父亲角色，

如果我们换成NestedScrollView哪？

```java
public class NestedScrollView extends FrameLayout implements NestedScrollingParent3,
        NestedScrollingChild3, ScrollingView {
}
```

我们发现NestedScrollView实现了`NestedScrollingParent3,NestedScrollingChild3, ScrollingView`，它可以充当父亲的角色，而且它也可以充当孩子的角色。

所以我们使用NestedScrollView的时候会发现滑动时RecyleView和NestedScrollView都响应了滑动事件，只不过系统响应不会让我们的tablelayout吸顶而已。

### 3、NestedScrollingChild和NestedScrollingParent解决滑动冲突
#### (1) NestedScrollingParent 和 NestedScrollingChild 接口
NestedScrollingParent 和 NestedScrollingChild 都是接口，NestedScrollingParent 接口用于外部View实现， NestedScrollingChild 用于内部View实现，我们在代码中看到的Child3、Parent3带数字的接口，同时也存在不带数字的，是为了解决之前的版本遗留的问题，具体多了什么百度一查就知道了。

NestedScrollingParent 和 NestedScrollingChild 解决滑动冲突的机制：

实现了NestedScrollingChild接口的内部View在滑动的时候，首先将滑动距离dx和dy交给实现了NestedScrollingParent接口的外部View（可以不是直接父View），外部View可对其进行部分消耗，剩余的部分还给内部View。

说得通俗点就是子 view 和 父 view 在滑动过程中，互相通信决定某个滑动是子view 处理合适，还是 父view 来处理。

```java
public interface NestedScrollingParent {

    //准备开始滑动。参数nestedScrollAxes为getNestedScrollAxes方法返回的值。
	//返回值表示是否接收内部View（可以是非直接子View）滑动时的参数。
	//源码中只支持竖直方向，横向不支持
    boolean onStartNestedScroll(View child, View target, int nestedScrollAxes);

    //接收内部View（可以是非直接子View）滑动
    void onNestedScrollAccepted(View child, View target, int nestedScrollAxes);

   //停止接收内部View（可以是非直接子View）滑动
    void onStopNestedScroll(View target);

    //内部View滑动时调用
    void onNestedScroll(View target, int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed);

   //内部View开始滑动之前调用。参数dx和dy表示滑动的横向和纵向距离，consumed参数表示消耗的横向和纵向距离，如纵向滑动，需要消耗了dy/2，表示外部View和内部View分别处理这次滑动距离的 1/2
    void onNestedPreScroll(View target, int dx, int dy, int[] consumed);

    //内部View开始Fling时调用
    boolean onNestedFling(View target, float velocityX, float velocityY, boolean consumed);

   //内部View开始Fling之前调用。参数velocityX 和velocityY 表示水平方向和垂直方向的速度。返回值表示是否处理了这次Fling操作，返回true表示拦截掉这次操作，false表示不拦截。
    boolean onNestedPreFling(View target, float velocityX, float velocityY);

    //是纵向滑动还是横向滑动
    int getNestedScrollAxes();
}

```

```java
public interface NestedScrollingChild {

    //开始滑动的时候会调用这个方法。参数axes 代表是横向滑动还是纵向滑动。返回值表示是否找到支持嵌套滑动的外部View（可以是非直接父View）。
    void setNestedScrollingEnabled(boolean enabled);

    boolean isNestedScrollingEnabled();

    //准备开始滑动
    boolean startNestedScroll(int axes);

    //停止滑动
    void stopNestedScroll();

   //是否有嵌套滑动的外部View
    boolean hasNestedScrollingParent();

    //在内部View滑动的时候，通知外部View。
    boolean dispatchNestedScroll(int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed, int[] offsetInWindow);

    //在内部View滑动之前，先让外部View处理这次滑动。参数dx 和 dy表示这次滑动的横向和纵向距离，参数consumed表示外部View消耗这次滑动的横向和纵向距离。返回值表示外部View是否有消耗这次滑动。
    boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow);

   //在内部View Fling操作的时候，通知外部View。
    boolean dispatchNestedFling(float velocityX, float velocityY, boolean consumed);

   //与dispatchNestedPreScroll 方法相似，在内部View Fling操作之前，先让外部View处理这次Fling操作。参数velocityX 和velocityY 表示水平方向和垂直方向的速度。表示外部View是否有消耗这次Fling。
    boolean dispatchNestedPreFling(float velocityX, float velocityY);


```

NestedScrollingParent 和 NestedScrollingChild 接口方法的对应关系：

| NestedScrollingChild | NestedScrollingParent | 关系描述 | 内部View中的调用时机 |
| :--- | :--- | :--- | :--- |
| startNestedScroll | onStartNestedScroll、onNestedScrollAccepted | 内部View通知外部View准备开始滑动 | ACTION_DOWN事件 |
| dispatchNestedPreScroll | onNestedPreScroll | 内部View在滑动之前通知外部View是否要处理这次滑动的横向和纵向距离，外部View处理之后，剩下的才交给内部View处理。 | ACTION_MOVE事件 |
| dispatchNestedScroll | onNestedScroll | 内部View在滑动的时候，通知外部View是否也要跟随处理这次滑动。各自处各自的。 | ACTION_MOVE事件后已经开始scroll |
| dispatchNestedPreFling | onNestedPreFling | 内部View在Fling操作之前通知外部View是否要处理这次Fling操作，如果外部View处理了则内部View不再处理，如果外部View没有处理则内部View处理。 | fling时 |
| dispatchNestedFling | onNestedFling | 内部View在Fling操作时通知外部View是否要处理这次Fling操作，如果外部View处理了则内部View不再处理，如果外部View没有处理则内部View处理。 | fling时 |
| stopNestedScroll | onStopNestedScroll | 内部View通知外部View停止滑动 | ACTION_UP事件 |


#### (2) NestedScrollingChildHelper 和 NestedScrollingParentHelper 类
NestedScrollingChildHelper 和 NestedScrollingParentHelper 类的作用：主要是帮助内部View和外部View实现交互逻辑。

关于NestedScrollingChildHelper 和 NestedScrollingParentHelper 类是如何帮助内部View和外部View实现交互逻辑的，这里以RecyclerView为例子，介绍 startNestedScroll方法的交互逻辑。

```java
public boolean onTouchEvent(MotionEvent e) {
......

   //ACTION_DOWN
   case 0:
                    this.mScrollPointerId = e.getPointerId(0);
                    this.mInitialTouchX = this.mLastTouchX = (int)(e.getX() + 0.5F);
                    this.mInitialTouchY = this.mLastTouchY = (int)(e.getY() + 0.5F);
                    nestedScrollAxis = 0;
                    if (canScrollHorizontally) {
                        nestedScrollAxis |= 1;
                    }

                    if (canScrollVertically) {
                        nestedScrollAxis |= 2;
                    }

                    this.startNestedScroll(nestedScrollAxis, 0);
                    break;

......
}

```

在ACTION_DOWN事件中，调用startNestedScroll方法，第一个参数为横向还是纵向，第二个参数为类型：

TYPE_TOUCH：值为0，用户触摸操作类型

TYPE_NON_TOUCH：值为1，非用户触摸操作类型，而且主要用于代码中的惯性操作，比如View滑动时的惯性滑动.

RecyclerView中实现的startNestedScroll方法：

```java
    public boolean startNestedScroll(int axes) {
        return this.getScrollingChildHelper().startNestedScroll(axes);
    }

    public boolean startNestedScroll(int axes, int type) {
        return this.getScrollingChildHelper().startNestedScroll(axes, type);
    }

    private NestedScrollingChildHelper getScrollingChildHelper() {
        if (this.mScrollingChildHelper == null) {
            this.mScrollingChildHelper = new NestedScrollingChildHelper(this);
        }

        return this.mScrollingChildHelper;
    }

```

这个方法主要是委托给NestedScrollingChildHelper 类的startNestedScroll方法处理。

NestedScrollingChildHelper中的startNestedScroll方法：

```java
    public boolean startNestedScroll(int axes) {
        return this.startNestedScroll(axes, 0);
    }

    public boolean startNestedScroll(int axes, int type) {
        if (this.hasNestedScrollingParent(type)) {
            return true;
        } else {
            if (this.isNestedScrollingEnabled()) {
                ViewParent p = this.mView.getParent();

                for(View child = this.mView; p != null; p = p.getParent()) {
                    if (ViewParentCompat.onStartNestedScroll(p, child, this.mView, axes, type)) {
                        this.setNestedScrollingParentForType(type, p);
                        ViewParentCompat.onNestedScrollAccepted(p, child, this.mView, axes, type);
                        return true;
                    }

                    if (p instanceof View) {
                        child = (View)p;
                    }
                }
            }

            return false;
        }
    }

```

isNestedScrollingEnabled方法判断是否允许嵌套滑动，如果true则找实现了NestedScrollingParent接口的外部View，如果外部View的onStartNestedScroll方法返回true，也就是外部View准备接收内部View的滑动，然后再接着调用外部View的onNestedScrollAccepted方法，确认接收内部View的滑动。

ViewParentCompat中的onStartNestedScroll 和 onNestedScrollAccepted方法：

```java
    public static boolean onStartNestedScroll(ViewParent parent, View child, View target, int nestedScrollAxes, int type) {
        if (parent instanceof NestedScrollingParent2) {
            return ((NestedScrollingParent2)parent).onStartNestedScroll(child, target, nestedScrollAxes, type);
        } else {
            if (type == 0) {
                if (VERSION.SDK_INT >= 21) {
                    try {
                        return parent.onStartNestedScroll(child, target, nestedScrollAxes);
                    } catch (AbstractMethodError var6) {
                        Log.e("ViewParentCompat", "ViewParent " + parent + " does not implement interface " + "method onStartNestedScroll", var6);
                    }
                } else if (parent instanceof NestedScrollingParent) {
                    return ((NestedScrollingParent)parent).onStartNestedScroll(child, target, nestedScrollAxes);
                }
            }

            return false;
        }
    }

    public static void onNestedScrollAccepted(ViewParent parent, View child, View target, int nestedScrollAxes, int type) {
        if (parent instanceof NestedScrollingParent2) {
            ((NestedScrollingParent2)parent).onNestedScrollAccepted(child, target, nestedScrollAxes, type);
        } else if (type == 0) {
            if (VERSION.SDK_INT >= 21) {
                try {
                    parent.onNestedScrollAccepted(child, target, nestedScrollAxes);
                } catch (AbstractMethodError var6) {
                    Log.e("ViewParentCompat", "ViewParent " + parent + " does not implement interface " + "method onNestedScrollAccepted", var6);
                }
            } else if (parent instanceof NestedScrollingParent) {
                ((NestedScrollingParent)parent).onNestedScrollAccepted(child, target, nestedScrollAxes);
            }
        }

    }

```

方法里面做了版本兼容，主要是调用外部View的onStartNestedScroll 和 onNestedScrollAccepted方法。

这就是一次完整的从内部View 的 startNestedScroll方法到外部View的onStartNestedScroll 和 onNestedScrollAccepted 方法的交互过程。

其它方法类似，这里不再介绍，可以查看相关源码了解。

自定义一个类继承RecyleView并重写它的方法如下，xml使用时替代RecyleView我们可以清晰的看到child和parent之间的事件传递。

```java
public class NestedLogRecyclerView extends RecyclerView {
    public NestedLogRecyclerView(Context context) {
        super(context);
        init();
    }

    public NestedLogRecyclerView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public NestedLogRecyclerView(Context context, @Nullable AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        init();
    }

    private void init(){
    }

    private static final String TAG = "RecyclerViewNestedLog";
    @Override
    public void setNestedScrollingEnabled(boolean enabled) {
        Log.e("RecyclerViewNestedLog", "setNestedScrollingEnabled");
        super.setNestedScrollingEnabled(enabled);
    }

    @Override
    public boolean isNestedScrollingEnabled() {
        Log.e("RecyclerViewNestedLog", "isNestedScrollingEnabled");
        return super.isNestedScrollingEnabled();
    }

    @Override
    public boolean startNestedScroll(int axes) {
        Log.e("RecyclerViewNestedLog", "startNestedScroll");
        return super.startNestedScroll(axes);
    }

    @Override
    public boolean startNestedScroll(int axes, int type) {
        Log.e("RecyclerViewNestedLog", "startNestedScroll");
        return super.startNestedScroll(axes, type);
    }

    @Override
    public void stopNestedScroll() {
        Log.e("RecyclerViewNestedLog", "stopNestedScroll");
        super.stopNestedScroll();
    }

    @Override
    public void stopNestedScroll(int type) {
        Log.e("RecyclerViewNestedLog", "stopNestedScroll");
        super.stopNestedScroll(type);
    }

    @Override
    public boolean hasNestedScrollingParent() {
        Log.e("RecyclerViewNestedLog", "hasNestedScrollingParent");
        return super.hasNestedScrollingParent();
    }

    @Override
    public boolean hasNestedScrollingParent(int type) {
        Log.e("RecyclerViewNestedLog", "hasNestedScrollingParent");
        return super.hasNestedScrollingParent(type);
    }

    @Override
    public boolean dispatchNestedScroll(int dxConsumed, int dyConsumed, int dxUnconsumed,
                                        int dyUnconsumed, int[] offsetInWindow) {
        Log.e("RecyclerViewNestedLog", "dispatchNestedScroll");
        return super.dispatchNestedScroll(dxConsumed, dyConsumed,
                dxUnconsumed, dyUnconsumed, offsetInWindow);
    }

    @Override
    public boolean dispatchNestedScroll(int dxConsumed, int dyConsumed, int dxUnconsumed,
                                        int dyUnconsumed, int[] offsetInWindow, int type) {
        Log.e("RecyclerViewNestedLog", "dispatchNestedScroll");
        return super.dispatchNestedScroll(dxConsumed, dyConsumed,
                dxUnconsumed, dyUnconsumed, offsetInWindow, type);
    }

    @Override
    public boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow) {
        Log.e("RecyclerViewNestedLog", "dispatchNestedPreScroll");
        return super.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow);
    }

    @Override
    public boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow,
                                           int type) {
        Log.e("RecyclerViewNestedLog", "dispatchNestedPreScroll");
        return super.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow,
                type);
    }

    @Override
    public boolean dispatchNestedFling(float velocityX, float velocityY, boolean consumed) {
        Log.e("RecyclerViewNestedLog", "dispatchNestedFling");
        return super.dispatchNestedFling(velocityX, velocityY, consumed);
    }

    @Override
    public boolean dispatchNestedPreFling(float velocityX, float velocityY) {
        Log.e("RecyclerViewNestedLog", "dispatchNestedPreFling");
        return super.dispatchNestedPreFling(velocityX, velocityY);
    }
}
```

所以我们使用NestedScrollView和RecyleView能够实现嵌套效果，而使用ScrollView不行。

### 4、tablelayout和RecyleView的组合控件实现吸顶效果
那么现在也知道了NestedScrollView和RecyleView是怎么实现的嵌套效果，我们就剩下最后一个问题了，如何实现吸顶的效果？为什么我们的tablelayout会滑动出屏幕哪？

在我们的xml里面我们的布局都是使用的match_content和wrap_content，导致我们在向上滑动时，如果使用的是match_content时，我们的子View会占据整个NestedScrollView的屏幕大小。

如下是我们的xml里的布局代码，如果我们想要实现吸顶效果，其实就是想让包裹了TabLayout和ViewPager2的LinearLayout布局能占据整个屏幕大小，而不是在滑动过程中最后让ViewPager2单独占据掉整个屏幕大小。

```java
<LinearLayout
	android:layout_width="match_parent"
	android:layout_height="match_parent"
	android:orientation="vertical">

	<com.google.android.material.tabs.TabLayout
		android:id="@+id/tablayout"
		android:layout_width="match_parent"
		android:layout_height="wrap_content" />

	<androidx.viewpager2.widget.ViewPager2
		android:id="@+id/viewpager_view"
		android:layout_width="match_parent"
		android:layout_height="match_parent" />
</LinearLayout>
```

那么我们可以采取LinearLayout的高度固定的方式，例如我们这里设置为600dp，效果如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725694472439-d71be7e6-3b8c-4728-85b6-9a79f418a9c5.png)

当设置LinearLayout为600dp后发现整个页面向上滑动到截图位置后就不能向上滑动了，只能滑动下方的内嵌的RecyleView列表，所以这个方法是可以的，但是这个方法太笨了

我们可以在NestedScrollView布局测量时获得LinearLayout的ViewGroup，然后在onMeasure时把LinearLayout的高度设置为NestedScrollView的高度，这样LinearLayout就会填充满我们的整个屏幕，代码如下

自定义类继承NestedScrollView，重写onFinishInflate和onMeasure方法。

```java
@Override
protected void onFinishInflate() {
	super.onFinishInflate();
	contentView = (ViewGroup) ((ViewGroup) getChildAt(0)).getChildAt(1);
}

@Override
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
	// 调整contentView的高度为父容器高度，使之填充布局，避免父容器滚动后出现空白
	super.onMeasure(widthMeasureSpec, heightMeasureSpec);
	ViewGroup.LayoutParams lp = contentView.getLayoutParams();
	lp.height = getMeasuredHeight();
	contentView.setLayoutParams(lp);
}
```

onFinishInflate这个方法在视图的子视图布局完成后被调用。这个方法中，通过调用 `getChildAt(0)` 获取 `NestedScrollView` 的第一个子视图（通常是一个 `ViewGroup`,在我们的代码中就是最外层的LinearLayout），然后通过 `getChildAt(1)` 获取这个 `ViewGroup` 的第二个子视图(在我们的代码中就是内层的LinearLayout)，将其赋值给 `contentView`。

`onMeasure`我们使用`contentView.getLayoutParams()`获取 `contentView` 的布局参数并且将高度`lp.height`设置为`getMeasuredHeight()`，然后使用`contentView.setLayoutParams(lp)`将更新后的布局参数设置回 `contentView`。这样就确保了内部的 `contentView` 能够填满整个 `NestedScrollView` 的高度，避免出现滚动后的空白区域。看下效果：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725694933680-bdb0cfe4-b47a-43f7-93b6-c85f1cb84637.png)

发现`tablelayout`滑动到最顶端就不再滑动了，因为`LinearLayout`已经占据了整个`NestedScrollView` 的高度。

现在我们已经完成了吸顶效果，就剩下最后一个问题了，我们发现如果最开始未吸顶时滑动下面的RecyleView，只有内部 的列表滑动，外部的页面并没有跟着向上滑动。

### 5、嵌套滑动整体向上滑动
如何在滑动RecyleView的时候`NestedScrollView` 向上滑动

这就要将我们前面的所有知识点串起来看，涉及RecyleView滑动原理、NestedScrollView滑动原理以及NestedScrollingParent 和 NestedScrollingChild知识点。

我们知道，滑动的事件是传递到RecyleView后由RecyleView去做了滑动判断，又因为RecyleView实现了NestedScrollingChild接口，所以它会调用`dispatchNestedPreScroll`去询问自己的父容器自己当前有多少的滑动距离可以消费，父容器是否消费一定的距离去滑动(这里的父容器一层层向上递归找实现了NestedScrollingParent的容器)，所以一直找到了NestedScrollView，而我们的NestedScrollView即实现了NestedScrollingParent接口又实现了NestedScrollingChild接口，所以他还会继续去询问自己的父容器是不是可以消费一定的距离去滑动,但是它并没有父容器去消费，而他自己也不会去消费滑动距离，所以最终该滑动事件`if (dispatchNestedPreScroll(......)`条件没有达成，所以相当于还是RecyleView自己去处理所有的滑动距离，dispatchNestedPreScroll具体代码流程如下：

```java
public boolean onTouchEvent(MotionEvent e) {
	//......
	switch(action) {
		//......
		case MotionEvent.ACTION_MOVE: {
			//......
			if (mScrollState == SCROLL_STATE_DRAGGING) {
				//.......
				if (dispatchNestedPreScroll(......){
					//......
				}
			}

		}


	}
```

```java
public boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow,
            int type) {
    return getScrollingChildHelper().dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow,
                type);
}
```

```java
public boolean dispatchNestedPreScroll(int dx, int dy, @Nullable int[] consumed,
		@Nullable int[] offsetInWindow, @NestedScrollType int type) {
	if (isNestedScrollingEnabled()) {
		final ViewParent parent = getNestedScrollingParentForType(type);
		if (parent == null) {
			return false;
		}

		if (dx != 0 || dy != 0) {
			int startX = 0;
			int startY = 0;
			if (offsetInWindow != null) {
				mView.getLocationInWindow(offsetInWindow);
				startX = offsetInWindow[0];
				startY = offsetInWindow[1];
			}

			if (consumed == null) {
				consumed = getTempNestedScrollConsumed();
			}
			consumed[0] = 0;
			consumed[1] = 0;
			//如果父容器消费了滚动距离，consumed数组内的值会变化 返回true
			//如果父容器没有消费，则consumed数组没有任何变化，返回false
			ViewParentCompat.onNestedPreScroll(parent, mView, dx, dy, consumed, type);

			if (offsetInWindow != null) {
				mView.getLocationInWindow(offsetInWindow);
				offsetInWindow[0] -= startX;
				offsetInWindow[1] -= startY;
			}
			return consumed[0] != 0 || consumed[1] != 0;
		} else if (offsetInWindow != null) {
			offsetInWindow[0] = 0;
			offsetInWindow[1] = 0;
		}
	}
	return false;
}
```

```java

public static void onNestedPreScroll(@NonNull ViewParent parent, @NonNull View target, int dx,
		int dy, @NonNull int[] consumed, int type) {
	if (parent instanceof NestedScrollingParent2) {
		// First try the NestedScrollingParent2 API
		((NestedScrollingParent2) parent).onNestedPreScroll(target, dx, dy, consumed, type);
	} else if (type == ViewCompat.TYPE_TOUCH) {
		// Else if the type is the default (touch), try the NestedScrollingParent API
		if (Build.VERSION.SDK_INT >= 21) {
			try {
				Api21Impl.onNestedPreScroll(parent, target, dx, dy, consumed);
			} catch (AbstractMethodError e) {
				Log.e(TAG, "ViewParent " + parent + " does not implement interface "
						+ "method onNestedPreScroll", e);
			}
		} else if (parent instanceof NestedScrollingParent) {
			((NestedScrollingParent) parent).onNestedPreScroll(target, dx, dy, consumed);
		}
	}
}
```

```java
    public void onNestedPreScroll(@NonNull View target, int dx, int dy, @NonNull int[] consumed,
            int type) {
        dispatchNestedPreScroll(dx, dy, consumed, null, type);
    }
```

所以从源码看就是当RecyleView告诉NestedScrollView当前滑动的距离后，如果NestedScrollView可以消费一定的滑动距离，那么NestedScrollView会对应的滑动一定距离，剩余的滑动距离再交给RecyleView去处理，所以我们的思路就是想要让NestedScrollView可以消费滑动距离，计算当前可以消费的滑动距离进行消费，实现NestedScrollView的滑动。

只要重写NestedScrollView的onNestedPreScroll方法即可，代码如下：

```java
public void onNestedPreScroll(@NonNull View target, int dx, int dy, @NonNull int[] consumed, int type) {
	// 向上滑动。若当前topview可见，需要将topview滑动至不可见
	boolean hideTop = dy > 0 && getScrollY() < topView.getMeasuredHeight();
	if (hideTop) {
		scrollBy(0, dy);
		consumed[1] = dy;
	}
}
```

在前面的例子中，我们是希望我们最上方的布局headerview全部隐藏，tablelayout可以吸顶

`boolean hideTop = dy > 0 && getScrollY() < topView.getMeasuredHeight();`

topView是我们的headerview布局，

定义是否已经完全隐藏了headerview的方法是判断当前操作的滑动距离dy大于0且总的滑动距离`getScrollY()`小于headerview的高度时，由NestedScrollView去滑动。

getScrollY()是指相对于初始位置在垂直方向上已经移动了多少

如果顶部布局完全隐藏后

`scrollBy(0, dy);`在当前视图的滚动位置基础上，相对移动dy的视图内容

然后将消费距离的数组代表竖直方向的消费量consumed[1]设置为dy;

这时候我们再去运行程序发现滑动下方的RecyleView已经可以让整个页面向上滑动了，当吸顶后只有RecyleView再滑动，而tablelayout固定不动。

为什么一定要给数组consumed赋值？

假如我们不赋值，只调用了scrollBy让NestedScrollView去滑动，RecyleView就以为父容器没有消费距离，所以全部的滑动的距离也会由RecyleView去消费，就会出现页面在滑动，RecyleView列表也在滑动。所以消费数组一定要更新父容器消费的距离。

### 6、父View带动子View的Fling动作实现丝滑的抛掷效果
现在我们终于实现了类似淘宝京东等首页的吸顶效果，但是还有一个问题，像京东的这些页面，我们向上滑动后有一个惯性滑动，而我们现在滑动下面的ChildView字样的RecyleView时有这个惯性滑动，但是如果我们滑动ParentView字样的区域，发现ChildView区域并没有惯性滑动，也就是说父View要带动子View的Fling，接下来就是实现这个功能。

惯性滑动是什么，学过物理的我们都知道，当我们在冰面上滑行，滑行距离就是我们发力后的初始速度随着阻力的存在逐渐速度减到0的移动距离，那么放在我们这里也是一样的，就是当我们手指离开屏幕时滑动屏幕的速度经过算法的计算后页面能滑出的距离，其中还有随者速度变小滑动的速度也在减小的效果，而我们只关心的是当前滑动时的速度和速度最终能滑出的距离。

所以我们的计算可以概括为如下四步：

1、记下NestedScrollView滑动的速度 velocityY

2、速度转化为 滑行距离

3、知道NestedScrollView可以消费多少距离

速度转化为的距离 -  NestedScrollView可消费距离 = 子View应该滑的距离

4、孩子应该滑的距离再转化为速度(因为fling只支持参数是速度)

5、调用孩子的Fling实现父View带动子View的Fling

先看代码：

```java
package com.android.taobao.nestedscroll.e_perfect_nestedscroll;

import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.widget.NestedScrollView;
import androidx.recyclerview.widget.RecyclerView;

import com.android.taobao.common.fragment.NestedLogRecyclerView;
import com.android.base.utils.FlingHelper;

public class NestedScrollLayout extends NestedScrollView {
    private View topView;
    private ViewGroup contentView;
    private static final String TAG = "NestedScrollLayout";

    public NestedScrollLayout(Context context) {
        this(context, null);
        init();
    }

    public NestedScrollLayout(Context context, @Nullable AttributeSet attrs) {
        this(context, attrs, 0);
        init();
    }

    public NestedScrollLayout(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        this(context, attrs, defStyleAttr, 0);
        init();
    }

    public NestedScrollLayout(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private FlingHelper mFlingHelper;

	//记录基于当前滚动视图开始滑动的总距离
    int totalDy = 0;
    /
     * 用于判断RecyclerView是否在fling
     */
    boolean isStartFling = false;
    /
     * 记录当前滑动的y轴加速度
     */
    private int velocityY = 0;

    private void init() {
		//一个处理滑动Fling效果下速度和距离转化的Helper类
        mFlingHelper = new FlingHelper(getContext());
        setOnScrollChangeListener(new View.OnScrollChangeListener() {
            @Override
            public void onScrollChange(View v, int scrollX, int scrollY, int oldScrollX, int oldScrollY) {
                //滚动视图的滚动位置发生变化时有一个快速滑动（fling）动作正在发生
				//重置滚动总距离和快速滑动标志位
				if (isStartFling) {
                    totalDy = 0;
                    isStartFling = false;
                }
				//如果是最开始，当前滚动位置 scrollY 为 0，未曾滚动表示在顶部
                if (scrollY == 0) {
                    Log.i(TAG, "TOP SCROLL");
                   // refreshLayout.setEnabled(true);
                }
				//滚动NestedScrollLayout的第一个子视图滑动到了底部
				//(NestedScrollLayout就一个子视图LinearLayout,但是子视图高度大于NestedScrollLayout高度)
                if (scrollY == (getChildAt(0).getMeasuredHeight() - v.getMeasuredHeight())) {
                    Log.i(TAG, "BOTTOM SCROLL");
                    dispatchChildFling();
                }
                //在RecyclerView fling情况下，记录当前RecyclerView在y轴的偏移
                totalDy += scrollY - oldScrollY;
            }
        });
    }

	//当NestedScrollLayout消费完距离后需要让子View继续Fling时
	//当前Fling的速度不是0时
	//先计算当前正在Fling时的速度转化成的距离减去已经滑动的距离
	//将计算的结果即剩余需要滑动的距离转化为速度交给子View去Fling
    private void dispatchChildFling() {
        if (velocityY != 0) {
            Double splineFlingDistance = mFlingHelper.getSplineFlingDistance(velocityY);
            if (splineFlingDistance > totalDy) {
                childFling(mFlingHelper.getVelocityByDistance(splineFlingDistance - Double.valueOf(totalDy)));
            }
        }
        totalDy = 0;
        velocityY = 0;
    }

    private void childFling(int velY) {
        RecyclerView childRecyclerView = getChildRecyclerView(contentView);
        if (childRecyclerView != null) {
            childRecyclerView.fling(0, velY);
        }
    }


	//重写了 fling() 方法，处理快速滑动
	//记录下Fling时的速度，并且设置Fling标志位为true表示开始Fling了
    @Override
    public void fling(int velocityY) {
        super.fling(velocityY);
        if (velocityY <= 0) {
            this.velocityY = 0;
        } else {
            isStartFling = true;
            this.velocityY = velocityY;
        }
    }

    @Override
    protected void onFinishInflate() {
        super.onFinishInflate();
        topView = ((ViewGroup) getChildAt(0)).getChildAt(0);
        contentView = (ViewGroup) ((ViewGroup) getChildAt(0)).getChildAt(1);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        // 调整contentView的高度为父容器高度，使之填充布局，避免父容器滚动后出现空白
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        ViewGroup.LayoutParams lp = contentView.getLayoutParams();
        lp.height = getMeasuredHeight();
        contentView.setLayoutParams(lp);
    }

    @Override
    public void onNestedPreScroll(@NonNull View target, int dx, int dy, @NonNull int[] consumed, int type) {
        Log.i("NestedScrollLayout", getScrollY()+"::onNestedPreScroll::"+topView.getMeasuredHeight());
        // 向上滑动。若当前topview可见，需要将topview滑动至不可见
        boolean hideTop = dy > 0 && getScrollY() < topView.getMeasuredHeight();
        if (hideTop) {
            scrollBy(0, dy);
            consumed[1] = dy;
        }
    }

    /
     * 递归地检查每个子视图，来查找特定类型的 RecyclerView
     * @param viewGroup
     * @return
     */
    private RecyclerView getChildRecyclerView(ViewGroup viewGroup) {
        for (int i = 0; i < viewGroup.getChildCount(); i++) {
            View view = viewGroup.getChildAt(i);
            //检查当前子视图 view 是否是 RecyclerView 的实例，
            //并且是否确切地是 NestedLogRecyclerView 类型
            if (view instanceof RecyclerView && view.getClass() == NestedLogRecyclerView.class) {
                return (RecyclerView) viewGroup.getChildAt(i);
            } else if (viewGroup.getChildAt(i) instanceof ViewGroup) {//如果当前子视图 view 是 ViewGroup 的实例（即它是一个容器）
                //递归调用 getChildRecyclerView 方法，传入当前的子 ViewGroup，以在其内部继续查找 RecyclerView
                ViewGroup childRecyclerView = getChildRecyclerView((ViewGroup) viewGroup.getChildAt(i));
                //检查递归调用的结果 childRecyclerView 是否是 RecyclerView 的实例
                if (childRecyclerView instanceof RecyclerView) {
                    return (RecyclerView) childRecyclerView;
                }
            }
            continue;
        }
        //遍历完所有的子视图后都没有找到符合条件的 RecyclerView，那么这个方法会返回 null。
        return null;
    }
}
```

上述代码中有一步代码是：`if (scrollY == (getChildAt(0).getMeasuredHeight() - v.getMeasuredHeight()))`

解释如下：

v.getMeasuredHeight()是NestedScrollView的高度，因为我们在onMeasure中把内层的linearLayout设置为是NestedScrollView的高度，所以：

NestedScrollView的子视图外层的linearLayout的高度=自定义RecyleView高度+内层linearLayout高度。

也就是说NestedScrollView的高度比NestedScrollView的子视图的高度少。

当headerview滑出屏幕隐藏后，NestedScrollView的子视图等同于下面隐藏的部分全部显示，也就是到了最底部。

这里要说一个点：

+ NestedScrollView第一个子视图的测量高度与 NestedScrollLayout 自身的测量高度存在差值如果 NestedScrollLayout 的高度小于其第一个子视图的高度，这个差值将会是正数，这意味着 NestedScrollLayout 可以滚动以显示子视图的全部内容。相反，如果 NestedScrollLayout 的高度大于或等于其第一个子视图的高度，这个差值将会是零或负数，表示没有额外的内容可以滚动。

所以NestedScrollView能滑动的距离最大就是`getChildAt(0).getMeasuredHeight() - v.getMeasuredHeight()`

所以当NestedScrollView的滑动距离`scrollY == (getChildAt(0).getMeasuredHeight() - v.getMeasuredHeight())`时，这里用的时等于的条件是因为当大于时，我们视野内的视图全部都是RecyleView了，所以Fling效果RecyleView自己去处理就可以了，我们只需要处理当从ChildView区域外触摸滑动时，NestedScrollView的Fling滑动距离超过headerView后还额外需要ChilidView区域继续去Fling滑动的情况就可以了。

`totalDy += scrollY - oldScrollY;`表示如果一直在fling时我们又去滑动应该更改子view滑动的总距离。

至此，我们再运行程序，当我们滑动ParentView区域时，fling的动作会在headerview隐藏后由childview区域继续去fling，我们也就实现了京东淘宝首页的嵌套滑动页面效果。

