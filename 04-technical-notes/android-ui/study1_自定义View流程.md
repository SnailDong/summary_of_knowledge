自定义View的实现有多种

分类

| 类型 | 定义 |
| --- | --- |
| 自定义组合控件 | 多个控件组合成为一个新的控件，方便多处复用 |
| 继承系统View控件 | 继承自TextView等系统控件，在系统控件的基础功能上进行扩展 |
| 继承View | 不复用系统控件逻辑，继承View进行功能定义 |
| 继承系统ViewGroup | 继承自LinearLayout等系统控件，在系统控件的基础功能上进行扩展 |
| 继承ViewViewGroup | 不复用系统控件逻辑，继承ViewGroup进行功能定义 |


绘制流程

View的绘制基本由measure()、layout()、draw()这个三个函数完成

其中布局相关的是onLayout，onMeasure，继承layout，ViewGroup的时候要重写

显示控件相关的是onDraw，继承View，涉及到canvas pait matrix clip rect animation path(贝塞尔) line text绘制

交互相关的onTouchEvent 涉及到组合的viewGroup

| 函数 | 作用 | 相关方法 |
| --- | --- | --- |
| measure() | 测量View的宽高 | measure(),setMeasuredDimension(),onMeasure() |
| layout() | 计算当前View以及子View的位置 | layout(),onLayout(),setFrame() |
| draw() | 视图的绘制工作 | draw(),onDraw() |


## 一、示例
创建一个颜色渐变的ColorTrackTextView并且继承TextView，实现文字的颜色渐变效果。

具体步骤如下：

1. 自定义一个View
2. 编写values/attrs.xml，在其中编写styleable和item等标签元素；
3. 在布局文件中view使用自定义的属性(要注意namespace)；
4. 在View的构造方法中通过TypeArray获取自定义的属性。

### 1、自定义属性的声明文件
定义名为originColor的表示原始颜色的属性，

定义名为changeColor的表示变化后的颜色的属性。

```java
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <declare-styleable name="ColorTrackTextView">
        <attr name="originColor" format="color" />
        <attr name="changeColor" format="color" />
    </declare-styleable>
</resources>
```

#### (1) 属性值的format
#### (2) reference：参考某一资源ID
```java
<declare-styleable name = "名称">
     <attr name = "background" format = "reference" />
</declare-styleable>
```

```java
<ImageView android:background = "@drawable/图片ID"/>
```

#### (3) color：颜色值
```java
<declare-styleable name = "名称">
     <attr name = "textColor" format = "color" />
</declare-styleable>
```

```java
<TextView android:textColor = "#00FF00" />
```

#### (4) boolean：布尔值
```java
<declare-styleable name = "名称">
     <attr name = "focusable" format = "boolean" />
</declare-styleable>
```

```java
<Button android:focusable = "true"/>
```

#### (5) dimension：尺寸值
```java
<declare-styleable name = "名称">
     <attr name = "layout_width" format = "dimension" />
</declare-styleable>
```

```java
<Button android:layout_width = "42dip"/>
```

#### (6) float：浮点值
```java
<declare-styleable name = "名称">
     <attr name = "fromAlpha" format = "float" />
</declare-styleable>
```

```java
<alpha android:fromAlpha = "1.0"/>
```

#### (7) integer：整型值
```java
<declare-styleable name = "名称">
    <attr name = "framesCount" format="integer" />
</declare-styleable>
```

```java
<animated-rotate android:framesCount = "12"/>
```

#### (8) string：字符串
```java
<declare-styleable name = "名称">
     <attr name = "text" format = "string" />
</declare-styleable>
```

```java
<TextView android:text = "我是文本"/>
```

#### (9) fraction：百分数
```java
<declare-styleable name = "名称">
     <attr name = "pivotX" format = "fraction" />
</declare-styleable>
```

```java
<rotate android:pivotX = "200%"/>
```

#### (10) enum：枚举值
```java
<declare-styleable name="名称">
    <attr name="orientation">
        <enum name="horizontal" value="0" />
        <enum name="vertical" value="1" />
    </attr>
</declare-styleable>
```

```java
<LinearLayout
    android:orientation = "vertical">
</LinearLayout>
```

注意：枚举类型的属性在使用的过程中只能同时使用其中一个，不能 android:orientation = “horizontal｜vertical"

#### (11) flag：位或运算
```java
<declare-styleable name="名称">
    <attr name="gravity">
            <flag name="top" value="0x01" />
            <flag name="bottom" value="0x02" />
            <flag name="left" value="0x04" />
            <flag name="right" value="0x08" />
            <flag name="center_vertical" value="0x16" />
            ...
    </attr>
</declare-styleable>
```

```java
<TextView android:gravity="bottom|left"/>
```

注意：位运算类型的属性在使用的过程中可以使用多个值

#### (12) 混合类型：属性定义时可以指定多种类型值
```java
<declare-styleable name = "名称">
     <attr name = "background" format = "reference|color" />
</declare-styleable>
```

```java
<ImageView
android:background = "@drawable/图片ID" />
或者：
<ImageView
android:background = "#00FF00" />
```

### 2、自定义View类
```java
package com.leo.colortrackview;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.util.TypedValue;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatTextView;

public class ColorTrackTextView extends AppCompatTextView {

    // 绘制不变色字体的画笔
    private Paint mOriginPaint;
    // 绘制变色字体的画笔
    private Paint mChangePaint;
    // 当前变色的进度
    private float mCurrentProgress = 0.5f;

    // 实现不同朝向
    private Direction mDirection;

    public enum Direction {
        LEFT_TO_RIGHT, RIGHT_TO_LEFT
    }

    /
     * 在java代码里new的时候会用到，需要调用第三个构造函数时可以如下先调用第二个构造函数
     * this(context, null);
     * 再有第二个构造函数去调用第三个构造函数
     * 重写时默认为super(context);
     * @param context
     */
    public ColorTrackTextView(@NonNull Context context) {
        this(context, null);
    }

    /
     * 在xml布局文件中使用时自动调用，这里被调用后调用第三个构造函数
     * 重写该方法时默认是super(context, attrs);需要调用第三个构造函数时要改成
     * this(context, attrs, 0);
     * @param context
     */
    public ColorTrackTextView(@NonNull Context context, @Nullable AttributeSet attrs) {
        this(context, attrs, 0);
    }

    /
     * 不会自动调用，如果有默认style时，在第二个构造函数中调用
     * @param context
     * @param attrs
     * @param defStyleAttr
     */
    public ColorTrackTextView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);

        initPaint(context, attrs);
    }

    private void initPaint(Context context, AttributeSet attrs) {
        TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.ColorTrackTextView);

        int originColor = typedArray.getColor(R.styleable.ColorTrackTextView_originColor,
                getTextColors().getDefaultColor());
        int changeColor = typedArray.getColor(R.styleable.ColorTrackTextView_changeColor,
                getTextColors().getDefaultColor());

        // 回收
        typedArray.recycle();

        // 不变色的画笔
        mOriginPaint = getPaintByColor(originColor);
        // 变色的画笔
        mChangePaint = getPaintByColor(changeColor);
    }

    /
     * 根据颜色获取画笔
     */
    private Paint getPaintByColor(int color) {
        Paint paint = new Paint();
        // 设置颜色
        paint.setColor(color);
        // 设置抗锯齿
        paint.setAntiAlias(true);
        // 防抖动
        paint.setDither(true);
        // 设置字体的大小  就是TextView的字体大小
        paint.setTextSize(getTextSize());
        return paint;
    }

    @Override
    protected void onDraw(Canvas canvas) {

        int currentPoint = (int) (mCurrentProgress * getWidth());

        // 从左边到右边变色
        if (mDirection == Direction.LEFT_TO_RIGHT) {
            // 绘制变色的部分 -- 开始 currentPoint = 0；结束 currentPoint = getWidth
            drawText(canvas, mChangePaint, 0, currentPoint);
            // 绘制不变色的部分
            drawText(canvas, mOriginPaint, currentPoint, getWidth());
        } else {
            // 绘制变色的部分 -- 开始 currentPoint = getWidth；结束 currentPoint = 0
            drawText(canvas, mChangePaint, getWidth() - currentPoint, getWidth());
            // 绘制不变色的部分
            drawText(canvas, mOriginPaint, 0, getWidth() - currentPoint);
        }
    }


    private void drawText(Canvas canvas, Paint paint, int start, int end) {
        canvas.save();
        Rect rect = new Rect(start, 0, end, getHeight());
        canvas.clipRect(rect);

        String text = getText().toString();
        // 判空
        if (TextUtils.isEmpty(text)) return;

        // 获取文字的区域
        Rect bounds = new Rect();
        paint.getTextBounds(text, 0, text.length(), bounds);
        // 获取x坐标
        int dx = getWidth() / 2 - bounds.width() / 2;
        // 获取基线  baseLine
        Paint.FontMetricsInt fontMetricsInt = mChangePaint.getFontMetricsInt();
        int dy = (fontMetricsInt.bottom - fontMetricsInt.top) / 2 - fontMetricsInt.bottom;
        int baseLine = getHeight() / 2 + dy;

        // 绘制文字
        canvas.drawText(text, dx, baseLine, paint);
        canvas.restore();
    }

    public void setCurrentProgress(float currentProgress) {
        this.mCurrentProgress = currentProgress;
        invalidate();
    }

    public void setDirection(Direction direction) {
        this.mDirection = direction;
    }

}
```

定义构造函数并调用父类构造函数确保所有基础TextView的功能都正常工作，

在使用的构造函数中通过TypeArray获取自定义属性，获取方式如下：

```java
TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.ColorTrackTextView);

int originColor = typedArray.getColor(R.styleable.ColorTrackTextView_originColor,
                                      getTextColors().getDefaultColor());
int changeColor = typedArray.getColor(R.styleable.ColorTrackTextView_changeColor,
                                      getTextColors().getDefaultColor());

// 回收
typedArray.recycle();
```

+ 使用`context.obtainStyledAttributes`，会返回一个`TypedArray`实例，允许访问在XML布局文件中定义的属性值；
+ 通过TypedArray获取自定义属性；
+ `TypedArray.recycle()`释放`TypedArray`对象所占用的资源，这一步是非常重要的，
    - 资源释放：一旦你完成了对`TypedArray`中属性的访问和处理，就应该调用`recycle()`方法来释放它。这允许系统回收这些资源，供其他组件使用。
    - 避免内存泄漏：如果你不调用`recycle()`，`TypedArray`对象可能会一直被保留在内存中，直到被垃圾回收器回收，这可能导致内存泄漏。
    - 使用时机：通常在读取完所有需要的属性之后，紧接着调用`recycle()`方法。例如，在自定义视图的构造函数中，你会在获取完所有自定义属性后调用它。
    - 调用一次：每个`TypedArray`对象应该只调用一次`recycle()`方法。一旦调用，该对象就不能再被使用了。
    - 异常安全：如果在你的代码中发生异常，确保`TypedArray`的`recycle()`方法仍然被调用。这可以通过在`finally`代码块中调用它来实现。

最后，初始化画笔工具，当onDraw被调用时绘制变色效果。

关于paint和canvas知识点后面再做学习和了解。

### 3、定义布局文件
```java
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    tools:context=".MainActivity">

    <com.leo.colortrackview.ColorTrackTextView
        android:id="@+id/color_track_tv"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello World!"
        android:textSize="20sp"
        app:changeColor="@color/teal_200" />

    <Button
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:onClick="leftToRight"
        android:text="左到右" />

    <Button
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:onClick="rightToLeft"
        android:text="右到左" />
</LinearLayout>
```

布局文件中原本使用TextView的控件替换为自定义View的类型，自定义View类型要使用包名加类型的格式，`app:changeColor`是自定义属性，格式为`app:attrsName`，示例中变色属性设置为`@color/teal_200`。

## 二、绘制流程


![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1724989858945-8025e5f6-90e6-4a63-bf8f-22f939a0e638.jpeg)

在上一章节我们已经了解过绘制要进行的步骤，即measure测量、layout布局、draw绘制，在在定义的view中，只要按需要去重写这些方法即可，上述的示例代码中，我们重写了onDraw方法，并添加变色逻辑，并且在被调用`setCurrentProgress`时调用`invalidate()`重绘视图，触发onDraw方法。注意，频繁调用`invalidate()`可能会影响性能，因为它会导致视图的`onDraw()`方法被频繁调用。如果可能，尽量限制重绘的范围和频率。只想重绘视图的一部分，可以重写`onDraw()`方法，并在其中使用`canvas`参数来绘制特定的区域。然后，可以调用`invalidate(Rect)`方法，传入一个矩形区域作为参数，以指示只重绘该区域。


## 三、自定义ViewGroup
创建一个自定义FlowLayout继承ViewGroup，实现一个流式布局。

流式布局是一种灵活的布局方式，允许子视图按照指定的方向流动排列，当达到容器的边界时会自动换行。自定义流式布局（FlowLayout）：通过继承`ViewGroup`并重写`onMeasure`和`onLayout`方法来创建自定义的流式布局。这种方式可以更灵活地控制子视图的排列和换行行为 ，下面开始实现自定义的FlowLayout。

```java
package com.leo.flowlayout;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;
import java.util.List;

public class FlowLayout extends ViewGroup {

    public FlowLayout(Context context) {
        this(context, null);
    }

    public FlowLayout(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public FlowLayout(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {

    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {

    }
}

```

创建FlowLayout完毕后发现必须要重写onLayout函数，否则会报错，除了重写onLayout以外，我们还需要重写onMeasure，为什么要重写onMeasure呢？

首先先明确我们是实现的是一个流式布局，是一个布局而不是一个View的绘制，举一个例子，当我们拿到一个空房子的时候，我们需要给房子装修，要划分卧室、客厅、厨房、卫生间等等小空间，首先要测量房子大小，再测量要划分的客厅卧室等房间的大小，然后我们需要将这些规定好的客厅、卧室进行布局，规定好每个空间的位置，这就和我们的流式布局过程一致，等到我们的房子客厅卧室等布局完毕，才会开始对每个房间的具体家具进行测量和装修。所以我们才需要重写onMeasure和onLayout函数。

总结：

自定义View:主要实现onMeasure+onDraw

自定义ViewGroup: 主要实现onMeasure+onLayout

### 1、View的层级关系

![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725000080320-561d9ca9-7942-4193-9420-631d6a965557.jpeg)

### 2、实现流式布局
当我们明白自定义ViewGroup要实现什么之后，可以开始我们的流式布局定义了，但是，测量时先测量自己还是子View呢？

答：都可以

先自己:ViewPaper

绝大多数:先测量孩子，再测量自己，例如有两个子view，测量过程如下


![](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1724998726993-94d8e44b-ed7d-4730-8b8f-918455566bed.jpeg)

所以我们的测量先测量child,再测量自己。

```java
@Override
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {

	//先测量孩子
	int childCount = this.getChildCount();
	for (int i = 0; i < childCount; i++) {
		View child = this.getChildAt(i);
		child.measure(childWidthMeasureSpec,childHeightMeasureSpec);
	}

	// 后测量自己，保存尺寸给后面用
	setMeasuredDimension(width, height);
}
```

测量孩子

先获取孩子的数量，再从我们的View里获取childView，再去测量孩子。

测量自己

调用setMeasuredDimension去测量，但是现在width和height怎么获取，这里就是根据孩子的尺寸计算和保存自己的尺寸这一步需要做的。

#### (1) MeasureSpec
measure是View中的内部类，基本都是二进制运算，由于int是32位的，用高2位表示mode，低30位表示size，MODE_SHIFT = 30的作用是移位。

代码中我们用到了chile.measure，但是参数是childWidthMeasureSpec,childHeightMeasureSpec，这个值要怎么去计算那？

首先先回顾下MeasureSpec的知识点，如下图

![画板](https://cdn.nlark.com/yuque/0/2024/jpeg/29215582/1725007697151-220c432a-5472-47ba-83fd-c3cbfadda064.jpeg)

再看下普通View的MeasureSpec的创建规则

|                 parentSpecMode<br/>childLayoutParams | EXACTLY(精准) | AT_MOST(最大能提供) | UNSPECIFIED(没限制) |
| :---: | :---: | :---: | :---: |
| dp/dx | EXACTLY<br/>childSize | EXACTLY<br/>childSize | EXACTLY<br/>childSize |
| match_parent | EXACTLY<br/>parentSize | AT_MOST<br/>parentSize | UNSPECIFIED<br/>0 |
| wrap_content | AT_MOST<br/>parentSize | AT_MOST<br/>parentSize | UNSPECIFIED<br/>0 |


测量模式有三种：`MeasureSpec.EXACTLY`、`MeasureSpec.AT_MOST`和`MeasureSpec.UNSPECIFIED`。

1. MeasureSpec.EXACTLY：精确模式。父`View`明确指定了子`View`的尺寸，子`View`必须严格按照父`View`的要求进行测量。例如，当子`View`在布局文件中设置其宽或高为固定值（如`layout_width="100dp"`）或`match_parent`时，父容器会将其设置为`EXACTLY`。
2. MeasureSpec.AT_MOST：最大模式。父`View`对子`View`的尺寸没有严格限制，但提出了一个最大尺寸。子`View`可以根据自己的需要进行测量，但不能超过父`View`指定的最大尺寸。通常当子`View`设置其宽或高为`wrap_content`时，父容器会将其设置为`AT_MOST`。
3. MeasureSpec.UNSPECIFIED：未指定模式。父`View`对子`View`的尺寸没有任何要求。子`View`可以根据自己的需要进行测量。这种模式比较少见，一般出现在`AdapterView`的item的`heightMode`中、`ScrollView`的子`View`的`heightMode`中。

在`View`的`onMeasure`回调方法中，传入的`MeasureSpec`是由父容器计算并传递过来的。父容器会根据自己的`MeasureSpec`和子`View`在布局文件中的`layout_width`、`layout_height`属性来决定子`View`的`MeasureSpec`。例如，当布局中宽或高填写的固定值，那么对应的`mode`为`EXACTLY`，`size`为填写的值；当布局中的宽或高填写的`wrap_content`，那么对应的`mode`为`AT_MOST`，`size`为父容器的`size`；当布局中的宽或高填写的`match_parent`，那么`mode`和`size`都与父容器相同。

`MeasureSpec`的获取可以通过`View`的`getMeasureSpec()`方法获取，该方法接收两个参数：父`View`的`MeasureSpec`和子`View`的`MeasureSpec`。`getMeasureSpec()`方法会根据这两个参数计算出子`View`的`MeasureSpec`。

在实际使用中，`MeasureSpec`主要用于测量子`View`和通知父`View`。父`View`在测量子`View`时，会将自己的`MeasureSpec`传递给子`View`，子`View`会根据父`View`的`MeasureSpec`来计算自己的尺寸。子`View`在测量完成后，会将自己的`MeasureSpec`通知给父`View`，父`View`会根据子`View`的`MeasureSpec`来计算自己的尺寸

#### (2) 测量过程
具体看下整个执行过程和代码示例：

先看定义的布局文件的xml

```java
<com.leo.flowlayout.FlowLayout xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:app="http://schemas.android.com/apk/res-auto"
        xmlns:tools="http://schemas.android.com/tools"
        android:id="@+id/mFlowLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_margin="10dp"
        android:padding="30dp">

        <Button
            android:layout_width="wrap_content"
            android:layout_height="55dp"
            android:layout_margin="30dp"
            android:padding="30dp"
            android:text="Hello hi ..." />
</com.leo.flowlayout.FlowLayout>
```

例如这个xml，父容器就是FlowLayout，子Vew是Button，我们进行测量的时候要先测量button再根据孩子的大小测量FlowLayout，现在我们知道了FlowLayout的WidthMeasureSpec和HeightMeasureSpec，需要计算button的WidthMeasureSpec和HeightMeasureSpec，如下所示：

```java
protected void measureChild(View child, int parentWidthMeasureSpec,
							int parentHeightMeasureSpec) {
	final LayoutParams lp = child.getLayoutParams();

	final int childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec,
														  mPaddingLeft + mPaddingRight, lp.width);
	final int childHeightMeasureSpec = getChildMeasureSpec(parentHeightMeasureSpec,
														   mPaddingTop + mPaddingBottom, lp.height);

	child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
}
```

getChildMeasureSpec传入的三个参数，第一个是父亲的measureSpec，第二个参数是父亲的padding和childView的margin之和，第三个参数，是childView的尺寸大小，就是布局文件xml种button的`android:layout_width`或`android:layout_height`，有3种可能：
a. 精确值
b. `LayoutParams.MATCH_PARENT`
c. `LayoutParams.WRAP_CONTENT`

当调用getChildMeasureSpec之后

会根据传入进来的父容器的MeasureSpec和父容器和子view的间距计算父容器的测量模式和测量的具体大小，给子View计算自己的MeasureSpec。

```java
    public static int getChildMeasureSpec(int spec, int padding, int childDimension) {
        int specMode = MeasureSpec.getMode(spec);
        int specSize = MeasureSpec.getSize(spec);

        int size = Math.max(0, specSize - padding);

        int resultSize = 0;
        int resultMode = 0;

        switch (specMode) {
        // Parent has imposed an exact size on us
        case MeasureSpec.EXACTLY:
            if (childDimension >= 0) {
                resultSize = childDimension;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.MATCH_PARENT) {
                // Child wants to be our size. So be it.
                resultSize = size;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                // Child wants to determine its own size. It can't be
                // bigger than us.
                resultSize = size;
                resultMode = MeasureSpec.AT_MOST;
            }
            break;

        // Parent has imposed a maximum size on us
        case MeasureSpec.AT_MOST:
            if (childDimension >= 0) {
                // Child wants a specific size... so be it
                resultSize = childDimension;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.MATCH_PARENT) {
                // Child wants to be our size, but our size is not fixed.
                // Constrain child to not be bigger than us.
                resultSize = size;
                resultMode = MeasureSpec.AT_MOST;
            } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                // Child wants to determine its own size. It can't be
                // bigger than us.
                resultSize = size;
                resultMode = MeasureSpec.AT_MOST;
            }
            break;

        // Parent asked to see how big we want to be
        case MeasureSpec.UNSPECIFIED:
            if (childDimension >= 0) {
                // Child wants a specific size... let him have it
                resultSize = childDimension;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.MATCH_PARENT) {
                // Child wants to be our size... find out how big it should
                // be
                resultSize = View.sUseZeroUnspecifiedMeasureSpec ? 0 : size;
                resultMode = MeasureSpec.UNSPECIFIED;
            } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                // Child wants to determine its own size.... find out how
                // big it should be
                resultSize = View.sUseZeroUnspecifiedMeasureSpec ? 0 : size;
                resultMode = MeasureSpec.UNSPECIFIED;
            }
            break;
        }
        //noinspection ResourceType
        return MeasureSpec.makeMeasureSpec(resultSize, resultMode);
    }
```

介绍完如何计算子view的measureSpec之后，就要开始流式布局的整体测量，我们的layout内有很多子view，每个view的大小都不同，顺序排列的时候会出现当前的view在layout这一行中所用的空间不足，需要换行，所以需要计算每个view的大小和父容器的大小以及剩余空间的大小，

```java
@Override
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
	// 获取限制的值
	int widthMode = MeasureSpec.getMode(widthMeasureSpec);
	int widthSize = MeasureSpec.getSize(widthMeasureSpec);
	int heightMode = MeasureSpec.getMode(heightMeasureSpec);// MeasureSpec.UNSPECIFIED
	int heightSize = MeasureSpec.getSize(heightMeasureSpec);

	Log.e(TAG, "onMeasure: heightMode  " + (heightMode >> 30));

	//        heightMeasureSpec = MeasureSpec.makeMeasureSpec(heightSize,MeasureSpec.EXACTLY);

	// 记录当前行的宽度和高度
	int lineWidth = 0;// 宽度是当前行子view的宽度之和
	int lineHeight = 0;// 高度是当前行所有子View中高度的最大值

	//整个流式布局的宽度和高度
	int flowLayoutWidth = 0;//所有行中宽度的最大值
	int flowLayoutHeight = 0;// 所以行的高度的累加

	init();

	// 获取FlowLayout的padding
	int paddingLeftRight = getPaddingLeft() + getPaddingRight();
	int paddingTopBottom = getPaddingTop() + getPaddingBottom();

	int childCount = this.getChildCount();

	// 先测量子View，再根据子View尺寸，计算自己的
	for (int i = 0; i < childCount; i++) {
		View child = this.getChildAt(i);
		measureChild(child, widthMeasureSpec, heightMeasureSpec);
		measureChildWithMargins(child, widthMeasureSpec, 0, heightMeasureSpec, 0);
		MarginLayoutParams lp = (MarginLayoutParams) child.getLayoutParams();
		int childMarginLeftRight = lp.leftMargin + lp.rightMargin;
		int childMarginTopBottom = lp.topMargin + lp.bottomMargin;

		//获取到当前子View的测量的宽度/高度
		int childWidth = child.getMeasuredWidth();
		int childHeight = child.getMeasuredHeight();

		// 已经放入的孩子的宽度 + 准备放入的孩子的宽度 大于 总宽度 就换行
		if (lineWidth + childWidth + childMarginLeftRight + paddingLeftRight > widthSize) {
			mViews.add(mLineViews);
			mLineViews = new ArrayList<>();//创建新的一行
			// 所有行中 最宽的一行 作为 流式布局的宽
			flowLayoutWidth = Math.max(flowLayoutWidth, lineWidth);
			// 流式布局的高度为所有行的高度相加
			flowLayoutHeight += lineHeight;
			mHeights.add(lineHeight);
			lineWidth = 0;
			lineHeight = 0;
		}

		mLineViews.add(child);
		lineWidth += childWidth + childMarginLeftRight;

		// 获取行中最高的子View
		lineHeight = Math.max(lineHeight, childHeight + childMarginTopBottom);

		// 处理最后一行的显示
		if (i == childCount - 1) {
			flowLayoutHeight += lineHeight;
			flowLayoutWidth = Math.max(flowLayoutWidth, lineWidth);
			mHeights.add(lineHeight);
			mViews.add(mLineViews);
		}
	}

	flowLayoutWidth += paddingLeftRight;
	flowLayoutHeight += paddingTopBottom;

	// 保存尺寸给后面用
	setMeasuredDimension(widthMode == MeasureSpec.EXACTLY ? widthSize : flowLayoutWidth
						 , heightMode == MeasureSpec.EXACTLY ? heightSize : flowLayoutHeight);
}
```

首先，记录当前行的宽度和高度

int lineWidth = 0;// 宽度是当前行子view的宽度之和

int lineHeight = 0;// 高度是当前行所有子View中高度的最大值

还要记录整个流式布局的宽度和高度

int flowLayoutWidth = 0;//所有行中宽度的最大值

int flowLayoutHeight = 0;// 所以行的高度的累加

paddingLeftRight表示父容器和子view之间的padding大小，

所以每次测量一个子view的长宽后都要判断，

当前子view的宽+父容器和子view之间的padding+子view的宽+子view和父容器的margin是不是大于当前行的最大宽度，而flowLayoutWidth表示所有的行中最宽的那一行，当所有子view测量完毕，如果layout不是MeasureSpec.EXACTLY模式，那么使用最大行宽度做为流式布局的宽度。高度同理计算。

#### (3) 布局
```java
@Override
protected void onLayout(boolean changed, int l, int t, int r, int b) {
	int currX = getPaddingLeft();
	int currY = getPaddingTop();
	int lineCount = mViews.size();
	// 处理每一行
	for (int i = 0; i < lineCount; i++) {
		//获取每一行的子view
		List<View> lineViews = mViews.get(i);
		//获取每一行的宽高
		int lineHeight = mHeights.get(i);
		//获取每一行的子view数目
		int size = lineViews.size();
		// 处理每一行中的View
		for (int j = 0; j < size; j++) {
			//遍历每一行的子view布局其位置
			View child = lineViews.get(j);
			//获取当前子view的LayoutParams
			MarginLayoutParams lp = (MarginLayoutParams) child.getLayoutParams();
			// 子View的左上右下
			int left = currX + lp.leftMargin;
			int top = currY + lp.topMargin;
			int right = left + child.getMeasuredWidth();
			int bottom = top + child.getMeasuredHeight();
			// 布局子View
			child.layout(left, top, right, bottom);
			currX += right + lp.rightMargin;
		}
		currY += lineHeight;
		currX = getPaddingLeft();
	}
}
```

首先，先计算getPaddingLeft()和getPaddingTop();得到父容器和子view的padding值，即拿到我们子view可以使用的而空间，如下，绿色内部才是所有子view使用的区域，这是第一个子view的上下边距，其他子view要在第一个的基础上去增加，如代码中29，30行：

currY += lineHeight;

currX = getPaddingLeft();


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725237914168-4be0fe5e-f3b7-4467-a599-baa756668560.png)

然后，根据onMeasure时保存的每一行的行高、宽高、子view宽高数据，设置子view的位置。

每个子view的布局计算如下，注意要更新当前的currx值和curry值。然后调用child.layout布局子view。

```java
for (int j = 0; j < size; j++) {
	View child = lineViews.get(j);
	MarginLayoutParams lp = (MarginLayoutParams) child.getLayoutParams();
	// 子View的左上右下
	int left = currX + lp.leftMargin;
	int top = currY + lp.topMargin;
	int right = left + child.getMeasuredWidth();
	int bottom = top + child.getMeasuredHeight();
	// 布局子View
	child.layout(left, top, right, bottom);
	currX += right + lp.rightMargin;
}
```

按照我们上述的思路，最后完善代码即可

```java
package com.leo.flowlayout;

import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;
import java.util.List;

public class FlowLayout extends ViewGroup {

	private static final String TAG = "Leo";
	private List<View> mLineViews;//每一行的子View
	private List<List<View>> mViews;//所有的行 一行一行的存储
	private List<Integer> mHeights;//每一行的高度

	public FlowLayout(Context context) {
		this(context, null);
	}

	public FlowLayout(Context context, AttributeSet attrs) {
		this(context, attrs, 0);
	}

	public FlowLayout(Context context, AttributeSet attrs, int defStyleAttr) {
		super(context, attrs, defStyleAttr);
		init();
	}

	private void init() {
		//会出现内存抖动，一直new和release，频繁的内存抖动会让内存千疮百孔，使得没有足够的连续内存导致OOM
		//最好使用clear清除而不是new
		mLineViews = new ArrayList<>();
		mViews = new ArrayList<>();
		mHeights = new ArrayList<>();
	}

	@Override
	public LayoutParams generateLayoutParams(AttributeSet attrs) {
		return new MarginLayoutParams(getContext(), attrs);
	}

	// 这个不行
	//    @Override
	//    protected LayoutParams generateLayoutParams(LayoutParams p) {
	//        return new MarginLayoutParams(p);
	//    }

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
		// 获取限制的值
		int widthMode = MeasureSpec.getMode(widthMeasureSpec);
		int widthSize = MeasureSpec.getSize(widthMeasureSpec);
		int heightMode = MeasureSpec.getMode(heightMeasureSpec);// MeasureSpec.UNSPECIFIED
		int heightSize = MeasureSpec.getSize(heightMeasureSpec);

		Log.e(TAG, "onMeasure: heightMode  " + (heightMode >> 30));

		//        heightMeasureSpec = MeasureSpec.makeMeasureSpec(heightSize,MeasureSpec.EXACTLY);

		// 记录当前行的宽度和高度
		int lineWidth = 0;// 宽度是当前行子view的宽度之和
		int lineHeight = 0;// 高度是当前行所有子View中高度的最大值

		//整个流式布局的宽度和高度
		int flowLayoutWidth = 0;//所有行中宽度的最大值
		int flowLayoutHeight = 0;// 所以行的高度的累加

		init();

		// 获取FlowLayout的padding
		int paddingLeftRight = getPaddingLeft() + getPaddingRight();
		int paddingTopBottom = getPaddingTop() + getPaddingBottom();

		int childCount = this.getChildCount();

		// 先测量子View，再根据子View尺寸，计算自己的
		for (int i = 0; i < childCount; i++) {
			View child = this.getChildAt(i);
			measureChild(child, widthMeasureSpec, heightMeasureSpec);
			measureChildWithMargins(child, widthMeasureSpec, 0, heightMeasureSpec, 0);
			MarginLayoutParams lp = (MarginLayoutParams) child.getLayoutParams();
			int childMarginLeftRight = lp.leftMargin + lp.rightMargin;
			int childMarginTopBottom = lp.topMargin + lp.bottomMargin;

			//获取到当前子View的测量的宽度/高度
			int childWidth = child.getMeasuredWidth();
			int childHeight = child.getMeasuredHeight();

			// 已经放入的孩子的宽度 + 准备放入的孩子的宽度 大于 总宽度 就换行
			if (lineWidth + childWidth + childMarginLeftRight + paddingLeftRight > widthSize) {
				mViews.add(mLineViews);
				mLineViews = new ArrayList<>();//创建新的一行
				// 所有行中 最宽的一行 作为 流式布局的宽
				flowLayoutWidth = Math.max(flowLayoutWidth, lineWidth);
				// 流式布局的高度为所有行的高度相加
				flowLayoutHeight += lineHeight;
				mHeights.add(lineHeight);
				lineWidth = 0;
				lineHeight = 0;
			}

			mLineViews.add(child);
			lineWidth += childWidth + childMarginLeftRight;

			// 获取行中最高的子View
			lineHeight = Math.max(lineHeight, childHeight + childMarginTopBottom);

			// 处理最后一行的显示
			if (i == childCount - 1) {
				flowLayoutHeight += lineHeight;
				flowLayoutWidth = Math.max(flowLayoutWidth, lineWidth);
				mHeights.add(lineHeight);
				mViews.add(mLineViews);
			}
		}

		flowLayoutWidth += paddingLeftRight;
		flowLayoutHeight += paddingTopBottom;

		// 保存尺寸给后面用
		setMeasuredDimension(widthMode == MeasureSpec.EXACTLY ? widthSize : flowLayoutWidth
							 , heightMode == MeasureSpec.EXACTLY ? heightSize : flowLayoutHeight);
	}

	@Override
	protected void onLayout(boolean changed, int l, int t, int r, int b) {
		int currX = getPaddingLeft();
		int currY = getPaddingTop();
		int lineCount = mViews.size();
		// 处理每一行
		for (int i = 0; i < lineCount; i++) {
			List<View> lineViews = mViews.get(i);
			int lineHeight = mHeights.get(i);
			int size = lineViews.size();
			// 处理每一行中的View
			for (int j = 0; j < size; j++) {
				View child = lineViews.get(j);
				MarginLayoutParams lp = (MarginLayoutParams) child.getLayoutParams();
				// 子View的左上右下
				int left = currX + lp.leftMargin;
				int top = currY + lp.topMargin;
				int right = left + child.getMeasuredWidth();
				int bottom = top + child.getMeasuredHeight();
				// 布局子View
				child.layout(left, top, right, bottom);
				currX += right + lp.rightMargin;
			}
			currY += lineHeight;
			currX = getPaddingLeft();
		}
	}
}

```

在代码中，我们在onMeasure调用了init去初始化列表，但是View至少会进行2次onMeasure,onLayout，所以我们在init里使用new的方式其实不是很好，最好是初始化后使用clear，一直new和释放会出现内存抖动，频繁的内存抖动会让内存千疮百孔，使得没有足够的连续内存可能就导致OOM问题了，OOM不是说没有足够的空间，而是当前没有足够的连续空间给他使用，我们的内存碎片太多就会导致这个问题，为什么这里不推荐new的方式那，因为我们的View会执行至少两次onMeasure和onLayout。

#### (4) 为什么多次执行onMeasure?
该小节为其他知识点。

我们知道View的绘制流程都始于ViewRootImpl的performTraversals方法，有理由怀疑performTranversals执行了2次。

```java
private void performTraversals() {

	......
	// Ask host how big it wants to be
	windowSizeMayChange |= measureHierarchy(host, lp, res,
										desiredWindowWidth, desiredWindowHeight);
	......
	// Ask host how big it wants to be
    performMeasure(childWidthMeasureSpec, childHeightMeasureSpec);
	......
	if (!cancelDraw) {
        if (mPendingTransitions != null && mPendingTransitions.size() > 0) {
            for (int i = 0; i < mPendingTransitions.size(); ++i) {
                mPendingTransitions.get(i).startChangingAnimations();
            }
            mPendingTransitions.clear();
        }

	    performDraw();
    } else {
        if (isViewVisible) {
            // Try again
            scheduleTraversals();
        } else if (mPendingTransitions != null && mPendingTransitions.size() > 0) {
            for (int i = 0; i < mPendingTransitions.size(); ++i) {
                mPendingTransitions.get(i).endChangingAnimations();
            }
            mPendingTransitions.clear();
        }
    }
	......
}
```

通过performDraw可以知道performTranversals要执行两次，由于第一次执行newSurface必定为true，需要先创建Surface嘛，cancelDraw为true则会执行else语句，所以第一次执行并不会执行 performDraw方法，即View的onDraw方法不会得到调用，第二次执行则为false，并未创建新的Surface，第二次才会执行 performDraw方法。

确定了performTravelsals会执行2次，那么肯定会执行2次measure方法，但是执行2次measure方法就一定会执行2次onMeasure方法吗？

并不是，measure方法做了2级测量优化：
1.如果flag不为forceLayout或者与上次测量规格（MeasureSpec）相比未改变，那么将不会进行重新测量（执行onMeasure方法），直接使用上次的测量值；
2.如果满足非强制测量的条件，即前后二次测量规格不一致，会先根据目前测量规格生成的key索引缓存数据，索引到就无需进行重新测量;如果targetSDK小于API 20则二级测量优化无效，依旧会重新测量，不会采用缓存测量值。

照理第二次测量应该会取测量的缓存值，并不会重新测量（调用onMeasure）的。然而实际上确重新测量了，那么极有可能就是第二次performMeasure传入的测量规格与第一次不同，因为在layout执行中已经将flag force_layout置为false了，代码如下：

```java
public void layout(int l, int t, int r, int b) {
	.........
	//mPrivateFlags第16位设置为0,0表示不强制layout
	//PFLAG_FORCE_LAYOUT = 0x00001000
	mPrivateFlags &= ~PFLAG_FORCE_LAYOUT;
	mPrivateFlags3 |= PFLAG3_IS_LAID_OUT;
}
```

按照刚才的分析，前后二次的传入的测量规格应该不一致，然而事实是2次传入onMeasure()的测量规格一致。

那么问题又来了，为什么会测量三次呢？

首先声明的是，并不是因为FrameLayout的多次测量，此处的自定义View并不满足FrameLayout测量2次child的条件。
第一次performTranversals会执行2次performMeasure：
先执行measureHierarchy方法中的performMeasure方法,接着执行后面的performMeasure，第二次performTranversals则是只执行measureHierarchy中的performMeasure方法。

这就能解释为什么前2次测量都执行了onMeasure方法，而未采用测量优化策略，因为前2次performMeasure并未经过performLayout，也即forceLayout的标志位一直为true，自然不会取缓存优化。理论上第三次测量经过第一次performTranversals中的performLayout，强制layout的flag应该为false，即第二次performTranversals并不会导致View的onMeasure方法的调用，由于未调用onMeasure方法，也不会调用onLayout方法，即只会执行2次onMeasure、一次onLayout、一次onDraw。

总之，造成这个现象的根本原因是performTranversal函数在View的测量流程中会执行2次。

参考文章[View为什么会至少进行2次onMeasure、onLayout](https://www.jianshu.com/p/733c7e9fb284)

#### (5) ViewPager wrap_content无效原理分析及解决
现象：ViewPager 在设置高度为 android:layout_height=“wrap_content” 时并没有使用子view的高度，反而像是适应父view的高度，代码如下：

```java
<androidx.viewpager.widget.ViewPager
    android:id="@+id/vp_wrapContentVp_1"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="@color/skx_ffdee9" />
<!--注：为了方便识别ViewPager的范围，添加了一个浅色的背景-->

```

adapter 布局：

```java
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="100dp">

    <ImageView
        android:id="@+id/iv_wrapContentVp_image"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="center"
        tools:ignore="ContentDescription" />

</FrameLayout>

```

效果：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725265950527-a8eb3837-5a3e-4d6e-948a-998f301b3875.png)

查看onMeasure源码：

```java
@Override
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    // For simple implementation, our internal size is always 0.
    // We depend on the container to specify the layout size of
    // our view.  We can't really know what it is since we will be
    // adding and removing different arbitrary views and do not
    // want the layout to change as this happens.
    // 设置测量大小为默认的大小
    setMeasuredDimension(getDefaultSize(0, widthMeasureSpec),
            getDefaultSize(0, heightMeasureSpec));

    final int measuredWidth = getMeasuredWidth();
    final int maxGutterSize = measuredWidth / 10;
    mGutterSize = Math.min(maxGutterSize, mDefaultGutterSize);

    // 设置child的宽高，大小为ViewPager的测量大小减去其内边距
    int childWidthSize = measuredWidth - getPaddingLeft() - getPaddingRight();
    int childHeightSize = getMeasuredHeight() - getPaddingTop() - getPaddingBottom();

    // ---忽略Decor views 的测量---

    // 设置child view的 MeasureSpec
    mChildWidthMeasureSpec = MeasureSpec.makeMeasureSpec(childWidthSize, MeasureSpec.EXACTLY);
    mChildHeightMeasureSpec = MeasureSpec.makeMeasureSpec(childHeightSize, MeasureSpec.EXACTLY);

    // ---忽略其他代码

    // Page views next.
    size = getChildCount();
    for (int i = 0; i < size; ++i) {
        final View child = getChildAt(i);
        if (child.getVisibility() != GONE) {
            // ---忽略其他代码

            final LayoutParams lp = (LayoutParams) child.getLayoutParams();
            if (lp == null || !lp.isDecor) {
                final int widthSpec = MeasureSpec.makeMeasureSpec(
                        (int) (childWidthSize * lp.widthFactor), MeasureSpec.EXACTLY);
                // 测量child 的大小
                child.measure(widthSpec, mChildHeightMeasureSpec);
            }
        }
    }
}

```

ViewPager 在onMeasure(int widthMeasureSpec, int heightMeasureSpec) 方法一开始就对宽高进行了默认设置，在此之前并没有进行child view 的测量，故而当高度设置为"wrap_content"时不会去匹配child view 的高度。

在测量完自己之后，取得测量的宽高减去内边距后，设置为 child view 的宽高，而后再生成MeasureSpec，并以此来对child view进行测量。这也就解释了为什么明明设置了child view 的宽高，但是并不生效，反而去匹配父布局的大小。

解决方法：自定义View 继承ViewPager，重新onMeasure 方法

```java
package com.leo.flowlayout;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.viewpager.widget.ViewPager;

/
 * @author snail
 * @since 2024-9-2
 */
public class MyViewPager extends ViewPager {
    public MyViewPager(@NonNull Context context) {
        super(context);
    }

    public MyViewPager(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int height = 0;
        for (int i = 0; i < getChildCount(); i++) {
            View child = getChildAt(i);
            child.measure(widthMeasureSpec, MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED));
            int h = child.getMeasuredHeight();
            if (h > height) height = h;
        }

        heightMeasureSpec = MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY);
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }
}

```

此上来自网络上大多的解决方案，那么到底对不对呢？效果如下：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725266071228-058f9e12-601f-4f38-b214-fc9d7ffda0a7.png)

可以看出，虽然调整了高度，但是仍没有达到我们预期的目标，我们在 adapter 的布局中指定了高度是100dp，所以说 上面的答案是错误的！！！
那么问题出在哪里呢？我们看下上面代码的

```java
child.measure(widthMeasureSpec, MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED));
```

这一行，高度的MeasureSpec 指定大小是0，mode为 MeasureSpec.UNSPECIFIED。我们知道一个view 的大小受自身的LayoutParams 和父view 的MeasureSpec 的双重限制，查看下ViewGroup 中对child 的测量

```java
/
 * Ask one of the children of this view to measure itself, taking into
 * account both the MeasureSpec requirements for this view and its padding.
 * The heavy lifting is done in getChildMeasureSpec.
 *
 * @param child The child to measure
 * @param parentWidthMeasureSpec The width requirements for this view
 * @param parentHeightMeasureSpec The height requirements for this view
 */
protected void measureChild(View child, int parentWidthMeasureSpec,
        int parentHeightMeasureSpec) {
    // child 自身的LayoutParams
    final LayoutParams lp = child.getLayoutParams();
    // 获取child view 正确的MeasureSpec
    final int childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec,
            mPaddingLeft + mPaddingRight, lp.width);
    final int childHeightMeasureSpec = getChildMeasureSpec(parentHeightMeasureSpec,
            mPaddingTop + mPaddingBottom, lp.height);

    child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
}

```

而上面的代码中缺少了child 的LayoutParams配置，修改如下：

```java
// child 的大小受自身的LayoutParams 和父view 的MeasureSpec 的双重限制！测量高度需要同时考虑这两个因素。
ViewGroup.LayoutParams lp = child.getLayoutParams();
child.measure(widthMeasureSpec, MeasureSpec.makeMeasureSpec(lp.height, heightMeasureSpec));

//或者
ViewGroup.LayoutParams params = child.getLayoutParams();
child.measure(widthMeasureSpec, getChildMeasureSpec(heightMeasureSpec,0,params.height));

```

再次看下效果：


![](https://cdn.nlark.com/yuque/0/2024/png/29215582/1725266162499-98dd3b02-6ca5-4142-b853-804f7c95b416.png)

LayoutInflater#inflate 指定root view

如果显示不对的话，检查 PagerAdapter#instantiateItem 中关于item 的初始化，要使用指定root 的重载方法，即 android.view.LayoutInflater#inflate(int, android.view.ViewGroup, boolean)。正如上面所说，child view 的大小受自身的LayoutParams 和 parent view 的MeasureSpec 双重制约。

```java
@NotNull
@Override
public Object instantiateItem(@NotNull ViewGroup container, int position) {
	View view = LayoutInflater.from(container.getContext()).inflate(R.layout.adapter_view_pager_wrap_content, container, false);
	// 注意：不要使用未指定root 的重载方法
	// View view = LayoutInflater.from(container.getContext()).inflate(R.layout.adapter_view_pager_wrap_content, null);
	ImageView imageView = view.findViewById(R.id.iv_wrapContentVp_image);
	imageView.setImageResource(mDataList.get(position));
	container.addView(view);
	return view;
}

```

recycleView和listview都有上述问题！

