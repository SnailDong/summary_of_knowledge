## 一、自定义view的流程
## 二、自定义View的注意点
自定义`View`需要提供多个构造方法，以支持不同的使用场景：

+ 带`Context`构造方法：用于代码中直接创建`View`实例。
+ 带`Context`和`AttributeSet`的构造方法：用于从布局文件中实例化`View`。
+ 带`Context`、`AttributeSet`和`defStyleAttr`的构造方法：用于支持自定义属性的默认值。

自定义属性可以让你在布局文件中配置`View`的行为和外观。需要在`res/values/attrs.xml`中定义属性，并在`View`的构造方法中读取这些属性。

```java
<declare-styleable name="CustomView">
    <attr name="customColor" format="color" />
    <attr name="customText" format="string" />
</declare-styleable>
```

```java
public CustomView(Context context, AttributeSet attrs) {
    super(context, attrs);
    TypedArray a = context.obtainStyledAttributes(attrs, R.styleable.CustomView);
    int color = a.getColor(R.styleable.CustomView_customColor, Color.BLACK);
    String text = a.getString(R.styleable.CustomView_customText);
    a.recycle();
}
```

重写`onMeasure`方法来定义`View`的大小。确保正确处理测量规范（`MeasureSpec`），并调用`setMeasuredDimension`设置最终大小。

重写`onLayout`方法来定义子`View`的位置。如果你的`View`是一个`ViewGroup`，需要正确布局子`View`。

重写`onDraw`方法来绘制`View`的内容。确保使用`Canvas`对象进行绘制操作，并注意绘制的效率。

重写事件处理方法（如`onTouchEvent`、`onKeyDown`等）来处理用户交互。

性能优化

+ 避免在`onDraw`中进行复杂的计算：将复杂的计算移到`onMeasure`或`onLayout`中。
+ 使用缓存：对于复杂的绘制操作，可以使用`Bitmap`缓存绘制结果。
+ 减少`invalidate`调用：尽量减少不必要的重绘，只重绘需要更新的部分。

## 三、自定义View一般关注哪些方法
## 四、自定义View与ViewGroup的区别
首先先看View和ViewGroup：

`View`是所有UI组件的基类，用于表示用户界面中的一个组件，如按钮、文本框、图片等。`View`负责绘制自己，并处理自己的事件。

而`ViewGroup`是`View`的子类，用于管理一组`View`。`ViewGroup`本身是一个容器，可以包含多个`View`或`ViewGroup`。`ViewGroup`负责布局其子`View`，并分发事件给子`View`。

从功能上：

自定义`View`主要用于创建具有特定功能和外观的单个UI组件。例如，一个自定义的进度条、一个带有特殊绘制效果的按钮等。适用于需要高度自定义外观和行为的单个组件。

自定义`ViewGroup`主要用于创建具有特定布局逻辑的容器。例如，一个自定义的网格布局、一个带有特殊排列方式的线性布局等。适用于需要自定义布局逻辑的场景，管理多个`View`的排列和显示。

从实现上：

自定义`View`通常继承自`View`类，并重写`onMeasure`、`onDraw`等方法。

自定义`ViewGroup`通常继承自`ViewGroup`类，并重写`onMeasure`和`onLayout`方法。

从事件的处理上：

自定义`View`主要处理自己的事件，通过重写`onTouchEvent`方法来响应触摸事件。

自定义`ViewGroup`需要处理事件的分发，通过重写`onInterceptTouchEvent`和`onTouchEvent`方法来决定是否拦截事件，并将事件分发给子`View`。

性能优化：

（1）自定义View

+ 减少重绘：尽量减少`invalidate`调用，只重绘需要更新的部分。`invalidate()`方法会触发视图的重绘操作，而重绘是一个相对耗时的过程，如果只需要更新视图的一部分区域，可以使用`invalidate(int left, int top, int right, int bottom)`方法，指定重绘的区域，而不是重绘整个视图，在调用`invalidate()`之前，应检查数据是否真正发生了变化。
+ 使用缓存：对于复杂的绘制操作，可以使用`Bitmap`缓存绘制结果。

（2）自定义ViewGroup

+ 优化布局：尽量减少不必要的布局计算，避免嵌套过多的`ViewGroup`。
+ 减少测量：优化`onMeasure`方法，避免重复测量子`View`。

总结

+ 自定义`View`：
    - 用于创建具有特定功能和外观的单个UI组件。
    - 重写`onMeasure`、`onDraw`等方法。
    - 适用于需要高度自定义外观和行为的单个组件。
+ 自定义`ViewGroup`：
    - 用于创建具有特定布局逻辑的容器。
    - 重写`onMeasure`和`onLayout`方法。
    - 适用于需要自定义布局逻辑的场景，管理多个`View`的排列和显示。

## 五、view的绘制流程是从activity的哪个生命周期开始的
View的绘制流程通常是在Activity的onResume生命周期方法之后开始的。具体来说，View的绘制流程（包括测量、布局和绘制）是在Activity的窗口（Window）被附加到WindowManager并准备好显示内容时触发的。

在源码中，ActivityThread中执行handleResumeActivity调用performResumeActivity，然后调用到Activity的performResume方法，而添加view的动作是在此方法之后调用的，WindowManager添加DecorView后才开始了View的绘制流程。

## 六、activity、window、view三者的联系和区别
### 1、定义
#### (1) Activity
`Activity`是Android应用中的一个组件，用于表示一个用户界面屏幕。它是用户交互的入口点，可以包含一个或多个`View`来构建用户界面。`Activity`的生命周期由Android系统管理，它通过回调方法（如`onCreate`、`onStart`、`onResume`等）来响应生命周期事件。

#### (2) Window
`Window`是Android系统中的一个抽象概念，表示一个窗口。每个`Activity`都有一个`Window`，用于显示其内容。`Window`是`Activity`和`View`之间的桥梁，它管理着`View`的显示和事件分发。`Window`的实现类是`PhoneWindow`，它负责创建和管理`DecorView`（根视图）。

#### (3) View
`View`是Android中的一个类，用于表示用户界面中的一个组件。`View`可以是一个按钮、文本框、图片等。`View`是用户界面的基本构建块，可以通过布局文件或代码动态创建。`View`的绘制和事件处理机制是Android UI的核心。

### 2、联系
#### (1) Activity与Window
+ `Activity`依赖于`Window`：每个`Activity`都有一个`Window`，用于显示其内容。`Activity`通过`Window`来管理其用户界面。
+ `Window`管理`Activity`的生命周期：`Window`通过回调方法（如`onCreatePanelView`、`onWindowFocusChanged`等）与`Activity`的生命周期方法协同工作。

#### (2) Window与View
+ `Window`包含`View`：`Window`通过`DecorView`（根视图）来管理其内容。`DecorView`是一个`FrameLayout`，它包含了`Activity`的布局内容。
+ `Window`负责`View`的显示和事件分发：`Window`通过`DecorView`将事件分发给子`View`，并管理`View`的显示和隐藏。

#### (3) Activity与View
+ `Activity`包含`View`：`Activity`通过`Window`来管理其`View`。`Activity`的布局文件最终会被解析为一个`View`层次结构。
+ `Activity`与`View`的生命周期：`Activity`的生命周期方法（如`onCreate`、`onStart`等）会影响`View`的生命周期（如`onAttachedToWindow`、`onDetachedFromWindow`等）。

### 3、区别
#### (1) Activity
+ 功能：表示一个用户界面屏幕，管理用户交互和生命周期。
+ 生命周期：由系统管理，通过回调方法响应生命周期事件。
+ 作用范围：一个完整的用户界面屏幕。

#### (2) Window
+ 功能：表示一个窗口，管理`View`的显示和事件分发。
+ 生命周期：与`Activity`的生命周期紧密相关，但更底层。
+ 作用范围：`Activity`的显示容器。

#### (3) View
+ 功能：表示用户界面中的一个组件，如按钮、文本框等。
+ 生命周期：通过`View`的生命周期方法（如`onAttachedToWindow`、`onDetachedFromWindow`等）响应事件。
+ 作用范围：用户界面中的一个组件。

### 4、总结
+ `Activity`：表示一个用户界面屏幕，管理用户交互和生命周期。
+ `Window`：表示一个窗口，管理`View`的显示和事件分发，是`Activity`和`View`之间的桥梁。
+ `View`：表示用户界面中的一个组件，如按钮、文本框等，是用户界面的基本构建块。

## 七、DocerView、ViewRootImpl、View之间的关系
`DecorView`、`ViewRootImpl`和`View`是构建用户界面的核心组件。

### 1、DecorView
`DecorView`是`Activity`窗口的根视图，它是`FrameLayout`的一个子类，通常由`PhoneWindow`创建。`DecorView`包含了`Activity`的布局内容，如标题栏、内容区域等。

### 2、ViewRootImpl
`ViewRootImpl`是连接`WindowManager`和`View`系统的桥梁。它实现了`ViewParent`接口，可以作为`View`的父容器。`ViewRootImpl`负责将`DecorView`附加到窗口，并处理布局、绘制和事件分发。

对于一个Activity来说，通常只有一个`ViewRootImpl`实例。这是因为每个Activity通常对应一个Window，而每个Window通过`WindowManager`添加到屏幕时，会创建一个`ViewRootImpl`实例。如果有多个窗口则会有多个`ViewRootImpl`实例。

### 3、View
`View`是Android中所有视图组件的基类，用于表示用户界面中的一个组件，如按钮、文本框等。

### 4、三者之间的关系
#### (1) DecorView与ViewRootImpl
+ 创建关系：当`Activity`启动时，`WindowManager`会创建一个`ViewRootImpl`实例，并将`DecorView`传递给它。
+ 附加关系：`ViewRootImpl`通过`setView`方法将`DecorView`附加到窗口，并开始布局和绘制流程。

#### (2) ViewRootImpl与View
+ 管理关系：`ViewRootImpl`管理整个视图层次结构，从`DecorView`开始，递归地处理所有子`View`的布局和绘制。
+ 事件分发：`ViewRootImpl`负责将用户输入事件（如触摸、按键）分发给`DecorView`，然后由`DecorView`向下传递到具体的`View`。

#### (3) DecorView与View
+ 容器关系：`DecorView`是一个`ViewGroup`，它包含了`Activity`的布局内容，如标题栏、内容区域等。
+ 层次关系：`DecorView`是视图层次结构的根节点，其他`View`（如按钮、文本框）都是它的子节点。

### 5、总结
+ `DecorView`：`Activity`窗口的根视图，包含`Activity`的布局内容。
+ `ViewRootImpl`：连接`WindowManager`和`View`系统的桥梁，负责布局、绘制和事件分发。
+ `View`：表示用户界面中的一个组件，如按钮、文本框等。

## 八、View的绘制原理
## 九、onMeasure的流程流转是咋样的
## 十、view的分发机制、滑动冲突
## 十一、Android 场景，父容器中有两个按钮，点击A按钮然后滑动到B按钮再滑动到A按钮，事件分发是什么样的，如果A按钮实现了onclick动作，是否会响应
[面试题：手指从按钮 A 平移到 B，会发生什么？为什么？_手动 obtain 一个 down event 发送给移动到的 target-CSDN博客](https://blog.csdn.net/allisonchen/article/details/132916609)

在 Android 中，触摸事件的分发主要涉及三个方法：

+ `dispatchTouchEvent(MotionEvent event)`：事件分发的入口方法，负责将事件传递给子视图或自己处理。
+ `onInterceptTouchEvent(MotionEvent event)`：`ViewGroup` 的方法，用于决定是否拦截事件。如果返回 `true`，则事件会被拦截，不再传递给子视图。
+ `onTouchEvent(MotionEvent event)`：用于处理事件的方法。如果返回 `true`，表示事件被消费；如果返回 `false`，事件会继续向上分发。
1. 点击按钮 A：
    - 父容器的 `dispatchTouchEvent` 收到事件，调用 `onInterceptTouchEvent`。
    - `onInterceptTouchEvent` 默认返回 `false`（不拦截），事件传递给按钮 A。
    - 按钮 A 的 `dispatchTouchEvent` 收到事件，调用 `onTouchEvent`。
    - 按钮 A 的 `onTouchEvent` 处理 `ACTION_DOWN` 事件，返回 `true`（消费事件）。
    - 此时，按钮 A 的 `onClick` 事件会被触发。
2. 手指滑动到按钮 B：
    - 父容器的 `dispatchTouchEvent` 收到 `ACTION_MOVE` 事件，调用 `onInterceptTouchEvent`。
    - 如果 `onInterceptTouchEvent` 返回 `false`，事件继续传递给按钮 A。
    - 按钮 A 的 `dispatchTouchEvent` 收到 `ACTION_MOVE`，但按钮 A 的 `onTouchEvent` 会根据滑动距离判断是否继续处理：
        * 如果滑动距离超出按钮 A 的范围，按钮 A 的 `onTouchEvent` 可能返回 `false`，事件会向上分发。
        * 如果父容器的 `onInterceptTouchEvent` 检测到滑动方向或距离符合拦截条件，返回 `true`，事件被拦截，不再传递给按钮 A。
    - 父容器的 `onTouchEvent` 接收事件，处理 `ACTION_MOVE`。
3. 手指滑动回按钮 A：
    - 父容器的 `dispatchTouchEvent` 收到新的 `ACTION_MOVE` 事件。
    - 如果父容器的 `onInterceptTouchEvent` 仍然返回 `true`，事件继续由父容器处理。
    - 如果父容器的 `onTouchEvent` 没有消费事件（返回 `false`），事件会向上分发到更上层的父容器。
    - 当手指抬起（`ACTION_UP`）时，事件最终会根据当前的分发状态决定是否触发按钮 A 的点击事件。

## 十二、Android中onclick和onLongClick的事件下发机制
## 十三、onLongClick是在up响应还是什么时候响应，如果长按一个按钮，他是怎么实践下发的那？
## 十四、自定义view执行invalidate方法，为什么有时候不回调onDraw()
自定义一个view时，重写onDraw。调用view.invalidate(),会触发onDraw和computeScroll()。前提是该view被附加在当前窗口.

 view.postInvalidate(); _//是在非UI线程上调用的_

自定义一个ViewGroup，重写onDraw。onDraw可能不会被调用，原因是需要先设置一个背景(颜色或图)。表示这个group有东西需要绘制了，才会触发draw，之后是onDraw。

因此，一般直接重写dispatchDraw来绘制viewGroup.

自定义一个ViewGroup,dispatchDraw会调用drawChild.

1. 调用`invalidate()`的对象错误：确保你是在需要刷新的那个View对象上调用`invalidate()`。如果调用的对象不是当前需要重绘的View，那么`onDraw()`不会被触发。
2. View的状态为GONE：如果View的显示状态被设置为GONE，则它不会出现在屏幕上，`onDraw()`也不会执行。
3. 硬件加速的影响：在某些情况下，如果启用了硬件加速可能会影响`onDraw()`方法的调用。
4. 父View没有调用`setWillNotDraw(false)`：如果父View的`setWillNotDraw(true)`，会导致子View的`onDraw()`不被调用。
5. LayoutParams配置不当：不当的`LayoutParams`配置也可能导致`onDraw()`的问题。
6. View没有被正确测量和布局：如果自定义View所在的布局中，自定义View计算不出位置，或者在`onMeasure()`方法中没有设置控件的宽和高，可能会导致`onDraw()`不被调用。
7. ViewGroup的`onDraw()`可能不会被调用：如果ViewGroup没有设置背景，那么`onDraw()`可能不会被调用，但是`dispatchDraw()`会执行，所以一般直接重写`dispatchDraw()`来绘制ViewGroup。
8. 连续调用`invalidate()`：在同一绘制序列内连续调用同一视图的`invalidate()`时，会被Flag阻挡，不再向下执行。
9. View没有被附加到窗口：调用`invalidate()`的View必须是当前窗口上的，也就是说View必须是已经附加在窗口上的。

## 十五、view分发反向制约的方法
### 1、`requestDisallowInterceptTouchEvent` 方法
子 View 可以调用此方法请求父 View 不要拦截触摸事件。当 `disallowIntercept` 参数为 `true` 时(禁止允许拦截为true)，父 View 将在接下来的触摸事件中停止尝试拦截。例如，在子 View 的 `onTouchEvent` 方法中，可以在处理事件之前调用 `getParent().requestDisallowInterceptTouchEvent(true)`，从而防止父 View 拦截事件。

### 2、在事件回调方法中干预父 View 的行为
子 View 可以通过在事件回调方法（如 `onTouchEvent` 或 `dispatchTouchEvent`）中执行特定操作来影响事件的传播。例如，子 View 可以在 `onTouchEvent` 中根据事件类型（如滑动方向）动态决定是否调用 `requestDisallowInterceptTouchEvent`，从而控制父 View 是否拦截事件。

### 3、注意事项
+ `requestDisallowInterceptTouchEvent` 方法对 `ACTION_DOWN` 事件无效，因为 `ACTION_DOWN` 事件的拦截逻辑不会受到该标志位的控制。因为源码中在`ACTION_DOWN`的时候`ViewGroup`会在`dispatchTouchEvent`中重置我们的触摸状态，所以如果在子View接收到`DOWN`事件时去设置`requestDisallowInterceptTouchEvent(true)`是无效的，父类在执行`dispatchTouchEvent`还是会清除这个标志的，代码依然通过`onInterceptTouchEvent`来获得是否拦截的状态。`onTouchEvent` 中无法在`ACTION_DOWN` 控制父View拦截事件，在`Move`中可以
+ 在使用反向制约时，需要谨慎处理事件的传递逻辑，避免出现事件分发混乱或冲突的情况。

## 十六、Android动画的种类及作用
[Android中的View动画和属性动画](https://www.jianshu.com/p/b117c974deaf)

Android动画涉及到到种类有视图动画和属性动画，使用插值器和估值器实现复杂动画效果，分别控制动画的变化速率和属性值的过渡方式。

### 1、视图动画
视图动画又分为补间动画和逐帧动画

#### (1) 视图动画

![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739412418939-7adce34b-49d4-4607-9684-286ce4e935a7.png)

补间动画常用于视图View的一些标准动画效果：平移、旋转、缩放 & 透明度；


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739413615181-a52ebfaa-63f3-4ce4-bf70-fdca75c9374e.png)

除了常规的动画使用，补间动画还有一些特殊的应用场景。

+ `Activity` 的切换效果（淡入淡出、左右滑动等）
+ `Fragement` 的切换效果（淡入淡出、左右滑动等）
+ 视图组（`ViewGroup`）中子元素的出场效果（淡入淡出、左右滑动等）

举例：实现控件的平移动画


![](https://cdn.nlark.com/yuque/0/2025/gif/29215582/1739412571966-a426d2f1-f75c-42d3-9e0b-5fa24e8a878c.gif)

方法1：xml

```java
/*
 * 设置方式1：xml
 */
// 步骤1：在 res/anim的文件夹里创建动画效果.xml文件
// 此处路径为res/anim/view_animation.xml

// 步骤2：根据不同动画效果的语法设置不同动画参数-view_animation.xml
<?xml version="1.0" encoding="utf-8"?>

<translate xmlns:android="http://schemas.android.com/apk/res/android"
	// 采用<translate /> 标签表示平移动画
	// 以下参数是4种动画效果的公共属性,即都有的属性
	android:duration="3000" // 动画持续时间（ms），必须设置，动画才有效果
	android:startOffset ="1000" // 动画延迟开始时间（ms）
	android:fillBefore = “true” // 动画播放完后，视图是否会停留在动画开始的状态，默认为true
	android:fillAfter = “false” // 动画播放完后，视图是否会停留在动画结束的状态，优先于fillBefore值，默认为false
	android:fillEnabled= “true” // 是否应用fillBefore值，对fillAfter值无影响，默认为true
	android:repeatMode= “restart” // 选择重复播放动画模式，restart代表正序重放，reverse代表倒序回放，默认为restart|
	android:repeatCount = “0” // 重放次数（所以动画的播放次数=重放次数+1），为infinite时无限重复
	android:interpolator = @[package:]anim/interpolator_resource // 插值器，即影响动画的播放速度,下面会详细讲

	// 以下参数是平移动画特有的属性
	android:fromXDelta="0" // 视图在水平方向x 移动的起始值
	android:toXDelta="500" // 视图在水平方向x 移动的结束值
	android:fromYDelta="0" // 视图在竖直方向y 移动的起始值
	android:toYDelta="500" // 视图在竖直方向y 移动的结束值
/>
```

```java

// 步骤3：在Java代码中创建Animation对象并播放动画
// 1. 创建需要设置动画的 视图View
Button mButton = (Button) findViewById(R.id.Button);
// 2. 创建动画对象并传入设置的动画效果xml文件
Animation translateAnimation = AnimationUtils.loadAnimation(this, R.anim.view_animation);
// 3. 播放动画
mButton.startAnimation(translateAnimation);
```

方式二：java代码

```java

/*
 * 设置方式2：Java
 */
 // 步骤1:创建需要设置动画的视图View
 Button mButton = (Button) findViewById(R.id.Button);
 // 步骤2：创建平移动画的对象
 // 平移动画对应的Animation子类为TranslateAnimation
 Animation translateAnimation = new TranslateAnimation(0，500，0，500);
 // 参数说明
 // fromXDelta ：视图在水平方向x 移动的起始值
 // toXDelta ：视图在水平方向x 移动的结束值
 // fromYDelta ：视图在竖直方向y 移动的起始值
 // toYDelta：视图在竖直方向y 移动的结束值

 // 步骤3：属性设置：方法名是在其属性前加“set”，如设置时长setDuration()
 translateAnimation.setDuration(3000);

 // 步骤4：播放动画
 mButton.startAnimation(translateAnimation);
```

#### (2) 逐帧动画

![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739412744054-2922d68d-7a71-431b-a4cd-d247ee25d921.png)

举例


![](https://cdn.nlark.com/yuque/0/2025/gif/29215582/1739412801848-6cb50ca4-7e89-4dec-8021-fec884fa052a.gif)

```java
// 步骤1：将动画资源（即每张图片资源）放到 drawable文件夹里
// 技巧：找到自己需要的gif动画，用 gif分解软件（如 GifSplitter）将 gif 分解成一张张图片即可

// 步骤2：设置、启动动画
// 分两种方式：xml跟java

 // 方式1：xml
   // 1. 在 res/drawable的文件夹里创建动画效果.xml文件 - knight_attack.xml
   <?xml version="1.0" encoding="utf-8"?>
	<animation-list
	    xmlns:android="http://schemas.android.com/apk/res/android"
	    android:oneshot="true" // 设置是否只播放一次，默认为false
	    >

	// item = 动画图片资源；duration = 设置一帧持续时间(ms)
	    <item android:drawable="@drawable/a0" android:duration="100"/>
	    <item android:drawable="@drawable/a1" android:duration="100"/>
	    <item android:drawable="@drawable/a2" android:duration="100"/>
	    <item android:drawable="@drawable/a3" android:duration="100"/>
	    <item android:drawable="@drawable/a4" android:duration="100"/>
	    <item android:drawable="@drawable/a5" android:duration="100"/>
	    <item android:drawable="@drawable/a6" android:duration="100"/>
	    <item android:drawable="@drawable/a7" android:duration="100"/>
	    <item android:drawable="@drawable/a8" android:duration="100"/>
	    <item android:drawable="@drawable/a9" android:duration="100"/>
	    <item android:drawable="@drawable/a10" android:duration="100"/>
	    <item android:drawable="@drawable/a11" android:duration="100"/>
	    <item android:drawable="@drawable/a12" android:duration="100"/>
	    <item android:drawable="@drawable/a13" android:duration="100"/>
	    <item android:drawable="@drawable/a14" android:duration="100"/>
	    <item android:drawable="@drawable/a15" android:duration="100"/>
	    <item android:drawable="@drawable/a16" android:duration="100"/>
	    <item android:drawable="@drawable/a17" android:duration="100"/>
	    <item android:drawable="@drawable/a18" android:duration="100"/>
	    <item android:drawable="@drawable/a19" android:duration="100"/>
	    <item android:drawable="@drawable/a20" android:duration="100"/>
	    <item android:drawable="@drawable/a21" android:duration="100"/>
	    <item android:drawable="@drawable/a22" android:duration="100"/>
	    <item android:drawable="@drawable/a23" android:duration="100"/>
	    <item android:drawable="@drawable/a24" android:duration="100"/>
	    <item android:drawable="@drawable/a25" android:duration="100"/>
	</animation-list>
```

```java
// 2. 载入 & 启动动画
	public class FrameActivity extends AppCompatActivity {
	    private Button btn_startFrame,btn_stopFrame;
	    private ImageView iv;
	    private AnimationDrawable animationDrawable;

	        iv = (ImageView) findViewById(R.id.iv);
	        btn_startFrame = (Button) findViewById(R.id.btn_startFrame);
	        btn_stopFrame = (Button) findViewById(R.id.btn_stopFrame);


	        // 载入动画
	        btn_startFrame.setOnClickListener(new View.OnClickListener() {
	            @Override
	            public void onClick(View v) {

	                // 1. 设置动画
	                iv.setImageResource(R.drawable.knight_attack);
	                // 2. 获取动画对象
	                animationDrawable = (AnimationDrawable) iv.getDrawable();
	                // 3. 启动动画
	                animationDrawable.start();

	            }
	        });

	        // 停止动画
	        btn_stopFrame.setOnClickListener(new View.OnClickListener() {
	            @Override
	            public void onClick(View v) {

	                // 1. 设置动画
	                iv.setImageResource(R.drawable.knight_attack);
	                // 2. 获取动画对象
	                animationDrawable = (AnimationDrawable) iv.getDrawable();
	                // 3. 暂停动画
	                animationDrawable.stop();
	            }
	        });

	    }
	}
```

```java
public class FrameActivity extends AppCompatActivity {
	private Button btn_startFrame,btn_stopFrame;
	private ImageView iv;
	private AnimationDrawable animationDrawable;
	// 方式2：java
	// 直接从drawable文件夹获取动画资源（图片）
	animationDrawable = new AnimationDrawable();
	for (int i = 0; i <= 25; i++) {
	int id = getResources().getIdentifier("a" + i, "drawable", getPackageName());
	Drawable drawable = getResources().getDrawable(id);
	animationDrawable.addFrame(drawable, 100);
	}

	// 载入动画
	btn_startFrame.setOnClickListener(new View.OnClickListener() {
		@Override
		public void onClick(View v) {

			// 1. 获取资源对象
			iv.setImageDrawable(animationDrawable);
			// 2. 停止动画
			// 特别注意：在动画start()之前要先stop()，不然在第一次动画之后会停在最后一帧，这样动画就只会触发一次
			animationDrawable.stop();
			// 3. 启动动画
			animationDrawable.start();
		}
	});

	// 停止动画
	btn_stopFrame.setOnClickListener(new View.OnClickListener() {
		@Override
		public void onClick(View v) {
			// 1. 获取资源对象
			iv.setImageDrawable(animationDrawable);
			// 2. 停止动画
			animationDrawable.stop();
		}
	});
}
```

+ 优点：使用简单、方便
+ 缺点：容易引起 `OOM`，因为会使用大量 & 尺寸较大的图片资源，尽量避免使用尺寸较大的图片

适用于较为复杂的个性化动画效果。使用时一定要避免使用尺寸较大的图片，否则会引起OOM

### 2、属性动画
属性动画是`Android 3.0（API 11）`后才提供的一种全新动画模式。

为什么有属性动画，补间动画和逐帧动画有哪些缺陷？


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739413092684-44787bd4-8224-4edf-847c-5d4b5208847d.png)

属性动画的使用


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739413546246-a8d68035-edfd-4c97-a1e6-04f63fabe03f.png)

具体使用 属性动画的使用类主要是：`ValueAnimator` 类 & `ObjectAnimator` 类，具体介绍如下


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739413598741-97de1803-79d0-4c4a-b9be-cc54dd60b4b0.png)

工作原理


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739413661535-6e67f777-f093-4e7f-b874-49e6bc06fc96.png)

#### (1) ValueAnimator类
+ 定义：属性动画机制中 最核心的一个类
+ 实现动画的原理：通过不断控制 值 的变化，再不断 手动 赋给对象的属性，从而实现动画效果。如图下：
+
![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739413719545-edccb945-e2e1-4041-9a2e-c3773834a690.png)
+ `ValueAnimator`类中有3个重要方法：
1. `ValueAnimator.ofInt（int values）`
2. `ValueAnimator.ofFloat（float values）`
3. `ValueAnimator.ofObject（int values）`

示例

按钮的宽度从 `150px` 放大到 `500px`


![](https://cdn.nlark.com/yuque/0/2025/gif/29215582/1739413803505-671022c3-f23b-4146-ac8a-50c42330a668.gif)

```java
// 创建动画作用对象：此处以Button为例
Button mButton = (Button) findViewById(R.id.Button);

// 步骤1：设置属性数值的初始值 & 结束值
ValueAnimator valueAnimator = ValueAnimator.ofInt(mButton.getLayoutParams().width, 500);
// 初始值 = 当前按钮的宽度，此处在xml文件中设置为150
// 结束值 = 500
// ValueAnimator.ofInt()内置了整型估值器,直接采用默认的.不需要设置
// 即默认设置了如何从初始值150 过渡到 结束值500

// 步骤2：设置动画的播放各种属性
// 设置动画运行时长:1s
valueAnimator.setDuration(2000);


// 步骤3：将属性数值手动赋值给对象的属性:此处是将值赋给按钮的宽度
// 设置更新监听器：即数值每次变化更新都会调用该方法
valueAnimator.addUpdateListener(new AnimatorUpdateListener() {
	@Override
	public void onAnimationUpdate(ValueAnimator animator) {

		// 获得每次变化后的属性值
		int currentValue = (Integer) animator.getAnimatedValue();

		// 每次值变化时，将值手动赋值给对象的属性
		// 即将每次变化后的值赋给按钮的宽度，这样就实现了按钮宽度属性的动态变化
		mButton.getLayoutParams().width = currentValue;


		// 步骤4：刷新视图，即重新绘制，从而实现动画效果
		mButton.requestLayout();

	}
});

// 步骤4：启动动画
valueAnimator.start();

```

实际使用中，我们可能还需要实现TypeEvaluator 自定义自己的估值器去使用。

#### (2) ObjectAnimator类
直接对对象的属性值进行改变操作，从而实现动画效果

1. 如直接改变 `View`的 `alpha` 属性 从而实现透明度的动画效果
2. 继承自`ValueAnimator`类，即底层的动画实现机制是基于`ValueAnimator`类


![](https://cdn.nlark.com/yuque/0/2025/png/29215582/1739414039379-1989ef71-4a4a-475e-945c-2c56e77033d3.png)

#### (3) 区别
+ `ValueAnimator` 类是先改变值，然后 手动赋值 给对象的属性从而实现动画；是 间接 对对象属性进行操作；
+ `ObjectAnimator` 类是先改变值，然后 自动赋值 给对象的属性从而实现动画；是 直接 对对象属性进行操作；

### 3、估值器和插值器
#### (1) 插值器（Interpolator）
1. 定义
插值器是一个接口，用于控制动画变化的速率。它决定了动画效果的变化模式，例如匀速、加速、减速等。插值器本质上是一个数学函数，它将时间进度（0.0 到 1.0）映射为另一个值，用于计算动画的当前状态。
2. 系统内置的插值器
    - LinearInterpolator：线性变化，速度恒定。
    - AccelerateInterpolator：加速变化。
    - DecelerateInterpolator：减速变化。
    - AccelerateDecelerateInterpolator：先加速后减速，这是默认的插值器。
3. 自定义插值器
自定义插值器需要实现 `Interpolator` 或 `TimeInterpolator` 接口，并重写 `getInterpolation(float input)` 方法。`input` 参数表示时间进度（0 到 1），返回值用于计算动画的当前状态。

#### (2) 估值器（TypeEvaluator）
1. 定义
估值器是一个接口，用于根据当前属性改变的百分比来计算改变后的具体属性值。它协助插值器实现非线性运动的动画效果。
2. 系统内置的估值器
    - FloatEvaluator：用于计算浮点数类型的属性变化。
    - IntEvaluator：用于计算整数类型的属性变化。
3. 自定义估值器
自定义估值器需要实现 `TypeEvaluator` 接口，并重写 `evaluate(float fraction, Object startValue, Object endValue)` 方法。`fraction` 是插值器计算出的当前属性改变的百分比，`startValue` 和 `endValue` 分别是动画的初始值和结束值。

#### (3) 插值器与估值器的关系
+ 插值器：负责根据时间进度计算出当前属性改变的百分比（`fraction`），决定动画的变化速率。
+ 估值器：根据插值器计算出的 `fraction`，结合初始值和结束值，计算出当前属性的具体数值。

## 十七、如何在Android中执行耗时操作
[android面试：如何在 Android 应用中执行耗时操作？_android耗时操作处理办法-CSDN博客](https://blog.csdn.net/2401_86900375/article/details/141474256)

## 十八、如何设计一个写死宽高的imageview
自适应宽高的设计，在xml中layout_width和layout_height属性固定宽高

如果要实现宽度确定，自适应高度，可以让layout_width为确定值，layout_height为wrap_content

同时如果在宽度确定的情况下要使用宽高比，可以自定义imageview,重写onMeasure方法，增加radio比例属性，在测量的宽度后根据宽高比计算高度设置。

如下

```java
public class MyImageView extends ImageView {
    //宽高比，由我们自己设定
    private float ratio;
    public MyImageView(Context context, AttributeSet attrs) {
        super(context, attrs);
        //获得属性名称和对应的值
//        for (int i = 0; i < attrs.getAttributeCount() ; i++) {
//            String name = attrs.getAttributeName(i);
//            String value = attrs.getAttributeValue(i);
//            System.out.println("====name: "+name+"value:"+value);
//        }
        TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.MyImageView);
        //根据属性名称获取对应的值，属性名称的格式为类名_属性名
        ratio = typedArray.getFloat(R.styleable.MyImageView_ratio, 0.0f);
    }
    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        //获取宽度的模式和尺寸
        int widthSize = MeasureSpec.getSize(widthMeasureSpec);
        int widthMode = MeasureSpec.getMode(widthMeasureSpec);
        //获取高度的模式和尺寸
        int heightSize = MeasureSpec.getSize(heightMeasureSpec);
        int heightMode = MeasureSpec.getMode(heightMeasureSpec);
        //宽确定，高不确定
        if(widthMode == MeasureSpec.EXACTLY&&heightMode!=MeasureSpec.EXACTLY&&ratio!=0){
            heightSize = (int) (widthSize*ratio+0.5f);//根据宽度和比例计算高度
            heightMeasureSpec = MeasureSpec.makeMeasureSpec(heightSize, MeasureSpec.EXACTLY);
        }else if(widthMode!=MeasureSpec.EXACTLY&&heightMode==MeasureSpec.EXACTLY&ratio!=0){
            widthSize = (int) (heightSize/ratio+0.5f);
            widthMeasureSpec = MeasureSpec.makeMeasureSpec(widthSize,MeasureSpec.EXACTLY);
        }else{
            throw new RuntimeException("无法设定宽高比");
        }
        //必须调用下面的两个方法之一完成onMeasure方法的重写，否则会报错
//        super.onMeasure(widthMeasureSpec,heightMeasureSpec);
        setMeasuredDimension(widthMeasureSpec,heightMeasureSpec);
    }
    /
     * 设置宽高比
     * @param ratio
     */
    public void setRatio(float ratio){
        this.ratio = ratio;
    }
}
```

```java
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:custom="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fitsSystemWindows="true"
    android:gravity="center"
    tools:context="com.example.hecun.testone.MainActivity">
    <com.example.hecun.testone.MyImageView
        android:id="@+id/imageview"
        android:layout_width="150dp"
        android:layout_height="wrap_content"
        android:src="@drawable/ym1"
        custom:ratio="1"
        android:scaleType="fitXY"
        />
</LinearLayout>
```

## 十九、onMeasure的measurespec有什么作用
### 1、MeasureSpec怎么来的
首先自定义 View 的时候要重写 `onMeasure` 方法，要对方法的两个参数 `widthMeasureSpec` 和 `heightMeasureSpec` 进行处理，`widthMeasure` 和 `heightMeasure` 来自哪里？是谁把这两个参数传入到自定义 View 的 `onMeasure` 方法里的？

要弄清这个问题，就要知道是谁调用了 View 的 `onMeasure` 方法。这个大家应该都很清楚了，在 View 的 `measure` 方法中会调用 `onMeasure`，如下：

```java
public final void measure(int widthMeasureSpec, int heightMeasureSpec) {
  	...
    onMeasure(widthMeasureSpec, heightMeasureSpec);
    ...
}
```

可以看到，`onMeasure` 方法中的 `measureSpec` 来自于 `measure` 方法中的 `measureSpec`，那么是谁调用了 View 的 `measure` 方法呢？答案是它的父 View。也就是说，调用 `measure` 方法的是 ViewGroup 类型。其实，在 `measure` 方法的注释中，也可以看出来：

```java
This is called to find out how big a view should be. The parent
supplies constraint information in the width and height parameters.
@param widthMeasureSpec Horizontal space requirements as imposed by the
    parent
@param heightMeasureSpec Vertical space requirements as imposed by the
    parent
```

### 2、MeasureSpec作用
`widthMeasureSpec` 和 `heightMeasureSpec` 是由父 View 和子 View 的尺寸共同作用得到的对子 View 施加的约束。

以 LinearLayout 为例，在其 `onMeasure` 方法中，会有如下调用链：

```java
onMeasure -> measureVertical -> measureChildBeforeLayout -> measureChildWithMargins
```

在 `measureVertical` 方法中，会遍历其子 View，调用 `measureChildBeforeLayout` 方法

```java
final int count = getVirtualChildCount();
for (int i = 0; i < count; ++i) {
  ...
  measureChildBeforeLayout(child, i, widthMeasureSpec, 0,
                        heightMeasureSpec, usedHeight);
}
```

在 `measureChildBeforeLayout` 中会调用 `measureChildWithMargins` ，这个方法内部就调用了子 View 的 `measure` 方法，如下，这个方法其实是 ViewGroup 这个基类中的方法：

```java
// ViewGroup.java
protected void measureChildWithMargins(View child,
            int parentWidthMeasureSpec, int widthUsed,
            int parentHeightMeasureSpec, int heightUsed) {
        final MarginLayoutParams lp = (MarginLayoutParams) child.getLayoutParams();
				// 计算传递给子 View 的 measureSpec
        final int childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec,
                mPaddingLeft + mPaddingRight + lp.leftMargin + lp.rightMargin
                        + widthUsed, lp.width);
        final int childHeightMeasureSpec = getChildMeasureSpec(parentHeightMeasureSpec,
                mPaddingTop + mPaddingBottom + lp.topMargin + lp.bottomMargin
                        + heightUsed, lp.height);
				// 调用子 View 的 measure 方法
        child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
    }
```

该方法的最后一句就是调用 LinearLayout 的子 View 的 `measure` 方法，并把计算得到的 `measureSpec` 传入该方法。这里要注意的是，虽然子 View 在 `onMeasure` 过程中的 `measureSpec` 是由父 View 传进来的，但是这个 `measureSpec` 本身是属于子 View 的，它内部包含的仅仅是子 View 的尺寸信息。只不过在得到这个子 View 尺寸信息的过程中，需要借助父 View。

### 3、MeasureSpec 如何计算
子 View 在 `onMeasure` 过程使用的 `measureSpec` 是由父 View 给它的。那么父 View 是怎么计算得到这个 `measureSpec` 的呢？

在 `measureChildWithMargins` 方法中，有

```java
final int childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec,
                mPaddingLeft + mPaddingRight + lp.leftMargin + lp.rightMargin
                        + widthUsed, lp.width);
```

顾名思义，子 View 的 `measureSpec` 是由 `getChildMeasureSpec` 方法计算来的。该方法签名如下：

```java
public static int getChildMeasureSpec(int spec, int padding, int childDimension)
```

+ `spec` ，这个参数指的是父 View 的 `measureSpec`，也就是调用子 View 的 `measure` 方法的那个父 View。当然，你可能会问，父 View 的 `measureSpec` 是从哪里来的？答案是父 View 的 父 View，这是一个链条。
+ `padding`，这个参数是父 View 的 padding 和子 View 的 margin 等值的和，在这里不是重点。
+ `childDimension`，这个指的就是我们 View 的宽度或者高度。也就是我们在 xml 设置的 `android:layout_height` 或者 `android:layout_widht`。`childDimension` 可能是一个具体的值，比如 `24dp`（当然，在 `measure` 过程中已经转为了对应的 `px` ），也可以是 `MATCH_PARENT` 或者 `WRAP_CONTENT`，这两者对应的值分别为 -1 和 -2，属于标记值。

> 注意：网上的很多文章，在看的时候很容易让人模糊了 `MATCH_PARENT` 及 `WRAP_CONTENT` 这两者与 `MeasureSpec.MODE` 的关系。一些文章会说，当 View 的尺寸设置为 `WRAP_CONTENT` 的时候，它的 mode 对应 `AT_MOST`。这种说法并不准确。 `MATCH_PARENT` 和`WRAP_CONTENT` 只是 `childDimension`，它和 `measureSpec` 的 mode 是两个不同的概念，只不过它是标记用的 `childDimension`，需要借助父 View 给出具体的尺寸。
>

`MeasureSpec` 是一个 32 位 `Int` 整型。高 2 位是 `MODE`，低 30 位是 `SIZE`。`getChildMeasureSpec` 的返回值就是一个 `MeasureSpec`，这个 `MeasureSpec` 最后会作为参数传入到子 View 的 `onMeasure` 方法中。

`MODE` 有 3 种：

+ `EXACTLY`

表示当前 View 的尺寸为确切的值，这个值就是后 30 位 `SIZE` 的值。

+ `AT_MOST`

表示当前 View 的尺寸最大不能超过 `SIZE` 的值。

+ `UNSPECIFIED`

表示当前 View 的尺寸不受父 View 的限制，想要多大就可以多大。这种情况下，`SIZE` 的值意义不大。一般来说，可滑动的父布局对子 View 施加的约束就是 `UNSPECIFIED` ，比如 ScrollView 和 RecyclerView。在滑动时，实际上是让子 View 在它们的内部滚动，这意味着它们的子 View 的尺寸要大于父 View，所以父 View 不应该对子 View 施加尺寸的约束。

注意，这里的 `SIZE` 是通过 `getChildMeasureSpec` 方法计算出来的，有可能是子 View 在 xml 中设置的尺寸，也有可能是父 View 的尺寸，还有可能是 0。

`getChildMeasureSpec` 的源码比较长，总结就是在不同的父 View 的 `MeasureSpec.MODE` 下，当子 View 的尺寸分别为具体值、`MATCH_PARENT` 和 `WRAP_CONTENT` 的时候，计算出子 View 的 `MeasureSpec` 并返回。所以一共有 3 x 3 = 9 种情况。

为什么子 View 的 `MeasureSpec` 需要由父 View 共同确定？

很大程度上是因为 `MATCH_PARENT` 和 `WRAP_CONTENT` 的存在，因为这两个 dimension 需要借助父 View 才能确定。`MATCH_PARENT` 需要知道父 View 有多大才能匹配到父 View 的大小；而 `WRAP_CONTENT` 虽然表示子 View 的尺寸由自己决定，但是这个大小不能超过父 View 的大小。

如果所有的 View 的 dimension 只能设置为固定的数值，那么其实子 View 的 `MeasureSpec` 就和父 View 无关了。正如上面代码中，当 `childDimension >= 0` 时，子 View 的 `MeasureSpec` 始终由 `childDimension` 和 `MeasureSpec.EXACTLY` 组成。

`AT_MOST` 和 `WRAP_CONTENT` 的关系

网上有很多文章说，当一个 View 的尺寸设置为 `WRAP_CONTENT` 时，它的 `MeasureSpec.MODE` 就是 `AT_MOST`。这并不准确。首先，当父 View 的 MODE 是 `UNSPECIFIED` 时，子 View 设置为 `WRAP_CONTENT` 或 `MATCH_PARENT`，那么子 View 的 MODE 也都是 `UNSPECIIED` 而不是 `AT_MOST`。其次，当父 View 是 `AT_MOST` 的时候，子 View 的 `childDimension` 即使是 `MATCH_PARENT`, 子 View 的 MODE 也是`AT_MOST`。所以 `AT_MOST` 与 `WARP_CONTENT` 并不是一一对应的关系。

看起来有点乱，但是只要始终抓住关键点，即 `AT_MOST` 意味着这个 View 的尺寸有上限，最大不能超过 `MeasureSpec.SIZE` 的值。那具体的值是多少呢？这就要看在 `onMeasure` 中是如何设置 View 的尺寸了。对于一般的视图控件的 `onMeasure` 逻辑，当它的 `MeasureSpec.MODE` 是 `AT_MOST` 的时候，意味着它的大小最大不能超过 `MeasureSpec.SIZE`。

ips: 借助`AT_MOST`的特性，可以实现有用的功能。比如需要一个 `WRAP_CONTENT` 的 RecyclerView，它的高度随 item 数目增加而变高，但是有最大高度的限制，超过这个高度不再增加。要实现这样一个 RecyclerView，在 xml 里给 RecyclerView 设置 `android:maxHeight` 是不管用的。但是我们可以继承 RecyclerView 并重写 `onMeasure` 方法，只需要将

`heightSpecMode` 改成 `AT_MOST` 即可，如下：

```java
public class MyRecyclerView extends RecyclerView {
    ...
    @Override
    protected void onMeasure(int widthSpec, int heightSpec) {
     		// 构造一个 mode 为 AT_MOST 的 heightSpec，size 为你想要的最大高度，然后传入到 super 中即可
        int newHeightSpec = MeasureSpec.makeMeasureSpec(maxHeight, MeasureSpec.AT_MOST);
        super.onMeasure(widthSpec, newHeightSpec);
    }
}
```

`UNSPECIFIED` 什么时候用到？

网上很多讲解绘制流程的文章，对于 `UNSPECIFIED` 都是一笔带过，并没有讲得很清楚。`UNSPECIFIED`，顾名思义，不指定尺寸。当一个 View 的 `MeasureSpec.MODE` 是 `UNSPECIFIED` 的时候，说明父 View 对它的尺寸没有任何约束。实际上 android 中使用到 `UNSPECIFIED` 的控件很少，只有 ScrollView、RecyclerView 这类可以滑动的 View 会用到，因为它们的子 View (也就是滑动的内容) 可以无限高，比父 View (视口，ViewPort) 高得多。

比如 ScrollView 给子 View 施加约束时，就直接构造了一个 `UNSPECIFIED` 的 `MeasureSpec` 来测量子 View：

```java
protected void measureChildWithMargins(View child, int parentWidthMeasureSpec, int widthUsed,
            int parentHeightMeasureSpec, int heightUsed) {
        final MarginLayoutParams lp = (MarginLayoutParams) child.getLayoutParams();

        final int childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec,
                mPaddingLeft + mPaddingRight + lp.leftMargin + lp.rightMargin
                        + widthUsed, lp.width);
        final int usedTotal = mPaddingTop + mPaddingBottom + lp.topMargin + lp.bottomMargin +
                heightUsed;
    // 这里直接构造了一个 UNSPECIFIED 的 MeasureSpec 用来测量子 View
        final int childHeightMeasureSpec = MeasureSpec.makeSafeMeasureSpec(
                Math.max(0, MeasureSpec.getSize(parentHeightMeasureSpec) - usedTotal),
                MeasureSpec.UNSPECIFIED);
        child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
    }
```

### 4、onMeasure过程
首先，`MeasureSpec` 中的尺寸并不能理解成 View 的实际尺寸，`MeasureSpec` 更多的是作为一种父 View 对子 View 测量的约束。当子 View 要进行测量时，必须要知道这个约束。而子 View 具体要有多大，是要依赖 `onMeasure` 的逻辑确定的。你当然可以完全不理会这个约束，在 `onMeasure` 中通过 `setMeasuredDimension` 方法随意给 View 设置大小，但是一般是不会这样做的，除非父 View 给你的约束是 `UNSPEECIFIED`。

View.java 中的 `onMeasure` 方法实现：

```java
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        setMeasuredDimension(getDefaultSize(getSuggestedMinimumWidth(), widthMeasureSpec),
                getDefaultSize(getSuggestedMinimumHeight(), heightMeasureSpec));
    }
```

可以看到，在 View 的 `onMeasure` 中，是通过 `getDefaultSize` 来确定大小的，然后使用 `setMeasuredDimension` 来设置 View 的宽高。

`getDefaultSize` 方法如下：

```java
public static int getDefaultSize(int size, int measureSpec) {
        int result = size;
        int specMode = MeasureSpec.getMode(measureSpec);
        int specSize = MeasureSpec.getSize(measureSpec);

        switch (specMode) {
        case MeasureSpec.UNSPECIFIED:
            result = size;
            break;
        case MeasureSpec.AT_MOST:
        case MeasureSpec.EXACTLY:
            result = specSize;
            break;
        }
        return result;
    }
```

逻辑很好懂。当 `specMode` 是 `UNSPECIFIED` 的时候，使用 `getSuggestedMinimumWidth`/`getSuggestedMinimumHeight` 返回的尺寸；当 `specMode` 是 `AT_MOST` 或 `EXACTLY` 的时候，使用 `specSize`，即 `MeasureSpec.SIZE`。

从上一节中我们知道，当子 View 的 dimension 是 `WRAP_CONTENT`， 而父 View 的 `specMode` 是 `EXACTLY` 或 `AT_MOST` 的时候，子 View 的 `specMode` 也是 `AT_MOST`。而在上面的代码中，当 View 的 `specMode` 是 `AT_MOST` 的时候，却直接将 `specSize` 返回了，和 `EXACTLY` 处理方式一样。这意味着，View 这个类在 xml 中设置 `WRAP_CONTENT` 和 `MATCH_PARENT` 的效果是一样的。当然这很好理解，因为单纯的 View 类说白了只是一个矩形，并没有“内容”。

不过也正因如此，在我们自己自定义 View 的时候，如果不复写 `onMeasure` 的话，那么 `WARP_CONTENT` 就是没有效果的。所以自定义 View 如果想有 `WRAP_CONTENT` 的效果，那么需要重写 `onMeasure` 并对 `specMode` 为 `AT_MOST` 的情况做处理（当父 View 是可滑动的View 时，`WRAP_CONTENT` 还有可能对应 `UNSPECIFIED` 的 `specMode`, 所以最好也处理这种情况）。

`onMeasure` 总结起来就是，根据父 View 对自己的约束(`widthMeasureSpec` 和 `heightMeasureSpec`)，结合自身的特性，计算出尺寸并用 `setMeasuredDimension` 赋值。

ViewGroup 的 `onMeasuer` 逻辑和 View 类似，只不过 ViewGroup 一般需要先计算子 View 的尺寸才能确定自身尺寸。比如 LinearLayout `WRAP_CONTENT` 需要先知道子 View 们的高度，加起来才能确定自己多高。

### 5、最顶层的 MeasureSpec
子 View 在 `onMeasure` 方法中传入的 `measureSpec` 参数是由父 View 的 ` measureSpec` 和 子 View 的 `childDimension` 共同计算得到的约束。而父 View 的 `measureSpec` 是由父 View 的父 View 计算来的。这样形成了一个链条。那这个链条的头在哪里呢，最顶端的根 View 的在 `onMeasure` 的时候它的入参 `measureSpec` 是从哪里来的呢？对一个 Activity 来说，最顶层的 View 是 `DecorView`，最顶部的 `DecorView` 在 `measure` 过程中使用的 `measureSpec` 由 ViewRootImpl 传入的。

通过 `getRootMeasureSpec` 方法构造的，然后在 `performMeasure` 中传递给 `mView`（就是 `DecorView`）去进行 `measure` 操作。

`getRootMeasureSpec` 方法中，`mWidth/mHeight` 一般是屏幕的宽/高，而 `rootDimension` 是 `DecorView` 的 `layout_width` 和 `layout_height`。这两个值在 WindowManager 调用 `addView` 的时候就已经确定了，是 `MATCH_PARENT`。所以最终得到的是代码 `MeasureSpec.makeMeasureSpec(windowSize, MeasureSpec.EXACTLY);` 构造的 MeasureSpec，也就是说，`DecorView` 的尺寸约束是确切的宽高值，并且是屏幕宽高。这是很合理的，因为最顶层的 View 就应该是屏幕大小。

### 6、总结
+ 子 View 在 `onMeasure` 方法中使用的 `MeasureSpec` 来自父 View，而父 View 的 `MeasureSpec` 来自父 View 的父 View，这是一个链条。之所以子 View 尺寸要受到父 View 的约束，是因为 `MATCH_PARENT` 和 `WRAP_CONTENT` 的存在。如果子 View 的尺寸只能设置为固定的 dp 值，那父 View 对子 View 的约束就意义不大了。
+ 子 View 的 `MeasureSpec` 是由子 View 的 `dimension` 和父 View 的 `MeasureSpec` 共同计算得来的。子 View 的 `dimension` 就是子 View 在 xml 中设置的 `android:layout_height/android:layout_width`。注意，`WRAP_CONTENT` 和 `MATCH_PARENT` 也是 `dimension`，是尺寸，不是 `MeasureSpec.MODE`，它们是两个概念，不要弄混，虽然这两者之间有关系。
+ `WRAP_CONTENT` 和 `AT_MOST` 不是一一对应的关系。`UNSPECIFIED`一般只用于可滑动的 View。
+ 虽然 `MeasureSpec` 中已经包含了尺寸约束信息，但是子 View 仍然需要在 `onMeasure` 中进一步确定子 View 具体应该有多大。比如 TextView ，根据文字中最宽的大小确定。一般来说，自定义 View 是需要自己处理 `specMode` 为 `AT_MOST` 的情况的，因为 View 类本身没有处理这个情况，会导致 `WRAP_CONTENT` 失效。
+ 在链条最顶端的 `DecorView ` 的 `MeasureSpec` 就是 `ViewRootImpl` 在 `performMeasure` 方法中构造的 `MeasureSpec`。这个 `MeasureSpec` 的 `SIZE`是屏幕宽高，`MODE` 是 `EXACTLY`。

## 二十、Mode中的UNSPECIFIED在什么情况下会使用到
+ 在自定义 View 或 ViewGroup 的 `onMeasure` 方法中，可能会使用 `UNSPECIFIED` 模式来测量子 View。例如，当自定义 ViewGroup 需要根据子 View 的内容动态调整大小时，可以将子 View 的测量模式设置为 `UNSPECIFIED`，让子 View 根据自身内容决定大小。
+ 某些特殊布局容器（如 `ScrollView`）会使用 `UNSPECIFIED` 模式。因为 `ScrollView` 的子 View 可以根据内容动态调整大小，即使子 View 的高度超过了屏幕范围，`ScrollView` 也可以通过滚动来显示完整的内容。

## 二十一、在onResume中是否可以测量宽高
[Activity启动后View何时开始绘制（onCreate中还是onResume之后？）](https://www.jianshu.com/p/c5d200dde486)

[https://zhuanlan.zhihu.com/p/641345838](https://zhuanlan.zhihu.com/p/641345838)

不一定能够正确的获取view的宽高

onResume是在ActivityThread调用handleResumeActivity时，由performResumeActivity调用到的，而WindowManager添加DecorView是在这个动作之后，条用setview之后才会调用到view绘制的三个重要步骤测量、布局、绘制，所以在执行onResume前测量还没开始，自然拿到的宽高是错误的。

如何正确获取到宽高？

onResume() 中 handler.post(Runnable) 获取不到 View 的真实宽高

获取到view的宽高的前提条件是view要完成onMeasure，那么我们的handler.post 的方式是不能够保证 runnable一定是在view进行了onMeasure后执行的，因此，这个方式不行。

使用View.post(Runnable) 可以获取到 View 的宽高

通过 View.post(Runnable) 的 Message 会在 performMeaure() 之前被调用，那为什么还可以正确的获取到 View 的宽高呢？其实我们的 Message 并没有立即被执行，因为此时主线程的 Handler 正在执行的 Message 是 TraversalRunnable，而 performMeaure() 方法也是在该 Message 中被执行，所以排队等到主线程的 Handler 执行到我们 post 的 Message 时，View 的宽高已经测量完毕，因此我们也就很自然的能够获取到 View 的宽高。

```java
@Override
protected void onResume() {
    super.onResume();

    // 获取根视图
    final View rootView = findViewById(android.R.id.content);

    // 使用View.post()确保在布局完成后执行
    rootView.post(new Runnable() {
        @Override
        public void run() {
            // 获取根视图的宽高
            int width = rootView.getWidth();
            int height rootView =.getHeight();

            // 在这里可以使用获取到的宽高
            Log.d("ViewSize", "Width: " + width + ", Height: " + height);

            // 例如，可以根据宽高进行一些布局调整或其他操作
        }
    });
}
```

## 二十二、activity的生命周期
## 二十三、Activity弹出Dialog会触发Activity生命周期吗
生命周期回调都是 AMS 通过 Binder 通知应用进程调用的；而弹出 Dialog、Toast、PopupWindow 本质上都直接是通过 WindowManager.addView() 显示的（没有经过 AMS），所以不会对生命周期有任何影响。

如果是启动一个 Theme 为 Dialog 的 Activity , 则生命周期为： A.onPause -> B.onCrete -> B.onStart -> B.onResume 注意这边没有前一个 Activity 不会回调 onStop，因为只有在 Activity 切到后台不可见才会回调 onStop；而弹出 Dialog 主题的 Activity 时前一个页面还是可见的，只是失去了焦点而已所以仅有 onPause 回调。


## 二十四、activityA打开activityB的生命周期
进入activityA：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732842499069-225a2bde-7226-497a-9bce-113d274b10f2.png)

activityA跳转activityB


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732842521080-0d170d12-032e-4bcc-91a3-83c2e6f3f186.png)

activityB按back键返回


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732842535929-f16c1e83-8478-4b7d-8525-e6e9825b2fd2.png)

activityA按back键返回


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732842554144-bc7971cd-f51b-4fbc-8be0-60b2b052b6da.png)

## 二十五、activity在异常情况下被杀死的生命周期
情况1：资源相关的系统配置发生改变导致Activity被杀死并重新创建

当系统配置发生改变后，Activity会被销毁，其onPause，onStop，onDestroy均会被调用，由于Activity是在异常情况下终止的，系统会调用onSaveInstanceState来保存当前Activity的状态。如竖屏切换到横屏时


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732842781578-03bf8877-b30c-4f19-a590-319177412b69.png)

当由横屏切换到竖屏的时候


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732842795009-a1086361-a1f7-4cb7-b08e-517c5efc3e2f.png)

在异常情况下终止的，系统会调用onSaveInstanceState来保存当前Activity的状态。onSaveInstanceState调用时机是在onStop之前，需要说明的是这个方法只会出现在Activity被异常终止的情况下，正常情况下系统不会回调这个方法。当系统重建的时候会调用onRestoreInstanceState这个方法，并且把Activity销毁时onSaveInstanceState方法所保存的Bundle对象作为参数同时传递给onRestoreInstanceState和onCreate方法，因为我们可以通过onCreate和onRestoreInstanceState方法来判断Activity是否被重建了，如果被重建了，那么我们就可以取出之前保存的数据并恢复(文本框中用户输入的数据，ListVIew滚动的位置等)，从上图我们可以看出，onRestoreInstanceState的调用时机是在onStart之后。系统只会在Activity即将被销毁并且有机会重新显示的情况下才会调用它。当Activity正常销毁的时候，系统不会调用onSaveInstanceState，因为被销毁的Activity不可能再次被显示.

情况2：资源内存不足导致低优先级的Activity被杀死

数据存储和恢复过程和情况1完全一致

Activity按照优先级从高到低，可以分为如下三种：

1）前台Activity——正在和用户交互的Activity，优先级最高

2）可见但是非前台Activity——比如Activity中弹出了一个对话框，导致Activity可见但是位于后台无法和用户直接交互

3）后台Activity——已经被暂停的Activity，比如执行了onStop，优先级最低

## 二十六、service的生命周期

![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1732843031399-245d62fc-7aa8-4ab0-8fa6-a3d6c7cb9bd3.png)

+ onCreate() :
首次创建服务时，系统将调用此方法。如果服务已在运行，则不会调用此方法，该方法只调用一次。
+ onStartCommand() :
当另一个组件通过调用startService()请求启动服务时，系统将调用此方法。
+ onDestroy() :
当服务不再使用且将被销毁时，系统将调用此方法。
+ onBind() :
当另一个组件通过调用bindService()与服务绑定时，系统将调用此方法。
+ onUnbind() :
当另一个组件通过调用unbindService()与服务解绑时，系统将调用此方法。
+ onRebind() :
当旧的组件与服务解绑后，另一个新的组件与服务绑定，onUnbind()返回true时，系统将调用此方法。

在Service的生命周期里，常用的方法有：

+ 手动调用的方法 :

| 手动调用方法 | 作用 |
| :---: | :---: |
| `startService()` | 启动服务 |
| `stopService()` | 关闭服务 |
| `bindService()` | 绑定服务 |
| `unbindService()` | 解绑服务 |


+ 自动调用的方法 :

| 自动调用方法 | 作用 |
| :---: | :---: |
| `onCreate()` | 创建服务 |
| `onStartCommand()` | 开始服务 |
| `onDestroy()` | 销毁服务 |
| `onBind()` | 绑定服务 |
| `onUnbind()` | 解绑服务 |


### 1、生命周期调用
_1. 启动Service服务_

+ 单次：`startService() —> onCreate() —> onStartCommand()`
+ 多次：`startService() —> onCreate() —> onStartCommand() —> onStartCommand()`

_2. 停止Service服务_

+ `stopService() —> onDestroy()`

_3. 绑定Service服务_

+ `bindService() —> onCreate() —> onBind()`

_4. 解绑Service服务_

+ `unbindService() —> onUnbind() —> onDestroy()`

_5. 启动绑定Service服务_

+ `startService() —> onCreate() —> onStartCommand() —> bindService() —> onBind()`

_6. 解绑停止Service服务_

+ `unbindService() —> onUnbind() —> stopService() —> onDestroy()`

_7. 解绑绑定Service服务_

+ `unbindService() —> onUnbind(ture) —> bindService() —> onRebind()`

被启动的服务的生命周期

如果一个Service被某个Activity 调用 Context.startService 方法启动，那么不管是否有Activity使用bindService绑定或unbindService解除绑定到该Service，该Service都在后台运行。如果个Service被startService 方法多次启动，那么onCreate方法只会调用一次，onStart将会被调用多次（对应调用startService的次数），并且系统只会创建Service的一个实例。该Service将会一直在后台运行，而不管对应程序的Activity是否在运行，直到被调用stopService，或自身的stopSelf方法。当然如果系统资源不足，android系统也可能结束服务。

被绑定的服务的生命周期

如果一个Service被某个Activity 调用 Context.bindService 方法绑定启动，不管调用 bindService 调用几次，onCreate方法都只会调用一次，同时onStart方法始终不会被调用。当连接建立之后，Service将会一直运行，除非调用Context.unbindService 断开连接或者之前调用bindService 的 Context 不存在了（如Activity被finish的时候），系统将会自动停止Service，对应onDestroy将被调用。

被启动又被绑定的服务的生命周期

如果一个Service又被启动又被绑定，则该Service将会一直在后台运行。并且不管如何调用，onCreate始终只会调用一次，对应startService调用多少次，Service的onStart便会调用多少次。调用unbindService将不会停止Service，而必须调用 stopService 或 Service的 stopSelf 来停止服务。

bindService和startService混合使用时

1.如果先bindService,再startService:

在bind的Activity退出的时候,Service会执行unBind方法而不执行onDestory方法,因为有startService方法调用过,所以Activity与Service解除绑定后会有一个与调用者没有关连的Service存在

2.如果先bindService,再startService,再调用Context.stopService

Service的onDestory方法不会立刻执行,因为有一个与Service绑定的Activity,但是在Activity退出的时候,会执行onDestory,如果要立刻执行stopService,就得先解除绑定

## 二十七、如果调用startservice再调用bindservice，然后再调用unbindservice能否成功关闭服务
答案同上题

## 二十八、什么是surfaceView，和View有什么区别
View基于主线程刷新UI,surfaceView可以在子线程刷新UI


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1732630480695-0c3d322c-a014-48fa-a059-a7e6a5fe53ee.jpeg)


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1732630498502-5d812de4-42c9-4443-9488-42b0957e11e0.jpeg)

[Android中SurfaceView使用详解-CSDN博客](https://blog.csdn.net/android_cmos/article/details/68955134)

`SurfaceView `适用于需要进行复杂动画或者视频播放等场景，因为它可以提供更高的帧率和更流畅的用户体验。 `SurfaceView `还具备双缓冲机制，可以减少甚至消除画面闪烁的问题。

使用 `SurfaceView` 结合 `MediaPlayer` 播放视频并处理声音，在 `surfaceCreated` 回调中初始化 `MediaPlayer`，并将其与 `SurfaceView` 绑定，为视频播放添加控制功能，例如播放/暂停按钮、进度条等。

`SurfaceView` 提供了一个独立的绘图表面，而 `MediaPlayer` 负责加载和播放视频内容。通过监听 `SurfaceView` 的生命周期，可以动态绑定和释放 `MediaPlayer`，从而实现高效的视频播放。

## 二十九、有哪些常见的屏幕适配的方法
+ [适配方式一图片适配](http://blog.csdn.net/a379992210/article/details/47861811#%E9%80%82%E9%85%8D%E6%96%B9%E5%BC%8F%E4%B8%80%E5%9B%BE%E7%89%87%E9%80%82%E9%85%8D)
    - 不同像素密度的手机加载工程资源文件(res)中不同的资源图片
+ [适配方式二dimensxml文件适配](http://blog.csdn.net/a379992210/article/details/47861811#%E9%80%82%E9%85%8D%E6%96%B9%E5%BC%8F%E4%BA%8Cdimensxml%E6%96%87%E4%BB%B6%E9%80%82%E9%85%8D)
    - dimens.xml存在于工程资源(res)文件夹中不同values(如:value-1280x720、value-800x480、values-xhdpi)文件夹下，可用于指定控件大小，不同像素密度手机加载不同values文件夹下的dimens.xml文件，通常用dimens适配，需要写多个文件，去适配市面上主流的机型。
+ [适配方式三布局文件适配](http://blog.csdn.net/a379992210/article/details/47861811#%E9%80%82%E9%85%8D%E6%96%B9%E5%BC%8F%E4%B8%89%E5%B8%83%E5%B1%80%E6%96%87%E4%BB%B6%E9%80%82%E9%85%8D)
    - 不同分辨率的手机，加载不同的布局文件以达到适配效果。创建多个layout(如：layout-1280x720、layout-800x480)文件夹用于存放不同像素密度手机所需布局文件。
+ [适配方式四java代码适配](http://blog.csdn.net/a379992210/article/details/47861811#%E9%80%82%E9%85%8D%E6%96%B9%E5%BC%8F%E5%9B%9Bjava%E4%BB%A3%E7%A0%81%E9%80%82%E9%85%8D)
    - 通过android相应api获取当前手机的宽高像素值，按比例分配屏幕中控件的宽高以达到适配效果
+ [适配方式五权重适配](http://blog.csdn.net/a379992210/article/details/47861811#%E9%80%82%E9%85%8D%E6%96%B9%E5%BC%8F%E4%BA%94%E6%9D%83%E9%87%8D%E9%80%82%E9%85%8D)
    - 通过android中线性布局中的属性(layout_weight权重) 按比例来分配，已达到适配效果

## 三十、Android DataBinding
[Android DataBinding 从入门到进阶，看这一篇就够-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/1909533)

DataBinding 是谷歌官方发布的一个框架，顾名思义即为数据绑定，是 MVVM 模式在 Android 上的一种实现，用于降低布局和逻辑的耦合性，使代码逻辑更加清晰。MVVM 相对于 MVP，其实就是将 Presenter 层替换成了 ViewModel 层。DataBinding 能够省去我们一直以来的 findViewById() 步骤，大量减少 Activity 内的代码，数据能够单向或双向绑定到 layout 文件中，有助于防止内存泄漏，而且能自动进行空检测以避免空指针异常

和原始布局的区别在于多出了一个 layout 标签将原布局包裹了起来，data 标签用于声明要用到的变量以及变量类型，要实现 MVVM 的 ViewModel 就需要把数据（Model）与 UI（View）进行绑定，data 标签的作用就像一个桥梁搭建了 View 和 Model 之间的通道

在 data 标签里声明要使用到的变量名、类的全路径

```java
<?xml version="1.0" encoding="utf-8"?>
<layout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools">

    <data>
        <variable
            name="userInfo"
            type="com.leavesc.databinding_demo.model.User" />
    </data>

    <android.support.constraint.ConstraintLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        tools:context=".MainActivity">
    </android.support.constraint.ConstraintLayout>
</layout>
```

## 三十一、Bitmap如何优化，三级缓存的思想与逻辑
[Android必备回顾：7、Bitmap到底如何优化_android bitmap5.x到7.x优化-CSDN博客](https://blog.csdn.net/YuDBL/article/details/121316130)

[Android性能优化----图片三级缓存_android 图片三级缓存优化-CSDN博客](https://blog.csdn.net/qq_24554061/article/details/50451943#:~:text=%E5%BD%93%E6%88%91%E4%BB%AC%E5%9C%A8app%E4%B8%AD%E5%8A%A0%E8%BD%BD%E5%A4%A7%E9%87%8F%E7%9A%84%E5%9B%BE%E7%89%87%E6%97%B6%EF%BC%8C%E7%A8%8D%E6%9C%89%E4%B8%8D%E6%B3%A8%E6%84%8F%E5%B0%B1%E5%AE%B9%E6%98%93%E5%87%BA%E7%8E%B0OOM%E5%BC%82%E5%B8%B8%EF%BC%8C%E4%B8%BA%E4%BA%86%E9%81%BF%E5%85%8D%E5%87%BA%E7%8E%B0%E8%BF%99%E6%A0%B7%E7%9A%84%E9%97%AE%E9%A2%98%E5%B9%B6%E4%BF%9D%E8%AF%81%E5%A5%BD%E7%9A%84%E7%94%A8%E6%88%B7%E7%9A%84%E4%BD%93%E9%AA%8C%EF%BC%8C%E5%81%9A%E5%A5%BD%E7%BC%93%E5%AD%98%E6%98%AF%E9%9D%9E%E5%B8%B8%E9%87%8D%E8%A6%81%EF%BC%8C%E4%B8%8B%E9%9D%A2%E4%BB%8B%E7%BB%8D%E5%A6%82%E4%BD%95%E4%B8%BA%E5%9B%BE%E7%89%87%E5%81%9A,%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%EF%BC%8C%E6%89%80%E8%B0%93%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%E6%98%AF%E6%8C%87%E5%9C%A8%E6%96%87%E4%BB%B6%E5%92%8C%E5%86%85%E5%AD%98%E4%B8%AD%E9%83%BD%E5%81%9A%E7%BC%93%E5%AD%98%EF%BC%8C%E6%89%80%E9%9C%80%E7%9A%84%E6%95%B0%E6%8D%AE%E9%A6%96%E5%85%88%E4%BB%8E%E5%86%85%E5%AD%98%E4%B8%AD%E5%81%9A%E7%9A%84%E7%BC%93%E5%AD%98%E4%B8%AD%E5%8F%96%EF%BC%8C%E5%BD%93%E5%86%85%E5%AD%98%E4%B8%AD%E6%B2%A1%E6%9C%89%E7%BC%93%E5%AD%98%E6%97%B6%E5%86%8D%E4%BB%8E%E6%96%87%E4%BB%B6%E4%B8%AD%E7%9A%84%E7%BC%93%E5%AD%98%E5%8F%96%EF%BC%8C%E5%BD%93%E6%96%87%E4%BB%B6%E4%B8%AD%E7%9A%84%E7%BC%93%E5%AD%98%E4%B9%9F%E6%B2%A1%E6%9C%89%E6%97%B6%EF%BC%8C%E5%B0%B1%E9%80%9A%E8%BF%87%E7%BD%91%E7%BB%9C%E8%AE%BF%E9%97%AE%E6%9C%8D%E5%8A%A1%E5%99%A8%E5%8F%96%E5%B9%B6%E5%9C%A8%E5%8F%96%E5%88%B0%E6%95%B0%E6%8D%AE%E5%90%8E%EF%BC%8C%E5%9C%A8%E5%86%85%E5%AD%98%E5%92%8C%E6%96%87%E4%BB%B6%E4%B8%AD%E9%83%BD%E5%81%9A%E4%B8%80%E4%B8%AA%E7%BC%93%E5%AD%98%E3%80%82)


## 三十二、ListView和RecyclerView有什么区别？

![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1732629446439-96efd7a9-6d24-46c0-beb0-a26876e3b367.jpeg)
![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1732629464062-22fdbad5-e722-4695-bcf4-ee66089d4166.jpeg)

## 三十三、RecyclerView中的缓存实现原理
## 三十四、RecyclerView中ItemDecoration的实现原理
## 三十五、如果要保证一个列表页保持内存稳定的话，可以怎么处理
使用 RecyclerView 而非 ListView

`RecyclerView` 是 `ListView` 的升级版，提供了更好的性能和更高的灵活性。`RecyclerView` 的 `ViewHolder` 模式可以有效减少重复的 `findViewById` 调用，从而降低内存消耗。

优化图片加载 使用占位图和错误图	 缩放图片

+ 如果图片过大，加载到内存中会占用大量空间。可以通过 `Glide` 或 `Picasso` 的 `.override(width, height)` 方法指定加载的图片大小。

 避免内存泄漏 避免静态引用

+ 不要在静态变量中直接引用 `Context` 或 `View`，因为它们会持有 `Activity` 的引用，导致 `Activity` 无法被垃圾回收。

清理资源

在 `Activity` 或 `Fragment` 的生命周期结束时，清理不必要的资源，例如取消图片加载任务、关闭数据库连接等。  优化数据加载 分页加载数据：不要一次性加载所有数据，而是通过分页或滚动加载的方式逐步加载数据

使用缓存：对于重复加载的数据，可以使用内存缓存或磁盘缓存来减少数据加载的开销。

## 三十六、activity的启动和activity的四种模式
1、在一个Activity中调用startActivity()方法

2、在一个Activity中调用startActivityRequest()方法。

A调用startActivityRequest并重写onActivityResult方法，用来接收B回传的数据。在B中回传数据时采用setResult方法，并且之后要调用finish方法。

第一种方法简单直接。但是如果A调用B，并传递数据，同时B对数据处理后又返回给A，A再将数据显示出来。碰到这种情况，用第一种方法需要在A的onCreate()里面判断是第一次生成的界面，还是由B打开的A。这样比较麻烦，用第二种方法就简单了，在A的onCreate()只用写一次生成的界面的内容。在A的onActivityResult方法里放B处理完数据后的内容就可以了。

[细谈Activity四种启动模式_activity的启动方式-CSDN博客](https://blog.csdn.net/zy_jibai/article/details/80587083)

## 三十七、ContentProvider如何自定义与使用场景？
应用：一种是通过实现代码访问其他应用中的现有内容提供程序；另一种是在应用中创建新的内容提供程序，从而与其他应用共享数据

如何实现自己的ContentProvider

1. 实现自己的ContentProvider需要遵循以下几个步骤：
2. 在AndroidManifest.xml中声明ContentProvider。
3. 实现自定义的ContentProvider类，重写其方法，如query()、insert()、update()和delete()。
4. 实现数据存储和检索的逻辑，通常涉及到数据库的操作。
5. 提供适当的URI，以便于外部应用程序通过ContentResolver与之交互。

## 三十八、BroadCastReciver的静态注册与动态注册的区别？
动态注册和静态注册的区别：

动态注册的广播接收器可以自由的控制注册和取消，有很大的灵活性。但是只能在程序启动之后才能收到广播，此外，不知道你注意到了没，广播接收器的注销是在onDestroy()方法中的。所以广播接收器的生命周期是和当前活动的生命周期一样。

静态注册的广播不受程序是否启动的约束，当应用程序关闭之后，还是可以接收到广播。

## 三十九、application、activity、service的context区别，可以启动activity、dialog吗
Application Context

+ 全局性：`Application`类的实例是全局的，与应用程序的生命周期相同。
+ 生命周期：它在应用程序启动时创建，并在应用程序结束时销毁。
+ 资源访问：可以访问所有应用程序级别的资源，如全局的SharedPreferences。
+ 跨组件通信：适合用于跨组件的通信，如在不同的`Activity`和`Service`之间共享数据。
+ 启动`Activity`和`Dialog`：不能直接从`Application`上下文中启动`Activity`，因为`Activity`需要与用户交互。但是，可以从`Application`上下文中启动`Service`。

Activity Context

+ 局部性：每个`Activity`都有自己的`Context`实例，与`Activity`的生命周期绑定。
+ 生命周期：当`Activity`被创建时，它的`Context`实例被创建，当`Activity`被销毁时，它的`Context`实例被销毁。
+ 资源访问：可以访问与当前`Activity`相关的资源。
+ 用户交互：适合用于与用户交互的操作，如启动新的`Activity`或显示`Dialog`。
+ 启动`Activity`和`Dialog`：可以直接从`Activity`上下文中启动新的`Activity`或显示`Dialog`。

Service Context

+ 局部性：每个`Service`都有自己的`Context`实例，与`Service`的生命周期绑定。
+ 生命周期：当`Service`被创建时，它的`Context`实例被创建，当`Service`被销毁时，它的`Context`实例被销毁。
+ 后台任务：适合用于执行后台任务，如播放音乐、下载文件等。
+ 启动`Activity`和`Dialog`：理论上，`Service`上下文也可以启动`Activity`，但由于`Service`通常运行在后台，没有用户界面，因此不建议在`Service`中直接启动`Activity`或显示`Dialog`。如果需要与用户交互，应该通过`Broadcast`或`Intent`将请求发送给`Activity`来处理。

启动`Activity`和`Dialog`

+ 启动`Activity`：可以通过`Context`的`startActivity()`方法启动一个新的`Activity`。无论是`Application`、`Activity`还是`Service`的上下文都可以调用这个方法。
+ 显示`Dialog`：通常在`Activity`上下文中显示`Dialog`，因为`Dialog`需要与用户交互，而`Activity`提供了用户交互的上下文环境。


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1733129816580-f6ae971d-69d9-4353-9be8-a81bd1f655a6.png)

## 四十、说一下Fragment的理解
Fragment（片段）是Android开发中一个非常重要的组件，它代表了一块用户界面的一部分，可以嵌入到Activity中。Fragment可以有自己的生命周期、接收输入事件，并且可以包含自己的布局。它类似于一个“迷你Activity”，但依赖于Activity来运行。

+ 模块化UI：Fragment允许开发者将Activity的界面分解为多个可复用的模块，每个模块可以独立管理自己的生命周期和用户交互。
+ 适配不同屏幕尺寸：在平板和手机等不同设备上，Fragment可以灵活地组合和拆分，以适应不同的屏幕尺寸和布局。
+ 动态交互：Fragment可以在运行时动态添加、移除或替换，从而实现更灵活的用户交互。

## 41、Fragment的生命周期
onAttach():

在Fragment与Activity绑定时调用。

此时Fragment还没有初始化布局，它还没有创建视图层次结构。

onCreate():

初始化Fragment时调用，通常用于初始化不与视图相关的部分，比如数据或资源。

适合在这里保存和恢复任何不依赖于视图层次结构的状态。

onCreateView():

为Fragment创建视图（UI）层次结构时调用。

在这个方法中创建并返回Fragment的视图层次。

onViewCreated():

当Fragment的宿主Activity已完成其onCreate()方法时被调用。

此时可确保Activity和Fragment的视图都已完全初始化。

onViewStateRestored() onStart():

当Fragment对用户是可见时调用，此时Fragment处于“可见但未获取焦点”的状态。

onResume():

当Fragment进入“活动”状态并且与用户交互时调用。

onPause():

当Fragment未获取焦点但仍可见时调用。

onStop():

当Fragment不再可见时调用。

onSaveInstanceState() onDestroyView():

当Fragment的视图层次结构被销毁时调用。

onDestroy():

在Fragment即将被销毁之前调用。

onDetach():

当Fragment与Activity解绑时调用

## 42、Fragment的add和replace区别，分别对fragment的生命周期的影响
1. 先我们先从add和replace应用场景出发
当我们对Activity通过事务添加一个Fragment时，有两种方式都可以做到，那就是add和replace。

+ 当前Activity同一个容器只添加一个Fragment时add和replace效果是一样的。
+ 当前Activity添加了一个FragmentA后，在后续某个操作中要将这个FragmentA替换为另外一个FragmentB时，有两种情况：
1. 如果`FragmentA`时通过add添加的，在将`FragmentA`替换为`FragmentB`时，可以通过hide `FragmentA`，add `FragmentB`show `FragmentB`
2. 如果`FragmentA`通过replace操作添加的，在将`FragmentA`替换为`FragmentB`时，使用replace替换
    - 通过 add 添加的 `Fragments`，可以由开发者自由控制当前应该显示哪个Fragment，以及隐藏哪个Fragment,其实在源码中就是对应Fragment中View的显示和隐藏。
    - 通过replace 添加 的 Fragment，当前已存在的Fragment被替换时走生命周期销毁流程，传递给replace方法的Fragment走生命周期创建流程。
    - 根据以上结论，我们可以得到一个实例开发中添加Fragment时很重要的一个结论
        * 当Fragment不可见时，如果你要保留Fragment中的数据以及View的显示状态，那么可以使用add操作，后续中针对不同的状态隐藏和显示不同的Fragment。
            + 优点：快，知识Fragment中View的显示和隐藏
            + 缺点：内存中保留的数据太多，容易导致造成OOM的风险。
        * 当Fragment不可见时，你不需要保留Fragment中的数据以及View的显示状态，那么可以使用replace。
            + 优点：节省内存，不需要的数据能立即释放掉
            + 缺点：频繁创建Fragment,也就是频繁走Fragment生命周期创建和销毁流程，造成性能开销。

replace本质就是将replace操作变为remove和add操作，旧的 Fragment走生命周期销毁流程，新传递的Fragment走[生命周期](https://zhida.zhihu.com/search?content_id=182166628&content_type=Article&match_order=8&q=%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F&zhida_source=entity)创建流程。
如果要从源码角度回答细致一点，那么可以回答：

    1. 如果当前Activity同一个id还没有添加Fragment,replace操作和add操作一样。
即执行两者操作生命周期变化：onAttach->onCreate->onCreateView->onActivityCreated->onStart-onResume,
Fragment所依附的Activity销毁时，执行onPause->onStop->onDestoryView->onDestory->onDetach
    2. 如果当前Activity同一个id存在Fragment,replace传递的Fragment实例和已存在的Fragment实例一样，replace无效果。
    3. 如果当前Activity同一个id存在Fragment,replace传递的Fragment实例和已存在的Fragment实例不一样，replace操作会转换为 remove和add操作，即删除旧的Fragment,添加新的Fragment。
旧的Fragment执行 onPause->onStop->onDestoryView->onDestory->onDetach
新的Fragment执行 onAttach->onCreate->onCreateView->onActivityCreated->onStart-onResume

## 43、Fragment的构造函数为什么不让传参
fragment的构造函数是空的，是instantiate这个方法的作用是创建了fragment对象，发现Fragment是用反射的方式创建的，而且有mArguments来控制参数那么当然要用特定的方式来传递参数了

```java
 public static Fragment instantiate(Context context, String fname) {
 	return instantiate(context, fname, null);
 }
public static Fragment instantiate(Context context, String fname, Bundle args) {
     try {
        Class<?> clazz = sClassMap .get(fname);
        if (clazz == null) { // Class not found in the cache, see if it's real, and try to add it
        clazz = context.getClassLoader().loadClass(fname);
        sClassMap .put(fname, clazz);
     }
    /*获取Bundle原先的值,这样一开始利用Bundle传递进来的值,就放入f. mArguments.
    只需要在Fragment中利用getArguments().getString("key");就能将参数取出来继续用 */
    Fragment f = (Fragment)clazz.newInstance();
    if (args != null) {
        args.setClassLoader(f.getClass().getClassLoader());
        f. mArguments = args;
    }
    return f;
 } catch (ClassNotFoundException e) {
     throw new InstantiationException( "Unable to instantiate fragment " + fname + ": make sure class name exists, is public, and has an" + " empty constructor that is public" , e);
 } catch (java.lang.InstantiationException e) {
    throw new InstantiationException( "Unable to instantiate fragment " + fname + ": make sure class name exists, is public, and has an" + " empty constructor that is public" , e);
 } catch (IllegalAccessException e) {
    throw new InstantiationException("Unable to instantiate fragment " + fname + ": make sure class name exists, is public, and has an" + " empty constructor that is public" , e);
 } //...
```

所以我们可以用bundle对象来传递参数：

```java
Bundle bundle = new Bundle();
bundle.putSerializable("entity", entity);
fragment.setArguments(bundle);
```

## 44、自定义behavior、NestScroll、NestChild
## 45、Android秒开的定义
软件、应用程序或者设备能够非常快速地启动。例如，当用户点击一个软件的图标，后软件在极短的时间内（通常是以秒为单位，甚至可能在1 - 2秒以内）就完成了加载并进入可操作的状态。

## 46、Android父容器和子容器怎么关注他们的性能，关注父还是子
父容器只最外层的容器布局，子容器即内部的容器嵌套

父容器的性能关注点:

+ 布局复杂度：父容器的布局复杂度直接影响整个布局的性能。例如，`RelativeLayout` 和 `LinearLayout` 的性能差异主要体现在测量（Measure）和布局（Layout）阶段。`RelativeLayout` 的测量和布局过程相对复杂，因为它需要考虑子视图之间的相对位置关系。
+ 嵌套层级：父容器的嵌套层级越深，性能损耗越大。过多的嵌套会导致布局树的深度增加，从而增加测量和布局的开销。因此，应尽量减少嵌套层级，使用更高效的布局方式，如 `ConstraintLayout`。
+ 重绘和重排：父容器的属性变化可能会导致整个布局的重绘或重排，这会消耗大量资源。例如，修改父容器的背景颜色或尺寸可能会触发重绘或重排。
+ 布局缓存：在滑动列表等场景中，父容器可以利用布局缓存来提升性能。

子容器的性能关注点:

+ 视图数量：子容器中包含的视图数量越多，性能消耗越大。因此，应尽量减少不必要的子视图，避免在子容器中放置过多的控件。
+ 视图的复杂度：子容器中每个视图的复杂度也会影响性能。例如，一个包含大量图片或复杂绘制逻辑的子视图会增加绘制的开销。
+ 交互逻辑：子容器的交互逻辑也可能影响性能。例如，子容器的滑动事件处理不当可能会导致卡顿。通过实现 `NestedScrollingChild` 和 `NestedScrollingParent` 接口，可以优化嵌套滑动的性能。

性能优化的关注点

+ 优先关注父容器：父容器的性能问题通常会对整个布局产生全局性影响。例如，父容器的嵌套层级问题会导致整个布局树的性能下降。因此，在优化布局性能时，应优先关注父容器的设计和优化。
+ 子容器的局部优化：在父容器优化的基础上，再关注子容器的局部优化。例如，减少子容器中的视图数量或优化子视图的绘制逻辑。

通过优化父容器的布局设计、减少嵌套层级、合理选择布局方式等手段，可以显著提升应用的性能。在此基础上，再对子容器进行局部优化，如减少视图数量、优化绘制逻辑等。

## 47、子容器渲染完成表示秒开还是父容器渲染完成表示秒开
+ 父容器渲染完成：父容器的渲染完成是整个页面渲染完成的前提条件。父容器的布局和绘制决定了子容器的显示位置和大小。父容器（如Activity）的渲染完成通常意味着整个页面的主要布局和核心功能已经加载完成。
    - 用户看到的是一个完整的页面，即使某些子组件（如Fragment或子View）还在加载中，用户已经可以开始与页面交互。
    - 适用于对整体页面加载速度要求较高的场景，如应用的启动页、主页面等。
+ 子容器渲染完成：子容器的渲染完成是页面渲染完成的一部分，但子容器的渲染依赖于父容器的布局。子容器（如Fragment或子View）的渲染完成意味着页面的某个特定功能或模块已经可用。
    - 用户可能需要等待更长时间才能看到完整的页面，但某些关键功能可以更快地响应
    - 适用于对特定功能模块加载速度要求较高的场景，如动态加载的内容模块、广告模块等
+ 如果应用的主要目标是让用户尽快看到完整的页面并开始交互，则以父容器渲染完成作为“秒开”的标准更为合适。
+ 如果应用的重点是某些关键功能模块的快速响应，则可以考虑以子容器渲染完成作为“秒开”的标准。

## 48、端到端耗时优化做了啥
端到端指的是从input端到output端，

在Android开发中端到端耗时优化是指从用户触发某个操作到操作完成的整个过程中的时间优化。

### 1、启动速度优化
+ 减少启动时加载的资源：延迟加载非必要的资源，对图片、音频等资源进行压缩，使用异步任务加载数据。
+ 优化启动流程：将耗时操作移至异步线程，使用懒加载和并行初始化。
+ 简化启动Activity的布局和逻辑：减少布局复杂度，使用ViewStub延迟加载。

### 2、布局与绘制优化
+ 减少布局层级：使用扁平化的布局结构，减少嵌套层级，优先使用`ConstraintLayout`。
+ 优化视图层级：避免过度绘制，使用`Hierarchy Viewer`工具分析布局性能。
+ 硬件加速：在`AndroidManifest.xml`中启用硬件加速，提升绘制性能。

### 3、网络优化
+ 缓存策略：实现有效的缓存机制，减少网络请求次数，使用缓存库（如Retrofit）简化缓存逻辑。
+ 数据压缩：在服务器端实现数据压缩，减少传输数据量。

### 4、内存优化
+ 内存泄漏检测：使用`LeakCanary`等工具检测内存泄漏，及时释放不再使用的对象。
+ 内存管理：使用弱引用、软引用等管理内存，避免在组件中创建不必要的对象。

### 5、线程优化
+ 异步任务处理：将耗时操作移至后台线程，避免阻塞主线程，使用线程池管理线程。
+ 多线程管理：合理使用`ExecutorService`等线程管理工具，避免频繁创建和销毁线程。

### 6、响应速度优化
+ 避免主线程阻塞：将大量和耗时操作放在工作线程中执行，确保UI线程流畅运行。
+ 优化数据处理：选择合适的数据结构提升数据查找和遍历效率。

### 7、工具与实践
+ 性能分析工具：使用`Systrace`、`TraceView`、`Profile GPU Rendering`等工具分析性能瓶颈。
+ 持续监控与优化：在应用的整个生命周期中不断进行性能优化，确保用户体验的持续提升

## 49、View.inflate过程与异步inflater
1. `View.inflate`过程

`View.inflate`是Android中用于将XML布局文件转换为View对象的方法。这个过程主要涉及解析XML布局文件，并根据文件中定义的组件创建相应的View对象。具体来说，`View.inflate`方法会做以下几件事情：

+ 解析XML布局文件：读取XML文件内容，解析其中的标签和属性。
+ 创建View对象：根据XML文件中定义的组件，创建相应的View实例。
+ 设置属性：为创建的View对象设置XML中定义的属性值。
+ 构建视图树：将创建的View对象按照XML文件中的层级关系组织成视图树。

这个过程是同步的，意味着它会阻塞主线程直到布局文件被完全加载和解析，这可能会导致UI的卡顿，特别是在加载大型布局文件时。

2. 异步`inflater`（`AsyncLayoutInflater`）

为了解决`View.inflate`可能引起的UI卡顿问题，Android提供了`AsyncLayoutInflater`类，用于异步加载布局。以下是`AsyncLayoutInflater`的工作原理：

+ 异步加载：`AsyncLayoutInflater`将布局文件的加载和解析过程放在一个单独的线程中进行，避免了主线程的阻塞。
+ 回调机制：加载完成后，通过`OnInflateFinishedListener`接口将加载的View回调到主线程，从而更新UI。
+ 线程池管理：`AsyncLayoutInflater`使用一个线程池来管理异步任务，提高了布局加载的效率。

使用`AsyncLayoutInflater`的基本步骤如下：

```plain
java

new AsyncLayoutInflater(context).inflate(R.layout.layout_resource, null, new AsyncLayoutInflater.OnInflateFinishedListener() {
    @Override
    public void onInflateFinished(View view, int resid, ViewGroup parent) {
        // 在这里设置ContentView或者对view进行其他操作
        setContentView(view);
    }
});
```

这种方式可以显著提高应用程序的响应速度，特别是在加载大型布局文件时。

3. `AsyncLayoutInflater`的局限性及改进

尽管`AsyncLayoutInflater`提供了异步加载布局的能力，但它也有一些局限性：

+ 不支持`LayoutInflater.Factory`或`LayoutInflater.Factory2`：这意味着你不能使用自定义的View创建工厂。
+ View不被自动添加到父容器：你需要手动将异步加载的View添加到父容器中。
+ Handler和Looper的使用限制：在异步线程中不能直接使用Handler或调用`Looper.myLooper()`，因为异步线程默认没有准备Looper。

## 50、ViewHolder为什么要声明为内部静态类
非静态内部类会隐式持有外部类的引用，就像大家经常将自定义的adapter在Activity类里，然后在adapter类里面是可以随意调用外部activity的方法的。

当你将内部类定义为static时，你就调用不了外部类的实例方法了，因为这时候静态内部类是不持有外部类的引用的。声明ViewHolder静态内部类，可以将ViewHolder和外部类解引用。

将`ViewHolder`声明为内部静态类可以更好地封装视图的引用和逻辑

在`RecyclerView.Adapter`中，`ViewHolder`的实例通常在`onCreateViewHolder`和`onBindViewHolder`方法中被创建和绑定。如果`ViewHolder`是静态的，那么它可以在多个`Adapter`实例之间共享，这有助于减少内存分配和提高性能。

在某些情况下，`ViewHolder`可能会在不同的线程中被访问。将`ViewHolder`声明为静态类可以确保其成员变量是线程安全的，因为静态成员变量在类加载时只会被初始化一次。

## 51、如何通过windowmanager添加window，代码实现
```java
// 创建一个按钮作为我们的浮动窗口
Button floatingButton = new Button(this);
floatingButton.setText("Floating Button");

// 设置浮动窗口的参数
WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams(
	WindowManager.LayoutParams.WRAP_CONTENT,
	WindowManager.LayoutParams.WRAP_CONTENT,
	WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY, // 设置窗口类型
	WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | // 设置窗口标志
	WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, // 设置窗口不获取焦点
	PixelFormat.TRANSLUCENT); // 设置窗口像素格式

layoutParams.gravity = Gravity.CENTER; // 设置窗口位置

// 获取WindowManager对象
WindowManager windowManager = getWindowManager();
//WindowManager windowManager = (WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE);

// 将按钮添加到窗口中
windowManager.addView(floatingButton, layoutParams);
```

## 52、如何给listview、recycleview添加下拉刷新，上拉更多
[自定义ListView下拉刷新上拉加载更多 - TMusketeer - 博客园](https://www.cnblogs.com/cmusketeer/p/16769560.html)

SwipeRefrshLayout实现下拉刷新，尾部加入FootView实现上拉加载，加载一个底部的进度布局。

如果不使用SwipeRefrshLayout，下拉刷新也可以像FootView一样自定义下拉刷新效果添加到头部。

## 53、Android长图片加载怎么实现
## 54、换肤怎么实现的
首先先看下activity加载资源的流程

Activity的onCreate()方法里面我们都要去调用setContentView(int id)

```java
    @Override
    public void setContentView(int resId) {
        ensureSubDecor();
        ViewGroup contentParent = (ViewGroup) mSubDecor.findViewById(android.R.id.content);
        contentParent.removeAllViews();
        LayoutInflater.from(mContext).inflate(resId, contentParent);//这里实现view布局的加载
        mOriginalWindowCallback.onContentChanged();
    }
```

```java
    public View inflate(@LayoutRes int resource, @Nullable ViewGroup root) {
        return inflate(resource, root, root != null);
    }
```

```java
    public View inflate(@LayoutRes int resource, @Nullable ViewGroup root, boolean attachToRoot) {
        final Resources res = getContext().getResources();
        if (DEBUG) {
            Log.d(TAG, "INFLATING from resource: \"" + res.getResourceName(resource) + "\" ("
                    + Integer.toHexString(resource) + ")");
        }

        final XmlResourceParser parser = res.getLayout(resource);
        try {
            return inflate(parser, root, attachToRoot);
        } finally {
            parser.close();
        }
    }
```

```java
 public View inflate(XmlPullParser parser, @Nullable ViewGroup root, boolean attachToRoot) {
            ...
            final String name = parser.getName();
            final View temp = createViewFromTag(root, name, inflaterContext, attrs);
            ...
            return temp;
    }
```

```java
	View createViewFromTag(View parent, String name, Context context, AttributeSet attrs,
            boolean ignoreThemeAttr) {
        try {
            View view;
            if (mFactory2 != null) {
                view = mFactory2.onCreateView(parent, name, context, attrs);
            } else if (mFactory != null) {
                view = mFactory.onCreateView(name, context, attrs);
            } else {
                view = null;
            }
            return view;
        } catch (Exception e) {
        }
    }
```

inflate最终调用了createViewFromTag方法来创建View,在这之中用到了factory，如果factory存在就用factory创建对象，如果不存在就由系统自己去创建。我们只需要实现我们的Factory然后设置给mFactory2就可以采集到所有的View了，这里是一个Hook点。

换肤的原理就是Hook住Factory这个类，采集需要换肤的View，然后加载外部资源皮肤包，并且根据采集的View的资源名称找皮肤包中对应的资源，当我们重写Factory的onCreateView之后，就可以不通过系统层而是自己截获从xml映射的View进行相关View创建的操作，包括对View的属性进行设置（比如背景色，字体大小，颜色等）以实现换肤的效果。

[字节头条部Android二面：说一说Android动态换肤实现原理吧，答不上来下一个-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/1775074)

## 55、换肤中怎么动态加载一个外部资源，hook哪个类
动态加载一个外部资源

通过反射调用 `AssetManager.addAssetPath()` 方法，将皮肤包的资源路径添加到 `AssetManager` 中，从而创建一个新的 `Resources` 对象。

+ 使用`AssetManager`加载外部资源文件。
+ 创建新的`Resources`对象以访问这些资源。

```java
try {
    AssetManager assetManager = AssetManager.class.newInstance();
    Method addAssetPath = AssetManager.class.getMethod("addAssetPath", String.class);
    addAssetPath.invoke(assetManager, "/path/to/external/resource.apk");

    Resources resources = new Resources(assetManager, context.getResources().getDisplayMetrics(), context.getResources().getConfiguration());
    // 使用resources加载具体资源
} catch (Exception e) {
    e.printStackTrace();
}
```

hook住Factory类

Hook技术是一种在程序运行时动态修改程序行为的技术。它通过在程序的执行路径中插入自定义的代码片段，拦截并修改方法调用或函数执行。

Hook的Factory类中重写onCreateView，通过反射拦截控件的创建过程。在自定义的 `Factory` 中，通过皮肤包的 `Resources` 获取资源，并替换控件的属性。

```java
@Override
public View onCreateView(View parent, String name, Context context, AttributeSet attrs) {
	//换肤就是在需要时候替换 View的属性(src、background等)
	//所以这里创建 View,从而修改View属性
	View view = createSDKView(name, context, attrs);
	if (null == view) {
		view = createView(name, context, attrs);
	}
	//这就是我们加入的逻辑，hook添加逻辑的地方
	if (null != view) {
		//加载属性
		skinAttribute.look(view, attrs);
	}
	return view;
}
private View createSDKView(String name, Context context, AttributeSet
						   attrs) {
	//如果包含 . 则不是SDK中的view 可能是自定义view包括support库中的View
	if (-1 != name.indexOf('.')) {
		return null;
	}
	//不包含就要在解析的 节点 name前，拼上： android.widget. 等尝试去反射
	for (int i = 0; i < mClassPrefixList.length; i++) {
		View view = createView(mClassPrefixList[i] + name, context, attrs);
		if (view != null) {
			return view;
		}
	}
	return null;
}

private View createView(String name, Context context, AttributeSet
						attrs) {
	Constructor<? extends View> constructor = findConstructor(context, name);
	try {
		return constructor.newInstance(context, attrs);
	} catch (Exception e) {
	}
	return null;
}


private Constructor<? extends View> findConstructor(Context context, String name) {
	Constructor<? extends View> constructor = mConstructorMap.get(name);
	if (constructor == null) {
		try {
			Class<? extends View> clazz = context.getClassLoader().loadClass
			(name).asSubclass(View.class);
			constructor = clazz.getConstructor(mConstructorSignature);
			mConstructorMap.put(name, constructor);
		} catch (Exception e) {
		}
	}
	return constructor;
}
```

## 56、如何实现activity窗口快速变暗
### 1、方法1：使用`WindowManager.LayoutParams`动态调整窗口透明度
通过修改`WindowManager.LayoutParams`的`alpha`属性，可以快速实现窗口变暗的效果。

#### (1) 示例代码
```java
public class MainActivity extends AppCompatActivity {
    private float originalAlpha = 1.0f; // 原始透明度
    private float targetAlpha = 0.5f;   // 目标透明度

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 获取当前窗口
        Window window = getWindow();
        WindowManager.LayoutParams params = window.getAttributes();

        // 保存原始透明度
        originalAlpha = params.alpha;

        // 设置目标透明度
        params.alpha = targetAlpha;
        window.setAttributes(params);

        // 恢复原始透明度（可选）
        Button restoreButton = findViewById(R.id.restoreButton);
        restoreButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                params.alpha = originalAlpha;
                window.setAttributes(params);
            }
        });
    }
}
```

### 2、方法2：使用`Window`的`addFlags`方法
通过设置窗口标志`FLAG_DIM_BEHIND`，可以实现窗口变暗的效果。

#### (1) 示例代码
```java
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 获取当前窗口
        Window window = getWindow();

        // 设置窗口变暗
        window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        WindowManager.LayoutParams params = window.getAttributes();
        params.dimAmount = 0.5f; // 设置变暗的程度（0.0f到1.0f）
        window.setAttributes(params);

        // 恢复原始状态（可选）
        Button restoreButton = findViewById(R.id.restoreButton);
        restoreButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            }
        });
    }
}
```

### 3、方法3：使用`View`的`setAlpha`方法
通过设置一个覆盖整个窗口的透明`View`，可以实现窗口变暗的效果。

#### (1) 示例代码
```java
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 创建一个覆盖整个窗口的透明View
        View overlayView = new View(this);
        overlayView.setLayoutParams(new ViewGoup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        overlayView.setBackgroundColor(Color.BLACK); // 设置背景颜色为黑色
        overlayView.setAlpha(0.5f); // 设置透明度（0.0f到1.0f）

        // 将覆盖View添加到DecorView
        ViewGroup decorView = (ViewGroup) getWindow().getDecorView();
        decorView.addView(overlayView);

        // 恢复原始状态（可选）
        Button restoreButton = findViewById(R.id.restoreButton);
        restoreButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                decorView.removeView(overlayView); // 移除覆盖View
            }
        });
    }
}
```

### 4、方法4：使用`Theme`或`Style`实现变暗效果
通过定义一个带有半透明背景的`Theme`或`Style`，并在Activity中应用该主题。

#### (1) 定义Theme
在`res/values/styles.xml`中定义一个带有半透明背景的主题：

```xml
<style name="DimTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="android:windowBackground">@drawable/dim_background</item>
</style>
```

#### (2) 定义半透明背景
在`res/drawable/dim_background.xml`中定义一个半透明的背景：

```xml
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#80000000" /> <!-- 半透明黑色 -->
</shape>
```

#### (3) 应用Theme
在`AndroidManifest.xml`中为Activity指定该主题：

```xml
<activity android:name=".MainActivity"
          android:theme="@style/DimTheme">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

### 5、方法5：使用`Window`的`setBackgroundDrawable`方法
通过设置窗口的背景为半透明的Drawable，可以实现窗口变暗的效果。

#### (1) 示例代码
```java
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 设置窗口背景为半透明黑色
        Window window = getWindow();
        window.setBackgroundDrawable(new ColorDrawable(Color.argb(128, 0, 0, 0))); // 半透明黑色
    }
}
```

## 57、Android事件分发机制问题
描述场景1：当父容器中有一个viewA，手指1按下A然后手指2按下空白区域，松开手指1再松开手指2，事件分发流程，以及onclick的触发

## 58、子线程可以刷新UI吗
子线程（非主线程）不能直接更新 UI。这是因为 Android 的 UI 操作（如修改视图的内容、布局等）必须在主线程（也称为 UI 线程）中执行。这种设计主要是为了保证 UI 的线程安全和响应性。

可以使用以下方式：

`Activity` 提供了 `runOnUiThread()` 方法，可以直接将操作切换到主线程

使用`Handler` 将消息或 Runnable 发送到主线程

`View` 提供了 `post(Runnable)` 方法，可以将 Runnable 发送到主线程

推荐使用 `LiveData` 或 `ViewModel` 来处理线程间的通信。`LiveData` 是线程安全的，可以自动将数据更新推送到主线程

如果尝试在子线程中直接更新 UI，通常会抛出一个致命的异常，导致应用崩溃。这个异常是 `CalledFromWrongThreadException`，它明确指出你尝试从错误的线程（非主线程）访问或修改 UI 组件。

## 59、application的oncreate和activity的oncreate有什么区别
`Application` 是整个应用的全局入口，它的 `onCreate()` 方法在整个应用的生命周期中只被调用一次。当应用启动时，系统会创建一个 `Application` 实例，并调用其 `onCreate()` 方法。这是应用的全局初始化阶段。生命周期与整个应用的生命周期一致，它在整个应用运行期间始终存在

+ 初始化全局变量或单例对象。
+ 配置全局的日志、网络管理、数据库等。
+ 设置全局的异常处理器（`Thread.setDefaultUncaughtExceptionHandler`）。
+ 初始化第三方库（如 Crashlytics、Fabric 等）。

`Activity` 是一个独立的用户界面组件，每个 `Activity` 的 `onCreate()` 方法只在该 `Activity` 的生命周期中被调用一次。当 `Activity` 第一次创建时，系统会调用其 `onCreate()` 方法。这是 `Activity` 的初始化阶段。生命周期是独立的，每次 `Activity` 被创建或重新创建时，`onCreate()` 方法都会被调用。

+ 设置布局（`setContentView()`）。
+ 初始化 `Activity` 的局部变量。
+ 恢复保存的实例状态（通过 `onCreate(Bundle savedInstanceState)`）。
+ 初始化 `Activity` 的 UI 组件和事件监听器。

## 60、一个点击事件结束后是怎么被销毁的
### 1、清理事件监听器
+ 当事件处理完成（如 `onClick` 回调执行完毕）后，与事件相关的监听器（如 `View.OnClickListener`）会被标记为“已处理”。
+ 如果 `View` 被销毁（如 `Activity` 结束），监听器也会随之销毁。

### 2、清理内部状态
+ 在事件处理过程中，`View` 的内部状态（如 `PRESSED` 状态）会被清理：
    - `setPressed(false)`：清除按压状态。
    - `mHasPerformedLongPress = false`：清除长按标志。
    - `mIgnoreNextUpEvent = false`：清除忽略下次抬起事件的标志。

### 3、移除回调
+ 在事件处理过程中，`View` 可能会设置一些延迟回调（如 `postDelayed` 的 `Runnable`）：
    - `removeCallbacks()`：移除所有延迟回调。
    - 例如，`CheckForTap` 和 `CheckForLongPress` 等回调会在事件结束后被移除。

### 4、清理消息队列
+ `Handler` 和 `Looper` 管理的消息队列中与事件相关的消息会被清理：
    - 如果事件被处理完成，相关的消息（如 `ACTION_UP` 的处理消息）会被移除。
    - 如果事件被中断（如 `ACTION_CANCEL`），所有未处理的消息也会被清理。

### 5、资源回收
+ 如果事件处理过程中创建了临时资源（如 `Bitmap`、`Drawable` 等），这些资源会在事件结束后被回收。
+ 如果 `View` 被销毁（如 `Activity` 结束），与之相关的资源也会被垃圾回收器回收。

## 61、约束布局实现横向ABC,B自适应压缩
在 Android 的 ConstraintLayout 中，可以通过设置 水平方向的约束 和 权重（`app:layout_constraintHorizontal_weight`） 来实现横向排列的三个视图（A、B、C），其中 B 自适应压缩的效果。

假设你有三个视图（A、B、C），它们横向排列在 `ConstraintLayout` 中：

+ A 和 C 的宽度是固定的（例如，固定宽度或包裹内容）。
+ B 的宽度需要自适应压缩，占据剩余的空间。

```java
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="wrap_content">

    <!-- View A -->
    <TextView
        android:id="@+id/viewA"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="A"
        android:background="#FF0000"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent" />

    <!-- View B -->
    <TextView
        android:id="@+id/viewB"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:text="B"
        android:background="#00FF00"
        app:layout_constraintStart_toEndOf="@id/viewA"
        app:layout_constraintEnd_toStartOf="@id/viewC"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintHorizontal_weight="1" />

    <!-- View C -->
    <TextView
        android:id="@+id/viewC"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="C"
        android:background="#0000FF"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

1. 固定宽度的视图（A 和 C）：
    - A 和 C 的宽度设置为 `wrap_content`，表示它们的宽度会根据内容自适应。
    - A 的起始端（`start`）约束到父布局的起始端。
    - C 的结束端（`end`）约束到父布局的结束端。
2. 自适应压缩的视图（B）：
    - B 的宽度设置为 `0dp`，表示它的宽度会根据约束和权重动态计算。
    - B 的起始端约束到 A 的结束端，结束端约束到 C 的起始端。
    - 设置 `app:layout_constraintHorizontal_weight="1"`，表示 B 会占据剩余的水平空间。
3. 水平权重（`app:layout_constraintHorizontal_weight`）：
    - 在 `ConstraintLayout` 中，权重用于分配剩余空间。设置权重后，B 的宽度会根据权重动态调整，以填充 A 和 C 之间的剩余空间。

效果：

+ A 和 C 的宽度根据内容自适应。
+ B 的宽度会自适应压缩，占据 A 和 C 之间的剩余空间。
+ 如果 A 或 C 的内容变化，B 的宽度会自动调整。

权重（`app:layout_constraintHorizontal_weight`）只在水平方向上有效。

如果需要垂直方向的自适应，可以使用 `app:layout_constraintVertical_weight`。

如果需要在运行时动态调整 A 或 C 的内容，B 的宽度会自动重新计算。

## 62、SharePreference的commit和apply的区别
