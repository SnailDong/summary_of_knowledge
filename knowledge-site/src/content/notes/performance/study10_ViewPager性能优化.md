## 一、app启动加载资源的黑白屏耗时问题
app启动时会出现黑白屏

Launcher --> ams --> app（第一个activity）--> 启动window（黑白屏）

黑白屏会有耗时，所以会出现持续的黑白屏现象，

通过theme:背景，image 可以让黑白屏问题显示变成背景的样式，但是并不能缩短这个耗时。

黑白屏产生的根本原因和解决方法：

容易产生黑白屏的地方

1.Application的onCreate()里面耗时，如果逻辑过多过于复杂，耗时多。

2.第一个activity的onCreate，onStart，onResume里面耗时，如果这几个方法里的逻辑过多过于复杂，耗时多。

如何优化这个时间？

## 二、ViewPager在app中的使用
首先看一下微信的页面加载


![](https://cdn.nlark.com/yuque/0/2024/gif/29215582/1726624133641-b73ede49-cb2d-486b-b956-7c120f04e84e.gif)

微信的界面


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726624528607-4d3de217-d3a9-43e2-a9cb-445e52427885.png)

今日头条界面


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726624539014-bffd263d-3869-4703-89d5-7b816bdb2022.png)

现在很多项目中都会用到这种viewPager嵌套fragment的操作，甚至Fragment中再嵌套Fragment的复杂操作，如下


![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1726645929016-7890997c-7d5f-46e2-8e83-ccb27a2f604c.webp)

像上面提到的微信、今日头条以及诸如京东淘宝都是这种方式，比如下面三种布局


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726624328995-4bd49e54-a859-43c2-b788-9e7a8c6e5065.png)

微信使用的是第一种

今日头条是第二种

京东淘宝等使用的是第三种

都是使用的viewpager+fragment的预加载方案

由于ViewPager的缓存机制就会加载多个Fragmen页面导致加载速度变慢

1 activity + 1 viewpager + n fragment

viewpager在显示上述第二个页面时，会预加载左右设置的要加载的页面，会导致耗时

加载耗时增加： 1+5

内存：5倍

耗时和内存损失，加载缓慢，第一次时黑白屏时间加长。

如何解决？

不让你预加载，替换为懒加载。

当显示frag4时，预加载要加载frag2、3、5、6，所以使用懒加载方法，让frag2、3、5、6显示空白view，例如只显示一个textview。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1726625395526-7da42691-a6b7-4759-80d0-f4ad938c0a12.png)

## 三、ViewPager的populate函数
首先ViewPager的核心函数是内部的populate函数。

ViewPager的populate函数用于填充视图页面，并确保当前项（mCurItem）的页面被正确地添加到 ViewPager 中，通常在 ViewPager 滚动时被调用，以确保用户可以看到正确的页面。

以下是 `populate` 方法的一些关键步骤：

1. 检查是否需要更新：如果当前项没有变化，或者 `ViewPager` 没有 `PagerAdapter`，那么不需要进行任何操作。
2. 检查是否附加到窗口：如果 `ViewPager` 还没有被附加到窗口，那么不会进行任何填充操作。
3. 开始更新：通过调用 `PagerAdapter` 的 `startUpdate` 方法开始更新过程。
4. 计算页面范围：计算应该在 `ViewPager` 中显示的页面范围，这取决于当前项和页面边界限制（`mOffscreenPageLimit`）。
5. 添加或移除页面：根据需要添加新页面或移除旧页面。这包括调用 `PagerAdapter` 的 `instantiateItem` 和 `destroyItem` 方法。
6. 计算页面偏移：调用 `calculatePageOffsets` 方法来计算每个页面的偏移量。
7. 设置主要项：通过调用 `PagerAdapter` 的 `setPrimaryItem` 方法来设置当前主要显示的项。
8. 完成更新：调用 `PagerAdapter` 的 `finishUpdate` 方法来完成更新过程。
9. 更新子视图的绘制顺序：调用 `sortChildDrawingOrder` 方法来确保子视图的绘制顺序是正确的。
10. 焦点处理：如果 `ViewPager` 有焦点，确保焦点在正确的页面上。

这个方法是 ViewPager 的核心部分，它确保了页面的正确填充和更新。通常不需要直接调用这个方法，因为它会在 ViewPager 的滚动和布局过程中自动被调用，所以我们只需要去实现自定义的PagerAdapter 就可以。

ViewPager的适配器PagerAdapter，在实现自定义的 `ViewPager` 适配器时，需要注意以下几个关键点：

1. 继承正确的适配器类：
    - 如果你使用的是 `Fragment`，应该继承 `FragmentPagerAdapter` 或 `FragmentStatePagerAdapter`。
    - 如果你不是在使用 `Fragment`，可以继承 `PagerAdapter`。
2. 实现必要的方法：
    - `getItem(int position)`：返回给定位置的 `Object`，通常是 `Fragment` 或 `View`。
    - `getCount()`：返回页面的数量。
3. 管理页面状态：
    - 如果使用 `FragmentStatePagerAdapter`，它可以保存和恢复页面状态，适合页面数量较多的情况。
    - 如果使用 `FragmentPagerAdapter`，它不会保存页面状态，适合页面数量较少的情况。
4. 页面创建和销毁：
    - 在 `getItem` 方法中创建页面实例。
    - 在 `destroyItem` 方法中销毁页面实例，释放资源。
5. 页面缓存：
    - 通过设置 `ViewPager` 的 `setOffscreenPageLimit` 方法来控制缓存页面的数量。
6. 数据集变化：
    - 当数据集发生变化时，调用 `notifyDataSetChanged` 或 `notifyDataChanged` 来通知 `ViewPager` 更新。
7. 页面布局：
    - 确保每个页面的布局都是正确的，特别是页面的宽高和 `ViewPager` 的宽高匹配。
8. 页面切换动画：
    - 可以通过重写 `getPageTransformer` 方法来自定义页面切换的动画效果。
9. 资源管理：
    - 在 `destroyItem` 方法中释放不再需要的资源，如图片加载器的资源。
10. 页面复用：
    - 理解 `ViewPager` 的页面复用机制，确保在 `getItem` 方法中正确处理页面复用。
11. 异常处理：
    - 在适配器中处理可能的异常，如数据集为空或数据项不存在的情况。
12. 与 `ViewPager` 同步：
    - 确保适配器的页面索引与 `ViewPager` 当前显示的页面同步。
13. 适配器数据：
    - 适配器应该只关心数据和页面的创建，不关心 `ViewPager` 的滚动和动画。
14. 线程安全：
    - 如果数据集可能会在后台线程中更新，确保更新适配器时的线程安全。

## 四、ViewPager的缓存原理
通过ViewPager的populate源码看下ViewPager是怎么确保页面正确地创建和销毁、正确地计算页面的偏移量和宽度因子以及处理了页面的缓存逻辑，确保在滚动时页面能够平滑地显示和隐藏。

```java
//newCurrentItem表示新的当前页面项
void populate(int newCurrentItem) {
	//声明一个 ItemInfo 对象用于存储旧的当前页面信息
	ItemInfo oldCurInfo = null;
	//检查当前页面是否与新的页面不同
	if (mCurItem != newCurrentItem) {
		//如果不同，获取当前页面的信息
		oldCurInfo = infoForPosition(mCurItem);
		//更新当前页面为新的页面
		mCurItem = newCurrentItem;
	}

	//如果 ViewPager 的适配器为空，说明没有页面可以显示
	if (mAdapter == null) {
		//对子视图的绘制顺序进行排序
		sortChildDrawingOrder();
		return;
	}

	// Bail now if we are waiting to populate.  This is to hold off
	// on creating views from the time the user releases their finger to
	// fling to a new position until we have finished the scroll to
	// that position, avoiding glitches from happening at that point.
	//如果有一个页面填充操作正在进行中
	if (mPopulatePending) {
		if (DEBUG) Log.i(TAG, "populate is pending, skipping for now...");
		//再次对子视图的绘制顺序进行排序
		sortChildDrawingOrder();
		return;
	}

	// Also, don't populate until we are attached to a window.  This is to
	// avoid trying to populate before we have restored our view hierarchy
	// state and conflicting with what is restored.
	//如果 ViewPager 没有附加到窗口
	if (getWindowToken() == null) {
		return;
	}

	//通知适配器开始更新 ViewPager
	mAdapter.startUpdate(this);

	//获取可以保持在内存中但不可见的页面数量
	final int pageLimit = mOffscreenPageLimit;
	//计算开始的页面位置
	final int startPos = Math.max(0, mCurItem - pageLimit);
	//获取适配器中的页面总数
	final int N = mAdapter.getCount();
	//计算结束的页面位置
	final int endPos = Math.min(N - 1, mCurItem + pageLimit);
	//如果页面总数与预期的数量不符
	if (N != mExpectedAdapterCount) {
		//声明一个字符串变量用于存储资源名称
		String resName;
		//尝试获取 ViewPager 的资源名称
		try {
			resName = getResources().getResourceName(getId());
		} catch (Resources.NotFoundException e) {
			//如果找不到资源名称，使用 ViewPager 的 ID 的十六进制表示
			resName = Integer.toHexString(getId());
		}
		//抛出异常，说明适配器内容在没有调用 notifyDataSetChanged 的情况下被改变了
		throw new IllegalStateException("The application's PagerAdapter changed the adapter's"
				+ " contents without calling PagerAdapter#notifyDataSetChanged!"
				+ " Expected adapter item count: " + mExpectedAdapterCount + ", found: " + N
				+ " Pager id: " + resName
				+ " Pager class: " + getClass()
				+ " Problematic adapter: " + mAdapter.getClass());
	}

	// Locate the currently focused item or add it if needed.
	//声明一个变量用于存储当前页面在 mItems 列表中的索引
	int curIndex = -1;
	//声明一个 ItemInfo 对象用于存储当前页面的信息
	ItemInfo curItem = null;
	//遍历 mItems 列表
	for (curIndex = 0; curIndex < mItems.size(); curIndex++) {
		//获取当前遍历到的 ItemInfo
		final ItemInfo ii = mItems.get(curIndex);
		//如果 ItemInfo 的位置大于或等于当前页面
		if (ii.position >= mCurItem) {
			//如果 ItemInfo 的位置与当前页面相同，更新 curItem
			if (ii.position == mCurItem) curItem = ii;
			break;
		}
	}

	//如果没有找到当前页面的信息，并且页面总数大于0
	if (curItem == null && N > 0) {
		//添加一个新的页面项
		curItem = addNewItem(mCurItem, curIndex);
	}

	// Fill 3x the available width or up to the number of offscreen
	// pages requested to either side, whichever is larger.
	// If we have no current item we have no work to do.
	if (curItem != null) {
		//声明一个变量用于存储左侧额外的宽度
		float extraWidthLeft = 0.f;
		//声明一个变量用于存储当前页面左侧的页面索引
		int itemIndex = curIndex - 1;
		//获取当前页面左侧的 ItemInfo
		ItemInfo ii = itemIndex >= 0 ? mItems.get(itemIndex) : null;
		//获取客户端宽度
		final int clientWidth = getClientWidth();
		//计算左侧需要的宽度
		final float leftWidthNeeded = clientWidth <= 0 ? 0 :
				2.f - curItem.widthFactor + (float) getPaddingLeft() / (float) clientWidth;
		//从当前页面向左遍历
		for (int pos = mCurItem - 1; pos >= 0; pos--) {
			//如果左侧额外宽度大于或等于需要的宽度，并且位置小于开始位置
			if (extraWidthLeft >= leftWidthNeeded && pos < startPos) {
				//如果没有左侧页面，跳出循环
				if (ii == null) {
					break;
				}
				//如果左侧页面的位置与当前位置相同，并且没有在滚动
				if (pos == ii.position && !ii.scrolling) {
					//移除左侧页面项
					mItems.remove(itemIndex);
					//通知适配器销毁页面
					mAdapter.destroyItem(this, pos, ii.object);
					if (DEBUG) {
						Log.i(TAG, "populate() - destroyItem() with pos: " + pos
								+ " view: " + ((View) ii.object));
					}
					//更新左侧页面索引
					itemIndex--;
					//更新当前页面索引
					curIndex--;
					//更新左侧 ItemInfo
					ii = itemIndex >= 0 ? mItems.get(itemIndex) : null;
				}
			} else if (ii != null && pos == ii.position) {
				//如果左侧页面存在，并且位置与当前位置相同
				//增加左侧额外宽度
				extraWidthLeft += ii.widthFactor;
				//更新左侧页面索引
				itemIndex--;
				//更新左侧 ItemInfo
				ii = itemIndex >= 0 ? mItems.get(itemIndex) : null;
			} else {//如果左侧页面不存在或位置不同
				//添加一个新的页面项
				ii = addNewItem(pos, itemIndex + 1);
				//增加左侧额外宽度
				extraWidthLeft += ii.widthFactor;
				//更新当前页面索引
				curIndex++;
				//更新左侧 ItemInfo
				ii = itemIndex >= 0 ? mItems.get(itemIndex) : null;
			}
		}

		//声明一个变量用于存储右侧额外的宽度
		float extraWidthRight = curItem.widthFactor;
		//声明一个变量用于存储当前页面右侧的页面索引
		itemIndex = curIndex + 1;
		//如果右侧额外宽度小于2
		if (extraWidthRight < 2.f) {
			//获取当前页面右侧的 ItemInfo
			ii = itemIndex < mItems.size() ? mItems.get(itemIndex) : null;
			//计算右侧需要的宽度
			final float rightWidthNeeded = clientWidth <= 0 ? 0 :
					(float) getPaddingRight() / (float) clientWidth + 2.f;
			//从当前页面向右遍历
			for (int pos = mCurItem + 1; pos < N; pos++) {
				//如果右侧额外宽度大于或等于需要的宽度，并且位置大于结束位置
				if (extraWidthRight >= rightWidthNeeded && pos > endPos) {
					//如果没有右侧页面，跳出循环
					if (ii == null) {
						break;
					}
					//如果右侧页面的位置与当前位置相同，并且没有在滚动
					if (pos == ii.position && !ii.scrolling) {
						//移除右侧页面项
						mItems.remove(itemIndex);
						//通知适配器销毁页面
						mAdapter.destroyItem(this, pos, ii.object);
						if (DEBUG) {
							Log.i(TAG, "populate() - destroyItem() with pos: " + pos
									+ " view: " + ((View) ii.object));
						}
						//更新右侧 ItemInfo
						ii = itemIndex < mItems.size() ? mItems.get(itemIndex) : null;
					}
				} else if (ii != null && pos == ii.position) {
					//如果右侧页面存在，并且位置与当前位置相同
					//增加右侧额外宽度
					extraWidthRight += ii.widthFactor;
					//更新右侧页面索引
					itemIndex++;
					//更新右侧 ItemInfo
					ii = itemIndex < mItems.size() ? mItems.get(itemIndex) : null;
				} else {//如果右侧页面不存在或位置不同
					//添加一个新的页面项
					ii = addNewItem(pos, itemIndex);
					//更新右侧页面索引
					itemIndex++;
					//增加右侧额外宽度
					extraWidthRight += ii.widthFactor;
					//更新右侧 ItemInfo
					ii = itemIndex < mItems.size() ? mItems.get(itemIndex) : null;
				}
			}
		}

		//计算页面偏移
		calculatePageOffsets(curItem, curIndex, oldCurInfo);

		//通知适配器设置主要项
		mAdapter.setPrimaryItem(this, mCurItem, curItem.object);
	}

	if (DEBUG) {
		Log.i(TAG, "Current page list:");
		for (int i = 0; i < mItems.size(); i++) {
			Log.i(TAG, "#" + i + ": page " + mItems.get(i).position);
		}
	}

	//通知适配器更新完成
	mAdapter.finishUpdate(this);

	// Check width measurement of current pages and drawing sort order.
	// Update LayoutParams as needed.
	//获取子视图的数量
	final int childCount = getChildCount();
	for (int i = 0; i < childCount; i++) {
		//获取当前子视图
		final View child = getChildAt(i);
		//获取子视图的布局参数
		final LayoutParams lp = (LayoutParams) child.getLayoutParams();
		//设置子视图的索引
		lp.childIndex = i;
		//如果子视图不是装饰视图，并且宽度因子为0
		if (!lp.isDecor && lp.widthFactor == 0.f) {
			// 0 means requery the adapter for this, it doesn't have a valid width.
			//获取子视图对应的 ItemInfo
			final ItemInfo ii = infoForChild(child);
			//如果 ItemInfo 存在
			if (ii != null) {
				//更新宽度因子
				lp.widthFactor = ii.widthFactor;
				//更新位置
				lp.position = ii.position;
			}
		}
	}
	//对子视图的绘制顺序进行排序
	sortChildDrawingOrder();
	//如果 ViewPager 有焦点
	if (hasFocus()) {
		//获取当前焦点视图
		View currentFocused = findFocus();
		//获取当前焦点视图对应的 ItemInfo
		ItemInfo ii = currentFocused != null ? infoForAnyChild(currentFocused) : null;
		//如果 ItemInfo 不存在，或者位置与当前页面不同
		if (ii == null || ii.position != mCurItem) {
			for (int i = 0; i < getChildCount(); i++) {
				//获取当前子视图
				View child = getChildAt(i);
				//获取子视图对应的 ItemInfo
				ii = infoForChild(child);
				//如果 ItemInfo 存在，并且位置与当前页面相同
				if (ii != null && ii.position == mCurItem) {
					//如果子视图请求焦点成功
					if (child.requestFocus(View.FOCUS_FORWARD)) {
						break;
					}
				}
			}
		}
	}
}
```

```java
ItemInfo addNewItem(int position, int index) {
	ItemInfo ii = new ItemInfo();
	ii.position = position;
	ii.object = mAdapter.instantiateItem(this, position);
	ii.widthFactor = mAdapter.getPageWidth(position);
	if (index < 0 || index >= mItems.size()) {
		mItems.add(ii);
	} else {
		mItems.add(index, ii);
	}
	return ii;
}
```

```java
@NonNull
@Override
public Object instantiateItem(@NonNull ViewGroup container, int position) {
	if (mCurTransaction == null) {
		mCurTransaction = mFragmentManager.beginTransaction();
	}

	final long itemId = getItemId(position);

	// Do we already have this fragment?
	String name = makeFragmentName(container.getId(), itemId);
	Fragment fragment = mFragmentManager.findFragmentByTag(name);
	if (fragment != null) {
		if (DEBUG) Log.v(TAG, "Attaching item #" + itemId + ": f=" + fragment);
		mCurTransaction.attach(fragment);
	} else {
		fragment = getItem(position);
		if (DEBUG) Log.v(TAG, "Adding item #" + itemId + ": f=" + fragment);
		mCurTransaction.add(container.getId(), fragment,
				makeFragmentName(container.getId(), itemId));
	}
	if (fragment != mCurrentPrimaryItem) {
		fragment.setMenuVisibility(false);
		if (mBehavior == BEHAVIOR_RESUME_ONLY_CURRENT_FRAGMENT) {
			mCurTransaction.setMaxLifecycle(fragment, Lifecycle.State.STARTED);
		} else {
			fragment.setUserVisibleHint(false);
		}
	}

	return fragment;
}
```

通过上述代码可以知道，

