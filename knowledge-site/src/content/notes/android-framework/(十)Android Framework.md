## 一、Android的ANR机制
## 二、android四大组件(以及Application)的oncreate/onReceiver方法中Thread.sleep()会产生几个ANR
+ Activity的`onCreate`方法：调用`Thread.sleep()`超过5秒会导致ANR。
+ Service的`onCreate`方法：调用`Thread.sleep()`超过20秒会导致ANR。
+ BroadcastReceiver的`onReceive`方法：调用`Thread.sleep()`超过10秒（前台广播）或60秒（后台广播）会导致ANR。
+ ContentProvider的`onCreate`方法：调用`Thread.sleep()`不会导致ANR。
+ Application的`onCreate`方法：调用`Thread.sleep()`不会导致ANR。
+ 输入事件：调用`Thread.sleep()`超过5秒会导致ANR。

## 三、为什么Application和ContentProvider的onCreate阻塞不会ANR
+ ANR的触发条件：ANR通常是因为主线程在处理用户交互时被阻塞，导致用户界面无法及时响应用户的操作。例如，`Activity`的`onCreate`方法中调用`Thread.sleep()`会导致主线程阻塞，从而影响用户界面的初始化和显示。
+ `Application`的特殊性：`Application`的`onCreate`方法在应用启动时调用，此时应用尚未进入用户交互阶段，主线程的阻塞不会直接影响用户界面的响应性。因此，即使在`Application`的`onCreate`方法中调用`Thread.sleep()`，也不会触发ANR。
+ `ContentProvider`的特殊性：`ContentProvider`的`onCreate`方法主要用于初始化数据提供者，不会直接影响用户界面的响应性。即使在`onCreate`方法中调用`Thread.sleep()`，也不会触发ANR。不过，如果`ContentProvider`的其他方法（如`query`、`insert`等）在主线程中被调用并阻塞，可能会导致ANR。

## 四、说一下android handler消息机制原理
### 1、介绍
[handler消息机制详解](https://zhuanlan.zhihu.com/p/215764318)

### 2、回答
Handler消息机制主要涉及到了四个类Handler，Message，MessageQueue以及Looper，协作运行完成消息的传递。大体概括下四个类就是：

handler是消息机制的上层接口，消息的辅助类，主要向消息池发送各种消息事件(Handler.sendMessage)和处理消息事件(Handler.handleMessage)，内部有一个Looper和Messagequeue的引用；

Message就是需要传递的消息，数据，内部有一个目标Handler的引用，保证当前的Message由哪个handler处理；

MessageQueue：消息队列，但是它的内部实现并不是用的队列，实际上是通过一个单链表的数据结构来维护Message列表，因为单链表在插入和删除上比较有优势。主要功能向消息池投递消息(MessageQueue.enqueueMessage)和取走消息池的消息(MessageQueue.next)；

Looper：不断循环执行(Looper.loop)，从MessageQueue中读取消息，按分发机制将消息分发给目标处理者，每一个Looper的创建都是保存在ThreadLocal的，且每个线程存在Looper后就不允许重复创建了,Looper中存在MessageQueue的引用，所以每一个线程都只能有一个Looper和一个MessageQueue，这也是保证消息在不同线程间传递的一个关键点。

熟知的使用handler的过程就是主线程定义一个Hander对象，子线程处理耗时逻辑后通过这个handler对象调用MessageQueue的enqueueMessage，向消息队列中添加消息，当通过Looper.loop开启循环后，会不断地从线程池中读取消息，即调用MessageQueue.next，然后调用目标Handler（即发送该消息的Handler）的dispatchMessage方法传递消息，然后返回到Handler所在线程，目标Handler收到消息，调用handleMessage方法，接收消息，处理消息。

发送消息有几种方式(post()方式或send())，但是归根结底都是调用了sendMessageAtTime()方法,而sendMessageAtTime就调用了MessageQueue的enqueueMessage方法。

分发消息流程：

```java
public void dispatchMessage(Message msg) {
    if (msg.callback != null) {
        //当Message存在回调方法，回调msg.callback.run()方法；
        handleCallback(msg);
    } else {
        if (mCallback != null) {
            //当Handler存在Callback成员变量时，回调方法handleMessage()；
            if (mCallback.handleMessage(msg)) {
                return;
            }
        }
        //Handler自身的回调方法handleMessage()
        handleMessage(msg);
    }
}
private static void handleCallback(Message message) {
        message.callback.run();
    }
```

当Message的msg.callback不为空时，则回调方法msg.callback.run();

当Handler的mCallback不为空时，则回调方法mCallback.handleMessage(msg)；

最后调用Handler自身的回调方法handleMessage()，该方法默认为空，Handler子类通过覆写该方法来完成具体的逻辑。

消息分发的优先级：

Message的回调方法：message.callback.run()，优先级最高；

Handler中Callback的回调方法：Handler.mCallback.handleMessage(msg)，优先级仅次于1；

Handler的默认方法：Handler.handleMessage(msg)，优先级最低。

对于很多情况下，消息分发后的处理方法是第3种情况，即Handler.handleMessage()，一般地往往通过覆写该方法从而实现自己的业务逻辑。

> 开发过程中，我们使用的handler.post(new Runnable(){})的方法，其实就是被默认调用了message.callback.run()方法，而我们的handler.sendMessage()，就是需要实现handleMessage方法去处理。
>
> 注意：如果子线程创建了自己的Looper和handler，消息不会被其他线程的handler接收，因为使用的不是一个MessageQueue，主线程有自己的MessageQueue，而子线程将信息放到了自己的MessageQueue里
>

## 五、handler中的延迟消息发送是怎么做到的
研究延迟消息的发送，首先要明确的是handler中维护消息队列的MessageQueue是什么样的一个数据结构，首先MessageQueue是一个单链表的数据结构，方便消息的插入和删除，当发送消息时，无论时post还是send，包括立即发送还是延迟发送，最终都是调用了sendMessageAtTime方法，

```java

public final boolean post(Runnable r)
    {
       return  sendMessageDelayed(getPostMessage(r), 0);
    }
public final boolean postAtTime(Runnable r, long uptimeMillis)
    {
        return sendMessageAtTime(getPostMessage(r), uptimeMillis);
    }
 public final boolean postAtTime(Runnable r, Object token, long uptimeMillis)
    {
        return sendMessageAtTime(getPostMessage(r, token), uptimeMillis);
    }
 public final boolean postDelayed(Runnable r, long delayMillis)
    {
        return sendMessageDelayed(getPostMessage(r), delayMillis);
    }
public final boolean sendMessage(Message msg)
    {
        return sendMessageDelayed(msg, 0);
    }
 public final boolean sendEmptyMessage(int what)
    {
        return sendEmptyMessageDelayed(what, 0);
    }
public final boolean sendEmptyMessageDelayed(int what, long delayMillis) {
        Message msg = Message.obtain();
        msg.what = what;
        return sendMessageDelayed(msg, delayMillis);
    }
 public final boolean sendEmptyMessageAtTime(int what, long uptimeMillis) {
        Message msg = Message.obtain();
        msg.what = what;
        return sendMessageAtTime(msg, uptimeMillis);
    }
 public final boolean sendMessageDelayed(Message msg, long delayMillis)
    {
        if (delayMillis < 0) {
            delayMillis = 0;
        }
        return sendMessageAtTime(msg, SystemClock.uptimeMillis() + delayMillis);
    }
```

对于立即发送的消息，调用了sendMessageAtTime(msg,0)，而对于延迟的消息则是sendMessageAtTime(msg,uptimeMillis)，该方法会调用到enqueueMessage(queue, msg, uptimeMillis);方法，会在此方法中设置message的目标handler引用，然后调用queue.enqueueMessage(msg, uptimeMillis);即向messagequeue中添加消息，

```java
public boolean sendMessageAtTime(Message msg, long uptimeMillis) {
       //其中mQueue是消息队列，从Looper中获取的
        MessageQueue queue = mQueue;
        if (queue == null) {
            RuntimeException e = new RuntimeException(
                    this + " sendMessageAtTime() called with no mQueue");
            Log.w("Looper", e.getMessage(), e);
            return false;
        }
        //调用enqueueMessage方法
        return enqueueMessage(queue, msg, uptimeMillis);
    }
private boolean enqueueMessage(MessageQueue queue, Message msg, long uptimeMillis) {
        msg.target = this;
        if (mAsynchronous) {
            msg.setAsynchronous(true);
        }
        //调用MessageQueue的enqueueMessage方法
        return queue.enqueueMessage(msg, uptimeMillis);
    }
```

MessageQueue是按照Message触发时间的先后顺序排列的，队头的消息是将要最早触发的消息。当有消息需要加入消息队列时，会从队列头开始遍历，直到找到消息应该插入的合适位置，以保证所有消息的时间顺序。

```java
boolean enqueueMessage(Message msg, long when) {
    // 每一个Message必须有一个target
    if (msg.target == null) {
        throw new IllegalArgumentException("Message must have a target.");
    }
    if (msg.isInUse()) {
        throw new IllegalStateException(msg + " This message is already in use.");
    }
    synchronized (this) {
        if (mQuitting) {  //正在退出时，回收msg，加入到消息池
            msg.recycle();
            return false;
        }
        msg.markInUse();
        msg.when = when;
        Message p = mMessages;
        boolean needWake;
        if (p == null || when == 0 || when < p.when) {
            //p为null(代表MessageQueue没有消息） 或者msg的触发时间是队列中最早的， 则进入该该分支
            msg.next = p;
            mMessages = msg;
            needWake = mBlocked;
        } else {
            //将消息按时间顺序插入到MessageQueue。一般地，不需要唤醒事件队列，除非
            //消息队头存在barrier，并且同时Message是队列中最早的异步消息。
            needWake = mBlocked && p.target == null && msg.isAsynchronous();
            Message prev;
            for (;;) {
                prev = p;
                p = p.next;
                if (p == null || when < p.when) {
                    break;
                }
                if (needWake && p.isAsynchronous()) {
                    needWake = false;
                }
            }
            msg.next = p;
            prev.next = msg;
        }
        if (needWake) {
            nativeWake(mPtr);
        }
    }
    return true;
}
```

维护了该消息队列后，Looper的loop方法会不断获取消息，主要是调用到了queue.next方法，主要是通过该方法获取下一条消息，

```java
Message next() {
    final long ptr = mPtr;
    if (ptr == 0) { //当消息循环已经退出，则直接返回
        return null;
    }
    int pendingIdleHandlerCount = -1; // 循环迭代的首次为-1
    int nextPollTimeoutMillis = 0;
    for (;;) {
        if (nextPollTimeoutMillis != 0) {
            Binder.flushPendingCommands();
        }
        //阻塞操作，当等待nextPollTimeoutMillis时长，或者消息队列被唤醒，都会返回
        nativePollOnce(ptr, nextPollTimeoutMillis);
        synchronized (this) {
            final long now = SystemClock.uptimeMillis();
            Message prevMsg = null;
            Message msg = mMessages;
            if (msg != null && msg.target == null) {
                //当消息Handler为空时，查询MessageQueue中的下一条异步消息msg，为空则退出循环。
                do {
                    prevMsg = msg;
                    msg = msg.next;
                } while (msg != null && !msg.isAsynchronous());
            }
            if (msg != null) {
                if (now < msg.when) {
                    //当异步消息触发时间大于当前时间，则设置下一次轮询的超时时长
                    nextPollTimeoutMillis = (int) Math.min(msg.when - now, Integer.MAX_VALUE);
                } else {
                    // 获取一条消息，并返回
                    mBlocked = false;
                    if (prevMsg != null) {
                        prevMsg.next = msg.next;
                    } else {
                        mMessages = msg.next;
                    }
                    msg.next = null;
                    //设置消息的使用状态，即flags |= FLAG_IN_USE
                    msg.markInUse();
                    return msg;   //成功地获取MessageQueue中的下一条即将要执行的消息
                }
            } else {
                //没有消息
                nextPollTimeoutMillis = -1;
            }
         //消息正在退出，返回null
            if (mQuitting) {
                dispose();
                return null;
            }
            ...............................
    }
}
```

在next中，会执行nativePollOnce(ptr, nextPollTimeoutMillis)方法用于阻塞当前线程，直到消息到达或者超时，nextPollTimeoutMillis指定了阻塞的超时时间，当有消息到达时会被立即唤醒，没有消息时会等到超时后nativePollOnce返回，然后会执行判断，即msg中的时间是否大于当前时间，如果是说明消息还没有到达取出的时间，那么更新nextPollTimeoutMillis并继续等待，如果已经达到msg中的时间，则取出该事件，如果没有消息，则nextPollTimeoutMillis会置为-1，线程会一直阻塞，直到新消息到来唤醒。

当loop获取到了消息，则会继续执行msg.target.dispatchMessage(msg)方法分发消息给到具体的handler,

```java
public void dispatchMessage(Message msg) {
    if (msg.callback != null) {
        //当Message存在回调方法，回调msg.callback.run()方法；
        handleCallback(msg);
    } else {
        if (mCallback != null) {
            //当Handler存在Callback成员变量时，回调方法handleMessage()；
            if (mCallback.handleMessage(msg)) {
                return;
            }
        }
        //Handler自身的回调方法handleMessage()
        handleMessage(msg);
    }
}
```

当Message的msg.callback不为空时，则回调方法msg.callback.run();

当Handler的mCallback不为空时，则回调方法mCallback.handleMessage(msg)；

最后调用Handler自身的回调方法handleMessage()，该方法默认为空，Handler子类通过覆写该方法来完成具体的逻辑。

## 六、handler如何实现线程间通信的，loop是一个死循环，是怎么做到不会阻塞主线程的
### 1、主线程和子线程的handler通信
#### (1) 主线程中创建一个全局的Handler
```java
public class MainActivity extends AppCompatActivity {
    // 创建一个全局的Handler，绑定到主线程的Looper
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        new Thread(new Runnable() {
            @Override
            public void run() {
                // 使用主线程的Handler发送消息
                mainHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        // 在主线程中执行的代码
                        Log.d("Thread", "This is running on the main thread");
                    }
                });
            }
        }).start();
    }
}
```

#### (2) 直接使用Looper.getMainLooper()
```java
new Thread(new Runnable() {
    @Override
    public void run() {
        // 获取主线程的Looper
        Looper mainLooper = Looper.getMainLooper();

        // 创建一个绑定到主线程Looper的Handler
        Handler mainHandler = new Handler(mainLooper);

        // 发送消息到主线程
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                // 在主线程中执行的代码
                Log.d("Thread", "This is running on the main thread");
            }
        });
    }
}).start();
```

### 2、Looper死循环不会产生ANR
阻塞会产生ANR，ANR指的是应用无响应,ANR主体实现在系统层。所有与ANR相关的消息，都会经过系统进程(AMS)调度，然后派发到应用进程完成对消息的实际处理，同时，系统进程设计了不同的超时限制来跟踪消息的处理。 一旦应用程序处理消息不当，超时限制就起作用了， 它收集一些系统状态，比如CPU/IO使用情况、进程函数调用栈，并且报告用户有进程无响应了(ANR对话框)。

而handler没有事情的时候，会睡眠等待将时间片交给其他handler处理。所以Looper死循环不会产生ANR。

## 七、Handler 消息屏障和Idlehandler
在 Android 的 `Handler` 机制中，同步屏障（Sync Barrier）和 `IdleHandler` 是两个重要的概念，它们在消息队列的管理和任务调度中发挥着关键作用。以下是它们的详细介绍和区别：

### 1、同步屏障（Sync Barrier）
同步屏障 是一种特殊的机制，用于在消息队列中插入一个屏障消息，从而改变消息的处理顺序。

#### (1) 工作原理
+ 屏障消息的插入：通过 `MessageQueue.postSyncBarrier()` 方法插入一个同步屏障消息。屏障消息是一个特殊的 `Message`，其 `target` 为 `null`，用于标记屏障。
+ 消息处理规则：当消息队列中存在同步屏障时，所有同步消息（`target` 不为 `null` 的消息）会被阻塞，无法处理，直到屏障被移除。只有异步消息（通过 `setAsynchronous(true)` 标记的消息）可以被处理。
+ 屏障的移除：通过 `MessageQueue.removeSyncBarrier(token)` 方法移除同步屏障。

#### (2) 应用场景
同步屏障主要用于确保某些高优先级的异步任务（如 UI 更新）能够优先处理，而不被其他同步任务阻塞。例如，在 Android 的 View 系统中，`ViewRootImpl.scheduleTraversals()` 方法会使用同步屏障来确保 UI 绘制任务能够优先执行。

---

### 2、IdleHandler
IdleHandler 是一个接口，用于在消息队列空闲时执行一些低优先级的任务。

#### (1) 工作原理
+ 注册和回调：通过 `MessageQueue.addIdleHandler()` 方法注册一个 `IdleHandler`。当消息队列中没有待处理的消息时，`IdleHandler` 的 `queueIdle()` 方法会被调用。
+ 回调返回值：`queueIdle()` 方法的返回值决定了该 `IdleHandler` 是否会继续被调用。如果返回 `true`，则在下一次消息队列空闲时继续调用；如果返回 `false`，则从消息队列中移除。

#### (2) 应用场景
+ 低优先级任务：`IdleHandler` 适合执行一些低优先级的任务，如缓存清理、日志记录等。
+ 优化性能：通过在消息队列空闲时执行任务，避免对主线程的性能造成影响。

---

### 3、同步屏障与 IdleHandler 的区别
| 特性 | 同步屏障（Sync Barrier） | IdleHandler |
| :--- | :--- | :--- |
| 作用 | 阻塞同步消息，确保异步消息优先处理 | 在消息队列空闲时执行低优先级任务 |
| 插入方式 | 通过 `MessageQueue.postSyncBarrier()`<br/> 插入 | 通过 `MessageQueue.addIdleHandler()`<br/> 注册 |
| 消息处理规则 | 同步消息被阻塞，异步消息可以处理 | 只在消息队列空闲时调用 |
| 移除方式 | 通过 `MessageQueue.removeSyncBarrier(token)`<br/> 移除 | 如果 `queueIdle()`<br/> 返回 `false`<br/>，则移除 |
| 应用场景 | 确保高优先级任务（如 UI 更新）优先执行 | 执行低优先级任务（如缓存清理） |


---

### 4、总结
+ 同步屏障 是一种用于优先处理异步消息的机制，通过阻塞同步消息来确保某些高优先级任务能够快速执行。
+ IdleHandler 是一种用于在消息队列空闲时执行低优先级任务的机制，适合处理一些非紧急的任务。
+ 两者在消息队列的管理和任务调度中发挥着不同的作用，开发者可以根据具体需求选择合适的机制来优化应用的性能和响应性。

## 八、HandlerThread的实现原理
[HandlerThread原理、使用实例、源码详细解析-CSDN博客](https://blog.csdn.net/haovin/article/details/89787721)

## 九、handler持有外部引用的内存泄漏，解决方法？
将 `Handler` 定义为静态内部类，并通过 `WeakReference` 持有外部类的引用。这样可以避免 `Handler` 阻止外部类被垃圾回收。

在 `Activity` 或 `Fragment` 的 `onDestroy` 方法中调用 `handler.removeCallbacksAndMessages(null)`，以移除所有待处理的消息和回调。

## 十、ThreadLocal是什么？底层什么原理
[史上最全ThreadLocal 详解（一）-CSDN博客](https://blog.csdn.net/u010445301/article/details/111322569)

[深挖 ThreadLocal 底层原理？它有什么用？学会之后手撕面试官_threadlocal底层详解-CSDN博客](https://blog.csdn.net/m0_70325779/article/details/133299667)

### 1、Threadlocal
首先，它是一个数据结构，有点像HashMap，可以保存"key : value"键值对，但是一个ThreadLocal只能保存一个，并且各个线程的数据互不干扰。

ThreadLocal实例的弱引用对象会作为key存放在ThreadLocalMap中，然后set方法加入的值就作为ThreadLocalMap中的value，一个线程中可以new多个ThreadLocal用于存放多个值，这些值在线程内是共享的

每一个线程都有一个ThreadLocalMap，这是一个Map，key就是ThreadLocal的弱引用，value就是ThreadLocal变量保存的值，每当一个ThreadLocal变量被声明赋值时，都会保存到该线程的ThreadLocalMap中。

示例：

主线程声明初始化一个ThreadLocal的变量，并且在各个线程打印该ThreadLocal变量的值，

```java
public class ThreadLocalTest {
    public static ThreadLocal<Long> threadLocal = ThreadLocal.withInitial(() -> Thread.currentThread().getId());

    public static void main(String[] args) throws InterruptedException {
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                System.out.println(threadLocal.get());
            }).start();
        }
        TimeUnit.SECONDS.sleep(5);
    }
}
```

结果如下：

```java
11
14
13
12
15
```

这里可能有疑惑了，1.为什么其他线程没有设置过该ThreadLocal的值，也有打印那？主要是我们使用了`ThreadLocal.withInitial` 方法初始化，后面会介绍。

首先看set的方法：

```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}
```

先获取当前的工作线程，然后拿到线程中的 ThreadLocalMap 对象，包含了1）设置；2）先创建再设置两种逻辑。

看get的方法：

```java
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}

ThreadLocalMap getMap(Thread t) {
   return t.threadLocals;
}

```

先获取当前的工作线程，然后拿到线程的 threadLocals 变量。这是一个 ThreadLocalMap 型的对象，是一个 Map 型的数据结构，实际的值就是保存在这里面。get() 方法中包含了1）获取；2）先设置值再获取两种不同的逻辑。第一次调用时，map 为空，就会先进行相关的初始化，然后再返回保存的值。

```java
private T setInitialValue() {
    T value = initialValue();
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
    return value;
}

void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

获取默认的初始值。如果前面是通过 ThreadLocal.withInitial() 方式创建的 ThreadLocal，那么这里将会调用 Supplier 中的方法来获取一个初始值；否则初始值为 null。接下来就是获取当前线程的 ThreadLocalMap 对象。如果 ThreadLocalMap 不为空，那么就将初始值放入其中；否则就创建一个 ThreadLocalMap 对象。如果在这之前，ThreadLocalMap 已经创建好了，那么要通过 set() 方法将 ThreadLocal 放入其中.

这里就是我们之前通过`ThreadLocal`的`withInitial` 提供的初始值提供器来获取一个初始值。

```java
public static <S> ThreadLocal<S> withInitial(Supplier<? extends S> supplier) {
    return new SuppliedThreadLocal<>(supplier);
}

static final class SuppliedThreadLocal<T> extends ThreadLocal<T> {

    private final Supplier<? extends T> supplier;

    SuppliedThreadLocal(Supplier<? extends T> supplier) {
        this.supplier = Objects.requireNonNull(supplier);
    }

    @Override
    protected T initialValue() {
        return supplier.get();
    }
}
```

把 [Supplier](https://zhida.zhihu.com/search?content_id=113649880&content_type=Article&match_order=1&q=Supplier&zhida_source=entity) 对象保存起来，提供一个带有默认初始值的 ThreadLocal。

如果是直接通过 new 的方式创建 ThreadLocal，惟一的区别就是没有默认的初始值，这样的话上面的程序会输出一堆 null。因为get的时候发现没有设置初始值，就为null了。

### 2、ThreadLocaMap
从上面的 get() 与 set() 方法可以看到，实际上 ThreadLocal 的值是保存在 ThreadLocalMap 这样一个结构中。ThreadLocalMap 是一个非常类似于 [HashMap](https://zhida.zhihu.com/search?content_id=113649880&content_type=Article&match_order=1&q=HashMap&zhida_source=entity) 的结构。它以 ThreadLocal 作为 key，value 就是 ThreadLocal 的值。每个线程都有一个 ThreadLocalMap 对象，而 ThreadLocalMap 中保存着当前线程拥有的所有 ThreadLocal。

简单的看一下 ThreadLocaMap 的结构

```java
static class ThreadLocalMap {

    static class Entry extends WeakReference<ThreadLocal<?>> {
        Object value;

        Entry(ThreadLocal<?> k, Object v) {
            super(k);
            value = v;
        }
    }

    private static final int INITIAL_CAPACITY = 16;
    private Entry[] table;
    private int size = 0;
    private int threshold; // Default to 0

    private void setThreshold(int len) {
        threshold = len * 2 / 3;
    }

    private static int nextIndex(int i, int len) {
        return ((i + 1 < len) ? i + 1 : 0);
    }

    private static int prevIndex(int i, int len) {
        return ((i - 1 >= 0) ? i - 1 : len - 1);
    }

    ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
        table = new Entry[INITIAL_CAPACITY];
        int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);
        table[i] = new Entry(firstKey, firstValue);
        size = 1;
        setThreshold(INITIAL_CAPACITY);
    }

    // ...
}
```

上面是 ThreadLocalMap 的创建过程，非常像一个 HashMap。其中的关键几点：

+ 值以 Entry 的形式保存在一个数组中，ThreadLocal 作为 key（是一个虚引用），value 就是对应的值；
+ 默认保持数量为 16，默认的 threshold 会计算为长度的 2/3；
+ 每个 ThreadLocal 都有自己的 threadLocalHashCode，用来计算它在数组中的索引；
+ nextIndex 与 prevIndex 用来安全的查找上一个或者下一个索引位置。

### 3、总结
每个线程都有一个 ThreadLocalMap 结构，其中就保存着当前线程所持有的所有 ThreadLocal。ThreadLocal 本身只是一个引用，没有直接保存值，值是保存在 ThreadLocalMap 中，ThreadLocal 作为 key，值作为 value。可以用下面的图来概括：


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1742356030606-692ffc21-914e-4072-b013-e3aeef137509.png)

前面也提到，Entry 的 key 为 ThreadLocal，这里是一个弱引用，只要 ThreadLocal 没有其他的强引用，就会被 GC，导致 Entry 的 key 为 null。因此在 ThreadLocalMap 的查找、插入与删除操作中，需要格外小心的处理这种 key 为 null 的情况，导致其操作格外复杂。

### 4、ThreadLocal的内存泄漏
为什么 ThreadLocal 会发生内存泄露就很明显了：

存在着一条从 currentThread 到 ThreadLocal value 的强引用链，即使 ThreadLocal 本身已经被回收了，value 因为强引用链的缘故，是依旧存活在内存中的。所以如果后续一直没有经过主动的 remove 或者被动的 rehash 操作的话，value 就会持续占用内存空间，造成泄露。

前面 ThreadLocalMap 中，因为 ThreadLocal 为弱引用，加上开放寻址法，所以查询、插入、删除操作都非常复杂，那么现在知道为什么 ThreadLocal 是弱引用了，原因就是为了尽量去避免内存泄漏问题。只要 ThreadLocal 本身不再用到了，即没有强引用了，ThreadLocalMap 中的弱引用就会被自动 GC 回收。后面 ThreadLocalMap 会不断的进行懒式扫描，剔除掉 key 为 null 的元素，释放在这部分内存。

某种意义上，ThreadLocal 本身已经最大化的去解决内存泄露问题了。不过凡事总有万一，万一这个元素在后续的 rehash 操作中一直没有被扫描到，那就会一直存在于内存。所以最好的方式就是，对于不再使用的 ThreadLocal，主动进行 remove，就像用完锁要解锁一样。

另外我们一般声明ThreadLocal变量的时候都使用static也是为了不让该变量被GC回收。

## 十一、一个线程有几个Handler
考点

这里面试官其实想了解的是，你对Handler的认知，如果这个问题打不出来，那么面试官也不会再去问了。

答案

在说答案之前，先看一直 Handler 的执行流程图：


![](https://cdn.nlark.com/yuque/0/2024/gif/29215582/1730980396255-ec4ab2f8-daf1-41d2-a0d6-65593ba66bcc.gif)

由上图，我们可以看出：

+ 一个线程里面，可以创建N个的Handler，如hander.sentXXX、 handler.postXX 都是在创建一个Handler。 每一个message，就是我们插入到消息队列 中的消息节点。

## 十二、handler内存共享实现跨线程的逻辑分析
MessageQueue内存共享

## 十三、一个线程有几个Looper？如何保证
考点

这里面试官其实想了解的是，你对Handler 流程及源码的理解。

答案

在回答这个问题之前，我们再看一下Handler 的执行流程图：

handler -> sendMessage -> messageQueue.enqueueMessage -> looper.loop() -> messasgeQueue.next() -> handler.dispatchMessage() -> handler.handerMessage() ，

handler 发送message，进入messageQueue.enqueueMessage 队列，进入looper中经过loop 死循环的不断遍历，驱动队列一直前进，经过handler.dispatchMessage() 分发给handler.handerMessage，这样我们就走完了整个的Handler 流程，也可以直接看作，一个线程中只有一个Looper。

如何保证的呢？ThreadLocal 多线程，线程上下文的存储变量，其实ThreadLocal 并不能存储任何的东西，但是在ThreadLocal 中，有一个ThreadLocalMap 集合，里面存储的<this, value> ，this 就是上下文，唯一的ThreadLocal key，key 唯一了，那么value 也就是唯一的，ThreadLocal在创建的时候，会有一个判断，如果已经创建了，会报异常，所以一个线程有唯一的ThreadLocal 就有唯一的looper。如下图：

ThreadLocal 线程隔离工具类


![](https://cdn.nlark.com/yuque/0/2024/gif/29215582/1730980436262-055ff42b-e051-4bfb-9576-bc2f020344b9.gif)

ThreadLocal 创建源码


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1730980446939-ef015300-ca20-4eae-9eff-523c16a3ba8d.png)

## 十四、Handler [内存泄漏](https://so.csdn.net/so/search?q=%E5%86%85%E5%AD%98%E6%B3%84%E6%BC%8F&spm=1001.2101.3001.7020)原因？为什么其他的内部类没有说过这个问题
考点

应该是考官想知道，你对于GC回收 JVM 相关的东西吧。

答案

在这里，我我们先看一段代码：

```java
Handler handler = new Handler(){
	@SuppressLint("HandlerLeak")
	@Override
	public void handleMessage(@NonNull Message msg) {
		Log.d("tiger", "handleMessage: ");
		View view = null;
		click(view);
		MainActivity2.this.click(view);
	}
};


public void click(View view) {

}
```

上面代码片段中的handler 代码，会标黄，并给予一个警告：这个处理程序类应该是静态的，否则可能发生内存泄漏。

那么为什么其他类不会有呢？

生命周期的问题。

首先看持有链

`static->sThreadLocal->Looper->MessageQueue->Message->handler->MainActivity.this`

再看发送消息的流程：

`sendMessage -> sendMessageAtTime -> enqueueMessage` 在 enqueueMessage 中，有段代码 msg.target = this;，意思就是Message 会持有当前的handler，handler 已经成为了massage的一部分，假如我设置一个消息需要等待20分钟后执行，那么就意味，我的message会一直等待20分钟之后才会执行，message 持有 handler，handler 持有 (this)activity，这样就导致GC无法回收，JVM 通过可达性算法，告诉我们，没法到达，就无法回收。

内部类的生命周期，一旦在外部类生命周期中被别的生命周期持有了，那么外部类也不能被释放。 解决方法：

[Handler造成内存泄漏的原因以及解决方案_handler导致内存泄露-CSDN博客](https://blog.csdn.net/qq_34681580/article/details/105161553)

使用static声明handler，static不能持有外部对象，通过弱引用来引用外部的对象实例

## 十五、为何主线程可以new Handler？如果想要在子线程中new Handler 要做些什么?
考点

？

答案

在APP 启动的时候，就在ActivityThread.main() 方法中，就创建了looper.loop() ，源码如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1730980485389-622ee885-e9e2-4c95-b177-6f16c0a6a057.png)

那么如何在子线程中new Handler呢？只需要在子线程中，手动添加 `Looper.prepare();` 和 `Looper.loop();` 就可以了。请看下面代码

```java
public void click (View view){
new Thread(new Runnable() {
	@Override
	public void run() {
		Looper.prepare();
		mHandler = new Handler() {
			public void handleMessage(Message msg) {
				// do something()
			}
		};
		Looper.loop();
	}
}).start();
}
```

使用handlerThread

handlerThread中，run和getLooper都使用了synchronized，保证了getLooper一定有值，如果getLooper先执行，则会执行wait将锁交出去，等到run执行创建了Looper会执行notifyAll唤醒所有挂起的锁，getLooper继续执行就会返回Looper.

getLooper使用while是防止其他地方调用notifyAll唤醒锁

## 十六、子线程中维护的Looper，[消息队列](https://so.csdn.net/so/search?q=%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97&spm=1001.2101.3001.7020)无消息的时候的处理方法是什么？有什么用？
考点

对于源码的掌握程度

答案

+ 子线程中维护的Looper 在无消息的时候调用quit，可以结束循环。`loop()` 是一个死循环，想要退出，必须`msg == null`。请看下面源码：

```java
public static void loop() {
	for (;;) {
		Message msg = queue.next(); // might block
		if (msg == null) {
			// No message indicates that the message queue is quitting.
			return;
		}
		msg.recycleUnchecked();
	}
}

```

+ 只有在调用quit 的时候，才会返回null。

```java
Message next() {
	for (;;) {
		synchronized (this) {
			if (mQuitting) {
				dispose();
				return null;
			}
		}
	}
}

void quit(boolean safe) {
synchronized (this) {
	if (mQuitting) {
		return;
	}
	mQuitting = true;
}
}

```

+ 所以使用quit() 唤醒队列，执行loop() 退出循环，子线程looper 不在执行了。


![](https://cdn.nlark.com/yuque/0/2024/gif/29215582/1730980541930-8cf492b1-326e-4ec4-837c-0103dd2108db.gif)

消息入队：根据时间排序，当队列满的时候，阻塞，直到用户通过next() 取出消息。当next 方法被调用的时候，通知MassageQueue 可以消息入队。

消息出队：由Looper.loop()进行循环, 对queue 进行轮询操作，当消息达到执行时间就取出来，当MessageQueue 为空的时候，队列阻塞，等消息调用queue massage 的时候，通知队列，可以取出消息，停止阻塞。

handler 没有使用多线程中的阻塞队列 BlockQueue，因为主线程（系统）也在使用，如果使用BlockQueue 设置上限的话，系统可能会出现卡顿等情况。


![](https://cdn.nlark.com/yuque/0/2024/gif/29215582/1730980557896-8049e560-be41-4e36-9c67-3329e2f60751.gif)

从上图中，我们看可以出，handler 是一个生产者 - 消费者的设计模式。下面我们来看一下，looper 中的两种循环阻塞方式：

执行时间阻塞（没有到执行时间），nativePollOnce(long ptr, int timeoutMillis) 执行阻塞操作，timeoutMillis 为 -1 表示无限等待，直到事件发生为止，如果为0，无需等待，立即执行。请看下面源码：

```java
    Message next() {
        final long ptr = mPtr;
        if (ptr == 0) {
            return null;
        }
        int nextPollTimeoutMillis = 0;
        for (;;) {
            nativePollOnce(ptr, nextPollTimeoutMillis);// 循环进入阻塞状态,等待执行时间到达后唤醒
            synchronized (this) {
                if (msg != null) {
                    if (now < msg.when) {
                        // 消息不为空,并且没有到执行时间,nextPollTimeoutMillis 不为-1
                        nextPollTimeoutMillis = (int) Math.min(msg.when - now, Integer.MAX_VALUE);
                    }
                }
                // Process the quit message now that all pending messages have been handled.
                if (mQuitting) {
                    dispose();
                    return null;
                }
            }
        }
    }

```

MessagaQueue 为空，执行阻塞，等待唤醒。当插入消息时，主动唤醒，请看下面源码：

```java

    Message next() {
        if (ptr == 0) { // mPtr==0,表示中断循环,
            return null;
        }

        int pendingIdleHandlerCount = -1;
        int nextPollTimeoutMillis = 0;
        for (;;) {
            nativePollOnce(ptr, nextPollTimeoutMillis);
            synchronized (this) {
                if (msg != null) {
                } else {
                    // 无消息,timeoutMillis为-1表示无限等待,直到有事件发生为止
                    nextPollTimeoutMillis = -1;
                }
            }
        }
    }
    // mPtr==0
    private void dispose() {
        if (mPtr != 0) {
            nativeDestroy(mPtr);
            mPtr = 0;
        }
    }
    // 唤醒
    boolean enqueueMessage(Message msg, long when) {
        synchronized (this) {
            boolean needWake;
            Message p = mMessages;
            if (p == null || when == 0 || when < p.when) {
                msg.next = p;
                mMessages = msg;
                needWake = mBlocked;
            }
            // mPtr != 0 循环没有中断,进行唤醒操作.
            if (needWake) {
                nativeWake(mPtr);
            }
        }
        return true;
    }
```

## 十七、既然可以存在多个Handler 往MessageQueue 中添加数据（发消息时各个Handler 可能处于不同线程），那它内部是如何确保线程安全的？
考点

线程锁，后续会更多 synchronized 相关的东西

答案

单线程的`Looper`消息循环

`Looper`是与单个线程绑定的，每个线程只能有一个`Looper`实例。`Looper`的`loop()`方法会不断从`MessageQueue`中取出消息并处理。由于`Looper`的消息循环是单线程的，因此在消息的处理过程中不会出现多线程竞争的问题。

`MessageQueue`的线程安全设计

`MessageQueue`内部的实现确保了线程安全。以下是关键点：

同步机制

`MessageQueue`使用了同步机制来保护其内部数据结构。例如，`MessageQueue`的`enqueueMessage()`和`next()`方法是同步的。这意味着在向`MessageQueue`添加消息或从`MessageQueue`中取出消息时，会通过锁来确保线程安全。

`Handler`的线程安全

虽然`Handler`可以被创建在不同的线程中，但`Handler`的`sendMessage()`方法最终会调用`MessageQueue`的`enqueueMessage()`方法。由于`enqueueMessage()`方法是同步的，因此即使多个`Handler`在不同的线程中调用`sendMessage()`，消息的添加操作也是线程安全的。

消息的分发和处理

消息的分发和处理是由`Looper`的`loop()`方法完成的。`loop()`方法运行在单线程中，从`MessageQueue`中取出消息并分发给对应的`Handler`。由于`loop()`方法是单线程的，因此在消息的处理过程中不会出现线程安全问题。

## 十八、我们使用Message 时应该如何创建它？
考点

难道是想知道有没有使用过？

答案

在创建Message 对象时，有三种方法：

Message message = new Message();

Message message1 = Message.obtain(); 查看源码的时候，发现内部调用的也是obtain() 方法。

Message message2 = handler.obtainMessage();

## 十九、handler使用removeCallbacks无效的原因
removeCallbacks只能停止处于即将运行状态的messages,这里messages里面包含就是Runnables，如果Runnable已经启动start(),则removeCallbacks是无法停止的。Handler的removeCallbacks()方法是调用MessageQueue的removeMessages，将messageQueue中的包含有我们想要移除的callback的message全部移除掉，因为已经处于运行的runnable包含在message中已经移交给handler进行处理了，而Handler.removeCallbacks(Runnable r)只能移除未运行的runnable，所以导致无法停止runnbale的运行，最后失效。

另外一种情况是，没有将Runnable定义为静态的，一旦发生某些变化比如切屏、屏幕横竖切换等，会导致Runnable被重新定义的时候，再使用removeCallback会失效，因为前后的Runnable不是一个，如果定义为static就不会有该问题，或者只用Handler.removeCallbacksAndMessages(null);将所有的Runnable都移除也可以生效。

## 二十、Android中为什么主线程不会因为Looper.loop里的死循环卡死？
Android应用是靠事件驱动的，如果Looper.loop停止了，应用也就停止了。

Android应用是事件响应编程范式的一个典型。

如果loop不是死循环。那么在一开始执行初始化工作的MessageQueue里面的Message消化完之后，这个activity就会结束。当前UI线程也会结束。如此应用也就结束了。

主线程在这样的循环中处于一种阻塞block的状态。一旦其他线程通过事件发送了message，当前UI线程又会接收到消息做出响应。让主线程的blocked状态变成了runnable的状态。

主线程的loop循环和Android的ANR是两回事。前者是一种保持休眠，等待事件消息去响应执行的一种状态。后者是无法响应消息，很长时间主线程没有处理事件的一种故障。

即使是ANR，最终弹出报错提示。依然是通过handler机制，系统发送的异步消息 。

## 二十一、应用间的通信及应用内的通信方式有哪些
android进程间通信

1、 Intent：可以通过Intent在不同进程的组件之间传递数据。Intent可以携带少量的数据，适用于Activity之间或Service之间的通信。

2、 SharedPreference：可以在不同进程之间共享数据，但不支持并发写入，可能会导致数据不一致。

BroadCast广播

3、 Binder：Android特有的IPC机制，性能高效，适用于不同应用或同一应用不同进程之间的通信。Binder机制基于C/S架构，服务端实现Binder接口，客户端通过代理对象与服务端通信。

4、 AIDL（Android Interface Definition Language）：允许定义跨进程调用的接口，支持多线程，适用于需要高性能IPC的场景。

5、 Messenge：基于Handler和Message实现的IPC机制，适用于简单的单向异步通信。

6、 Socket：适用于不同设备或不同应用之间的通信，通过网络进行数据交换。

7、 ContentProvider：用于在不同应用之间共享数据，封装了数据并提供了一组标准的接口。

8、 管道（Pipe）：一种简单的IPC方式，适用于具有亲缘关系的进程之间的通信。

9、 文件共享：通过文件系统共享数据，简单但速度慢，且需要处理并发问题。

## 二十二、说一下Binder机制
### 1、介绍
[进程间通信Binder机制](https://www.yuque.com/snaildong/tm412n/hcz1ei)

Binder机制是Android系统中一种高效的进程间通信（IPC）机制，它允许不同进程之间进行数据交换和方法调用。

Client：请求服务的客户端进程。

Server：提供服务的服务器端进程。

ServiceManager：管理服务注册和查找的中心节点。

Binder驱动：运行在内核空间，负责管理和调度Binder通信

服务注册：Server进程创建一个Binder对象，并将其注册到ServiceManager中。ServiceManager会为这个Binder对象创建一个引用，并将其存储在查找表中。

服务查找：Client进程通过ServiceManager查找需要的服务，并获取该服务的Binder引用。

通信过程：Client进程通过Binder驱动向Server进程发送请求。Binder驱动将请求传递给Server进程，Server进程处理请求并返回结果。

数据传输：Binder机制通过内核空间的缓冲区进行数据传输，减少了数据在用户空间和内核空间之间的拷贝次数，提高了通信效率。

### 2、回答
## 二十三、Android中为什么使用binder机制
主要是出于以上三个方面的考量：

1.高性能:从数据拷贝次数来看Binder只需要进行一次内存拷贝，而管道、消息队列、Socket都需要两次，共享内存不需要拷贝，Binder的性能仅次于共享内存。

2.稳定性:上面说到共享内存的性能优于Binder，那为什么不适用共享内存呢，因为共享内存需要处理并发同步问题,容易出现死锁和资源竞争,稳定性较差。而Binder基于C/S架构，客户端与服务端彼此独立，稳定性较好。

3.安全性：Android为每个应用分配了UID，作为鉴别进程的重要标志，Android内部依赖这个UID进行权限管理，包括6.0以前的固定权限和6.0以后的动态权限，传统IPC只能由用户在数据包里填入UID/PID，这个标记是在用户空间控制，没有放在内核空间，因此有被恶意篡改的可能，因此Binder的安全性更高

## 二十四、AIDL的全称是什么？如何工作？能处理哪些类型的数据
### 1、AIDL
AIDL的全称是Android Interface Definition Language，即Android接口定义语言。它是一种用于定义客户端和服务端之间通信接口的语言，主要用于实现Android中的进程间通信（IPC）。

### 2、AIDL的工作原理
AIDL的工作原理基于Binder机制，具体步骤如下：

1. 定义AIDL接口：开发者使用AIDL语言定义接口，声明可供客户端调用的方法。
2. 生成Java代码：AIDL编译器将`.aidl`文件编译成Java代码，生成代理类。
3. 实现接口：服务端实现AIDL接口，并在服务中返回Binder对象。
4. 绑定服务：客户端通过`bindService`方法绑定到服务端，并在`ServiceConnection`中获取Binder对象。
5. 调用方法：客户端通过AIDL生成的代理对象调用服务端的方法，就像调用本地方法一样。
6. 序列化和反序列化：AIDL自动生成的代码负责将参数序列化为可跨进程传输的格式，并在接收端反序列化。

### 3、AIDL支持的数据类型
AIDL支持以下类型的数据：

+ 基本数据类型：如`int`、`long`、`float`、`double`、`boolean`、`char`、`byte`、`short`。
+ Java对象：如`String`和`CharSequence`。
+ `Parcelable`类型：自定义类如果实现了`Parcelable`接口，也可以在AIDL中使用。
+ `List`和`Map`：`List`和`Map`中的元素必须是AIDL支持的类型。`List`可以使用泛型，但`Map`不支持泛型。
+ `IBinder`接口：用于传递服务对象的引用。

## 二十五、AIDL和Binder的关系和应用
### 1、介绍
AIDL（Android Interface Definition Language）和Binder是Android系统中实现进程间通信（IPC）的关键技术。

+ AIDL是接口定义语言：AIDL用于定义跨进程通信的接口。它允许开发者声明一个接口，该接口可以被不同进程中的客户端和服务端使用。
+ Binder是IPC机制：Binder是Android系统中实现IPC的核心机制。它通过内核空间的Binder驱动程序来管理进程间的连接和数据传输。
+ AIDL依赖Binder实现：AIDL定义的接口通过Binder机制来实现跨进程调用。AIDL文件在编译时会生成相应的Java代码，其中包括一个Stub类（服务端实现）和一个Proxy类（客户端代理），这两个类都继承自IBinder接口。
+ 服务端实现：
    - 服务端首先定义一个AIDL接口文件，然后在服务类中创建一个Stub类的子类，实现接口中声明的方法。
    - 在服务的`onBind()`方法中返回这个Stub对象的实例。
+ 客户端调用：
    - 客户端通过绑定服务来获取服务端的IBinder对象。
    - 使用AIDL生成的Proxy类来调用服务端的方法。Proxy类会将方法调用封装为Binder通信的请求，通过Binder驱动传递给服务端。
+ 跨进程方法调用：
    - 当客户端调用Proxy类的方法时，该调用会被转换为一个Binder事务，通过Binder驱动传递给服务端。
    - 服务端接收到事务请求后，通过Stub类的`onTransact()`方法解析请求，并调用相应的接口实现。

## 二十六、一个应用调用另一个应用的原理，内部实现
整体流程：以launcher启动淘宝为例

Launcher通知AMS启动淘宝APP的MainActivity，也就是清单文件设置启动的Activity。

AMS记录要启动的Activity信息，并且通知Launcher进入pause状态。

Launcher进入pause状态后，通知AMS已经paused了，可以启动淘宝了。

淘宝app未开启过，所以AMS启动新的进程，并且在新进程中创建ActivityThread对象，执行其中的main函数方法。

淘宝app主线程启动完毕后通知AMS，并传入applicationThread以便通讯。

AMS通知淘宝绑定Application并启动MainActivity。

淘宝启动MainActivitiy，并且创建和关联Context,最后调用onCreate方法。


一个应用调起另一个应用的原理，在Android系统中，主要依赖于Intent机制、PackageManager以及Activity的启动过程，

Intent是Android中用于不同组件（如Activity、Service等）之间通信的一种机制。它可以携带数据，并指定要执行的动作（Action）、数据（Data）、类别（Category）、附加信息（Extras）以及要启动的组件（Component）。

当一个应用想要调起另一个应用时，它会构造一个Intent对象，并设置相应的动作、数据等。如果知道目标应用的包名和Activity类名，可以直接通过`ComponentName`来指定目标组件；如果不知道，则可以通过设置Intent的Action和Data等属性，让系统根据这些属性来查找能够处理该Intent的应用。

PackageManager是Android系统中用于管理已安装应用程序包（APK）的类。它提供了丰富的API来查询已安装应用的信息，如包名、Activity、Service等。

在应用调起另一个应用的过程中，PackageManager扮演着重要的角色。通过PackageManager，应用可以查询目标应用是否存在，以及获取目标应用的Activity信息（如类名）。这是通过解析Intent并查询系统中已安装的应用包来实现的。

当Intent被构造并设置完毕后，调用`startActivity(Intent intent)`方法即可启动目标Activity。这个过程涉及到多个组件的协同工作，包括ActivityManagerService（AMS）、WindowManagerService（WMS）等系统服务。

+ AMS：负责Activity的启动、暂停、停止和销毁等生命周期管理。当`startActivity`被调用时，AMS会解析Intent，查找能够处理该Intent的Activity，并启动它。
+ WMS：负责窗口的管理和显示。当Activity被启动时，WMS会为其创建一个窗口，并将其显示在屏幕上。

### 1、底层实现细节
+ Binder机制：Android中的进程间通信（IPC）主要通过Binder机制实现。AMS和WMS等系统服务都运行在System Server进程中，而应用则运行在自己的进程中。当应用需要与系统服务交互时，会通过Binder机制发送请求。binder通知到AMS--->activity flag intent信息--->用socket通知Zygote启动新进程
+ Zygote和App进程：Android系统在启动时会启动一个Zygote进程，它是所有应用进程的父进程。当需要启动一个新应用时，系统会请求Zygote进程fork出一个新的App进程，并在该进程中加载应用的APK文件，执行应用的入口点（如MainActivity）。创建ActivityThread，利用Loop的循环处理创建activity，利用classLoader加载activity
+ Activity栈：Android使用Activity栈来管理Activity的实例。当一个新的Activity被启动时，它会被压入栈顶；当Activity被销毁时，它会被从栈中移除。这样，系统就可以通过栈来管理Activity的生命周期和显示顺序。

综上所述，一个应用调起另一个应用的原理涉及到Intent机制、PackageManager、Activity的启动过程以及Android系统的底层IPC机制等多个方面。这些机制共同协作，实现了应用之间的无缝调用和通信。

## 二十七、从launcher界面点击应用图标启动一个android应用的过程，原理说一下
### 1、介绍
[Android Activity启动过程-从桌面点击图标到调用Activity的OnCreate](https://www.jianshu.com/p/de42beb41676)

[【细说 Activity 启动流程】：当你点击一个应用图标后，究竟发生了什么？_android 点launch发生了什么-CSDN博客](https://blog.csdn.net/MLQ8087/article/details/82888201)

### 2、回答
从Launcher界面点击应用图标启动一个Android应用的过程涉及多个步骤，包括Intent的使用、AndroidManifest.xml的解析、进程间Binder通信以及进程孵化等;

1. 当用户点击Launcher界面的应用图标时，会调用startActivity。Launcher会生成一个Intent来启动目标应用。这个Intent通常包含:
+ Action：通常为`Intent.ACTION_MAIN`，表示这是应用的主入口。
+ Category：通常包含`Intent.CATEGORY_LAUNCHER`，表示这是一个可以从Launcher启动的Activity。
+ Component：指定要启动的Activity的包名和类名。
2. Launcher进程通过Binder IPC向SystemServer进程的ActivityManagerService（AMS）发起startActivity请求，AMS接收到请求后，会进行一系列的准备工作，包括检查应用是否已安装、是否已有实例在运行等。比如解析AndroidManifest.xml文件，以确定Intent所指向的Activity。
3. 如果应用进程尚未启动，AMS会向Zygote进程发送创建进程的请求
4. Zygote进程通过Linux的fork机制创建一个新的子进程，即应用进程。新进程继承Zygote的所有资源，成为一个独立的应用进程，新进程的初始化会加载应用的.dex文件和资源文件，并启动Binder线程池，启动ActivityThread类的main方法，作为应用进程的入口点。
5. 新创建的应用进程会通过Binder IPC向SystemServer进程发起attachApplication请求，完成进程的绑定和初始化。
6. 在收到attachApplication请求后，SystemServer进程会进行一系列准备工作，然后通过Binder IPC向应用进程发送scheduleLaunchActivity请求
7. 应用进程的Binder线程（ApplicationThread）收到请求后，会通过Handler向主线程发送BIND_APPLICATION消息。这个消息包含了应用的基本信息，如进程名、ApplicationInfo、ProviderInfo等。
8. 主线程收到BIND_APPLICATION消息后，会调用`handleBindApplication`方法。在这个方法中，首先会创建Instrumentation实例，然后通过Instrumentation创建Application实例
9. 创建Application实例后，会调用`Instrumentation.callApplicationOnCreate`方法，该方法会回调Application的`onCreate`方法，进行应用级别的初始化
10. 在BIND_APPLICATION消息处理完成后，主线程会继续处理LAUNCH_ACTIVITY消息。这个消息包含了要启动的Activity的信息
11. 主线程收到消息后，通过反射机制创建目标Activity(performLaunchActivity中通过Intent中的Component Name获取目标Activity的类名，然后使用`Class.forName`方法获取该类的Class对象)，并回调Activity的生命周期方法（如onCreate、onStart、onResume），Activity的UI渲染完成后，应用的主界面会显示在屏幕上。


`Instrumentation` 是 Android 系统提供的一个工具类，用于在运行时监控和控制应用程序的行为。`Instrumentation` 可以监控应用程序的生命周期事件，例如 Activity 的启动、停止等。通过重写 `callActivityOnCreate()`、`callActivityOnPause()` 等方法，开发者可以在测试中验证应用程序的行为。

## 二十八、android中pid和uid的区别和联系
在Android系统中，PID（Process ID）和UID（User ID）是两个重要的概念，它们用于标识和管理进程和用户权限。它们之间既有区别，也有联系。以下是详细的解释：

PID（Process ID）

PID是进程ID，用于唯一标识一个运行中的进程。每个进程在启动时都会被分配一个唯一的PID，直到进程结束，该PID才会被释放并可能被重新分配给其他进程。

特点：

+ 唯一性：在系统运行期间，每个PID是唯一的。
+ 生命周期：PID的生命周期与进程的生命周期一致，进程结束时，PID失效。
+ 用途：用于系统级别的进程管理和监控，例如通过`kill`命令终止进程。

UID（User ID）

UID是用户ID，用于标识一个用户。在Android系统中，每个应用都被分配一个唯一的UID，用于隔离应用的权限和资源。UID的分配是基于应用的签名和包名。

特点：

+ 唯一性：每个应用在安装时被分配一个唯一的UID，直到应用被卸载，该UID才会被释放。
+ 生命周期：UID的生命周期与应用的生命周期一致，应用卸载后，UID失效。
+ 用途：用于权限管理和资源隔离，例如文件访问权限、网络权限等。

区别

+ 标识对象：
    - PID：标识一个进程。
    - UID：标识一个用户（在Android中，通常是一个应用）。
+ 生命周期：
    - PID：与进程的生命周期一致，进程结束时失效。
    - UID：与应用的生命周期一致，应用卸载时失效。
+ 用途：
    - PID：用于系统级别的进程管理和监控。
    - UID：用于权限管理和资源隔离。

联系

+ 多进程应用：一个应用（UID）可以启动多个进程（PID）。每个进程都有自己的PID，但所有这些进程都属于同一个应用（UID）。
+ 权限管理：系统通过UID来管理应用的权限。例如，一个应用的所有进程（不同的PID）共享相同的文件访问权限和网络权限，这些权限是基于UID分配的。
+ 资源隔离：系统通过UID来隔离应用的资源。例如，一个应用的所有进程（不同的PID）共享相同的存储空间和网络连接，这些资源是基于UID分配的。

示例

假设有一个应用`com.example.myapp`，它被分配了UID `10010`。该应用启动了两个进程：

+ 主进程：PID `1234`
+ 后台服务进程：PID `5678`

这两个进程虽然有不同的PID，但它们都属于同一个应用（UID `10010`）。系统通过UID `10010`来管理这两个进程的权限和资源。

总结

+ PID：标识一个进程，用于系统级别的进程管理和监控。
+ UID：标识一个用户（应用），用于权限管理和资源隔离。
+ 联系：一个应用（UID）可以启动多个进程（PID），所有这些进程共享相同的权限和资源。

## 二十九、LRU了解吗？说一下实现思路？
## 三十、广播与 EventBus 的区别
[广播与 EventBus 的区别_android 广播和eventbus的区别-CSDN博客](https://blog.csdn.net/augfun/article/details/109713076)

## 三十一、APK打包流程
[https://zhuanlan.zhihu.com/p/534352019](https://zhuanlan.zhihu.com/p/534352019)

## 三十二、app启动优化
[深入研究Android启动速度优化（上）- 看完这些启动优化已经完成80%了_android 分析app的启动流程跟启动时间-CSDN博客](https://blog.csdn.net/m0_37796683/article/details/137463285)

## 三十三、AAPT是什么
[Android AAPT详解-CSDN博客](https://blog.csdn.net/yangaiyu/article/details/106965967)

## 三十四、为什么intent传递对象为什么需要序列化
Intent 在启动其他组件时，会离开当前应用程序进程，进入 ActivityManagerService 进程 – intent.prepareToLeaveProcess()。 这也就意味着，Intent 所携带的数据要能够在不同进程间传输。

首先我们知道，Android 是基于 Linux 系统，不同进程之间的 java 对象是无法传输，所以我们此处要对对象进行序列化，从而实现对象在 应用程序进程 和 ActivityManagerService 进程 之间传输

## 三十五、android常见的数据存储方式的差异，应用到软件开发里的应用场景是什么样的？（sp,sqite,文件等）
[Android 五大数据存储 (最实用的开发详解) 一 五种存储方式区别_android 储存方式-CSDN博客](https://blog.csdn.net/qq_28643195/article/details/107556187)

