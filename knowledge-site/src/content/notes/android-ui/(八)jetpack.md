## 一、ViewModel的理解
主要用于分离视图（View）和模型（Model）的逻辑，以提高代码的可维护性、可测试性和可扩展性，为视图提供数据，并将视图的交互逻辑转换为对模型的操作。

+ 解耦视图和数据：ViewModel 将视图的显示逻辑与数据的获取和处理逻辑分离。视图不再直接依赖模型，而是通过 ViewModel 获取数据。这种解耦使得代码更加清晰，便于维护和扩展。
+ 生命周期管理：ViewModel 的生命周期与视图的生命周期解耦。例如，在 Android 中，ViewModel 的生命周期比 Activity 或 Fragment 更长，它不会随着屏幕旋转或配置更改而被销毁。这使得 ViewModel 可以在配置更改时保留数据，避免重复加载。
+ 数据持久化：ViewModel 可以在用户离开页面后保存数据，当用户返回时，数据仍然可用。这减少了数据加载的延迟，提升了用户体验。
+ 数据绑定：ViewModel 通过数据绑定框架（如 Android 的 DataBinding 或 iOS 的 KVO）将数据与视图绑定。当数据发生变化时，视图会自动更新。
+ 事件处理：ViewModel 接收视图的事件（如按钮点击），并将其转换为对模型的操作。操作完成后，ViewModel 再将结果反馈给视图。
+ 异步处理：ViewModel 通常会与异步任务（如网络请求或数据库操作）结合使用。它可以通过回调、LiveData（在 Android 中）或其他响应式编程工具来处理异步数据。

## 二、viewmodel横屏竖屏切换时数据不丢失为什么
ViewModel 的生命周期与 Activity 或 Fragment 的生命周期解耦。当屏幕方向发生变化（如横竖屏切换）时，Activity 或 Fragment 会被销毁并重新创建，但 ViewModel 的实例不会被销毁。

+ 在屏幕旋转时，Activity 的生命周期会经历 `onPause` -> `onStop` -> `onDestroy` -> `onCreate` -> `onStart` -> `onResume` 的过程。
+ 而 ViewModel 的实例会通过 `ViewModelProvider` 从 `ViewModelStore` 中获取，`ViewModelStore` 会在配置变化时保留数据。

ViewModel 的数据存储在 `ViewModelStore` 中，这是一个独立于 Activity/Fragment 的存储容器。`ViewModelStore` 会在屏幕旋转时通过 `NonConfigurationInstances` 机制保留。

+ 当 Activity 被销毁并重新创建时，`ViewModelProvider` 会从 `ViewModelStore` 中获取之前保存的 ViewModel 实例，而不是重新创建一个新的实例。

`ViewModelProvider` 是获取 ViewModel 的入口，它通过 `ViewModelStoreOwner` 接口来管理 `ViewModelStore`。`ViewModelStoreOwner` 由 Activity 或 Fragment 实现，确保在配置变化时保留 `ViewModelStore`。

看代码

```java
public ViewModelProvider(@NonNull ViewModelStoreOwner owner) {
        // 获取 owner 对象的 ViewModelStore 对象
        this(owner.getViewModelStore(), owner instanceof HasDefaultViewModelProviderFactory
                ? ((HasDefaultViewModelProviderFactory) owner).getDefaultViewModelProviderFactory()
                : NewInstanceFactory.getInstance());
    }
```

viewmodelprovider的参数是ViewModelStoreOwner，但是我们传入的是MainActivity啊，

看代码

```java
public class ComponentActivity extends androidx.core.app.ComponentActivity implements
        ...
        // 实现了 ViewModelStoreOwner 接口
        ViewModelStoreOwner,
        ...{
    private ViewModelStore mViewModelStore;
​
    // 重写了 ViewModelStoreOwner 接口的唯一的方法 getViewModelStore()
    @NonNull
    @Override
    public ViewModelStore getViewModelStore() {
        if (getApplication() == null) {
            throw new IllegalStateException("Your activity is not yet attached to the "
                    + "Application instance. You can't request ViewModel before onCreate call.");
        }
        ensureViewModelStore();
        return mViewModelStore;
    }
```

ComponentActivity 类实现了 ViewModelStoreOwner 接口，

ViewModelProvider 构造方法里调用了 this(ViewModelStore, Factory)，将 ComponentActivity#getViewModelStore 返回的 ViewModelStore 实例传了进去，并缓存到 ViewModelProvider 中

```java
public ViewModelProvider(@NonNull ViewModelStore store, @NonNull Factory factory) {
        mFactory = factory;
        // 缓存 ViewModelStore 对象
        mViewModelStore = store;
    }
```

而ViewModelStore被缓存在了NonConfigurationInstances 中，是 ComponentActivity 的静态内部类，NonConfigurationInstances 中

+ onRetainNonConfigurationInstance 方法和 getLastNonConfigurationInstance 是成对出现的，跟 onSaveInstanceState（Bundle）机制类似，只不过它是仅用作处理配置更改的优化。
+ 返回的是 onRetainNonConfigurationInstance 返回的对象

Activity 在因配置更改而销毁重建过程中会先调用 onRetainNonConfigurationInstance 保存 viewModelStore 实例。 在重建后可以通过 getLastNonConfigurationInstance 方法获取之前的 viewModelStore 实例。

### 1、什么时候 ViewModel#onCleared() 会被调用
当 Lifecycle.Event == Lifecycle.Event.ON_DESTROY，并且 isChangingConfigurations() 返回 false 时才会调用 ViewModelStore#clear 。然后遍历ViewModelStore 的 mMap 并调用 ViewModel 对象的 clear() isChangingConfigurations 用来检测当前的 Activity 是否因为 Configuration 的改变被销毁了, 配置改变返回 true，非配置改变返回 false。

[https://zhuanlan.zhihu.com/p/458663693](https://zhuanlan.zhihu.com/p/458663693)

## 三、livedata用过吗？livedata的setvalue和postvalue的区别？如何避免LiveData的粘性事件在特定场景中引发的问题?
+ `setValue(T value)`：只能在主线程中调用,直接在主线程中同步更新 `LiveData` 的值，并立即通知所有活动的观察者。如果在子线程中调用，会抛出 `IllegalStateException` 异常。
+ `postValue(T value)`：可以在任何线程中调用，包括主线程和子线程。它会将更新请求放入消息队列中，等待主线程空闲时处理。被调用时,通过handler切换到主线程，再调用 setValue

### 1、如何避免 LiveData 的粘性事件问题
+ 原因：当观察者注册时，`LiveData` 会立即通知观察者当前的值，即使这个值是之前已经设置过的。这在某些场景下可能导致问题，比如重复通知或数据倒灌。
+ 表现：如果在短时间内多次调用 `postValue` 或 `setValue`，可能会导致观察者只收到最后一次更新的通知。

示例

存在两个Activity,分别为FirstActivity和SecondActivity, 我们在FirstActivity中先发射了数据，然后进入了SecondActivity中，在SecondActivity中监听LiveData的变化，但是我们会很惊奇的发现，SecondActivity在FirstActivity发射之后才注册监听LiveData的事件，居然也能收到以前的发射数据。这就有些和我们的尝试相悖了，我们一般的常识，是先注册监听事件了才会有事件回调，并且注册事件是不管之前发生的逻辑的。

### 2、反射
由setValue源码可以知道，当version不同时，就会更新数据，所以想在observer调用前的setValue方法不被分发出去，只需要在调用observer之前的某个节点处改，变使其mLastVersion = mVersion即可。通过源码我们发现可以通过反射在observer中找到mObservers对象和当前mVersion，然后便可以在这里将mVersion赋值给mLastVersion。

```java
private void hook(@NonNull Observer observer) throws Exception {
            //get wrapper's version
            Class classLiveData = LiveData.class;
            Field fieldObservers = classLiveData.getDeclaredField("mObservers");
            fieldObservers.setAccessible(true);
            Object objectObservers = fieldObservers.get(this);
            Class> classObservers = objectObservers.getClass();
            Method methodGet = classObservers.getDeclaredMethod("get", Object.class);
            methodGet.setAccessible(true);
            Object objectWrapperEntry = methodGet.invoke(objectObservers, observer);
            Object objectWrapper = null;
            if (objectWrapperEntry instanceof Map.Entry) {
                objectWrapper = ((Map.Entry) objectWrapperEntry).getValue();
            }
            if (objectWrapper == null) {
                throw new NullPointerException("Wrapper can not be bull!");
            }
            Class> classObserverWrapper = objectWrapper.getClass().getSuperclass();
            Field fieldLastVersion = classObserverWrapper.getDeclaredField("mLastVersion");
            fieldLastVersion.setAccessible(true);
            //get livedata's version
            Field fieldVersion = classLiveData.getDeclaredField("mVersion");
            fieldVersion.setAccessible(true);
            Object objectVersion = fieldVersion.get(this);
            //set wrapper's version
            fieldLastVersion.set(objectWrapper, objectVersion);
        }
    }
```

重写`LiveData`,将这个hook方法放在`observe`方法中。

### 3、SingleLiveEvent
其实这个方法解决的并不是粘性事件的问题，而是“数据倒灌”的问题。“数据倒灌”一词出自KunMinX的Blog重学安卓：LiveData 数据倒灌 背景缘由全貌 独家解析,即在setValue后,observe对此次set的value值会进行多次消费。比如进行第二次observe的时候获取到的数据是第一次的旧数据。这样会带来不可预期的后果。SingleLiveEvent的思路是，在每次onChanged触发时，会通过一个布尔值mPending来判断上一次的setValue事件有没有被消费，如果被消费过了，则不再将消费传递下去。

### 4、UnPeekLiveData
KunMinX大神所开源的一个解决此类问题的方法。

思路也很清晰，为每个传入的observer对象携带一个布尔类型的值，作为其是否能进入observe方法的开关。每当有一个新的observer存进来的时候，开关默认关闭。

每次setValue后，打开所有Observer的开关，允许所有observe执行。

同时方法进去后，关闭当前执行的observer开关，即不能对其第二次执行了，除非你重新setValue。

通过这种机制，使得 不用反射技术实现LiveData的非粘性态 成为了可能。

```java
public class ProtectedUnPeekLiveData extends LiveData {

    protected boolean isAllowNullValue;

    private final HashMap observers = new HashMap();

    public void observeInActivity(@NonNull AppCompatActivity activity, @NonNull Observer super T> observer) {
        LifecycleOwner owner = activity;
        Integer storeId = System.identityHashCode(observer);//源码这里是activity.getViewModelStore()，是为了保证同一个ViewModel环境下"唯一可信源"
        observe(storeId, owner, observer);
    }

    private void observe(@NonNull Integer storeId,
                         @NonNull LifecycleOwner owner,
                         @NonNull Observer super T> observer) {

        if (observers.get(storeId) == null) {
            observers.put(storeId, true);
        }

        super.observe(owner, t -> {
            if (!observers.get(storeId)) {
                observers.put(storeId, true);
                if (t != null || isAllowNullValue) {
                    observer.onChanged(t);
                }
            }
        });
    }

    @Override
    protected void setValue(T value) {
        if (value != null || isAllowNullValue) {
            for (Map.Entry entry : observers.entrySet()) {
                entry.setValue(false);
            }
            super.setValue(value);
        }
    }

    protected void clear() {
        super.setValue(null);
    }
}

```

粘性：具体代码中指的是，先setValue/postValue,后调用observe(),如果成功收到了回调，即为粘性事件。

数据倒灌：“数据倒灌”一词最先由大佬KunMinX提出，虽然给出了示例，但并没有给出文字定义。我的理解是，先setValue/postValue,后调用observe(new Obs())，至此收到了回调。然后再第二次调用observe(new anotherObs()),如果还能收到第一次的回调，则为“数据倒灌”。

所以只要将LiveData变为“非粘性”的，就一定不会出现数据倒灌的问题了。再看以上四种方法所解决的问题。

## 四、LiveData如何避免内存泄漏?
当一个长生命周期的对象引用了一个短生命周期的对象，就会产生内存泄漏。LiveData订阅后，在页面销毁后可以自动取消订阅。

## 五、为什么LiveData可以自动取消订阅？
如果一个Observer的生命周期处于STARTED或RESUMED状态，那么LiveData将认为这个Observer处于活跃状态.LiveData仅通知活跃的Observer去更新UI。非活跃状态的Observer，即使订阅了LiveData，也不会收到更新的通知。

结合一个实现了LifecycleOwner接口的对象，你能注册一个Observer。这种结合关系使得当具有生命周期的对象的状态变为DESTROYED时，Observer将被取消订阅。这对于活和片段尤其有用，因为它们可以安全地订阅LiveData对象，而不必担心内存泄漏 - 当活和片段生命周期为DESTROYED时，它们立即会被取消订阅。

## 六、livedata传相同的值会不会执行onchanged回调?
当我们给liveData设置value时，Observer就会更新。但如果我们两次设置一样的value，Observer是否会更新？

看看setValue方法

```java
@MainThread
    protected void setValue(T value) {
        assertMainThread("setValue");
        mVersion++;
        mData = value;
        dispatchingValue(null);
    }

void dispatchingValue(@Nullable ObserverWrapper initiator) {
        ....
        considerNotify(initiator);
        ....
    }

private void considerNotify(ObserverWrapper observer) {
        if (!observer.mActive) {
            return;
        }
        // Check latest state b4 dispatch. Maybe it changed state but we didn't get the event yet.
        //
        // we still first check observer.active to keep it as the entrance for events. So even if
        // the observer moved to an active state, if we've not received that event, we better not
        // notify for a more predictable notification order.
        if (!observer.shouldBeActive()) {
            observer.activeStateChanged(false);
            return;
        }
        if (observer.mLastVersion >= mVersion) {
            return;
        }
        observer.mLastVersion = mVersion;
        observer.mObserver.onChanged((T) mData);
    }
```

到这里一目了然，只要mVersion是大于等于之前的值，就会回调onChanged方法，也就是说，不管值是否相同，只看version的值，也就是基本只有int到达最大值的时候才会导致bug，2的31次方-1，估计只有无聊的人才会写改这么多次值的代码了。

## 七、LiveDataBus实现
### 1、为什么要使用LiveData来实现通信总线？
LiveData具有的这种可观察性和生命周期感知的能力，使其非常适合作为Android通信总线的基础构件。使用者不用显示调用反注册方法。

由于LiveData具有生命周期感知能力，所以LiveDataBus只需要调用注册回调方法，而不需要显示的调用反注册方法。这样带来的好处不仅可以编写更少的代码，而且可以完全杜绝其他通信总线类框架（如EventBus、RxBus）忘记调用反注册所带来的内存泄漏的风险。

### 2、为什么要用LiveDataBus替代EventBus和RxBus?
+ LiveDataBus的实现及其简单 相对EventBus复杂的实现，LiveDataBus只需要一个类就可以实现。
+ LiveDataBus可以减小APK包的大小 由于LiveDataBus只依赖Android官方Android Architecture Components组件的LiveData，没有其他依赖，本身实现只有一个类。作为比较，EventBus JAR包大小为57kb，RxBus依赖RxJava和RxAndroid，其中RxJava2包大小2.2MB，RxJava1包大小1.1MB，RxAndroid包大小9kb。使用LiveDataBus可以大大减小[APK包](https://zhida.zhihu.com/search?content_id=169328837&content_type=Article&match_order=2&q=APK%E5%8C%85&zhida_source=entity)的大小。
+ LiveDataBus依赖方支持更好 LiveDataBus只依赖Android官方Android Architecture Components组件的LiveData，相比RxBus依赖的RxJava和RxAndroid，依赖方支持更好。
+ LiveDataBus具有生命周期感知 LiveDataBus具有生命周期感知，在Android系统中使用调用者不需要调用反注册，相比EventBus和RxBus使用更为方便，并且没有内存泄漏风险。

### 3、LiveData实现[事件总线](https://zhida.zhihu.com/search?content_id=169328837&content_type=Article&match_order=1&q=%E4%BA%8B%E4%BB%B6%E6%80%BB%E7%BA%BF&zhida_source=entity)的坑
由于LiveData的粘性特性，用LiveData实现LiveDataBus，订阅者会收到订阅之前发布的消息。对于一个消息总线来说，这是不可接受的。无论EventBus或者RxBus，订阅方都不会收到订阅之前发出的消息。对于一个消息总线，LiveDataBus必须要解决这个问题。

