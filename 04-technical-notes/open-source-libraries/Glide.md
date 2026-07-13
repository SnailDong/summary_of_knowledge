## 一、Glide使用
Glide的使用很简单，用法如下。

```java
protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ImageView imageView = findViewById(R.id.image);

         Glide.with(this).load(URL).into(imageView);
}
```

但是with，load，into这三个动作里面做了很多事，重点看这三个阶段。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729152080163-149b2113-8275-42a8-9981-b97f4c6bafda.png)

常规下我们可能认为使用如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729136102082-43d16569-641b-47b4-b5da-9cf4ff656211.png)

对应着这样取消


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729136116306-dffb8e97-16d9-4ab1-8504-c9c825342aa9.png)

但是取消并不是必须的操作，因为Glide内部会在Activity/Fragment生命周期监听，网络变化监听，自动取消加载或者重新加载等等。

## 二、Glide的生命周期
### 1、with流程

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729152223426-abb238d6-9ef2-4509-9af3-153536942fb6.png)

with的时候Glide会搞一个空白的Fragment覆盖到我们的xxxMainActivity或xxxFragment上，就可以监听生命周期了。

如下，空白的Fragment（绿色）覆盖到xxxMainActivity或者xxxFragment上，关联监听我们的xxxMainActivity或者xxxFragment的生命周期

![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1729136567890-8414ba0a-ea56-4eaf-b8cd-080304bc7685.jpeg)

### 2、生命周期的调用过程

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729152364151-b080e358-bf96-410e-94fa-2b7026133c97.png)


### 3、为什么监听生命周期
以前百度地图的做法如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729152441834-f76ec335-4ee1-4397-834a-a216bbb2198c.png)
![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729152450917-d76a3825-1ee7-4323-8477-bc05383d8299.png)

如果又100个请求，还有50个在等待队列，当界面销毁时，剩余50个要跟着销毁才比较合理，

一个请求很耗时，当得到结果发现界面已经关闭了，应该停止这一切操作来避免引发崩溃的可能

总结：以确保优先处理前台可见的activity/fragment，以提高资源利用率

在有必要的时候释放资源以避免在应用在后台时被杀死，提高稳定性。

### 4、生命周期作用域
1.Application

2.Activity

3.Fragment

```java
Glide.with(this).load(URL).into(imageView);
```

```java
private final RequestManagerRetriever requestManagerRetriever;

//重载with入口方法
@NonNull
public static RequestManager with(@NonNull Context context) {
	return getRetriever(context).get(context);
}

@NonNull
public static RequestManager with(@NonNull Activity activity) {
	return getRetriever(activity).get(activity);
}

@NonNull
public static RequestManager with(@NonNull FragmentActivity activity) {
	return getRetriever(activity).get(activity);
}

@NonNull
public static RequestManager with(@NonNull Fragment fragment) {
	return getRetriever(fragment.getContext()).get(fragment);
}

@SuppressWarnings("deprecation")
@Deprecated
@NonNull
public static RequestManager with(@NonNull android.app.Fragment fragment) {
	return getRetriever(fragment.getActivity()).get(fragment);
}

@NonNull
public static RequestManager with(@NonNull View view) {
	return getRetriever(view.getContext()).get(view);
}

@NonNull
public RequestManagerRetriever getRequestManagerRetriever() {
	return requestManagerRetriever;
}

@NonNull
private static RequestManagerRetriever getRetriever(@Nullable Context context) {
	//Glide.get(context)基于DCL单例
	return Glide.get(context).getRequestManagerRetriever();
}
```

可以看到with的返回值是RequestManager，而真正创建的地方在getRequestManagerRetriever#get中


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729153108669-e366e49d-ea9b-4a64-8435-a8ea66014f29.png)

with有很多的重载的函数，根据不同的参数，对应了不用的域，具体如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729153251285-17526aff-9717-4d3b-8b2b-9725ec551cce.png)


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729153278169-e7452556-6b4c-409f-b2ec-a19a106e8d4c.png)

Application域

```java
private volatile RequestManager applicationManager;
@NonNull
private RequestManager getApplicationManager(@NonNull Context context) {
	if (applicationManager == null) {
		synchronized (this) {
			if (applicationManager == null) {
				Glide glide = Glide.get(context.getApplicationContext());
				applicationManager =
				factory.build(
					glide,
					new ApplicationLifecycle(),
					new EmptyRequestManagerTreeNode(),
					context.getApplicationContext());
			}
		}
	}
	return applicationManager;
}
@NonNull
public RequestManager get(@NonNull Context context) {
	if (context == null) {
		throw new IllegalArgumentException("You cannot start a load on a null Context");
	} else if (Util.isOnMainThread() && !(context instanceof Application)) {
		if (context instanceof FragmentActivity) {
			return get((FragmentActivity) context);
		} else if (context instanceof Activity) {
			return get((Activity) context);
		} else if (context instanceof ContextWrapper
				   && ((ContextWrapper) context).getBaseContext().getApplicationContext() != null) {
			return get(((ContextWrapper) context).getBaseContext());
		}
	}

	return getApplicationManager(context);
}
```

第一点：Application域对应的是applicationmanager，他是与RequestManagerRetriever对象绑定的；

第二点：在子线程调用get(...)，或者传入参数是ApplicationContext&ServiceContext时，对应的请求是Application域

Activity域分析

```java
//androidx的FragmentActivity
@NonNull
public RequestManager get(@NonNull FragmentActivity activity) {
	if (Util.isOnBackgroundThread()) {
		return get(activity.getApplicationContext());
	} else {
		assertNotDestroyed(activity);
		FragmentManager fm = activity.getSupportFragmentManager();
		return supportFragmentGet(activity, fm, /*parentHint=*/ null, isActivityVisible(activity));
	}
}

//v4的activity
@NonNull
public RequestManager get(@NonNull Activity activity) {
	if (Util.isOnBackgroundThread()) {
		return get(activity.getApplicationContext());
	} else {
		assertNotDestroyed(activity);
		android.app.FragmentManager fm = activity.getFragmentManager();
		return fragmentGet(activity, fm, /*parentHint=*/ null, isActivityVisible(activity));
	}
}

```

Fragment域

```java
  @NonNull
  public RequestManager get(@NonNull Fragment fragment) {
    Preconditions.checkNotNull(
        fragment.getContext(),
        "You cannot start a load on a fragment before it is attached or after it is destroyed");
    if (Util.isOnBackgroundThread()) {
      return get(fragment.getContext().getApplicationContext());
    } else {
      FragmentManager fm = fragment.getChildFragmentManager();
      return supportFragmentGet(fragment.getContext(), fm, fragment, fragment.isVisible());
    }
  }
```

先获得Fragment的FragmentManager（getChildFragmentManager），之后调用supportFragmentGet获得RequestManager。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729154402091-24a21790-d662-4bbb-9068-f5b4abe178b3.png)

Activity/Fragment/FragmentActivity作用域属于一类。都是一样的，都会搞一个空白的Fragment去监听Activity/Fragment/FragmentActivity，Application域是另外一类，不会搞空白的Fragment去监听。

### 5、生命周期的绑定
activity和fragment域都会调用supportFragmentGet来获得RequestManager，跟踪该代码

```java
//记录保存 FragmentManager-SupportRequestManagerFragment的映射关系
final Map<FragmentManager, SupportRequestManagerFragment> pendingSupportRequestManagerFragments =
            new HashMap<>();

@NonNull
private RequestManager supportFragmentGet(
	@NonNull Context context,
	@NonNull FragmentManager fm) {

	// 1、从 FragmentManager 中获取 SupportRequestManagerFragment(空白)
	SupportRequestManagerFragment current = getSupportRequestManagerFragment(fm);

	// 2、从该 空白Fragment 中获取 RequestManager
	RequestManager requestManager = current.getRequestManager();

	// 3、首次获取，则实例化 RequestManager
	if (requestManager == null) { // 【同学们注意：这样做的目的是为了  一个Activity或Fragment 只能有一个 RequestManager】

		// 3.1 实例化
		Glide glide = Glide.get(context);
		requestManager = new RequestManager(glide, current.getGlideLifecycle(), context);

		// 3.2 设置 Fragment 对应的 RequestManager    空白的Fragment<--->requestManager
		current.setRequestManager(requestManager);
	}
	return requestManager;
}
```

SupportRequestManagerFragment

```java
// 1、从 FragmentManager 中获取 SupportRequestManagerFragment
@NonNull
private SupportRequestManagerFragment getSupportRequestManagerFragment(
	@NonNull final FragmentManager fm) {
	SupportRequestManagerFragment current =
	(SupportRequestManagerFragment) fm.findFragmentByTag(FRAGMENT_TAG);

	if (current == null) {

		//  1.2 尝试从【记录保存】中获取 Fragment
		current = pendingSupportRequestManagerFragments.get(fm);

		// 1.3 实例化 Fragment
		if (current == null) {

			// 1.3.1 创建对象 空白的Fragment
			current = new SupportRequestManagerFragment();  // 重复创建

			// 1.3.2 【记录保存】映射关系 进行保存   第一个保障
			// 一个MainActivity == 一个空白的SupportRequestManagerFragment == 一个RequestManager
			pendingSupportRequestManagerFragments.put(fm, current);

			// 1.3.3 提交 Fragment 事务
			fm.beginTransaction().add(current, FRAGMENT_TAG).commitAllowingStateLoss();

			// 1.3.4 post 一个消息
			handler.obtainMessage(ID_REMOVE_SUPPORT_FRAGMENT_MANAGER, fm).sendToTarget();
		}
	}
	return current;
}
```

post一个消息分析

```java
@Override
public boolean handleMessage(Message message) {

switch (message.what) {
	case ID_REMOVE_FRAGMENT_MANAGER:  // 移除 【记录保存】  1.3.5 post 一个消息
		android.app.FragmentManager fm = (android.app.FragmentManager) message.obj;
		pendingRequestManagerFragments.remove(fm); // 1.3.6 移除临时记录中的映射关系
		break;
	case ID_REMOVE_SUPPORT_FRAGMENT_MANAGER: // 移除 【记录保存】  1.3.5 post 一个消息
		FragmentManager supportFm = (FragmentManager) message.obj;
		pendingSupportRequestManagerFragments.remove(supportFm); // 1.3.6 移除临时记录中的映射关系
		break;
	default:
		break;
}

return false;
}
```

重点关注三点：

1. 从FragmentManager中获取SupportRequestManagerFragment;
2. 从该Fragment中获取RequestManager
3. 首次获取，则实例话RequestManager，后续从同一个SupportRequestManagerFragment中都获取的是这个RequestManager

整个的关键核心在getSupportRequestManagerFragment函数：

第一步：尝试获取FRAGMENT_TAG对应的Fragment

第二步：尝试从【记录保存】中获取 Fragment

第三步：实例化Fragment

+ 第一点：创建对象
+ 第二点：如果父层可见，则调用onStart生命周期
+ 第三点：临时记录映射关系
+ 第四点：提交Fragment事务
+ 第五点：post一个消息
+ 第六点：移除临时记录中的映射关系

提交Fragment事务前为什么需要先保存记录？就是为了避免SupportRequestManagerFragment在一个作用域中重复创建。

因为commitAllowingStateLoss()是将事务post到消息队列中的，也就是说，事务是异步处理的，而不是同步处理的，假设没有临时保存记录，一旦在事务异步等待执行时调用了Glide.with，就会在该作用域中重复创建Fragment。

这里做了双重的保障，如图


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729239679292-8d54cf39-3229-4b3e-9b02-58fa4acfd4c9.png)

一个保障是`pendingSupportRequestManagerFragments`用于记录是否有Fragment创建，当事务被提交后在等待区域，还没有执行创建fragment，如果没有`pendingSupportRequestManagerFragments`那么此时再次执行with会因为还没有fragment被创建，`current =(SupportRequestManagerFragment) fm.findFragmentByTag(FRAGMENT_TAG)`拿不到值导致重复创建一个fragment事务提交，不符合我们只有一个空白fragment的想法，第二个保障是`handler.obtainMessage(ID_REMOVE_SUPPORT_FRAGMENT_MANAGER, fm).sendToTarget();`，通过handler使得fragment马上工作，当Fragment创建了后，`pendingSupportRequestManagerFragments`中的Fragment也要remove掉，这里我认为是一释放内存，代码严谨，而且确保map中的fm都是在等待区域的fm。

### 6、生命周期的监听机制
Glide为每个Activity和Fragment作用域创建了一个无UI的Fragment，Glide如何监听这个无界面的Fragment的生命周期的。

```java
private final ActivityFragmentLifecycle lifecycle;
public SupportRequestManagerFragment() {
	this(new ActivityFragmentLifecycle());
}

@VisibleForTesting
@SuppressLint("ValidFragment")
public SupportRequestManagerFragment(@NonNull ActivityFragmentLifecycle lifecycle) {
	this.lifecycle = lifecycle;
}
@Override
public void onStart() {
	super.onStart();
	lifecycle.onStart();
}

@Override
public void onStop() {
	super.onStop();
	lifecycle.onStop();
}

@Override
public void onDestroy() {
	super.onDestroy();
	lifecycle.onDestroy();
}
@NonNull
public ActivityFragmentLifecycle getGlideLifecycle() {
	return lifecycle;
}

```

```java
//实例化requestManager
Glide glide = Glide.get(context);
requestManager = factory.build(
	glide, current.getGlideLifecycle(), current.getRequestManagerTreeNode(), context);

//requestManager工厂接口
public interface RequestManagerFactory {
	@NonNull
	RequestManager build(
		@NonNull Glide glide,
		@NonNull Lifecycle lifecycle,
		@NonNull RequestManagerTreeNode requestManagerTreeNode,
		@NonNull Context context);
}

//默认requestManager 工厂接口实现类
private static final RequestManagerFactory DEFAULT_FACTORY =
new RequestManagerFactory() {
	@NonNull
	@Override
	public RequestManager build(
		@NonNull Glide glide,
		@NonNull Lifecycle lifecycle,
		@NonNull RequestManagerTreeNode requestManagerTreeNode,
		@NonNull Context context) {
		return new RequestManager(glide, lifecycle, requestManagerTreeNode, context);
	}
};
```

```java
private Lifecycle lifecycle;

public RequestManager(Glide glide, Lifecycle lifecycle, Context applicationContext) {
	this.lifecycle = lifecycle;

	this.lifecycle.addListener(this); // 构造函数 已经给自己注册了【自己给自己绑定】
}

// Activity/Fragment 可见时恢复请求 （onStart() ） 掉用函数
@Override
public void onStart() {
	Log.d(LOG.TAG, "开始执行生命周期业务 onStart: 运行队列 全部执行，等待队列 全部清空 ....");
}

// Activity/Fragment 不可见时暂停请求 （onStop() ） 掉用函数
@Override
public void onStop() {
	Log.d(LOG.TAG, "开始执行生命周期业务 onStop: 运行队列 全部停止，把任务都加入到等待队列 ....");
}

@Override
public void onDestroy() {
	Log.d(LOG.TAG, "开始执行生命周期业务 onDestroy: 自己负责移除自己绑定的生命周期监听，释放操作 ....");
	this.lifecycle.removeListener(this); // 已经给自己销毁了 【自己给自己移除】
}
```

实例话RequestManager时需要一个Lifecycle对象，这个对象时在无界面Fragment中创建的，当Fragment的生命周期变化时，就是通过这个Lifecycle对象将事件分发给RequestManager。


### 7、生命周期的回调
先看RequestManager收到生命周期回调后的处理

```java
public interface LifecycleListener {
    void onStart();
    void onStop();
    void onDestroy();
}
```

Activity/Fragment 不可见时暂停请求(onStop())调用函数

Activity/Fragment 可见时恢复请求(onStart())调用函数

Activity/Fragment 销毁时销毁请求(onDestory())调用函数

```java
public class RequestManager
implements ComponentCallbacks2, LifecycleListener, ModelTypes<RequestBuilder<Drawable>> {
	@Override
	public synchronized void onStart() {
		//恢复任务（页面可见）
		resumeRequests();
		targetTracker.onStart();
	}

	@Override
	public synchronized void onStop() {
		//暂停任务（页面不可见）
		pauseRequests();
		targetTracker.onStop();
	}

	@Override
	public synchronized void onDestroy() {
		//销毁任务（页面销毁）
		targetTracker.onDestroy();
		for (Target<?> target : targetTracker.getAll()) {
			clear(target);
		}
		targetTracker.clear();
		requestTracker.clearRequests();
		lifecycle.removeListener(this);
		lifecycle.removeListener(connectivityMonitor);
		mainHandler.removeCallbacks(addSelfToLifecycle);
		glide.unregisterRequestManager(this);
	}

	public synchronized void pauseRequests() {
		requestTracker.pauseRequests();
	}

	public synchronized void pauseAllRequests() {
		requestTracker.pauseAllRequests();
	}
}
```

根据上述的分析，可以手写Glide的生命周期

### 8、手写生命周期

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729156172706-c06c6f06-83ad-481d-9bce-0982f7b1ff4a.png)

上面我们看了生命周期流程，把with的流程走了一遍，总结如下

【with】

```java
public RequestManager get(@NonNull FragmentActivity activity) {
	if (Util.isOnBackgroundThread()) {
		// Application 作用域
	} else {
		// 非Application 作用域
	}
}
```

## 三、load流程
【load】

load比较简单，源码如下

```java
  @NonNull
  @CheckResult
  @Override
  public RequestBuilder<Drawable> load(@Nullable String string) {
    return asDrawable().load(string);
  }
```

```java
@NonNull
@Override
@CheckResult
public RequestBuilder<TranscodeType> load(@Nullable String string) {
	return loadGeneric(string);
}

@NonNull
private RequestBuilder<TranscodeType> loadGeneric(@Nullable Object model) {
	this.model = model;
	isModelSet = true;
	return this;
}
```


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729212777026-fd06d9f5-ba14-45f3-8e22-010a1209e411.png)

## 四、into流程
【into】

最后就剩下了into流程，into也是最复杂最重要的流程，从下面的流程图也可以看出来代码的复杂。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729239228997-5fdf3b1a-1fb2-4a61-995e-3a3bd4031129.png)

结合流程图和源码，跟踪into的主线

### 1、ImageViewTarget
```java
@NonNull
public ViewTarget<ImageView, TranscodeType> into(@NonNull ImageView view) {
	//......
	return into(
		glideContext.buildImageViewTarget(view, transcodeClass),
		/*targetListener=*/ null,
		requestOptions,
		Executors.mainThreadExecutor());
}

private <Y extends Target<TranscodeType>> Y into(
	@NonNull Y target,
	@Nullable RequestListener<TranscodeType> targetListener,
	BaseRequestOptions<?> options,
	Executor callbackExecutor) {
	//......
	Request request = buildRequest(target, targetListener, options, callbackExecutor);
	//......
	requestManager.track(target, request);

	return target;
}

private Request buildRequest(
	Target<TranscodeType> target,
	@Nullable RequestListener<TranscodeType> targetListener,
	BaseRequestOptions<?> requestOptions,
	Executor callbackExecutor) {
	return buildRequestRecursive(
		/*requestLock=*/ new Object(),
		target,
		targetListener,
		/*parentCoordinator=*/ null,
		transitionOptions,
		requestOptions.getPriority(),
		requestOptions.getOverrideWidth(),
		requestOptions.getOverrideHeight(),
		requestOptions,
		callbackExecutor);
}

private Request buildRequestRecursive(){
	//......
	Request mainRequest =
	buildThumbnailRequestRecursive(
		requestLock,
		target,
		targetListener,
		parentCoordinator,
		transitionOptions,
		priority,
		overrideWidth,
		overrideHeight,
		requestOptions,
		callbackExecutor);
	//......
	errorRequestCoordinator.setRequests(mainRequest, errorRequest);
	return errorRequestCoordinator;
}

private Request buildThumbnailRequestRecursive(){
	//......
	Request fullRequest =
	obtainRequest(
		requestLock,
		target,
		targetListener,
		requestOptions,
		coordinator,
		transitionOptions,
		priority,
		overrideWidth,
		overrideHeight,
		callbackExecutor);
	//......
	coordinator.setRequests(fullRequest, thumbRequest);
	return coordinator;
}

private Request obtainRequest(){
	return SingleRequest.obtain(
		context,
		glideContext,
		requestLock,
		model,
		transcodeClass,
		requestOptions,
		overrideWidth,
		overrideHeight,
		priority,
		target,
		targetListener,
		requestListeners,
		requestCoordinator,
		glideContext.getEngine(),
		transitionOptions.getTransitionFactory(),
		callbackExecutor);
}
```

### 2、SingleRequest
```java
public static <R> SingleRequest<R> obtain(
	Context context,
	GlideContext glideContext,
	Object requestLock,
	Object model,
	Class<R> transcodeClass,
	BaseRequestOptions<?> requestOptions,
	int overrideWidth,
	int overrideHeight,
	Priority priority,
	Target<R> target,
	RequestListener<R> targetListener,
	@Nullable List<RequestListener<R>> requestListeners,
	RequestCoordinator requestCoordinator,
	Engine engine,
	TransitionFactory<? super R> animationFactory,
	Executor callbackExecutor) {
	return new SingleRequest<>(
		context,
		glideContext,
		requestLock,
		model,
		transcodeClass,
		requestOptions,
		overrideWidth,
		overrideHeight,
		priority,
		target,
		targetListener,
		requestListeners,
		requestCoordinator,
		engine,
		animationFactory,
		callbackExecutor);
}
```

在代码17行获取request的值，会一直调用到最后的SingleRequest.obtain获取一个新的SingleRequest然后封装返回，

即在代码19行里执行`requestManager.track(target, request);`后代码如下

```java
synchronized void track(@NonNull Target<?> target, @NonNull Request request) {
	targetTracker.track(target);
	requestTracker.runRequest(request);
}
```

```java
public void runRequest(@NonNull Request request) {
	requests.add(request);//正在运行的队列
	if (!isPaused) {
		request.begin();
	} else {
		request.clear();
		if (Log.isLoggable(TAG, Log.VERBOSE)) {
			Log.v(TAG, "Paused, delaying request");
		}
		pendingRequests.add(request);//等待运行的队列
	}
}
```

```java
public interface Request {
	/ Starts an asynchronous load. */
	void begin();
	//......
}
```

### 3、SingleRequest.bigin
最终执行的是Request.begin，但是Request是个接口，所以要找他的实现，而我们在获取request的时候知道，最终创建的是一个SingleRequest，所以这里Request.begin即是SingleRequest.bigin，


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729213609178-0b99775b-7809-416b-bd0e-cb10d3f3aa24.png)

```java
@Override
public void begin() {
	synchronized (requestLock) {
		//......
		// Restarts for requests that are neither complete nor running can be treated as new requests
		// and can run again from the beginning.

		status = Status.WAITING_FOR_SIZE;
		if (Util.isValidDimensions(overrideWidth, overrideHeight)) {
			onSizeReady(overrideWidth, overrideHeight);
		} else {
			target.getSize(this);//用户没有设置宽和高，两次测量---->onSizeready
		}
		//......
	}
}

@Override
public void onSizeReady(int width, int height) {
	stateVerifier.throwIfRecycled();
	synchronized (requestLock) {
		//......
		loadStatus =
		engine.load(
			glideContext,
			model,
			requestOptions.getSignature(),
			this.width,
			this.height,
			requestOptions.getResourceClass(),
			transcodeClass,
			priority,
			requestOptions.getDiskCacheStrategy(),
			requestOptions.getTransformations(),
			requestOptions.isTransformationRequired(),
			requestOptions.isScaleOnlyOrNoTransform(),
			requestOptions.getOptions(),
			requestOptions.isMemoryCacheable(),
			requestOptions.getUseUnlimitedSourceGeneratorsPool(),
			requestOptions.getUseAnimationPool(),
			requestOptions.getOnlyRetrieveFromCache(),
			this,
			callbackExecutor);

		// This is a hack that's only useful for testing right now where loads complete synchronously
		// even though under any executor running on any thread but the main thread, the load would
		// have completed asynchronously.
		if (status != Status.RUNNING) {
			loadStatus = null;
		}
		if (IS_VERBOSE_LOGGABLE) {
			logV("finished onSizeReady in " + LogTime.getElapsedMillis(startTime));
		}
	}
}
```

### 4、Engine.load 活动缓存、内存缓存或者创建新的任务
调用到了Engine.load，执行引擎类的load函数

```java
public <R> LoadStatus load(
	GlideContext glideContext,
	Object model,
	Key signature,
	int width,
	int height,
	Class<?> resourceClass,
	Class<R> transcodeClass,
	Priority priority,
	DiskCacheStrategy diskCacheStrategy,
	Map<Class<?>, Transformation<?>> transformations,
	boolean isTransformationRequired,
	boolean isScaleOnlyOrNoTransform,
	Options options,
	boolean isMemoryCacheable,
	boolean useUnlimitedSourceExecutorPool,
	boolean useAnimationPool,
	boolean onlyRetrieveFromCache,
	ResourceCallback cb,
	Executor callbackExecutor) {
	long startTime = VERBOSE_IS_LOGGABLE ? LogTime.getLogTime() : 0;

	EngineKey key =
	keyFactory.buildKey(
		model,
		signature,
		width,
		height,
		transformations,
		resourceClass,
		transcodeClass,
		options);

	EngineResource<?> memoryResource;
	synchronized (this) {
		memoryResource = loadFromMemory(key, isMemoryCacheable, startTime);

		if (memoryResource == null) {
			return waitForExistingOrStartNewJob(
				glideContext,
				model,
				signature,
				width,
				height,
				resourceClass,
				transcodeClass,
				priority,
				diskCacheStrategy,
				transformations,
				isTransformationRequired,
				isScaleOnlyOrNoTransform,
				options,
				isMemoryCacheable,
				useUnlimitedSourceExecutorPool,
				useAnimationPool,
				onlyRetrieveFromCache,
				cb,
				callbackExecutor,
				key,
				startTime);
		}
	}

	// Avoid calling back while holding the engine lock, doing so makes it easier for callers to
	// deadlock.
	cb.onResourceReady(memoryResource, DataSource.MEMORY_CACHE);
	return null;
}

@Nullable
private EngineResource<?> loadFromMemory(
	EngineKey key, boolean isMemoryCacheable, long startTime) {
	if (!isMemoryCacheable) {
		return null;
	}

	EngineResource<?> active = loadFromActiveResources(key);//加载活动缓存
	if (active != null) {
		if (VERBOSE_IS_LOGGABLE) {
			logWithTimeAndKey("Loaded resource from active resources", startTime, key);
		}
		return active;
	}

	EngineResource<?> cached = loadFromCache(key);//加载内存缓存
	if (cached != null) {
		if (VERBOSE_IS_LOGGABLE) {
			logWithTimeAndKey("Loaded resource from cache", startTime, key);
		}
		return cached;
	}

	return null;
}
```

Engine先构建一个`EngineKey key =keyFactory.buildKey(model,signature,width,height,transformations,resourceClass,transcodeClass,options)`,key的作用是什么？

activity有三个ImageView,访问时不是直接访问图片，而是先找活动缓存(运行时缓存)如果没有找到，再去查找内存缓存(运行时缓存)。

查找的依据就是靠Key查找，key会生成一个很长的密文，根据宽、高、签名等生成，保证每张图片的唯一。

`memoryResource = loadFromMemory(key, isMemoryCacheable, startTime);`会查找活动缓存和内存缓存是否有该图片，如果有则命中缓存`cb.onResourceReady(memoryResource, DataSource.MEMORY_CACHE);`回调显示。

如果没有找到，`memoryResource`为null,则调用`waitForExistingOrStartNewJob`

### 5、EngineJob和DecodeJob
EngineJob是一个线程池大管家 ，DecodeJob是执行的任务

```java
private <R> LoadStatus waitForExistingOrStartNewJob(
	GlideContext glideContext,
	Object model,
	Key signature,
	int width,
	int height,
	Class<?> resourceClass,
	Class<R> transcodeClass,
	Priority priority,
	DiskCacheStrategy diskCacheStrategy,
	Map<Class<?>, Transformation<?>> transformations,
	boolean isTransformationRequired,
	boolean isScaleOnlyOrNoTransform,
	Options options,
	boolean isMemoryCacheable,
	boolean useUnlimitedSourceExecutorPool,
	boolean useAnimationPool,
	boolean onlyRetrieveFromCache,
	ResourceCallback cb,
	Executor callbackExecutor,
	EngineKey key,
	long startTime) {

	//尝试通过key和onlyRetrieveFromCache参数从jobs映射中获取一个现有的加载任务
	EngineJob<?> current = jobs.get(key, onlyRetrieveFromCache);
	//如果找到了，就将回调添加到这个任务，并记录日志，然后返回一个LoadStatus对象。
	if (current != null) {
		current.addCallback(cb, callbackExecutor);
		if (VERBOSE_IS_LOGGABLE) {
			logWithTimeAndKey("Added to existing load", startTime, key);
		}
		return new LoadStatus(cb, current);
	}
	//使用engineJobFactory创建一个新的EngineJob对象，
	//并使用decodeJobFactory创建一个新的DecodeJob对象。
	EngineJob<R> engineJob =
	engineJobFactory.build(
		key,
		isMemoryCacheable,
		useUnlimitedSourceExecutorPool,
		useAnimationPool,
		onlyRetrieveFromCache);

	DecodeJob<R> decodeJob =
	decodeJobFactory.build(
		glideContext,
		model,
		key,
		signature,
		width,
		height,
		resourceClass,
		transcodeClass,
		priority,
		diskCacheStrategy,
		transformations,
		isTransformationRequired,
		isScaleOnlyOrNoTransform,
		onlyRetrieveFromCache,
		options,
		engineJob);

	//然后将这个新的任务添加到jobs映射中，并启动它。
	jobs.put(key, engineJob);

	engineJob.addCallback(cb, callbackExecutor);
	engineJob.start(decodeJob);

	if (VERBOSE_IS_LOGGABLE) {
		logWithTimeAndKey("Started new load", startTime, key);
	}
	//返回一个包含回调和任务的LoadStatus对象
	return new LoadStatus(cb, engineJob);
}
```

如果没找到现有的加载任务，会创建并启动新任务

```java
public synchronized void start(DecodeJob<R> decodeJob) {
	this.decodeJob = decodeJob;
	GlideExecutor executor =
	decodeJob.willDecodeFromCache() ? diskCacheExecutor : getActiveSourceExecutor();
	executor.execute(decodeJob);
}
```

### 6、getNextGenerator()/SourceGenerator
在DecodeJob的run中执行runWrapped，当runReason=INITIALIZE，从代码可知stage = SOURCE，currentGenerator时获得一个新的SourceGenerator(decodeHelper, this);然后执行runGenerators

```java
class DecodeJob<R> implements DataFetcherGenerator.FetcherReadyCallback,Runnable,Comparable<DecodeJob<?>>,Poolable {
	//......
	@Override
	public void run() {
		//......
		runWrapped();
		//.......
	}

	private void runWrapped() {
		switch (runReason) {
			case INITIALIZE:
				stage = getNextStage(Stage.INITIALIZE);
				currentGenerator = getNextGenerator();
				runGenerators();
				break;
			case SWITCH_TO_SOURCE_SERVICE:
				runGenerators();
				break;
			case DECODE_DATA:
				decodeFromRetrievedData();
				break;
			default:
				throw new IllegalStateException("Unrecognized run reason: " + runReason);
		}
	}

	private Stage getNextStage(Stage current) {
		switch (current) {
			case INITIALIZE:
				return diskCacheStrategy.decodeCachedResource()
				? Stage.RESOURCE_CACHE
				: getNextStage(Stage.RESOURCE_CACHE);
			case RESOURCE_CACHE:
				return diskCacheStrategy.decodeCachedData()
				? Stage.DATA_CACHE
				: getNextStage(Stage.DATA_CACHE);
			case DATA_CACHE:
				// Skip loading from source if the user opted to only retrieve the resource from cache.
				return onlyRetrieveFromCache ? Stage.FINISHED : Stage.SOURCE;
			case SOURCE:
			case FINISHED:
				return Stage.FINISHED;
			default:
				throw new IllegalArgumentException("Unrecognized stage: " + current);
		}
	}

	private DataFetcherGenerator getNextGenerator() {
		switch (stage) {
			case RESOURCE_CACHE:
				return new ResourceCacheGenerator(decodeHelper, this);
			case DATA_CACHE:
				return new DataCacheGenerator(decodeHelper, this);
			case SOURCE:
				return new SourceGenerator(decodeHelper, this);
			case FINISHED:
				return null;
			default:
				throw new IllegalStateException("Unrecognized stage: " + stage);
		}
	}

	private void runGenerators() {
		//......
		while (!isCancelled
			   && currentGenerator != null
			   && !(isStarted = currentGenerator.startNext())) {
			stage = getNextStage(stage);
			currentGenerator = getNextGenerator();

			if (stage == Stage.SOURCE) {
				reschedule();
				return;
			}
		}
		//......
	}
}
```

### 7、SourceGenerator加载图片
在runGenerators()中，主要的代码是while中的代码，判断条件中`isStarted = currentGenerator.startNext()`会执行到


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729234053255-f15ab534-eb92-4834-bb57-6441f9521c83.png)

因为之前的currentGenerator创建的是一个SourceGenerator，

```java
@Override
  public boolean startNext() {
    if (dataToCache != null) {
      Object data = dataToCache;
      dataToCache = null;
      cacheData(data);
    }

    if (sourceCacheGenerator != null && sourceCacheGenerator.startNext()) {
      return true;
    }
    sourceCacheGenerator = null;

    loadData = null;
    boolean started = false;
    while (!started && hasNextModelLoader()) {
      loadData = helper.getLoadData().get(loadDataListIndex++);
      if (loadData != null
          && (helper.getDiskCacheStrategy().isDataCacheable(loadData.fetcher.getDataSource())
              || helper.hasLoadPath(loadData.fetcher.getDataClass()))) {
        started = true;
        startNextLoad(loadData);
      }
    }
    return started;
  }
```

`loadData = helper.getLoadData().get(loadDataListIndex++);`获取加载器

```java
List<LoadData<?>> getLoadData() {
	if (!isLoadDataSet) {
		isLoadDataSet = true;
		loadData.clear();
		List<ModelLoader<Object, ?>> modelLoaders = glideContext.getRegistry().getModelLoaders(model);
		//noinspection ForLoopReplaceableByForEach to improve perf
		for (int i = 0, size = modelLoaders.size(); i < size; i++) {
			ModelLoader<Object, ?> modelLoader = modelLoaders.get(i);
			LoadData<?> current = modelLoader.buildLoadData(model, width, height, options);
			if (current != null) {
				loadData.add(current);
			}
		}
	}
	return loadData;
}
```

当执行到DecoderHelper的getLoadData时，找具体的加载器时发现modelLoader是一个接口类，实现有非常多，如何确定是哪个实现类那？

该伏笔在Glide的构造函数内

```java
Glide(){
	//......
	//参数一:我们的类型      参数二：参数三的对象构建出 InputStream
	.append(GlideUrl.class, InputStream.class, new HttpGlideUrlLoader.Factory()) //==  String URL
	.append(Drawable.class, Drawable.class, UnitModelLoader.Factory.<Drawable>getInstance()) //== Drawable
	//......
}
```

因为我们使用的时候是`Glide.with(this).load(URL).into(imageView);`，URL是String,得到的是ImagerView,所以对应的是`.append(GlideUrl.class, InputStream.class, new HttpGlideUrlLoader.Factory()) `，对应的加载器就是HttpGlideUrlLoader

所以modelLoader的实现类就知道了， modelLoader.buildLoadData调用到HttpGlideUrlLoader.buildLoadData，最终返回的是一个HttpUrlFetcher的LoadData

```java
@Override
  public LoadData<InputStream> buildLoadData(
      @NonNull GlideUrl model, int width, int height, @NonNull Options options) {
    // GlideUrls memoize parsed URLs so caching them saves a few object instantiations and time
    // spent parsing urls.
    GlideUrl url = model;
    if (modelCache != null) {
      url = modelCache.get(model, 0, 0);
      if (url == null) {
        modelCache.put(model, 0, 0, model);
        url = model;
      }
    }
    int timeout = options.get(TIMEOUT);
    return new LoadData<>(url, new HttpUrlFetcher(url, timeout));
  }
```

代码回到SourceGenerator的startNext，继续执行如下：

```java
@Override
public boolean startNext() {
	//......
	if (loadData != null
		&& (helper.getDiskCacheStrategy().isDataCacheable(loadData.fetcher.getDataSource())
			|| helper.hasLoadPath(loadData.fetcher.getDataClass()))) {
		started = true;
		startNextLoad(loadData);
	}
	//......
}

private void startNextLoad(final LoadData<?> toStart) {
	loadData.fetcher.loadData(
		helper.getPriority(),
		new DataCallback<Object>() {
			@Override
			public void onDataReady(@Nullable Object data) {
				if (isCurrentRequest(toStart)) {
					onDataReadyInternal(toStart, data);
				}
			}

			@Override
			public void onLoadFailed(@NonNull Exception e) {
				if (isCurrentRequest(toStart)) {
					onLoadFailedInternal(toStart, e);
				}
			}
		});
}
```

#### (1) HttpUrlFetcher进行网络访问
执行到loadData.fetcher.loadData，又因为之前loadData中封装的是HttpUrlFetcher，所以执行到HttpUrlFetcher.loadData

```java
@Override
public void loadData(@NonNull Priority priority, @NonNull DataCallback<? super InputStream> callback) {
	//......
	InputStream result = loadDataWithRedirects(glideUrl.toURL(), 0, null, glideUrl.getHeaders());
	callback.onDataReady(result);
	//......
}

private InputStream loadDataWithRedirects(URL url, int redirects, URL lastUrl, Map<String, String> headers) throws IOException {
	//......
	urlConnection = connectionFactory.build(url);
	for (Map.Entry<String, String> headerEntry : headers.entrySet()) {
		urlConnection.addRequestProperty(headerEntry.getKey(), headerEntry.getValue());
	}
	urlConnection.setConnectTimeout(timeout);
	urlConnection.setReadTimeout(timeout);
	urlConnection.setUseCaches(false);
	urlConnection.setDoInput(true);
	urlConnection.setInstanceFollowRedirects(false);
	urlConnection.connect();
	stream = urlConnection.getInputStream();
	//......
	if (isHttpOk(statusCode)) {
		return getStreamForSuccessfulRequest(urlConnection);
	}
	//......
}
```

最终在HttpUrlFetcher的loadDataWithRedirects中进行网络访问,继续执行到getStreamForSuccessfulRequest。

```java
private InputStream getStreamForSuccessfulRequest(HttpURLConnection urlConnection)
      throws IOException {
    if (TextUtils.isEmpty(urlConnection.getContentEncoding())) {
      int contentLength = urlConnection.getContentLength();
      stream = ContentLengthInputStream.obtain(urlConnection.getInputStream(), contentLength);
    } else {
      if (Log.isLoggable(TAG, Log.DEBUG)) {
        Log.d(TAG, "Got non empty content encoding: " + urlConnection.getContentEncoding());
      }
      stream = urlConnection.getInputStream();
    }
    return stream;
  }
```

最后返回stream。

#### (2) 回调HTTP请求后的输入流
返回的stream在HttpUrlFetcher的loadData中被回调

```java
InputStream result = loadDataWithRedirects(glideUrl.toURL(), 0, null, glideUrl.getHeaders());
callback.onDataReady(result);
```

callback在我们SourceGenerator.startNextLoad中我们是这样传的

```java
private void startNextLoad(final LoadData<?> toStart) {
	loadData.fetcher.loadData(
		helper.getPriority(),
		new DataCallback<Object>() {
			@Override
			public void onDataReady(@Nullable Object data) {
				if (isCurrentRequest(toStart)) {
					onDataReadyInternal(toStart, data);
				}
			}

			@Override
			public void onLoadFailed(@NonNull Exception e) {
				if (isCurrentRequest(toStart)) {
					onLoadFailedInternal(toStart, e);
				}
			}
		});
}
```

所以callback.onDataReady会执行onDataReadyInternal(toStart, data);

```java
void onDataReadyInternal(LoadData<?> loadData, Object data) {
	DiskCacheStrategy diskCacheStrategy = helper.getDiskCacheStrategy();
	if (data != null && diskCacheStrategy.isDataCacheable(loadData.fetcher.getDataSource())) {
		dataToCache = data;
		// We might be being called back on someone else's thread. Before doing anything, we should
		// reschedule to get back onto Glide's thread.
		cb.reschedule();
	} else {
		cb.onDataFetcherReady(
			loadData.sourceKey,
			data,
			loadData.fetcher,
			loadData.fetcher.getDataSource(),
			originalKey);
	}
}
```

继续执行到cb.onDataFetcherReady，该callback又是个接口类，实现有两个，选择哪个呐？

先看cb是怎么来的

```java
  SourceGenerator(DecodeHelper<?> helper, FetcherReadyCallback cb) {
    this.helper = helper;
    this.cb = cb;
  }
```

还记得我们在DecodeJob中的代码吗？new SourceGenerator 的时候传的this

```java
private DataFetcherGenerator getNextGenerator() {
		switch (stage) {
			case RESOURCE_CACHE:
				return new ResourceCacheGenerator(decodeHelper, this);
			case DATA_CACHE:
				return new DataCacheGenerator(decodeHelper, this);
			case SOURCE:
				return new SourceGenerator(decodeHelper, this);
			case FINISHED:
				return null;
			default:
				throw new IllegalStateException("Unrecognized stage: " + stage);
		}
	}
```

所以这里选择DecodeJob的实现


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729235776231-54713013-b385-4793-96db-5fa4635d169d.png)

```java
@Override
public void onDataFetcherReady(
	Key sourceKey, Object data, DataFetcher<?> fetcher, DataSource dataSource, Key attemptedKey) {
	//......
	decodeFromRetrievedData();
	//......
}

private void decodeFromRetrievedData() {
    //......
	//对data进行解码
      resource = decodeFromData(currentFetcher, currentData, currentDataSource);
    //......
    if (resource != null) {
      notifyEncodeAndRelease(resource, currentDataSource);
    } else {
      runGenerators();
    }
  }
```

在decodeFromRetrievedData中进行数据解码、保存及通知

#### (3) decodeFromData 解码数据
/////////以下是解码获得resource的过程

```java
private <Data> Resource<R> decodeFromData(DataFetcher<?> fetcher, Data data, DataSource dataSource) throws GlideException {
    //......
      Resource<R> result = decodeFromFetcher(data, dataSource);
//......
      return result;
   //......
  }

  private <Data> Resource<R> decodeFromFetcher(Data data, DataSource dataSource)throws GlideException {
    LoadPath<Data, ?, R> path = decodeHelper.getLoadPath((Class<Data>) data.getClass());
    return runLoadPath(data, dataSource, path);
  }

  private <Data, ResourceType> Resource<R> runLoadPath(Data data, DataSource dataSource, LoadPath<Data, ResourceType, R> path)throws GlideException {
    //......
	  return path.load(
          rewinder, options, width, height, new DecodeCallback<ResourceType>(dataSource));
   //......
  }
```

```java
public Resource<Transcode> load(DataRewinder<Data> rewinder,@NonNull Options options,int width,int height,DecodePath.DecodeCallback<ResourceType> decodeCallback)throws GlideException {
    //......
      return loadWithExceptionList(rewinder, options, width, height, decodeCallback, throwables);
    //......
  }

private Resource<Transcode> loadWithExceptionList(DataRewinder<Data> rewinder,@NonNull Options options,int width,int height,DecodePath.DecodeCallback<ResourceType> decodeCallback,List<Throwable> exceptions)throws GlideException {
    //......
        result = path.decode(rewinder, width, height, options, decodeCallback);
      //......

    return result;
  }

public Resource<Transcode> decode(DataRewinder<DataType> rewinder,int width,int height,@NonNull Options options,DecodeCallback<ResourceType> callback)throws GlideException {
    Resource<ResourceType> decoded = decodeResource(rewinder, width, height, options);
    Resource<ResourceType> transformed = callback.onResourceDecoded(decoded);
    return transcoder.transcode(transformed, options);
  }
```

最终调用到transcoder.transcode(transformed, options);，该接口的实现类如下


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729236467507-1c46da3b-968e-4946-9786-507feb06086d.png)

这里的选择依然依据的是`Glide.with(this).load(URL).into(imageView);`

url是string,获取的是ImageView,拼接起来就是String+Bitmap

所以使用BitmapDrawableTranscoder.transcode

```java

@Nullable
@Override
public Resource<BitmapDrawable> transcode(
	@NonNull Resource<Bitmap> toTranscode, @NonNull Options options) {
	return LazyBitmapDrawableResource.obtain(resources, toTranscode);
}
```

```java

@Nullable
public static Resource<BitmapDrawable> obtain(
	@NonNull Resources resources, @Nullable Resource<Bitmap> bitmapResource) {
	if (bitmapResource == null) {
		return null;
	}
	return new LazyBitmapDrawableResource(resources, bitmapResource);
}

private LazyBitmapDrawableResource(
	@NonNull Resources resources, @NonNull Resource<Bitmap> bitmapResource) {
	this.resources = Preconditions.checkNotNull(resources);
	this.bitmapResource = Preconditions.checkNotNull(bitmapResource);
}
```

最终将网络获取的流数据解码为可以使用的格式。

### 8、decodeFromRetrievedData通知资源解码完成
回到解码返回的地方

```java
private void decodeFromRetrievedData() {
    //......
	//对data进行解码
      resource = decodeFromData(currentFetcher, currentData, currentDataSource);
    //......
    if (resource != null) {
      notifyEncodeAndRelease(resource, currentDataSource);
    } else {
      runGenerators();
    }
  }
```

继续执行notifyEncodeAndRelease

```java
private void notifyEncodeAndRelease(Resource<R> resource, DataSource dataSource) {
    //......

    notifyComplete(result, dataSource);
	//......
    onEncodeComplete();
  }
  private void notifyComplete(Resource<R> resource, DataSource dataSource) {
    setNotifiedOrThrow();
    callback.onResourceReady(resource, dataSource);
  }
```

```java
  @Override
  public void onResourceReady(Resource<R> resource, DataSource dataSource) {
    synchronized (this) {
      this.resource = resource;
      this.dataSource = dataSource;
    }
    notifyCallbacksOfResult();
  }

void notifyCallbacksOfResult() {
    //......
    engineJobListener.onEngineJobComplete(this, localKey, localResource);

    for (final ResourceCallbackAndExecutor entry : copy) {
      entry.executor.execute(new CallResourceReady(entry.cb));
    }
    decrementPendingCallbacks();
  }
```

`engineJobListener.onEngineJobComplete(this, localKey, localResource);`将资源存入活动缓存中，这里是弱引用

执行`entry.executor.execute(new CallResourceReady(entry.cb));`

```java
@Override
    public void run() {
      // Make sure we always acquire the request lock, then the EngineJob lock to avoid deadlock
      // (b/136032534).
      synchronized (cb.getLock()) {
        synchronized (EngineJob.this) {
          if (cbs.contains(cb)) {
            // Acquire for this particular callback.
            engineResource.acquire();
            callCallbackOnResourceReady(cb);
            removeCallback(cb);
          }
          decrementPendingCallbacks();
        }
      }
    }
```

```java
void callCallbackOnResourceReady(ResourceCallback cb) {
    //......
      cb.onResourceReady(engineResource, dataSource);
    //......
  }
```

```java
public void onResourceReady(Resource<?> resource, DataSource dataSource) {
    //......
        onResourceReady((Resource<R>) resource, (R) received, dataSource);
     //......
  }
private void onResourceReady(Resource<R> resource, R result, DataSource dataSource) {
    //......
    isCallingCallbacks = true;
    try {
      boolean anyListenerHandledUpdatingTarget = false;
      if (requestListeners != null) {
        for (RequestListener<R> listener : requestListeners) {
          anyListenerHandledUpdatingTarget |=
              listener.onResourceReady(result, model, target, dataSource, isFirstResource);
        }
      }
      anyListenerHandledUpdatingTarget |=
          targetListener != null
              && targetListener.onResourceReady(result, model, target, dataSource, isFirstResource);

      if (!anyListenerHandledUpdatingTarget) {
        Transition<? super R> animation = animationFactory.build(dataSource, isFirstResource);
        target.onResourceReady(result, animation);
      }
    } finally {
      isCallingCallbacks = false;
    }

    notifyLoadSuccess();
  }
```

### 9、回调给具体的target设置资源
target.onResourceReady(result, animation);target又有很多实现类


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729237564934-80d34a5b-99a6-4104-90e6-9b3bf004abf4.png)

这里还是依据我们`Glide.with(this).load(URL).into(imageView);`，显然选择ImageViewTarget

```java
  @Override
  public void onResourceReady(@NonNull Z resource, @Nullable Transition<? super Z> transition) {
    if (transition == null || !transition.transition(resource, this)) {
      setResourceInternal(resource);
    } else {
      maybeUpdateAnimatable(resource);
    }
  }

  private void setResourceInternal(@Nullable Z resource) {
    // Order matters here. Set the resource first to make sure that the Drawable has a valid and
    // non-null Callback before starting it.
    setResource(resource);
    maybeUpdateAnimatable(resource);
  }
```

setSource这里选择DrawableImageViewTarget


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729237665519-0efc837d-1efd-4dd7-862b-3df81c0f0138.png)

```java
  @Override
  protected void setResource(@Nullable Drawable resource) {
    view.setImageDrawable(resource);
  }
```

所以图片就设置到了view上。

## 五、Glide整体简化图

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729239327540-15d10712-f563-433a-945a-c0aa12930965.png)

## 六、问题
1.项目中大量的使用了Glide，偶尔会出现内存溢出问题，大概是什么原因？

答：尽量在with的时候，传入有生命周期的作用域(非Application作用域)，尽量避免使用了Application作用域，因为Application作用域不会对页面绑定生命周期机制，就回收不及时释放操作等

2.使用Glide为什么要加入网络权限？ `<uses-permission android:name="android.permission.INTERNET" />`

答：等待队列/运行队列 执行Request ---> 活动缓存 --->内存缓存 ---> jobs.get检测执行的任务有没有执行完成 ---> HttpUrlFetcher.HttpURLConnection

3.使用Glide时，with函数在子线程中，会有什么问题？

答：子线程，不会去添加 生命周期机制， 主线程才会添加 空白的Fragment 去监听 Activity Fragment 的变化。

4.使用Glide时，with函数传入Application后，Glide内部会怎么处理？

答：在MainActivity中，MainActivity销毁了，并会让Glide生命周期机制处理回收，只有在整个APP应用都没有的时候，跟随着销毁（上节课 ApplicationLIfecycle add onStart  onDestroy 什么事情都没有做）。

5.Glide源码里面的缓存，为什么要有 活动缓存 还需要 有内存缓存？


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729475786885-8ba36192-7a3c-42fe-ad03-d211da4544bc.png)

首先活动缓存和内存缓存都是运行时缓存，都属于内存缓存领域，活动缓存也可以叫活动资源、活跃缓存、前台缓存，LRU缓存也可以说内存缓存、二级缓存等等，

LRU内存缓存，假设maxSize设置为3，LRU使用最少使用算法，每次移除时选择最少使用的元素移除，当MainActivity添加ImageView的时候，添加了三张图片显示，达到缓存的最大值，当继续添加时，LRU缓存会丢掉一个，并且是彻底释放资源，假如是图片1，那么我们原来显示的图片1显示就崩溃了，所以glide搞了个活动缓存，这个活动缓存一定不是LRU的，否则还会出现刚才的问题，通过弱引用存储使用的数据，当加载的时候，第一步先加载活动缓存，如果没有，就去加载内存缓存，如果存在的话，就把内存缓存的数据放到活动缓存里，然后把内存缓存的数据删掉，当activity关闭时，再把显示的图片数据从活动缓存移除，放到内存缓存里，等到activity重新打开加载时，再次去查找如第一次加载时。

## 七、Glide的缓存机制

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1729483057150-983ea236-0305-4d87-8a9d-e57253783894.png)

> 参考：[Android 【手撕Glide】--Glide缓存机制（精简总结）](https://www.jianshu.com/p/ba7f38ede854)
>

为什么要缓存？

1.减少流量消耗，加快响应速度

2.Bitmap的创建/销毁比较耗内存，可能会导致频繁GC；使用缓存可以更加高效的加载Bitmap，减少卡顿

### 1、Glide的缓存结构
首先明确一点，Glide是三级缓存。
缓存是`内存--->磁盘--->网络`这样的方式去获取图片资源的，但这就是3级缓存吗？明显不是，这个只是2级缓存；Glide也是按照这种策略来获取图片的，但是还略有不同，Glide将它的缓存分为2个大的部分，一个是内存缓存，一个是硬盘缓存。其中内存缓存又分为2种，弱引用（正在使用的资源）和Lrucache(Least Recently Used的缩写，意思是最近最少使用)；磁盘缓存就是DiskLrucache，DiskLrucache算法和Lrucache差不多的，所以现在看起来Glide3级缓存的话应该是`WeakReference + Lrucache + DiskLrucache`。
内存缓存的主要作用是防止应用重复将图片数据读取到内存当中；而硬盘缓存的主要作用是防止应用重复从网络或其他地方下载和读取数据。

### 2、Glide的缓存Key
缓存是为了解决重复加载问题，那必然要有一个key来区分不同的图片资源。决定缓存Key的参数有很多种，其中包括图片URL、宽、高等。
这里可以得出一个结论，几乎任意配置的改变都会导致同一张图片生成多个缓存key。
举个例子：同一张图片加载到2个不同大小的ImageView会生成2个缓存图片。

### 3、Glide的缓存的读写
前面提到过内存缓存是通过`弱引用+LruCache`的方式实现的。

+ 弱引用是由一个HashMap维护，key是上述的缓存key，这个key由图片url、width、height等10来个参数组成；value是图片资源对象的弱引用形式。

```java
Map<Key, ResourceWeakReference> activeEngineResources = new HashMap<>();
```

+ LruCache是由一个LinkedHashMap维护，根据Lru算法来管理图片。
大致的原理是利用LinkedHashMap链表的特性，把最近使用过的文件插入到列表头部，没使用的图片放在尾部；然后当图片大小到达预先设置的一个阀值的时候 ，按算法删除列表尾部的部分数据。

```java
#LruCache
Map<T, Y> cache = new LinkedHashMap<>(100, 0.75f, true);
```

+ DiskLruCache也是类似原理。由于篇幅有限，这里不讲解LruCache和DiskLruCache的底层原理，这里推荐一篇文章 [https://www.jianshu.com/p/8f4f58b4b8ab](https://www.jianshu.com/p/8f4f58b4b8ab)

### 4、内存缓存原理

![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1729482224479-57476926-f3b8-4045-8690-5ad81a3320d6.webp)


读数据

在内存缓存中有一个概念叫图片引用资源计数器 ，抽象来说，就是在EngineResource中定义一个acquired变量用来记录图片被引用的次数，调用acquire()方法会让变量加1，调用release()方法会让变量减1。
获取图片资源是先从弱引用取缓存，拿到的话，引用计数+1；
没有的话从LruCache中拿缓存，拿到的话，从LruCache中删除这张图片，引用计数也是+1，同时把图片从LruCache缓存转移到弱应用缓存池中；（这里如果再次读取就可以直接从弱引用中获取了）
再没有的话就通过EngineJob开启线程池去加载图片，拿到的话，引用计数也是+1，会把图片放到弱引用。（但这是后话了）

写数据
很明显，这是加载图片之后的事情。通过EngineJob开启线程池去加载图片，取到数据之后，会回调到主线程，把图片存到弱引用。
当图片不再使用的时候，比如说暂停请求或者加载完毕或者清除资源时，就会将其从弱引用中转移到LruCache缓存池中。

总结就是正在使用中的图片使用弱引用来进行缓存，暂时不用的图片使用LruCache来进行缓存的功能;同一张图片只会出现在弱引用和LruCache中的一个。这里我们也要注意到先后顺序，先到弱引用，再到LruCache.

这里我们可以关注一个问题：
为什么要使用弱引用，而不是直接使用LruCache?

1、避免正在使用的图片被回收
2、分压策略，减少Lrucache 中trimToSize(移除最老的数据)的概率。
3、提高效率：弱引用用的是HashMap，Lrucache用的是LinkedHashMap,从访问效率而言，肯定是HashMap更高。

### 5、磁盘缓存原理（DiskLruCache）
#### (1) Glide磁盘缓存策略（4.x）
+ DiskCacheStrategy.DATA: 只缓存原始图片；
+ DiskCacheStrategy.RESOURCE:只缓存转换过后的图片；
+ DiskCacheStrategy.ALL:既缓存原始图片，也缓存转换过后的图片；对于远程图片，缓存 DATA和 RESOURCE；对于本地图片，只缓存 RESOURCE；
+ DiskCacheStrategy.NONE：不缓存任何内容；
+ DiskCacheStrategy.AUTOMATIC：默认策略，尝试对本地和远程图片使用最佳的策略。当下载网络图片时，使用DATA(原因很简单，对本地图片的处理可比网络要容易得多)；对于本地图片，使用RESOURCE。

如果在内存缓存中没获取到数据会通过EngineJob开启线程池去加载图片，也就是刚才说的后话。
这里有2个关键类：DecodeJob 和EngineJob。EngineJob 内部维护了线程池，用来管理资源加载，当资源加载完毕的时候通知回调；DecodeJob是线程池中的一个任务。

磁盘缓存是通过DiskLruCache来管理的，根据不同的缓存策略，会有2种类型的图片，DATA(原始图片)和 RESOURCE（转换后的图片）。

磁盘缓存依次通过ResourcesCacheGenerator、SourceGenerator、DataCacheGenerator来获取缓存数据。
ResourcesCacheGenerator获取的是转换过的缓存数据；
SourceGenerator获取的是未经转换的原始的缓存数据；
DataCacheGenerator是通过网络获取图片数据再按照按照缓存策略的不同去缓存不同的图片到磁盘上。

### 6、总结
Glide缓存分为弱引用+ LruCache+ DiskLruCache，其中读取数据的顺序是：弱引用 > LruCache > DiskLruCache>网络；写入缓存的顺序是：网络 --> DiskLruCache--> 弱引用-->LruCache

内存缓存分为弱引用的和 LruCache ，其中正在使用的图片使用弱引用缓存，暂时不使用的图片用 LruCache缓存，这一点是通过 图片引用计数器（acquired变量）来实现的。

磁盘缓存就是通过DiskLruCache实现的，根据缓存策略的不同会获取到不同类型的缓存图片。
它的逻辑是：先从转换后的缓存中取；没有的话再从原始的（没有转换过的）缓存中拿数据；再没有的话就从网络加载图片数据，获取到数据之后，再依次缓存到磁盘和弱引用。

再度回顾一下这个流程。


![](https://cdn.nlark.com/yuque/0/2024/webp/29215582/1729482246620-0678e8e7-ab00-4a84-9660-ae5eb4430322.webp)

> 注意：关于缓存的存取的入口在`Engine`这个类中
>

弱引用我们称之为活动缓存、活跃缓存、活跃资源等等，

LruCache我们简单叫做内存缓存，

DiskLruCache我们叫做磁盘缓存。

总结缓存读取过程：

1. 第一次冷启动应用打开activity，活动缓存、内存缓存、磁盘缓存中都没有图片资源，所以去网络下载图片并保存到磁盘缓存中（/sd/disk_lru_cache_dir/key），并且拷贝活动缓存中。
2. activity关闭时，释放资源，图片从活动缓存中释放，移除并添加到内存缓存中，
3. 重新打开activity时，活动缓存中无图片资源，加载内存缓存中的图片成功。
4. 杀掉app，释放资源，因为app被杀掉，所以活动缓存和内存缓存的资源都释放掉，活动缓存和内存缓存都是运行时内存，进程挂掉就没了。
5. 首次冷启动打开activity，活动缓存和磁盘缓冲中都没有东西，加载磁盘缓存时找到资源，将图片资源从磁盘缓存中释放并添加到活动缓存中，

再次关闭打开activity时缓存的命中和释放如之前步骤2、3。

