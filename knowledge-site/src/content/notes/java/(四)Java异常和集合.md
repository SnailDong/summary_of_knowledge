## 一、Java异常类了解多少？项目中怎么用的？
### 1、介绍
java的异常类体系是一个层次化的结构，继承自`Throwable`类。`Throwable`类是所有错误（Error）和异常（Exception）的父类。

+ Error类
    - `Error`类及其子类用于表示编译时和系统错误。这些错误通常是由虚拟机自身的问题或者资源耗尽等情况引起的，大多数情况下是程序无法处理的。例如，`OutOfMemoryError`表示虚拟机内存不足，当程序运行时分配对象空间超过可用内存限制就会抛出这个错误。还有`StackOverflowError`，当方法调用深度过大（如递归调用层数过多）导致栈空间溢出时会抛出。
+ Exception类
    - `Exception`类是程序中可以处理的异常的父类。它又分为受检查异常（checked exception）和非受检查异常（unchecked exception）。
    - 受检查异常
        * 受检查异常是指编译器要求程序员必须处理的异常。这些异常通常是在程序运行过程中可能出现的、合理的异常情况。例如，`IOException`是受检查异常，当进行文件输入输出操作（如打开文件、读写文件等）时可能会出现。比如在读取文件内容时，文件不存在、磁盘损坏等情况都可能抛出`IOException`。如果方法可能会抛出受检查异常，那么这个方法必须使用`throws`关键字声明异常，或者在方法内部使用`try - catch`语句块来捕获异常。
    - 非受检查异常
        * 非受检查异常包括`RuntimeException`类及其子类。这些异常通常是由于程序中的逻辑错误引起的，编译器不会强制要求程序员处理。例如，`NullPointerException`是常见的非受检查异常，当程序试图访问一个对象的成员，但这个对象引用为`null`时就会抛出。还有`ArrayIndexOutOfBoundsException`，当访问数组元素时，索引值超出了数组的有效范围就会抛出这个异常。由于这些异常是程序逻辑问题导致的，一般情况下应该通过合理的程序设计来避免，而不是依赖异常处理机制。

常用异常类

+ IOException
    - 如前文所述，用于处理输入输出操作相关的异常。它有很多子类，比如`FileNotFoundException`，当试图打开一个不存在的文件进行读写操作时会抛出。还有`EOFException`，表示输入数据已达到末尾，这在读取文件或者网络数据流时可能会用到。
+ SQLException
    - 用于处理数据库操作相关的异常。当执行SQL语句出错，如语法错误、数据库连接失败等情况时会抛出。例如，在执行一个查询语句时，如果表名写错了，就会抛出`SQLException`。
+ NumberFormatException
    - 当尝试将一个字符串转换为数字类型，但字符串的格式不符合数字格式要求时会抛出。比如，使用`Integer.parseInt("abc")`就会抛出`NumberFormatException`，因为字符串“abc”不能转换为整数。
+ IllegalArgumentException
    - 表示传递给方法的参数不合法。例如，一个方法要求传入的参数必须是正数，但传入了一个负数，就可以抛出这个异常来提示参数错误。

## 二、Java出异常怎么保证资源关闭
### 1、介绍
资源关闭的资源通常指的是需要显式关闭的资源，如文件流、网络连接、数据库连接等。

1. 使用`try-finally`语句块

`try-finally`语句块是最基本的资源关闭方式。无论是否发生异常，`finally`块中的代码都会执行，因此可以在这里关闭资源。

2. 使用`try-with-resources`语句（Java 7及以上）

从Java 7开始，引入了`try-with-resources`语句，这是一种更简洁且安全的方式来自动关闭实现了`AutoCloseable`接口的资源。使用`try-with-resources`语句，可以在语句结束时自动关闭资源，无需显式调用`close()`方法。

```java
try (FileInputStream fis = new FileInputStream("example.txt")) {
    // 使用文件流进行操作
} catch (IOException e) {
    e.printStackTrace();
}
```

`FileInputStream`对象`fis`在`try`语句块结束时会自动关闭，无需在`finally`块中手动关闭。这种方式不仅减少了代码量，也减少了因忘记关闭资源而导致的资源泄露问题。

## 三、Java语言中，finally一定会执行吗
一般会，特殊情况下可能不会，

例如在进入try或catch块后，使用了 System.exit(int) 退出程序。

执行finally前程序非正常挂掉也不会执行了

[Java语言中，finally一定会执行吗？_java finally一定会执行吗-CSDN博客](https://blog.csdn.net/qq_22136439/article/details/123028976)

## 四、try里面有return，finally还执行吗
### 1、介绍
try块中有return语句时，finally块仍然会执行。finally块的作用是确保在try块或catch块执行完毕后，无论是否发生异常，finally块中的代码都会被执行。

当`try`块中有`return`语句时，执行顺序如下：

1. 执行`try`块中的代码。
2. 遇到`return`语句时，记录返回值。
3. 执行`finally`块中的代码。
4. 最后返回之前记录的值。

返回值的覆盖：如果`finally`块中也有`return`语句，那么`finally`块中的`return`会覆盖`try`或`catch`块中的`return`。

异常抛出：如果`finally`块中抛出了异常，那么`try`或`catch`块中的`return`将不会执行

### 2、总结
+ `finally`块总是执行：无论`try`或`catch`块中是否发生异常或`return`语句，`finally`块都会执行。
+ 返回值的覆盖：如果`finally`块中有`return`语句，它会覆盖`try`或`catch`块中的`return`。
+ 异常抛出：如果`finally`块中抛出了异常，会中断`try`或`catch`块中的`return`。

## 五、集合分为哪两种

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1735616897365-27c13c53-2955-4b98-b50f-8065b1f96fec.png)

Java集合框架主要包括两种类型的容器，一种是集合（Collection），另一种是图（Map）。Collection接口又有3种子类型，List、Set和Queue，再下面是一些抽象类，最后是具体实现类，常用的有ArrayList、LinkedList、HashSet、LinkedHashSet等等。

Map常用的有HashMap,LinkedHashMap等。

### 1、list和map的介绍
[常用的几种java集合类总结_java集合分为哪几大类-CSDN博客](https://blog.csdn.net/gejiangbo222/article/details/81540616)

## 六、ArrayList的特点是怎么样的？
arraylist的大小是如何自动增加的

什么情况下会使用arraylist?(应用场景)

优点：尾插效率高、支持随机访问

缺点：中间插入或者删除效率低

如果要排序就不要使用，如果经常增加删除不要使用，使用linklist，如果只需要查找可以使用


在索引中arratlist增加和删除效率很低，因为要反复arraycopy，很好内存和时间

删除节点？使用迭代器或者从尾部删除

遍历方式：迭代器，for循环（不要随便用，删除会出问题）

## 七、arraylist底层原理
arraylist底层仍然是普通的数组，只不过可以动态的扩容，通过设置当前的容量、存储元素的数组以及扩容的策略实现，扩容时使用数组的拷贝

```java
Arrays.copyOf(elementData, newCapacity)
```

如果没有扩容机制，每次添加元素时都需要重新分配内存并复制数组，这会导致频繁的内存分配和复制操作，严重影响性能。通过动态扩容机制，`ArrayList` 可以减少这种频繁的内存分配，每次扩容时，数组容量会增加到原来的1.5倍，这样可以减少后续的扩容次数。每次扩容时，会一次性分配足够的内存来容纳更多的元素，而不是每次添加一个元素就分配一次内存。这种机制使得 `ArrayList` 在添加元素时更加高效，适合需要动态添加元素的场景。

## 八、Arraylist和LinkList的区别
+ `ArrayList`：
    - 基于动态数组实现，内存布局是连续的，支持快速随机访问。
    - 默认初始容量为10，扩容时会增长到原来的1.5倍。
    - 适用于读多写少的场景，特别是需要频繁随机访问的场景
+ `LinkedList`：
    - 基于双向链表实现，内存布局是离散的，每个节点包含数据及前后指针。
    - 没有预分配容量，动态添加节点。
    - 适用于需要频繁头尾操作的场景，如实现队列。
    - 适合实现双端队列，支持高效的头尾插入和删除。

性能测试数据

+ 随机访问1万次：
    - `ArrayList`：2ms
    - `LinkedList`：650ms。
+ 尾部插入1万次：
    - `ArrayList`：3ms
    - `LinkedList`：5ms。
+ 头部插入1万次：
    - `ArrayList`：420ms
    - `LinkedList`：8ms
+ 如果需要频繁的随机访问和较少的修改操作，优先选择 `ArrayList`。
+ 如果需要频繁的头尾插入和删除操作，优先选择 `LinkedList`。
+ 在多线程环境下，根据写操作的频率选择合适的线程安全替代方案，如 `CopyOnWriteArrayList`。

## 九、链表查找时间复杂度？怎么优化？
## 十、跳表实现说一下？时空复杂度？
### 1、介绍
### 2、跳表实现
```java
internal class SkipList {

    private val head = Node(value = 0, height = DEFAULT_MAX_LEVEL) //头节点
    private var currentLevel = 0 //表示当前nodes的实际层数，它从1开始

    fun add(value: Int) {
        val updateNode = Array<Node?>(DEFAULT_MAX_LEVEL) { null }
        var current = head

        for (i in DEFAULT_MAX_LEVEL - 1 downTo 0) {
            while (current.next[i]?.value != null && current.next[i]!!.value < value) {
                current = current.next[i]!!
            }
            updateNode[i] = current
        }
        val level = randomLevel()
        val newNode = Node(value, level)
        for (i in 0 until level) {
            newNode.next[i] = updateNode[i]?.next?.get(i)
            updateNode[i]?.next?.set(i, newNode)
        }

        if (level > currentLevel) {
            currentLevel = level
        }
    }

    fun search(value: Int): Boolean {
        var current = head
        for (i in DEFAULT_MAX_LEVEL - 1 downTo 0) {
            while (current.next[i]?.value != null && current.next[i]!!.value < value) {
                current = current.next[i]!!
            }
        }
        return current.next[0]?.value == value
    }

    fun erase(value: Int): Boolean {
        val update = Array<Node?>(DEFAULT_MAX_LEVEL) { null }
        var current = head
        for (i in DEFAULT_MAX_LEVEL - 1 downTo 0) {
            while (current.next[i]?.value != null && current.next[i]!!.value < value) {
                current = current.next[i]!!
            }
            update[i] = current
        }

        if (current.next[0]?.value != value) {
            return false
        }

        for (i in 0 until DEFAULT_MAX_LEVEL) {
            if (update[i]?.next?.get(i)?.value == value) {
                update[i]?.next?.set(i, update[i]?.next?.get(i)?.next?.get(i))
            }
        }
        return true
    }


    internal inner class Node(
        var value: Int,
        var height: Int,
        var next: Array<Node?> = Array((height)) { null }
    )

    companion object {
        /
         * 最大层数
         */
        private const val DEFAULT_MAX_LEVEL = 32

        /
         * 随机层数概率，也就是随机出的层数，
         * 在 一层索引以上(不包括第一层)的概率，层数不超过maxLevel，层数的起始号为0
         * 0为原始数据层，索引层数从1开始
         */
        private const val DEFAULT_P_FACTOR = 0.25

        /
         * 随机一个层数
         */
        private fun randomLevel(): Int {
            var level = 1
            while (Math.random() < DEFAULT_P_FACTOR && level < DEFAULT_MAX_LEVEL) {
                level++
            }
            return level
        }
    }
}
```

## 十一、HashMap的原理和性能优化
[深入分析 JDK8 中 HashMap 的原理、实现和优化 - 小创 - 博客园](https://www.cnblogs.com/chuonye/p/10907457.html)

优化策略

为了提高HashMap的性能，可以采取以下优化策略：

初始化容量和负载因子：在创建HashMap时，可以指定初始容量（Initial Capacity）和负载因子（Load Factor）。初始容量是桶数组的大小，负载因子则决定了何时进行扩容。选择合适的初始容量和负载因子可以减少扩容次数和再哈希的开销。例如，如果知道将要存储的键值对数量大致为1000个，可以将初始容量设置为1000左右的一个素数，负载因子设置为0.75。

自定义哈希函数：对于自定义对象作为键的情况，可以通过覆盖hashCode方法来提供高效的哈希函数实现。一个好的哈希函数应该能够将键均匀分布到各个桶中，以减少哈希冲突和链表长度。

避免使用可变对象作为键：由于HashMap是基于键的哈希码来存储元素的，如果键对象的哈希码在存储后发生了变化（例如修改了对象的属性），那么将无法正确检索到该键值对。因此，应该避免使用可变对象作为HashMap的键。

及时清理无用元素：如果HashMap中存储了大量的无用元素（即不再需要或者已经过期的键值对），应该及时调用remove方法来清理这些元素，以释放空间并提高性能。

## 十二、hashmap如果只存放一个元素是怎么存的
## 十三、为什么设计hashmap这种结构，和Arraylist比起来有什么性能或者其他的优势
## 十四、从源码角度分析HashMap和SparseArray的性能
### 1、`HashMap` 源码分析
`HashMap` 是基于哈希表实现的，其性能特点主要取决于哈希函数、冲突解决机制和扩容策略。

+ 哈希函数：
    - `HashMap` 使用哈希函数将键映射到数组的索引位置。哈希函数的目标是尽量减少冲突，即不同键映射到同一索引的情况。
    - 如果发生冲突，`HashMap` 使用链表（或红黑树）来存储冲突的键值对。
+ 扩容机制：
    - 当哈希表的负载因子（`size / capacity`）超过默认值0.75时，`HashMap` 会进行扩容。
    - 扩容时，数组容量会加倍，并重新计算所有键的哈希值，将键值对重新分配到新的数组中。
+ 性能特点：
    - 平均时间复杂度：`HashMap` 的插入、删除和查找操作的平均时间复杂度为 O(1)，但在最坏情况下（大量冲突）可能退化为 O(n)。
    - 内存占用：`HashMap` 需要存储键和值的对象，以及额外的哈希表结构，内存占用相对较高。会自动装箱和拆箱。 Java 的集合类（如 `HashMap`）只能存储对象，而不能直接存储基本数据类型。因此，Java 会自动将 例如`int` 类型的 `1` 转换为 `Integer` 类型的对象，这个过程就是自动装箱。性能开销：装箱和拆箱操作涉及方法调用和对象创建，这比直接操作基本数据类型要慢。内存开销：包装类对象会占用更多的内存，因为它们是对象，包含了额外的元数据（如对象头、类信息等）。

### 2、`SparseArray` 源码分析
`SparseArray` 是 Android 框架提供的一个优化类，专门用于存储整型键和对象值的映射。

SparseArray在RecycleView的缓存复用第四级缓存用到了。详情看study6文章中描述。

+ 内部结构：
    - `SparseArray` 使用两个数组来存储键和值，一个数组存储键（`int[] keys`），另一个数组存储值（`Object[] values`）。
    - 这种结构避免了 `HashMap` 中的自动装箱和拆箱操作，从而减少了内存占用。
+ 性能特点：
    - 随机访问：`SparseArray` 的随机访问时间复杂度为 O(1)，因为它直接通过索引访问。
    - 插入和删除：插入和删除操作的时间复杂度为 O(1)，但在某些情况下（如倒序插入）可能会退化为 O(n)，因为需要维护数组的有序性。
    - 内存占用：`SparseArray` 的内存占用比 `HashMap` 更低，因为它避免了自动装箱和额外的哈希表结构。

### 3、性能对比
+ 内存占用：
    - `SparseArray` 比 `HashMap` 更省内存，因为它避免了自动装箱和额外的哈希表结构。
    - 在存储大量整型键时，`SparseArray` 的内存占用显著低于 `HashMap`。
+ 随机访问：
    - `SparseArray` 和 `HashMap` 的随机访问时间复杂度均为 O(1)，但在实际测试中，`SparseArray` 的访问速度略快。
+ 插入和删除：
    - 正序插入：`SparseArray` 的插入速度比 `HashMap` 稍快。
    - 倒序插入：`SparseArray` 的倒序插入速度比正序插入慢10倍以上，而 `HashMap` 的插入速度不受插入顺序的影响。
    - 删除操作：`SparseArray` 和 `HashMap` 的删除速度相当。

### 4、适用场景
+ `HashMap`：
    - 适用于键值对的键不是整型，或者键的范围非常大。
    - 适用于需要频繁随机访问的场景。
+ `SparseArray`：
    - 适用于键是整型且范围较小的场景。
    - 适用于内存敏感的应用，如游戏或长时间运行的应用。
    - 适用于需要减少自动装箱和拆箱开销的场景。

## 十五、hash冲突怎么处理？除了拉链法你还知道哪些？
除了拉链法（链地址法），还有以下几种常见的哈希冲突处理方法：

### 1、开放地址法（Open Addressing）
开放地址法的核心思想是当发生冲突时，顺序地探查哈希表中的下一个位置，直到找到一个空闲的位置。具体实现方式包括：

+ 线性探测（Linear Probing）：冲突时顺序检查下一个位置，直到找到空位。
+ 二次探测（Quadratic Probing）：冲突时按照二次方的步长（如1², -1², 2², -2²等）进行探测。
+ 双重散列（Double Hashing）：使用第二个哈希函数计算探测步长，避免聚集。

### 2、再哈希法（Rehashing）
当发生冲突时，使用另一个哈希函数重新计算地址，直到找到不冲突的位置。这种方法可以有效避免聚集，但增加了计算时间。

### 3、建立公共溢出区
将哈希表分为基本表和溢出表。当发生冲突时，将冲突的元素存储到公共溢出区。查找时，先在基本表中查找，如果未找到，则在溢出区中查找。这种方法简化了实现，但在高负载下可能导致溢出区负载过重。

### 4、线性再散列法
当哈希表的负载因子达到一定阈值时，重新分配一个更大的哈希表，并重新计算所有键的哈希值，将它们插入到新的哈希表中。这种方法主要用于动态调整哈希表的大小，也可以间接解决冲突问题。

### 5、伪随机探测
在发生冲突时，通过伪随机数生成器生成一个随机步长，按照该步长进行探测，直到找到空位。

### 6、优缺点总结
+ 开放地址法：内存访问连续，适合利用CPU缓存，但需要更多空间。
+ 再哈希法：不易产生聚集，但增加了计算时间。
+ 公共溢出区：实现简单，但在高负载下可能影响性能。
+ 线性再散列法：动态调整哈希表大小，适合动态数据。
+ 伪随机探测：避免聚集，但随机性可能导致不可预测的性能。

## 十六、concurrentHashMap的实现思路
### 1、JDK1.7版本
ConcurrentHashMap避免了对全局加锁改成了局部加锁操作，JDK1.7中ConcurrentHashMap采用了数组+Segment+分段锁的方式实现。

ConcurrentHashMap中的分段锁称为Segment，它即类似于HashMap的结构，即内部拥有一个Entry数组，数组中的每个元素又是一个链表,同时又是一个ReentrantLock（Segment继承了ReentrantLock）。

ConcurrentHashMap使用分段锁技术，将数据分成一段一段的存储，然后给每一段数据配一把锁，当一个线程占用锁访问其中一个段数据的时候，其他段的数据也能被其他线程访问，能够实现真正的并发访问。如下图是ConcurrentHashMap的内部结构图：


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1738988349334-f670dcca-1e97-4d62-b1b1-65cc9ff6533c.png)

ConcurrentHashMap定位一个元素的过程需要进行两次Hash操作。

第一次Hash，定位到Segment。

第二次Hash，定位到元素所在的链表的头部。

坏处

这一种结构的带来的副作用是Hash的过程要比普通的HashMap要长

好处

写操作的时候可以只对元素所在的Segment进行加锁即可，不会影响到其他的Segment，这样，在最理想的情况下，ConcurrentHashMap可以最高同时支持Segment数量大小的写操作（刚好这些写操作都非常平均地分布在所有的Segment上）。

所以，通过这一种结构，ConcurrentHashMap的并发能力可以大大的提高。

### 2、JDK1.8版本
JDK8中ConcurrentHashMap参考了JDK8 HashMap的实现，采用了数组+链表+红黑树的实现方式来设计，如下图所示：


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1738988398979-a0ed4dce-bdf2-4cbf-9e61-1a5a92d0337f.png)

内部大量采用CAS（compare and swap比较交换）操作 1.数据结构
取消了Segment分段锁的数据结构，取而代之的是数组+链表+红黑树的结构。

2.保证线程安全机制
JDK1.7采用segment的分段锁机制实现线程安全，其中segment继承自ReentrantLock。JDK1.8采用CAS+Synchronized保证线程安全。

3.锁的粒度
原来是对需要进行数据操作的Segment加锁，现调整为对每个数组元素加锁（Node）。

4.链表转化为红黑树
定位结点的hash算法简化会带来弊端,Hash冲突加剧,因此在链表节点数量大于8时，会将链表转化为红黑树进行存储。

5.查询时间复杂度
从原来的遍历链表O(n)，变成遍历红黑树O(logN)。

`ConcurrentHashMap` 通过以下机制确保数据的一致性和可见性：

+ 锁机制：每个哈希桶（或链表/红黑树）都有自己的锁。当一个线程对某个键进行 `put` 操作时，它会获取该键所在桶的锁。其他线程对该桶的修改操作会被阻塞，直到锁被释放。
+ `volatile` 修饰：节点的值和下一个节点指针使用 `volatile` 修饰，确保了线程之间的可见性。即使在 `put` 操作中修改了节点的值，这些修改对其他线程是可见的。
+ CAS 操作：在插入新节点时，`put` 方法使用 CAS 操作来更新数组中的桶。如果 CAS 操作失败，说明有其他线程正在修改该桶，`put` 方法会重新尝试。

所以ConcurrentHashMap map在两个线程A\B分别执行a=map.get(key),map.put(key)，如果线程B执行put还没有执行到修改值的一步，而线程A此时之心get，a的值是修改前的，因为 `ConcurrentHashMap` 的设计确保了在并发环境下，读操作（`get`）不会看到未完成的写操作（`put`）的中间状态。

## 十七、concurrentHashMap你能实现出来吗？
[ConcurrentHashMap原理详解(太细了)-CSDN博客](https://blog.csdn.net/qq_42068856/article/details/126091526)

```java
//ConcurrentHashMap使用volatile修饰节点数组，保证其可见性，禁止指令重排。
transient volatile Node<K,V>[] table;

static class Node<K,V> implements Map.Entry<K,V> {
	final int hash;
	final K key;
	volatile V val;
	volatile Node<K,V> next;

	Node(int hash, K key, V val) {
		this.hash = hash;
		this.key = key;
		this.val = val;
	}

	Node(int hash, K key, V val, Node<K,V> next) {
		this(hash, key, val);
		this.next = next;
	}

	public final K getKey()     { return key; }
	public final V getValue()   { return val; }
	public final int hashCode() { return key.hashCode() ^ val.hashCode(); }
	public final String toString() {
		return Helpers.mapEntryToString(key, val);
	}
	public final V setValue(V value) {
		throw new UnsupportedOperationException();
	}

	public final boolean equals(Object o) {
		Object k, v, u; Map.Entry<?,?> e;
		return ((o instanceof Map.Entry) &&
				(k = (e = (Map.Entry<?,?>)o).getKey()) != null &&
				(v = e.getValue()) != null &&
				(k == key || k.equals(key)) &&
				(v == (u = val) || v.equals(u)));
	}

	/
         * Virtualized support for map.get(); overridden in subclasses.
         */
	Node<K,V> find(int h, Object k) {
		Node<K,V> e = this;
		if (k != null) {
			do {
				K ek;
				if (e.hash == h &&
					((ek = e.key) == k || (ek != null && k.equals(ek))))
					return e;
			} while ((e = e.next) != null);
		}
		return null;
	}
}

public V get(Object key) {
	Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
	//// 计算key的hash值
	int h = spread(key.hashCode());
	if ((tab = table) != null && (n = tab.length) > 0 &&
		(e = tabAt(tab, (n - 1) & h)) != null) {// 读取首节点的Node元素
		if ((eh = e.hash) == h) {
			if ((ek = e.key) == key || (ek != null && key.equals(ek)))
				return e.val;
		}
		// hash为负值，表示正在扩容。
		//这时需要用到ForwardingNode的find()方法定位到nextTable。
        //   1) eh=-1，说明该节点是一个ForwardingNode，正在扩容迁移，
		//		此时调用ForwardingNode的find()方法去nextTable里找
        //   2) eh=-2，说明该节点是一个TreeBin，
		//		此时调用TreeBin的find()方法遍历红黑树，
		//		注意：由于红黑树可能正在旋转变色，所以find()方法里会加一个读写锁。
		else if (eh < 0)
			return (p = e.find(h, key)) != null ? p.val : null;
		// eh >=0 说明该节点是一个链表节点，直接遍历链表即可。
		while ((e = e.next) != null) {
			if (e.hash == h &&
				((ek = e.key) == key || (ek != null && key.equals(ek))))
				return e.val;
		}
	}
	return null;
}
public V put(K key, V value) {
	return putVal(key, value, false);
}

final V putVal(K key, V value, boolean onlyIfAbsent) {
	if (key == null || value == null) throw new NullPointerException();
	int hash = spread(key.hashCode());
	int binCount = 0;
	for (Node<K,V>[] tab = table;;) {
		Node<K,V> f; int n, i, fh; K fk; V fv;
		//如果tab未被初始化，则先将tab初始化。
		//此时，这轮循环结束，因为被乐观锁锁住，开始下一轮循环。
		if (tab == null || (n = tab.length) == 0)
			tab = initTable();
		//通过key的hash值来判断table中是否存在相同的key，
		//如果不存在，执行casTabAt()方法
		else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
			if (casTabAt(tab, i, null, new Node<K,V>(hash, key, value)))
				break;                   // no lock when adding to empty bin
		}
		//判断的是tab的状态，MOVED表示在扩容中，如果在扩容中，帮助其扩容
		else if ((fh = f.hash) == MOVED)
			tab = helpTransfer(tab, f);
		else if (onlyIfAbsent // check first node without acquiring lock
				 && fh == hash
				 && ((fk = f.key) == key || (fk != null && key.equals(fk)))
				 && (fv = f.val) != null)
			return fv;
		else {
			//key的hash值位置不为null(之前的判断是hash值为null时直接做插入操作)，
			//表示发生了hash冲突，此时节点就要通过链表的形式存储这个插入的新值
			V oldVal = null;
			//只有在发生hash冲突的时候才加了排它锁，锁的是哈希桶
			synchronized (f) {
				//重新判断当前节点是不是第二轮判断过的节点，
				//如果不是，表示节点被其他线程改过了
				if (tabAt(tab, i) == f) {
					//判断是否在扩容中，如果不是，其他线程没改过
					if (fh >= 0) {
						binCount = 1;
						//for循环，循环遍历这个节点上的链表，
						for (Node<K,V> e = f;; ++binCount) {
							K ek;
							//找到一个hash值相同，且key也完全相同的节点，更新这个节点
							if (e.hash == hash &&
								((ek = e.key) == key ||
								 (ek != null && key.equals(ek)))) {
								oldVal = e.val;
								if (!onlyIfAbsent)
									e.val = value;
								break;
							}
							Node<K,V> pred = e;
							//如果找不到，往链表最后插入这个新节点
							if ((e = e.next) == null) {
								pred.next = new Node<K,V>(hash, key, value);
								break;
							}
						}
					}
					//如果是红黑树，遍历红黑树
					else if (f instanceof TreeBin) {
						Node<K,V> p;
						binCount = 2;
						if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
															  value)) != null) {
							oldVal = p.val;
							if (!onlyIfAbsent)
								p.val = value;
						}
					}
					else if (f instanceof ReservationNode)
						throw new IllegalStateException("Recursive update");
				}
			}
			if (binCount != 0) {
				if (binCount >= TREEIFY_THRESHOLD)
					treeifyBin(tab, i);
				if (oldVal != null)
					return oldVal;
				break;
			}
		}
	}
	addCount(1L, binCount);
	return null;
}
```

