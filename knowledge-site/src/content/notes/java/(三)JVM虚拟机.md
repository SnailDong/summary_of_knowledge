## 一、Java对象创建流程描述一下
### 1、介绍
Java对象的创建流程是一个复杂的过程，涉及到类加载、内存分配、对象初始化等多个步骤。以下是Java对象创建的详细流程：

类加载检查 类什么时候加载/初始化？

类在进行初始化之前，需要先进行加载`class`文件， 当符合以下条件时（包括但不限），并且虚拟机在内存中没有找到对应的类信息，必须对类进行“初始化”操作：

+ 使用`new`实例化对象时，读取或者设置一个类的静态字段或方法时
+ 反射调用时，例如`Class.forName("com.xxx.Test")`
+ 初始化一个类的子类，会首先初始化子类的父类
+ Java 虚拟机启动时标明的启动类，比如`main`方法所在的类
+ JDK8 之后，接口中存在`default`方法，这个接口的实现类初始化时，接口会在它之前进行初始化


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739255295238-7ee7f2ae-c886-4027-9cb7-189f4da06183.png)

当程序中首次出现对某个类的对象进行创建时，JVM会先检查这个类是否在常量池中能定位到一个类的符号引用，并且检查这个符号引用代表的类是否已经被加载、解析和初始化，如果没有，那么必须先执行类的加载流程；如果已经加载过了，会在堆区有一个类的 class 对象，方法区会有类的相关元数据信息

类加载过程：

+ 加载：类的加载有两种触发方式，预先加载和运行时加载
    - 预先加载：指的是虚拟机启动时加载，例如JAVA_HOME/lib/下的rt.jar下的.class文件，这个jar包里面包含了程序运行时常用的文件内容，例如java.lang.*、java.util.*、java.io.*等等，因此会随着虚拟机启动时一起加载到内存中。
    - 运行时加载：虚拟机在用到一个.class文件的时候，会先去内存中查看一下这个.class文件有没有被加载，如果没有，就会按照类的全限定名来加载这个类；如果有，就不会加载。
    - 通过类的全限定名定位.class文件，获取其二进制字节流，通过类加载器将类的`.class`文件的二进制数据读取到内存中，生成一个`java.lang.Class`对象表示这个类。类信息、静态变量、字节码、常量这些.class文件中的内容放入运行时数据区的方法区中
+ 验证：确保加载的类信息符合JVM规范，没有安全问题。
+ 准备：为类的静态变量分配内存，并设置默认初始值，final修饰时，这个初始值就是代码中显式地赋予的值。仅是static修饰的变量，而不是实例变量，实例变量将会在对象实例化的时候随着对象一起分配在 Java 堆中。
+ 解析：将类、接口、字段和方法的符号引用转换为直接引用。
+ 初始化：执行类构造器`<clinit>()`方法，对类的静态变量进行初始化赋值，以及静态代码块的执行。

分配内存

在类加载完成后，JVM会为新对象分配内存：

+ 确定对象大小：根据类的结构，计算出对象需要的内存大小。这包括对象头（存储对象的元数据信息，如对象的哈希码、GC分代年龄等）、实例字段等。
+ 内存分配方式：
    - 指针碰撞：如果Java堆中的内存是绝对规整的，已用内存和未用内存之间有一条分界线，通过移动这条分界线来分配内存。
    - 空闲列表：如果Java堆中的内存不是规整的，维护一个列表记录哪些内存块是可用的，分配内存时从列表中找到足够大的空间分配给对象，并更新列表记录。
+ 内存分配并发问题：在多线程环境下，为了保证内存分配的线程安全，可以采用以下方法：
    - CAS操作：使用CAS（Compare-And-Swap）操作来更新指针，确保分配内存时的原子性。
    - TLAB（Thread Local Allocation Buffer）：为每个线程预先分配一小块内存区域，线程在该区域内分配对象，避免了线程间的竞争。

初始化对象

内存分配完成后，JVM会初始化对象：

+ 设置对象头：在对象的内存空间中设置对象头信息，包括对象的类型指针（指向类的元数据）、对象的哈希码、GC分代年龄等。
+ 执行构造函数：
    - 字段赋默认值：首先为对象的字段赋默认值，如`int`类型默认为0，`Object`类型默认为`null`。
    - 执行构造方法：调用类的构造函数，对对象的字段进行显式初始化。构造函数可以调用父类的构造函数，进行对象的继承链初始化。

返回对象地址

最后，JVM返回新对象的内存地址，这个地址会被赋值给引用变量，通过这个引用变量就可以访问和操作新创建的对象了。

示例代码

以下是一个简单的Java对象创建示例：

```java
public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

public class Main {
    public static void main(String[] args) {
        Person person = new Person("Alice", 30);
    }
}
```

在这个例子中：

+ 当执行`new Person("Alice", 30)`时，首先会检查`Person`类是否已经加载，如果没有则进行类加载过程。
+ 然后为`Person`对象分配内存。
+ 接着初始化对象，先为`name`和`age`字段赋默认值（`null`和0），然后执行构造函数`Person(String name, int age)`，将`name`和`age`字段初始化为指定的值。
+ 最后返回新创建的`Person`对象的地址，赋值给引用变量`person`。

通过以上步骤，一个Java对象就被成功创建了。

### 2、总结如下
创建一个对象，要经历类的加载、验证、准备、解析、初始化

加载过程：通过类的全限定名定位.class文件，获取其二进制字节流，通过类加载器将类的`.class`文件的二进制数据读取到内存中，生成一个`java.lang.Class`对象表示这个类。

验证过程：确保加载的类信息符合JVM规范，没有安全问题。

准备过程：为类的静态变量分配内存，并设置默认初始值，当final修饰时，这个初始值就是代码中显式地赋予的值

解析过程：将类、接口、字段和方法的符号引用转换为直接引用。

然后通过类构造器`<clinit>()`方法，对类的静态变量进行初始化赋值，以及静态代码块的执行。

当类加载完成后，JVM会为新对象分配内存，然后初始化对象，首先为对象的字段赋默认值，如`int`类型默认为0，`Object`类型默认为`null`。然后再执行构造函数并对字段进行显示初始化。

## 二、Java内存区域描述
### 1、程序计数器（Program Counter Register）
+ 用途：程序计数器是一个小的内存区域，用于记录当前线程执行的字节码指令的地址。
+ 特点：
    - 每个线程都有一个独立的程序计数器，线程私有。
    - 如果当前线程正在执行的是一个 Java 方法，程序计数器记录的是正在执行的字节码指令的地址。
    - 如果正在执行的是本地方法（Native Method），程序计数器的值为 `undefined`。
    - 程序计数器是线程切换的恢复执行点，是线程私有的。

---

### 2、Java 栈（Java Stack）
+ 用途：Java 栈用于存储方法调用时的局部变量、操作数栈、动态链接、方法出口等信息。
+ 特点：
    - 每个线程都有一个独立的 Java 栈，线程私有。
    - Java 栈由多个栈帧（Stack Frame）组成，每个栈帧对应一个方法调用。
    - 栈帧在方法调用时创建，在方法返回时销毁。
    - Java 栈的大小可以通过 `-Xss` 参数设置。
    - 栈溢出（`StackOverflowError`）通常发生在递归调用过深时。

---

### 3、本地方法栈（Native Method Stack）
+ 用途：本地方法栈用于支持本地方法（如 JNI 调用）的执行。
+ 特点：
    - 与 Java 栈类似，本地方法栈也是线程私有的。
    - 每个线程都有一个独立的本地方法栈。
    - 本地方法栈的大小也可以通过 `-Xss` 参数设置。
    - 本地方法栈中存储的是本地方法的调用信息。

---

### 4、堆（Heap）
+ 用途：堆是 Java 中最大的内存区域，用于存储对象实例和数组。
+ 特点：
    - 堆是所有线程共享的内存区域。
    - 堆内存由垃圾回收器（GC）管理，负责自动回收无用对象的内存。
    - 堆被划分为多个区域：
        * 新生代（Young Generation）：
            + 包括 Eden 区和两个 Survivor 区（S0 和 S1）。
            + 新创建的对象首先分配到 Eden 区。
            + 经过一次 Minor GC 后，存活的对象会被移动到 Survivor 区。
        * 老年代（Old Generation）：
            + 存储生命周期较长的对象。
            + 经过多次 Minor GC 后，仍然存活的对象会被晋升到老年代。
        * 元空间（Metaspace）：
            + 存储类的元数据（如类的结构信息、常量池等）。
            + 元空间在 Java 8 及以后版本中取代了永久代（PermGen）。
    - 堆的大小可以通过 `-Xms` 和 `-Xmx` 参数设置。

---

### 5、方法区（Method Area）
+ 用途：方法区用于存储已被虚拟机加载的类信息、常量、静态变量、即时编译器编译后的代码等数据。
+ 特点：
    - 方法区是所有线程共享的内存区域。
    - 方法区在 Java 8 及以后版本中被元空间（Metaspace）取代。
    - 方法区的大小可以通过 `-XX:MaxMetaspaceSize` 参数设置。
    - 方法区的内存不足会抛出 `OutOfMemoryError`。

---

### 6、运行时常量池（Runtime Constant Pool）
+ 用途：运行时常量池是方法区的一部分，用于存储编译期生成的各种字面量和符号引用。
+ 特点：
    - 运行时常量池在类加载时被创建。
    - 运行时常量池的大小可以通过 `-XX:MaxMetaspaceSize` 参数设置。
    - 运行时常量池的内存不足会抛出 `OutOfMemoryError`。

---

### 7、直接内存（Direct Memory）
+ 用途：直接内存不是 JVM 规范定义的内存区域，但可以通过 Java 的 `java.nio.ByteBuffer` 等类直接分配和使用。
+ 特点：
    - 直接内存不属于 JVM 的堆内存，但仍然受到 JVM 的管理。
    - 直接内存的使用可以减少垃圾回收的负担，但需要手动管理内存的分配和释放。
    - 直接内存的大小可以通过 `-XX:MaxDirectMemorySize` 参数设置。
    - 直接内存的不足会抛出 `OutOfMemoryError`。

## 三、堆和栈的区别
+ 堆：
    - 存储对象实例和数组。所有通过 `new` 关键字创建的对象和数组都存储在堆中。
    - 线程共享。堆是所有线程共享的内存区域，所有线程都可以访问堆中的对象。
    - 生命周期与应用一致。
    - 内存分配和回收由垃圾回收器管理。堆内存的分配由 Java 虚拟机（JVM）自动管理。对象通过 `new` 关键字创建时，JVM 会在堆中分配内存。堆内存由垃圾回收器（GC）管理，负责自动回收无用对象的内存。常见的垃圾回收算法包括标记-清除、复制、标记-压缩等。
    - 适合存储生命周期较长的对象。堆内存的分配和回收相对复杂，因为需要垃圾回收器的介入。频繁的垃圾回收可能会影响性能。
    - 堆内存的大小通常较大
+ 栈：
    - 存储局部变量、方法调用的上下文信息。每个方法调用时会创建一个栈帧（Stack Frame），方法返回时栈帧被销毁。包括基本数据类型变量和对象引用变量（但不存储对象本身）。
    - 线程私有。线程之间不能共享栈内存。
    - 生命周期与方法调用一致。
    - 内存分配和回收自动完成，效率高。栈内存的分配和回收是自动的。方法调用时，JVM 会自动创建一个栈帧；方法返回时，栈帧自动出栈。
    - 适合存储局部变量和方法调用的上下文。栈内存的分配和回收非常快，因为是基于指针的操作，效率高。
    - 栈内存的大小相对较小

```java
Object obj = new Object();  // 对象存储在堆中
int[] array = new int[10];  // 数组存储在堆中
int a = 10;  // 局部变量存储在栈中
Object obj = new Object();  // 对象引用存储在栈中，对象本身存储在堆中
```

## 四、内存泄漏的原理
### 1、什么是内存泄漏
内存泄漏（Memory Leak）是指程序中已动态分配的内存由于某种原因未释放或无法释放，从而造成系统可用内存或资源的减少，最终可能导致程序崩溃或系统不稳定

## 五、日常开发遇到的内存泄漏的例子
对象未被正确回收

当对象的引用仍然存在时，但不再需要该对象时，没有及时释放对象会导致内存泄漏。

```java
public void onCreate() {
    // ...
    MyObject object = new MyObject();
    // ...
}

// 解决方案：
public void onCreate() {
    // ...
    MyObject object = new MyObject();
    // 使用完object后，及时调用object = null，释放对象
    object = null;
    // ...
}
```

匿名类和内部类的引用

由于匿名类和内部类会隐式持有外部类的引用，如果不注意处理，可能导致外部类无法被正确回收。

```java
public class MainActivity extends AppCompatActivity {
    public void onCreate() {
        // ...
        MyListener listener = new MyListener() {
            // ...
        };
		// 假设将 listener 注册到某个全局对象或长时间存在的对象中
        GlobalObject.registerListener(listener);
        // ...
    }
}

//上述中，只要 listener 存在，MainActivity 实例就不会被垃圾回收器回收。
//当用户离开 MainActivity 时，Activity应该被销毁并回收内存。
//然而，如果 listener 被注册到一个全局对象（如 GlobalObject）中，
//并且没有被及时注销，listener 会一直存在，从而导致 MainActivity 无法被回收。
// 解决方案：
public class MainActivity extends AppCompatActivity {
    private MyListener listener;

    public void onCreate() {
        // ...
        listener = new MyListener() {
            // ...
        };
        // ...
    }

    protected void onDestroy() {
        super.onDestroy();
        // 在合适的时机，及时将listener置空，释放外部类引用
        listener = null;
    }
}
```

单例模式导致的内存泄漏

如果使用单例模式的对象无法被释放或适时清理，会导致该对象一直存在于内存中。

```java
public class MySingleton {
    private static MySingleton instance;

    public static MySingleton getInstance() {
        if (instance == null) {
            instance = new MySingleton();
        }
        return instance;
    }

    // ...
}

//上述中，只要 MySingleton 类被加载，instance 就会一直占用内存，直到应用退出。
//1.如果单例对象 instance 持有外部资源（如文件句柄、数据库连接、网络连接等），
//并且这些资源没有被正确释放，就会导致内存泄漏
//2.如果单例对象持有其他对象的引用，并且这些对象的生命周期比单例对象短，
//可能会导致这些对象无法被垃圾回收器回收
// 解决方案：
public class MySingleton {
    private static MySingleton instance;

    public static MySingleton getInstance() {
        if (instance == null) {
            synchronized (MySingleton.class) {
                if (instance == null) {
                    instance = new MySingleton();
                }
            }
        }
        return instance;
    }

    public static void releaseInstance() {
        instance = null;
    }

    // ...
}
//如果单例对象需要持有其他对象的引用，但又不希望影响这些对象的生命周期，
//可以使用 WeakReference 来持有引用
```

Handler 导致的内存泄漏

如果在使用Handler时，未正确处理[消息队列](https://cloud.tencent.com/product/message-queue-catalog?from_column=20065&from=20065)和对外部类弱引用，可能导致外部类无法被回收。

```java
public class MyActivity extends AppCompatActivity {
    private Handler handler = new Handler() {
        public void handleMessage(Message msg) {
            // ...
        }
    };

    // ...
}

// 解决方案：
public class MyActivity extends AppCompatActivity {
    private static class MyHandler extends Handler {
        private final WeakReference<MyActivity> mActivity;

        public MyHandler(MyActivity activity) {
            mActivity = new WeakReference<>(activity);
        }

        public void handleMessage(Message msg) {
            MyActivity activity = mActivity.get();
            if (activity != null) {
                // ...
            }
        }
    }

    private MyHandler handler = new MyHandler(this);

    // ...
}
```

长时间运行的后台任务

如果应用程序启动了一个后台任务，并且该任务的生命周期很长，这可能会导致内存泄漏。如在后台线程中执行网络请求或[数据库](https://cloud.tencent.com/product/tencentdb-catalog?from_column=20065&from=20065)操作，在任务完成后未正确处理对象的引用会导致内存泄漏。

```java
public void startBackgroundTask() {
    new Thread(new Runnable() {
        public void run() {
            // 长时间运行的后台任务
        }
    }).start();
}

// 解决方案：
public void startBackgroundTask() {
    new Thread(new Runnable() {
        public void run() {
            // 长时间运行的后台任务
            // 任务执行完毕后，及时将相关对象引用置空
        }
    }).start();
}
```

Context 的错误引用

在Android开发中，Context引用是非常常见的内存泄漏原因。当将一个长生命周期的对象与Context关联时，如果未正确解除引用，将导致Context无法被回收。

```java
public class MyActivity extends AppCompatActivity {
    public static MyActivity sInstance;

    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sInstance = this;
    }
}

// 解决方案：
public class MyActivity extends AppCompatActivity {
    private static MyActivity sInstance;

    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sInstance = this;
    }

    protected void onDestroy() {
        super.onDestroy();
        // 在关闭Activity时，及时解除引用
        sInstance = null;
    }
}
```

使用缓存导致的内存泄漏

使用缓存是为了提高性能和减少资源使用，但如果在缓存中保持过长时间的对象引用，有可能导致内存泄漏。

```java
public class ObjectCache {
    private static final int MAX_SIZE = 100;
    private Map<String, Object> cache = new HashMap<>();

    public void put(String key, Object value) {
        cache.put(key, value);
        // 未添加移除操作
    }

    public Object get(String key) {
        return cache.get(key);
    }
}

// 解决方案：
public class ObjectCache {
    private static final int MAX_SIZE = 100;
    private Map<String, WeakReference<Object>> cache = new HashMap<>();

    public void put(String key, Object value) {
        if (cache.size() >= MAX_SIZE) {
            // 当缓存超过最大值时，尽可能移除一些旧的对象
            removeOldestObject();
        }
        cache.put(key, new WeakReference<>(value));
    }

    public Object get(String key) {
        WeakReference<Object> weakRef = cache.get(key);
        if (weakRef != null) {
            return weakRef.get();
        }
        return null;
    }

    private void removeOldestObject() {
        // 移除一些旧的对象
    }
}
```

未关闭的资源

在使用一些资源，如数据库连接、文件输入/输出流等时，如果在使用完毕后未显式关闭这些资源，会导致资源泄漏和内存泄漏。

```java
public void readFromFile() {
    FileInputStream inputStream = null;
    try {
        inputStream = new FileInputStream("file.txt");
        // 读取数据
    } catch (IOException e) {
        e.printStackTrace();
    } finally {
        // 未及时关闭资源
    }
}

// 解决方案：
public void readFromFile() {
    FileInputStream inputStream = null;
    try {
        inputStream = new FileInputStream("file.txt");
        // 读取数据
    } catch (IOException e) {
        e.printStackTrace();
    } finally {
        if (inputStream != null) {
            try {
                inputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

## 六、内存泄漏怎么排查以及怎么解决
### 1、介绍
内存泄漏怎么排查以及怎么解决

#### (1) 使用工具进行内存泄漏检测：
Android Profiler： Android Studio提供的Android Profiler工具可以帮助您监视应用的内存使用情况，并检测内存泄漏。

Allocation Tracker：可用于跟踪对象的创建和释放，帮助开发者识别内存泄漏问题。

LeakCanary： 这是一个开源的第三方库，专门用于检测和报告Android应用中的内存泄漏。它会在应用出现内存泄漏时给出详细的报告。

#### (2) 解决
1. 及时释放对象：在不再需要对象时，及时将其引用置空，以便垃圾回收器能够正确回收对象。
2. 避免强引用： 避免使用强引用持有对象，尤其是在长时间的后台任务中。
3. 使用弱引用：对于可能导致内存泄漏的对象引用，使用弱引用来避免强引用导致的无法回收问题。
4. 避免使用静态对象：静态对象生命周期长，容易导致内存泄漏，尽量避免过度使用静态对象。
5. 避免使用匿名类和内部类：匿名类和内部类隐式地持有外部类的引用，容易导致外部类无法被回收。可以使用静态内部类代替。
6. 避免长时间的声明周期：尽量避免在生命周期较长的对象中引用短生命周期的对象，避免造成对象无法被释放。
7. Activity和Fragment注意事项：避免在Activity或Fragment中持有长生命周期的对象，可能导致内存泄漏；使用WeakReference引用Activity或Fragment，以便在不需要时能够被垃圾回收器回收；当需要在某些地方持有Context时，优先考虑使用ApplicationContext，以避免因为Context导致的内存泄漏。
8. 避免使用单例模式：如果单例模式对象无法适时释放，会一直存在于内存中，增加内存占用。
9. 避免 Handler 导致的内存泄漏：使用静态内部类和对外部类的弱引用来避免Handler导致的内存泄漏。

## 七、如何使用LeakCanary分析内存泄漏


当 LeakCanary 检测到内存泄漏时，会自动生成一份泄漏报告，报告会显示在通知栏中，也可以通过以下方式查看：

+ 打开 Android Studio 的“Analyze”菜单，选择“Run LeakCanary Analysis”。
+ 查看设备或模拟器的 Logcat 输出。

LeakCanary 的报告会显示泄漏对象的引用链，帮助开发者定位问题。例如，报告可能显示：

```java
GC Root
  ↓
leakInstance (Static field)
  ↓
LeakActivity
```

这表明 `LeakActivity` 被一个静态变量 `leakInstance` 持有，导致无法被回收。

## 八、LeakCanary转储堆记录了什么
## 九、LeakCanary怎么检测内存泄漏？原理是什么？
## 十、所有内存泄漏弱引用都可以解决吗
## 十一、JVM调优做过吗？用过哪些工具？
## 十二、Java回收机制，如何减少OOM的概率/Java回收机制，如何减少OOM的概率

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542861750-d048625d-f38f-4359-8777-133643d634bf.png)

如何减少？


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732542890591-41eea308-b58e-46e6-a688-aa1a4fd30b55.png)

## 十三、哪些对象可以看成GC Root（垃圾回收根）对象
### 1、什么是 GC ROOT 对象?
GC ROOT 对象是指在 Java 虚拟机（JVM）的内存中，被直接或者间接引用的对象。这些对象被视为不可回收的，并且是垃圾收集器的根节点。

### 2、为什么需要 GC ROOT 对象?
在内存管理中，垃圾收集器需要确定哪些对象是可达的（即仍然被引用的对象），而哪些对象是不可达的（即无法被引用的对象）以便进行回收。而 GC ROOT 对象的存在，就是为了确定垃圾收集器的根节点，以便准确地判断对象的可达性。

### 3、GC ROOT 对象的实现原理?
在 JVM 中，GC ROOT 对象有以下几种类型：

a. 虚拟机栈中的引用对象

虚拟机栈中的引用对象是指在方法调用的过程中，方法的局部变量引用的对象。每个线程在执行方法时，都会在虚拟机栈中创建一个栈帧，栈帧中的局部变量就是虚拟机栈中的引用对象。

b. 方法区中静态属性引用的对象

方法区中存放着类的相关信息，包括静态变量和常量池。当静态变量引用一个对象时，该对象就是一个 GC ROOT 对象。

c. 方法区中常量引用的对象

在常量池中的常量引用的对象也是 GC ROOT 对象，例如字符串常量池中的字符串对象。

d. 本地方法栈中 JNI（Java Native Interface）引用的对象

JNI 是 Java 调用本地方法的接口，本地方法栈中 JNI 引用的对象也是 GC ROOT 对象。

e. 虚拟机内部的引用对象

虚拟机内部维护了一些对象，这些对象也是 GC ROOT 对象，例如系统类加载器、线程、JNI 引用等。

### 4、GC ROOT 对象的优点
+  确保垃圾收集器能够准确判断对象的可达性，避免误删尚未断开引用的对象。
+  提高垃圾收集器的回收效率，减少不必要的扫描和回收操作。

### 5、GC ROOT 对象的缺点
+  GC ROOT 对象占用一定的内存空间，会增加系统的内存消耗。
+  需要额外的检测和维护成本，以确保 GC ROOT 对象的准确性和一致性。

### 6、GC ROOT 对象的使用注意事项
+  开发人员应当正确管理对象的引用，避免产生不必要的 GC ROOT 对象。
+  避免在方法外部持有对象的引用，以减少 GC ROOT 对象的数量。

## 十四、垃圾回收的可达性分析
可达性分析是 Java 垃圾回收机制中判断对象是否存活的核心算法。它通过从一组称为 GC Roots 的对象出发，递归遍历所有可达的对象，从而确定哪些对象是存活的，哪些是垃圾。

### 1、GC Roots 的定义
GC Roots 是一组必须活跃的引用，它们是可达性分析的起点。常见的 GC Roots 包括以下几类：

+ 虚拟机栈中的局部变量和方法参数：这些变量在方法执行期间是活跃的。
+ 方法区中的静态变量和常量池中的引用：这些对象在类的生命周期内始终存在。
+ 本地方法栈中的 JNI 引用：这些引用用于支持本地方法调用。
+ 系统类加载器加载的类及其静态字段：这些对象通常不会被卸载。
+ 同步锁持有的对象：例如通过 `synchronized` 关键字持有的对象。

### 2、可达性分析的过程
1. 从 GC Roots 开始遍历：垃圾回收器从 GC Roots 出发，沿着对象之间的引用关系向下搜索。
2. 形成引用链：搜索过程中形成的路径称为引用链。如果一个对象可以通过引用链从 GC Roots 到达，那么这个对象被认为是可达的。
3. 标记不可达对象：如果一个对象无法通过任何引用链与 GC Roots 相关联，则认为它是不可达的，可以被标记为垃圾。

