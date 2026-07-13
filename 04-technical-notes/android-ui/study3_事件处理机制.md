## 一、基础
### 1、事件分发的对象是谁？
答：事件

+ 当用户触摸屏幕时（View或ViewGroup派生的控件），将产生点击事件（Touch事件）。

Touch事件相关细节（发生触摸的位置、时间、历史记录、手势动作等）被封装成MotionEvent对象

+ 主要发生的Touch事件有如下四种：
    - MotionEvent.ACTION_DOWN：按下View（所有事件的开始）
    - MotionEvent.ACTION_MOVE：滑动View
    - MotionEvent.ACTION_CANCEL：非人为原因结束本次事件
    - MotionEvent.ACTION_UP：抬起View（与DOWN对应）
+ 事件列：从手指接触屏幕至手指离开屏幕，这个过程产生的一系列事件 任何事件列都是以DOWN事件开始，UP事件结束，中间有无数的MOVE事件，如下图：
+
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725335765739-71ff46b2-d6e9-4e38-8efb-9f01c7ade4c2.png)

事件列即当一个MotionEvent 产生后，系统需要把这个事件传递给一个具体的 View 去处理

### 2、事件分发的本质
答：将点击事件（MotionEvent）向某个View进行传递并最终得到处理

即当一个点击事件发生后，系统需要将这个事件传递给一个具体的View去处理。这个事件传递的过程就是分发过程。

### 3、事件在哪些对象之间进行传递？
答：Activity、ViewGroup、View

一个点击事件产生后，传递顺序是：Activity（Window） -> ViewGroup -> View

### 4、事件分发过程由哪些方法协作完成？
答：dispatchTouchEvent() 、onInterceptTouchEvent()和onTouchEvent()


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725335838473-e8760706-d206-4f61-a8ec-5eb7a656e81e.png)

### 5、总结
Android事件分发机制的本质是要解决：点击事件由哪个对象发出，经过哪些对象，最终达到哪个对象并最终得到处理。

这里的对象是指Activity、ViewGroup、View

Android中事件分发顺序：Activity（Window） -> ViewGroup -> View

事件分发过程由dispatchTouchEvent() 、onInterceptTouchEvent()和onTouchEvent()三个方法协助完成

## 二、事件分发机制方法&流程介绍
+ 事件分发过程由dispatchTouchEvent() 、onInterceptTouchEvent()和onTouchEvent()三个方法协助完成，如下图：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725335949642-65cad008-2553-4ed7-89e5-afe176eacb53.png)

方法详细介绍

Android事件分发流程如下：（必须熟记）

即当事件发生时，驱动会先处理触摸事件，当UI主线程收到底层上报的input事件后，调用到activity的流程如下


![](https://raw.githubusercontent.com/qihuan92/figurebed/master/input_event_dispatcher.jpeg)

当分发到activity(Window)后，分发顺序为Activity（Window） -> ViewGroup -> View


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725335978799-b5e93b1c-58a3-4f31-b1ea-bf03cdc6b2a9.png)

注意：触摸事件会按照从上到下的顺序传递给各个视图（View）。每个视图都有机会处理这个事件，从上到下的顺序指的是从最外层的视图（View）开始，也就是最顶层的视图，通常是根布局。

事件分发机制详细流程

其中：

+ super：调用父类方法
+ true：消费事件，即事件不继续往下传递
+ false：不消费事件，事件也不继续往下传递 / 交由给父控件onTouchEvent（）处理

### 1、dispatchTouchEvent()
| 属性 | 介绍 |
| :--- | :--- |
| 使用对象 | Activity、ViewGroup、View |
| 作用 | 分发点击事件 |
| 调用时刻 | 当点击事件能够传递给当前View时，该方法就会被调用 |
| 返回结果 | 是否消费当前事件，详细情况如下： |


#### (1) 默认情况：根据当前对象的不同而返回方法不同
| 对象 | 返回方法 | 备注 |
| :--- | :--- | :--- |
| Activity | super.dispatchTouchEvent() | 即调用父类ViewGroup的dispatchTouchEvent() |
| ViewGroup | onIntercepTouchEvent() | 即调用自身的onIntercepTouchEvent() |
| View | onTouchEvent（） | 即调用自身的onTouchEvent（） |


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336037261-c2df9dea-50a4-4168-90be-652ddb5e0d88.png)

#### (2) 返回true
+ 消费事件
+ 事件不会往下传递
+ 后续事件（Move、Up）会继续分发到该View
+ 流程图如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336069290-4dcbed4e-e900-463a-b1d6-da95d0044ed8.png)

#### (3) 返回false
+ 不消费事件
+ 事件不会往下传递
+ 将事件回传给父控件的onTouchEvent()处理

Activity例外：返回false=消费事件

+ 后续事件（Move、Up）会继续分发到该View(与onTouchEvent()区别）
+ 流程图如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336088331-52ab4770-61ed-4505-8e99-d0eb6e64d213.png)

### 2、onTouchEvent()
| 属性 | 介绍 |
| :--- | :--- |
| 使用对象 | Activity、ViewGroup、View |
| 作用 | 处理点击事件 |
| 调用时刻 | 在dispatchTouchEvent()内部调用 |
| 返回结果 | 是否消费（处理）当前事件，详细情况如下： |


与dispatchTouchEvent()类似

#### (1) 返回true
+ 自己处理（消费）该事情
+ 事件停止传递
+ 该事件序列的后续事件（Move、Up）让其处理；
+ 流程图如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336139504-0421ed06-d9c7-4f60-a305-a6315e0f6136.png)

#### (2) 返回false（同默认实现：调用父类onTouchEvent()）
+ 不处理（消费）该事件
+ 事件往上传递给父控件的onTouchEvent()处理
+ 当前View不再接受此事件列的其他事件（Move、Up）；
+ 流程图如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336157320-127d5c6e-a13f-4b7a-88bd-97ee78a3b36f.png)

### 3、onInterceptTouchEvent()
| 属性 | 介绍 |
| :--- | :--- |
| 使用对象 | ViewGroup（注：Activity、View都没该方法） |
| 作用 | 拦截事件，即自己处理该事件 |
| 调用时刻 | 在ViewGroup的dispatchTouchEvent()内部调用 |
| 返回结果 | 是否拦截当前事件，详细情况如下： |


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336178758-291a2635-119a-44f4-a681-8b77159c4241.png)

返回结果

+ 流程图如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336192183-487ffe2c-08d7-4efc-bdc0-5722ac48e0e7.png)

#### (1) 三者关系
下面将用一段伪代码来阐述上述三个方法的关系和点击事件传递规则

```java
// 点击事件产生后，会直接调用dispatchTouchEvent（）方法
public boolean dispatchTouchEvent(MotionEvent ev) {
	//代表是否消耗事件
	boolean consume = false;
	if (onInterceptTouchEvent(ev)) {
		//如果onInterceptTouchEvent()返回true则代表当前View拦截了点击事件
		//则该点击事件则会交给当前View进行处理
		//即调用onTouchEvent (）方法去处理点击事件
		consume = onTouchEvent (ev) ;
	} else {
		//如果onInterceptTouchEvent()返回false则代表当前View不拦截点击事件
		//则该点击事件则会继续传递给它的子元素
		//子元素的dispatchTouchEvent（）就会被调用，重复上述过程
		//直到点击事件被最终处理为止
		consume = child.dispatchTouchEvent (ev) ;
	}
	return consume;
}
```

## 三、事件分发场景介绍
举例说明常见的点击事件传递情况

### 1、背景描述
我们将要讨论的布局层次如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336319846-bcb2ea12-6c76-4c38-8f0d-0348542ffd05.png)

布局层次

+ 最外层：Activiy A，包含两个子View：ViewGroup B、View C
+ 中间层：ViewGroup B，包含一个子View：View C
+ 最内层：View C

假设用户首先触摸到屏幕上View C上的某个点（如图中黄色区域），那么Action_DOWN事件就在该点产生，然后用户移动手指并最后离开屏幕。

### 2、一般的事件传递情况
一般的事件传递场景有：

+ 默认情况
+ 处理事件
+ 拦截DOWN事件
+ 拦截后续事件（MOVE、UP）

#### (1) 默认情况
+ 即不对控件里的方法(dispatchTouchEvent()、onTouchEvent()、onInterceptTouchEvent())进行重写或更改返回值
+ 那么调用的是这3个方法的默认实现：调用父类的方法
+ 事件传递情况：（如图下所示）
    - 从Activity A---->ViewGroup B--->View C，从上往下调用dispatchTouchEvent()
    - 再由View C--->ViewGroup B --->Activity A，从下往上调用onTouchEvent()


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336417505-b7aeacb7-e5c6-40ba-bb23-c77b43265325.png)

注：虽然ViewGroup B的onInterceptTouchEvent方法对DOWN事件返回了false，后续的事件（MOVE、UP）依然会传递给它的onInterceptTouchEvent()，这一点与onTouchEvent的行为是不一样的。

#### (2) 处理事件
假设View C希望处理这个点击事件，即C被设置成可点击的（Clickable）或者覆写了C的onTouchEvent方法返回true。

最常见的：设置Button按钮来响应点击事件

事件传递情况：（如下图）

+ DOWN事件被传递给C的onTouchEvent方法，该方法返回true，表示处理这个事件
+ 因为C正在处理这个事件，那么DOWN事件将不再往上传递给B和A的onTouchEvent()；
+ 该事件列的其他事件（Move、Up）也将传递给C的onTouchEvent()


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336466952-8234b0cf-039a-4f36-a2c7-c6ab6f5ae520.png)

#### (3) 拦截DOWN事件
假设ViewGroup B希望处理这个点击事件，即B覆写了onInterceptTouchEvent()返回true、onTouchEvent()返回true。
事件传递情况：（如下图）

+ DOWN事件被传递给B的onInterceptTouchEvent()方法，该方法返回true，表示拦截这个事件，即自己处理这个事件（不再往下传递）
+ 调用onTouchEvent()处理事件（DOWN事件将不再往上传递给A的onTouchEvent()）
+ 该事件列的其他事件（Move、Up）将直接传递给B的onTouchEvent()

该事件列的其他事件（Move、Up）将不会再传递给B的onInterceptTouchEvent方法，该方法一旦返回一次true，就再也不会被调用了。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336485361-5a231ac1-63db-4467-a24e-407185128108.png)

#### (4) 拦截DOWN的后续事件
假设ViewGroup B没有拦截DOWN事件（还是View C来处理DOWN事件），但它拦截了接下来的MOVE事件。

+ DOWN事件传递到C的onTouchEvent方法，返回了true。
+ 在后续到来的MOVE事件，B的onInterceptTouchEvent方法返回true拦截该MOVE事件，但该事件并没有传递给B；这个MOVE事件将会被系统变成一个CANCEL事件传递给C的onTouchEvent方法
+ 后续又来了一个MOVE事件，该MOVE事件才会直接传递给B的onTouchEvent()
    1. 后续事件将直接传递给B的onTouchEvent()处理
    2. 后续事件将不会再传递给B的onInterceptTouchEvent方法，该方法一旦返回一次true，就再也不会被调用了。
+ C再也不会收到该事件列产生的后续事件。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725336504398-8d1196e8-3e4b-4e6a-8334-a4297cae900f.png)

特别注意：

+ 如果ViewGroup A 拦截了一个半路的事件（如MOVE），这个事件将会被系统变成一个CANCEL事件并传递给之前处理该事件的子View；
+ 该事件不会再传递给ViewGroup A的onTouchEvent()
+ 只有再到来的事件才会传递到ViewGroup A的onTouchEvent()

## 四、Android事件分发机制源码分析
首先区分View和ViewGroup，View只处理事件，ViewGroup只分发事件


### 1、ViewRootImpl和事件处理的关系
在将view添加到window的时候，setView中有如下代码

```java
public void setView(View view, WindowManager.LayoutParams attrs, View panelParentView,
					int userId) {
	//......
	//WindowInputEventReceiver接收事件
	if (inputChannel != null) {
		if (mInputQueueCallback != null) {
			mInputQueue = new InputQueue();
			mInputQueueCallback.onInputQueueCreated(mInputQueue);
		}
		mInputEventReceiver = new WindowInputEventReceiver(inputChannel,
														   Looper.myLooper());
	}
	//......
	// Set up the input pipeline.
	CharSequence counterSuffix = attrs.getTitle();
	mSyntheticInputStage = new SyntheticInputStage();
	InputStage viewPostImeStage = new ViewPostImeInputStage(mSyntheticInputStage);
	InputStage nativePostImeStage = new NativePostImeInputStage(viewPostImeStage,
																"aq:native-post-ime:" + counterSuffix);
	InputStage earlyPostImeStage = new EarlyPostImeInputStage(nativePostImeStage);
	InputStage imeStage = new ImeInputStage(earlyPostImeStage,
											"aq:ime:" + counterSuffix);
	InputStage viewPreImeStage = new ViewPreImeInputStage(imeStage);
	InputStage nativePreImeStage = new NativePreImeInputStage(viewPreImeStage,
															  "aq:native-pre-ime:" + counterSuffix);

	mFirstInputStage = nativePreImeStage;
	mFirstPostImeInputStage = earlyPostImeStage;
	//......
}
```

当收到事件后会执行WindowInputEventReceiver的onInputEvent

```java
final class WindowInputEventReceiver extends InputEventReceiver {
	public WindowInputEventReceiver(InputChannel inputChannel, Looper looper) {
		super(inputChannel, looper);
	}

	@Override
	public void onInputEvent(InputEvent event) {
		Trace.traceBegin(Trace.TRACE_TAG_VIEW, "processInputEventForCompatibility");
		List<InputEvent> processedEvents;
		try {
			processedEvents =
			mInputCompatProcessor.processInputEventForCompatibility(event);
		} finally {
			Trace.traceEnd(Trace.TRACE_TAG_VIEW);
		}
		if (processedEvents != null) {
			if (processedEvents.isEmpty()) {
				// InputEvent consumed by mInputCompatProcessor
				finishInputEvent(event, true);
			} else {
				for (int i = 0; i < processedEvents.size(); i++) {
					enqueueInputEvent(
						processedEvents.get(i), this,
						QueuedInputEvent.FLAG_MODIFIED_FOR_COMPATIBILITY, true);
				}
			}
		} else {
			enqueueInputEvent(event, this, 0, true);
		}
	}
}
```

```java
void enqueueInputEvent(InputEvent event,
					   InputEventReceiver receiver, int flags, boolean processImmediately) {
	if (processImmediately) {
		doProcessInputEvents();
	} else {
		scheduleProcessInputEvents();
	}
}
```

```java
void doProcessInputEvents() {
	deliverInputEvent(q);
}
```

```java
private void deliverInputEvent(QueuedInputEvent q) {
    //......
    InputStage stage;
    if (q.shouldSendToSynthesizer()) {
        stage = mSyntheticInputStage;
    } else {
        stage = q.shouldSkipIme() ? mFirstPostImeInputStage : mFirstInputStage;
    }

    if (q.mEvent instanceof KeyEvent) {
        Trace.traceBegin(Trace.TRACE_TAG_VIEW, "preDispatchToUnhandledKeyManager");
        try {
            mUnhandledKeyManager.preDispatch((KeyEvent) q.mEvent);
        } finally {
            Trace.traceEnd(Trace.TRACE_TAG_VIEW);
        }
    }

    if (stage != null) {
        handleWindowFocusChanged();
        stage.deliver(q);
    } else {
        finishInputEvent(q);
    }
    //......
}
```

```java
abstract class InputStage {
        private final InputStage mNext;

        protected static final int FORWARD = 0;
        protected static final int FINISH_HANDLED = 1;
        protected static final int FINISH_NOT_HANDLED = 2;

        private String mTracePrefix;

        /
         * Creates an input stage.
         * @param next The next stage to which events should be forwarded.
         */
        public InputStage(InputStage next) {
            mNext = next;
        }

        /
         * Delivers an event to be processed.
         */
        public final void deliver(QueuedInputEvent q) {
            if ((q.mFlags & QueuedInputEvent.FLAG_FINISHED) != 0) {
                forward(q);
            } else if (shouldDropInputEvent(q)) {
                finish(q, false);
            } else {
                traceEvent(q, Trace.TRACE_TAG_VIEW);
                final int result;
                try {
                    result = onProcess(q);
                } finally {
                    Trace.traceEnd(Trace.TRACE_TAG_VIEW);
                }
                apply(q, result);
            }
        }

	//......
}
```

当我们执行道stage.deliver的时候，通过ViewRootImpl的setView中的代码，可以知道，可以调用到ViewPostImeInputStage的deliver，这是一个专门处理按键等事件的InputStage，其他的InputStage各有各的用处，


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732871771226-d029cc52-54d0-4f53-a6a1-72edd4ce31d8.png)

```java
final class ViewPostImeInputStage extends InputStage {
	public ViewPostImeInputStage(InputStage next) {
		super(next);
	}

	@Override
	protected int onProcess(QueuedInputEvent q) {
		if (q.mEvent instanceof KeyEvent) {
			return processKeyEvent(q);
		} else {
			final int source = q.mEvent.getSource();
			if ((source & InputDevice.SOURCE_CLASS_POINTER) != 0) {
				return processPointerEvent(q);
			} else if ((source & InputDevice.SOURCE_CLASS_TRACKBALL) != 0) {
				return processTrackballEvent(q);
			} else {
				return processGenericMotionEvent(q);
			}
		}
	}
	private int processPointerEvent(QueuedInputEvent q) {
		final MotionEvent event = (MotionEvent)q.mEvent;
		//先分发给手写模式处理，判断是否是手写区域的事件
		mHandwritingInitiator.onTouchEvent(event);

		mAttachInfo.mUnbufferedDispatchRequested = false;
		mAttachInfo.mHandlingPointerEvent = true;
		//如果手写模式处理器没有消费该事件
		//mView是我们的DecorView，所以代码从这里就马上执行到了activity
		boolean handled = mView.dispatchPointerEvent(event);
		maybeUpdatePointerIcon(event);
		maybeUpdateTooltip(event);
		mAttachInfo.mHandlingPointerEvent = false;
		if (mAttachInfo.mUnbufferedDispatchRequested && !mUnbufferedInputDispatch) {
			mUnbufferedInputDispatch = true;
			if (mConsumeBatchedInputScheduled) {
				scheduleConsumeBatchedInputImmediately();
			}
		}
		//如果View选择消费，则事件分发到此为止，否则继续向下个环节分发
		return handled ? FINISH_HANDLED : FORWARD;
	}

}
```

但是我们的decorView里并没有该方法，所以往devordView的父类寻找，该方法在View中，该方法再调用dispatchTouchEvent执行到DecorView中，由callback执行到activity，所以事件由View传递到了Activity中。

```java
@UnsupportedAppUsage
public final boolean dispatchPointerEvent(MotionEvent event) {
	if (event.isTouchEvent()) {
		return dispatchTouchEvent(event);
	} else {
		return dispatchGenericMotionEvent(event);
	}
}
```

```java
    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        final Window.Callback cb = mWindow.getCallback();
        return cb != null && !mWindow.isDestroyed() && mFeatureId < 0
                ? cb.dispatchTouchEvent(ev) : super.dispatchTouchEvent(ev);
    }
```

```java
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev.getAction() == MotionEvent.ACTION_DOWN) {
            onUserInteraction();
        }
        if (getWindow().superDispatchTouchEvent(ev)) {
            return true;
        }
        return onTouchEvent(ev);
    }
```

一般按下第一个都是down，所以onUserInteraction都会执行

而
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725354536907-d2262329-541b-46d7-a361-49c645ab8499.png)是个空方法，

从注释得知：当此activity在栈顶时，触屏点击按home，back，menu键等都会触发此方法，所以onUserInteraction()主要用于屏保

继续看代码，根据前面的学习，我们知道Window类是抽象类，且PhoneWindow是Window类的唯一实现类，getWindow就是PhoneWindow,所以继续跟踪代码

```java
    @Override
    public boolean superDispatchTouchEvent(MotionEvent event) {
        return mDecor.superDispatchTouchEvent(event);
    }
```

```java
    public boolean superDispatchTouchEvent(MotionEvent event) {
        return super.dispatchTouchEvent(event);
    }
```

super.dispatchTouchEvent会执行framelayout的dispatchTouchEvent，但是framelayout没有dispatchTouchEvent，所以最终执行的是 ViewGroup的dispatchTouchEvent，这样事件就从Activity传递到了ViewGroup。

### 2、ViewGroup事件的分发机制
首先看个demo，

#### (1) demo讲解
写一个layout继承FrameLayout重写dispatchTouchEvent，onTouchEvent，onInterceptTouchEvent打印log

写一个自定义button继承Button重写dispatchTouchEvent，onTouchEvent方法打印log,

```java
protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        btn_click = findViewById(R.id.btn_click);

        btn_click.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.e(TAG, "onClick");
            }
        });

        btn_click.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                Log.e(TAG, "onTouch: " + event.getAction());

                return true;
            }
        });
    }
```

```java
	@Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        Log.e(TAG, "dispatchTouchEvent: 子View");
        return super.dispatchTouchEvent(event);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                Log.e(TAG, "onTouchEvent: MotionEvent.ACTION_DOWN = " + MotionEvent.ACTION_DOWN);
                break;
            case MotionEvent.ACTION_MOVE:
                Log.e(TAG, "onTouchEvent: MotionEvent.ACTION_MOVE = " + MotionEvent.ACTION_MOVE);
                break;
            case MotionEvent.ACTION_UP:
                Log.e(TAG, "onTouchEvent: MotionEvent.ACTION_UP = " + MotionEvent.ACTION_UP);
                break;
            case MotionEvent.ACTION_CANCEL:
                Log.e(TAG, "onTouchEvent: MotionEvent.ACTION_CANCEL = " + MotionEvent.ACTION_CANCEL);
                break;
        }
        return super.onTouchEvent(event);
    }
```

```java
    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        Log.e(TAG, "dispatchTouchEvent: 父容器");
        return super.dispatchTouchEvent(ev);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        Log.e(TAG, "onTouchEvent: 父容器");
        return super.onTouchEvent(event);
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        Log.e(TAG, "onInterceptTouchEvent: 父容器");
        return super.onInterceptTouchEvent(ev);
    }
```

效果如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725355425001-7e7aa773-58ce-4ea8-9ce6-471c9482eeea.png)

只点击button:DOWN和UP都会发送事件


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725355538189-afcfbc77-a8d6-475d-add9-d1714c2a6e73.png)

点击空白处：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725355682069-c3a89d77-3bb1-427a-b39f-e13865cbc93b.png)

可以看到每个事件都要经过父容器，执行子view的点击时也是从父容器执行到子view。

但是为什么点击button有两次打印，点击空白处只有一次打印，并且点击button有onTouch的打印呢？另外上述打印的执行顺序是怎么按照这个顺去去执行的呢？下面我们就根据源码去分析这个过程。

首先就是重写父容器的dispatchTouchEvent方法的打印dispatchTouchEvent：父容器，而父容器会调用ViewGroup的dispatchTouchEvent，下面先分析ViewGroup的dispatchTouchEvent。

#### (2) ViewGroup的dispatchTouchEvent()
ViewGroup的dispatchTouchEvent方法主要是处理触摸事件的分发，包括拦截、分发和重置触摸状态。代码中使用了多个标志和条件来确保事件能够正确地分发给视图树中的适当视图。

```java
public boolean dispatchTouchEvent(MotionEvent ev) {
	//检查是否存在 InputEventConsistencyVerifier 对象，如果存在，
	//则调用它的 onTouchEvent 方法来验证触摸事件的一致性
	if (mInputEventConsistencyVerifier != null) {
		mInputEventConsistencyVerifier.onTouchEvent(ev, 1);
	}

	// If the event targets the accessibility focused view and this is it, start
	// normal event dispatch. Maybe a descendant is what will handle the click.
	//为了处理特定于辅助功能的触摸事件，辅助功能服务可能会将焦点放在某个特定的视图上，
	//以便为视障用户提供更多的上下文信息。当这样的触摸事件发生时，系统会首先检查视图
	//是否是辅助焦点的拥有者。如果是，那么系统会清除辅助焦点标志，然后继续正常的触摸
	//事件处理流程，这样视图就可以像处理普通触摸事件一样处理这些事件。
	//这确保了辅助功能服务和普通用户交互之间的兼容性。
	if (ev.isTargetAccessibilityFocus() && isAccessibilityFocusedViewOrHost()) {
		ev.setTargetAccessibilityFocus(false);
	}

	//布尔变量 handled 来记录事件是否被处理
	boolean handled = false;
	//调用 onFilterTouchEventForSecurity 方法来检查事件是否应该被分发。
	//为了防范恶意软件误导用户。如果这个检查没通过的话，该控件会丢弃该事件
	//主要过滤的是当前Window被遮挡的情况下的触摸事件
	//如果返回 true，则继续处理事件。
	if (onFilterTouchEventForSecurity(ev)) {
		//获取触摸事件的动作，并将其与 MotionEvent.ACTION_MASK
		//进行按位与操作，以获取实际的动作类型
		final int action = ev.getAction();
		final int actionMasked = action & MotionEvent.ACTION_MASK;

		// Handle an initial down.
		//如果动作是 ACTION_DOWN（表示触摸开始），
		//则取消所有之前的触摸目标，并重置触摸状态，
		//无论时多指还是单指都只会执行一次
		//多指按下后，第2跟手指到第N根按下响应的是ACTION_POINTER_DOWN
		//中间的移动执行的就是ACTION_MOVE
		//抬起时倒数第N到倒数第2根手指都是ACTION_POINTER_UP
		//最后一根手指的抬起是ACTION_UP
		if (actionMasked == MotionEvent.ACTION_DOWN) {
			// Throw away all previous state when starting a new touch gesture.
			// The framework may have dropped the up or cancel event for the previous gesture
			// due to an app switch, ANR, or some other state change.
			//详细代码和解释看后面代码详解
			cancelAndClearTouchTargets(ev);
			resetTouchState();
		}

		// Check for interception.
		//此处开始获取拦截状态，父容器的权利

		//根据是否是 ACTION_DOWN 或者已经有触摸目标，决定是否拦截事件，
		//onInterceptTouchEvent只在ViewGroup类型的控件中存在
		final boolean intercepted;
		if (actionMasked == MotionEvent.ACTION_DOWN
				|| mFirstTouchTarget != null) {
			//disallowIntercept是否禁用事件拦截的功能(默认是false)
			//可以通过调用requestDisallowInterceptTouchEvent方法对这个值进行修改
			final boolean disallowIntercept = (mGroupFlags & FLAG_DISALLOW_INTERCEPT) != 0;
			if (!disallowIntercept) {
				intercepted = onInterceptTouchEvent(ev);
				ev.setAction(action); // restore action in case it was changed
			} else {
				intercepted = false;
			}
		} else {
			// There are no touch targets and this action is not an initial down
			// so this view group continues to intercept touches.
			intercepted = true;
		}

		// If intercepted, start normal event dispatch. Also if there is already
		// a view that is handling the gesture, do normal event dispatch.
		//如果事件被拦截或者已经有触摸目标，那么清除辅助焦点标志。
		if (intercepted || mFirstTouchTarget != null) {
			ev.setTargetAccessibilityFocus(false);
		}

		// Check for cancelation.
		//检查事件是否被取消。
		final boolean canceled = resetCancelNextUpFlag(this)
				|| actionMasked == MotionEvent.ACTION_CANCEL;

		// Update list of touch targets for pointer down, if needed.
		//检查事件是否来自鼠标，以及是否应该分解事件
		//事件分解是用来处理多点触控的
		final boolean isMouseEvent = ev.getSource() == InputDevice.SOURCE_MOUSE;
		final boolean split = (mGroupFlags & FLAG_SPLIT_MOTION_EVENTS) != 0
				&& !isMouseEvent;

		//此处开始寻找触摸事件派发对象

		//初始化新的触摸目标和标志
		TouchTarget newTouchTarget = null;
		//当前的事件是否已经分发给了新触摸对象
		boolean alreadyDispatchedToNewTouchTarget = false;
		//如果事件没有被取消并且没有被拦截，那么尝试找到可以接收事件的子视图进行分发事件
		if (!canceled && !intercepted) {
			// If the event is targeting accessibility focus we give it to the
			// view that has accessibility focus and if it does not handle it
			// we clear the flag and dispatch the event to all children as usual.
			// We are looking up the accessibility focused host to avoid keeping
			// state since these events are very rare.
			View childWithAccessibilityFocus = ev.isTargetAccessibilityFocus()
					? findChildWithAccessibilityFocus() : null;

			//如果是 ACTION_DOWN(第一个手指按下)、ACTION_POINTER_DOWN(第二到N个手指按下)
			//或 ACTION_HOVER_MOVE(鼠标)，那么处理新的触摸目标
			if (actionMasked == MotionEvent.ACTION_DOWN
					|| (split && actionMasked == MotionEvent.ACTION_POINTER_DOWN)
					|| actionMasked == MotionEvent.ACTION_HOVER_MOVE) {
				//如果是ACTION_DOWN就是0，如果是第2、3...N个按下就是1，2，3....
				//计数
				final int actionIndex = ev.getActionIndex(); // always 0 for down
				//手指的id 000000000011一位是一个手指，默认下最多能识别32位即32个手指按下
				final int idBitsToAssign = split ? 1 << ev.getPointerId(actionIndex)
						: TouchTarget.ALL_POINTER_IDS;

				// Clean up earlier touch targets for this pointer id in case they
				// have become out of sync.
				//清除掉之前的触摸对象(触摸的手指ID，后面都用触摸对象表示)
				removePointersFromTouchTargets(idBitsToAssign);

				//获取子视图的数量
				final int childrenCount = mChildrenCount;
				//如果没有新的触摸目标并且子视图数量不为零
				if (newTouchTarget == null && childrenCount != 0) {
					//根据事件是否来自鼠标来获取触摸点的 X 和 Y 坐标。
					//如果是鼠标事件，则使用 getXCursorPosition 和 getYCursorPosition 方法；
					//否则，使用 getX 和 getY 方法
					final float x =
							isMouseEvent ? ev.getXCursorPosition() : ev.getX(actionIndex);
					final float y =
							isMouseEvent ? ev.getYCursorPosition() : ev.getY(actionIndex);
					// Find a child that can receive the event.
					// Scan children from front to back.
					//调用 buildTouchDispatchChildList 方法来获取一个包含子视图的列表，
					//这些视图将按照触摸事件分发的顺序排列
					final ArrayList<View> preorderedList = buildTouchDispatchChildList();
					//检查是否启用了自定义的子视图绘制顺序
					final boolean customOrder = preorderedList == null
							&& isChildrenDrawingOrderEnabled();
					//获取子视图数组
					final View[] children = mChildren;
					//倒序遍历，这是因为在 ViewGroup 中，位于前面的子视图
					//会覆盖后面的子视图，所以先检查前面的子视图是否有可能接收事件，
					//而顶层的子视图在xml中是后写入的
					for (int i = childrenCount - 1; i >= 0; i--) {
						//获取并验证子视图的索引和视图对象
						final int childIndex = getAndVerifyPreorderedIndex(
								childrenCount, i, customOrder);
						final View child = getAndVerifyPreorderedView(
								preorderedList, children, childIndex);
						//检查子视图是否可以接收指针事件，以及触摸点是否在子视图的范围内。
						//如果不满足条件，则跳过当前子视图
						if (!child.canReceivePointerEvents()
								|| !isTransformedTouchPointInView(x, y, child, null)) {
							continue;
						}

						//获取当前子视图的触摸目标，单指操作为空，多指才不为空
						newTouchTarget = getTouchTarget(child);
						if (newTouchTarget != null) {
							// Child is already receiving touch within its bounds.
							// Give it the new pointer in addition to the ones it is handling.
							newTouchTarget.pointerIdBits |= idBitsToAssign;
							break;
						}

						//重置子视图的 cancelNextUp 标志，这个标志用于控制是否
						//取消下一次的 ACTION_UP 事件
						resetCancelNextUpFlag(child);
						//调用 dispatchTransformedTouchEvent 方法将事件分发给子视图。
						//如果子视图想要接收事件，则处理逻辑，如果没有则返回false
						//dispatchTransformedTouchEvent是个递归。
						if (dispatchTransformedTouchEvent(ev, false, child, idBitsToAssign)) {
							// Child wants to receive touch within its bounds.
							//记录最后一次触摸按下的时间
							mLastTouchDownTime = ev.getDownTime();
							//如果使用了预排序的子视图列表，则找到子视图在原始数组中的索引。
							//否则，直接使用当前索引。
							if (preorderedList != null) {
								// childIndex points into presorted list, find original index
								for (int j = 0; j < childrenCount; j++) {
									if (children[childIndex] == mChildren[j]) {
										mLastTouchDownIndex = j;
										break;
									}
								}
							} else {
								mLastTouchDownIndex = childIndex;
							}
							//记录最后一次触摸按下的 X 和 Y 坐标
							mLastTouchDownX = ev.getX();
							mLastTouchDownY = ev.getY();
							//为子视图添加触摸目标。
							newTouchTarget = addTouchTarget(child, idBitsToAssign);
							//标记已经将事件分发给新的触摸目标
							alreadyDispatchedToNewTouchTarget = true;

							//已经给了一个child处理事件了，退出循环
							break;
						}

						// The accessibility focus didn't handle the event, so clear
						// the flag and do a normal dispatch to all children.
						//如果辅助焦点没有处理事件，则清除辅助焦点标志，
						//并继续正常分发事件给所有子视图
						ev.setTargetAccessibilityFocus(false);
					}
					//如果使用了预排序的子视图列表，则在遍历完成后清空列表
					if (preorderedList != null) preorderedList.clear();
				}

				//如果没有找到新的触摸目标，但是已经有触摸目标，
				//那么将事件分配给最后一个添加的触摸目标。
				//种情况应该是多点触控，已经发现了触控事件对象的情况下，另一只手指也按下了，
				//但是这个手指的触摸事件没找到对应的子View进行处理，也就是上面说的
				//每个子View的dispatchTransformedTouchEvent()方法返回了false
				if (newTouchTarget == null && mFirstTouchTarget != null) {
					// Did not find a child to receive the event.
					// Assign the pointer to the least recently added target.
					//会将newTouchTarget设置成mFirstTouchTarget链表中最后一个
					newTouchTarget = mFirstTouchTarget;
					while (newTouchTarget.next != null) {
						newTouchTarget = newTouchTarget.next;
					}
					//将newTouchTarget的pointerIdBits对应的事件的id bit位置位，
					//表示该触摸对象接收该事件。
					newTouchTarget.pointerIdBits |= idBitsToAssign;
				}
			}
		}

		// Dispatch to touch targets.
		// 此处开始派发触摸对象处理事件

		//该ViewGroup的子View中没找到对应的触摸对象，
		//就会将参数child设置为null，这个就是交给ViewGroup本身来处理
		if (mFirstTouchTarget == null) {
			// No touch targets so treat this as an ordinary view.
			handled = dispatchTransformedTouchEvent(ev, canceled, null,
					TouchTarget.ALL_POINTER_IDS);
		} else {
			//如果子view中有触摸对象，即有子View去消费事件，那么遍历触摸目标列表，分发事件
			// Dispatch to touch targets, excluding the new touch target if we already
			// dispatched to it.  Cancel touch targets if necessary.
			TouchTarget predecessor = null;
			TouchTarget target = mFirstTouchTarget;
			//循环触摸对象链表，让每个触摸对象处理事件，单指操作时  只会执行一次
			while (target != null) {
				// 单指操作 next = null
				final TouchTarget next = target.next;
				//如果alreadyDispatchedToNewTouchTarget变量为true，并且触摸对象和newTouchTarget是同一个，
				//则直接设置变量handled的值为true，表示处理过了，直接返回不做处理
				if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) {
					handled = true;
				} else {
					//target.child（前面addTouchTarge时保存的）
					//其他的触摸对象会调用dispatchTransformedTouchEvent()方法进行处理。只要某一个
					//对象的dispatchTransformedTouchEvent()返回true，就会将变量handled的值设为true。
					final boolean cancelChild = resetCancelNextUpFlag(target.child)
							|| intercepted;
					if (dispatchTransformedTouchEvent(ev, cancelChild,
							target.child, target.pointerIdBits)) {
						handled = true;
					}
					// 为true 取消child处理事件
					if (cancelChild) {
						if (predecessor == null) {
							// mFirstTouchTarget 置为null
							mFirstTouchTarget = next;
						} else {
							predecessor.next = next;
						}
						target.recycle();
						target = next;
						continue;
					}
				}
				predecessor = target;
				target = next;
			}
		}

		// Update list of touch targets for pointer up or cancel, if needed.
		//如果事件被取消、是 ACTION_UP 或 ACTION_HOVER_MOVE，重置触摸状态。
		//如果是分割事件并且是 ACTION_POINTER_UP，那么从触摸目标中移除指针。
		if (canceled
				|| actionMasked == MotionEvent.ACTION_UP
				|| actionMasked == MotionEvent.ACTION_HOVER_MOVE) {
			resetTouchState();
		} else if (split && actionMasked == MotionEvent.ACTION_POINTER_UP) {
			final int actionIndex = ev.getActionIndex();
			final int idBitsToRemove = 1 << ev.getPointerId(actionIndex);
			removePointersFromTouchTargets(idBitsToRemove);
		}
	}

	//如果事件没有被处理，并且存在 InputEventConsistencyVerifier 对象，
	//那么调用它的 onUnhandledEvent 方法。
	if (!handled && mInputEventConsistencyVerifier != null) {
		mInputEventConsistencyVerifier.onUnhandledEvent(ev, 1);
	}
	//返回事件是否被处理的标志
	return handled;
}
```

```java
//cancelAndClearTouchTargets取消和清理触摸对象，判断成员变量mFirstTouchTarget不等于null，
//mFirstTouchTarget，他是一个链表，连接所有的需要处理事件的当前ViewGroup的子View,
//这个链表是在事件为ACTION_DOWN和ACTION_POINTER_DOWN的时候来确定的，后续在发生的事件就会
//由mFirstTouchTarget连接的对象来处理。正常情况下，一个事件结束的时候，mFirstTouchTarget
//应该为null。cancelAndClearTouchTargets方法在mFirstTouchTarget不等于null的情况下，
//会合成一个ACTION_CANCEL事件发送到对象。之后调用clearTouchTargets()方法，
private void cancelAndClearTouchTargets(MotionEvent event) {
	if (mFirstTouchTarget != null) {
		boolean syntheticEvent = false;
		if (event == null) {
			final long now = SystemClock.uptimeMillis();
			event = MotionEvent.obtain(now, now,
					MotionEvent.ACTION_CANCEL, 0.0f, 0.0f, 0);
			event.setSource(InputDevice.SOURCE_TOUCHSCREEN);
			syntheticEvent = true;
		}

		for (TouchTarget target = mFirstTouchTarget; target != null; target = target.next) {
			resetCancelNextUpFlag(target.child);
			//会取消事件执行
			dispatchTransformedTouchEvent(event, true, target.child, target.pointerIdBits);
		}
		clearTouchTargets();

		if (syntheticEvent) {
			event.recycle();
		}
	}
}
//清除TouchTarget
private void clearTouchTargets() {
	TouchTarget target = mFirstTouchTarget;
	if (target != null) {
		do {
			TouchTarget next = target.next;
			target.recycle();
			target = next;
		} while (target != null);
		mFirstTouchTarget = null;
	}
}

//重设所有的触摸状态
private void resetTouchState() {
	clearTouchTargets();
	resetCancelNextUpFlag(this);
	//重置了GroupFlags的值
	mGroupFlags &= ~FLAG_DISALLOW_INTERCEPT;
	mNestedScrollAxes = SCROLL_AXIS_NONE;
}

//为子视图添加触摸目标
//单指操作时target.next为空，只有多指才会有值
private TouchTarget addTouchTarget(@NonNull View child, int pointerIdBits) {
	final TouchTarget target = TouchTarget.obtain(child, pointerIdBits);
	target.next = mFirstTouchTarget;
	mFirstTouchTarget = target;
	return target;
}
```

简单来说，首先ViewGroup会在`dispatchTouchEvent`中接收到事件，其中会调用`onInterceptTouchEvent`方法判断是否需要拦截该事件，如果不拦截，则依次按照一定的顺序遍历child列表，根据手指触摸的坐标、child的可见性等等条件筛选，调用child的`dispatchTouchEvent`进行下一级的事件分发，如果child是ViewGroup，则会将上面的流程在走一遍，如果是View，则在View的`dispatchTouchEvent`中会调用`onTouchEvent`方法进行事件的消费，如果child返回true代表消费该事件，如果返回false则代表不消费，就会将该事件交给本ViewGroup的`onTouchEvent`中进行消费。

如果以上流程中，ViewGroup和View都不选择消费，就最后交给Activity的`onTouchEvent`方法进行消费的判断，不管是哪个`ViewGroup`或`View`选择了消费还是`Activity`选择是否消费，最后执行完还是回到`ViewPostImeInputStage`里进行后续的处理。

###################################################################

后面的分发流程内容可以不去关注，稍微了解可以

```java
final class ViewPostImeInputStage extends InputStage {
    private int processPointerEvent(QueuedInputEvent q) {
        final MotionEvent event = (MotionEvent)q.mEvent;
        //handled代表该事件是否被消费了
        handled = handled || mView.dispatchPointerEvent(event);
        ...
        //如果被消费，则返回的状态为FINISH_HANDLED，否则是FORWARD，继续下一层的分发处理
        return handled ? FINISH_HANDLED : FORWARD;
    }
}

```

返回到父类的`deliver`方法，走到`apply`里：

```java
abstract class InputStage {
    public final void deliver(QueuedInputEvent q) {
        if ((q.mFlags & QueuedInputEvent.FLAG_FINISHED) != 0) {
            forward(q);
        } else if (shouldDropInputEvent(q)) {
            finish(q, false);
        } else {
            traceEvent(q, Trace.TRACE_TAG_VIEW);
            final int result;
            try {
                result = onProcess(q);
            } finally {
                Trace.traceEnd(Trace.TRACE_TAG_VIEW);
            }
            apply(q, result);
        }
    }

    protected void apply(QueuedInputEvent q, int result) {
        if (result == FORWARD) {
            forward(q);
        } else if (result == FINISH_HANDLED) {
            finish(q, true);
        } else if (result == FINISH_NOT_HANDLED) {
            finish(q, false);
        } else {
            throw new IllegalArgumentException("Invalid result: " + result);
        }
    }

    protected void finish(QueuedInputEvent q, boolean handled) {
        q.mFlags |= QueuedInputEvent.FLAG_FINISHED;
        if (handled) {
            q.mFlags |= QueuedInputEvent.FLAG_FINISHED_HANDLED;
        }
        forward(q);
    }

    protected void forward(QueuedInputEvent q) {
        onDeliverToNext(q);
    }

    protected void onDeliverToNext(QueuedInputEvent q) {
        ...
        if (mNext != null) {
            mNext.deliver(q);
        } else {
            finishInputEvent(q);
        }
    }
}
```

如果选择了消费，则会走到`finish`方法，并往`QueuedInputEvent`里添加`FLAG_FINISHED`和`FLAG_FINISHED_HANDLED`标志位，前者标志位代表事件分发流程的结束，后者标志位表示事件被消费。最后走到了`finishInputEvent`方法：

```java
private void finishInputEvent(QueuedInputEvent q) {
    if (q.mReceiver != null) {
        boolean handled = (q.mFlags & QueuedInputEvent.FLAG_FINISHED_HANDLED) != 0;
        boolean modified = (q.mFlags & QueuedInputEvent.FLAG_MODIFIED_FOR_COMPATIBILITY) != 0;
        if (modified) {
            ...
        } else {
            q.mReceiver.finishInputEvent(q.mEvent, handled);
        }
    } else {
        q.mEvent.recycleIfNeededAfterDispatch();
    }

    recycleQueuedInputEvent(q);
}
```

```java
public final void finishInputEvent(InputEvent event, boolean handled) {
   ...
    if (mReceiverPtr == 0) {
        Log.w(TAG, "Attempted to finish an input event but the input event " + "receiver has already been disposed.");
    } else {
        int index = mSeqMap.indexOfKey(event.getSequenceNumber());
        if (index < 0) {
            Log.w(TAG, "Attempted to finish an input event that is not in progress.");
        } else {
            int seq = mSeqMap.valueAt(index);
            mSeqMap.removeAt(index);
            nativeFinishInputEvent(mReceiverPtr, seq, handled);
        }
    }
    event.recycleIfNeededAfterDispatch();
}
```

接着就会调用native方法`nativeFinishInputEvent`来通知native层事件分发已结束。

```java
static void nativeFinishInputEvent(JNIEnv* env, jclass clazz, jlong receiverPtr, jint seq, jboolean handled) {
    sp<NativeInputEventReceiver> receiver =
            reinterpret_cast<NativeInputEventReceiver*>(receiverPtr);
    status_t status = receiver->finishInputEvent(seq, handled);
    ...
}

status_t NativeInputEventReceiver::finishInputEvent(uint32_t seq, bool handled) {
    ...
    Finish finish{
            .seq = seq,
            .handled = handled,
    };
    mOutboundQueue.push_back(finish);
    return processOutboundEvents();
}
```

`NativeInputEventReceiver`会将一个`Finish`事件插入`mOutboundQueue`中,

```java
status_t NativeInputEventReceiver::processOutboundEvents() {
    while (!mOutboundQueue.empty()) {
        OutboundEvent& outbound = *mOutboundQueue.begin();
        status_t status;
        //判断是否是Finish事件
        if (std::holds_alternative<Finish>(outbound)) {
            const Finish& finish = std::get<Finish>(outbound);
            status = mInputConsumer.sendFinishedSignal(finish.seq, finish.handled);
        }
        ...
    }

    setFdEvents(ALOOPER_EVENT_INPUT);
    return OK;
}

```

接下来就是调用`mInputConsumer`的`sendFinishedSignal`方法，内部还是通过`InputChannel`的`sendMessage`方法，依靠socketpair方式将事件结束的信号发送给服务端SystemServer进程，完成跨进程通信：

```java
status_t InputConsumer::sendUnchainedFinishedSignal(uint32_t seq, bool handled) {
    InputMessage msg;
    msg.header.type = InputMessage::Type::FINISHED;
    msg.header.seq = seq;
    msg.body.finished.handled = handled;
    msg.body.finished.consumeTime = getConsumeTime(seq);
    status_t result = mChannel->sendMessage(&msg);
    if (result == OK) {
        popConsumeTime(seq);
    }
    return result;
}
```

SystemServer端接收该消息的回调[函数](https://marketing.csdn.net/p/3127db09a98e0723b83b2914d9256174?pId=2782?utm_source=glcblog&spm=1001.2101.3001.7020)是：

```java
int InputDispatcher::handleReceiveCallback(int events, sp<IBinder> connectionToken) {
    ...
    bool notify;
    if (!(events & (ALOOPER_EVENT_ERROR | ALOOPER_EVENT_HANGUP))) {
        ...
        for (;;) {
            //从inputPublisher中取出客户端发来的事件
            Result<InputPublisher::ConsumerResponse> result =
                    connection->inputPublisher.receiveConsumerResponse();
            if (!result.ok()) {
                status = result.error().code();
                break;
            }
            //如果是Finished事件
            if (std::holds_alternative<InputPublisher::Finished>(*result)) {
                const InputPublisher::Finished& finish =
                        std::get<InputPublisher::Finished>(*result);
                finishDispatchCycleLocked(currentTime, connection, finish.seq, finish.handled,
                                          finish.consumeTime);
            }
            ...
        }
        ...
    }
    ...
}

void InputDispatcher::finishDispatchCycleLocked(nsecs_t currentTime,
                                                const std::shared_ptr<Connection>& connection,
                                                uint32_t seq, bool handled, nsecs_t consumeTime) {
    ...
    auto command = [this, currentTime, connection, seq, handled, consumeTime]() REQUIRES(mLock) {
        doDispatchCycleFinishedCommand(currentTime, connection, seq, handled, consumeTime);
    };
    postCommandLocked(std::move(command));
}

void InputDispatcher::doDispatchCycleFinishedCommand(nsecs_t finishTime,
                                                     const std::shared_ptr<Connection>& connection,
                                                     uint32_t seq, bool handled,
                                                     nsecs_t consumeTime) {
    //从waitQueue中取出对应序列的事件，如果没找到，则直接返回，流程结束
    std::deque<DispatchEntry*>::iterator dispatchEntryIt = connection->findWaitQueueEntry(seq);
    if (dispatchEntryIt == connection->waitQueue.end()) {
        return;
    }
    ...
    dispatchEntryIt = connection->findWaitQueueEntry(seq);
    //从waitQueue中找到了对应序列的事件
    if (dispatchEntryIt != connection->waitQueue.end()) {
        dispatchEntry = *dispatchEntryIt;
        //从待结束队列waitQueue中删除该事件
        connection->waitQueue.erase(dispatchEntryIt);
        const sp<IBinder>& connectionToken = connection->inputChannel->getConnectionToken();
        //从ANR追踪器中删除该事件
        mAnrTracker.erase(dispatchEntry->timeoutTime, connectionToken);
        ...
    }

    //开始下一个事件分发的流程
    startDispatchCycleLocked(now(), connection);
}
```

`waitingQueue`是专门用来保存将事件分发给客户端并等待客户端回复的队列。在`waitingQueue`中找到该事件后，就从该队列中删除掉该事件，并开始下一个待分发事件的分发流程。

就此，一个事件的分发流程梳理完成了。

#### (3) 获取拦截状态
在上述代码中，中间有一步是

```java
// Check for interception.
final boolean intercepted;
if (actionMasked == MotionEvent.ACTION_DOWN
		|| mFirstTouchTarget != null) {
	final boolean disallowIntercept = (mGroupFlags & FLAG_DISALLOW_INTERCEPT) != 0;
	if (!disallowIntercept) {
		intercepted = onInterceptTouchEvent(ev);
		ev.setAction(action); // restore action in case it was changed
	} else {
		intercepted = false;
	}
} else {
	// There are no touch targets and this action is not an initial down
	// so this view group continues to intercept touches.
	intercepted = true;
}
```

如果当前控件设置了禁止拦截状态(disallowIntercept)，那么得到的拦截状态就会为false。如果没有设置，则会调用onInterceptTouchEvent()来得到拦截状态intercepted，默认情况下disallowIntercept为false，也就是没有设置禁止拦截状态，所以会执行到onInterceptTouchEvent方法，然后会执行到我们在父容器中重写的onInterceptTouchEvent方法，打印我们的第二条log：onInterceptTouchEvent：父容器

#### (4) ViewGroup的dispatchTransformedTouchEvent
上述代码继续往后分析，看到调用dispatchTransformedTouchEvent将事件分发给子视图，如果像我们点击空白处，并没有点击子视图的情况下，也会在后面执行到dispatchTransformedTouchEvent，如代码228行到234行的注释，ViewGroup的子View中没找到对应的触摸对象，就会将参数child设置为null，交给ViewGroup本身来处理该事件，dispatchTransformedTouchEvent代码如下：

```java
private boolean dispatchTransformedTouchEvent(MotionEvent event, boolean cancel,
            View child, int desiredPointerIdBits) {
		//布尔变量 handled 来记录事件是否被处理
        final boolean handled;

        // Canceling motions is a special case.  We don't need to perform any transformations
        // or filtering.  The important part is the action, not the contents.
		//获取原始事件的动作
        final int oldAction = event.getAction();
		//如果事件被取消或者动作是 ACTION_CANCEL，则将事件的动作设置为 ACTION_CANCEL 并分发。
		//无论是否有子视图接收，都执行取消动作。完成后，恢复原始动作并返回处理结果
        if (cancel || oldAction == MotionEvent.ACTION_CANCEL) {
            event.setAction(MotionEvent.ACTION_CANCEL);
            if (child == null) {
                handled = super.dispatchTouchEvent(event);
            } else {
                handled = child.dispatchTouchEvent(event);
            }
            event.setAction(oldAction);
            return handled;
        }

        // Calculate the number of pointers to deliver.
		////获取原始事件中所有指针的 ID 位集合
        final int oldPointerIdBits = event.getPointerIdBits();
		//将原始事件的指针 ID 位集合与期望的指针 ID 位集合进行按位与操作，
		//以确定哪些指针应该包含在分发的事件中。
        final int newPointerIdBits = oldPointerIdBits & desiredPointerIdBits;

        // If for some reason we ended up in an inconsistent state where it looks like we
        // might produce a motion event with no pointers in it, then drop the event.
		//如果没有指针 ID 位集合与期望的集合匹配，说明没有指针应该被分发，因此丢弃事件并返回 false
        if (newPointerIdBits == 0) {
            return false;
        }

        // If the number of pointers is the same and we don't need to perform any fancy
        // irreversible transformations, then we can reuse the motion event for this
        // dispatch as long as we are careful to revert any changes we make.
        // Otherwise we need to make a copy.
		//声明一个 MotionEvent 变量 transformedEvent 来存储转换后的事件
        final MotionEvent transformedEvent;
		//如果新的指针 ID 位集合与原始的相同，并且子视图（如果存在）没有变换矩阵或者子视图为 null，
		//则可以直接使用原始事件，否则需要创建原始事件的一个副本
        if (newPointerIdBits == oldPointerIdBits) {
			//如果没有子视图或者子视图有单位矩阵（即没有变换），
			//则可以直接使用原始事件，但可能需要应用偏移量
            if (child == null || child.hasIdentityMatrix()) {
                if (child == null) {
                    handled = super.dispatchTouchEvent(event);
                } else {
                    final float offsetX = mScrollX - child.mLeft;
                    final float offsetY = mScrollY - child.mTop;
					//应用坐标偏移量，将事件的坐标转换为相对于子视图的坐标系
                    event.offsetLocation(offsetX, offsetY);
					//将转换后的事件分发给子视图
                    handled = child.dispatchTouchEvent(event);
					//撤销之前应用的坐标偏移量
                    event.offsetLocation(-offsetX, -offsetY);
                }
                return handled;
            }
            transformedEvent = MotionEvent.obtain(event);
        } else {
            transformedEvent = event.split(newPointerIdBits);
        }

        // Perform any necessary transformations and dispatch.
        if (child == null) {
            handled = super.dispatchTouchEvent(transformedEvent);
        } else {
            final float offsetX = mScrollX - child.mLeft;
            final float offsetY = mScrollY - child.mTop;
            transformedEvent.offsetLocation(offsetX, offsetY);
            if (! child.hasIdentityMatrix()) {
                transformedEvent.transform(child.getInverseMatrix());
            }

            handled = child.dispatchTouchEvent(transformedEvent);
        }

        // Done.
		////回收 transformedEvent 事件，释放资源
        transformedEvent.recycle();
		//返回事件是否被处理的标志
        return handled;
}
```

该方法参数event是派发的事件；参数cancel是代表取消状态，如果该参数为true，会将事件类型设置为ACTION_CANCEL；参数child是需要处理该事件的控件；参数desiredPointerIdBits是child想要处理的事件的id的bit位。

该方法主要处理如下：

  一、事件如果是ACTION_CANCEL或参数cancel 是true，设置事件类型MotionEvent.ACTION_CANCEL，进行处理，处理完毕将原来的事件类型还原，然后返回结果。通过代码可以看到如果child==true，会调用super.dispatchTouchEvent(event)，即执行父类（这里指View类）的dispatchTouchEvent()方法，否则调用child.dispatchTouchEvent(event)。

二、判断事件是否分解，如果需要分解的话，调用MotionEvent 的split()方法进行分解出来新事件接着进行传递；如果事件不需要分解，并且child == null，会执行super.dispatchTouchEvent(event)，即执行父类（这里指View类）的dispatchTouchEvent()方法，并将执行结果返回；如果事件不需要分解，并且child不为null，并且child.hasIdentityMatrix()，需要将event进行简单转化，然后派发到child，执行child.dispatchTouchEvent(event)，恢复event，返回执行结果handled；如果事件不需要分解，但是也不符合上面说的那两种情况，需要调用MotionEvent.obtain(event)获取一个新的事件transformedEvent，并且复制event的属性信息，后面再将该新事件进行属性转化再派发。

  三、对新生成的事件进行处理，如果child等于null，调用super.dispatchTouchEvent(transformedEvent)；如果child不等于null，则先进行转化，然后会调用child.dispatchTouchEvent(transformedEvent)进行处理。在最后返回结果之前，会将新生成的transformedEvent进行回收，最后返回结果。

代码中dispatchTouchEvent()的嵌套和事件交由子View处理之前的转化我们暂时跳过分析，看到最后 dispatchTransformedTouchEvent()方法如果找到子View，嵌套执行dispatchTouchEvent()。如果找到子View类型是View类型，则会执行View类的dispatchTouchEvent(MotionEvent event)方法，包括没有找到触摸对象，将child设置为null的时候，也会执行View类的dispatchTouchEvent(MotionEvent event)方法，在View中只会做事件的处理，不会再去分发事件了，如果child还是个ViewGroup则会继续上面的代码流程递归执行到此继续判断子View，继续做事件的分发。

这里就将事件从ViewGroup传递到了View中，

### 3、View事件的分发机制
从ViewGroup将事件传递到View后，子View里重写的dispatchTouchEvent就会被调用，就有了我们的第三条打印dispatchTouchEvent：子View或者没有触摸子视图时打印的dispatchTouchEvent：父容器

```java
    public boolean dispatchTouchEvent(MotionEvent event) {
        // If the event should be handled by accessibility focus first.
		//检查触摸事件是否是针对辅助功能焦点的。
		//如果是，并且当前视图或其虚拟子视图拥有焦点，则继续处理；
		//否则，返回 false 表示不处理该事件
        if (event.isTargetAccessibilityFocus()) {
            // We don't have focus or no virtual descendant has it, do not handle the event.
            if (!isAccessibilityFocusedViewOrHost()) {
                return false;
            }
            // We have focus and got the event, then use normal event dispatch.
			//如果视图拥有辅助功能焦点并且接收到了事件，
			//则清除该标志，以便使用正常的事件分发逻辑
            event.setTargetAccessibilityFocus(false);
        }
		//记录事件是否被处理
        boolean result = false;
		//如果存在 InputEventConsistencyVerifier 对象，
		//则调用它的 onTouchEvent 方法来验证触摸事件的一致性
        if (mInputEventConsistencyVerifier != null) {
            mInputEventConsistencyVerifier.onTouchEvent(event, 0);
        }

		//获取触摸事件的动作，并去除指针索引
        final int actionMasked = event.getActionMasked();
		//如果动作是 ACTION_DOWN（表示新的触摸手势开始），
		//则调用 stopNestedScroll 方法停止任何嵌套的滚动操作
        if (actionMasked == MotionEvent.ACTION_DOWN) {
            // Defensive cleanup for new gesture
            stopNestedScroll();
        }

		//调用 onFilterTouchEventForSecurity 方法来检查事件是否应该被分发。为了防范恶意软件误导用户。
		//如果这个检查没通过的话，该控件会丢弃该事件
		//主要过滤的是当前Window被遮挡的情况下的触摸事件
		//如果返回 true，则继续处理事件
        if (onFilterTouchEventForSecurity(event)) {
			//检查视图是否启用，如果是，则调用 handleScrollBarDragging 方法来处理滚动条拖动。
			//如果事件被处理，则设置 result 为 true
            if ((mViewFlags & ENABLED_MASK) == ENABLED && handleScrollBarDragging(event)) {
                result = true;
            }
            //noinspection SimplifiableIfStatement
			//获取 ListenerInfo 对象，如果存在并且设置了触摸监听器，并且视图是启用的，
			//那么调用 OnTouchListener 的 onTouch 方法。
			//如果事件被处理，则设置 result 为 true，
			//短路与的前置条件达成时，mOnTouchListener.onTouch会被调用
            ListenerInfo li = mListenerInfo;
            if (li != null && li.mOnTouchListener != null
                    && (mViewFlags & ENABLED_MASK) == ENABLED
                    && li.mOnTouchListener.onTouch(this, event)) {
                result = true;
            }

			//如果事件还没有被处理，并且调用 onTouchEvent 方法返回 true，
			//则设置 result 为 true
            if (!result && onTouchEvent(event)) {
                result = true;
            }
        }

		//如果事件没有被处理，并且存在 InputEventConsistencyVerifier 对象，
		//则调用它的 onUnhandledEvent 方法
        if (!result && mInputEventConsistencyVerifier != null) {
            mInputEventConsistencyVerifier.onUnhandledEvent(event, 0);
        }

        // Clean up after nested scrolls if this is the end of a gesture;
        // also cancel it if we tried an ACTION_DOWN but we didn't want the rest
        // of the gesture.
		//如果动作是 ACTION_UP、ACTION_CANCEL 或者是 ACTION_DOWN 但事件没有被处理，
		//则调用 stopNestedScroll 方法停止任何嵌套的滚动操作
        if (actionMasked == MotionEvent.ACTION_UP ||
                actionMasked == MotionEvent.ACTION_CANCEL ||
                (actionMasked == MotionEvent.ACTION_DOWN && !result)) {
            stopNestedScroll();
        }
		//返回 result，表示事件是否被处理
        return result;
}
```

View的dispatchTouchEvent逻辑还是很清晰的

1、事件是ACTION_DOWN的时候，调用stopNestedScroll()

2、事件在控件ENABLED状态下，如果设置了mOnTouchListener接口，先执行接口的onTouch()方法，该接口方法返回true，则将变量result设置为true。

3、result如果为false，执行控件的onTouchEvent()方法，该方法返回true，则将变量result设置为true。

4、事件如果是ACTION_UP或者ACTION_CANCEL或者 ACTION_DOWN并且result如果为false的情况下，调用stopNestedScroll()方法。最后会将变量result的值返回。

在上述代码中，

```java
if (li != null && li.mOnTouchListener != null
	&& (mViewFlags & ENABLED_MASK) == ENABLED
	&& li.mOnTouchListener.onTouch(this, event)) {
	result = true;
}
if (!result && onTouchEvent(event)) {
	result = true;
}
```

第一个if中只要三个条件都为真，result设置为true，才不会执行第二个if中的onTouchEvent方法，先来具体看下这三个条件。

条件一：mOnTouchListener!= null

mOnTouchListener是在View类下setOnTouchListener方法里赋值的，只要我们给控件注册了Touch事件，mOnTouchListener就一定被赋值（不为空）

```java
public void setOnTouchListener(OnTouchListener l) {
	getListenerInfo().mOnTouchListener = l;
}
```

条件二：(mViewFlags & ENABLED_MASK) == ENABLED

+ 该条件是判断当前点击的控件是否enable
+ 由于很多View默认是enable的，因此该条件恒定为true

条件三：mOnTouchListener.onTouch(this, event)

回调控件注册Touch事件时的onTouch方法,，如果返回的是true，则第三个条件达成，如果返回false，则result为false，会执行后续的onTouchEvent方法。注意我们控件的onClick是在onTouchEvent里面执行的，所以onTouch执行后，onClick会不执行。

```java
btn_click.setOnTouchListener(new View.OnTouchListener() {
	@Override
	public boolean onTouch(View v, MotionEvent event) {
		Log.e(TAG, "onTouch: " + event.getAction());

		return true;
	}
});
```

因为我们设置的是return true,所以会执行onTouch方法不执行onTouchEvent方法，所以第四条打印为onTouch：0

而如果点击空白没有触摸子视图时，我们发现只有一个DOWN的打印，是因为触发onTouchEvent方法的时候，因为容器类视图的android:clickable属性默认为false，所以onTouchEvent会返回false，后续的UP、MOVE等ACTION都不会被执行，如果在layout的xml中设置android:clickable为true，则会触发DOWN和UP事件。而button等控件默认都是可被点击的，假如让button不可被点击即onclick等不触发，也需要做相应的clickable设置，具体以后再介绍。

#### (1) onTouchEvent和onClick
onClick如何被执行？首先onClick是在UP的时候执行，在onTouchEvent中找到UP的动作

```java
public boolean onTouchEvent(MotionEvent event) {

	//......
	final boolean clickable = ((viewFlags & CLICKABLE) == CLICKABLE
                || (viewFlags & LONG_CLICKABLE) == LONG_CLICKABLE)
                || (viewFlags & CONTEXT_CLICKABLE) == CONTEXT_CLICKABLE;
	//......
	if (clickable || (viewFlags & TOOLTIP) == TOOLTIP) {
		switch (action) {
	        case MotionEvent.ACTION_UP:
				//......
				if (!focusTaken) {
					// Use a Runnable and post this rather than calling
					// performClick directly. This lets other visual state
					// of the view update before click actions start.
					if (mPerformClick == null) {
						mPerformClick = new PerformClick();
					}
					if (!post(mPerformClick)) {
						performClickInternal();
					}
				}
				//......
				break;
			//......
		}
	}
	return false
}
```

可以看到执行了PerformClick动作，继续跟踪PerformClick又执行了performClickInternal

```java
private final class PerformClick implements Runnable {
	@Override
	public void run() {
		recordGestureClassification(TOUCH_GESTURE_CLASSIFIED__CLASSIFICATION__SINGLE_TAP);
		performClickInternal();
	}
}
```

performClickInternal又执行了performClick

```java
private boolean performClickInternal() {
	// Must notify autofill manager before performing the click actions to avoid scenarios where
	// the app has a click listener that changes the state of views the autofill service might
	// be interested on.
	notifyAutofillManagerOnClick();

	return performClick();
}
```

在performClick里面，判断如果mOnClickListener不为空，则执行mOnClickListener的onClick方法

```java
public boolean performClick() {
	// We still need to call this method to handle the cases where performClick() was called
	// externally, instead of through performClickInternal()
	notifyAutofillManagerOnClick();

	final boolean result;
	final ListenerInfo li = mListenerInfo;
	if (li != null && li.mOnClickListener != null) {
		playSoundEffect(SoundEffectConstants.CLICK);
		li.mOnClickListener.onClick(this);
		result = true;
	} else {
		result = false;
	}

	sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_CLICKED);

	notifyEnterOrExitForAutoFillIfNeeded(true);

	return result;
}
```

#### (2) 为什么触摸点移出屏幕不触发onClick？
首先看MOVE中的代码如下

```java
public boolean onTouchEvent(MotionEvent event) {

	//......
	switch (action) {
        case MotionEvent.ACTION_MOVE:
			//......
			// Be lenient about moving outside of buttons
			if (!pointInView(x, y, touchSlop)) {
				// Outside button
				// Remove any future long press/tap checks
				removeTapCallback();
				removeLongPressCallback();
				if ((mPrivateFlags & PFLAG_PRESSED) != 0) {
					setPressed(false);
				}
				mPrivateFlags3 &= ~PFLAG3_FINGER_DOWN;
			}
			//......
			break;
		//......
	}
	//......
}
```

```java
public void setPressed(boolean pressed) {
	final boolean needsRefresh = pressed != ((mPrivateFlags & PFLAG_PRESSED) == PFLAG_PRESSED);

	if (pressed) {
		mPrivateFlags |= PFLAG_PRESSED;
	} else {
		mPrivateFlags &= ~PFLAG_PRESSED;
	}

	if (needsRefresh) {
		refreshDrawableState();
	}
	dispatchSetPressed(pressed);
}
```

当判断触摸点不在view中，会移除回调且调用setPressed(false)，mPrivateFlags会设置为false，该标志会影响down、up的时候的判断，导致动作的后续代码不执行。

### 4、结论
ViewGroup的dispatchTouchEvent()主要内容：

  首先在非拦截非取消的转态下，在手指按下的时候去寻找子View触摸对象

  然后如果找到了触摸对象，后续的事件如ACTION_MOVE及ACTION_UP都将派发到触摸对象；如果没有找到触摸对象则会调用父类View的dispatchTouchEvent()方法执行。

1. onTouch（）的执行高于onClick（）
2. 每当控件被点击时：
    - 如果在回调onTouch()里返回false，就会让dispatchTouchEvent方法返回false，那么就会执行onTouchEvent()；如果调用了setOnClickListener()来给控件注册点击事件的话，最后会在performClick()方法里回调onClick()。

onTouch()返回false（该事件没被onTouch()消费掉） = dispatchTouchEvent()返回false（继续向下传递） = 执行onTouchEvent() = 执行OnClick()

    - 如果在回调onTouch()里返回true，就会让dispatchTouchEvent方法返回true，那么将不会执行onTouchEvent()，即onClick()也不会执行；

onTouch()返回true（该事件被onTouch()消费掉） = dispatchTouchEvent()返回true（不会再继续向下传递） = 不会执行onTouchEvent() = 不会执行OnClick()

### 5、思考
#### (1) onTouch()和onTouchEvent()的区别
+ 这两个方法都是在View的dispatchTouchEvent中调用，但onTouch优先于onTouchEvent执行。
+ 如果在onTouch方法中返回true将事件消费掉，onTouchEvent()将不会再执行。
+ 特别注意：请看下面代码

```java
//&&为短路与，即如果前面条件为false，将不再往下执行
//所以，onTouch能够得到执行需要两个前提条件：
//1. mOnTouchListener的值不能为空
//2. 当前点击的控件必须是enable的。
mOnTouchListener != null && (mViewFlags & ENABLED_MASK) == ENABLED && mOnTouchListener.onTouch(this, event)
```

+ 因此如果你有一个控件是非enable的，那么给它注册onTouch事件将永远得不到执行。对于这一类控件，如果我们想要监听它的touch事件，就必须通过在该控件中重写onTouchEvent方法来实现。

#### (2) Touch事件的后续事件（MOVE、UP）层级传递
+ 如果给控件注册了Touch事件，每次点击都会触发一系列action事件（ACTION_DOWN，ACTION_MOVE，ACTION_UP等）
+ 当dispatchTouchEvent在进行事件分发的时候，只有前一个事件（如ACTION_DOWN）返回true，才会收到后一个事件（ACTION_MOVE和ACTION_UP）

即如果在执行ACTION_DOWN时返回false，后面一系列的ACTION_MOVE和ACTION_UP事件都不会执行，例如demo中父容器只会响应DOWN一样

从上面对事件分发机制分析知：

+ dispatchTouchEvent()和 onTouchEvent()消费事件、终结事件传递（返回true）
+ 而onInterceptTouchEvent 并不能消费事件，它相当于是一个分叉口起到分流导流的作用，对后续的ACTION_MOVE和ACTION_UP事件接收起到非常大的作用

请记住：接收了ACTION_DOWN事件的函数不一定能收到后续事件（ACTION_MOVE、ACTION_UP）

这里给出ACTION_MOVE和ACTION_UP事件的传递结论：

+ 如果在某个对象（Activity、ViewGroup、View）的dispatchTouchEvent()消费事件（返回true），那么收到ACTION_DOWN的函数也能收到ACTION_MOVE和ACTION_UP

黑线：ACTION_DOWN事件传递方向
红线：ACTION_MOVE和ACTION_UP事件传递方向


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725413729406-a490cf11-da45-45b4-9864-a4784549f1aa.png)

如果在某个对象（Activity、ViewGroup、View）的onTouchEvent()消费事件（返回true），那么ACTION_MOVE和ACTION_UP的事件从上往下传到这个View后就不再往下传递了，而直接传给自己的onTouchEvent()并结束本次事件传递过程。

黑线：ACTION_DOWN事件传递方向
红线：ACTION_MOVE和ACTION_UP事件传递方向


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725413799021-72a1a5f2-8241-4ac9-ab43-5cc7be525f67.png)

本节参考文章

[Android触摸事件派发(一) ViewGroup的dispatchTouchEvent()_viewgroup的dispatchtouchevent返回true意味着什么-CSDN博客](https://blog.csdn.net/q1165328963/article/details/120152511#:~:text=ViewGroup%E7%9A%84#:~:text=ViewGroup%E7%9A%84)

[Android事件分发机制详解：史上最全面、最易懂_android 事件分发-CSDN博客](https://blog.csdn.net/w1142203475/article/details/130325999)

## 五、事件分发实例
### 1、代码示例
```java
package com.snail.dispatch;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.viewpager.widget.ViewPager;

// 父容器
public class BadViewPager extends ViewPager {

    private int mLastX, mLastY;

    public BadViewPager(@NonNull Context context) {
        super(context);
    }

    public BadViewPager(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    // 拦截自己的孩子
    @Override
    public boolean onInterceptTouchEvent(MotionEvent event) {
        return false;
    }
}

```

```java
package com.snail.dispatch;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.widget.ListView;

// 子View -- 容器 -- ViewGroup.dispatchTouchEvent --> super.dispatchTouchEvent
public class MyListView extends ListView {

    public MyListView(Context context) {
        super(context);
    }

    public MyListView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    private int mLastX, mLastY;

    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        return false;
    }
}

```

写一个使用listView和ViewPager的应用，效果如下

左右滑动时的截图，也可以上下滑动


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725450224809-a4f43209-4369-4e52-ae32-19c29502c62b.png)

### 2、onInterceptTouchEvent返回值不同效果不同
但是，当我们重写onInterceptTouchEvent后，会出现下面的几种情况

1.viewPager的onInterceptTouchEvent 返回true --》 上下滑动不可以，左右可以

2.viewPager的onInterceptTouchEvent 返回false --》 上下滑动可以，左右不可以

3.viewPager的onInterceptTouchEvent 返回false，ListView重写 dispatchTouchEvent 返回false --》 上下不可以，左右可以

根据我们之前的源码解读如何能实现上下左右都可以滑动哪？

根据之前的ViewGroup的dispatchTouchEvent()源码跟踪，当ACTION_DOWN时，onInterceptTouchEvent肯定会被执行，以下三块代码我们重点关注。

---------------------------------------------------------------------------------------------

#### (1) 第一块代码，获取拦截状态的代码部分
```java
// Check for interception.
final boolean intercepted;
if (actionMasked == MotionEvent.ACTION_DOWN
	|| mFirstTouchTarget != null) {
	//......
	intercepted = onInterceptTouchEvent(ev);
	//......

}
```

#### (2) 第二块代码，遍历子View,询问子View是否处理事件
```java
if (!canceled && !intercepted) {
	//......
}
```

#### (3) 第三块代码：
1.如果子View中没有触摸对象，没有子View去处理，询问自己是否处理事件

2.如果子View有触摸对象，则交给子View去处理事件

```java
// Dispatch to touch targets.
//该ViewGroup的子View中找到了触摸对象，不会执行if而是执行else
if (mFirstTouchTarget == null) {
	// No touch targets so treat this as an ordinary view.
	handled = dispatchTransformedTouchEvent(ev, canceled, null,
			TouchTarget.ALL_POINTER_IDS);
} else {
	// Dispatch to touch targets, excluding the new touch target if we already
	// dispatched to it.  Cancel touch targets if necessary.
	TouchTarget predecessor = null;
	TouchTarget target = mFirstTouchTarget;
	while (target != null) {
		final TouchTarget next = target.next;
		if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) {
			handled = true;
		} else {
			final boolean cancelChild = resetCancelNextUpFlag(target.child)
					|| intercepted;
			if (dispatchTransformedTouchEvent(ev, cancelChild,
					target.child, target.pointerIdBits)) {
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
		}
		predecessor = target;
		target = next;
	}
}
```

--------------------------------------------------------------------------------------------------------

#### (4) 三种情况分析
onInterceptTouchEvent 为true --》 上下滑动不可以，左右可以的情况

第一块代码的intercepted返回true，拦截了代码，所以第二块代码不执行，不再遍历子View去处理事件，所以ListView就不能接收到事件，继续执行到第三块代码中如下，因为第二块代码没有执行，所以if不执行，target.child为null，又因为intercepted是true，所以执行了dispatchTransformedTouchEvent(ev, cancelChild,

target.child, target.pointerIdBits)等同于执行dispatchTransformedTouchEvent(ev, canceled, null,

TouchTarget.ALL_POINTER_IDS);由容器自己去消费该事件处理，所以ListView的上下滑动就失败了，只有ViewPager自己的左右滑动被ViewPager消费处理。

```java
if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) {
    handled = true;
} else {
    final boolean cancelChild = resetCancelNextUpFlag(target.child)
    || intercepted;
    if (dispatchTransformedTouchEvent(ev, cancelChild,
                                      target.child, target.pointerIdBits)) {
        handled = true;
    }
    //......
}
```


onInterceptTouchEvent 为false --》 上下滑动可以，左右不可以的情况

第一块代码的intercepted返回false，不拦截代码，所以第二块代码执行，遍历子View去处理事件，所以ListView就接收到事件，listView默认下处理事件，所以上下滑动成功；当第三块代码执行时，因为子View中可以处理事件，所以进入到else代码中，且执行的是`if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) `，因为第二块代码中已经处理过，这里执行返回handled

紧接着我们的ACTION_MOVE事件过来，还是从ViewPager分发过来，继续询问是否拦截子View，依然是不拦截，仍然会执行到第二块代码中，但是在第二块代码中，询问子View是否处理事件时，只会在下面的if条件达成时才会去询问，所以这块代码并没有执行真正的询问逻辑。

```java
if (actionMasked == MotionEvent.ACTION_DOWN
    || (split && actionMasked == MotionEvent.ACTION_POINTER_DOWN)
    || actionMasked == MotionEvent.ACTION_HOVER_MOVE)
```

当执行到第三块代码时mFirstTouchTarget依然不为空，因为mFirstTouchTarget是全局的，在DOWN的时候就不为空，所以在这里还是不为空，当执行到后面时代码如下，因为第二块代码并没有执行，所以这里不会执行if，而是执行else，dispatchTransformedTouchEvent去询问的是target.child，而target.child是ListView，所以滑动事件交给的是ListView去消费处理，ViewPager并没有消费处理滑动事件，也就出现了上下可以滑动，左右无法滑动的问题。(注意，上下左右的滑动都是被ListView消费了，只是ListView没有处理左右的滑动事件)

```java
if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) {
	handled = true;
} else {
	final boolean cancelChild = resetCancelNextUpFlag(target.child)
	|| intercepted;
	if (dispatchTransformedTouchEvent(ev, cancelChild,
									  target.child, target.pointerIdBits)) {
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
}
```

分析第二种情况也会总结出一个结论即down事件谁处理的，MOVE事件也是谁处理，其他View没资格处理

viewPager的onInterceptTouchEvent 返回false，ListView重写 dispatchTouchEvent 返回false --》 上下不可以，左右可以的情况

viewPager的onInterceptTouchEvent 返回false，根据第二种情况的分析，我们知道代码依然是执行到

if (dispatchTransformedTouchEvent(ev, cancelChild,target.child, target.pointerIdBits))

进而执行到子View的dispatchTouchEvent方法，询问子View是否处理该事件，但是我们在ListView中重写了dispatchTouchEvent返回了false，所以该if条件未命中，while循环再执行一次，但是我们没有其他子View能处理该事件，所以target.next为null，再一次执行dispatchTransformedTouchEvent(ev, cancelChild,

target.child, target.pointerIdBits)又像第一种情况下等同于执行dispatchTransformedTouchEvent(ev,canceled, null,TouchTarget.ALL_POINTER_IDS)

事件由容器自己去消费并处理，所以ListView的上下滑动就失败了，事件被ViewPager消费并处理，所以上下滑动失效了，左右可以滑动。

```java
while (target != null) {
	final TouchTarget next = target.next;
	if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) {
		handled = true;
	} else {
		final boolean cancelChild = resetCancelNextUpFlag(target.child)
		|| intercepted;
		if (dispatchTransformedTouchEvent(ev, cancelChild,
										  target.child, target.pointerIdBits)) {
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
	}
	predecessor = target;
	target = next;
}
```

```java
private boolean dispatchTransformedTouchEvent(MotionEvent event, boolean cancel,
            View child, int desiredPointerIdBits) {
        final boolean handled;

        // Canceling motions is a special case.  We don't need to perform any transformations
        // or filtering.  The important part is the action, not the contents.
        final int oldAction = event.getAction();
        if (cancel || oldAction == MotionEvent.ACTION_CANCEL) {
            event.setAction(MotionEvent.ACTION_CANCEL);
            if (child == null) {
                handled = super.dispatchTouchEvent(event);
            } else {
                handled = child.dispatchTouchEvent(event);
            }
            event.setAction(oldAction);
            return handled;
        }
    //......
}
```


分析完上面三种情况，我们也会思考，如何实现上下滑动listView，左右可以滑动ViewPager？

### 3、问题点
1.两个View叠加在一起，必须解决ViewPager和ListView叠加在一起的冲突，而冲突是必然的

2.当用户上下滑动的时候，把事件给 ListView 处理，当左右滑动时，给ViewPager处理


### 4、处理冲突
1.内部拦截法（由子View根据条件来让事件由谁处理），一定要想办法让子View拿到事件

2.外部拦截法（由父容器根据条件来让事件由谁处理）


#### (1) 内部拦截法
请求父容器不要拦截子View----move事件

当上下滑动时不让父容器拦截子View，使用getParent().requestDisallowInterceptTouchEvent();

```java
@Override
public boolean dispatchTouchEvent(MotionEvent event) {
	int x = (int) event.getX();
	int y = (int) event.getY();


	switch (event.getAction()) {
		case MotionEvent.ACTION_DOWN: {
			getParent().requestDisallowInterceptTouchEvent(true);
			break;
		}
		case MotionEvent.ACTION_MOVE: {
			int deltaX = x - mLastX;
			int deltaY = y - mLastY;
			// 这个条件由业务逻辑决定，看什么时候 子View将事件让出去
			//左右滑动距离大于上下滑动距离，即偏角跟倾向左右滑动才允许父容器拦截事件进行处理
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				getParent().requestDisallowInterceptTouchEvent(false);
			}
			break;
		}
		case MotionEvent.ACTION_UP: {
			break;

		}
		default:
			break;
	}

	mLastX = x;
	mLastY = y;
	return super.dispatchTouchEvent(event);
}
```

我们在DOWN的时候想要通知父视图不要拦截触摸事件，在MOVE的时候通知父视图拦截触摸事件，所以DOWN的时候我们将禁止拦截触摸事件设置为true，MOVE的时候将禁止拦截触摸事件设置为false，但是，根据我们之前的源码分析可以知道，在ACTION_DOWN的时候ViewGroup会在dispatchTouchEvent中执行下方代码，即重置我们的触摸状态，所以如果在子View接收到DOWN事件时去设置requestDisallowInterceptTouchEvent(true)是无效的，父类在执行dispatchTouchEvent还是会清除这个标志的，代码依然通过onInterceptTouchEvent来获得是否拦截的状态。

```java
if (actionMasked == MotionEvent.ACTION_DOWN) {
	// Throw away all previous state when starting a new touch gesture.
	// The framework may have dropped the up or cancel event for the previous gesture
	// due to an app switch, ANR, or some other state change.
	cancelAndClearTouchTargets(ev);
	resetTouchState();
}
```

所以我们要分两步，一个是在MOVE的时候设置拦截，另一个是在ViewPager中重写的onInterceptTouchEvent里面在接收到DOWN时返回false，不拦截子View处理事件，在MOVE时返回true拦截事件，代码如下

```java
public boolean onInterceptTouchEvent(MotionEvent event) {
	// down事件的时候不能拦截，因为这个时候 requestDisallowInterceptTouchEvent 无效
	if (event.getAction() == MotionEvent.ACTION_DOWN) {
		super.onInterceptTouchEvent(event);
		return false;
	}
	return true;
}
```

所以此时我们的代码执行大概如下：

#### (2) DOWN事件
子View使用getParent().requestDisallowInterceptTouchEvent(true)请求父容器不拦截但是执行第一块代码时设置的值失效因为第一块代码会重置状态，导致父容器依然会执行onInterceptTouchEvent，重写该方法返回false不拦截子View事件，代码会继续执行第二块代码，将事件分发给子View即ListView处理，执行到第三块代码时因为子View处理过所以直接跳过。这部分DOWN的处理过程如之前的第二种情况下处理DOWN事件的过程。

#### (3) 第一个MOVE事件
我们之前所说DOWN由谁处理那么MOVE就是由谁处理，但是我们想要让DOWN交给ListView处理，MOVE交给ViewPager处理，所以MOVE的时候ViewPager要从子View的手里抢过事件的处理，通过我们的修改，MOVE的执行如下：

子View使用getParent().requestDisallowInterceptTouchEvent(false)允许父容器拦截子View事件，因为是MOVE事件所以该设置的状态不会被重置，

当执行`if (actionMasked == MotionEvent.ACTION_DOWN|| mFirstTouchTarget != null)`虽然是MOVE事件但是mFirstTouchTarget不为空所以父容器依然会执行判断disallowIntercept的if else语句，因为设置的disallowIntercept为false，所以执行了onInterceptTouchEvent并且重写该方法时返回true，所以设置intercepted为true，导致后面的第二块代码不执行

当执行第三块代码(如下所示)遍历子View处理MOVE事件，因为intercepted为true，所以第三块代码执行`final boolean cancelChild = resetCancelNextUpFlag(target.child)|| intercepted;`cancelChild设为true，继续执行dispatchTransformedTouchEvent，但是此时dispatchTransformedTouchEvent代码执行如下，因为cancelChild为true，所以Action被设为CANCEL并调用child.dispatchTouchEvent(event);执行，所以ListView执行的是CANCEL事件，返回false。

```java
TouchTarget predecessor = null;
TouchTarget target = mFirstTouchTarget;
while (target != null) {
	final TouchTarget next = target.next;
	if (alreadyDispatchedToNewTouchTarget && target == newTouchTarget) {
		handled = true;
	} else {
		final boolean cancelChild = resetCancelNextUpFlag(target.child)
		|| intercepted;
		if (dispatchTransformedTouchEvent(ev, cancelChild,
										  target.child, target.pointerIdBits)) {
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
	}
	predecessor = target;
	target = next;
}
```

```java
private boolean dispatchTransformedTouchEvent(MotionEvent event, boolean cancel,
            View child, int desiredPointerIdBits) {
        final boolean handled;

        // Canceling motions is a special case.  We don't need to perform any transformations
        // or filtering.  The important part is the action, not the contents.
        final int oldAction = event.getAction();
        if (cancel || oldAction == MotionEvent.ACTION_CANCEL) {
            event.setAction(MotionEvent.ACTION_CANCEL);
            if (child == null) {
                handled = super.dispatchTouchEvent(event);
            } else {
                handled = child.dispatchTouchEvent(event);
            }
            event.setAction(oldAction);
            return handled;
        }
        //......
}
```

而执行完dispatchTransformedTouchEvent再回到ViewGroup代码中，如上述代码所示，因为cancelChild为true，`next = target.next`，而`target.next`是空，所以`next`也为空，所以mFirstTouchTarget也被设置为空，while循环就结束了。

#### (4) 第N个MOVE事件
MOVE事件不是只有一个，而是多个，当第一个结束会有后续的MOVE出现，当第二个MOVE时，第一块代码中`actionMasked == MotionEvent.ACTION_DOWN|| mFirstTouchTarget != null`两个条件都不再符合所以第一块代码的if不再执行，而是执行else，所以intercepted 设置为 true;

这里要注意一个点就是

第一个MOVE事件里我们在onInterceptTouchEvent返回true，决定拦截事件后，后续mFirstTouchTarget被置为null后，就不会在执行onInterceptTouchEvent的判断了。

也就是说某个View一旦决定拦截，那么从这个事件往后的事件序列都只能由它来处理，并且它的onInterceptTouchEvent不会再被调用。

因为`intercepted = true` 所以第二块代码也不执行，只执行第三块代码，

而第三块代码中mFirstTouchTarget已经为空了，所以直接执行if语句

```java
if (mFirstTouchTarget == null) {
	// No touch targets so treat this as an ordinary view.
	handled = dispatchTransformedTouchEvent(ev, canceled, null,TouchTarget.ALL_POINTER_IDS);
}
```

询问ViewPager是否处理MOVE事件。

至此，我们就解决了冲突，且实现了上下左右的滑动。

其实上述的问题主要还是通过ViewPager重写的onInterceptTouchEvent解决的冲突

#### (5) 外部拦截法
一般只需要在父容器处理，根据业务需求，返回true或者false

```java
public boolean onInterceptTouchEvent(MotionEvent event) {
	int x = (int) event.getX();
	int y = (int) event.getY();

	switch (event.getAction()) {
		case MotionEvent.ACTION_DOWN: {
			mLastX = (int) event.getX();
			mLastY = (int) event.getY();
			break;
		}
		case MotionEvent.ACTION_MOVE: {
			int deltaX = x - mLastX;
			int deltaY = y - mLastY;
			////左右滑动距离大于上下滑动距离，即偏角跟倾向左右滑动才交给父容器拦截事件进行处理
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				return true;
			}
			break;
		}
		case MotionEvent.ACTION_UP: {
			break;
		}
		default:
			break;
	}

	return super.onInterceptTouchEvent(event);
}
```


总结：处理事件冲突，一般看父容器和子View之间的三个方法，再想想方法为什么会被拦截，可以重写下面三个方法做个打印，查看哪里被拦截不被执行，然后通过代码逻辑解决冲突

1.onInterceptTouchEvent

2.dispatchTouchEvent

3.onTouchEvent

