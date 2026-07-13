# 创建界面的流程

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1724825360776-8fe5cfd4-ef17-4250-bc2b-8037edfb2fb0.png)

PhoneWindow创建流程与onCreate执行流程

```java
ActivityThread.java
    performLaunchActivity
        activity.attach
            mWindow = new PhoneWindow(.....);
        mInstrumentation.callActivityOnCreate
            activity.performCreate(icicle);
                onCreate();
                    @override onCreate

```

setContentView流程 -- 主要目的  创建 DecorView 拿到 Content

继承 Activity 的流程

```java
MainActivity.java
    @override onCreate
        setContentView(...);
            getWindow().setContentView -- getWindow()即第一步里new PhoneWindow的值
                installDecor();
                    mDecor = generateDecor(-1);
                        return new DecorView(...);
                    mContentParent = generateLayout(mDecor);
```

setContentView

-->PhoneWindow.setContentView --- 主要目的  创建 DecorView 拿到 Content


# view的绘制流程
setContentView并没有将activity_main.xml绘制到屏幕上，只是创建了DecorView、把xml添加到DecorView。

## 一、DecorView是什么时候添加到Window上的？
在ActivityThread中执行handleResumeActivity调用performResumeActivity，然后调用到Activity的performResume方法，也就是说activity的onResume方法是在添加view前执行的，

```java
@Override
public void handleResumeActivity(IBinder token, boolean finalStateRequest, boolean isForward,
                                 String reason) {
    ...
    // TODO Push resumeArgs into the activity for consideration
    final ActivityClientRecord r = performResumeActivity(token, finalStateRequest, reason);
    ....
    wm.addView(decor, l);// WindowManager添加Decor（decor是DecorView）
}

@VisibleForTesting
public ActivityClientRecord performResumeActivity(IBinder token, boolean finalStateRequest,
                                                  String reason) {
    ......
    r.activity.performResume(r.startsNotResumed, reason);
    ......
}
```

`Activity`的`performResume`方法又调用到`Instrumentation`的`callActivityOnResume`

```java
final void performResume(boolean followedByPause, String reason) {
    ......
    // mResumed is set by the instrumentation
    mInstrumentation.callActivityOnResume(this);
    ......
}
```

`Instrumentation`的`callActivityOnResume`再去调用`Activity`的`onResume`方法，该方法又被`MainActivity`重写

```java
public void callActivityOnResume(Activity activity) {
        activity.mResumed = true;
        activity.onResume();

        if (mActivityMonitors != null) {
            synchronized (mSync) {
                final int N = mActivityMonitors.size();
                for (int i=0; i<N; i++) {
                    final ActivityMonitor am = mActivityMonitors.get(i);
                    am.match(activity, activity, activity.getIntent());
                }
            }
        }
    }
```

再回到`ActivityThread`的`handleResumeActivity`方法中，代码继续往下执行，标`/`位置为重要代码，首先拿到`a.getWindowManager()`，然后执行`wm.addView(decor, l);`

```java
@Override
public void handleResumeActivity(IBinder token, boolean finalStateRequest, boolean isForward,
                                 String reason) {
            ...
            // TODO Push resumeArgs into the activity for consideration
            final ActivityClientRecord r = performResumeActivity(token, finalStateRequest, reason);
            ....
            if (r.window == null && !a.mFinished && willBeVisible) {
            r.window = r.activity.getWindow();//
            View decor = r.window.getDecorView();//
            decor.setVisibility(View.INVISIBLE);
            ViewManager wm = a.getWindowManager();//
            WindowManager.LayoutParams l = r.window.getAttributes();
            a.mDecor = decor;
            l.type = WindowManager.LayoutParams.TYPE_BASE_APPLICATION;
            l.softInputMode |= forwardBit;
            if (r.mPreserveWindow) {
                a.mWindowAdded = true;
                r.mPreserveWindow = false;
                // Normally the ViewRoot sets up callbacks with the Activity
                // in addView->ViewRootImpl#setView. If we are instead reusing
                // the decor view we have to notify the view root that the
                // callbacks may have changed.
                ViewRootImpl impl = decor.getViewRootImpl();
                if (impl != null) {
                    impl.notifyChildRebuilt();
                }
            }
            if (a.mVisibleFromClient) {
                if (!a.mWindowAdded) {
                    a.mWindowAdded = true;
                    wm.addView(decor, l);//
                } else {
                    // The activity will get a callback for this {@link LayoutParams} change
                    // earlier. However, at that time the decor will not be set (this is set
                    // in this method), so no action will be taken. This call ensures the
                    // callback occurs with the decor set.
                    a.onWindowAttributesChanged(l);
                }
            }

            // If the window has already been added, but during resume
            // we started another activity, then don't yet make the
            // window visible.
        }
    ....
}
```

## 二、getWindowManager是什么呢？
该值是在Activity的attach中和new PhoneWindow一样被初始化的，继续看该值的源头，Window.java中看到，`mWindowManager = ((WindowManagerImpl)wm).createLocalWindowManager(this);`所以，`getWindowManager`就是拿到了`WindowManagerImpl`的对象。

```java
public WindowManager getWindowManager() {
    return mWindowManager;
}

@UnsupportedAppUsage
final void attach(Context context, ActivityThread aThread,
                  Instrumentation instr, IBinder token, int ident,
                  Application application, Intent intent, ActivityInfo info,
                  CharSequence title, Activity parent, String id,
                  NonConfigurationInstances lastNonConfigurationInstances,
                  Configuration config, String referrer, IVoiceInteractor voiceInteractor,
                  Window window, ActivityConfigCallback activityConfigCallback, IBinder assistToken) {

    ......
    mWindow = new PhoneWindow(this, window, activityConfigCallback);
    ......
    mWindow.setWindowManager(
        (WindowManager)context.getSystemService(Context.WINDOW_SERVICE),
        mToken, mComponent.flattenToString(),
        (info.flags & ActivityInfo.FLAG_HARDWARE_ACCELERATED) != 0);
    ......
    mWindowManager = mWindow.getWindowManager();
    ......

}
```

```java
public WindowManager getWindowManager() {
    return mWindowManager;
}
public void setWindowManager(WindowManager wm, IBinder appToken, String appName,
                             boolean hardwareAccelerated) {
    mAppToken = appToken;
    mAppName = appName;
    mHardwareAccelerated = hardwareAccelerated;
    if (wm == null) {
        wm = (WindowManager)mContext.getSystemService(Context.WINDOW_SERVICE);
    }
    mWindowManager = ((WindowManagerImpl)wm).createLocalWindowManager(this);
}
```

再次回到我们的mv.addView代码就可以知道，此处调用到了WindowManagerImpl的addView,而WindowManagerImpl.addView又调用了WindowManagerGlobal的addView

```java
    @Override
    public void addView(@NonNull View view, @NonNull ViewGroup.LayoutParams params) {
        applyDefaultToken(params);
        mGlobal.addView(view, params, mContext.getDisplayNoVerify(), mParentWindow,
                mContext.getUserId());
    }
```

```java
public void addView(View view, ViewGroup.LayoutParams params,
                    Display display, Window parentWindow, int userId) {
    ......
    final WindowManager.LayoutParams wparams = (WindowManager.LayoutParams) params;
    ......
    ViewRootImpl root;
    ......
    //不允许重复添加view
    int index = findViewLocked(view, false);
    if (index >= 0) {
        if (mDyingViews.contains(view)) {
            // Don't wait for MSG_DIE to make it's way through root's queue.
            mRoots.get(index).doDie();
        } else {
            throw new IllegalStateException("View " + view
                                            + " has already been added to the window manager.");
        }
        // The previous removeView() had not completed executing. Now it has.
    }
    ......
    root = new ViewRootImpl(view.getContext(), display);

    view.setLayoutParams(wparams);

    mViews.add(view);// DecorView
    mRoots.add(root);// ViewRootImpl
    mParams.add(wparams);// WindowManager.LayoutParams
    // do this last because it fires off messages to start doing things
    try {
        root.setView(view, wparams, panelParentView, userId);
    } catch (RuntimeException e) {
        // BadTokenException or InvalidDisplayException, clean up.
        if (index >= 0) {
            removeViewLocked(index, true);
        }
        throw e;
    }
}
```

在刚才使用到的WindowManagerImpl、WindowManagerGlobal、ViewRootImpl，他们的具体作用是什么呢？

WindowManagerImpl：确定 View  属于哪个屏幕，哪个父窗口

WindowManagerGlobal：管理整个进程 所有的窗口信息

ViewRootImpl：WindowManagerGlobal 实际操作者，操作自己的窗口

## 三、setView
继续分析代码，最后执行了root.setView也就是ViewRootImpl.setView，

```java
public void setView(View view, WindowManager.LayoutParams attrs, View panelParentView,
                    int userId) {
    ......
    requestLayout();
    ......
}
-------------------------------------------------------------
@Override
public void requestLayout() {
    if (!mHandlingLayoutInLayoutRequest) {
        checkThread();
        mLayoutRequested = true;
        scheduleTraversals();
    }
}
-------------------------------------------------------------
@UnsupportedAppUsage
void scheduleTraversals() {
    if (!mTraversalScheduled) {
        mTraversalScheduled = true;
        mTraversalBarrier = mHandler.getLooper().getQueue().postSyncBarrier();
        mChoreographer.postCallback(
            Choreographer.CALLBACK_TRAVERSAL, mTraversalRunnable, null);
        notifyRendererOfFramePending();
        pokeDrawLockIfNeeded();
    }
}
-------------------------------------------------------------
final class TraversalRunnable implements Runnable {
    @Override
    public void run() {
        doTraversal();
    }
}
final TraversalRunnable mTraversalRunnable = new TraversalRunnable();
-------------------------------------------------------------
void doTraversal() {
    if (mTraversalScheduled) {
mTraversalScheduled = false;
        mHandler.getLooper().getQueue().removeSyncBarrier(mTraversalBarrier);

        if (mProfile) {
            Debug.startMethodTracing("ViewAncestor");
        }

        performTraversals();//绘制view

        if (mProfile) {
            Debug.stopMethodTracing();
            mProfile = false;
        }
    }
}
```

根据上面的代码追踪，最后执行的关键代码`performTraversals();`这部分代码里执行的就是绘制View，onDraw等都在这里面被执行，暂时先不分析这里面的代码逻辑，回到刚才的setView中requestLayout()代码位置，继续看setView后面的代码：

```java
public void setView(View view, WindowManager.LayoutParams attrs, View panelParentView,
                    int userId) {

    ......
    requestLayout();//请求遍历
    ......
    res = mWindowSession.addToDisplayAsUser// 将窗口添加到WMS上面  WindowManagerService
    ......
    //事件处理
    ......
    view.assignParent(this);//// 设置view的父容器getParent  ViewRootImpl
    ......
}
```

```java
@UnsupportedAppUsage
void assignParent(ViewParent parent) {
	if (mParent == null) {
		mParent = parent;
	} else if (parent == null) {
		mParent = null;
	} else {
			throw new RuntimeException("view " + this + " being added, but"
							   + " it already has a parent");
	}
}
```

## 四、ViewRootImpl的构造方法
ViewRootImpl的构造方法，变量也可以做一下了解，

```java
public ViewRootImpl(Context context, Display display, IWindowSession session,
            boolean useSfChoreographer) {
    ......
    mThread = Thread.currentThread();// 拿到创建它的线程，MainThread --- 默认
    ......
    mDirty = new Rect(); // 脏区域
    ......
    mAttachInfo = new View.AttachInfo(); // 保存当前窗口的一些信息
    ......
}
```

## 五、performTraversals
代码回到performTraversals位置，开始分析这部分遍历绘制的代码，简单来说分为以下五步

```java
private void performTraversals() {
    ......
    windowSizeMayChange |= measureHierarchy(); // 预测量
    ......
    relayoutResult = relayoutWindow(params, viewVisibility, insetsPending); // 布局窗口
    ......
    performMeasure(childWidthMeasureSpec, childHeightMeasureSpec); // 控件树测量
    ......
    performLayout(lp, mWidth, mHeight); // 布局
    ......
    performDraw(); // 绘制
    ......
}
```

### 1、measureHierarchy预测量
子view和父view进行宽高的协商，只有WRAP_CONTENT才会进行协商，其他的不会

三次测量 ---

1. 设置一个值，进行第一次测量，MEASURED_STATE_TOO_SMALL
2. 获取一个状态值
3. 改变大小 baseSize = (baseSize+desiredWindowWidth)/2;
4. 进行第二次测量
5. 如果还不满意，直接给自己的最大值，然后第三次测量 -- 不确定
如果 windowSizeMayChange = true; --》 表示还需要测量

```java
private boolean measureHierarchy(final View host, final WindowManager.LayoutParams lp,
            final Resources res, final int desiredWindowWidth, final int desiredWindowHeight) {
    ......
    //进行测量
    performMeasure(childWidthMeasureSpec, childHeightMeasureSpec);
    ......
}
```

父View使用WRAP_CONTENT包裹子View时，询问子View提供给他的宽高是否够用，三次预测量，第一次默认的一个值，如果不认可再重新赋值重新测量，还是不满意就把最大的值给过去并且不再问是否再次测量了。如果还是不行会设置标志位windowSizeMayChange = true，表示还是需要测量

### 2、performMeasure控件树测量
前两步结束后，performTraversals执行到performMeasure方法

```java
private void performMeasure(int childWidthMeasureSpec, int childHeightMeasureSpec) {
    if (mView == null) {
        return;
    }
    Trace.traceBegin(Trace.TRACE_TAG_VIEW, "measure");
    try {
        mView.measure(childWidthMeasureSpec, childHeightMeasureSpec);
    } finally {
        Trace.traceEnd(Trace.TRACE_TAG_VIEW);
    }
}
```

```java
public final void measure(int widthMeasureSpec, int heightMeasureSpec) {

    ......
    onMeasure(widthMeasureSpec, heightMeasureSpec);
    ......
    // flag not set, setMeasuredDimension() was not invoked, we raise
    // an exception to warn the developer
    if ((mPrivateFlags & PFLAG_MEASURED_DIMENSION_SET) != PFLAG_MEASURED_DIMENSION_SET) {
        throw new IllegalStateException("View with id " + getId() + ": "
                                        + getClass().getName() + "#onMeasure() did not set the"
                                        + " measured dimension by calling"
                                        + " setMeasuredDimension()");
    }
        ......
}
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    setMeasuredDimension(getDefaultSize(getSuggestedMinimumWidth(), widthMeasureSpec),
                         getDefaultSize(getSuggestedMinimumHeight(), heightMeasureSpec));
}
```

重写onMeasure时一定要调用setMeasuredDimension，因为onMeasure后有对这个的判断，不调用该方法会抛出错误。

例如我们看RelativeLayout.java中重写的onMeasure方法

```java
@Override
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
	......
	for (int i = 0; i < count; i++) {
		View child = views[i];
		if (child.getVisibility() != GONE) {
			LayoutParams params = (LayoutParams) child.getLayoutParams();
			int[] rules = params.getRules(layoutDirection);

			applyHorizontalSizeRules(params, myWidth, rules);
			measureChildHorizontal(child, params, myWidth, myHeight);

			if (positionChildHorizontal(child, params, myWidth, isWrapContentWidth)) {
				offsetHorizontalAxis = true;
			}
		}
	}
	......


	setMeasuredDimension(width, height);
}
```

此处还有一个知识点，在之前学习layoutInflate.inflate时，我们说设置root == null时，无论第三个参数为true还是false，xml布局都是无效的，该知识点与此处相结合会给出答案，如下代码，在inflate时，当root不为null时，会设置temp.setLayoutParams(params);而当root为null时不会调用该接口设置params，所以如上代码`LayoutParams params = (LayoutParams) child.getLayoutParams();`会根据inflate设置的root是否为null拿到具体值或者null，当为null拿不到值时就导致该布局无效了。

```java
public View inflate(XmlPullParser parser, @Nullable ViewGroup root, boolean attachToRoot) {
	......
	// Temp is the root view that was found in the xml
	final View temp = createViewFromTag(root, name, inflaterContext, attrs);

	ViewGroup.LayoutParams params = null;

	if (root != null) {
		if (DEBUG) {
			System.out.println("Creating params from root: " +
							   root);
		}
		// Create layout params that match root, if supplied
		params = root.generateLayoutParams(attrs);
		if (!attachToRoot) {
			// Set the layout params for temp if we are not
			// attaching. (If we are, we use addView, below)
			temp.setLayoutParams(params);
		}
	}
		......
}
```

```java
public void setLayoutParams(ViewGroup.LayoutParams params) {
	if (params == null) {
		throw new NullPointerException("Layout parameters cannot be null");
	}
	mLayoutParams = params;
	resolveLayoutParams();
	if (mParent instanceof ViewGroup) {
		((ViewGroup) mParent).onSetLayoutParams(this, params);
	}
	requestLayout();
}
```

上一下段扯了下其他话题，现在再次回到绘制的代码流程，

```java
private void measureChildHorizontal(
	View child, LayoutParams params, int myWidth, int myHeight) {
	final int childWidthMeasureSpec = getChildMeasureSpec(params.mLeft, params.mRight,
														  params.width, params.leftMargin, params.rightMargin, mPaddingLeft, mPaddingRight,
														  myWidth);

	final int childHeightMeasureSpec;
	if (myHeight < 0 && !mAllowBrokenMeasureSpecs) {
		if (params.height >= 0) {
			childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(
				params.height, MeasureSpec.EXACTLY);
		} else {
			// Negative values in a mySize/myWidth/myWidth value in
			// RelativeLayout measurement is code for, "we got an
			// unspecified mode in the RelativeLayout's measure spec."
			// Carry it forward.
			childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
		}
	} else {
		final int maxHeight;
		if (mMeasureVerticalWithPaddingMargin) {
			maxHeight = Math.max(0, myHeight - mPaddingTop - mPaddingBottom
								 - params.topMargin - params.bottomMargin);
		} else {
			maxHeight = Math.max(0, myHeight);
		}

		final int heightMode;
		if (params.height == LayoutParams.MATCH_PARENT) {
			heightMode = MeasureSpec.EXACTLY;
		} else {
			heightMode = MeasureSpec.AT_MOST;
		}
		childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(maxHeight, heightMode);
	}

	child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
}
```

MeasureSpec ---> 32位 int

00  00  00  00  00  00  00  00  00 00  00  00 00  00  00  00

低30位 --> 值

高2位 --> 模式

```plain
childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(
        params.height, MeasureSpec.EXACTLY);
```

将params.height组成一个MeasureSpec


### 3、performLayout 布局
根据属性进行布局

```java
private void performLayout(WindowManager.LayoutParams lp, int desiredWindowWidth,
            int desiredWindowHeight) {
	......
	host.layout(0, 0, host.getMeasuredWidth(), host.getMeasuredHeight());
	......
}
```

设置左上右下大小

```java
public void layout(int l, int t, int r, int b) {
	......
	//左上右下赋值
	int oldL = mLeft;
        int oldT = mTop;
        int oldB = mBottom;
        int oldR = mRight;
	boolean changed = isLayoutModeOptical(mParent) ?
                setOpticalFrame(l, t, r, b) : setFrame(l, t, r, b);
	......
	onLayout(changed, l, t, r, b);
	......
}
```

具体view或者容器管理自己的子view的布局

```java
@Override
protected void onLayout(boolean changed, int l, int t, int r, int b) {
	//  The layout has actually already been performed and the positions
	//  cached.  Apply the cached values to the children.
	final int count = getChildCount();

	for (int i = 0; i < count; i++) {
		View child = getChildAt(i);
		if (child.getVisibility() != GONE) {
			RelativeLayout.LayoutParams st =
			(RelativeLayout.LayoutParams) child.getLayoutParams();
			child.layout(st.mLeft, st.mTop, st.mRight, st.mBottom);
		}
	}
}
```

如果是View：加上自己的 Padding再去设置孩子的位置大小

如果是容器: 加上孩子的 Margin再去设置位置大小


### 4、performDraw 绘制
绘制

```java
private void performDraw() {
......
boolean canUseAsync = draw(fullRedrawNeeded);
......
}
-----------------------------------------------------------------------
private boolean draw(boolean fullRedrawNeeded) {
	......
	scrollToRectOrFocus(null, false);//输入时弹出输入框，会上移，这种在这里处理
	......
	mAttachInfo.mThreadedRenderer.draw(mView, mAttachInfo, this);//硬件加速绘制
	......
	if (!drawSoftware(surface, mAttachInfo, xOffset, yOffset,
					  scalingRequired, dirty, surfaceInsets)) {
		return false;
	}//软件绘制
}
-----------------------------------------------------------------------
private boolean drawSoftware(Surface surface, AttachInfo attachInfo, int xoff, int yoff,
            boolean scalingRequired, Rect dirty, Rect surfaceInsets) {
	......
	mView.draw(canvas);
	......
}

```

脏区域：更新某些地方时使用，是一种优化的操作，后面再了解下

```java
public void draw(Canvas canvas) {
    /*
    * Draw traversal performs several drawing steps which must be executed
    * in the appropriate order:
    *
    *      1. Draw the background
    *      2. If necessary, save the canvas' layers to prepare for fading
    *      3. Draw view's content
    *      4. Draw children
    *      5. If necessary, draw the fading edges and restore layers
    *      6. Draw decorations (scrollbars for instance)
    *      7. If necessary, draw the default focus highlight
    */
    ......
    drawBackground(canvas);
    ......
    //
    if (!verticalEdges && !horizontalEdges) {
        // Step 3, draw the content
        onDraw(canvas);

        // Step 4, draw the children
        dispatchDraw(canvas);

        drawAutofilledHighlight(canvas);

        // Overlay is part of the content and draws beneath Foreground
        if (mOverlay != null && !mOverlay.isEmpty()) {
            mOverlay.getOverlayView().dispatchDraw(canvas);
        }

        // Step 6, draw decorations (foreground, scrollbars)
        onDrawForeground(canvas);

        // Step 7, draw the default focus highlight
        drawDefaultFocusHighlight(canvas);

        if (isShowingLayoutBounds()) {
            debugDrawFocus(canvas);
        }

        // we're done...
        return;
    }
    ......
    // Step 3, draw the content
    onDraw(canvas);

    // Step 4, draw the children
    dispatchDraw(canvas);
    ......
}

```

此处onDraw和dispatchDraw都被调用了，但是dispatchDraw执行，onDraw不一定执行。

之前有限制`if (!dirtyOpaque) onDraw(canvas);`

使用setWillNotDraw(false)或者setBackground()会执行onDraw()

当前的源码没有这个判断限制，ViewGroup为什么不会执行 onDraw ？

View.draw(canvas) (DecorView)
--> onDraw(canvas);
下面的流程是一个递归动作，会一层层将view和子view绘制出来
--> dispatchDraw(canvas); (ViewGroup.dispatchDraw)
 --> drawChild
 --> View.draw(Canvas canvas, ViewGroup parent, long drawingTime)
     --> renderNode = updateDisplayListIfDirty();
         --> dispatchDraw(canvas);

以上就是绘制代码的流程。

### 5、UI 刷新只能在主线程进行吗？
不是。

原因：当requestLayout时

```java
@Override
public void requestLayout() {
    if (!mHandlingLayoutInLayoutRequest) {
        checkThread();
        mLayoutRequested = true;
        scheduleTraversals();
    }
}

void checkThread() {
    if (mThread != Thread.currentThread()) {
        throw new CalledFromWrongThreadException(
            "Only the original thread that created a view hierarchy can touch its views.");
    }
}
```

所以在哪个线程创建的就要在哪个线程更新，否则抛出问题

另一个地方

```java
public void invalidate(boolean invalidateCache) {
    invalidateInternal(0, 0, mRight - mLeft, mBottom - mTop, invalidateCache, true);
}

void invalidateInternal(int l, int t, int r, int b, boolean invalidateCache,
                        boolean fullInvalidate) {
    ......
    final ViewParent p = mParent;
    if (p != null && ai != null && l < r && t < b) {
        final Rect damage = ai.mTmpInvalRect;
        damage.set(l, t, r, b);
        p.invalidateChild(this, damage);
    }
    ......
}

```

```java
public final void invalidateChild(View child, final Rect dirty) {
    ......
    parent = parent.invalidateChildInParent(location, dirty);
    ......
}
```

中间调用省略，最终会追寻到ViewRootImpl，也会执行checkThread();

```java
public ViewParent invalidateChildInParent(int[] location, Rect dirty) {
    checkThread();
    if (DEBUG_DRAW) Log.v(mTag, "Invalidate child: " + dirty);

    if (dirty == null) {
        invalidate();
        return null;
    } else if (dirty.isEmpty() && !mIsAnimating) {
        return null;
    }

    if (mCurScrollY != 0 || mTranslator != null) {
        mTempRect.set(dirty);
        dirty = mTempRect;
        if (mCurScrollY != 0) {
            dirty.offset(0, -mCurScrollY);
        }
        if (mTranslator != null) {
            mTranslator.translateRectInAppWindowToScreen(dirty);
        }
        if (mAttachInfo.mScalingRequired) {
            dirty.inset(-1, -1);
        }
    }

    invalidateRectOnScreen(dirty);

    return null;
}
```

### 6、如何实现在子线程刷新Ui？
1. 在ViewRootImpl 创建之前调用
2. 在需要刷新Ui的子线程 创建ViewRootImpl

